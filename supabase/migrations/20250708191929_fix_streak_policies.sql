-- Fix Streak Policies and Complete Cleanup
-- Handle the conflicts that prevented the previous migration from completing

DO $$
BEGIN
    RAISE NOTICE 'Fixing streak policies and completing cleanup...';
END $$;

-- Fix current_streak table policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing current_streak table policies...';
    
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can manage their streak" ON current_streak;
    DROP POLICY IF EXISTS "Users can update their own streak" ON current_streak;
    DROP POLICY IF EXISTS "Users can view their own streak" ON current_streak;
    DROP POLICY IF EXISTS "Users can insert their own streak" ON current_streak;
    
    -- Create clean optimized policy
    CREATE POLICY "Users can manage their streak" ON current_streak
        FOR ALL USING (student_id = (select auth.uid()));
END $$;

-- Fix highest_streak table policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing highest_streak table policies...';
    
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can manage their highest streak" ON highest_streak;
    DROP POLICY IF EXISTS "Users can update their own highest streak" ON highest_streak;
    DROP POLICY IF EXISTS "Users can view their own highest streak" ON highest_streak;
    DROP POLICY IF EXISTS "Users can insert their own highest streak" ON highest_streak;
    
    -- Create clean optimized policy
    CREATE POLICY "Users can manage their highest streak" ON highest_streak
        FOR ALL USING (student_id = (select auth.uid()));
END $$;

-- Fix notifications table policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing notifications table policies...';
    
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Teachers can create notifications for their students" ON notifications;
    DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
    DROP POLICY IF EXISTS "Teachers can create notifications" ON notifications;
    
    -- Create clean optimized policies
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

-- Fix teacher_student_connections table policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing teacher_student_connections table policies...';
    
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Allow teacher and student access" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Teachers can view their connections" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Students can view their connections" ON teacher_student_connections;
    
    -- Create clean optimized policy
    CREATE POLICY "Allow teacher and student access" ON teacher_student_connections
        FOR SELECT USING (teacher_id = (select auth.uid()) OR student_id = (select auth.uid()));
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Streak policies and cleanup completed successfully!';
END $$; 