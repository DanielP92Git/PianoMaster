-- Migration: Add Streak Protection columns to current_streak
-- Created: 2026-03-05
-- Phase: 18 - Streak Protection (STRK-01, STRK-02, STRK-03, STRK-04, STRK-05)
--
-- Purpose: Extend current_streak table with freeze inventory, weekend pass flag,
--          comeback bonus state, and freeze consume tracking. All streak protection
--          logic lives in the JavaScript service layer (streakService.js) for
--          testability — no new Postgres functions are created here.
--
-- Grace window: 36 hours from last practice timestamp (not midnight cutoff)
-- Freeze cap:   Maximum 3 freezes in inventory at any time
-- Freeze earn:  1 freeze per 7-day streak milestone (7, 14, 21, ...)
-- Weekend pass: Skips Friday (day 5) and Saturday (day 6) in streak evaluation

-- ============================================================
-- Add columns to current_streak table
-- ============================================================

-- Current freeze inventory (0-3). Earned at 7-day milestones, consumed automatically
-- when grace window expires. Capped at 3 — earning at cap does not add more.
ALTER TABLE current_streak
  ADD COLUMN IF NOT EXISTS streak_freezes INTEGER NOT NULL DEFAULT 0;

-- Parent-gated toggle: when true, Friday and Saturday are skipped in streak evaluation.
-- Thursday practice connects to Sunday without penalty. Covers Israeli Shabbat pattern.
ALTER TABLE current_streak
  ADD COLUMN IF NOT EXISTS weekend_pass_enabled BOOLEAN NOT NULL DEFAULT false;

-- Prevents double-earn: set to now() when a freeze is awarded at a milestone.
-- JS layer checks this is not within the current milestone window before earning again.
ALTER TABLE current_streak
  ADD COLUMN IF NOT EXISTS last_freeze_earned_at TIMESTAMPTZ;

-- Comeback bonus state: both NULL when no bonus is active.
-- Set when streak breaks (grace expired AND freeze exhausted).
-- Comeback bonus provides 2x XP for 3 days from streak-break timestamp.
ALTER TABLE current_streak
  ADD COLUMN IF NOT EXISTS comeback_bonus_start TIMESTAMPTZ;

ALTER TABLE current_streak
  ADD COLUMN IF NOT EXISTS comeback_bonus_expires TIMESTAMPTZ;

-- Set to now() when a freeze is auto-consumed to preserve a streak.
-- UI reads this to show a one-time "A Streak Freeze saved your streak!" toast.
-- Cleared to NULL after the toast has been displayed (Plan 02).
ALTER TABLE current_streak
  ADD COLUMN IF NOT EXISTS last_freeze_consumed_at TIMESTAMPTZ;

-- ============================================================
-- Add check constraint: freeze inventory stays within 0-3 range
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'current_streak_freezes_range'
  ) THEN
    ALTER TABLE current_streak
      ADD CONSTRAINT current_streak_freezes_range
      CHECK (streak_freezes >= 0 AND streak_freezes <= 3);
  END IF;
END $$;

-- ============================================================
-- RLS: existing "Users can manage their streak" policy (FOR ALL)
-- already covers SELECT and UPDATE on all columns — Postgres RLS
-- is row-level only, not column-level, so new columns are included
-- automatically. No new policies needed.
-- ============================================================

-- Verify RLS is enabled (idempotent; no-op if already enabled)
ALTER TABLE current_streak ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Column documentation
-- ============================================================
COMMENT ON COLUMN current_streak.streak_freezes IS
  'Freeze inventory (0-3). Earned at every 7-day streak milestone. Auto-consumed when 36-hour grace expires.';

COMMENT ON COLUMN current_streak.weekend_pass_enabled IS
  'When true, Friday (day 5) and Saturday (day 6) are skipped in streak evaluation. Parent-gated toggle.';

COMMENT ON COLUMN current_streak.last_freeze_earned_at IS
  'Timestamp of most recent freeze award. Used by JS layer to prevent double-earn at same milestone.';

COMMENT ON COLUMN current_streak.comeback_bonus_start IS
  'Set to now() when a streak breaks. NULL when no comeback bonus is active.';

COMMENT ON COLUMN current_streak.comeback_bonus_expires IS
  'Set to comeback_bonus_start + 3 days when streak breaks. NULL when no bonus active.';

COMMENT ON COLUMN current_streak.last_freeze_consumed_at IS
  'Set to now() when a freeze is auto-consumed to preserve a streak. Read by UI to show toast, then cleared.';
