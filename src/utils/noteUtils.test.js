import { describe, it, expect } from "vitest";
import { noteNameToMidi } from "./noteUtils";

describe("noteNameToMidi", () => {
  it("converts C4 to 60", () => {
    expect(noteNameToMidi("C4")).toBe(60);
  });

  it("converts A4 to 69", () => {
    expect(noteNameToMidi("A4")).toBe(69);
  });

  it("converts Eb4 to 63 (flat support)", () => {
    expect(noteNameToMidi("Eb4")).toBe(63);
  });

  it("converts F#3 to 54 (sharp support)", () => {
    expect(noteNameToMidi("F#3")).toBe(54);
  });

  it("converts c4 to 60 (case-insensitive)", () => {
    expect(noteNameToMidi("c4")).toBe(60);
  });

  it("converts Cb4 to 59 (enharmonic: Cb = B)", () => {
    expect(noteNameToMidi("Cb4")).toBe(59);
  });

  it("returns null for null input", () => {
    expect(noteNameToMidi(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(noteNameToMidi("")).toBeNull();
  });

  it("returns null for invalid note letter (X4)", () => {
    expect(noteNameToMidi("X4")).toBeNull();
  });

  it("returns null when octave is missing (C with no octave)", () => {
    expect(noteNameToMidi("C")).toBeNull();
  });

  it("returns null for negative octave (C-1 not matched by regex)", () => {
    expect(noteNameToMidi("C-1")).toBeNull();
  });
});
