---
phase: 29-code-quality-data-fixes
plan: "02"
subsystem: rhythm-data
tags: [data, curriculum, i18n, pattern-generation, testing]
dependency_graph:
  requires: []
  provides:
    [rest-aware-pattern-filtering, correct-unit-i18n, combined-values-variety]
  affects:
    [MixedLessonGame, RhythmTapQuestion, trail section headers, validateTrail]
tech_stack:
  added: []
  patterns:
    [
      allowRests-option,
      durationsIncludeRests-utility,
      patternNeedsRests-helper,
      variety-smoke-test,
    ]
key_files:
  created: []
  modified:
    - src/data/patterns/RhythmPatternGenerator.js
    - src/data/patterns/RhythmPatternGenerator.test.js
    - src/locales/en/trail.json
    - src/locales/he/trail.json
    - src/data/units/rhythmUnit1Redesigned.js
    - src/data/units/rhythmUnit2Redesigned.js
    - src/data/units/rhythmUnit3Redesigned.js
    - src/data/units/rhythmUnit8Redesigned.test.js
    - scripts/validateTrail.mjs
decisions:
  - "allowRests defaults to false (safe) — callers opt-in to rests explicitly via { allowRests: true }"
  - "patternNeedsRests uses exact-gap matching (one note per onset) mirroring binaryToVexDurations algorithm"
  - "validateTrail passes allowRests:true for duration safety check — validates pattern existence not runtime rest behavior"
  - "Variety fix: add component tags alongside combo tags so random selection naturally covers all durations"
metrics:
  duration: "~20 minutes"
  completed: "2026-04-13T16:53:07Z"
  tasks_completed: 3
  files_modified: 9
---

# Phase 29 Plan 02: Data/Curriculum Fixes Summary

**One-liner:** Rest-aware pattern filtering prevents unlearned rests in early curriculum nodes; i18n corrected for all 8 rhythm unit names; combined-values nodes now produce full duration variety across sessions.

## Tasks Completed

| #   | Task                                                                  | Commit    | Files                                                 |
| --- | --------------------------------------------------------------------- | --------- | ----------------------------------------------------- |
| 1   | Add rest-aware filtering to resolveByTags (DATA-01 + DATA-02)         | `0555518` | RhythmPatternGenerator.js, .test.js                   |
| 2   | Fix section title mismatches and missing i18n keys (DATA-03)          | `0064261` | en/trail.json, he/trail.json                          |
| 3   | Ensure combined-values nodes use all durations with variety (DATA-04) | `9134abe` | rhythmUnit1/2/3Redesigned.js, test, validateTrail.mjs |

## What Was Built

### Task 1: Rest-Aware Pattern Filtering

**Root cause:** `binaryToVexDurations` generates rest codes (qr, hr) whenever a note doesn't exactly fill the gap to the next onset. Early-curriculum nodes (Units 1–3) have `durations: ["q"]` or `["q", "h"]`, but the pattern resolver selected patterns with gaps that required rests.

**Fix:** Added `patternNeedsRests(binary, durations)` helper that checks whether each gap (onset-to-onset) is exactly coverable by one available note duration — mirroring how `binaryToVexDurations` places exactly one note per onset. Updated `resolveByTags` to filter out such patterns when `allowRests: false` (the new default).

Key insight: the algorithm requires **exact gap matching** (not greedy fill), because `binaryToVexDurations` places exactly ONE note per onset and fills the remainder with rests. So gap=8 with only `["q"]` available still needs a rest (q + qr), even though greedy fill could place two quarters.

**New exports:**

- `durationsIncludeRests(durations)` — utility for callers to detect rest-enabled nodes
- `resolveByTags` now accepts `options.allowRests` (default `false`)
- `resolveByIds` now accepts `options.allowRests` (default `false`)

**Tests added:** 8 new tests covering all 5 behavior items from the plan spec.

### Task 2: i18n Unit Names

**Changes in both en/trail.json and he/trail.json:**

Added 4 missing entries:

- `Beat Builders` → "Beat Builders" / "בוני הביט"
- `Fast Note Friends` → "Fast Note Friends" / "חברים מהירים"
- `Quiet Moments` → "Quiet Moments" / "רגעי שקט"
- `Big Beats` → "Big Beats" / "פעימות גדולות"

Removed 5 stale entries (old unit names that no longer match any data file):

- `Steady Beat`, `Eighth Notes`, `Whole Notes & Rests`, `Dotted & Syncopation`, `Six-Eight Time`

### Task 3: Combined-Values Variety + validateTrail Fix

**PatternTags changes:**

- `rhythm_1_4`: `["quarter-half"]` → `["quarter-only", "quarter-half"]` — adds pure quarter patterns for contrast
- `rhythm_2_4`: `["quarter-half-whole"]` → `["quarter-half", "quarter-half-whole"]` — ensures both h and w appear
- `rhythm_3_4`: `["quarter-half-whole-eighth"]` → `["quarter-eighth", "quarter-half-whole-eighth"]` — ensures eighth-note patterns appear

**validateTrail.mjs fix:** The duration safety check now passes `allowRests: true` when calling `resolveByTags` — the validator checks whether any pattern exists for the tag, not whether patterns are rest-free at runtime. This prevents false failures for rest-tagged nodes (quarter-rest, half-rest, whole-rest).

**Variety tests:** 3 statistical smoke tests added to `rhythmUnit8Redesigned.test.js` verifying that over 20 samples, combined-values nodes produce all expected duration codes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] patternNeedsRests used greedy-fill instead of exact-gap matching**

- **Found during:** Task 1 GREEN phase — tests 1/2/4/5 still failing after first implementation
- **Issue:** Initial `patternNeedsRests` used greedy fill (subtract largest fitting duration repeatedly), which allowed gap=8 with `["q"]` through the filter. But `binaryToVexDurations` places ONE note at each onset — gap=8 with only q available still generates a rest.
- **Fix:** Rewrote `patternNeedsRests` to use exact-gap matching via a Set: each gap must exactly equal one available note duration slot size.
- **Files modified:** `src/data/patterns/RhythmPatternGenerator.js`
- **Commit:** `0555518`

**2. [Rule 3 - Blocking] validateTrail.mjs broke after allowRests defaulted to false**

- **Found during:** Task 3 verify — `npm run verify:trail` errored on 8 rest-tagged nodes
- **Issue:** `validateTrail.mjs` called `resolveByTags` without `allowRests`, which now defaults to `false`. Rest-tagged nodes (quarter-rest, half-rest, whole-rest) have patterns that inherently produce rests — all filtered out → null → validation error.
- **Fix:** Updated the duration safety check in `validateTrail.mjs` to pass `allowRests: true` with a comment explaining the rationale.
- **Files modified:** `scripts/validateTrail.mjs`
- **Commit:** `9134abe`

## Verification Results

- `npm run verify:trail` — passes with warnings (pre-existing multi-angle game warnings)
- `npx vitest run src/data/patterns/` — 35 tests pass (8 new allowRests tests)
- `npx vitest run src/data/units/` — 1021 tests pass (3 new variety tests)
- Full suite — 1607 tests pass across 58 test files (2 pre-existing skipped)
- i18n check script — ALL UNIT NAMES OK (8 present, 5 stale removed)

## Known Stubs

None — all data wired correctly.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

| Item                                        | Status |
| ------------------------------------------- | ------ |
| RhythmPatternGenerator.js exists            | FOUND  |
| en/trail.json exists                        | FOUND  |
| he/trail.json exists                        | FOUND  |
| 29-02-SUMMARY.md exists                     | FOUND  |
| Commit 0555518 (Task 1)                     | FOUND  |
| Commit 0064261 (Task 2)                     | FOUND  |
| Commit 9134abe (Task 3)                     | FOUND  |
| durationsIncludeRests exported              | FOUND  |
| allowRests option in RhythmPatternGenerator | FOUND  |
| Beat Builders in en/trail.json              | FOUND  |
| Big Beats in he/trail.json                  | FOUND  |
