/**
 * meterUtils.test.js
 *
 * Tests for compound-meter timing helpers. Verifies that getMeterTiming is an
 * exact no-op for simple meters (4/4, 3/4, 2/4) and produces eighth-note
 * subdivisions for 6/8, plus strong-beat detection for accents.
 */

import { describe, it, expect } from "vitest";
import {
  getMeterTiming,
  isStrongSubdivision,
  isStrongOnset,
} from "./meterUtils.js";
import { TIME_SIGNATURES } from "../RhythmPatternGenerator.js";

const { FOUR_FOUR, THREE_FOUR, TWO_FOUR, SIX_EIGHT } = TIME_SIGNATURES;
const BD = 0.5; // 120 BPM quarter note

describe("getMeterTiming — simple meters (no-op)", () => {
  it("4/4: 4 beats, quarter subdivision, 4-beat measure", () => {
    const m = getMeterTiming(FOUR_FOUR, BD);
    expect(m.displayCount).toBe(4);
    expect(m.isCompound).toBe(false);
    expect(m.subdivisionDur).toBe(BD);
    expect(m.measureDur).toBe(4 * BD);
  });

  it("3/4: 3 beats, quarter subdivision, 3-beat measure", () => {
    const m = getMeterTiming(THREE_FOUR, BD);
    expect(m.displayCount).toBe(3);
    expect(m.subdivisionDur).toBe(BD);
    expect(m.measureDur).toBe(3 * BD);
  });

  it("2/4: 2 beats, quarter subdivision, 2-beat measure", () => {
    const m = getMeterTiming(TWO_FOUR, BD);
    expect(m.displayCount).toBe(2);
    expect(m.subdivisionDur).toBe(BD);
    expect(m.measureDur).toBe(2 * BD);
  });
});

describe("getMeterTiming — 6/8 compound meter", () => {
  it("displays 6 eighth-note circles", () => {
    expect(getMeterTiming(SIX_EIGHT, BD).displayCount).toBe(6);
  });

  it("pulses on eighth notes (beatDur/2)", () => {
    expect(getMeterTiming(SIX_EIGHT, BD).subdivisionDur).toBe(BD / 2);
  });

  it("measure lasts 3 quarter notes", () => {
    expect(getMeterTiming(SIX_EIGHT, BD).measureDur).toBe(3 * BD);
  });

  it("6 subdivisions span exactly one measure", () => {
    const m = getMeterTiming(SIX_EIGHT, BD);
    expect(m.displayCount * m.subdivisionDur).toBe(m.measureDur);
  });

  it("flags isCompound and exposes strong beats [0, 3]", () => {
    const m = getMeterTiming(SIX_EIGHT, BD);
    expect(m.isCompound).toBe(true);
    expect(m.strongBeats).toEqual([0, 3]);
  });
});

describe("isStrongSubdivision", () => {
  it("6/8: positions 0 and 3 are strong, others weak", () => {
    expect(isStrongSubdivision(0, SIX_EIGHT)).toBe(true);
    expect(isStrongSubdivision(1, SIX_EIGHT)).toBe(false);
    expect(isStrongSubdivision(2, SIX_EIGHT)).toBe(false);
    expect(isStrongSubdivision(3, SIX_EIGHT)).toBe(true);
    expect(isStrongSubdivision(4, SIX_EIGHT)).toBe(false);
    expect(isStrongSubdivision(5, SIX_EIGHT)).toBe(false);
  });

  it("6/8: wraps across measures", () => {
    expect(isStrongSubdivision(6, SIX_EIGHT)).toBe(true);
    expect(isStrongSubdivision(9, SIX_EIGHT)).toBe(true);
    expect(isStrongSubdivision(7, SIX_EIGHT)).toBe(false);
  });

  it("4/4: only the downbeat is strong", () => {
    expect(isStrongSubdivision(0, FOUR_FOUR)).toBe(true);
    expect(isStrongSubdivision(1, FOUR_FOUR)).toBe(false);
    expect(isStrongSubdivision(4, FOUR_FOUR)).toBe(true);
  });
});

describe("isStrongOnset", () => {
  it("6/8: sixteenth slots 0 and 6 are strong onsets", () => {
    expect(isStrongOnset(0, SIX_EIGHT)).toBe(true);
    expect(isStrongOnset(6, SIX_EIGHT)).toBe(true);
    expect(isStrongOnset(2, SIX_EIGHT)).toBe(false);
    expect(isStrongOnset(4, SIX_EIGHT)).toBe(false);
    expect(isStrongOnset(8, SIX_EIGHT)).toBe(false);
  });

  it("6/8: wraps across measures (slot 12 -> 0, 18 -> 6)", () => {
    expect(isStrongOnset(12, SIX_EIGHT)).toBe(true);
    expect(isStrongOnset(18, SIX_EIGHT)).toBe(true);
  });

  it("4/4: only sixteenth slot 0 is a strong onset", () => {
    expect(isStrongOnset(0, FOUR_FOUR)).toBe(true);
    expect(isStrongOnset(4, FOUR_FOUR)).toBe(false);
    expect(isStrongOnset(8, FOUR_FOUR)).toBe(false);
  });
});
