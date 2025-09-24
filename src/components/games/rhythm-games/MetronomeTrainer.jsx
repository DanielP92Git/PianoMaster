import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAudioEngine } from "../../../hooks/useAudioEngine";
import { useSounds } from "../../../features/games/hooks/useSounds";
import {
  getPattern,
  DIFFICULTY_LEVELS,
  TIME_SIGNATURES,
} from "./RhythmPatternGenerator";
import {
  MetronomeDisplay,
  TapArea,
  GameControls,
  PreGameSettingsScreen,
} from "./components";
import BackButton from "../../ui/BackButton";
import Button from "../../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card";
import { Trophy, RotateCcw, Home } from "lucide-react";

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

// Timing thresholds (in milliseconds)
const TIMING_THRESHOLDS = {
  PERFECT: 20, // ±20ms
  GOOD: 50, // ±50ms
  FAIR: 100, // ±100ms
  // >100ms = MISS
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
  const { playCorrectSound, playWrongSound, playVictorySound } = useSounds();

  // Game state
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.SETUP);
  const [gameSettings, setGameSettings] = useState({
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    timeSignature: TIME_SIGNATURES.FOUR_FOUR,
    tempo: 120,
    adaptiveDifficulty: false,
  });

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

  // Timing references
  const gameStartTime = useRef(null);
  const patternStartTime = useRef(null);
  const userPerformanceStartTime = useRef(null);
  const beatDuration = useRef(0);

  // Continuous metronome state
  const continuousMetronomeRef = useRef(null);
  const visualMetronomeRef = useRef(null);
  const metronomeStartTimeRef = useRef(null);
  const [hasUserStartedTapping, setHasUserStartedTapping] = useState(false);

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

        // Schedule play
        oscillator.start(time);
        oscillator.stop(time + 0.02); // Shorter duration
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
    (startTime) => {
      const beatDur = beatDuration.current;
      const beatsPerMeasure = gameSettings.timeSignature.beats;

      metronomeStartTimeRef.current = startTime;

      // Clear any existing metronome
      if (continuousMetronomeRef.current) {
        clearInterval(continuousMetronomeRef.current);
      }
      if (visualMetronomeRef.current) {
        clearInterval(visualMetronomeRef.current);
      }

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

            // Debug logging for first few beats
            if (beatNumber < 8) {
              console.log(
                `Scheduling beat ${beatNumber}: beat ${beatInMeasure} of measure ${Math.floor(beatNumber / beatsPerMeasure) + 1}, isDownbeat: ${isDownbeat}, time: ${beatTime.toFixed(3)}`
              );
            }

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

              // Debug logging for first few beats
              if (timeSinceStart < 8 * beatDur) {
                console.log(
                  `Visual update: beat ${beatInMeasure}, totalBeats: ${totalBeatsCompleted}, time: ${currentTime.toFixed(3)}`
                );
              }

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
    if (continuousMetronomeRef.current) {
      clearInterval(continuousMetronomeRef.current);
      continuousMetronomeRef.current = null;
    }
    if (visualMetronomeRef.current) {
      clearInterval(visualMetronomeRef.current);
      visualMetronomeRef.current = null;
    }
    // Clear any already scheduled metronome events to stop immediately
    audioEngine.clearScheduledEvents();
  }, [audioEngine]);

  /**
   * Start a new game session
   */
  const startGame = useCallback(async () => {
    try {
      // Resume audio context if suspended
      await audioEngine.resumeAudioContext();

      setGamePhase(GAME_PHASES.COUNT_IN);
      gameStartTime.current = audioEngine.getCurrentTime();

      // Load first pattern
      const pattern = await getPattern(
        gameSettings.timeSignature.name,
        gameSettings.difficulty
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

      // Start continuous metronome and count-in
      const countInStartTime = audioEngine.getCurrentTime() + 0.1;
      startContinuousMetronome(countInStartTime);
      startCountInWithPattern(pattern, countInStartTime);
    } catch (error) {
      console.error("Error starting game:", error);
      setGamePhase(GAME_PHASES.SETUP);
    }
  }, [gameSettings, audioEngine, startContinuousMetronome]);

  /**
   * Start metronome count-in phase with pattern
   */
  const startCountInWithPattern = useCallback(
    (pattern, countInStartTime) => {
      const beatDur = beatDuration.current;
      const beatsInCountIn = gameSettings.timeSignature.beats;

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
    [audioEngine, gameSettings, beatDuration]
  );

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

      // Calculate expected tap times for later evaluation
      const expectedTimes = [];
      pattern.pattern.forEach((beat, index) => {
        if (beat === 1) {
          const tapTime = startTime + (index * beatDur) / 4; // Convert to sixteenth note timing
          expectedTimes.push(tapTime);
        }
      });
      setExpectedTaps(expectedTimes);

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
    [audioEngine, beatDuration, gameSettings]
  );

  /**
   * Start get ready phase (metronome continues, taps ignored)
   */
  const startGetReadyPhase = useCallback(() => {
    setGamePhase(GAME_PHASES.GET_READY);
    setHasUserStartedTapping(false);
    setUserTaps([]);

    // Metronome continues for one full measure as "get ready" time
    const beatDur = beatDuration.current;
    const beatsPerMeasure = gameSettings.timeSignature.beats;
    const getReadyDuration = beatsPerMeasure * beatDur * 1000; // One full measure

    // After get ready period, transition to user performance
    setTimeout(() => startWaitingForUserResponse(), getReadyDuration);
  }, [beatDuration, gameSettings]);

  /**
   * Start waiting for user response (infinite metronome until first tap)
   */
  const startWaitingForUserResponse = useCallback(() => {
    setGamePhase(GAME_PHASES.USER_PERFORMANCE);
    setHasUserStartedTapping(false);

    // Set the reference time for when user should start tapping (next beat 1)
    const currentTime = audioEngine.getCurrentTime();
    const timeSinceStart = currentTime - metronomeStartTimeRef.current;
    const beatDur = beatDuration.current;
    const beatsPerMeasure = gameSettings.timeSignature.beats;
    const currentBeatFloat = timeSinceStart / beatDur;
    const nextMeasureStart =
      Math.ceil(currentBeatFloat / beatsPerMeasure) * beatsPerMeasure;
    const nextBeat1Time =
      metronomeStartTimeRef.current + nextMeasureStart * beatDur;

    userPerformanceStartTime.current = nextBeat1Time;
  }, [audioEngine, beatDuration, gameSettings]);

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
      setHasUserStartedTapping(true);

      // Calculate the current beat position and when this measure will end
      const currentTime = audioEngine.getCurrentTime();
      const timeSinceStart = currentTime - metronomeStartTimeRef.current;
      const beatDur = beatDuration.current;
      const beatsPerMeasure = gameSettings.timeSignature.beats;
      const currentBeatFloat = timeSinceStart / beatDur;
      const currentMeasure = Math.floor(currentBeatFloat / beatsPerMeasure);

      // User starts tapping in the current measure
      const currentMeasureStart = currentMeasure * beatsPerMeasure;
      const userStartTime =
        metronomeStartTimeRef.current + currentMeasureStart * beatDur;
      userPerformanceStartTime.current = userStartTime;

      // Calculate exactly when this measure ends (not the next one)
      const currentMeasureEndBeat = (currentMeasure + 1) * beatsPerMeasure;
      const measureEndTime =
        metronomeStartTimeRef.current + currentMeasureEndBeat * beatDur;
      const delayToMeasureEnd = (measureEndTime - currentTime) * 1000;

      setTimeout(
        () => {
          stopContinuousMetronome();
          evaluatePerformance();
        },
        Math.max(100, delayToMeasureEnd) // Small minimum to ensure measure completes
      );
    }

    const relativeTime = tapTime - userPerformanceStartTime.current;
    setUserTaps((prev) => [...prev, { time: tapTime, relativeTime }]);

    // Provide immediate feedback
    const nearestExpected = findNearestExpectedTap(relativeTime);
    const accuracy = calculateTapAccuracy(relativeTime, nearestExpected);

    setFeedback({ accuracy, points: SCORING[accuracy] });

    // Play feedback sound
    if (accuracy === "PERFECT" || accuracy === "GOOD") {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    // Clear feedback after short delay
    setTimeout(() => setFeedback(null), 1000);
  }, [
    gamePhase,
    audioEngine,
    expectedTaps,
    playCorrectSound,
    playWrongSound,
    hasUserStartedTapping,
    beatDuration,
    gameSettings,
    stopContinuousMetronome,
  ]);

  /**
   * Find the nearest expected tap time
   */
  const findNearestExpectedTap = useCallback(
    (userTime) => {
      if (expectedTaps.length === 0) return null;

      // Convert expected absolute times to relative times
      const relativeExpectedTaps = expectedTaps.map(
        (time) => time - userPerformanceStartTime.current
      );

      let nearest = relativeExpectedTaps[0];
      let minDiff = Math.abs(userTime - nearest);

      relativeExpectedTaps.forEach((expectedTime) => {
        const diff = Math.abs(userTime - expectedTime);
        if (diff < minDiff) {
          minDiff = diff;
          nearest = expectedTime;
        }
      });

      return nearest;
    },
    [expectedTaps]
  );

  /**
   * Calculate tap accuracy based on timing
   */
  const calculateTapAccuracy = useCallback((userTime, expectedTime) => {
    if (!expectedTime) return "MISS";

    const timingError = Math.abs(userTime - expectedTime) * 1000; // Convert to milliseconds

    if (timingError <= TIMING_THRESHOLDS.PERFECT) return "PERFECT";
    if (timingError <= TIMING_THRESHOLDS.GOOD) return "GOOD";
    if (timingError <= TIMING_THRESHOLDS.FAIR) return "FAIR";
    return "MISS";
  }, []);

  /**
   * Evaluate user performance and provide feedback
   */
  const evaluatePerformance = useCallback(() => {
    // Ensure metronome is stopped
    stopContinuousMetronome();
    setGamePhase(GAME_PHASES.FEEDBACK);

    // Calculate detailed performance metrics
    const relativeExpectedTaps = expectedTaps.map(
      (time) => time - userPerformanceStartTime.current
    );

    const relativeUserTaps = userTaps.map((tap) => tap.relativeTime);

    let perfectCount = 0,
      goodCount = 0,
      fairCount = 0,
      missCount = 0;
    let totalScore = 0;
    let combo = 0,
      maxCombo = 0;

    // Analyze each expected tap
    relativeExpectedTaps.forEach((expectedTime) => {
      const nearestUserTap = findNearestUserTap(expectedTime, relativeUserTaps);
      const accuracy = calculateTapAccuracy(
        nearestUserTap?.time || 0,
        expectedTime
      );

      // Update counts
      switch (accuracy) {
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
      let points = SCORING[accuracy];
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

    // Play feedback sound
    const accuracy =
      perfectCount + goodCount >= relativeExpectedTaps.length * 0.7;
    if (accuracy) {
      playVictorySound();
    } else {
      playWrongSound();
    }
  }, [
    expectedTaps,
    userTaps,
    playVictorySound,
    playWrongSound,
    calculateTapAccuracy,
    stopContinuousMetronome,
  ]);

  /**
   * Find nearest user tap to expected time
   */
  const findNearestUserTap = useCallback((expectedTime, userTapTimes) => {
    if (userTapTimes.length === 0) return null;

    let nearest = userTapTimes[0];
    let minDiff = Math.abs(expectedTime - nearest);

    userTapTimes.forEach((tapTime) => {
      const diff = Math.abs(expectedTime - tapTime);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = tapTime;
      }
    });

    return { time: nearest, difference: minDiff };
  }, []);

  /**
   * Start next pattern
   */
  const nextPattern = useCallback(async () => {
    try {
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
    gameSettings,
    stopContinuousMetronome,
    startContinuousMetronome,
    audioEngine,
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
        onUpdateSettings={setGameSettings}
        onStart={startGame}
        title="Metronome Rhythm Trainer"
        subtitle="Listen to rhythm patterns and tap them back with precise timing"
      />
    );
  }

  // Show session complete screen
  if (gamePhase === GAME_PHASES.SESSION_COMPLETE) {
    const accuracy =
      sessionStats.patternsCompleted > 0
        ? ((sessionStats.perfectTaps + sessionStats.goodTaps) /
            (sessionStats.perfectTaps +
              sessionStats.goodTaps +
              sessionStats.fairTaps +
              sessionStats.missedTaps)) *
          100
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
                  {sessionStats.patternsCompleted}
                </div>
                <div className="text-sm text-gray-300">Patterns Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {sessionStats.totalScore}
                </div>
                <div className="text-sm text-gray-300">Total Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {Math.round(accuracy)}%
                </div>
                <div className="text-sm text-gray-300">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {sessionStats.maxCombo}
                </div>
                <div className="text-sm text-gray-300">Max Combo</div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Tap Accuracy Breakdown
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-400">Perfect Taps:</span>
                  <span className="text-white">{sessionStats.perfectTaps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400">Good Taps:</span>
                  <span className="text-white">{sessionStats.goodTaps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-400">Fair Taps:</span>
                  <span className="text-white">{sessionStats.fairTaps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-400">Missed Taps:</span>
                  <span className="text-white">{sessionStats.missedTaps}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={resetGame}
                variant="outline"
                className="px-6 py-3"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button
                onClick={() => navigate("/practice-modes")}
                variant="primary"
                className="px-6 py-3"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main game interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <BackButton
            to="/rhythm-mode"
            name="Rhythm Games"
            className="text-white/80 hover:text-white"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">
              Metronome Rhythm Trainer
            </h1>
            <p className="text-gray-300 text-sm">
              {gameSettings.timeSignature.name} • {gameSettings.tempo} BPM •{" "}
              {gameSettings.difficulty}
            </p>
          </div>
          <div className="w-24"> {/* Spacer for centering */}</div>
        </div>

        {/* Game Status */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
            <span className="text-white font-medium">
              {gamePhase === GAME_PHASES.COUNT_IN &&
                `Count-in: ${currentBeat || 1} of ${gameSettings.timeSignature.beats}`}
              {gamePhase === GAME_PHASES.PATTERN_PLAYBACK &&
                "Listen to the pattern"}
              {gamePhase === GAME_PHASES.GET_READY &&
                "Get ready to tap the pattern"}
              {gamePhase === GAME_PHASES.USER_PERFORMANCE &&
                (hasUserStartedTapping
                  ? "Keep tapping the pattern!"
                  : "Start tapping on beat 1")}
              {gamePhase === GAME_PHASES.FEEDBACK && "How did you do?"}
            </span>
          </div>
        </div>

        {/* Metronome Display */}
        <div className="mb-6">
          <MetronomeDisplay
            currentBeat={currentBeat}
            timeSignature={gameSettings.timeSignature}
            isActive={gamePhase !== GAME_PHASES.FEEDBACK}
            isCountIn={gamePhase === GAME_PHASES.COUNT_IN}
            showInstructions={
              gamePhase === GAME_PHASES.COUNT_IN ||
              gamePhase === GAME_PHASES.PATTERN_PLAYBACK ||
              gamePhase === GAME_PHASES.GET_READY ||
              gamePhase === GAME_PHASES.USER_PERFORMANCE
            }
            instructionText={
              gamePhase === GAME_PHASES.COUNT_IN
                ? "Count-in: Get ready to listen to the pattern"
                : gamePhase === GAME_PHASES.PATTERN_PLAYBACK
                  ? "Listen to how the pattern fits with the beat"
                  : gamePhase === GAME_PHASES.GET_READY
                    ? "Get ready - you'll tap on the next beat 1"
                    : gamePhase === GAME_PHASES.USER_PERFORMANCE
                      ? hasUserStartedTapping
                        ? "Continue tapping with the metronome"
                        : "Now tap the pattern starting on beat 1"
                      : "Listen to the steady beat"
            }
          />
        </div>

        {/* Tap Area */}
        <div className="mb-6">
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
            subtitle={
              gamePhase === GAME_PHASES.GET_READY
                ? "Prepare to tap on beat 1"
                : gamePhase === GAME_PHASES.USER_PERFORMANCE
                  ? "Tap the rhythm pattern"
                  : gamePhase === GAME_PHASES.PATTERN_PLAYBACK
                    ? "Listen carefully to the rhythm pattern"
                    : "Wait for your turn to tap"
            }
          />
        </div>

        {/* Session Stats */}
        <div className="mb-6">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {sessionStats.patternsCompleted}
                  </div>
                  <div className="text-xs text-gray-300">Patterns</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {sessionStats.totalScore}
                  </div>
                  <div className="text-xs text-gray-300">Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {sessionStats.maxCombo}
                  </div>
                  <div className="text-xs text-gray-300">Max Combo</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {sessionStats.perfectTaps + sessionStats.goodTaps}
                  </div>
                  <div className="text-xs text-gray-300">Good Taps</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Controls */}
        {gamePhase === GAME_PHASES.FEEDBACK && (
          <div className="flex justify-center gap-4">
            <Button
              onClick={nextPattern}
              variant="primary"
              className="px-8 py-3"
            >
              Next Pattern
            </Button>
            <Button
              onClick={endSession}
              variant="outline"
              className="px-8 py-3"
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
