/**
 * EN <-> HE locale parity gate for legal copy (privacy policy + terms of service).
 *
 * Why this file exists (mirrors sight-reading-parity.test.js pattern):
 * - i18next missing-key behavior is silent fallback to the default string, so
 *   drift between EN and HE never surfaces in production until a real user
 *   trips the gap. For marketing copy that is a papercut; for a published
 *   privacy policy it means a Hebrew reader silently gets the English text of
 *   a legal document, or a stale claim we believed we had corrected.
 *
 * Scope covers both `privacy` and `legal` because the COPPA remediation work
 * edits these two subtrees in tranches — the gate is deliberately in place
 * before the larger Tranche 2 copy pass lands.
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

describe.each(["privacy", "legal"])("%s EN <-> HE locale parity", (subtree) => {
  it(`every EN ${subtree} key has a HE counterpart`, () => {
    const enPaths = collectPaths(enCommon[subtree] || {});
    const hePaths = collectPaths(heCommon[subtree] || {});
    expect([...enPaths].filter((p) => !hePaths.has(p))).toEqual([]);
  });

  it(`every HE ${subtree} key has an EN counterpart (no orphan HE keys)`, () => {
    const enPaths = collectPaths(enCommon[subtree] || {});
    const hePaths = collectPaths(heCommon[subtree] || {});
    expect([...hePaths].filter((p) => !enPaths.has(p))).toEqual([]);
  });

  it(`${subtree} has a non-empty key set in both locales`, () => {
    // Guards against the suite passing vacuously if a subtree is renamed or
    // dropped — two empty sets are trivially in parity.
    expect(collectPaths(enCommon[subtree] || {}).size).toBeGreaterThan(0);
    expect(collectPaths(heCommon[subtree] || {}).size).toBeGreaterThan(0);
  });
});
