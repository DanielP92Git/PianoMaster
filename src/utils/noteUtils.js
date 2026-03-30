const NOTE_TO_SEMITONE = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4,
  F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

/**
 * Convert a note name to MIDI number.
 * Supports sharps (#), flats (b), and case-insensitive note letters.
 * Cb is treated as enharmonic to B of the same-numbered octave label
 * (i.e. Cb4 = B3 in concert pitch = MIDI 59).
 * @param {string} pitch - e.g. "C4", "Eb4", "F#3", "c4"
 * @returns {number|null} MIDI number or null if invalid
 */
export const noteNameToMidi = (pitch) => {
  if (!pitch) return null;
  const match = pitch.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;

  const [, letter, accidental, octaveStr] = match;
  const baseLetter = letter.toUpperCase();
  let octave = parseInt(octaveStr, 10);
  if (Number.isNaN(octave)) return null;

  let noteKey;
  if (accidental === "b") {
    const flatMap = {
      CB: "B", DB: "C#", EB: "D#", FB: "E",
      GB: "F#", AB: "G#", BB: "A#",
    };
    const flatKey = `${baseLetter}B`;
    noteKey = flatMap[flatKey] || baseLetter;
    // Cb maps to B which is in the previous octave
    if (flatKey === "CB") {
      octave -= 1;
    }
  } else {
    noteKey = `${baseLetter}${accidental === "#" ? "#" : ""}`;
  }

  const semitone = NOTE_TO_SEMITONE[noteKey];
  if (semitone === undefined) return null;

  return (octave + 1) * 12 + semitone;
};
