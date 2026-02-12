-- Migration: Fix award_xp Security Vulnerability
-- Date: 2026-01-26
-- Description: Adds authorization check to ensure users can only award XP to themselves
--              This fixes a critical security vulnerability where any authenticated user
--              could award XP to any student.

-- Drop the existing function
DROP FUNCTION IF EXISTS award_xp(UUID, INTEGER);

-- Recreate the function with authorization check
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
  -- SECURITY CHECK: Ensure the caller can only award XP to themselves
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only award XP to yourself';
  END IF;

  -- Get current XP and level
  SELECT total_xp, current_level
  INTO v_current_xp, v_current_level
  FROM students
  WHERE id = p_student_id;

  -- Verify the student exists
  IF v_current_xp IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

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

-- Update the comment to document the security requirement
COMMENT ON FUNCTION award_xp IS
  'Awards XP to a student and automatically calculates level progression. Security: Users can only award XP to themselves (auth.uid() must equal p_student_id).';
