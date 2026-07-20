import { useEffect, useRef, useCallback } from "react";

/**
 * Debounced ResizeObserver hook for VexFlow container re-rendering.
 * Prevents excessive VexFlow redraws during orientation changes.
 *
 * @param {React.RefObject} containerRef - Ref to the observed DOM element
 * @param {Function} onResize - Callback receiving { width: number, height: number }
 * @param {number} [debounceMs=150] - Debounce delay in milliseconds
 */
export function useVexFlowResize(containerRef, onResize, debounceMs = 150) {
  const debounceTimerRef = useRef(null);
  const observerRef = useRef(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });

  const debouncedCallback = useCallback(
    (entries) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      const deliver = () => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        const roundedWidth = Math.round(width);
        const roundedHeight = Math.round(height);

        // Only fire if dimensions actually changed
        if (
          lastSizeRef.current.width === roundedWidth &&
          lastSizeRef.current.height === roundedHeight
        ) {
          return;
        }

        lastSizeRef.current = { width: roundedWidth, height: roundedHeight };
        onResize({ width: roundedWidth, height: roundedHeight });
      };

      // Leading edge for the FIRST measurement only. Browsers fire a ResizeObserver callback
      // immediately on observe(), but routing it through the debounce meant consumers had no
      // real measurement for the first ~150ms — long after their initial render. Consumers
      // that seed state with an estimate would paint at the estimated size and only correct
      // later (or, if they guard their redraw, never). Subsequent callbacks stay debounced,
      // which is what actually matters for orientation-change thrash.
      const isFirstMeasurement =
        lastSizeRef.current.width === 0 && lastSizeRef.current.height === 0;
      if (isFirstMeasurement) {
        deliver();
        return;
      }

      debounceTimerRef.current = setTimeout(deliver, debounceMs);
    },
    [onResize, debounceMs]
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Fallback for browsers without ResizeObserver
    if (typeof ResizeObserver === "undefined") {
      const handleResize = () => {
        onResize({
          width: element.clientWidth,
          height: element.clientHeight,
        });
      };
      // Take an initial measurement: without this the fallback only ever reports on a
      // window resize, so a consumer's estimated starting size was never corrected at all.
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }

    observerRef.current = new ResizeObserver(debouncedCallback);
    observerRef.current.observe(element);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [containerRef, debouncedCallback, onResize]);
}
