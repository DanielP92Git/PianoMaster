import { describe, it, expect } from "vitest";
import { deriveResponsiveWidth, deriveResponsiveHeight } from "./staffSizing";

// These functions are consumed from two places — the memoized render path and the
// synchronous pre-paint measurement in VexFlowStaffDisplay's layout effect. If they ever
// disagreed, the staff would be drawn at one size while the redraw guard compared against
// another, reintroducing the transition flash. That is what these tests protect.

describe("deriveResponsiveWidth", () => {
  it("falls back to staffWidth when the container has not been measured", () => {
    expect(deriveResponsiveWidth(0, 700, 1)).toBe(700);
    expect(deriveResponsiveWidth(undefined, 640, 1)).toBe(640);
  });

  it("subtracts the card's inner padding", () => {
    expect(deriveResponsiveWidth(752, 700, 1)).toBe(736);
  });

  it("floors narrow containers at 320 so notation stays legible", () => {
    expect(deriveResponsiveWidth(100, 700, 1)).toBe(320);
  });

  it("caps single-bar patterns at 1400", () => {
    expect(deriveResponsiveWidth(4000, 700, 1)).toBe(1400);
  });

  it("does not cap multi-bar patterns (they scroll horizontally instead)", () => {
    expect(deriveResponsiveWidth(4000, 700, 4)).toBe(3984);
  });

  it("treats missing/zero measuresPerPattern as a single bar", () => {
    expect(deriveResponsiveWidth(4000, 700, 0)).toBe(1400);
    expect(deriveResponsiveWidth(4000, 700, undefined)).toBe(1400);
  });
});

describe("deriveResponsiveHeight", () => {
  it("returns the minimum when the container has not been measured", () => {
    expect(deriveResponsiveHeight(0)).toBe(180);
    expect(deriveResponsiveHeight(undefined)).toBe(180);
  });

  it("clamps to [180, 320]", () => {
    expect(deriveResponsiveHeight(100)).toBe(180);
    expect(deriveResponsiveHeight(250)).toBe(250);
    expect(deriveResponsiveHeight(900)).toBe(320);
  });

  it("is stable across the isTightHeight threshold inputs", () => {
    // 220 is the isTightHeight cutoff in renderStaff; both sides must be reachable so the
    // STAFF_SCALE branch is exercised rather than being clamped into a single value.
    expect(deriveResponsiveHeight(219)).toBe(219);
    expect(deriveResponsiveHeight(221)).toBe(221);
  });
});
