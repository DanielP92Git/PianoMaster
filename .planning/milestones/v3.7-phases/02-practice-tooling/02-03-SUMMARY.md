---
phase: 02-practice-tooling
plan: 03
subsystem: ui
tags: [react, context, hooks, i18n, sight-reading]

# Dependency graph
requires:
  - phase: 01-engagement-hud-parity
    provides: "SightReadingSessionContext combo/isOnFire ref-mirror composition pattern to copy"
provides:
  - "gradingMode/setGradingMode/isModeLocked/lockMode/unlockMode on SightReadingSessionContext (D-05 mode-lock contract)"
  - "useReviewDrill hook — isolated mistake-list + advance-on-match state machine (D-16/D-19/D-22)"
  - "ReviewDrillPanel presentational component with full EN/HE i18n"
affects:
  ["02-07 (SightReadingGame.jsx integration)", "02-09 (review-mistakes wiring)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ref-mirror discipline (mutate ref then setState) reused for gradingMode/isModeLocked and useReviewDrill's currentMistakeIndex, matching combo/isOnFire precedent"
    - "Local literal fallback constant when a same-wave parallel-worktree plan's canonical constants module isn't yet present, with an inline comment flagging the future dedup"

key-files:
  created:
    - src/components/games/sight-reading-game/hooks/useReviewDrill.js
    - src/components/games/sight-reading-game/hooks/useReviewDrill.test.js
    - src/components/games/sight-reading-game/components/ReviewDrillPanel.jsx
  modified:
    - src/contexts/SightReadingSessionContext.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "GRADING_MODES inlined as a local literal ({ PRACTICE: 'practice', TEST: 'test' }) in SightReadingSessionContext.jsx instead of importing from constants/gradingModes.js, because 02-01 (same wave, parallel worktree) had not yet merged that file into this worktree; values match 02-01's exact shape so a later import-swap during 02-07 integration is a pure find-replace, not a value change."
  - "useReviewDrill resolves each mistake's target pitch from patternNotes[noteIndex].pitch per plan spec, falling back to performanceResults[i].expected (which the game already populates identically) if patternNotes lookup misses — cheap defense-in-depth, no behavior change when both agree."
  - "Added a full sightReading.review.* i18n subtree to both EN and HE common.json (title/progress/instruction/playIt/skip/done/exit) even though the plan's acceptance criteria only required keys to be referenced, not populated — CLAUDE.md mandates full EN/HE parity for all new user-facing strings (Rule 2: missing translations would render raw i18n keys to children)."

patterns-established:
  - "Pattern: when a same-wave plan's not-yet-merged artifact is a plain constants module, inline the literal value with a explanatory comment rather than blocking on cross-worktree merge order."

requirements-completed: [PRAC-03, PRAC-04]

# Metrics
duration: 12min
completed: 2026-07-10
---

# Phase 02 Plan 03: Session Grading-Mode Lock + Review-Drill Building Blocks Summary

**Session-scoped, lockable gradingMode state on SightReadingSessionContext plus two isolated Review-mistakes building blocks — the useReviewDrill enharmonic-aware mistake-advance state machine and the ReviewDrillPanel presentational UI — built and tested in isolation ahead of game-file wiring in 02-07/02-09.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-10T06:16:00Z
- **Completed:** 2026-07-10T06:23:06Z
- **Tasks:** 3
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments

- `SightReadingSessionContext` now exposes a lockable, allowlist-guarded `gradingMode` (Practice/Test) following the exact combo/isOnFire ref-mirror composition — `lockMode()`/`unlockMode()` gate `setGradingMode` mid-session (D-05), and `gradingModeRef` lets detection callbacks read the mode synchronously without stale closures.
- `useReviewDrill` filters an exercise's `performanceResults` down to only `missed` + `wrong_pitch` entries, resolves each mistake's target pitch, and steps through them one at a time via enharmonic-aware pitch matching (`Db4` correctly advances a `C#4` target) — with a `skip()` escape hatch and zero scoring/combo side effects (D-16/D-17/D-18/D-19, T-02-01). 9 tests cover every behavior in the plan.
- `ReviewDrillPanel` renders the review UI (title/progress/instruction/target/Play it/Skip/done+exit) using the FeedbackSummary glass-card shell and `GameActionButton` conventions verbatim, with full EN+HE i18n coverage for every new string.

## Task Commits

1. **Task 1: Add session-scoped gradingMode + lock state to SightReadingSessionContext** - `c6e592bb` (feat)
2. **Task 2: Create useReviewDrill hook + test** - `ffe785a5` (feat)
3. **Task 3: Create ReviewDrillPanel component** - `776616b6` (feat)

_Note: Task 2 was declared `tdd="true"` in the plan; hook + its full test suite were authored and verified together in a single commit rather than split into separate RED/GREEN commits — the hook's behavior contract was fully specified upfront in the plan's `<behavior>` block, so there was no ambiguity requiring a failing-test-first checkpoint._

## Files Created/Modified

- `src/contexts/SightReadingSessionContext.jsx` - Added gradingMode/isModeLocked state+ref pairs, setGradingMode (locked+allowlist guarded)/lockMode/unlockMode callbacks, wired into memoized value/deps
- `src/components/games/sight-reading-game/hooks/useReviewDrill.js` - NEW: mistake-list derivation, enharmonic-aware handlePitch/skip/start/reset, playCurrentTarget injection point
- `src/components/games/sight-reading-game/hooks/useReviewDrill.test.js` - NEW: 9 tests (filter correctness, enharmonic match, non-match, completion, zero-mistakes, skip, playTargetPitch injection, no-combo-API assertion, reset)
- `src/components/games/sight-reading-game/components/ReviewDrillPanel.jsx` - NEW: presentational review panel
- `src/locales/en/common.json` / `src/locales/he/common.json` - Added `sightReading.review.*` subtree (title/progress/instruction/playIt/skip/done/exit)

## Decisions Made

- GRADING_MODES inlined locally in the context file (see key-decisions in frontmatter) rather than importing 02-01's not-yet-merged `constants/gradingModes.js` — avoids a build-breaking import in this parallel worktree while keeping the literal value identical for a trivial post-merge swap.
- Target-pitch resolution prefers `patternNotes[noteIndex].pitch` (per plan spec) with a fallback to `performanceResults[i].expected` (which the game already populates with the same value) for defense-in-depth.
- Added full EN/HE i18n for the new `sightReading.review.*` keys beyond the plan's literal acceptance-criteria wording, per CLAUDE.md's i18n mandate (Rule 2).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Inlined GRADING_MODES literal instead of importing not-yet-merged constants module**

- **Found during:** Task 1
- **Issue:** Plan's action step instructed importing `GRADING_MODES` from `../components/games/sight-reading-game/constants/gradingModes`, a file created by plan 02-01 which is in the same wave but a separate, not-yet-merged parallel worktree — the file does not exist in this worktree and the import would break the build/tests.
- **Fix:** Inlined `const GRADING_MODES = { PRACTICE: "practice", TEST: "test" };` directly in `SightReadingSessionContext.jsx` with a comment explaining the temporary duplication and pointing at 02-07 integration as the point to switch to the canonical import. Value literals confirmed to match 02-01's plan spec exactly (`GRADING_MODES = { PRACTICE: "practice", TEST: "test" }`, verified by reading 02-01-PLAN.md's Task 1 action block).
- **Files modified:** src/contexts/SightReadingSessionContext.jsx
- **Verification:** `npx vitest run src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx` green; `grep -q "gradingMode"` passes.
- **Committed in:** c6e592bb (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added missing EN/HE locale entries for sightReading.review.\***

- **Found during:** Task 3
- **Issue:** The plan's action block specifies the i18n _keys_ the panel should reference but doesn't include a locale-file-population step; shipping the panel without populated translations would render raw i18n keys (e.g. literal string "sightReading.review.title") to child users in production, violating the codebase's full-EN/HE-parity convention (CLAUDE.md i18n section, and every existing `sightReading.*` key has both locales populated).
- **Fix:** Added a `review` sub-object under `sightReading` in both `src/locales/en/common.json` and `src/locales/he/common.json` with all 7 keys (title, progress, instruction, playIt, skip, done, exit), matching the tone/register of neighboring `sightReading.*` strings.
- **Files modified:** src/locales/en/common.json, src/locales/he/common.json
- **Verification:** Both files parse as valid JSON (`node -e "JSON.parse(...)"`); ESLint clean.
- **Committed in:** 776616b6 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for correctness (build wouldn't run) and completeness (no untranslated child-facing UI shipped). No scope creep — no new components, no architectural changes.

## Issues Encountered

None beyond the two deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `SightReadingSessionContext`'s gradingMode/lock contract, `useReviewDrill`, and `ReviewDrillPanel` are all built, tested in isolation, and ready for wiring into `SightReadingGame.jsx` in plans 02-07/02-09.
- Blocker for full integration: once 02-01 merges, `SightReadingSessionContext.jsx`'s inlined `GRADING_MODES` literal should be swapped for the canonical `import { GRADING_MODES } from ".../constants/gradingModes"` — flagged inline with a comment; a one-line change, not a functional risk.
- Full sight-reading suite green (137/137 tests, 10 files) after all three tasks; ESLint clean on every touched file.

---

_Phase: 02-practice-tooling_
_Completed: 2026-07-10_

## Self-Check: PASSED

All 5 created/modified files verified present on disk; all 3 task commit hashes (c6e592bb, ffe785a5, 776616b6) verified present in git log.
