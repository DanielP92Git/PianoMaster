import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAudioContext } from "../../../contexts/AudioContextProvider";
import { usePianoSampler } from "../../../hooks/usePianoSampler";
import { useSounds } from "../../../features/games/hooks/useSounds";
import { useSessionTimeout } from "../../../contexts/SessionTimeoutContext";
import { useLandscapeLock } from "../../../hooks/useLandscapeLock";
import { useRotatePrompt } from "../../../hooks/useRotatePrompt";
import { RotatePromptOverlay } from "../../orientation/RotatePromptOverlay";
import { AudioInterruptedOverlay } from "../shared/AudioInterruptedOverlay";
import VictoryScreen from "../VictoryScreen";
import BackButton from "../../ui/BackButton";
import { getNodeById } from "../../../data/skillTrail";
import { getPattern, TIME_SIGNATURES } from "./RhythmPatternGenerator";
import { binaryPatternToBeats } from "./utils/rhythmVexflowHelpers";
import { scoreTap } from "./utils/rhythmScoringUtils";
import RhythmStaffDisplay from "./components/RhythmStaffDisplay";
import FloatingFeedback from "./components/FloatingFeedback";
import { MetronomeDisplay } from "./components";
import { useAccessibility } from "../../../contexts/AccessibilityContext";

// Game phases FSM
const GAME_PHASES = {
  SETUP: "setup",
  READY: "ready", // Metronome loops, notation visible, waiting for tap on beat 1
  PLAYING: "playing",
  FEEDBACK: "feedback",
  SESSION_COMPLETE: "session-complete",
};

/**
 * RhythmReadingGame
 *
 * Tap-along rhythm game where children synchronize taps to visual notation.
 * Shows VexFlow-rendered rhythm pattern, sweeping cursor, and scores
 * each tap PERFECT/GOOD/MISS using AudioContext.currentTime.
 *
 * RTAP-01: VexFlow rhythm notation (1 measure, b/4 notes, stems up)
 * RTAP-02: Indigo cursor sweeps left-to-right synced to audioContext.currentTime
 * RTAP-03: Count-in plays audio clicks + visual 3-2-1-GO
 * RTAP-04: Taps scored via audioContext.currentTime with tempo-scaled thresholds
 * RTAP-05: Session of 10 exercises completes through VictoryScreen
 */
export function RhythmReadingGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("common");

  // Android PWA: fullscreen + orientation lock
  useLandscapeLock();

  // iOS/non-PWA: rotate prompt overlay
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();

  // Trail state extraction from location.state
  const nodeId = location.state?.nodeId ?? null;
  const nodeConfig = location.state?.nodeConfig ?? null;
  const rhythmPatterns = nodeConfig?.rhythmPatterns ?? null;
  const trailExerciseIndex = location.state?.exerciseIndex ?? null;
  const trailTotalExercises = location.state?.totalExercises ?? null;
  const trailExerciseType = location.state?.exerciseType ?? null;

  // Audio contexts
  const {
    audioContextRef,
    isInterrupted,
    handleTapToResume,
    getOrCreateAudioContext,
  } = useAudioContext();
  const { playNote } = usePianoSampler();
  useSounds(); // Loaded for potential future use (correct/wrong sounds for post-exercise feedback)

  // Accessibility context for reducedMotion (safe outside AccessibilityProvider in tests)
  let reducedMotion = false;
  try {
    const a11y = useAccessibility();
    reducedMotion = a11y?.reducedMotion ?? false;
  } catch {
    // Not in AccessibilityProvider — reducedMotion defaults to false
  }

  // Session timeout controls
  let pauseTimer = useCallback(() => {}, []);
  let resumeTimer = useCallback(() => {}, []);
  try {
    const sessionTimeout = useSessionTimeout();
    pauseTimer = sessionTimeout.pauseTimer;
    resumeTimer = sessionTimeout.resumeTimer;
  } catch {
    // Not in SessionTimeoutProvider — timer controls are no-ops
  }

  // Extract config from nodeConfig or use defaults
  const tempo = nodeConfig?.tempo ?? nodeConfig?.config?.tempo ?? 80;
  const timeSignatureStr =
    nodeConfig?.timeSignature ?? nodeConfig?.config?.timeSignature ?? "4/4";
  const difficulty =
    nodeConfig?.difficulty ?? nodeConfig?.config?.difficulty ?? "beginner";

  // Get TIME_SIGNATURES object for MetronomeDisplay
  const getTimeSignatureObject = useCallback((timeSigStr) => {
    const mapping = {
      "4/4": TIME_SIGNATURES.FOUR_FOUR,
      "3/4": TIME_SIGNATURES.THREE_FOUR,
      "2/4": TIME_SIGNATURES.TWO_FOUR,
      "6/8": TIME_SIGNATURES.SIX_EIGHT,
    };
    return mapping[timeSigStr] ?? TIME_SIGNATURES.FOUR_FOUR;
  }, []);

  const timeSignatureObj = getTimeSignatureObject(timeSignatureStr);

  // Game state
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.SETUP);
  const [currentExercise, setCurrentExercise] = useState(0);
  const totalExercises = 10; // D-02: 10 exercises per session
  const [currentBeats, setCurrentBeats] = useState(null);
  const [tapResults, setTapResults] = useState([]);
  const [exerciseScores, setExerciseScores] = useState([]);
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(1); // for MetronomeDisplay
  // IOS-02: Gesture gate — true when AudioContext is suspended on trail auto-start
  const [needsGestureToStart, setNeedsGestureToStart] = useState(false);

  // Refs for timing and animation (not state — no re-renders on updates)
  const cursorDivRef = useRef(null); // passed to RhythmStaffDisplay
  const patternStartTimeRef = useRef(0);
  const scheduledBeatTimesRef = useRef([]); // AudioContext times for each beat onset
  const nextBeatIndexRef = useRef(0);
  const rafIdRef = useRef(null);
  const measureDurationRef = useRef(0); // total measure duration in seconds
  const feedbackTimeoutRef = useRef(null);
  const hasAutoStartedRef = useRef(false); // auto-start guard pattern
  const exerciseScoreRef = useRef(0); // temp storage to pass score out of state updater
  const startPlayingRef = useRef(null); // stable ref for startPlaying
  const staveBoundsRef = useRef(null); // stave note-area bounds from RhythmStaffDisplay
  const transitionToFeedbackRef = useRef(null); // stable ref for transitionToFeedback

  // Continuous metronome refs (READY phase)
  const metronomeIntervalRef = useRef(null); // setInterval ID for audio lookahead scheduler
  const visualIntervalRef = useRef(null); // setInterval ID for visual beat updates
  const metronomeStartTimeRef = useRef(0); // AudioContext time when metronome started
  const lastScheduledBeatRef = useRef(-1); // highest beat number already scheduled

  // Pause/resume session timer based on game phase
  useEffect(() => {
    const activePhases = [GAME_PHASES.READY, GAME_PHASES.PLAYING];
    if (activePhases.includes(gamePhase)) {
      pauseTimer();
    } else {
      resumeTimer();
    }
    return () => resumeTimer();
  }, [gamePhase, pauseTimer, resumeTimer]);

  // Auto-start from trail node (hasAutoStartedRef guard)
  useEffect(() => {
    if (nodeConfig && !hasAutoStartedRef.current) {
      const ctx = audioContextRef.current;
      // IOS-02: If AudioContext is missing (needs user gesture to create) or suspended, show tap-to-start overlay
      if (!ctx || ctx.state === "suspended" || ctx.state === "interrupted") {
        setNeedsGestureToStart(true);
        return; // Don't auto-start — show tap-to-start overlay
      }
      hasAutoStartedRef.current = true;
      setTimeout(() => startGame(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time auto-start effect guarded by hasAutoStartedRef; only nodeConfig changes should re-evaluate
  }, [nodeConfig]);

  // Reset guard when nodeId changes (navigating between trail nodes)
  useEffect(() => {
    hasAutoStartedRef.current = false;
    setGamePhase(GAME_PHASES.SETUP);
    setCurrentExercise(0);
    setCurrentBeats(null);
    setTapResults([]);
    setExerciseScores([]);
    cancelAllTimers();
  }, [nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup RAF and timers on unmount
  useEffect(() => {
    return () => {
      cancelAllTimers();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelAllTimers = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
    if (visualIntervalRef.current) {
      clearInterval(visualIntervalRef.current);
      visualIntervalRef.current = null;
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, []);

  /**
   * Build scheduled beat times array from beats and tempo.
   * Returns array of AudioContext times for each non-rest beat onset.
   */
  const buildBeatTimes = useCallback((beats, bpm, startTime) => {
    const beatDuration = 60 / bpm; // seconds per quarter note
    const sixteenthDuration = beatDuration / 4;
    const times = [];
    let offset = 0;

    beats.forEach((beat) => {
      if (!beat.isRest) {
        times.push(startTime + offset);
      }
      offset += sixteenthDuration * beat.durationUnits;
    });

    return { times, totalDuration: offset };
  }, []);

  /**
   * Play metronome click for count-in.
   * Downbeat (beat 1): 900Hz, 0.15 gain. Other beats: 700Hz, 0.1 gain.
   */
  const playMetronomeClick = useCallback(
    (time, isDownbeat) => {
      const ctx = audioContextRef.current;
      if (!ctx || ctx.state === "closed") return;

      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const freq = isDownbeat ? 900 : 700;
        const vol = isDownbeat ? 0.15 : 0.1;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.07);
      } catch {
        // Audio scheduling error — ignore
      }
    },
    [audioContextRef]
  );

  /**
   * Fetch a new pattern and convert to beats array.
   * Returns { beats, binaryPattern } or null on failure.
   */
  const fetchNewPattern = useCallback(async () => {
    try {
      const result = await getPattern(
        timeSignatureStr,
        difficulty,
        rhythmPatterns
      );
      if (!result || !result.pattern) return null;
      const beats = binaryPatternToBeats(result.pattern);
      return { beats, binaryPattern: result.pattern };
    } catch (err) {
      console.warn("[RhythmReadingGame] fetchNewPattern error:", err);
      return null;
    }
  }, [timeSignatureStr, difficulty, rhythmPatterns]);

  /**
   * Start continuous metronome lookahead scheduler.
   * Schedules metronome clicks ~3 beats ahead via Web Audio for precise timing.
   * Runs a separate visual interval to update MetronomeDisplay.
   */
  const startContinuousMetronome = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const beatDuration = 60 / tempo;
    const beatsPerMeasure = timeSignatureObj.beats ?? 4;
    const lookaheadBeats = 3;
    lastScheduledBeatRef.current = -1;

    // Audio lookahead: every 50ms, schedule unscheduled beats up to 3 ahead
    metronomeIntervalRef.current = setInterval(() => {
      const now = ctx.currentTime;
      const elapsed = now - metronomeStartTimeRef.current;
      const currentBeatFloat = elapsed / beatDuration;
      const scheduleTo = Math.floor(currentBeatFloat) + lookaheadBeats;

      for (let b = lastScheduledBeatRef.current + 1; b <= scheduleTo; b++) {
        const beatTime = metronomeStartTimeRef.current + b * beatDuration;
        const isDownbeat = b % beatsPerMeasure === 0;
        playMetronomeClick(beatTime, isDownbeat);
      }
      lastScheduledBeatRef.current = scheduleTo;
    }, 50);

    // Visual updates: every 50ms, compute which beat we're on
    visualIntervalRef.current = setInterval(() => {
      const now = ctx.currentTime;
      const elapsed = now - metronomeStartTimeRef.current;
      const beatIdx = Math.floor(elapsed / beatDuration) % beatsPerMeasure;
      setCurrentBeat(beatIdx + 1);
    }, 50);
  }, [audioContextRef, tempo, timeSignatureObj, playMetronomeClick]);

  /**
   * Stop the continuous metronome (both audio scheduling and visual updates).
   */
  const stopContinuousMetronome = useCallback(() => {
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
    if (visualIntervalRef.current) {
      clearInterval(visualIntervalRef.current);
      visualIntervalRef.current = null;
    }
  }, []);

  /**
   * Enter READY phase: show notation, start looping metronome, wait for tap on beat 1.
   */
  const startReadyPhase = useCallback(
    (_beats) => {
      cancelAllTimers();
      setGamePhase(GAME_PHASES.READY);
      setTapResults([]);

      // Ensure AudioContext exists (lazy-created on first user gesture)
      let ctx = audioContextRef.current;
      if (!ctx) {
        ctx = getOrCreateAudioContext();
      }
      if (!ctx || ctx.state === "closed") return;

      // Resume suspended AudioContext (iOS + Chrome autoplay policy)
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      metronomeStartTimeRef.current = ctx.currentTime;
      startContinuousMetronome();
    },
    [
      audioContextRef,
      getOrCreateAudioContext,
      cancelAllTimers,
      startContinuousMetronome,
    ]
  );

  /**
   * Start playing phase: schedule pattern audio, start cursor RAF loop, enable tapping.
   */
  const startPlaying = useCallback(
    (beats, explicitStartTime) => {
      setGamePhase(GAME_PHASES.PLAYING);
      nextBeatIndexRef.current = 0;

      const ctx = audioContextRef.current || getOrCreateAudioContext();
      if (!ctx) return;

      // Resume context if suspended (iOS safety)
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      // Use explicit start time (from metronome grid alignment) or fallback
      const playbackStartTime = explicitStartTime ?? ctx.currentTime + 0.05;
      patternStartTimeRef.current = playbackStartTime;

      // Compute measure duration from time signature (no pattern playback — child taps the rhythm)
      const beatsPerMeasureForDuration = timeSignatureObj.beats ?? 4;
      measureDurationRef.current = beatsPerMeasureForDuration * (60 / tempo);

      // Pre-compute scheduled beat times for scoring
      const { times } = buildBeatTimes(beats, tempo, playbackStartTime);
      scheduledBeatTimesRef.current = times;

      // Start MetronomeDisplay beat updates
      const beatDuration = 60 / tempo;
      const beatsPerMeasure = timeSignatureObj.beats ?? 4;
      let lastBeatUpdate = -1;

      // RAF cursor sweep loop
      function updateCursor() {
        const context = audioContextRef.current;
        if (!context) return;

        const elapsed = context.currentTime - patternStartTimeRef.current;
        const total = measureDurationRef.current;
        if (total <= 0) return;

        const progress = Math.min(elapsed / total, 1);

        // Update cursor position directly via DOM (avoids React re-render on every frame)
        if (cursorDivRef.current) {
          const bounds = staveBoundsRef.current;
          if (
            bounds &&
            bounds.noteXPositions &&
            bounds.noteXPositions.length > 0 &&
            bounds.containerWidth > 0
          ) {
            // Beat-indexed interpolation: map time progress to VexFlow note X positions
            const positions = bounds.noteXPositions;
            const totalDurationUnits = beats.reduce(
              (sum, b) => sum + b.durationUnits,
              0
            );
            let cumulative = 0;
            let cursorX = positions[0];

            for (let i = 0; i < beats.length; i++) {
              const beatStart = cumulative / totalDurationUnits;
              cumulative += beats[i].durationUnits;
              const beatEnd = cumulative / totalDurationUnits;

              if (progress >= beatStart && progress < beatEnd) {
                const nextX =
                  i + 1 < positions.length ? positions[i + 1] : bounds.noteEndX;
                const localProgress =
                  (progress - beatStart) / (beatEnd - beatStart);
                cursorX = positions[i] + localProgress * (nextX - positions[i]);
                break;
              }
            }
            if (progress >= 1) cursorX = bounds.noteEndX;

            cursorDivRef.current.style.left = `${(cursorX / bounds.containerWidth) * 100}%`;
          } else if (bounds && bounds.containerWidth > 0) {
            // Fallback to linear sweep if per-note positions not available
            const startPct = bounds.noteStartX / bounds.containerWidth;
            const endPct = bounds.noteEndX / bounds.containerWidth;
            const cursorPct = startPct + progress * (endPct - startPct);
            cursorDivRef.current.style.left = `${cursorPct * 100}%`;
          } else {
            cursorDivRef.current.style.left = `${progress * 100}%`;
          }
        }

        // Update MetronomeDisplay beat indicator
        const beatIdx = Math.floor(elapsed / beatDuration) % beatsPerMeasure;
        const beatNumber = beatIdx + 1;
        if (beatNumber !== lastBeatUpdate) {
          lastBeatUpdate = beatNumber;
          setCurrentBeat(beatNumber);
        }

        if (progress < 1) {
          rafIdRef.current = requestAnimationFrame(updateCursor);
        } else {
          // Pattern complete — transition to feedback phase
          rafIdRef.current = null;
          transitionToFeedbackRef.current(beats);
        }
      }

      rafIdRef.current = requestAnimationFrame(updateCursor);
    },
    [audioContextRef, tempo, timeSignatureObj, playNote, buildBeatTimes]
  );

  // Keep ref in sync so handleTap's READY→PLAYING transition calls the current version
  startPlayingRef.current = startPlaying;

  // Receive stave note-area bounds from RhythmStaffDisplay after VexFlow renders
  const handleStaveBoundsReady = useCallback((bounds) => {
    staveBoundsRef.current = bounds;
  }, []);

  /**
   * Handle pointer-down tap on the tap area (D-04, D-05, RTAP-04).
   */
  const handleTap = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // --- READY phase: detect tap on beat 1 to start playing ---
    if (gamePhase === GAME_PHASES.READY) {
      const tapTime = ctx.currentTime;
      const beatDuration = 60 / tempo;
      const beatsPerMeasure = timeSignatureObj.beats ?? 4;
      const elapsed = tapTime - metronomeStartTimeRef.current;
      const beatPosition =
        (((elapsed / beatDuration) % beatsPerMeasure) + beatsPerMeasure) %
        beatsPerMeasure;

      // Distance from nearest beat 1 (wraps around: 3.9 in 4/4 → 0.1 from beat 1)
      const distanceFromBeat1 = Math.min(
        beatPosition,
        beatsPerMeasure - beatPosition
      );
      // Generous threshold for start detection (35% of a beat) — child is signaling "go", not being scored
      const thresholdBeats = 0.35;

      if (distanceFromBeat1 <= thresholdBeats) {
        // Snap to nearest beat 1 time
        const totalBeatsElapsed = elapsed / beatDuration;
        const nearestBeat1Number =
          Math.round(totalBeatsElapsed / beatsPerMeasure) * beatsPerMeasure;
        const nearestBeat1Time =
          metronomeStartTimeRef.current + nearestBeat1Number * beatDuration;

        // Piano sound as feedback for the starting tap
        playNote("C4", { duration: 0.3 });
        stopContinuousMetronome();
        startPlayingRef.current(currentBeats, nearestBeat1Time);
      }
      // Off-beat taps during READY are silently ignored — child retries naturally
      return;
    }

    // --- PLAYING phase: score the tap ---
    if (gamePhase !== GAME_PHASES.PLAYING) return;

    // Piano sound as feedback for each tap (child is "playing" the rhythm)
    playNote("C4", { duration: 0.3 });

    const tapTime = ctx.currentTime;
    const beats = currentBeats;

    if (!beats || scheduledBeatTimesRef.current.length === 0) return;

    const { quality, noteIdx, newNextBeatIndex } = scoreTap(
      tapTime,
      scheduledBeatTimesRef.current,
      nextBeatIndexRef.current,
      tempo
    );

    // Advance next beat index to prevent double-scoring
    nextBeatIndexRef.current = newNextBeatIndex;

    // Update tap results for note color updates in RhythmStaffDisplay
    setTapResults((prev) => {
      // Replace any existing result for this noteIdx
      const updated = prev.filter((r) => r.noteIdx !== noteIdx);
      updated.push({ noteIdx, quality });
      return updated;
    });

    // Trigger FloatingFeedback animation
    setLatestFeedback(quality);
    setFeedbackKey((k) => k + 1);
  }, [
    gamePhase,
    audioContextRef,
    currentBeats,
    tempo,
    timeSignatureObj,
    playNote,
    stopContinuousMetronome,
  ]);

  /**
   * Fetch next pattern and start count-in.
   */
  const fetchAndStartNextExercise = useCallback(async () => {
    const result = await fetchNewPattern();
    if (result) {
      setCurrentBeats(result.beats);
      startReadyPhase(result.beats);
    }
  }, [fetchNewPattern, startReadyPhase]);

  /**
   * Transition to feedback phase after pattern completes.
   */
  const transitionToFeedback = useCallback((beats) => {
    setGamePhase(GAME_PHASES.FEEDBACK);

    // Calculate exercise score: (PERFECT*3 + GOOD*1) / (totalBeats*3) * 100
    setTapResults((currentTapResults) => {
      const nonRestBeats = (beats || []).filter((b) => !b.isRest).length;
      const maxPoints = nonRestBeats * 3;
      let earned = 0;
      currentTapResults.forEach(({ quality }) => {
        if (quality === "PERFECT") earned += 3;
        else if (quality === "GOOD") earned += 1;
      });
      exerciseScoreRef.current =
        maxPoints > 0 ? Math.round((earned / maxPoints) * 100) : 0;
      return currentTapResults;
    });
    // Stay in FEEDBACK — user chooses Repeat or Next via buttons
  }, []);

  /**
   * Repeat the current exercise — same pattern, fresh scoring.
   */
  const handleRepeatExercise = useCallback(() => {
    setTapResults([]);
    startReadyPhase(currentBeats);
  }, [currentBeats, startReadyPhase]);

  /**
   * Advance to the next exercise (or complete the session).
   */
  const handleNextExerciseInSession = useCallback(() => {
    const score = exerciseScoreRef.current;
    const currentCount = exerciseScores.length;

    setExerciseScores((prev) => [...prev, score]);

    if (currentCount + 1 >= totalExercises) {
      setGamePhase(GAME_PHASES.SESSION_COMPLETE);
    } else {
      setCurrentExercise((ex) => ex + 1);
      fetchAndStartNextExercise();
    }
  }, [totalExercises, exerciseScores.length, fetchAndStartNextExercise]);

  // Keep ref in sync so RAF callback always calls the current version
  transitionToFeedbackRef.current = transitionToFeedback;

  /**
   * Start a new game session (from SETUP or after victory).
   */
  const startGame = useCallback(async () => {
    cancelAllTimers();
    setCurrentExercise(0);
    setExerciseScores([]);
    setTapResults([]);

    const result = await fetchNewPattern();
    if (result) {
      setCurrentBeats(result.beats);
      startReadyPhase(result.beats);
    }
  }, [cancelAllTimers, fetchNewPattern, startReadyPhase]);

  // IOS-02: Handle user-gesture tap-to-start for trail auto-start when AudioContext was suspended
  const handleGestureStart = useCallback(async () => {
    // Create AudioContext if it doesn't exist yet (iOS needs user gesture to create)
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
    setNeedsGestureToStart(false);
    hasAutoStartedRef.current = true;
    setTimeout(() => startGame(), 100);
  }, [getOrCreateAudioContext, startGame]);

  /**
   * Handle next exercise routing for trail mode.
   * Follows MetronomeTrainer.handleNextExercise pattern exactly.
   */
  const handleNextExercise = useCallback(() => {
    if (nodeId && trailExerciseIndex !== null && trailTotalExercises !== null) {
      const nextIndex = trailExerciseIndex + 1;
      if (nextIndex < trailTotalExercises) {
        const node = getNodeById(nodeId);
        if (node && node.exercises && node.exercises[nextIndex]) {
          const nextExercise = node.exercises[nextIndex];
          const navState = {
            nodeId,
            nodeConfig: nextExercise.config,
            exerciseIndex: nextIndex,
            totalExercises: trailTotalExercises,
            exerciseType: nextExercise.type,
          };
          switch (nextExercise.type) {
            case "note_recognition":
              navigate("/notes-master-mode/notes-recognition-game", {
                state: navState,
              });
              break;
            case "sight_reading":
              navigate("/notes-master-mode/sight-reading-game", {
                state: navState,
              });
              break;
            case "memory_game":
              navigate("/notes-master-mode/memory-game", { state: navState });
              break;
            case "rhythm":
              navigate("/rhythm-mode/metronome-trainer", {
                state: navState,
                replace: true,
              });
              window.location.reload();
              break;
            case "rhythm_reading":
              navigate("/rhythm-mode/rhythm-reading-game", {
                state: navState,
                replace: true,
              });
              window.location.reload();
              break;
            case "boss_challenge":
              navigate("/notes-master-mode/sight-reading-game", {
                state: { ...navState, isBoss: true },
              });
              break;
            case "rhythm_dictation":
              navigate("/rhythm-mode/rhythm-dictation-game", {
                state: navState,
              });
              break;
            case "pitch_comparison":
              navigate("/ear-training-mode/note-comparison-game", {
                state: navState,
              });
              break;
            case "interval_id":
              navigate("/ear-training-mode/interval-game", { state: navState });
              break;
            case "arcade_rhythm":
              navigate("/rhythm-mode/arcade-rhythm-game", { state: navState });
              break;
            default:
              navigate("/trail");
          }
        }
      }
    }
  }, [navigate, nodeId, trailExerciseIndex, trailTotalExercises]);

  // Calculate final scores for VictoryScreen
  const totalScore = exerciseScores.reduce((sum, s) => sum + s, 0);
  const totalPossibleScore = totalExercises * 100;

  // Render VictoryScreen when session complete
  if (gamePhase === GAME_PHASES.SESSION_COMPLETE) {
    return (
      <VictoryScreen
        score={totalScore}
        totalPossibleScore={totalPossibleScore}
        nodeId={nodeId}
        exerciseIndex={trailExerciseIndex}
        totalExercises={trailTotalExercises}
        exerciseType={trailExerciseType}
        onNextExercise={handleNextExercise}
        onReset={() => {
          setGamePhase(GAME_PHASES.SETUP);
          hasAutoStartedRef.current = false;
        }}
        onExit={() => navigate("/trail")}
      />
    );
  }

  const isPlaying = gamePhase === GAME_PHASES.PLAYING;

  return (
    <div
      className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900"
      dir="ltr"
    >
      {/* Header bar */}
      <header className="flex h-12 items-center justify-between px-4 py-2 text-white/80">
        <BackButton to={nodeId ? "/trail" : "/rhythm-mode"} />
        <div className="text-sm font-medium">
          {t("games.rhythmReading.title")} &mdash;{" "}
          <span dir="ltr">
            {currentExercise + 1} / {totalExercises}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        {/* VexFlow Staff Display */}
        <div style={{ position: "relative" }}>
          <RhythmStaffDisplay
            beats={currentBeats}
            timeSignature={timeSignatureStr}
            cursorProgress={0} // cursor is controlled directly via cursorDivRef
            tapResults={tapResults}
            showCursor={false} // parent renders its own RAF-driven cursor div below
            reducedMotion={reducedMotion}
            onStaveBoundsReady={handleStaveBoundsReady}
          />
          {/* Cursor div - passed via ref to be updated by RAF without React re-renders */}
          <div
            ref={cursorDivRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "16px", // inside the card padding
              left: "0%",
              width: "2px",
              height: "calc(100% - 32px)",
              backgroundColor: "rgb(129, 140, 248)",
              opacity: isPlaying ? 0.8 : 0,
              boxShadow: reducedMotion
                ? "none"
                : "0 0 8px rgba(129,140,248,0.8)",
              pointerEvents: "none",
              zIndex: 10,
              transition: isPlaying ? "none" : "opacity 0.2s",
            }}
          />
        </div>

        {/* MetronomeDisplay beat circles */}
        <div className="flex justify-center">
          <MetronomeDisplay
            currentBeat={currentBeat}
            timeSignature={timeSignatureObj}
            isActive={gamePhase === GAME_PHASES.READY || isPlaying}
            isCountIn={false}
          />
        </div>

        {/* Tap area */}
        <div
          className="relative flex-1"
          style={{ position: "relative", minHeight: "120px" }}
        >
          {/* Tap area — visible during READY and PLAYING */}
          {(isPlaying || gamePhase === GAME_PHASES.READY) && (
            <button
              onPointerDown={handleTap}
              aria-label={t("games.rhythmReading.tapArea.tapHere")}
              className="flex h-full max-h-96 w-full cursor-pointer items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-xl font-bold text-white transition-transform duration-75 hover:bg-white/20 active:scale-95"
              style={{ minHeight: "120px" }}
            >
              {t("games.rhythmReading.tapArea.tapHere")}
            </button>
          )}

          {/* Repeat / Next buttons — visible during FEEDBACK */}
          {gamePhase === GAME_PHASES.FEEDBACK && (
            <div
              className="flex w-full items-center justify-center gap-4"
              style={{ minHeight: "120px" }}
            >
              <button
                onClick={handleRepeatExercise}
                className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-bold text-white transition-colors hover:bg-white/20"
              >
                {t("games.actions.repeat", "Repeat")}
              </button>
              <button
                onClick={handleNextExerciseInSession}
                className="rounded-xl bg-indigo-500 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-400"
              >
                {t("games.actions.next", "Next")}
              </button>
            </div>
          )}

          {/* Floating PERFECT/GOOD/MISS feedback */}
          <FloatingFeedback
            quality={latestFeedback}
            feedbackKey={feedbackKey}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Setup screen Start button */}
        {gamePhase === GAME_PHASES.SETUP && (
          <div className="flex justify-center pb-4">
            <button
              onClick={startGame}
              className="rounded-xl bg-indigo-500 px-8 py-3 font-bold text-white transition-colors hover:bg-indigo-400"
            >
              {t("games.actions.start", "Start Game")}
            </button>
          </div>
        )}
      </main>

      {/* IOS-02: Gesture gate — shown when AudioContext needs user gesture to start (e.g. iOS trail auto-start) */}
      {needsGestureToStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <button
            onClick={handleGestureStart}
            className="flex flex-col items-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-12 py-8 backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/30">
              <svg
                className="h-8 w-8 text-indigo-300"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">
              {t("games.actions.start", "Start Game")}
            </span>
          </button>
        </div>
      )}

      {/* iOS audio interrupted overlay */}
      <AudioInterruptedOverlay
        isVisible={isInterrupted}
        onTapToResume={handleTapToResume}
        onRestartExercise={() => {
          setGamePhase(GAME_PHASES.SETUP);
          hasAutoStartedRef.current = false;
        }}
      />

      {/* Rotate prompt for iOS/non-PWA */}
      {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}
    </div>
  );
}

export default RhythmReadingGame;
