-- ============================================================================
-- Migration: Optimize RLS Auth Function Calls (Phase 1)
-- Date: 2026-01-27
-- Description: Wraps auth.uid() and auth.role() calls with (SELECT ...) to
--              evaluate once per query instead of per row, improving performance.
-- ============================================================================

BEGIN;

-- ============================================
-- 1. USER_PREFERENCES TABLE (3 policies)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

-- Recreate with optimized auth calls
CREATE POLICY "Users can read own preferences"
  ON public.user_preferences
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================
-- 2. STUDENTS TABLE (5 policies to optimize)
-- ============================================

-- Drop existing policies that need optimization
DROP POLICY IF EXISTS "Service role can manage students" ON public.students;
DROP POLICY IF EXISTS "Students can manage own profile" ON public.students;
DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
DROP POLICY IF EXISTS "Students can insert their own profile" ON public.students;
DROP POLICY IF EXISTS "Teachers can create student records" ON public.students;
DROP POLICY IF EXISTS "Teachers can view connected students" ON public.students;
DROP POLICY IF EXISTS "Teachers can update connected students" ON public.students;
DROP POLICY IF EXISTS "Teachers can search students by email" ON public.students;

-- Service role policy with optimized auth call
CREATE POLICY "Service role can manage students"
  ON public.students
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- Students can manage own profile with optimized auth call
CREATE POLICY "Students can view their own profile"
  ON public.students
  FOR SELECT
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Students can update their own profile"
  ON public.students
  FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Students can insert their own profile"
  ON public.students
  FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

-- Teachers can create student records with optimized auth call
CREATE POLICY "Teachers can create student records"
  ON public.students
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- Teachers can view connected students with optimized auth call
CREATE POLICY "Teachers can view connected students"
  ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.student_id = students.id
        AND tsc.teacher_id = (SELECT auth.uid())
        AND tsc.status = 'accepted'
    )
  );

-- Teachers can update connected students with optimized auth call
CREATE POLICY "Teachers can update connected students"
  ON public.students
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.student_id = students.id
        AND tsc.teacher_id = (SELECT auth.uid())
        AND tsc.status = 'accepted'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.student_id = students.id
        AND tsc.teacher_id = (SELECT auth.uid())
        AND tsc.status = 'accepted'
    )
  );

-- Teachers can search students by email with optimized auth call
CREATE POLICY "Teachers can search students by email"
  ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- ============================================
-- 3. STUDENT_SKILL_PROGRESS TABLE (4 policies)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "student_skill_progress_select_own" ON public.student_skill_progress;
DROP POLICY IF EXISTS "student_skill_progress_insert_own" ON public.student_skill_progress;
DROP POLICY IF EXISTS "student_skill_progress_update_own" ON public.student_skill_progress;
DROP POLICY IF EXISTS "student_skill_progress_select_teacher" ON public.student_skill_progress;

-- Recreate with optimized auth calls
CREATE POLICY "student_skill_progress_select_own"
  ON public.student_skill_progress
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

CREATE POLICY "student_skill_progress_insert_own"
  ON public.student_skill_progress
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY "student_skill_progress_update_own"
  ON public.student_skill_progress
  FOR UPDATE
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY "student_skill_progress_select_teacher"
  ON public.student_skill_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.student_id = student_skill_progress.student_id
        AND tsc.teacher_id = (SELECT auth.uid())
        AND tsc.status = 'accepted'
    )
  );

-- ============================================
-- 4. STUDENT_DAILY_GOALS TABLE (4 policies)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "student_daily_goals_select_own" ON public.student_daily_goals;
DROP POLICY IF EXISTS "student_daily_goals_insert_own" ON public.student_daily_goals;
DROP POLICY IF EXISTS "student_daily_goals_update_own" ON public.student_daily_goals;
DROP POLICY IF EXISTS "student_daily_goals_select_teacher" ON public.student_daily_goals;

-- Recreate with optimized auth calls
CREATE POLICY "student_daily_goals_select_own"
  ON public.student_daily_goals
  FOR SELECT
  USING (student_id = (SELECT auth.uid()));

CREATE POLICY "student_daily_goals_insert_own"
  ON public.student_daily_goals
  FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY "student_daily_goals_update_own"
  ON public.student_daily_goals
  FOR UPDATE
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY "student_daily_goals_select_teacher"
  ON public.student_daily_goals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.student_id = student_daily_goals.student_id
        AND tsc.teacher_id = (SELECT auth.uid())
        AND tsc.status = 'accepted'
    )
  );

COMMIT;

-- Summary:
-- - user_preferences: 3 policies optimized
-- - students: 8 policies recreated with optimization (includes combined select policies)
-- - student_skill_progress: 4 policies optimized
-- - student_daily_goals: 4 policies optimized
-- Total: 19 policies optimized for auth function call performance
