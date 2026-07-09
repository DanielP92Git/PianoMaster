/**
 * Shared feedback palette for the Sight Reading game (Phase C — feedback wiring).
 *
 * Single source of truth for the colors and per-status metadata used by:
 *  - the VexFlow staff renderer (SVG needs raw hex) — `FEEDBACK_COLORS`
 *  - the live per-note timing banner and post-exercise summary (Tailwind classes
 *    + i18n label keys) — `TIMING_FEEDBACK`
 *
 * Palette is colorblind-safe (Okabe-Ito inspired): correct=green, early=amber,
 * late=blue, wrong=red, missed/expected=gray. Early (rush) and late (drag) get
 * two distinct hues so an 8-year-old can tell "too fast" from "too slow" — the
 * core sight-reading skill.
 */

export const FEEDBACK_COLORS = {
  correct: "#10B981", // green — right note, in time
  early: "#F59E0B", // amber — rushed / too early
  late: "#3B82F6", // blue — dragged / too late
  wrongPitch: "#EF4444", // red — the wrong note that was actually played
  expected: "#9CA3AF", // gray — the note you were supposed to play (wrong-pitch case)
  missed: "#9CA3AF", // gray — note you didn't play at all
};

/**
 * Per timing-status metadata for the live banner + summary breakdown.
 * `icon` + `labelKey` render as "🎯 Perfect!"; `color`/`bg` are Tailwind classes.
 */
export const TIMING_FEEDBACK = {
  perfect: {
    icon: "🎯",
    labelKey: "sightReading.timing.perfect",
    color: "text-green-300",
    bg: "bg-green-500/20",
  },
  good: {
    icon: "✓",
    labelKey: "sightReading.timing.good",
    color: "text-green-300",
    bg: "bg-green-500/15",
  },
  okay: {
    icon: "~",
    labelKey: "sightReading.timing.okay",
    color: "text-emerald-200",
    bg: "bg-emerald-500/15",
  },
  early: {
    icon: "⏩",
    labelKey: "sightReading.timing.early",
    color: "text-amber-300",
    bg: "bg-amber-500/20",
  },
  late: {
    icon: "⏪",
    labelKey: "sightReading.timing.late",
    color: "text-sky-300",
    bg: "bg-sky-500/20",
  },
  wrong_pitch: {
    icon: "✗",
    labelKey: "sightReading.timing.wrongNote",
    color: "text-red-300",
    bg: "bg-red-500/20",
  },
};
