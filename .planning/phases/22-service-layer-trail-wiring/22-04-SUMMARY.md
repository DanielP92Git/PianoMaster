---
phase: 22-service-layer-trail-wiring
plan: "04"
subsystem: build-validator
tags: [validation, build-tools, rhythm-trail, safety-net]
requirements: [PAT-06]

dependency_graph:
  requires: [22-02, 22-03]
  provides: [build-time enforcement of Phase 22 migration invariants]
  affects: [scripts/validateTrail.mjs]

tech_stack:
  added: []
  patterns:
    - "RHYTHM_PATTERNS and PATTERN_TAGS already imported — extend, not re-import"
    - "Category + exercise-type dual-guard for legacy field check (sight_reading exempt)"
    - "NODE_TYPE_EXERCISE_POLICY map enforces game-type policy from curriculum audit"

key_files:
  modified:
    - scripts/validateTrail.mjs

decisions:
  - "validateLegacyRhythmPatterns skips sight_reading exercises — rhythmPatterns is a legitimate notation-renderer field in that context, not the legacy rhythm-game format"
  - "validateNodeTypeExerciseTypeMapping only evaluates rhythm + boss-with-rhythm nodes; other categories are exempt"
  - "RHYTHM_PULSE exercise type is exempted from the policy check when config.pulseOnly is true (special case for rhythm_1_1)"

metrics:
  duration_minutes: 25
  completed_date: "2026-04-06"
  tasks_completed: 2
  files_modified: 1
---

# Phase 22 Plan 04: Build Validator Safety Net Summary

Three new validation functions added to `scripts/validateTrail.mjs` to permanently enforce the Phase 22 migration invariants: legacy-field rejection, pattern tag/ID reference checking, and nodeType-to-exercise-type policy enforcement.

## What Was Built

`scripts/validateTrail.mjs` now has 11 validation functions. The three additions enforce Phase 22 migration correctness at build time:

**`validateLegacyRhythmPatterns()`** — Detects any rhythm-type exercise that still has the pre-migration `rhythmPatterns` field. Only checks rhythm-type exercises (rhythm, rhythm_tap, rhythm_dictation, arcade_rhythm, rhythm_pulse); sight_reading exercises legitimately use `rhythmPatterns` for notation rendering and are exempt.

**`validatePatternTagReferences()`** — Validates every `patternTags` entry against the canonical `PATTERN_TAGS` array and every `patternIds` entry against the `RHYTHM_PATTERNS` id set. Guards against typos and dangling references after tag/ID renames.

**`validateNodeTypeExerciseTypeMapping()`** — Enforces the curriculum-audit game-type policy (D-17): discovery nodes must use rhythm_tap or rhythm_dictation, speed_round/boss use arcade_rhythm, etc. RHYTHM_PULSE exercises are exempted when `config.pulseOnly === true` (the pulse exercise on rhythm_1_1).

`validateRhythmPatternNames()` was updated with a clarifying comment explaining why it still exists post-migration (safety net for sight_reading exercise notation config), and its success message now reads "OK (no legacy fields found)".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Exempt sight_reading exercises from legacy rhythmPatterns check**

- **Found during:** Task 1 — running `npm run verify:trail` after initial implementation
- **Issue:** The plan's `validateLegacyRhythmPatterns()` code iterates all exercises on boss/rhythm nodes and flags any `rhythmPatterns` field. However, treble/bass boss nodes use `rhythmPatterns` inside SIGHT_READING exercises as a legitimate notation-renderer field (controls which duration values appear in generated notation). These 18 exercises were being incorrectly flagged as migration errors.
- **Fix:** Added a `RHYTHM_EXERCISE_TYPES` set inside `validateLegacyRhythmPatterns()` and added `if (!RHYTHM_EXERCISE_TYPES.has(exercise.type)) continue;` to skip non-rhythm exercises. Sight_reading exercises no longer trigger the check.
- **Files modified:** `scripts/validateTrail.mjs`
- **Commit:** 690b97e

## Verification Results

```
npm run verify:trail — PASSED (all 11 validators, 185 nodes)
npm run build       — PASSED (43.87s, prebuild hook ran cleanly)
npm run test:run    — 6 pre-existing failures unrelated to Plan 04 changes
                      (appNavigationConfig, AppSettings, xpSystem, NoteSpeedCards,
                       NotesRecognitionGame.autogrow, SightReadingGame.micRestart)
```

Regression check: `grep -c 'validateLegacyRhythmPatterns|validatePatternTagReferences|validateNodeTypeExerciseTypeMapping' scripts/validateTrail.mjs` returns 7 (function definitions + call sites + comment reference).

## Commits

| Hash    | Message                                                                     |
| ------- | --------------------------------------------------------------------------- |
| 690b97e | feat(22-04): extend validateTrail.mjs with 3 Phase 22 safety-net validators |

## Known Stubs

None. This plan only modifies a build-time script with no UI components.

## Self-Check: PASSED

- `scripts/validateTrail.mjs` exists and contains all 3 new functions: CONFIRMED
- Commit 690b97e exists in git log: CONFIRMED
- `npm run verify:trail` exits with code 0: CONFIRMED
- `npm run build` exits with code 0: CONFIRMED
