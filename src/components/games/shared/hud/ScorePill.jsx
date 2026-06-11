import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMotionTokens } from "../../../../utils/useMotionTokens";

// Tint mapping for comboTint prop (0|1|2):
const TINT = [
  { border: "border-white/20", bg: "bg-white/10", text: "" },
  {
    border: "border-amber-400/30",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
  },
  {
    border: "border-yellow-400/40",
    bg: "bg-yellow-500/20",
    text: "text-yellow-300",
  },
];

/**
 * ScorePill
 *
 * Configurable score display pill. Combo-tints the glass border/bg
 * when the engagement layer is active. Supports a floating +score animation.
 *
 * @param {number}  props.value      - Current score value to display
 * @param {string}  [props.label]    - Label string, e.g. "XP", "Score", "Correct"
 * @param {0|1|2}   [props.comboTint] - 0=default glass, 1=amber tint, 2=yellow tint
 * @param {number|null} [props.floatingScore] - Value to show in +N float animation
 * @param {number}  [props.floatingScoreKey]  - Key to force remount on new float
 * @param {React.Ref} [ref]          - Forwarded ref for TierUpPopup fly-to targeting
 */
export const ScorePill = React.forwardRef(function ScorePill(
  {
    value,
    label = "XP",
    comboTint = 0,
    floatingScore = null,
    floatingScoreKey = 0,
  },
  ref
) {
  const { reduce } = useMotionTokens();
  const { border, bg } = TINT[comboTint] ?? TINT[0];

  return (
    <div ref={ref} className="relative">
      <div
        className={`flex items-center gap-2 rounded-full border ${border} ${bg} px-3 py-1.5 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md transition-colors duration-300 motion-reduce:transition-none`}
      >
        <span className="text-xs font-semibold text-white/80 sm:text-sm">
          {label}
        </span>
        <span className="font-mono text-sm font-bold tracking-wide sm:text-base">
          {value}
        </span>
      </div>
      <AnimatePresence>
        {floatingScore !== null && (
          <motion.span
            key={floatingScoreKey}
            initial={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            animate={reduce ? { opacity: 0 } : { opacity: 0, y: -28 }}
            transition={{ duration: 0.55 }}
            className={`pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 font-mono font-bold drop-shadow-md ${
              comboTint >= 2
                ? "text-base text-yellow-300 sm:text-lg"
                : comboTint >= 1
                  ? "text-sm text-amber-300 sm:text-base"
                  : "text-sm text-white sm:text-base"
            }`}
          >
            +{floatingScore}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
});
