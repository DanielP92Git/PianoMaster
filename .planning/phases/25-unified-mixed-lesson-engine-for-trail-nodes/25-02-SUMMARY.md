---
phase: 25-unified-mixed-lesson-engine-for-trail-nodes
plan: 02
subsystem: trail-system
tags: [exercise-type, routing, validation, i18n]
dependency_graph:
  requires: []
  provides:
    [
      MIXED_LESSON constant,
      /rhythm-mode/mixed-lesson route,
      validateMixedLessons validator,
    ]
  affects:
    [
      constants.js,
      App.jsx,
      AppLayout.jsx,
      TrailNodeModal.jsx,
      trail.json (en/he),
      validateTrail.mjs,
    ]
tech_stack:
  added: []
  patterns:
    [
      lazyWithRetry route registration,
      LANDSCAPE_ROUTES + gameRoutes dual-array,
      switch-case trail navigation,
    ]
key_files:
  created: []
  modified:
    - src/data/constants.js
    - src/components/trail/TrailNodeModal.jsx
    - src/App.jsx
    - src/components/layout/AppLayout.jsx
    - src/locales/en/trail.json
    - src/locales/he/trail.json
    - scripts/validateTrail.mjs
decisions:
  - "No AudioContextProvider wrapper on mixed-lesson route -- mixed lesson has no mic/audio API usage"
  - "RENDERER_TYPES set uses visual_recognition and syllable_matching as valid question types for build-time validation"
metrics:
  duration: 103s
  completed: 2026-04-09T21:14:07Z
  tasks_completed: 2
  tasks_total: 2
  files_modified: 7
---

# Phase 25 Plan 02: Register MIXED_LESSON Type, Route, Validator Summary

MIXED_LESSON exercise type registered system-wide with route, TrailNodeModal navigation, i18n, and build-time validator enforcing data integrity for mixed_lesson question configs.

## What Was Done

### Task 1: Register MIXED_LESSON exercise type, route, TrailNodeModal, and i18n

- Added `MIXED_LESSON: 'mixed_lesson'` to `EXERCISE_TYPES` in constants.js
- Added `case 'mixed_lesson'` to both `getExerciseTypeName` (display name) and `navigateToExercise` (navigation) switch statements in TrailNodeModal
- Registered lazy-loaded `MixedLessonGame` import in App.jsx pointing to `./components/games/rhythm-games/MixedLessonGame`
- Added `/rhythm-mode/mixed-lesson` to LANDSCAPE_ROUTES array (App.jsx) and gameRoutes array (AppLayout.jsx)
- Added Route element: `<Route path="/rhythm-mode/mixed-lesson" element={<MixedLessonGame />} />` (no AudioContextProvider wrapper)
- Added i18n key `"mixed_lesson": "Mixed Lesson"` in EN locale and `"mixed_lesson": "שיעור משולב"` in HE locale
- **Commit:** `11dc375`

### Task 2: Extend build validator for mixed_lesson exercises

- Added `RENDERER_TYPES` Set with `visual_recognition` and `syllable_matching`
- Added `validateMixedLessons()` function with 4 validation rules:
  1. Node must have `rhythmConfig` (error if missing)
  2. `config.questions` must be a non-empty array (error if missing)
  3. Each question must have a valid `type` from RENDERER_TYPES (error if invalid)
  4. Question count should be 8-10 (warning, not error)
- Added `validateMixedLessons()` call in main execution block after `validateRhythmPatternNames()`
- Validator passes cleanly: "Mixed lessons: OK" (no mixed_lesson exercises exist yet)
- **Commit:** `60fbde3`

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `MIXED_LESSON` constant exists in constants.js
2. TrailNodeModal has both switch cases for `mixed_lesson`
3. Route `/rhythm-mode/mixed-lesson` in LANDSCAPE_ROUTES, gameRoutes, and Route element
4. i18n keys present in both EN and HE locales
5. `validateMixedLessons()` function and call present in validator
6. `npm run verify:trail` exits 0 with "Mixed lessons: OK" output

## Commits

| Task | Commit    | Description                                                                       |
| ---- | --------- | --------------------------------------------------------------------------------- |
| 1    | `11dc375` | feat(25-02): register MIXED_LESSON exercise type, route, TrailNodeModal, and i18n |
| 2    | `60fbde3` | feat(25-02): extend build validator for mixed_lesson exercises                    |

## Self-Check: PASSED

All 7 modified files verified on disk. Both commit hashes (11dc375, 60fbde3) found in git log.
