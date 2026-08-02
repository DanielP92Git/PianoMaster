-- =============================================================================
-- Migration:   20260801120000_rls_ownership_rewrite
-- Date:        2026-08-02
-- Milestone:   v4.0 — Parent-First Account Architecture (COPPA), Phase 2
-- Description: Additive, reversible RLS rewrite (RLS-01..RLS-06). Adds
--              owned_child_ids() SECURITY INVOKER SQL STABLE helper + 51 new
--              parent-ownership policies (2 Group C child_profiles terminal +
--              37 Group A [29 non-gated + 8 gated] + 7 Group B + 5 edge-case
--              siblings) across the 24-table inventory, OR'd alongside legacy
--              `student_id = auth.uid()` policies (dual-policy, additive
--              discipline — "add, don't replace"). Handles 3 owner-resolved
--              edge cases (D-31 user_preferences, D-32 accessories +
--              assignments — both shipped as brand-new additive siblings per
--              this plan's own task text, not in-place edits, so the
--              migration stays zero-removal throughout). Re-points
--              award_xp/check_rate_limit ownership checks (D-23). Legacy
--              policies are NOT dropped — Phase 8's contract step drops them
--              after verified zero traffic.
-- Source artifacts (owner-signed):
--               .planning/phases/02-rls-rewrite-ownership-based-access-control/02-policy-inventory.md
--               .planning/phases/02-rls-rewrite-ownership-based-access-control/02-inlining-verdict.md (VERDICT=FUNCTION)
--               .planning/phases/02-rls-rewrite-ownership-based-access-control/02-CONTEXT.md (D-31/D-32/D-33)
-- Predecessor: 20260722120000_add_parents_and_child_profiles.sql (Phase 1 — creates
--              parents/child_profiles, backfills the 15-parented/5-null split)
-- Rollback:    20260801120000_rls_ownership_rewrite.down.sql
-- NOTE: this migration issues ZERO policy-removal statements against any legacy policy.
--       Every downstream _parent_owner predicate uses the FUNCTION shape
--       (`IN (SELECT public.owned_child_ids())`), per 02-inlining-verdict.md's
--       VERDICT=FUNCTION (plan-structure evidence: owned_child_ids() folds into
--       a one-time ProjectSet/HashAggregate, loops=1, not re-evaluated per row).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. owned_child_ids() — the ownership helper (RLS-01)
--    SECURITY INVOKER (deliberate deviation from a naive SECURITY DEFINER —
--    RLS-H1: DEFINER blocks planner inlining, the RLS-05 perf-cliff anti-pattern).
--    Downstream-only: NEVER call from child_profiles' own policies (RLS-H2).
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

-- -----------------------------------------------------------------------------
-- 2. child_profiles — its own two TERMINAL policies (Group C, additive from
--    zero — table is deny-all today per Phase 1 D-16). Bare column equality /
--    direct EXISTS only — NEVER owned_child_ids() (RLS-H2, else 42P17 recursion).
-- -----------------------------------------------------------------------------
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

-- =============================================================================
-- Downstream _parent_owner sibling policies begin here (Task 2 / Task 3).
-- Every policy below uses `<id_col> IN (SELECT public.owned_child_ids())` —
-- never a correlated EXISTS (Pitfall 4) — and additive-only (never removes a policy).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3. Group A — 16 tables with an existing child_profiles(id) FK (non-gated)
--    (student_skill_progress / students_score are the two GATED Group A
--    tables — handled separately in section 5, Pitfall 5 reviewed sub-task)
-- -----------------------------------------------------------------------------

-- 3.1 assignment_submissions (id_col=student_id, ALL)
CREATE POLICY "assignment_submissions_all_parent_owner"
  ON public.assignment_submissions
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

-- 3.2 feedback_submissions (id_col=student_id, INSERT only)
CREATE POLICY "feedback_submissions_insert_parent_owner"
  ON public.feedback_submissions
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

-- 3.3 instrument_practice_logs (id_col=student_id, INSERT+SELECT)
CREATE POLICY "instrument_practice_logs_insert_parent_owner"
  ON public.instrument_practice_logs
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "instrument_practice_logs_select_parent_owner"
  ON public.instrument_practice_logs
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

-- 3.4 instrument_practice_streak (id_col=student_id, ALL)
CREATE POLICY "instrument_practice_streak_all_parent_owner"
  ON public.instrument_practice_streak
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

-- 3.5 notifications (id_col=recipient_id — recipient branch ONLY, sender_id
--     is untouched by this migration)
CREATE POLICY "notifications_all_parent_owner"
  ON public.notifications
  FOR ALL
  USING (recipient_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (recipient_id IN (SELECT public.owned_child_ids()));

-- 3.6 parental_consent_log (id_col=student_id, INSERT+SELECT — skip
--     "...select_teacher", D-30 shape untouched)
CREATE POLICY "parental_consent_log_insert_parent_owner"
  ON public.parental_consent_log
  FOR INSERT
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

CREATE POLICY "parental_consent_log_select_parent_owner"
  ON public.parental_consent_log
  FOR SELECT
  USING (student_id IN (SELECT public.owned_child_ids()));

-- 3.7 parental_consent_tokens (id_col=student_id, INSERT+SELECT+UPDATE —
--     skip "...select_anon" (`USING (true)`, unrelated). Pitfall 1: the live
--     "...update_own" has with_check:null — this sibling MUST NOT reproduce
--     that gap, both USING and WITH CHECK are explicit below.)
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

-- 3.8 push_subscriptions (id_col=student_id, DELETE+INSERT+SELECT+UPDATE —
--     4 siblings, all 4 commands already correctly split on the legacy side)
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

-- 3.9 rate_limits (id_col=student_id, INSERT+SELECT+UPDATE)
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

-- 3.10 student_daily_challenges (id_col=student_id, ALL)
CREATE POLICY "student_daily_challenges_all_parent_owner"
  ON public.student_daily_challenges
  FOR ALL
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

-- 3.11 student_daily_goals (id_col=student_id, INSERT+SELECT+UPDATE)
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

-- 3.12 student_point_transactions (id_col=student_id, INSERT+SELECT ONLY —
--     the other 6 policies on this table are pure admin/service-role gates,
--     untouched. Preserve each policy's own business-rule clause verbatim,
--     extend only the ownership half; do NOT invent UPDATE/DELETE siblings.)
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

-- 3.13 student_unit_progress (id_col=student_id, DELETE+INSERT+SELECT+UPDATE
--     — skip select_teacher, D-30 shape untouched)
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

-- 3.14 user_accessories (id_col=user_id, ALL — skip "Admin can manage...",
--     service_role/is_admin only, untouched)
CREATE POLICY "user_accessories_all_parent_owner"
  ON public.user_accessories
  FOR ALL
  USING (user_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (user_id IN (SELECT public.owned_child_ids()));

-- (student_skill_progress + students_score — the 2 GATED Group A tables —
--  are handled in section 5 below, Pitfall 5 reviewed sub-task)

-- -----------------------------------------------------------------------------
-- 4. Group B — 7 tables whose FK points at auth.users, not students/
--    child_profiles (D-33: FK-target gap documented, NOT fixed here — RLS-only
--    phase boundary. Predicate works correctly via UUID-reuse regardless.)
--    All FOR ALL, id_col=student_id. Teacher/service_role branches on the
--    legacy consolidated policies are untouched.
-- -----------------------------------------------------------------------------

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

-- skip "Teachers can view connected students achievements" (D-30 shape)
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

-- -----------------------------------------------------------------------------
-- 5. Edge cases (owner-resolved D-31/D-32)
-- -----------------------------------------------------------------------------

-- 5.1 user_preferences (D-31: CHILD-scoped). id_col CORRECTED to `user_id`
--     (live schema has no student_id column — 02-policy-inventory.md "Second
--     correction"). Standard SELECT/INSERT/UPDATE triplet, sibling alongside
--     the legacy `auth.uid() = user_id` policies.
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

-- 5.2 accessories (D-32: IN scope). Catalog table — NO student_id/user_id
--     column, so the standard id_col template does not apply. ADD a new
--     SELECT sibling whose USING is an OR-EXISTS(child_profiles) branch,
--     additive alongside the existing "accessories_select_consolidated"
--     EXISTS(students) policy (same shape, read-only).
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

-- 5.3 assignments (D-32: IN scope). "Looks-fixed-but-isn't" trap: the live
--     "Users can access assignments" policy embeds a CORRELATED literal
--     `class_id IN (SELECT class_id FROM class_enrollments WHERE student_id =
--     (select auth.uid()) AND status = 'active')` — fixing class_enrollments'
--     own policy does NOT propagate here. This is a separate, explicit sibling
--     rewriting that embedded predicate to the owned_child_ids() form, using
--     the REAL join column (class_id, confirmed against
--     20250708191932_fix_multiple_permissive_policies.sql — NOT
--     assignment_id, which does not exist on class_enrollments).
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

-- -----------------------------------------------------------------------------
-- 6. Business-logic-gated policies (Pitfall 5) — student_skill_progress +
--    students_score. Preserve the business rule VERBATIM; extend only the
--    ownership half. Reviewed sub-task, not part of the mechanical batch.
-- -----------------------------------------------------------------------------

-- 6.1 student_skill_progress (id_col=student_id) — DELETE+SELECT ungated;
--     INSERT+UPDATE GATED (is_free_node/has_active_subscription preserved
--     verbatim, Pitfall 5).
CREATE POLICY "student_skill_progress_delete_parent_owner"
  ON public.student_skill_progress
  FOR DELETE
  USING (student_id IN (SELECT public.owned_child_ids()));

-- Pitfall 5: business rule preserved verbatim
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

-- Pitfall 5: business rule preserved verbatim
CREATE POLICY "student_skill_progress_update_parent_owner"
  ON public.student_skill_progress
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (
    student_id IN (SELECT public.owned_child_ids())
    AND (is_free_node(node_id) OR has_active_subscription((SELECT auth.uid())))
  );

-- 6.2 students_score (id_col=student_id) — DELETE+SELECT+UPDATE ungated
--     (live students_score_update has NO subscription re-gate, per
--     20260707120000_add_students_score_update_policy.sql: "the row already
--     passed the insert gate when it was created, and retries must work for
--     all users" — preserved verbatim, only INSERT is gated); INSERT GATED.
CREATE POLICY "students_score_delete_parent_owner"
  ON public.students_score
  FOR DELETE
  USING (student_id IN (SELECT public.owned_child_ids()));

-- Pitfall 5: business rule preserved verbatim
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

-- Pitfall 5: business rule preserved verbatim (UPDATE has no subscription
-- re-gate on the live table — ownership-only, matching the reasoning in
-- 20260707120000_add_students_score_update_policy.sql)
CREATE POLICY "students_score_update_parent_owner"
  ON public.students_score
  FOR UPDATE
  USING (student_id IN (SELECT public.owned_child_ids()))
  WITH CHECK (student_id IN (SELECT public.owned_child_ids()));

-- -----------------------------------------------------------------------------
-- 7. D-23 function re-points — award_xp + check_rate_limit (SECURITY DEFINER,
--    bypass RLS internally, so ownership must be checked explicitly in the
--    body). Full existing bodies re-emitted verbatim via CREATE OR REPLACE
--    FUNCTION, changing ONLY the identity block. teacher_get_student_points,
--    teacher_link_student, promote_placeholder_student are CONFIRMED
--    NO-CHANGE per D-23 resolution — not touched here.
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
  -- Authorization check: user must be authenticated and own the target child
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_student_id NOT IN (SELECT public.owned_child_ids()) THEN
    RAISE EXCEPTION 'Unauthorized: You can only award XP to a child you own';
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

COMMENT ON FUNCTION award_xp IS
  'Awards XP to a student and automatically calculates level progression. Security: caller must own the target child (p_student_id IN owned_child_ids()), D-23 re-point from the original auth.uid()=p_student_id self-only check.';

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_student_id UUID,
  p_node_id TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 300 -- 5 minutes
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
  -- =============================================
  -- Authorization Check: caller must own the target child (D-23 re-point)
  -- =============================================
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Not authenticated';
  END IF;

  IF p_student_id NOT IN (SELECT public.owned_child_ids()) THEN
    RAISE EXCEPTION 'Unauthorized: You can only check rate limit for a child you own';
  END IF;

  -- =============================================
  -- Advisory Lock: Prevent race conditions
  -- Lock is released at end of transaction
  -- =============================================
  PERFORM pg_advisory_xact_lock(hashtext(p_student_id::text || p_node_id));

  -- =============================================
  -- Get current token count and calculate elapsed time
  -- =============================================
  SELECT tokens, EXTRACT(EPOCH FROM (NOW() - last_refill))
  INTO v_tokens, v_elapsed_seconds
  FROM rate_limits
  WHERE student_id = p_student_id AND node_id = p_node_id;

  -- =============================================
  -- Case 1: First submission - create record with max-1 tokens
  -- =============================================
  IF NOT FOUND THEN
    INSERT INTO rate_limits (student_id, node_id, tokens, last_refill)
    VALUES (p_student_id, p_node_id, p_max_requests - 1, NOW());
    RETURN TRUE;
  END IF;

  -- =============================================
  -- Case 2: Window expired - reset tokens (fixed window)
  -- =============================================
  IF v_elapsed_seconds >= p_window_seconds THEN
    UPDATE rate_limits
    SET tokens = p_max_requests - 1, last_refill = NOW()
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  END IF;

  -- =============================================
  -- Case 3: Window active, tokens available - consume one
  -- =============================================
  IF v_tokens > 0 THEN
    UPDATE rate_limits
    SET tokens = tokens - 1
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  END IF;

  -- =============================================
  -- Case 4: Rate limited - no tokens left
  -- =============================================
  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.check_rate_limit IS 'Fixed window rate limiter: 10 requests per 5 minutes per student per node. Returns TRUE if request allowed, FALSE if rate limited. Uses advisory lock to prevent race conditions. Security: caller must own the target child (p_student_id IN owned_child_ids()), D-23 re-point from the original auth.uid()=p_student_id self-only check.';

-- teacher_get_student_points, teacher_link_student, promote_placeholder_student
-- are CONFIRMED NO-CHANGE per D-23 resolution (02-RESEARCH.md "D-23 Function
-- Scoping") — not re-created in this migration.

-- =============================================================================
-- Summary:
-- - owned_child_ids(): 1 new SECURITY INVOKER SQL STABLE helper function
-- - child_profiles: 2 new terminal policies (parent-owner ALL, teacher SELECT)
-- - Group A (16 tables, 37 siblings): assignment_submissions, feedback_submissions,
--   instrument_practice_logs, instrument_practice_streak, notifications,
--   parental_consent_log, parental_consent_tokens, push_subscriptions,
--   rate_limits, student_daily_challenges, student_daily_goals,
--   student_point_transactions, student_skill_progress (2 gated),
--   student_unit_progress, students_score (1 gated), user_accessories
-- - Group B (7 tables, 7 siblings, D-33 FK-target gap documented not fixed):
--   class_enrollments, current_streak, highest_streak, last_practiced_date,
--   practice_sessions, student_achievements, student_profiles
-- - Edge cases: user_preferences (3 new triplet siblings, D-31), accessories
--   (1 new OR-EXISTS sibling, D-32), assignments (1 new rewritten-predicate
--   sibling, D-32)
-- - Functions re-pointed to ownership check (D-23): award_xp, check_rate_limit
-- - Zero legacy policies dropped or altered — fully additive, dual-policy
-- Total: 1 helper function + 51 new policies (2 Group C + 37 Group A + 7 Group B
--   + 5 edge cases) + 2 function re-points
-- =============================================================================

COMMIT;
