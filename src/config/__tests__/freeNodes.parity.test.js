/**
 * Phase 01 / Plan 01 — FREE_NODE_IDS ↔ Postgres is_free_node() parity gate.
 *
 * The free-tier paywall is enforced in two places (defense in depth):
 *   1. JS  `FREE_RHYTHM_NODE_IDS` Set in `src/config/subscriptionConfig.js`
 *   2. SQL `is_free_node(node_id)` body in supabase/migrations/*.sql
 *
 * Drift between the two breaks the paywall: a free node in JS that's not in
 * SQL becomes a 403; a free node in SQL that's not in JS shows a paywall
 * modal the user can dismiss to access actually-free content.
 *
 * This test pins the documented post-Phase-01 target whitelist (D-12 in
 * 01-CONTEXT.md: all of U1 = rhythm_1_1..5 + boss_rhythm_1) and asserts
 * the JS source matches. It is INTENTIONALLY FAILING TODAY because the
 * JS source still holds the pre-restructure 4-ID list
 * (`['rhythm_1_1','rhythm_1_3','rhythm_1_4','rhythm_1_6']`); plan 01-04 will
 * update both sides in lockstep with the migration that replaces the SQL
 * body — at which point this test will go green and remain a regression gate.
 *
 * EXPECTED FAILURE OUTPUT TODAY:
 *   { missingInJs: ['rhythm_1_2','rhythm_1_5','boss_rhythm_1'],
 *     extraInJs:   ['rhythm_1_6'] }
 *
 * Update protocol: when changing the free-tier boundary, update BOTH
 * `EXPECTED_RHYTHM_FREE` (this file) AND `FREE_RHYTHM_NODE_IDS` (the
 * source) AND `is_free_node()` (the SQL migration) in a single commit.
 */

import { describe, it, expect } from "vitest";
import { FREE_RHYTHM_NODE_IDS } from "../subscriptionConfig.js";

/**
 * SQL whitelist mirror — must equal the rhythm IDs returned by
 * `is_free_node()` in the Phase 01 Supabase migration (`01-04-PLAN.md`).
 * The documented target per D-12 is all six U1 rhythm IDs after restructure.
 */
const EXPECTED_RHYTHM_FREE = [
  "rhythm_1_1",
  "rhythm_1_2",
  "rhythm_1_3",
  "rhythm_1_4",
  "rhythm_1_5",
  "boss_rhythm_1",
];

describe("FREE_NODE_IDS ↔ Postgres is_free_node() parity (documented whitelist)", () => {
  it("FREE_RHYTHM_NODE_IDS + boss_rhythm_1 matches the SQL whitelist", () => {
    const jsSet = new Set([...FREE_RHYTHM_NODE_IDS, "boss_rhythm_1"]);
    const expectedSet = new Set(EXPECTED_RHYTHM_FREE);
    const missingInJs = [...expectedSet].filter((id) => !jsSet.has(id));
    const extraInJs = [...jsSet].filter((id) => !expectedSet.has(id));
    expect({ missingInJs, extraInJs }).toEqual({
      missingInJs: [],
      extraInJs: [],
    });
  });
});
