import React from "react";

/**
 * GameActionButton
 *
 * Single source of truth for the post-exercise / mid-game feedback action
 * buttons used across game screens (e.g. SightReading's FeedbackSummary,
 * MetronomeTrainer's "Listen & Tap" feedback phase). Renders a solid gradient
 * pill — the style the owner standardised on — so every game's feedback/nav
 * buttons look identical.
 *
 * Tones:
 * - `retry`   green → emerald  (try again / replay the same exercise)
 * - `advance` indigo → violet  (next pattern / next exercise — the primary CTA)
 * - `neutral` slate            (end session / secondary exit)
 *
 * Layout (width / flex) is left to the caller via `className` so the same pill
 * works in a full-width split row (`flex-1`) or a centred row.
 */
const TONES = {
  retry:
    "bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 focus:ring-green-400/50",
  advance:
    "bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 focus:ring-indigo-400/50",
  neutral:
    "bg-gradient-to-br from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500 focus:ring-slate-400/50",
};

export function GameActionButton({
  tone = "advance",
  onClick,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-3 py-2 text-sm font-bold text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 ${
        TONES[tone] ?? TONES.advance
      } ${disabled ? "cursor-not-allowed opacity-60" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default GameActionButton;
