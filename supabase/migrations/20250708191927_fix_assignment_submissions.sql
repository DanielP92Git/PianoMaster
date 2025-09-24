-- Fix Assignment Submissions Policy Conflict
-- Handle the existing policy that prevented the previous migration from completing

DO $$
BEGIN
    RAISE NOTICE 'Fixing assignment_submissions policy conflict...';
END $$;

-- First, check if we need to optimize the existing policy
DO $$
BEGIN
    RAISE NOTICE 'Checking and optimizing assignment_submissions policies...';
    
    -- Drop ALL existing policies that might conflict
    DROP POLICY IF EXISTS "Students can manage their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Students can manage their own submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Students can view their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Students can insert their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Students can update their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON assignment_submissions;
    DROP POLICY IF EXISTS "Teachers can update submissions for their assignments" ON assignment_submissions;
    DROP POLICY IF EXISTS "Teachers can view their assignment submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Teachers can update their assignment submissions" ON assignment_submissions;
    
    -- Create the optimized consolidated policies
    CREATE POLICY "Students can manage their submissions" ON assignment_submissions
        FOR ALL USING (student_id = (select auth.uid()));
    
    CREATE POLICY "Teachers can view their assignment submissions" ON assignment_submissions
        FOR SELECT USING (
            assignment_id IN (
                SELECT id FROM assignments WHERE teacher_id = (select auth.uid())
            )
        );
    
    CREATE POLICY "Teachers can update their assignment submissions" ON assignment_submissions
        FOR UPDATE USING (
            assignment_id IN (
                SELECT id FROM assignments WHERE teacher_id = (select auth.uid())
            )
        );
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Assignment submissions policy fix completed!';
END $$; 