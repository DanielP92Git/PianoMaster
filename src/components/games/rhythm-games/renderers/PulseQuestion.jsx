/**
 * PulseQuestion.jsx
 *
 * "Tap with the beat" renderer for MixedLessonGame.
 * The very first rhythm exercise — children tap along to a pulsing metronome
 * beat for 4 bars. Shows VexFlow notation (1 bar of quarter notes, looping)
 * with a cursor highlighting the current note and per-tap color feedback.
 *
 * State machine: WAITING → COUNT_IN → PLAYING → EVALUATING → DONE
 *
 * Scoring: percentage of beats tapped within timing threshold.
 * Calls onComplete(onTimeTaps, totalExpectedTaps) matching handleRhythmTapComplete.
 *
 * Hold note support (Phase 31):
 * When config.beats contains beats with durationUnits >= 8 (half/whole notes),
 * the hold mechanic activates: filling ring visual + sustained piano audio.
 * Default PULSE_BEATS (all quarter notes) are unchanged.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAudioEngine } from "../../../../hooks/useAudioEngine";
import { useAudioContext } from "../../../../contexts/AudioContextProvider";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
import { MetronomeDisplay, TapArea } from "../components";
import { HoldRing, CIRCUMFERENCE } from "../components/HoldRing";
import { TIME_SIGNATURES } from "../RhythmPatternGenerator";
import {
  scoreHold,
  isHoldNote,
  calcHoldDurationMs,
  HOLD_THRESHOLDS,
} from "../utils/holdScoringUtils";
import RhythmStaffDisplay from "../components/RhythmStaffDisplay";
import FloatingFeedback from "../components/FloatingFeedback";

// Sub-phases for the pulse flow
const PHASES = {
  WAITING: "waiting",
  COUNT_IN: "count-in",
  PLAYING: "playing",
  EVALUATING: "evaluating",
  DONE: "done",
};

// Total measures to tap along with
const PLAY_MEASURES = 4;

// Static beats array for 1 measure of 4 quarter notes
const PULSE_BEATS = [
  { durationUnits: 4, isRest: false },
  { durationUnits: 4, isRest: false },
  { durationUnits: 4, isRest: false },
  { durationUnits: 4, isRest: false },
];

// Base timing thresholds (ms) at 120 BPM — wider than RhythmTapQuestion
// because this is the very first rhythm exercise for young learners.
const BASE_TIMING_THRESHOLDS = {
  PERFECT: 110,
  GOOD: 150,
  FAIR: 220,
};

const calculateTimingThresholds = (tempo) => {
  const scalingFactor = Math.pow(120 / tempo, 0.3);
  return {
    PERFECT: Math.round(BASE_TIMING_THRESHOLDS.PERFECT * scalingFactor),
    GOOD: Math.round(BASE_TIMING_THRESHOLDS.GOOD * scalingFactor),
    FAIR: Math.round(BASE_TIMING_THRESHOLDS.FAIR * scalingFactor),
  };
};

// Compensate for audio output latency: the click is scheduled at time T in
// audioContext, but the speaker produces sound at T + latency. The user taps
// in sync with what they hear, so their tap registers ~latency ms "late".
// Shift the expected beat time forward so tapping with the audible click
// is evaluated as on-time. Uses audioContext.outputLatency when available.
const FALLBACK_LATENCY_S = 0.08; // 80ms fallback for devices without outputLatency

// Time signature string → TIME_SIGNATURES object mapping
const TIME_SIG_MAP = {
  "4/4": TIME_SIGNATURES.FOUR_FOUR,
  "3/4": TIME_SIGNATURES.THREE_FOUR,
  "2/4": TIME_SIGNATURES.TWO_FOUR,
  "6/8": TIME_SIGNATURES.SIX_EIGHT,
};

// Initial tapResults: all notes white (null quality = default/white in RhythmStaffDisplay)
const makeResetTapResults = (beatsPerMeasure) =>
  Array.from({ length: beatsPerMeasure }, (_, i) => ({
    noteIdx: i,
    quality: null,
  }));

export default function PulseQuestion({
  question,
  isLandscape: _isLandscape,
  onComplete,
  disabled,
}) {
  const { t } = useTranslation("common");
  const { audioContextRef, getOrCreateAudioContext } = useAudioContext();
  const { reduce: reducedMotion } = useMotionTokens();

  const config = question?.rhythmConfig || {};
  const tempo = config.tempo || 65;
  const timeSignature =
    TIME_SIG_MAP[config.timeSignature] || TIME_SIGNATURES.FOUR_FOUR;
  const beatsPerMeasure = timeSignature.beats;
  const totalPlayBeats = beatsPerMeasure * PLAY_MEASURES;

  // Dynamic beats array — supports half/whole note pulse exercises (Phase 31)
  // Falls back to default PULSE_BEATS if config.beats is undefined/invalid (T-31-09)
  const beats = config.beats || PULSE_BEATS;

  const audioEngine = useAudioEngine(tempo, {
    sharedAudioContext: audioContextRef.current,
  });

  // Sub-state machine
  const [phase, setPhase] = useState(PHASES.WAITING);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [beatNum, setBeatNum] = useState(0);
  const [tapFlash, setTapFlash] = useState(false);

  // Beat-synced circle pulse (replaces CSS animation to stay in sync)
  const [beatPulse, setBeatPulse] = useState(false);

  // Notation + feedback state
  const [tapResults, setTapResults] = useState(() =>
    makeResetTapResults(beatsPerMeasure)
  );
  const [cursorProgress, setCursorProgress] = useState(0);
  const [floatingQuality, setFloatingQuality] = useState(null);
  const [floatingKey, setFloatingKey] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);

  // Hold note state (Phase 31)
  const [isHoldComplete, setIsHoldComplete] = useState(false);
  const [holdFeedbackLabel, setHoldFeedbackLabel] = useState(null);

  // Refs for timing
  const beatDuration = useRef(60 / tempo);
  const metronomeStartTimeRef = useRef(null);
  const playingStartTimeRef = useRef(null);
  const userTapsRef = useRef([]);
  const continuousMetronomeRef = useRef(null);
  const visualMetronomeRef = useRef(null);
  const playingTimerRef = useRef(null);
  const scheduledOscillatorsRef = useRef([]);
  const hasStartedRef = useRef(false);
  const cleanupDoneRef = useRef(false);

  // Hold note refs (Phase 31) — rAF-driven, no React state updates at 60fps
  const pressStartTimeRef = useRef(null);
  const rafIdRef = useRef(null);
  const holdRingCircleRef = useRef(null);

  // New refs for notation + beat-sync
  const staveBoundsRef = useRef(null);
  const perBeatResultsRef = useRef([]);
  const prevMeasureRef = useRef(0);
  const prevAbsoluteBeatRef = useRef(-1);
  const beatPulseTimerRef = useRef(null);

  // Keep beatDuration ref in sync
  useEffect(() => {
    beatDuration.current = 60 / tempo;
  }, [tempo]);

  // Determine if the current beat (1-indexed) is a hold note
  const currentBeatInfo = beats[(currentBeat - 1) % beats.length] || beats[0];
  const currentBeatIsHold = isHoldNote(currentBeatInfo.durationUnits);
  const currentHoldDurationMs = currentBeatIsHold
    ? calcHoldDurationMs(currentBeatInfo.durationUnits, tempo)
    : 0;

  // Audio output latency compensation (dynamic when available).
  // baseLatency alone is insufficient — it's just processing latency,
  // not the full output delay. Only use outputLatency or fallback.
  const getLatencyCompensation = useCallback(() => {
    const ctx = audioEngine.audioContextRef?.current;
    if (ctx?.outputLatency > 0) return ctx.outputLatency;
    return FALLBACK_LATENCY_S;
  }, [audioEngine]);

  // Stave bounds callback
  const handleStaveBoundsReady = useCallback((bounds) => {
    staveBoundsRef.current = bounds;
  }, []);

  // Create metronome click sound (mirrors RhythmTapQuestion pattern)
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

  // Schedule metronome clicks ahead of time
  const scheduleBeatClicks = useCallback(
    (startTime) => {
      const beatDur = beatDuration.current;
      const currentTime = audioEngine.getCurrentTime();
      const timeSinceStart = currentTime - startTime;
      const totalBeatsFloat = timeSinceStart / beatDur;
      const totalBeatsCompleted = Math.floor(totalBeatsFloat);
      for (let i = 0; i < 3; i++) {
        const beatNumber = totalBeatsCompleted + i;
        const beatTime = startTime + beatNumber * beatDur;
        if (beatTime > currentTime + 0.05) {
          const isDownbeat = beatNumber % beatsPerMeasure === 0;
          const frequency = isDownbeat ? 700 : 550;
          createClickSound(beatTime, frequency, 0.12);
        }
      }
    },
    [audioEngine, beatsPerMeasure, createClickSound]
  );

  // Start continuous metronome scheduling
  const startContinuousMetronome = useCallback(
    (startTime, playingStartTime) => {
      metronomeStartTimeRef.current = startTime;
      if (continuousMetronomeRef.current)
        clearInterval(continuousMetronomeRef.current);
      if (visualMetronomeRef.current) clearInterval(visualMetronomeRef.current);
      scheduledOscillatorsRef.current = [];

      scheduleBeatClicks(startTime);
      continuousMetronomeRef.current = setInterval(
        () => scheduleBeatClicks(startTime),
        200
      );

      // Visual beat tracking + cursor + measure boundary + circle pulse sync
      visualMetronomeRef.current = setInterval(() => {
        const currentTime = audioEngine.getCurrentTime();
        const timeSinceStart = currentTime - startTime;
        const beatDur = beatDuration.current;
        const currentBeatFloat = timeSinceStart / beatDur;
        const beatInMeasure =
          (Math.floor(currentBeatFloat) % beatsPerMeasure) + 1;
        setCurrentBeat(beatInMeasure);

        // Sync circle pulse to metronome beat
        const absoluteBeat = Math.floor(currentBeatFloat);
        if (absoluteBeat !== prevAbsoluteBeatRef.current && absoluteBeat >= 0) {
          prevAbsoluteBeatRef.current = absoluteBeat;
          setBeatPulse(true);
          if (beatPulseTimerRef.current)
            clearTimeout(beatPulseTimerRef.current);
          beatPulseTimerRef.current = setTimeout(
            () => setBeatPulse(false),
            150
          );
        }

        // Cursor + measure tracking (only during PLAYING)
        if (playingStartTime && currentTime >= playingStartTime) {
          const playElapsed = currentTime - playingStartTime;
          const playBeatFloat = playElapsed / beatDur;
          const noteIdx = Math.floor(playBeatFloat) % beatsPerMeasure;
          const measure = Math.min(
            PLAY_MEASURES - 1,
            Math.floor(playBeatFloat / beatsPerMeasure)
          );

          // Update cursor position from note positions
          const bounds = staveBoundsRef.current;
          if (bounds?.noteXPositions?.length > 0) {
            const safeIdx = Math.min(noteIdx, bounds.noteXPositions.length - 1);
            setCursorProgress(
              bounds.noteXPositions[safeIdx] / bounds.containerWidth
            );
          }

          // Detect measure boundary — reset note colors
          if (measure !== prevMeasureRef.current) {
            prevMeasureRef.current = measure;
            setCurrentMeasure(measure);
            setTapResults(makeResetTapResults(beatsPerMeasure));
          }
        }
      }, 50);
    },
    [audioEngine, beatsPerMeasure, scheduleBeatClicks]
  );

  // Stop metronome intervals and cancel future oscillators
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
    if (playingTimerRef.current) {
      clearTimeout(playingTimerRef.current);
      playingTimerRef.current = null;
    }
    if (beatPulseTimerRef.current) {
      clearTimeout(beatPulseTimerRef.current);
      beatPulseTimerRef.current = null;
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

  // Evaluate taps using accumulated per-beat results
  const evaluatePerformance = useCallback(() => {
    setPhase(PHASES.EVALUATING);
    stopContinuousMetronome();

    // Deduplicate per-beat results — keep best quality per absolute beat
    const bestPerBeat = new Map();
    const rank = { PERFECT: 3, GOOD: 2, MISS: 1 };
    for (const r of perBeatResultsRef.current) {
      const existing = bestPerBeat.get(r.beat);
      if (!existing || rank[r.quality] > rank[existing.quality]) {
        bestPerBeat.set(r.beat, r);
      }
    }
    const onTimeTaps = [...bestPerBeat.values()].filter(
      (r) => r.quality !== "MISS"
    ).length;

    setPhase(PHASES.DONE);
    setTimeout(() => onComplete(onTimeTaps, totalPlayBeats), 800);
  }, [onComplete, totalPlayBeats, stopContinuousMetronome]);

  // Handle a user tap (click or touch) — quarter note path, unchanged
  const handleTap = useCallback(() => {
    if (phase !== PHASES.PLAYING) return;

    const tapTime = audioEngine.getCurrentTime();
    userTapsRef.current.push({ time: tapTime });

    // Brief visual flash
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 120);

    // Per-tap evaluation
    const playStart = playingStartTimeRef.current;
    if (playStart == null) return;

    const beatDur = beatDuration.current;
    const elapsed = tapTime - playStart;
    const absoluteBeatFloat = elapsed / beatDur;
    const nearestBeat = Math.round(absoluteBeatFloat);

    if (nearestBeat < 0 || nearestBeat >= totalPlayBeats) return;

    // Shift expected time forward by audio output latency so tapping
    // in sync with the audible click evaluates as on-time.
    const latency = getLatencyCompensation();
    const expectedTime = playStart + nearestBeat * beatDur + latency;
    const timingErrorMs = Math.abs((tapTime - expectedTime) * 1000);
    const thresholds = calculateTimingThresholds(tempo);

    // Use FAIR threshold as GOOD/MISS boundary — generous for first exercise.
    // PERFECT ≤60ms, GOOD ≤149ms, MISS >149ms (at 65 BPM with scaling).
    let quality;
    if (timingErrorMs <= thresholds.PERFECT) quality = "PERFECT";
    else if (timingErrorMs <= thresholds.FAIR) quality = "GOOD";
    else quality = "MISS";

    // Note index within current measure (0-based)
    const noteIdx = nearestBeat % beatsPerMeasure;

    // Update RhythmStaffDisplay note color
    setTapResults((prev) => {
      const updated = prev.filter((r) => r.noteIdx !== noteIdx);
      updated.push({ noteIdx, quality });
      return updated;
    });

    // Trigger FloatingFeedback
    setFloatingQuality(quality);
    setFloatingKey((k) => k + 1);

    // Track for final scoring
    perBeatResultsRef.current.push({ beat: nearestBeat, quality });

    // Update beat counter
    setBeatNum(nearestBeat + 1);
  }, [
    phase,
    audioEngine,
    totalPlayBeats,
    tempo,
    beatsPerMeasure,
    getLatencyCompensation,
  ]);

  // Handle press start for hold notes (Phase 31)
  const handlePressStart = useCallback(
    (e) => {
      if (phase !== PHASES.PLAYING) return;

      if (!currentBeatIsHold) {
        // Quarter note — delegate to existing tap logic
        handleTap();
        return;
      }

      // Hold note path
      pressStartTimeRef.current = performance.now();
      setIsHoldComplete(false);
      setHoldFeedbackLabel(null);

      // Sustained piano sound for the full hold duration (D-02)
      const noteDurationSec = currentHoldDurationMs / 1000;
      if (audioEngine.createPianoSound) {
        audioEngine.createPianoSound(
          audioEngine.getCurrentTime(),
          0.8,
          noteDurationSec
        );
      }

      // Record onset tap time (same as existing handleTap — for onset scoring)
      const tapTime = audioEngine.getCurrentTime();
      userTapsRef.current.push({ time: tapTime });

      // Brief visual flash (same as handleTap)
      setTapFlash(true);
      setTimeout(() => setTapFlash(false), 120);

      // Update beat counter for accessibility label
      const playStart = playingStartTimeRef.current;
      if (playStart != null) {
        const elapsed = tapTime - playStart;
        const beatDur = beatDuration.current;
        const beatIndex = Math.max(
          0,
          Math.min(totalPlayBeats - 1, Math.floor(elapsed / beatDur))
        );
        setBeatNum(beatIndex + 1);
      }

      // Start rAF ring animation — ring fills to 100% at PERFECT threshold
      const startTime = performance.now();
      const ringDurationMs = currentHoldDurationMs * HOLD_THRESHOLDS.PERFECT;

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / ringDurationMs);
        if (holdRingCircleRef.current) {
          const offset = CIRCUMFERENCE * (1 - progress);
          holdRingCircleRef.current.setAttribute(
            "stroke-dashoffset",
            String(offset)
          );
        }
        // Continue animating while finger is held and ring not complete
        if (progress < 1 && pressStartTimeRef.current !== null) {
          rafIdRef.current = requestAnimationFrame(animate);
        }
      };
      rafIdRef.current = requestAnimationFrame(animate);
    },
    [
      phase,
      currentBeatIsHold,
      currentHoldDurationMs,
      handleTap,
      audioEngine,
      totalPlayBeats,
    ]
  );

  // Handle press end for hold notes (Phase 31)
  const handlePressEnd = useCallback(() => {
    if (pressStartTimeRef.current === null) return;

    cancelAnimationFrame(rafIdRef.current);
    const holdMs = performance.now() - pressStartTimeRef.current;
    pressStartTimeRef.current = null;

    const quality = scoreHold(holdMs, currentHoldDurationMs);

    // Green flash on PERFECT (D-01)
    if (quality === "PERFECT") {
      setIsHoldComplete(true);
      setTimeout(() => setIsHoldComplete(false), 200);
    }

    // Reset ring to empty
    if (holdRingCircleRef.current) {
      holdRingCircleRef.current.setAttribute(
        "stroke-dashoffset",
        String(CIRCUMFERENCE)
      );
    }

    // Show feedback for GOOD holds (D-04)
    if (quality === "GOOD") {
      setHoldFeedbackLabel(
        t("games.metronomeTrainer.tapArea.accuracy.holdGood")
      );
      setTimeout(() => setHoldFeedbackLabel(null), 1500);
    } else {
      setHoldFeedbackLabel(null);
    }
  }, [currentHoldDurationMs, t]);

  // Start the pulse flow
  const startFlow = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    try {
      await audioEngine.resumeAudioContext();
    } catch {
      getOrCreateAudioContext();
    }

    // Prime the audio pipeline with a silent oscillator so the first
    // real click isn't swallowed by an uninitialized output buffer.
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
      // Non-critical — first tick may still be quiet
    }

    userTapsRef.current = [];
    setBeatNum(0);
    setCurrentBeat(1);
    setBeatPulse(false);
    setTapResults(makeResetTapResults(beatsPerMeasure));
    setCursorProgress(0);
    setFloatingQuality(null);
    setFloatingKey(0);
    setCurrentMeasure(0);
    perBeatResultsRef.current = [];
    prevMeasureRef.current = 0;
    prevAbsoluteBeatRef.current = -1;

    // Reset hold state for new round (Phase 31)
    pressStartTimeRef.current = null;
    cancelAnimationFrame(rafIdRef.current);
    setIsHoldComplete(false);
    setHoldFeedbackLabel(null);

    const beatDur = beatDuration.current;
    const countInBeats = beatsPerMeasure; // 1 measure count-in
    // 300ms lead time to ensure audio pipeline is fully initialized
    const countInStartTime = audioEngine.getCurrentTime() + 0.3;
    const playingStartTime = countInStartTime + countInBeats * beatDur;

    // Start metronome from count-in start, pass playingStartTime for cursor tracking
    startContinuousMetronome(countInStartTime, playingStartTime);
    setPhase(PHASES.COUNT_IN);

    // Transition to PLAYING after count-in
    const countInDurationMs =
      (playingStartTime - audioEngine.getCurrentTime()) * 1000;

    setTimeout(
      () => {
        playingStartTimeRef.current = playingStartTime;
        setPhase(PHASES.PLAYING);

        // Auto-complete after all playing beats
        const playingDurationMs = totalPlayBeats * beatDur * 1000;
        playingTimerRef.current = setTimeout(() => {
          evaluatePerformance();
        }, playingDurationMs);
      },
      Math.max(0, countInDurationMs)
    );
  }, [
    audioEngine,
    getOrCreateAudioContext,
    beatsPerMeasure,
    totalPlayBeats,
    startContinuousMetronome,
    evaluatePerformance,
  ]);

  // Auto-start when not disabled (hasStartedRef pattern)
  useEffect(() => {
    if (!disabled && phase === PHASES.WAITING) {
      startFlow();
    }
  }, [disabled, phase, startFlow]);

  // Cleanup on unmount — cancel rAF loop (T-31-08) and metronome
  useEffect(() => {
    return () => {
      if (!cleanupDoneRef.current) {
        cleanupDoneRef.current = true;
        stopContinuousMetronome();
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [stopContinuousMetronome]);

  // Guidance text by phase
  const getGuidanceText = () => {
    switch (phase) {
      case PHASES.COUNT_IN:
        return t("rhythm.countIn", "Listen to the beat...");
      case PHASES.PLAYING:
        return currentBeatIsHold
          ? t("games.metronomeTrainer.tapArea.holdHere", "HOLD")
          : t("game.pulse.instruction", "Tap with the beat!");
      case PHASES.EVALUATING:
      case PHASES.DONE:
        return t("rhythm.niceTapping", "Nice tapping!");
      default:
        return t("game.pulse.instruction", "Tap with the beat!");
    }
  };

  const isActive = phase === PHASES.PLAYING;
  const isAnimating = phase === PHASES.COUNT_IN || phase === PHASES.PLAYING;

  // Whether the beats array has any hold notes (determines if stretched indicator is needed)
  const hasHoldBeats = beats.some((b) => isHoldNote(b.durationUnits));

  // Total quarter-note columns for the stretched beat indicator grid
  const totalColumns = beats.reduce((sum, b) => sum + b.durationUnits / 4, 0);

  return (
    <div
      className="flex w-full flex-col items-center gap-4"
      role="main"
      aria-label={t(
        "game.pulse.ariaLabel",
        "Pulse exercise — tap with the beat"
      )}
    >
      {/* Metronome beat display — standard circles for quarter-note measures */}
      {!hasHoldBeats && (
        <MetronomeDisplay
          currentBeat={currentBeat}
          timeSignature={timeSignature}
          isActive={phase !== PHASES.WAITING && phase !== PHASES.DONE}
          isCountIn={phase === PHASES.COUNT_IN}
        />
      )}

      {/* Stretched beat indicator (D-08) — only when beats contain half/whole notes */}
      {hasHoldBeats &&
        (phase === PHASES.COUNT_IN || phase === PHASES.PLAYING) && (
          <div
            dir="ltr"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${totalColumns}, 1fr)`,
              gap: "4px",
              maxWidth: "200px",
              margin: "0 auto",
            }}
            aria-hidden="true"
          >
            {beats.map((beat, i) => {
              const span = beat.durationUnits / 4; // quarter=1, half=2, whole=4
              const isCurrent = (currentBeat - 1) % beats.length === i;
              return (
                <div
                  key={i}
                  style={{ gridColumn: `span ${span}` }}
                  className={`h-3 rounded-full transition-all duration-150 ${
                    isCurrent
                      ? phase === PHASES.COUNT_IN
                        ? "scale-y-110 bg-yellow-400"
                        : "scale-y-110 bg-blue-400"
                      : "bg-white/20"
                  }`}
                />
              );
            })}
          </div>
        )}

      {/* VexFlow staff notation — shown from COUNT_IN onwards */}
      {phase !== PHASES.WAITING && (
        <div className="w-full max-w-md">
          <RhythmStaffDisplay
            beats={PULSE_BEATS}
            timeSignature={config.timeSignature || "4/4"}
            cursorProgress={cursorProgress}
            tapResults={tapResults}
            showCursor={phase === PHASES.PLAYING}
            reducedMotion={reducedMotion}
            onStaveBoundsReady={handleStaveBoundsReady}
            measures={1}
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
          isHoldNote={currentBeatIsHold}
          holdRingRef={holdRingCircleRef}
          isHoldComplete={isHoldComplete}
          reducedMotion={reducedMotion}
          holdFeedbackLabel={holdFeedbackLabel}
          feedback={null}
          isActive={phase === PHASES.PLAYING}
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
