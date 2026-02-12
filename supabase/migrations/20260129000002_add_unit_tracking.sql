-- ============================================================================
-- Migration: Add Unit Tracking to Trail System
-- Date: 2026-01-29
-- Description: Adds unit_id column to student_skill_progress and creates
--              student_unit_progress table for tracking unit-level completion
-- ============================================================================

-- Add unit_id column to student_skill_progress for easier queries
ALTER TABLE student_skill_progress
ADD COLUMN IF NOT EXISTS unit_id TEXT;

-- Add index on unit_id for performance
CREATE INDEX IF NOT EXISTS idx_student_skill_progress_unit_id
  ON student_skill_progress(student_id, unit_id);

-- Create student_unit_progress table for tracking unit completion
CREATE TABLE IF NOT EXISTS student_unit_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  unit_id TEXT NOT NULL,
  category TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_stars INTEGER DEFAULT 0,
  boss_defeated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(student_id, unit_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_unit_progress_student_id
  ON student_unit_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_student_unit_progress_category
  ON student_unit_progress(student_id, category);

-- Enable RLS on student_unit_progress
ALTER TABLE student_unit_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can view their own unit progress
CREATE POLICY "Students can view own unit progress"
  ON student_unit_progress
  FOR SELECT
  USING (auth.uid() = student_id);

-- RLS Policy: Students can insert their own unit progress
CREATE POLICY "Students can insert own unit progress"
  ON student_unit_progress
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- RLS Policy: Students can update their own unit progress
CREATE POLICY "Students can update own unit progress"
  ON student_unit_progress
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- RLS Policy: Teachers can view their students' unit progress
CREATE POLICY "Teachers can view students unit progress"
  ON student_unit_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_student
      WHERE teacher_student.student_id = student_unit_progress.student_id
        AND teacher_student.teacher_id = auth.uid()
    )
  );

-- Function to update unit progress when a node is completed
CREATE OR REPLACE FUNCTION update_unit_progress_on_node_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_unit_id TEXT;
  v_category TEXT;
  v_total_stars INTEGER;
  v_is_boss BOOLEAN;
BEGIN
  -- Skip if unit_id is not set (legacy nodes)
  IF NEW.unit_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_unit_id := NEW.unit_id;

  -- Get category from node_id prefix (treble_, bass_, rhythm_)
  IF NEW.node_id LIKE 'treble_%' THEN
    v_category := 'treble_clef';
  ELSIF NEW.node_id LIKE 'bass_%' THEN
    v_category := 'bass_clef';
  ELSIF NEW.node_id LIKE 'rhythm_%' THEN
    v_category := 'rhythm';
  ELSIF NEW.node_id LIKE 'boss_%' THEN
    v_category := 'boss';
    v_is_boss := TRUE;
  ELSE
    v_category := 'unknown';
  END IF;

  -- Calculate total stars for the unit
  SELECT COALESCE(SUM(stars), 0)
  INTO v_total_stars
  FROM student_skill_progress
  WHERE student_id = NEW.student_id
    AND unit_id = v_unit_id;

  -- Upsert unit progress
  INSERT INTO student_unit_progress (
    student_id,
    unit_id,
    category,
    total_stars,
    boss_defeated,
    started_at,
    updated_at
  )
  VALUES (
    NEW.student_id,
    v_unit_id,
    v_category,
    v_total_stars,
    COALESCE(v_is_boss, FALSE),
    NOW(),
    NOW()
  )
  ON CONFLICT (student_id, unit_id)
  DO UPDATE SET
    total_stars = v_total_stars,
    boss_defeated = CASE
      WHEN EXCLUDED.boss_defeated THEN TRUE
      ELSE student_unit_progress.boss_defeated
    END,
    completed_at = CASE
      WHEN NOT student_unit_progress.boss_defeated AND EXCLUDED.boss_defeated THEN NOW()
      ELSE student_unit_progress.completed_at
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update unit progress on node completion
DROP TRIGGER IF EXISTS trigger_update_unit_progress ON student_skill_progress;
CREATE TRIGGER trigger_update_unit_progress
  AFTER INSERT OR UPDATE OF stars
  ON student_skill_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_unit_progress_on_node_completion();

-- Add comment for documentation
COMMENT ON TABLE student_unit_progress IS 'Tracks unit-level progress for the expanded trail system (90 nodes)';
COMMENT ON COLUMN student_skill_progress.unit_id IS 'Unit identifier (e.g., "treble_unit_1") for grouping nodes';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON student_unit_progress TO authenticated;
GRANT SELECT ON student_skill_progress TO authenticated;
