-- =============================================================================
-- 02-db-assertions.sql  —  Phase 2 (v4.0) RLS rewrite verification suite
-- Migration: <ts>_rls_ownership_rewrite
-- Run AFTER apply, against the rehearsal branch (psql -f or MCP execute_sql).
-- Blocks map 1:1 to RLS-01..RLS-06. Each block raises on failure (DO $$ ... ASSERT).
-- Live baseline captured 2026-07-30 (project hdltcvgqrtxuxgjdvzzu):
--   child_profiles = 20 (15 parented, 5 parent_id NULL); 24 in-scope tables, ~39 new
--   policies per RESEARCH's summary prose (46 per this phase's row-level count
--   correction — see 02-policy-inventory.md "Count Correction" note).
--
-- Named placeholders used by the RLS-06 / RLS-04(b) impersonation blocks below —
-- fill these in at run time from 02-seed-second-family.sql's fixed synthetic UUIDs
-- plus live read-only lookups (see that file's commented reference SELECTs):
--   <PARENT_A_UUID>          — a real existing parented parent (live lookup)
--   <PARENT_A_CHILD>         — PARENT_A_UUID's owned child_profiles.id (live lookup)
--   <PARENT_B_UUID>          — 00000000-0000-0000-0000-0000000000b0 (synthetic, seed script)
--   <PARENT_B_CHILD>         — 00000000-0000-0000-0000-0000000000c0 (synthetic, seed script)
--   <NULL_PARENT_PROFILE>    — a child_profiles.id with parent_id IS NULL (live lookup)
--   <CONNECTED_TEACHER>      — a teacher_id with an 'accepted' row for <NULL_PARENT_PROFILE> (live lookup)
--   <UNCONNECTED_TEACHER>    — a teacher_id with NO row for <NULL_PARENT_PROFILE> (live lookup)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- RLS-01 — owned_child_ids() shape: SECURITY INVOKER (not DEFINER), STABLE
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  ASSERT (SELECT prosecdef FROM pg_proc WHERE proname='owned_child_ids') = false,
    'RLS-01 FAIL: owned_child_ids() is SECURITY DEFINER, expected SECURITY INVOKER (RLS-H1 deviation)';
  ASSERT (SELECT provolatile FROM pg_proc WHERE proname='owned_child_ids') = 's',
    'RLS-01 FAIL: owned_child_ids() is not STABLE';
END $$;

-- RLS-01 inlining verification — commented, human-judged (RESEARCH "Ownership Helper —
-- Exact Contract" § Verify inlining with EXPLAIN ANALYZE). NOT automatable: pass condition
-- is "plan (A)'s child_profiles scan folds into a single InitPlan/Subquery Scan with cost
-- and Actual Total Time within noise of plan (B)" — a planner-shape read, not a boolean.
--
-- -- A. Using the helper function
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM student_skill_progress
-- WHERE student_id IN (SELECT owned_child_ids());
--
-- -- B. Using the literal inline subquery (the fallback shape)
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM student_skill_progress
-- WHERE student_id IN (
--   SELECT id FROM child_profiles WHERE parent_id = (SELECT auth.uid())
-- );
--
-- PASS: plan (A) shows a one-time InitPlan/Subquery Scan on child_profiles, no
--       "Function Scan on owned_child_ids" repeated per outer row.
-- FAIL: plan (A) shows a Function Scan/SubPlan re-evaluated per row (Rows Removed by
--       Filter scaling with outer row count, or materially higher Actual Total Time than B).
-- ON FAIL: do not use the function in policy text — fall back to the literal inline
--       subquery everywhere (still one canonical, copy-pasted text).

-- ----------------------------------------------------------------------------
-- RLS-02 — dual-policy coverage: every in-scope (table,cmd) has a _parent_owner sibling
-- Scoped to the 24-table inventory (Groups A/B/C) so the audit doesn't false-positive
-- on tables outside RLS-02's scope that legitimately have no _parent_owner policy.
-- ----------------------------------------------------------------------------
DO $$
DECLARE uncovered text;
BEGIN
  SELECT string_agg(t.tablename || ':' || t.cmd, ', ') INTO uncovered
  FROM (
    -- Group A (16 tables, per-cmd rows from 02-policy-inventory.md)
    SELECT * FROM (VALUES
      ('assignment_submissions','ALL'),('feedback_submissions','INSERT'),
      ('instrument_practice_logs','INSERT'),('instrument_practice_logs','SELECT'),
      ('instrument_practice_streak','ALL'),('notifications','ALL'),
      ('parental_consent_log','INSERT'),('parental_consent_log','SELECT'),
      ('parental_consent_tokens','INSERT'),('parental_consent_tokens','SELECT'),('parental_consent_tokens','UPDATE'),
      ('push_subscriptions','DELETE'),('push_subscriptions','INSERT'),('push_subscriptions','SELECT'),('push_subscriptions','UPDATE'),
      ('rate_limits','INSERT'),('rate_limits','SELECT'),('rate_limits','UPDATE'),
      ('student_daily_challenges','ALL'),
      ('student_daily_goals','INSERT'),('student_daily_goals','SELECT'),('student_daily_goals','UPDATE'),
      ('student_point_transactions','INSERT'),('student_point_transactions','SELECT'),
      ('student_skill_progress','DELETE'),('student_skill_progress','INSERT'),('student_skill_progress','SELECT'),('student_skill_progress','UPDATE'),
      ('student_unit_progress','DELETE'),('student_unit_progress','INSERT'),('student_unit_progress','SELECT'),('student_unit_progress','UPDATE'),
      ('students_score','DELETE'),('students_score','INSERT'),('students_score','SELECT'),('students_score','UPDATE'),
      ('user_accessories','ALL'),
      -- Group B (7 tables, all ALL)
      ('class_enrollments','ALL'),('current_streak','ALL'),('highest_streak','ALL'),
      ('last_practiced_date','ALL'),('practice_sessions','ALL'),
      ('student_achievements','ALL'),('student_profiles','ALL'),
      -- Group C (child_profiles itself)
      ('child_profiles','ALL'),('child_profiles','SELECT'),
      -- Edge case (user_preferences gets the standard triplet)
      ('user_preferences','SELECT'),('user_preferences','INSERT'),('user_preferences','UPDATE')
    ) AS v(tablename, cmd)
  ) t
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname='public' AND p.tablename=t.tablename
      AND p.policyname LIKE '%_parent_owner'
      AND (p.cmd = t.cmd OR p.cmd = 'ALL')
  );
  ASSERT uncovered IS NULL,
    'RLS-02 FAIL: these in-scope (table,cmd) pairs have no _parent_owner sibling: ' || uncovered;
END $$;

-- Reference audit query (RESEARCH "Naming convention") — full pg_policies breakdown,
-- for manual review alongside the automated ASSERT above:
-- SELECT tablename, cmd,
--        count(*) FILTER (WHERE policyname LIKE '%_parent_owner') AS new_policies,
--        count(*) FILTER (WHERE policyname NOT LIKE '%_parent_owner') AS legacy_policies
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY tablename, cmd
-- ORDER BY tablename, cmd;

-- ----------------------------------------------------------------------------
-- RLS-03 — every _parent_owner INSERT/UPDATE has an explicit, non-trivial WITH CHECK
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM pg_policies
          WHERE schemaname='public' AND policyname LIKE '%_parent_owner'
            AND cmd IN ('INSERT','UPDATE') AND (with_check IS NULL OR with_check = 'true')) = 0,
    'RLS-03 FAIL: a _parent_owner INSERT/UPDATE policy has NULL or unconditional WITH CHECK';
END $$;

-- ----------------------------------------------------------------------------
-- RLS-04 — recursion-free: static guard (child_profiles never calls owned_child_ids())
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM pg_policies
          WHERE schemaname='public' AND tablename='child_profiles'
            AND (qual ILIKE '%owned_child_ids%' OR with_check ILIKE '%owned_child_ids%')) = 0,
    'RLS-04 FAIL: child_profiles own policy references owned_child_ids (recursion risk, RLS-H2 breach)';
END $$;

-- RLS-04 runtime touch — one representative SELECT per in-scope table, as an impersonated
-- parent session (RLS-06 impersonation technique below). Zero 42P17 errors = pass.
-- Run this block manually after impersonating <PARENT_A_UUID> (see RLS-06 below):
--
-- SELECT * FROM assignment_submissions LIMIT 1;
-- SELECT * FROM feedback_submissions LIMIT 1;
-- SELECT * FROM instrument_practice_logs LIMIT 1;
-- SELECT * FROM instrument_practice_streak LIMIT 1;
-- SELECT * FROM notifications LIMIT 1;
-- SELECT * FROM parental_consent_log LIMIT 1;
-- SELECT * FROM parental_consent_tokens LIMIT 1;
-- SELECT * FROM push_subscriptions LIMIT 1;
-- SELECT * FROM rate_limits LIMIT 1;
-- SELECT * FROM student_daily_challenges LIMIT 1;
-- SELECT * FROM student_daily_goals LIMIT 1;
-- SELECT * FROM student_point_transactions LIMIT 1;
-- SELECT * FROM student_skill_progress LIMIT 1;
-- SELECT * FROM student_unit_progress LIMIT 1;
-- SELECT * FROM students_score LIMIT 1;
-- SELECT * FROM user_accessories LIMIT 1;
-- SELECT * FROM class_enrollments LIMIT 1;
-- SELECT * FROM current_streak LIMIT 1;
-- SELECT * FROM highest_streak LIMIT 1;
-- SELECT * FROM last_practiced_date LIMIT 1;
-- SELECT * FROM practice_sessions LIMIT 1;
-- SELECT * FROM student_achievements LIMIT 1;
-- SELECT * FROM student_profiles LIMIT 1;
-- SELECT * FROM child_profiles LIMIT 1;
-- SELECT * FROM user_preferences LIMIT 1;
-- SELECT * FROM accessories LIMIT 1;
-- SELECT * FROM assignments LIMIT 1;
--
-- Also check Supabase Advisors/logs (get_advisors / get_logs via MCP, or the dashboard)
-- for any 42P17 entries in the window after this rehearsal-branch run.

-- ----------------------------------------------------------------------------
-- RLS-05 — performance parity: EXPLAIN ANALYZE before/after protocol (NOT an ASSERT —
-- human-judged "within noise", per RESEARCH "Performance Verification Method").
-- ----------------------------------------------------------------------------
-- Protocol (run on the rehearsal branch):
--   1. BEFORE applying this migration, as a seeded real test parent (<PARENT_A_UUID>):
--      EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM student_skill_progress WHERE student_id = '<PARENT_A_CHILD>';
--      EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM students_score WHERE student_id = '<PARENT_A_CHILD>';
--      EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM student_daily_goals WHERE student_id = '<PARENT_A_CHILD>';
--      EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM practice_sessions WHERE student_id = '<PARENT_A_CHILD>';
--      Record baseline Actual Total Time for each.
--   2. Apply the Phase 2 migration (dual-policy).
--   3. Re-run the identical 4 queries as the same <PARENT_A_UUID>. Compare — expect within
--      a few percent of baseline, not a multiplier (child_profiles is 20 rows w/ an index
--      on parent_id — the subquery cost is bounded regardless of downstream table size).
--   4. Re-run as <PARENT_B_UUID> (02-seed-second-family.sql's synthetic second family) to
--      confirm the IN-list correctly scopes to a different set with no cross-family cost
--      anomaly:
--      EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM student_skill_progress WHERE student_id = '<PARENT_B_CHILD>';
--   5. Confirm via Supabase Advisors (get_advisors MCP tool or dashboard) that no new
--      "unindexed foreign key" or "RLS performance" warnings appear for any of the 24 tables.

-- ============================================================================
-- RLS-06 — adversarial 6-case matrix (impersonation via request.jwt.claims + SET ROLE)
-- Wrap any synthetic mutation in BEGIN...ROLLBACK (analog style); RESET ROLE / RESET
-- request.jwt.claims after each impersonated block (RESEARCH's own protocol) since
-- these are session-GUC changes, not table mutations that need a transaction wrapper.
-- ============================================================================

-- --- Case 1: Parent A sees own child + downstream (positive control) ---------------
SET request.jwt.claims = '{"sub":"<PARENT_A_UUID>","role":"authenticated"}';
SET ROLE authenticated;

DO $$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM child_profiles WHERE id = '<PARENT_A_CHILD>'),
    'RLS-06 case 1 FAIL: Parent A cannot see their own child_profiles row';
END $$;
-- SELECT * FROM student_skill_progress WHERE student_id = '<PARENT_A_CHILD>'; -- expect >=0 rows, no error

RESET ROLE;
RESET request.jwt.claims;

-- --- Case 2: Parent A sees ZERO rows for Parent B's child + downstream -------------
SET request.jwt.claims = '{"sub":"<PARENT_A_UUID>","role":"authenticated"}';
SET ROLE authenticated;

DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM child_profiles WHERE id = '<PARENT_B_CHILD>'),
    'RLS-06 case 2 FAIL: Parent A can see Parent B''s child_profiles row (cross-family leak)';
  ASSERT NOT EXISTS (SELECT 1 FROM student_skill_progress WHERE student_id = '<PARENT_B_CHILD>'),
    'RLS-06 case 2 FAIL: Parent A can see Parent B''s child downstream data (cross-family leak)';
  ASSERT NOT EXISTS (SELECT 1 FROM students_score WHERE student_id = '<PARENT_B_CHILD>'),
    'RLS-06 case 2 FAIL: Parent A can see Parent B''s child students_score row (cross-family leak)';
END $$;

RESET ROLE;
RESET request.jwt.claims;

-- --- Case 3: Any parent sees ZERO rows for a null-parent (teacher-owned) profile ---
SET request.jwt.claims = '{"sub":"<PARENT_A_UUID>","role":"authenticated"}';
SET ROLE authenticated;

DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM child_profiles WHERE id = '<NULL_PARENT_PROFILE>'),
    'RLS-06 case 3 FAIL: an arbitrary parent can see a null-parent profile';
  ASSERT NOT EXISTS (SELECT 1 FROM student_skill_progress WHERE student_id = '<NULL_PARENT_PROFILE>'),
    'RLS-06 case 3 FAIL: an arbitrary parent can see a null-parent profile''s downstream data';
END $$;

RESET ROLE;
RESET request.jwt.claims;

-- --- Case 4: Unconnected teacher sees ZERO rows for the null-parent profile --------
SET request.jwt.claims = '{"sub":"<UNCONNECTED_TEACHER>","role":"authenticated"}';
SET ROLE authenticated;

DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM child_profiles WHERE id = '<NULL_PARENT_PROFILE>'),
    'RLS-06 case 4 FAIL: an unconnected teacher can see the null-parent profile';
END $$;

RESET ROLE;
RESET request.jwt.claims;

-- --- Case 5: Connected teacher SEES the null-parent profile -----------------------
SET request.jwt.claims = '{"sub":"<CONNECTED_TEACHER>","role":"authenticated"}';
SET ROLE authenticated;

DO $$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM child_profiles WHERE id = '<NULL_PARENT_PROFILE>'),
    'RLS-06 case 5 FAIL: the connected teacher cannot see the null-parent profile (D-30/RLS-T1 regression)';
END $$;

RESET ROLE;
RESET request.jwt.claims;

-- --- Case 6: Parent A cross-family UPDATE is rejected by WITH CHECK ----------------
-- Direct regression test for Pitfall 1 — a missing/wrong WITH CHECK would silently
-- allow this repoint. Wrapped in BEGIN...ROLLBACK so nothing persists even on an
-- (unexpected) success.
BEGIN;

SET request.jwt.claims = '{"sub":"<PARENT_A_UUID>","role":"authenticated"}';
SET ROLE authenticated;

DO $$
DECLARE affected int;
BEGIN
  UPDATE student_skill_progress
     SET student_id = '<PARENT_B_CHILD>'
   WHERE student_id = '<PARENT_A_CHILD>';
  GET DIAGNOSTICS affected = ROW_COUNT;
  ASSERT affected = 0,
    'RLS-06 case 6 FAIL: Parent A''s cross-family UPDATE (repoint to Parent B''s child) was NOT rejected by WITH CHECK';
EXCEPTION WHEN OTHERS THEN
  -- A raised RLS violation (new row violates WITH CHECK) is ALSO an acceptable pass —
  -- Postgres may either silently affect 0 rows or raise, depending on policy shape.
  RAISE NOTICE 'RLS-06 case 6: UPDATE raised (acceptable WITH CHECK rejection): %', SQLERRM;
END $$;

RESET ROLE;
RESET request.jwt.claims;

ROLLBACK;

-- =============================================================================
-- End of suite. A clean run prints no ERROR. Re-run after rollback+re-apply.
-- =============================================================================
