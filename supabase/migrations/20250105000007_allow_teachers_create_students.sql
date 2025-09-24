-- Allow teachers to create student records
-- This fixes 403/406 errors when teachers try to add students

-- Add policy for teachers to insert new students
CREATE POLICY "Teachers can create student records" ON students
    FOR INSERT WITH CHECK (
        -- Allow if current user is a teacher (exists in teachers table)
        auth.uid() IN (SELECT id FROM teachers WHERE is_active = true)
    );

-- Add policy for teachers to select students by email (for duplicate checking)
CREATE POLICY "Teachers can search students by email" ON students
    FOR SELECT USING (
        -- Allow teachers to search students by email for adding to their classes
        auth.uid() IN (SELECT id FROM teachers WHERE is_active = true)
    ); 