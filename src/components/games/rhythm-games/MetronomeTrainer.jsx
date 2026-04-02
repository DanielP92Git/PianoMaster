import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAudioEngine } from "../../../hooks/useAudioEngine";
import { useAudioContext } from "../../../contexts/AudioContextProvider";
import { useSounds } from "../../../features/games/hooks/useSounds";
import {
  getPattern,
  DIFFICULTY_LEVELS,
  TIME_SIGNATURES,
} from "./RhythmPatternGenerator";
import { MetronomeDisplay, TapArea } from "./components";
import RhythmGameSetup from "./components/RhythmGameSetup";
import BackButton from "../../ui/BackButton";
import VictoryScreen from "../VictoryScreen";
import { getNodeById } from "../../../data/skillTrail";
import { useSessionTimeout } from "../../../contexts/SessionTimeoutContext";
import { useLandscapeLock } from "../../../hooks/useLandscapeLock";
import { useRotatePrompt } from "../../../hooks/useRotatePrompt";
import { RotatePromptOverlay } from "../../orientation/RotatePromptOverlay";
import { AudioInterruptedOverlay } from "../shared/AudioInterruptedOverlay.jsx";
import Button from "../../ui/Button";

// Game phases
const GAME_PHASES = {
  SETUP: "setup",
  COUNT_IN: "count-in",
  PATTERN_PLAYBACK: "pattern-playback",
  GET_READY: "get-ready",
  USER_PERFORMANCE: "user-performance",
  FEEDBACK: "feedback",
  SESSION_COMPLETE: "session-complete",
};

// Base timing thresholds (in milliseconds) - these are for 120 BPM
const BASE_TIMING_THRESHOLDS = {
  PERFECT: 50, // ±20ms
  GOOD: 75, // ±50ms
  FAIR: 125, // ±100ms
  // >100ms = MISS
};

/**
 * Calculate dynamic timing thresholds based on tempo
 * Slower tempos get more generous thresholds, faster tempos get stricter
 */
const calculateTimingThresholds = (tempo) => {
  // Base tempo for reference (120 BPM)
  const baseTempo = 120;

  // Calculate scaling factor
  // At 60 BPM: factor = 1.4 (40% more generous)
  // At 90 BPM: factor = 1.15 (15% more generous)
  // At 120 BPM: factor = 1.0 (baseline)
  // At 150 BPM: factor = 0.85 (15% stricter)
  // At 180 BPM: factor = 0.75 (25% stricter)
  const scalingFactor = Math.pow(baseTempo / tempo, 0.3); // Gentle exponential scaling

  return {
    PERFECT: Math.round(BASE_TIMING_THRESHOLDS.PERFECT * scalingFactor),
    GOOD: Math.round(BASE_TIMING_THRESHOLDS.GOOD * scalingFactor),
    FAIR: Math.round(BASE_TIMING_THRESHOLDS.FAIR * scalingFactor),
  };
};

// Scoring system
const SCORING = {
  PERFECT: 100,
  GOOD: 75,
  FAIR: 50,
  MISS: 0,
  COMBO_MULTIPLIER: 1.2, // 20% bonus for consecutive accurate taps
};

export function MetronomeTrainer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("common");

  // Android PWA: fullscreen + orientation lock
  useLandscapeLock();

  // iOS/non-PWA: rotate prompt overlay
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();

  // Get nodeId from trail navigation (if coming from trail)
  const nodeId = location.state?.nodeId || null;
  const nodeConfig = location.state?.nodeConfig || null;
  const rhythmPatterns = nodeConfig?.rhythmPatterns ?? null;
  const trailExerciseIndex = location.state?.exerciseIndex ?? null;
  const trailTotalExercises = location.state?.totalExercises ?? null;
  const trailExerciseType = location.state?.exerciseType ?? null;
  const {
    audioContextRef,
    isInterrupted,
    handleTapToResume,
    getOrCreateAudioContext,
  } = useAudioContext();
  const [needsGestureToStart, setNeedsGestureToStart] = useState(false);
  const audioEngine = useAudioEngine(120, {
    sharedAudioContext: audioContextRef.current,
  });
  const { playWrongSound, playVictorySound } = useSounds();

  // Game state
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.SETUP);
  const [gameSettings, setGameSettings] = useState({
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    timeSignature: TIME_SIGNATURES.FOUR_FOUR,
    tempo: 90,
    adaptiveDifficulty: false,
  });

  // Session timeout controls - pause timer during active gameplay
  let pauseTimer = useCallback(() => {}, []);
  let resumeTimer = useCallback(() => {}, []);
  try {
    const sessionTimeout = useSessionTimeout();
    pauseTimer = sessionTimeout.pauseTimer;
    resumeTimer = sessionTimeout.resumeTimer;
  } catch {
    // Not in SessionTimeoutProvider, timer controls are no-ops
  }

  // Pause/resume inactivity timer based on game phase
  useEffect(() => {
    // Active phases where user is playing
    const activePhases = [
      GAME_PHASES.COUNT_IN,
      GAME_PHASES.PATTERN_PLAYBACK,
      GAME_PHASES.GET_READY,
      GAME_PHASES.USER_PERFORMANCE,
    ];
    const isGameActive = activePhases.includes(gamePhase);
    if (isGameActive) {
      pauseTimer();
    } else {
      resumeTimer();
    }
    return () => resumeTimer(); // Always resume on unmount
  }, [gamePhase, pauseTimer, resumeTimer]);

  // Pattern and timing state

  // Helper to convert time signature string to TIME_SIGNATURES object
  const getTimeSignatureObject = useCallback((timeSigString) => {
    const mapping = {
      "4/4": TIME_SIGNATURES.FOUR_FOUR,
      "3/4": TIME_SIGNATURES.THREE_FOUR,
      "2/4": TIME_SIGNATURES.TWO_FOUR,
      "6/8": TIME_SIGNATURES.SIX_EIGHT,
    };
    return mapping[timeSigString] || TIME_SIGNATURES.FOUR_FOUR;
  }, []);

  // Auto-configure and auto-start from trail node
  const hasAutoConfigured = useRef(false);

  // Reset game state when nodeId changes (navigating between trail nodes)
  useEffect(() => {
    hasAutoConfigured.current = false;

    // Reset game to setup phase to prevent showing VictoryScreen from previous node
    setGamePhase(GAME_PHASES.SETUP);
    setCurrentPattern(null);
    setCurrentBeat(0);
    setUserTaps([]);
    setExpectedTaps([]);
    setFeedback(null);
    setHasUserStartedTapping(false);
    userTapsRef.current = [];
  }, [nodeId]);

  useEffect(() => {
    if (nodeConfig && !hasAutoConfigured.current) {
      // IOS-02: If AudioContext is missing (needs user gesture to create) or suspended, defer to user tap
      const ctx = audioContextRef.current;
      if (!ctx || ctx.state === "suspended" || ctx.state === "interrupted") {
        setNeedsGestureToStart(true);
        return; // Don't auto-start — show tap-to-start overlay
      }

      hasAutoConfigured.current = true;

      // Build settings from node configuration
      // Convert string timeSignature to TIME_SIGNATURES object
      const timeSigString = nodeConfig.timeSignature || "4/4";
      const trailSettings = {
        difficulty: nodeConfig.difficulty || "beginner",
        tempo: nodeConfig.tempo || 80,
        timeSignature: getTimeSignatureObject(timeSigString),
        totalExercises: 10,
      };

      setGameSettings(trailSettings);

      // Auto-start the game after a brief delay to ensure settings are applied
      setTimeout(() => {
        startGame(trailSettings);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time auto-start effect guarded by hasAutoConfigured ref; audioContextRef, getTimeSignatureObject, startGame intentionally omitted to prevent re-triggering; only nodeConfig changes should re-evaluate
  }, [nodeConfig]);

  // Handle navigation to next exercise in the trail node
  const handleNextExercise = useCallback(() => {
    if (nodeId && trailExerciseIndex !== null && trailTotalExercises !== null) {
      const nextIndex = trailExerciseIndex + 1;
      if (nextIndex < trailTotalExercises) {
        // Get the node to find next exercise config
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

          // Navigate based on exercise type
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
              window.location.reload(); // Force reload for same route
              break;
            case "boss_challenge":
              navigate("/notes-master-mode/sight-reading-game", {
                state: { ...navState, isBoss: true },
              });
              break;
            case "rhythm_reading":
              navigate("/rhythm-mode/rhythm-reading-game", { state: navState });
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

  const [currentBeat, setCurrentBeat] = useState(0);
  const [_currentPattern, setCurrentPattern] = useState(null);
  const [_expectedTaps, setExpectedTaps] = useState([]);
  const [_userTaps, setUserTaps] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Session tracking
  const [sessionStats, setSessionStats] = useState({
    patternsCompleted: 0,
    totalScore: 0,
    perfectTaps: 0,
    goodTaps: 0,
    fairTaps: 0,
    missedTaps: 0,
    comboCount: 0,
    maxCombo: 0,
  });

  // Progress tracking for exercises (similar to NoteRecognitionGame)
  const [exerciseProgress, setExerciseProgress] = useState({
    currentExercise: 0,
    totalExercises: 10,
    exerciseScores: [], // Array to track individual exercise scores
    isGameComplete: false,
  });

  // Timing references
  const gameStartTime = useRef(null);
  const patternStartTime = useRef(null);
  const userPerformanceStartTime = useRef(null);
  const beatDuration = useRef(0);

  // Continuous metronome state
  const continuousMetronomeRef = useRef(null);
  const visualMetronomeRef = useRef(null);
  const metronomeStartTimeRef = useRef(null);
  const patternInfoRef = useRef(null); // Store pattern info immediately
  const userTapsRef = useRef([]); // Track user taps in real-time for evaluation
  const scheduledOscillatorsRef = useRef([]); // Track scheduled oscillators for manual stopping
  const [hasUserStartedTapping, setHasUserStartedTapping] = useState(false);
  const [_countdownToStart, setCountdownToStart] = useState(null); // Countdown until user should start tapping

  // Calculate beat duration from tempo
  useEffect(() => {
    beatDuration.current = 60 / gameSettings.tempo; // seconds per beat
  }, [gameSettings.tempo]);

  /**
   * Create custom metronome sound with specific frequency and volume
   */
  const createCustomMetronomeSound = useCallback(
    (time, frequency, volume) => {
      if (
        !audioEngine.audioContextRef?.current ||
        !audioEngine.gainNodeRef?.current
      ) {
        return;
      }

      try {
        const context = audioEngine.audioContextRef.current;
        const masterGain = audioEngine.gainNodeRef.current;

        // Create oscillator and gain
        const oscillator = context.createOscillator();
        const clickGain = context.createGain();

        // Configure frequency
        oscillator.frequency.setValueAtTime(frequency, time);
        oscillator.type = "sine";

        // Configure amplitude envelope with custom volume
        clickGain.gain.setValueAtTime(0, time);
        clickGain.gain.linearRampToValueAtTime(volume, time + 0.001); // Quick attack
        clickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.02); // Shorter decay to reduce fade

        // Connect nodes
        oscillator.connect(clickGain);
        clickGain.connect(masterGain);

        // Track oscillator for manual stopping if needed
        const oscillatorInfo = {
          oscillator,
          startTime: time,
          stopTime: time + 0.02,
        };
        scheduledOscillatorsRef.current.push(oscillatorInfo);

        // Schedule play
        oscillator.start(time);
        oscillator.stop(time + 0.02); // Shorter duration

        // Clean up tracking when oscillator ends
        oscillator.onended = () => {
          const index = scheduledOscillatorsRef.current.findIndex(
            (info) => info.oscillator === oscillator
          );
          if (index !== -1) {
            scheduledOscillatorsRef.current.splice(index, 1);
          }
        };
      } catch (error) {
        console.error("Error creating custom metronome sound:", error);
      }
    },
    [audioEngine]
  );

  /**
   * Start continuous metronome that runs throughout the game
   */
  const startContinuousMetronome = useCallback(
    (startTime, timeSignatureOverride = null) => {
      const beatDur = beatDuration.current;
      const currentTimeSignature =
        timeSignatureOverride || gameSettings.timeSignature;
      const beatsPerMeasure = currentTimeSignature.beats;
      metronomeStartTimeRef.current = startTime;

      // For compound time (6/8), track 6 subdivision positions visually (not just 2 compound beats).
      // Each compound beat has 3 eighth-note subdivisions, so subdivisionDur = beatDur/3.
      // For simple time, one tick per beat.
      const isCompound = !!currentTimeSignature.isCompound;
      const visualSubdivisions =
        currentTimeSignature.subdivisions ?? beatsPerMeasure;
      const subdivisionDur = isCompound ? beatDur / 3 : beatDur;

      // Clear any existing metronome
      if (continuousMetronomeRef.current) {
        clearInterval(continuousMetronomeRef.current);
      }
      if (visualMetronomeRef.current) {
        clearInterval(visualMetronomeRef.current);
      }

      // Clear any existing oscillator tracking
      scheduledOscillatorsRef.current = [];

      // Schedule continuous metronome beats
      const scheduleMetronomeBeats = (currentTime) => {
        const timeSinceStart = currentTime - startTime;

        if (isCompound) {
          // Compound time: schedule clicks at subdivision intervals (3 per compound beat)
          const totalSubdivisionsFloat = timeSinceStart / subdivisionDur;
          const totalSubdivisionsCompleted = Math.floor(totalSubdivisionsFloat);

          for (let i = 0; i < 9; i++) {
            const subdivisionNumber = totalSubdivisionsCompleted + i;
            const subdivisionTime =
              startTime + subdivisionNumber * subdivisionDur;

            if (subdivisionTime > currentTime + 0.05) {
              const subdivisionInMeasure =
                subdivisionNumber % visualSubdivisions;
              const isCompoundDownbeat =
                subdivisionInMeasure === 0 || subdivisionInMeasure === 3;

              let volume;
              let frequency;
              if (gamePhase === GAME_PHASES.COUNT_IN) {
                volume = isCompoundDownbeat ? 0.15 : 0.08;
                frequency = isCompoundDownbeat ? 900 : 600;
              } else if (
                gamePhase === GAME_PHASES.PATTERN_PLAYBACK ||
                gamePhase === GAME_PHASES.GET_READY
              ) {
                volume = isCompoundDownbeat ? 0.06 : 0.03;
                frequency = isCompoundDownbeat ? 600 : 450;
              } else {
                volume = isCompoundDownbeat ? 0.1 : 0.05;
                frequency = isCompoundDownbeat ? 700 : 500;
              }

              createCustomMetronomeSound(subdivisionTime, frequency, volume);
            }
          }
        } else {
          // Simple time: schedule one click per beat (unchanged behavior)
          const totalBeatsFloat = timeSinceStart / beatDur;
          const totalBeatsCompleted = Math.floor(totalBeatsFloat);

          // Schedule the next few beats
          for (let i = 0; i < 3; i++) {
            const beatNumber = totalBeatsCompleted + i;
            const beatTime = startTime + beatNumber * beatDur;

            if (beatTime > currentTime + 0.05) {
              // Only schedule if more than 50ms away
              const isDownbeat = beatNumber % beatsPerMeasure === 0;

              // Beat scheduling (logging removed for cleaner console)

              // Different volumes based on game phase
              let volume = 0.1;
              let frequency = isDownbeat ? 700 : 550;

              if (gamePhase === GAME_PHASES.COUNT_IN) {
                volume = 0.15;
                frequency = isDownbeat ? 900 : 700;
              } else if (
                gamePhase === GAME_PHASES.PATTERN_PLAYBACK ||
                gamePhase === GAME_PHASES.GET_READY
              ) {
                volume = 0.06;
                frequency = isDownbeat ? 600 : 500;
              }

              createCustomMetronomeSound(beatTime, frequency, volume);
            }
          }
        }
      };

      // Start unified visual metronome that stays synchronized
      const startUnifiedVisualMetronome = () => {
        const firstBeatDelay =
          (startTime - audioEngine.getCurrentTime()) * 1000;

        setTimeout(
          () => {
            // Update visual beat based on audio timing
            const updateVisualBeat = () => {
              const currentTime = audioEngine.getCurrentTime();
              const timeSinceStart = currentTime - startTime;

              let beatInDisplay;
              if (isCompound) {
                // Track subdivision position (1–6 for 6/8)
                const totalSubdivisionsFloat = timeSinceStart / subdivisionDur;
                const totalSubdivisionsCompleted = Math.floor(
                  totalSubdivisionsFloat
                );
                beatInDisplay =
                  (totalSubdivisionsCompleted % visualSubdivisions) + 1;
              } else {
                // Track beat position (1–N for simple time)
                const totalBeatsFloat = timeSinceStart / beatDur;
                const totalBeatsCompleted = Math.floor(totalBeatsFloat);
                beatInDisplay = (totalBeatsCompleted % beatsPerMeasure) + 1;
              }

              // Visual metronome beat tracking

              setCurrentBeat(beatInDisplay);
            };

            // Initial beat
            updateVisualBeat();

            // Set up visual update interval
            visualMetronomeRef.current = setInterval(updateVisualBeat, 50); // Update every 50ms for smooth visuals
          },
          Math.max(0, firstBeatDelay)
        );
      };

      // Initial scheduling
      scheduleMetronomeBeats(audioEngine.getCurrentTime());
      startUnifiedVisualMetronome();

      // Set up interval to keep scheduling beats more frequently for precise stopping
      continuousMetronomeRef.current = setInterval(
        () => {
          scheduleMetronomeBeats(audioEngine.getCurrentTime());
        },
        50 // Check every 50ms for more responsive stopping
      );
    },
    [
      audioEngine,
      gameSettings,
      beatDuration,
      gamePhase,
      createCustomMetronomeSound,
    ]
  );

  /**
   * Stop continuous metronome
   */
  const stopContinuousMetronome = useCallback(() => {
    const currentTime = audioEngine.getCurrentTime();
    if (continuousMetronomeRef.current) {
      clearInterval(continuousMetronomeRef.current);
      continuousMetronomeRef.current = null;
    }
    if (visualMetronomeRef.current) {
      clearInterval(visualMetronomeRef.current);
      visualMetronomeRef.current = null;
    }

    // Stop all future scheduled oscillators
    const futureOscillators = scheduledOscillatorsRef.current.filter(
      (info) => info.startTime > currentTime
    );

    futureOscillators.forEach((info) => {
      try {
        if (info.oscillator && info.oscillator.stop) {
          info.oscillator.stop(currentTime);
        }
      } catch (_error) {
        // Oscillator might already be stopped, ignore
      }
    });

    // Clear the tracking array
    scheduledOscillatorsRef.current = [];

    // Clear any already scheduled metronome events
    audioEngine.clearScheduledEvents();
  }, [audioEngine]);

  /**
   * Start user performance exactly at beat 1 (no countdown needed)
   */
  const startUserPerformanceAtBeat1 = useCallback(() => {
    setGamePhase(GAME_PHASES.USER_PERFORMANCE);
    setHasUserStartedTapping(false);
    setCountdownToStart(null);
  }, []);

  /**
   * Start get ready phase (metronome continues, taps ignored)
   */
  const startGetReadyPhase = useCallback(() => {
    setGamePhase(GAME_PHASES.GET_READY);
    setHasUserStartedTapping(false);
    setUserTaps([]);
    userTapsRef.current = []; // Clear user taps ref

    // Calculate when the next beat 1 will occur
    const currentTime = audioEngine.getCurrentTime();
    const timeSinceStart = currentTime - metronomeStartTimeRef.current;
    const beatDur = beatDuration.current;
    const beatsPerMeasure = gameSettings.timeSignature.beats;
    const currentBeatFloat = timeSinceStart / beatDur;
    const nextMeasureStart =
      Math.ceil(currentBeatFloat / beatsPerMeasure) * beatsPerMeasure;
    const nextBeat1Time =
      metronomeStartTimeRef.current + nextMeasureStart * beatDur;

    // Store this timing for user performance
    userPerformanceStartTime.current = nextBeat1Time;

    // Calculate expected taps now (since we know when user will start)
    if (patternInfoRef.current) {
      const { pattern } = patternInfoRef.current;
      const currentBeatDur = beatDuration.current; // Use current beat duration
      const expectedTimes = [];

      pattern.forEach((beat, index) => {
        if (beat === 1) {
          // Calculate tap time relative to user performance start time
          const relativeTime = (index * currentBeatDur) / 4; // Convert to sixteenth note timing
          const absoluteTapTime = nextBeat1Time + relativeTime;
          expectedTimes.push(absoluteTapTime);
        }
      });

      // Expected taps calculated for user performance phase

      setExpectedTaps(expectedTimes);
    }

    // Calculate how long until beat 1 arrives, minus a small buffer for user reaction time
    const reactionTimeBuffer = 0.2; // 200ms before beat 1 to enable tap button
    const timeUntilBeat1 = nextBeat1Time - currentTime;
    const getReadyDuration = Math.max(
      0,
      (timeUntilBeat1 - reactionTimeBuffer) * 1000
    ); // Convert to ms

    // Transition timing calculated with reaction buffer

    // Transition to user performance slightly before beat 1 for better UX
    setTimeout(() => startUserPerformanceAtBeat1(), getReadyDuration);
  }, [audioEngine, beatDuration, gameSettings, startUserPerformanceAtBeat1]);

  /**
   * Start pattern playback phase with specific pattern
   */
  const startPatternPlaybackWithPattern = useCallback(
    (pattern, preciseStartTime = null) => {
      if (!pattern) {
        console.error("No pattern provided for playback - returning to setup");
        setGamePhase(GAME_PHASES.SETUP);
        return;
      }

      setGamePhase(GAME_PHASES.PATTERN_PLAYBACK);
      const startTime = preciseStartTime || audioEngine.getCurrentTime() + 0.1;
      patternStartTime.current = startTime;
      const beatDur = beatDuration.current;

      // Store pattern info for later use when calculating expected taps
      // We can't calculate expected tap times here because we don't know when user will start tapping yet
      const patternInfo = {
        pattern: pattern.pattern,
        startTime: startTime,
        beatDuration: beatDur,
      };

      // Store pattern info immediately in ref for synchronous access
      patternInfoRef.current = patternInfo;

      // Store pattern info for later calculation
      setCurrentPattern({
        ...pattern,
        patternInfo: patternInfo,
      });

      // Pattern info stored for later expected tap calculation

      // Clear expected taps - they'll be calculated when user starts tapping
      setExpectedTaps([]);

      // Play pattern using piano sound (G4.mp3) - metronome is handled by continuous metronome
      pattern.pattern.forEach((beat, index) => {
        if (beat === 1) {
          const noteTime = startTime + (index * beatDur) / 4; // Sixteenth note timing
          audioEngine.createPianoSound(noteTime, 0.8, 0.5); // Use G4.mp3 for pattern notes
        }
      });

      // Transition to get ready phase after pattern completes
      const patternDuration = ((pattern.pattern.length * beatDur) / 4) * 1000;
      setTimeout(() => startGetReadyPhase(), patternDuration);
    },
    [audioEngine, beatDuration, startGetReadyPhase]
  );

  /**
   * Start metronome count-in phase with pattern
   */
  const startCountInWithPattern = useCallback(
    (pattern, countInStartTime, timeSignatureOverride = null) => {
      const beatDur = beatDuration.current;
      const currentTimeSignature =
        timeSignatureOverride || gameSettings.timeSignature;
      // Compound time (6/8) gets 2 measures of count-in (4 compound beats) so the student
      // can feel the full dotted-quarter pulse before playing. Simple time stays at 1 measure.
      const beatsInCountIn = currentTimeSignature.isCompound
        ? currentTimeSignature.beats * 2 // 2 compound beats × 2 measures = 4 for 6/8
        : currentTimeSignature.beats; // 1 measure for simple time (4/4=4, 3/4=3, 2/4=2)

      // Calculate precise timing for pattern start (immediately after count-in)
      const patternStartTime = countInStartTime + beatsInCountIn * beatDur;

      // The continuous metronome handles both audio and visual synchronization

      // Schedule pattern playback to start after count-in
      const delayToPatternStart =
        (patternStartTime - audioEngine.getCurrentTime()) * 1000;
      setTimeout(
        () => startPatternPlaybackWithPattern(pattern, patternStartTime),
        Math.max(0, delayToPatternStart)
      );
    },
    [audioEngine, gameSettings, beatDuration, startPatternPlaybackWithPattern]
  );

  /**
   * Start a new game session
   */
  const startGame = useCallback(
    async (overrideSettings = null) => {
      try {
        // Use override settings if provided, otherwise use current state
        const currentSettings = overrideSettings || gameSettings;

        // Resume audio context if suspended
        await audioEngine.resumeAudioContext();

        setGamePhase(GAME_PHASES.COUNT_IN);
        gameStartTime.current = audioEngine.getCurrentTime();

        // Load first pattern using current settings
        const pattern = await getPattern(
          currentSettings.timeSignature.name,
          currentSettings.difficulty,
          rhythmPatterns
        );

        if (!pattern || !pattern.pattern || !Array.isArray(pattern.pattern)) {
          console.error(
            "Failed to load valid pattern, cannot start game. Pattern:",
            pattern
          );
          setGamePhase(GAME_PHASES.SETUP);
          return;
        }

        setCurrentPattern(pattern);
        setCurrentBeat(0);
        setUserTaps([]);
        setExpectedTaps([]);
        setCountdownToStart(null); // Clear countdown
        patternInfoRef.current = null; // Clear previous pattern info
        userTapsRef.current = []; // Clear user taps ref

        // Reset exercise progress
        setExerciseProgress({
          currentExercise: 0,
          totalExercises: 10,
          exerciseScores: [],
          isGameComplete: false,
        });

        // Update gameSettings state with current settings if override was provided
        if (overrideSettings) {
          setGameSettings(overrideSettings);
        }

        // Start continuous metronome and count-in
        const countInStartTime = audioEngine.getCurrentTime() + 0.1;
        startContinuousMetronome(
          countInStartTime,
          currentSettings.timeSignature
        );
        startCountInWithPattern(
          pattern,
          countInStartTime,
          currentSettings.timeSignature
        );
      } catch (error) {
        console.error("Error starting game:", error);
        setGamePhase(GAME_PHASES.SETUP);
      }
    },
    [
      gameSettings,
      rhythmPatterns,
      audioEngine,
      startContinuousMetronome,
      startCountInWithPattern,
    ]
  );

  // IOS-02: Handle user-gesture tap-to-start for trail auto-start when AudioContext was suspended
  const handleGestureStart = useCallback(async () => {
    // Create AudioContext if it doesn't exist yet (iOS needs user gesture to create)
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
    setNeedsGestureToStart(false);
    hasAutoConfigured.current = true;
    const timeSigString = nodeConfig?.timeSignature || "4/4";
    const trailSettings = {
      difficulty: nodeConfig?.difficulty || "beginner",
      tempo: nodeConfig?.tempo || 80,
      timeSignature: getTimeSignatureObject(timeSigString),
      totalExercises: 10,
    };
    setGameSettings(trailSettings);
    setTimeout(() => startGame(trailSettings), 50);
  }, [getOrCreateAudioContext, nodeConfig, getTimeSignatureObject, startGame]);

  /**
   * Evaluate user performance using metronome-based timing
   */
  const evaluatePerformance = useCallback(() => {
    // Metronome is already stopped at measure end
    setGamePhase(GAME_PHASES.FEEDBACK);

    // Use ref for real-time user taps data
    const currentUserTaps = userTapsRef.current;

    if (!patternInfoRef.current || currentUserTaps.length === 0) {
      setSessionStats((prev) => ({
        patternsCompleted: prev.patternsCompleted + 1,
        totalScore: prev.totalScore,
        perfectTaps: prev.perfectTaps,
        goodTaps: prev.goodTaps,
        fairTaps: prev.fairTaps,
        missedTaps:
          prev.missedTaps +
          (patternInfoRef.current?.pattern?.filter((beat) => beat === 1)
            .length || 0),
        comboCount: 0,
        maxCombo: prev.maxCombo,
      }));
      playWrongSound();
      return;
    }

    // Get pattern and timing info
    const { pattern } = patternInfoRef.current;
    const currentBeatDur = beatDuration.current;
    const beatsPerMeasure = gameSettings.timeSignature.beats;
    // For compound time (6/8): measureLength=12, beats=2 → unitsPerBeat=6
    // For simple time (4/4): measureLength=16, beats=4 → unitsPerBeat=4
    const unitsPerBeat =
      gameSettings.timeSignature.measureLength /
      gameSettings.timeSignature.beats;

    // Calculate expected tap positions within the measure (in beats, not seconds)
    const expectedBeatPositions = [];
    pattern.forEach((beat, index) => {
      if (beat === 1) {
        const beatPosition = index / unitsPerBeat; // Convert sixteenth note index to beat position
        expectedBeatPositions.push(beatPosition);
      }
    });

    let perfectCount = 0,
      goodCount = 0,
      fairCount = 0,
      missCount = 0;
    let totalScore = 0;
    let combo = 0,
      maxCombo = 0;

    // Evaluate each expected tap using the same logic as immediate feedback
    expectedBeatPositions.forEach((expectedBeatPos) => {
      // Find the user tap that best matches this expected beat position
      let bestAccuracy = "MISS";

      currentUserTaps.forEach((userTap) => {
        // Convert user tap relative time to beat position within the measure
        const userBeatPos =
          (userTap.relativeTime / currentBeatDur) % beatsPerMeasure;

        // Calculate timing error between expected and user beat positions
        let timingError = Math.abs(userBeatPos - expectedBeatPos);

        // Handle wrap-around (e.g., user tapped at beat 0.9, expected at beat 0.1)
        if (timingError > beatsPerMeasure / 2) {
          timingError = beatsPerMeasure - timingError;
        }

        // Convert beat timing error to seconds for accuracy calculation
        const timingErrorSeconds = timingError * currentBeatDur;

        // Use the same accuracy calculation as immediate feedback
        const thresholds = calculateTimingThresholds(gameSettings.tempo);
        const timingErrorMs = timingErrorSeconds * 1000;

        let accuracy = "MISS";
        if (timingErrorMs <= thresholds.PERFECT) accuracy = "PERFECT";
        else if (timingErrorMs <= thresholds.GOOD) accuracy = "GOOD";
        else if (timingErrorMs <= thresholds.FAIR) accuracy = "FAIR";

        // Keep the best accuracy for this expected tap
        const accuracyRank = { PERFECT: 4, GOOD: 3, FAIR: 2, MISS: 1 };
        if (accuracyRank[accuracy] > accuracyRank[bestAccuracy]) {
          bestAccuracy = accuracy;
        }
      });

      // Update counts
      switch (bestAccuracy) {
        case "PERFECT":
          perfectCount++;
          combo++;
          break;
        case "GOOD":
          goodCount++;
          combo++;
          break;
        case "FAIR":
          fairCount++;
          combo = 0;
          break;
        case "MISS":
          missCount++;
          combo = 0;
          break;
      }

      maxCombo = Math.max(maxCombo, combo);

      // Calculate score with combo multiplier
      let points = SCORING[bestAccuracy];
      if (combo >= 3) {
        points *= SCORING.COMBO_MULTIPLIER;
      }
      totalScore += Math.round(points);
    });

    // Update session stats
    setSessionStats((prev) => ({
      patternsCompleted: prev.patternsCompleted + 1,
      totalScore: prev.totalScore + totalScore,
      perfectTaps: prev.perfectTaps + perfectCount,
      goodTaps: prev.goodTaps + goodCount,
      fairTaps: prev.fairTaps + fairCount,
      missedTaps: prev.missedTaps + missCount,
      comboCount: combo,
      maxCombo: Math.max(prev.maxCombo, maxCombo),
    }));

    // Calculate exercise score as percentage
    const totalAccurateTaps = perfectCount + goodCount + fairCount;
    const totalExpectedTaps = expectedBeatPositions.length;
    const exerciseAccuracy =
      totalExpectedTaps > 0 ? (totalAccurateTaps / totalExpectedTaps) * 100 : 0;

    // Update exercise progress
    const newExerciseNumber = exerciseProgress.currentExercise + 1;
    const newExerciseScores = [
      ...exerciseProgress.exerciseScores,
      Math.round(exerciseAccuracy),
    ];

    setExerciseProgress((prev) => ({
      ...prev,
      currentExercise: newExerciseNumber,
      exerciseScores: newExerciseScores,
      isGameComplete: newExerciseNumber >= prev.totalExercises,
    }));

    // Check if this is the last exercise
    if (newExerciseNumber >= exerciseProgress.totalExercises) {
      // Play victory sound for successful session completion
      playVictorySound();

      // Show final results after a delay
      setTimeout(() => {
        setGamePhase(GAME_PHASES.SESSION_COMPLETE);
      }, 2000);

      return;
    }

    // For individual exercises, only play wrong sound if failed
    const exercisePassed = exerciseAccuracy >= 50; // 50% threshold
    if (!exercisePassed) {
      playWrongSound();
    }

    // Stay in FEEDBACK phase - user must click "Next Pattern" button to continue
  }, [
    patternInfoRef,
    userTapsRef,
    beatDuration,
    gameSettings,
    exerciseProgress.currentExercise,
    exerciseProgress.exerciseScores,
    exerciseProgress.totalExercises,
    playVictorySound,
    playWrongSound,
  ]);

  /**
   * Handle user tap input
   */
  const handleTap = useCallback(() => {
    // Ignore taps during get ready phase
    if (gamePhase === GAME_PHASES.GET_READY) return;
    if (gamePhase !== GAME_PHASES.USER_PERFORMANCE) return;

    const tapTime = audioEngine.getCurrentTime();

    // If this is the first tap, start the timed response phase
    if (!hasUserStartedTapping) {
      // Calculate which beat 1 the user actually tapped on
      const currentTime = audioEngine.getCurrentTime();
      const timeSinceMetronomeStart =
        currentTime - metronomeStartTimeRef.current;
      const beatDur = beatDuration.current;
      const beatsPerMeasure = gameSettings.timeSignature.beats;
      const totalBeatsFloat = timeSinceMetronomeStart / beatDur;

      // Find the nearest beat 1 (downbeat) - look both forward and backward
      const currentMeasureFloat = totalBeatsFloat / beatsPerMeasure;
      const prevMeasure = Math.floor(currentMeasureFloat);
      const nextMeasure = Math.ceil(currentMeasureFloat);

      const prevBeat1Time =
        metronomeStartTimeRef.current + prevMeasure * beatsPerMeasure * beatDur;
      const nextBeat1Time =
        metronomeStartTimeRef.current + nextMeasure * beatsPerMeasure * beatDur;

      // Choose the closest beat 1
      const prevError = Math.abs(currentTime - prevBeat1Time);
      const nextError = Math.abs(currentTime - nextBeat1Time);

      const nearestBeat1Time =
        prevError < nextError ? prevBeat1Time : nextBeat1Time;
      const timingError = Math.min(prevError, nextError);

      // Very generous tolerance - allow up to 1.2 beats worth of error
      // This gives users plenty of room to sync with the metronome
      const maxAllowedError = beatDur * 1.2; // 120% of a beat duration

      if (timingError > maxAllowedError) {
        // Don't start the performance yet, let them try again
        return;
      }

      // Now we can mark that the user has started tapping
      setHasUserStartedTapping(true);

      const actualBeat1Time = nearestBeat1Time;

      // Update the user performance start time to the actual beat 1 they tapped on
      userPerformanceStartTime.current = actualBeat1Time;

      // Recalculate expected taps relative to the new start time
      if (patternInfoRef.current) {
        const { pattern } = patternInfoRef.current;
        const currentBeatDur = beatDuration.current; // Use current beat duration, not stored one
        const expectedTimes = [];

        pattern.forEach((beat, index) => {
          if (beat === 1) {
            const relativeTime = (index * currentBeatDur) / 4; // Convert to sixteenth note timing
            const absoluteTapTime = actualBeat1Time + relativeTime;
            expectedTimes.push(absoluteTapTime);
          }
        });

        setExpectedTaps(expectedTimes);
      }

      // Wait for the full measure to complete before evaluation
      // This ensures victory sound plays at the end of the measure, not immediately after last tap
      const measureDuration = beatsPerMeasure * beatDur;
      const measureEndTime = actualBeat1Time + measureDuration;
      const delayToMeasureEnd = (measureEndTime - currentTime) * 1000;

      // Stop metronome exactly at the end of the measure (beat 4)
      setTimeout(
        () => {
          stopContinuousMetronome();
        },
        Math.max(0, delayToMeasureEnd) // Stop exactly at measure end
      );

      // Evaluate and play victory sound slightly after metronome stops
      const evaluationDelay = delayToMeasureEnd + 200; // 200ms after measure end
      setTimeout(
        () => {
          evaluatePerformance();
        },
        Math.max(200, evaluationDelay) // Small pause after metronome stops
      );
    }

    const relativeTime = tapTime - userPerformanceStartTime.current;
    const tapData = { time: tapTime, relativeTime };

    // Store in both state (for UI) and ref (for real-time evaluation)
    setUserTaps((prev) => [...prev, tapData]);
    userTapsRef.current = [...userTapsRef.current, tapData];

    // Tap analysis for accuracy calculation

    // Provide immediate feedback using the same logic as final evaluation
    let accuracy = "MISS";

    if (patternInfoRef.current) {
      const { pattern } = patternInfoRef.current;
      const currentBeatDur = beatDuration.current;
      const beatsPerMeasure = gameSettings.timeSignature.beats;
      // For compound time (6/8): measureLength=12, beats=2 → unitsPerBeat=6
      // For simple time (4/4): measureLength=16, beats=4 → unitsPerBeat=4
      const unitsPerBeat =
        gameSettings.timeSignature.measureLength /
        gameSettings.timeSignature.beats;

      // Convert user tap to beat position
      const userBeatPos = (relativeTime / currentBeatDur) % beatsPerMeasure;

      // Find expected beat positions
      const expectedBeatPositions = [];
      pattern.forEach((beat, index) => {
        if (beat === 1) {
          const beatPosition = index / unitsPerBeat;
          expectedBeatPositions.push(beatPosition);
        }
      });

      // Find best matching expected beat position
      let bestTimingError = Infinity;
      expectedBeatPositions.forEach((expectedBeatPos) => {
        let timingError = Math.abs(userBeatPos - expectedBeatPos);

        // Handle wrap-around
        if (timingError > beatsPerMeasure / 2) {
          timingError = beatsPerMeasure - timingError;
        }

        if (timingError < bestTimingError) {
          bestTimingError = timingError;
        }
      });

      // Convert to seconds and calculate accuracy
      if (bestTimingError < Infinity) {
        const timingErrorSeconds = bestTimingError * currentBeatDur;
        const timingErrorMs = timingErrorSeconds * 1000;
        const thresholds = calculateTimingThresholds(gameSettings.tempo);

        if (timingErrorMs <= thresholds.PERFECT) accuracy = "PERFECT";
        else if (timingErrorMs <= thresholds.GOOD) accuracy = "GOOD";
        else if (timingErrorMs <= thresholds.FAIR) accuracy = "FAIR";
      }
    }

    // Immediate feedback provided to user

    setFeedback({ accuracy, points: SCORING[accuracy] });

    // Play feedback sound for individual tap - use Web Audio for instant response
    audioEngine.createTapSound(0.8);

    // Clear feedback after short delay
    setTimeout(() => setFeedback(null), 1000);
  }, [
    gamePhase,
    audioEngine,
    hasUserStartedTapping,
    beatDuration,
    gameSettings,
    stopContinuousMetronome,
    evaluatePerformance,
  ]);

  /**
   * Start next pattern
   */
  const nextPattern = useCallback(async () => {
    try {
      // Check if game is complete before loading next pattern
      if (exerciseProgress.isGameComplete) {
        return;
      }

      // Stop any existing metronome
      stopContinuousMetronome();

      const pattern = await getPattern(
        gameSettings.timeSignature.name,
        gameSettings.difficulty,
        rhythmPatterns
      );

      if (!pattern || !pattern.pattern || !Array.isArray(pattern.pattern)) {
        console.error("Failed to load valid pattern for next round");
        setGamePhase(GAME_PHASES.SETUP);
        return;
      }

      setCurrentPattern(pattern);
      setCurrentBeat(0);
      setUserTaps([]);
      setExpectedTaps([]);
      setFeedback(null);
      setHasUserStartedTapping(false);
      userTapsRef.current = []; // Clear user taps ref

      setGamePhase(GAME_PHASES.COUNT_IN);

      // Start new continuous metronome and count-in
      const countInStartTime = audioEngine.getCurrentTime() + 0.1;
      startContinuousMetronome(countInStartTime);
      startCountInWithPattern(pattern, countInStartTime);
    } catch (error) {
      console.error("Error loading next pattern:", error);
      setGamePhase(GAME_PHASES.SETUP);
    }
  }, [
    exerciseProgress.isGameComplete,
    gameSettings,
    rhythmPatterns,
    stopContinuousMetronome,
    startContinuousMetronome,
    audioEngine,
    startCountInWithPattern,
  ]);

  /**
   * Reset game to setup
   */
  const resetGame = useCallback(() => {
    stopContinuousMetronome();
    setGamePhase(GAME_PHASES.SETUP);
    setCurrentPattern(null);
    setCurrentBeat(0);
    setUserTaps([]);
    setExpectedTaps([]);
    setFeedback(null);
    setHasUserStartedTapping(false);
    userTapsRef.current = []; // Clear user taps ref
    setSessionStats({
      patternsCompleted: 0,
      totalScore: 0,
      perfectTaps: 0,
      goodTaps: 0,
      fairTaps: 0,
      missedTaps: 0,
      comboCount: 0,
      maxCombo: 0,
    });
    setExerciseProgress({
      currentExercise: 0,
      totalExercises: 10,
      exerciseScores: [],
      isGameComplete: false,
    });
  }, [stopContinuousMetronome]);

  /**
   * End session and show summary
   */
  const endSession = useCallback(() => {
    setGamePhase(GAME_PHASES.SESSION_COMPLETE);
  }, []);

  // Show setup screen (for free play mode only)
  if (gamePhase === GAME_PHASES.SETUP) {
    // Show loading screen when coming from trail and waiting for auto-start
    if (nodeConfig) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
          {/* IOS-02: Gesture gate overlay must render HERE — the early return prevents the overlay at line 1358 from rendering */}
          {needsGestureToStart ? (
            <AudioInterruptedOverlay
              isVisible={true}
              onTapToResume={handleGestureStart}
              onRestartExercise={() => navigate(-1)}
            />
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
              <p className="text-lg font-medium text-white/80">
                {t("common.loading")}
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <RhythmGameSetup
        settings={gameSettings}
        onUpdateSettings={setGameSettings}
        onStart={(finalSettings) => {
          setGameSettings(finalSettings);
          startGame(finalSettings);
        }}
        backRoute="/rhythm-mode"
      />
    );
  }

  // Show session complete screen
  if (gamePhase === GAME_PHASES.SESSION_COMPLETE) {
    // Calculate total score for VictoryScreen
    const totalScore = exerciseProgress.exerciseScores.reduce(
      (sum, score) => sum + score,
      0
    );
    const totalPossibleScore = exerciseProgress.exerciseScores.length * 100;

    return (
      <VictoryScreen
        score={Math.round(totalScore)}
        totalPossibleScore={totalPossibleScore}
        onReset={resetGame}
        onExit={() => navigate("/practice-modes")}
        nodeId={nodeId}
        exerciseIndex={trailExerciseIndex}
        totalExercises={trailTotalExercises}
        exerciseType={trailExerciseType}
        onNextExercise={handleNextExercise}
      />
    );
  }

  // Get guidance text based on game phase
  const getGuidanceText = () => {
    if (gamePhase === GAME_PHASES.COUNT_IN) {
      return t("games.metronomeTrainer.guidance.countIn");
    }
    if (gamePhase === GAME_PHASES.PATTERN_PLAYBACK) {
      return t("games.metronomeTrainer.guidance.patternPlayback");
    }
    if (gamePhase === GAME_PHASES.GET_READY) {
      return t("games.metronomeTrainer.guidance.getReady");
    }
    if (gamePhase === GAME_PHASES.USER_PERFORMANCE) {
      return hasUserStartedTapping
        ? t("games.metronomeTrainer.guidance.userActive")
        : t("games.metronomeTrainer.guidance.userWaiting");
    }
    if (gamePhase === GAME_PHASES.FEEDBACK) {
      return t("games.metronomeTrainer.guidance.feedback");
    }
    return t("games.metronomeTrainer.guidance.default");
  };

  const displayExerciseNumber = Math.min(
    exerciseProgress.currentExercise +
      (gamePhase === GAME_PHASES.SESSION_COMPLETE ? 0 : 1),
    Math.max(1, exerciseProgress.totalExercises || 1)
  );

  // Main game interface - New compact layout
  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900"
      dir="rtl"
    >
      {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}

      {/* Audio Interrupted Overlay — shown on iOS Safari after phone call, app switch, lock screen */}
      <AudioInterruptedOverlay
        isVisible={isInterrupted}
        onTapToResume={handleTapToResume}
        onRestartExercise={() => setGamePhase(GAME_PHASES.SETUP)}
      />

      {/* Trail gesture gate — shown when trail auto-start needs a user gesture to resume AudioContext */}
      {needsGestureToStart && (
        <AudioInterruptedOverlay
          isVisible={true}
          onTapToResume={handleGestureStart}
          onRestartExercise={() => navigate(-1)}
        />
      )}

      {/* Compact Header */}
      <div className="flex flex-shrink-0 items-center justify-between px-4 py-2 landscape:py-1">
        {/* Only show back button during gameplay (not on session complete screen) */}
        {gamePhase !== GAME_PHASES.SESSION_COMPLETE && (
          <BackButton
            to={nodeId ? "/trail" : "/rhythm-mode"}
            name={nodeId ? "Trail" : t("games.backToModes")}
            className="text-sm text-white/80 hover:text-white"
          />
        )}
        <div className="text-center text-white">
          <h1 className="text-base font-bold sm:text-lg">
            {t("games.metronomeTrainer.headerTitle")}
          </h1>
          <p className="text-xs">
            {gameSettings.timeSignature.name} • {gameSettings.tempo} BPM •{" "}
            {gameSettings.difficulty}
          </p>
        </div>
        <div className="whitespace-nowrap text-right text-xs text-white">
          {t("games.metronomeTrainer.progressLabel", {
            current: displayExerciseNumber,
            total: exerciseProgress.totalExercises,
          })}
        </div>
      </div>

      {/* Main Game Area - Side by Side */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 sm:flex-row landscape:flex-row landscape:gap-2">
        {/* Left Side: Metronome + Guidance */}
        <div className="flex min-h-0 flex-1 flex-col justify-center space-y-4">
          {/* Metronome Beats - Horizontal */}
          <MetronomeDisplay
            currentBeat={currentBeat}
            timeSignature={gameSettings.timeSignature}
            isActive={gamePhase !== GAME_PHASES.FEEDBACK}
            isCountIn={gamePhase === GAME_PHASES.COUNT_IN}
          />

          {/* User Guidance Text */}
          <div className="px-4 text-center text-sm text-white sm:text-base">
            {getGuidanceText()}
          </div>
        </div>

        {/* Right Side: TAP HERE Button */}
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <TapArea
            onTap={handleTap}
            feedback={feedback}
            isActive={gamePhase === GAME_PHASES.USER_PERFORMANCE}
            title={
              gamePhase === GAME_PHASES.GET_READY
                ? t("games.metronomeTrainer.tapArea.getReady")
                : gamePhase === GAME_PHASES.USER_PERFORMANCE
                  ? t("games.metronomeTrainer.tapArea.tapHere")
                  : t("games.metronomeTrainer.tapArea.listen")
            }
          />
        </div>
      </div>

      {/* Bottom Stats + Controls */}
      <div className="flex-shrink-0 space-y-3 px-4 pb-4">
        {/* Compact Stats Row */}
        <div className="flex justify-around text-center text-xs text-white sm:text-sm">
          <div>
            <div className="text-lg font-bold text-blue-400 sm:text-2xl">
              {sessionStats.patternsCompleted}
            </div>
            <div>{t("games.metronomeTrainer.stats.patterns")}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400 sm:text-2xl">
              {sessionStats.totalScore}
            </div>
            <div>XP</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400 sm:text-2xl">
              {sessionStats.maxCombo}
            </div>
            <div>{t("games.metronomeTrainer.stats.maxCombo")}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-400 sm:text-2xl">
              {sessionStats.perfectTaps + sessionStats.goodTaps}
            </div>
            <div>{t("games.metronomeTrainer.stats.goodTaps")}</div>
          </div>
        </div>

        {/* Navigation Buttons (feedback phase only) */}
        {gamePhase === GAME_PHASES.FEEDBACK &&
          !exerciseProgress.isGameComplete && (
            <div className="flex justify-center gap-3">
              <Button
                onClick={nextPattern}
                variant="primary"
                className="px-6 py-2 text-sm sm:text-base"
              >
                {t("games.metronomeTrainer.buttons.nextPattern")}
              </Button>
              <Button
                onClick={endSession}
                variant="outline"
                className="px-6 py-2 text-sm sm:text-base"
              >
                {t("games.metronomeTrainer.buttons.endSession")}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}

export default MetronomeTrainer;
