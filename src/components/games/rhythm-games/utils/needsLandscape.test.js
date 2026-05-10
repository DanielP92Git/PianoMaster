/**
 * needsLandscape.test.js
 *
 * Tests for needsLandscape helper covering measures-only, beats-array,
 * and edge-case paths per NOTATION-03 / RESEARCH § Pattern 2.
 */

import { describe, it, expect } from "vitest";
import { needsLandscape } from "./needsLandscape.js";

describe("needsLandscape helper", () => {
  describe("measures-only path", () => {
    it("returns false for 1 measure of 4/4 (4 beats)", () => {
      expect(needsLandscape(undefined, "4/4", 1)).toBe(false);
    });
    it("returns false for 2 measures of 4/4 (8 beats)", () => {
      expect(needsLandscape(undefined, "4/4", 2)).toBe(false);
    });
    it("returns true for 3 measures of 4/4 (12 beats)", () => {
      expect(needsLandscape(undefined, "4/4", 3)).toBe(true);
    });
    it("returns false for 3 measures of 3/4 (9 beats — at threshold)", () => {
      expect(needsLandscape(undefined, "3/4", 3)).toBe(false);
    });
    it("returns true for 4 measures of 3/4 (12 beats)", () => {
      expect(needsLandscape(undefined, "3/4", 4)).toBe(true);
    });
    it("returns false for 4 measures of 2/4 (8 beats)", () => {
      expect(needsLandscape(undefined, "2/4", 4)).toBe(false);
    });
    it("returns true for 5 measures of 2/4 (10 beats)", () => {
      expect(needsLandscape(undefined, "2/4", 5)).toBe(true);
    });
  });

  describe("beats-array path", () => {
    it("returns false for 4 quarter notes (4 beats)", () => {
      const beats = Array.from({ length: 4 }, () => ({
        durationUnits: 4,
        isRest: false,
      }));
      expect(needsLandscape(beats, "4/4")).toBe(false);
    });
    it("returns false for 8 quarters (8 beats)", () => {
      const beats = Array.from({ length: 8 }, () => ({
        durationUnits: 4,
        isRest: false,
      }));
      expect(needsLandscape(beats, "4/4")).toBe(false);
    });
    it("returns true for 10 quarters (10 beats)", () => {
      const beats = Array.from({ length: 10 }, () => ({
        durationUnits: 4,
        isRest: false,
      }));
      expect(needsLandscape(beats, "4/4")).toBe(true);
    });
    it("counts mixed durations correctly (2 halves + 4 quarters = 8 beats)", () => {
      const beats = [
        { durationUnits: 8, isRest: false },
        { durationUnits: 8, isRest: false },
        { durationUnits: 4, isRest: false },
        { durationUnits: 4, isRest: false },
        { durationUnits: 4, isRest: false },
        { durationUnits: 4, isRest: false },
      ];
      expect(needsLandscape(beats, "4/4")).toBe(false);
    });
    it("counts rests in totalBeats", () => {
      // 2 quarters + 2 quarter rests = 4 beats — fits portrait
      const beats = [
        { durationUnits: 4, isRest: false },
        { durationUnits: 4, isRest: true },
        { durationUnits: 4, isRest: false },
        { durationUnits: 4, isRest: true },
      ];
      expect(needsLandscape(beats, "4/4")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns false for empty beats and no measures", () => {
      expect(needsLandscape([], "4/4")).toBe(false);
    });
    it("returns false for undefined beats and no measures", () => {
      expect(needsLandscape(undefined, "4/4")).toBe(false);
    });
    it("handles missing timeSignature (defaults to 4/4)", () => {
      expect(needsLandscape(undefined, undefined, 3)).toBe(true); // 12 beats > 9
    });
    it("handles malformed timeSignature gracefully", () => {
      expect(needsLandscape(undefined, "garbage", 3)).toBe(true); // falls back to 4/4
    });
    it("returns false when both beats and measures are missing", () => {
      expect(needsLandscape()).toBe(false);
    });
    it("measures override takes precedence over beats array", () => {
      const beats = Array.from({ length: 100 }, () => ({
        durationUnits: 4,
        isRest: false,
      }));
      // Even with 100 beats in array, if measures=1 in 4/4 = 4 beats, returns false
      expect(needsLandscape(beats, "4/4", 1)).toBe(false);
    });
  });
});
