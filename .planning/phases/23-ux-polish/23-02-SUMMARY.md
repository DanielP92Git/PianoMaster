---
phase: 23-ux-polish
plan: "02"
subsystem: rhythm-trail-data
tags: [rhythm, trail, measureCount, multi-stave, vexflow, curated-patterns]
dependency_graph:
  requires: []
  provides: [measureCount-policy, multi-stave-rendering, curated-pattern-feed]
  affects:
    [RhythmReadingGame, RhythmStaffDisplay, validateTrail, rhythm-unit-files]
tech_stack:
  added: []
  patterns:
    [
      multi-stave-vexflow,
      resolveByTags-curated-feed,
      build-time-policy-enforcement,
    ]
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
    - scripts/validateTrail.mjs
    - src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx
    - src/components/games/rhythm-games/RhythmReadingGame.jsx
decisions:
  - "measureCount enforced at build time via validateMeasureCountPolicy() in validateTrail.mjs — drift prevented after Phase 23 data migration"
  - "RhythmStaffDisplay measures prop wraps single beats array for backward compat — no callers broken"
  - "fetchNewPattern is still async to support legacy getPattern path; resolveByTags path runs synchronously within the async wrapper"
metrics:
  duration: ~45min
  completed: "2026-04-07"
  tasks: 2
  files: 11
---

# Phase 23 Plan 02: Progressive Measure Lengths Summary

Progressive measure length enforcement across the rhythm trail: Discovery=1-bar, Practice=2-bar, Speed/Boss=4-bar. 30 exercise configs updated, build-time policy added, RhythmStaffDisplay extended for multi-stave rendering, RhythmReadingGame switched to curated pattern API.

## Tasks Completed

| Task | Name                                                        | Commit  | Files                                         |
| ---- | ----------------------------------------------------------- | ------- | --------------------------------------------- |
| 1    | Bulk update measureCount in unit files + validator policy   | f682093 | rhythmUnit1-8Redesigned.js, validateTrail.mjs |
| 2    | Multi-stave RhythmStaffDisplay + resolveByTags curated feed | 409a396 | RhythmStaffDisplay.jsx, RhythmReadingGame.jsx |

## What Was Built

### Task 1: measureCount Policy Enforcement

Updated 30 exercise configs across 8 rhythm unit files to match the nodeType-to-measureCount policy:

| nodeType    | Expected measureCount | Nodes Updated                                                                                                               |
| ----------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| discovery   | 1                     | Already correct — verified                                                                                                  |
| practice    | 2                     | rhythm_1_2, \_1_4, \_2_2, \_2_4, \_3_2, \_3_4, \_4_2, \_4_4, \_5_2, \_5_5, \_6_2, \_6_4, \_7_2, \_8_2, \_8_4 (15 exercises) |
| mix_up      | 1                     | Already correct — verified                                                                                                  |
| speed_round | 4                     | rhythm_1_6, \_2_6, \_3_6, \_4_6, \_5_6, \_6_6, \_7_6, \_8_6 (8 exercises)                                                   |
| mini_boss   | 4                     | boss_rhythm_1, \_2, \_3, \_4, \_7 + boss_rhythm_5 x2 (7 exercises)                                                          |
| boss        | 4                     | boss_rhythm_6, boss_rhythm_8 — already correct                                                                              |

Added `validateMeasureCountPolicy()` to `scripts/validateTrail.mjs` with `MEASURE_COUNT_POLICY` object. The function runs after `validateNodeTypeExerciseTypeMapping()` in the main execution block. Pulse exercises (`pulseOnly: true`) are exempt from the policy.

`npm run verify:trail` passes with "MeasureCount policy: OK".

### Task 2: Multi-stave RhythmStaffDisplay

Extended `RhythmStaffDisplay` with a `measures` prop (array of beat arrays):

- When `measures` provided: renders one VexFlow `Stave` per measure side-by-side horizontally
- When only `beats` provided: wraps into `[beats]` for single-stave backward compat
- All notes across all staves collected into flat `allNotes` array for cursor/tap index mapping
- `onStaveBoundsReady` reports `noteStartX: 10` and `noteEndX: containerWidth - 10` spanning all staves

### Task 2: resolveByTags feed in RhythmReadingGame

- Added `resolveByTags` to imports alongside `getPattern`
- Extracted `patternTags` and `trailMeasureCount` from `nodeConfig`
- Added `currentMeasures` state (reset alongside `currentBeats` on nodeId change)
- `fetchNewPattern` now:
  - **Trail mode** (patternTags present): calls `resolveByTags(patternTags, { difficulty, measureCount: trailMeasureCount })`, converts VexFlow duration codes to `{durationUnits, isRest}` objects, returns `{ beats: flatBeats, measures: measuresResult, binaryPattern: null }`
  - **Free-practice mode** (no patternTags): calls legacy `getPattern()`, returns `{ beats, measures: null, binaryPattern }`
- `<RhythmStaffDisplay>` now receives `measures={currentMeasures}` prop

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npm run verify:trail`: passes with "MeasureCount policy: OK" (XP variance warning is pre-existing, unrelated)
- `npm run build`: succeeds with no import errors (chunk size warnings are pre-existing)
- All 30 exercise configs confirmed correct by validator

## Known Stubs

None — all data is wired. Trail mode exercises will use curated patterns via resolveByTags when `patternTags` is present in nodeConfig.

## Threat Flags

None — this plan modifies trail data files, build validator, and game rendering only. No auth, network, or data storage changes.

## Self-Check: PASSED

- f682093 confirmed in git log
- 409a396 confirmed in git log
- scripts/validateTrail.mjs contains `function validateMeasureCountPolicy`
- scripts/validateTrail.mjs contains `validateMeasureCountPolicy();` in main execution block
- RhythmStaffDisplay.jsx accepts `measures` prop
- RhythmReadingGame.jsx imports `resolveByTags`
- RhythmReadingGame.jsx contains `currentMeasures` state
- npm run build exits 0
