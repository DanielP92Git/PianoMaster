import { useMemo, useCallback } from "react";
import { TIMING_TOLERANCES, NOTE_LATE_MS } from "../constants/timingConstants";

const TIMING_STATUS_MAP = [
  { threshold: 100, status: "perfect", score: 1.0, label: "Perfect!" },
  { threshold: 200, status: "good", score: 0.8, label: "Good" },
  { threshold: 300, status: "okay", score: 0.5, label: "Okay" },
];

/**
 * Hook that centralizes all timing window calculations and evaluation logic.
 * Pattern generation already stores start/end times in seconds; this hook
 * converts them to ms and exposes helpers to evaluate real-time performance.
 */
export function useTimingAnalysis({ tempo = 80 } = {}) {
  const beatDurationMs = useMemo(() => {
    const bpm = Number(tempo) || 80;
    const safeBpm = Math.max(bpm, 1);
    return (60 / safeBpm) * 1000;
  }, [tempo]);

  const buildTimingWindows = useCallback(
    (pattern) => {
      if (!pattern?.notes) return [];

      return pattern.notes.map((event, index) => {
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
        const earlyAllowance = isFirstPlayable
          ? TIMING_TOLERANCES.firstNoteEarly
          : TIMING_TOLERANCES.early;

        return {
          noteIndex: index,
          event,
          startMs,
          endMs,
          durationMs,
          windowStart: startMs - earlyAllowance,
          windowEnd: endMs + NOTE_LATE_MS,
        };
      });
    },
    [beatDurationMs]
  );

  const evaluateTiming = useCallback((timeDiffMs) => {
    const absDiff = Math.abs(timeDiffMs);

    for (const rule of TIMING_STATUS_MAP) {
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
  }, []);

  return {
    beatDurationMs,
    buildTimingWindows,
    evaluateTiming,
  };
}
