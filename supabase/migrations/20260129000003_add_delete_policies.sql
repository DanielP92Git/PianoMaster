-- ============================================================================
-- Migration: Add DELETE Policies for Trail Reset Functionality
-- Date: 2026-01-29
-- Description: Adds RLS DELETE policies to allow students to delete their own
--              progress data (needed for development reset functionality)
-- ============================================================================

-- Add DELETE policy for student_skill_progress
CREATE POLICY "Students can delete own skill progress"
  ON student_skill_progress
  FOR DELETE
  USING (auth.uid() = student_id);

-- Add DELETE policy for student_unit_progress
CREATE POLICY "Students can delete own unit progress"
  ON student_unit_progress
  FOR DELETE
  USING (auth.uid() = student_id);

-- Add DELETE policy for students_score
-- First check if the policy doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'students_score'
    AND policyname = 'Students can delete own scores'
  ) THEN
    EXECUTE 'CREATE POLICY "Students can delete own scores"
      ON students_score
      FOR DELETE
      USING (auth.uid() = student_id)';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON POLICY "Students can delete own skill progress" ON student_skill_progress
  IS 'Allows students to delete their own progress (used for dev reset functionality)';

COMMENT ON POLICY "Students can delete own unit progress" ON student_unit_progress
  IS 'Allows students to delete their own unit progress (used for dev reset functionality)';
