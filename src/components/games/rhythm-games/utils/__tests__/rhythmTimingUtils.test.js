/**
 * Tests for two-tier timing threshold system (UX-01)
 *
 * Tests the EASY_NODE_TYPES set, BASE_TIMING_THRESHOLDS_EASY constants,
 * and the nodeType-aware calculateTimingThresholds function.
 */
import { describe, it, expect } from "vitest";
import {
  calculateTimingThresholds,
  EASY_NODE_TYPES,
  BASE_TIMING_THRESHOLDS_EASY,
} from "../rhythmTimingUtils";

describe("calculateTimingThresholds - backward compatibility", () => {
  it("Test 1: calculateTimingThresholds(120) with no nodeType returns PERFECT=50", () => {
    const thresholds = calculateTimingThresholds(120);
    expect(thresholds.PERFECT).toBe(50);
  });

  it("returns PERFECT, GOOD, FAIR keys", () => {
    const thresholds = calculateTimingThresholds(120);
    expect(thresholds).toHaveProperty("PERFECT");
    expect(thresholds).toHaveProperty("GOOD");
    expect(thresholds).toHaveProperty("FAIR");
  });
});

describe("calculateTimingThresholds - easy node types (PERFECT=100 base)", () => {
  it('Test 2: calculateTimingThresholds(120, "discovery") returns PERFECT=100', () => {
    const thresholds = calculateTimingThresholds(120, "discovery");
    expect(thresholds.PERFECT).toBe(100);
  });

  it('Test 3: calculateTimingThresholds(120, "practice") returns PERFECT=100', () => {
    const thresholds = calculateTimingThresholds(120, "practice");
    expect(thresholds.PERFECT).toBe(100);
  });

  it('Test 4: calculateTimingThresholds(120, "mix_up") returns PERFECT=100', () => {
    const thresholds = calculateTimingThresholds(120, "mix_up");
    expect(thresholds.PERFECT).toBe(100);
  });

  it('Test 5: calculateTimingThresholds(120, "review") returns PERFECT=100', () => {
    const thresholds = calculateTimingThresholds(120, "review");
    expect(thresholds.PERFECT).toBe(100);
  });
});

describe("calculateTimingThresholds - hard node types (PERFECT=50 base)", () => {
  it('Test 6: calculateTimingThresholds(120, "challenge") returns PERFECT=50', () => {
    const thresholds = calculateTimingThresholds(120, "challenge");
    expect(thresholds.PERFECT).toBe(50);
  });

  it('Test 7: calculateTimingThresholds(120, "boss") returns PERFECT=50', () => {
    const thresholds = calculateTimingThresholds(120, "boss");
    expect(thresholds.PERFECT).toBe(50);
  });

  it("speed_round node keeps PERFECT=50", () => {
    const thresholds = calculateTimingThresholds(120, "speed_round");
    expect(thresholds.PERFECT).toBe(50);
  });

  it("mini_boss node gets PERFECT=100 (forgiving, per D-07)", () => {
    const thresholds = calculateTimingThresholds(120, "mini_boss");
    expect(thresholds.PERFECT).toBe(100);
  });
});

describe("calculateTimingThresholds - tempo scaling applied on top", () => {
  it('Test 8: calculateTimingThresholds(65, "discovery") PERFECT is wider than 100ms (tempo scaling applied on base 100)', () => {
    const thresholds = calculateTimingThresholds(65, "discovery");
    // At 65 BPM, scaling = (120/65)^0.3 ≈ 1.20; base 100 * 1.20 ≈ 120ms
    // Key property: result > 100 (base) because slower tempo = more generous
    expect(thresholds.PERFECT).toBeGreaterThan(100);
    // And wider than the hard threshold at same tempo
    const hardThresholds = calculateTimingThresholds(65, "challenge");
    expect(thresholds.PERFECT).toBeGreaterThan(hardThresholds.PERFECT);
  });

  it("easy node at slow tempo is more generous than hard node at same tempo", () => {
    const easy = calculateTimingThresholds(90, "discovery");
    const hard = calculateTimingThresholds(90, "challenge");
    expect(easy.PERFECT).toBeGreaterThan(hard.PERFECT);
  });
});

describe("EASY_NODE_TYPES export", () => {
  it("EASY_NODE_TYPES is a Set containing discovery, practice, mix_up, review", () => {
    expect(EASY_NODE_TYPES).toBeInstanceOf(Set);
    expect(EASY_NODE_TYPES.has("discovery")).toBe(true);
    expect(EASY_NODE_TYPES.has("practice")).toBe(true);
    expect(EASY_NODE_TYPES.has("mix_up")).toBe(true);
    expect(EASY_NODE_TYPES.has("review")).toBe(true);
  });

  it("EASY_NODE_TYPES does NOT contain challenge, boss, speed_round", () => {
    expect(EASY_NODE_TYPES.has("challenge")).toBe(false);
    expect(EASY_NODE_TYPES.has("boss")).toBe(false);
    expect(EASY_NODE_TYPES.has("speed_round")).toBe(false);
  });

  it("EASY_NODE_TYPES DOES contain mini_boss (forgiving thresholds per D-07)", () => {
    expect(EASY_NODE_TYPES.has("mini_boss")).toBe(true);
  });
});

describe("BASE_TIMING_THRESHOLDS_EASY export", () => {
  it("BASE_TIMING_THRESHOLDS_EASY has PERFECT=100, GOOD=150, FAIR=250", () => {
    expect(BASE_TIMING_THRESHOLDS_EASY.PERFECT).toBe(100);
    expect(BASE_TIMING_THRESHOLDS_EASY.GOOD).toBe(150);
    expect(BASE_TIMING_THRESHOLDS_EASY.FAIR).toBe(250);
  });
});

describe("scoreTap with nodeType param", () => {
  it("Test 9: scoreTap accepts nodeType param without error", async () => {
    const { scoreTap } = await import("../rhythmScoringUtils");
    // nodeType='discovery' should use wider thresholds — a 90ms deviation should still score
    const scheduledBeatTimes = [1.0, 1.5, 2.0];
    // Tap 90ms early (within easy PERFECT window of 100ms base, but outside hard 50ms base)
    const tapTime = 1.0 - 0.09; // 90ms before beat at 1.0
    const result = scoreTap(tapTime, scheduledBeatTimes, 0, 120, "discovery");
    // At 120 BPM with discovery node: PERFECT=100ms, so 90ms should be PERFECT
    expect(result.quality).toBe("PERFECT");
  });

  it("same 90ms deviation with hard nodeType scores as MISS", async () => {
    const { scoreTap } = await import("../rhythmScoringUtils");
    const scheduledBeatTimes = [1.0, 1.5, 2.0];
    const tapTime = 1.0 - 0.09; // 90ms before beat
    const result = scoreTap(tapTime, scheduledBeatTimes, 0, 120, "challenge");
    // At 120 BPM with challenge node: PERFECT=50ms, GOOD=75ms; 90ms exceeds both → MISS
    expect(result.quality).toBe("MISS");
  });
});
