import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Piano, Settings, Mic } from "lucide-react";
import MetronomeIcon from "../../../assets/icons/metronome.svg";
import { useAudioEngine } from "../../../hooks/useAudioEngine";
import { useMicNoteInput } from "../../../hooks/useMicNoteInput";
import { MIC_INPUT_PRESETS } from "../../../hooks/micInputPresets";
import { PreGameSetup } from "./components/PreGameSetup";
import { VexFlowStaffDisplay } from "./components/VexFlowStaffDisplay";
import { KlavierKeyboard } from "./components/KlavierKeyboard";
import { FeedbackSummary } from "./components/FeedbackSummary";
import { SightReadingLayout } from "./components/SightReadingLayout";
import { MetronomeDisplay } from "../rhythm-games/components/MetronomeDisplay";
import { usePatternGeneration } from "./hooks/usePatternGeneration";
import { useRhythmPlayback } from "./hooks/useRhythmPlayback";
import { useTimingAnalysis } from "./hooks/useTimingAnalysis";
import BeethovenAvatar from "../../../assets/avatars/beethoven.png";
import {
  DEFAULT_SETTINGS,
  TREBLE_NOTES,
  BASS_NOTES,
} from "./constants/gameSettings";
import { NOTE_FREQUENCIES } from "./constants/staffPositions";
import {
  calculatePitchAccuracy,
  calculateRhythmAccuracy,
  calculateOverallScore,
} from "./utils/scoreCalculator";
import { FIRST_NOTE_EARLY_MS, NOTE_LATE_MS } from "./constants/timingConstants";
import { useUser } from "../../../features/authentication/useUser";
import { updateStudentScore } from "../../../services/apiScores";
import toast from "react-hot-toast";
import BackButton from "../../ui/BackButton";
import {
  SIGHT_READING_SESSION_CONSTANTS,
  useSightReadingSession,
} from "../../../contexts/SightReadingSessionContext";
import VictoryScreen from "../VictoryScreen";

// #region agent log (debug-mode instrumentation)
// Network logging is disabled by default. Enable by setting
// VITE_DEBUG_SR_LOGS=\"true\" in your Vite env and running the local
// collector on 127.0.0.1:7242.
const __SR_LOG_ENDPOINT =
  "http://127.0.0.1:7242/ingest/636d1c48-b2ea-491c-896a-7ce448793071";
const __SR_LOG_ENABLED =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_DEBUG_SR_LOGS === "true";
const __srLog = (payload) => {
  if (!__SR_LOG_ENABLED) return;
  fetch(__SR_LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
};
// #endregion

const GAME_PHASES = {
  SETUP: "setup",
  COUNT_IN: "count-in",
  DISPLAY: "display",
  PERFORMANCE: "performance",
  FEEDBACK: "feedback",
};

const TIMING_STATE = {
  OFF: "off",
  EARLY_WINDOW: "early_window",
  LIVE: "live",
};

// Empirically observed mic pipeline latency (pitch detection + stability + hardware).
// Applied only in mic mode to align timing evaluation with the user's perceived beat.
const MIC_LATENCY_COMP_MS = 300;
// Extra grace for the *first playable note* in mic mode:
// first note onset is the hardest to nail (human reaction + mic envelope),
// so we reduce the perceived "late" penalty slightly.
const MIC_FIRST_NOTE_LATE_GRACE_MS = 400;

const ANTI_CHEAT_WINDOW_MS = 1000;
const ANTI_CHEAT_THRESHOLD = 3;

const PC_KEYBOARD_KEYS = [
  "a",
  "s",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  ";",
  "'",
];

const METRONOME_TIMING_DEBUG = import.meta.env?.VITE_DEBUG_METRONOME === "true";
const FIRST_NOTE_DEBUG = import.meta.env?.VITE_DEBUG_FIRST_NOTE === "true";
const PERFORMANCE_START_BUFFER_MS = 0;
const COUNT_IN_AUDIO_GUARD_EARLY_MS = 30;
const isIOSSafari =
  typeof navigator !== "undefined" &&
  (() => {
    const ua = navigator.userAgent || "";
    const isIOSDevice =
      /iPad|iPhone|iPod/i.test(ua) ||
      // iPadOS sometimes reports as Macintosh
      (ua.includes("Macintosh") &&
        typeof document !== "undefined" &&
        "ontouchend" in document);
    const isSafari =
      /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/i.test(ua);
    return isIOSDevice && isSafari;
  })();
// Ensure there's an audible downbeat exactly when the performance phase begins (end of count-in).
// Without this, the last count-in click is beat 4 and the start downbeat can be "silent",
// which makes users play to a later click and get graded as late.
const PLAY_PERFORMANCE_DOWNBEAT_CLICK = true;
// If the user plays to the audible metronome click, WebAudio output latency can make
// their "on-click" performance look late relative to AudioContext currentTime.
// We'll measure outputLatency in debug logs before applying any compensation.
const AUDIO_OUTPUT_LATENCY_COMP_DEBUG = true;
const logMetronomeTiming = (label, payload = {}) => {
  if (!METRONOME_TIMING_DEBUG) return;
  const timestamp =
    typeof performance !== "undefined"
      ? Number(performance.now().toFixed(2))
      : null;
  console.debug("[MetronomeTiming]", {
    timestamp,
    ...payload,
  });
};
const logFirstNoteDebug = (label, payload = {}) => {
  if (!FIRST_NOTE_DEBUG) return;
};

const { DEFAULT_MAX_SCORE_PER_EXERCISE: SESSION_MAX_EXERCISE_SCORE } =
  SIGHT_READING_SESSION_CONSTANTS;

export function SightReadingGame() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const audioEngine = useAudioEngine(80);
  const { generatePattern } = usePatternGeneration();
  const { user, isStudent } = useUser();
  const studentId = user?.id;
  const stopListeningRef = useRef(() => {});
  const handleNoteDetectedRef = useRef(() => {});
  const {
    totalExercises: sessionTotalExercises,
    currentExerciseNumber,
    progressFraction,
    isSessionComplete,
    isVictory,
    percentage: sessionPercentage,
    totalScore: sessionTotalScore,
    maxPossibleScore: sessionMaxScore,
    status: sessionStatus,
    startSession,
    resetSession,
    recordExerciseResult: recordSessionExercise,
    goToNextExercise,
  } = useSightReadingSession();

  const [gamePhase, setGamePhase] = useState(GAME_PHASES.SETUP);
  const [gameSettings, setGameSettings] = useState(DEFAULT_SETTINGS);
  const [currentPattern, setCurrentPattern] = useState(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);

  // Unified timing state: replaces scoringActive + isPerformanceLive
  const [timingState, setTimingState] = useState(TIMING_STATE.OFF);
  const timingStateRef = useRef(timingState);
  useEffect(() => {
    timingStateRef.current = timingState;
  }, [timingState]);

  // Keep ref in sync immediately for gating logic that reads timingStateRef in the same tick.
  const setTimingStateSync = useCallback((next) => {
    timingStateRef.current = next;
    setTimingState(next);
  }, []);

  // Unified timing references for audio/wall-clock sync
  const audioStartTimeRef = useRef(null); // AudioContext seconds at performance start
  const wallClockStartTimeRef = useRef(null); // Date.now() ms at performance start
  const countInEndAudioTimeRef = useRef(null); // AudioContext seconds at count-in end (scheduled)
  const countInEndWallClockMsRef = useRef(null); // Date.now() ms at count-in end (scheduled)
  const performanceStartAudioTimeRef = useRef(null); // AudioContext seconds at performance start (preferred timing baseline)

  // Input mode state: "keyboard" or "mic"
  const [inputMode, setInputMode] = useState(() => {
    const stored = localStorage.getItem("sightReadingInputMode");
    return stored === "mic" ? "mic" : "keyboard"; // Default to keyboard for safer UX
  });

  // Sync keyboard visibility with input mode
  const [showKeyboard, setShowKeyboard] = useState(true); // Toggle for on-screen keyboard - default to true for better UX
  const [showInputModeModal, setShowInputModeModal] = useState(false);
  const isFeedbackPhase = gamePhase === GAME_PHASES.FEEDBACK;
  const isBothClefs = String(gameSettings.clef || "").toLowerCase() === "both";
  const shouldShowKeyboard = !isFeedbackPhase && showKeyboard;
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const gamePhaseRef = useRef(gamePhase);
  useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);
  // Compact landscape detection (for very short, wide screens like mobile landscape).
  // Used to tighten vertical spacing so feedback + buttons fit without scrolling.
  const [isCompactLandscape, setIsCompactLandscape] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkLayout = () => {
      const { innerWidth, innerHeight } = window;
      const compact = innerWidth > innerHeight && innerHeight <= 430; // ~iPhone 12/13 landscape height
      setIsCompactLandscape(compact);
    };
    checkLayout();
    window.addEventListener("resize", checkLayout);
    window.addEventListener("orientationchange", checkLayout);
    return () => {
      window.removeEventListener("resize", checkLayout);
      window.removeEventListener("orientationchange", checkLayout);
    };
  }, []);
  useEffect(() => {
    startSession();
    return () => {
      resetSession();
    };
  }, [startSession, resetSession]);
  const countInAnimationRef = useRef(null);
  const lastCountInBeatRef = useRef(0);
  const countInRafRef = useRef({ scoring: null, completion: null });
  const stopCountInVisualization = useCallback(() => {
    if (countInAnimationRef.current) {
      cancelAnimationFrame(countInAnimationRef.current);
      countInAnimationRef.current = null;
    }
    lastCountInBeatRef.current = 0;
  }, []);

  const clearCountInTimeouts = useCallback(() => {
    if (countInTimeoutRef.current.scoring) {
      clearTimeout(countInTimeoutRef.current.scoring);
      countInTimeoutRef.current.scoring = null;
    }
    if (countInTimeoutRef.current.completion) {
      clearTimeout(countInTimeoutRef.current.completion);
      countInTimeoutRef.current.completion = null;
    }
    if (countInRafRef.current.scoring) {
      cancelAnimationFrame(countInRafRef.current.scoring);
      countInRafRef.current.scoring = null;
    }
    if (countInRafRef.current.completion) {
      cancelAnimationFrame(countInRafRef.current.completion);
      countInRafRef.current.completion = null;
    }
  }, []);

  const startCountInVisualization = useCallback(
    (startTime, beats, beatDuration) => {
      stopCountInVisualization();
      setCurrentBeat(0);

      const tick = () => {
        if (gamePhaseRef.current !== GAME_PHASES.COUNT_IN) {
          stopCountInVisualization();
          return;
        }

        const audioNow = audioEngine.getCurrentTime();
        const elapsed = audioNow - startTime;

        if (elapsed >= -0.05) {
          const progress = Math.max(0, elapsed);
          const beatNumber = Math.min(
            beats,
            Math.floor(progress / beatDuration) + 1
          );

          if (beatNumber !== lastCountInBeatRef.current) {
            lastCountInBeatRef.current = beatNumber;
            setCurrentBeat(beatNumber);
            logMetronomeTiming("ui beat synced", {
              beat: beatNumber,
              audioContextTime: audioNow,
              elapsed,
            });
          }
        }

        if (elapsed <= beats * beatDuration + 0.5) {
          countInAnimationRef.current = requestAnimationFrame(tick);
        } else {
          countInAnimationRef.current = null;
        }
      };

      countInAnimationRef.current = requestAnimationFrame(tick);
    },
    [audioEngine, stopCountInVisualization]
  );

  useEffect(() => {
    return () => {
      stopCountInVisualization();
      clearCountInTimeouts();
    };
  }, [stopCountInVisualization, clearCountInTimeouts]);

  const pcKeyboardMap = useMemo(() => {
    const selected = gameSettings.selectedNotes || [];
    const clefKey = String(gameSettings.clef || "Treble").toLowerCase();
    const noteBank =
      clefKey === "bass"
        ? BASS_NOTES
        : clefKey === "both"
          ? [
              ...TREBLE_NOTES.map((n) => ({ ...n, __clef: "treble" })),
              ...BASS_NOTES.map((n) => ({ ...n, __clef: "bass" })),
            ]
          : TREBLE_NOTES;
    const activeNotes =
      selected.length > 0
        ? (() => {
            const selectedSet = new Set(selected);
            return noteBank.filter((note) => {
              if (clefKey === "both") {
                const tag = note.__clef || "treble";
                const notePitch = note.pitch;
                const isAccidental =
                  notePitch &&
                  (String(notePitch).includes("#") ||
                    String(notePitch).includes("b"));
                const baseMatch = notePitch
                  ? String(notePitch)
                      .trim()
                      .replace(/\s+/g, "")
                      .replace(/([#b])/, "")
                  : null;
                const allowAccidental =
                  isAccidental &&
                  ((String(notePitch).includes("#") &&
                    (gameSettings.enableSharps ?? false)) ||
                    (String(notePitch).includes("b") &&
                      (gameSettings.enableFlats ?? false)));
                return (
                  selectedSet.has(`${tag}:${notePitch}`) ||
                  (allowAccidental &&
                    baseMatch &&
                    selectedSet.has(`${tag}:${baseMatch}`))
                );
              }
              const notePitch = note.pitch;
              const isAccidental =
                notePitch &&
                (String(notePitch).includes("#") ||
                  String(notePitch).includes("b"));
              const baseMatch = notePitch
                ? String(notePitch)
                    .trim()
                    .replace(/\s+/g, "")
                    .replace(/([#b])/, "")
                : null;
              const allowAccidental =
                isAccidental &&
                ((String(notePitch).includes("#") &&
                  (gameSettings.enableSharps ?? false)) ||
                  (String(notePitch).includes("b") &&
                    (gameSettings.enableFlats ?? false)));
              return (
                selectedSet.has(notePitch) ||
                (allowAccidental && baseMatch && selectedSet.has(baseMatch))
              );
            });
          })()
        : noteBank;
    const mapping = {};
    activeNotes.forEach((note, idx) => {
      if (PC_KEYBOARD_KEYS[idx]) {
        mapping[PC_KEYBOARD_KEYS[idx]] = note.pitch;
      }
    });
    return mapping;
  }, [
    gameSettings.clef,
    gameSettings.selectedNotes,
    gameSettings.enableSharps,
    gameSettings.enableFlats,
  ]);

  // Use ref to avoid stale closure in setTimeout callback
  const currentPatternRef = useRef(null);
  const performanceTimeoutsRef = useRef([]);
  const countInTimeoutRef = useRef({
    scoring: null,
    completion: null,
  });
  const timingWindowsRef = useRef([]);
  const performanceResultsRef = useRef([]); // Ref for real-time performance results access
  const performanceLiveTimeoutRef = useRef(null);
  const lastDetectionTimesRef = useRef({}); // Per-note debouncing: key=noteIndex, value=lastDetectionMs
  // Track wrong-pitch attempts per note so we can still allow correction within the window.
  const wrongPitchSeenRef = useRef({}); // key=noteIndex, value=boolean
  const lastWrongPitchRef = useRef({}); // key=noteIndex, value=lastDetectedPitch
  const micEarlyWindowStartRequestedRef = useRef(false);

  // Performance tracking
  const [performanceResults, setPerformanceResults] = useState([]);
  const [, setExpectedNoteStartTime] = useState(null);
  const [, setDetectedPitches] = useState([]);
  const [showMicPermissionPrompt, setShowMicPermissionPrompt] = useState(false);

  // Persist input mode changes to localStorage
  useEffect(() => {
    localStorage.setItem("sightReadingInputMode", inputMode);
    // Keep on-screen keyboard visibility in sync with input mode.
    // Requirement: when switching to microphone input mode, hide the on-screen keyboard.
    setShowKeyboard(inputMode === "keyboard");
    // IMPORTANT (mic lifecycle): This ref is used to prevent duplicate mic start
    // requests within a single performance (EARLY_WINDOW warm-up vs. performance start).
    // It MUST be reset whenever the user switches into mic mode, otherwise subsequent
    // exercises can skip calling startListening() and the mic will appear "dead".
    if (inputMode === "mic") {
      micEarlyWindowStartRequestedRef.current = false;
      pendingMicLatencyMsRef.current = null;
    }
    // Dismiss any mic permission prompts when switching away from mic mode
    if (inputMode !== "mic") {
      setShowMicPermissionPrompt(false);
    }
  }, [inputMode]);

  // Helper: Get elapsed time from performance start in ms
  const getElapsedMsFromPerformanceStart = useCallback(() => {
    // Prefer audio clock baseline (metronome is scheduled on AudioContext time).
    if (
      typeof performanceStartAudioTimeRef.current === "number" &&
      performanceStartAudioTimeRef.current > 0
    ) {
      const audioNow = audioEngine.getCurrentTime();
      const elapsedMs =
        (audioNow - performanceStartAudioTimeRef.current) * 1000;
      return Math.max(0, elapsedMs);
    }

    // Fallback: wall-clock baseline.
    if (!wallClockStartTimeRef.current) return 0;
    return Math.max(0, Date.now() - wallClockStartTimeRef.current);
  }, []);

  const [, setTimingFeedback] = useState(null); // { message, color, timestamp }
  const [summaryStats, setSummaryStats] = useState(null);
  const guessPenaltyRef = useRef(0);
  const failedAttemptTrackerRef = useRef([]);
  const keyboardSpamTrackerRef = useRef([]);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const penaltyLockRef = useRef(false);

  // Metronome state/refs live early so helpers can be safely referenced elsewhere.
  const metronomeIntervalRef = useRef(null);
  const metronomeBeatRef = useRef(0);
  const metronomeNextClickTimeRef = useRef(null); // AudioContext seconds
  const metronomeStartTokenRef = useRef(0); // Guards async start against phase changes
  const metronomeEnabledRef = useRef(false);
  useEffect(() => {
    metronomeEnabledRef.current = metronomeEnabled;
  }, [metronomeEnabled]);

  // Central metronome stop helper (stable; no dependencies).
  const stopMetronomePlayback = useCallback(() => {
    // Invalidate any pending async start.
    metronomeStartTokenRef.current += 1;
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
    metronomeNextClickTimeRef.current = null;
  }, []);

  // Prevent body scroll when penalty modal is open
  useEffect(() => {
    if (showPenaltyModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showPenaltyModal]);
  const { buildTimingWindows, evaluateTiming } = useTimingAnalysis({
    tempo: gameSettings.tempo,
  });
  const rhythmPlayback = useRhythmPlayback({
    audioEngine,
    tempo: gameSettings.tempo,
  });
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [scoreSyncStatus, setScoreSyncStatus] = useState("idle");
  const abortPerformanceForPenalty = useCallback(() => {
    if (penaltyLockRef.current) return;
    penaltyLockRef.current = true;
    stopMetronomePlayback();
    performanceTimeoutsRef.current.forEach((id) => clearTimeout(id));
    performanceTimeoutsRef.current = [];
    rhythmPlayback.stop();
    audioEngine.stopScheduler();
    if (inputMode === "mic") {
      stopListeningRef.current();
    }
    // Ensure the next performance can start the mic again if needed.
    micEarlyWindowStartRequestedRef.current = false;
    pendingMicLatencyMsRef.current = null;
    setTimingState(TIMING_STATE.OFF);
  }, [audioEngine, inputMode, rhythmPlayback, stopMetronomePlayback]);

  const registerGuessPenalty = useCallback(
    (context) => {
      guessPenaltyRef.current += 100;
      console.warn("[SightReadingPenalty] Guess penalty applied", {
        totalPenalty: guessPenaltyRef.current,
        context,
      });
      if (
        !penaltyLockRef.current &&
        gamePhaseRef.current === GAME_PHASES.PERFORMANCE
      ) {
        abortPerformanceForPenalty();
        setShowPenaltyModal(true);
      }
    },
    [abortPerformanceForPenalty]
  );
  const trackFailedAttemptForAntiCheat = useCallback(
    (details) => {
      const now = Date.now();
      const recentAttempts = failedAttemptTrackerRef.current.filter(
        (timestamp) => now - timestamp <= ANTI_CHEAT_WINDOW_MS
      );
      recentAttempts.push(now);
      failedAttemptTrackerRef.current = recentAttempts;

      if (recentAttempts.length >= ANTI_CHEAT_THRESHOLD) {
        registerGuessPenalty({
          reason: "rapid_failed_inputs",
          attempts: recentAttempts.length,
          windowMs: ANTI_CHEAT_WINDOW_MS,
          lastAttempt: details,
        });
        failedAttemptTrackerRef.current = [];
      }
    },
    [registerGuessPenalty]
  );
  const registerKeyboardSpamAttempt = useCallback(() => {
    const now = Date.now();
    const recentAttempts = keyboardSpamTrackerRef.current.filter(
      (timestamp) => now - timestamp <= ANTI_CHEAT_WINDOW_MS
    );
    recentAttempts.push(now);
    keyboardSpamTrackerRef.current = recentAttempts;

    if (recentAttempts.length >= ANTI_CHEAT_THRESHOLD) {
      registerGuessPenalty({
        reason: "keyboard_spam",
        attempts: recentAttempts.length,
        windowMs: ANTI_CHEAT_WINDOW_MS,
      });
      keyboardSpamTrackerRef.current = [];
    }
  }, [registerGuessPenalty]);
  const sessionPercentageDisplay = Math.round((sessionPercentage || 0) * 100);
  const sessionScoreSummary =
    sessionMaxScore > 0
      ? `${Math.round(sessionTotalScore)}/${Math.round(sessionMaxScore)}`
      : "0/0";
  const progressPercentage = Math.min(progressFraction * 100, 100);
  const totalPossibleSessionScore =
    sessionMaxScore > 0
      ? Math.round(sessionMaxScore)
      : sessionTotalExercises * SESSION_MAX_EXERCISE_SCORE;
  const showVictoryScreen = isSessionComplete && isVictory;
  const showEncouragementScreen = isSessionComplete && !isVictory;
  const [exerciseRecorded, setExerciseRecorded] = useState(false);
  const pendingMicLatencyMsRef = useRef(null);
  const performanceTimelineRafRef = useRef(null);
  const performanceTimelineIdxRef = useRef(-1);

  // Create note frequency mapping from current pattern
  const noteFrequencies = useMemo(() => {
    if (!currentPattern) return {};

    // Extract unique pitches from pattern
    const frequencies = {};
    currentPattern.notes.forEach((note) => {
      if (note.pitch && NOTE_FREQUENCIES[note.pitch]) {
        frequencies[note.pitch] = NOTE_FREQUENCIES[note.pitch];
      }
    });

    return frequencies;
  }, [currentPattern]);

  const handleNoteEvent = useCallback((event) => {
    if (!event || event.type !== "noteOn") return;
    pendingMicLatencyMsRef.current =
      typeof event.latencyMs === "number" ? event.latencyMs : null;
    // #region agent log
    __srLog({
      sessionId: "debug-session",
      runId: "mic-latency-pre",
      hypothesisId: "Hmic",
      location:
        "src/components/games/sight-reading-game/SightReadingGame.jsx:handleNoteEvent",
      message: "mic.noteOn.received",
      data: {
        pitch: event.pitch,
        frequency: event.frequency ?? null,
        perfNow: typeof performance !== "undefined" ? performance.now() : null,
        eventTime: event.time ?? null,
        latencyMs: typeof event.latencyMs === "number" ? event.latencyMs : null,
        wallNow: Date.now(),
        audioNow: audioEngine.getCurrentTime(),
        phase: gamePhaseRef.current,
        timingState: timingStateRef.current,
      },
      timestamp: Date.now(),
    });
    // #endregion
    handleNoteDetectedRef.current(event.pitch, event.frequency ?? 440);
  }, []);

  // Dev-only mic debug overlay toggle:
  // In console: localStorage.setItem("debug-mic", "1") then refresh.
  const showMicDebug = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage?.getItem("debug-mic") === "1";
  }, []);

  const { audioLevel, isListening, startListening, stopListening, debug } =
    useMicNoteInput({
      isActive: false, // Manual control
      noteFrequencies,
      ...MIC_INPUT_PRESETS.sightReading,
      onNoteEvent: handleNoteEvent,
    });

  useEffect(() => {
    stopListeningRef.current = stopListening;
  }, [stopListening]);

  const micIsListeningRef = useRef(false);
  useEffect(() => {
    micIsListeningRef.current = Boolean(isListening);
  }, [isListening]);

  useEffect(() => {
    if (!currentPattern) {
      timingWindowsRef.current = [];
      return;
    }
    timingWindowsRef.current = buildTimingWindows(currentPattern);
    failedAttemptTrackerRef.current = [];
    keyboardSpamTrackerRef.current = [];
  }, [currentPattern, buildTimingWindows]);

  // Helper: Check if scoring is allowed based on phase and timing state
  const canScoreNow = useCallback((phase) => {
    const state = timingStateRef.current;
    if (phase === GAME_PHASES.COUNT_IN) {
      return state === TIMING_STATE.EARLY_WINDOW;
    }
    if (phase === GAME_PHASES.PERFORMANCE) {
      return state === TIMING_STATE.LIVE;
    }
    return false;
  }, []);

  const getNoteLabel = useCallback(
    (pitch) => {
      if (!pitch) return "";
      const clefKey = String(gameSettings.clef || "Treble").toLowerCase();
      const noteBank =
        clefKey === "bass"
          ? BASS_NOTES
          : clefKey === "both"
            ? [...TREBLE_NOTES, ...BASS_NOTES]
            : TREBLE_NOTES;
      return noteBank.find((note) => note.pitch === pitch)?.note || pitch;
    },
    [gameSettings.clef]
  );

  const wait = useCallback(
    (ms) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      }),
    []
  );

  const schedulePerformanceLiveActivation = useCallback(() => {
    if (performanceLiveTimeoutRef.current) {
      clearTimeout(performanceLiveTimeoutRef.current);
      performanceLiveTimeoutRef.current = null;
    }
    if (PERFORMANCE_START_BUFFER_MS <= 0) {
      setTimingStateSync(TIMING_STATE.LIVE);
      logFirstNoteDebug("performance live window active", {
        bufferMs: PERFORMANCE_START_BUFFER_MS,
      });
      return;
    }
    performanceLiveTimeoutRef.current = setTimeout(() => {
      setTimingStateSync(TIMING_STATE.LIVE);
      performanceLiveTimeoutRef.current = null;
      logFirstNoteDebug("performance live window active", {
        bufferMs: PERFORMANCE_START_BUFFER_MS,
      });
    }, PERFORMANCE_START_BUFFER_MS);
  }, [setTimingStateSync]);

  const resetPerformanceLiveState = useCallback(() => {
    if (performanceLiveTimeoutRef.current) {
      clearTimeout(performanceLiveTimeoutRef.current);
      performanceLiveTimeoutRef.current = null;
    }
    setTimingStateSync(TIMING_STATE.OFF);
  }, [setTimingStateSync]);

  /**
   * Check microphone permission status and handle accordingly
   * Returns true if permission is granted or can be requested, false if denied
   */
  const checkMicrophonePermission = useCallback(async () => {
    try {
      // Try to query permission status if available
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({
          name: "microphone",
        });
        if (result.state === "denied") {
          setShowMicPermissionPrompt(true);
          return false;
        }
        if (result.state === "granted") {
          return true;
        }
        // If "prompt", fall through to getUserMedia check
      }

      // If permissions API not available or state is "prompt", try getUserMedia
      // This will trigger the browser's permission prompt if needed
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just wanted to check permission
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error("Microphone permission check failed:", error);
      setShowMicPermissionPrompt(true);
      return false;
    }
  }, []);

  const ensureAudioContextRunning = useCallback(async () => {
    const contextState = audioEngine.audioContextRef?.current?.state;
    const audioNow = audioEngine.getCurrentTime();
    logMetronomeTiming("audio context state check", {
      contextState,
      audioNow,
    });

    if (contextState === "running") {
      return true;
    }

    logMetronomeTiming("audio context resuming", {
      previousState: contextState,
    });
    const resumed = await audioEngine.resumeAudioContext();
    const newState = audioEngine.audioContextRef?.current?.state;
    logMetronomeTiming("audio context resumed", {
      resumed,
      newState,
      audioNow: audioEngine.getCurrentTime(),
    });
    return resumed;
  }, [audioEngine]);

  const verifyAudioClockProgress = useCallback(async () => {
    const before = audioEngine.getCurrentTime();
    await wait(200);
    const after = audioEngine.getCurrentTime();
    const delta = after - before;
    logMetronomeTiming("audio clock progress sample", {
      before,
      after,
      delta,
    });

    if (delta < 0.01) {
      logMetronomeTiming("audio clock stalled, forcing resume", {
        delta,
        beforeState: audioEngine.audioContextRef?.current?.state,
      });
      const resumed = await audioEngine.resumeAudioContext();
      logMetronomeTiming("audio clock resume attempt complete", {
        resumed,
        newState: audioEngine.audioContextRef?.current?.state,
        audioNow: audioEngine.getCurrentTime(),
      });
      return { delta: audioEngine.getCurrentTime() - before, resumed: true };
    }

    return { delta, resumed: false };
  }, [audioEngine, wait]);

  // iOS Safari can feel "frozen" if we block on multiple 200ms stability checks
  // right after a user gesture. For iOS, prefer a lightweight one-frame check so we
  // can schedule the count-in immediately, while still nudging the context
  // to resume if the clock isn't advancing.
  const verifyAudioClockProgressFast = useCallback(async () => {
    const before = audioEngine.getCurrentTime();
    await wait(16); // ~1 frame
    const after = audioEngine.getCurrentTime();
    const delta = after - before;
    logMetronomeTiming("audio clock fast progress sample", {
      before,
      after,
      delta,
    });

    if (delta < 0.001) {
      logMetronomeTiming("audio clock fast sample stalled, forcing resume", {
        delta,
        beforeState: audioEngine.audioContextRef?.current?.state,
      });
      const resumed = await audioEngine.resumeAudioContext();
      logMetronomeTiming("audio clock fast resume attempt complete", {
        resumed,
        newState: audioEngine.audioContextRef?.current?.state,
        audioNow: audioEngine.getCurrentTime(),
      });
      return { delta: audioEngine.getCurrentTime() - before, resumed: true };
    }

    return { delta, resumed: false };
  }, [audioEngine, wait]);

  const waitForStableAudioClock = useCallback(
    async (threshold = 0.05, maxAttempts = 5) => {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const result = await verifyAudioClockProgress();
        logMetronomeTiming("audio clock stability check", {
          attempt,
          delta: result.delta,
          resumed: result.resumed,
          threshold,
        });
        if (result.delta >= threshold) {
          return true;
        }
        logMetronomeTiming("audio clock still below threshold, retrying", {
          attempt,
          delta: result.delta,
        });
      }
      return false;
    },
    [verifyAudioClockProgress]
  );

  // Complete performance handler
  const completePerformance = useCallback(() => {
    // #region agent log
    __srLog({
      sessionId: "debug-session",
      runId: "stuck-perf-pre",
      hypothesisId: "Hphase",
      location:
        "src/components/games/sight-reading-game/SightReadingGame.jsx:completePerformance",
      message: "performance.complete.called",
      data: {
        gamePhase: gamePhaseRef.current,
        timingState: timingStateRef.current,
        audioNow: audioEngine.getCurrentTime(),
        elapsedMs: Math.round(getElapsedMsFromPerformanceStart()),
      },
      timestamp: Date.now(),
    });
    // #endregion
    stopMetronomePlayback();

    // Add a small delay to ensure the last note's result is properly recorded
    // before transitioning to FEEDBACK phase (prevents race condition where
    // last note shows as "active" instead of its actual result color)
    setTimeout(() => {
      // #region agent log
      __srLog({
        sessionId: "debug-session",
        runId: "stuck-perf-pre",
        hypothesisId: "Hphase",
        location:
          "src/components/games/sight-reading-game/SightReadingGame.jsx:completePerformance",
        message: "performance.complete.setFeedback",
        data: {
          gamePhaseBefore: gamePhaseRef.current,
          timingState: timingStateRef.current,
        },
        timestamp: Date.now(),
      });
      // #endregion
      setGamePhase(GAME_PHASES.FEEDBACK);
    }, 50); // 50ms delay to let state updates settle
  }, [stopMetronomePlayback, audioEngine, getElapsedMsFromPerformanceStart]);

  /**
   * Show timing feedback message with color-coded styling
   */
  const showTimingFeedback = useCallback((timing) => {
    // Map timing status to colors and emojis
    const feedbackMap = {
      perfect: {
        message: "🎯 Perfect!",
        color: "text-green-400",
        bg: "bg-green-500/20",
      },
      good: {
        message: "✓ Good",
        color: "text-green-300",
        bg: "bg-green-500/15",
      },
      okay: {
        message: "~ Okay",
        color: "text-yellow-400",
        bg: "bg-yellow-500/20",
      },
      early: {
        message: "⏩ Too Early",
        color: "text-orange-400",
        bg: "bg-orange-500/20",
      },
      late: {
        message: "⏪ Too Late",
        color: "text-orange-400",
        bg: "bg-orange-500/20",
      },
      wrong_pitch: {
        message: "✗ Wrong Note!",
        color: "text-red-400",
        bg: "bg-red-500/20",
      },
    };

    const feedback = feedbackMap[timing.status] || feedbackMap.okay;

    setTimingFeedback({
      message: feedback.message,
      color: feedback.color,
      bg: feedback.bg,
      timestamp: Date.now(),
    });

    // Auto-hide feedback after 1.5 seconds
    setTimeout(() => {
      setTimingFeedback(null);
    }, 1500);
  }, []);

  useEffect(() => {
    if (gamePhase !== GAME_PHASES.FEEDBACK || !currentPattern) {
      return;
    }

    const pitchAccuracy = calculatePitchAccuracy(performanceResults);
    const rhythmAccuracy = calculateRhythmAccuracy(performanceResults);
    const baseScore = calculateOverallScore(pitchAccuracy, rhythmAccuracy);
    const penaltyPointsTotal = guessPenaltyRef.current || 0;
    const overallScore = Math.max(0, baseScore - penaltyPointsTotal);

    const perNoteAccuracy = currentPattern.notes
      .filter((event) => event.type === "note" && event.pitch)
      .reduce((acc, event) => {
        const key = event.pitch;
        if (!key) return acc;
        if (!acc[key]) {
          acc[key] = {
            total: 0,
            correct: 0,
            label: getNoteLabel(key),
          };
        }
        acc[key].total += 1;
        return acc;
      }, {});

    performanceResults.forEach((result) => {
      const expected = result.expected;
      if (!expected || !perNoteAccuracy[expected]) return;
      if (result.isCorrect) {
        perNoteAccuracy[expected].correct += 1;
      }
    });

    Object.values(perNoteAccuracy).forEach((entry) => {
      entry.accuracy =
        entry.total === 0 ? 0 : Math.round((entry.correct / entry.total) * 100);
    });

    const perNoteEntries = Object.entries(perNoteAccuracy).map(
      ([pitch, data]) => ({
        pitch,
        ...data,
      })
    );

    const coachingCandidates = perNoteEntries
      .filter((entry) => entry.total > 0)
      .sort((a, b) => {
        if (a.accuracy === b.accuracy) {
          return b.total - a.total;
        }
        return a.accuracy - b.accuracy;
      });

    const focusNotes = coachingCandidates.slice(0, 2);
    const coaching =
      focusNotes.length === 0
        ? null
        : {
            focusNotes,
            headline:
              focusNotes[0].accuracy >= 90
                ? `Nice work! Keep reinforcing ${focusNotes[0].label}.`
                : `Focus on ${focusNotes
                    .map((note) => note.label)
                    .join(" & ")} next.`,
            detail:
              focusNotes.length === 1
                ? `${focusNotes[0].label}: ${focusNotes[0].accuracy}% accuracy`
                : focusNotes
                    .map((note) => `${note.label}: ${note.accuracy}% accuracy`)
                    .join(" • "),
          };

    const patternPitches = currentPattern.notes
      .filter((event) => event.type === "note" && event.pitch)
      .map((event) => event.pitch);

    const metadata = {
      difficulty: gameSettings.difficulty,
      tempo: gameSettings.tempo,
      timeSignature:
        gameSettings.timeSignature?.name ||
        `${gameSettings.timeSignature?.beats ?? 4}/4`,
      noteRangePracticed: gameSettings.selectedNotes || [],
      patternSummary: patternPitches,
      patternLabels: patternPitches.map((pitch) => getNoteLabel(pitch)),
    };

    setSummaryStats({
      pitchAccuracy,
      rhythmAccuracy,
      overallScore,
      baseScore,
      penaltyPoints: penaltyPointsTotal,
      perNoteAccuracy,
      coaching,
      metadata,
    });
    setScoreSubmitted(false);
    setScoreSyncStatus("idle");
  }, [
    gamePhase,
    currentPattern,
    performanceResults,
    gameSettings.difficulty,
    gameSettings.tempo,
    gameSettings.timeSignature,
    gameSettings.selectedNotes,
    getNoteLabel,
  ]);

  // Note: Exercise result is recorded when clicking "Next Exercise", not automatically on FEEDBACK
  // This allows "Try Again" to not increment the exercise counter

  useEffect(() => {
    if (gamePhase !== GAME_PHASES.FEEDBACK || !summaryStats) {
      return;
    }

    if (!isStudent || !studentId) {
      setScoreSyncStatus("skipped");
      return;
    }

    if (scoreSubmitted) {
      return;
    }

    let isMounted = true;
    const submitScore = async () => {
      setScoreSyncStatus("saving");
      try {
        const normalizedScore = Number.isFinite(summaryStats.overallScore)
          ? Math.round(summaryStats.overallScore)
          : 0;
        await updateStudentScore(studentId, normalizedScore, "sight_reading");

        // Invalidate queries to update points display
        queryClient.invalidateQueries(["student-scores", studentId]);
        queryClient.invalidateQueries(["point-balance", studentId]);
        queryClient.invalidateQueries(["total-points", studentId]);
        queryClient.invalidateQueries(["gamesPlayed"]);

        if (!isMounted) return;
        setScoreSubmitted(true);
        setScoreSyncStatus("saved");
      } catch (error) {
        console.error("Failed to save sight reading score:", error);
        if (!isMounted) return;
        setScoreSyncStatus("error");
        toast.error("Couldn't save your sight reading score.");
      }
    };

    submitScore();

    return () => {
      isMounted = false;
    };
  }, [summaryStats, gamePhase, isStudent, studentId, scoreSubmitted]);

  const recordPerformanceResult = useCallback((newResult) => {
    setPerformanceResults((prev) => {
      const existingIdx = prev.findIndex(
        (r) => r.noteIndex === newResult.noteIndex
      );
      if (existingIdx === -1) {
        const updated = [...prev, newResult];
        performanceResultsRef.current = updated;
        return updated;
      }
      const updated = [...prev];
      if (
        FIRST_NOTE_DEBUG &&
        newResult.noteIndex === 0 &&
        prev[existingIdx]?.timingStatus === "missed"
      ) {
        logFirstNoteDebug("first-note result overriding missed", {
          previous: prev[existingIdx],
          next: newResult,
        });
      }
      updated[existingIdx] = newResult;
      performanceResultsRef.current = updated;
      return updated;
    });
  }, []);

  // Note detection handler with timing window validation
  const handleNoteDetected = useCallback(
    (detectedNote, frequency) => {
      if (penaltyLockRef.current) {
        return;
      }
      // Use refs for real-time accuracy - state values can be stale in callbacks
      const pattern = currentPatternRef.current;
      const phase = gamePhaseRef.current;

      if (!pattern) {
        return;
      }

      const now = Date.now();
      const performanceStartTime = wallClockStartTimeRef.current;

      // Validate performance start time is set
      if (!performanceStartTime) {
        console.error(
          `❌ CRITICAL: wallClockStartTimeRef not set! Detection will fail.`
        );
        return;
      }

      const rawElapsedTimeMs = getElapsedMsFromPerformanceStart();
      const dynamicMicCompMs =
        inputMode === "mic"
          ? typeof pendingMicLatencyMsRef.current === "number"
            ? Math.max(0, Math.min(1200, pendingMicLatencyMsRef.current))
            : MIC_LATENCY_COMP_MS
          : 0;
      if (inputMode === "mic") {
        pendingMicLatencyMsRef.current = null;
      }
      const elapsedTimeMs =
        inputMode === "mic"
          ? Math.max(0, rawElapsedTimeMs - dynamicMicCompMs)
          : rawElapsedTimeMs;

      // Use unified timing state check (after we know elapsed time for logging)
      if (!canScoreNow(phase)) {
        console.debug("[NoteDetection]", {
          blocked: true,
          phase,
          timingState: timingStateRef.current,
        });
        logFirstNoteDebug("detection blocked before scoring window", {
          elapsedTimeMs,
          phase,
          timingState: timingStateRef.current,
        });
        return;
      }

      // Log first note detection attempts for debugging
      const timingWindows = timingWindowsRef.current;
      if (timingWindows.length > 0) {
        const firstWindow = timingWindows[0];
        console.debug("[NoteDetection]", {
          note: detectedNote,
          elapsed: elapsedTimeMs.toFixed(0),
          firstWindow: [
            firstWindow.windowStart.toFixed(0),
            firstWindow.windowEnd.toFixed(0),
          ],
          phase,
          scoring: timingStateRef.current,
        });
      }

      // Find which note (if any) is currently within its timing window.
      // IMPORTANT: We must NOT skip ahead to a later note just because the detected pitch matches it,
      // otherwise an early note can be left unscored and later marked as "missed".
      let matchingNoteIndex = -1;
      let matchingEvent = null;
      let matchingWindow = null;

      for (let i = 0; i < timingWindows.length; i++) {
        const windowInfo = timingWindows[i];
        const event = windowInfo.event;

        // Skip rests
        if (event.type === "rest") continue;

        // Skip already recorded notes unless the existing record is a miss we can override
        // Use ref for real-time accuracy - state values can be stale in callbacks
        const existingResult = performanceResultsRef.current.find(
          (r) => r.noteIndex === i
        );
        const canOverrideExisting =
          existingResult &&
          existingResult.phase === GAME_PHASES.COUNT_IN &&
          phase === GAME_PHASES.PERFORMANCE &&
          existingResult.timingStatus === "missed";
        if (
          existingResult &&
          !canOverrideExisting &&
          existingResult.timingStatus !== "missed"
        ) {
          continue;
        }
        if (existingResult?.timingStatus === "missed") {
          // Allow mic detections to override a previously recorded miss (mic start latency / stability).
          if (!(inputMode === "mic" && phase === GAME_PHASES.PERFORMANCE)) {
            // #region agent log
            __srLog({
              sessionId: "debug-session",
              runId: "mic-start-fix-pre",
              hypothesisId: "Htimeout",
              location:
                "src/components/games/sight-reading-game/SightReadingGame.jsx:handleNoteDetected",
              message: "scoring.skipMissedExisting",
              data: { noteIndex: i, detectedNote, phase, inputMode },
              timestamp: Date.now(),
            });
            // #endregion
            continue;
          }
        }

        // Calculate timing window for this note
        const { windowStart, windowEnd } = windowInfo;

        // Check if we're within this note's timing window
        if (elapsedTimeMs >= windowStart && elapsedTimeMs <= windowEnd) {
          // Always select the earliest pending window that contains this detection.
          matchingNoteIndex = windowInfo.noteIndex;
          matchingEvent = event;
          matchingWindow = windowInfo;
          break;
        }
      }

      // No valid note found in timing window
      if (matchingNoteIndex === -1 || !matchingWindow || !matchingEvent) {
        // #region agent log
        __srLog({
          sessionId: "debug-session",
          runId: "beat-shift-pre",
          hypothesisId: "Hselect",
          location:
            "src/components/games/sight-reading-game/SightReadingGame.jsx:handleNoteDetected",
          message: "scoring.windowSelect.none",
          data: {
            detectedNote,
            elapsedMs: Math.round(elapsedTimeMs),
            phase,
            timingState: timingStateRef.current,
          },
          timestamp: Date.now(),
        });
        // #endregion
        if (FIRST_NOTE_DEBUG) {
          logFirstNoteDebug("no matching note", {
            elapsedTimeMs,
            gamePhase: phase,
          });
        }
        trackFailedAttemptForAntiCheat({
          type: "no_window",
          detectedNote,
          elapsedTimeMs,
        });
        return;
      }

      // #region agent log
      __srLog({
        sessionId: "debug-session",
        runId: "beat-shift-pre",
        hypothesisId: "Hselect",
        location:
          "src/components/games/sight-reading-game/SightReadingGame.jsx:handleNoteDetected",
        message: "scoring.windowSelect.chosen",
        data: {
          detectedNote,
          selectedNoteIndex: matchingNoteIndex,
          expected: matchingEvent?.pitch ?? null,
          windowStartMs: Math.round(matchingWindow.windowStart),
          windowEndMs: Math.round(matchingWindow.windowEnd),
          noteStartMs: Math.round(matchingWindow.startMs ?? 0),
          noteEndMs: Math.round(matchingWindow.endMs ?? 0),
          elapsedMs: Math.round(elapsedTimeMs),
          rawElapsedMs: Math.round(rawElapsedTimeMs),
          micLatencyCompMs: inputMode === "mic" ? dynamicMicCompMs : 0,
          phase,
          timingState: timingStateRef.current,
        },
        timestamp: Date.now(),
      });
      // #endregion
      if (matchingNoteIndex === 0) {
        logFirstNoteDebug("first-note window matched", {
          elapsedTimeMs,
          windowStart: matchingWindow.windowStart,
          windowEnd: matchingWindow.windowEnd,
          noteStartMs: matchingWindow.startMs,
          noteEndMs: matchingWindow.endMs,
          gamePhase: phase,
          scoringActive: timingStateRef.current,
        });
      }

      // Per-note debouncing: prevent rapid re-triggering of the same note
      const DEBOUNCE_MS = 80;
      const lastTime =
        lastDetectionTimesRef.current[matchingNoteIndex] ?? -Infinity;
      if (elapsedTimeMs - lastTime < DEBOUNCE_MS) {
        console.debug("[NoteDetection]", {
          debounced: true,
          noteIndex: matchingNoteIndex + 1,
          elapsed: (elapsedTimeMs - lastTime).toFixed(0),
        });
        return;
      }
      lastDetectionTimesRef.current[matchingNoteIndex] = elapsedTimeMs;

      // Calculate timing relative to the matched note's actual start time
      const matchedNoteStartMs =
        matchingWindow?.startMs || (matchingEvent.startTime || 0) * 1000;
      const timeDiff = elapsedTimeMs - matchedNoteStartMs;

      // Check if detected note matches expected note
      if (detectedNote === matchingEvent.pitch) {
        failedAttemptTrackerRef.current = [];
        keyboardSpamTrackerRef.current = [];
        // Calculate timing accuracy
        // Slightly widen mic grading to compensate for real-world onset + detection jitter.
        const MIC_TIMING_SLOP_MS = inputMode === "mic" ? 110 : 0;
        const timeDiffAfterFirstNoteGrace =
          inputMode === "mic" && matchingNoteIndex === 0 && timeDiff > 0
            ? Math.max(0, timeDiff - MIC_FIRST_NOTE_LATE_GRACE_MS)
            : timeDiff;
        const evalTimeDiffMs =
          MIC_TIMING_SLOP_MS > 0
            ? Math.sign(timeDiffAfterFirstNoteGrace) *
              Math.max(
                0,
                Math.abs(timeDiffAfterFirstNoteGrace) - MIC_TIMING_SLOP_MS
              )
            : timeDiffAfterFirstNoteGrace;
        const timing = evaluateTiming(evalTimeDiffMs);
        // #region agent log
        __srLog({
          sessionId: "debug-session",
          runId: "mic-latency-pre",
          hypothesisId: "Hmic",
          location:
            "src/components/games/sight-reading-game/SightReadingGame.jsx:handleNoteDetected",
          message: "scoring.timingEval",
          data: {
            detectedNote,
            expected: matchingEvent.pitch,
            elapsedMs: Math.round(elapsedTimeMs),
            rawElapsedMs: Math.round(rawElapsedTimeMs),
            micLatencyCompMs: inputMode === "mic" ? dynamicMicCompMs : 0,
            audioOutputLatencyMs:
              typeof audioEngine.audioContextRef?.current?.outputLatency ===
              "number"
                ? Math.round(
                    audioEngine.audioContextRef.current.outputLatency * 1000
                  )
                : null,
            expectedStartMs: Math.round(matchedNoteStartMs),
            timeDiffMs: Math.round(timeDiff),
            evalTimeDiffMs: Math.round(evalTimeDiffMs),
            micTimingSlopMs: MIC_TIMING_SLOP_MS,
            firstNoteLateGraceMs:
              inputMode === "mic" && matchingNoteIndex === 0
                ? MIC_FIRST_NOTE_LATE_GRACE_MS
                : 0,
            timingStatus: timing?.status ?? null,
            phase,
            timingState: timingStateRef.current,
            audioNow: audioEngine.getCurrentTime(),
          },
          timestamp: Date.now(),
        });
        // #endregion

        // Record correct result
        const result = {
          noteIndex: matchingNoteIndex,
          expected: matchingEvent.pitch,
          detected: detectedNote,
          frequency,
          timing,
          timingStatus: timing.status,
          timeDiff,
          isCorrect: true,
          timestamp: now,
          phase,
        };

        console.debug("[NoteDetection]", {
          correct: true,
          noteIndex: matchingNoteIndex + 1,
          detectedNote,
          frequency: frequency.toFixed(1),
          timingStatus: timing.status,
          timeDiff: timeDiff.toFixed(0),
        });
        if (matchingNoteIndex === 0) {
          logFirstNoteDebug("first-note correct detection", {
            detectedNote,
            frequency,
            timingStatus: timing.status,
            timeDiff,
            elapsedTimeMs,
            timestamp: now,
            scoringActive: timingStateRef.current,
          });
        }
        recordPerformanceResult(result);
        // Clear wrong-pitch tracking for this note once correctly scored.
        wrongPitchSeenRef.current[matchingNoteIndex] = false;
        lastWrongPitchRef.current[matchingNoteIndex] = null;

        // Show timing feedback
        showTimingFeedback(timing);
      } else {
        // #region agent log
        __srLog({
          sessionId: "debug-session",
          runId: "beat-shift-pre",
          hypothesisId: "Hshift",
          location:
            "src/components/games/sight-reading-game/SightReadingGame.jsx:handleNoteDetected",
          message: "scoring.wrongPitch",
          data: {
            detectedNote,
            expected: matchingEvent?.pitch ?? null,
            selectedNoteIndex: matchingNoteIndex,
            elapsedMs: Math.round(elapsedTimeMs),
            windowStartMs: Math.round(matchingWindow?.windowStart ?? 0),
            windowEndMs: Math.round(matchingWindow?.windowEnd ?? 0),
          },
          timestamp: Date.now(),
        });
        // #endregion
        // Record wrong pitch (per PRD: show RED feedback)
        const result = {
          noteIndex: matchingNoteIndex,
          expected: matchingEvent.pitch,
          detected: detectedNote,
          frequency,
          timeDiff,
          timingStatus: "wrong_pitch",
          isCorrect: false,
          timestamp: now,
          phase,
        };

        console.debug("[NoteDetection]", {
          wrong: true,
          noteIndex: matchingNoteIndex + 1,
          expected: matchingEvent.pitch,
          detectedNote,
          timeDiff: timeDiff.toFixed(0),
        });
        if (matchingNoteIndex === 0) {
          logFirstNoteDebug("first-note wrong pitch", {
            detectedNote,
            expected: matchingEvent.pitch,
            timeDiff,
            elapsedTimeMs,
            timestamp: now,
            scoringActive: timingStateRef.current,
          });
        }
        // IMPORTANT (mic UX): don't finalize the note on a single wrong-pitch hit.
        // Mic detection can momentarily mis-classify adjacent pitches; allow the player
        // to still be scored correctly if the correct pitch is detected within the window.
        wrongPitchSeenRef.current[matchingNoteIndex] = true;
        lastWrongPitchRef.current[matchingNoteIndex] = detectedNote;

        // Show wrong note feedback (immediate red flash), but keep the note pending.
        showTimingFeedback({ status: "wrong_pitch", label: "Wrong Note!" });
        trackFailedAttemptForAntiCheat({
          type: "wrong_pitch",
          detected: detectedNote,
          expected: matchingEvent.pitch,
          noteIndex: matchingNoteIndex,
        });

        // Also track in detected pitches for reference
        setDetectedPitches((prev) => [
          ...prev,
          {
            detected: detectedNote,
            expected: matchingEvent.pitch,
            timestamp: now,
          },
        ]);
      }
    },
    [
      evaluateTiming,
      showTimingFeedback,
      recordPerformanceResult,
      canScoreNow,
      getElapsedMsFromPerformanceStart,
      trackFailedAttemptForAntiCheat,
    ]
  );

  useEffect(() => {
    handleNoteDetectedRef.current = handleNoteDetected;
  }, [handleNoteDetected]);

  /**
   * Handle keyboard note input (from on-screen piano)
   * Plays piano sound with correct pitch and feeds into scoring logic
   */
  const handleKeyboardNoteInput = useCallback(
    (noteName) => {
      // Always play piano sound with the correct pitch for immediate feedback
      audioEngine.playPianoSound(0.6, noteName);

      // Use refs for real-time accuracy - state values can be stale in callbacks
      const phase = gamePhaseRef.current;
      const pattern = currentPatternRef.current;

      if (phase === GAME_PHASES.PERFORMANCE && !canScoreNow(phase)) {
        registerKeyboardSpamAttempt();
      }

      if (pattern && canScoreNow(phase)) {
        handleNoteEvent({
          pitch: noteName,
          source: "keyboard",
          type: "noteOn",
          time: performance.now(),
        });
      } else if (phase === GAME_PHASES.PERFORMANCE) {
        // Show soft feedback without scoring (e.g., outside timing window)
        showTimingFeedback({ status: "okay" });
      }
    },
    [
      audioEngine,
      handleNoteEvent,
      showTimingFeedback,
      canScoreNow,
      registerKeyboardSpamAttempt,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      const mappedPitch = pcKeyboardMap[key];
      if (!mappedPitch) return;
      // Use ref for real-time accuracy - check unified timing state
      const phase = gamePhaseRef.current;

      if (!canScoreNow(phase)) {
        return;
      }
      event.preventDefault();
      handleKeyboardNoteInput(mappedPitch);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pcKeyboardMap, handleKeyboardNoteInput, canScoreNow]);

  // Tempo-based performance timeline
  const schedulePerformanceTimeline = useCallback(() => {
    const pattern = currentPatternRef.current;
    if (
      !pattern ||
      !Array.isArray(pattern.notes) ||
      pattern.notes.length === 0
    ) {
      console.warn("No pattern available for performance timeline");
      return;
    }
    if (gamePhaseRef.current !== GAME_PHASES.PERFORMANCE) {
      console.warn(
        "schedulePerformanceTimeline called outside of performance phase",
        {
          phase: gamePhaseRef.current,
        }
      );
      return;
    }

    // Clear any existing timeouts (legacy) + RAF (audio-driven timeline)
    performanceTimeoutsRef.current.forEach((id) => clearTimeout(id));
    performanceTimeoutsRef.current = [];
    if (performanceTimelineRafRef.current) {
      cancelAnimationFrame(performanceTimelineRafRef.current);
      performanceTimelineRafRef.current = null;
    }
    performanceTimelineIdxRef.current = -1;

    const allEvents = pattern.notes; // Both notes and rests

    // IMPORTANT: Miss logic must align with scoring windows. Scoring allows late hits up to NOTE_LATE_MS,
    // so recording a miss earlier than that can incorrectly label an on-time (late-but-allowed) hit as missed.
    const missToleranceMs = NOTE_LATE_MS;

    // Audio-clock-driven timeline: avoids wall-clock drift causing false misses.
    const tick = () => {
      if (gamePhaseRef.current !== GAME_PHASES.PERFORMANCE) {
        performanceTimelineRafRef.current = null;
        return;
      }

      const elapsedMs = getElapsedMsFromPerformanceStart();

      // Update current event index (notes + rests) based on elapsed time.
      let activeIdx = -1;
      for (let i = 0; i < allEvents.length; i++) {
        const ev = allEvents[i];
        const startMs = (ev.startTime || 0) * 1000;
        const endMs = (ev.endTime || ev.startTime || 0) * 1000;
        if (elapsedMs >= startMs && elapsedMs < endMs) {
          activeIdx = i;
          break;
        }
        if (elapsedMs >= startMs) {
          activeIdx = i;
        }
      }
      if (activeIdx !== -1 && activeIdx !== performanceTimelineIdxRef.current) {
        performanceTimelineIdxRef.current = activeIdx;
        setCurrentNoteIndex(activeIdx);
      }

      // Record misses (notes only) once elapsed is past the *scoring window end* (preferred),
      // or note end + tolerance as a fallback.
      for (let i = 0; i < allEvents.length; i++) {
        const ev = allEvents[i];
        if (ev.type !== "note") continue;
        const endMs = (ev.endTime || ev.startTime || 0) * 1000;
        const windowEndMs =
          typeof timingWindowsRef.current?.[i]?.windowEnd === "number"
            ? timingWindowsRef.current[i].windowEnd
            : endMs + missToleranceMs;
        if (elapsedMs < windowEndMs) continue;
        const already = performanceResultsRef.current.some(
          (r) => r.noteIndex === i
        );
        if (already) continue;

        const wrongPitchSeen = Boolean(wrongPitchSeenRef.current?.[i]);
        const timingStatusToRecord = wrongPitchSeen ? "wrong_pitch" : "missed";
        const detectedToRecord = wrongPitchSeen
          ? (lastWrongPitchRef.current?.[i] ?? null)
          : null;

        const missed = {
          noteIndex: i,
          expected: ev.pitch,
          detected: detectedToRecord,
          frequency: -1,
          timingStatus: timingStatusToRecord,
          timeDiff: 0,
          isCorrect: false,
          timestamp: Date.now(),
          phase: GAME_PHASES.PERFORMANCE,
        };

        // #region agent log
        __srLog({
          sessionId: "debug-session",
          runId: "timeline-audio-pre",
          hypothesisId: "Hwall",
          location:
            "src/components/games/sight-reading-game/SightReadingGame.jsx:schedulePerformanceTimeline",
          message: "timeline.recordMissed",
          data: {
            noteIndex: i,
            expected: ev.pitch ?? null,
            timingStatus: timingStatusToRecord,
            wrongPitchSeen,
            elapsedMs: Math.round(elapsedMs),
            noteEndMs: Math.round(endMs),
            windowEndMs: Math.round(windowEndMs),
            missToleranceMs,
          },
          timestamp: Date.now(),
        });
        // #endregion

        recordPerformanceResult(missed);
        // Clear wrong-pitch tracking once this note is finalized.
        wrongPitchSeenRef.current[i] = false;
        lastWrongPitchRef.current[i] = null;
      }

      // Completion check: once elapsed past last event end + tolerance.
      const last = allEvents[allEvents.length - 1];
      const lastEndMs =
        (last?.endTime || last?.startTime || 0) * 1000 + missToleranceMs;
      if (elapsedMs >= lastEndMs) {
        // #region agent log
        __srLog({
          sessionId: "debug-session",
          runId: "stuck-perf-pre",
          hypothesisId: "Htimeline",
          location:
            "src/components/games/sight-reading-game/SightReadingGame.jsx:schedulePerformanceTimeline",
          message: "timeline.complete.trigger",
          data: {
            elapsedMs: Math.round(elapsedMs),
            lastEndMs: Math.round(lastEndMs),
            audioNow: audioEngine.getCurrentTime(),
          },
          timestamp: Date.now(),
        });
        // #endregion
        completePerformance();
        performanceTimelineRafRef.current = null;
        return;
      }

      performanceTimelineRafRef.current = requestAnimationFrame(tick);
    };

    performanceTimelineRafRef.current = requestAnimationFrame(tick);
  }, [
    completePerformance,
    getElapsedMsFromPerformanceStart,
    recordPerformanceResult,
  ]);

  const loadExercisePattern = useCallback(
    async () => {
      try {
        audioEngine.stopScheduler();
        rhythmPlayback.stop();
        stopMetronomePlayback();
        setShowKeyboard(inputMode === "keyboard");

        const pattern = await generatePattern(
          gameSettings.difficulty,
          gameSettings.timeSignature,
          gameSettings.tempo,
          gameSettings.selectedNotes,
          gameSettings.clef,
          gameSettings.measuresPerPattern || 1
        );

        setCurrentPattern(pattern);
        currentPatternRef.current = pattern;
        setCurrentNoteIndex(0);
        setPerformanceResults([]);
        performanceResultsRef.current = [];
        lastDetectionTimesRef.current = {};
        wrongPitchSeenRef.current = {};
        lastWrongPitchRef.current = {};
        setDetectedPitches([]);
        setTimingState(TIMING_STATE.OFF);
        guessPenaltyRef.current = 0;
        setSummaryStats(null);
        setShowPenaltyModal(false);
        penaltyLockRef.current = false;
        setScoreSubmitted(false);
        setScoreSyncStatus("idle");
        setExerciseRecorded(false);

        setGamePhase(GAME_PHASES.DISPLAY);

        setTimeout(() => {
          rhythmPlayback.play(pattern.notes, (index) => {
            setCurrentNoteIndex(index);
          });
        }, 500);
      } catch (error) {
        console.error("Error loading exercise pattern:", error);
      }
    },
    // Deliberately omit stopMetronomePlayback: it's a stable callback (empty deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameSettings, generatePattern, audioEngine, rhythmPlayback, inputMode]
  );

  const tickMetronome = useCallback(() => {
    const beatsPerMeasure = gameSettings.timeSignature?.beats || 4;
    const isDownbeat = metronomeBeatRef.current % beatsPerMeasure === 0;
    metronomeBeatRef.current += 1;
    audioEngine.createMetronomeClick(
      audioEngine.getCurrentTime() + 0.01,
      isDownbeat
    );
  }, [audioEngine, gameSettings.timeSignature?.beats]);

  const startMetronomePlayback = useCallback(
    (startAtAudioTime = null) => {
      if (metronomeIntervalRef.current) {
        return;
      }
      const startToken = (metronomeStartTokenRef.current += 1);
      ensureAudioContextRunning().then((resumed) => {
        if (!resumed) {
          return;
        }
        // If phase/toggle changed while awaiting audio context resume, bail.
        if (
          startToken !== metronomeStartTokenRef.current ||
          !metronomeEnabledRef.current ||
          gamePhaseRef.current !== GAME_PHASES.PERFORMANCE
        ) {
          return;
        }
        metronomeBeatRef.current = 0;
        const intervalMs = (60 / (gameSettings.tempo || 80)) * 1000;

        // If we have a known target start (performance start), align the first click to it.
        if (typeof startAtAudioTime === "number" && startAtAudioTime > 0) {
          metronomeNextClickTimeRef.current = startAtAudioTime + 0.01;
          // #region agent log
          __srLog({
            sessionId: "debug-session",
            runId: "metronome-align-pre",
            hypothesisId: "Hbeat",
            location:
              "src/components/games/sight-reading-game/SightReadingGame.jsx:startMetronomePlayback",
            message: "metronome.startAligned",
            data: {
              startAtAudioTime,
              firstClickAt: metronomeNextClickTimeRef.current,
              audioNow: audioEngine.getCurrentTime(),
              intervalMs,
            },
            timestamp: Date.now(),
          });
          // #endregion
          audioEngine.createMetronomeClick(
            metronomeNextClickTimeRef.current,
            true
          );
          metronomeBeatRef.current = 1;
        } else {
          tickMetronome();
        }

        metronomeIntervalRef.current = setInterval(() => {
          // Stop scheduling immediately if we leave performance or toggle off.
          if (
            !metronomeEnabledRef.current ||
            gamePhaseRef.current !== GAME_PHASES.PERFORMANCE
          ) {
            stopMetronomePlayback();
            return;
          }
          if (typeof metronomeNextClickTimeRef.current === "number") {
            const beatsPerMeasure = gameSettings.timeSignature?.beats || 4;
            const isDownbeat = metronomeBeatRef.current % beatsPerMeasure === 0;
            metronomeBeatRef.current += 1;
            metronomeNextClickTimeRef.current += intervalMs / 1000;
            audioEngine.createMetronomeClick(
              metronomeNextClickTimeRef.current,
              isDownbeat
            );
          } else {
            tickMetronome();
          }
        }, intervalMs);
      });
    },
    [
      ensureAudioContextRunning,
      gameSettings.tempo,
      gameSettings.timeSignature?.beats,
      tickMetronome,
      stopMetronomePlayback,
      audioEngine,
    ]
  );

  // Safety cleanup: never leave an interval running after unmount.
  useEffect(() => {
    return () => {
      stopMetronomePlayback();
    };
  }, [stopMetronomePlayback]);

  useEffect(() => {
    if (metronomeEnabled && gamePhase === GAME_PHASES.PERFORMANCE) {
      startMetronomePlayback(performanceStartAudioTimeRef.current);
    } else {
      stopMetronomePlayback();
    }
  }, [
    metronomeEnabled,
    gamePhase,
    startMetronomePlayback,
    stopMetronomePlayback,
  ]);

  useEffect(() => {
    if (gamePhase !== GAME_PHASES.PERFORMANCE) {
      resetPerformanceLiveState();
    }
  }, [gamePhase, resetPerformanceLiveState]);

  useEffect(() => {
    if (METRONOME_TIMING_DEBUG) {
      console.debug("[ScoreSyncStatus]", {
        scoreSyncStatus,
      });
    }
  }, [scoreSyncStatus]);

  const handleNextExercise = useCallback(() => {
    if (isSessionComplete) {
      return;
    }
    stopMetronomePlayback();
    // Record the exercise result when moving to next (not on Try Again)
    if (summaryStats && !exerciseRecorded) {
      recordSessionExercise(
        summaryStats.overallScore ?? 0,
        SESSION_MAX_EXERCISE_SCORE
      );
      setExerciseRecorded(true);
    }
    goToNextExercise();
    loadExercisePattern();
  }, [
    loadExercisePattern,
    goToNextExercise,
    isSessionComplete,
    summaryStats,
    exerciseRecorded,
    recordSessionExercise,
    stopMetronomePlayback,
  ]);

  const handleStartNewSession = useCallback(() => {
    stopMetronomePlayback();
    resetSession();
    startSession();
    loadExercisePattern();
  }, [loadExercisePattern, resetSession, startSession, stopMetronomePlayback]);

  /**
   * Replay the same pattern (Try Again)
   */
  const replayPattern = useCallback(() => {
    if (!currentPattern) return;

    stopCountInVisualization();
    stopMetronomePlayback();
    // Reset states
    setCurrentNoteIndex(0);
    setPerformanceResults([]);
    performanceResultsRef.current = [];
    setDetectedPitches([]);
    setTimingState(TIMING_STATE.OFF);
    guessPenaltyRef.current = 0;
    setSummaryStats(null);
    setShowPenaltyModal(false);
    penaltyLockRef.current = false;
    setScoreSubmitted(false);
    setScoreSyncStatus("idle");
    setShowKeyboard(inputMode === "keyboard");
    setExerciseRecorded(false);

    // Go back to display phase to show pattern before count-in
    setGamePhase(GAME_PHASES.DISPLAY);
  }, [
    currentPattern,
    stopCountInVisualization,
    inputMode,
    stopMetronomePlayback,
  ]);

  const handlePenaltyTryAgain = useCallback(() => {
    setShowPenaltyModal(false);
    penaltyLockRef.current = false;
    replayPattern();
  }, [replayPattern]);

  /**
   * Return to setup screen
   */
  const returnToSetup = useCallback(() => {
    // Stop any audio
    audioEngine.stopScheduler();
    rhythmPlayback.stop();
    stopCountInVisualization();

    // Reset states
    setCurrentPattern(null);
    currentPatternRef.current = null;
    setCurrentNoteIndex(-1);
    setPerformanceResults([]);
    performanceResultsRef.current = [];
    setDetectedPitches([]);
    setTimingState(TIMING_STATE.OFF);
    guessPenaltyRef.current = 0;
    setSummaryStats(null);
    setShowPenaltyModal(false);
    penaltyLockRef.current = false;
    setScoreSubmitted(false);
    setScoreSyncStatus("idle");
    setExerciseRecorded(false);

    resetSession();
    startSession();

    // Return to setup
    setGamePhase(GAME_PHASES.SETUP);
  }, [
    audioEngine,
    rhythmPlayback,
    stopCountInVisualization,
    resetSession,
    startSession,
  ]);

  // Count-in complete handler
  const handleCountInComplete = useCallback(async () => {
    if (gamePhaseRef.current !== GAME_PHASES.COUNT_IN) {
      logMetronomeTiming("handleCountInComplete ignored", {
        reason: "not in count-in phase",
        phase: gamePhaseRef.current,
      });
      return;
    }

    clearCountInTimeouts();

    // Guard: if count-in completion is triggered while AudioContext time is still
    // behind the scheduled end, wait until the audio clock reaches the target.
    // This prevents large negative drift when the audio clock stalls/resumes.
    const scheduledEndAudio = countInEndAudioTimeRef.current;
    if (typeof scheduledEndAudio === "number") {
      const audioNow = audioEngine.getCurrentTime();
      if (audioNow + COUNT_IN_AUDIO_GUARD_EARLY_MS / 1000 < scheduledEndAudio) {
        // #region agent log
        __srLog({
          sessionId: "debug-session",
          runId: "mic-latency-pre2",
          hypothesisId: "Hsync",
          location:
            "src/components/games/sight-reading-game/SightReadingGame.jsx:handleCountInComplete",
          message: "countIn.complete.guardSuggestWait",
          data: {
            scheduledEndAudio,
            audioNow,
            remainingMs: Math.round((scheduledEndAudio - audioNow) * 1000),
          },
          timestamp: Date.now(),
        });
        // #endregion
        if (countInRafRef.current.completion) {
          cancelAnimationFrame(countInRafRef.current.completion);
        }
        const waitUntilAudioCatchesUp = () => {
          if (gamePhaseRef.current !== GAME_PHASES.COUNT_IN) {
            countInRafRef.current.completion = null;
            return;
          }
          if (audioEngine.getCurrentTime() >= scheduledEndAudio) {
            countInRafRef.current.completion = null;
            handleCountInComplete();
            return;
          }
          countInRafRef.current.completion = requestAnimationFrame(
            waitUntilAudioCatchesUp
          );
        };
        countInRafRef.current.completion = requestAnimationFrame(
          waitUntilAudioCatchesUp
        );
        return;
      }
    }

    // Ensure we have a scheduled performance start time established earlier
    const now = Date.now();
    let scheduledTarget = wallClockStartTimeRef.current;
    if (typeof scheduledTarget !== "number") {
      scheduledTarget = now;
      wallClockStartTimeRef.current = now;
    }
    // #region agent log
    __srLog({
      sessionId: "debug-session",
      runId: "mic-latency-pre2",
      hypothesisId: "Hsync",
      location:
        "src/components/games/sight-reading-game/SightReadingGame.jsx:handleCountInComplete",
      message: "countIn.complete.callback",
      data: {
        scheduledWallStartMs: scheduledTarget,
        scheduledWallStartMsRef: countInEndWallClockMsRef.current,
        scheduledAudioEnd: countInEndAudioTimeRef.current,
        nowWallMs: now,
        driftWallMs:
          typeof scheduledTarget === "number" ? now - scheduledTarget : null,
        audioNow: audioEngine.getCurrentTime(),
        audioDriftMs:
          typeof countInEndAudioTimeRef.current === "number"
            ? Math.round(
                (audioEngine.getCurrentTime() -
                  countInEndAudioTimeRef.current) *
                  1000
              )
            : null,
      },
      timestamp: Date.now(),
    });
    // #endregion
    logMetronomeTiming("handleCountInComplete invoked", {
      scheduledStart: scheduledTarget,
      actualCallback: now,
      driftMs: now - scheduledTarget,
      audioContextTime: audioEngine.getCurrentTime(),
    });

    // IMPORTANT: Do NOT re-base performance start to callback wall time.
    // Use the scheduled count-in end (wall + audio) so scoring aligns with metronome.
    if (typeof countInEndWallClockMsRef.current === "number") {
      wallClockStartTimeRef.current = countInEndWallClockMsRef.current;
    } else {
      wallClockStartTimeRef.current = scheduledTarget;
    }
    if (typeof countInEndAudioTimeRef.current === "number") {
      performanceStartAudioTimeRef.current = countInEndAudioTimeRef.current;
    } else {
      performanceStartAudioTimeRef.current = audioEngine.getCurrentTime();
    }

    // Downbeat click exactly at performance start so beat 1 is audible.
    // If the guide metronome is enabled, it will schedule this downbeat itself.
    if (PLAY_PERFORMANCE_DOWNBEAT_CLICK && !metronomeEnabled) {
      const downbeatAt = performanceStartAudioTimeRef.current + 0.01;
      audioEngine.createMetronomeClick(downbeatAt, true);
      // #region agent log
      __srLog({
        sessionId: "debug-session",
        runId: "metronome-align-pre",
        hypothesisId: "Hbeat",
        location:
          "src/components/games/sight-reading-game/SightReadingGame.jsx:handleCountInComplete",
        message: "performance.downbeatClickScheduled",
        data: {
          downbeatAt,
          performanceStartAudioTime: performanceStartAudioTimeRef.current,
          audioNow: audioEngine.getCurrentTime(),
          metronomeEnabled,
        },
        timestamp: Date.now(),
      });
      // #endregion

      if (AUDIO_OUTPUT_LATENCY_COMP_DEBUG) {
        const ctx = audioEngine.audioContextRef?.current;
        const outputLatencyMs =
          typeof ctx?.outputLatency === "number"
            ? Math.round(ctx.outputLatency * 1000)
            : null;
        const baseLatencyMs =
          typeof ctx?.baseLatency === "number"
            ? Math.round(ctx.baseLatency * 1000)
            : null;
        // #region agent log
        __srLog({
          sessionId: "debug-session",
          runId: "audio-latency-pre",
          hypothesisId: "Hout",
          location:
            "src/components/games/sight-reading-game/SightReadingGame.jsx:handleCountInComplete",
          message: "audioContext.latency",
          data: {
            outputLatencyMs,
            baseLatencyMs,
            sampleRate:
              typeof ctx?.sampleRate === "number" ? ctx.sampleRate : null,
            state: typeof ctx?.state === "string" ? ctx.state : null,
            metronomeEnabled,
          },
          timestamp: Date.now(),
        });
        // #endregion
      }
    }

    stopCountInVisualization();
    gamePhaseRef.current = GAME_PHASES.PERFORMANCE;
    flushSync(() => {
      setGamePhase(GAME_PHASES.PERFORMANCE);
    });
    // Note: timing state is already EARLY_WINDOW from count-in, will transition to LIVE via schedulePerformanceLiveActivation
    resetPerformanceLiveState();

    schedulePerformanceLiveActivation();
    // Defer timeline scheduling to the next frame so Safari can paint the phase flip first.
    requestAnimationFrame(() => {
      if (gamePhaseRef.current !== GAME_PHASES.PERFORMANCE) return;
      try {
        schedulePerformanceTimeline();
      } catch (error) {
        // #region agent log
        __srLog({
          sessionId: "debug-session",
          runId: "timeline-audio-pre",
          hypothesisId: "Hwall",
          location:
            "src/components/games/sight-reading-game/SightReadingGame.jsx:handleCountInComplete",
          message: "timeline.error",
          data: { error: String(error?.message || error) },
          timestamp: Date.now(),
        });
        // #endregion
      }
    });

    if (metronomeEnabled) {
      startMetronomePlayback(performanceStartAudioTimeRef.current);
    }

    // Only start microphone if mic input mode is selected (do not block performance start)
    if (inputMode === "mic") {
      // If we already requested mic start in the EARLY_WINDOW during COUNT_IN, don't double-request here.
      if (micEarlyWindowStartRequestedRef.current) {
        return;
      }
      // #region agent log
      __srLog({
        sessionId: "debug-session",
        runId: "mic-start-fix-pre",
        hypothesisId: "Hstart",
        location:
          "src/components/games/sight-reading-game/SightReadingGame.jsx:handleCountInComplete",
        message: "mic.startListening.requested",
        data: {
          nowWallMs: Date.now(),
          audioNow: audioEngine.getCurrentTime(),
          phase: gamePhaseRef.current,
        },
        timestamp: Date.now(),
      });
      // #endregion
      startListening()
        .then(() => {
          // #region agent log
          __srLog({
            sessionId: "debug-session",
            runId: "mic-start-fix-pre",
            hypothesisId: "Hstart",
            location:
              "src/components/games/sight-reading-game/SightReadingGame.jsx:handleCountInComplete",
            message: "mic.startListening.resolved",
            data: {
              nowWallMs: Date.now(),
              audioNow: audioEngine.getCurrentTime(),
              phase: gamePhaseRef.current,
            },
            timestamp: Date.now(),
          });
          // #endregion
        })
        .catch((error) => {
          console.error("❌ Failed to start microphone:", error);
          setShowMicPermissionPrompt(true);
          // Fall back to display mode
          setGamePhase(GAME_PHASES.DISPLAY);
        });
    }
  }, [
    audioEngine,
    inputMode,
    startListening,
    schedulePerformanceTimeline,
    stopCountInVisualization,
    clearCountInTimeouts,
    schedulePerformanceLiveActivation,
    resetPerformanceLiveState,
    metronomeEnabled,
    startMetronomePlayback,
  ]);

  /**
   * Begin performance with an existing pattern (no pattern generation)
   * Used when restarting from DISPLAY phase ("Start Playing" button)
   */
  const beginPerformanceWithPattern = useCallback(async () => {
    const pattern = currentPatternRef.current;

    if (!pattern) {
      console.error("❌ No pattern available to begin performance");
      return;
    }

    try {
      // Reset mic warm-up flag for THIS performance.
      // Without this, the second exercise / Try Again path can skip calling startListening()
      // (because the EARLY_WINDOW start in the previous run set the flag to true).
      micEarlyWindowStartRequestedRef.current = false;
      pendingMicLatencyMsRef.current = null;
      // Resume audio context (required after user interaction)
      const resumed = await audioEngine.resumeAudioContext();

      if (!audioEngine.isReady()) {
        throw new Error(
          "Audio engine failed to initialize. Please refresh the page and try again."
        );
      }

      // Reset state for new performance
      setCurrentBeat(0);
      setCurrentNoteIndex(0);
      setPerformanceResults([]);
      performanceResultsRef.current = [];
      lastDetectionTimesRef.current = {};
      setDetectedPitches([]);

      // Start count-in phase
      resetPerformanceLiveState();
      setGamePhase(GAME_PHASES.COUNT_IN);

      // Ensure audio context is running before scheduling
      await ensureAudioContextRunning();
      // On iOS Safari, avoid blocking up to ~1s on stability checks right after tap,
      // since it creates a visible delay before anything is scheduled.
      // Still do a quick nudge to resume if the audio clock isn't advancing.
      const clockReady = isIOSSafari
        ? (await verifyAudioClockProgressFast()).delta >= 0.001
        : await waitForStableAudioClock();
      logMetronomeTiming("audio clock ready for scheduling", {
        clockReady,
      });

      // Use simple direct scheduling like Rhythm Master
      const audioNow = audioEngine.getCurrentTime();
      const countInStartTime = audioNow + 0.1;
      const beatDuration = 60 / pattern.tempo; // in seconds
      const beatsPerMeasure = gameSettings.timeSignature?.beats || 4;
      const beatDurationMs = beatDuration * 1000;
      const countInDurationMs = beatsPerMeasure * beatDurationMs;
      const countInDurationSeconds = countInDurationMs / 1000;
      const startDelayMs = Math.max(
        0,
        (countInStartTime - audioEngine.getCurrentTime()) * 1000
      );
      const countInEndAudioTime = countInStartTime + countInDurationSeconds;
      const countInEndWallClockMs =
        Date.now() + startDelayMs + countInDurationMs;

      // Set unified timing references
      audioStartTimeRef.current = countInStartTime;
      wallClockStartTimeRef.current = countInEndWallClockMs;
      countInEndAudioTimeRef.current = countInEndAudioTime;
      countInEndWallClockMsRef.current = countInEndWallClockMs;
      performanceStartAudioTimeRef.current = countInEndAudioTime;

      // #region agent log
      __srLog({
        sessionId: "debug-session",
        runId: "mic-latency-pre2",
        hypothesisId: "Hsync",
        location:
          "src/components/games/sight-reading-game/SightReadingGame.jsx:beginPerformanceWithPattern",
        message: "countIn.scheduled",
        data: {
          tempo: pattern?.tempo ?? null,
          beatsPerMeasure,
          beatDurationMs: Math.round(beatDurationMs),
          audioNow: audioEngine.getCurrentTime(),
          countInStartTime,
          countInEndAudioTime,
          startDelayMs: Math.round(startDelayMs),
          countInEndWallClockMs,
        },
        timestamp: Date.now(),
      });
      // #endregion

      logMetronomeTiming("count-in scheduled", {
        countInStartTime,
        beatDuration,
        beatDurationMs,
        audioNow: audioEngine.getCurrentTime(),
      });

      if (METRONOME_TIMING_DEBUG) {
        const debugPayload = {
          tempo: pattern.tempo,
          beats: beatsPerMeasure,
          beatDuration,
          startTime: countInStartTime,
        };
        logMetronomeTiming("count-in configuration", debugPayload);
      }
      startCountInVisualization(
        countInStartTime,
        beatsPerMeasure,
        beatDuration
      );

      // Schedule all 4 count-in beats directly
      for (let i = 0; i < beatsPerMeasure; i++) {
        const beatTime = countInStartTime + i * beatDuration;
        const isDownbeat = i === 0;

        if (METRONOME_TIMING_DEBUG) {
          const debugPayload = {
            beat: i + 1,
            beatTime,
            beatDurationMs,
            audioNow: audioEngine.getCurrentTime(),
          };
          logMetronomeTiming("scheduling metronome beat", debugPayload);
        }
        audioEngine.createMetronomeClick(beatTime, isDownbeat);
      }

      // Transition to performance phase after count-in
      if (METRONOME_TIMING_DEBUG) {
        const debugPayload = {
          startDelayMs,
          countInEndWallClockMs,
        };
        logMetronomeTiming("transition to performance scheduled", debugPayload);
      }

      // Enable scoring slightly before count-in completes (aligned with first-note tolerance)
      const earlyWindowMs = Math.min(FIRST_NOTE_EARLY_MS, beatDurationMs * 0.8);
      clearCountInTimeouts();

      // IMPORTANT: Gate transitions on AudioContext time (not wall-clock timeouts).
      // AudioContext can stall/resume; setTimeout can't track that, causing drift.
      const scoringTargetAudioTime = countInEndAudioTime - earlyWindowMs / 1000;
      const tickScoringGate = () => {
        if (gamePhaseRef.current !== GAME_PHASES.COUNT_IN) {
          countInRafRef.current.scoring = null;
          return;
        }
        const audioNowGate = audioEngine.getCurrentTime();
        if (audioNowGate >= scoringTargetAudioTime) {
          countInRafRef.current.scoring = null;
          // If mic mode: start mic as soon as the EARLY_WINDOW opens (still COUNT_IN).
          // This avoids missing the first note when the player enters slightly early/on-downbeat,
          // since `startListening()` can take ~200-400ms to resolve on some devices.
          if (inputMode === "mic" && !micEarlyWindowStartRequestedRef.current) {
            micEarlyWindowStartRequestedRef.current = true;
            // #region agent log
            __srLog({
              sessionId: "debug-session",
              runId: "mic-warmup-pre",
              hypothesisId: "Hfirst",
              location:
                "src/components/games/sight-reading-game/SightReadingGame.jsx:beginPerformanceWithPattern",
              message: "mic.earlyWindow.startListening.requested",
              data: {
                audioNow: audioEngine.getCurrentTime(),
                scoringTargetAudioTime,
                phase: gamePhaseRef.current,
                timingState: timingStateRef.current,
              },
              timestamp: Date.now(),
            });
            // #endregion
            startListening()
              .then(() => {
                // #region agent log
                __srLog({
                  sessionId: "debug-session",
                  runId: "mic-warmup-pre",
                  hypothesisId: "Hfirst",
                  location:
                    "src/components/games/sight-reading-game/SightReadingGame.jsx:beginPerformanceWithPattern",
                  message: "mic.earlyWindow.startListening.resolved",
                  data: {
                    audioNow: audioEngine.getCurrentTime(),
                    phase: gamePhaseRef.current,
                    timingState: timingStateRef.current,
                  },
                  timestamp: Date.now(),
                });
                // #endregion
              })
              .catch(() => {});
          }
          setTimingStateSync(TIMING_STATE.EARLY_WINDOW);
          logMetronomeTiming("scoring window opened", {
            earlyWindowMs,
            audioContextTime: audioNowGate,
            scoringTargetAudioTime,
          });
          logFirstNoteDebug("early window opened", {
            earlyWindowMs,
            firstNoteTolerance: FIRST_NOTE_EARLY_MS,
            beatDurationMs,
          });
          return;
        }
        countInRafRef.current.scoring = requestAnimationFrame(tickScoringGate);
      };
      countInRafRef.current.scoring = requestAnimationFrame(tickScoringGate);

      const tickCompletionGate = () => {
        if (gamePhaseRef.current !== GAME_PHASES.COUNT_IN) {
          countInRafRef.current.completion = null;
          return;
        }
        const audioNowGate = audioEngine.getCurrentTime();
        if (audioNowGate >= countInEndAudioTime) {
          // #region agent log
          __srLog({
            sessionId: "debug-session",
            runId: "mic-latency-pre2",
            hypothesisId: "Hsync",
            location:
              "src/components/games/sight-reading-game/SightReadingGame.jsx:beginPerformanceWithPattern",
            message: "countIn.gate.completionReached",
            data: {
              audioNow: audioNowGate,
              countInEndAudioTime,
              driftMs: Math.round((audioNowGate - countInEndAudioTime) * 1000),
            },
            timestamp: Date.now(),
          });
          // #endregion
          countInRafRef.current.completion = null;
          stopCountInVisualization();
          logMetronomeTiming("count-in complete", {
            audioContextTime: audioNowGate,
            countInEndAudioTime,
          });
          setCurrentBeat(0); // Reset beat counter
          clearCountInTimeouts();
          handleCountInComplete();
          return;
        }
        countInRafRef.current.completion =
          requestAnimationFrame(tickCompletionGate);
      };
      countInRafRef.current.completion =
        requestAnimationFrame(tickCompletionGate);
    } catch (error) {
      console.error("Error beginning performance:", error);
      alert(error.message || "Failed to start performance. Please try again.");
      setGamePhase(GAME_PHASES.DISPLAY);
      audioEngine.stopScheduler();
    }
  }, [
    audioEngine,
    ensureAudioContextRunning,
    handleCountInComplete,
    waitForStableAudioClock,
    verifyAudioClockProgressFast,
    startCountInVisualization,
    stopCountInVisualization,
    clearCountInTimeouts,
    gameSettings.timeSignature?.beats,
    resetPerformanceLiveState,
  ]);

  /**
   * Start game from SETUP phase (generates new pattern)
   */
  const startGame = useCallback(
    async (overrideSettings = null) => {
      const currentSettings = overrideSettings || gameSettings;

      if (overrideSettings) {
        setGameSettings(overrideSettings);
      }

      try {
        // Resume audio context (required after user interaction)
        const resumed = await audioEngine.resumeAudioContext();

        if (!audioEngine.isReady()) {
          throw new Error(
            "Audio engine failed to initialize. Please refresh the page and try again."
          );
        }

        // Generate pattern with selected notes and clef
        const pattern = await generatePattern(
          currentSettings.difficulty,
          currentSettings.timeSignature,
          currentSettings.tempo,
          currentSettings.selectedNotes,
          currentSettings.clef,
          currentSettings.measuresPerPattern || 1
        );

        // Use flushSync to ensure pattern state updates complete BEFORE phase transition
        // This prevents StrictMode double-rendering issues where VexFlow sees undefined pattern
        flushSync(() => {
          setCurrentPattern(pattern);
          currentPatternRef.current = pattern;
          setCurrentNoteIndex(0);
          setPerformanceResults([]);
          performanceResultsRef.current = [];
          lastDetectionTimesRef.current = {};
          wrongPitchSeenRef.current = {};
          lastWrongPitchRef.current = {};
          setDetectedPitches([]);
          setTimingState(TIMING_STATE.OFF);
          guessPenaltyRef.current = 0;
          setExerciseRecorded(false);
        });

        // Now that pattern is definitely set, transition to display phase
        setGamePhase(GAME_PHASES.DISPLAY);
      } catch (error) {
        console.error("Error starting game:", error);
        alert(error.message || "Failed to start game. Please try again.");
        setGamePhase(GAME_PHASES.SETUP);
        audioEngine.stopScheduler();
        rhythmPlayback.stop();
      }
    },
    [gameSettings, audioEngine, generatePattern, rhythmPlayback]
  );

  // Enforce phase-specific mic behavior (PRD-aligned)
  useEffect(() => {
    // Only enforce mic behavior if mic input mode is selected
    if (inputMode !== "mic") {
      // In keyboard mode, ensure mic is stopped
      if (isListening) {
        stopListening();
      }
      return;
    }

    // PRD rules (only applies when inputMode === "mic"):
    // - SETUP: Mic allowed for Test Microphone only (not controlled by this effect)
    // - COUNT_IN: Mic must be OFF (no pitch detection)
    // - PERFORMANCE: Mic ON (controlled by handleCountInComplete, not this effect)
    // - DISPLAY/FEEDBACK: Mic OFF

    switch (gamePhase) {
      case GAME_PHASES.SETUP:
        // Don't interfere with Test Microphone in PreGameSetup
        break;

      case GAME_PHASES.COUNT_IN:
        // During COUNT_IN we generally keep mic OFF, *except* for the EARLY_WINDOW pre-roll
        // where scoring can begin (see canScoreNow). We start mic there to avoid missing
        // the first note due to startListening() latency.
        if (
          timingStateRef.current !== TIMING_STATE.EARLY_WINDOW &&
          isListening
        ) {
          stopListening();
        }
        break;

      case GAME_PHASES.PERFORMANCE:
        // Mic is started by handleCountInComplete, don't interfere here
        // CRITICAL: Do NOT call stopListening here!
        break;

      case GAME_PHASES.DISPLAY:
      case GAME_PHASES.FEEDBACK:
        // Stop mic when displaying results or feedback
        if (isListening) {
          stopListening();
        }
        break;

      default:
        break;
    }
  }, [gamePhase, inputMode, stopListening, isListening]);

  // Debug logging for performance phase

  // Cleanup on unmount only (not on every isListening change)
  useEffect(() => {
    return () => {
      stopListening();
      performanceTimeoutsRef.current.forEach((id) => clearTimeout(id));
      performanceTimeoutsRef.current = [];
      audioEngine.stopScheduler();
      rhythmPlayback.stop();
      stopMetronomePlayback();
      if (performanceLiveTimeoutRef.current) {
        clearTimeout(performanceLiveTimeoutRef.current);
        performanceLiveTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopMetronomePlayback]);

  // Show setup screen
  if (gamePhase === GAME_PHASES.SETUP) {
    return (
      <PreGameSetup
        settings={gameSettings}
        onUpdateSettings={setGameSettings}
        onStart={startGame}
        micStatus={{
          isListening,
          audioLevel,
          startListening,
          stopListening,
        }}
      />
    );
  }

  if (showVictoryScreen) {
    return (
      <div className="flex min-h-screen flex-col overflow-y-auto bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        <VictoryScreen
          score={Math.round(sessionTotalScore)}
          totalPossibleScore={Math.max(1, totalPossibleSessionScore)}
          onReset={handleStartNewSession}
          timedMode={false}
          timeRemaining={0}
          initialTime={0}
          onExit={() => navigate("/practice-modes")}
        />
      </div>
    );
  }

  if (showEncouragementScreen) {
    return (
      <div className="flex min-h-screen flex-col overflow-y-auto bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
          <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-white/40 bg-white/95 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
                Session Complete
              </p>
              <h2 className="bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                Keep Going!
              </h2>
              <p className="text-base text-gray-600 sm:text-lg">
                You finished all 10 exercises. You&apos;re only a few points
                away from unlocking the victory celebration.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-purple-100 bg-gradient-to-r from-white via-purple-50 to-white p-4 shadow-inner sm:p-5">
              <p className="text-4xl font-black text-purple-700">
                {sessionPercentageDisplay}
                <span className="text-2xl font-semibold text-purple-400">
                  %
                </span>
              </p>
              <p className="text-sm font-semibold uppercase tracking-widest text-purple-400">
                Final Score
              </p>
              <p className="text-sm text-gray-600">
                {sessionScoreSummary} total points &bull; Aim for 70% (700/1000)
                to achieve victory.
              </p>
            </div>

            <p className="text-sm text-gray-600 sm:text-base">
              Each attempt builds confidence and accuracy. Take a breath, reset,
              and try again - your next run could be the winning one!
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                onClick={handleStartNewSession}
                className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 font-semibold text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-[1.01]"
              >
                Try Again
              </button>
              <button
                onClick={returnToSetup}
                className="flex-1 rounded-2xl border border-indigo-200 bg-white py-3 font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                Change Settings
              </button>
              <button
                onClick={() => navigate("/practice-modes")}
                className="flex-1 rounded-2xl border border-transparent py-3 font-semibold text-indigo-700 hover:text-indigo-900"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // #region SightReading UI layout fragments (Phase 1 extraction)
  // This block deliberately keeps *all* game logic inside SightReadingGame.
  // We only extract JSX subtrees into named "regions" so a future `SightReadingLayout`
  // component can own layout/overflow decisions (Phase 2+), while this file remains
  // the single source of truth for state, handlers, and phase transitions.
  //
  // Scroll contract (Phase 0 principle):
  // - Desktop (>= md): route should behave like a fixed `h-screen` view (no page scroll).
  // - Mobile (< md): allow at most ONE vertical scrollbar (root/page), no nested scrollers.
  //   Today this component uses `overflow-y-auto md:overflow-hidden` at the root and keeps
  //   staff/keyboard wrappers `overflow: visible` to avoid hidden controls.
  // These are the exact props we will later pass into `SightReadingLayout`.
  // They are intentionally derived here (logic layer), not inside the layout component.

  // Layout hints for SightReadingLayout (layout-only, no game rules):
  // - isTallStaffLayout: signals that staff will need more vertical space (e.g., both clefs)
  const isTallStaffLayout = isBothClefs;

  const srLayoutProps = {
    phase: gamePhase,
    hasKeyboard: shouldShowKeyboard,
    isFeedbackPhase,
    isCompactLandscape,
    isTallStaffLayout,
  };

  const headerRegion = (
    <div className="flex flex-shrink-0 items-center justify-between gap-2 px-2 py-1 sm:gap-3 sm:px-3">
      {/* Back Button - Icon Only */}
      <BackButton
        to="/notes-master-mode"
        name="Notes Master"
        iconOnly={true}
        styling="text-white/80 hover:text-white p-2"
      />

      {/* Progress Bar - Center */}
      <div className="min-w-0 flex-1">
        <div className="rounded-xl border-white/10 px-2 py-1.5 text-white shadow-lg sm:px-3">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold">
            <span className="truncate">
              Exercise {Math.min(currentExerciseNumber, sessionTotalExercises)}{" "}
              / {sessionTotalExercises}
            </span>
            <span
              className={`ml-2 text-[10px] sm:text-xs ${
                isSessionComplete
                  ? isVictory
                    ? "text-emerald-300"
                    : "text-amber-300"
                  : "text-white/70"
              }`}
            >
              {isSessionComplete ? (isVictory ? "Victory" : "Complete") : ``}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/20">
            <div
              className={`h-full transition-all duration-300 ${
                isSessionComplete
                  ? isVictory
                    ? "bg-emerald-400"
                    : "bg-rose-400"
                  : "bg-indigo-300"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Controls: BPM + Icons */}
      <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
        {/* BPM Pill */}
        <div className="hidden items-center rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white/90 sm:flex">
          {gameSettings.tempo} BPM
        </div>

        {/* Input Mode Selector Button - shows icon of mode you can switch TO */}
        {currentPattern && gamePhase !== GAME_PHASES.SETUP && (
          <button
            onClick={() => setShowInputModeModal(true)}
            disabled={isFeedbackPhase}
            className={`rounded-lg p-1.5 transition-colors sm:p-2 ${
              inputMode === "mic"
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-white/10 hover:bg-white/20"
            } ${isFeedbackPhase ? "cursor-not-allowed opacity-60" : ""}`}
            title={
              inputMode === "keyboard"
                ? "Switch to microphone"
                : "Switch to keyboard"
            }
          >
            {inputMode === "keyboard" ? (
              <Mic className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            ) : (
              <Piano className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            )}
          </button>
        )}
        <button
          onClick={() => setMetronomeEnabled((prev) => !prev)}
          className={`rounded-lg p-1.5 transition-colors sm:p-2 ${
            metronomeEnabled
              ? "bg-fuchsia-500 hover:bg-fuchsia-600"
              : "bg-white/10 hover:bg-white/20"
          }`}
          title="Toggle metronome"
          disabled={gamePhase === GAME_PHASES.COUNT_IN}
        >
          <img
            src={MetronomeIcon}
            alt="Metronome"
            className="h-4 w-4 sm:h-5 sm:w-5"
          />
        </button>
        <button
          onClick={returnToSetup}
          className="rounded-lg bg-white/10 p-1.5 transition-colors hover:bg-white/20 sm:p-2"
          title="Change settings"
        >
          <Settings className="h-4 w-4 text-white sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );

  const countInOverlay =
    gamePhase === GAME_PHASES.COUNT_IN ? (
      <div className="absolute left-1/2 top-12 z-10 -translate-x-1/2 transform sm:top-16">
        <MetronomeDisplay
          currentBeat={currentBeat}
          timeSignature={gameSettings.timeSignature}
          isActive={true}
          isCountIn={true}
        />
      </div>
    ) : null;

  const guidanceRegion =
    gamePhase === GAME_PHASES.DISPLAY ? (
      <div className="my-2 flex-shrink-0 text-center">
        <button
          onClick={() => beginPerformanceWithPattern()}
          disabled={!currentPattern}
          className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-8 sm:py-3 sm:text-base"
        >
          Start Playing
        </button>
      </div>
    ) : gamePhase === GAME_PHASES.COUNT_IN ? (
      <div className="my-2 flex-shrink-0 text-center">
        <p className="text-sm font-semibold text-gray-700 sm:text-base">
          Listen to the count-in
        </p>
      </div>
    ) : gamePhase === GAME_PHASES.PERFORMANCE ? (
      <div className="my-2 flex-shrink-0 text-center">
        <p className="text-sm font-semibold text-gray-700 sm:text-base">
          Play the highlighted note!
        </p>
      </div>
    ) : null;

  const showPlayableKeyboardBand =
    (gamePhase === GAME_PHASES.DISPLAY ||
      gamePhase === GAME_PHASES.COUNT_IN ||
      gamePhase === GAME_PHASES.PERFORMANCE) &&
    shouldShowKeyboard;

  const keyboardRegion = showPlayableKeyboardBand ? (
    <div className="sightreading-keyboard-wrapper performance-mode h-full w-full">
      <KlavierKeyboard
        visible={showKeyboard}
        onNotePlayed={handleKeyboardNoteInput}
        selectedNotes={gameSettings.selectedNotes || []}
      />
    </div>
  ) : null;

  const staffRegion = currentPattern ? (
    <div
      className={`sightreading-staff-wrapper w-full ${
        gamePhase === GAME_PHASES.COUNT_IN ? "opacity-90" : ""
      }`}
    >
      <VexFlowStaffDisplay
        pattern={currentPattern}
        currentNoteIndex={currentNoteIndex}
        clef={gameSettings.clef.toLowerCase()}
        performanceResults={performanceResults}
        gamePhase={gamePhase}
      />
    </div>
  ) : null;

  const feedbackPanel = isFeedbackPhase ? (
    <>
      <FeedbackSummary
        performanceResults={performanceResults}
        currentPattern={currentPattern}
        gameSettings={gameSettings}
        summaryStats={summaryStats}
        onTryAgain={replayPattern}
        onNextPattern={handleNextExercise}
        nextButtonLabel={`Next Exercise`}
        nextButtonDisabled={isSessionComplete}
        showNextButton={!isSessionComplete}
      />

      {isSessionComplete && (
        <div className="mt-4 space-y-3 text-center">
          <div
            className={`rounded-2xl border px-4 py-3 ${
              isVictory
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            <p className="text-lg font-bold">
              {isVictory ? "Session Victory!" : "Session Complete"}
            </p>
            <p className="text-sm">
              Final score: {sessionPercentageDisplay}% ({sessionScoreSummary})
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {isVictory
                ? "Amazing consistency across all 10 exercises."
                : "Keep going! Aim for at least 70% on your next run."}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={handleStartNewSession}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Start New Session
            </button>
          </div>
        </div>
      )}
    </>
  ) : null;
  // #endregion

  // Show game interface
  return (
    <>
      <div className="relative">
        {showMicDebug && (
          <div className="pointer-events-none absolute bottom-2 right-2 z-50 w-[260px] rounded-xl border border-white/15 bg-black/40 p-3 text-xs text-white backdrop-blur">
            <div className="mb-1 flex items-center justify-between">
              <div className="font-semibold">Mic Debug</div>
              <div className="text-white/70">
                {isListening ? "listening" : "stopped"}
              </div>
            </div>
            <div className="space-y-1 text-white/90">
              <div className="flex justify-between">
                <span className="text-white/70">audioLevel</span>
                <span>{Number(audioLevel || 0).toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">detected</span>
                <span>
                  {debug?.detectedNote ?? "—"}{" "}
                  {debug?.detectedFrequency > 0
                    ? `(${debug.detectedFrequency.toFixed(1)}Hz)`
                    : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">current</span>
                <span>{debug?.currentNote ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">candidate</span>
                <span>
                  {debug?.candidateNote ?? "—"}{" "}
                  {debug?.candidateFrames ? `(${debug.candidateFrames})` : ""}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Overlays that must not affect layout flow */}
        {countInOverlay}

        <SightReadingLayout
          phase={srLayoutProps.phase}
          hasKeyboard={srLayoutProps.hasKeyboard}
          isFeedbackPhase={srLayoutProps.isFeedbackPhase}
          isCompactLandscape={srLayoutProps.isCompactLandscape}
          isTallStaffLayout={srLayoutProps.isTallStaffLayout}
          headerControls={headerRegion}
          staff={staffRegion}
          guidance={guidanceRegion}
          keyboard={keyboardRegion}
          feedbackPanel={feedbackPanel}
        />
      </div>

      {/* Input Mode Selection Modal */}
      {showInputModeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-xl font-bold">Choose Input Mode</h3>
            <p className="mb-6 text-gray-600">
              Select how you want to play the notes:
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  setInputMode("keyboard");
                  setShowInputModeModal(false);
                }}
                className={`w-full rounded-lg border-2 px-4 py-3 transition-all ${
                  inputMode === "keyboard"
                    ? "border-purple-600 bg-purple-50 font-semibold text-purple-700"
                    : "border-gray-300 bg-white text-gray-700 hover:border-purple-400 hover:bg-purple-50"
                }`}
              >
                <div className="text-left">
                  <div className="mb-1 font-semibold">
                    On-screen keyboard only
                  </div>
                  <div className="text-sm text-gray-600">
                    Play using the on-screen piano keyboard
                  </div>
                </div>
              </button>
              <button
                onClick={async () => {
                  setInputMode("mic");
                  setShowInputModeModal(false);

                  // Check microphone permission when mic mode is selected
                  const hasPermission = await checkMicrophonePermission();
                  if (!hasPermission) {
                    // Permission prompt will be shown by checkMicrophonePermission
                    // User can still use keyboard mode if they cancel
                  }
                }}
                className={`w-full rounded-lg border-2 px-4 py-3 transition-all ${
                  inputMode === "mic"
                    ? "border-purple-600 bg-purple-50 font-semibold text-purple-700"
                    : "border-gray-300 bg-white text-gray-700 hover:border-purple-400 hover:bg-purple-50"
                }`}
              >
                <div className="text-left">
                  <div className="mb-1 font-semibold">Microphone input</div>
                  <div className="text-sm text-gray-600">
                    Play your real instrument (clap/tap input)
                  </div>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowInputModeModal(false)}
              className="mt-4 w-full rounded bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Microphone Permission Prompt */}
      {showMicPermissionPrompt && inputMode === "mic" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-2 text-xl font-bold">
              Microphone Access Required
            </h3>
            <p className="mb-4 text-gray-600">
              This game needs microphone access to detect the notes you play.
              Please enable microphone permissions in your browser.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  // Only try again if still in mic mode
                  if (inputMode !== "mic") {
                    setShowMicPermissionPrompt(false);
                    return;
                  }
                  setShowMicPermissionPrompt(false);
                  try {
                    await startListening();
                    setGamePhase(GAME_PHASES.PERFORMANCE);
                  } catch (err) {
                    console.error("Still denied:", err);
                    // Show prompt again if still denied and still in mic mode
                    if (inputMode === "mic") {
                      setShowMicPermissionPrompt(true);
                    }
                  }
                }}
                className="flex-1 rounded bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  setShowMicPermissionPrompt(false);
                  // Switch to keyboard mode if mic permission denied
                  setInputMode("keyboard");
                  setGamePhase(GAME_PHASES.DISPLAY);
                }}
                className="flex-1 rounded bg-gray-300 px-4 py-2 transition-colors hover:bg-gray-400"
              >
                Use Keyboard Instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-cheat Penalty Modal */}
      {showPenaltyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-4">
          <div className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-xl space-y-3 rounded-3xl border border-purple-100 bg-white p-4 text-center shadow-2xl sm:p-5">
            <img
              src={BeethovenAvatar}
              alt="Beethoven avatar"
              className="mx-auto h-14 w-14 flex-shrink-0 rounded-full border-4 border-purple-200 shadow-lg sm:h-16 sm:w-16"
            />
            <div className="flex-shrink-0">
              <h3 className="text-lg font-bold text-purple-700 sm:text-xl">
                No Cheating, Maestro!
              </h3>
              <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                Rapid key presses were detected and points were deducted. Please
                restart the pattern and play only the highlighted notes in time.
              </p>
            </div>
            <button
              onClick={handlePenaltyTryAgain}
              className="w-full flex-shrink-0 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 font-semibold text-white shadow-lg transition-transform hover:scale-[1.01]"
            >
              Try Again
            </button>
            <p className="flex-shrink-0 text-xs text-gray-400">
              Tap &quot;Start Playing&quot; after resetting to begin the
              count-in again.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
