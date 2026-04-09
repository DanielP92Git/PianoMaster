/**
 * durationInfo.js
 *
 * DURATION_INFO lookup table mapping VexFlow duration codes to metadata
 * used by Visual Recognition and Syllable Matching games.
 *
 * CRITICAL: This file must be pure JS with NO imports from vexflow, SVG, or React.
 * It is consumed by Node.js scripts (validateTrail.mjs) and must stay Node-safe.
 */

/**
 * Maps VexFlow duration codes to display metadata.
 * Each entry contains:
 * - svgFilename: base name of the SVG sprite file (without .svg extension)
 * - i18nKey: translation key for the duration name
 * - durationUnits: rhythmic value in sixteenth-note units
 * - isRest: whether this duration is a rest
 */
export const DURATION_INFO = {
  q: {
    svgFilename: "quarter-note",
    i18nKey: "rhythm.duration.quarter",
    durationUnits: 4,
    isRest: false,
  },
  h: {
    svgFilename: "half-note",
    i18nKey: "rhythm.duration.half",
    durationUnits: 8,
    isRest: false,
  },
  w: {
    svgFilename: "whole-note-head",
    i18nKey: "rhythm.duration.whole",
    durationUnits: 16,
    isRest: false,
  },
  8: {
    svgFilename: "eighth-note",
    i18nKey: "rhythm.duration.eighth",
    durationUnits: 2,
    isRest: false,
  },
  16: {
    svgFilename: "sixteenth-note",
    i18nKey: "rhythm.duration.sixteenth",
    durationUnits: 1,
    isRest: false,
  },
  qd: {
    svgFilename: "dotted-quarter-note",
    i18nKey: "rhythm.duration.dottedQuarter",
    durationUnits: 6,
    isRest: false,
  },
  hd: {
    svgFilename: "dotted-half-note",
    i18nKey: "rhythm.duration.dottedHalf",
    durationUnits: 12,
    isRest: false,
  },
  qr: {
    svgFilename: "quarter-rest",
    i18nKey: "rhythm.duration.quarterRest",
    durationUnits: 4,
    isRest: true,
  },
  hr: {
    svgFilename: "half-rest",
    i18nKey: "rhythm.duration.halfRest",
    durationUnits: 8,
    isRest: true,
  },
  wr: {
    svgFilename: "whole-rest",
    i18nKey: "rhythm.duration.wholeRest",
    durationUnits: 16,
    isRest: true,
  },
};

/**
 * All duration codes available for distractor pools.
 */
export const ALL_DURATION_CODES = Object.keys(DURATION_INFO);

/**
 * Inline syllable map (do NOT import from rhythmVexflowHelpers — it imports VexFlow
 * which is browser-only). Maps durationUnits to Kodaly syllable text.
 */
const SYLLABLE_BY_UNITS = {
  16: "ta-a-a-a",
  12: "ta-a-a",
  8: "ta-a",
  6: "ta-a",
  4: "ta",
  2: "ti",
  1: "ti-ka",
};

/**
 * Get the Kodaly syllable for a duration code.
 * Rests always return "sh".
 */
function getSyllable(code) {
  const info = DURATION_INFO[code];
  if (!info) return "";
  if (info.isRest) return "sh";
  return SYLLABLE_BY_UNITS[info.durationUnits] || "";
}

/**
 * Fisher-Yates shuffle (in-place).
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate quiz questions for duration games.
 *
 * @param {string[]} durationPool - Duration codes from the node config (e.g., ["q", "h"])
 * @param {string[]} distractorPool - All possible codes for distractors (default: ALL_DURATION_CODES)
 * @param {number} questionCount - Number of questions to generate (default: 5)
 * @param {object} options - Additional options
 * @param {boolean} options.dedupSyllables - Filter distractors with duplicate syllables
 * @returns {Array<{correct: string, choices: string[]}>}
 */
export function generateQuestions(
  durationPool,
  distractorPool = ALL_DURATION_CODES,
  questionCount = 5,
  options = {}
) {
  const { dedupSyllables = false } = options;
  const questions = [];

  for (let i = 0; i < questionCount; i++) {
    const correct = durationPool[i % durationPool.length];
    const correctSyllable = getSyllable(correct);

    // Build candidate distractors (exclude correct answer)
    let candidates = distractorPool.filter((c) => c !== correct);

    // Apply syllable dedup if requested
    if (dedupSyllables) {
      const filtered = candidates.filter(
        (c) => getSyllable(c) !== correctSyllable
      );
      // Only use filtered list if we have enough distractors (3)
      if (filtered.length >= 3) {
        candidates = filtered;
      }
    }

    // Pick 3 distractors
    const shuffledCandidates = shuffle([...candidates]);
    const distractors = shuffledCandidates.slice(0, 3);

    // Build choices array: correct + 3 distractors, then shuffle
    const choices = shuffle([correct, ...distractors]);

    questions.push({ correct, choices });
  }

  return questions;
}
