---
phase: 22-service-layer-trail-wiring
plan: "04"
subsystem: rhythm-trail-data
tags: [data-migration, patternTags, rhythm-units, exercise-types]
dependency_graph:
  requires: [22-01]
  provides: [rhythm-units-5-8-patternTags]
  affects: [MixedLessonGame, ArcadeRhythmGame, RhythmPatternGenerator]
tech_stack:
  added: []
  patterns: [patternTags-in-rhythmConfig, mixed_lesson-question-sequences, arcade_rhythm-speed-round]
key_files:
  created: []
  modified:
    - src/data/units/rhythmUnit5Redesigned.js
    - src/data/units/rhythmUnit6Redesigned.js
    - src/data/units/rhythmUnit7Redesigned.js
    - src/data/units/rhythmUnit8Redesigned.js
decisions:
  - "boss_rhythm_6 kept as arcade_rhythm (BOSS type, no violation per Phase 20 audit)"
  - "boss_rhythm_8 kept as 3x arcade_rhythm (intended design for capstone boss per audit)"
  - "rhythm_7_4 focusDurations cleared to [] (eighth notes already known from Unit 3, contextual in 6/8)"
  - "rhythm_7_4 newContent changed to NONE (practice node reinforces, does not introduce)"
  - "rhythm_5_1/5_2 cumulative durations updated to include full vocabulary from Units 1-4"
metrics:
  duration_minutes: 8
  completed_date: "2026-04-12"
  tasks_completed: 2
  files_modified: 4
---

# Phase 22 Plan 04: Rhythm Units 5-8 patternTags Migration Summary

Tag-based pattern resolution migration for all 28 rhythm nodes in Units 5-8, with exercise type corrections per Phase 20 audit and one-concept violation fix on rhythm_7_4.

## What Was Built

Migrated all 28 rhythm nodes across Units 5, 6, 7, and 8 from the old `patterns: [...]` duration-allowlist format to the new `patternTags: [...]` tag-based resolution format. Every node now uses the exercise type required by the Phase 20 curriculum audit.

**Unit 5 (Magic Dots — 7 nodes):**
- `rhythm_5_1` through `rhythm_5_5`: converted to `EXERCISE_TYPES.MIXED_LESSON` with DISCOVERY or PRACTICE question sequences
- `rhythm_5_6`: converted to `EXERCISE_TYPES.ARCADE_RHYTHM` (SPEED_ROUND)
- `boss_rhythm_5`: migrated from 2x `arcade_rhythm` to single `EXERCISE_TYPES.MIXED_LESSON` with 12-question MINI_BOSS sequence
- patternTags assigned: `dotted-half`, `dotted-quarter`, `three-four`

**Unit 6 (Speed Champions — 7 nodes):**
- `rhythm_6_1` through `rhythm_6_5`: converted to `EXERCISE_TYPES.MIXED_LESSON`
- `rhythm_6_6`: converted to `EXERCISE_TYPES.ARCADE_RHYTHM` (SPEED_ROUND)
- `boss_rhythm_6`: retained as `EXERCISE_TYPES.ARCADE_RHYTHM` (BOSS type, no violation per audit)
- patternTags assigned: `sixteenth`, `quarter-eighth`, `quarter-half-whole-eighth`

**Unit 7 (Big Beats — 7 nodes):**
- `rhythm_7_1` through `rhythm_7_5`: converted to `EXERCISE_TYPES.MIXED_LESSON`
- `rhythm_7_6`: converted to `EXERCISE_TYPES.ARCADE_RHYTHM` (SPEED_ROUND)
- `boss_rhythm_7`: migrated from `arcade_rhythm` to `EXERCISE_TYPES.MIXED_LESSON` with 12-question MINI_BOSS sequence
- patternTags assigned: `six-eight`
- **ONE-CONCEPT FIX**: `rhythm_7_4` `focusDurations` cleared from `['8']` to `[]`

**Unit 8 (Off-Beat Magic — 7 nodes):**
- `rhythm_8_1` through `rhythm_8_5`: converted to `EXERCISE_TYPES.MIXED_LESSON`
- `rhythm_8_6`: converted to `EXERCISE_TYPES.ARCADE_RHYTHM` (SPEED_ROUND)
- `boss_rhythm_8`: retained as 3x `EXERCISE_TYPES.ARCADE_RHYTHM` (BOSS type, intended design per audit)
- patternTags assigned: `syncopation`, `dotted-syncopation`, `six-eight`

## Commits

| Task | Description | Commit |
| ---- | ----------- | ------ |
| 1    | Migrate rhythm Units 5-6 (14 nodes) | cffa9ce |
| 2    | Migrate rhythm Units 7-8 (14 nodes) + fix rhythm_7_4 | cfa212e |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] MIXED_LESSON and PULSE missing from constants.js in worktree**
- **Found during:** Task 1 (trail validator reported unknown exercise type)
- **Issue:** The worktree was created from an older base that predated constants.js additions. `EXERCISE_TYPES.MIXED_LESSON` resolved to `undefined`.
- **Fix:** The `git reset --soft` to `93137ea` restored the correct constants.js from the base commit (which already contained both `MIXED_LESSON` and `PULSE`). No manual edit was needed after reset.
- **Files modified:** `src/data/constants.js` (restored to HEAD state)
- **Commit:** Included in base (93137ea)

### Approach Adjustment

**Worktree base restoration:** The worktree branch was created from an older commit than expected. After running `git reset --soft 93137ea` to align with the correct base, the working tree still held old file content. An initial commit attempt accidentally staged file deletions (wave 1 files that didn't exist in the old working tree). Resolved by reverting with `git reset --soft HEAD~1` and `git checkout HEAD -- .`, then re-applying only the unit file changes before staging selectively.

## Verification Results

- `npm run verify:trail` — passed with warnings (pre-existing XP variance warning, unrelated to this plan)
- `grep -c "patterns:" rhythmUnit{5,6,7,8}Redesigned.js` — 0 matches in all 4 files
- `grep -c "patternTags:" rhythmUnit{5,6,7,8}Redesigned.js` — 7 matches per file (28 total)
- `rhythm_7_4 focusDurations: []` confirmed (line 211 in rhythmUnit7Redesigned.js)
- `boss_rhythm_8` retains 3x ARCADE_RHYTHM confirmed
- `boss_rhythm_5` migrated to MIXED_LESSON with 12 questions confirmed
- `boss_rhythm_6` retains ARCADE_RHYTHM confirmed

## Known Stubs

None. All nodes have wired patternTags that resolve through `RhythmPatternGenerator.resolveByTags()`. No placeholder data.

## Threat Flags

None. Changes are static data configuration in unit files only. No trust boundaries, network endpoints, or auth paths involved.

## Self-Check: PASSED

- `cffa9ce` — confirmed in git log
- `cfa212e` — confirmed in git log
- All 4 unit files exist and have 7 patternTags each
- Trail validator passes
