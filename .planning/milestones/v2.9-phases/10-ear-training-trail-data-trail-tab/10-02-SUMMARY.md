---
phase: 10-ear-training-trail-data-trail-tab
plan: 02
subsystem: config
tags: [ear-training, subscription-gate, free-tier, tdd, vitest, supabase-migration]

# Dependency graph
requires:
  - phase: 10-01
    provides: 14 ear training trail nodes (earTrainingUnit1.js, earTrainingUnit2.js)
provides:
  - FREE_EAR_TRAINING_NODE_IDS export in subscriptionConfig.js (6 free nodes)
  - Updated PAYWALL_BOSS_NODE_IDS (5 entries, including boss_ear_1, boss_ear_2)
  - Updated FREE_NODE_IDS Set (25 total entries)
  - Updated FREE_TIER_SUMMARY (total: 25, bossNodeCount: 5, ear_training: {count: 6})
  - Supabase migration creating is_free_node() with all 25 free IDs
  - 29 tests covering ear training node data and subscription gate behavior
affects:
  - Any UI component reading FREE_TIER_SUMMARY (now shows 25 total, 5 boss nodes)
  - Postgres RLS using is_free_node() (updated after migration runs)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Defense-in-depth: JS subscriptionConfig.js + Postgres is_free_node() synchronized with same 25 IDs"
    - "TDD: tests written alongside implementation (GREEN on first run — impl done in Task 1)"
    - "CREATE OR REPLACE for Supabase migrations — never ALTER for new function creation"

key-files:
  created:
    - src/data/earTraining.test.js
    - src/config/subscriptionConfig.test.js
    - supabase/migrations/20260329000001_add_ear_training_free_nodes.sql
  modified:
    - src/config/subscriptionConfig.js
    - src/components/parent/QuickStatsGrid.test.jsx

key-decisions:
  - "6 free ear training nodes (ear_1_1 through ear_1_6) — all of Unit 1 per D-07"
  - "Both boss nodes paywalled (boss_ear_1, boss_ear_2) per D-08"
  - "FREE_TIER_SUMMARY total updated to 25 (19 existing + 6 ear training)"
  - "Postgres migration uses CREATE OR REPLACE — function did not previously exist"

requirements-completed: [EAR-04]

# Metrics
duration: 15min
completed: 2026-03-29
---

# Phase 10 Plan 02: Ear Training Free Tier Gate + Tests Summary

**Subscription gating for 14 ear training nodes: 6 free (Unit 1) and 8 premium (Unit 2 + both bosses), with synchronized JS and Postgres gates and 29 tests covering both**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-29T18:00:00Z
- **Completed:** 2026-03-29T18:10:12Z
- **Tasks:** 2
- **Files modified:** 5 (1 updated config, 1 new SQL migration, 2 new test files, 1 fixed test)

## Accomplishments

- Updated `subscriptionConfig.js` with `FREE_EAR_TRAINING_NODE_IDS` (6 IDs: ear_1_1 through ear_1_6), expanded `PAYWALL_BOSS_NODE_IDS` to 5 entries (added boss_ear_1, boss_ear_2), updated `FREE_NODE_IDS` Set to 25 entries, updated `FREE_TIER_SUMMARY` (total: 25, bossNodeCount: 5, ear_training: {count: 6})
- Created Supabase migration `20260329000001_add_ear_training_free_nodes.sql` with `CREATE OR REPLACE FUNCTION public.is_free_node()` covering all 25 free node IDs
- Created `src/data/earTraining.test.js` with 20 tests covering Unit 1 and Unit 2 node structure, IDs, categories, exercise types, prerequisites, boss properties, interval ranges
- Created `src/config/subscriptionConfig.test.js` with 9 tests validating the free tier gate (FREE_EAR_TRAINING_NODE_IDS, PAYWALL_BOSS_NODE_IDS, isFreeNode behavior, FREE_NODE_IDS.size, FREE_TIER_SUMMARY)
- All 29 new tests pass; full build succeeds; trail validation passes (185 nodes, no errors)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ear training free tier gate + Supabase migration** - `70080f3` (feat)
2. **Task 2: Create test files for ear training node data and subscription config** - `b4bbff1` (test)

## Files Created/Modified

- `src/config/subscriptionConfig.js` - Added FREE_EAR_TRAINING_NODE_IDS, expanded PAYWALL_BOSS_NODE_IDS, updated FREE_NODE_IDS + FREE_TIER_SUMMARY
- `supabase/migrations/20260329000001_add_ear_training_free_nodes.sql` - Creates/replaces is_free_node() with all 25 free IDs
- `src/data/earTraining.test.js` - 20 tests for Unit 1 and Unit 2 node structure
- `src/config/subscriptionConfig.test.js` - 9 tests for subscription gate behavior
- `src/components/parent/QuickStatsGrid.test.jsx` - Updated hardcoded node count from 171 to 185

## Decisions Made

- All Unit 1 ear training nodes (ear_1_1 through ear_1_6) are free per D-07
- Both boss nodes (boss_ear_1, boss_ear_2) are paywalled per D-08
- Unit 2 nodes (ear_2_1 through ear_2_6) are premium per D-07
- JS and Postgres gates are synchronized with the same 25 IDs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed QuickStatsGrid.test.jsx node count from 171 to 185**
- **Found during:** Task 2 (running full test suite)
- **Issue:** `QuickStatsGrid.test.jsx` expected `3/171` and `2/171` but Plan 01 added 14 nodes (185 total), causing 2 test failures. The component reads `SKILL_NODES.length` dynamically; only the test hardcoded the old count.
- **Fix:** Updated test assertions from `171` to `185` to match current SKILL_NODES count
- **Files modified:** `src/components/parent/QuickStatsGrid.test.jsx`
- **Commit:** `b4bbff1` (included in task 2 commit)

### Pre-existing failures (out of scope, not fixed)

Three test files fail due to missing `VITE_SUPABASE_URL` environment variable — pre-existing environment configuration issue unrelated to this plan:
- `src/utils/xpSystem.test.js`
- `src/components/games/notes-master-games/NoteSpeedCards.test.js`
- `src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js`

## Known Stubs

None — all free tier gates are fully implemented and wired.

## Self-Check: PASSED

Files exist:
- `src/config/subscriptionConfig.js`: FOUND
- `supabase/migrations/20260329000001_add_ear_training_free_nodes.sql`: FOUND
- `src/data/earTraining.test.js`: FOUND
- `src/config/subscriptionConfig.test.js`: FOUND

Commits exist:
- `70080f3` (feat): FOUND
- `b4bbff1` (test): FOUND

---
*Phase: 10-ear-training-trail-data-trail-tab*
*Completed: 2026-03-29*
