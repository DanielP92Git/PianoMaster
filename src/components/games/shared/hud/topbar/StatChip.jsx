import React from "react";

/**
 * StatChip
 *
 * Display-only chip with a small label over a large display value.
 * Used for BPM and score in the game top bar.
 *
 * @param {string} props.label  - Small caption (e.g. "BPM")
 * @param {number|string} props.value - Display value
 * @param {"purple"|"gold"|"neutral"} [props.tone] - Colour treatment
 * @param {string} [props.className] - Extra classes (layout/order only)
 */
const TONES = {
  purple: {
    shell: "border-purple-300/35 bg-purple-600/[0.18]",
    value: "text-white",
  },
  gold: {
    shell: "border-amber-300/40 bg-yellow-500/[0.16]",
    value: "text-amber-300",
  },
  neutral: {
    shell: "border-white/20 bg-white/10",
    value: "text-white",
  },
};

export function StatChip({ label, value, tone = "neutral", className = "" }) {
  const { shell, value: valueClass } = TONES[tone] ?? TONES.neutral;

  return (
    <div
      // min-w keeps the chip from resizing as its value gains digits
      // (score 0 -> 120), which would otherwise nudge its neighbours sideways.
      className={`flex min-w-[52px] flex-col items-center justify-center rounded-2xl border px-3 py-1 lg:min-w-[60px] lg:px-4 lg:py-1.5 ${shell} ${className}`}
    >
      <span className="font-hebrew text-[10px] font-semibold leading-tight text-white/60">
        {label}
      </span>
      <span
        className={`font-fredoka text-base font-bold leading-tight lg:text-[17px] ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}
