import { describe, it, expect } from "vitest";
import {
  computeNextTier,
  applyTierToSettings,
  buildWeightedNotePool,
} from "./adaptiveEngine";
import {
  ADAPTIVE_TIERS,
  MIN_TIER_INDEX,
  MAX_TIER_INDEX,
  ESCALATE_SUCCESS_STREAK,
  EASE_MISS_RUN,
  MASTERY_MIN_ATTEMPTS,
  WEAK_ACCURACY_THRESHOLD,
  WEAK_NOTE_WEIGHT,
} from "../constants/adaptiveTiers";

describe("computeNextTier", () => {
  it("eases one tier when missRunInLastExercise >= EASE_MISS_RUN, even with a high success streak", () => {
    const result = computeNextTier({
      successStreak: 10,
      missRunInLastExercise: EASE_MISS_RUN,
      currentTierIndex: 0,
    });
    expect(result.tierIndex).toBe(-1);
    expect(result.didEscalate).toBe(false);
  });

  it("floors easing at MIN_TIER_INDEX", () => {
    const result = computeNextTier({
      successStreak: 0,
      missRunInLastExercise: EASE_MISS_RUN,
      currentTierIndex: MIN_TIER_INDEX,
    });
    expect(result.tierIndex).toBe(MIN_TIER_INDEX);
    expect(result.didEscalate).toBe(false);
  });

  it("escalates one tier when successStreak >= ESCALATE_SUCCESS_STREAK and missRun is below EASE_MISS_RUN", () => {
    const result = computeNextTier({
      successStreak: ESCALATE_SUCCESS_STREAK,
      missRunInLastExercise: 0,
      currentTierIndex: 0,
    });
    expect(result.tierIndex).toBe(1);
    expect(result.didEscalate).toBe(true);
  });

  it("does not escalate past MAX_TIER_INDEX and reports didEscalate=false at the ceiling", () => {
    const result = computeNextTier({
      successStreak: ESCALATE_SUCCESS_STREAK,
      missRunInLastExercise: 0,
      currentTierIndex: MAX_TIER_INDEX,
    });
    expect(result.tierIndex).toBe(MAX_TIER_INDEX);
    expect(result.didEscalate).toBe(false);
  });

  it("returns the same tier unchanged when neither condition is met", () => {
    const result = computeNextTier({
      successStreak: 1,
      missRunInLastExercise: 0,
      currentTierIndex: 0,
    });
    expect(result.tierIndex).toBe(0);
    expect(result.didEscalate).toBe(false);
  });

  it("easing takes precedence over escalation on a tie", () => {
    const result = computeNextTier({
      successStreak: ESCALATE_SUCCESS_STREAK,
      missRunInLastExercise: EASE_MISS_RUN,
      currentTierIndex: 0,
    });
    expect(result.tierIndex).toBe(-1);
    expect(result.didEscalate).toBe(false);
  });
});

describe("applyTierToSettings", () => {
  const tierPlus2 = ADAPTIVE_TIERS.find((t) => t.index === 2);
  const tierMinus2 = ADAPTIVE_TIERS.find((t) => t.index === -2);
  const tierPlus1 = ADAPTIVE_TIERS.find((t) => t.index === 1);
  const tierMinus1 = ADAPTIVE_TIERS.find((t) => t.index === -1);
  const tierZero = ADAPTIVE_TIERS.find((t) => t.index === 0);

  it("clamps tempo at the high extreme (base 80, +24 => 104, clamps to 100)", () => {
    const result = applyTierToSettings({ tempo: 80 }, tierPlus2, []);
    expect(result.tempo).toBe(100);
  });

  it("clamps tempo at the low extreme (base 80, -24 => 56, clamps to 60)", () => {
    const result = applyTierToSettings({ tempo: 80 }, tierMinus2, []);
    expect(result.tempo).toBe(60);
  });

  it("widens selectedNotes with the superset when widenNotes is true, deduped and order-stable", () => {
    const baseSettings = { tempo: 80, selectedNotes: ["C4", "D4"] };
    const result = applyTierToSettings(baseSettings, tierPlus1, [
      "D4",
      "E4",
      "F4",
    ]);
    expect(result.selectedNotes).toEqual(["C4", "D4", "E4", "F4"]);
  });

  it("does not widen selectedNotes when widenNotes is false, even with a non-empty superset", () => {
    const baseSettings = { tempo: 80, selectedNotes: ["C4", "D4"] };
    const result = applyTierToSettings(baseSettings, tierMinus1, ["E4", "F4"]);
    expect(result.selectedNotes).toEqual(["C4", "D4"]);
  });

  it("does not throw and leaves selectedNotes as baseline when superset is undefined", () => {
    const baseSettings = { tempo: 80, selectedNotes: ["C4"] };
    expect(() =>
      applyTierToSettings(baseSettings, tierPlus1, undefined)
    ).not.toThrow();
    const result = applyTierToSettings(baseSettings, tierPlus1, undefined);
    expect(result.selectedNotes).toEqual(["C4"]);
  });

  it("strips rests (allowRests=false) when includeRests===false", () => {
    const baseSettings = {
      tempo: 80,
      rhythmSettings: { allowRests: true, allowedNoteDurations: ["q"] },
    };
    const result = applyTierToSettings(baseSettings, tierMinus1, []);
    expect(result.rhythmSettings.allowRests).toBe(false);
  });

  it("ensures rests allowed (allowRests=true) when includeRests===true", () => {
    const baseSettings = {
      tempo: 80,
      rhythmSettings: { allowRests: false, allowedNoteDurations: ["q"] },
    };
    const result = applyTierToSettings(baseSettings, tierPlus1, []);
    expect(result.rhythmSettings.allowRests).toBe(true);
  });

  it("leaves rhythmSettings untouched when includeRests is null", () => {
    const baseSettings = {
      tempo: 80,
      rhythmSettings: { allowRests: true, allowedNoteDurations: ["q"] },
    };
    const result = applyTierToSettings(baseSettings, tierZero, []);
    expect(result.rhythmSettings).toEqual(baseSettings.rhythmSettings);
  });

  it("never mutates the input baseSettings object", () => {
    const baseSettings = {
      tempo: 80,
      selectedNotes: ["C4"],
      rhythmSettings: { allowRests: true },
    };
    const snapshot = JSON.parse(JSON.stringify(baseSettings));
    applyTierToSettings(baseSettings, tierPlus2, ["D4"]);
    expect(baseSettings).toEqual(snapshot);
  });

  it("returns a NEW object, not the same reference as baseSettings", () => {
    const baseSettings = { tempo: 80, selectedNotes: ["C4"] };
    const result = applyTierToSettings(baseSettings, tierZero, []);
    expect(result).not.toBe(baseSettings);
  });
});

// CR-01 (03-REVIEW.md): buildWeightedNotePool returns a per-pitch WEIGHT MAP, not a
// duplicated array — patternBuilder.js hard-dedupes `selectedNotes` before picking a note,
// so array-duplication-based weighting is silently discarded before it can have any effect.
// The weight map is consumed by patternBuilder.js's weighted random pick instead (see the
// unmocked integration regression test in patternBuilder.test.js, which exercises the real
// weighted pick end-to-end and would catch this class of bug recurring).
describe("buildWeightedNotePool", () => {
  it("assigns a weak pitch (total>=MASTERY_MIN_ATTEMPTS, accuracy<WEAK_ACCURACY_THRESHOLD) weight WEAK_NOTE_WEIGHT", () => {
    const basePool = ["C4", "D4", "E4"];
    const masteryMap = {
      C4: { correct: 1, total: MASTERY_MIN_ATTEMPTS }, // 25% accuracy, weak
    };
    const result = buildWeightedNotePool(basePool, masteryMap);
    expect(result).toEqual({ C4: WEAK_NOTE_WEIGHT, D4: 1, E4: 1 });
  });

  it("assigns weight 1 to a pitch below the accuracy threshold if it lacks enough attempts", () => {
    const basePool = ["C4", "D4"];
    const masteryMap = {
      C4: { correct: 0, total: MASTERY_MIN_ATTEMPTS - 1 },
    };
    const result = buildWeightedNotePool(basePool, masteryMap);
    expect(result).toEqual({ C4: 1, D4: 1 });
  });

  it("assigns weight 1 to a pitch with enough attempts but accuracy >= threshold", () => {
    const basePool = ["C4", "D4"];
    const masteryMap = {
      C4: { correct: MASTERY_MIN_ATTEMPTS, total: MASTERY_MIN_ATTEMPTS },
    };
    expect(WEAK_ACCURACY_THRESHOLD).toBeLessThanOrEqual(100);
    const result = buildWeightedNotePool(basePool, masteryMap);
    expect(result).toEqual({ C4: 1, D4: 1 });
  });

  it("cold start: returns a uniform (all-1) weight map when no pitch meets MASTERY_MIN_ATTEMPTS", () => {
    const basePool = ["C4", "D4", "E4"];
    const masteryMap = {
      C4: { correct: 0, total: 1 },
      D4: { correct: 1, total: 2 },
    };
    const result = buildWeightedNotePool(basePool, masteryMap);
    expect(result).toEqual({ C4: 1, D4: 1, E4: 1 });
  });

  it("cold start: returns a uniform (all-1) weight map for an empty masteryMap without throwing", () => {
    const basePool = ["C4", "D4"];
    expect(() => buildWeightedNotePool(basePool, {})).not.toThrow();
    expect(buildWeightedNotePool(basePool, {})).toEqual({ C4: 1, D4: 1 });
  });

  it("cold start: returns a uniform (all-1) weight map for an undefined masteryMap without throwing", () => {
    const basePool = ["C4", "D4"];
    expect(() => buildWeightedNotePool(basePool, undefined)).not.toThrow();
    expect(buildWeightedNotePool(basePool, undefined)).toEqual({
      C4: 1,
      D4: 1,
    });
  });
});
