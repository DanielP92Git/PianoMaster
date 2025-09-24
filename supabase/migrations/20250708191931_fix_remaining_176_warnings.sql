-- Fix Remaining 176 Performance Warnings
-- Address auth RLS optimization and massive multiple permissive policies

DO $$
BEGIN
    RAISE NOTICE 'Fixing remaining 176 performance warnings...';
END $$;

-- 1. STUDENT_ACHIEVEMENTS TABLE - Fix auth optimizations
DO $$
BEGIN
    RAISE NOTICE 'Fixing student_achievements table auth optimizations...';
    
    -- The warnings show these specific policies need fixing
    DROP POLICY IF EXISTS "System can insert achievements" ON student_achievements;
    DROP POLICY IF EXISTS "Users can view own achievements" ON student_achievements;
    
    -- Create optimized policies
    CREATE POLICY "System can insert achievements" ON student_achievements
        FOR INSERT WITH CHECK (true); -- System policy, no auth needed
    
    CREATE POLICY "Users can view own achievements" ON student_achievements
        FOR SELECT USING (student_id = (select auth.uid()));
END $$;

-- 2. STUDENT_PROFILES TABLE - Fix auth optimizations
DO $$
BEGIN
    RAISE NOTICE 'Fixing student_profiles table auth optimizations...';
    
    -- The warnings show these specific policies need fixing
    DROP POLICY IF EXISTS "Users can delete own profile" ON student_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON student_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON student_profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON student_profiles;
    
    -- Create single optimized policy
    CREATE POLICY "Users can manage own profile" ON student_profiles
        FOR ALL USING (student_id = (select auth.uid()));
END $$;

-- 3. STUDENTS TABLE - Fix auth.role() optimization
DO $$
BEGIN
    RAISE NOTICE 'Fixing students table auth.role() optimization...';
    
    DROP POLICY IF EXISTS "Service role can manage students" ON students;
    CREATE POLICY "Service role can manage students" ON students
        FOR ALL USING ((select auth.role()) = 'service_role');
END $$;

-- 4. TEACHERS TABLE - Fix auth.role() optimization
DO $$
BEGIN
    RAISE NOTICE 'Fixing teachers table auth.role() optimization...';
    
    DROP POLICY IF EXISTS "Service role can manage teachers" ON teachers;
    CREATE POLICY "Service role can manage teachers" ON teachers
        FOR ALL USING ((select auth.role()) = 'service_role');
END $$;

-- 5. CLASSES TABLE - MASSIVE MULTIPLE PERMISSIVE POLICIES (4 SELECT policies!)
DO $$
BEGIN
    RAISE NOTICE 'Fixing classes table - removing 4 multiple permissive SELECT policies...';
    
    -- Drop ALL existing policies causing multiple permissive issues
    DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON classes;
    DROP POLICY IF EXISTS "Students can view enrolled classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can manage their classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can select their classes" ON classes;
    DROP POLICY IF EXISTS "Students can view their classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can view their classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can update their classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can delete their classes" ON classes;
    
    -- Create ONLY 2 clean policies
    CREATE POLICY "Students can view enrolled classes" ON classes
        FOR SELECT USING (
            id IN (
                SELECT class_id FROM class_enrollments 
                WHERE student_id = (select auth.uid()) AND status = 'active'
            )
        );
    
    CREATE POLICY "Teachers can manage their classes" ON classes
        FOR ALL USING (teacher_id = (select auth.uid()));
END $$;

-- 6. CURRENT_STREAK TABLE - MASSIVE MULTIPLE PERMISSIVE POLICIES (4 SELECT policies!)
DO $$
BEGIN
    RAISE NOTICE 'Fixing current_streak table - removing 4 multiple permissive SELECT policies...';
    
    -- Drop ALL existing policies causing multiple permissive issues
    DROP POLICY IF EXISTS "Enable users to view their own current streak" ON current_streak;
    DROP POLICY IF EXISTS "Service role can manage current streak" ON current_streak;
    DROP POLICY IF EXISTS "Students can view their own current streak" ON current_streak;
    DROP POLICY IF EXISTS "Users can manage their streak" ON current_streak;
    DROP POLICY IF EXISTS "Enable users to update their own current streak" ON current_streak;
    DROP POLICY IF EXISTS "Students can update their own current streak" ON current_streak;
    DROP POLICY IF EXISTS "Students can insert their own current streak" ON current_streak;
    DROP POLICY IF EXISTS "Students can delete their own current streak" ON current_streak;
    
    -- Create ONLY 2 clean policies
    CREATE POLICY "Users can manage their streak" ON current_streak
        FOR ALL USING (student_id = (select auth.uid()));
    
    CREATE POLICY "Service role can manage current streak" ON current_streak
        FOR ALL USING ((select auth.role()) = 'service_role');
END $$;

-- 7. HIGHEST_STREAK TABLE - Fix multiple permissive policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing highest_streak table - removing multiple permissive policies...';
    
    -- Drop ALL existing policies
    DROP POLICY IF EXISTS "Enable users to view their own highest streak" ON highest_streak;
    DROP POLICY IF EXISTS "Service role can manage highest streak" ON highest_streak;
    DROP POLICY IF EXISTS "Students can view their own highest streak" ON highest_streak;
    DROP POLICY IF EXISTS "Users can manage their highest streak" ON highest_streak;
    DROP POLICY IF EXISTS "Enable users to update their own highest streak" ON highest_streak;
    DROP POLICY IF EXISTS "Students can update their own highest streak" ON highest_streak;
    DROP POLICY IF EXISTS "Students can insert their own highest streak" ON highest_streak;
    DROP POLICY IF EXISTS "Students can delete their own highest streak" ON highest_streak;
    
    -- Create ONLY 2 clean policies
    CREATE POLICY "Users can manage their highest streak" ON highest_streak
        FOR ALL USING (student_id = (select auth.uid()));
    
    CREATE POLICY "Service role can manage highest streak" ON highest_streak
        FOR ALL USING ((select auth.role()) = 'service_role');
END $$;

-- 8. ASSIGNMENT_SUBMISSIONS TABLE - Fix remaining multiple permissive policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing assignment_submissions table - removing remaining multiple permissive policies...';
    
    -- Drop ALL existing policies
    DROP POLICY IF EXISTS "Students can manage their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Teachers can view assignment submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Teachers can update their assignment submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Teachers can manage their assignment submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Students can view their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Students can update their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Students can insert their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Students can delete their submissions" ON assignment_submissions;
    
    -- Create ONLY 2 clean policies
    CREATE POLICY "Students can manage their submissions" ON assignment_submissions
        FOR ALL USING (student_id = (select auth.uid()));
    
    CREATE POLICY "Teachers can view assignment submissions" ON assignment_submissions
        FOR SELECT USING (
            assignment_id IN (
                SELECT id FROM assignments WHERE teacher_id = (select auth.uid())
            )
        );
END $$;

-- 9. STUDENTS_SCORE TABLE - Fix auth optimization and multiple permissive policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing students_score table...';
    
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can manage their scores" ON students_score;
    DROP POLICY IF EXISTS "Users can view their own scores" ON students_score;
    DROP POLICY IF EXISTS "Users can update their own scores" ON students_score;
    DROP POLICY IF EXISTS "Users can insert their own scores" ON students_score;
    DROP POLICY IF EXISTS "Users can delete their own scores" ON students_score;
    DROP POLICY IF EXISTS "Service role can manage scores" ON students_score;
    DROP POLICY IF EXISTS "Students can view their scores" ON students_score;
    DROP POLICY IF EXISTS "Students can update their scores" ON students_score;
    DROP POLICY IF EXISTS "Students can insert their scores" ON students_score;
    DROP POLICY IF EXISTS "Students can delete their scores" ON students_score;
    
    -- Create ONLY 2 clean policies
    CREATE POLICY "Users can manage their scores" ON students_score
        FOR ALL USING (student_id = (select auth.uid()));
    
    CREATE POLICY "Service role can manage scores" ON students_score
        FOR ALL USING ((select auth.role()) = 'service_role');
END $$;

-- 10. STUDENTS_TOTAL_SCORE TABLE - Fix auth optimization and multiple permissive policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing students_total_score table...';
    
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can manage their total scores" ON students_total_score;
    DROP POLICY IF EXISTS "Users can view their own total scores" ON students_total_score;
    DROP POLICY IF EXISTS "Users can update their own total scores" ON students_total_score;
    DROP POLICY IF EXISTS "Users can insert their own total scores" ON students_total_score;
    DROP POLICY IF EXISTS "Users can delete their own total scores" ON students_total_score;
    DROP POLICY IF EXISTS "Service role can manage total scores" ON students_total_score;
    DROP POLICY IF EXISTS "Students can view their total scores" ON students_total_score;
    DROP POLICY IF EXISTS "Students can update their total scores" ON students_total_score;
    DROP POLICY IF EXISTS "Students can insert their total scores" ON students_total_score;
    DROP POLICY IF EXISTS "Students can delete their total scores" ON students_total_score;
    
    -- Create ONLY 2 clean policies
    CREATE POLICY "Users can manage their total scores" ON students_total_score
        FOR ALL USING (student_id = (select auth.uid()));
    
    CREATE POLICY "Service role can manage total scores" ON students_total_score
        FOR ALL USING ((select auth.role()) = 'service_role');
END $$;

-- 11. LAST_PRACTICED_DATE TABLE - Fix auth optimization and multiple permissive policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing last_practiced_date table...';
    
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can manage their practice date" ON last_practiced_date;
    DROP POLICY IF EXISTS "Users can update their own practice date" ON last_practiced_date;
    DROP POLICY IF EXISTS "Users can view their own practice date" ON last_practiced_date;
    DROP POLICY IF EXISTS "Users can insert their own practice date" ON last_practiced_date;
    DROP POLICY IF EXISTS "Users can delete their own practice date" ON last_practiced_date;
    DROP POLICY IF EXISTS "Service role can manage practice dates" ON last_practiced_date;
    DROP POLICY IF EXISTS "Students can view their practice date" ON last_practiced_date;
    DROP POLICY IF EXISTS "Students can update their practice date" ON last_practiced_date;
    DROP POLICY IF EXISTS "Students can insert their practice date" ON last_practiced_date;
    DROP POLICY IF EXISTS "Students can delete their practice date" ON last_practiced_date;
    
    -- Create ONLY 2 clean policies
    CREATE POLICY "Users can manage their practice date" ON last_practiced_date
        FOR ALL USING (student_id = (select auth.uid()));
    
    CREATE POLICY "Service role can manage practice dates" ON last_practiced_date
        FOR ALL USING ((select auth.role()) = 'service_role');
END $$;

-- 12. NOTIFICATIONS TABLE - Fix auth optimization and multiple permissive policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing notifications table...';
    
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
    DROP POLICY IF EXISTS "Teachers can create notifications" ON notifications;
    DROP POLICY IF EXISTS "Teachers can create notifications for their students" ON notifications;
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can delete notifications" ON notifications;
    DROP POLICY IF EXISTS "Service role can manage notifications" ON notifications;
    
    -- Create ONLY 3 clean policies
    CREATE POLICY "Users can view their notifications" ON notifications
        FOR SELECT USING (recipient_id = (select auth.uid()));
    
    CREATE POLICY "Users can update their notifications" ON notifications
        FOR UPDATE USING (recipient_id = (select auth.uid()));
        
    CREATE POLICY "Teachers can create notifications" ON notifications
        FOR INSERT WITH CHECK (
            sender_id = (select auth.uid()) AND
            recipient_id IN (
                SELECT student_id FROM teacher_student_connections 
                WHERE teacher_id = (select auth.uid())
            )
        );
END $$;

-- 13. TEACHER_STUDENT_CONNECTIONS TABLE - Fix auth optimization
DO $$
BEGIN
    RAISE NOTICE 'Fixing teacher_student_connections table...';
    
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Allow teacher and student access" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Teachers can view their connections" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Students can view their connections" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Teachers can manage connections" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Students can view connections" ON teacher_student_connections;
    
    -- Create ONLY 1 clean policy
    CREATE POLICY "Allow teacher and student access" ON teacher_student_connections
        FOR SELECT USING (teacher_id = (select auth.uid()) OR student_id = (select auth.uid()));
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Remaining 176 warnings fix completed!';
    RAISE NOTICE 'Fixed auth RLS optimizations and removed massive multiple permissive policies.';
    RAISE NOTICE 'This should dramatically reduce the warning count from 176.';
END $$; 