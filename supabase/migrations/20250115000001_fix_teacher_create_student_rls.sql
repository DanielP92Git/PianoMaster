-- Fix RLS policy to allow teachers to create student records
-- Teachers should be able to create student profiles

-- Drop all existing policies on students table (comprehensive cleanup)
DROP POLICY IF EXISTS "Teachers can create students" ON students;
DROP POLICY IF EXISTS "Teachers can create student records" ON students;
DROP POLICY IF EXISTS "Users can access students" ON students;
DROP POLICY IF EXISTS "Students can manage their profile" ON students;
DROP POLICY IF EXISTS "Teachers can view enrolled students" ON students;
DROP POLICY IF EXISTS "Service role can manage students" ON students;
DROP POLICY IF EXISTS "Students can manage own profile" ON students;
DROP POLICY IF EXISTS "Teachers can view connected students" ON students;
DROP POLICY IF EXISTS "Teachers can update connected students" ON students;
DROP POLICY IF EXISTS "Students can view own profile" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;
DROP POLICY IF EXISTS "Students can insert own profile" ON students;

-- Modify students table to make id use UUID default
-- This allows auto-generation of IDs for teacher-created students
ALTER TABLE students ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Remove the foreign key constraint temporarily if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_id_fkey'
    ) THEN
        ALTER TABLE students DROP CONSTRAINT students_id_fkey;
    END IF;
END $$;

-- Create updated policies for students table
-- Policy 1: Students can manage their own profile
CREATE POLICY "Students can manage own profile" ON students
    FOR ALL USING (
        id = (select auth.uid())
    );

-- Policy 2: Teachers can view their connected students
CREATE POLICY "Teachers can view connected students" ON students
    FOR SELECT USING (
        id IN (
            SELECT student_id FROM teacher_student_connections 
            WHERE teacher_id = (select auth.uid()) AND status = 'accepted'
        )
    );

-- Policy 3: Teachers can create student records
-- This allows teachers to pre-create student profiles
-- Only checks the teachers table (secure approach - not using user_metadata)
CREATE POLICY "Teachers can create student records" ON students
    FOR INSERT 
    TO authenticated  -- Crucial: allows client-side API calls from authenticated users
    WITH CHECK (
        -- Check if the current user is a teacher in the teachers table
        EXISTS (
            SELECT 1 FROM teachers 
            WHERE id = (select auth.uid()) 
            AND is_active = true
        )
    );

-- Policy 4: Teachers can update student records they're connected to
CREATE POLICY "Teachers can update connected students" ON students
    FOR UPDATE USING (
        id IN (
            SELECT student_id FROM teacher_student_connections 
            WHERE teacher_id = (select auth.uid()) AND status = 'accepted'
        )
    );

-- Policy 5: Service role can manage all students
CREATE POLICY "Service role can manage students" ON students
    FOR ALL USING (
        (select auth.role()) = 'service_role'
    );

-- Add a unique constraint on email to prevent duplicate student records
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'students_email_key'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_email_key UNIQUE (email);
    END IF;
END $$;

-- Drop the trigger first if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_teacher ON auth.users;

-- Create or replace function to automatically create teacher records for users with teacher role
-- This ensures teachers can immediately start creating students
CREATE OR REPLACE FUNCTION public.handle_teacher_signup()
RETURNS trigger AS $$
BEGIN
  -- Check if user has teacher role in metadata
  IF (NEW.raw_user_meta_data->>'role') = 'teacher' THEN
    -- Create teacher record if it doesn't exist
    INSERT INTO public.teachers (id, email, first_name, is_active, created_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      true,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create teacher records on signup
CREATE TRIGGER on_auth_user_created_teacher
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_teacher_signup();

-- Also create teacher records for any existing teacher users who don't have records yet
INSERT INTO public.teachers (id, email, first_name, is_active, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  true,
  NOW()
FROM auth.users
WHERE (raw_user_meta_data->>'role') = 'teacher'
ON CONFLICT (id) DO UPDATE SET is_active = true;

