import { useEffect, useState } from "react";

/**
 * Responsive helper for branching UI/flows on mobile.
 * Default breakpoint matches Tailwind's `md` (768px).
 */
export function useIsMobile(breakpointPx = 768) {
  // Treat "mobile" as either narrow OR short viewports (landscape phones),
  // and also include coarse pointer devices as a hint.
  const query = `(max-width: ${breakpointPx - 1}px), (max-height: 500px), (pointer: coarse)`;

  const getMatch = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function")
      return false;
    return window.matchMedia(query).matches;
  };

  const [isMobile, setIsMobile] = useState(getMatch);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function")
      return;

    const mq = window.matchMedia(query);
    const onChange = () => setIsMobile(mq.matches);

    // Initialize and subscribe
    onChange();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    // Safari fallback
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [breakpointPx, query]);

  return isMobile;
}


