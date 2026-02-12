/**
 * useVisibleNodes Hook
 *
 * Uses Intersection Observer to track whether an element is visible in the viewport.
 * Optimizes performance by conditionally applying expensive CSS effects (e.g., glow filters)
 * only when elements are actually visible.
 */

import { useEffect, useState } from 'react';

/**
 * Track visibility of a single element
 * @param {React.RefObject} elementRef - Ref to the element to observe
 * @returns {boolean} isVisible - Whether element is currently visible in viewport
 */
export const useVisibleNodes = (elementRef) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create observer with generous root margin to start detecting before fully visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: '50px', // Start detecting 50px before element enters viewport
        threshold: 0.1 // Trigger when 10% of element is visible
      }
    );

    observer.observe(element);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [elementRef]);

  return isVisible;
};
