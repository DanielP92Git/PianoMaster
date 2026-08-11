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

  /**
   * Measure the observed element RIGHT NOW, synchronously.
   *
   * Consumers that draw in a layout effect need the box as it is in the DOM this instant,
   * not the one the debounced observer reported up to 150ms ago — drawing from the stale
   * value paints the previous layout's geometry for a frame or more.
   *
   * This deliberately lives in the hook rather than the component so that:
   *  - there is one measurement implementation, and
   *  - it can write `lastSizeRef`, keeping the observer's dedupe coherent. Without that the
   *    observer would re-deliver the same size ~150ms later as if it were new.
   *
   * It must return the CONTENT box, because that is what `entry.contentRect` gives above.
   * Mixing in a border box (what getBoundingClientRect returns) agrees only while the
   * element has no padding or border, and would otherwise alternate forever.
   */
  const measureNow = useCallback(() => {
    const element = containerRef.current;
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    const horizontal =
      parseFloat(styles.paddingLeft) +
      parseFloat(styles.paddingRight) +
      parseFloat(styles.borderLeftWidth) +
      parseFloat(styles.borderRightWidth);
    const vertical =
      parseFloat(styles.paddingTop) +
      parseFloat(styles.paddingBottom) +
      parseFloat(styles.borderTopWidth) +
      parseFloat(styles.borderBottomWidth);

    const width = Math.round(Math.max(rect.width - horizontal, 0));
    const height = Math.round(Math.max(rect.height - vertical, 0));

    lastSizeRef.current = { width, height };
    return { width, height };
  }, [containerRef]);

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

  return { measureNow };
}
