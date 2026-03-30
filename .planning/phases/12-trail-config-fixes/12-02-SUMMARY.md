---
phase: 12-trail-config-fixes
plan: 02
subsystem: games
tags: [rhythm, pattern-generator, trail, metronome, arcade-rhythm, dictation, vitest]

# Dependency graph
requires:
  - phase: 12-trail-config-fixes/12-01
    provides: "Validated trail node difficulty and rhythmPatterns fields in unit data files"
provides:
  - "getPattern() accepts allowedPatterns array, skips curated path and constrains generative subdivisions when specified"
  - "All 4 rhythm games pass nodeConfig.rhythmPatterns through to getPattern()"
  - "RhythmDictationGame derives difficulty from nodeConfig instead of DEFAULT_DIFFICULTY"
  - "Unit 7 and 8 tests assert actual D-12 exercise type distribution (not stale 'all RHYTHM')"
affects: [trail, rhythmUnit7Redesigned, rhythmUnit8Redesigned, MetronomeTrainer, RhythmReadingGame, ArcadeRhythmGame, RhythmDictationGame]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "allowedPatterns=null as third arg to getPattern() — null means free-play (unchanged), array means constrained trail mode"
    - "Temporary GENERATION_RULES override: shallow-copy constrainedRules, replace, generatePattern, restore — avoids module-level mutation"
    - "rhythmPatterns extracted at component level from nodeConfig, passed directly to getPattern() — NOT added to gameSettings state"
    - "RhythmDictationGame: difficulty and rhythmPatterns extracted at component level, added to generateQuestion useCallback deps"

key-files:
  created: []
  modified:
    - src/components/games/rhythm-games/RhythmPatternGenerator.js
    - src/components/games/rhythm-games/MetronomeTrainer.jsx
    - src/components/games/rhythm-games/RhythmReadingGame.jsx
    - src/components/games/rhythm-games/RhythmDictationGame.jsx
    - src/components/games/rhythm-games/ArcadeRhythmGame.jsx
    - src/data/units/rhythmUnit7Redesigned.test.js
    - src/data/units/rhythmUnit8Redesigned.test.js

key-decisions:
  - "allowedPatterns replaces preferCurated as third arg to getPattern() — preferCurated removed entirely (only used in generatePracticeSession loop, no longer needed)"
  - "GENERATION_RULES[diffKey] temporarily overridden then immediately restored for constrained generation — avoids adding allowedSubdivisions parameter threading through generatePattern()"
  - "Intersection logic: allowedPatterns values matched against difficulty's allowedSubdivisions; falls back to unconstrained if intersection is empty"
  - "Unit 8 boss node ARCADE_RHYTHM test added to first describe block (not duplicated in existing boss describe block which already tests other boss properties)"

patterns-established:
  - "Trail rhythmPatterns wiring pattern: extract at component level, pass as third arg to getPattern()"

requirements-completed: [TCFG-01, TCFG-03]

# Metrics
duration: 35min
completed: 2026-03-31
---

# Phase 12 Plan 02: Trail Config Fixes — rhythmPatterns Wiring Summary

**allowedPatterns constraint wired through getPattern() and all 4 rhythm games; RhythmDictationGame reads difficulty from nodeConfig; unit 7/8 tests corrected to D-12 distribution**

## Performance

- **Duration:** 35 min
- **Started:** 2026-03-31T00:05:00Z
- **Completed:** 2026-03-31T00:40:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Extended `getPattern()` with `allowedPatterns` param: skips curated path when specified, uses intersection of allowedPatterns with difficulty's `allowedSubdivisions` to constrain generative logic, then restores original rules immediately after
- All 4 rhythm games (MetronomeTrainer, RhythmReadingGame, RhythmDictationGame, ArcadeRhythmGame) now extract `rhythmPatterns` from `nodeConfig` and pass to `getPattern()`
- `RhythmDictationGame` no longer hardcodes `DEFAULT_DIFFICULTY` in the `getPattern` call — derives difficulty from `nodeConfig?.difficulty` at component level
- Unit 7/8 test assertions corrected from stale "all exercises use RHYTHM type" to exact per-node D-12 distribution arrays; all 37 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend getPattern() with allowedPatterns and wire all 4 rhythm games** - `adfaf2b` (feat)
2. **Task 2: Update unit 7/8 test assertions to D-12 distribution** - `9ff23b0` (test)

## Files Created/Modified
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` - getPattern() signature changed from preferCurated to allowedPatterns; constraint logic with GENERATION_RULES temp override; generatePracticeSession drops preferCurated arg
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` - rhythmPatterns extracted from nodeConfig; both getPattern() call sites updated; rhythmPatterns added to startGame and loadNextPattern useCallback deps
- `src/components/games/rhythm-games/RhythmReadingGame.jsx` - rhythmPatterns extracted; getPattern() call in fetchNewPattern updated; rhythmPatterns added to useCallback dep array
- `src/components/games/rhythm-games/RhythmDictationGame.jsx` - difficulty and rhythmPatterns extracted from nodeConfig at component level; generateQuestion useCallback uses both; dep array updated
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` - rhythmPatterns extracted; getPattern() call in fetchNewPattern updated; rhythmPatterns added to useCallback dep array
- `src/data/units/rhythmUnit7Redesigned.test.js` - stale 'all exercises use RHYTHM type' replaced with exact D-12 toEqual assertion
- `src/data/units/rhythmUnit8Redesigned.test.js` - stale 'all exercises use RHYTHM type' replaced with regular-nodes-only D-12 assertion + separate boss ARCADE_RHYTHM test

## Decisions Made
- `allowedPatterns` replaces `preferCurated` as the third parameter — the alternating curated/generated logic in `generatePracticeSession` was not critical and the function already handles curated-first fallback internally when allowedPatterns is null
- Temporary GENERATION_RULES override pattern chosen over threading allowedSubdivisions through generatePattern() — minimal diff, well-documented, immediately restored
- Intersection falls back to unconstrained generation if no overlap (graceful degradation)
- Unit 8 boss ARCADE_RHYTHM assertion added to the first describe block rather than duplicating in the existing boss describe block

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing 8 test errors in `ArcadeRhythmGame.test.js` (TypeError: `getOrCreateAudioContext is not a function`) — confirmed pre-existing by running `npm run test:run` before and after our changes, same error count. Out of scope per deviation rules.

## Known Stubs
None — all changes wire real data through to the pattern generator.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Trail rhythmPatterns constraint is now fully functional end-to-end
- Unit 7/8 tests now reflect actual data structure
- Plan 12-01 + 12-02 together complete TCFG requirements for trail config correctness

---
*Phase: 12-trail-config-fixes*
*Completed: 2026-03-31*

## Self-Check: PASSED

- FOUND: src/components/games/rhythm-games/RhythmPatternGenerator.js
- FOUND: src/components/games/rhythm-games/MetronomeTrainer.jsx
- FOUND: src/data/units/rhythmUnit7Redesigned.test.js
- FOUND: src/data/units/rhythmUnit8Redesigned.test.js
- FOUND: .planning/phases/12-trail-config-fixes/12-02-SUMMARY.md
- FOUND commit: adfaf2b (Task 1)
- FOUND commit: 9ff23b0 (Task 2)
- FOUND commit: 6d07f2d (metadata)
