/**
 * Enharmonic Matching Tests
 *
 * Verifies that the noteToMidi helper used in SightReadingGame.jsx correctly
 * resolves enharmonic equivalents to the same MIDI number, enabling flats
 * played on a mic to be scored correctly even though the mic reports the
 * sharp-form (e.g., mic reports C#4 when user plays Db4).
 *
 * noteToMidi and SEMITONE_MAP are duplicated here verbatim from SightReadingGame.jsx
 * because they are local (not exported) to that module.
 */

// Verbatim copy from SightReadingGame.jsx lines 94-102
const SEMITONE_MAP = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function noteToMidi(note) {
  if (!note) return null;
  const m = note.match(/^([A-G][b#]?)(\d)$/);
  if (!m) return null;
  const semi = SEMITONE_MAP[m[1]];
  if (semi === undefined) return null;
  return (parseInt(m[2], 10) + 1) * 12 + semi;
}

describe("noteToMidi — enharmonic equivalence", () => {
  // MIDI formula: (octave + 1) * 12 + semitone
  // C4 = (4+1)*12 + 0 = 60, so enharmonic pairs in octave 4:
  // C#4/Db4 = 61, D#4/Eb4 = 63, F#4/Gb4 = 66, G#4/Ab4 = 68, A#4/Bb4 = 70
  describe("5 enharmonic pairs resolve to equal MIDI numbers", () => {
    test("C#4 === Db4 (both MIDI 61)", () => {
      expect(noteToMidi("C#4")).toBe(61);
      expect(noteToMidi("Db4")).toBe(61);
      expect(noteToMidi("C#4")).toBe(noteToMidi("Db4"));
    });

    test("D#4 === Eb4 (both MIDI 63)", () => {
      expect(noteToMidi("D#4")).toBe(63);
      expect(noteToMidi("Eb4")).toBe(63);
      expect(noteToMidi("D#4")).toBe(noteToMidi("Eb4"));
    });

    test("F#4 === Gb4 (both MIDI 66)", () => {
      expect(noteToMidi("F#4")).toBe(66);
      expect(noteToMidi("Gb4")).toBe(66);
      expect(noteToMidi("F#4")).toBe(noteToMidi("Gb4"));
    });

    test("G#4 === Ab4 (both MIDI 68)", () => {
      expect(noteToMidi("G#4")).toBe(68);
      expect(noteToMidi("Ab4")).toBe(68);
      expect(noteToMidi("G#4")).toBe(noteToMidi("Ab4"));
    });

    test("A#4 === Bb4 (both MIDI 70)", () => {
      expect(noteToMidi("A#4")).toBe(70);
      expect(noteToMidi("Bb4")).toBe(70);
      expect(noteToMidi("A#4")).toBe(noteToMidi("Bb4"));
    });
  });

  describe("non-enharmonic notes stay unequal", () => {
    test("C4 !== D4", () => {
      expect(noteToMidi("C4")).not.toBe(noteToMidi("D4"));
    });

    test("C4 is MIDI 60, D4 is MIDI 62", () => {
      expect(noteToMidi("C4")).toBe(60);
      expect(noteToMidi("D4")).toBe(62);
    });
  });

  describe("null safety", () => {
    test("noteToMidi(null) returns null", () => {
      expect(noteToMidi(null)).toBeNull();
    });

    test("noteToMidi(undefined) returns null", () => {
      expect(noteToMidi(undefined)).toBeNull();
    });

    test("noteToMidi('invalid') returns null", () => {
      expect(noteToMidi("invalid")).toBeNull();
    });

    test("noteToMidi('') returns null", () => {
      expect(noteToMidi("")).toBeNull();
    });

    test("null === null guard: two null inputs must not be treated as matching", () => {
      // In game code: detectedMidi != null && ... guards against this
      const a = noteToMidi(null);
      const b = noteToMidi(null);
      // Both are null; the game guard (detectedMidi != null) prevents false-positive match
      expect(a).toBeNull();
      expect(b).toBeNull();
      // Verify the guard pattern: null != null is false, so no match fires
      expect(a != null).toBe(false);
    });
  });
});
