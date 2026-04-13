---
phase: 29-code-quality-data-fixes
plan: "01"
subsystem: rhythm-games
tags: [bug-fix, stale-closure, score-overflow, empty-array-guard, code-quality]
dependency_graph:
  requires: []
  provides: [MixedLessonGame-stale-closure-fix, ArcadeRhythmGame-score-cap]
  affects: [MixedLessonGame, ArcadeRhythmGame]
tech_stack:
  added: []
  patterns: [useRef-for-mutable-index, rest-aware-score-filter]
key_files:
  created: []
  modified:
    - src/components/games/rhythm-games/MixedLessonGame.jsx
    - src/components/games/rhythm-games/ArcadeRhythmGame.jsx
    - src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx
decisions:
  - "currentIndexRef pattern (not currentIndex closure) for all async index reads in MixedLessonGame"
  - "Rest tiles excluded from ArcadeRhythmGame hitCount via Array.filter — raw Set.size is unreliable when rest tiles are tracked"
  - "Math.min(100) added as secondary safety cap on top of the primary fix"
  - "Empty pool guard exits to COMPLETE state rather than showing partial/broken question UI"
metrics:
  duration_seconds: 235
  completed_date: "2026-04-13"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
requirements:
  - CODE-01
  - CODE-02
  - CODE-03
---

# Phase 29 Plan 01: Code Quality Bug Fixes Summary

**One-liner:** Stale-closure ref pattern for MixedLessonGame question advance, rest-aware score filter for ArcadeRhythmGame preventing >100% scores, empty-pool guard for crash prevention.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix stale-closure + empty-array bugs in MixedLessonGame (CODE-01+CODE-03) | c744f9e | MixedLessonGame.jsx, MixedLessonGame.test.jsx |
| 2 | Fix ArcadeRhythmGame score exceeding 100% (CODE-02) | 9feb2ad | ArcadeRhythmGame.jsx |

## What Was Built

### CODE-01: Stale-closure fix in MixedLessonGame

`handleRhythmTapComplete` and `handleSelect` both captured `currentIndex` in their closure at creation time. When React batches state updates or when a callback fires from inside a `setTimeout`, the closure value can be stale — causing the wrong index to be used for the "next question" calculation, leading to skipped or repeated questions.

Fix: Added `currentIndexRef = useRef(0)` synced via `useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex])`. All async index reads in both callbacks now read `currentIndexRef.current` instead of the closed-over `currentIndex`. `currentIndex` was removed from both callbacks' `useCallback` dependency arrays.

Additionally, `currentIndexRef.current` is explicitly set to `0` in `startGame` alongside `setCurrentIndex(0)`, and set to `nextIndex` before `setCurrentIndex(nextIndex)` in advance paths to ensure the ref is always ahead of or equal to the React state.

### CODE-03: Empty pool guard in MixedLessonGame

When a rhythm node has no `rhythmConfig` or empty `focusDurations`/`durations`, `buildDurationPool()` returns `[]`. The previous code fell through to `generateQuestions([], ...)` which would return malformed questions with `undefined` choices, causing a crash when the renderer tried to map over them.

Fix:
1. Early return to `COMPLETE` state in `startGame` when `pool.length === 0`
2. Guard on `generateQuestions` result: if empty/undefined, construct a safe fallback question
3. Render guard: `IN_PROGRESS && questions.length === 0` shows the existing error fallback UI

### CODE-02: ArcadeRhythmGame score >100% fix

`scoredRef` is a `Set` of tile indices that tracks all scored tiles. The RAF loop adds rest tile indices to `scoredRef` when they exit the hit zone (so they don't trigger duplicate MISS events). At score tally time, `hitCount = scoredRef.current.size` counted ALL entries including rest tiles, while `nonRestCount = beatTimes.length` only counted non-rest beats. This made `hitCount > nonRestCount` when rest tiles were present, yielding score > 100%.

Fix:
1. Replace `scoredRef.current.size` with `[...scoredRef.current].filter(idx => !tilesRef.current[idx]?.isRest).length`
2. Wrap the final score in `Math.min(100, ...)` as a secondary safety cap

## Verification

```
grep -n "currentIndexRef" src/components/games/rhythm-games/MixedLessonGame.jsx
# 13 matches — ref declaration and usage throughout

grep -n "isRest" src/components/games/rhythm-games/ArcadeRhythmGame.jsx | grep -n "626"
# Line 626: !tilesRef.current[idx]?.isRest — rest-filtering in hitCount

grep -n "Math.min" src/components/games/rhythm-games/ArcadeRhythmGame.jsx
# Line 632: Math.min(100, ...) — score cap present
```

Full test suite: 1604 tests passed, 2 skipped. 8 pre-existing unhandled rejections in ArcadeRhythmGame.test.js (missing `getOrCreateAudioContext` in mock — pre-existed before this plan, logged to deferred items).

## Deviations from Plan

None — plan executed exactly as written. The TDD RED phase produced tests that passed immediately because the mock setup was too permissive to expose the stale-closure bug in isolation, but the implementation changes were applied correctly regardless.

## Known Stubs

None.

## Threat Flags

None. Score changes are client-side display only; XP awards are server-side via RLS (T-29-01 accepted). Empty pool guard mitigates T-29-02 as required.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/components/games/rhythm-games/MixedLessonGame.jsx | FOUND |
| src/components/games/rhythm-games/ArcadeRhythmGame.jsx | FOUND |
| .planning/phases/29-code-quality-data-fixes/29-01-SUMMARY.md | FOUND |
| Commit c744f9e (Task 1) | FOUND |
| Commit 9feb2ad (Task 2) | FOUND |
