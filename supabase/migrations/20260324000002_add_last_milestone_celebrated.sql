-- Add milestone tracking column for once-per-streak celebration (D-06)
ALTER TABLE instrument_practice_streak
  ADD COLUMN IF NOT EXISTS last_milestone_celebrated INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN instrument_practice_streak.last_milestone_celebrated
  IS 'Highest milestone (5/10/21/30) celebrated in current streak. Resets to 0 on streak break. Prevents re-triggering.';
