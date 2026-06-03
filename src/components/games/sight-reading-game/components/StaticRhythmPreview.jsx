/**
 * StaticRhythmPreview Component
 *
 * Renders a rhythm-value preview tile from static SVG note/rest symbols
 * (src/assets/musicSymbols/) instead of VexFlow. Each symbol's notehead,
 * stem, and beam live inside a single SVG that scales as a unit, so stems
 * can never visually detach from their noteheads (the failure mode of the
 * VexFlow-based RhythmPatternPreview, whose <text> glyph noteheads drift
 * away from their <path> stems).
 *
 * Drop-in for RhythmPatternPreview at the simple note/rest call sites:
 * accepts the same events/width/height/noteColor/ariaLabel props, plus an
 * optional patternId (preferred, unambiguous) used to pick the glyph(s).
 *
 * Color is applied purely via CSS `currentColor` — every musicSymbols asset
 * uses fill/stroke="currentColor", so setting `color` on the wrapper tints
 * the whole glyph.
 *
 * @param {Object} props
 * @param {Array} props.events - [{ type: 'note'|'rest', duration: 'q'|'8'|'16'|'h'|'w' }]
 * @param {string} props.patternId - Stable rhythm pattern id (e.g. 'pairedEighths')
 * @param {number} props.width - Width in pixels (default: 80)
 * @param {number} props.height - Height in pixels (default: 50)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaLabel - Accessibility label
 * @param {string} props.noteColor - CSS color for the glyph (default: "#ffffff")
 */
import QuarterNoteIcon from "../../../../assets/musicSymbols/quarter-note.svg?react";
import HalfNoteIcon from "../../../../assets/musicSymbols/half-note.svg?react";
import WholeNoteIcon from "../../../../assets/musicSymbols/whole-note-head.svg?react";
import BeamedEighthsIcon from "../../../../assets/musicSymbols/beamed-eighths.svg?react";
import BeamedSixteenthsIcon from "../../../../assets/musicSymbols/beamed-sixteenths.svg?react";
import QuarterRestIcon from "../../../../assets/musicSymbols/quarter-rest.svg?react";
import HalfRestIcon from "../../../../assets/musicSymbols/half-rest.svg?react";
import WholeRestIcon from "../../../../assets/musicSymbols/whole-rest.svg?react";
import EighthRestIcon from "../../../../assets/musicSymbols/eight-rest.svg?react";
import SixteenthRestIcon from "../../../../assets/musicSymbols/sixteenth-rest.svg?react";

// Stable-id → { Component, count, scale? } map (preferred path).
//
// `scale` (0–1, default 1) shrinks a glyph relative to the tile height. The
// stemmed note assets (quarter/half/eighths) are ~657px tall in their viewBox
// but their notehead is only the bottom ~26% — the rest is stem. The whole
// note asset is JUST a notehead (~150px tall viewBox), so at height:100% it
// fills the whole tile and dwarfs the other noteheads. Scale it down so its
// head matches the visual size of the other noteheads.
const GLYPH_BY_PATTERN_ID = {
  whole: { Component: WholeNoteIcon, count: 1, scale: 0.34 },
  half: { Component: HalfNoteIcon, count: 1 },
  quarter: { Component: QuarterNoteIcon, count: 1 },
  pairedEighths: { Component: BeamedEighthsIcon, count: 1 },
  fourSixteenths: { Component: BeamedSixteenthsIcon, count: 1 },
  wholeRest: { Component: WholeRestIcon, count: 1 },
  halfRest: { Component: HalfRestIcon, count: 1 },
  quarterRest: { Component: QuarterRestIcon, count: 1 },
  pairedEighthRests: { Component: EighthRestIcon, count: 2 },
  fourSixteenthRests: { Component: SixteenthRestIcon, count: 4 },
};

// Single-symbol fallbacks keyed by duration code.
const NOTE_BY_DURATION = {
  w: WholeNoteIcon,
  h: HalfNoteIcon,
  q: QuarterNoteIcon,
};
const REST_BY_DURATION = {
  w: WholeRestIcon,
  h: HalfRestIcon,
  q: QuarterRestIcon,
  8: EighthRestIcon,
  16: SixteenthRestIcon,
};

/**
 * Resolve { Component, count } from the events array when no patternId is
 * supplied. Mirrors the simple SIMPLE_NOTE_PATTERNS / SIMPLE_REST_PATTERNS
 * shapes (single notes, beamed eighths/sixteenths, single or repeated rests).
 */
function resolveFromEvents(events) {
  if (!Array.isArray(events) || events.length === 0) return null;

  const allRests = events.every((e) => e?.type === "rest");
  const allNotes = events.every((e) => e?.type === "note");

  if (allNotes) {
    if (events.length === 1) {
      const Component = NOTE_BY_DURATION[events[0].duration];
      return Component ? { Component, count: 1 } : null;
    }
    if (events.every((e) => e.duration === "8")) {
      return { Component: BeamedEighthsIcon, count: 1 };
    }
    if (events.every((e) => e.duration === "16")) {
      return { Component: BeamedSixteenthsIcon, count: 1 };
    }
  }

  if (allRests) {
    const Component = REST_BY_DURATION[events[0].duration];
    return Component ? { Component, count: events.length } : null;
  }

  return null;
}

export function StaticRhythmPreview({
  events = [],
  patternId,
  width = 80,
  height = 50,
  className = "",
  ariaLabel = "Rhythm pattern",
  noteColor = "#ffffff",
}) {
  const resolved =
    (patternId && GLYPH_BY_PATTERN_ID[patternId]) || resolveFromEvents(events);

  if (!resolved) {
    // Nothing to render — keep the tile sized so layout stays stable.
    return (
      <div
        className={className}
        style={{ width: `${width}px`, height: `${height}px` }}
        role="img"
        aria-label={ariaLabel}
      />
    );
  }

  const { Component, count, scale = 1 } = resolved;
  const glyphHeight = `${Math.round(scale * 100)}%`;

  return (
    <div
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        color: noteColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: count > 1 ? "10%" : 0,
        padding: "4px",
        boxSizing: "border-box",
        overflow: "visible",
      }}
      role="img"
      aria-label={ariaLabel}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Component
          key={i}
          aria-hidden="true"
          style={{ height: glyphHeight, width: "auto", display: "block" }}
        />
      ))}
    </div>
  );
}

export default StaticRhythmPreview;
