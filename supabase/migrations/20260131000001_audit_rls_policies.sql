-- ============================================================================
-- Migration: Audit and Fix RLS Policies Using user_metadata (SEC-01)
-- Date: 2026-01-31
-- Description: Fixes authorization bypass vulnerabilities where RLS policies
--              used mutable JWT user_metadata for admin authorization.
--
--              user_metadata can be modified by users themselves via
--              supabase.auth.updateUser(), making it unsuitable for authorization.
--              All admin checks are now replaced with public.is_admin() function
--              which queries the teachers table for is_admin=true.
--
-- Affected policies (from 20260128000001_consolidate_rls_policies.sql):
-- - user_accessories_all_consolidated
-- - accessories_select_consolidated
-- - accessories_admin_manage
-- - student_point_transactions_select_consolidated
--
-- Pattern used: Replace (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
--               with public.is_admin()
--
-- References:
-- - 20260127000001_fix_admin_rls_verification.sql (established is_admin pattern)
-- - 20260127000002_fix_search_path_warnings.sql (search_path security)
-- ============================================================================

BEGIN;

-- =============================================================================
-- 1. Verify is_admin() function exists (should exist from 20260127000001)
-- =============================================================================
-- This is a safety check. The function should already exist.
-- If it doesn't, create it with proper security settings.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.teachers
    WHERE id = auth.uid()
      AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql
   STABLE
   SECURITY DEFINER
   SET search_path = public;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

COMMENT ON FUNCTION public.is_admin() IS
  'Returns true if the current user is an admin (has is_admin=true in teachers table). '
  'SECURITY: Uses database state, not JWT user_metadata which can be modified by users.';

-- Ensure is_admin column exists on teachers table
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Ensure index exists for performance
CREATE INDEX IF NOT EXISTS idx_teachers_is_admin
ON public.teachers(id)
WHERE is_admin = true;

-- =============================================================================
-- 2. Fix user_accessories table policy
-- =============================================================================
-- VULNERABILITY: Used (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
-- FIX: Replace with public.is_admin()

DROP POLICY IF EXISTS "user_accessories_all_consolidated" ON public.user_accessories;

CREATE POLICY "user_accessories_all_consolidated"
  ON public.user_accessories
  FOR ALL
  TO authenticated
  USING (
    -- User owns this accessory record
    user_id = (SELECT auth.uid())
    OR
    -- Service role (server-side operations)
    (SELECT auth.role()) = 'service_role'
    OR
    -- Admin verified via database state
    public.is_admin()
  )
  WITH CHECK (
    -- User owns this accessory record
    user_id = (SELECT auth.uid())
    OR
    -- Service role (server-side operations)
    (SELECT auth.role()) = 'service_role'
    OR
    -- Admin verified via database state
    public.is_admin()
  );

-- =============================================================================
-- 3. Fix accessories table policies
-- =============================================================================
-- VULNERABILITY: Used (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
-- FIX: Replace with public.is_admin()

-- Drop both policies first
DROP POLICY IF EXISTS "accessories_select_consolidated" ON public.accessories;
DROP POLICY IF EXISTS "accessories_admin_manage" ON public.accessories;

-- SELECT policy for accessories catalog
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
    -- Service role (server-side operations)
    (SELECT auth.role()) = 'service_role'
    OR
    -- Admin verified via database state
    public.is_admin()
  );

-- Admin-only write operations for accessories
CREATE POLICY "accessories_admin_manage"
  ON public.accessories
  FOR ALL
  TO authenticated
  USING (
    -- Service role (server-side operations)
    (SELECT auth.role()) = 'service_role'
    OR
    -- Admin verified via database state
    public.is_admin()
  )
  WITH CHECK (
    -- Service role (server-side operations)
    (SELECT auth.role()) = 'service_role'
    OR
    -- Admin verified via database state
    public.is_admin()
  );

-- =============================================================================
-- 4. Fix student_point_transactions SELECT policy
-- =============================================================================
-- VULNERABILITY: Used (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
-- FIX: Replace with public.is_admin()

DROP POLICY IF EXISTS "student_point_transactions_select_consolidated" ON public.student_point_transactions;

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
    -- Service role (server-side operations)
    (SELECT auth.role()) = 'service_role'
    OR
    -- Admin verified via database state
    public.is_admin()
  );

-- =============================================================================
-- 5. Fix student_point_transactions INSERT policy (Admin)
-- =============================================================================
-- The original policy from 20251223000001 also used user_metadata
-- This was superseded by consolidation but we should ensure it's fixed

DROP POLICY IF EXISTS "Admin can insert point transactions" ON public.student_point_transactions;

CREATE POLICY "Admin can insert point transactions"
  ON public.student_point_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Service role (server-side operations)
    (SELECT auth.role()) = 'service_role'
    OR
    -- Admin verified via database state
    public.is_admin()
  );

-- =============================================================================
-- 6. Fix student_point_transactions UPDATE policy (Admin)
-- =============================================================================

DROP POLICY IF EXISTS "Admin can update point transactions" ON public.student_point_transactions;

CREATE POLICY "Admin can update point transactions"
  ON public.student_point_transactions
  FOR UPDATE
  TO authenticated
  USING (
    -- Service role (server-side operations)
    (SELECT auth.role()) = 'service_role'
    OR
    -- Admin verified via database state
    public.is_admin()
  )
  WITH CHECK (
    -- Service role (server-side operations)
    (SELECT auth.role()) = 'service_role'
    OR
    -- Admin verified via database state
    public.is_admin()
  );

-- =============================================================================
-- 7. Fix student_point_transactions DELETE policy (Admin)
-- =============================================================================

DROP POLICY IF EXISTS "Admin can delete point transactions" ON public.student_point_transactions;

CREATE POLICY "Admin can delete point transactions"
  ON public.student_point_transactions
  FOR DELETE
  TO authenticated
  USING (
    -- Service role (server-side operations)
    (SELECT auth.role()) = 'service_role'
    OR
    -- Admin verified via database state
    public.is_admin()
  );

-- =============================================================================
-- 8. Add performance indexes for RLS policy optimization
-- =============================================================================
-- Ensure indexes exist on columns used in RLS policies

-- user_accessories: user_id index
CREATE INDEX IF NOT EXISTS idx_user_accessories_user_id
ON public.user_accessories(user_id);

-- student_point_transactions: student_id index
CREATE INDEX IF NOT EXISTS idx_student_point_transactions_student_id
ON public.student_point_transactions(student_id);

-- teacher_student_connections: composite index for relationship lookups
CREATE INDEX IF NOT EXISTS idx_teacher_student_connections_lookup
ON public.teacher_student_connections(teacher_id, student_id, status);

COMMIT;

-- ============================================================================
-- AUDIT SUMMARY
-- ============================================================================
--
-- Policies fixed:
-- 1. user_accessories_all_consolidated - removed user_metadata, uses is_admin()
-- 2. accessories_select_consolidated - removed user_metadata, uses is_admin()
-- 3. accessories_admin_manage - removed user_metadata, uses is_admin()
-- 4. student_point_transactions_select_consolidated - removed user_metadata, uses is_admin()
-- 5. Admin can insert point transactions - removed user_metadata, uses is_admin()
-- 6. Admin can update point transactions - removed user_metadata, uses is_admin()
-- 7. Admin can delete point transactions - removed user_metadata, uses is_admin()
--
-- Security improvement:
-- Before: Admin access could be gained by calling supabase.auth.updateUser({ data: { role: 'admin' }})
-- After: Admin access requires is_admin=true in teachers table (database-enforced)
--
-- No user_metadata patterns remain in any RLS policies.
-- ============================================================================
