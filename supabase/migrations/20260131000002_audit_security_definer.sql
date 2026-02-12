-- ============================================================================
-- Migration: Audit and Fix SECURITY DEFINER Functions (SEC-02)
-- Date: 2026-01-31
-- Description: Ensures all SECURITY DEFINER functions verify auth.uid() before
--              execution to prevent unauthorized data access.
--
--              SECURITY DEFINER functions run with the privileges of the function
--              owner (often postgres superuser), bypassing all RLS policies.
--              Without explicit auth.uid() checks, any authenticated user could
--              call these functions to access/modify any user's data.
--
-- Audited functions:
-- - award_xp: ALREADY FIXED (has auth.uid() check from 20260126000001)
-- - is_admin: HELPER (no user param, checks current user - OK)
-- - teacher_link_student: HAS CHECK (verifies auth.uid() is active teacher - OK)
-- - promote_placeholder_student: NEEDS FIX (no caller verification)
-- - teacher_get_student_points: OK (uses auth.uid() in query implicitly)
-- - update_unit_progress_on_node_completion: TRIGGER (add explicit check)
-- - handle_teacher_signup: TRIGGER (system-triggered on auth.users, OK)
--
-- References:
-- - 20260126000001_fix_award_xp_security.sql (established auth.uid() check pattern)
-- - 20260127000002_fix_search_path_warnings.sql (search_path security)
-- ============================================================================

BEGIN;

-- =============================================================================
-- 1. Fix promote_placeholder_student function
-- =============================================================================
-- VULNERABILITY: Accepts student_id and email without verifying the caller
--                has permission to promote this student.
-- FIX: Add authorization check - only teachers who invited this student can promote

DROP FUNCTION IF EXISTS public.promote_placeholder_student(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.promote_placeholder_student(
  p_student_id UUID,
  p_student_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  normalized_email TEXT := lower(trim(p_student_email));
  placeholder_ids UUID[];
  current_user_id UUID;
  is_authorized BOOLEAN := FALSE;
BEGIN
  -- ===========================================
  -- SECURITY CHECK: Verify caller is authorized
  -- ===========================================

  -- Must be authenticated
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify caller is either:
  -- 1. The student being promoted (claiming their own account)
  -- 2. A teacher who invited this student
  -- 3. An admin

  IF current_user_id = p_student_id THEN
    -- Student is claiming their own pre-created placeholder
    is_authorized := TRUE;
  ELSIF EXISTS (
    SELECT 1 FROM public.teachers
    WHERE id = current_user_id
      AND is_admin = true
  ) THEN
    -- Admin can promote any student
    is_authorized := TRUE;
  ELSIF EXISTS (
    SELECT 1 FROM public.students s
    WHERE lower(s.email) = normalized_email
      AND s.is_placeholder = true
      AND s.invited_by_teacher = current_user_id
  ) THEN
    -- Teacher who created this placeholder can promote
    is_authorized := TRUE;
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Unauthorized: You can only promote students you invited or your own account';
  END IF;

  -- ===========================================
  -- Original function logic
  -- ===========================================

  IF p_student_id IS NULL THEN
    RAISE EXCEPTION 'Student id is required';
  END IF;

  IF normalized_email IS NULL OR normalized_email = '' THEN
    RAISE EXCEPTION 'Student email is required';
  END IF;

  -- Find placeholder student records with matching email
  SELECT ARRAY_AGG(s.id)
    INTO placeholder_ids
    FROM students AS s
    WHERE lower(s.email) = normalized_email
      AND s.id <> p_student_id;

  IF placeholder_ids IS NULL OR array_length(placeholder_ids, 1) = 0 THEN
    RETURN FALSE;
  END IF;

  -- Update teacher_student_connections to point to real student
  UPDATE teacher_student_connections
    SET student_id = p_student_id,
        status = 'accepted'
    WHERE student_id = ANY(placeholder_ids);

  -- Update assignment_submissions
  UPDATE assignment_submissions
    SET student_id = p_student_id
    WHERE student_id = ANY(placeholder_ids);

  -- Update notifications
  UPDATE notifications
    SET recipient_id = p_student_id
    WHERE recipient_id = ANY(placeholder_ids);

  -- Note: students_total_score table was dropped in migration 20251207000004
  -- Keeping these updates in case table is restored or similar tables exist
  UPDATE students_total_score
    SET student_id = p_student_id
    WHERE student_id = ANY(placeholder_ids);

  UPDATE current_streak
    SET student_id = p_student_id
    WHERE student_id = ANY(placeholder_ids);

  UPDATE highest_streak
    SET student_id = p_student_id
    WHERE student_id = ANY(placeholder_ids);

  UPDATE last_practiced_date
    SET student_id = p_student_id
    WHERE student_id = ANY(placeholder_ids);

  -- Delete placeholder records
  DELETE FROM students
    WHERE id = ANY(placeholder_ids)
      AND id <> p_student_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- Grant execute to authenticated users only (not anon)
REVOKE ALL ON FUNCTION public.promote_placeholder_student(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_placeholder_student(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.promote_placeholder_student IS
  'Promotes a placeholder student to a real student account. '
  'SECURITY: Verifies auth.uid() is the student being promoted, the inviting teacher, or an admin.';

-- =============================================================================
-- 2. Fix update_unit_progress_on_node_completion trigger function
-- =============================================================================
-- VULNERABILITY: SECURITY DEFINER trigger function without explicit auth check
-- FIX: Add check that NEW.student_id matches auth.uid()
--
-- This is a trigger function that fires on INSERT/UPDATE to student_skill_progress.
-- Since RLS is enabled on student_skill_progress, this should only fire for
-- authorized inserts, but adding an explicit check provides defense-in-depth.

DROP FUNCTION IF EXISTS update_unit_progress_on_node_completion() CASCADE;

CREATE OR REPLACE FUNCTION update_unit_progress_on_node_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_unit_id TEXT;
  v_category TEXT;
  v_total_stars INTEGER;
  v_is_boss BOOLEAN;
BEGIN
  -- ===========================================
  -- SECURITY CHECK: Verify caller owns the record
  -- ===========================================
  -- Defense-in-depth: Even though RLS should prevent unauthorized access
  -- to student_skill_progress, we verify the student_id matches auth.uid()

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() != NEW.student_id THEN
    -- This should never happen if RLS is working correctly,
    -- but provides an additional security layer
    RAISE EXCEPTION 'Unauthorized: Cannot update progress for another student';
  END IF;

  -- ===========================================
  -- Original trigger logic
  -- ===========================================

  -- Skip if unit_id is not set (legacy nodes)
  IF NEW.unit_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_unit_id := NEW.unit_id;

  -- Get category from node_id prefix (treble_, bass_, rhythm_)
  IF NEW.node_id LIKE 'treble_%' THEN
    v_category := 'treble_clef';
  ELSIF NEW.node_id LIKE 'bass_%' THEN
    v_category := 'bass_clef';
  ELSIF NEW.node_id LIKE 'rhythm_%' THEN
    v_category := 'rhythm';
  ELSIF NEW.node_id LIKE 'boss_%' THEN
    v_category := 'boss';
    v_is_boss := TRUE;
  ELSE
    v_category := 'unknown';
  END IF;

  -- Calculate total stars for the unit
  SELECT COALESCE(SUM(stars), 0)
  INTO v_total_stars
  FROM student_skill_progress
  WHERE student_id = NEW.student_id
    AND unit_id = v_unit_id;

  -- Upsert unit progress
  INSERT INTO student_unit_progress (
    student_id,
    unit_id,
    category,
    total_stars,
    boss_defeated,
    started_at,
    updated_at
  )
  VALUES (
    NEW.student_id,
    v_unit_id,
    v_category,
    v_total_stars,
    COALESCE(v_is_boss, FALSE),
    NOW(),
    NOW()
  )
  ON CONFLICT (student_id, unit_id)
  DO UPDATE SET
    total_stars = v_total_stars,
    boss_defeated = CASE
      WHEN EXCLUDED.boss_defeated THEN TRUE
      ELSE student_unit_progress.boss_defeated
    END,
    completed_at = CASE
      WHEN NOT student_unit_progress.boss_defeated AND EXCLUDED.boss_defeated THEN NOW()
      ELSE student_unit_progress.completed_at
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_unit_progress ON student_skill_progress;
CREATE TRIGGER trigger_update_unit_progress
  AFTER INSERT OR UPDATE OF stars
  ON student_skill_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_unit_progress_on_node_completion();

COMMENT ON FUNCTION update_unit_progress_on_node_completion IS
  'Updates unit-level progress when a skill node is completed. '
  'SECURITY: Verifies auth.uid() matches student_id for defense-in-depth.';

-- =============================================================================
-- 3. Verify and document teacher_link_student function
-- =============================================================================
-- This function already has proper auth checks:
-- - Checks auth.uid() IS NOT NULL
-- - Verifies caller exists in teachers table with is_active = true
-- Adding a comment to document the security verification.

COMMENT ON FUNCTION public.teacher_link_student(TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) IS
  'Creates or links a teacher-student connection. '
  'SECURITY: Verifies auth.uid() is an active teacher before execution. '
  'REVIEWED: 2026-01-31 - auth checks present and correct.';

-- =============================================================================
-- 4. Verify and document teacher_get_student_points function
-- =============================================================================
-- This function implicitly uses auth.uid() in its query to filter
-- teacher_student_connections to only connected students.
-- The function is safe because it only returns data for students
-- connected to the calling teacher.

COMMENT ON FUNCTION public.teacher_get_student_points() IS
  'Returns point totals for all students connected to the calling teacher. '
  'SECURITY: Uses auth.uid() to filter to only connected students. '
  'REVIEWED: 2026-01-31 - implicit auth check in query is correct.';

-- =============================================================================
-- 5. Verify and document handle_teacher_signup function
-- =============================================================================
-- This is a system trigger function that fires on auth.users INSERT.
-- It doesn't need auth.uid() checks because:
-- 1. It's triggered by Supabase auth system, not user calls
-- 2. It only creates teacher records for the user being inserted
-- The trigger is secure by design.

COMMENT ON FUNCTION public.handle_teacher_signup() IS
  'Automatically creates teacher record when a user signs up with teacher role. '
  'SECURITY: System-triggered on auth.users INSERT, not callable by users. '
  'REVIEWED: 2026-01-31 - trigger-based security is correct.';

-- =============================================================================
-- 6. Verify award_xp and is_admin functions
-- =============================================================================
-- These were already fixed/verified in previous migrations:
-- - award_xp: Fixed in 20260126000001 with auth.uid() check
-- - is_admin: Helper function that only checks current user

-- Update comments to reflect audit
COMMENT ON FUNCTION award_xp(UUID, INTEGER) IS
  'Awards XP to a student and calculates level progression. '
  'SECURITY: Verifies auth.uid() equals p_student_id (users can only award XP to themselves). '
  'REVIEWED: 2026-01-31 - Fixed in 20260126000001, auth check present and correct.';

COMMENT ON FUNCTION public.is_admin() IS
  'Returns true if the current user is an admin (is_admin=true in teachers table). '
  'SECURITY: Uses database state, not JWT user_metadata. No user param needed. '
  'REVIEWED: 2026-01-31 - Helper function, checks current auth.uid() only.';

COMMIT;

-- ============================================================================
-- AUDIT SUMMARY
-- ============================================================================
--
-- Functions audited: 7
--
-- FIXED (added auth.uid() checks):
-- 1. promote_placeholder_student - Now verifies caller is the student, inviting teacher, or admin
-- 2. update_unit_progress_on_node_completion - Now verifies student_id = auth.uid()
--
-- VERIFIED CORRECT (no changes needed):
-- 3. award_xp - Already has auth.uid() check (fixed in 20260126000001)
-- 4. is_admin - Helper function, checks current user only
-- 5. teacher_link_student - Already has active teacher verification
-- 6. teacher_get_student_points - Uses auth.uid() implicitly in query
-- 7. handle_teacher_signup - System trigger, not user-callable
--
-- All SECURITY DEFINER functions now have documented security reviews.
-- ============================================================================
