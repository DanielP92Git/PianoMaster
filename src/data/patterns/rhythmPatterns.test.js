import { describe, it, expect } from "vitest";
import { RHYTHM_PATTERNS } from "./rhythmPatterns.js";

const MEASURE_LENGTHS = { "4/4": 16, "3/4": 12, "6/8": 12 };
const VALID_TIME_SIGS = new Set(["4/4", "3/4", "6/8"]);
const VALID_TAGS = new Set([
  "quarter-only",
  "quarter-half",
  "quarter-half-whole",
  "quarter-eighth",
  "quarter-half-whole-eighth",
  "quarter-rest",
  "half-rest",
  "whole-rest",
  "dotted-half",
  "three-four",
  "dotted-quarter",
  "sixteenth",
  "six-eight",
  "syncopation",
  "dotted-syncopation",
]);

describe("RHYTHM_PATTERNS", () => {
  it("contains at least 120 patterns", () => {
    expect(RHYTHM_PATTERNS.length).toBeGreaterThanOrEqual(120);
  });

  it("all IDs are unique", () => {
    const ids = RHYTHM_PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all IDs match expected format", () => {
    RHYTHM_PATTERNS.forEach((p) => {
      expect(p.id).toMatch(/^[a-z0-9_]+$/);
    });
  });

  it("no duplicate binary patterns within the same time signature", () => {
    const seen = new Map();
    RHYTHM_PATTERNS.forEach((p) => {
      const key = `${p.timeSignature}:${JSON.stringify(p.pattern)}`;
      const existing = seen.get(key);
      expect(existing).toBeUndefined();
      seen.set(key, p.id);
    });
  });

  it("all 15 tags are covered by at least one pattern", () => {
    const usedTags = new Set();
    RHYTHM_PATTERNS.forEach((p) => {
      p.tags.forEach((t) => usedTags.add(t));
    });
    VALID_TAGS.forEach((tag) => {
      expect(usedTags.has(tag)).toBe(true);
    });
  });

  RHYTHM_PATTERNS.forEach((p, i) => {
    describe(`pattern[${i}] id=${p.id}`, () => {
      it("has a valid timeSignature", () => {
        expect(VALID_TIME_SIGS.has(p.timeSignature)).toBe(true);
      });

      it("pattern array length matches time signature", () => {
        expect(p.pattern.length).toBe(MEASURE_LENGTHS[p.timeSignature]);
      });

      it("pattern contains only 0s and 1s", () => {
        expect(p.pattern.every((v) => v === 0 || v === 1)).toBe(true);
      });

      it("has at least one note onset", () => {
        expect(p.pattern.some((v) => v === 1)).toBe(true);
      });

      it("has at least one tag from valid taxonomy", () => {
        expect(p.tags.length).toBeGreaterThan(0);
        p.tags.forEach((tag) => {
          expect(VALID_TAGS.has(tag)).toBe(true);
        });
      });

      it("has measures field equal to 1", () => {
        expect(p.measures).toBe(1);
      });

      it("has a string id matching format /^[a-z0-9_]+$/", () => {
        expect(typeof p.id).toBe("string");
        expect(p.id).toMatch(/^[a-z0-9_]+$/);
      });
    });
  });
});
