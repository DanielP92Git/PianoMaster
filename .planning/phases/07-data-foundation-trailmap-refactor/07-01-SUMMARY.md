---
phase: 07-data-foundation-trailmap-refactor
plan: 01
subsystem: data-constants
tags: [constants, validation, i18n, tdd, infrastructure]
dependency_graph:
  requires: []
  provides:
    - EXERCISE_TYPES with 11 entries (6 existing + 5 new v2.9 types)
    - NODE_CATEGORIES with 5 entries (+ EAR_TRAINING)
    - TRAIL_TAB_CONFIGS array (4 tab config entries)
    - validateExerciseTypes() build-time validation in validateTrail.mjs
    - EAR_TRAINING color entry in nodeTypeStyles.js
    - i18n keys for ear_training tab and 5 new exercise types (en + he)
  affects:
    - Plan 02 (TrailMap refactor consumes TRAIL_TAB_CONFIGS)
    - Plan 02 (TrailNodeModal routing consumes new EXERCISE_TYPES)
    - Phase 8 (rhythm games use new EXERCISE_TYPES constants)
    - Phase 9 (ear training games use new EXERCISE_TYPES constants)
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN cycle with vitest
    - Build-time validation extending existing validateTrail.mjs pattern
    - lucide-react icons imported in constants.js (external package, no circular risk)
key_files:
  created: []
  modified:
    - src/data/constants.js
    - src/data/constants.test.js
    - scripts/validateTrail.mjs
    - src/utils/nodeTypeStyles.js
    - src/locales/en/trail.json
    - src/locales/he/trail.json
decisions:
  - constants.js imports lucide-react directly (external package, safe per research Pitfall 1)
  - Hebrew translations for new keys use English placeholders (Phase 8 scope for full Hebrew i18n)
  - validateExerciseTypes() hard-fails on unknown types (D-07), checks type string only, not config shape (D-08)
metrics:
  duration: "4 minutes"
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_modified: 6
---

# Phase 7 Plan 1: Data Foundation Constants Summary

**One-liner:** Extended constants.js with 11 EXERCISE_TYPES, 5 NODE_CATEGORIES, and TRAIL_TAB_CONFIGS array; added build-time exercise type validation; extended nodeTypeStyles.js and i18n locale files for EAR_TRAINING support.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Extend constants.js with EXERCISE_TYPES, NODE_CATEGORIES, TRAIL_TAB_CONFIGS (TDD) | df79e7d |
| 2 | Extend validateTrail.mjs, nodeTypeStyles.js, and i18n locale files | 06ed77b |

## What Was Built

### Task 1: constants.js Extension (TDD)

Followed RED/GREEN TDD cycle:

**RED phase:** Added 16 test cases to `constants.test.js` covering all 5 new EXERCISE_TYPES, EAR_TRAINING in NODE_CATEGORIES, TRAIL_TAB_CONFIGS shape/length/ordering. All 11 new tests failed as expected.

**GREEN phase:** Modified `constants.js` to:
- Import `{ Music, Music2, Drum, Ear }` from `lucide-react` (safe — external package)
- Add `EAR_TRAINING: 'ear_training'` to `NODE_CATEGORIES`
- Add 5 new entries to `EXERCISE_TYPES`: RHYTHM_TAP, RHYTHM_DICTATION, ARCADE_RHYTHM, PITCH_COMPARISON, INTERVAL_ID
- Export `TRAIL_TAB_CONFIGS` array with 4 tab config objects (treble, bass, rhythm, ear_training), each with: id, label, categoryKey, icon, colorActive, colorBorder, colorGlow, bossPrefix

All 16 tests pass.

### Task 2: Build-time Validation + Styles + i18n

**validateTrail.mjs:**
- Imported `EXERCISE_TYPES` from `constants.js`
- Added `validateExerciseTypes()` function that hard-fails on unknown exercise type strings
- Called `validateExerciseTypes()` in the main execution block after `validateXPEconomy()`
- `npm run verify:trail` passes (Exercise types: OK)

**nodeTypeStyles.js:**
- Added `Ear` to the lucide-react import
- Added `if (category === NODE_CATEGORIES.EAR_TRAINING) return Ear;` in `getNodeTypeIcon()`
- Added EAR_TRAINING color entry to `colorMap` in `getCategoryColors()` with cyan-400/teal-500 palette

**i18n locale files (en + he):**
- Added `ear_training` and `ear_trainingPanel` keys to `tabs` section
- Added 5 new exercise type display name keys: rhythm_tap, rhythm_dictation, arcade_rhythm, pitch_comparison, interval_id
- Hebrew file uses English placeholders (full Hebrew translations are Phase 8 scope per INFRA-08)

## Verification Results

- `npx vitest run src/data/constants.test.js`: 16/16 tests pass
- `npm run verify:trail`: Passes (Exercise types: OK, all 171 nodes validated)
- `npm run build`: Succeeds (prebuild hook + Vite build both pass)
- Full test suite: 325 tests pass; 4 pre-existing failures due to missing VITE_SUPABASE_URL in test environment (unrelated to this plan)

## Deviations from Plan

None — plan executed exactly as written. All code followed the exact patterns specified in the plan's action blocks.

## Known Stubs

None — all data is wired. The i18n English placeholders in `he/trail.json` for new exercise types are intentional and documented (Phase 8 scope), not stubs that prevent the plan's goal from being achieved.

## Self-Check: PASSED

Files confirmed to exist:
- `src/data/constants.js` — contains TRAIL_TAB_CONFIGS, 11 EXERCISE_TYPES, EAR_TRAINING in NODE_CATEGORIES
- `src/data/constants.test.js` — contains TRAIL_TAB_CONFIGS import and 16 tests
- `scripts/validateTrail.mjs` — contains validateExerciseTypes() function and call
- `src/utils/nodeTypeStyles.js` — contains NODE_CATEGORIES.EAR_TRAINING in colorMap, Ear in import
- `src/locales/en/trail.json` — contains ear_training and rhythm_tap keys
- `src/locales/he/trail.json` — contains ear_training and rhythm_tap keys

Commits confirmed:
- df79e7d: feat(07-01): extend constants.js with EXERCISE_TYPES, NODE_CATEGORIES, TRAIL_TAB_CONFIGS
- 06ed77b: feat(07-01): extend validateTrail.mjs, nodeTypeStyles.js, and i18n locales
