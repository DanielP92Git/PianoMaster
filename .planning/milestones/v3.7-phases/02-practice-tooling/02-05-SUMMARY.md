---
phase: 02-practice-tooling
plan: 05
subsystem: ui
tags: [react, hooks, victory-screen, xp, persistence-gating]

# Dependency graph
requires:
  - phase: 02-practice-tooling
    provides: "02-CONTEXT.md / 02-RESEARCH.md Pitfall 2 analysis (D-01 hidden persistence paths)"
provides:
  - "suppressPersistence prop on useVictoryState and VictoryScreen, gating all four out-of-game D-01 persistence paths (streak, trail progress + trail XP, free-play XP, daily-challenge completion)"
  - "D-06 'practice run — not scored' notice in VictoryScreen, shown only when suppressPersistence is true"
affects: [02-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optional suppressPersistence flag (default false) threaded 1:1 from VictoryScreen into useVictoryState; every persistence-writing effect/branch gets an early-return or !suppressPersistence guard while non-persisting UI-settling state (setIsProcessingTrail(false)) still runs"

key-files:
  created: []
  modified:
    - src/hooks/useVictoryState.js
    - src/components/games/VictoryScreen.jsx

key-decisions:
  - "Trail-progress + awardXP block: guarded with a single early-return (`if (suppressPersistence) { setIsProcessingTrail(false); return; }`) right after `hasProcessedTrail.current = true`, rather than sprinkling guards around each of updateExerciseProgress/updateNodeProgress/awardXP individually — simpler, and the earned-stars calculation (setStars) already ran before the nodeId branch so display stars are unaffected"
  - "suppressPersistence added to the processTrailCompletion useEffect's dependency array (it's read in both the trail and free-play branches inside that effect) to satisfy exhaustive-deps and avoid stale-closure risk"
  - "VictoryScreen already receives `t` from useVictoryState's return value — no need to add a separate useTranslation() call as the plan's fallback instruction anticipated"

requirements-completed: [PRAC-03]

# Metrics
duration: ~18min
completed: 2026-07-10
---

# Phase 02 Plan 05: Gate Hidden VictoryScreen/useVictoryState Persistence Paths Summary

**Added a backward-compatible `suppressPersistence` flag that gates all four out-of-game D-01 persistence paths (streak update, trail progress + trail XP, free-play XP, daily-challenge completion) inside `useVictoryState`/`VictoryScreen`, plus a D-06 "practice run — not scored" notice.**

## Performance

- **Duration:** ~18 min
- **Completed:** 2026-07-10
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Closed the three in-hook persistence sites in `useVictoryState.js` (streak effect, trail-progress/awardXP block, free-play XP) behind `suppressPersistence`
- Closed the fourth D-01 persistence path — `completeDailyChallenge` — in `VictoryScreen.jsx`
- Added the D-06 not-scored notice, rendered only under suppression
- Default path (`suppressPersistence` omitted/false) is byte-for-byte unchanged for every other game rendering `VictoryScreen`

## Task Commits

Each task was committed atomically:

1. **Task 1: Gate the three useVictoryState persistence sites on suppressPersistence** - `a31eed13` (feat)
2. **Task 2: Forward suppressPersistence through VictoryScreen + gate daily challenge + add not-scored notice** - `a1ed1cd9` (feat)

## Files Created/Modified

- `src/hooks/useVictoryState.js` - Added `suppressPersistence = false` to hook signature; streak `useEffect` early-returns when suppressed (deps updated); trail-progress/awardXP block early-returns after marking `hasProcessedTrail` while still calling `setIsProcessingTrail(false)`; free-play `awardXP` call wrapped in `if (!suppressPersistence)`; `suppressPersistence` added to the `processTrailCompletion` effect's dependency array
- `src/components/games/VictoryScreen.jsx` - Added `suppressPersistence = false` prop, forwarded 1:1 into `useVictoryState(...)`; `completeDailyChallenge` effect gated with `if (suppressPersistence) return` (deps updated); added a `sightReading.summary.practiceNotScored` notice rendered only when `suppressPersistence` is true, using the `t` already returned by `useVictoryState`

## Decisions Made

- Trail-progress block uses one guard (early-return) covering `updateExerciseProgress`/`updateNodeProgress`/`awardXP` together instead of three separate guards — matches the plan's "no persistence calls run" requirement while keeping the diff minimal and readable
- `suppressPersistence` added to `processTrailCompletion`'s effect dependency array (not explicitly called out per-line in the plan, but required by the existing exhaustive-deps discipline in this file, since the flag gates behavior in that effect)

## Deviations from Plan

None - plan executed exactly as written. (The Task 2 fallback instruction "if VictoryScreen doesn't already use `useTranslation`, add it" was not needed — `t` is already returned from `useVictoryState` and consumed in the destructure.)

## Issues Encountered

None. `sightReading.summary.practiceNotScored` locale key does not yet exist in `src/locales` (expected — authored in 02-04, which may land in the same wave); i18next falls back to the key name gracefully, matching the plan's note.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02-07 can now pass `suppressPersistence={isPracticeMode}` from `SightReadingGame.jsx` through `VictoryScreen` to fully close the D-01 Practice-mode persistence leak (combined with 02-07's own `updateStudentScore` gate).
- `npx vitest run src/hooks src/components/games` green (509 total tests across both dirs); `npm run lint` clean (0 errors).

---

_Phase: 02-practice-tooling_
_Completed: 2026-07-10_

## Self-Check: PASSED

- FOUND: src/hooks/useVictoryState.js
- FOUND: src/components/games/VictoryScreen.jsx
- FOUND: commit a31eed13
- FOUND: commit a1ed1cd9
- `grep -c "suppressPersistence" src/hooks/useVictoryState.js` = 6 (≥4 required)
- `grep -c "suppressPersistence" src/components/games/VictoryScreen.jsx` = 5
