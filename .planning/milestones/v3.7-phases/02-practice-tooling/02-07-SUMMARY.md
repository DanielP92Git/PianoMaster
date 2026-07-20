---
phase: 02-practice-tooling
plan: 07
subsystem: games
tags: [sight-reading, react, grading, timing, i18n]

# Dependency graph
requires:
  - phase: 02-practice-tooling
    provides: "01 (gradingModes.js constants, mode-aware useTimingAnalysis/calculateOverallScore), 03 (SightReadingSessionContext gradingMode/lockMode/unlockMode contract), 04 (locale keys), 05 (VictoryScreen suppressPersistence), 06 (FeedbackSummary gradingMode prop)"
provides:
  - "Labeled Practice/Test header pill in SightReadingGame.jsx (D-02), localStorage-persisted default-Test preference (D-03)"
  - "Session-lock wiring: lockMode() at first COUNT_IN, unlockMode() at the three session-boundary funnels (returnToSetup/openSettingsModal/handleStartNewSession), NOT in replayPattern (D-05)"
  - "Full grading-mode wiring: mode-aware useTimingAnalysis + calculateOverallScore, updateStudentScore practice early-return, suppressPersistence={isPracticeMode} on VictoryScreen, gradingMode threaded to FeedbackSummary"
  - "Practice-mode miss-sweep completion-threshold fix (Pitfall 5) and anti-cheat penalty-modal/penaltyPoints suppression (Pitfall 9)"
affects: ["02-08 (replay/compare)", "02-09 (review-mistakes)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Grading-mode pill mirrors the existing metronome icon-button active/hover ternary + BPM pill shape, with disabled/opacity-60 for the D-05 lock state"
    - "gradingModeRef (not gradingMode state) read inside effects/callbacks needing a synchronous, stale-closure-free value (updateStudentScore submit effect, penalty trigger, miss-sweep completion threshold) — same Pattern 1 discipline as combo/isOnFire"

key-files:
  created:
    - src/components/games/sight-reading-game/SightReadingGame.practiceMode.test.jsx
  modified:
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx
    - src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx
    - src/contexts/SightReadingSessionContext.jsx

key-decisions:
  - "Penalty-modal guard scoped narrowly to the setShowPenaltyModal(true) trigger only — abortPerformanceForPenalty() (the actual anti-cheat abort/DISPLAY-phase kickback) still runs unchanged in both modes; only the punitive-feeling modal UI is suppressed in Practice, per the plan's literal Pitfall 9 wording"
  - "penaltyPoints display suppressed by zeroing penaltyPointsTotal in the FEEDBACK summary effect when gradingMode is Practice (rather than adding a separate display-only guard), since guessPenaltyRef tracking itself must keep accumulating unchanged in both modes per the plan"
  - "Completion-threshold miss-sweep fallback (schedulePerformanceTimeline) scaled by PRACTICE_TIMING.toleranceMultiplier only for the last-note completion check, not the mid-pattern missToleranceMs fallback — matches the plan's explicit 'accepted, since the primary path dominates' guidance"

patterns-established:
  - "Test-mode grading pill toggling requires isModeLocked===false; all header-pill styling reuses the metronome button's active-state ternary shape rather than introducing a new pill pattern"

requirements-completed: [PRAC-03]

# Metrics
duration: 25min
completed: 2026-07-10
---

# Phase 02 Plan 07: Practice/Test Grading Mode Wiring Summary

**Wires the Practice-vs-Test grading mode into `SightReadingGame.jsx` end to end: a labeled, localStorage-persisted, session-locked header pill; mode-aware timing/scoring; the one in-file `updateStudentScore` persistence gate plus `suppressPersistence` on `VictoryScreen` (closing all four D-01 persistence paths); and Practice-mode suppression of the anti-cheat penalty modal/points display, with a completion-threshold fix so Practice's widened timing window can't outlive the miss-sweep.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-10T07:55:00Z (approx, context gathering)
- **Completed:** 2026-07-10T08:19:33Z
- **Tasks:** 3 (plus one Rule-1 tech-debt cleanup deviation)
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- `SightReadingGame.jsx` now consumes `gradingMode`/`gradingModeRef`/`isModeLocked`/`setGradingMode`/`lockMode`/`unlockMode` from `useSightReadingSession()`, initializes/persists the mode to `localStorage` (`sightReadingGradingMode`, Test default, allowlist-validated), and renders a labeled Practice/Test header pill that greys out (`disabled` + `opacity-60`) once locked
- Mode locks at the first `COUNT_IN` transition in `beginPerformanceWithPattern` (session-scoped via context state, so it stays locked for the whole session, not just count-in) and unlocks only at the three genuine session boundaries — `handleStartNewSession`, `returnToSetup`, `openSettingsModal` — explicitly NOT in `replayPattern` (mid-exercise Try Again keeps the mode, D-05)
- `useTimingAnalysis({ tempo, mode: gradingMode })` and `calculateOverallScore(pitchAccuracy, rhythmAccuracy, gradingMode)` wire the mode through to timing/scoring; the `updateStudentScore` submit effect early-returns `"skipped"` when `gradingModeRef.current === PRACTICE` (reading the ref, not state, per Pattern 1); `suppressPersistence={isPracticeMode}` closes the other three D-01 persistence paths (streak/trail-XP/free-play-XP/daily-challenge, gated in 02-05); `gradingMode` is threaded to `FeedbackSummary` for its not-scored notice (02-06)
- Practice-mode completion-threshold fix: the miss-sweep's last-note completion check now scales its `missToleranceMs` fallback by `PRACTICE_TIMING.toleranceMultiplier` in Practice mode, so the widened per-note timing window can't outlive the completion check and mis-finalize as a miss (RESEARCH.md Pitfall 5)
- Practice-mode penalty suppression: the anti-cheat `showPenaltyModal` trigger and the `penaltyPoints` contribution to the displayed score are both suppressed in Practice (a punishment affordance contradicts an unscored, psychologically-safe mode), while `guessPenaltyRef` tracking itself keeps accumulating unchanged in both modes (RESEARCH.md Pitfall 9)
- New `SightReadingGame.practiceMode.test.jsx` (6 tests) + one new `SightReadingGame.combo.test.jsx` case (D-04 delayed-combo-break) — all green; full `npm run test:run` (2008 tests) and `npm run lint` (0 errors) clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Mode state plumbing — pill, localStorage, ref, lock/unlock at boundaries** - `c15867a2` (feat)
2. **Task 2: Grading wiring + persistence gate** - `a4aa4582` (feat)
3. **Task 3: Author practiceMode test + extend combo test (D-04 side effect)** - `a81ea30c` (test)

**Deviation commit:** `e5956a8b` (refactor — swap inlined GRADING_MODES for canonical import, see below)

## Files Created/Modified

- `src/components/games/sight-reading-game/SightReadingGame.jsx` - Mode consumption/pill/localStorage/lock-unlock (Task 1); mode-aware timing/scoring, persistence gate, penalty guards, completion-threshold fix (Task 2)
- `src/components/games/sight-reading-game/SightReadingGame.practiceMode.test.jsx` - NEW: 6 tests covering Practice-skips-submit, Test-still-submits, mode-locks-at-COUNT_IN, localStorage persistence, unlockMode-on-returnToSetup, unlockMode-NOT-on-Try-Again
- `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx` - Extended stateful mock with the gradingMode API surface; added the D-04 Practice-delays-combo-break case
- `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx` - Rule-1 fix: extended its static `useSightReadingSession` mock with the new gradingMode API surface (see deviations)
- `src/contexts/SightReadingSessionContext.jsx` - Rule-1 cleanup: swapped the 02-03-inlined `GRADING_MODES` literal for the canonical `constants/gradingModes.js` import now that both plans are merged in this worktree

## Decisions Made

- Penalty-modal guard scoped to only the `setShowPenaltyModal(true)` call, not `abortPerformanceForPenalty()` itself — the abort (stopping timers, returning to DISPLAY, resetting combo) is anti-cheat flow control, not the "punishment affordance" the plan calls out; only the modal UI reads as punitive
- `penaltyPoints` display suppression implemented by zeroing `penaltyPointsTotal` in the FEEDBACK summary effect for Practice mode (rather than a separate UI-layer guard), since no component currently renders `summaryStats.penaltyPoints` directly — the value only affects the displayed `overallScore`/star rating, which is what needed shielding from the "punishment" framing
- Combo-test D-04 case validated via known timing-constant math (Test windowEnd ≈1300ms, Practice windowEnd ≈1600ms post-performance-start for the fixture's 1000ms note) rather than a live head-to-head Test-vs-Practice comparison within one test, to keep the assertion deterministic under fake timers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `SightReadingGame.micRestart.test.jsx`'s stale mock broke after Task 1's mode-plumbing changes**

- **Found during:** Task 2 verification (`npx vitest run src/components/games/sight-reading-game`)
- **Issue:** This pre-existing test's static `useSightReadingSession` mock predates the gradingMode API surface added in Task 1. Calling the (undefined) `lockMode()` inside `beginPerformanceWithPattern`'s try/catch silently aborted every performance, so `startListening` was never called and the regression test failed (`expected "spy" to be called 1 times, but got 0 times`).
- **Fix:** Extended the mock's returned object with `gradingMode: "test"`, `gradingModeRef: { current: "test" }`, `isModeLocked: false`, and no-op `setGradingMode`/`lockMode`/`unlockMode` spies, matching the shape added to the combo test's mock in the same task.
- **Files modified:** src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx
- **Verification:** `npx vitest run src/components/games/sight-reading-game` — all 12 files / 152 tests green (later 165 after Task 3's additions).
- **Committed in:** `a4aa4582` (Task 2 commit)

**2. [Rule 1 - Bug/Tech-debt] Swapped SightReadingSessionContext's inlined GRADING_MODES for the canonical import**

- **Found during:** Post-Task-3 review of 02-03's SUMMARY, which explicitly flagged this integration point
- **Issue:** Plan 02-03 (same wave, parallel worktree) inlined a local `GRADING_MODES` literal in `SightReadingSessionContext.jsx` because 02-01's `constants/gradingModes.js` hadn't merged into that worktree yet, and its summary explicitly named "02-07 integration" as the point to switch to the canonical import once both plans land.
- **Fix:** Replaced the inlined literal + explanatory comment with `import { GRADING_MODES } from "../components/games/sight-reading-game/constants/gradingModes"`. Value is byte-identical, so this is a pure duplication cleanup with no behavior change.
- **Files modified:** src/contexts/SightReadingSessionContext.jsx
- **Verification:** `npx vitest run src/contexts/SightReadingSessionContext.test.jsx src/components/games/sight-reading-game` — 14 files / 165 tests green; `npx eslint` clean.
- **Committed in:** `e5956a8b` (standalone refactor commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 — bug/tech-debt)
**Impact on plan:** Both fixes were necessary for correctness (Deviation 1 restored a broken pre-existing regression test) or explicitly anticipated cleanup (Deviation 2, flagged by name in 02-03's own summary). No scope creep — no new components, no architectural changes.

## Issues Encountered

None beyond the two deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four D-01 persistence paths are closed for Practice mode (updateStudentScore in this file + streak/trail-XP/free-play-XP/daily-challenge via `suppressPersistence`), the mode-lock contract is fully wired at the correct session boundaries, and Practice-mode timing/scoring/penalty leniency all land correctly with the Pitfall 5/9 fixes applied
- Plans 02-08 (replay/compare) and 02-09 (review-mistakes) can build on this file's now-stable `gradingMode`/`isPracticeMode` locals and the FeedbackSummary `gradingMode` prop without needing to touch the mode-lock plumbing again
- `npx vitest run src/components/games/sight-reading-game` green (165/165); full `npm run test:run` green (2008 passed, 13 todo, 2 skipped pre-existing); `npm run lint` clean (0 errors; 125 pre-existing warnings unrelated to this plan's files)
- Pre-existing, unrelated `git stash` entry noted on branch `fix/notes-recognition-mic-phantom-heart-loss` (not created by this plan's execution, left untouched)

---

_Phase: 02-practice-tooling_
_Completed: 2026-07-10_

## Self-Check: PASSED

- FOUND: src/components/games/sight-reading-game/SightReadingGame.jsx
- FOUND: src/components/games/sight-reading-game/SightReadingGame.practiceMode.test.jsx
- FOUND: src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx
- FOUND: src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx
- FOUND: src/contexts/SightReadingSessionContext.jsx
- FOUND commit: c15867a2
- FOUND commit: a4aa4582
- FOUND commit: a81ea30c
- FOUND commit: e5956a8b
