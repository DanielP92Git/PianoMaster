import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAudioEngine } from "../../../hooks/useAudioEngine";
import { useSounds } from "../../../features/games/hooks/useSounds";
import {
  getPattern,
  DIFFICULTY_LEVELS,
  TIME_SIGNATURES,
} from "./RhythmPatternGenerator";
import { MetronomeDisplay, TapArea, PreGameSettingsScreen } from "./components";
import BackButton from "../../ui/BackButton";
import Button from "../../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Trophy, RotateCcw, Home } from "lucide-react";

// Progress bar component to track completed exercises
const ProgressBar = ({ current, total }) => {
  const progressPercent = Math.min(100, (current / total) * 100);
  return (
    <div className="w-full bg-white/20 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
      <div
        className="bg-indigo-500 h-3 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
        style={{ width: `${progressPercent}%` }}
      >
        {progressPercent > 15 && (
          <span className="text-xs text-white font-medium">
            {current}/{total}
          </span>
        )}
      </div>
      <div className="text-xs text-white text-center mt-1 font-medium">
        Exercise {current} of {total}
      </div>
    </div>
  );
};

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
  const audioEngine = useAudioEngine(120);
  const {
    playCorrectSound,
    playWrongSound,
    playVictorySound,
    playDrumStickSound,
  } = useSounds();

  // Game state
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.SETUP);
  const [gameSettings, setGameSettings] = useState({
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    timeSignature: TIME_SIGNATURES.FOUR_FOUR,
    tempo: 90,
    adaptiveDifficulty: false,
  });

  // Debug log for initial settings (only log once on mount)
  useEffect(() => {
    console.log(
      `[SETTINGS] Component mounted with gameSettings:`,
      gameSettings
    );
    console.log(
      `[SETTINGS] Available time signatures:`,
      Object.values(TIME_SIGNATURES)
    );
  }, []); // Only run once on mount

  // Pattern and timing state
  const [currentPattern, setCurrentPattern] = useState(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [expectedTaps, setExpectedTaps] = useState([]);
  const [userTaps, setUserTaps] = useState([]);
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
  const [countdownToStart, setCountdownToStart] = useState(null); // Countdown until user should start tapping

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

      console.log(
        `[METRONOME] STARTING continuous metronome at ${startTime.toFixed(3)}s`
      );
      console.log(`[METRONOME] Time signature: ${currentTimeSignature.name}`);
      console.log(`[METRONOME] Beats per measure: ${beatsPerMeasure}`);
      metronomeStartTimeRef.current = startTime;

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
        // Calculate how many beats have passed since start
        const timeSinceStart = currentTime - startTime;
        const totalBeatsFloat = timeSinceStart / beatDur;
        const totalBeatsCompleted = Math.floor(totalBeatsFloat);

        // Schedule the next few beats
        for (let i = 0; i < 3; i++) {
          const beatNumber = totalBeatsCompleted + i;
          const beatTime = startTime + beatNumber * beatDur;

          if (beatTime > currentTime + 0.05) {
            // Only schedule if more than 50ms away
            const isDownbeat = beatNumber % beatsPerMeasure === 0;
            const beatInMeasure = (beatNumber % beatsPerMeasure) + 1; // 1-based beat number

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
              const totalBeatsFloat = timeSinceStart / beatDur;
              const totalBeatsCompleted = Math.floor(totalBeatsFloat);
              const beatInMeasure = (totalBeatsCompleted % beatsPerMeasure) + 1;

              // Visual metronome beat tracking

              setCurrentBeat(beatInMeasure);
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
    console.log(`[METRONOME] Stopping metronome at ${currentTime.toFixed(3)}s`);

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

    console.log(
      `[METRONOME] Stopping ${futureOscillators.length} future oscillators`
    );

    futureOscillators.forEach((info) => {
      try {
        if (info.oscillator && info.oscillator.stop) {
          info.oscillator.stop(currentTime);
        }
      } catch (error) {
        // Oscillator might already be stopped, ignore
      }
    });

    // Clear the tracking array
    scheduledOscillatorsRef.current = [];

    // Clear any already scheduled metronome events
    audioEngine.clearScheduledEvents();
    console.log(`[METRONOME] All metronome events cleared`);
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

      console.log(
        `[PATTERN] Time signature: ${pattern.timeSignature || "unknown"}`
      );
      console.log(
        `[PATTERN] Expected beats per measure: ${pattern.metadata?.beatsPerMeasure || "unknown"}`
      );
      console.log(`[PATTERN] Pattern length: ${pattern.pattern.length}`);
      console.log(`[PATTERN] Pattern: ${pattern.pattern}`);
      console.log(`[PATTERN] Pattern source: ${pattern.source || "unknown"}`);
      console.log(
        `[PATTERN] Pattern time signature: ${pattern.timeSignature || "unknown"}`
      );

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
      const beatsInCountIn = currentTimeSignature.beats;

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
        console.log(`[GAME START] Using settings:`, currentSettings);
        console.log(
          `[GAME START] Time signature: ${currentSettings.timeSignature.name}`
        );

        // Resume audio context if suspended
        await audioEngine.resumeAudioContext();

        setGamePhase(GAME_PHASES.COUNT_IN);
        gameStartTime.current = audioEngine.getCurrentTime();

        // Load first pattern using current settings
        const pattern = await getPattern(
          currentSettings.timeSignature.name,
          currentSettings.difficulty
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
      audioEngine,
      startContinuousMetronome,
      startCountInWithPattern,
    ]
  );

  /**
   * Evaluate user performance using metronome-based timing
   */
  const evaluatePerformance = useCallback(() => {
    console.log(
      `[TIMING] Victory sound evaluation started at ${audioEngine.getCurrentTime().toFixed(3)}s`
    );

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
      console.log(
        `[TIMING] Playing wrong sound at ${audioEngine.getCurrentTime().toFixed(3)}s`
      );
      playWrongSound();
      return;
    }

    // Get pattern and timing info
    const { pattern } = patternInfoRef.current;
    const currentBeatDur = beatDuration.current;
    const beatsPerMeasure = gameSettings.timeSignature.beats;

    // Calculate expected tap positions within the measure (in beats, not seconds)
    const expectedBeatPositions = [];
    pattern.forEach((beat, index) => {
      if (beat === 1) {
        const beatPosition = index / 4; // Convert sixteenth note index to beat position
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
      let bestUserTap = null;

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
          bestUserTap = userTap;
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
      // Calculate final score percentage
      const finalScorePercentage =
        newExerciseScores.reduce((sum, score) => sum + score, 0) /
        newExerciseScores.length;

      console.log(
        `[GAME COMPLETE] Final score: ${finalScorePercentage.toFixed(1)}% - Playing VICTORY sound at ${audioEngine.getCurrentTime().toFixed(3)}s`
      );

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
      console.log(
        `[EXERCISE COMPLETE] Exercise ${newExerciseNumber}: ${exerciseAccuracy.toFixed(1)}% - Playing WRONG sound at ${audioEngine.getCurrentTime().toFixed(3)}s`
      );
      playWrongSound();
    } else {
      console.log(
        `[EXERCISE COMPLETE] Exercise ${newExerciseNumber}: ${exerciseAccuracy.toFixed(1)}% - No sound (waiting for next pattern)`
      );
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
    audioEngine,
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
      const nearestMeasure = prevError < nextError ? prevMeasure : nextMeasure;
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

      console.log(
        `[METRONOME] Scheduling metronome stop at measure end: ${measureEndTime.toFixed(3)}s (in ${delayToMeasureEnd.toFixed(0)}ms)`
      );
      console.log(
        `[METRONOME] Scheduling victory sound evaluation: ${(measureEndTime + 0.2).toFixed(3)}s (in ${(delayToMeasureEnd + 200).toFixed(0)}ms)`
      );

      // Stop metronome exactly at the end of the measure (beat 4)
      setTimeout(
        () => {
          console.log(
            `[METRONOME] STOPPING metronome NOW at ${audioEngine.getCurrentTime().toFixed(3)}s`
          );
          stopContinuousMetronome();
          console.log(
            `[METRONOME] Metronome STOPPED at ${audioEngine.getCurrentTime().toFixed(3)}s`
          );
        },
        Math.max(0, delayToMeasureEnd) // Stop exactly at measure end
      );

      // Evaluate and play victory sound slightly after metronome stops
      const evaluationDelay = delayToMeasureEnd + 200; // 200ms after measure end
      setTimeout(
        () => {
          console.log(
            `[METRONOME] Starting victory sound evaluation at ${audioEngine.getCurrentTime().toFixed(3)}s`
          );
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

      // Convert user tap to beat position
      const userBeatPos = (relativeTime / currentBeatDur) % beatsPerMeasure;

      // Find expected beat positions
      const expectedBeatPositions = [];
      pattern.forEach((beat, index) => {
        if (beat === 1) {
          const beatPosition = index / 4;
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
        gameSettings.difficulty
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

  // Show setup screen
  if (gamePhase === GAME_PHASES.SETUP) {
    return (
      <PreGameSettingsScreen
        settings={gameSettings}
        onUpdateSettings={(newSettings) => {
          console.log(`[SETTINGS] Updating settings:`, newSettings);
          console.log(`[SETTINGS] Time signature:`, newSettings.timeSignature);
          setGameSettings(newSettings);
        }}
        onStart={startGame}
        title="Metronome Rhythm Trainer"
        subtitle="Listen to rhythm patterns and tap them back with precise timing"
      />
    );
  }

  // Show session complete screen
  if (gamePhase === GAME_PHASES.SESSION_COMPLETE) {
    const finalScorePercentage =
      exerciseProgress.exerciseScores.length > 0
        ? exerciseProgress.exerciseScores.reduce(
            (sum, score) => sum + score,
            0
          ) / exerciseProgress.exerciseScores.length
        : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="w-16 h-16 text-yellow-400" />
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Session Complete!
            </CardTitle>
            <p className="text-gray-200">Great work on your rhythm training!</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Session Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {exerciseProgress.exerciseScores.length}
                </div>
                <div className="text-sm text-gray-300">Exercises Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {Math.round(finalScorePercentage)}%
                </div>
                <div className="text-sm text-gray-300">Final Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {
                    exerciseProgress.exerciseScores.filter(
                      (score) => score >= 80
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-300">Excellent (80%+)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {
                    exerciseProgress.exerciseScores.filter(
                      (score) => score >= 50
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-300">Passed (50%+)</div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Individual Exercise Scores
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {exerciseProgress.exerciseScores.map((score, index) => (
                  <div key={index} className="text-center">
                    <div
                      className={`text-lg font-bold ${
                        score >= 80
                          ? "text-green-400"
                          : score >= 50
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {score}%
                    </div>
                    <div className="text-xs text-gray-300">Ex {index + 1}</div>
                  </div>
                ))}
              </div>
              {exerciseProgress.exerciseScores.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-300">
                  Average: {Math.round(finalScorePercentage)}% | Best:{" "}
                  {Math.max(...exerciseProgress.exerciseScores)}% | Worst:{" "}
                  {Math.min(...exerciseProgress.exerciseScores)}%
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={resetGame}
                variant="outline"
                icon={RotateCcw}
                className="px-6 py-3"
              >
                Play Again
              </Button>
              <Button
                onClick={() => navigate("/practice-modes")}
                variant="primary"
                icon={Home}
                className="px-6 py-3"
              >
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get guidance text based on game phase
  const getGuidanceText = () => {
    if (gamePhase === GAME_PHASES.COUNT_IN) {
      return "Listen for the strong beat - tap to start!";
    }
    if (gamePhase === GAME_PHASES.PATTERN_PLAYBACK) {
      return "Listen to the pattern";
    }
    if (gamePhase === GAME_PHASES.GET_READY) {
      return "Get ready to tap the pattern";
    }
    if (gamePhase === GAME_PHASES.USER_PERFORMANCE) {
      return hasUserStartedTapping
        ? "Keep tapping the pattern!"
        : "Listen for the strong downbeat, then tap to start";
    }
    if (gamePhase === GAME_PHASES.FEEDBACK) {
      return "How did you do?";
    }
    return "Listen to the steady beat";
  };

  // Main game interface - New compact layout
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      {/* Compact Header */}
      <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between">
        <BackButton
          to="/rhythm-mode"
          name="Rhythm Games"
          className="text-white/80 hover:text-white text-sm"
        />
        <div className="text-center text-white">
          <h1 className="text-base sm:text-lg font-bold">
            Metronome Rhythm Trainer
          </h1>
          <p className="text-xs">
            {gameSettings.timeSignature.name} • {gameSettings.tempo} BPM •{" "}
            {gameSettings.difficulty}
          </p>
        </div>
        <div className="text-xs text-white text-right whitespace-nowrap">
          Ex {exerciseProgress.currentExercise}/
          {exerciseProgress.totalExercises}
        </div>
      </div>

      {/* Main Game Area - Side by Side */}
      <div className="flex-1 flex flex-col sm:flex-row gap-4 px-4 overflow-hidden min-h-0">
        {/* Left Side: Metronome + Guidance */}
        <div className="flex-1 flex flex-col justify-center space-y-4 min-h-0">
          {/* Metronome Beats - Horizontal */}
          <MetronomeDisplay
            currentBeat={currentBeat}
            timeSignature={gameSettings.timeSignature}
            isActive={gamePhase !== GAME_PHASES.FEEDBACK}
            isCountIn={gamePhase === GAME_PHASES.COUNT_IN}
          />

          {/* User Guidance Text */}
          <div className="text-center text-white text-sm sm:text-base px-4">
            {getGuidanceText()}
          </div>
        </div>

        {/* Right Side: TAP HERE Button */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <TapArea
            onTap={handleTap}
            feedback={feedback}
            isActive={gamePhase === GAME_PHASES.USER_PERFORMANCE}
            title={
              gamePhase === GAME_PHASES.GET_READY
                ? "GET READY"
                : gamePhase === GAME_PHASES.USER_PERFORMANCE
                  ? "TAP HERE"
                  : "LISTEN"
            }
          />
        </div>
      </div>

      {/* Bottom Stats + Controls */}
      <div className="flex-shrink-0 px-4 pb-4 space-y-3">
        {/* Compact Stats Row */}
        <div className="flex justify-around text-center text-white text-xs sm:text-sm">
          <div>
            <div className="text-lg sm:text-2xl font-bold text-blue-400">
              {sessionStats.patternsCompleted}
            </div>
            <div>Patterns</div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-green-400">
              {sessionStats.totalScore}
            </div>
            <div>Score</div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-yellow-400">
              {sessionStats.maxCombo}
            </div>
            <div>Max Combo</div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-purple-400">
              {sessionStats.perfectTaps + sessionStats.goodTaps}
            </div>
            <div>Good Taps</div>
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
                Next Pattern
              </Button>
              <Button
                onClick={endSession}
                variant="outline"
                className="px-6 py-2 text-sm sm:text-base"
              >
                End Session
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}

export default MetronomeTrainer;
