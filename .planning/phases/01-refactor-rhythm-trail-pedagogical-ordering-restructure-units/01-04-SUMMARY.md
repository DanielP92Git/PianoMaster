---
phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
plan: 04
subsystem: database
tags:
  [
    migration,
    paywall,
    supabase,
    rhythm-trail,
    is_free_node,
    subscription-config,
  ]

# Dependency graph
requires:
  - phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
    provides: "freeNodes.parity.test.js parity gate (Plan 01-01) — the RED test that this plan turns GREEN"
provides:
  - "Authored Supabase migration 20260601000001_phase1_rhythm_pedagogy.sql (atomic rhythm wipe + is_free_node body replacement)"
  - "Updated FREE_RHYTHM_NODE_IDS to 5 IDs (1_1..1_5) per D-12"
  - "New FREE_BOSS_RHYTHM_NODE_IDS export with boss_rhythm_1, composed into FREE_NODE_IDS"
  - "boss_rhythm_1 removed from PAYWALL_BOSS_NODE_IDS (was paywalled, now free per D-12)"
  - "FREE_TIER_SUMMARY counts updated: rhythm 4->6, total 23->25, bossNodeCount 5->4"
  - "Plan 01-10 (deploy gate) has its target artifact (the migration file) ready to apply"
affects:
  [01-05, 01-06, 01-07, 01-08, 01-09, 01-10, future-rhythm-content-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Atomic Supabase migration (BEGIN/COMMIT) wrapping data-wipe + is_free_node CREATE OR REPLACE in one transaction (D-13 atomic ordering)"
    - "Pre/post-flight DO blocks with RAISE NOTICE for forensic logging; RAISE EXCEPTION as defense-in-depth on post-flight invariant failure"
    - "JS-side FREE_BOSS_*_NODE_IDS sub-export pattern — keeps boss free overrides composable without polluting per-category content arrays"

key-files:
  created:
    - supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql
  modified:
    - src/config/subscriptionConfig.js
    - src/config/subscriptionConfig.test.js

key-decisions:
  - "Case A boss-routing chosen: removed boss_rhythm_1 from PAYWALL_BOSS_NODE_IDS and added new FREE_BOSS_RHYTHM_NODE_IDS export spread into FREE_NODE_IDS — smallest structural delta vs. inlining the ID directly"
  - "Pre-existing subscriptionConfig.test.js updated to reflect new D-12 invariants (Rule 1 deviation) rather than skipped — its hardcoded counts (5 paywalled bosses, total 23, bossNodeCount 5) directly contradicted D-12 truth and would block CI"
  - "Migration NOT pushed (per plan + D-13 ordering); Plan 01-10 owner-gated supabase db push"

patterns-established:
  - "Phase 1 v3.5 atomic-migration template: pre-flight COUNT + total_xp snapshot, scoped DELETE, conditional IF EXISTS for env-variant tables, CREATE OR REPLACE FUNCTION with whitelist ARRAY, post-flight verification with RAISE EXCEPTION trip-wire, all in BEGIN/COMMIT"
  - "Free-tier mirror invariant: JS FREE_NODE_IDS Set membership === SQL is_free_node() ANY(ARRAY) membership; enforced by freeNodes.parity.test.js as a regression gate"

requirements-completed: [REQ-05, REQ-06]

# Metrics
duration: 7min
completed: 2026-06-01
---

# Phase 01 Plan 04: Atomic Rhythm Migration + Paywall Mirror Sync Summary

**Authored Supabase migration wiping rhythm trail progress and replacing `is_free_node()` with the D-12 whitelist (all 6 U1 IDs); JS `FREE_NODE_IDS` Set updated in lockstep so the parity gate goes RED → GREEN. Migration file committed but NOT deployed — Plan 01-10 owner-gated.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-01T19:10:30Z (approx, from session resume)
- **Completed:** 2026-06-01T19:17:14Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Authored `supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql` — single transaction with rhythm-progress wipe + `is_free_node()` body replacement
- Updated `FREE_RHYTHM_NODE_IDS` from 4 IDs (1_1, 1_3, 1_4, 1_6) to 5 IDs (1_1..1_5) per D-12
- Introduced `FREE_BOSS_RHYTHM_NODE_IDS = ['boss_rhythm_1']` and spread it into `FREE_NODE_IDS` Set; removed `boss_rhythm_1` from `PAYWALL_BOSS_NODE_IDS`
- `freeNodes.parity.test.js` (the RED test pinned by Plan 01-01) now GREEN — JS Set membership exactly mirrors SQL whitelist
- Updated `FREE_TIER_SUMMARY` counts (rhythm 4→6, total 23→25, bossNodeCount 5→4)
- Updated pre-existing `subscriptionConfig.test.js` to assert new D-12 invariants (Rule 1 fix — test was pinning outdated values that would block CI)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update JS FREE_RHYTHM_NODE_IDS per D-12** — `a8f40aa` (feat)
2. **Task 2: Author Supabase migration (atomic wipe + is_free_node replace)** — `001f3d8` (feat)

_Note: Pre-commit Husky hook ran ESLint + Prettier on staged JS files; no fixes needed._

## Files Created/Modified

- `supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql` (CREATED, 114 lines) — Atomic transaction. Pre-flight DO block logs rhythm row count + `SUM(total_xp)` from `students`. Scoped DELETE on `student_skill_progress WHERE node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%'`. Conditional `IF EXISTS` cleanup of `student_unit_progress` rhythm*unit*% rows. CREATE OR REPLACE `is_free_node()` with the 25-ID whitelist (treble 7 + bass 6 + rhythm 5 + boss_rhythm_1 + ear 6). GRANT EXECUTE + COMMENT ON FUNCTION + COMMENT ON TABLE. Post-flight DO block verifies post-DELETE rhythm row count = 0, RAISE EXCEPTION if not.
- `src/config/subscriptionConfig.js` (MODIFIED) — `FREE_RHYTHM_NODE_IDS` array updated to 5 IDs; new `FREE_BOSS_RHYTHM_NODE_IDS` export; `boss_rhythm_1` removed from `PAYWALL_BOSS_NODE_IDS` with inline reference comment; `FREE_NODE_IDS` Set now spreads `FREE_BOSS_RHYTHM_NODE_IDS`; `FREE_TIER_SUMMARY` numbers refreshed.
- `src/config/subscriptionConfig.test.js` (MODIFIED) — Three assertions updated: `PAYWALL_BOSS_NODE_IDS` length 5→4 + negative assertion `not.toContain('boss_rhythm_1')`; `FREE_NODE_IDS Set` size 23→25 with explicit +1 boss accounting; `FREE_TIER_SUMMARY` rhythm/total/bossNodeCount updated.

## Decisions Made

- **Case A boss routing (vs Case B inline):** The action step offered two patterns for getting `boss_rhythm_1` into `FREE_NODE_IDS`. I chose Case A (new `FREE_BOSS_RHYTHM_NODE_IDS` sub-export) because (a) the existing pattern already has per-category arrays spread into the Set, so this minimizes deviation from established structure; (b) future free boss additions can extend the same pattern without re-architecting; (c) it keeps the rhythm content array semantically pure (content nodes only) while making the boss-free decision visible as its own named constant.
- **Rule 1 fix to pre-existing test:** `subscriptionConfig.test.js` had three assertions hardcoded to the pre-D-12 counts (`PAYWALL_BOSS_NODE_IDS.length === 5`, `FREE_NODE_IDS.size === 23`, `FREE_TIER_SUMMARY.total === 23`). Leaving them stale would break `npm test` and block CI. The fix is in-scope per Rule 1 (bug: assertions contradicted the very source of truth they exist to pin) — applied directly and committed with Task 1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated pre-existing subscriptionConfig.test.js to reflect new D-12 invariants**

- **Found during:** Task 1 (config update)
- **Issue:** `subscriptionConfig.test.js` had three hardcoded assertions pinning the pre-Phase-1 counts: `PAYWALL_BOSS_NODE_IDS.toHaveLength(5)`, `FREE_NODE_IDS.size === 23`, `FREE_TIER_SUMMARY.total === 23` and `bossNodeCount === 5`. After the D-12 update these became RED, breaking CI.
- **Fix:** Updated the three assertions: boss-paywall length 5→4 + added `not.toContain('boss_rhythm_1')` regression guard; FREE_NODE_IDS Set size 23→25 with `+1` boss accounting in the computed expected sum; FREE_TIER_SUMMARY assertions extended to also pin `rhythm: {count: 6}` and updated total/bossNodeCount.
- **Files modified:** `src/config/subscriptionConfig.test.js`
- **Verification:** `npx vitest run src/config/` → 10/10 passing (was 7/10).
- **Committed in:** `a8f40aa` (Task 1 commit — bundled with the source change it covers, per atomic-commit principle)

---

**Total deviations:** 1 auto-fixed (1 bug — stale test assertion)
**Impact on plan:** Necessary for CI health. No scope creep — the test exists explicitly to pin these constants and had to track the source of truth.

## Issues Encountered

None. Verify commands ran clean. The migration file passed all 13 grep acceptance gates on first write (template was already production-grade from the plan's `<action>` block).

## Threat Surface Notes

Plan's `<threat_model>` had four mitigations (T-04-01..04). Verification of mitigations as shipped:

- **T-04-01 (DELETE predicate scoping):** WHERE clause is exactly `node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%'`. No other LIKE patterns appear. Verified via `grep -c "rhythm_%"` returns 6 (matches in pre-flight COUNT, DELETE, post-flight COUNT, and unit-level conditional).
- **T-04-02 (whitelist parity):** Rhythm IDs in `ARRAY` are exactly 6: `rhythm_1_1..5 + boss_rhythm_1`. Parity test asserts JS Set matches verbatim.
- **T-04-03 (total_xp untouched):** `grep -cE "UPDATE.*students_score|DELETE FROM students_score|DELETE FROM students " <migration>` returns 0. Only READ-ONLY `SELECT COALESCE(SUM(total_xp), 0) FROM students` appears in pre/post-flight DO blocks.
- **T-04-04 (forensic logging):** Pre-flight RAISE NOTICE logs rhythm-row count and total_xp snapshot; post-flight RAISE NOTICE logs post-DELETE counts; post-flight RAISE EXCEPTION trips if any rhythm rows survive.

No new threat surface introduced. The migration ADD a `CREATE OR REPLACE FUNCTION` definition that was already in the threat register (the function exists today; this is a body swap not a new function).

## User Setup Required

None for this plan — migration is committed to repo but NOT applied. Owner sign-off + `supabase db push` is gated to Plan 01-10 per D-13 deploy ordering.

## Next Phase Readiness

- **Plan 01-05/06/07/08 (Wave 2 unit-data plans):** Unblocked. They can now reference `boss_rhythm_1` as a free node and `rhythm_1_5` as the new U1 terminus.
- **Plan 01-10 (deploy gate):** Has the migration artifact ready at the canonical path. The `[BLOCKING]` task is: owner runs `supabase db push` to apply this migration BEFORE Netlify code deploy.
- **freeNodes.parity.test.js:** Now a permanent regression gate. Any future drift between JS `FREE_RHYTHM_NODE_IDS + boss_rhythm_1` and the SQL whitelist will trip CI.

## Self-Check: PASSED

Verified before SUMMARY commit:

- `src/config/subscriptionConfig.js` exists with `rhythm_1_5` present, `rhythm_1_6` absent, `FREE_BOSS_RHYTHM_NODE_IDS` exported — FOUND
- `supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql` exists, 114 lines, all 13 grep gates pass — FOUND
- `src/config/subscriptionConfig.test.js` updated, 10/10 passing — FOUND
- Commit `a8f40aa` (Task 1) in `git log` — FOUND
- Commit `001f3d8` (Task 2) in `git log` — FOUND
- `freeNodes.parity.test.js` GREEN — VERIFIED

---

_Phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units_
_Completed: 2026-06-01_
