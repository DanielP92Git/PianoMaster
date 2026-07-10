/**
 * Phase 02 / Plan 04 — Sight-reading EN ↔ HE locale parity gate.
 *
 * Wave 0 establishes this drift gate BEFORE Task 2 (this same plan) adds
 * the practice-tooling strings (controls.replay/modePractice/modeTest/
 * modeToggleLabel/compare/review, summary.practiceNotScored, the new
 * compare.* and review.* subtrees) that downstream plans 02-06/07/08/09
 * depend on. It passes vacuously green today (52/52 parity) so the gate is
 * already in place the moment new keys land.
 *
 * Why this file exists (mirrors scaffolding-card-parity.test.js pattern):
 * - i18next missing-key behavior is silent fallback to the default string,
 *   so drift between EN and HE never surfaces in production until a real
 *   user trips the gap. A static test makes the gap impossible to ship.
 */

import { describe, it, expect } from "vitest";
import enCommon from "../en/common.json";
import heCommon from "../he/common.json";

function collectPaths(obj, prefix = "") {
  const paths = new Set();
  if (!obj || typeof obj !== "object") return paths;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const p of collectPaths(v, key)) paths.add(p);
    } else {
      paths.add(key);
    }
  }
  return paths;
}

describe("sightReading EN <-> HE locale parity", () => {
  it("every EN sightReading key has a HE counterpart", () => {
    const enPaths = collectPaths(enCommon.sightReading || {});
    const hePaths = collectPaths(heCommon.sightReading || {});
    expect([...enPaths].filter((p) => !hePaths.has(p))).toEqual([]);
  });
  it("every HE sightReading key has an EN counterpart (no orphan HE keys)", () => {
    const enPaths = collectPaths(enCommon.sightReading || {});
    const hePaths = collectPaths(heCommon.sightReading || {});
    expect([...hePaths].filter((p) => !enPaths.has(p))).toEqual([]);
  });
});
