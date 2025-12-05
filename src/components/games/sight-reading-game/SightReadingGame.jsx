import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Piano, Settings, Play, Mic } from "lucide-react";
import MetronomeIcon from "../../../assets/icons/metronome.svg";
import { useAudioEngine } from "../../../hooks/useAudioEngine";
import { usePitchDetection } from "../../../hooks/usePitchDetection";
import { PreGameSetup } from "./components/PreGameSetup";
import { VexFlowStaffDisplay } from "./components/VexFlowStaffDisplay";
import { KlavierKeyboard } from "./components/KlavierKeyboard";
import { FeedbackSummary } from "./components/FeedbackSummary";
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
import { FIRST_NOTE_EARLY_MS } from "./constants/timingConstants";
import { useUser } from "../../../features/authentication/useUser";
import { updateStudentScore } from "../../../services/apiScores";
import toast from "react-hot-toast";
import BackButton from "../../ui/BackButton";
import {
  SIGHT_READING_SESSION_CONSTANTS,
  useSightReadingSession,
} from "../../../contexts/SightReadingSessionContext";
import VictoryScreen from "../VictoryScreen";

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
  const [cursorTime, setCursorTime] = useState(0); // Elapsed time in seconds for cursor animation

  // Unified timing state: replaces scoringActive + isPerformanceLive
  const [timingState, setTimingState] = useState(TIMING_STATE.OFF);
  const timingStateRef = useRef(timingState);
  useEffect(() => {
    timingStateRef.current = timingState;
  }, [timingState]);

  // Unified timing references for audio/wall-clock sync
  const audioStartTimeRef = useRef(null); // AudioContext seconds at performance start
  const wallClockStartTimeRef = useRef(null); // Date.now() ms at performance start

  // Input mode state: "keyboard" or "mic"
  const [inputMode, setInputMode] = useState(() => {
    const stored = localStorage.getItem("sightReadingInputMode");
    return stored === "mic" ? "mic" : "keyboard"; // Default to keyboard for safer UX
  });

  // Sync keyboard visibility with input mode
  const [showKeyboard, setShowKeyboard] = useState(true); // Toggle for on-screen keyboard - default to true for better UX
  const [showInputModeModal, setShowInputModeModal] = useState(false);
  const isFeedbackPhase = gamePhase === GAME_PHASES.FEEDBACK;
  const shouldShowKeyboard = !isFeedbackPhase && showKeyboard;
  const keyboardWrapperStyle = useMemo(() => {
    if (isFeedbackPhase) {
      return {};
    }
    return {
      height: "clamp(140px, 28vh, 240px)",
    };
  }, [isFeedbackPhase]);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const gamePhaseRef = useRef(gamePhase);
  useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);
  useEffect(() => {
    startSession();
    return () => {
      resetSession();
    };
  }, [startSession, resetSession]);
  const countInAnimationRef = useRef(null);
  const lastCountInBeatRef = useRef(0);
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
    const noteBank =
      gameSettings.clef?.toLowerCase() === "bass" ? BASS_NOTES : TREBLE_NOTES;
    const activeNotes =
      selected.length > 0
        ? noteBank.filter((note) => selected.includes(note.pitch))
        : noteBank;
    const mapping = {};
    activeNotes.forEach((note, idx) => {
      if (PC_KEYBOARD_KEYS[idx]) {
        mapping[PC_KEYBOARD_KEYS[idx]] = note.pitch;
      }
    });
    return mapping;
  }, [gameSettings.clef, gameSettings.selectedNotes]);

  // Use ref to avoid stale closure in setTimeout callback
  const currentPatternRef = useRef(null);
  const performanceTimeoutsRef = useRef([]);
  const countInTimeoutRef = useRef({
    scoring: null,
    completion: null,
  });
  const cursorAnimationRef = useRef(null); // RAF handle for cursor animation
  const timingWindowsRef = useRef([]);
  const performanceResultsRef = useRef([]); // Ref for real-time performance results access
  const performanceLiveTimeoutRef = useRef(null);
  const lastDetectionTimesRef = useRef({}); // Per-note debouncing: key=noteIndex, value=lastDetectionMs

  // Performance tracking
  const [performanceResults, setPerformanceResults] = useState([]);
  const [, setExpectedNoteStartTime] = useState(null);
  const [, setDetectedPitches] = useState([]);
  const [showMicPermissionPrompt, setShowMicPermissionPrompt] = useState(false);

  // Persist input mode changes to localStorage
  useEffect(() => {
    localStorage.setItem("sightReadingInputMode", inputMode);
    // Ensure keyboard is visible when keyboard mode is selected
    if (inputMode === "keyboard") {
      setShowKeyboard(true);
      // Dismiss any mic permission prompts when switching to keyboard mode
      setShowMicPermissionPrompt(false);
    }
  }, [inputMode]);

  // Helper: Get elapsed time from performance start in ms
  const getElapsedMsFromPerformanceStart = useCallback(() => {
    if (!wallClockStartTimeRef.current) return 0;
    return Date.now() - wallClockStartTimeRef.current;
  }, []);

  // Cursor animation helpers
  const startCursorAnimation = useCallback(() => {
    if (gamePhaseRef.current !== GAME_PHASES.PERFORMANCE) {
      logFirstNoteDebug("cursor animation blocked", {
        phase: gamePhaseRef.current,
        timingState: timingStateRef.current,
      });
      return;
    }
    const pattern = currentPatternRef.current;
    if (!pattern || !wallClockStartTimeRef.current) return;

    const animate = () => {
      if (gamePhaseRef.current !== GAME_PHASES.PERFORMANCE) {
        logFirstNoteDebug("cursor animation halted (phase change)", {
          phase: gamePhaseRef.current,
        });
        return;
      }
      const elapsedMs = getElapsedMsFromPerformanceStart();
      const elapsedSec = elapsedMs / 1000;
      const patternDurationSec = pattern.totalDuration || 0;
      const clampedSec = Math.min(elapsedSec, patternDurationSec);
      setCursorTime(clampedSec);
      if (elapsedSec < patternDurationSec) {
        cursorAnimationRef.current = requestAnimationFrame(animate);
      }
    };

    cursorAnimationRef.current = requestAnimationFrame(animate);
  }, [getElapsedMsFromPerformanceStart]);

  const stopCursorAnimation = useCallback(() => {
    if (cursorAnimationRef.current) {
      cancelAnimationFrame(cursorAnimationRef.current);
      cursorAnimationRef.current = null;
    }
    setCursorTime(0);
  }, []);
  const [, setTimingFeedback] = useState(null); // { message, color, timestamp }
  const [summaryStats, setSummaryStats] = useState(null);
  const guessPenaltyRef = useRef(0);
  const failedAttemptTrackerRef = useRef([]);
  const keyboardSpamTrackerRef = useRef([]);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const penaltyLockRef = useRef(false);

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
    stopCursorAnimation();
    performanceTimeoutsRef.current.forEach((id) => clearTimeout(id));
    performanceTimeoutsRef.current = [];
    rhythmPlayback.stop();
    audioEngine.stopScheduler();
    if (inputMode === "mic") {
      stopListeningRef.current();
    }
    setTimingState(TIMING_STATE.OFF);
  }, [audioEngine, inputMode, rhythmPlayback, stopCursorAnimation]);

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
  const metronomeIntervalRef = useRef(null);
  const metronomeBeatRef = useRef(0);

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

  const { audioLevel, isListening, startListening, stopListening } =
    usePitchDetection({
      isActive: false, // Manual control
      noteFrequencies,
      rmsThreshold: 0.015, // Slightly higher for accuracy
      tolerance: 0.03, // 3% tolerance (tighter than default)
      onPitchDetected: (note, frequency) => {
        handleNoteDetectedRef.current(note, frequency);
      },
      onLevelChange: () => {},
    });

  useEffect(() => {
    stopListeningRef.current = stopListening;
  }, [stopListening]);

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
      const noteBank =
        gameSettings.clef?.toLowerCase() === "bass" ? BASS_NOTES : TREBLE_NOTES;
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
      setTimingState(TIMING_STATE.LIVE);
      logFirstNoteDebug("performance live window active", {
        bufferMs: PERFORMANCE_START_BUFFER_MS,
      });
      return;
    }
    performanceLiveTimeoutRef.current = setTimeout(() => {
      setTimingState(TIMING_STATE.LIVE);
      performanceLiveTimeoutRef.current = null;
      logFirstNoteDebug("performance live window active", {
        bufferMs: PERFORMANCE_START_BUFFER_MS,
      });
    }, PERFORMANCE_START_BUFFER_MS);
  }, []);

  const resetPerformanceLiveState = useCallback(() => {
    if (performanceLiveTimeoutRef.current) {
      clearTimeout(performanceLiveTimeoutRef.current);
      performanceLiveTimeoutRef.current = null;
    }
    setTimingState(TIMING_STATE.OFF);
  }, []);

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
    stopCursorAnimation();

    // Add a small delay to ensure the last note's result is properly recorded
    // before transitioning to FEEDBACK phase (prevents race condition where
    // last note shows as "active" instead of its actual result color)
    setTimeout(() => {
      setGamePhase(GAME_PHASES.FEEDBACK);
    }, 50); // 50ms delay to let state updates settle
  }, [stopCursorAnimation]);

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

      const elapsedTimeMs = getElapsedMsFromPerformanceStart();

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

      // Find which note (if any) is currently within its timing window
      // Prioritize the earliest pending note whose window contains this detection
      let matchingNoteIndex = -1;
      let matchingEvent = null;
      let matchingWindow = null;
      const pitchMatches = [];
      const fallbackMatches = [];

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
          continue;
        }

        // Calculate timing window for this note
        const { windowStart, windowEnd } = windowInfo;

        // Check if we're within this note's timing window
        if (elapsedTimeMs >= windowStart && elapsedTimeMs <= windowEnd) {
          fallbackMatches.push(windowInfo);
          if (event.pitch === detectedNote) {
            pitchMatches.push(windowInfo);
          }
        }
      }

      const selectedWindow = pitchMatches[0] || fallbackMatches[0] || null;

      // No valid note found in timing window
      if (!selectedWindow) {
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

      matchingNoteIndex = selectedWindow.noteIndex;
      matchingEvent = selectedWindow.event;
      matchingWindow = selectedWindow;
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
        const timing = evaluateTiming(timeDiff);

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

        // Show timing feedback
        showTimingFeedback(timing);
      } else {
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
        recordPerformanceResult(result);

        // Show wrong note feedback
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
        `🎹 Keyboard input: ${noteName}, phase=${phase}, timingState=${timingStateRef.current}`;
        handleNoteDetected(noteName, 440);
      } else if (phase === GAME_PHASES.PERFORMANCE) {
        // Show soft feedback without scoring (e.g., outside timing window)
        showTimingFeedback({ status: "okay" });
      }
    },
    [
      audioEngine,
      handleNoteDetected,
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

    // Clear any existing timeouts
    performanceTimeoutsRef.current.forEach((id) => clearTimeout(id));
    performanceTimeoutsRef.current = [];

    const allEvents = pattern.notes; // Both notes and rests

    // Performance start time should already be set by handleCountInComplete
    if (!wallClockStartTimeRef.current) {
      console.error("❌ Performance start time not set! This is a bug.");
      wallClockStartTimeRef.current = Date.now(); // Fallback
    }
    const baseStartMs = wallClockStartTimeRef.current;

    // Find last playable note index (not rest) for missed-note tracking
    const playableIndices = allEvents
      .map((event, idx) => (event.type === "note" ? idx : null))
      .filter((idx) => idx !== null);

    if (playableIndices.length === 0) {
      console.warn("No playable notes found in pattern");
      return;
    }

    const missToleranceMs = 200;

    // Find the absolute last event (including rests) for pattern completion
    const lastEventIndex = allEvents.length - 1;
    const lastEvent = allEvents[lastEventIndex];
    const patternEndTimeMs = baseStartMs + (lastEvent.endTime || 0) * 1000;

    // Schedule ALL events (notes and rests) for cursor movement and highlighting
    allEvents.forEach((event, eventIdx) => {
      const startOffsetMs = (event.startTime || 0) * 1000;
      const endOffsetMs = (event.endTime || event.startTime || 0) * 1000;

      // Schedule cursor/highlight for this event (note or rest)
      const fireAtMs = baseStartMs + startOffsetMs;
      const startDelayMs = Math.max(0, fireAtMs - Date.now());
      const startTimeoutId = setTimeout(() => {
        if (gamePhaseRef.current !== GAME_PHASES.PERFORMANCE) {
          return;
        }
        setCurrentNoteIndex(eventIdx);

        // Only set expected start time for playable notes
        if (event.type === "note") {
          setExpectedNoteStartTime(Date.now());
          if (eventIdx === 0) {
            logFirstNoteDebug("first-note start event fired", {
              startOffsetMs,
              startDelayMs,
              scheduledTime: fireAtMs,
              timestamp: Date.now(),
            });
          }
        }
      }, startDelayMs);
      performanceTimeoutsRef.current.push(startTimeoutId);

      // Only schedule missed-note checks for actual notes (not rests)
      if (event.type === "note") {
        if (eventIdx === 0) {
          logFirstNoteDebug("scheduling first-note miss timeout", {
            startOffsetMs,
            endOffsetMs,
            fireAtMs: endOffsetMs + missToleranceMs,
          });
        }
        const missFireAtMs = baseStartMs + endOffsetMs + missToleranceMs;
        const missDelayMs = Math.max(0, missFireAtMs - Date.now());
        const missTimeoutId = setTimeout(() => {
          if (gamePhaseRef.current !== GAME_PHASES.PERFORMANCE) {
            return;
          }
          setPerformanceResults((prev) => {
            const already = prev.some((r) => r.noteIndex === eventIdx);
            if (already) {
              if (eventIdx === 0) {
                logFirstNoteDebug("first-note miss timeout skipped", {
                  reason: "already recorded",
                  timestamp: Date.now(),
                });
              }
              return prev;
            }

            const missed = {
              noteIndex: eventIdx,
              expected: event.pitch,
              detected: null,
              frequency: -1,
              timingStatus: "missed",
              timeDiff: 0,
              isCorrect: false,
              timestamp: Date.now(),
            };
            if (eventIdx === 0) {
              logFirstNoteDebug("first-note missed result recorded", missed);
            }
            return [...prev, missed];
          });
        }, missDelayMs);
        performanceTimeoutsRef.current.push(missTimeoutId);
      }
    });

    // Schedule pattern completion at the very end (including all rests)
    const completionDelayMs = Math.max(
      0,
      patternEndTimeMs + missToleranceMs - Date.now()
    );
    const completionTimeoutId = setTimeout(() => {
      if (gamePhaseRef.current !== GAME_PHASES.PERFORMANCE) {
        return;
      }
      completePerformance();
    }, completionDelayMs);
    performanceTimeoutsRef.current.push(completionTimeoutId);
  }, [completePerformance]);

  const loadExercisePattern = useCallback(async () => {
    try {
      audioEngine.stopScheduler();
      rhythmPlayback.stop();
      setShowKeyboard(true);

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
  }, [gameSettings, generatePattern, audioEngine, rhythmPlayback]);

  const tickMetronome = useCallback(() => {
    const beatsPerMeasure = gameSettings.timeSignature?.beats || 4;
    const isDownbeat = metronomeBeatRef.current % beatsPerMeasure === 0;
    metronomeBeatRef.current += 1;
    audioEngine.createMetronomeClick(
      audioEngine.getCurrentTime() + 0.01,
      isDownbeat
    );
  }, [audioEngine, gameSettings.timeSignature?.beats]);

  const stopMetronomePlayback = useCallback(() => {
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
  }, []);

  const startMetronomePlayback = useCallback(() => {
    if (metronomeIntervalRef.current) {
      return;
    }
    ensureAudioContextRunning().then((resumed) => {
      if (!resumed) {
        return;
      }
      metronomeBeatRef.current = 0;
      tickMetronome();
      const intervalMs = (60 / (gameSettings.tempo || 80)) * 1000;
      metronomeIntervalRef.current = setInterval(() => {
        tickMetronome();
      }, intervalMs);
    });
  }, [ensureAudioContextRunning, gameSettings.tempo, tickMetronome]);

  useEffect(() => {
    if (metronomeEnabled && gamePhase === GAME_PHASES.PERFORMANCE) {
      startMetronomePlayback();
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
  ]);

  const handleStartNewSession = useCallback(() => {
    resetSession();
    startSession();
    loadExercisePattern();
  }, [loadExercisePattern, resetSession, startSession]);

  /**
   * Replay the same pattern (Try Again)
   */
  const replayPattern = useCallback(() => {
    if (!currentPattern) return;

    stopCountInVisualization();
    // Reset states
    setCurrentNoteIndex(0);
    setPerformanceResults([]);
    performanceResultsRef.current = [];
    setDetectedPitches([]);
    setCursorTime(0);
    setTimingState(TIMING_STATE.OFF);
    guessPenaltyRef.current = 0;
    setSummaryStats(null);
    setShowPenaltyModal(false);
    penaltyLockRef.current = false;
    setScoreSubmitted(false);
    setScoreSyncStatus("idle");
    setShowKeyboard(true);
    setExerciseRecorded(false);

    // Go back to display phase to show pattern before count-in
    setGamePhase(GAME_PHASES.DISPLAY);
  }, [currentPattern, stopCountInVisualization]);

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
    stopCursorAnimation();
    stopCountInVisualization();

    // Reset states
    setCurrentPattern(null);
    currentPatternRef.current = null;
    setCurrentNoteIndex(-1);
    setPerformanceResults([]);
    performanceResultsRef.current = [];
    setDetectedPitches([]);
    setCursorTime(0);
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
    stopCursorAnimation,
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

    // Ensure we have a scheduled performance start time established earlier
    const now = Date.now();
    let scheduledTarget = wallClockStartTimeRef.current;
    if (typeof scheduledTarget !== "number") {
      scheduledTarget = now;
      wallClockStartTimeRef.current = now;
    }
    logMetronomeTiming("handleCountInComplete invoked", {
      scheduledStart: scheduledTarget,
      actualCallback: now,
      driftMs: now - scheduledTarget,
      audioContextTime: audioEngine.getCurrentTime(),
    });
    wallClockStartTimeRef.current = now;

    stopCountInVisualization();
    gamePhaseRef.current = GAME_PHASES.PERFORMANCE;
    setGamePhase(GAME_PHASES.PERFORMANCE);
    // Note: timing state is already EARLY_WINDOW from count-in, will transition to LIVE via schedulePerformanceLiveActivation
    resetPerformanceLiveState();

    // Only start microphone if mic input mode is selected
    if (inputMode === "mic") {
      try {
        await startListening();

        // Reset and start cursor animation
        setCursorTime(0);
        startCursorAnimation();

        schedulePerformanceTimeline();
        schedulePerformanceLiveActivation();
      } catch (error) {
        console.error("❌ Failed to start microphone:", error);
        setShowMicPermissionPrompt(true);
        // Fall back to display mode
        setGamePhase(GAME_PHASES.DISPLAY);
      }
    } else {
      // Keyboard-only mode: skip mic, but still start cursor animation and timeline
      setCursorTime(0);
      startCursorAnimation();
      schedulePerformanceTimeline();
      schedulePerformanceLiveActivation();
    }
  }, [
    audioEngine,
    inputMode,
    startListening,
    schedulePerformanceTimeline,
    startCursorAnimation,
    stopCountInVisualization,
    clearCountInTimeouts,
    schedulePerformanceLiveActivation,
    resetPerformanceLiveState,
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
      // Resume audio context (required after user interaction)
      const resumed = await audioEngine.resumeAudioContext();

      if (!audioEngine.isReady()) {
        throw new Error(
          "Audio engine failed to initialize. Please refresh the page and try again."
        );
      }

      // Reset state for new performance
      stopCursorAnimation();
      setCurrentBeat(0);
      setCurrentNoteIndex(0);
      setPerformanceResults([]);
      performanceResultsRef.current = [];
      lastDetectionTimesRef.current = {};
      setDetectedPitches([]);
      setCursorTime(0);

      // Start count-in phase
      resetPerformanceLiveState();
      setGamePhase(GAME_PHASES.COUNT_IN);

      // Ensure audio context is running before scheduling
      await ensureAudioContextRunning();
      const clockReady = await waitForStableAudioClock();
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
      const scoringDelay = Math.max(
        0,
        (countInEndAudioTime -
          audioEngine.getCurrentTime() -
          earlyWindowMs / 1000) *
          1000
      );
      clearCountInTimeouts();
      countInTimeoutRef.current.scoring = setTimeout(() => {
        if (gamePhaseRef.current !== GAME_PHASES.COUNT_IN) {
          return;
        }
        setTimingState(TIMING_STATE.EARLY_WINDOW);
        logMetronomeTiming("scoring window opened", {
          earlyWindowMs,
          scheduledDelayMs: scoringDelay,
          audioContextTime: audioEngine.getCurrentTime(),
        });
        logFirstNoteDebug("early window opened", {
          earlyWindowMs,
          firstNoteTolerance: FIRST_NOTE_EARLY_MS,
          beatDurationMs,
        });
      }, scoringDelay);

      const completionDelay = Math.max(
        0,
        (countInEndAudioTime - audioEngine.getCurrentTime()) * 1000
      );
      countInTimeoutRef.current.completion = setTimeout(() => {
        stopCountInVisualization();
        logMetronomeTiming("count-in complete", {
          scheduledDelayMs: completionDelay,
          audioContextTime: audioEngine.getCurrentTime(),
        });
        setCurrentBeat(0); // Reset beat counter
        clearCountInTimeouts();
        handleCountInComplete();
      }, completionDelay);
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
    startCountInVisualization,
    stopCountInVisualization,
    clearCountInTimeouts,
    gameSettings.timeSignature?.beats,
    resetPerformanceLiveState,
    stopCursorAnimation,
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
        // Force mic off during count-in (PRD requirement)
        if (isListening) {
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
      stopCursorAnimation();
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
                You finished all 10 exercises. You're only a few points away
                from unlocking the victory celebration.
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

  // Show game interface
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      {/* Compact Header with Progress Bar */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2 px-2 py-1 sm:gap-3 sm:px-3">
        {/* Back Button - Icon Only */}
        <BackButton
          to="/notes-master-mode"
          name="Notes Master"
          iconOnly={true}
          styling="text-white/80 hover:text-white p-2"
        />

        {/* Progress Bar - Center */}
        {gamePhase !== GAME_PHASES.FEEDBACK && (
          <div className="min-w-0 flex-1">
            <div className="rounded-xl border-white/10 px-2 py-1.5 text-white shadow-lg sm:px-3">
              <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                <span className="truncate">
                  Exercise{" "}
                  {Math.min(currentExerciseNumber, sessionTotalExercises)} /{" "}
                  {sessionTotalExercises}
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
                  {isSessionComplete
                    ? isVictory
                      ? "Victory"
                      : "Complete"
                    : ``}
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
        )}

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

      {/* Count-in Display - Fixed position at top (doesn't push content) */}
      {gamePhase === GAME_PHASES.COUNT_IN && (
        <div className="absolute left-1/2 top-12 z-10 -translate-x-1/2 transform sm:top-16">
          <MetronomeDisplay
            currentBeat={currentBeat}
            timeSignature={gameSettings.timeSignature}
            isActive={true}
            isCountIn={true}
          />
        </div>
      )}

      {/* Main Content */}
      <div
        className={`flex flex-col items-center gap-2 px-2 pb-4 sm:gap-3 sm:px-4 ${
          isFeedbackPhase ? "flex-1 overflow-y-auto" : "min-h-0 flex-1"
        }`}
      >
        <div
          className={`flex w-full max-w-5xl flex-col gap-2.5 sm:gap-3 ${
            isFeedbackPhase ? "py-0" : "min-h-0 flex-1"
          }`}
        >
          {currentPattern && (
            <div
              className={`flex flex-col gap-2.5 sm:gap-3 ${
                isFeedbackPhase ? "" : "min-h-0 flex-1"
              }`}
            >
              <div
                className={`sightreading-staff-wrapper relative w-full flex-shrink-0 ${
                  gamePhase === GAME_PHASES.COUNT_IN ? "opacity-90" : ""
                }`}
                style={{
                  minHeight: "160px",
                  height: "min(34vh, 280px)",
                }}
              >
                <div className="flex h-full items-center justify-center overflow-visible rounded-lg bg-white/95 shadow-2xl backdrop-blur-sm">
                  <VexFlowStaffDisplay
                    pattern={currentPattern}
                    currentNoteIndex={currentNoteIndex}
                    clef={gameSettings.clef.toLowerCase()}
                    performanceResults={performanceResults}
                    gamePhase={gamePhase}
                    cursorTime={cursorTime}
                  />
                </div>
              </div>

              {/* Desktop/tablet: centered guidance text */}
              <div className="mb-1 hidden flex-shrink-0 space-y-1 text-center text-white lg:block">
                {gamePhase === GAME_PHASES.COUNT_IN && (
                  <p className="text-xs font-semibold sm:text-sm">
                    Listen to the count-in
                  </p>
                )}
                {gamePhase === GAME_PHASES.DISPLAY && (
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => beginPerformanceWithPattern()}
                      className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold transition-colors hover:bg-green-700 sm:px-6"
                    >
                      Start Playing
                    </button>
                  </div>
                )}
                {gamePhase === GAME_PHASES.PERFORMANCE && (
                  <p className="text-xs font-semibold sm:text-sm">
                    Play the highlighted note!
                  </p>
                )}
              </div>

              {/* Mobile: minimal text only (no big button in flow) */}
              <div className="mb-1 flex-shrink-0 text-center text-white lg:hidden">
                {gamePhase === GAME_PHASES.COUNT_IN && (
                  <p className="text-xs font-semibold">
                    Listen to the count-in
                  </p>
                )}
                {gamePhase === GAME_PHASES.PERFORMANCE && (
                  <p className="text-xs font-semibold">
                    Play the highlighted note!
                  </p>
                )}
              </div>

              {gamePhase !== GAME_PHASES.SETUP &&
                (shouldShowKeyboard || isFeedbackPhase) && (
                  <div
                    className={`sightreading-keyboard-wrapper relative w-full ${
                      isFeedbackPhase ? "feedback-mode" : "flex-shrink-0"
                    }`}
                    style={keyboardWrapperStyle}
                  >
                    {isFeedbackPhase ? (
                      <div className="mx-auto w-full max-w-3xl">
                        <FeedbackSummary
                          performanceResults={performanceResults}
                          currentPattern={currentPattern}
                          gameSettings={gameSettings}
                          summaryStats={summaryStats}
                          onTryAgain={replayPattern}
                          onNextPattern={handleNextExercise}
                          nextButtonLabel={`Next Exercise (${currentExerciseNumber}/${sessionTotalExercises})`}
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
                                {isVictory
                                  ? "Session Victory!"
                                  : "Session Complete"}
                              </p>
                              <p className="text-sm">
                                Final score: {sessionPercentageDisplay}% (
                                {sessionScoreSummary})
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
                      </div>
                    ) : (
                      shouldShowKeyboard && (
                        <>
                          {/* Floating CTA for mobile (overlays keyboard top) */}
                          {gamePhase === GAME_PHASES.DISPLAY && (
                            <div className="absolute left-0 right-0 top-0 z-20 flex -translate-y-12 justify-center lg:hidden">
                              <button
                                onClick={() => beginPerformanceWithPattern()}
                                className="flex transform items-center gap-2 rounded-full bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-green-700"
                              >
                                <Play className="h-4 w-4" fill="currentColor" />
                                <span>Start Playing</span>
                              </button>
                            </div>
                          )}
                          <KlavierKeyboard
                            visible={showKeyboard}
                            onNotePlayed={handleKeyboardNoteInput}
                            selectedNotes={gameSettings.selectedNotes || []}
                          />
                        </>
                      )
                    )}
                  </div>
                )}
            </div>
          )}
        </div>
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
                  setShowKeyboard(true);
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
                  setShowKeyboard(true); // Keep keyboard visible as visual aid
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
              Tap "Start Playing" after resetting to begin the count-in again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
