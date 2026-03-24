---
phase: 02-data-foundation-and-core-logging
plan: 01
subsystem: data-layer
tags: [database, migration, service-layer, practice-tracking, streak, xp, tdd, coppa]
dependency_graph:
  requires: []
  provides:
    - instrument_practice_logs table (DB)
    - instrument_practice_streak table (DB)
    - practiceLogService (JS service)
    - practiceStreakService (JS service)
    - getCalendarDate (shared utility)
  affects:
    - Plan 02 (PracticeLogCard UI will import practiceLogService and practiceStreakService)
    - Plan 04 (parent heatmap will query instrument_practice_logs)
tech_stack:
  added: []
  patterns:
    - TDD (RED → GREEN for Tasks 2 and 3)
    - 23505 unique_violation idempotent insert pattern
    - Weekend-pass gap bridging algorithm (mirrored from streakService.js)
    - COPPA ON DELETE CASCADE for new tables
    - GRANT SELECT/INSERT/UPDATE for upsert support
key_files:
  created:
    - supabase/migrations/20260324000001_instrument_practice_tables.sql
    - src/utils/dateUtils.js
    - src/utils/dateUtils.test.js
    - src/services/practiceLogService.js
    - src/services/practiceLogService.test.js
    - src/services/practiceStreakService.js
    - src/services/practiceStreakService.test.js
  modified: []
decisions:
  - "practiced_on is DATE (not TIMESTAMPTZ) — prevents UTC drift bug, local calendar day is what students expect"
  - "instrument_practice_streak is SEPARATE table from current_streak — independent streak tracking per D-12"
  - "XP award failure is non-blocking — practice log recorded even if awardXP throws"
  - "getCalendarDate extracted from streakService.js to shared dateUtils.js — single source of truth"
  - "GRANT UPDATE on instrument_practice_streak required for upsert to work (Pitfall 4 from research)"
metrics:
  duration: "8 minutes"
  completed: "2026-03-23"
  tasks_completed: 3
  tasks_total: 3
  files_created: 7
  test_files: 3
  tests_passing: 35
---

# Phase 02 Plan 01: Data Foundation and Core Logging Summary

**One-liner:** Supabase migration for instrument_practice_logs + instrument_practice_streak tables with RLS/CASCADE, plus practiceLogService (idempotent 23505 insert + 25 XP award) and practiceStreakService (calendar-day gap calc with weekend-pass Fri/Sat bridging).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | DB migration + dateUtils helper | 887ca81 | migration SQL, dateUtils.js, dateUtils.test.js |
| 2 | practiceLogService (TDD) | 9f76b9b | practiceLogService.js, practiceLogService.test.js |
| 3 | practiceStreakService (TDD) | d1e39ec | practiceStreakService.js, practiceStreakService.test.js |

## What Was Built

### Database Migration (`20260324000001_instrument_practice_tables.sql`)

Two new tables:

**`instrument_practice_logs`:**
- `id` UUID primary key, `student_id` UUID FK with ON DELETE CASCADE (COPPA INFRA-02)
- `practiced_on` DATE (local timezone, not TIMESTAMPTZ) — avoids UTC drift bug (INFRA-04)
- UNIQUE index on `(student_id, practiced_on)` — enforces one log per student per day (INFRA-03)
- Query index on `(student_id, practiced_on DESC)` — for parent heatmap Phase 4
- RLS: SELECT + INSERT own rows only. GRANT SELECT, INSERT.

**`instrument_practice_streak`:**
- `student_id` UUID as PRIMARY KEY — single row per student
- `streak_count`, `last_practiced_on` DATE, `updated_at` TIMESTAMPTZ
- RLS: full CRUD on own row. GRANT SELECT, INSERT, UPDATE (UPDATE required for upsert)
- SEPARATE from `current_streak` table (D-12, STRK-03)

### `src/utils/dateUtils.js`

Extracted `getCalendarDate()` from `streakService.js` as a shared utility. Returns `"YYYY-MM-DD"` using local `getFullYear/getMonth/getDate` — not UTC. Prevents the common bug where a late-evening timestamp would return tomorrow's UTC date.

7 tests covering: formatting, zero-padding, no-arg default, timezone consistency.

### `src/services/practiceLogService.js`

`logPractice(localDate)`:
- Inserts into `instrument_practice_logs` with student_id from session
- Catches error.code `'23505'` (unique_violation) and returns `{ inserted: false }` — no throw, no XP
- On success: calls `awardXP(userId, 25)` — XP failure is non-blocking
- Returns `{ inserted: true, xpResult }` on first daily log

`getTodayStatus(localDate)`:
- Queries with `.maybeSingle()` to check if log exists
- Returns `{ logged: boolean }`

11 tests: insert, duplicate, auth check, XP award/skip, error propagation, status check.

### `src/services/practiceStreakService.js`

`getPracticeStreak()`: Fetches streak row, returns `{ streakCount, lastPracticedOn }` (defaults to 0/null).

`updatePracticeStreak(localDate, weekendPassEnabled)`:
- No prior row → `streak = 1`
- Same day → no-op, return current count
- Gap = 1 (consecutive or Fri/Sat bridged) → increment
- Gap > 1 → reset to 1
- Upserts with `onConflict: 'student_id'`

Helper functions (exported for testing):
- `_effectiveDayGap(lastPractice, today, weekendPassEnabled)` — mirrors `streakService.js` algorithm
- `allIntermediateDaysAreWeekend(lastPractice, today)` — Fri/Sat-only check

17 tests: all streak logic branches including Thu→Sun (weekend bridge) and Thu→Mon (Sunday not bridged).

## Verification Results

```
3 test files — 35 tests — 0 failures
✓ src/utils/dateUtils.test.js          (7 tests)
✓ src/services/practiceLogService.test.js   (11 tests)
✓ src/services/practiceStreakService.test.js (17 tests)
```

Pre-existing 3 test file failures (xpSystem.test.js, NotesRecognitionGame.autogrow.test.js, SightReadingGame.micRestart.test.jsx) — all due to missing VITE_SUPABASE_URL env var in test environment. Confirmed pre-existing by checking out before my changes.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all service functions are fully implemented with real Supabase queries.

## Self-Check: PASSED
