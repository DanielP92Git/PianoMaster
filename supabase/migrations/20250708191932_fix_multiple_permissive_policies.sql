-- Fix Multiple Permissive Policies Issue
-- Consolidate student and teacher policies into single policies per table
-- This addresses the core issue where separate policies for students and teachers
-- create "multiple permissive policies" warnings

DO $$
BEGIN
    RAISE NOTICE 'Fixing multiple permissive policies by consolidating policies...';
END $$;

-- 1. ASSIGNMENT_SUBMISSIONS TABLE - Consolidate into single policy
DO $$
BEGIN
    RAISE NOTICE 'Consolidating assignment_submissions policies...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Students can manage their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Teachers can view assignment submissions" ON assignment_submissions;
    
    -- Create single consolidated policy that handles both students and teachers
    CREATE POLICY "Users can access assignment submissions" ON assignment_submissions
        FOR ALL USING (
            -- Students can manage their own submissions
            student_id = (select auth.uid()) OR
            -- Teachers can view/manage submissions for their assignments
            assignment_id IN (
                SELECT id FROM assignments WHERE teacher_id = (select auth.uid())
            )
        );
END $$;

-- 2. ASSIGNMENTS TABLE - Consolidate into single policy  
DO $$
BEGIN
    RAISE NOTICE 'Consolidating assignments policies...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Students can view assignments" ON assignments;
    DROP POLICY IF EXISTS "Teachers can manage assignments" ON assignments;
    
    -- Create single consolidated policy
    CREATE POLICY "Users can access assignments" ON assignments
        FOR ALL USING (
            -- Teachers can manage their own assignments
            teacher_id = (select auth.uid()) OR
            -- Students can view assignments for classes they're enrolled in
            (class_id IN (
                SELECT class_id FROM class_enrollments 
                WHERE student_id = (select auth.uid()) AND status = 'active'
            ) OR class_id IS NULL)
        )
        WITH CHECK (
            -- Only teachers can create/update assignments
            teacher_id = (select auth.uid())
        );
END $$;

-- 3. CLASS_ENROLLMENTS TABLE - Consolidate into single policy
DO $$
BEGIN
    RAISE NOTICE 'Consolidating class_enrollments policies...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Students can view their enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Students can update their enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can manage enrollments" ON class_enrollments;
    
    -- Create single consolidated policy
    CREATE POLICY "Users can access class enrollments" ON class_enrollments
        FOR ALL USING (
            -- Students can view/update their own enrollments
            student_id = (select auth.uid()) OR
            -- Teachers can manage enrollments for their classes
            class_id IN (SELECT id FROM classes WHERE teacher_id = (select auth.uid()))
        );
END $$;

-- 4. CLASSES TABLE - Consolidate into single policy
DO $$
BEGIN
    RAISE NOTICE 'Consolidating classes policies...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Students can view enrolled classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can manage their classes" ON classes;
    
    -- Create single consolidated policy
    CREATE POLICY "Users can access classes" ON classes
        FOR ALL USING (
            -- Teachers can manage their own classes
            teacher_id = (select auth.uid()) OR
            -- Students can view classes they're enrolled in
            id IN (
                SELECT class_id FROM class_enrollments 
                WHERE student_id = (select auth.uid()) AND status = 'active'
            )
        )
        WITH CHECK (
            -- Only teachers can create/update classes
            teacher_id = (select auth.uid())
        );
END $$;

-- 5. PRACTICE_SESSIONS TABLE - Consolidate into single policy
DO $$
BEGIN
    RAISE NOTICE 'Consolidating practice_sessions policies...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Students can manage their practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Teachers can manage student practice sessions" ON practice_sessions;
    
    -- Create single consolidated policy
    CREATE POLICY "Users can access practice sessions" ON practice_sessions
        FOR ALL USING (
            -- Students can manage their own practice sessions
            student_id = (select auth.uid()) OR
            -- Teachers can view/manage practice sessions for their students
            student_id IN (
                SELECT student_id FROM teacher_student_connections 
                WHERE teacher_id = (select auth.uid())
            )
        );
END $$;

-- 6. TEACHER_STUDENT_MESSAGES TABLE - Consolidate into single policy
DO $$
BEGIN
    RAISE NOTICE 'Consolidating teacher_student_messages policies...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Users can manage their messages" ON teacher_student_messages;
    DROP POLICY IF EXISTS "Teachers can message students" ON teacher_student_messages;
    
    -- Create single consolidated policy
    CREATE POLICY "Users can access messages" ON teacher_student_messages
        FOR ALL USING (
            -- Users can manage messages they sent or received
            sender_id = (select auth.uid()) OR recipient_id = (select auth.uid())
        )
        WITH CHECK (
            -- Users can only send messages as themselves
            sender_id = (select auth.uid()) AND
            -- Teachers can only message their connected students
            (recipient_id IN (
                SELECT student_id FROM teacher_student_connections 
                WHERE teacher_id = (select auth.uid())
            ) OR 
            -- Students can message their connected teachers
            recipient_id IN (
                SELECT teacher_id FROM teacher_student_connections 
                WHERE student_id = (select auth.uid())
            ))
        );
END $$;

-- 7. CURRENT_STREAK TABLE - Consolidate into single policy
DO $$
BEGIN
    RAISE NOTICE 'Consolidating current_streak policies...';
    
    -- Drop separate policies  
    DROP POLICY IF EXISTS "Users can manage their streak" ON current_streak;
    DROP POLICY IF EXISTS "Service role can manage current streak" ON current_streak;
    
    -- Create single consolidated policy
    CREATE POLICY "Users can access current streak" ON current_streak
        FOR ALL USING (
            -- Users can manage their own streak
            student_id = (select auth.uid()) OR
            -- Service role can manage all streaks
            (select auth.role()) = 'service_role'
        );
END $$;

-- 8. HIGHEST_STREAK TABLE - Consolidate into single policy
DO $$
BEGIN
    RAISE NOTICE 'Consolidating highest_streak policies...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Users can manage their highest streak" ON highest_streak;
    DROP POLICY IF EXISTS "Service role can manage highest streak" ON highest_streak;
    
    -- Create single consolidated policy
    CREATE POLICY "Users can access highest streak" ON highest_streak
        FOR ALL USING (
            -- Users can manage their own highest streak
            student_id = (select auth.uid()) OR
            -- Service role can manage all highest streaks
            (select auth.role()) = 'service_role'
        );
END $$;

-- 9. STUDENTS TABLE - Consolidate into single policy
DO $$
BEGIN
    RAISE NOTICE 'Consolidating students policies...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Students can manage their profile" ON students;
    DROP POLICY IF EXISTS "Teachers can view enrolled students" ON students;
    DROP POLICY IF EXISTS "Service role can manage students" ON students;
    
    -- Create single consolidated policy
    CREATE POLICY "Users can access students" ON students
        FOR ALL USING (
            -- Students can manage their own profile
            id = (select auth.uid()) OR
            -- Teachers can view their connected students
            id IN (
                SELECT student_id FROM teacher_student_connections 
                WHERE teacher_id = (select auth.uid())
            ) OR
            -- Service role can manage all students
            (select auth.role()) = 'service_role'
        );
END $$;

-- 10. TEACHERS TABLE - Consolidate into single policy
DO $$
BEGIN
    RAISE NOTICE 'Consolidating teachers policies...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Teachers can manage their profile" ON teachers;
    DROP POLICY IF EXISTS "Service role can manage teachers" ON teachers;
    
    -- Create single consolidated policy
    CREATE POLICY "Users can access teachers" ON teachers
        FOR ALL USING (
            -- Teachers can manage their own profile
            id = (select auth.uid()) OR
            -- Service role can manage all teachers
            (select auth.role()) = 'service_role'
        );
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Multiple permissive policies fix completed!';
    RAISE NOTICE 'Consolidated all policies to eliminate multiple permissive policies warnings.';
    RAISE NOTICE 'This should dramatically reduce the warning count from 180.';
END $$; 