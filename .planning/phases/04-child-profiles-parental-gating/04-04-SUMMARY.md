---
phase: 04-child-profiles-parental-gating
plan: 04
subsystem: services
tags: [supabase, rls, coppa, streak, practice-log, xp, vitest]

# Dependency graph
requires:
  - phase: 04-child-profiles-parental-gating (Plan 02)
    provides: ActiveChildContext, useActiveChildId, apiChildProfiles, resetStreakServiceCaches() singleton-reset hook
provides:
  - childId-parameterized streakService (getStreak, getStreakState, getLastPracticeDate, updateStreak, setWeekendPass, resetStreak)
  - childId-parameterized practiceLogService (logPractice, getTodayStatus, getHistoricalLogs)
  - childId-parameterized practiceStreakService (getPracticeStreak, updatePracticeStreak, updateLastMilestoneCelebrated)
  - behavioral proof (streakService.test.js, updated practiceLogService.test.js/practiceStreakService.test.js) that childId — not the session/parent uid — chooses the row target
affects: [04-06, 04-07, 04-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "auth-internal service fix shape: childId as first exported-method param, session.getSession()/getUser() retained only as the RLS principal, student_id row target switched to childId"

key-files:
  created:
    - src/services/streakService.test.js
  modified:
    - src/services/streakService.js
    - src/services/practiceLogService.js
    - src/services/practiceStreakService.js
    - src/services/practiceLogService.test.js
    - src/services/practiceStreakService.test.js

key-decisions:
  - "Kept the internal supabase.auth.getSession()/getUser() call in every method — it remains the RLS-authorizing principal; only the student_id row target was rescoped to childId (D-04: active-child is data, not the authz signal)"
  - "setWeekendPass(childId, enabled) and updateLastMilestoneCelebrated(childId, milestone) place childId first per the plan's fixed-shape contract, pushing the pre-existing positional args to second position"
  - "Call sites (StreakDisplay, ParentPortalPage, PracticeLogCard, PracticeHeatmapCard, useVictoryState, etc.) are intentionally NOT updated here — RESEARCH.md/PATTERNS.md scope those to Plans 06/07 (interface-first ordering); they will pass user.id positionally until then, which is a temporary signature mismatch these callers can't reach without those plans"

patterns-established:
  - "Behavioral-proof test pattern (mirrors authorizationUtils.test.js): mock supabase, assert the row-target eq() call separately from the getSession()-derived principal, plus a legacy-compat case where childId === the mocked session uid"

requirements-completed: [PROFILE-05]

# Metrics
duration: 20min
completed: 2026-08-04
---

# Phase 04 Plan 04: auth-internal services childId parameterization Summary

**streakService, practiceLogService, and practiceStreakService now accept an explicit childId as their first parameter for every exported method, targeting that child's row while keeping the parent's authenticated session as the RLS principal — closing the "silent wrong-child write" class (PROFILE-05) with a new behavioral streakService.test.js.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-04T16:00:00+03:00 (approx)
- **Completed:** 2026-08-04T16:09:32+03:00
- **Tasks:** 2
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- streakService's 6 exported methods (`getStreak`, `getStreakState`, `getLastPracticeDate`, `updateStreak`, `setWeekendPass`, `resetStreak`) all take `childId` first; every `student_id` row target that previously read `session.user.id` now reads `childId`, while `getSession()` is retained as the RLS principal
- New `src/services/streakService.test.js` (8 tests) proves the row target follows `childId` — not the session/parent uid — for every method, with a legacy-compat case (`childId === session uid`)
- `practiceLogService.logPractice/getTodayStatus/getHistoricalLogs` and `practiceStreakService.getPracticeStreak/updatePracticeStreak/updateLastMilestoneCelebrated` given the identical fix shape; `award_xp` RPC now receives `childId` (not `session.user.id`) as `p_student_id`
- Both existing test files updated: callers now pass explicit `childId`, assertions confirm the write/read target equals `childId` (not the session/parent uid), each with a legacy-compat case
- `resetStreakServiceCaches()` (Plan 02) left completely untouched, confirmed via grep

## Task Commits

Each task was committed atomically:

1. **Task 1: streakService childId params + behavioral streakService.test.js** - `45ab6bb` (feat)
2. **Task 2: practiceLogService + practiceStreakService childId params + tests** - `e13e298` (feat)

_Note: lint-staged/prettier auto-reformatted the test files on each commit (pre-commit hook) — no test assertions changed, only formatting._

## Files Created/Modified

- `src/services/streakService.js` - Every exported method takes `childId` first; all `student_id` row targets rescoped from `session.user.id` to `childId`
- `src/services/streakService.test.js` - New behavioral-proof test file (8 tests) mirroring `authorizationUtils.test.js`'s mock-supabase pattern
- `src/services/practiceLogService.js` - `logPractice/getTodayStatus/getHistoricalLogs` take `childId` first; `award_xp` now called with `childId`
- `src/services/practiceStreakService.js` - `getPracticeStreak/updatePracticeStreak/updateLastMilestoneCelebrated` take `childId` first (helpers `_effectiveDayGap`/`allIntermediateDaysAreWeekend` untouched — pure functions, no id involved)
- `src/services/practiceLogService.test.js` - Updated all call sites to pass `childId`; added row-target and legacy-compat assertions
- `src/services/practiceStreakService.test.js` - Updated all call sites to pass `childId`; added row-target and legacy-compat assertions

## Decisions Made

- Retained `supabase.auth.getSession()`/`getUser()` in every method as the RLS-authorizing principal — only the `student_id` write/read target was rescoped to the passed `childId`, per RESEARCH.md's "auth.uid()-Internal Services" fix shape and D-04 (active-child selection is data, not the authorization signal)
- `setWeekendPass(childId, enabled)` and `updateLastMilestoneCelebrated(childId, milestone)` place `childId` as the first parameter per the plan's fixed shape, shifting the existing positional arg (`enabled`, `milestone`) to second position — a breaking signature change for current callers, expected and scoped to Plans 06/07 per "interface-first ordering" in the plan's `<interfaces>` block
- Did not touch call sites (StreakDisplay, ParentPortalPage, PracticeLogCard, PracticeHeatmapCard, useVictoryState, etc.) — explicitly out of scope for this plan; RESEARCH.md/PATTERNS.md route that work to Plans 06/07

## Deviations from Plan

None - plan executed exactly as written. Both tasks matched the plan's `<action>`/`<acceptance_criteria>` precisely; no Rule 1-4 auto-fixes were needed.

## Issues Encountered

None. The Task 1 behavioral test for `updateStreak(childId)` required careful per-table call-counting in the mock (`current_streak`/`last_practiced_date`/`highest_streak` are each read once then written once, in an order determined by the method's internal `Promise.all` + sequential upserts) — resolved with a per-table call-count map rather than a fragile global call index.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The three auth-internal services now have `childId`-first signatures ready for Plans 06/07 to wire real call sites (`ActiveChildContext`'s `activeChildId`, replacing `user.id`)
- **Known temporary state:** any current caller of `streakService.getStreak()`, `getStreakState()`, `getLastPracticeDate()`, `updateStreak()`, `setWeekendPass(enabled)`, `resetStreak()`, `practiceLogService.logPractice(localDate)`, `getTodayStatus(localDate)`, `getHistoricalLogs(startDate, endDate)`, `practiceStreakService.getPracticeStreak()`, `updatePracticeStreak(localDate, weekendPassEnabled)`, or `updateLastMilestoneCelebrated(milestone)` with the OLD (pre-childId) argument order will now pass the wrong value into the `childId` slot (e.g. `updateStreak()` called with no args → `childId` is `undefined`, `setWeekendPass(true)` → `childId` is `true`). This is expected per the plan's interface-first ordering and is fixed by Plans 06/07's call-site rescoping — full-suite (`npm run test:run`) breakage in consumer test files (StreakDisplay, PracticeLogCard, PracticeHeatmapCard, ParentPortalPage, useVictoryState, etc.) is anticipated until those plans land, not a regression introduced here
- `resetStreakServiceCaches()` remains available and untouched for `ActiveChildContext.switchChild()` to call on child switch (Plan 02/06 wiring)

## Known Stubs

None - no stub data introduced by this plan (service-layer signature change only, no UI).

## Threat Flags

None - no new network endpoints, auth paths, or schema changes introduced. The `childId` parameter is data flowing into existing RLS-protected tables (`current_streak`, `last_practiced_date`, `highest_streak`, `instrument_practice_logs`, `instrument_practice_streak`); the plan's own `<threat_model>` already covers this surface (T-04-04-01/02, both closed by RLS `_parent_owner` policies applied in Phase 2).

---

_Phase: 04-child-profiles-parental-gating_
_Completed: 2026-08-04_

## Self-Check: PASSED

All 7 claimed files verified present on disk; both task commits (45ab6bbb, e13e2982) verified present in `git log`.
