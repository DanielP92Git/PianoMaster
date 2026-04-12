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
        const restSyllable =
          language === "he" ? REST_SYLLABLE_HE : REST_SYLLABLE_EN;
        const syllableText = beat.isRest
          ? restSyllable
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
      const restSyllable =
        language === "he" ? REST_SYLLABLE_HE : REST_SYLLABLE_EN;
      const syllableText = beat.isRest
        ? restSyllable
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
