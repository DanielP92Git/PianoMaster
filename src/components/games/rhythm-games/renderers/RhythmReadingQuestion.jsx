/**
 * RhythmReadingQuestion.jsx
 *
 * Stateful renderer for rhythm reading questions within MixedLessonGame.
 * Shows VexFlow notation, user reads and taps along with a sweeping cursor.
 * Simplified single-measure version of RhythmReadingGame.
 *
 * Sub-FSM: INITIALIZING → COUNT_IN → PLAYING → EVALUATING → DONE
 * Reports onComplete(onTimeTaps, totalExpectedTaps).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAudioEngine } from "../../../../hooks/useAudioEngine";
import { useAudioContext } from "../../../../contexts/AudioContextProvider";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
import { MetronomeDisplay, TapArea } from "../components";
import RhythmStaffDisplay from "../components/RhythmStaffDisplay";
import FloatingFeedback from "../components/FloatingFeedback";
import { TIME_SIGNATURES } from "../RhythmPatternGenerator";
import { resolveByTags, resolveByAnyTag } from "../../../../data/patterns/RhythmPatternGenerator";
import { binaryPatternToBeats } from "../utils/rhythmVexflowHelpers";
import { scoreTap } from "../utils/rhythmScoringUtils";
import {
  scoreHold,
  isHoldNote,
  calcHoldDurationMs,
  HOLD_THRESHOLDS,
} from "../utils/holdScoringUtils";
import { CIRCUMFERENCE } from "../components/HoldRing";

const PHASES = {
  INITIALIZING: "initializing",
  COUNT_IN: "count-in",
  PLAYING: "playing",
  EVALUATING: "evaluating",
  DONE: "done",
};

const TIME_SIG_MAP = {
  "4/4": TIME_SIGNATURES.FOUR_FOUR,
  "3/4": TIME_SIGNATURES.THREE_FOUR,
  "2/4": TIME_SIGNATURES.TWO_FOUR,
  "6/8": TIME_SIGNATURES.SIX_EIGHT,
};

export default function RhythmReadingQuestion({
  question,
  isLandscape: _isLandscape,
  onComplete,
  disabled,
}) {
  const { t } = useTranslation("common");
  const { audioContextRef, getOrCreateAudioContext } = useAudioContext();
  const { reduce: reducedMotion } = useMotionTokens();

  const config = question?.rhythmConfig || {};
  const tempo = config.tempo || 80;
  const timeSignature =
    TIME_SIG_MAP[config.timeSignature] || TIME_SIGNATURES.FOUR_FOUR;
  const beatsPerMeasure = timeSignature.beats;

  const audioEngine = useAudioEngine(tempo, {
    sharedAudioContext: audioContextRef.current,
  });

  // State
  const [phase, setPhase] = useState(PHASES.INITIALIZING);
  const [beats, setBeats] = useState(null);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [tapResults, setTapResults] = useState([]);
  const [floatingQuality, setFloatingQuality] = useState(null);
  const [floatingKey, setFloatingKey] = useState(0);
  const [tapFlash, setTapFlash] = useState(false);
  const [isHoldComplete, setIsHoldComplete] = useState(false);
  const [holdFeedbackLabel, setHoldFeedbackLabel] = useState(null);

  // Refs
  const hasStartedRef = useRef(false);
  const cleanupDoneRef = useRef(false);
  const patternStartTimeRef = useRef(0);
  const scheduledBeatTimesRef = useRef([]);
  const nextBeatIndexRef = useRef(0);
  const rafIdRef = useRef(null);
  const measureDurationRef = useRef(0);
  const continuousMetronomeRef = useRef(null);
  const visualMetronomeRef = useRef(null);
  const scheduledOscillatorsRef = useRef([]);
  const staveBoundsRef = useRef(null);
  const playingTimerRef = useRef(null);
  const beatDuration = useRef(60 / tempo);
  const pressStartTimeRef = useRef(null);
  const holdRafIdRef = useRef(null);
  const holdRingCircleRef = useRef(null);
  const lastHoldEndTimeRef = useRef(0);

  useEffect(() => {
    beatDuration.current = 60 / tempo;
  }, [tempo]);

  // Build beat times from beats array
  const buildBeatTimes = useCallback((beatsArr, bpm, startTime) => {
    const bd = 60 / bpm;
    const sixteenthDur = bd / 4;
    const times = [];
    let offset = 0;
    beatsArr.forEach((beat) => {
      if (!beat.isRest) {
        times.push(startTime + offset);
      }
      offset += sixteenthDur * beat.durationUnits;
    });
    return { times, totalDuration: offset };
  }, []);

  // Create metronome click
  const createClickSound = useCallback(
    (time, frequency, volume) => {
      const ctx = audioEngine.audioContextRef?.current;
      const masterGain = audioEngine.gainNodeRef?.current;
      if (!ctx || !masterGain) return;
      try {
        const osc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        osc.frequency.setValueAtTime(frequency, time);
        osc.type = "sine";
        clickGain.gain.setValueAtTime(0, time);
        clickGain.gain.linearRampToValueAtTime(volume, time + 0.001);
        clickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.02);
        osc.connect(clickGain);
        clickGain.connect(masterGain);
        const info = {
          oscillator: osc,
          startTime: time,
          stopTime: time + 0.02,
        };
        scheduledOscillatorsRef.current.push(info);
        osc.start(time);
        osc.stop(time + 0.02);
        osc.onended = () => {
          const idx = scheduledOscillatorsRef.current.indexOf(info);
          if (idx !== -1) scheduledOscillatorsRef.current.splice(idx, 1);
        };
      } catch {
        // Audio creation failed
      }
    },
    [audioEngine]
  );

  // Schedule metronome clicks
  const scheduleBeatClicks = useCallback(
    (startTime) => {
      const bd = beatDuration.current;
      const currentTime = audioEngine.getCurrentTime();
      const elapsed = currentTime - startTime;
      const completedBeats = Math.floor(elapsed / bd);
      for (let i = 0; i < 3; i++) {
        const beatNumber = completedBeats + i;
        const beatTime = startTime + beatNumber * bd;
        if (beatTime > currentTime + 0.05) {
          const isDownbeat = beatNumber % beatsPerMeasure === 0;
          createClickSound(beatTime, isDownbeat ? 700 : 550, 0.12);
        }
      }
    },
    [audioEngine, beatsPerMeasure, createClickSound]
  );

  // Start continuous metronome
  const startContinuousMetronome = useCallback(
    (startTime) => {
      scheduleBeatClicks(startTime);
      continuousMetronomeRef.current = setInterval(
        () => scheduleBeatClicks(startTime),
        200
      );
      visualMetronomeRef.current = setInterval(() => {
        const currentTime = audioEngine.getCurrentTime();
        const elapsed = currentTime - startTime;
        const bd = beatDuration.current;
        const beatInMeasure = (Math.floor(elapsed / bd) % beatsPerMeasure) + 1;
        setCurrentBeat(beatInMeasure);
      }, 50);
    },
    [audioEngine, beatsPerMeasure, scheduleBeatClicks]
  );

  // Stop metronome
  const stopContinuousMetronome = useCallback(() => {
    if (continuousMetronomeRef.current) {
      clearInterval(continuousMetronomeRef.current);
      continuousMetronomeRef.current = null;
    }
    if (visualMetronomeRef.current) {
      clearInterval(visualMetronomeRef.current);
      visualMetronomeRef.current = null;
    }
    if (playingTimerRef.current) {
      clearTimeout(playingTimerRef.current);
      playingTimerRef.current = null;
    }
    const currentTime = audioEngine.getCurrentTime();
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

  // Stave bounds callback
  const handleStaveBoundsReady = useCallback((bounds) => {
    staveBoundsRef.current = bounds;
  }, []);

  // Evaluate performance
  const evaluatePerformance = useCallback(
    (beatsArr) => {
      setPhase(PHASES.EVALUATING);
      stopContinuousMetronome();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // Count on-time taps (PERFECT or GOOD)
      const nonRestBeats = beatsArr.filter((b) => !b.isRest).length;
      // Use latest tapResults from ref-safe closure
      setTapResults((currentResults) => {
        const onTimeTaps = currentResults.filter(
          (r) => r.quality === "PERFECT" || r.quality === "GOOD"
        ).length;

        setPhase(PHASES.DONE);
        setTimeout(() => onComplete(onTimeTaps, nonRestBeats), 800);
        return currentResults;
      });
    },
    [onComplete, stopContinuousMetronome]
  );

  // Hold note detection — which onset are we expecting?
  const getCurrentOnsetInfo = useCallback(() => {
    if (!beats) return { isHold: false, holdDurationMs: 0 };
    const nonRestBeats = beats.filter((b) => !b.isRest);
    const idx = nextBeatIndexRef.current;
    if (idx >= nonRestBeats.length) return { isHold: false, holdDurationMs: 0 };
    const beat = nonRestBeats[idx];
    return {
      isHold: isHoldNote(beat.durationUnits),
      holdDurationMs: calcHoldDurationMs(beat.durationUnits, tempo),
    };
  }, [beats, tempo]);

  // Handle tap (quarter notes)
  const handleTap = useCallback(() => {
    if (phase !== PHASES.PLAYING) return;
    // Suppress click event after hold release (browser fires click after pointerup)
    if (performance.now() - lastHoldEndTimeRef.current < 300) return;

    const tapTime = audioEngine.getCurrentTime();

    // Play piano sound for tap feedback
    if (audioEngine.createPianoSound) {
      const onsetInfo = getCurrentOnsetInfo();
      const noteDurSec =
        onsetInfo.holdDurationMs > 0
          ? onsetInfo.holdDurationMs / 1000
          : beatDuration.current; // quarter note = 1 beat
      audioEngine.createPianoSound(tapTime, 0.8, noteDurSec);
    }

    // Flash feedback
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 120);

    if (scheduledBeatTimesRef.current.length === 0) return;

    const { quality, noteIdx, newNextBeatIndex } = scoreTap(
      tapTime,
      scheduledBeatTimesRef.current,
      nextBeatIndexRef.current,
      tempo,
      config.nodeType
    );

    nextBeatIndexRef.current = newNextBeatIndex;

    setTapResults((prev) => {
      const updated = prev.filter((r) => r.noteIdx !== noteIdx);
      updated.push({ noteIdx, quality });
      return updated;
    });

    setFloatingQuality(quality);
    setFloatingKey((k) => k + 1);
  }, [phase, audioEngine, tempo]);

  // Handle press start for hold notes
  const handlePressStart = useCallback(() => {
    if (phase !== PHASES.PLAYING) return;

    const onsetInfo = getCurrentOnsetInfo();
    if (!onsetInfo.isHold) {
      handleTap();
      return;
    }

    // Hold note path
    pressStartTimeRef.current = performance.now();
    setIsHoldComplete(false);
    setHoldFeedbackLabel(null);

    // Flash feedback
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 120);

    // Sustained piano sound
    const noteDurationSec = onsetInfo.holdDurationMs / 1000;
    if (audioEngine.createPianoSound) {
      audioEngine.createPianoSound(
        audioEngine.getCurrentTime(),
        0.8,
        noteDurationSec
      );
    }

    // rAF ring animation — fills to 100% at PERFECT threshold
    const startTime = performance.now();
    const ringDurationMs = onsetInfo.holdDurationMs * HOLD_THRESHOLDS.PERFECT;
    const animate = () => {
      if (pressStartTimeRef.current === null) return;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / ringDurationMs);
      if (holdRingCircleRef.current) {
        const offset = CIRCUMFERENCE * (1 - progress);
        holdRingCircleRef.current.setAttribute(
          "stroke-dashoffset",
          String(offset)
        );
      }
      if (progress < 1) {
        holdRafIdRef.current = requestAnimationFrame(animate);
      }
    };
    holdRafIdRef.current = requestAnimationFrame(animate);
  }, [phase, getCurrentOnsetInfo, handleTap, audioEngine]);

  // Handle press end for hold notes
  const handlePressEnd = useCallback(() => {
    if (pressStartTimeRef.current === null) return;

    cancelAnimationFrame(holdRafIdRef.current);
    const holdMs = performance.now() - pressStartTimeRef.current;
    pressStartTimeRef.current = null;
    lastHoldEndTimeRef.current = performance.now();

    const onsetInfo = getCurrentOnsetInfo();
    const quality = scoreHold(holdMs, onsetInfo.holdDurationMs);

    // Green flash on PERFECT
    if (quality === "PERFECT") {
      setIsHoldComplete(true);
      setTimeout(() => setIsHoldComplete(false), 200);
    }

    // Reset ring
    if (holdRingCircleRef.current) {
      holdRingCircleRef.current.setAttribute(
        "stroke-dashoffset",
        String(CIRCUMFERENCE)
      );
    }

    // Hold feedback label for GOOD
    if (quality === "GOOD") {
      setHoldFeedbackLabel(
        t("games.metronomeTrainer.tapArea.accuracy.holdGood")
      );
      setTimeout(() => setHoldFeedbackLabel(null), 1500);
    } else {
      setHoldFeedbackLabel(null);
    }

    // Update note color + floating feedback
    const noteIdx = nextBeatIndexRef.current;
    setTapResults((prev) => {
      const updated = prev.filter((r) => r.noteIdx !== noteIdx);
      updated.push({ noteIdx, quality });
      return updated;
    });
    setFloatingQuality(quality);
    setFloatingKey((k) => k + 1);

    // Advance to next onset
    nextBeatIndexRef.current += 1;
  }, [getCurrentOnsetInfo, t]);

  // Start the flow
  const startFlow = useCallback(
    async (beatsArr) => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      try {
        await audioEngine.resumeAudioContext();
      } catch {
        getOrCreateAudioContext();
      }

      // Prime audio pipeline
      try {
        const ctx = audioEngine.audioContextRef?.current;
        if (ctx) {
          const warmup = ctx.createOscillator();
          const silentGain = ctx.createGain();
          silentGain.gain.setValueAtTime(0, ctx.currentTime);
          warmup.connect(silentGain);
          silentGain.connect(ctx.destination);
          warmup.start(ctx.currentTime);
          warmup.stop(ctx.currentTime + 0.01);
        }
      } catch {
        // Non-critical
      }

      const bd = beatDuration.current;
      const countInStartTime = audioEngine.getCurrentTime() + 0.3;
      const playingStartTime = countInStartTime + beatsPerMeasure * bd;

      // Reset
      nextBeatIndexRef.current = 0;
      setTapResults([]);
      setFloatingQuality(null);
      setCurrentBeat(1);
      pressStartTimeRef.current = null;
      cancelAnimationFrame(holdRafIdRef.current);
      setIsHoldComplete(false);
      setHoldFeedbackLabel(null);

      // Pre-compute beat times so taps are accepted before the first beat
      patternStartTimeRef.current = playingStartTime;
      measureDurationRef.current = beatsPerMeasure * bd;
      const { times } = buildBeatTimes(beatsArr, tempo, playingStartTime);
      scheduledBeatTimesRef.current = times;

      // Start metronome count-in
      startContinuousMetronome(countInStartTime);
      setPhase(PHASES.COUNT_IN);

      const countInMs =
        (playingStartTime - audioEngine.getCurrentTime()) * 1000;
      // Enable tapping 1 beat early so user can prepare for beat 1
      const earlyEnableMs = bd * 1000;

      setTimeout(
        () => {
          setPhase(PHASES.PLAYING);
        },
        Math.max(0, countInMs - earlyEnableMs)
      );

      // Start cursor RAF and safety timer at the actual play start
      setTimeout(
        () => {
          function updateCursor() {
            const ctx = audioEngine.audioContextRef?.current;
            if (!ctx) return;
            const elapsed = ctx.currentTime - patternStartTimeRef.current;
            const total = measureDurationRef.current;
            if (total <= 0) return;
            const progress = Math.max(0, Math.min(elapsed / total, 1));

            // Update MetronomeDisplay beat (clamp for pre-start period)
            if (elapsed >= 0) {
              const beatIdx = Math.floor(elapsed / bd) % beatsPerMeasure;
              setCurrentBeat(beatIdx + 1);
            }

            if (progress >= 1) {
              rafIdRef.current = null;
              evaluatePerformance(beatsArr);
              return;
            }
            rafIdRef.current = requestAnimationFrame(updateCursor);
          }
          rafIdRef.current = requestAnimationFrame(updateCursor);

          // Safety timer: auto-complete after measure duration + grace
          playingTimerRef.current = setTimeout(
            () => {
              if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
              }
              evaluatePerformance(beatsArr);
            },
            measureDurationRef.current * 1000 + 500
          );
        },
        Math.max(0, countInMs)
      );
    },
    [
      audioEngine,
      getOrCreateAudioContext,
      beatsPerMeasure,
      tempo,
      buildBeatTimes,
      startContinuousMetronome,
      evaluatePerformance,
    ]
  );

  // Load pattern and auto-start
  useEffect(() => {
    if (disabled || hasStartedRef.current) return;

    // Resolve curated pattern from config
    const tags = config.patternTags || [];
    const durations = config.durations || ["q"];
    const ts = config.timeSignature || "4/4";

    let loadedBeats = null;
    if (tags.length > 0) {
      const resolver = config.patternTagMode === "any" ? resolveByAnyTag : resolveByTags;
      const result = resolver(tags, durations, { timeSignature: ts });
      if (result) {
        loadedBeats = binaryPatternToBeats(result.binary);
      }
    }

    if (!loadedBeats) {
      // Fallback: generate simple quarter-note pattern
      loadedBeats = Array.from({ length: beatsPerMeasure }, () => ({
        durationUnits: 4,
        isRest: false,
      }));
    }

    setBeats(loadedBeats);
    startFlow(loadedBeats);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time start
  }, [disabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!cleanupDoneRef.current) {
        cleanupDoneRef.current = true;
        stopContinuousMetronome();
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        cancelAnimationFrame(holdRafIdRef.current);
      }
    };
  }, [stopContinuousMetronome]);

  // Guidance text
  const getGuidanceText = () => {
    switch (phase) {
      case PHASES.COUNT_IN:
        return t("rhythm.countIn", "Listen to the beat...");
      case PHASES.PLAYING: {
        const onsetInfo = getCurrentOnsetInfo();
        return onsetInfo.isHold
          ? t("games.metronomeTrainer.tapArea.holdHere", "HOLD")
          : t("game.rhythmReading.tapInstruction", "Read and tap the rhythm!");
      }
      case PHASES.EVALUATING:
      case PHASES.DONE:
        return t("rhythm.niceTapping", "Nice tapping!");
      default:
        return "";
    }
  };

  const isActive = phase === PHASES.PLAYING;

  return (
    <div
      className="flex w-full flex-col items-center gap-4"
      role="main"
      aria-label={t("game.rhythmReading.ariaLabel", "Rhythm reading exercise")}
    >
      {/* Metronome display */}
      <MetronomeDisplay
        currentBeat={currentBeat}
        timeSignature={timeSignature}
        isActive={phase !== PHASES.INITIALIZING && phase !== PHASES.DONE}
        isCountIn={phase === PHASES.COUNT_IN}
      />

      {/* VexFlow staff notation */}
      {beats && phase !== PHASES.INITIALIZING && (
        <div className="w-full max-w-md">
          <RhythmStaffDisplay
            beats={beats}
            timeSignature={config.timeSignature || "4/4"}
            cursorProgress={-1}
            tapResults={tapResults}
            showCursor={false}
            reducedMotion={reducedMotion}
            onStaveBoundsReady={handleStaveBoundsReady}
            measures={config.measureCount || 1}
          />
        </div>
      )}

      {/* Guidance text */}
      <p className="text-center text-sm text-white/70">
        {holdFeedbackLabel || getGuidanceText()}
      </p>

      {/* Tap target — same layout as RhythmTapQuestion */}
      <div className="relative w-full max-w-md">
        <TapArea
          onTap={handleTap}
          onPressStart={handlePressStart}
          onPressEnd={handlePressEnd}
          isHoldNote={phase === PHASES.PLAYING && getCurrentOnsetInfo().isHold}
          holdRingRef={holdRingCircleRef}
          isHoldComplete={isHoldComplete}
          reducedMotion={reducedMotion}
          holdFeedbackLabel={holdFeedbackLabel}
          feedback={null}
          isActive={isActive}
          title={
            phase === PHASES.PLAYING
              ? undefined
              : phase === PHASES.COUNT_IN
                ? t("rhythm.listen", "Listen...")
                : t("rhythm.getReady", "Get ready...")
          }
        />
        <FloatingFeedback
          quality={floatingQuality}
          feedbackKey={floatingKey}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}
