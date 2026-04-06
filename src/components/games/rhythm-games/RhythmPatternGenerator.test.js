import { describe, it, expect } from "vitest";
import { resolveByTags, resolveByIds } from "./RhythmPatternGenerator.js";
import { EXERCISE_TYPES } from "../../../data/constants.js";

describe("EXERCISE_TYPES.RHYTHM_PULSE constant", () => {
  it("equals rhythm_pulse", () => {
    expect(EXERCISE_TYPES.RHYTHM_PULSE).toBe("rhythm_pulse");
  });
});

describe("resolveByTags", () => {
  it("returns an array with length > 0 for a known tag", () => {
    const results = resolveByTags(["quarter-only"]);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns only patterns that include the given tag", () => {
    const results = resolveByTags(["quarter-only"]);
    results.forEach((p) => {
      expect(p.tags).toContain("quarter-only");
    });
  });

  it("filters by difficulty when option is provided", () => {
    const results = resolveByTags(["quarter-only"], { difficulty: "beginner" });
    expect(results.length).toBeGreaterThan(0);
    results.forEach((p) => {
      expect(p.difficulty).toBe("beginner");
    });
  });

  it("filters by measureCount when option is provided", () => {
    const results = resolveByTags(["quarter-only"], { measureCount: 2 });
    expect(results.length).toBeGreaterThan(0);
    results.forEach((p) => {
      expect(p.measureCount).toBe(2);
    });
  });

  it("returns empty array for a nonsense tag", () => {
    const results = resolveByTags(["nonexistent-tag-xyz"]);
    expect(results).toEqual([]);
  });

  it("PAT-05: quarter-only tag returns no patterns containing half/whole/eighth durations in durationSet", () => {
    const results = resolveByTags(["quarter-only"]);
    const forbiddenDurations = ["h", "w", "8", "16", "qd", "hd"];
    results.forEach((p) => {
      forbiddenDurations.forEach((dur) => {
        expect(p.durationSet).not.toContain(dur);
      });
    });
  });

  it("returns union of patterns for multiple tags", () => {
    const quarterOnly = resolveByTags(["quarter-only"]);
    const quarterHalf = resolveByTags(["quarter-half"]);
    const combined = resolveByTags(["quarter-only", "quarter-half"]);
    // Union should be at least as large as either individual result
    expect(combined.length).toBeGreaterThanOrEqual(quarterOnly.length);
    expect(combined.length).toBeGreaterThanOrEqual(quarterHalf.length);
  });
});

describe("resolveByIds", () => {
  it("returns a single pattern by ID", () => {
    const results = resolveByIds(["quarter_only_01"]);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("quarter_only_01");
  });

  it("returns multiple patterns when multiple IDs provided", () => {
    const results = resolveByIds(["quarter_only_01", "quarter_only_02"]);
    expect(results).toHaveLength(2);
    const ids = results.map((p) => p.id);
    expect(ids).toContain("quarter_only_01");
    expect(ids).toContain("quarter_only_02");
  });

  it("returns empty array for nonexistent ID", () => {
    const results = resolveByIds(["nonexistent_id_xyz"]);
    expect(results).toEqual([]);
  });
});
