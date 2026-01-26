-- ============================================================================
-- Migration: Consolidate Multiple Permissive Policies (Phase 2)
-- Date: 2026-01-28
-- Description: Consolidates multiple permissive policies into single policies
--              with OR logic to reduce policy evaluation overhead.
-- ============================================================================

BEGIN;

-- ============================================
-- 1. STUDENT_SKILL_PROGRESS - Consolidate SELECT policies
-- ============================================

-- Drop individual SELECT policies (created in Phase 1)
DROP POLICY IF EXISTS "student_skill_progress_select_own" ON public.student_skill_progress;
DROP POLICY IF EXISTS "student_skill_progress_select_teacher" ON public.student_skill_progress;

-- Create consolidated SELECT policy with OR logic
CREATE POLICY "student_skill_progress_select_consolidated"
  ON public.student_skill_progress
  FOR SELECT
  USING (
    -- Student can view own progress
    student_id = (SELECT auth.uid())
    OR
    -- Teacher can view connected student's progress
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.student_id = student_skill_progress.student_id
        AND tsc.teacher_id = (SELECT auth.uid())
        AND tsc.status = 'accepted'
    )
  );

-- ============================================
-- 2. STUDENT_DAILY_GOALS - Consolidate SELECT policies
-- ============================================

-- Drop individual SELECT policies (created in Phase 1)
DROP POLICY IF EXISTS "student_daily_goals_select_own" ON public.student_daily_goals;
DROP POLICY IF EXISTS "student_daily_goals_select_teacher" ON public.student_daily_goals;

-- Create consolidated SELECT policy with OR logic
CREATE POLICY "student_daily_goals_select_consolidated"
  ON public.student_daily_goals
  FOR SELECT
  USING (
    -- Student can view own goals
    student_id = (SELECT auth.uid())
    OR
    -- Teacher can view connected student's goals
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.student_id = student_daily_goals.student_id
        AND tsc.teacher_id = (SELECT auth.uid())
        AND tsc.status = 'accepted'
    )
  );

-- ============================================
-- 3. USER_ACCESSORIES - Consolidate policies
-- ============================================

-- Drop individual policies
DROP POLICY IF EXISTS "Students can manage own accessories" ON public.user_accessories;
DROP POLICY IF EXISTS "Admin can manage user accessories" ON public.user_accessories;

-- Create consolidated policy for all operations
CREATE POLICY "user_accessories_all_consolidated"
  ON public.user_accessories
  FOR ALL
  TO authenticated
  USING (
    -- User owns this accessory record
    user_id = (SELECT auth.uid())
    OR
    -- Admin/service role
    (SELECT auth.role()) = 'service_role'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    -- User owns this accessory record
    user_id = (SELECT auth.uid())
    OR
    -- Admin/service role
    (SELECT auth.role()) = 'service_role'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ============================================
-- 4. ACCESSORIES - Consolidate SELECT policies
-- ============================================

-- Drop individual SELECT policies
DROP POLICY IF EXISTS "Students can read accessories" ON public.accessories;
DROP POLICY IF EXISTS "Admin can manage accessories" ON public.accessories;

-- Create consolidated SELECT policy
CREATE POLICY "accessories_select_consolidated"
  ON public.accessories
  FOR SELECT
  TO authenticated
  USING (
    -- Any student can read the catalog
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = (SELECT auth.uid())
    )
    OR
    -- Service role
    (SELECT auth.role()) = 'service_role'
    OR
    -- Admin user
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Admin-only write operations for accessories (separate policy for INSERT/UPDATE/DELETE)
CREATE POLICY "accessories_admin_manage"
  ON public.accessories
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.role()) = 'service_role'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ============================================
-- 5. STUDENT_POINT_TRANSACTIONS - Consolidate SELECT policies
-- ============================================

-- Drop individual SELECT policies
DROP POLICY IF EXISTS "Students can read own point transactions" ON public.student_point_transactions;
DROP POLICY IF EXISTS "Teachers can read connected students point transactions" ON public.student_point_transactions;
DROP POLICY IF EXISTS "Admin can read point transactions" ON public.student_point_transactions;

-- Create consolidated SELECT policy
CREATE POLICY "student_point_transactions_select_consolidated"
  ON public.student_point_transactions
  FOR SELECT
  TO authenticated
  USING (
    -- Student can view own transactions
    student_id = (SELECT auth.uid())
    OR
    -- Teacher can view connected student's transactions
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.teacher_id = (SELECT auth.uid())
        AND tsc.student_id = student_point_transactions.student_id
        AND tsc.status = 'accepted'
    )
    OR
    -- Admin/service role
    (SELECT auth.role()) = 'service_role'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Note: INSERT policies for student spending and admin are kept separate
-- because they have different WITH CHECK conditions

-- ============================================
-- 6. STUDENTS TABLE - Consolidate SELECT policies
-- ============================================

-- Drop individual SELECT policies (created in Phase 1)
DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
DROP POLICY IF EXISTS "Teachers can view connected students" ON public.students;
DROP POLICY IF EXISTS "Teachers can search students by email" ON public.students;

-- Create consolidated SELECT policy
CREATE POLICY "students_select_consolidated"
  ON public.students
  FOR SELECT
  USING (
    -- Student views own profile
    id = (SELECT auth.uid())
    OR
    -- Teacher can view connected students
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.student_id = students.id
        AND tsc.teacher_id = (SELECT auth.uid())
        AND tsc.status = 'accepted'
    )
    OR
    -- Teacher can search any student (for adding to classes)
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
    OR
    -- Service role
    (SELECT auth.role()) = 'service_role'
  );

-- ============================================
-- 7. STUDENTS TABLE - Consolidate INSERT policies
-- ============================================

-- Drop individual INSERT policies (created in Phase 1)
DROP POLICY IF EXISTS "Students can insert their own profile" ON public.students;
DROP POLICY IF EXISTS "Teachers can create student records" ON public.students;

-- Note: Service role policy already covers INSERT, but we need specific rules
-- Create consolidated INSERT policy for regular users
CREATE POLICY "students_insert_consolidated"
  ON public.students
  FOR INSERT
  WITH CHECK (
    -- Student can create own profile
    id = (SELECT auth.uid())
    OR
    -- Teacher can create student records
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
    OR
    -- Service role
    (SELECT auth.role()) = 'service_role'
  );

-- ============================================
-- 8. STUDENTS TABLE - Consolidate UPDATE policies
-- ============================================

-- Drop individual UPDATE policies (created in Phase 1)
DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
DROP POLICY IF EXISTS "Teachers can update connected students" ON public.students;

-- Create consolidated UPDATE policy
CREATE POLICY "students_update_consolidated"
  ON public.students
  FOR UPDATE
  USING (
    -- Student can update own profile
    id = (SELECT auth.uid())
    OR
    -- Teacher can update connected students
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.student_id = students.id
        AND tsc.teacher_id = (SELECT auth.uid())
        AND tsc.status = 'accepted'
    )
    OR
    -- Service role
    (SELECT auth.role()) = 'service_role'
  )
  WITH CHECK (
    -- Student can update own profile
    id = (SELECT auth.uid())
    OR
    -- Teacher can update connected students
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.student_id = students.id
        AND tsc.teacher_id = (SELECT auth.uid())
        AND tsc.status = 'accepted'
    )
    OR
    -- Service role
    (SELECT auth.role()) = 'service_role'
  );

-- Keep "Service role can manage students" policy from Phase 1 for DELETE and catch-all
-- This ensures service role has full access for all operations

COMMIT;

-- Summary of consolidations:
-- 1. student_skill_progress: 2 SELECT policies -> 1
-- 2. student_daily_goals: 2 SELECT policies -> 1
-- 3. user_accessories: 2 policies -> 1 (all operations)
-- 4. accessories: 2 policies -> 2 (SELECT consolidated, admin separate for writes)
-- 5. student_point_transactions: 3 SELECT policies -> 1
-- 6. students: Multiple policies -> 3 consolidated (SELECT, INSERT, UPDATE)
--
-- Total reduction: ~14 policies consolidated into ~8 policies
