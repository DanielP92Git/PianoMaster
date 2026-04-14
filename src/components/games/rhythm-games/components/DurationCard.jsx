/**
 * DurationCard.jsx
 *
 * Shared sub-component for Visual Recognition and Syllable Matching games.
 * Renders either an SVG note icon or text (Kodaly syllable) inside a
 * glass-styled card with tap interaction and 4 visual states.
 *
 * Props:
 * - type: "icon" | "text" — render mode
 * - durationCode: string — VexFlow duration code for icon mode
 * - text: string — displayed text for type="text"
 * - state: "default" | "correct" | "wrong" | "dimmed"
 * - onSelect: (cardIndex: number) => void
 * - disabled: boolean — prevents interaction during feedback
 * - cardIndex: number — passed to onSelect
 * - ariaLabel: string — accessible label
 */

import React from "react";
import { useMotionTokens } from "../../../../utils/useMotionTokens";

// SVG imports from musicSymbols — ?react suffix required per CLAUDE.md build conventions
import QuarterNoteIcon from "../../../../assets/musicSymbols/quarter-note.svg?react";
import HalfNoteIcon from "../../../../assets/musicSymbols/half-note.svg?react";
import WholeNoteIcon from "../../../../assets/musicSymbols/whole-note-head.svg?react";
import EighthNoteIcon from "../../../../assets/musicSymbols/eighth-note.svg?react";
import SixteenthNoteIcon from "../../../../assets/musicSymbols/sixteenth-note.svg?react";
import DottedQuarterIcon from "../../../../assets/musicSymbols/dotted-quarter-note.svg?react";
import DottedHalfIcon from "../../../../assets/musicSymbols/dotted-half-note.svg?react";
import QuarterRestIcon from "../../../../assets/musicSymbols/quarter-rest.svg?react";
import HalfRestIcon from "../../../../assets/musicSymbols/half-rest.svg?react";
import WholeRestIcon from "../../../../assets/musicSymbols/whole-rest.svg?react";
import BeamedEighthsIcon from "../../../../assets/musicSymbols/beamed-eighths.svg?react";

/**
 * Map duration codes to their SVG React components.
 * Exported for SyllableMatchingGame prompt rendering.
 */
export const SVG_COMPONENTS = {
  q: QuarterNoteIcon,
  h: HalfNoteIcon,
  w: WholeNoteIcon,
  8: EighthNoteIcon,
  16: SixteenthNoteIcon,
  qd: DottedQuarterIcon,
  hd: DottedHalfIcon,
  qr: QuarterRestIcon,
  hr: HalfRestIcon,
  wr: WholeRestIcon,
  "8_pair": BeamedEighthsIcon,
};

/**
 * Visual state classes — copied verbatim from DictationChoiceCard.jsx
 * to ensure consistent glass styling across rhythm game cards.
 */
const STATE_CLASSES = {
  default:
    "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/40 cursor-pointer transition-colors duration-150",
  correct:
    "bg-green-500/20 backdrop-blur-md border-2 border-green-400 rounded-xl shadow-[0_0_12px_rgba(74,222,128,0.4)] transition-all duration-300",
  wrong:
    "bg-red-500/20 backdrop-blur-md border-2 border-red-400 rounded-xl transition-all duration-300",
  dimmed:
    "opacity-40 pointer-events-none bg-white/10 border border-white/20 rounded-xl",
};

export function DurationCard({
  type = "icon",
  durationCode,
  text,
  state = "default",
  onSelect,
  disabled = false,
  cardIndex,
  ariaLabel,
}) {
  const { reduce: reducedMotion } = useMotionTokens();

  const handleClick = () => {
    if (!disabled && state !== "dimmed" && onSelect) {
      onSelect(cardIndex);
    }
  };

  const handleKeyDown = (e) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      !disabled &&
      state !== "dimmed"
    ) {
      e.preventDefault();
      onSelect?.(cardIndex);
    }
  };

  const stateClass = STATE_CLASSES[state] ?? STATE_CLASSES.default;

  // Motion-aware classes: skip scale transform when reduced-motion is active
  const motionClasses = reducedMotion
    ? "transition-none"
    : "active:scale-[0.95]";

  // Render content based on type
  const renderContent = () => {
    if (type === "icon") {
      const SvgComponent = SVG_COMPONENTS[durationCode];
      if (!SvgComponent) return null;

      return (
        <div dir="ltr" className="flex items-center justify-center text-white">
          <SvgComponent className="h-24 w-16" aria-hidden="true" />
        </div>
      );
    }

    // type === "text"
    return (
      <span className="select-none text-3xl font-bold text-white">{text}</span>
    );
  };

  return (
    <div
      role="button"
      tabIndex={disabled || state === "dimmed" ? -1 : 0}
      aria-label={ariaLabel}
      aria-pressed={state === "correct" || state === "wrong"}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`flex min-h-[80px] min-w-[80px] items-center justify-center p-4 ${stateClass} ${motionClasses}`}
    >
      {renderContent()}
    </div>
  );
}

export default DurationCard;
