-- Comprehensive diagnostic migration to identify why teachers cannot insert students
-- This migration will check all relevant conditions and output diagnostic information

-- =============================================================================
-- STEP 1: Check if current user has a teacher record
-- =============================================================================
DO $$
DECLARE
  current_auth_uid uuid;
  user_in_auth boolean;
  teacher_exists boolean;
  teacher_active boolean;
  teacher_mail text;
  user_role text;
BEGIN
  RAISE NOTICE '=== DIAGNOSTIC STEP 1: Checking Teacher Record ===';
  
  -- Get current auth uid (this will be NULL in migration context, but shows structure)
  SELECT auth.uid() INTO current_auth_uid;
  
  RAISE NOTICE 'Current auth.uid(): %', current_auth_uid;
  
  -- Check all teacher users in auth.users
  RAISE NOTICE '--- All users with teacher role in auth.users: ---';
  FOR user_role, teacher_mail, current_auth_uid IN 
    SELECT 
      raw_user_meta_data->>'role' as role,
      email,
      id
    FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'teacher'
  LOOP
    RAISE NOTICE 'Teacher in auth: % (ID: %)', teacher_mail, current_auth_uid;
    
    -- Check if this teacher has a record in teachers table
    SELECT EXISTS(SELECT 1 FROM public.teachers WHERE id = current_auth_uid) INTO teacher_exists;
    SELECT COALESCE((SELECT is_active FROM public.teachers WHERE id = current_auth_uid), false) INTO teacher_active;
    
    RAISE NOTICE '  - Has teacher record: %, Is active: %', teacher_exists, teacher_active;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 2: List all current RLS policies on students table
-- =============================================================================
DO $$
DECLARE
  policy_record record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== DIAGNOSTIC STEP 2: Current RLS Policies on Students Table ===';
  
  FOR policy_record IN 
    SELECT 
      policyname,
      permissive,
      roles::text,
      cmd,
      CASE 
        WHEN qual IS NOT NULL THEN 'HAS USING'
        ELSE 'NO USING'
      END as has_qual,
      CASE 
        WHEN with_check IS NOT NULL THEN 'HAS WITH CHECK'
        ELSE 'NO WITH CHECK'
      END as has_with_check
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'students'
    ORDER BY policyname
  LOOP
    RAISE NOTICE 'Policy: %', policy_record.policyname;
    RAISE NOTICE '  - Command: %, Permissive: %, Roles: %', 
      policy_record.cmd, 
      policy_record.permissive, 
      policy_record.roles;
    RAISE NOTICE '  - %, %', 
      policy_record.has_qual, 
      policy_record.has_with_check;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 3: Check if RLS is enabled on students table
-- =============================================================================
DO $$
DECLARE
  rls_enabled boolean;
  force_rls boolean;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== DIAGNOSTIC STEP 3: RLS Status on Students Table ===';
  
  SELECT 
    relrowsecurity,
    relforcerowsecurity
  INTO rls_enabled, force_rls
  FROM pg_class
  WHERE relname = 'students' 
    AND relnamespace = 'public'::regnamespace;
  
  RAISE NOTICE 'RLS Enabled: %, Force RLS: %', rls_enabled, force_rls;
END $$;

-- =============================================================================
-- STEP 4: Check students table structure
-- =============================================================================
DO $$
DECLARE
  col_record record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== DIAGNOSTIC STEP 4: Students Table Structure ===';
  
  FOR col_record IN 
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'students'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Column: % (%), Nullable: %, Default: %', 
      col_record.column_name,
      col_record.data_type,
      col_record.is_nullable,
      col_record.column_default;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 5: Check for any constraints that might cause issues
-- =============================================================================
DO $$
DECLARE
  constraint_record record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== DIAGNOSTIC STEP 5: Students Table Constraints ===';
  
  FOR constraint_record IN 
    SELECT 
      conname,
      contype,
      CASE contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'c' THEN 'CHECK'
        ELSE contype::text
      END as constraint_type
    FROM pg_constraint
    WHERE conrelid = 'public.students'::regclass
    ORDER BY conname
  LOOP
    RAISE NOTICE 'Constraint: % (Type: %)', 
      constraint_record.conname,
      constraint_record.constraint_type;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 6: Test the policy condition for each teacher
-- =============================================================================
DO $$
DECLARE
  teacher_record record;
  policy_check boolean;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== DIAGNOSTIC STEP 6: Testing Policy Condition for Each Teacher ===';
  
  FOR teacher_record IN 
    SELECT id, email, is_active
    FROM public.teachers
    ORDER BY created_at DESC
  LOOP
    -- This simulates what the policy checks
    SELECT EXISTS (
      SELECT 1 FROM public.teachers 
      WHERE id = teacher_record.id 
      AND is_active = true
    ) INTO policy_check;
    
    RAISE NOTICE 'Teacher: % (ID: %)', teacher_record.email, teacher_record.id;
    RAISE NOTICE '  - Is Active: %, Policy Check Would Pass: %', 
      teacher_record.is_active,
      policy_check;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 7: Summary and Recommendations
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== DIAGNOSTIC COMPLETE ===';
  RAISE NOTICE 'Review the output above to identify:';
  RAISE NOTICE '1. Whether teacher records exist for auth users';
  RAISE NOTICE '2. Which RLS policies are currently active';
  RAISE NOTICE '3. Whether the policy conditions would evaluate correctly';
  RAISE NOTICE '4. Any structural issues with the students table';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run the fix migration based on findings';
END $$;

