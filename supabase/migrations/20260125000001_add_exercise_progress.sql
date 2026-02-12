-- Migration: Add exercise_progress JSONB column for per-exercise tracking
-- This supports sequential exercise completion within trail nodes

-- Add JSONB column for per-exercise tracking
ALTER TABLE student_skill_progress
ADD COLUMN IF NOT EXISTS exercise_progress JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN student_skill_progress.exercise_progress IS 'Array of per-exercise progress: [{ "index": 0, "type": "note_recognition", "stars": 2, "bestScore": 85, "completedAt": "2026-01-25T..." }, ...]';

-- Create index for querying exercise progress
CREATE INDEX IF NOT EXISTS idx_student_skill_progress_exercise_progress
ON student_skill_progress USING GIN (exercise_progress);
