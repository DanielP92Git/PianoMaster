/**
 * holdScoringUtils.test.js
 *
 * Tests for hold scoring utilities: scoreHold, isHoldNote, calcHoldDurationMs.
 * Covers: threshold boundaries, edge cases, duration calculation at various tempos.
 */

import { describe, it, expect } from "vitest";
import {
  scoreHold,
  isHoldNote,
  calcHoldDurationMs,
  HOLD_THRESHOLDS,
} from "./holdScoringUtils.js";

describe("HOLD_THRESHOLDS", () => {
  it("PERFECT threshold equals 0.7", () => {
    expect(HOLD_THRESHOLDS.PERFECT).toBe(0.7);
  });

  it("GOOD threshold equals 0.4", () => {
    expect(HOLD_THRESHOLDS.GOOD).toBe(0.4);
  });
});

describe("scoreHold", () => {
  it("returns PERFECT when ratio >= 0.7 (700ms of 1000ms)", () => {
    expect(scoreHold(700, 1000)).toBe("PERFECT");
  });

  it("returns PERFECT when ratio exactly equals 1.0 (1000ms of 1000ms)", () => {
    expect(scoreHold(1000, 1000)).toBe("PERFECT");
  });

  it("returns PERFECT when ratio exceeds 1.0 (held longer than required)", () => {
    expect(scoreHold(1200, 1000)).toBe("PERFECT");
  });

  it("returns GOOD when ratio is in 40-69% range (699ms of 1000ms)", () => {
    expect(scoreHold(699, 1000)).toBe("GOOD");
  });

  it("returns GOOD for 50% hold (500ms of 1000ms)", () => {
    expect(scoreHold(500, 1000)).toBe("GOOD");
  });

  it("returns GOOD at exactly 40% boundary (400ms of 1000ms)", () => {
    expect(scoreHold(400, 1000)).toBe("GOOD");
  });

  it("returns MISS when ratio is below 40% (399ms of 1000ms)", () => {
    expect(scoreHold(399, 1000)).toBe("MISS");
  });

  it("returns MISS for 30% hold (300ms of 1000ms)", () => {
    expect(scoreHold(300, 1000)).toBe("MISS");
  });

  it("returns MISS for 0% hold (0ms of 1000ms)", () => {
    expect(scoreHold(0, 1000)).toBe("MISS");
  });

  it("returns MISS when requiredHoldMs is 0 (zero required duration guard)", () => {
    expect(scoreHold(1000, 0)).toBe("MISS");
  });

  it("returns MISS for negative actualHoldMs (negative hold guard)", () => {
    expect(scoreHold(-100, 1000)).toBe("MISS");
  });
});

describe("isHoldNote", () => {
  it("returns false for quarter note (durationUnits=4)", () => {
    expect(isHoldNote(4)).toBe(false);
  });

  it("returns true for half note (durationUnits=8)", () => {
    expect(isHoldNote(8)).toBe(true);
  });

  it("returns true for dotted half note (durationUnits=12)", () => {
    expect(isHoldNote(12)).toBe(true);
  });

  it("returns true for whole note (durationUnits=16)", () => {
    expect(isHoldNote(16)).toBe(true);
  });

  it("returns false for eighth note (durationUnits=2)", () => {
    expect(isHoldNote(2)).toBe(false);
  });

  it("returns false for dotted quarter (durationUnits=6)", () => {
    expect(isHoldNote(6)).toBe(false);
  });
});

describe("calcHoldDurationMs", () => {
  it("returns 1000ms for half note (8 units) at 120 BPM", () => {
    expect(calcHoldDurationMs(8, 120)).toBe(1000);
  });

  it("returns 2000ms for whole note (16 units) at 120 BPM", () => {
    expect(calcHoldDurationMs(16, 120)).toBe(2000);
  });

  it("returns 1500ms for half note (8 units) at 80 BPM", () => {
    expect(calcHoldDurationMs(8, 80)).toBe(1500);
  });

  it("returns 3000ms for whole note (16 units) at 80 BPM", () => {
    expect(calcHoldDurationMs(16, 80)).toBe(3000);
  });

  it("returns 1500ms for dotted half note (12 units) at 120 BPM", () => {
    expect(calcHoldDurationMs(12, 120)).toBe(1500);
  });

  it("returns 500ms for quarter note (4 units) at 120 BPM (reference)", () => {
    expect(calcHoldDurationMs(4, 120)).toBe(500);
  });
});
