/**
 * RhythmTapQuestion.jsx
 *
 * Stateful renderer for rhythm tap questions within MixedLessonGame.
 * Plays ONE metronome pattern, user taps along, then reports tap results.
 * Kid-friendly visual feedback: colored dots per beat (green/yellow/red).
 *
 * Unlike the stateless card renderers, this component manages its own
 * sub-state machine for the listen-then-tap flow.
 *
 * Hold mechanic (Plan 31-02):
 * - Half and whole note onsets require sustained press with filling ring visual
 * - Quarter notes remain simple taps (onClick path unchanged)
 * - rAF ring animation driven via holdRingCircleRef (no React re-render at 60fps)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAudioEngine } from "../../../../hooks/useAudioEngine";
import { useAudioContext } from "../../../../contexts/AudioContextProvider";
import { useAccessibility } from "../../../../contexts/AccessibilityContext";
import { useDeclareNeedsLandscape } from "../../../../contexts/NeedsLandscapeContext";
import { MetronomeDisplay, TapArea } from "../components";
import FloatingFeedback from "../components/FloatingFeedback";
import { getPattern, TIME_SIGNATURES } from "../RhythmPatternGenerator";
import {
  resolveByTags,
  resolveByAnyTag,
  durationsIncludeRests,
} from "../../../../data/patterns/RhythmPatternGenerator";
import {
  scoreHold,
  isHoldNote,
  calcHoldDurationMs,
  HOLD_THRESHOLDS,
} from "../utils/holdScoringUtils";
import { CIRCUMFERENCE } from "../components/HoldRing";
import { DURATION_INFO } from "../utils/durationInfo";
import { needsLandscape as computeNeedsLandscape } from "../utils/needsLandscape";
import {
  getMeterTiming,
  isStrongSubdivision,
  isStrongOnset,
} from "../utils/meterUtils";

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

const SCORING = { PERFECT: 100, GOOD: 75, FAIR: 50, MISS: 0 };

// Compensate for audio output latency: scheduled clicks reach the speaker
// ~latency ms after their audioContext time. The user taps in sync with
// what they hear, so subtract this from relativeTime before evaluation.
const FALLBACK_LATENCY_S = 0.08; // 80ms fallback

// Count-in auto-start retry. A remounted audio question (2nd+ question in a
// MixedLessonGame) can briefly observe a not-yet-running shared AudioContext;
// without a retry the count-in bails permanently and the game freezes. Re-arm
// the start effect a few times so it self-heals once the context is running.
const MAX_START_RETRIES = 6;
const START_RETRY_MS = 150;

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
  const { audioContextRef } = useAudioContext();
  const { reducedMotion = false } = useAccessibility();
  const config = question?.rhythmConfig || {};
  const tempo = config.tempo || 80;
  const audioEngine = useAudioEngine(tempo, {
    sharedAudioContext: audioContextRef.current,
  });

  // Audio output latency compensation (dynamic when available).
  // baseLatency alone is insufficient — it's just processing latency,
  // not the full output delay. Only use outputLatency or fallback.
  const getLatencyCompensation = useCallback(() => {
    const ctx = audioEngine.audioContextRef?.current;
    if (ctx?.outputLatency > 0) return ctx.outputLatency;
    return FALLBACK_LATENCY_S;
  }, [audioEngine]);

  const timeSignature =
    TIME_SIG_MAP[config.timeSignature] || TIME_SIGNATURES.FOUR_FOUR;

  // Content-driven landscape declaration (CORE-04). RhythmTapQuestion has
  // async-loaded patterns (patternInfoRef), so we derive from configured
  // measureCount upfront — same threshold semantics via the helper's
  // measures-only path.
  const declaredNeedsLandscape = computeNeedsLandscape(
    null,
    config?.timeSignature || "4/4",
    config?.measureCount || 1
  );
  useDeclareNeedsLandscape(declaredNeedsLandscape);

  // Sub-state machine
  const [phase, setPhase] = useState(PHASES.INITIALIZING);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [beatResults, setBeatResults] = useState([]); // Array of 'PERFECT'|'GOOD'|'FAIR'|'MISS' per expected beat
  const [hasUserStartedTapping, setHasUserStartedTapping] = useState(false);
  const [floatingQuality, setFloatingQuality] = useState(null);
  const [floatingKey, setFloatingKey] = useState(0);

  // Hold mode state
  const [isHoldComplete, setIsHoldComplete] = useState(false);
  const [currentOnsetHold, setCurrentOnsetHold] = useState({
    isHold: false,
    holdDurationMs: 0,
  });

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

  // Count-in auto-start retry plumbing — see MAX_START_RETRIES note above.
  const [startRetryTick, setStartRetryTick] = useState(0);
  const startRetryCountRef = useRef(0);
  const startRetryTimerRef = useRef(null);

  // Hold mechanic refs
  const currentOnsetIndexRef = useRef(0);
  const pressStartTimeRef = useRef(null);
  const rafIdRef = useRef(null);
  const holdRingCircleRef = useRef(null);
  const lastHoldEndTimeRef = useRef(0);

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

  // Start continuous metronome.
  //
  // Mirrors the working pattern in MetronomeTrainer.startContinuousMetronome
  // (lines ~359–516): defers the visual loop until startTime arrives so the
  // first ~300ms of negative timeSinceStart can't render beat=0, and uses a
  // 50ms scheduling cadence for responsive stop/start.
  const startContinuousMetronome = useCallback(
    (startTime) => {
      const beatDur = beatDuration.current;
      const { displayCount, subdivisionDur } = getMeterTiming(
        timeSignature,
        beatDur
      );
      metronomeStartTimeRef.current = startTime;

      if (continuousMetronomeRef.current)
        clearInterval(continuousMetronomeRef.current);
      if (visualMetronomeRef.current) clearInterval(visualMetronomeRef.current);
      scheduledOscillatorsRef.current = [];

      // For 6/8 these clicks land on eighth-note subdivisions (6 per measure)
      // with accents on positions 1 and 4; simple meters tick once per beat.
      const scheduleBeats = (currentTime) => {
        const timeSinceStart = currentTime - startTime;
        const completedSubdivisions = Math.floor(
          timeSinceStart / subdivisionDur
        );
        for (let i = 0; i < 5; i++) {
          const subdivisionNumber = completedSubdivisions + i;
          const beatTime = startTime + subdivisionNumber * subdivisionDur;
          if (beatTime > currentTime + 0.05) {
            const strong = isStrongSubdivision(
              subdivisionNumber,
              timeSignature
            );
            createClickSound(beatTime, strong ? 700 : 550, strong ? 0.14 : 0.1);
          }
        }
      };

      // Initial scheduling (queues a few beats ahead of startTime).
      scheduleBeats(audioEngine.getCurrentTime());

      // 50ms cadence (was 200ms) — keeps the schedule queue topped up and
      // matches MetronomeTrainer for responsive stop behavior.
      continuousMetronomeRef.current = setInterval(
        () => scheduleBeats(audioEngine.getCurrentTime()),
        50
      );

      // Defer the visual loop until startTime actually arrives, so
      // timeSinceStart is non-negative when updateVisualBeat first runs.
      // Previously the immediate setInterval ran with timeSinceStart < 0
      // for ~300ms; Math.floor(-x) is -1, (-1 % N) is -1, so
      // beatInMeasure was 0 — display rendered no highlighted circle.
      const firstBeatDelay = (startTime - audioEngine.getCurrentTime()) * 1000;

      const updateVisualBeat = () => {
        const currentTime = audioEngine.getCurrentTime();
        // Belt-and-braces clamp: if setTimeout fires a hair early, ensure
        // beatInMeasure is at least 1 (never 0).
        const timeSinceStart = Math.max(0, currentTime - startTime);
        const totalSubdivisions = Math.floor(timeSinceStart / subdivisionDur);
        const beatInMeasure = (totalSubdivisions % displayCount) + 1;
        setCurrentBeat(beatInMeasure);
      };

      setTimeout(
        () => {
          // Bail if the audio scheduler was already stopped during count-in
          // (e.g., user navigated away). Prevents a stray visual loop.
          if (continuousMetronomeRef.current === null) return;
          updateVisualBeat(); // initial frame at startTime
          visualMetronomeRef.current = setInterval(updateVisualBeat, 50);
        },
        Math.max(0, firstBeatDelay)
      );
    },
    [audioEngine, timeSignature, createClickSound]
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

  // Stable ref to the latest stop fn. stopContinuousMetronome closes over the
  // per-render `audioEngine` object, so its identity changes every render. The
  // unmount cleanup below must NOT depend on it — listing it made the cleanup
  // fire on ordinary re-renders, tearing down the live metronome intervals
  // mid-exercise (the count-in freeze on 2nd+ audio questions).
  const stopContinuousMetronomeRef = useRef(stopContinuousMetronome);
  stopContinuousMetronomeRef.current = stopContinuousMetronome;

  // Evaluate performance after user finishes tapping
  const evaluatePerformance = useCallback(() => {
    const currentUserTaps = userTapsRef.current;

    if (!patternInfoRef.current) {
      onComplete(0, 1);
      return;
    }

    const { pattern } = patternInfoRef.current;
    const currentBeatDur = beatDuration.current;
    const sixteenthDur = currentBeatDur / 4;
    const latency = getLatencyCompensation();

    // Expected onset offsets within one measure. Pattern arrays are indexed in
    // sixteenth-note slots, so each onset offset is index * sixteenthDur —
    // matching how the pattern is actually played back.
    const expectedOffsets = [];
    pattern.forEach((beat, index) => {
      if (beat === 1) {
        expectedOffsets.push(index * sixteenthDur);
      }
    });

    if (expectedOffsets.length === 0) {
      onComplete(0, 1);
      return;
    }

    const thresholds = calculateTimingThresholds(tempo);
    const results = [];
    let onTimeCount = 0;

    // For each expected beat, find the best-matching user tap
    expectedOffsets.forEach((expectedOffset) => {
      let bestAccuracy = "MISS";
      const expectedTime = expectedOffset + latency;

      currentUserTaps.forEach((userTap) => {
        const errorMs = Math.abs((userTap.relativeTime - expectedTime) * 1000);

        let accuracy = "MISS";
        if (errorMs <= thresholds.PERFECT) accuracy = "PERFECT";
        else if (errorMs <= thresholds.FAIR) accuracy = "GOOD";

        const rank = { PERFECT: 4, GOOD: 3, MISS: 1 };
        if (rank[accuracy] > (rank[bestAccuracy] || 0)) bestAccuracy = accuracy;
      });

      results.push(bestAccuracy);
      if (bestAccuracy !== "MISS") onTimeCount++;
    });

    setBeatResults(results);
    setPhase(PHASES.DONE);

    // Report to parent after showing results briefly
    setTimeout(() => {
      onComplete(onTimeCount, expectedOffsets.length);
    }, 1500);
  }, [onComplete, tempo, getLatencyCompensation]);

  // --- Hold mechanic helpers ---

  /**
   * Get info about the current expected onset (is it a hold note? how long?).
   * Filters out rests from vexDurations to get onset-only index.
   */
  const getCurrentOnsetInfo = useCallback(() => {
    const info = patternInfoRef.current;
    if (!info?.vexDurations)
      return { isHold: false, holdDurationMs: 0, durationCode: "q" };

    // Build onset-only index from vexDurations (skip rests)
    const onsetDurations = info.vexDurations.filter((code) => {
      const di = DURATION_INFO[code];
      return di && !di.isRest;
    });

    const idx = currentOnsetIndexRef.current;
    if (idx >= onsetDurations.length)
      return { isHold: false, holdDurationMs: 0, durationCode: "q" };

    const code = onsetDurations[idx];
    const di = DURATION_INFO[code];
    if (!di) return { isHold: false, holdDurationMs: 0, durationCode: "q" };

    return {
      isHold: isHoldNote(di.durationUnits),
      holdDurationMs: calcHoldDurationMs(di.durationUnits, tempo),
      durationCode: code,
    };
  }, [tempo]);

  /**
   * Advance the onset index and update currentOnsetHold state for TapArea.
   */
  const advanceOnset = useCallback(() => {
    currentOnsetIndexRef.current += 1;
    setCurrentOnsetHold(getCurrentOnsetInfo());
  }, [getCurrentOnsetInfo]);

  /**
   * Shared first-tap initialization logic.
   * Called by both handleTap (quarter notes) and handlePressStart (hold notes).
   * Sets hasUserStartedTapping, anchors userPerformanceStartTimeRef,
   * and schedules metronome stop + evaluatePerformance.
   *
   * @param {Function} stopMetronome
   * @param {Function} evalPerf
   * @param {Function} setStarted
   * @returns {number|null} nearestBeat1Time, or null if too far off
   */
  const registerFirstOnset = useCallback(
    (stopMetronome, evalPerf, setStarted) => {
      const currentTime = audioEngine.getCurrentTime();
      const timeSinceStart = currentTime - metronomeStartTimeRef.current;
      const beatDur = beatDuration.current;
      const { measureDur } = getMeterTiming(timeSignature, beatDur);
      const currentMeasureFloat = timeSinceStart / measureDur;
      const prevMeasure = Math.floor(currentMeasureFloat);
      const nextMeasure = Math.ceil(currentMeasureFloat);

      const prevBeat1Time =
        metronomeStartTimeRef.current + prevMeasure * measureDur;
      const nextBeat1Time =
        metronomeStartTimeRef.current + nextMeasure * measureDur;

      const prevError = Math.abs(currentTime - prevBeat1Time);
      const nextError = Math.abs(currentTime - nextBeat1Time);
      const nearestBeat1Time =
        prevError < nextError ? prevBeat1Time : nextBeat1Time;
      const timingError = Math.min(prevError, nextError);

      if (timingError > beatDur * 1.2) return null; // Too far off

      setStarted(true);
      userPerformanceStartTimeRef.current = nearestBeat1Time;

      // Stop metronome and evaluate at end of measure
      const measureEndTime = nearestBeat1Time + measureDur;
      const delayToEnd = (measureEndTime - currentTime) * 1000;

      setTimeout(() => stopMetronome(), Math.max(0, delayToEnd));
      setTimeout(() => evalPerf(), Math.max(200, delayToEnd + 200));

      return nearestBeat1Time;
    },
    [audioEngine, timeSignature]
  );

  // Handle user tap (quarter notes — existing onClick path)
  const handleTap = useCallback(() => {
    if (phase === PHASES.GET_READY) return;
    if (phase !== PHASES.USER_PERFORMANCE) return;

    // Guard: suppress click events that fire after a hold release.
    // Browsers fire click after pointerup; if advanceOnset switched isHoldNote
    // to false, TapArea re-enables onClick which would overwrite hold feedback.
    if (performance.now() - lastHoldEndTimeRef.current < 300) return;

    const tapTime = audioEngine.getCurrentTime();

    // Play piano sound for tap feedback (quarter notes)
    if (audioEngine.createPianoSound) {
      const onsetInfo = getCurrentOnsetInfo();
      const di = DURATION_INFO[onsetInfo.durationCode];
      const noteDurSec = di
        ? (di.durationUnits / 4) * beatDuration.current
        : beatDuration.current;
      audioEngine.createPianoSound(tapTime, 0.8, noteDurSec);
    }

    if (!hasUserStartedTapping) {
      const anchored = registerFirstOnset(
        stopContinuousMetronome,
        evaluatePerformance,
        setHasUserStartedTapping
      );
      if (anchored === null) return; // Too far off
    }

    const relativeTime =
      tapTime - (userPerformanceStartTimeRef.current || tapTime);
    userTapsRef.current.push({ time: tapTime, relativeTime });

    // Immediate per-tap feedback — uses PulseQuestion's proven approach:
    // compare tapTime directly against expected beat times shifted by latency.
    if (patternInfoRef.current) {
      const { pattern } = patternInfoRef.current;
      const currentBeatDur = beatDuration.current;
      const sixteenthDur = currentBeatDur / 4;
      const { measureDur } = getMeterTiming(timeSignature, currentBeatDur);
      const latency = getLatencyCompensation();

      // Expected onset offsets within one measure (pattern indexed in sixteenths)
      const expectedOffsets = [];
      pattern.forEach((beat, index) => {
        if (beat === 1) expectedOffsets.push(index * sixteenthDur);
      });

      // Find nearest expected beat time (check adjacent measures for edges)
      const curMeasure = Math.max(0, Math.floor(relativeTime / measureDur));
      let bestTimingErrorMs = Infinity;
      for (let m = Math.max(0, curMeasure - 1); m <= curMeasure + 1; m++) {
        for (const offset of expectedOffsets) {
          const expectedTime = m * measureDur + offset + latency;
          const errorMs = Math.abs((relativeTime - expectedTime) * 1000);
          if (errorMs < bestTimingErrorMs) bestTimingErrorMs = errorMs;
        }
      }

      const thresholds = calculateTimingThresholds(tempo);
      let accuracy = "MISS";
      if (bestTimingErrorMs <= thresholds.PERFECT) accuracy = "PERFECT";
      else if (bestTimingErrorMs <= thresholds.FAIR) accuracy = "GOOD";

      const points = SCORING[accuracy] || 0;
      setFeedback({ accuracy, points });
      setFloatingQuality(accuracy);
      setFloatingKey((k) => k + 1);
    }

    // Advance onset index so next onset knows correct hold/tap state
    advanceOnset();
  }, [
    phase,
    audioEngine,
    hasUserStartedTapping,
    stopContinuousMetronome,
    evaluatePerformance,
    tempo,
    timeSignature,
    getLatencyCompensation,
    registerFirstOnset,
    advanceOnset,
    getCurrentOnsetInfo,
  ]);

  // Handle press start for hold notes (onPointerDown path)
  const handlePressStart = useCallback(
    (e) => {
      if (phase !== PHASES.USER_PERFORMANCE) return;

      const onsetInfo = getCurrentOnsetInfo();

      if (!onsetInfo.isHold) {
        // Quarter note — delegate to existing handleTap (onClick path handles this,
        // but guard here in case called directly)
        handleTap();
        return;
      }

      // Capture audioContext time for onset timing accuracy evaluation
      const tapTime = audioEngine.getCurrentTime();

      if (!hasUserStartedTapping) {
        const anchored = registerFirstOnset(
          stopContinuousMetronome,
          evaluatePerformance,
          setHasUserStartedTapping
        );
        if (anchored === null) return; // Too far off
      }

      const relativeTime =
        tapTime - (userPerformanceStartTimeRef.current || tapTime);
      // Record onset timing (press-start time, not press-end)
      userTapsRef.current.push({ time: tapTime, relativeTime });

      // Start hold tracking
      pressStartTimeRef.current = performance.now();
      setIsHoldComplete(false);

      // Start sustained piano sound (duration = full note length in seconds)
      const noteDurationSec = onsetInfo.holdDurationMs / 1000;
      audioEngine.createPianoSound(
        audioEngine.getCurrentTime(),
        0.8,
        noteDurationSec
      );

      // Start rAF ring animation — ring fills to 100% at PERFECT threshold
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
          rafIdRef.current = requestAnimationFrame(animate);
        }
      };
      rafIdRef.current = requestAnimationFrame(animate);
    },
    [
      phase,
      audioEngine,
      hasUserStartedTapping,
      getCurrentOnsetInfo,
      handleTap,
      stopContinuousMetronome,
      evaluatePerformance,
      registerFirstOnset,
    ]
  );

  // Handle press end for hold notes (onPointerUp / onPointerCancel path)
  const handlePressEnd = useCallback(() => {
    if (pressStartTimeRef.current === null) return;

    cancelAnimationFrame(rafIdRef.current);
    const holdMs = performance.now() - pressStartTimeRef.current;
    pressStartTimeRef.current = null;
    lastHoldEndTimeRef.current = performance.now();

    const onsetInfo = getCurrentOnsetInfo();
    const quality = scoreHold(holdMs, onsetInfo.holdDurationMs);

    // Set ring complete state for green flash (PERFECT only)
    if (quality === "PERFECT") {
      setIsHoldComplete(true);
      setTimeout(() => setIsHoldComplete(false), 200);
    }

    // Reset ring progress
    if (holdRingCircleRef.current) {
      holdRingCircleRef.current.setAttribute(
        "stroke-dashoffset",
        String(CIRCUMFERENCE)
      );
    }

    // Show per-tap feedback
    const holdFeedbackLabel =
      quality === "GOOD"
        ? t("games.metronomeTrainer.tapArea.accuracy.holdGood")
        : undefined; // PERFECT and MISS use standard labels

    const points = quality === "PERFECT" ? 2 : quality === "GOOD" ? 1 : 0;
    setFeedback({ accuracy: quality, points, holdFeedbackLabel });
    setFloatingQuality(quality);
    setFloatingKey((k) => k + 1);

    // Clear feedback after delay
    setTimeout(() => setFeedback(null), 600);

    // Advance to next onset
    advanceOnset();
  }, [getCurrentOnsetInfo, advanceOnset, t]);

  // Start the rhythm tap flow
  const startFlow = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Guarantee the AudioContext is actually RUNNING before scheduling. While
    // suspended its clock is frozen, so clicks scheduled at currentTime+offset
    // never fire and the visual loop never advances (the count-in bug). If it
    // can't reach "running" (no gesture yet), reset the start guard so the
    // count-in retries once audio unlocks — never silently skip the exercise.
    await audioEngine.initializeAudioContext?.();
    const running = await audioEngine.ensureRunning();
    if (!running) {
      hasStartedRef.current = false;
      if (import.meta.env.DEV) {
        console.info("[rhythm count-in] TAP context not running, retrying", {
          attempt: startRetryCountRef.current,
          shared: audioContextRef.current?.state,
          eng: audioEngine.audioContextRef?.current?.state,
        });
      }
      if (startRetryCountRef.current < MAX_START_RETRIES) {
        startRetryCountRef.current += 1;
        startRetryTimerRef.current = setTimeout(
          () => setStartRetryTick((n) => n + 1),
          START_RETRY_MS
        );
      }
      return;
    }
    startRetryCountRef.current = 0; // running — reset budget for future remounts

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

    // Load pattern — try curated patterns first (guaranteed correct durations),
    // fall back to generative getPattern() if no curated match
    let pattern = null;
    if (config.patternTags?.length > 0) {
      const resolver =
        config.patternTagMode === "any" ? resolveByAnyTag : resolveByTags;
      const tapDurations = config.durations || ["q"];
      const result = resolver(config.patternTags, tapDurations, {
        timeSignature: timeSignature.name,
        allowRests: durationsIncludeRests(tapDurations),
      });
      if (result) {
        pattern = {
          pattern: result.binary,
          source: "curated",
          vexDurations: result.vexDurations,
        };
      }
    }
    if (!pattern) {
      pattern = await getPattern(
        timeSignature.name,
        "BEGINNER",
        config.patterns || ["quarter"]
      );
    }

    if (!pattern?.pattern) {
      onComplete(0, 1);
      return;
    }

    const beatDur = beatDuration.current;
    // Small uniform lead-in. ensureRunning() guarantees a live clock, so the
    // old larger headroom (0.3s) that compensated for frozen-clock risk is
    // unnecessary. The 50ms scheduling cadence + deferred visual loop handle it.
    const countInStartTime = audioEngine.getCurrentTime() + 0.15;

    // Reset state
    userTapsRef.current = [];
    currentOnsetIndexRef.current = 0;
    setHasUserStartedTapping(false);
    setFeedback(null);
    setBeatResults([]);
    setCurrentBeat(1);

    // Start metronome
    startContinuousMetronome(countInStartTime);
    setPhase(PHASES.COUNT_IN);

    // After count-in (one full measure), play the pattern
    const { measureDur } = getMeterTiming(timeSignature, beatDur);
    const patternStartTime = countInStartTime + measureDur;

    setTimeout(
      () => {
        setPhase(PHASES.PATTERN_PLAYBACK);

        // Store pattern info (including vexDurations for hold mechanic)
        patternInfoRef.current = {
          pattern: pattern.pattern,
          vexDurations: pattern.vexDurations || null,
          startTime: patternStartTime,
          beatDuration: beatDur,
        };

        // Play pattern notes with actual note durations from vexDurations
        const vexDurs = pattern.vexDurations || null;
        const onsetDurations = vexDurs
          ? vexDurs.filter((code) => {
              const di = DURATION_INFO[code];
              return di && !di.isRest;
            })
          : null;

        let onsetIdx = 0;
        pattern.pattern.forEach((beat, index) => {
          if (beat === 1) {
            const noteTime = patternStartTime + (index * beatDur) / 4;
            let noteDuration = 0.5; // fallback for non-curated patterns
            if (onsetDurations && onsetIdx < onsetDurations.length) {
              const di = DURATION_INFO[onsetDurations[onsetIdx]];
              if (di) {
                noteDuration = (di.durationUnits / 4) * beatDur;
              }
            }
            // Accent strong beats (1 and 4 in 6/8; the downbeat in simple
            // meters) so the played-back pattern conveys the metric feel.
            const noteVolume = isStrongOnset(index, timeSignature) ? 0.95 : 0.7;
            audioEngine.createPianoSound(noteTime, noteVolume, noteDuration);
            onsetIdx++;
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
            measureDur;
          const timeUntilBeat1 =
            nextBeatTime - audioEngine.getCurrentTime() - 0.2;

          setTimeout(
            () => {
              setPhase(PHASES.USER_PERFORMANCE);
              userPerformanceStartTimeRef.current = nextBeatTime;
              // Initialize onset hold state for first onset
              setCurrentOnsetHold(getCurrentOnsetInfo());
            },
            Math.max(0, timeUntilBeat1 * 1000)
          );
        }, patternDuration);
      },
      (patternStartTime - audioEngine.getCurrentTime()) * 1000
    );
  }, [
    audioEngine,
    timeSignature,
    config.patterns,
    onComplete,
    startContinuousMetronome,
    getCurrentOnsetInfo,
  ]);

  // Auto-start when not disabled. startRetryTick re-arms this after a transient
  // not-running AudioContext so the count-in self-heals (see startFlow).
  useEffect(() => {
    if (!disabled && phase === PHASES.INITIALIZING) {
      startFlow();
    }
  }, [disabled, phase, startFlow, startRetryTick]);

  // Cleanup on unmount ONLY — cancel rAF loop (T-31-05) and stop metronome.
  // Empty deps so this fires exactly once on real unmount; the stop fn is read
  // through a ref to avoid the identity-churn bug described above.
  useEffect(() => {
    return () => {
      stopContinuousMetronomeRef.current();
      cancelAnimationFrame(rafIdRef.current);
      if (startRetryTimerRef.current) clearTimeout(startRetryTimerRef.current);
    };
  }, []);

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
              className={`h-6 w-6 rounded-full shadow-lg ${colorClass}`}
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
      <div className="relative w-full max-w-md md:max-w-2xl lg:max-w-3xl">
        <TapArea
          onTap={handleTap}
          onPressStart={handlePressStart}
          onPressEnd={handlePressEnd}
          isHoldNote={
            phase === PHASES.USER_PERFORMANCE && currentOnsetHold.isHold
          }
          holdRingRef={holdRingCircleRef}
          isHoldComplete={isHoldComplete}
          reducedMotion={reducedMotion}
          holdFeedbackLabel={feedback?.holdFeedbackLabel}
          feedback={feedback}
          isActive={phase === PHASES.USER_PERFORMANCE}
          title={
            phase === PHASES.USER_PERFORMANCE
              ? undefined // Let TapArea derive from isHoldNote
              : phase === PHASES.COUNT_IN || phase === PHASES.PATTERN_PLAYBACK
                ? t("rhythm.listen", "Listen...")
                : t("rhythm.getReady", "Get ready...")
          }
        />
        <FloatingFeedback quality={floatingQuality} feedbackKey={floatingKey} />
      </div>
    </div>
  );
}
