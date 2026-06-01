/**
 * Phase 01 / Plan 01 — Scaffolding card EN ↔ HE locale parity gate.
 *
 * Wave 0 establishes this drift gate BEFORE Wave 2 populates the
 * `game.discovery.cards.*` tree in `common.json`. The tests intentionally
 * pass vacuously today (both sides empty → no missing/orphan paths) so the
 * gate is in place the moment Wave 2 starts adding card copy. As soon as
 * either language gains a `cards` subtree, parity becomes load-bearing.
 *
 * Why this file exists in Wave 0 (per 01-PLAN.md §"Task 3"):
 * - i18next missing-key behavior is silent fallback to the default string,
 *   so drift between EN and HE never surfaces in production until a real
 *   user trips the gap. A static test makes the gap impossible to ship.
 * - Adding the test infrastructure now lets Wave 2 land card copy with the
 *   safety net already wired — no separate "remember to add the parity test"
 *   ceremony at the end of the milestone.
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

describe("Scaffolding card EN ↔ HE locale parity (game.discovery.cards.*)", () => {
  it("every EN scaffolding card key has a HE counterpart", () => {
    const enPaths = collectPaths(enCommon.game?.discovery?.cards || {});
    const hePaths = collectPaths(heCommon.game?.discovery?.cards || {});
    const missing = [...enPaths].filter((p) => !hePaths.has(p));
    expect(missing).toEqual([]);
  });

  it("every HE scaffolding card key has an EN counterpart (no orphan HE keys)", () => {
    const enPaths = collectPaths(enCommon.game?.discovery?.cards || {});
    const hePaths = collectPaths(heCommon.game?.discovery?.cards || {});
    const orphan = [...hePaths].filter((p) => !enPaths.has(p));
    expect(orphan).toEqual([]);
  });
});
