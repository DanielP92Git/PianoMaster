-- Phase 20: Extend XP levels from 10 (DB) / 15 (JS) to 30 + infinite prestige tiers

-- 1. Drop old CHECK constraint (currently caps at 10)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_level_valid;

-- 2. Add new constraint (no upper bound — prestige levels go beyond 30)
ALTER TABLE students ADD CONSTRAINT students_level_valid CHECK (current_level >= 1);

-- 3. Replace award_xp function with 30-level thresholds + prestige
DROP FUNCTION IF EXISTS award_xp(UUID, INTEGER);

CREATE OR REPLACE FUNCTION award_xp(p_student_id UUID, p_xp_amount INTEGER)
RETURNS TABLE(new_total_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER := 1;
  v_prestige_xp_per_tier INTEGER := 3000;
  v_level_thresholds INTEGER[] := ARRAY[0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7500, 9000, 10500, 12200, 14100, 16200, 18500, 21000, 23700, 26500, 29400, 32500, 35800, 39300, 43000, 46900, 51000];
BEGIN
  -- Authorization check: user can only award XP to themselves
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot award XP to another user';
  END IF;

  -- Get current XP and level
  SELECT total_xp, current_level INTO v_current_xp, v_current_level
  FROM students
  WHERE id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  -- Calculate new XP
  v_new_xp := v_current_xp + p_xp_amount;

  -- Find new level from 30 static thresholds
  FOR i IN 1..30 LOOP
    IF v_new_xp >= v_level_thresholds[i] THEN
      v_new_level := i;
    END IF;
  END LOOP;

  -- Prestige tiers: if at level 30, check for prestige advancement
  IF v_new_level = 30 THEN
    DECLARE
      v_xp_beyond_max INTEGER;
      v_prestige_tier INTEGER;
    BEGIN
      v_xp_beyond_max := v_new_xp - 51000;
      v_prestige_tier := FLOOR(v_xp_beyond_max::numeric / v_prestige_xp_per_tier)::integer;
      IF v_prestige_tier > 0 THEN
        v_new_level := 30 + v_prestige_tier;
      END IF;
    END;
  END IF;

  -- Update student record
  UPDATE students
  SET total_xp = v_new_xp,
      current_level = v_new_level
  WHERE id = p_student_id;

  -- Return result
  new_total_xp := v_new_xp;
  new_level := v_new_level;
  leveled_up := v_new_level > v_current_level;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION award_xp(UUID, INTEGER) TO authenticated;

-- 4. Data fixup — recalculate current_level for all students based on total_xp
WITH level_calc AS (
  SELECT id, total_xp,
    CASE
      WHEN total_xp >= 51000 THEN 30 + FLOOR((total_xp - 51000)::numeric / 3000)::integer
      WHEN total_xp >= 46900 THEN 29
      WHEN total_xp >= 43000 THEN 28
      WHEN total_xp >= 39300 THEN 27
      WHEN total_xp >= 35800 THEN 26
      WHEN total_xp >= 32500 THEN 25
      WHEN total_xp >= 29400 THEN 24
      WHEN total_xp >= 26500 THEN 23
      WHEN total_xp >= 23700 THEN 22
      WHEN total_xp >= 21000 THEN 21
      WHEN total_xp >= 18500 THEN 20
      WHEN total_xp >= 16200 THEN 19
      WHEN total_xp >= 14100 THEN 18
      WHEN total_xp >= 12200 THEN 17
      WHEN total_xp >= 10500 THEN 16
      WHEN total_xp >= 9000 THEN 15
      WHEN total_xp >= 7500 THEN 14
      WHEN total_xp >= 6200 THEN 13
      WHEN total_xp >= 5000 THEN 12
      WHEN total_xp >= 4000 THEN 11
      WHEN total_xp >= 3200 THEN 10
      WHEN total_xp >= 2500 THEN 9
      WHEN total_xp >= 1900 THEN 8
      WHEN total_xp >= 1400 THEN 7
      WHEN total_xp >= 1000 THEN 6
      WHEN total_xp >= 700 THEN 5
      WHEN total_xp >= 450 THEN 4
      WHEN total_xp >= 250 THEN 3
      WHEN total_xp >= 100 THEN 2
      ELSE 1
    END AS correct_level
  FROM students
)
UPDATE students SET current_level = level_calc.correct_level
FROM level_calc WHERE students.id = level_calc.id AND students.current_level != level_calc.correct_level;
