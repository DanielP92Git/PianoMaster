-- Fix Remaining 96 Multiple Permissive Policies Warnings
-- Target the specific tables that still have multiple policies after our first consolidation

DO $$
BEGIN
    RAISE NOTICE 'Fixing remaining 96 multiple permissive policies warnings...';
END $$;

-- 1. PRACTICE_SESSIONS TABLE - This one still has many policies, need to drop ALL and recreate
DO $$
BEGIN
    RAISE NOTICE 'Fixing practice_sessions table (major issue - 7+ policies)...';
    
    -- Drop ALL existing policies for practice_sessions
    DROP POLICY IF EXISTS "Service role can manage practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Students can insert practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Students can insert their own practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Users can access practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Enable users to view their own practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Students can view practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Students can view their practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Teachers can view connected students practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Teachers can view student practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Enable users to update their own practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Students can update practice sessions" ON practice_sessions;
    
    -- Create ONE consolidated policy for practice_sessions
    CREATE POLICY "Consolidated practice sessions access" ON practice_sessions
        FOR ALL USING (
            -- Students can manage their own practice sessions
            student_id = (select auth.uid()) OR
            -- Teachers can view/manage practice sessions for their connected students
            student_id IN (
                SELECT student_id FROM teacher_student_connections 
                WHERE teacher_id = (select auth.uid())
            ) OR
            -- Service role can manage all practice sessions
            (select auth.role()) = 'service_role'
        );
END $$;

-- 2. LAST_PRACTICED_DATE TABLE - Consolidate service role + user policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing last_practiced_date table...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Service role can manage practice dates" ON last_practiced_date;
    DROP POLICY IF EXISTS "Users can manage their practice date" ON last_practiced_date;
    
    -- Create single consolidated policy
    CREATE POLICY "Consolidated practice date access" ON last_practiced_date
        FOR ALL USING (
            -- Users can manage their own practice date
            student_id = (select auth.uid()) OR
            -- Service role can manage all practice dates
            (select auth.role()) = 'service_role'
        );
END $$;

-- 3. STUDENTS_SCORE TABLE - Consolidate service role + user policies  
DO $$
BEGIN
    RAISE NOTICE 'Fixing students_score table...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Service role can manage scores" ON students_score;
    DROP POLICY IF EXISTS "Users can manage their scores" ON students_score;
    
    -- Create single consolidated policy
    CREATE POLICY "Consolidated scores access" ON students_score
        FOR ALL USING (
            -- Users can manage their own scores
            student_id = (select auth.uid()) OR
            -- Service role can manage all scores
            (select auth.role()) = 'service_role'
        );
END $$;

-- 4. STUDENTS_TOTAL_SCORE TABLE - Consolidate service role + user policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing students_total_score table...';
    
    -- Drop separate policies  
    DROP POLICY IF EXISTS "Service role can manage total scores" ON students_total_score;
    DROP POLICY IF EXISTS "Users can manage their total scores" ON students_total_score;
    
    -- Create single consolidated policy
    CREATE POLICY "Consolidated total scores access" ON students_total_score
        FOR ALL USING (
            -- Users can manage their own total scores
            student_id = (select auth.uid()) OR
            -- Service role can manage all total scores
            (select auth.role()) = 'service_role'
        );
END $$;

-- 5. TEACHER_STUDENT_CONNECTIONS TABLE - Consolidate multiple connection policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing teacher_student_connections table...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Students can manage their connections" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Teachers can manage their connections" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Teachers can manage their own connections" ON teacher_student_connections;
    
    -- Create single consolidated policy
    CREATE POLICY "Consolidated connections access" ON teacher_student_connections
        FOR ALL USING (
            -- Students can manage connections where they are the student
            student_id = (select auth.uid()) OR
            -- Teachers can manage connections where they are the teacher
            teacher_id = (select auth.uid())
        );
END $$;

-- 6. TEACHER_STUDENT_MESSAGES TABLE - Consolidate message access policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing teacher_student_messages table...';
    
    -- Drop separate policies
    DROP POLICY IF EXISTS "Users can access messages" ON teacher_student_messages;
    DROP POLICY IF EXISTS "Users can send messages" ON teacher_student_messages;
    
    -- Create single consolidated policy
    CREATE POLICY "Consolidated messages access" ON teacher_student_messages
        FOR ALL USING (
            -- Users can access messages they sent or received
            sender_id = (select auth.uid()) OR recipient_id = (select auth.uid())
        )
        WITH CHECK (
            -- Users can only send messages as themselves
            sender_id = (select auth.uid()) AND
            -- Must be valid teacher-student relationship
            (
                (recipient_id IN (
                    SELECT student_id FROM teacher_student_connections 
                    WHERE teacher_id = (select auth.uid())
                )) OR 
                (recipient_id IN (
                    SELECT teacher_id FROM teacher_student_connections 
                    WHERE student_id = (select auth.uid())
                ))
            )
        );
END $$;

-- 7. Let's also check and fix any remaining issues with notifications if they exist
DO $$
BEGIN
    RAISE NOTICE 'Checking notifications table for any remaining issues...';
    
    -- Drop any duplicate notification policies that might exist
    DROP POLICY IF EXISTS "Users can manage their notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
    
    -- Create single consolidated policy for notifications
    CREATE POLICY "Consolidated notifications access" ON notifications
        FOR ALL USING (
            -- Users can manage their own notifications
            recipient_id = (select auth.uid())
        );
END $$;

-- 8. Check student_achievements table if it has issues
DO $$
BEGIN
    RAISE NOTICE 'Checking student_achievements table...';
    
    -- Drop any duplicate achievement policies
    DROP POLICY IF EXISTS "Users can view their achievements" ON student_achievements;
    DROP POLICY IF EXISTS "Users can manage their achievements" ON student_achievements;
    DROP POLICY IF EXISTS "Service role can manage achievements" ON student_achievements;
    
    -- Create single consolidated policy
    CREATE POLICY "Consolidated achievements access" ON student_achievements
        FOR ALL USING (
            -- Users can view their own achievements
            student_id = (select auth.uid()) OR
            -- Service role can manage all achievements
            (select auth.role()) = 'service_role'
        );
END $$;

-- 9. Check student_profiles table if it has issues
DO $$
BEGIN
    RAISE NOTICE 'Checking student_profiles table...';
    
    -- Drop any duplicate profile policies
    DROP POLICY IF EXISTS "Users can manage their profile" ON student_profiles;
    DROP POLICY IF EXISTS "Users can view their profile" ON student_profiles;
    DROP POLICY IF EXISTS "Service role can manage profiles" ON student_profiles;
    
    -- Create single consolidated policy
    CREATE POLICY "Consolidated profiles access" ON student_profiles
        FOR ALL USING (
            -- Users can manage their own profile
            student_id = (select auth.uid()) OR
            -- Service role can manage all profiles
            (select auth.role()) = 'service_role'
        );
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Remaining 96 warnings fix completed!';
    RAISE NOTICE 'Consolidated all remaining problematic tables.';
    RAISE NOTICE 'Expected dramatic reduction from 96 warnings.';
END $$; 