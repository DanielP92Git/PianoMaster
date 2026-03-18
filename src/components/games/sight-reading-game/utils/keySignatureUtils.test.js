import { describe, it, expect } from "vitest";
import { filterNotesToKey, mapNoteToKey } from "./keySignatureUtils";
import {
  KEY_NOTE_LETTERS,
  KEY_SIGNATURE_OPTIONS,
} from "../constants/keySignatureConfig";

describe("KEY_NOTE_LETTERS", () => {
  it("C major contains exactly C D E F G A B", () => {
    expect(KEY_NOTE_LETTERS["C"]).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
  });

  it("G major contains exactly G A B C D E F#", () => {
    expect(KEY_NOTE_LETTERS["G"]).toEqual([
      "G",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F#",
    ]);
  });

  it("D major contains exactly D E F# G A B C#", () => {
    expect(KEY_NOTE_LETTERS["D"]).toEqual([
      "D",
      "E",
      "F#",
      "G",
      "A",
      "B",
      "C#",
    ]);
  });

  it("A major contains exactly A B C# D E F# G#", () => {
    expect(KEY_NOTE_LETTERS["A"]).toEqual([
      "A",
      "B",
      "C#",
      "D",
      "E",
      "F#",
      "G#",
    ]);
  });

  it("F major contains exactly F G A Bb C D E", () => {
    expect(KEY_NOTE_LETTERS["F"]).toEqual([
      "F",
      "G",
      "A",
      "Bb",
      "C",
      "D",
      "E",
    ]);
  });

  it("Bb major contains exactly Bb C D Eb F G A", () => {
    expect(KEY_NOTE_LETTERS["Bb"]).toEqual([
      "Bb",
      "C",
      "D",
      "Eb",
      "F",
      "G",
      "A",
    ]);
  });

  it("Eb major contains exactly Eb F G Ab Bb C D", () => {
    expect(KEY_NOTE_LETTERS["Eb"]).toEqual([
      "Eb",
      "F",
      "G",
      "Ab",
      "Bb",
      "C",
      "D",
    ]);
  });

  it("has exactly 7 keys (C, G, D, A, F, Bb, Eb)", () => {
    expect(Object.keys(KEY_NOTE_LETTERS)).toHaveLength(7);
    expect(Object.keys(KEY_NOTE_LETTERS)).toEqual(
      expect.arrayContaining(["C", "G", "D", "A", "F", "Bb", "Eb"])
    );
  });
});

describe("KEY_SIGNATURE_OPTIONS", () => {
  it("has exactly 7 entries", () => {
    expect(KEY_SIGNATURE_OPTIONS).toHaveLength(7);
  });

  it("first entry is C major with value null", () => {
    expect(KEY_SIGNATURE_OPTIONS[0].value).toBeNull();
  });

  it("has values [null, G, D, A, F, Bb, Eb] in order", () => {
    const values = KEY_SIGNATURE_OPTIONS.map((opt) => opt.value);
    expect(values).toEqual([null, "G", "D", "A", "F", "Bb", "Eb"]);
  });

  it("each entry has labelKey and badgeKey strings", () => {
    for (const opt of KEY_SIGNATURE_OPTIONS) {
      expect(typeof opt.labelKey).toBe("string");
      expect(typeof opt.badgeKey).toBe("string");
    }
  });
});

describe("filterNotesToKey", () => {
  it("returns all notes when all are in G major", () => {
    const result = filterNotesToKey(["C4", "D4", "F#4", "G4"], "G");
    expect(result).toEqual(["C4", "D4", "F#4", "G4"]);
  });

  it("keeps F4 natural in G major (F staff position is F# via key sig)", () => {
    const result = filterNotesToKey(
      ["C4", "D4", "E4", "F4", "F#4"],
      "G"
    );
    expect(result).toEqual(["C4", "D4", "E4", "F4", "F#4"]);
  });

  it("removes Fb4 in G major (not a valid in-key accidental)", () => {
    const result = filterNotesToKey(["F4", "Fb4", "F#4"], "G");
    expect(result).toEqual(["F4", "F#4"]);
  });

  it("keeps Bb4 and Eb5 in Bb major (all in key)", () => {
    const result = filterNotesToKey(["C4", "Bb4", "Eb5"], "Bb");
    expect(result).toEqual(["C4", "Bb4", "Eb5"]);
  });

  it("returns unchanged array for null key (no filtering)", () => {
    const result = filterNotesToKey(["C4", "D4"], null);
    expect(result).toEqual(["C4", "D4"]);
  });

  it("returns unchanged array for C major (no filtering)", () => {
    const result = filterNotesToKey(["C4", "D4"], "C");
    expect(result).toEqual(["C4", "D4"]);
  });

  it("returns empty array when input is empty", () => {
    const result = filterNotesToKey([], "G");
    expect(result).toEqual([]);
  });

  it("keeps C4 natural in D major (C staff position is C# via key sig)", () => {
    const result = filterNotesToKey(["C4", "C#4", "D4", "E4"], "D");
    expect(result).toEqual(["C4", "C#4", "D4", "E4"]);
  });

  it("keeps B4 natural in Eb major (B staff position is Bb via key sig)", () => {
    const result = filterNotesToKey(["Bb4", "B4", "C5", "Eb5"], "Eb");
    expect(result).toEqual(["Bb4", "B4", "C5", "Eb5"]);
  });

  it("removes G#4 in G major (G# is not the in-key form)", () => {
    const result = filterNotesToKey(["G4", "G#4"], "G");
    expect(result).toEqual(["G4"]);
  });
});

describe("mapNoteToKey", () => {
  it("maps F4 to F#4 in G major", () => {
    expect(mapNoteToKey("F4", "G")).toBe("F#4");
  });

  it("maps F4 to F#4 and C4 to C#4 in D major", () => {
    expect(mapNoteToKey("F4", "D")).toBe("F#4");
    expect(mapNoteToKey("C4", "D")).toBe("C#4");
  });

  it("maps B4 to Bb4 in F major", () => {
    expect(mapNoteToKey("B4", "F")).toBe("Bb4");
  });

  it("maps B3 to Bb3 and E3 to Eb3 in Bb major", () => {
    expect(mapNoteToKey("B3", "Bb")).toBe("Bb3");
    expect(mapNoteToKey("E3", "Bb")).toBe("Eb3");
  });

  it("maps B5 to Bb5, E5 to Eb5, A5 to Ab5 in Eb major", () => {
    expect(mapNoteToKey("B5", "Eb")).toBe("Bb5");
    expect(mapNoteToKey("E5", "Eb")).toBe("Eb5");
    expect(mapNoteToKey("A5", "Eb")).toBe("Ab5");
  });

  it("leaves naturals unchanged in C major", () => {
    expect(mapNoteToKey("F4", "C")).toBe("F4");
  });

  it("leaves naturals unchanged when key is null", () => {
    expect(mapNoteToKey("F4", null)).toBe("F4");
  });

  it("does not transform accidental notes (already explicit)", () => {
    expect(mapNoteToKey("F#4", "G")).toBe("F#4");
    expect(mapNoteToKey("Bb3", "F")).toBe("Bb3");
  });

  it("leaves notes with no key alteration unchanged", () => {
    expect(mapNoteToKey("G4", "G")).toBe("G4");
    expect(mapNoteToKey("C4", "G")).toBe("C4");
  });
});
