-- =============================================================================
-- 01-dryrun.sql — NON-PERSISTING rehearsal harness for Phase 1 (no Supabase branch needed)
--
-- WHAT THIS IS: the full apply -> assert -> rollback cycle wrapped in one outer
-- BEGIN...ROLLBACK. It creates the tables, backfills your 20 REAL production rows,
-- runs every assertion, proves the down-migration reverses cleanly — then rolls the
-- WHOLE thing back. Nothing persists. Production is byte-for-byte unchanged.
--
-- HOW TO RUN: paste this entire file into the Supabase Dashboard -> SQL Editor and Run
-- (or `psql "<your-connection-string>" -f 01-dryrun.sql`).
--   * A clean run ends with NOTICE 'DRY-RUN COMPLETE — all assertions passed' and rolls back.
--   * Any failure raises an ERROR (the message names the failing assertion) and the whole
--     transaction rolls back anyway — fix, re-run. NOTHING is ever committed by this file.
--
-- Synthetic-data tests (trigger round-trips) use a SAVEPOINT, not a nested BEGIN, so a
-- nested ROLLBACK cannot abort the outer transaction. Avatar id below is a real one from
-- your avatars table (2015c4fa-...) so the avatar FK + propagation are exercised too.
--
-- AFTER a green dry-run: apply for real by running
--   supabase/migrations/20260722120000_add_parents_and_child_profiles.sql  (it has its own COMMIT)
-- =============================================================================

BEGIN;

-- #############################################################################
-- ## PART 1 — UP-MIGRATION BODY (verbatim from the migration, minus its BEGIN/COMMIT)
-- #############################################################################

CREATE TABLE IF NOT EXISTS parents (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  display_name       TEXT,
  requires_reconsent BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS child_profiles (
  id         UUID PRIMARY KEY,
  parent_id  UUID REFERENCES parents(id) ON DELETE SET NULL,
  nickname   TEXT,
  avatar_id  UUID REFERENCES avatars(id),
  birth_year INTEGER,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_profiles_parent_id ON child_profiles(parent_id);

ALTER TABLE parents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trigger_parents_updated_at ON parents;
CREATE TRIGGER trigger_parents_updated_at
  BEFORE UPDATE ON parents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_child_profiles_updated_at ON child_profiles;
CREATE TRIGGER trigger_child_profiles_updated_at
  BEFORE UPDATE ON child_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO parents (id, requires_reconsent) VALUES
  ('1dfb9e09-fb9e-4f22-85ba-cb0d82fc0893'::uuid, FALSE),
  ('1f569340-c919-438c-b61c-246d7c3b4cac'::uuid, FALSE),
  ('2c85985d-275c-42d7-a24e-72463909937a'::uuid, FALSE),
  ('42b28d4b-14a6-4982-a08a-d2543edd77c9'::uuid, FALSE),
  ('674c6094-5292-423d-8ac8-b631428ac31e'::uuid, FALSE),
  ('8650dc76-90f5-48d9-a7c0-aa18542b30d4'::uuid, FALSE),
  ('87ee7640-fdc2-4032-a2d6-a22aa29255f2'::uuid, FALSE),
  ('891ede89-8f4d-487a-be52-4ec434220122'::uuid, FALSE),
  ('92109e06-75aa-4bad-86c8-c5051e977a4d'::uuid, FALSE),
  ('bd83a9c2-4d99-4345-b946-41a3f5e374f3'::uuid, FALSE),
  ('ca83835b-f020-440d-9e80-571a47c7993d'::uuid, FALSE),
  ('cdef3658-4e11-49b4-ab2a-7c2a4867dcb7'::uuid, FALSE),
  ('ce7a53c8-d0ab-4558-96ff-b3cec89a9c22'::uuid, FALSE),
  ('e211389a-43e2-483d-98c8-1fdfb82fef15'::uuid, FALSE),
  ('e79437b8-dcf1-434d-9077-d8fa51223e26'::uuid, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO child_profiles (id, parent_id, nickname, avatar_id, birth_year, is_active)
SELECT s.id, au.id, COALESCE(s.musical_nickname, generate_musical_nickname()),
       s.avatar_id, EXTRACT(YEAR FROM s.date_of_birth)::INTEGER, TRUE
FROM students s LEFT JOIN auth.users au ON au.id = s.id
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION sync_student_to_child_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  INSERT INTO child_profiles (id, parent_id, nickname, avatar_id, birth_year, is_active)
  VALUES (NEW.id, (SELECT parent_id FROM child_profiles WHERE id = NEW.id),
          COALESCE(NEW.musical_nickname, generate_musical_nickname()),
          NEW.avatar_id, EXTRACT(YEAR FROM NEW.date_of_birth)::INTEGER, TRUE)
  ON CONFLICT (id) DO UPDATE SET
    nickname = EXCLUDED.nickname, avatar_id = EXCLUDED.avatar_id,
    birth_year = EXCLUDED.birth_year, updated_at = NOW();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trigger_sync_student_insert ON students;
CREATE TRIGGER trigger_sync_student_insert AFTER INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION sync_student_to_child_profile();
DROP TRIGGER IF EXISTS trigger_sync_student_update ON students;
CREATE TRIGGER trigger_sync_student_update
  AFTER UPDATE OF musical_nickname, avatar_id, date_of_birth ON students FOR EACH ROW
  WHEN (NEW.musical_nickname IS DISTINCT FROM OLD.musical_nickname
        OR NEW.avatar_id IS DISTINCT FROM OLD.avatar_id
        OR NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth)
  EXECUTE FUNCTION sync_student_to_child_profile();

CREATE OR REPLACE FUNCTION sync_child_profile_to_student()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  INSERT INTO students (id, musical_nickname, avatar_id, account_status)
  VALUES (NEW.id, NEW.nickname, NEW.avatar_id, 'active')
  ON CONFLICT (id) DO UPDATE SET
    musical_nickname = EXCLUDED.musical_nickname, avatar_id = EXCLUDED.avatar_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trigger_sync_child_profile_insert ON child_profiles;
CREATE TRIGGER trigger_sync_child_profile_insert AFTER INSERT ON child_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_child_profile_to_student();
DROP TRIGGER IF EXISTS trigger_sync_child_profile_update ON child_profiles;
CREATE TRIGGER trigger_sync_child_profile_update
  AFTER UPDATE OF nickname, avatar_id ON child_profiles FOR EACH ROW
  WHEN (NEW.nickname IS DISTINCT FROM OLD.nickname OR NEW.avatar_id IS DISTINCT FROM OLD.avatar_id)
  EXECUTE FUNCTION sync_child_profile_to_student();

CREATE OR REPLACE FUNCTION cascade_delete_child_profile_on_student_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM child_profiles WHERE id = OLD.id;
  RETURN OLD;
END; $$;

DROP TRIGGER IF EXISTS trigger_cascade_delete_child_profile ON students;
CREATE TRIGGER trigger_cascade_delete_child_profile AFTER DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION cascade_delete_child_profile_on_student_delete();

ALTER TABLE public.assignment_submissions     ADD CONSTRAINT assignment_submissions_student_id_child_profiles_fkey     FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.feedback_submissions       ADD CONSTRAINT feedback_submissions_student_id_child_profiles_fkey       FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.instrument_practice_logs   ADD CONSTRAINT instrument_practice_logs_student_id_child_profiles_fkey   FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.instrument_practice_streak ADD CONSTRAINT instrument_practice_streak_student_id_child_profiles_fkey FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.notifications              ADD CONSTRAINT notifications_recipient_id_child_profiles_fkey            FOREIGN KEY (recipient_id) REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.parental_consent_log       ADD CONSTRAINT parental_consent_log_student_id_child_profiles_fkey       FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.parental_consent_tokens    ADD CONSTRAINT parental_consent_tokens_student_id_child_profiles_fkey    FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.push_subscriptions         ADD CONSTRAINT push_subscriptions_student_id_child_profiles_fkey         FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.rate_limits                ADD CONSTRAINT rate_limits_student_id_child_profiles_fkey                FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.student_daily_challenges   ADD CONSTRAINT student_daily_challenges_student_id_child_profiles_fkey   FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.student_daily_goals        ADD CONSTRAINT student_daily_goals_student_id_child_profiles_fkey        FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.student_point_transactions ADD CONSTRAINT student_point_transactions_student_id_child_profiles_fkey FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.student_skill_progress     ADD CONSTRAINT student_skill_progress_student_id_child_profiles_fkey     FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.students_score             ADD CONSTRAINT students_score_student_id_child_profiles_fkey             FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.student_unit_progress      ADD CONSTRAINT student_unit_progress_student_id_child_profiles_fkey      FOREIGN KEY (student_id)   REFERENCES public.child_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.user_accessories           ADD CONSTRAINT user_accessories_user_id_child_profiles_fkey              FOREIGN KEY (user_id)      REFERENCES public.child_profiles(id) ON DELETE CASCADE;

-- #############################################################################
-- ## PART 2 — ASSERTIONS against the (uncommitted) migrated real-data state
-- #############################################################################

-- 1. IDENT-01 parents shape
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM information_schema.table_constraints
          WHERE table_schema='public' AND table_name='parents' AND constraint_type='PRIMARY KEY') = 1,
    'IDENT-01 FAIL: parents has no single PRIMARY KEY';
  ASSERT (SELECT array_agg(column_name ORDER BY column_name) FROM information_schema.columns
          WHERE table_schema='public' AND table_name='parents')
       = ARRAY['created_at','display_name','id','requires_reconsent','updated_at']::text[],
    'IDENT-01 FAIL: parents column set mismatch';
END $$;

-- 2. IDENT-02 child_profiles exact 8-column zero-PII set
DO $$ BEGIN
  ASSERT (SELECT array_agg(column_name ORDER BY column_name) FROM information_schema.columns
          WHERE table_schema='public' AND table_name='child_profiles')
       = ARRAY['avatar_id','birth_year','created_at','id','is_active','nickname','parent_id','updated_at']::text[],
    'IDENT-02 FAIL: child_profiles column set != exact 8-column zero-PII set';
END $$;

-- 3. IDENT-03 parent_id nullable AND exactly 5 NULL
DO $$ BEGIN
  ASSERT (SELECT is_nullable FROM information_schema.columns
          WHERE table_schema='public' AND table_name='child_profiles' AND column_name='parent_id') = 'YES',
    'IDENT-03 FAIL: parent_id not nullable';
  ASSERT (SELECT count(*) FROM child_profiles WHERE parent_id IS NULL) = 5,
    'IDENT-03 FAIL: parent_id IS NULL count != 5';
END $$;

-- 4. IDENT-04 UUID reuse join = 20
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM child_profiles cp JOIN students s ON cp.id = s.id) = 20,
    'IDENT-04 FAIL: child_profiles<->students join != 20';
END $$;

-- 5. IDENT-05 all 16 child-scoped columns have a child_profiles FK
DO $$
DECLARE missing text;
BEGIN
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
  ASSERT missing IS NULL, 'IDENT-05 FAIL: no child_profiles FK on: ' || missing;
END $$;

-- 6. RLS deny-all
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM pg_policies WHERE schemaname='public'
          AND tablename IN ('parents','child_profiles')) = 0, 'RLS FAIL: policies exist (expected 0)';
  ASSERT (SELECT bool_and(relrowsecurity) FROM pg_class
          WHERE relnamespace='public'::regnamespace AND relname IN ('parents','child_profiles')),
    'RLS FAIL: RLS not enabled';
END $$;

-- 9. parents fidelity: 15 rows, requires_reconsent=true count = 1 (owner-signed)
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM parents) = 15, 'PARENTS FAIL: count != 15';
  ASSERT (SELECT count(*) FROM parents WHERE requires_reconsent = true) = 1,
    'PARENTS FAIL: requires_reconsent=true count != 1';
END $$;

-- 10. IDENT-03 positive parent-match = 15
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM child_profiles cp JOIN parents p ON cp.parent_id = p.id
          WHERE cp.parent_id IS NOT NULL) = 15, 'IDENT-03 FAIL: real-parent match != 15';
END $$;

-- 7 + 8. Trigger round-trips + deletion cascade (SAVEPOINT so nested rollback keeps outer tx alive)
SAVEPOINT dryrun_synth;

INSERT INTO students (id, musical_nickname, avatar_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Kid Fwd', '2015c4fa-d40e-4be1-9233-9fc71e2b5451');
DO $$ BEGIN
  ASSERT EXISTS (SELECT 1 FROM child_profiles WHERE id='00000000-0000-0000-0000-000000000001'),
    'D-21 FAIL (forward): child_profiles mirror not created';
  ASSERT (SELECT nickname FROM child_profiles WHERE id='00000000-0000-0000-0000-000000000001') = 'Test Kid Fwd',
    'D-21 FAIL (forward): nickname did not mirror';
  ASSERT (SELECT avatar_id FROM child_profiles WHERE id='00000000-0000-0000-0000-000000000001')
       = '2015c4fa-d40e-4be1-9233-9fc71e2b5451'::uuid,
    'D-21 FAIL (forward): avatar_id did not propagate';
END $$;

INSERT INTO child_profiles (id, nickname, avatar_id, is_active)
VALUES ('00000000-0000-0000-0000-000000000002', 'Test Kid Rev', '2015c4fa-d40e-4be1-9233-9fc71e2b5451', TRUE);
DO $$ BEGIN
  ASSERT EXISTS (SELECT 1 FROM students WHERE id='00000000-0000-0000-0000-000000000002'),
    'D-21 FAIL (reverse): shadow students row not created';
  ASSERT (SELECT musical_nickname FROM students WHERE id='00000000-0000-0000-0000-000000000002') = 'Test Kid Rev',
    'D-21 FAIL (reverse): shadow nickname mismatch';
  ASSERT (SELECT count(*) FROM child_profiles WHERE id='00000000-0000-0000-0000-000000000002') = 1,
    'D-21 FAIL: loop guard breach (child_profiles duplicated)';
END $$;

DELETE FROM students WHERE id='00000000-0000-0000-0000-000000000001';
DO $$ BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM child_profiles WHERE id='00000000-0000-0000-0000-000000000001'),
    'D-24/D-25 FAIL: child_profiles survived a students DELETE';
END $$;

ROLLBACK TO SAVEPOINT dryrun_synth;   -- discard synthetic rows; migrated real-data state remains

-- #############################################################################
-- ## PART 3 — DOWN-MIGRATION BODY (prove clean rollback), then assert tables gone
-- #############################################################################

DROP TRIGGER IF EXISTS trigger_cascade_delete_child_profile ON students;
DROP FUNCTION IF EXISTS cascade_delete_child_profile_on_student_delete();
DROP TRIGGER IF EXISTS trigger_sync_child_profile_update ON child_profiles;
DROP TRIGGER IF EXISTS trigger_sync_child_profile_insert ON child_profiles;
DROP FUNCTION IF EXISTS sync_child_profile_to_student();
DROP TRIGGER IF EXISTS trigger_sync_student_update ON students;
DROP TRIGGER IF EXISTS trigger_sync_student_insert ON students;
DROP FUNCTION IF EXISTS sync_student_to_child_profile();

ALTER TABLE public.assignment_submissions     DROP CONSTRAINT IF EXISTS assignment_submissions_student_id_child_profiles_fkey;
ALTER TABLE public.feedback_submissions       DROP CONSTRAINT IF EXISTS feedback_submissions_student_id_child_profiles_fkey;
ALTER TABLE public.instrument_practice_logs   DROP CONSTRAINT IF EXISTS instrument_practice_logs_student_id_child_profiles_fkey;
ALTER TABLE public.instrument_practice_streak DROP CONSTRAINT IF EXISTS instrument_practice_streak_student_id_child_profiles_fkey;
ALTER TABLE public.notifications              DROP CONSTRAINT IF EXISTS notifications_recipient_id_child_profiles_fkey;
ALTER TABLE public.parental_consent_log       DROP CONSTRAINT IF EXISTS parental_consent_log_student_id_child_profiles_fkey;
ALTER TABLE public.parental_consent_tokens    DROP CONSTRAINT IF EXISTS parental_consent_tokens_student_id_child_profiles_fkey;
ALTER TABLE public.push_subscriptions         DROP CONSTRAINT IF EXISTS push_subscriptions_student_id_child_profiles_fkey;
ALTER TABLE public.rate_limits                DROP CONSTRAINT IF EXISTS rate_limits_student_id_child_profiles_fkey;
ALTER TABLE public.student_daily_challenges   DROP CONSTRAINT IF EXISTS student_daily_challenges_student_id_child_profiles_fkey;
ALTER TABLE public.student_daily_goals        DROP CONSTRAINT IF EXISTS student_daily_goals_student_id_child_profiles_fkey;
ALTER TABLE public.student_point_transactions DROP CONSTRAINT IF EXISTS student_point_transactions_student_id_child_profiles_fkey;
ALTER TABLE public.student_skill_progress     DROP CONSTRAINT IF EXISTS student_skill_progress_student_id_child_profiles_fkey;
ALTER TABLE public.students_score             DROP CONSTRAINT IF EXISTS students_score_student_id_child_profiles_fkey;
ALTER TABLE public.student_unit_progress      DROP CONSTRAINT IF EXISTS student_unit_progress_student_id_child_profiles_fkey;
ALTER TABLE public.user_accessories           DROP CONSTRAINT IF EXISTS user_accessories_user_id_child_profiles_fkey;

DROP TRIGGER IF EXISTS trigger_child_profiles_updated_at ON child_profiles;
DROP TRIGGER IF EXISTS trigger_parents_updated_at ON parents;
DROP TABLE IF EXISTS child_profiles CASCADE;
DROP TABLE IF EXISTS parents CASCADE;

DO $$ BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM information_schema.tables
                     WHERE table_schema='public' AND table_name='child_profiles'),
    'DOWN FAIL: child_profiles survived the down-migration';
  ASSERT NOT EXISTS (SELECT 1 FROM information_schema.tables
                     WHERE table_schema='public' AND table_name='parents'),
    'DOWN FAIL: parents survived the down-migration';
  ASSERT NOT EXISTS (SELECT 1 FROM pg_constraint
                     WHERE conname='students_score_student_id_child_profiles_fkey'),
    'DOWN FAIL: a child_profiles FK survived the down-migration';
  RAISE NOTICE 'DRY-RUN COMPLETE — all assertions passed; rolling back (nothing persists).';
END $$;

ROLLBACK;   -- <<< discards EVERYTHING. Production is unchanged.
