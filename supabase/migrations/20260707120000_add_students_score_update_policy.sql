-- ============================================================================
-- Migration: Add missing UPDATE RLS policy for students_score
-- Date: 2026-07-07
-- ============================================================================
-- The live students_score policies are split per-command:
--   * students_score_insert_gate      (INSERT)
--   * students_score_select           (SELECT)
--   * "Students can delete own scores" (DELETE)
-- These replaced the earlier "Consolidated scores access" FOR ALL policy but
-- OMITTED UPDATE. With RLS enabled and no UPDATE policy, a student's in-place
-- score update (e.g. a sight-reading "Try Again" retry improving on a prior
-- attempt) matches 0 rows under RLS -> PostgREST returns 406 (Not Acceptable),
-- the score is never updated, and the app's fallback then inserts a DUPLICATE
-- row -- inflating games-played (useGamesPlayed counts every row) and daily-goal
-- progress (dailyGoalsService counts today's rows).
--
-- Add an ownership-scoped UPDATE policy so students can update their own score
-- rows. This is safe: clients already control the score value on INSERT, so
-- allowing an in-place UPDATE of an already-owned row adds no new capability.
-- No subscription re-gate here (unlike INSERT): the row already passed the
-- insert gate when it was created, and retries must work for all users.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'students_score'
      AND policyname = 'students_score_update'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "students_score_update"
        ON students_score
        FOR UPDATE
        USING (student_id = (SELECT auth.uid()))
        WITH CHECK (student_id = (SELECT auth.uid()))
    $pol$;
  END IF;
END $$;

COMMENT ON POLICY "students_score_update" ON students_score
  IS 'Allows a student to update their own score rows in place (e.g. a "Try Again" retry improving a prior attempt). Ownership-scoped; no subscription re-gate.';
