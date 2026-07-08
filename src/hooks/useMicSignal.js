import { useEffect, useRef, useState } from "react";

/**
 * Bridge the ref-based pitch-detection `subscribe` stream (PERF-1) back into
 * React state for the small UI surfaces that actually display it (volume meter,
 * mic-debug panel, pre-game mic test). Updates are throttled so a component that
 * needs the live signal re-renders at ~15Hz instead of the detect loop's 60Hz —
 * and, crucially, only THIS component re-renders, never the whole game tree.
 *
 * @param {(cb: (s: { level: number, note: string|null, frequency: number }) => void) => (() => void)} subscribe
 *   Subscription function from usePitchDetection / useMicNoteInput. May be
 *   undefined/null (returns the default idle signal, subscribes to nothing).
 * @param {Object} [options]
 * @param {number} [options.throttleMs=66] - Minimum ms between state updates (~15Hz).
 * @returns {{ level: number, note: string|null, frequency: number }}
 */
export function useMicSignal(subscribe, { throttleMs = 66 } = {}) {
  const [signal, setSignal] = useState({
    level: 0,
    note: null,
    frequency: -1,
  });
  const lastEmitRef = useRef(0);

  useEffect(() => {
    if (typeof subscribe !== "function") return undefined;

    const now = () =>
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
        ? performance.now()
        : Date.now();

    const unsubscribe = subscribe((s) => {
      const t = now();
      // Always let a "silence" frame (level 0) through so meters clear promptly
      // on stop; otherwise gate to the throttle interval.
      if (s.level > 0 && t - lastEmitRef.current < throttleMs) return;
      lastEmitRef.current = t;
      setSignal({ level: s.level, note: s.note, frequency: s.frequency });
    });

    return unsubscribe;
  }, [subscribe, throttleMs]);

  return signal;
}
