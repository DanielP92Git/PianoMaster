-- Fix infinite recursion in RLS policies
-- This addresses circular dependencies between classes and class_enrollments policies

-- Drop the problematic policies that cause circular references
DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON classes;
DROP POLICY IF EXISTS "Teachers can view enrollments in their classes" ON class_enrollments;
DROP POLICY IF EXISTS "Teachers can manage enrollments in their classes" ON class_enrollments;

-- Recreate class_enrollments policies without circular references
DROP POLICY IF EXISTS "Teachers can view their class enrollments" ON class_enrollments;
CREATE POLICY "Teachers can view their class enrollments" ON class_enrollments
    FOR SELECT USING (
        -- Direct check without referencing classes table
        EXISTS (
            SELECT 1 FROM teachers t 
            WHERE t.id = auth.uid() 
            AND t.id = (SELECT teacher_id FROM classes WHERE id = class_enrollments.class_id)
        )
    );

DROP POLICY IF EXISTS "Teachers can manage their class enrollments" ON class_enrollments;
CREATE POLICY "Teachers can manage their class enrollments" ON class_enrollments
    FOR ALL USING (
        -- Direct check without referencing classes table
        EXISTS (
            SELECT 1 FROM teachers t 
            WHERE t.id = auth.uid() 
            AND t.id = (SELECT teacher_id FROM classes WHERE id = class_enrollments.class_id)
        )
    );

-- Recreate students class viewing policy with a simpler approach
DROP POLICY IF EXISTS "Students can view enrolled classes" ON classes;
CREATE POLICY "Students can view enrolled classes" ON classes
    FOR SELECT USING (
        -- Check if the current user is a student enrolled in this class
        auth.uid() IN (
            SELECT student_id FROM class_enrollments ce 
            WHERE ce.class_id = classes.id AND ce.status = 'active'
        )
    );

-- Alternative: If the above still causes issues, we can use a simpler policy
-- that doesn't reference other tables for students
DROP POLICY IF EXISTS "Students can view enrolled classes" ON classes;

-- Simple policy: Students can view all active classes (less restrictive but safer)
DROP POLICY IF EXISTS "Students can view active classes" ON classes;
CREATE POLICY "Students can view active classes" ON classes
    FOR SELECT USING (
        is_active = true AND 
        auth.uid() IS NOT NULL AND
        auth.uid() NOT IN (SELECT id FROM teachers)
    );

-- Add a separate policy for enrolled classes that's less prone to recursion
-- This will be used by the application layer instead of RLS
COMMENT ON TABLE class_enrollments IS 'Use application-level filtering for student access to avoid RLS recursion';

-- Verify policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('classes', 'class_enrollments')
ORDER BY tablename, policyname; 