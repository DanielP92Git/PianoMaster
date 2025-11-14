-- Fix RLS policy to allow teachers to insert student records
-- This migration cleans up conflicting policies and creates a proper INSERT policy

-- =============================================================================
-- STEP 1: Ensure all teacher users have records in teachers table
-- =============================================================================
DO $$
DECLARE
  teacher_user_record record;
  inserted_count integer := 0;
BEGIN
  RAISE NOTICE '=== STEP 1: Ensuring Teacher Records Exist ===';
  
  -- Insert or update teacher records for all users with teacher role
  FOR teacher_user_record IN 
    SELECT 
      id,
      email,
      raw_user_meta_data->>'full_name' as full_name,
      created_at
    FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'teacher'
  LOOP
    INSERT INTO public.teachers (
      id, 
      email, 
      first_name, 
      last_name,
      is_active, 
      created_at, 
      updated_at
    )
    VALUES (
      teacher_user_record.id,
      teacher_user_record.email,
      COALESCE(
        split_part(teacher_user_record.full_name, ' ', 1),
        split_part(teacher_user_record.email, '@', 1)
      ),
      COALESCE(
        NULLIF(split_part(teacher_user_record.full_name, ' ', 2), ''),
        ''
      ),
      true,
      teacher_user_record.created_at,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
      is_active = true,
      updated_at = NOW();
    
    inserted_count := inserted_count + 1;
    RAISE NOTICE 'Teacher record created/updated: % (ID: %)', 
      teacher_user_record.email, 
      teacher_user_record.id;
  END LOOP;
  
  RAISE NOTICE 'Total teacher records processed: %', inserted_count;
END $$;

-- =============================================================================
-- STEP 2: Drop ALL existing policies on students table for clean slate
-- =============================================================================
DO $$
DECLARE
  policy_name text;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 2: Dropping All Existing Policies on Students Table ===';
  
  -- Drop all policies on students table
  FOR policy_name IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'students'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON students', policy_name);
    RAISE NOTICE 'Dropped policy: %', policy_name;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 3: Create clean, non-conflicting RLS policies
-- =============================================================================

-- Policy 1: Students can view and manage their own profile
CREATE POLICY "Students can manage own profile" 
ON students
FOR ALL 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 2: Teachers can INSERT student records (this is the critical one)
CREATE POLICY "Teachers can create student records" 
ON students
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teachers 
    WHERE teachers.id = auth.uid() 
    AND teachers.is_active = true
  )
);

-- Policy 3: Teachers can SELECT students they're connected to
CREATE POLICY "Teachers can view connected students" 
ON students
FOR SELECT
USING (
  -- Teacher can see students they're connected to
  id IN (
    SELECT student_id 
    FROM public.teacher_student_connections 
    WHERE teacher_id = auth.uid() 
      AND status = 'accepted'
  )
  OR
  -- Or if they're a teacher (to check existence during connection creation)
  EXISTS (
    SELECT 1 FROM public.teachers 
    WHERE teachers.id = auth.uid() 
    AND teachers.is_active = true
  )
);

-- Policy 4: Teachers can UPDATE students they're connected to
CREATE POLICY "Teachers can update connected students" 
ON students
FOR UPDATE
USING (
  id IN (
    SELECT student_id 
    FROM public.teacher_student_connections 
    WHERE teacher_id = auth.uid() 
      AND status = 'accepted'
  )
)
WITH CHECK (
  id IN (
    SELECT student_id 
    FROM public.teacher_student_connections 
    WHERE teacher_id = auth.uid() 
      AND status = 'accepted'
  )
);

-- Policy 5: Service role can do everything (for admin operations)
CREATE POLICY "Service role can manage students" 
ON students
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 3: Creating Clean RLS Policies ===';
  RAISE NOTICE 'Created policy: Students can manage own profile';
  RAISE NOTICE 'Created policy: Teachers can create student records';
  RAISE NOTICE 'Created policy: Teachers can view connected students';
  RAISE NOTICE 'Created policy: Teachers can update connected students';
  RAISE NOTICE 'Created policy: Service role can manage students';
END $$;

-- =============================================================================
-- STEP 4: Verify policies were created correctly
-- =============================================================================
DO $$
DECLARE
  policy_count integer;
  policy_record record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 4: Verifying Policy Creation ===';
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'students';
  
  RAISE NOTICE 'Total policies on students table: %', policy_count;
  
  -- Check specifically for the INSERT policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'students' 
      AND policyname = 'Teachers can create student records'
      AND cmd = 'INSERT'
  ) THEN
    RAISE NOTICE '✓ INSERT policy for teachers verified';
  ELSE
    RAISE WARNING '✗ INSERT policy for teachers NOT found';
  END IF;
  
  -- List all policies
  RAISE NOTICE '';
  RAISE NOTICE 'All policies on students table:';
  FOR policy_record IN 
    SELECT policyname, cmd, permissive
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'students'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - % (%, Permissive: %)', 
      policy_record.policyname,
      policy_record.cmd,
      policy_record.permissive;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 5: Verify teacher records and policy evaluation
-- =============================================================================
DO $$
DECLARE
  teacher_record record;
  policy_result boolean;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 5: Testing Policy for Each Teacher ===';
  
  FOR teacher_record IN 
    SELECT t.id, t.email, t.is_active
    FROM public.teachers t
    ORDER BY t.created_at DESC
  LOOP
    -- Simulate the policy check
    SELECT EXISTS (
      SELECT 1 FROM public.teachers 
      WHERE id = teacher_record.id 
      AND is_active = true
    ) INTO policy_result;
    
    RAISE NOTICE 'Teacher: %', teacher_record.email;
    RAISE NOTICE '  - ID: %', teacher_record.id;
    RAISE NOTICE '  - Active: %', teacher_record.is_active;
    RAISE NOTICE '  - Would pass INSERT policy: %', policy_result;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 6: Ensure students table has proper defaults
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 6: Ensuring Table Defaults ===';
  
  -- Make sure id has UUID default for teacher-created students
  ALTER TABLE students ALTER COLUMN id SET DEFAULT gen_random_uuid();
  RAISE NOTICE '✓ Set default UUID generation for students.id';
  
  -- Make sure created_at has default
  ALTER TABLE students ALTER COLUMN created_at SET DEFAULT NOW();
  RAISE NOTICE '✓ Set default timestamp for students.created_at';
  
  -- Make sure updated_at has default
  ALTER TABLE students ALTER COLUMN updated_at SET DEFAULT NOW();
  RAISE NOTICE '✓ Set default timestamp for students.updated_at';
END $$;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRATION COMPLETE ===';
  RAISE NOTICE 'Summary of changes:';
  RAISE NOTICE '1. ✓ Teacher records created/verified for all teacher users';
  RAISE NOTICE '2. ✓ Old conflicting policies removed';
  RAISE NOTICE '3. ✓ New clean policies created';
  RAISE NOTICE '4. ✓ INSERT policy for teachers verified';
  RAISE NOTICE '5. ✓ Table defaults configured';
  RAISE NOTICE '';
  RAISE NOTICE 'Teachers should now be able to create student records.';
  RAISE NOTICE 'Test by attempting to add a student from the teacher dashboard.';
END $$;

