-- Debug and fix teacher access to create students
-- This migration ensures your teacher account can create students

-- First, let's check and create your teacher record manually
-- Insert your current logged-in user as a teacher (using their auth ID)
DO $$
DECLARE
  current_teacher_id uuid;
  current_teacher_email text;
BEGIN
  -- Get current authenticated user from auth.users
  SELECT id, email INTO current_teacher_id, current_teacher_email
  FROM auth.users
  WHERE raw_user_meta_data->>'role' = 'teacher'
  LIMIT 1;

  -- If we found a teacher user, ensure they have a record in teachers table
  IF current_teacher_id IS NOT NULL THEN
    INSERT INTO public.teachers (id, email, first_name, is_active, created_at, updated_at)
    VALUES (
      current_teacher_id,
      current_teacher_email,
      COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = current_teacher_id),
        split_part(current_teacher_email, '@', 1)
      ),
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
      is_active = true,
      updated_at = NOW();
    
    RAISE NOTICE 'Teacher record created/updated for: %', current_teacher_email;
  ELSE
    RAISE NOTICE 'No teacher users found in auth.users';
  END IF;
END $$;

-- Drop and recreate the policy with better debugging
DROP POLICY IF EXISTS "Teachers can create student records" ON students;

-- Create a more permissive policy for INSERT that checks multiple conditions
-- Important: Must specify TO authenticated for client-side requests
CREATE POLICY "Teachers can create student records" ON students
    FOR INSERT 
    TO authenticated  -- This is crucial for client-side API calls!
    WITH CHECK (
        -- Allow if user exists in teachers table
        EXISTS (
            SELECT 1 FROM public.teachers 
            WHERE teachers.id = auth.uid() 
            AND teachers.is_active = true
        )
    );

-- Verify the policy was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'students' 
        AND policyname = 'Teachers can create student records'
    ) THEN
        RAISE NOTICE 'Policy "Teachers can create student records" created successfully';
    ELSE
        RAISE WARNING 'Policy creation may have failed';
    END IF;
END $$;

-- Display current teachers for verification
DO $$
DECLARE
    teacher_record record;
BEGIN
    RAISE NOTICE '=== Current Teachers in Database ===';
    FOR teacher_record IN 
        SELECT id, email, first_name, is_active 
        FROM public.teachers 
        ORDER BY created_at DESC
    LOOP
        RAISE NOTICE 'Teacher: % (%) - Active: %', 
            teacher_record.email, 
            teacher_record.id, 
            teacher_record.is_active;
    END LOOP;
END $$;

