---
phase: 18-streak-protection
plan: "01"
subsystem: streak-service
tags: [streak, gamification, database, migration, service]
dependency_graph:
  requires: []
  provides: [streak-protection-schema, streak-service-refactored]
  affects: [useStreakWithAchievements, StreakDisplay, Dashboard, VictoryScreen]
tech_stack:
  added: []
  patterns: [hours-based-grace-window, freeze-consumable-pattern, comeback-bonus-state, weekend-pass-day-enumeration]
key_files:
  created:
    - supabase/migrations/20260305000001_streak_protection.sql
  modified:
    - src/services/streakService.js
decisions:
  - "Column on current_streak (not new table) for freeze inventory — avoids joins and matches existing upsert pattern"
  - "All streak logic in JS service layer — no new Postgres functions, consistent with existing patterns and testable without DB"
  - "hoursSince() helper calculates elapsed hours for grace window comparison — not calendar-day-only"
  - "allIntermediateDaysAreWeekend() enumerates each intermediate day and checks getDay() for 5/6 (Fri/Sat)"
  - "effectiveDayGap() handles weekend pass day counting but grace window still uses raw hours"
  - "Double-earn guard: last_freeze_earned_at compared against FREEZE_EARN_INTERVAL days to prevent repeat award"
  - "getStreakState() fetches current_streak + last_practiced_date in parallel with Promise.all"
  - "resetStreak() clears all protection columns (freeze count, comeback bonus, weekend pass) — clean slate"
metrics:
  duration: "3 min 11 sec"
  completed_date: "2026-03-05"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 18 Plan 01: Streak Protection Schema and Service Summary

**One-liner:** 36-hour grace window, streak freeze earn/consume, comeback bonus state, and weekend pass logic in a refactored streakService.js backed by a new migration adding 6 columns to current_streak.

## What Was Built

### Task 1: Database Migration
`supabase/migrations/20260305000001_streak_protection.sql`

Added 6 new columns to the existing `current_streak` table:

| Column | Type | Purpose |
|--------|------|---------|
| `streak_freezes` | INTEGER (0-3) | Freeze inventory — earned every 7 days, consumed on grace expiry |
| `weekend_pass_enabled` | BOOLEAN | When true, Fri/Sat skipped in streak evaluation |
| `last_freeze_earned_at` | TIMESTAMPTZ | Prevents double-earn at same milestone |
| `comeback_bonus_start` | TIMESTAMPTZ | NULL when inactive; set on streak break |
| `comeback_bonus_expires` | TIMESTAMPTZ | Set to start + 3 days on streak break |
| `last_freeze_consumed_at` | TIMESTAMPTZ | Set on auto-consume; UI reads for toast |

Design decisions:
- No new table — column on current_streak avoids joins
- No new Postgres functions — all logic in JS for testability
- Check constraint `current_streak_freezes_range` enforces 0-3 range
- Existing `"Users can manage their streak"` FOR ALL policy covers new columns automatically (Postgres RLS is row-level only)

### Task 2: streakService.js Refactor
`src/services/streakService.js`

**New export: `getStreakState()`**
Returns full streak state in a single parallel query:
```javascript
{
  streakCount: number,
  freezeCount: number,
  weekendPassEnabled: boolean,
  inGraceWindow: boolean,         // >24h but <36h since last practice
  lastFreezeConsumedAt: string|null,
  comebackBonus: { active, expiresAt, daysLeft }
}
```

**Refactored `updateStreak()`**
Returns `{ newStreak, freezeEarned, freezeConsumed, streakBroken, comebackBonusActivated }`.

Business logic in priority order:
1. Same calendar day → return early (no change)
2. First practice → streak = 1
3. Weekend pass + all intermediate days Fri/Sat → consecutive
4. Hours since last practice <= 36 → consecutive (grace window)
5. Past grace + freeze available → consume freeze, preserve streak
6. Past grace + no freeze → streak = 1, activate comeback bonus

Additional logic:
- Freeze earning at every FREEZE_EARN_INTERVAL (7) milestone with double-earn guard
- Expired comeback bonus auto-cleared on next updateStreak() call
- Highest streak still updated as before

**Unchanged exports:**
- `getStreak()` — backward compatible, still returns number
- `getLastPracticeDate()` — unchanged

**New helpers (module-private):**
- `hoursSince(date)` — ms-based elapsed hours
- `getCalendarDate(date)` — YYYY-MM-DD in local timezone
- `allIntermediateDaysAreWeekend(lastPractice, today)` — checks all intermediate days are Fri/Sat
- `effectiveDayGap(lastPractice, today, weekendPassEnabled)` — day count with optional weekend skip

## Decisions Made

1. Column on current_streak (not new table) for freeze inventory — avoids joins and matches existing upsert pattern
2. All streak logic in JS service layer — no new Postgres functions, consistent with existing patterns and testable without DB
3. hoursSince() uses raw milliseconds for accuracy — no rounding artifacts that calendar-day comparison would have
4. allIntermediateDaysAreWeekend() enumerates each intermediate day and checks getDay() for 5/6 (Fri/Sat) — handles multi-day gaps correctly
5. Double-earn guard: last_freeze_earned_at compared against FREEZE_EARN_INTERVAL days — prevents repeat award when updateStreak() called twice at same milestone
6. getStreakState() fetches current_streak + last_practiced_date in parallel with Promise.all — minimizes latency
7. resetStreak() clears all protection columns (freeze count, comeback bonus, weekend pass) — clean slate for testing

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files exist:
- `supabase/migrations/20260305000001_streak_protection.sql` — FOUND
- `src/services/streakService.js` — FOUND (modified)

Commits exist:
- `526ea46` — feat(18-01): add streak protection migration for current_streak table
- `fed39a3` — feat(18-01): refactor streakService.js with full streak protection logic
