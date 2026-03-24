---
phase: 05-milestone-celebrations
plan: 01
subsystem: database
tags: [supabase, postgres, migration, i18n, testing, vitest]

# Dependency graph
requires:
  - phase: 02-data-foundation-and-core-logging
    provides: instrument_practice_streak table that this plan extends with last_milestone_celebrated column
provides:
  - last_milestone_celebrated INTEGER column on instrument_practice_streak (migration)
  - getPracticeStreak returning lastMilestoneCelebrated field
  - updatePracticeStreak resetting lastMilestoneCelebrated to 0 on streak break and returning it
  - updateLastMilestoneCelebrated(milestone) method for post-modal write-back
  - EN/HE i18n keys for all 4 milestone tiers (5/10/21/30)
affects: [05-02-milestone-celebrations-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Selective upsert: include last_milestone_celebrated in upsert payload ONLY when resetting (gap > 1) — omit on increment so Supabase preserves existing value"
    - "TDD for service extension: RED (failing tests) then GREEN (implementation) with all 25 tests passing"

key-files:
  created:
    - supabase/migrations/20260324000002_add_last_milestone_celebrated.sql
  modified:
    - src/services/practiceStreakService.js
    - src/services/practiceStreakService.test.js
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "Omit last_milestone_celebrated from upsert on streak increment — Supabase only updates columns included in payload, so omitting preserves current value without a separate read"
  - "Return lastMilestoneCelebrated: 0 immediately from reset path without re-reading DB — value is deterministic"
  - "Same-day no-op early return now includes lastMilestoneCelebrated from current row"

patterns-established:
  - "Conditional upsert payload: build base object first, then conditionally add reset fields"

requirements-completed: [LOG-04]

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 05 Plan 01: Milestone Celebrations Data Foundation Summary

**Supabase migration adds last_milestone_celebrated column, practiceStreakService extended with read/write/reset logic, full EN/HE i18n for 4 milestone tiers (5/10/21/30)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-24T21:10:51Z
- **Completed:** 2026-03-24T21:15:50Z
- **Tasks:** 2
- **Files modified:** 5 (1 created migration + 2 service files + 2 locale files)

## Accomplishments

- Migration file adding `last_milestone_celebrated INTEGER NOT NULL DEFAULT 0` to `instrument_practice_streak` (IF NOT EXISTS guard + COMMENT)
- `practiceStreakService` extended: `getPracticeStreak` returns `lastMilestoneCelebrated`, `updatePracticeStreak` resets it on streak break and returns it in all code paths, new `updateLastMilestoneCelebrated(milestone)` method for post-modal write-back
- 9 new tests added (25 total, all passing) covering all milestone field behaviors via TDD
- Complete EN/HE translations for 4 milestone tiers with kid-friendly progressively effusive copy

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration + service extension + service tests** - `15180f9` (feat)
2. **Task 2: i18n keys for milestone celebrations (EN + HE)** - `3d60cd0` (feat)

## Files Created/Modified

- `supabase/migrations/20260324000002_add_last_milestone_celebrated.sql` - Adds last_milestone_celebrated column to instrument_practice_streak
- `src/services/practiceStreakService.js` - Extended with milestone field in get/update/reset + new updateLastMilestoneCelebrated method
- `src/services/practiceStreakService.test.js` - 9 new tests: 4 for getPracticeStreak, 3 for updatePracticeStreak milestone behavior, 2 for updateLastMilestoneCelebrated
- `src/locales/en/common.json` - practice.milestone object with tiers 5/10/21/30 + dismiss/daysLabel/ariaLabel
- `src/locales/he/common.json` - practice.milestone object with RTL-appropriate Hebrew strings

## Decisions Made

- Omit `last_milestone_celebrated` from upsert payload on streak increment — Supabase only updates columns you include, so this preserves the existing value without needing an extra read-back
- Return `lastMilestoneCelebrated: 0` directly from the streak-reset path without re-reading the DB (value is deterministic after reset)
- Same-day no-op early return now includes `lastMilestoneCelebrated` from the current row read

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

The migration `20260324000002_add_last_milestone_celebrated.sql` must be applied to the Supabase database. Run via Supabase dashboard or CLI before Plan 02 milestone UI is deployed.

## Next Phase Readiness

- Data foundation complete: DB column + service methods + i18n strings are all in place
- Plan 02 (milestone UI component) can proceed immediately — all contracts it needs are established
- No blockers

---
*Phase: 05-milestone-celebrations*
*Completed: 2026-03-24*
