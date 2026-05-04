---
phase: 32-game-design-differentiation
plan: "03"
subsystem: rhythm-games
tags: [boss-difficulty, pattern-resolution, timing-tiers, pedagogy]
dependency_graph:
  requires: [6-node-rhythm-units]
  provides: [resolveByAnyTag, boss-difficulty-levers, pedagogy-docs]
  affects:
    [
      MixedLessonGame,
      RhythmTapQuestion,
      RhythmReadingQuestion,
      rhythmTimingUtils,
    ]
tech_stack:
  added: []
  patterns: [resolver-selection-via-config-field, cumulative-tag-sets]
key_files:
  created:
    - src/data/PEDAGOGY.md (difficulty levers section)
  modified:
    - src/data/patterns/RhythmPatternGenerator.js
    - src/data/patterns/RhythmPatternGenerator.test.js
    - src/components/games/rhythm-games/utils/rhythmTimingUtils.js
    - src/components/games/rhythm-games/MixedLessonGame.jsx
    - src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx
    - src/components/games/rhythm-games/renderers/RhythmReadingQuestion.jsx
    - src/data/units/rhythmUnit1Redesigned.js
    - src/data/units/rhythmUnit2Redesigned.js
    - src/data/units/rhythmUnit3Redesigned.js
    - src/data/units/rhythmUnit4Redesigned.js
    - src/data/units/rhythmUnit5Redesigned.js
    - src/data/units/rhythmUnit6Redesigned.js
    - src/data/units/rhythmUnit7Redesigned.js
    - src/data/units/rhythmUnit8Redesigned.js
decisions:
  - "resolveByAnyTag is a standalone export (not a mode flag on resolveByTags) to keep API explicit and avoid hidden behavioral changes for existing consumers"
  - "patternTagMode field on rhythmConfig drives resolver selection at consumer sites (MixedLessonGame, RhythmTapQuestion, RhythmReadingQuestion)"
  - "boss_rhythm_7 (6/8 MINI_BOSS) keeps single-tag patternTags since 6/8 is a standalone time signature pool; patternTagMode: any added for consistency"
  - "measureCount wired through MixedLessonGame buildRhythmTapConfig into RhythmReadingQuestion measures prop"
metrics:
  duration: "8m 38s"
  completed: "2026-04-20T18:39:52Z"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 15
---

# Phase 32 Plan 03: Boss Node Difficulty Tuning Summary

Implemented 4 difficulty levers (pool scope, pattern length, timing tier, question mix) across all 8 boss nodes, with a new OR-mode pattern resolver and documented pedagogy vocabulary.

## One-liner

Boss nodes tuned with cumulative pattern pools (resolveByAnyTag), strict timing for BOSS type, 4-bar patterns for full bosses, and dictation-heavy question mixes (D-05 through D-10, D-16).

## Task Results

| Task | Name                                                                      | Commit  | Files                                                                                                                            |
| ---- | ------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Add resolveByAnyTag and remove BOSS from easy timing                      | 0b1f246 | RhythmPatternGenerator.js, .test.js, rhythmTimingUtils.js, MixedLessonGame.jsx, RhythmTapQuestion.jsx, RhythmReadingQuestion.jsx |
| 2    | Tune all 8 boss nodes with cumulative durations and harder question mixes | 74f26e9 | All 8 rhythmUnit\*Redesigned.js, MixedLessonGame.jsx, RhythmReadingQuestion.jsx                                                  |
| 3    | Create PEDAGOGY.md difficulty lever vocabulary                            | 76a365c | src/data/PEDAGOGY.md                                                                                                             |

## Changes Made

### Task 1: resolveByAnyTag + Timing Tier Update

- Added `resolveByAnyTag` export to `RhythmPatternGenerator.js` with OR semantics (`tags.some()` instead of `tags.every()`)
- Updated 3 consumer files (MixedLessonGame, RhythmTapQuestion, RhythmReadingQuestion) to select resolver based on `config.patternTagMode === "any"`
- Added `"mini_boss"` to `EASY_NODE_TYPES` Set in `rhythmTimingUtils.js` (D-07: retains forgiving thresholds)
- Confirmed `"boss"` absent from `EASY_NODE_TYPES` (uses strict thresholds)
- Added 4 new tests for resolveByAnyTag (OR semantics, null for no match, shape, wider pool vs AND)

### Task 2: Boss Node Tuning

- **All 8 boss nodes**: Added `patternTagMode: "any"` to rhythmConfig
- **boss_rhythm_2**: patternTags expanded from 2 to 3 (cumulative U1+U2)
- **boss_rhythm_3**: patternTags expanded from 2 to 5 (cumulative U1-U3)
- **boss_rhythm_4**: durations expanded from 5 to 7 (added w, 8); patternTags expanded from 3 to 8 (cumulative U1-U4)
- **boss_rhythm_5**: durations expanded from 5 to 9 (cumulative U1-U5); patternTags expanded from 2 to 10
- **boss_rhythm_6** (full BOSS): durations 10, patternTags 11 (cumulative U1-U6), `measureCount: 4`, dictation/reading-heavy questions (5 reading + 5 dictation + 2 tap)
- **boss_rhythm_7**: Added patternTagMode only (6/8 standalone pool, MINI_BOSS)
- **boss_rhythm_8** (full BOSS capstone): durations 10, patternTags 13 (cumulative ALL units), `measureCount: 4`, dictation/reading-heavy questions
- Wired `measureCount` and `patternTagMode` through `MixedLessonGame.buildRhythmTapConfig` to renderer props
- Updated `RhythmReadingQuestion` to use `config.measureCount || 1` instead of hardcoded `measures={1}`

### Task 3: PEDAGOGY.md

- Added "Rhythm Difficulty Levers (Phase 32)" section to existing PEDAGOGY.md
- Documents all 4 levers with tables: Pool Scope, Pattern Length, Timing Tier, Question Mix
- Includes node type difficulty summary table
- Provides instructions for adding new rhythm units
- References all implementation files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] measureCount not consumed by MixedLessonGame renderers**

- **Found during:** Task 2
- **Issue:** `measureCount` was added to boss nodes but neither MixedLessonGame nor its renderers read it
- **Fix:** Added `measureCount` to `buildRhythmTapConfig()` output; updated RhythmReadingQuestion to use `config.measureCount || 1` for its `measures` prop
- **Files modified:** MixedLessonGame.jsx, RhythmReadingQuestion.jsx
- **Commit:** 74f26e9

## Verification Results

- `npm run verify:trail`: PASSED (with pre-existing warnings)
- `npx vitest run src/data/patterns/RhythmPatternGenerator.test.js`: 40/40 passed
- `npx vitest run src/data/units/rhythmUnit7Redesigned.test.js src/data/units/rhythmUnit8Redesigned.test.js`: 36/36 passed
- All 8 boss nodes contain `patternTagMode: "any"`
- boss_rhythm_6 and boss_rhythm_8 have `measureCount: 4`
- EASY_NODE_TYPES includes "mini_boss", does NOT include "boss"
- PEDAGOGY.md contains all 4 lever headings

## Known Stubs

None.

## Self-Check: PASSED
