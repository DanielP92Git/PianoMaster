import { useEffect, useRef, useCallback } from 'react';

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

  const debouncedCallback = useCallback((entries) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const roundedWidth = Math.round(width);
      const roundedHeight = Math.round(height);

      // Only fire if dimensions actually changed
      if (lastSizeRef.current.width === roundedWidth &&
          lastSizeRef.current.height === roundedHeight) {
        return;
      }

      lastSizeRef.current = { width: roundedWidth, height: roundedHeight };
      onResize({ width: roundedWidth, height: roundedHeight });
    }, debounceMs);
  }, [onResize, debounceMs]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Fallback for browsers without ResizeObserver
    if (typeof ResizeObserver === 'undefined') {
      const handleResize = () => {
        onResize({
          width: element.clientWidth,
          height: element.clientHeight,
        });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
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
