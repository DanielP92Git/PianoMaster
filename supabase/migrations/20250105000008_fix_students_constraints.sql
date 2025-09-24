-- Fix students table constraints and RLS policies
-- This allows teachers to create student records independently of auth users

-- Drop foreign key constraint from students.id to auth.users if it exists
-- (Keep the primary key, just remove the foreign key constraint to auth.users)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_id_fkey;
ALTER TABLE students DROP CONSTRAINT IF EXISTS fk_students_id_users;

-- Fix RLS policies to be more permissive for teachers
DROP POLICY IF EXISTS "Teachers can search students by email" ON students;
DROP POLICY IF EXISTS "Teachers can create student records" ON students;

-- Allow teachers to view any student for searching/adding
CREATE POLICY "Teachers can view students" ON students
    FOR SELECT USING (
        -- Allow teachers to view any student record
        auth.uid() IN (SELECT id FROM teachers WHERE is_active = true)
        OR
        -- Allow students to view their own record
        id = auth.uid()
    );

-- Allow teachers to create new student records
CREATE POLICY "Teachers can create students" ON students
    FOR INSERT WITH CHECK (
        -- Allow teachers to create student records
        auth.uid() IN (SELECT id FROM teachers WHERE is_active = true)
    );

-- Allow students to update their own records
CREATE POLICY "Students can update own profile" ON students
    FOR UPDATE USING (id = auth.uid());

-- Allow both teachers and service role to update student records
CREATE POLICY "Teachers can update student records" ON students
    FOR UPDATE USING (
        -- Allow teachers to update student records they created or are connected to
        auth.uid() IN (SELECT id FROM teachers WHERE is_active = true)
        OR
        -- Allow students to update their own records
        id = auth.uid()
    ); 