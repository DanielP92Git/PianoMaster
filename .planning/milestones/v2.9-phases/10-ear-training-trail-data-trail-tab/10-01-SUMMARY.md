---
phase: 10-ear-training-trail-data-trail-tab
plan: 01
subsystem: data
tags: [ear-training, trail-nodes, pitch-comparison, interval-id, vitest, tdd]

# Dependency graph
requires:
  - phase: 09-ear-training-games
    provides: PITCH_COMPARISON and INTERVAL_ID game components + exercise type constants
  - phase: 07-data-foundation-trailmap-refactor
    provides: TRAIL_TAB_CONFIGS with pre-wired ear_training tab + EXPANDED_NODES pattern
provides:
  - 14 ear training trail nodes across 2 unit files (earTrainingUnit1.js, earTrainingUnit2.js)
  - EXPANDED_EAR_TRAINING_NODES category export in expandedNodes.js
  - EAR_1 and EAR_2 UNITS entries in skillTrail.js UNITS map
  - Ear Training tab now populated — renders automatically via pre-existing TRAIL_TAB_CONFIGS
affects:
  - Phase 11 (Arcade Rhythm + Rhythm Remapping): trail node authoring pattern
  - TrailMap.jsx: reads EXPANDED_EAR_TRAINING_NODES via EXPANDED_NODES

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ear training node shape: no noteConfig/rhythmConfig fields — config embedded in exercises[].config"
    - "TDD flow for data files: RED commit (test), GREEN commit (impl), verify:trail confirms registration"
    - "Both named and default exports required: named for test imports, default for expandedNodes.js spreading"

key-files:
  created:
    - src/data/units/earTrainingUnit1.js
    - src/data/units/earTrainingUnit2.js
    - src/data/units/earTrainingUnit1.test.js
    - src/data/units/earTrainingUnit2.test.js
  modified:
    - src/data/expandedNodes.js
    - src/data/skillTrail.js

key-decisions:
  - "Ear training nodes omit noteConfig/rhythmConfig — all game config lives in exercises[].config (pitch_comparison and interval_id don't use VexFlow or metronome)"
  - "Unit 1 PITCH_COMPARISON intervals shrink across nodes: wide (6-12) → narrow (1-2) per D-01/D-03"
  - "Unit 2 INTERVAL_ID allowedCategories expand: step → skip → leap → mixed → all → descending per D-04"
  - "boss_ear_1 has 2 PITCH_COMPARISON exercises (wide then narrow); boss_ear_2 has INTERVAL_ID + PITCH_COMPARISON per D-10/D-11"

patterns-established:
  - "Ear training node: exercises[].config contains notePool, questionCount, intervalRange (PITCH_COMPARISON) or allowedCategories + ascendingRatio (INTERVAL_ID)"
  - "Boss node for ear training: category: 'boss', nodeType: MINI_BOSS, isBoss: true, xpReward: 100, 2 exercises, accessoryUnlock set"

requirements-completed: [EAR-01, EAR-02, EAR-03, EAR-05]

# Metrics
duration: 5min
completed: 2026-03-29
---

# Phase 10 Plan 01: Ear Training Trail Data Summary

**14 ear training trail nodes authored across 2 unit files (Sound Direction + Interval Explorer) with validateTrail passing 185 nodes and build succeeding**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-29T17:55:00Z
- **Completed:** 2026-03-29T17:59:11Z
- **Tasks:** 2
- **Files modified:** 6 (2 new unit files, 2 new test files, expandedNodes.js, skillTrail.js)

## Accomplishments

- Authored 7 nodes for Unit 1 "Sound Direction" (ear_1_1 through ear_1_6 + boss_ear_1) using PITCH_COMPARISON with shrinking interval ranges (wide 6-12 to narrow 1-2)
- Authored 7 nodes for Unit 2 "Interval Explorer" (ear_2_1 through ear_2_6 + boss_ear_2) using INTERVAL_ID with expanding allowedCategories (step → skip → leap → all → descending)
- Registered all 14 nodes in EXPANDED_NODES via expandedNodes.js; added EXPANDED_EAR_TRAINING_NODES export and EAR_1/EAR_2 UNITS entries in skillTrail.js
- Trail validation passes: 185 nodes total, no broken prereqs, no cycles, no duplicate IDs, all exercise types valid
- Full production build succeeds with prebuild validateTrail hook passing
- 46 TDD tests covering node structure, prerequisites, exercise types, interval progression (all pass)
- Ear Training tab will render automatically via pre-existing TRAIL_TAB_CONFIGS in constants.js

## Task Commits

Each task was committed atomically:

1. **Test (TDD RED): earTrainingUnit1 and earTrainingUnit2 test files** - `12ca4e4` (test)
2. **Task 1: Author earTrainingUnit1.js and earTrainingUnit2.js** - `3a25038` (feat)
3. **Task 2: Register nodes in expandedNodes and UNITS in skillTrail** - `9304710` (feat)

_Note: TDD tasks have multiple commits (test → feat)_

## Files Created/Modified

- `src/data/units/earTrainingUnit1.js` - Unit 1 "Sound Direction", 7 PITCH_COMPARISON nodes (orders 156-162), named + default export
- `src/data/units/earTrainingUnit2.js` - Unit 2 "Interval Explorer", 7 INTERVAL_ID nodes (orders 163-169), named + default export
- `src/data/units/earTrainingUnit1.test.js` - 22 tests asserting node structure, prerequisites, intervals, boss properties
- `src/data/units/earTrainingUnit2.test.js` - 24 tests asserting node structure, prerequisites, allowedCategories, boss properties
- `src/data/expandedNodes.js` - Added ear training imports, spreads into EXPANDED_NODES, EXPANDED_EAR_TRAINING_NODES export
- `src/data/skillTrail.js` - Added EAR_1 and EAR_2 entries to UNITS map with category EAR_TRAINING

## Decisions Made

- Ear training nodes omit noteConfig and rhythmConfig fields entirely — the pitch_comparison and interval_id game components don't use VexFlow or metronome; all config lives in exercises[].config directly
- Interval shrinkage in Unit 1 follows D-01/D-03: node 1 at {min:6, max:12}, node 5 at {min:1, max:2}
- Category expansion in Unit 2 follows D-04: node 1 step-only, node 5 all three, node 6 all with ascendingRatio:0.2 for descending focus
- Boss nodes per D-10/D-11: boss_ear_1 uses 2 PITCH_COMPARISON exercises (wide then narrow), boss_ear_2 uses INTERVAL_ID then PITCH_COMPARISON for mixed challenge

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Trail validation and build passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ear Training tab is fully populated — 14 nodes are in EXPANDED_NODES, TRAIL_TAB_CONFIGS was pre-wired in Phase 7
- Plan 02 (Trail Tab UI verification + dailyGoalsService audit per STATE.md blocker) can proceed
- Known STATE.md concern: audit dailyGoalsService.js for hardcoded category arrays before ear training games ship (Phase 9 flag)

## Self-Check: PASSED

- earTrainingUnit1.js: FOUND
- earTrainingUnit2.js: FOUND
- 10-01-SUMMARY.md: FOUND
- Commit 12ca4e4 (test): FOUND
- Commit 3a25038 (feat): FOUND
- Commit 9304710 (feat): FOUND

---
*Phase: 10-ear-training-trail-data-trail-tab*
*Completed: 2026-03-29*
