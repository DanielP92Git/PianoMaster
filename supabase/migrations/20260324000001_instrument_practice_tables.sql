-- Instrument Practice Tracking — Phase 2
-- Creates tables for daily instrument practice logging and practice streak tracking.
-- Both tables cascade-delete for COPPA hard-delete compliance (INFRA-02).
--
-- Design decisions:
--   INFRA-03: UNIQUE constraint on (student_id, practiced_on) — one log per student per day
--   INFRA-04: practiced_on is DATE (not TIMESTAMPTZ) — client sends local calendar date to avoid UTC drift
--   D-12: instrument_practice_streak is SEPARATE from current_streak — independent service
--   D-13: ON DELETE CASCADE on both FKs — COPPA hard-delete compliance

-- ============================
-- Table 1: instrument_practice_logs
-- ============================
CREATE TABLE IF NOT EXISTS instrument_practice_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  practiced_on DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE instrument_practice_logs IS 'Daily instrument practice log. One row per student per day.';
COMMENT ON COLUMN instrument_practice_logs.practiced_on IS 'Local calendar date from client JS (not UTC). See INFRA-04 — prevents UTC timezone drift bug.';

-- INFRA-03: one log per student per day (idempotent insert guard)
CREATE UNIQUE INDEX uq_practice_log_student_date
  ON instrument_practice_logs(student_id, practiced_on);

-- Query index: fetch logs by student ordered by date (for heatmap in Phase 4)
CREATE INDEX idx_practice_logs_student_date
  ON instrument_practice_logs(student_id, practiced_on DESC);

ALTER TABLE instrument_practice_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own practice logs"
  ON instrument_practice_logs FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own practice log"
  ON instrument_practice_logs FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

GRANT SELECT, INSERT ON instrument_practice_logs TO authenticated;

-- ============================
-- Table 2: instrument_practice_streak
-- ============================
CREATE TABLE IF NOT EXISTS instrument_practice_streak (
  student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_practiced_on DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE instrument_practice_streak IS 'Per-student instrument practice streak. Separate from app-usage current_streak (STRK-03 / D-12).';
COMMENT ON COLUMN instrument_practice_streak.student_id IS 'Primary key is the student UUID — single row per student.';
COMMENT ON COLUMN instrument_practice_streak.last_practiced_on IS 'Local calendar date (DATE, not TIMESTAMPTZ) for gap calculation. See INFRA-04.';
COMMENT ON COLUMN instrument_practice_streak.streak_count IS 'Current consecutive days of instrument practice. Separate from app-usage streak in current_streak table.';

ALTER TABLE instrument_practice_streak ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own practice streak"
  ON instrument_practice_streak FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- GRANT UPDATE required for UPSERT operations (see Pitfall 4 in research)
GRANT SELECT, INSERT, UPDATE ON instrument_practice_streak TO authenticated;
