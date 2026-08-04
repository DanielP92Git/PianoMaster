import { describe, it, expect } from "vitest";
import { looksLikeFullName } from "./nicknameHeuristic";

describe("looksLikeFullName", () => {
  it("returns true for two capitalized tokens (looks like a full name)", () => {
    expect(looksLikeFullName("Jane Smith")).toBe(true);
  });

  it("returns false for a single token", () => {
    expect(looksLikeFullName("Jane")).toBe(false);
  });

  it("returns false for short single-token nicknames", () => {
    expect(looksLikeFullName("jj")).toBe(false);
    expect(looksLikeFullName("star")).toBe(false);
  });

  it("returns false for a hyphenated single token (Anna-Marie)", () => {
    expect(looksLikeFullName("Anna-Marie")).toBe(false);
  });

  it("returns false for three or more tokens", () => {
    expect(looksLikeFullName("Mary Anne Kate")).toBe(false);
  });

  it("returns true for two capitalized tokens even if both read like nicknames (acceptable conservative catch)", () => {
    expect(looksLikeFullName("Sunny Bunny")).toBe(true);
  });

  it("returns false when tokens have lowercase initials", () => {
    expect(looksLikeFullName("mary smith")).toBe(false);
  });

  it("returns false for blank/empty input", () => {
    expect(looksLikeFullName("  ")).toBe(false);
    expect(looksLikeFullName("")).toBe(false);
  });

  it("returns false for non-string input", () => {
    expect(looksLikeFullName(undefined)).toBe(false);
    expect(looksLikeFullName(null)).toBe(false);
  });

  it("returns false for Hebrew two-token nicknames (non-cased script never triggers)", () => {
    expect(looksLikeFullName("דניאל כהן")).toBe(false);
  });

  it("returns false when one token is hyphenated even if capitalized", () => {
    expect(looksLikeFullName("Anna-Marie Smith")).toBe(false);
  });
});
