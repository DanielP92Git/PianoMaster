import { useMemo, useCallback, useRef } from "react";
import { TIMING_TOLERANCES, NOTE_LATE_MS } from "../constants/timingConstants";
import { GRADING_MODES, PRACTICE_TIMING } from "../constants/gradingModes";

const TIMING_STATUS_MAP = [
  { threshold: 100, status: "perfect", score: 1.0, label: "Perfect!" },
  { threshold: 200, status: "good", score: 0.8, label: "Good" },
  { threshold: 300, status: "okay", score: 0.5, label: "Okay" },
];

/**
 * Hook that centralizes all timing window calculations and evaluation logic.
 * Pattern generation already stores start/end times in seconds; this hook
 * converts them to ms and exposes helpers to evaluate real-time performance.
 *
 * `mode` (GRADING_MODES.TEST default, or GRADING_MODES.PRACTICE) scales both the base
 * tolerance constants AND the duration-fraction clamps, plus the status thresholds used
 * by evaluateTiming — Test mode output is byte-for-byte unchanged from before mode support.
 */
export function useTimingAnalysis({
  tempo = 80,
  mode = GRADING_MODES.TEST,
} = {}) {
  const beatDurationMs = useMemo(() => {
    const bpm = Number(tempo) || 80;
    const safeBpm = Math.max(bpm, 1);
    return (60 / safeBpm) * 1000;
  }, [tempo]);

  // Tracks the shortest playable note duration (ms) from the last buildTimingWindows call.
  // Consumers can use this for BPM-adaptive debounce.
  const shortestNoteDurationMsRef = useRef(250);

  // Effective tolerances + status map for the current mode. Test mode reproduces the
  // pre-mode-support constants/clamps exactly; Practice widens both per PRACTICE_TIMING.
  const effectiveTolerances = useMemo(() => {
    if (mode === GRADING_MODES.PRACTICE) {
      return {
        late: NOTE_LATE_MS * PRACTICE_TIMING.toleranceMultiplier,
        early: TIMING_TOLERANCES.early * PRACTICE_TIMING.toleranceMultiplier,
        firstNoteEarly:
          TIMING_TOLERANCES.firstNoteEarly *
          PRACTICE_TIMING.toleranceMultiplier,
        lateClampFraction: PRACTICE_TIMING.lateClampFraction,
        earlyClampFraction: PRACTICE_TIMING.earlyClampFraction,
        statusMap: TIMING_STATUS_MAP.map((rule) => ({
          ...rule,
          threshold: rule.threshold * PRACTICE_TIMING.statusMultiplier,
        })),
      };
    }
    return {
      late: NOTE_LATE_MS,
      early: TIMING_TOLERANCES.early,
      firstNoteEarly: TIMING_TOLERANCES.firstNoteEarly,
      lateClampFraction: 0.6,
      earlyClampFraction: 0.5,
      statusMap: TIMING_STATUS_MAP,
    };
  }, [mode]);

  const buildTimingWindows = useCallback(
    (pattern) => {
      if (!pattern?.notes) return [];

      let minDurationMs = Infinity;
      const {
        late: effectiveLate,
        early: effectiveEarly,
        firstNoteEarly: effectiveFirstNoteEarly,
        lateClampFraction,
        earlyClampFraction,
      } = effectiveTolerances;

      const windows = pattern.notes.map((event, index) => {
        const hasStart = typeof event.startTime === "number";
        const hasEnd = typeof event.endTime === "number";
        const durationSeconds =
          typeof event.duration === "number" ? event.duration : null;

        const startMs = hasStart
          ? event.startTime * 1000
          : index * beatDurationMs;
        const durationMs = durationSeconds
          ? durationSeconds * 1000
          : hasEnd
            ? Math.max(event.endTime * 1000 - startMs, beatDurationMs)
            : beatDurationMs;
        const endMs = hasEnd ? event.endTime * 1000 : startMs + durationMs;

        const isFirstPlayable =
          index === 0 && event.type !== "rest" && event.pitch;

        // BPM-adaptive tolerances: cap late/early to a fraction of note duration
        // to prevent massive window overlap at high BPM (e.g., 120 BPM 8th notes = 250ms)
        const scaledLate = Math.min(
          effectiveLate,
          durationMs * lateClampFraction
        );
        const earlyAllowance = isFirstPlayable
          ? effectiveFirstNoteEarly
          : Math.min(effectiveEarly, durationMs * earlyClampFraction);

        // Track shortest playable note for debounce scaling
        if (
          event.type !== "rest" &&
          event.pitch &&
          durationMs < minDurationMs
        ) {
          minDurationMs = durationMs;
        }

        return {
          noteIndex: index,
          event,
          startMs,
          endMs,
          durationMs,
          windowStart: startMs - earlyAllowance,
          windowEnd: endMs + scaledLate,
        };
      });

      shortestNoteDurationMsRef.current =
        minDurationMs === Infinity ? beatDurationMs : minDurationMs;

      return windows;
    },
    [beatDurationMs, effectiveTolerances]
  );

  const evaluateTiming = useCallback(
    (timeDiffMs) => {
      const absDiff = Math.abs(timeDiffMs);

      for (const rule of effectiveTolerances.statusMap) {
        if (absDiff <= rule.threshold) {
          return {
            status: rule.status,
            score: rule.score,
            label: rule.label,
          };
        }
      }

      return {
        status: timeDiffMs < 0 ? "early" : "late",
        score: 0.3,
        label: timeDiffMs < 0 ? "Early" : "Late",
      };
    },
    [effectiveTolerances]
  );

  return {
    beatDurationMs,
    buildTimingWindows,
    evaluateTiming,
    shortestNoteDurationMsRef,
  };
}
