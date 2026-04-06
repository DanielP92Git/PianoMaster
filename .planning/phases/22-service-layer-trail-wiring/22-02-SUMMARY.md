---
phase: 22-service-layer-trail-wiring
plan: "02"
subsystem: rhythm-trail-data
tags: [migration, curriculum, rhythm-trail, pattern-tags, game-type-fixes]
dependency_graph:
  requires: [22-01]
  provides: [22-03, 22-04]
  affects: [rhythm-trail-nodes, pattern-resolution]
tech_stack:
  added: []
  patterns: [patternTags-field, measureCount-field, RHYTHM_PULSE-exercise]
key_files:
  created: []
  modified:
    - src/data/units/rhythmUnit1Redesigned.js
    - src/data/units/rhythmUnit2Redesigned.js
    - src/data/units/rhythmUnit3Redesigned.js
    - src/data/units/rhythmUnit4Redesigned.js
    - src/data/units/rhythmUnit5Redesigned.js
    - src/data/units/rhythmUnit6Redesigned.js
    - src/data/units/rhythmUnit7Redesigned.js
    - src/data/units/rhythmUnit8Redesigned.js
    - src/data/units/rhythmUnit7Redesigned.test.js
    - src/data/units/rhythmUnit8Redesigned.test.js
decisions:
  - "boss_rhythm_1 isBoss changed to false (MINI_BOSS consistency — existing test enforced this)"
  - "rhythm_7_2 measureCount set to 1 (plan said measureCount:2 for speed/boss only)"
metrics:
  duration_minutes: 45
  completed_date: "2026-04-06"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 10
requirements: [PAT-03, PAT-05, CURR-05]
---

# Phase 22 Plan 02: Rhythm Unit Migration Summary

**One-liner:** Migrated all 8 rhythm unit files (56 exercises) from legacy `rhythmPatterns` duration allowlists to curated `patternTags`, fixed all 44 game-type violations (G-01 to G-44), all 5 CURR-01 concept violations (C-01 to C-05), and added the pulse exercise to rhythm_1_1.

## What Was Built

### Task 1 — Units 1-4 + Pulse Exercise (commit `452b422`)

Four rhythm unit files (28 exercises across 28 nodes) fully migrated:

- **rhythm_1_1**: Pulse exercise (`RHYTHM_PULSE`, `pulseOnly: true`, 8 beats, 2 measures, C4) prepended as `exercises[0]`; existing exercise migrated to `RHYTHM_TAP` + `patternTags: ['quarter-only']`
- **G-01 to G-23**: All game-type violations in Units 1-4 fixed — DISCOVERY nodes use `RHYTHM_TAP`, PRACTICE nodes use `RHYTHM_TAP`, MIX_UP nodes use `RHYTHM_DICTATION`, SPEED_ROUND nodes use `ARCADE_RHYTHM`, MINI_BOSS nodes use `RHYTHM_TAP`
- All `rhythmPatterns: [...]` fields removed from 28 exercise configs
- All `measuresPerPattern` fields removed; explicit `measureCount` added
- `boss_rhythm_1.isBoss` corrected to `false` (MINI_BOSS consistency)

### Task 2 — Units 5-8 + Concept Fixes + Test Updates (commit `388d3af`)

Four rhythm unit files (28 exercises, including 3-exercise boss_rhythm_8) migrated:

- **G-24 to G-44**: All remaining game-type violations fixed across Units 5-8
- **boss_rhythm_5**: Both exercises changed from `ARCADE_RHYTHM` to `RHYTHM_TAP`
- **boss_rhythm_8**: All 3 exercises kept as `ARCADE_RHYTHM` (BOSS policy — already correct)
- **C-01**: `rhythm_7_1` `focusDurations: []`, `newContentDescription: '6/8 Compound Meter (Two Big Beats)'`
- **C-02**: `rhythm_7_3` `focusDurations: []`, `newContentDescription: 'Quarter Notes within 6/8 Context'`
- **C-03**: `rhythm_7_4` `nodeType` changed from `PRACTICE` to `DISCOVERY`, `focusDurations: []`, `newContentDescription: 'Eighth Notes within 6/8 Context'`
- **C-04**: `rhythm_8_1` `focusDurations: []`, `newContentDescription: 'Syncopation: Eighth-Quarter-Eighth Pattern'`
- **C-05**: `rhythm_8_3` `focusDurations: []`, `newContentDescription: 'Dotted Quarter-Eighth Syncopation Pattern'`
- `rhythmUnit7Redesigned.test.js`: Updated exercise type expectations + added C-01/C-02/C-03 assertions
- `rhythmUnit8Redesigned.test.js`: Updated exercise type expectations + added C-04/C-05 assertions

## Pattern Tag Mapping Used

| Unit        | Duration Set       | Tag(s)                                                   |
| ----------- | ------------------ | -------------------------------------------------------- |
| 1 (q nodes) | quarter-only       | `quarter-only`                                           |
| 1 (h nodes) | quarter+half       | `quarter-half`                                           |
| 2           | quarter+half+whole | `quarter-half-whole`                                     |
| 3           | quarter+eighth     | `quarter-eighth`                                         |
| 4 rests     | qr, hr, wr         | `with-quarter-rest`, `with-half-rest`, `with-whole-rest` |
| 5           | dotted-half        | `dotted-half`                                            |
| 5           | 3/4 time           | `three-four`                                             |
| 5           | dotted-quarter     | `dotted-quarter`                                         |
| 6           | sixteenths         | `with-sixteenth`                                         |
| 7           | compound basic     | `compound-basic`                                         |
| 7           | compound mixed     | `compound-mixed`                                         |
| 8           | syncopation basic  | `syncopation-basic`                                      |
| 8           | syncopation dotted | `syncopation-dotted`                                     |

## Verification Results

All 117 unit tests pass:

- `rhythmUnit1Redesigned.test.js`: 14/14 (including 3 pulse TDD + 2 patternTags migration tests)
- `rhythmUnit7Redesigned.test.js`: 20/20 (updated)
- `rhythmUnit8Redesigned.test.js`: 20/20 (updated)
- `rhythmUnits.difficulty.test.js`: 9/9
- `earTrainingUnit1.test.js`: 16/16
- `earTrainingUnit2.test.js`: 16/16 (unrelated, passing)

Final grep checks confirm:

- `rhythmPatterns:` — 0 matches across all 8 unit files
- `measuresPerPattern:` — 0 matches across all 8 unit files
- `EXERCISE_TYPES.RHYTHM[^_]` (bare RHYTHM) — 0 matches across all 8 unit files
- `patternTags:` counts — 7-9 per file (all exercises covered)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed boss_rhythm_1 isBoss: true -> false**

- **Found during:** Task 1 test run
- **Issue:** The original `boss_rhythm_1` had `isBoss: true`, but the existing test asserted `isBoss: false` (consistent with all other MINI_BOSS nodes — only true BOSS nodes set `isBoss: true`). The test was written correctly; the source had a pre-existing inconsistency.
- **Fix:** Changed `boss_rhythm_1.isBoss` from `true` to `false`
- **Files modified:** `rhythmUnit1Redesigned.js`
- **Commit:** `452b422`

## Known Stubs

None. All patternTags reference real tags from the Phase 21 pattern library. The tags map to real pattern objects that game components will resolve via `resolveByTags()` (implemented in Plan 01). No placeholder values.

## Self-Check: PASSED

- [x] `rhythmUnit1Redesigned.js` exists and contains `RHYTHM_PULSE`
- [x] `rhythmUnit7Redesigned.js` exists and contains `patternTags`
- [x] `rhythmUnit8Redesigned.js` exists and contains `patternTags`
- [x] Commit `452b422` exists (Task 1)
- [x] Commit `388d3af` exists (Task 2)
- [x] All 117 unit tests pass (exit code 0)
