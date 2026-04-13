/**
 * PulseQuestion.jsx
 *
 * "Tap with the beat" renderer for MixedLessonGame.
 * The very first rhythm exercise — children tap along to a pulsing metronome
 * beat for 4 bars. No music notation, no staff lines, no VexFlow.
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
import { MetronomeDisplay } from "../components";
import { HoldRing, CIRCUMFERENCE } from "../components/HoldRing";
import { TIME_SIGNATURES } from "../RhythmPatternGenerator";
import {
  scoreHold,
  isHoldNote,
  calcHoldDurationMs,
} from "../utils/holdScoringUtils";

// Sub-phases for the pulse flow (simplified from RhythmTapQuestion)
const PHASES = {
  WAITING: "waiting",
  COUNT_IN: "count-in",
  PLAYING: "playing",
  EVALUATING: "evaluating",
  DONE: "done",
};

// Total measures to tap along with
const PLAY_MEASURES = 4;

// Base timing thresholds (ms) at 120 BPM — mirrors RhythmTapQuestion
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

// Time signature string → TIME_SIGNATURES object mapping
const TIME_SIG_MAP = {
  "4/4": TIME_SIGNATURES.FOUR_FOUR,
  "3/4": TIME_SIGNATURES.THREE_FOUR,
  "2/4": TIME_SIGNATURES.TWO_FOUR,
  "6/8": TIME_SIGNATURES.SIX_EIGHT,
};

// Default beats: 4 quarter notes (unchanged behavior for standard pulse exercises)
const PULSE_BEATS = [
  { durationUnits: 4, isRest: false },
  { durationUnits: 4, isRest: false },
  { durationUnits: 4, isRest: false },
  { durationUnits: 4, isRest: false },
];

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
  const [beatNum, setBeatNum] = useState(0); // absolute beat count during PLAYING (0-based)
  const [tapFlash, setTapFlash] = useState(false); // brief visual flash on tap

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
    (startTime) => {
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

      // Visual beat tracking
      visualMetronomeRef.current = setInterval(() => {
        const currentTime = audioEngine.getCurrentTime();
        const timeSinceStart = currentTime - startTime;
        const beatDur = beatDuration.current;
        const currentBeatFloat = timeSinceStart / beatDur;
        const beatInMeasure =
          (Math.floor(currentBeatFloat) % beatsPerMeasure) + 1;
        setCurrentBeat(beatInMeasure);
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

  // Evaluate taps against expected beat positions
  const evaluatePerformance = useCallback(() => {
    setPhase(PHASES.EVALUATING);
    stopContinuousMetronome();

    const currentUserTaps = userTapsRef.current;
    const playStart = playingStartTimeRef.current;
    const beatDur = beatDuration.current;

    if (!playStart) {
      setTimeout(() => onComplete(0, totalPlayBeats), 500);
      return;
    }

    // Expected beat positions: beats 0, 1, 2, ... (totalPlayBeats - 1)
    const thresholds = calculateTimingThresholds(tempo);
    let onTimeTaps = 0;

    for (let b = 0; b < totalPlayBeats; b++) {
      const expectedTime = playStart + b * beatDur;
      // Find nearest user tap
      let bestErrorMs = Infinity;
      for (const tap of currentUserTaps) {
        const errorMs = Math.abs((tap.time - expectedTime) * 1000);
        if (errorMs < bestErrorMs) bestErrorMs = errorMs;
      }
      if (bestErrorMs <= thresholds.FAIR) {
        onTimeTaps++;
      }
    }

    setPhase(PHASES.DONE);
    setTimeout(() => onComplete(onTimeTaps, totalPlayBeats), 800);
  }, [onComplete, tempo, totalPlayBeats, stopContinuousMetronome]);

  // Handle a user tap (click or touch) — quarter note path, unchanged
  const handleTap = useCallback(() => {
    if (phase !== PHASES.PLAYING) return;

    const tapTime = audioEngine.getCurrentTime();
    userTapsRef.current.push({ time: tapTime });

    // Brief visual flash
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
  }, [phase, audioEngine, totalPlayBeats]);

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

      // Start rAF ring animation — drives SVG stroke-dashoffset imperatively
      // to avoid React re-renders at 60fps (ref-based DOM mutation pattern)
      const startTime = performance.now();
      const requiredMs = currentHoldDurationMs;

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / requiredMs);
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

    userTapsRef.current = [];
    setBeatNum(0);
    setCurrentBeat(1);

    // Reset hold state for new round (Phase 31)
    pressStartTimeRef.current = null;
    cancelAnimationFrame(rafIdRef.current);
    setIsHoldComplete(false);
    setHoldFeedbackLabel(null);

    const beatDur = beatDuration.current;
    const countInBeats = beatsPerMeasure; // 1 measure count-in
    const countInStartTime = audioEngine.getCurrentTime() + 0.1;

    // Start metronome from count-in start
    startContinuousMetronome(countInStartTime);
    setPhase(PHASES.COUNT_IN);

    // Transition to PLAYING after count-in
    const playingStartTime = countInStartTime + countInBeats * beatDur;
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
  const beatDur = beatDuration.current;

  // CSS animation duration in seconds matches beat interval
  const animDuration = `${beatDur.toFixed(3)}s`;
  const isAnimating = phase === PHASES.COUNT_IN || phase === PHASES.PLAYING;

  // Whether the beats array has any hold notes (determines if stretched indicator is needed)
  const hasHoldBeats = beats.some((b) => isHoldNote(b.durationUnits));

  // Total quarter-note columns for the stretched beat indicator grid
  const totalColumns = beats.reduce((sum, b) => sum + b.durationUnits / 4, 0);

  return (
    <div
      className="flex w-full flex-col items-center gap-6"
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
      {hasHoldBeats && (phase === PHASES.COUNT_IN || phase === PHASES.PLAYING) && (
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

      {/* Glass card container */}
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-white/20 bg-white/10 px-6 py-8 shadow-lg backdrop-blur-md">
        {/* Pulsing circle — the core visual */}
        <div
          className="relative flex items-center justify-center"
          aria-hidden="true"
        >
          {/* Outer glow ring (reduced motion: opacity instead of scale) */}
          {!reducedMotion && isAnimating && (
            <div
              className="absolute rounded-full bg-blue-400/20"
              style={{
                width: "160px",
                height: "160px",
                animation: `pulse-beat-ring ${animDuration} ease-in-out infinite`,
              }}
            />
          )}
          {/* Main pulsing circle — extended with hold mode support (Phase 31) */}
          <div className="relative">
            <button
              onPointerDown={
                currentBeatIsHold && isActive
                  ? (e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      handlePressStart(e);
                    }
                  : undefined
              }
              onPointerUp={
                currentBeatIsHold && isActive ? handlePressEnd : undefined
              }
              onPointerCancel={
                currentBeatIsHold && isActive ? handlePressEnd : undefined
              }
              onClick={!currentBeatIsHold && isActive ? handleTap : undefined}
              onTouchStart={
                !currentBeatIsHold && isActive
                  ? (e) => {
                      e.preventDefault();
                      handleTap();
                    }
                  : undefined
              }
              disabled={!isActive}
              style={{
                ...(currentBeatIsHold ? { touchAction: "none" } : undefined),
                ...(!reducedMotion && isAnimating
                  ? { "--beat-dur": animDuration }
                  : undefined),
              }}
              className={[
                "relative flex h-32 w-32 items-center justify-center rounded-full",
                "bg-gradient-to-br from-blue-400 to-purple-500",
                "shadow-lg shadow-blue-500/40",
                "transition-all duration-100",
                isActive
                  ? "cursor-pointer hover:brightness-110 active:scale-95"
                  : "cursor-default",
                tapFlash ? "brightness-150" : "",
                !reducedMotion && isAnimating
                  ? "animate-[pulse-beat_var(--beat-dur)_ease-in-out_infinite]"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={
                isActive
                  ? currentBeatIsHold
                    ? t(
                        "games.metronomeTrainer.tapArea.holdHere",
                        "Hold here"
                      )
                    : t("game.pulse.tapButton", "Tap here")
                  : undefined
              }
            >
              {/* Reduced motion alternative: opacity pulse */}
              {reducedMotion && isAnimating && (
                <span
                  className="absolute inset-0 rounded-full bg-white/30"
                  style={{
                    animation: `pulse-beat-opacity ${animDuration} ease-in-out infinite`,
                  }}
                />
              )}
              {/* HOLD label for hold note beats (D-07) */}
              {currentBeatIsHold && isActive && (
                <span className="relative z-10 text-xs font-bold text-white/90">
                  {t("games.metronomeTrainer.tapArea.holdHere", "HOLD")}
                </span>
              )}
            </button>
            {/* HoldRing overlay — absolute positioned over the button (Phase 31) */}
            {currentBeatIsHold && !reducedMotion && (
              <div className="pointer-events-none absolute inset-0">
                <HoldRing
                  ringRef={holdRingCircleRef}
                  isComplete={isHoldComplete}
                  reducedMotion={reducedMotion}
                />
              </div>
            )}
          </div>
        </div>

        {/* Instruction text / hold feedback */}
        <p className="text-center text-lg font-semibold text-white">
          {holdFeedbackLabel || getGuidanceText()}
        </p>

        {/* Beat counter (shown only during PLAYING) */}
        {phase === PHASES.PLAYING && (
          <p
            className="text-center text-sm text-white/60"
            aria-live="polite"
            aria-atomic="true"
          >
            {t("game.pulse.beatCount", "Beat {{current}} of {{total}}", {
              current: beatNum > 0 ? beatNum : 1,
              total: totalPlayBeats,
            })}
          </p>
        )}
      </div>

      {/* Inline keyframe styles — scoped to this component */}
      <style>{`
        @keyframes pulse-beat {
          0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(96,165,250,0.5); }
          50%  { transform: scale(1.15); box-shadow: 0 0 0 12px rgba(96,165,250,0); }
          100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(96,165,250,0); }
        }
        @keyframes pulse-beat-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          50%  { transform: scale(1.3);  opacity: 0; }
          100% { transform: scale(1);    opacity: 0; }
        }
        @keyframes pulse-beat-opacity {
          0%   { opacity: 0.5; }
          50%  { opacity: 0; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
