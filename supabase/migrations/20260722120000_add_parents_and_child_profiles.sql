-- =============================================================================
-- Migration:   20260722120000_add_parents_and_child_profiles
-- Date:        2026-07-22
-- Milestone:   v4.0 — Parent-First Account Architecture (COPPA), Phase 1
-- Description: Additive, reversible identity-schema expand (D-03, one atomic file).
--              Creates parents + child_profiles; backfills the 20 students rows
--              REUSING their UUIDs (15 parented, 5 parent_id NULL); adds a SECOND
--              FK to child_profiles(id) on every owner-signed child-scoped identity
--              column (ADD ONLY — legacy students FK KEPT, D-02); installs forward +
--              reverse sync triggers (pg_trigger_depth loop guard) and the
--              deletion-cascade trigger (D-24/D-25). Zero client-visible change.
-- Predecessors: 20250625120001_add_teacher_schema.sql (teachers shape + update_updated_at_column),
--               20260201000001_coppa_schema.sql (generate_musical_nickname, students PII cols),
--               20250115000005_remove_student_auth_fkey.sql (students.id has no FK to auth.users → UUID reuse safe)
-- Source artifacts (owner-signed, Plan 03 gate 2026-07-22):
--               .planning/phases/01-identity-schema-expand/01-fk-checklist.md        (16 swept, 1 carve-out)
--               .planning/phases/01-identity-schema-expand/01-account-segmentation.md (15 ids + re-consent flags)
-- Rollback:     20260722120000_add_parents_and_child_profiles.down.sql
-- NOTE (D-01/D-02): D-01's "dropped and re-added" phrasing is loose; D-02 governs —
--               the legacy students(id) FK is KEPT. This file adds constraints only and
--               issues no drop-constraint statements. The legacy FK is removed in Phase 8, never here.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. parents — adult/account-owner root (mirrors teachers shape; D-08 minimal, no email)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parents (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  display_name       TEXT,
  requires_reconsent BOOLEAN NOT NULL DEFAULT FALSE   -- D-09: Phase 6 re-consent flag
);

-- -----------------------------------------------------------------------------
-- 2. child_profiles — zero-PII per-child profile (IDENT-02: EXACTLY these 8 columns)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS child_profiles (
  id         UUID PRIMARY KEY,                                             -- reuses students.id (IDENT-04)
  parent_id  UUID REFERENCES parents(id) ON DELETE SET NULL,              -- D-18; nullable → teacher-created (IDENT-03)
  nickname   TEXT,                                                         -- from students.musical_nickname (D-12)
  avatar_id  UUID REFERENCES avatars(id),                                  -- D-14 (students.avatar_id is uuid, nullable)
  birth_year INTEGER,                                                      -- D-13 year-only, no month/day
  is_active BOOLEAN NOT NULL DEFAULT TRUE,                                 -- D-15 (deliberately NOT NULL, unlike teachers.is_active)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index on the parent fan-out column (D-17)
CREATE INDEX IF NOT EXISTS idx_child_profiles_parent_id ON child_profiles(parent_id);

-- 4. RLS deny-all (D-16): enable RLS, create ZERO policies. Access is granted in Phase 2.
ALTER TABLE parents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;

-- 5. updated_at triggers (reuse the live update_updated_at_column() helper)
DROP TRIGGER IF EXISTS trigger_parents_updated_at ON parents;
CREATE TRIGGER trigger_parents_updated_at
  BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_child_profiles_updated_at ON child_profiles;
CREATE TRIGGER trigger_child_profiles_updated_at
  BEFORE UPDATE ON child_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 6. Backfill parents — 15 owner-signed auth-having students (Plan 03 gate).
--    Per-row (id, requires_reconsent) literals transcribed from 01-account-segmentation.md
--    after any owner_override. NOT a live heuristic re-run (the reviewed result is authoritative).
--    OWNER-SIGNED requires_reconsent=true count = 1 (only e79437b8… / hallellu@gmail.com).
--    The 01-db-assertions.sql "parents WHERE requires_reconsent=true = 1" check verifies this literal.
-- -----------------------------------------------------------------------------
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
  ('e79437b8-dcf1-434d-9077-d8fa51223e26'::uuid, TRUE)   -- self-registered minor (DOB 2015)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. Backfill child_profiles — ALL 20 (15 parented + 5 auth-less parent_id NULL).
--    UUID reuse (s.id) → IDENT-04; LEFT JOIN → parent_id NULL for the 5 auth-less → IDENT-03.
--    ORDERING: this runs BEFORE the sync triggers are created (Section 8), so the backfill
--    does NOT recursively fire the forward trigger.
-- -----------------------------------------------------------------------------
INSERT INTO child_profiles (id, parent_id, nickname, avatar_id, birth_year, is_active)
SELECT
  s.id,
  au.id,                                                       -- NULL for the 5 auth-less rows (LEFT JOIN)
  COALESCE(s.musical_nickname, generate_musical_nickname()),   -- D-12 (reads musical_nickname; there is no plain nickname column)
  s.avatar_id,
  EXTRACT(YEAR FROM s.date_of_birth)::INTEGER,                 -- D-13; NULL propagates for NULL DOB
  TRUE
FROM students s
LEFT JOIN auth.users au ON au.id = s.id
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 8. Bidirectional sync triggers (D-19/D-20/D-21) + deletion cascade (D-24/D-25).
--    Every function: LANGUAGE plpgsql SECURITY DEFINER SET search_path = public.
--    Loop guard: pg_trigger_depth() > 1 (hard stop; total nesting capped at 2).
-- =============================================================================

-- 8a. FORWARD: students → child_profiles
CREATE OR REPLACE FUNCTION sync_student_to_child_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  INSERT INTO child_profiles (id, parent_id, nickname, avatar_id, birth_year, is_active)
  VALUES (
    NEW.id,
    (SELECT parent_id FROM child_profiles WHERE id = NEW.id),   -- preserve existing parent on UPDATE, NULL on first INSERT
    COALESCE(NEW.musical_nickname, generate_musical_nickname()),
    NEW.avatar_id,
    EXTRACT(YEAR FROM NEW.date_of_birth)::INTEGER,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname   = EXCLUDED.nickname,
    avatar_id  = EXCLUDED.avatar_id,
    birth_year = EXCLUDED.birth_year,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Separate INSERT/UPDATE triggers: a combined INSERT-OR-UPDATE trigger cannot reference OLD
-- in a WHEN clause (OLD is undefined for INSERT).
DROP TRIGGER IF EXISTS trigger_sync_student_insert ON students;
CREATE TRIGGER trigger_sync_student_insert
  AFTER INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION sync_student_to_child_profile();

DROP TRIGGER IF EXISTS trigger_sync_student_update ON students;
CREATE TRIGGER trigger_sync_student_update
  AFTER UPDATE OF musical_nickname, avatar_id, date_of_birth ON students
  FOR EACH ROW
  WHEN (
    NEW.musical_nickname IS DISTINCT FROM OLD.musical_nickname
    OR NEW.avatar_id     IS DISTINCT FROM OLD.avatar_id
    OR NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth
  )
  EXECUTE FUNCTION sync_student_to_child_profile();

-- 8b. REVERSE: child_profiles → students (shadow row, nickname + avatar ONLY, NO PII — D-19)
CREATE OR REPLACE FUNCTION sync_child_profile_to_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Shadow row: no date_of_birth, no parent_email, no consent columns (D-19).
  -- The existing BEFORE-INSERT trigger_auto_generate_nickname (fires only when
  -- musical_nickname IS NULL) is a no-op here (nickname is set); trigger_calculate_is_under_13
  -- computes is_under_13=false via its NULL branch (no DOB) — correct, non-PII-leaking.
  INSERT INTO students (id, musical_nickname, avatar_id, account_status)
  VALUES (NEW.id, NEW.nickname, NEW.avatar_id, 'active')
  ON CONFLICT (id) DO UPDATE SET
    musical_nickname = EXCLUDED.musical_nickname,
    avatar_id        = EXCLUDED.avatar_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_child_profile_insert ON child_profiles;
CREATE TRIGGER trigger_sync_child_profile_insert
  AFTER INSERT ON child_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_child_profile_to_student();

DROP TRIGGER IF EXISTS trigger_sync_child_profile_update ON child_profiles;
CREATE TRIGGER trigger_sync_child_profile_update
  AFTER UPDATE OF nickname, avatar_id ON child_profiles
  FOR EACH ROW
  WHEN (
    NEW.nickname  IS DISTINCT FROM OLD.nickname
    OR NEW.avatar_id IS DISTINCT FROM OLD.avatar_id
  )
  EXECUTE FUNCTION sync_child_profile_to_student();

-- 8c. DELETION cascade (D-24/D-25): remove the child_profiles row when a student is hard-deleted.
--     Closes the hollow-profile hazard behind process-account-deletions/index.ts Step 2
--     (~line 397: supabase.from('students').delete().eq('id', studentId)) with NO Edge Function change.
--     DOC DEBT (Phase 7/8, out of this DDL phase): that function's DATA_CATEGORIES_REMOVED constant
--     (used for the parent-facing deletion email) does not yet list child_profiles.
CREATE OR REPLACE FUNCTION cascade_delete_child_profile_on_student_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM child_profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_cascade_delete_child_profile ON students;
CREATE TRIGGER trigger_cascade_delete_child_profile
  AFTER DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION cascade_delete_child_profile_on_student_delete();

-- =============================================================================
-- 9. Dual-FK ADD constraints — one per owner-signed child-scoped checklist row (16 total).
--    ADD ONLY (D-02): the legacy students(id) FK keeps its name, untouched. Every legacy
--    row is ON DELETE CASCADE (01-fk-checklist.md), so each new FK matches with CASCADE.
--    parent_subscriptions is the sole carve-out (D-06) — intentionally NOT swept.
-- =============================================================================
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

COMMIT;
