---
phase: 04-parent-calendar-heatmap
plan: 01
subsystem: api
tags: [supabase, vitest, tdd, practice-tracking, heatmap]

# Dependency graph
requires:
  - phase: 02-data-foundation-and-core-logging
    provides: instrument_practice_logs table with practiced_on DATE column and student_id RLS

provides:
  - getHistoricalLogs() async method on practiceLogService — queries 52-week date range from instrument_practice_logs
  - buildHeatmapData() named export — pure function producing 364-entry Activity[] for react-activity-calendar v3
  - computeLongestStreak() named export — pure function finding longest consecutive-day chain
affects:
  - 04-02-PLAN.md — PracticeHeatmapCard component depends on all three exports

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD red-green cycle with Vitest mock chain helpers for Supabase query builder
    - Named exports (not service object methods) for pure utility functions — enables direct import in tests without Supabase mock overhead
    - mockHistoricalQuery helper pattern: chains from().select().eq().gte().lte().order() for multi-step Supabase filter queries

key-files:
  created: []
  modified:
    - src/services/practiceLogService.js
    - src/services/practiceLogService.test.js

key-decisions:
  - "getHistoricalLogs uses session.user.id (not passed studentId) — enforces RLS; studentId prop on UI component is for TanStack Query key only"
  - "buildHeatmapData and computeLongestStreak are named exports (not on service object) — pure functions with no Supabase dependency, directly testable"
  - "buildHeatmapData accepts both {practiced_on: string} rows and plain strings — flexible input handling via typeof check"
  - "computeLongestStreak handles duplicate dates gracefully (diffDays===0 skips without reset) — dedup not required at input"

patterns-established:
  - "Pattern: Supabase multi-filter mock chain — const orderMock = vi.fn().mockResolvedValue(); lteMock returns {order}; gteMock returns {lte}; etc."
  - "Pattern: Pure utility functions as named exports alongside service object — avoids coupling date-math logic to Supabase dependency"

requirements-completed: [PARENT-01, PARENT-02]

# Metrics
duration: 3min
completed: 2026-03-24
---

# Phase 04 Plan 01: Parent Calendar Heatmap Data Layer Summary

**52-week practice log query (getHistoricalLogs), 364-day heatmap transformer (buildHeatmapData), and longest-streak calculator (computeLongestStreak) added to practiceLogService with 18 new TDD-verified tests**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-24T17:41:38Z
- **Completed:** 2026-03-24T17:44:34Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Added `getHistoricalLogs(startDate, endDate)` to `practiceLogService` — queries `instrument_practice_logs` with `.gte().lte().order()` filter chain, enforces RLS via `session.user.id`, coalesces null to `[]`
- Added `buildHeatmapData(practicedDates, endDate)` as named export — pure function that fills all 364 days of a 52-week window with `{date, count, level}` entries required by react-activity-calendar v3; deduplicates input via Set
- Added `computeLongestStreak(practicedDates)` as named export — pure function that sorts, iterates, and finds longest consecutive-day chain, handles month boundaries and duplicate dates
- 18 new unit tests pass; all 12 pre-existing tests still pass (30/30 total)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getHistoricalLogs, buildHeatmapData, computeLongestStreak + tests** - `837274a` (feat)
   - TDD: RED (18 failing) confirmed before implementation
   - TDD: GREEN (30/30 passing) confirmed after implementation

**Plan metadata:** (docs commit follows)

_Note: TDD task has single commit — test and implementation written in same atomic operation per plan spec_

## Files Created/Modified

- `src/services/practiceLogService.js` — Added `getHistoricalLogs()` method on service object, `buildHeatmapData()` named export, `computeLongestStreak()` named export. All existing methods (logPractice, getTodayStatus, getCalendarDate, PRACTICE_XP_REWARD) untouched.
- `src/services/practiceLogService.test.js` — Extended with three new describe blocks (getHistoricalLogs: 5 tests, buildHeatmapData: 7 tests, computeLongestStreak: 6 tests). Import updated to include `buildHeatmapData` and `computeLongestStreak` named exports.

## Decisions Made

- `getHistoricalLogs` uses `session.user.id` (not a passed `studentId`) — consistent with RLS pattern in existing service methods; the `studentId` prop on `PracticeHeatmapCard` is for the TanStack Query key only (per 04-RESEARCH.md note)
- `buildHeatmapData` and `computeLongestStreak` are named exports rather than service object methods — pure functions have no Supabase dependency and benefit from direct import in tests without mock overhead
- Both pure functions accept `{practiced_on: string}` objects OR plain strings via `typeof` check — flexible for callers and tests

## Deviations from Plan

None — plan executed exactly as written. Implementation matches the code stubs specified in the plan action section verbatim, with the addition of JSDoc documentation.

## Issues Encountered

**Pre-existing test failure (out of scope, logged to deferred-items):** `src/components/auth/ParentEmailStep.test.jsx` fails with `i18n.dir is not a function` — caused by Phase 01 signup flow i18n work (file modified before this session). Not introduced by this plan. The full suite shows 1 pre-existing failure, 19 passing, 1 skipped.

## Known Stubs

None — all three functions are fully implemented with real logic. No hardcoded empty values, placeholders, or TODO comments introduced.

## Next Phase Readiness

- Plan 02 (PracticeHeatmapCard UI component) can proceed immediately
- All three required exports are available: `practiceLogService.getHistoricalLogs`, `buildHeatmapData`, `computeLongestStreak`
- react-activity-calendar npm package still needs installation before Plan 02 can render (noted in 04-RESEARCH.md Environment Availability table)
- No blockers

---
*Phase: 04-parent-calendar-heatmap*
*Completed: 2026-03-24*
