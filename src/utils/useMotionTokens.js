import { useReducedMotion } from "framer-motion";

export function useMotionTokens() {
  const reduce = useReducedMotion();

  return {
    reduce,
    snappy: reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 34 },
    soft: reduce ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 28 },
    fade: reduce ? { duration: 0 } : { duration: 0.18, ease: "easeOut" },
  };
}


