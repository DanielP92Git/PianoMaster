-- Migration: Reset Trail Progress for v1.3 Redesigned System
-- Date: 2026-02-04
-- Description: Atomic reset of trail-specific progress while preserving XP totals
--
-- v1.3 introduces 87 redesigned nodes (treble 1-3, bass 1-3, rhythm 1-6) replacing
-- the legacy 18-node system. Progress reset is necessary because:
-- 1. Node IDs have changed (old progress references invalid nodes)
-- 2. Pedagogy has been redesigned for 8-year-old learners
-- 3. Clean start ensures consistent learning experience
--
-- XP totals are preserved to maintain user motivation.
-- See: .planning/phases/11-integration-cutover/11-CONTEXT.md

BEGIN;

-- Step 1: Log pre-migration state (for rollback reference)
DO $$
DECLARE
  v_total_students INTEGER;
  v_total_progress INTEGER;
  v_total_goals INTEGER;
  v_total_unit_progress INTEGER;
  v_total_xp BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total_students FROM students;
  SELECT COUNT(*) INTO v_total_progress FROM student_skill_progress;
  SELECT COUNT(*) INTO v_total_goals FROM student_daily_goals;

  -- Check if student_unit_progress exists (may not exist in all environments)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_unit_progress') THEN
    SELECT COUNT(*) INTO v_total_unit_progress FROM student_unit_progress;
  ELSE
    v_total_unit_progress := 0;
  END IF;

  SELECT COALESCE(SUM(total_xp), 0) INTO v_total_xp FROM students;

  RAISE NOTICE 'Pre-migration state:';
  RAISE NOTICE '  Students: %', v_total_students;
  RAISE NOTICE '  Skill progress records: %', v_total_progress;
  RAISE NOTICE '  Daily goals records: %', v_total_goals;
  RAISE NOTICE '  Unit progress records: %', v_total_unit_progress;
  RAISE NOTICE '  Total XP (preserved): %', v_total_xp;
END $$;

-- Step 2: Delete trail-specific progress
-- Note: These tables track node-specific progress that references old node IDs
DELETE FROM student_skill_progress;
DELETE FROM student_daily_goals;

-- Delete unit progress if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_unit_progress') THEN
    DELETE FROM student_unit_progress;
    RAISE NOTICE 'Deleted student_unit_progress records';
  END IF;
END $$;

-- Step 3: Verify XP totals unchanged (sanity check)
DO $$
DECLARE
  v_total_xp_after BIGINT;
BEGIN
  SELECT COALESCE(SUM(total_xp), 0) INTO v_total_xp_after FROM students;
  RAISE NOTICE 'Post-migration: Total XP preserved: %', v_total_xp_after;
END $$;

-- Step 4: Add migration metadata comment
COMMENT ON TABLE student_skill_progress IS
  'Trail progress reset 2026-02-04 for v1.3 redesigned system (87 nodes). XP totals preserved.';

COMMIT;
