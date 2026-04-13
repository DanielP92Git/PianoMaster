import { useRef, useEffect } from "react";

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~276.46

/**
 * HoldRing — SVG ring progress indicator for hold/sustain notes.
 *
 * Driven by ref-based DOM mutation (NOT React state) at 60fps to avoid
 * re-rendering the React tree on every animation frame (per Research Pitfall 4).
 *
 * Usage patterns:
 * 1. Declarative (progress prop): parent passes 0-1 progress value, useEffect updates DOM
 * 2. Imperative (ringRef prop): parent drives strokeDashoffset directly via rAF loop
 *
 * @param {object} props
 * @param {number} [props.progress=0] - Progress from 0 to 1 (used when ringRef not provided)
 * @param {boolean} [props.isComplete=false] - Switches stroke color to green-400 (#4ade80)
 * @param {boolean} [props.reducedMotion=false] - Returns null; parent handles opacity flash fallback
 * @param {React.RefObject} [props.ringRef] - External ref for rAF-driven updates
 */
export function HoldRing({
  progress = 0,
  isComplete = false,
  reducedMotion = false,
  ringRef,
}) {
  // If an external ringRef is provided, the parent drives strokeDashoffset via rAF.
  // Otherwise, use progress prop for declarative updates.
  const internalRef = useRef(null);
  const circleRef = ringRef || internalRef;

  useEffect(() => {
    // Only update from progress prop if no external ringRef is controlling it
    if (circleRef.current && !ringRef) {
      const offset = CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)));
      circleRef.current.setAttribute("stroke-dashoffset", String(offset));
    }
  }, [progress, ringRef, circleRef]);

  if (reducedMotion) {
    // Reduced-motion: no ring animation. Parent handles bg opacity flash instead.
    return null;
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0"
      style={{ transform: "rotate(-90deg)" }}
      aria-hidden="true"
    >
      {/* Track ring */}
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.20)"
        strokeWidth="4"
      />
      {/* Progress ring */}
      <circle
        ref={circleRef}
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        stroke={isComplete ? "#4ade80" : "#818cf8"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE}
        style={{ transition: isComplete ? "stroke 0.15s ease" : "none" }}
      />
    </svg>
  );
}

export { CIRCUMFERENCE };

export default HoldRing;
