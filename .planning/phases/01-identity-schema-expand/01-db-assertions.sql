-- =============================================================================
-- 01-db-assertions.sql  —  Phase 1 (v4.0) migration verification suite (D-28)
-- Migration: 20260722120000_add_parents_and_child_profiles
-- Run AFTER apply, against the rehearsal branch (psql -f), then again after
-- rollback+re-apply. Plain SQL, no framework. Each block raises on failure.
--
-- Blocks 1-6, 9, 10 read the real migrated state (OUTSIDE any rollback).
-- Blocks 7, 8 insert synthetic data and are wrapped in BEGIN...ROLLBACK so
-- nothing persists.
--
-- Live baseline captured 2026-07-22 14:17 UTC (project hdltcvgqrtxuxgjdvzzu):
--   students = 20 (15 auth-having + 5 auth-less);  requires_reconsent=true count = 1.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. IDENT-01 — parents table shape (PK on id; exact column set)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM information_schema.table_constraints
          WHERE table_schema='public' AND table_name='parents'
            AND constraint_type='PRIMARY KEY') = 1,
    'IDENT-01 FAIL: parents has no single PRIMARY KEY';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.key_column_usage
    WHERE table_schema='public' AND table_name='parents' AND column_name='id'
      AND constraint_name IN (
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_schema='public' AND table_name='parents' AND constraint_type='PRIMARY KEY')),
    'IDENT-01 FAIL: parents PK is not on column id';

  ASSERT (
    SELECT array_agg(column_name::text ORDER BY column_name::text)
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='parents'
  ) = ARRAY['created_at','display_name','id','requires_reconsent','updated_at']::text[],
    'IDENT-01 FAIL: parents column set != {created_at, display_name, id, requires_reconsent, updated_at}';
END $$;

-- ----------------------------------------------------------------------------
-- 2. IDENT-02 — child_profiles zero-PII: EXACT 8-column set, no more/no less
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  ASSERT (
    SELECT array_agg(column_name::text ORDER BY column_name::text)
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='child_profiles'
  ) = ARRAY['avatar_id','birth_year','created_at','id','is_active','nickname','parent_id','updated_at']::text[],
    'IDENT-02 FAIL: child_profiles column set != the exact 8-column zero-PII set';
END $$;

-- ----------------------------------------------------------------------------
-- 3. IDENT-03 — parent_id nullable AND exactly 5 NULL (teacher-created)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  ASSERT (SELECT is_nullable FROM information_schema.columns
          WHERE table_schema='public' AND table_name='child_profiles' AND column_name='parent_id') = 'YES',
    'IDENT-03 FAIL: child_profiles.parent_id is NOT nullable';

  ASSERT (SELECT count(*) FROM child_profiles WHERE parent_id IS NULL) = 5,
    'IDENT-03 FAIL: child_profiles with parent_id IS NULL != 5 (expected the 5 auth-less students)';
END $$;

-- ----------------------------------------------------------------------------
-- 4. IDENT-04 — UUID reuse: every child_profiles row matches a students row
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM child_profiles cp JOIN students s ON cp.id = s.id) = 20,
    'IDENT-04 FAIL: child_profiles<->students UUID-reuse join count != 20';
END $$;

-- ----------------------------------------------------------------------------
-- 5. IDENT-05 — every non-carved-out identity FK ALSO targets child_profiles(id)
--    Uses pg_constraint (NOT information_schema — see 01-fk-checklist.md DEVIATION:
--    information_schema.constraint_column_usage returns [] under Supabase's role).
--    Run this verifier and DIFF against 01-fk-checklist.md: all 12 firm child-scoped
--    rows (+ any TBD rows the owner marked child-scoped at the Plan 03 gate) MUST appear.
--    A single ASSERT over the diff is impractical (the carve-out set is owner-signed at
--    apply time), so this is a run+diff manual check, documented here.
-- ----------------------------------------------------------------------------
-- SELECT con.conrelid::regclass::text AS table_name, att.attname AS column_name,
--        con.conname AS constraint_name
-- FROM pg_constraint con
-- JOIN unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord) ON TRUE
-- JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
-- WHERE con.contype='f' AND con.confrelid='public.child_profiles'::regclass
-- ORDER BY table_name, column_name;
--
-- Automatable lower-bound guard (the 12 firm child-scoped rows must be present):
DO $$
DECLARE missing text;
BEGIN
  -- 16 owner-signed child-scoped columns (Plan 03 gate, 2026-07-22). Only
  -- parent_subscriptions is carved out (D-06) and is intentionally absent.
  SELECT string_agg(t.tbl || '.' || t.col, ', ') INTO missing
  FROM (VALUES
    ('assignment_submissions','student_id'),('feedback_submissions','student_id'),
    ('instrument_practice_logs','student_id'),('instrument_practice_streak','student_id'),
    ('rate_limits','student_id'),('student_daily_challenges','student_id'),
    ('student_daily_goals','student_id'),('student_point_transactions','student_id'),
    ('student_skill_progress','student_id'),('students_score','student_id'),
    ('student_unit_progress','student_id'),('user_accessories','user_id'),
    ('notifications','recipient_id'),('parental_consent_log','student_id'),
    ('parental_consent_tokens','student_id'),('push_subscriptions','student_id')
  ) AS t(tbl,col)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord) ON TRUE
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
    WHERE con.contype='f' AND con.confrelid='public.child_profiles'::regclass
      AND con.conrelid = ('public.'||t.tbl)::regclass AND att.attname = t.col);
  ASSERT missing IS NULL,
    'IDENT-05 FAIL: these firm child-scoped columns have no child_profiles FK: ' || missing;
END $$;

-- ----------------------------------------------------------------------------
-- 6. RLS deny-all — new tables must have ZERO policies (deny-all posture, D-16)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM pg_policies
          WHERE schemaname='public' AND tablename IN ('parents','child_profiles')) = 0,
    'RLS FAIL: parents/child_profiles have policies (expected 0 — deny-all in Phase 1)';
  ASSERT (SELECT bool_and(relrowsecurity) FROM pg_class
          WHERE relnamespace='public'::regnamespace AND relname IN ('parents','child_profiles')),
    'RLS FAIL: RLS not enabled on parents/child_profiles';
END $$;

-- ----------------------------------------------------------------------------
-- 9. parents backfill fidelity (guards Pitfall 6 — silent re-consent flip)
--    Literal requires_reconsent=true count sourced from 01-account-segmentation.md.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM parents) = 15,
    'PARENTS FAIL: parents row count != 15';
  -- expected requires_reconsent=true count from 01-account-segmentation.md = 1 (hallellu@gmail.com).
  -- RECONCILE against the Plan 03 owner sign-off before the Plan 05 run if any owner_override flipped a flag.
  ASSERT (SELECT count(*) FROM parents WHERE requires_reconsent = true) = 1,
    'PARENTS FAIL: requires_reconsent=true count != 1 (owner-signed segmentation literal)';
END $$;

-- ----------------------------------------------------------------------------
-- 10. IDENT-03 positive parent-match — the 15 non-null rows point at REAL parents
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM child_profiles cp JOIN parents p ON cp.parent_id = p.id
          WHERE cp.parent_id IS NOT NULL) = 15,
    'IDENT-03 FAIL: child_profiles with a real matching parent != 15';
END $$;

-- ============================================================================
-- 7 + 8. Trigger round-trips + deletion cascade — SYNTHETIC, fully rolled back
--        (D-21 forward+reverse sync, D-24/D-25 deletion cascade)
-- ============================================================================
BEGIN;

-- Use a real existing avatar_id to also prove avatar propagation, or NULL (FK-nullable).
-- avatar_id is nullable + FK to avatars(id); NULL is valid. To test propagation, replace
-- NULL below with an existing id:  SELECT id FROM avatars LIMIT 1;
--   \set avatar  (or inline a literal)

-- --- 7a. FORWARD sync: INSERT student -> child_profiles mirror appears -------
INSERT INTO students (id, musical_nickname, avatar_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Kid Fwd', NULL /* <some existing avatar_id> */);

DO $$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM child_profiles WHERE id='00000000-0000-0000-0000-000000000001'),
    'D-21 FAIL (forward): child_profiles mirror row not created by students INSERT trigger';
  ASSERT (SELECT nickname FROM child_profiles WHERE id='00000000-0000-0000-0000-000000000001') = 'Test Kid Fwd',
    'D-21 FAIL (forward): child_profiles.nickname did not mirror students.musical_nickname';
END $$;

-- --- 7b. REVERSE sync: INSERT child_profiles (no prior student) -> shadow row -
INSERT INTO child_profiles (id, nickname, avatar_id, is_active)
VALUES ('00000000-0000-0000-0000-000000000002', 'Test Kid Rev', NULL /* <some existing avatar_id> */, TRUE);

DO $$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM students WHERE id='00000000-0000-0000-0000-000000000002'),
    'D-21 FAIL (reverse): shadow students row not created by child_profiles INSERT trigger';
  ASSERT (SELECT musical_nickname FROM students WHERE id='00000000-0000-0000-0000-000000000002') = 'Test Kid Rev',
    'D-21 FAIL (reverse): shadow students.musical_nickname did not mirror child_profiles.nickname';
  -- Loop-guard proof: the reverse INSERT must NOT have recursed to create a duplicate.
  ASSERT (SELECT count(*) FROM child_profiles WHERE id='00000000-0000-0000-0000-000000000002') = 1,
    'D-21 FAIL: loop guard breach — reverse sync recursed (child_profiles duplicated)';
END $$;

-- --- 8. DELETION cascade: DELETE student -> its child_profiles row removed ----
DELETE FROM students WHERE id='00000000-0000-0000-0000-000000000001';

DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM child_profiles WHERE id='00000000-0000-0000-0000-000000000001'),
    'D-24/D-25 FAIL: child_profiles row survived a students DELETE (hollow profile hazard)';
END $$;

ROLLBACK;  -- discard ALL synthetic rows (7a, 7b, 8) — nothing persists

-- =============================================================================
-- End of suite. A clean run prints no ERROR. Re-run after rollback+re-apply.
-- =============================================================================
