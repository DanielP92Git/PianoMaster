import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getMeasuresOverride } from "../measuresOverride";

describe("getMeasuresOverride", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Default to DEV=true for most tests
    vi.stubEnv("DEV", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    // Restore window.location if a test replaced it
    if (window.location !== originalLocation) {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
    }
    vi.restoreAllMocks();
  });

  function setSearch(search) {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, search },
    });
  }

  it("returns null when import.meta.env.DEV is false (production)", () => {
    vi.stubEnv("DEV", "");
    setSearch("?measures=4");
    expect(getMeasuresOverride()).toBeNull();
  });

  it("returns null when no measures param is present", () => {
    setSearch("");
    expect(getMeasuresOverride()).toBeNull();
  });

  it("returns 1 when measures=1", () => {
    setSearch("?measures=1");
    expect(getMeasuresOverride()).toBe(1);
  });

  it("returns 4 when measures=4", () => {
    setSearch("?measures=4");
    expect(getMeasuresOverride()).toBe(4);
  });

  it("returns null when measures=0 (below range)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setSearch("?measures=0");
    expect(getMeasuresOverride()).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("returns null when measures=5 (above range)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setSearch("?measures=5");
    expect(getMeasuresOverride()).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("returns null when value is non-integer (abc)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setSearch("?measures=abc");
    expect(getMeasuresOverride()).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("returns null when value is decimal (2.5)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setSearch("?measures=2.5");
    expect(getMeasuresOverride()).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("returns null when window.location is undefined (SSR)", () => {
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: undefined,
    });
    expect(getMeasuresOverride()).toBeNull();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: original,
    });
  });
});
