-- =============================================================================
-- 02-rehearsal-runbook.sql
-- Phase 2 (v4.0) RLS rewrite — owner-run rehearsal, transaction-wrapped on
-- PRODUCTION (project hdltcvgqrtxuxgjdvzzu). Nothing below persists: the whole
-- apply -> seed -> verify -> down -> re-apply sequence runs inside ONE
-- BEGIN...ROLLBACK. Run this as ONE continuous execution (one paste into the
-- Supabase SQL Editor, or `psql "<connection-string>" -f 02-rehearsal-runbook.sql`)
-- — splitting it across multiple separate Editor "Run" clicks may open separate
-- sessions/connections and break the transaction continuity this depends on.
--
-- What this proves (RLS-01..RLS-06, per 02-04-PLAN.md Tasks 1-3):
--   - The migration applies cleanly (Task 1)
--   - The down-migration cleanly reverses it, and re-apply is idempotent (Task 1)
--   - Dual-policy coverage, WITH CHECK correctness, recursion-safety (Task 2)
--   - The 6-case adversarial matrix, incl. cross-family UPDATE rejection (Task 2)
--   - No per-row performance regression (Task 3, EXPLAIN ANALYZE before/after)
--
-- What this CANNOT prove (accepted gap for this rehearsal method — see chat):
--   - Supabase Advisors (get_advisors) reads via a SEPARATE connection and will
--     not see this transaction's uncommitted DDL. Advisors + get_logs 42P17 check
--     must be re-run for real after Wave 4's actual production apply (D-29).
--   - `npm run test:run` does not depend on live DB state (mocked) — run it
--     separately, any time, per CLAUDE.md.
--
-- After running: paste the FULL output back (especially any ERROR, and the
-- EXPLAIN "Execution Time" lines) so 02-apply-log.md can be filled with real
-- PASS/FAIL verdicts per requirement.
-- =============================================================================


-- =============================================================================
-- STEP 0 — pre-migration baseline (read-only, runs BEFORE the rehearsal
-- transaction opens; these are ordinary auto-committed reads, completely safe)
-- =============================================================================

-- parent_a / parent_a_child: any real parent with a real child. (A parent's
-- own id CAN legitimately equal their child_profiles.id in this app's live
-- data — self-play accounts. That is normal, not an anomaly; do not filter it.)
-- null_parent_profile: any of the 5 live parent_id-IS-NULL profiles.
-- connected_teacher / unconnected_teacher: live data has exactly ONE real
-- teacher, connected to NONE of the 5 null-parent profiles (checked live —
-- null_parent_profiles_with_any_connection = 0), so cases 4/5 have no real
-- subject to impersonate. Seeded as two synthetic teachers below (Task 1's
-- seed section), matching parent_b's synthetic-second-family pattern —
-- rolled back with everything else.
CREATE TEMP TABLE _rehearsal_vars AS
WITH pa AS (
  -- parent_a and parent_a_child MUST come from the SAME row — a parent and a
  -- child that parent actually owns — otherwise impersonating parent_a can't see
  -- parent_a_child (the ownership policy USING (parent_id = auth.uid()) correctly
  -- hides an unrelated child). Two independent LIMIT-1 subqueries do not
  -- guarantee this and previously resolved to different parents.
  SELECT p.id AS parent_a, cp.id AS parent_a_child
  FROM parents p
  JOIN child_profiles cp ON cp.parent_id = p.id
  WHERE p.id <> '00000000-0000-0000-0000-0000000000b0'
  LIMIT 1
)
SELECT
  (SELECT parent_a FROM pa) AS parent_a,
  (SELECT parent_a_child FROM pa) AS parent_a_child,
  '00000000-0000-0000-0000-0000000000b0'::uuid AS parent_b,
  '00000000-0000-0000-0000-0000000000c0'::uuid AS parent_b_child,
  (SELECT id FROM child_profiles WHERE parent_id IS NULL LIMIT 1) AS null_parent_profile,
  '00000000-0000-0000-0000-0000000000d0'::uuid AS connected_teacher,
  '00000000-0000-0000-0000-0000000000d1'::uuid AS unconnected_teacher;

-- The rest of this script repeatedly SET ROLE authenticated to impersonate users
-- for RLS testing. A temp table is owned by the connecting role (not
-- `authenticated`), so without this grant every _rehearsal_vars read after the
-- first SET ROLE fails with "permission denied for table _rehearsal_vars".
GRANT SELECT ON _rehearsal_vars TO authenticated;

-- Fail loudly now if any lookup came back NULL, rather than a confusing failure later.
DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM _rehearsal_vars;
  IF r.parent_a IS NULL OR r.parent_a_child IS NULL OR r.null_parent_profile IS NULL THEN
    RAISE EXCEPTION 'Rehearsal variable lookup failed — one or more required rows do not exist: %', r;
  END IF;
END $$;

-- ⚠ NOTE THIS OUTPUT — these are the real IDs used throughout the rehearsal:
SELECT * FROM _rehearsal_vars;

-- Baseline EXPLAIN ANALYZE — legacy policies only, pre-migration, impersonating parent_a.
SELECT set_config('request.jwt.claims',
  format('{"sub":"%s","role":"authenticated"}', (SELECT parent_a FROM _rehearsal_vars)), false);
SET ROLE authenticated;

-- ⚠ NOTE THE "Execution Time" LINE FOR EACH OF THESE 4 (this is the BEFORE baseline):
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM student_skill_progress WHERE student_id = (SELECT parent_a_child FROM _rehearsal_vars);
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM students_score WHERE student_id = (SELECT parent_a_child FROM _rehearsal_vars);
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM student_daily_goals WHERE student_id = (SELECT parent_a_child FROM _rehearsal_vars);
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM practice_sessions WHERE student_id = (SELECT parent_a_child FROM _rehearsal_vars);

RESET ROLE;
SELECT set_config('request.jwt.claims', '', false);


-- =============================================================================
-- STEP 1 — THE REHEARSAL TRANSACTION. Nothing from here to the final ROLLBACK
-- persists in production, regardless of outcome (an ASSERT failure aborts the
-- transaction, which also guarantees nothing persists).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Task 1a — apply the up-migration.
-- (Body of supabase/migrations/20260801120000_rls_ownership_rewrite.sql,
--  BEGIN;/COMMIT; stripped — this whole file already IS the transaction.)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.owned_child_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT id
  FROM public.child_profiles
  WHERE parent_id = (SELECT auth.uid());
$$;

COMMENT ON FUNCTION public.owned_child_ids() IS
  'Returns the child_profiles.id set owned by the calling parent (auth.uid()). '
  'SECURITY INVOKER (deliberately NOT DEFINER, per RLS-H1 deviation — DEFINER blocks '
  'planner inlining and is the RLS-05 perf-cliff anti-pattern). Downstream-only: '
  'never call from child_profiles'' own policies (RLS-H2, immediate 42P17).';

GRANT EXECUTE ON FUNCTION public.owned_child_ids() TO authenticated;

CREATE POLICY "child_profiles_all_parent_owner"
  ON public.child_profiles
  FOR ALL
  USING (parent_id = (SELECT auth.uid()))
  WITH CHECK (parent_id = (SELECT auth.uid()));

CREATE POLICY "child_profiles_select_teacher"
  ON public.child_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.teacher_id = (SELECT auth.uid())
        AND tsc.student_id = child_profiles.id
        AND tsc.status = 'accepted'
    )
  );

CREATE POLICY "assignment_submissions_all_parent_owner"
  ON public.assignment_submissions
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "feedback_submissions_insert_parent_owner"
  ON public.feedback_submissions
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "instrument_practice_logs_insert_parent_owner"
  ON public.instrument_practice_logs
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "instrument_practice_logs_select_parent_owner"
  ON public.instrument_practice_logs
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "instrument_practice_streak_all_parent_owner"
  ON public.instrument_practice_streak
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "notifications_all_parent_owner"
  ON public.notifications
  FOR ALL
  USING (recipient_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (recipient_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "parental_consent_log_insert_parent_owner"
  ON public.parental_consent_log
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "parental_consent_log_select_parent_owner"
  ON public.parental_consent_log
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "parental_consent_tokens_insert_parent_owner"
  ON public.parental_consent_tokens
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "parental_consent_tokens_select_parent_owner"
  ON public.parental_consent_tokens
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "parental_consent_tokens_update_parent_owner"
  ON public.parental_consent_tokens
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "push_subscriptions_delete_parent_owner"
  ON public.push_subscriptions
  FOR DELETE
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "push_subscriptions_insert_parent_owner"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "push_subscriptions_select_parent_owner"
  ON public.push_subscriptions
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "push_subscriptions_update_parent_owner"
  ON public.push_subscriptions
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "rate_limits_insert_parent_owner"
  ON public.rate_limits
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "rate_limits_select_parent_owner"
  ON public.rate_limits
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "rate_limits_update_parent_owner"
  ON public.rate_limits
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_daily_challenges_all_parent_owner"
  ON public.student_daily_challenges
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_daily_goals_insert_parent_owner"
  ON public.student_daily_goals
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_daily_goals_select_parent_owner"
  ON public.student_daily_goals
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_daily_goals_update_parent_owner"
  ON public.student_daily_goals
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_point_transactions_insert_parent_owner"
  ON public.student_point_transactions
  FOR INSERT
  WITH CHECK (
    student_id IN (SELECT public.owned_child_ids())
    AND delta <= 0
  );

CREATE POLICY "student_point_transactions_select_parent_owner"
  ON public.student_point_transactions
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_unit_progress_delete_parent_owner"
  ON public.student_unit_progress
  FOR DELETE
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_unit_progress_insert_parent_owner"
  ON public.student_unit_progress
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_unit_progress_select_parent_owner"
  ON public.student_unit_progress
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_unit_progress_update_parent_owner"
  ON public.student_unit_progress
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "user_accessories_all_parent_owner"
  ON public.user_accessories
  FOR ALL
  USING (user_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (user_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "class_enrollments_all_parent_owner"
  ON public.class_enrollments
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "current_streak_all_parent_owner"
  ON public.current_streak
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "highest_streak_all_parent_owner"
  ON public.highest_streak
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "last_practiced_date_all_parent_owner"
  ON public.last_practiced_date
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "practice_sessions_all_parent_owner"
  ON public.practice_sessions
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_achievements_all_parent_owner"
  ON public.student_achievements
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_profiles_all_parent_owner"
  ON public.student_profiles
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "user_preferences_select_parent_owner"
  ON public.user_preferences
  FOR SELECT
  USING (user_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "user_preferences_insert_parent_owner"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (user_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "user_preferences_update_parent_owner"
  ON public.user_preferences
  FOR UPDATE
  USING (user_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (user_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "accessories_select_parent_owner"
  ON public.accessories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles
      WHERE parent_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "assignments_select_parent_owner"
  ON public.assignments
  FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM public.class_enrollments
      WHERE student_id IN (SELECT public.owned_child_ids())
        AND status = 'active'
    )
  );

CREATE POLICY "student_skill_progress_delete_parent_owner"
  ON public.student_skill_progress
  FOR DELETE
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_skill_progress_insert_parent_owner"
  ON public.student_skill_progress
  FOR INSERT
  WITH CHECK (
    student_id IN (SELECT public.owned_child_ids())
    AND (is_free_node(node_id) OR has_active_subscription((SELECT auth.uid())))
  );

CREATE POLICY "student_skill_progress_select_parent_owner"
  ON public.student_skill_progress
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_skill_progress_update_parent_owner"
  ON public.student_skill_progress
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (
    student_id IN (SELECT public.owned_child_ids())
    AND (is_free_node(node_id) OR has_active_subscription((SELECT auth.uid())))
  );

CREATE POLICY "students_score_delete_parent_owner"
  ON public.students_score
  FOR DELETE
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "students_score_insert_parent_owner"
  ON public.students_score
  FOR INSERT
  WITH CHECK (
    student_id IN (SELECT public.owned_child_ids())
    AND (is_free_node(node_id) OR has_active_subscription((SELECT auth.uid())))
  );

CREATE POLICY "students_score_select_parent_owner"
  ON public.students_score
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "students_score_update_parent_owner"
  ON public.students_score
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE OR REPLACE FUNCTION award_xp(p_student_id UUID, p_xp_amount INTEGER)
RETURNS TABLE(new_total_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER := 1;
  v_prestige_xp_per_tier INTEGER := 3000;
  v_level_thresholds INTEGER[] := ARRAY[0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7500, 9000, 10500, 12200, 14100, 16200, 18500, 21000, 23700, 26500, 29400, 32500, 35800, 39300, 43000, 46900, 51000];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_student_id NOT IN (SELECT public.owned_child_ids()) THEN
    RAISE EXCEPTION 'Unauthorized: You can only award XP to a child you own';
  END IF;

  SELECT total_xp, current_level INTO v_current_xp, v_current_level
  FROM students
  WHERE id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  v_new_xp := v_current_xp + p_xp_amount;

  FOR i IN 1..30 LOOP
    IF v_new_xp >= v_level_thresholds[i] THEN
      v_new_level := i;
    END IF;
  END LOOP;

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

  UPDATE students
  SET total_xp = v_new_xp,
      current_level = v_new_level
  WHERE id = p_student_id;

  new_total_xp := v_new_xp;
  new_level := v_new_level;
  leveled_up := v_new_level > v_current_level;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION award_xp(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION award_xp IS
  'Awards XP to a student and automatically calculates level progression. Security: caller must own the target child (p_student_id IN owned_child_ids()), D-23 re-point from the original auth.uid()=p_student_id self-only check.';

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_student_id UUID,
  p_node_id TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 300
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tokens INTEGER;
  v_elapsed_seconds NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Not authenticated';
  END IF;

  IF p_student_id NOT IN (SELECT public.owned_child_ids()) THEN
    RAISE EXCEPTION 'Unauthorized: You can only check rate limit for a child you own';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_student_id::text || p_node_id));

  SELECT tokens, EXTRACT(EPOCH FROM (NOW() - last_refill))
  INTO v_tokens, v_elapsed_seconds
  FROM rate_limits
  WHERE student_id = p_student_id AND node_id = p_node_id;

  IF NOT FOUND THEN
    INSERT INTO rate_limits (student_id, node_id, tokens, last_refill)
    VALUES (p_student_id, p_node_id, p_max_requests - 1, NOW());
    RETURN TRUE;
  END IF;

  IF v_elapsed_seconds >= p_window_seconds THEN
    UPDATE rate_limits
    SET tokens = p_max_requests - 1, last_refill = NOW()
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  END IF;

  IF v_tokens > 0 THEN
    UPDATE rate_limits
    SET tokens = tokens - 1
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.check_rate_limit IS 'Fixed window rate limiter: 10 requests per 5 minutes per student per node. Returns TRUE if request allowed, FALSE if rate limited. Uses advisory lock to prevent race conditions. Security: caller must own the target child (p_student_id IN owned_child_ids()), D-23 re-point from the original auth.uid()=p_student_id self-only check.';


-- -----------------------------------------------------------------------------
-- Seed the synthetic second family (body of 02-seed-second-family.sql)
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
  '',
  NOW(), NOW(), NOW(),
  '{"provider":"synthetic","providers":["synthetic"]}'::jsonb,
  '{"synthetic_seed":"02-seed-second-family","note":"REHEARSAL-ONLY, rolled back"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO parents (id, display_name, requires_reconsent) VALUES
  ('00000000-0000-0000-0000-0000000000b0'::uuid, 'SYNTHETIC Parent B', FALSE)
ON CONFLICT (id) DO NOTHING;

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

INSERT INTO student_skill_progress (student_id, node_id, stars, best_score)
VALUES ('00000000-0000-0000-0000-0000000000c0'::uuid, 'treble_c_d', 2, 80)
ON CONFLICT DO NOTHING;

INSERT INTO students_score (student_id, score, game_type)
VALUES ('00000000-0000-0000-0000-0000000000c0'::uuid, 42, 'notes_master')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Synthetic teachers for RLS-06 cases 4/5 (live data has exactly ONE real
-- teacher, connected to NONE of the 5 null-parent profiles — see chat).
-- 'd0' = the connected teacher (gets a fresh accepted connection below),
-- 'd1' = the unconnected teacher (deliberately no connection row at all).
-- -----------------------------------------------------------------------------

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES
  (
    '00000000-0000-0000-0000-0000000000d0'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated',
    'synthetic-connected-teacher@rehearsal-branch.invalid', '',
    NOW(), NOW(), NOW(),
    '{"provider":"synthetic","providers":["synthetic"]}'::jsonb,
    '{"synthetic_seed":"02-rehearsal-runbook","note":"REHEARSAL-ONLY, rolled back"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-0000000000d1'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated',
    'synthetic-unconnected-teacher@rehearsal-branch.invalid', '',
    NOW(), NOW(), NOW(),
    '{"provider":"synthetic","providers":["synthetic"]}'::jsonb,
    '{"synthetic_seed":"02-rehearsal-runbook","note":"REHEARSAL-ONLY, rolled back"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO teachers (id, first_name, last_name, email) VALUES
  ('00000000-0000-0000-0000-0000000000d0'::uuid, 'SYNTHETIC', 'Connected Teacher', 'synthetic-connected-teacher@rehearsal-branch.invalid'),
  ('00000000-0000-0000-0000-0000000000d1'::uuid, 'SYNTHETIC', 'Unconnected Teacher', 'synthetic-unconnected-teacher@rehearsal-branch.invalid')
ON CONFLICT (id) DO NOTHING;

INSERT INTO teacher_student_connections (teacher_id, student_id, status)
VALUES (
  '00000000-0000-0000-0000-0000000000d0'::uuid,
  (SELECT null_parent_profile FROM _rehearsal_vars),
  'accepted'
)
ON CONFLICT (teacher_id, student_id) DO UPDATE SET status = 'accepted';


-- -----------------------------------------------------------------------------
-- Task 2 — RLS-01 / RLS-02 / RLS-03 / RLS-04(static) assertions
-- (verbatim from 02-db-assertions.sql, no placeholders needed for these)
-- -----------------------------------------------------------------------------

-- RLS-01 — owned_child_ids() shape
DO $$
BEGIN
  ASSERT (SELECT prosecdef FROM pg_proc WHERE proname='owned_child_ids') = false,
    'RLS-01 FAIL: owned_child_ids() is SECURITY DEFINER, expected SECURITY INVOKER (RLS-H1 deviation)';
  ASSERT (SELECT provolatile FROM pg_proc WHERE proname='owned_child_ids') = 's',
    'RLS-01 FAIL: owned_child_ids() is not STABLE';
  RAISE NOTICE 'RLS-01 PASS';
END $$;

-- RLS-02 — dual-policy coverage across the 24-table inventory
DO $$
DECLARE uncovered text;
BEGIN
  SELECT string_agg(t.tablename || ':' || t.cmd, ', ') INTO uncovered
  FROM (
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
      ('class_enrollments','ALL'),('current_streak','ALL'),('highest_streak','ALL'),
      ('last_practiced_date','ALL'),('practice_sessions','ALL'),
      ('student_achievements','ALL'),('student_profiles','ALL'),
      ('child_profiles','ALL'),('child_profiles','SELECT'),
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
  RAISE NOTICE 'RLS-02 PASS';
END $$;

-- RLS-03 — every _parent_owner INSERT/UPDATE has a non-trivial WITH CHECK
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM pg_policies
          WHERE schemaname='public' AND policyname LIKE '%_parent_owner'
            AND cmd IN ('INSERT','UPDATE') AND (with_check IS NULL OR with_check = 'true')) = 0,
    'RLS-03 FAIL: a _parent_owner INSERT/UPDATE policy has NULL or unconditional WITH CHECK';
  RAISE NOTICE 'RLS-03 PASS';
END $$;

-- RLS-04(a) — static recursion guard: child_profiles' own policy never calls owned_child_ids()
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM pg_policies
          WHERE schemaname='public' AND tablename='child_profiles'
            AND (qual ILIKE '%owned_child_ids%' OR with_check ILIKE '%owned_child_ids%')) = 0,
    'RLS-04 FAIL: child_profiles own policy references owned_child_ids (recursion risk, RLS-H2 breach)';
  RAISE NOTICE 'RLS-04(a) PASS';
END $$;

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND policyname LIKE '%_parent_owner') = 50,
    format('Sanity check: expected 50 _parent_owner policies, found %s', (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND policyname LIKE '%_parent_owner'));
  RAISE NOTICE 'Policy count sanity check PASS (50 _parent_owner policies present)';
END $$;


-- -----------------------------------------------------------------------------
-- Task 2 — RLS-04(b) runtime touch + RLS-06 case 1, impersonating parent_a
-- Zero errors on any of these 26 touches = RLS-04(b) PASS.
-- -----------------------------------------------------------------------------

SELECT set_config('request.jwt.claims',
  format('{"sub":"%s","role":"authenticated"}', (SELECT parent_a FROM _rehearsal_vars)), true);
SET ROLE authenticated;

SELECT * FROM assignment_submissions LIMIT 1;
SELECT * FROM feedback_submissions LIMIT 1;
SELECT * FROM instrument_practice_logs LIMIT 1;
SELECT * FROM instrument_practice_streak LIMIT 1;
SELECT * FROM notifications LIMIT 1;
SELECT * FROM parental_consent_log LIMIT 1;
SELECT * FROM parental_consent_tokens LIMIT 1;
SELECT * FROM push_subscriptions LIMIT 1;
SELECT * FROM rate_limits LIMIT 1;
SELECT * FROM student_daily_challenges LIMIT 1;
SELECT * FROM student_daily_goals LIMIT 1;
SELECT * FROM student_point_transactions LIMIT 1;
SELECT * FROM student_skill_progress LIMIT 1;
SELECT * FROM student_unit_progress LIMIT 1;
SELECT * FROM students_score LIMIT 1;
SELECT * FROM user_accessories LIMIT 1;
SELECT * FROM class_enrollments LIMIT 1;
SELECT * FROM current_streak LIMIT 1;
SELECT * FROM highest_streak LIMIT 1;
SELECT * FROM last_practiced_date LIMIT 1;
SELECT * FROM practice_sessions LIMIT 1;
SELECT * FROM student_achievements LIMIT 1;
SELECT * FROM student_profiles LIMIT 1;
SELECT * FROM child_profiles LIMIT 1;
SELECT * FROM user_preferences LIMIT 1;
SELECT * FROM accessories LIMIT 1;
SELECT * FROM assignments LIMIT 1;

DO $$
DECLARE v record;
BEGIN
  SELECT * INTO v FROM _rehearsal_vars;
  ASSERT EXISTS (SELECT 1 FROM child_profiles WHERE id = v.parent_a_child),
    'RLS-06 case 1 FAIL: Parent A cannot see their own child_profiles row';
  RAISE NOTICE 'RLS-04(b) runtime touch PASS (26 tables, zero errors) / RLS-06 case 1 PASS';
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);


-- -----------------------------------------------------------------------------
-- RLS-06 case 2 — Parent A sees ZERO rows for Parent B's child + downstream
-- -----------------------------------------------------------------------------
SELECT set_config('request.jwt.claims',
  format('{"sub":"%s","role":"authenticated"}', (SELECT parent_a FROM _rehearsal_vars)), true);
SET ROLE authenticated;

DO $$
DECLARE v record;
BEGIN
  SELECT * INTO v FROM _rehearsal_vars;
  ASSERT NOT EXISTS (SELECT 1 FROM child_profiles WHERE id = v.parent_b_child),
    'RLS-06 case 2 FAIL: Parent A can see Parent B''s child_profiles row (cross-family leak)';
  ASSERT NOT EXISTS (SELECT 1 FROM student_skill_progress WHERE student_id = v.parent_b_child),
    'RLS-06 case 2 FAIL: Parent A can see Parent B''s child downstream data (cross-family leak)';
  ASSERT NOT EXISTS (SELECT 1 FROM students_score WHERE student_id = v.parent_b_child),
    'RLS-06 case 2 FAIL: Parent A can see Parent B''s child students_score row (cross-family leak)';
  RAISE NOTICE 'RLS-06 case 2 PASS';
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);


-- -----------------------------------------------------------------------------
-- RLS-06 case 3 — any parent sees ZERO rows for a null-parent (teacher-owned) profile
-- -----------------------------------------------------------------------------
SELECT set_config('request.jwt.claims',
  format('{"sub":"%s","role":"authenticated"}', (SELECT parent_a FROM _rehearsal_vars)), true);
SET ROLE authenticated;

DO $$
DECLARE v record;
BEGIN
  SELECT * INTO v FROM _rehearsal_vars;
  ASSERT NOT EXISTS (SELECT 1 FROM child_profiles WHERE id = v.null_parent_profile),
    'RLS-06 case 3 FAIL: an arbitrary parent can see a null-parent profile';
  ASSERT NOT EXISTS (SELECT 1 FROM student_skill_progress WHERE student_id = v.null_parent_profile),
    'RLS-06 case 3 FAIL: an arbitrary parent can see a null-parent profile''s downstream data';
  RAISE NOTICE 'RLS-06 case 3 PASS';
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);


-- -----------------------------------------------------------------------------
-- RLS-06 case 4 — unconnected teacher sees ZERO rows for the null-parent profile
-- -----------------------------------------------------------------------------
SELECT set_config('request.jwt.claims',
  format('{"sub":"%s","role":"authenticated"}', (SELECT unconnected_teacher FROM _rehearsal_vars)), true);
SET ROLE authenticated;

DO $$
DECLARE v record;
BEGIN
  SELECT * INTO v FROM _rehearsal_vars;
  ASSERT NOT EXISTS (SELECT 1 FROM child_profiles WHERE id = v.null_parent_profile),
    'RLS-06 case 4 FAIL: an unconnected teacher can see the null-parent profile';
  RAISE NOTICE 'RLS-06 case 4 PASS';
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);


-- -----------------------------------------------------------------------------
-- RLS-06 case 5 — connected teacher SEES the null-parent profile
-- -----------------------------------------------------------------------------
SELECT set_config('request.jwt.claims',
  format('{"sub":"%s","role":"authenticated"}', (SELECT connected_teacher FROM _rehearsal_vars)), true);
SET ROLE authenticated;

DO $$
DECLARE v record;
BEGIN
  SELECT * INTO v FROM _rehearsal_vars;
  ASSERT EXISTS (SELECT 1 FROM child_profiles WHERE id = v.null_parent_profile),
    'RLS-06 case 5 FAIL: the connected teacher cannot see the null-parent profile (D-30/RLS-T1 regression)';
  RAISE NOTICE 'RLS-06 case 5 PASS';
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);


-- -----------------------------------------------------------------------------
-- RLS-06 case 6 — Parent A's cross-family UPDATE is rejected by WITH CHECK
-- (no nested BEGIN/ROLLBACK here — we're already inside the outer rehearsal
-- transaction, and the whole thing rolls back at the end regardless)
-- -----------------------------------------------------------------------------
SELECT set_config('request.jwt.claims',
  format('{"sub":"%s","role":"authenticated"}', (SELECT parent_a FROM _rehearsal_vars)), true);
SET ROLE authenticated;

DO $$
DECLARE v record; affected int;
BEGIN
  SELECT * INTO v FROM _rehearsal_vars;
  UPDATE student_skill_progress
     SET student_id = v.parent_b_child
   WHERE student_id = v.parent_a_child;
  GET DIAGNOSTICS affected = ROW_COUNT;
  ASSERT affected = 0,
    'RLS-06 case 6 FAIL: Parent A''s cross-family UPDATE (repoint to Parent B''s child) was NOT rejected by WITH CHECK';
  RAISE NOTICE 'RLS-06 case 6 PASS (0 rows affected)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'RLS-06 case 6 PASS (UPDATE raised, acceptable WITH CHECK rejection): %', SQLERRM;
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);


-- -----------------------------------------------------------------------------
-- Task 3 — RLS-05 post-migration EXPLAIN ANALYZE, as parent_a then parent_b.
-- ⚠ NOTE THE "Execution Time" LINE FOR EACH — compare against the BEFORE
-- baseline captured in STEP 0. Expect within a few percent, not a multiplier.
-- -----------------------------------------------------------------------------
SELECT set_config('request.jwt.claims',
  format('{"sub":"%s","role":"authenticated"}', (SELECT parent_a FROM _rehearsal_vars)), true);
SET ROLE authenticated;

EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM student_skill_progress WHERE student_id = (SELECT parent_a_child FROM _rehearsal_vars);
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM students_score WHERE student_id = (SELECT parent_a_child FROM _rehearsal_vars);
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM student_daily_goals WHERE student_id = (SELECT parent_a_child FROM _rehearsal_vars);
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM practice_sessions WHERE student_id = (SELECT parent_a_child FROM _rehearsal_vars);

RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);

-- Cross-family cost check — Parent B's IN-list should scope correctly, no cost anomaly.
SELECT set_config('request.jwt.claims',
  format('{"sub":"%s","role":"authenticated"}', (SELECT parent_b FROM _rehearsal_vars)), true);
SET ROLE authenticated;

EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM student_skill_progress WHERE student_id = (SELECT parent_b_child FROM _rehearsal_vars);

RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);
RESET ROLE;


-- -----------------------------------------------------------------------------
-- Task 1b — apply the down-migration (proves clean reversal).
-- (Body of 20260801120000_rls_ownership_rewrite.down.sql, BEGIN;/COMMIT; stripped)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION award_xp(p_student_id UUID, p_xp_amount INTEGER)
RETURNS TABLE(new_total_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER := 1;
  v_prestige_xp_per_tier INTEGER := 3000;
  v_level_thresholds INTEGER[] := ARRAY[0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7500, 9000, 10500, 12200, 14100, 16200, 18500, 21000, 23700, 26500, 29400, 32500, 35800, 39300, 43000, 46900, 51000];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot award XP to another user';
  END IF;

  SELECT total_xp, current_level INTO v_current_xp, v_current_level
  FROM students
  WHERE id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  v_new_xp := v_current_xp + p_xp_amount;

  FOR i IN 1..30 LOOP
    IF v_new_xp >= v_level_thresholds[i] THEN
      v_new_level := i;
    END IF;
  END LOOP;

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

  UPDATE students
  SET total_xp = v_new_xp,
      current_level = v_new_level
  WHERE id = p_student_id;

  new_total_xp := v_new_xp;
  new_level := v_new_level;
  leveled_up := v_new_level > v_current_level;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION award_xp(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION award_xp IS
  'Awards XP to a student and automatically calculates level progression. Security: Users can only award XP to themselves (auth.uid() must equal p_student_id).';

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_student_id UUID,
  p_node_id TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 300
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tokens INTEGER;
  v_elapsed_seconds NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Not authenticated';
  END IF;

  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot check rate limit for another user';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_student_id::text || p_node_id));

  SELECT tokens, EXTRACT(EPOCH FROM (NOW() - last_refill))
  INTO v_tokens, v_elapsed_seconds
  FROM rate_limits
  WHERE student_id = p_student_id AND node_id = p_node_id;

  IF NOT FOUND THEN
    INSERT INTO rate_limits (student_id, node_id, tokens, last_refill)
    VALUES (p_student_id, p_node_id, p_max_requests - 1, NOW());
    RETURN TRUE;
  END IF;

  IF v_elapsed_seconds >= p_window_seconds THEN
    UPDATE rate_limits
    SET tokens = p_max_requests - 1, last_refill = NOW()
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  END IF;

  IF v_tokens > 0 THEN
    UPDATE rate_limits
    SET tokens = tokens - 1
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.check_rate_limit IS 'Fixed window rate limiter: 10 requests per 5 minutes per student per node. Returns TRUE if request allowed, FALSE if rate limited. Uses advisory lock to prevent race conditions.';

DROP POLICY IF EXISTS "students_score_update_parent_owner" ON public.students_score;
DROP POLICY IF EXISTS "students_score_select_parent_owner" ON public.students_score;
DROP POLICY IF EXISTS "students_score_insert_parent_owner" ON public.students_score;
DROP POLICY IF EXISTS "students_score_delete_parent_owner" ON public.students_score;

DROP POLICY IF EXISTS "student_skill_progress_update_parent_owner" ON public.student_skill_progress;
DROP POLICY IF EXISTS "student_skill_progress_select_parent_owner" ON public.student_skill_progress;
DROP POLICY IF EXISTS "student_skill_progress_insert_parent_owner" ON public.student_skill_progress;
DROP POLICY IF EXISTS "student_skill_progress_delete_parent_owner" ON public.student_skill_progress;

DROP POLICY IF EXISTS "assignments_select_parent_owner" ON public.assignments;
DROP POLICY IF EXISTS "accessories_select_parent_owner" ON public.accessories;
DROP POLICY IF EXISTS "user_preferences_update_parent_owner" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_insert_parent_owner" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_select_parent_owner" ON public.user_preferences;

DROP POLICY IF EXISTS "student_profiles_all_parent_owner" ON public.student_profiles;
DROP POLICY IF EXISTS "student_achievements_all_parent_owner" ON public.student_achievements;
DROP POLICY IF EXISTS "practice_sessions_all_parent_owner" ON public.practice_sessions;
DROP POLICY IF EXISTS "last_practiced_date_all_parent_owner" ON public.last_practiced_date;
DROP POLICY IF EXISTS "highest_streak_all_parent_owner" ON public.highest_streak;
DROP POLICY IF EXISTS "current_streak_all_parent_owner" ON public.current_streak;
DROP POLICY IF EXISTS "class_enrollments_all_parent_owner" ON public.class_enrollments;

DROP POLICY IF EXISTS "user_accessories_all_parent_owner" ON public.user_accessories;

DROP POLICY IF EXISTS "student_unit_progress_update_parent_owner" ON public.student_unit_progress;
DROP POLICY IF EXISTS "student_unit_progress_select_parent_owner" ON public.student_unit_progress;
DROP POLICY IF EXISTS "student_unit_progress_insert_parent_owner" ON public.student_unit_progress;
DROP POLICY IF EXISTS "student_unit_progress_delete_parent_owner" ON public.student_unit_progress;

DROP POLICY IF EXISTS "student_point_transactions_select_parent_owner" ON public.student_point_transactions;
DROP POLICY IF EXISTS "student_point_transactions_insert_parent_owner" ON public.student_point_transactions;

DROP POLICY IF EXISTS "student_daily_goals_update_parent_owner" ON public.student_daily_goals;
DROP POLICY IF EXISTS "student_daily_goals_select_parent_owner" ON public.student_daily_goals;
DROP POLICY IF EXISTS "student_daily_goals_insert_parent_owner" ON public.student_daily_goals;

DROP POLICY IF EXISTS "student_daily_challenges_all_parent_owner" ON public.student_daily_challenges;

DROP POLICY IF EXISTS "rate_limits_update_parent_owner" ON public.rate_limits;
DROP POLICY IF EXISTS "rate_limits_select_parent_owner" ON public.rate_limits;
DROP POLICY IF EXISTS "rate_limits_insert_parent_owner" ON public.rate_limits;

DROP POLICY IF EXISTS "push_subscriptions_update_parent_owner" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_select_parent_owner" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert_parent_owner" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete_parent_owner" ON public.push_subscriptions;

DROP POLICY IF EXISTS "parental_consent_tokens_update_parent_owner" ON public.parental_consent_tokens;
DROP POLICY IF EXISTS "parental_consent_tokens_select_parent_owner" ON public.parental_consent_tokens;
DROP POLICY IF EXISTS "parental_consent_tokens_insert_parent_owner" ON public.parental_consent_tokens;

DROP POLICY IF EXISTS "parental_consent_log_select_parent_owner" ON public.parental_consent_log;
DROP POLICY IF EXISTS "parental_consent_log_insert_parent_owner" ON public.parental_consent_log;

DROP POLICY IF EXISTS "notifications_all_parent_owner" ON public.notifications;

DROP POLICY IF EXISTS "instrument_practice_streak_all_parent_owner" ON public.instrument_practice_streak;

DROP POLICY IF EXISTS "instrument_practice_logs_select_parent_owner" ON public.instrument_practice_logs;
DROP POLICY IF EXISTS "instrument_practice_logs_insert_parent_owner" ON public.instrument_practice_logs;

DROP POLICY IF EXISTS "feedback_submissions_insert_parent_owner" ON public.feedback_submissions;

DROP POLICY IF EXISTS "assignment_submissions_all_parent_owner" ON public.assignment_submissions;

DROP POLICY IF EXISTS "child_profiles_select_teacher" ON public.child_profiles;
DROP POLICY IF EXISTS "child_profiles_all_parent_owner" ON public.child_profiles;

DROP FUNCTION IF EXISTS public.owned_child_ids();

-- Confirm the down-migration left nothing behind.
DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='owned_child_ids'),
    'down-migration FAIL: owned_child_ids() still exists after DROP';
  ASSERT (SELECT count(*) FROM pg_policies WHERE policyname LIKE '%_parent_owner') = 0,
    format('down-migration FAIL: %s _parent_owner polic(y/ies) still exist after down-migration',
      (SELECT count(*) FROM pg_policies WHERE policyname LIKE '%_parent_owner'));
  RAISE NOTICE 'Down-migration clean-reversal check PASS';
END $$;


-- -----------------------------------------------------------------------------
-- Task 1c — re-apply the up-migration once more (idempotency proof).
-- Identical body to Task 1a above.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.owned_child_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT id
  FROM public.child_profiles
  WHERE parent_id = (SELECT auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.owned_child_ids() TO authenticated;

CREATE POLICY "child_profiles_all_parent_owner"
  ON public.child_profiles
  FOR ALL
  USING (parent_id = (SELECT auth.uid()))
  WITH CHECK (parent_id = (SELECT auth.uid()));

CREATE POLICY "child_profiles_select_teacher"
  ON public.child_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.teacher_id = (SELECT auth.uid())
        AND tsc.student_id = child_profiles.id
        AND tsc.status = 'accepted'
    )
  );

CREATE POLICY "assignment_submissions_all_parent_owner"
  ON public.assignment_submissions
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "feedback_submissions_insert_parent_owner"
  ON public.feedback_submissions
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "instrument_practice_logs_insert_parent_owner"
  ON public.instrument_practice_logs
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "instrument_practice_logs_select_parent_owner"
  ON public.instrument_practice_logs
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "instrument_practice_streak_all_parent_owner"
  ON public.instrument_practice_streak
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "notifications_all_parent_owner"
  ON public.notifications
  FOR ALL
  USING (recipient_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (recipient_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "parental_consent_log_insert_parent_owner"
  ON public.parental_consent_log
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "parental_consent_log_select_parent_owner"
  ON public.parental_consent_log
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "parental_consent_tokens_insert_parent_owner"
  ON public.parental_consent_tokens
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "parental_consent_tokens_select_parent_owner"
  ON public.parental_consent_tokens
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "parental_consent_tokens_update_parent_owner"
  ON public.parental_consent_tokens
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "push_subscriptions_delete_parent_owner"
  ON public.push_subscriptions
  FOR DELETE
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "push_subscriptions_insert_parent_owner"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "push_subscriptions_select_parent_owner"
  ON public.push_subscriptions
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "push_subscriptions_update_parent_owner"
  ON public.push_subscriptions
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "rate_limits_insert_parent_owner"
  ON public.rate_limits
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "rate_limits_select_parent_owner"
  ON public.rate_limits
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "rate_limits_update_parent_owner"
  ON public.rate_limits
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_daily_challenges_all_parent_owner"
  ON public.student_daily_challenges
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_daily_goals_insert_parent_owner"
  ON public.student_daily_goals
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_daily_goals_select_parent_owner"
  ON public.student_daily_goals
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_daily_goals_update_parent_owner"
  ON public.student_daily_goals
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_point_transactions_insert_parent_owner"
  ON public.student_point_transactions
  FOR INSERT
  WITH CHECK (
    student_id IN (SELECT public.owned_child_ids())
    AND delta <= 0
  );

CREATE POLICY "student_point_transactions_select_parent_owner"
  ON public.student_point_transactions
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_unit_progress_delete_parent_owner"
  ON public.student_unit_progress
  FOR DELETE
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_unit_progress_insert_parent_owner"
  ON public.student_unit_progress
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_unit_progress_select_parent_owner"
  ON public.student_unit_progress
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_unit_progress_update_parent_owner"
  ON public.student_unit_progress
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "user_accessories_all_parent_owner"
  ON public.user_accessories
  FOR ALL
  USING (user_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (user_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "class_enrollments_all_parent_owner"
  ON public.class_enrollments
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "current_streak_all_parent_owner"
  ON public.current_streak
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "highest_streak_all_parent_owner"
  ON public.highest_streak
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "last_practiced_date_all_parent_owner"
  ON public.last_practiced_date
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "practice_sessions_all_parent_owner"
  ON public.practice_sessions
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_achievements_all_parent_owner"
  ON public.student_achievements
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_profiles_all_parent_owner"
  ON public.student_profiles
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "user_preferences_select_parent_owner"
  ON public.user_preferences
  FOR SELECT
  USING (user_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "user_preferences_insert_parent_owner"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (user_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "user_preferences_update_parent_owner"
  ON public.user_preferences
  FOR UPDATE
  USING (user_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (user_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "accessories_select_parent_owner"
  ON public.accessories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles
      WHERE parent_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "assignments_select_parent_owner"
  ON public.assignments
  FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM public.class_enrollments
      WHERE student_id IN (SELECT public.owned_child_ids())
        AND status = 'active'
    )
  );

CREATE POLICY "student_skill_progress_delete_parent_owner"
  ON public.student_skill_progress
  FOR DELETE
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_skill_progress_insert_parent_owner"
  ON public.student_skill_progress
  FOR INSERT
  WITH CHECK (
    student_id IN (SELECT public.owned_child_ids())
    AND (is_free_node(node_id) OR has_active_subscription((SELECT auth.uid())))
  );

CREATE POLICY "student_skill_progress_select_parent_owner"
  ON public.student_skill_progress
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "student_skill_progress_update_parent_owner"
  ON public.student_skill_progress
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (
    student_id IN (SELECT public.owned_child_ids())
    AND (is_free_node(node_id) OR has_active_subscription((SELECT auth.uid())))
  );

CREATE POLICY "students_score_delete_parent_owner"
  ON public.students_score
  FOR DELETE
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "students_score_insert_parent_owner"
  ON public.students_score
  FOR INSERT
  WITH CHECK (
    student_id IN (SELECT public.owned_child_ids())
    AND (is_free_node(node_id) OR has_active_subscription((SELECT auth.uid())))
  );

CREATE POLICY "students_score_select_parent_owner"
  ON public.students_score
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "students_score_update_parent_owner"
  ON public.students_score
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE OR REPLACE FUNCTION award_xp(p_student_id UUID, p_xp_amount INTEGER)
RETURNS TABLE(new_total_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER := 1;
  v_prestige_xp_per_tier INTEGER := 3000;
  v_level_thresholds INTEGER[] := ARRAY[0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7500, 9000, 10500, 12200, 14100, 16200, 18500, 21000, 23700, 26500, 29400, 32500, 35800, 39300, 43000, 46900, 51000];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_student_id NOT IN (SELECT public.owned_child_ids()) THEN
    RAISE EXCEPTION 'Unauthorized: You can only award XP to a child you own';
  END IF;

  SELECT total_xp, current_level INTO v_current_xp, v_current_level
  FROM students
  WHERE id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  v_new_xp := v_current_xp + p_xp_amount;

  FOR i IN 1..30 LOOP
    IF v_new_xp >= v_level_thresholds[i] THEN
      v_new_level := i;
    END IF;
  END LOOP;

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

  UPDATE students
  SET total_xp = v_new_xp,
      current_level = v_new_level
  WHERE id = p_student_id;

  new_total_xp := v_new_xp;
  new_level := v_new_level;
  leveled_up := v_new_level > v_current_level;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION award_xp(UUID, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_student_id UUID,
  p_node_id TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 300
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tokens INTEGER;
  v_elapsed_seconds NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Not authenticated';
  END IF;

  IF p_student_id NOT IN (SELECT public.owned_child_ids()) THEN
    RAISE EXCEPTION 'Unauthorized: You can only check rate limit for a child you own';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_student_id::text || p_node_id));

  SELECT tokens, EXTRACT(EPOCH FROM (NOW() - last_refill))
  INTO v_tokens, v_elapsed_seconds
  FROM rate_limits
  WHERE student_id = p_student_id AND node_id = p_node_id;

  IF NOT FOUND THEN
    INSERT INTO rate_limits (student_id, node_id, tokens, last_refill)
    VALUES (p_student_id, p_node_id, p_max_requests - 1, NOW());
    RETURN TRUE;
  END IF;

  IF v_elapsed_seconds >= p_window_seconds THEN
    UPDATE rate_limits
    SET tokens = p_max_requests - 1, last_refill = NOW()
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  END IF;

  IF v_tokens > 0 THEN
    UPDATE rate_limits
    SET tokens = tokens - 1
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- Confirm re-apply idempotency.
DO $$
DECLARE n int;
BEGIN
  ASSERT (SELECT count(*) FROM pg_proc WHERE proname='owned_child_ids') = 1,
    're-apply FAIL: owned_child_ids() was not recreated';
  n := (SELECT count(*) FROM pg_policies WHERE policyname LIKE '%_parent_owner');
  ASSERT n = 50, format('re-apply FAIL: expected 50 _parent_owner policies after re-apply, found %s', n);
  RAISE NOTICE 'Re-apply idempotency check PASS (owned_child_ids() + 50 policies recreated cleanly)';
END $$;


-- =============================================================================
-- UNDO EVERYTHING. Nothing above this line persists in production.
-- =============================================================================

ROLLBACK;

-- Post-rollback sanity check (separate implicit read, confirms nothing survived):
SELECT
  (SELECT count(*) FROM pg_proc WHERE proname = 'owned_child_ids') AS owned_child_ids_count_should_be_0,
  (SELECT count(*) FROM pg_policies WHERE policyname LIKE '%_parent_owner') AS parent_owner_policy_count_should_be_0,
  (SELECT count(*) FROM parents WHERE id = '00000000-0000-0000-0000-0000000000b0') AS synthetic_parent_b_should_be_0;

DROP TABLE IF EXISTS _rehearsal_vars;

-- =============================================================================
-- End of rehearsal. A clean run shows: no ERROR anywhere above, every RAISE
-- NOTICE reads "... PASS", and the final sanity-check SELECT returns all
-- zeros. Paste the full output (notices + EXPLAIN timings + final SELECT)
-- back for 02-apply-log.md.
-- =============================================================================
