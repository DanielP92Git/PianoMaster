/**
 * needsLandscape.js
 *
 * Pure helper computing whether a rhythm pattern's beat count exceeds the
 * portrait-rendering threshold for the iPhone SE class of devices.
 *
 * Used by rhythm renderers to declare landscape-need via NeedsLandscapeContext
 * (Phase 34 — content-driven rotate prompt). See RESEARCH.md § Pattern 2 and
 * § needsLandscape Threshold Analysis for derivation.
 *
 * CRITICAL: pure JS, no React or DOM dependencies — Node.js safe.
 */

const TOTAL_BEATS_THRESHOLD = 9; // see RESEARCH.md § needsLandscape Threshold Analysis

function parseTimeSignature(timeSig) {
  const parts = (timeSig || "4/4").split("/");
  if (parts.length !== 2) return { num: 4, den: 4 };
  return { num: parseInt(parts[0], 10), den: parseInt(parts[1], 10) };
}

function getBeatsPerMeasure(timeSig) {
  const { num } = parseTimeSignature(timeSig);
  return Number.isFinite(num) && num > 0 ? num : 4;
}

/**
 * @param {Array<{durationUnits: number, isRest: boolean}> | undefined} beats
 * @param {string | undefined} timeSignature  e.g. '4/4', '3/4'
 * @param {number | undefined} measures  optional override — if provided, takes precedence
 * @returns {boolean}
 */
export function needsLandscape(
  beats,
  timeSignature = "4/4",
  measures = undefined
) {
  // measures-only path (RhythmStaffDisplay accepts a `measures` prop)
  if (typeof measures === "number" && measures > 0) {
    const totalBeats = measures * getBeatsPerMeasure(timeSignature);
    return totalBeats > TOTAL_BEATS_THRESHOLD;
  }

  // beats-array path
  if (!Array.isArray(beats) || beats.length === 0) return false;

  // Sum durationUnits in sixteenth-note units, convert to beats.
  // 1 quarter = 4 sixteenth units = 1 beat.
  const sixteenthUnits = beats.reduce(
    (sum, b) => sum + (b?.durationUnits || 0),
    0
  );
  const totalBeats = sixteenthUnits / 4;
  return totalBeats > TOTAL_BEATS_THRESHOLD;
}
