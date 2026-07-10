---
phase: 02-practice-tooling
plan: 01
subsystem: games
tags: [sight-reading, vitest, react-hooks, grading]

# Dependency graph
requires: []
provides:
  - gradingModes.js constants module (GRADING_MODES, GRADING_MODE_STORAGE_KEY, PRACTICE_TIMING)
  - Mode-aware useTimingAnalysis hook (Practice widens tolerances + status thresholds; Test unchanged)
  - Mode-aware calculateOverallScore (Practice = pitch-only; Test = unchanged blend)
affects: [02-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Grading-mode constants live in a pure-data module (no imports/functions), matching timingConstants.js convention"
    - "Hook derives effective per-mode values via a single useMemo keyed on mode, consumed by both buildTimingWindows and evaluateTiming"

key-files:
  created:
    - src/components/games/sight-reading-game/constants/gradingModes.js
    - src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js
  modified:
    - src/components/games/sight-reading-game/hooks/useTimingAnalysis.js
    - src/components/games/sight-reading-game/utils/scoreCalculator.js
    - src/components/games/sight-reading-game/utils/scoreCalculator.test.js

key-decisions:
  - "PRACTICE_TIMING constants (2x tolerance/status multiplier, 0.85/0.75 clamp fractions) authored exactly as specified in plan interfaces block"
  - "calculateOverallScore uses literal 'test'/'practice' strings (not imported GRADING_MODES) to keep the pure util free of a cross-module import, matching the plan's explicit instruction"

patterns-established:
  - "Mode-aware pure hooks: default parameter mode = GRADING_MODES.TEST preserves byte-for-byte legacy behavior for all existing (non-mode-aware) call sites"

requirements-completed: [PRAC-03]

# Metrics
duration: 12min
completed: 2026-07-10
---

# Phase 02 Plan 01: Grading-Mode Foundations Summary

**Pure, tested Practice-vs-Test grading contract (PRAC-03/D-04): gradingModes.js constants, mode-aware useTimingAnalysis (wider windows + status thresholds), and mode-aware calculateOverallScore (pitch-only in Practice, unchanged blend in Test) — all isolated from SightReadingGame.jsx, ready for 02-07 to wire in.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-10T06:08:00Z
- **Completed:** 2026-07-10T06:20:47Z
- **Tasks:** 3 (2 TDD)
- **Files modified:** 5

## Accomplishments

- `gradingModes.js` established as the single source of truth for grading-mode constants (GRADING_MODES, GRADING_MODE_STORAGE_KEY, PRACTICE_TIMING)
- `useTimingAnalysis` accepts an optional `mode` param; Practice mode widens both the base tolerance constants AND the duration-fraction clamps (closing the Pitfall 5 landmine where the clamp binds before the constant at fast tempo), plus scales status thresholds; Test mode is byte-for-byte unchanged
- `calculateOverallScore` accepts an optional `mode` param; Practice mode grades pitch-only so wider timing leniency cannot inflate a blended score; Test mode formula unchanged
- New `useTimingAnalysis.test.js` (previously untested) covers default/explicit Test-mode parity, Practice slow-tempo constant-bound widening, Practice fast-tempo clamp-bound widening, and Practice status-threshold scaling
- `scoreCalculator.test.js` extended with a dedicated `describe` block for the mode param

## Task Commits

Each task was committed atomically:

1. **Task 1: Create gradingModes.js constants module** - `e01bf3ad` (feat)
2. **Task 2: Make useTimingAnalysis mode-aware + add its first test** - `d06a1550` (test, RED) → `baf75735` (feat, GREEN)
3. **Task 3: Make calculateOverallScore mode-aware + extend its test** - `2ece3a7f` (test, RED) → `dff4264d` (feat, GREEN)

**Plan metadata:** (this commit)

_TDD tasks (2, 3) each have a failing-test commit followed by an implementation commit, confirmed RED before GREEN by running vitest between commits._

## Files Created/Modified

- `src/components/games/sight-reading-game/constants/gradingModes.js` - NEW pure-data module: GRADING_MODES, GRADING_MODE_STORAGE_KEY, PRACTICE_TIMING
- `src/components/games/sight-reading-game/hooks/useTimingAnalysis.js` - Added `mode` param, `effectiveTolerances` memo, wired into buildTimingWindows/evaluateTiming
- `src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js` - NEW, 5 tests covering mode awareness
- `src/components/games/sight-reading-game/utils/scoreCalculator.js` - `calculateOverallScore` now accepts optional `mode = "test"` third param
- `src/components/games/sight-reading-game/utils/scoreCalculator.test.js` - Extended with `calculateOverallScore mode` describe block (2 new tests)

## Decisions Made

None beyond what the plan specified — all constants, multipliers, and clamp fractions were authored exactly as given in the plan's `<interfaces>` block and Task 1 action.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three building blocks (`gradingModes.js`, mode-aware `useTimingAnalysis`, mode-aware `calculateOverallScore`) are pure/hook-shaped, fully tested, and have zero coupling to `SightReadingGame.jsx`
- Downstream Plan 02-07 can safely import `GRADING_MODES`/`GRADING_MODE_STORAGE_KEY`/`PRACTICE_TIMING` and pass `mode` through to both `useTimingAnalysis` and `calculateOverallScore` without touching this plan's files again
- No blockers

---

_Phase: 02-practice-tooling_
_Completed: 2026-07-10_

## Self-Check: PASSED

All 5 created/modified source files and all 5 task commit hashes (e01bf3ad, d06a1550, baf75735, 2ece3a7f, dff4264d) verified present.
