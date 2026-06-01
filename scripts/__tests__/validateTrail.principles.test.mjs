/**
 * Phase 01 / Plan 01 — Pedagogy principle validator unit tests.
 *
 * Exercises the three exported rule functions in `scripts/validateTrail.mjs`
 * (`validatePulseFirst`, `validateRestsWoven`, `validateConceptPerUnit`) in
 * isolation by mocking `src/data/skillTrail.js`'s `SKILL_NODES` export.
 *
 * Test contract: assert on `console.error` spy calls per-test. We DO NOT
 * assert on the validator's module-scope `hasErrors` flag because it persists
 * across test cases (it's a one-way latch set true on any violation), which
 * would leak state between tests. The console.error spy is a fresh observer
 * per test (`beforeEach`).
 *
 * Fixture nodes are reassigned per-case via the getter exposed by the
 * `vi.mock` factory below. The mock must be registered BEFORE the dynamic
 * `await import("../validateTrail.mjs")` runs, which Vitest guarantees by
 * hoisting `vi.mock` calls above all imports.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

let fixtureNodes = [];

vi.mock("../../src/data/skillTrail.js", () => ({
  get SKILL_NODES() {
    return fixtureNodes;
  },
}));

const { validatePulseFirst, validateRestsWoven, validateConceptPerUnit } =
  await import("../validateTrail.mjs");

function makeNode({
  id,
  category = "rhythm",
  unit = 1,
  order,
  focusDurations = [],
  timeSignature = "4/4",
  nodeType = "discovery",
}) {
  return {
    id,
    category,
    unit,
    order,
    nodeType,
    rhythmConfig: {
      focusDurations,
      timeSignature,
      durations: focusDurations,
    },
  };
}

let consoleErrorSpy;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("validatePulseFirst (REQ-01)", () => {
  it("passes when the first rhythm node introduces quarter", () => {
    fixtureNodes = [
      makeNode({ id: "rhythm_1_1", order: 100, focusDurations: ["q"] }),
    ];
    validatePulseFirst();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("fails when the first rhythm node does NOT introduce quarter", () => {
    fixtureNodes = [
      makeNode({ id: "rhythm_1_1", order: 100, focusDurations: ["h"] }),
    ];
    validatePulseFirst();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("must introduce quarter")
    );
  });
});

describe("validateRestsWoven (REQ-02)", () => {
  it("passes when qr is preceded by a q introducer", () => {
    fixtureNodes = [
      makeNode({ id: "rhythm_1_1", order: 100, focusDurations: ["q"] }),
      makeNode({ id: "rhythm_1_2", order: 101, focusDurations: ["qr"] }),
    ];
    validateRestsWoven();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("fails when qr has no preceding q introducer", () => {
    fixtureNodes = [
      makeNode({ id: "rhythm_1_1", order: 100, focusDurations: ["qr"] }),
    ];
    validateRestsWoven();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("no preceding duration")
    );
  });
});

describe("validateConceptPerUnit (REQ-03)", () => {
  it("passes when all unit nodes share a family ({q, qr})", () => {
    fixtureNodes = [
      makeNode({
        id: "rhythm_1_1",
        unit: 1,
        order: 100,
        focusDurations: ["q"],
      }),
      makeNode({
        id: "rhythm_1_2",
        unit: 1,
        order: 101,
        focusDurations: ["qr"],
      }),
    ];
    validateConceptPerUnit();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("fails when a unit mixes concept families {hd} + {qd}", () => {
    fixtureNodes = [
      makeNode({
        id: "rhythm_5_1",
        unit: 5,
        order: 125,
        focusDurations: ["hd"],
      }),
      makeNode({
        id: "rhythm_5_4",
        unit: 5,
        order: 128,
        focusDurations: ["qd"],
      }),
    ];
    validateConceptPerUnit();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("mixes concept families")
    );
  });

  it("exempts U10 review boss (single cumulative boss, no focusDurations)", () => {
    fixtureNodes = [
      makeNode({
        id: "boss_rhythm_10",
        category: "boss",
        unit: 10,
        order: 200,
        focusDurations: [],
        nodeType: "boss",
      }),
    ];
    validateConceptPerUnit();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
