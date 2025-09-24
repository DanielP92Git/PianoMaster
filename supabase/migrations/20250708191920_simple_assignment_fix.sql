-- Simple fix for assignment_submissions policy performance issue
-- Directly address the specific policy mentioned in the Performance Advisor warning

DO $$
BEGIN
    RAISE NOTICE 'Fixing assignment_submissions policy performance issue...';
END $$;

-- Fix the specific "Students can manage their own submissions" policy on assignment_submissions
-- This is the exact policy mentioned in the Performance Advisor warning

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Students can manage their own submissions" ON assignment_submissions;

-- Recreate with optimized (select auth.uid()) pattern  
CREATE POLICY "Students can manage their own submissions" ON assignment_submissions
    FOR ALL USING (student_id = (select auth.uid()));

-- Also check for and fix other common assignment_submissions policies
DROP POLICY IF EXISTS "Students can view their submissions" ON assignment_submissions;
CREATE POLICY "Students can view their submissions" ON assignment_submissions
    FOR SELECT USING (student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can insert their submissions" ON assignment_submissions;
CREATE POLICY "Students can insert their submissions" ON assignment_submissions
    FOR INSERT WITH CHECK (student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can update their submissions" ON assignment_submissions;
CREATE POLICY "Students can update their submissions" ON assignment_submissions
    FOR UPDATE USING (student_id = (select auth.uid()));

-- Fix teacher access to assignment submissions
DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON assignment_submissions;
CREATE POLICY "Teachers can view submissions for their assignments" ON assignment_submissions
    FOR SELECT USING (
        assignment_id IN (
            SELECT id FROM assignments WHERE teacher_id = (select auth.uid())
        )
    );

DO $$
BEGIN
    RAISE NOTICE 'Assignment submissions policy optimization completed!';
    RAISE NOTICE 'This should fix the specific Performance Advisor warning';
END $$; 