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
  // syllable override: "ti-ti" (EN) / "טָה-טֶה" (HE — user-confirmed Nikud
  // 2026-06-19; memory.md requires explicit approval for Hebrew syllables).
  "8_pair": {
    svgFilename: "beamed-eighths",
    i18nKey: "rhythm.duration.beamedEighths",
    durationUnits: 4,
    isRest: false,
    syllable: "ti-ti",
    syllableHe: "טָה-טֶה",
  },
};

/**
 * All duration codes available for distractor pools.
 */
export const ALL_DURATION_CODES = Object.keys(DURATION_INFO);

/**
 * Inline syllable maps (do NOT import from rhythmVexflowHelpers — it imports
 * VexFlow which is browser-only, and this file must stay Node-safe for
 * scripts/validateTrail.mjs). Hebrew strings are re-declared here from
 * SYLLABLE_MAP_HE / REST_SYLLABLE_HE in rhythmVexflowHelpers.js — do NOT alter
 * Nikud diacritics without user approval (memory.md).
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

const SYLLABLE_BY_UNITS_HE = {
  16: "טָה-אָה-אָה-אָה",
  12: "טָה-אָה-אָה",
  8: "טָה-אָה",
  6: "טָה-אָה",
  4: "טָה",
  2: "טִי",
  1: "טִי-כָּה",
};

const REST_EN = "sh";
const REST_HE = "הָס"; // הָס — default / quarter-rest fallback

// Duration-aware Hebrew rest syllables (parallel to the note syllables: half =
// 2-part, whole = 4-part). User-confirmed Nikud 2026-06-19. Mirrors
// REST_SYLLABLE_MAP_HE in rhythmVexflowHelpers.js — do NOT alter Nikud without
// user approval (memory.md).
const REST_BY_UNITS_HE = {
  16: "הָא-אָ-אָ-אָס", // whole rest
  8: "הָא-אָס", // half rest
  4: "הָס", // quarter rest
};

/**
 * Get the Kodaly syllable for a duration code.
 *
 * @param {string} code - Duration code (e.g., "q", "8_pair")
 * @param {"en"|"he"} [language="en"] - Display language
 * @returns {string} Kodaly syllable text
 *
 * Resolution order:
 * 1. Rests → REST_EN (flat) / duration-aware Hebrew (REST_BY_UNITS_HE,
 *    falling back to REST_HE for durations without a specific entry).
 * 2. Per-entry override (info.syllable / info.syllableHe).
 *    When language is "he" but info.syllableHe is absent, fall back to
 *    info.syllable (English) so we don't accidentally collide with the
 *    units-based Hebrew map (e.g., "8_pair" must NOT render as "טָה").
 * 3. Otherwise, look up by durationUnits in the language-specific map.
 */
export function getSyllable(code, language = "en") {
  const info = DURATION_INFO[code];
  if (!info) return "";
  const isHe = language === "he";
  if (info.isRest) {
    if (!isHe) return REST_EN;
    return REST_BY_UNITS_HE[info.durationUnits] || REST_HE;
  }
  if (info.syllable) {
    return isHe && info.syllableHe ? info.syllableHe : info.syllable;
  }
  const map = isHe ? SYLLABLE_BY_UNITS_HE : SYLLABLE_BY_UNITS;
  return map[info.durationUnits] || "";
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

/**
 * Generate a subdivision-counting question — "How many {subdivision} notes
 * make a {target} note?" The answer is computed from durationUnits, so the
 * helper is generic across note relationships (only "qd"/"8" is used today).
 *
 * @param {string} [target="qd"] - Duration code being counted into (e.g., "qd")
 * @param {string} [subdivision="8"] - Duration code of the subdivision (e.g., "8")
 * @returns {{ correct: number, choices: number[], target: string, subdivision: string }}
 */
export function generateCountSubdivisionQuestion(
  target = "qd",
  subdivision = "8"
) {
  const targetUnits = DURATION_INFO[target]?.durationUnits || 6;
  const subUnits = DURATION_INFO[subdivision]?.durationUnits || 2;
  const correct = Math.round(targetUnits / subUnits); // qd/8 -> 3

  // Plausible distractors near the correct answer (qd/8 -> [2, 4, 6])
  const distractors = [
    ...new Set([correct - 1, correct + 1, correct * 2]),
  ].filter((n) => n > 0 && n !== correct);

  // Pad to 3 distractors if the candidates collided (edge case for small values)
  let n = correct + 3;
  while (distractors.length < 3) {
    if (n !== correct && !distractors.includes(n)) distractors.push(n);
    n++;
  }

  return {
    correct,
    choices: shuffle([correct, ...distractors.slice(0, 3)]),
    target,
    subdivision,
  };
}
