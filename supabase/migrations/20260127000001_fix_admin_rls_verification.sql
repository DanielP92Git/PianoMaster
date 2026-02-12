-- Fix RLS Admin Verification (CRITICAL SECURITY FIX)
--
-- This migration addresses 7 RLS policy vulnerabilities that relied on mutable
-- user_metadata for admin authorization. The user_metadata field in JWT tokens
-- can be modified by users themselves, making it unsuitable for authorization.
--
-- Changes:
-- 1. Adds is_admin column to teachers table
-- 2. Creates secure is_admin() helper function
-- 3. Replaces all user_metadata-based admin checks with is_admin() function
--
-- Affected policies:
-- - accessories: "Students can read accessories", "Admin can manage accessories"
-- - user_accessories: "Admin can manage user accessories"
-- - student_point_transactions: 4 admin policies (read, insert, update, delete)
--
-- Generated on 2026-01-27

BEGIN;

-- =============================================================================
-- 1. Add is_admin column to teachers table
-- =============================================================================
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.teachers.is_admin IS
  'Designates admin privileges. Only modifiable by service_role or database admin.';

-- =============================================================================
-- 2. Create is_admin() helper function
-- =============================================================================
-- This function checks if the current authenticated user is an admin by
-- querying the teachers table. Using SECURITY DEFINER allows the function
-- to bypass RLS and check the teachers table directly.
-- The function is marked STABLE because it returns consistent results within
-- a single transaction.

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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

COMMENT ON FUNCTION public.is_admin() IS
  'Returns true if the current user is an admin (has is_admin=true in teachers table).';

-- =============================================================================
-- 3. Create index for performance
-- =============================================================================
-- Partial index on teachers table for efficient admin lookups
CREATE INDEX IF NOT EXISTS idx_teachers_is_admin
ON public.teachers(id)
WHERE is_admin = true;

-- =============================================================================
-- 4. Fix accessories table policies (2 policies)
-- =============================================================================

-- Policy: Students can read accessories
DROP POLICY IF EXISTS "Students can read accessories" ON public.accessories;
CREATE POLICY "Students can read accessories"
ON public.accessories
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = (SELECT auth.uid())
  )
  OR (SELECT auth.role()) = 'service_role'
  OR public.is_admin()
);

-- Policy: Admin can manage accessories
DROP POLICY IF EXISTS "Admin can manage accessories" ON public.accessories;
CREATE POLICY "Admin can manage accessories"
ON public.accessories
FOR ALL
TO authenticated
USING (
  (SELECT auth.role()) = 'service_role'
  OR public.is_admin()
)
WITH CHECK (
  (SELECT auth.role()) = 'service_role'
  OR public.is_admin()
);

-- =============================================================================
-- 5. Fix user_accessories table policy (1 policy)
-- =============================================================================

-- Policy: Admin can manage user accessories
DROP POLICY IF EXISTS "Admin can manage user accessories" ON public.user_accessories;
CREATE POLICY "Admin can manage user accessories"
ON public.user_accessories
FOR ALL
TO authenticated
USING (
  (SELECT auth.role()) = 'service_role'
  OR public.is_admin()
)
WITH CHECK (
  (SELECT auth.role()) = 'service_role'
  OR public.is_admin()
);

-- =============================================================================
-- 6. Fix student_point_transactions table policies (4 policies)
-- =============================================================================

-- Policy: Admin can read point transactions
DROP POLICY IF EXISTS "Admin can read point transactions" ON public.student_point_transactions;
CREATE POLICY "Admin can read point transactions"
ON public.student_point_transactions
FOR SELECT
TO authenticated
USING (
  (SELECT auth.role()) = 'service_role'
  OR public.is_admin()
);

-- Policy: Admin can insert point transactions
DROP POLICY IF EXISTS "Admin can insert point transactions" ON public.student_point_transactions;
CREATE POLICY "Admin can insert point transactions"
ON public.student_point_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.role()) = 'service_role'
  OR public.is_admin()
);

-- Policy: Admin can update point transactions
DROP POLICY IF EXISTS "Admin can update point transactions" ON public.student_point_transactions;
CREATE POLICY "Admin can update point transactions"
ON public.student_point_transactions
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.role()) = 'service_role'
  OR public.is_admin()
)
WITH CHECK (
  (SELECT auth.role()) = 'service_role'
  OR public.is_admin()
);

-- Policy: Admin can delete point transactions
DROP POLICY IF EXISTS "Admin can delete point transactions" ON public.student_point_transactions;
CREATE POLICY "Admin can delete point transactions"
ON public.student_point_transactions
FOR DELETE
TO authenticated
USING (
  (SELECT auth.role()) = 'service_role'
  OR public.is_admin()
);

COMMIT;
