import { describe, it, expect } from "vitest";
// Import scoreTap from the pure utility module to avoid React/Supabase chain in component file
import { scoreTap } from "./utils/rhythmScoringUtils";
import { calculateTimingThresholds } from "./utils/rhythmTimingUtils";

/**
 * Unit tests for the exported scoreTap helper function.
 * Tests the core RTAP-04 tap scoring logic in isolation
 * without rendering the full component.
 */

describe("scoreTap", () => {
  const tempo = 60; // 1 beat per second — easy math
  const beatTimes = [1.0, 2.0, 3.0, 4.0]; // 4 quarter notes at 60 BPM

  // At 60 BPM, calculateTimingThresholds returns:
  // PERFECT: ~59ms, GOOD: ~89ms (scaled from 50/75ms at 120 BPM)
  const thresholds = calculateTimingThresholds(tempo);

  it("returns PERFECT when tap is within PERFECT threshold", () => {
    // 20ms off — well within PERFECT threshold
    const result = scoreTap(1.02, beatTimes, 0, tempo);
    expect(result.quality).toBe("PERFECT");
    expect(result.noteIdx).toBe(0);
  });

  it("returns GOOD when tap is within GOOD threshold but outside PERFECT", () => {
    // Use a delta between PERFECT and GOOD thresholds
    const deltaMs = thresholds.PERFECT + 10; // Just outside PERFECT, inside GOOD
    const tapTime = 1.0 + deltaMs / 1000;
    const result = scoreTap(tapTime, beatTimes, 0, tempo);
    expect(result.quality).toBe("GOOD");
  });

  it("returns MISS when tap is outside all thresholds", () => {
    // 500ms off — way outside any threshold
    const result = scoreTap(1.5, beatTimes, 0, tempo);
    expect(result.quality).toBe("MISS");
  });

  it("advances newNextBeatIndex to prevent double-scoring", () => {
    const result = scoreTap(1.02, beatTimes, 0, tempo);
    expect(result.newNextBeatIndex).toBeGreaterThan(0);
  });

  it("matches against next expected beat when nextBeatIndex is 1", () => {
    // nextBeatIndex = 1 means we start searching from beat index 1
    const result = scoreTap(2.03, beatTimes, 1, tempo); // near beat index 1 (time=2.0)
    expect(result.noteIdx).toBe(1);
    expect(result.quality).toBe("PERFECT");
  });

  it("returns MISS with noteIdx -1 when scheduledBeatTimes is empty", () => {
    const result = scoreTap(1.0, [], 0, tempo);
    expect(result.quality).toBe("MISS");
    expect(result.noteIdx).toBe(-1);
  });

  it("returns deltaMs as a number", () => {
    const result = scoreTap(1.02, beatTimes, 0, tempo);
    expect(typeof result.deltaMs).toBe("number");
    expect(result.deltaMs).toBeCloseTo(20, 0); // ~20ms
  });

  it("handles tap exactly on beat time as PERFECT", () => {
    const result = scoreTap(2.0, beatTimes, 1, tempo);
    expect(result.quality).toBe("PERFECT");
    expect(result.noteIdx).toBe(1);
    expect(result.deltaMs).toBeLessThan(1);
  });

  // --- Easy-tier (nodeType) integration tests ---
  // At 60 BPM: hard PERFECT=62ms, easy PERFECT=123ms

  it("uses easy-tier thresholds for discovery nodeType", () => {
    // 70ms off at 60 BPM: hard-tier GOOD (>62ms), easy-tier PERFECT (<123ms)
    const result = scoreTap(1.07, beatTimes, 0, tempo, "discovery");
    expect(result.quality).toBe("PERFECT");
  });

  it("uses easy-tier thresholds for practice nodeType", () => {
    // 100ms off at 60 BPM: hard-tier MISS (>92ms), easy-tier PERFECT (<123ms)
    const result = scoreTap(1.1, beatTimes, 0, tempo, "practice");
    expect(result.quality).toBe("PERFECT");
  });

  it("uses hard-tier thresholds when nodeType is null (default)", () => {
    // 70ms off at 60 BPM: hard-tier GOOD (>62ms PERFECT)
    const result = scoreTap(1.07, beatTimes, 0, tempo);
    expect(result.quality).toBe("GOOD");
  });

  it("uses hard-tier thresholds for challenge nodeType", () => {
    // 70ms off at 60 BPM: hard-tier GOOD (>62ms PERFECT)
    const result = scoreTap(1.07, beatTimes, 0, tempo, "challenge");
    expect(result.quality).toBe("GOOD");
  });
});
