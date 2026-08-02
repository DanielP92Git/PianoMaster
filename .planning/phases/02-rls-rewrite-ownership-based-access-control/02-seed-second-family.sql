-- =============================================================================
-- 02-seed-second-family.sql — Synthetic second family for RLS-06 / RLS-05 checks
--
-- BRANCH-ONLY — do not run against production. Synthetic UUIDs prefixed
-- 0000…00b0/c0. Consumed by 02-db-assertions.sql RLS-06 case 2/6 (cross-family
-- adversarial) + RLS-05 cross-family cost check. Removed with the branch.
--
-- Run on a Supabase rehearsal branch AFTER the Phase 2 migration
-- (<ts>_rls_ownership_rewrite.sql) is applied, so the new _parent_owner policies
-- exist when this data is inserted (inserts run as the branch's own service-role /
-- migration context, bypassing RLS, so ordering relative to the migration only
-- matters for the downstream adversarial reads in 02-db-assertions.sql, not for
-- this insert itself).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PARENT_B — synthetic second parent.
--    parents.id has an FK to auth.users(id) ON DELETE CASCADE
--    (supabase/migrations/20260722120000_add_parents_and_child_profiles.sql line 30),
--    so a matching auth.users row is required first. Insert a minimal branch-only
--    auth.users row, guarded so it is unmistakably synthetic (email domain +
--    raw_user_meta_data marker).
-- -----------------------------------------------------------------------------
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-0000000000b0'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  'synthetic-parent-b@rehearsal-branch.invalid',
  '',  -- no real password — this row is never used to log in, only for FK + impersonation
  NOW(), NOW(), NOW(),
  '{"provider":"synthetic","providers":["synthetic"]}'::jsonb,
  '{"synthetic_seed":"02-seed-second-family","note":"BRANCH-ONLY, never production"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO parents (id, display_name, requires_reconsent) VALUES
  ('00000000-0000-0000-0000-0000000000b0'::uuid, 'SYNTHETIC Parent B', FALSE)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. PARENT_B_CHILD — synthetic second child, owned by PARENT_B.
--    The reverse-sync trigger (sync_child_profile_to_student, D-20) fires on this
--    INSERT and creates a shadow `students` row automatically — no separate
--    students insert needed here.
--    avatar_id: use a real existing avatar_id so avatar propagation is also
--    exercised. Replace the subquery below with a literal id if a specific
--    avatar is preferred; NULL is also valid (avatar_id is nullable).
-- -----------------------------------------------------------------------------
INSERT INTO child_profiles (id, parent_id, nickname, avatar_id, birth_year, is_active) VALUES
  (
    '00000000-0000-0000-0000-0000000000c0'::uuid,
    '00000000-0000-0000-0000-0000000000b0'::uuid,
    'SYNTH-B-Child',
    (SELECT id FROM avatars LIMIT 1),
    2016,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Downstream rows for PARENT_B_CHILD — so cross-family "zero rows" adversarial
--    cases (RLS-06 case 2) have real data to be denied, and RLS-05's cross-family
--    cost check has something to query.
-- -----------------------------------------------------------------------------
INSERT INTO student_skill_progress (student_id, node_id, stars, best_score)
VALUES ('00000000-0000-0000-0000-0000000000c0'::uuid, 'treble_c_d', 2, 80)
ON CONFLICT DO NOTHING;

INSERT INTO students_score (student_id, score, game_type)
VALUES ('00000000-0000-0000-0000-0000000000c0'::uuid, 42, 'notes_master')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Reference SELECTs (commented) — source the live UUIDs for 02-db-assertions.sql's
-- remaining RLS-06 placeholders. Run these against the rehearsal branch and paste
-- the results into the assertion file before executing it.
-- =============================================================================

-- <PARENT_A_UUID> — a real existing parented parent (any row works; positive control)
-- SELECT id FROM parents LIMIT 1;

-- <PARENT_A_CHILD> — PARENT_A_UUID's owned child_profiles.id
-- SELECT id FROM child_profiles WHERE parent_id = '<PARENT_A_UUID>' LIMIT 1;

-- <NULL_PARENT_PROFILE> — a child_profiles.id with parent_id IS NULL (5 exist live)
-- SELECT id FROM child_profiles WHERE parent_id IS NULL LIMIT 1;

-- <CONNECTED_TEACHER> — a teacher_id with an 'accepted' connection to <NULL_PARENT_PROFILE>
-- SELECT teacher_id FROM teacher_student_connections
-- WHERE student_id = '<NULL_PARENT_PROFILE>' AND status = 'accepted' LIMIT 1;

-- <UNCONNECTED_TEACHER> — any teacher with NO row at all for <NULL_PARENT_PROFILE>
-- SELECT t.id FROM teachers t
-- WHERE NOT EXISTS (
--   SELECT 1 FROM teacher_student_connections tsc
--   WHERE tsc.teacher_id = t.id AND tsc.student_id = '<NULL_PARENT_PROFILE>'
-- ) LIMIT 1;

-- =============================================================================
-- Teardown (branch-only cleanup, if ever needed mid-rehearsal — NOT run automatically):
-- DELETE FROM students_score WHERE student_id = '00000000-0000-0000-0000-0000000000c0';
-- DELETE FROM student_skill_progress WHERE student_id = '00000000-0000-0000-0000-0000000000c0';
-- DELETE FROM child_profiles WHERE id = '00000000-0000-0000-0000-0000000000c0';  -- cascades to shadow students row (D-24/D-25)
-- DELETE FROM parents WHERE id = '00000000-0000-0000-0000-0000000000b0';
-- DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000b0';
-- =============================================================================
