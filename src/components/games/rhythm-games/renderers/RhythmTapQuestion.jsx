/**
 * RhythmTapQuestion.jsx
 *
 * Stateful renderer for rhythm tap questions within MixedLessonGame.
 * Plays ONE metronome pattern, user taps along, then reports tap results.
 * Kid-friendly visual feedback: colored dots per beat (green/yellow/red).
 *
 * Unlike the stateless card renderers, this component manages its own
 * sub-state machine for the listen-then-tap flow.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAudioEngine } from "../../../../hooks/useAudioEngine";
import { useAudioContext } from "../../../../contexts/AudioContextProvider";
import { MetronomeDisplay, TapArea } from "../components";
import { getPattern, TIME_SIGNATURES } from "../RhythmPatternGenerator";

// Sub-phases for the rhythm tap flow
const PHASES = {
  INITIALIZING: "initializing",
  COUNT_IN: "count-in",
  PATTERN_PLAYBACK: "pattern-playback",
  GET_READY: "get-ready",
  USER_PERFORMANCE: "user-performance",
  EVALUATING: "evaluating",
  DONE: "done",
};

// Base timing thresholds (ms) at 120 BPM — same as MetronomeTrainer
const BASE_TIMING_THRESHOLDS = {
  PERFECT: 50,
  GOOD: 75,
  FAIR: 125,
};

const calculateTimingThresholds = (tempo) => {
  const scalingFactor = Math.pow(120 / tempo, 0.3);
  return {
    PERFECT: Math.round(BASE_TIMING_THRESHOLDS.PERFECT * scalingFactor),
    GOOD: Math.round(BASE_TIMING_THRESHOLDS.GOOD * scalingFactor),
    FAIR: Math.round(BASE_TIMING_THRESHOLDS.FAIR * scalingFactor),
  };
};

// Time signature string → object mapping
const TIME_SIG_MAP = {
  "4/4": TIME_SIGNATURES.FOUR_FOUR,
  "3/4": TIME_SIGNATURES.THREE_FOUR,
  "2/4": TIME_SIGNATURES.TWO_FOUR,
  "6/8": TIME_SIGNATURES.SIX_EIGHT,
};

export default function RhythmTapQuestion({
  question,
  isLandscape: _isLandscape,
  onComplete,
  disabled,
}) {
  const { t } = useTranslation("common");
  const { audioContextRef, getOrCreateAudioContext } = useAudioContext();
  const config = question?.rhythmConfig || {};
  const tempo = config.tempo || 80;
  const audioEngine = useAudioEngine(tempo, {
    sharedAudioContext: audioContextRef.current,
  });

  const timeSignature =
    TIME_SIG_MAP[config.timeSignature] || TIME_SIGNATURES.FOUR_FOUR;
  const beatsPerMeasure = timeSignature.beats;

  // Sub-state machine
  const [phase, setPhase] = useState(PHASES.INITIALIZING);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [beatResults, setBeatResults] = useState([]); // Array of 'PERFECT'|'GOOD'|'FAIR'|'MISS' per expected beat
  const [hasUserStartedTapping, setHasUserStartedTapping] = useState(false);

  // Refs for timing
  const beatDuration = useRef(60 / tempo);
  const metronomeStartTimeRef = useRef(null);
  const patternInfoRef = useRef(null);
  const userTapsRef = useRef([]);
  const userPerformanceStartTimeRef = useRef(null);
  const continuousMetronomeRef = useRef(null);
  const visualMetronomeRef = useRef(null);
  const scheduledOscillatorsRef = useRef([]);
  const hasStartedRef = useRef(false);
  const cleanupDoneRef = useRef(false);

  // Update beat duration when tempo changes
  useEffect(() => {
    beatDuration.current = 60 / tempo;
  }, [tempo]);

  // Create metronome click sound
  const createClickSound = useCallback(
    (time, frequency, volume) => {
      if (
        !audioEngine.audioContextRef?.current ||
        !audioEngine.gainNodeRef?.current
      )
        return;
      try {
        const context = audioEngine.audioContextRef.current;
        const masterGain = audioEngine.gainNodeRef.current;
        const oscillator = context.createOscillator();
        const clickGain = context.createGain();
        oscillator.frequency.setValueAtTime(frequency, time);
        oscillator.type = "sine";
        clickGain.gain.setValueAtTime(0, time);
        clickGain.gain.linearRampToValueAtTime(volume, time + 0.001);
        clickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.02);
        oscillator.connect(clickGain);
        clickGain.connect(masterGain);
        const info = { oscillator, startTime: time, stopTime: time + 0.02 };
        scheduledOscillatorsRef.current.push(info);
        oscillator.start(time);
        oscillator.stop(time + 0.02);
        oscillator.onended = () => {
          const idx = scheduledOscillatorsRef.current.indexOf(info);
          if (idx !== -1) scheduledOscillatorsRef.current.splice(idx, 1);
        };
      } catch {
        // Audio creation failed silently
      }
    },
    [audioEngine]
  );

  // Start continuous metronome
  const startContinuousMetronome = useCallback(
    (startTime) => {
      const beatDur = beatDuration.current;
      metronomeStartTimeRef.current = startTime;

      if (continuousMetronomeRef.current)
        clearInterval(continuousMetronomeRef.current);
      if (visualMetronomeRef.current) clearInterval(visualMetronomeRef.current);
      scheduledOscillatorsRef.current = [];

      const scheduleBeats = (currentTime) => {
        const timeSinceStart = currentTime - startTime;
        const totalBeatsFloat = timeSinceStart / beatDur;
        const totalBeatsCompleted = Math.floor(totalBeatsFloat);
        for (let i = 0; i < 3; i++) {
          const beatNumber = totalBeatsCompleted + i;
          const beatTime = startTime + beatNumber * beatDur;
          if (beatTime > currentTime + 0.05) {
            const isDownbeat = beatNumber % beatsPerMeasure === 0;
            const volume = 0.12;
            const frequency = isDownbeat ? 700 : 550;
            createClickSound(beatTime, frequency, volume);
          }
        }
      };

      scheduleBeats(audioEngine.getCurrentTime());
      continuousMetronomeRef.current = setInterval(
        () => scheduleBeats(audioEngine.getCurrentTime()),
        200
      );

      // Visual beat tracking
      visualMetronomeRef.current = setInterval(() => {
        const currentTime = audioEngine.getCurrentTime();
        const timeSinceStart = currentTime - startTime;
        const currentBeatFloat = timeSinceStart / beatDur;
        const beatInMeasure = Math.floor(currentBeatFloat) % beatsPerMeasure;
        setCurrentBeat(beatInMeasure);
      }, 50);
    },
    [audioEngine, beatsPerMeasure, createClickSound]
  );

  // Stop metronome
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
    scheduledOscillatorsRef.current
      .filter((info) => info.startTime > currentTime)
      .forEach((info) => {
        try {
          info.oscillator.stop(currentTime);
        } catch {
          /* already stopped */
        }
      });
    scheduledOscillatorsRef.current = [];
  }, [audioEngine]);

  // Evaluate performance after user finishes tapping
  const evaluatePerformance = useCallback(() => {
    const currentUserTaps = userTapsRef.current;

    if (!patternInfoRef.current) {
      onComplete(0, 1);
      return;
    }

    const { pattern } = patternInfoRef.current;
    const currentBeatDur = beatDuration.current;
    const unitsPerBeat = timeSignature.measureLength / timeSignature.beats;

    // Find expected beat positions
    const expectedBeatPositions = [];
    pattern.forEach((beat, index) => {
      if (beat === 1) {
        expectedBeatPositions.push(index / unitsPerBeat);
      }
    });

    if (expectedBeatPositions.length === 0) {
      onComplete(0, 1);
      return;
    }

    const results = [];
    let onTimeCount = 0;

    expectedBeatPositions.forEach((expectedBeatPos) => {
      let bestAccuracy = "MISS";

      currentUserTaps.forEach((userTap) => {
        const userBeatPos =
          (userTap.relativeTime / currentBeatDur) % beatsPerMeasure;
        let timingError = Math.abs(userBeatPos - expectedBeatPos);
        if (timingError > beatsPerMeasure / 2) {
          timingError = beatsPerMeasure - timingError;
        }
        const timingErrorMs = timingError * currentBeatDur * 1000;
        const thresholds = calculateTimingThresholds(tempo);

        let accuracy = "MISS";
        if (timingErrorMs <= thresholds.PERFECT) accuracy = "PERFECT";
        else if (timingErrorMs <= thresholds.GOOD) accuracy = "GOOD";
        else if (timingErrorMs <= thresholds.FAIR) accuracy = "FAIR";

        const rank = { PERFECT: 4, GOOD: 3, FAIR: 2, MISS: 1 };
        if (rank[accuracy] > rank[bestAccuracy]) bestAccuracy = accuracy;
      });

      results.push(bestAccuracy);
      if (bestAccuracy !== "MISS") onTimeCount++;
    });

    setBeatResults(results);
    setPhase(PHASES.DONE);

    // Report to parent after showing results briefly
    setTimeout(() => {
      onComplete(onTimeCount, expectedBeatPositions.length);
    }, 1500);
  }, [onComplete, tempo, beatsPerMeasure, timeSignature]);

  // Handle user tap
  const handleTap = useCallback(() => {
    if (phase === PHASES.GET_READY) return;
    if (phase !== PHASES.USER_PERFORMANCE) return;

    const tapTime = audioEngine.getCurrentTime();

    if (!hasUserStartedTapping) {
      // Find nearest beat 1 to anchor user performance
      const currentTime = audioEngine.getCurrentTime();
      const timeSinceStart = currentTime - metronomeStartTimeRef.current;
      const beatDur = beatDuration.current;
      const totalBeatsFloat = timeSinceStart / beatDur;
      const currentMeasureFloat = totalBeatsFloat / beatsPerMeasure;
      const prevMeasure = Math.floor(currentMeasureFloat);
      const nextMeasure = Math.ceil(currentMeasureFloat);

      const prevBeat1Time =
        metronomeStartTimeRef.current + prevMeasure * beatsPerMeasure * beatDur;
      const nextBeat1Time =
        metronomeStartTimeRef.current + nextMeasure * beatsPerMeasure * beatDur;

      const prevError = Math.abs(currentTime - prevBeat1Time);
      const nextError = Math.abs(currentTime - nextBeat1Time);
      const nearestBeat1Time =
        prevError < nextError ? prevBeat1Time : nextBeat1Time;
      const timingError = Math.min(prevError, nextError);

      if (timingError > beatDur * 1.2) return; // Too far off

      setHasUserStartedTapping(true);
      userPerformanceStartTimeRef.current = nearestBeat1Time;

      // Stop metronome and evaluate at end of measure
      const measureDuration = beatsPerMeasure * beatDur;
      const measureEndTime = nearestBeat1Time + measureDuration;
      const delayToEnd = (measureEndTime - currentTime) * 1000;

      setTimeout(() => stopContinuousMetronome(), Math.max(0, delayToEnd));
      setTimeout(() => evaluatePerformance(), Math.max(200, delayToEnd + 200));
    }

    const relativeTime =
      tapTime - (userPerformanceStartTimeRef.current || tapTime);
    userTapsRef.current.push({ time: tapTime, relativeTime });

    // Immediate per-tap feedback
    if (patternInfoRef.current) {
      const { pattern } = patternInfoRef.current;
      const currentBeatDur = beatDuration.current;
      const unitsPerBeat = timeSignature.measureLength / timeSignature.beats;
      const userBeatPos = (relativeTime / currentBeatDur) % beatsPerMeasure;

      const expectedBeatPositions = [];
      pattern.forEach((beat, index) => {
        if (beat === 1) expectedBeatPositions.push(index / unitsPerBeat);
      });

      let bestTimingError = Infinity;
      expectedBeatPositions.forEach((expectedBeatPos) => {
        let err = Math.abs(userBeatPos - expectedBeatPos);
        if (err > beatsPerMeasure / 2) err = beatsPerMeasure - err;
        if (err < bestTimingError) bestTimingError = err;
      });

      let accuracy = "MISS";
      if (bestTimingError < Infinity) {
        const timingErrorMs = bestTimingError * currentBeatDur * 1000;
        const thresholds = calculateTimingThresholds(tempo);
        if (timingErrorMs <= thresholds.PERFECT) accuracy = "PERFECT";
        else if (timingErrorMs <= thresholds.GOOD) accuracy = "GOOD";
        else if (timingErrorMs <= thresholds.FAIR) accuracy = "FAIR";
      }

      setFeedback({ accuracy, points: 0 });
    }
  }, [
    phase,
    audioEngine,
    hasUserStartedTapping,
    beatsPerMeasure,
    stopContinuousMetronome,
    evaluatePerformance,
    tempo,
    timeSignature,
  ]);

  // Start the rhythm tap flow
  const startFlow = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    try {
      await audioEngine.resumeAudioContext();
    } catch {
      // Try to create context on user gesture
      getOrCreateAudioContext();
    }

    // Load pattern
    const pattern = await getPattern(
      timeSignature.name,
      "BEGINNER",
      config.patterns || ["quarter"]
    );

    if (!pattern?.pattern) {
      onComplete(0, 1);
      return;
    }

    const beatDur = beatDuration.current;
    const countInStartTime = audioEngine.getCurrentTime() + 0.1;

    // Reset state
    userTapsRef.current = [];
    setHasUserStartedTapping(false);
    setFeedback(null);
    setBeatResults([]);
    setCurrentBeat(0);

    // Start metronome
    startContinuousMetronome(countInStartTime);
    setPhase(PHASES.COUNT_IN);

    // After count-in (1 measure), play the pattern
    const countInBeats = beatsPerMeasure;
    const patternStartTime = countInStartTime + countInBeats * beatDur;

    setTimeout(
      () => {
        setPhase(PHASES.PATTERN_PLAYBACK);

        // Store pattern info
        patternInfoRef.current = {
          pattern: pattern.pattern,
          startTime: patternStartTime,
          beatDuration: beatDur,
        };

        // Play pattern notes
        pattern.pattern.forEach((beat, index) => {
          if (beat === 1) {
            const noteTime = patternStartTime + (index * beatDur) / 4;
            audioEngine.createPianoSound(noteTime, 0.8, 0.5);
          }
        });

        // After pattern plays, transition to get-ready then user performance
        const patternDuration = ((pattern.pattern.length * beatDur) / 4) * 1000;

        setTimeout(() => {
          setPhase(PHASES.GET_READY);

          // Quick transition to user performance
          const nextBeatTime =
            patternStartTime +
            (pattern.pattern.length * beatDur) / 4 +
            beatDur * beatsPerMeasure;
          const timeUntilBeat1 =
            nextBeatTime - audioEngine.getCurrentTime() - 0.2;

          setTimeout(
            () => {
              setPhase(PHASES.USER_PERFORMANCE);
              userPerformanceStartTimeRef.current = nextBeatTime;
            },
            Math.max(0, timeUntilBeat1 * 1000)
          );
        }, patternDuration);
      },
      (patternStartTime - audioEngine.getCurrentTime()) * 1000
    );
  }, [
    audioEngine,
    getOrCreateAudioContext,
    timeSignature,
    config.patterns,
    beatsPerMeasure,
    onComplete,
    startContinuousMetronome,
  ]);

  // Auto-start when not disabled
  useEffect(() => {
    if (!disabled && phase === PHASES.INITIALIZING) {
      startFlow();
    }
  }, [disabled, phase, startFlow]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!cleanupDoneRef.current) {
        cleanupDoneRef.current = true;
        stopContinuousMetronome();
      }
    };
  }, [stopContinuousMetronome]);

  // Guidance text based on phase
  const getGuidanceText = () => {
    switch (phase) {
      case PHASES.COUNT_IN:
        return t("rhythm.countIn", "Listen to the beat...");
      case PHASES.PATTERN_PLAYBACK:
        return t("rhythm.listenToPattern", "Listen to the pattern");
      case PHASES.GET_READY:
        return t("rhythm.getReady", "Get ready...");
      case PHASES.USER_PERFORMANCE:
        return t("rhythm.tapAlong", "Tap along!");
      case PHASES.EVALUATING:
        return t("rhythm.evaluating", "...");
      case PHASES.DONE:
        return "";
      default:
        return "";
    }
  };

  // Render beat result dots (kid-friendly visual feedback)
  const renderBeatResults = () => {
    if (beatResults.length === 0) return null;
    return (
      <div className="flex items-center justify-center gap-2 py-3">
        {beatResults.map((result, i) => {
          let colorClass;
          switch (result) {
            case "PERFECT":
            case "GOOD":
              colorClass = "bg-green-400";
              break;
            case "FAIR":
              colorClass = "bg-yellow-400";
              break;
            default:
              colorClass = "bg-red-400/60";
          }
          return (
            <div
              key={i}
              className={`h-4 w-4 rounded-full ${colorClass}`}
              aria-label={result === "MISS" ? "missed" : "on time"}
            />
          );
        })}
      </div>
    );
  };

  // Done state — show dot results
  if (phase === PHASES.DONE) {
    return (
      <div className="flex w-full flex-col items-center gap-4">
        {renderBeatResults()}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <MetronomeDisplay
        currentBeat={currentBeat}
        timeSignature={timeSignature}
        isActive={
          phase !== PHASES.EVALUATING &&
          phase !== PHASES.DONE &&
          phase !== PHASES.INITIALIZING
        }
        isCountIn={phase === PHASES.COUNT_IN}
      />
      <p className="text-center text-sm text-white/70">{getGuidanceText()}</p>
      <TapArea
        onTap={handleTap}
        feedback={feedback}
        isActive={phase === PHASES.USER_PERFORMANCE}
        title={
          phase === PHASES.USER_PERFORMANCE
            ? t("rhythm.tapHere", "TAP!")
            : phase === PHASES.COUNT_IN || phase === PHASES.PATTERN_PLAYBACK
              ? t("rhythm.listen", "Listen...")
              : t("rhythm.getReady", "Get ready...")
        }
      />
    </div>
  );
}
