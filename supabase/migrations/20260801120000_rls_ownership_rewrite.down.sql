-- =============================================================================
-- Down-migration:  20260801120000_rls_ownership_rewrite.down.sql
-- Reverses 20260801120000_rls_ownership_rewrite.sql in reverse object order.
-- Drops ONLY the _parent_owner policies + owned_child_ids() this migration
-- added. Legacy `student_id = auth.uid()` policies are untouched (never
-- touched by Phase 2 — those are Phase 8's contract step).
-- award_xp/check_rate_limit revert to the pre-Phase-2 auth.uid()=p_student_id
-- identity check (full pre-Phase-2 body restored via CREATE OR REPLACE
-- FUNCTION).
-- Idempotent (IF EXISTS everywhere) for the apply-rollback-re-apply rehearsal.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Revert award_xp + check_rate_limit to their pre-Phase-2 bodies
-- (auth.uid() != p_student_id self-only check).
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

COMMENT ON FUNCTION award_xp IS
  'Awards XP to a student and automatically calculates level progression. Security: Users can only award XP to themselves (auth.uid() must equal p_student_id).';

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
  -- Authorization Check: User can only check their own rate limit
  -- =============================================
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Not authenticated';
  END IF;

  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot check rate limit for another user';
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

COMMENT ON FUNCTION public.check_rate_limit IS 'Fixed window rate limiter: 10 requests per 5 minutes per student per node. Returns TRUE if request allowed, FALSE if rate limited. Uses advisory lock to prevent race conditions.';

-- -----------------------------------------------------------------------------
-- Gated tables (reverse order): students_score, student_skill_progress
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "students_score_update_parent_owner" ON public.students_score;
DROP POLICY IF EXISTS "students_score_select_parent_owner" ON public.students_score;
DROP POLICY IF EXISTS "students_score_insert_parent_owner" ON public.students_score;
DROP POLICY IF EXISTS "students_score_delete_parent_owner" ON public.students_score;

DROP POLICY IF EXISTS "student_skill_progress_update_parent_owner" ON public.student_skill_progress;
DROP POLICY IF EXISTS "student_skill_progress_select_parent_owner" ON public.student_skill_progress;
DROP POLICY IF EXISTS "student_skill_progress_insert_parent_owner" ON public.student_skill_progress;
DROP POLICY IF EXISTS "student_skill_progress_delete_parent_owner" ON public.student_skill_progress;

-- -----------------------------------------------------------------------------
-- Edge cases (reverse order): assignments, accessories, user_preferences
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "assignments_select_parent_owner" ON public.assignments;
DROP POLICY IF EXISTS "accessories_select_parent_owner" ON public.accessories;
DROP POLICY IF EXISTS "user_preferences_update_parent_owner" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_insert_parent_owner" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_select_parent_owner" ON public.user_preferences;

-- -----------------------------------------------------------------------------
-- Group B (reverse order)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "student_profiles_all_parent_owner" ON public.student_profiles;
DROP POLICY IF EXISTS "student_achievements_all_parent_owner" ON public.student_achievements;
DROP POLICY IF EXISTS "practice_sessions_all_parent_owner" ON public.practice_sessions;
DROP POLICY IF EXISTS "last_practiced_date_all_parent_owner" ON public.last_practiced_date;
DROP POLICY IF EXISTS "highest_streak_all_parent_owner" ON public.highest_streak;
DROP POLICY IF EXISTS "current_streak_all_parent_owner" ON public.current_streak;
DROP POLICY IF EXISTS "class_enrollments_all_parent_owner" ON public.class_enrollments;

-- -----------------------------------------------------------------------------
-- Group A non-gated (reverse order)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- child_profiles' own two terminal policies (Group C)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "child_profiles_select_teacher" ON public.child_profiles;
DROP POLICY IF EXISTS "child_profiles_all_parent_owner" ON public.child_profiles;

-- -----------------------------------------------------------------------------
-- The ownership helper itself
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.owned_child_ids();

COMMIT;

-- =============================================================================
-- End of down-migration. Legacy student_id = auth.uid() policies are
-- untouched throughout. Re-run 20260801120000_rls_ownership_rewrite.sql to
-- re-apply.
-- =============================================================================
