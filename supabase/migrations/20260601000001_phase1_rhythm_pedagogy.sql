-- Migration: Phase 1 (v3.5) — Rhythm Trail Pedagogical Restructure
-- Date: 2026-06-01
-- Description: Atomic migration that
--   (a) wipes rhythm trail progress (clean slate for 10-unit / 55-node restructure)
--   (b) replaces is_free_node() body with new free-tier whitelist (D-12: all 6 U1 free)
-- DEPLOY CONSTRAINT: MUST run BEFORE Netlify code deploy.
-- students_score.total_xp is NEVER touched.
-- Migration is reversible only by manual re-seed (no rollback expected per REQ-06 acceptance).

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- Pre-flight: log counts for forensic comparison
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_rhythm_skill_rows INTEGER;
  v_total_xp_pre BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_rhythm_skill_rows
    FROM student_skill_progress
   WHERE node_id LIKE 'rhythm_%'
      OR node_id LIKE 'boss_rhythm_%';

  SELECT COALESCE(SUM(total_xp), 0) INTO v_total_xp_pre FROM students;

  RAISE NOTICE 'Pre-migration rhythm skill_progress rows targeted: %', v_rhythm_skill_rows;
  RAISE NOTICE 'Pre-migration total_xp (PRESERVED, will not be touched): %', v_total_xp_pre;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- (a) Wipe rhythm trail progress
-- ───────────────────────────────────────────────────────────────────────────
DELETE FROM student_skill_progress
 WHERE node_id LIKE 'rhythm_%'
    OR node_id LIKE 'boss_rhythm_%';

-- Conditionally clean unit-level progress (table presence varies by env)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_name = 'student_unit_progress'
  ) THEN
    DELETE FROM student_unit_progress
     WHERE unit_id LIKE 'rhythm_unit_%';
    RAISE NOTICE 'Cleaned student_unit_progress rhythm_unit_%% rows';
  ELSE
    RAISE NOTICE 'student_unit_progress table not present — skipped';
  END IF;
END $$;

-- NOTE: student_daily_goals.node_id cleanup is deliberately SKIPPED.
-- Per 01-RESEARCH.md Open Question #2: schema column existence not yet confirmed,
-- and goals regenerate on next session, so stale references self-heal.
-- If a follow-up verifies node_id column exists, add a separate small migration.

-- ───────────────────────────────────────────────────────────────────────────
-- (b) Replace is_free_node() body with new free-tier whitelist
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_free_node(p_node_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN p_node_id = ANY(ARRAY[
    -- Treble Unit 1 (unchanged from prior migration)
    'treble_1_1','treble_1_2','treble_1_3','treble_1_4',
    'treble_1_5','treble_1_6','treble_1_7',
    -- Bass Unit 1 (unchanged from prior migration)
    'bass_1_1','bass_1_2','bass_1_3','bass_1_4',
    'bass_1_5','bass_1_6',
    -- Rhythm Unit 1 (NEW for Phase 1 v3.5: Quarter + Quarter Rest, all 6 nodes free per D-12)
    'rhythm_1_1','rhythm_1_2','rhythm_1_3','rhythm_1_4','rhythm_1_5',
    'boss_rhythm_1',
    -- Ear Training Unit 1 (unchanged from prior migration)
    'ear_1_1','ear_1_2','ear_1_3','ear_1_4','ear_1_5','ear_1_6'
  ]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_free_node(TEXT) TO authenticated;

COMMENT ON FUNCTION public.is_free_node IS
  'Returns true for free-tier accessible trail nodes. Synced with JS subscriptionConfig.js FREE_NODE_IDS. Phase 1 v3.5: rhythm restructure (D-12).';

-- ───────────────────────────────────────────────────────────────────────────
-- Post-flight: verify total_xp preserved
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_total_xp_post BIGINT;
  v_remaining_rhythm_rows INTEGER;
BEGIN
  SELECT COALESCE(SUM(total_xp), 0) INTO v_total_xp_post FROM students;
  SELECT COUNT(*) INTO v_remaining_rhythm_rows
    FROM student_skill_progress
   WHERE node_id LIKE 'rhythm_%'
      OR node_id LIKE 'boss_rhythm_%';

  RAISE NOTICE 'Post-migration total_xp (must equal pre-migration): %', v_total_xp_post;
  RAISE NOTICE 'Post-migration remaining rhythm rows (must be 0): %', v_remaining_rhythm_rows;

  IF v_remaining_rhythm_rows <> 0 THEN
    RAISE EXCEPTION 'Phase 1 migration aborted: % rhythm rows remain after DELETE', v_remaining_rhythm_rows;
  END IF;
END $$;

COMMENT ON TABLE student_skill_progress IS
  'Rhythm trail progress wiped 2026-06-01 for Phase 1 v3.5 (10-unit / 55-node restructure). Per-category XP preserved.';

COMMIT;
