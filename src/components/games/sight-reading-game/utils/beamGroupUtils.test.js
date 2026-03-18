import { describe, it, expect } from "vitest";
import { Fraction } from "vexflow";
import { beamGroupsForTimeSignature } from "./beamGroupUtils.js";

describe("beamGroupsForTimeSignature", () => {
  it("returns 3+3 Fraction groups for 6/8", () => {
    const groups = beamGroupsForTimeSignature("6/8");
    expect(groups).toHaveLength(2);
    expect(groups[0]).toBeInstanceOf(Fraction);
    expect(groups[0].numerator).toBe(3);
    expect(groups[0].denominator).toBe(8);
    expect(groups[1].numerator).toBe(3);
    expect(groups[1].denominator).toBe(8);
  });

  it("returns 3+3+3 Fraction groups for 9/8", () => {
    const groups = beamGroupsForTimeSignature("9/8");
    expect(groups).toHaveLength(3);
    groups.forEach((g) => {
      expect(g.numerator).toBe(3);
      expect(g.denominator).toBe(8);
    });
  });

  it("returns 3+3+3+3 Fraction groups for 12/8", () => {
    const groups = beamGroupsForTimeSignature("12/8");
    expect(groups).toHaveLength(4);
    groups.forEach((g) => {
      expect(g.numerator).toBe(3);
      expect(g.denominator).toBe(8);
    });
  });

  it("returns null for 4/4 (VexFlow default)", () => {
    expect(beamGroupsForTimeSignature("4/4")).toBeNull();
  });

  it("returns null for 3/4 (VexFlow default)", () => {
    expect(beamGroupsForTimeSignature("3/4")).toBeNull();
  });

  it("returns null for 2/4 (VexFlow default)", () => {
    expect(beamGroupsForTimeSignature("2/4")).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(beamGroupsForTimeSignature(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(beamGroupsForTimeSignature("")).toBeNull();
  });
});
