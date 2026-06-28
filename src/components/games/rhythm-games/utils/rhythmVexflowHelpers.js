import { StaveNote, Stem, Dot, Annotation } from "vexflow";

/**
 * Map from sixteenth-note duration units to VexFlow duration code strings.
 *
 * Covers all standard durations used by RhythmPatternGenerator:
 *   16 → whole ('w')
 *   12 → dotted half ('hd')
 *    8 → half ('h')
 *    6 → dotted quarter ('qd')
 *    4 → quarter ('q')
 *    3 → dotted eighth ('8d')
 *    2 → eighth ('8')
 *    1 → sixteenth ('16')
 */
export const DURATION_TO_VEX = {
  16: "w",
  12: "hd",
  8: "h",
  6: "qd",
  4: "q",
  3: "8d",
  2: "8",
  1: "16",
};

/**
 * Convert a binary pattern array from RhythmPatternGenerator into beat objects.
 *
 * Binary format: [1,0,0,0,1,0,...] where:
 *   1 = note onset (attack)
 *   0 = sustain/rest continuation
 * Each position represents one sixteenth note unit.
 *
 * Returns an array of { durationUnits: number, isRest: boolean } objects
 * where durationUnits is how many sixteenth-note positions this beat spans.
 *
 * @param {number[]} binaryPattern - Binary array from RhythmPatternGenerator.getPattern()
 * @returns {{ durationUnits: number, isRest: boolean }[]}
 */
export function binaryPatternToBeats(binaryPattern) {
  const beats = [];
  let i = 0;

  while (i < binaryPattern.length) {
    const isNote = binaryPattern[i] === 1;
    let duration = 1;

    // Count consecutive 0s following this position — they extend this beat
    let j = i + 1;
    while (j < binaryPattern.length && binaryPattern[j] === 0) {
      duration++;
      j++;
    }

    beats.push({ durationUnits: duration, isRest: !isNote });
    i = j;
  }

  return beats;
}

// Map a resolved VexFlow duration code (note or rest) to sixteenth-note units.
const VEX_CODE_TO_UNITS = {
  w: 16,
  hd: 12,
  h: 8,
  qd: 6,
  q: 4,
  "8d": 3,
  8: 2,
  16: 1,
  wr: 16,
  hr: 8,
  qr: 4,
  "8r": 2,
  "16r": 1,
};
const VEX_REST_CODES = new Set(["wr", "hr", "qr", "8r", "16r"]);

/**
 * Convert a resolver's `vexDurations` (e.g. ["q","qr","q","q"]) into beat
 * objects. Unlike binaryPatternToBeats — which derives durations from the raw
 * literal onset gaps — these codes have already been quantized to the node's
 * allowed durations by binaryToVexDurations(). Render from THIS when a resolved
 * pattern carries vexDurations, so the displayed/played rhythm never exceeds the
 * durations the node is allowed to teach (e.g. a quarter-only boss never shows
 * a half or eighth that a loosely-tagged source pattern happened to contain).
 *
 * @param {string[]} vexDurations - Duration/rest codes from the tag resolver
 * @returns {{ durationUnits: number, isRest: boolean }[]}
 */
export function vexDurationsToBeats(vexDurations) {
  return (vexDurations || []).map((code) => ({
    durationUnits: VEX_CODE_TO_UNITS[code] ?? 4,
    isRest: VEX_REST_CODES.has(code),
  }));
}

/**
 * Kodaly syllable maps for rhythm notation display.
 *
 * Hebrew syllables include Nikud diacritics — do not alter without user approval.
 */
export const SYLLABLE_MAP_EN = {
  16: "ta-a-a-a",
  12: "ta-a-a",
  8: "ta-a",
  6: "ta-a",
  4: "ta",
  2: "ti",
  1: "ti-ka",
};

export const SYLLABLE_MAP_HE = {
  16: "\u05D8\u05B8\u05D4-\u05D0\u05B8\u05D4-\u05D0\u05B8\u05D4-\u05D0\u05B8\u05D4",
  12: "\u05D8\u05B8\u05D4-\u05D0\u05B8\u05D4-\u05D0\u05B8\u05D4",
  8: "\u05D8\u05B8\u05D4-\u05D0\u05B8\u05D4",
  6: "\u05D8\u05B8\u05D4-\u05D0\u05B8\u05D4",
  4: "\u05D8\u05B8\u05D4",
  2: "\u05D8\u05B4\u05D9",
  1: "\u05D8\u05B4\u05D9-\u05DB\u05BC\u05B8\u05D4",
};

export const REST_SYLLABLE_EN = "sh";
export const REST_SYLLABLE_HE = "\u05D4\u05B8\u05E1"; // default / quarter-rest fallback

/**
 * Duration-aware Hebrew rest syllables (parallel to SYLLABLE_MAP_HE: half =
 * 2-part, whole = 4-part). User-confirmed Nikud 2026-06-19. Mirrored in
 * durationInfo.js REST_BY_UNITS_HE \u2014 do not alter Nikud without user approval.
 */
export const REST_SYLLABLE_MAP_HE = {
  16: "\u05D4\u05B8\u05D0-\u05D0\u05B8-\u05D0\u05B8-\u05D0\u05B8\u05E1", // whole rest \u2014 \u05D4\u05B8\u05D0-\u05D0\u05B8-\u05D0\u05B8-\u05D0\u05B8\u05E1
  8: "\u05D4\u05B8\u05D0-\u05D0\u05B8\u05E1", // half rest \u2014 \u05D4\u05B8\u05D0-\u05D0\u05B8\u05E1
  4: "\u05D4\u05B8\u05E1", // quarter rest \u2014 \u05D4\u05B8\u05E1
};

/**
 * Resolve the rest syllable for a beat. Hebrew is duration-aware; English is
 * the flat "sh" for every rest.
 */
function getRestSyllable(durationUnits, language) {
  if (language === "he") {
    return REST_SYLLABLE_MAP_HE[durationUnits] || REST_SYLLABLE_HE;
  }
  return REST_SYLLABLE_EN;
}

/**
 * Convert beat objects into VexFlow StaveNote objects for rhythm-only display.
 *
 * All notes use pitch 'b/4' (mid-staff treble position) and Stem.UP per D-01
 * and the rhythm-only rendering convention in this codebase.
 *
 * Dotted notes (e.g. durationUnits=6 → 'qd') have a VexFlow Dot attached
 * via Dot.buildAndAttach().
 *
 * When showSyllables is true, attaches a Kodaly syllable annotation below
 * each note head using VexFlow Annotation (D-16).
 *
 * @param {{ durationUnits: number, isRest: boolean }[]} beats
 * @param {{ showSyllables?: boolean, language?: string }} [options]
 * @returns {StaveNote[]}
 */
export function beatsToVexNotes(
  beats,
  { showSyllables = false, language = "en" } = {}
) {
  return beats.map((beat) => {
    const vexDur = DURATION_TO_VEX[beat.durationUnits];

    // Fallback to quarter note if duration not in map
    if (!vexDur) {
      const note = new StaveNote({
        keys: ["b/4"],
        duration: beat.isRest ? "qr" : "q",
        stem_direction: Stem.UP,
      });

      if (showSyllables) {
        const syllableMap =
          language === "he" ? SYLLABLE_MAP_HE : SYLLABLE_MAP_EN;
        const syllableText = beat.isRest
          ? getRestSyllable(beat.durationUnits, language)
          : syllableMap[beat.durationUnits] || "";
        if (syllableText) {
          const fontFamily = language === "he" ? "Heebo" : "sans-serif";
          const annotation = new Annotation(syllableText)
            .setFont(fontFamily, 11)
            .setVerticalJustification(Annotation.VerticalJustify.BOTTOM);
          note.addModifier(annotation);
        }
      }

      return note;
    }

    const isDotted = vexDur.endsWith("d");
    // Strip the 'd' suffix for VexFlow — dots are added separately via Dot.buildAndAttach
    const baseDur = isDotted ? vexDur.slice(0, -1) : vexDur;

    const note = new StaveNote({
      keys: ["b/4"],
      duration: beat.isRest ? baseDur + "r" : baseDur,
      stem_direction: Stem.UP,
    });

    if (isDotted) {
      Dot.buildAndAttach([note], { all: true });
    }

    if (showSyllables) {
      const syllableMap = language === "he" ? SYLLABLE_MAP_HE : SYLLABLE_MAP_EN;
      const syllableText = beat.isRest
        ? getRestSyllable(beat.durationUnits, language)
        : syllableMap[beat.durationUnits] || "";
      if (syllableText) {
        const fontFamily = language === "he" ? "Heebo" : "sans-serif";
        const annotation = new Annotation(syllableText)
          .setFont(fontFamily, 11)
          .setVerticalJustification(Annotation.VerticalJustify.BOTTOM);
        note.addModifier(annotation);
      }
    }

    return note;
  });
}
