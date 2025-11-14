-- Remove conflicting foreign key constraint on teacher_student_connections
-- This constraint requires student_id to exist in auth.users, but teachers create
-- student records with generated UUIDs that don't correspond to auth users yet.
-- The original constraint linking to students(id) is sufficient.

-- =============================================================================
-- STEP 1: Check current foreign key constraints
-- =============================================================================
DO $$
DECLARE
  constraint_record record;
BEGIN
  RAISE NOTICE '=== STEP 1: Current Foreign Key Constraints on teacher_student_connections ===';
  
  FOR constraint_record IN 
    SELECT 
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'teacher_student_connections'
    ORDER BY tc.constraint_name
  LOOP
    RAISE NOTICE 'Constraint: %', constraint_record.constraint_name;
    RAISE NOTICE '  - Column: % -> %.%', 
      constraint_record.column_name,
      constraint_record.foreign_table_name,
      constraint_record.foreign_column_name;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 2: Drop the conflicting auth.users foreign key constraint
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 2: Removing Conflicting Foreign Key Constraint ===';
  
  -- Drop the constraint that links student_id to auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'teacher_student_connections_student_id_auth_fkey'
      AND table_name = 'teacher_student_connections'
  ) THEN
    ALTER TABLE teacher_student_connections 
    DROP CONSTRAINT teacher_student_connections_student_id_auth_fkey;
    
    RAISE NOTICE '✓ Dropped constraint: teacher_student_connections_student_id_auth_fkey';
    RAISE NOTICE '  (This constraint incorrectly required student_id to exist in auth.users)';
  ELSE
    RAISE NOTICE '✗ Constraint teacher_student_connections_student_id_auth_fkey not found (may already be removed)';
  END IF;
END $$;

-- =============================================================================
-- STEP 3: Verify the original students(id) foreign key is still intact
-- =============================================================================
DO $$
DECLARE
  constraint_exists boolean;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 3: Verifying Original Foreign Key Constraints ===';
  
  -- Check if the original constraint to students table exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'teacher_student_connections'
      AND kcu.column_name = 'student_id'
      AND ccu.table_name = 'students'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✓ Foreign key constraint student_id -> students(id) is intact';
  ELSE
    RAISE WARNING '✗ Foreign key constraint student_id -> students(id) is missing!';
  END IF;
  
  -- Check teacher_id constraint
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'teacher_student_connections'
      AND kcu.column_name = 'teacher_id'
      AND ccu.table_name = 'teachers'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✓ Foreign key constraint teacher_id -> teachers(id) is intact';
  ELSE
    RAISE WARNING '✗ Foreign key constraint teacher_id -> teachers(id) is missing!';
  END IF;
END $$;

-- =============================================================================
-- STEP 4: Display final constraint state
-- =============================================================================
DO $$
DECLARE
  constraint_record record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 4: Final Foreign Key Constraints on teacher_student_connections ===';
  
  FOR constraint_record IN 
    SELECT 
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'teacher_student_connections'
    ORDER BY tc.constraint_name
  LOOP
    RAISE NOTICE 'Constraint: %', constraint_record.constraint_name;
    RAISE NOTICE '  - % -> %.%', 
      constraint_record.column_name,
      constraint_record.foreign_table_name,
      constraint_record.foreign_column_name;
  END LOOP;
END $$;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRATION COMPLETE ===';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '1. ✓ Removed conflicting auth.users foreign key constraint';
  RAISE NOTICE '2. ✓ Original students(id) foreign key constraint remains';
  RAISE NOTICE '3. ✓ Teachers can now create student profiles and connections';
  RAISE NOTICE '';
  RAISE NOTICE 'Teachers can now:';
  RAISE NOTICE '- Create student records with generated UUIDs';
  RAISE NOTICE '- Create teacher-student connections immediately';
  RAISE NOTICE '- Students can later sign up and claim their profile';
  RAISE NOTICE '';
  RAISE NOTICE 'Test by adding a new student from the teacher dashboard.';
END $$;

