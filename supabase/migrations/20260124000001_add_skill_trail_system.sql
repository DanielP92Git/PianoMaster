-- Migration: Add Skill Trail System
-- Date: 2026-01-24
-- Description: Adds tables and columns to support gamification trail system with
--              skill nodes, star ratings, XP progression, and daily goals

-- ============================================
-- 1. Student Skill Progress Table
-- ============================================
CREATE TABLE IF NOT EXISTS student_skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  stars INTEGER DEFAULT 0 CHECK (stars >= 0 AND stars <= 3),
  best_score INTEGER DEFAULT 0,
  exercises_completed INTEGER DEFAULT 0,
  last_practiced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_student_node UNIQUE(student_id, node_id)
);

-- Index for faster lookups by student
CREATE INDEX IF NOT EXISTS idx_skill_progress_student
  ON student_skill_progress(student_id);

-- Index for faster lookups by student and last practiced
CREATE INDEX IF NOT EXISTS idx_skill_progress_student_last_practiced
  ON student_skill_progress(student_id, last_practiced DESC);

-- Enable Row Level Security
ALTER TABLE student_skill_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_skill_progress
-- Students can view their own progress
CREATE POLICY student_skill_progress_select_own
  ON student_skill_progress
  FOR SELECT
  USING (
    student_id = auth.uid()
  );

-- Students can insert/update their own progress
CREATE POLICY student_skill_progress_insert_own
  ON student_skill_progress
  FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
  );

CREATE POLICY student_skill_progress_update_own
  ON student_skill_progress
  FOR UPDATE
  USING (
    student_id = auth.uid()
  );

-- Teachers can view progress of their students
CREATE POLICY student_skill_progress_select_teacher
  ON student_skill_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_student_connections tsc
      WHERE tsc.student_id = student_skill_progress.student_id
        AND tsc.teacher_id = auth.uid()
        AND tsc.status = 'accepted'
    )
  );

-- ============================================
-- 2. Add XP and Level to Students Table
-- ============================================
-- Add columns if they don't exist
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;

-- Add check constraints (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_total_xp_non_negative'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_total_xp_non_negative CHECK (total_xp >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_level_valid'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_level_valid CHECK (current_level >= 1 AND current_level <= 10);
  END IF;
END $$;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_students_total_xp
  ON students(total_xp DESC);

-- ============================================
-- 3. Daily Goals Table
-- ============================================
CREATE TABLE IF NOT EXISTS student_daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  goal_date DATE NOT NULL,
  goals JSONB NOT NULL,
  completed_goals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_student_goal_date UNIQUE(student_id, goal_date)
);

-- Index for faster lookups by student and date
CREATE INDEX IF NOT EXISTS idx_daily_goals_student_date
  ON student_daily_goals(student_id, goal_date DESC);

-- Enable Row Level Security
ALTER TABLE student_daily_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_daily_goals
-- Students can view their own daily goals
CREATE POLICY student_daily_goals_select_own
  ON student_daily_goals
  FOR SELECT
  USING (
    student_id = auth.uid()
  );

-- Students can insert/update their own daily goals
CREATE POLICY student_daily_goals_insert_own
  ON student_daily_goals
  FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
  );

CREATE POLICY student_daily_goals_update_own
  ON student_daily_goals
  FOR UPDATE
  USING (
    student_id = auth.uid()
  );

-- Teachers can view daily goals of their students
CREATE POLICY student_daily_goals_select_teacher
  ON student_daily_goals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_student_connections tsc
      WHERE tsc.student_id = student_daily_goals.student_id
        AND tsc.teacher_id = auth.uid()
        AND tsc.status = 'accepted'
    )
  );

-- ============================================
-- 4. Functions for XP Management
-- ============================================

-- Function to award XP to a student and calculate level
CREATE OR REPLACE FUNCTION award_xp(
  p_student_id UUID,
  p_xp_amount INTEGER
)
RETURNS TABLE(
  new_total_xp INTEGER,
  new_level INTEGER,
  leveled_up BOOLEAN
) AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_level_thresholds INTEGER[] := ARRAY[0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
  v_leveled_up BOOLEAN;
BEGIN
  -- Get current XP and level
  SELECT total_xp, current_level
  INTO v_current_xp, v_current_level
  FROM students
  WHERE id = p_student_id;

  -- Calculate new XP
  v_new_xp := v_current_xp + p_xp_amount;

  -- Calculate new level
  v_new_level := 1;
  FOR i IN 1..10 LOOP
    IF v_new_xp >= v_level_thresholds[i] THEN
      v_new_level := i;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Check if leveled up
  v_leveled_up := v_new_level > v_current_level;

  -- Update student record
  UPDATE students
  SET total_xp = v_new_xp,
      current_level = v_new_level
  WHERE id = p_student_id;

  -- Return results
  RETURN QUERY SELECT v_new_xp, v_new_level, v_leveled_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION award_xp(UUID, INTEGER) TO authenticated;

-- ============================================
-- 5. Comments for Documentation
-- ============================================
COMMENT ON TABLE student_skill_progress IS
  'Tracks student progress through the skill trail with star ratings and scores';

COMMENT ON COLUMN student_skill_progress.stars IS
  '0-3 stars based on performance: 0=not attempted, 1=60-79%, 2=80-94%, 3=95-100%';

COMMENT ON TABLE student_daily_goals IS
  'Daily goals assigned to students for engagement (3 goals per day)';

COMMENT ON COLUMN students.total_xp IS
  'Total XP accumulated by the student across all activities';

COMMENT ON COLUMN students.current_level IS
  'Current level (1-10) based on total XP thresholds';

COMMENT ON FUNCTION award_xp IS
  'Awards XP to a student and automatically calculates level progression';
