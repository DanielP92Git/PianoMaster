-- Fix Policy Conflicts
-- Drop any remaining conflicting policies that weren't handled in the previous migration

DO $$
BEGIN
    RAISE NOTICE 'Fixing policy conflicts...';
END $$;

-- Drop any remaining conflicting policies
DO $$
BEGIN
    RAISE NOTICE 'Dropping remaining conflicting policies...';
    
    -- Drop existing policies that might conflict
    DROP POLICY IF EXISTS "Students can manage their profile" ON students;
    DROP POLICY IF EXISTS "Teachers can manage their profile" ON teachers;
    DROP POLICY IF EXISTS "Students can view their enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can manage class enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can manage their assignments" ON assignments;
    DROP POLICY IF EXISTS "Students can view class assignments" ON assignments;
    DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
END $$;

-- Now create the consolidated policies
DO $$
BEGIN
    RAISE NOTICE 'Creating consolidated policies...';
    
    -- Students table
    CREATE POLICY "Students can manage their profile" ON students
        FOR ALL USING (id = (select auth.uid()));
    
    -- Teachers table
    CREATE POLICY "Teachers can manage their profile" ON teachers
        FOR ALL USING (id = (select auth.uid()));
    
    -- Class enrollments
    CREATE POLICY "Students can view their enrollments" ON class_enrollments
        FOR SELECT USING (student_id = (select auth.uid()));
    
    CREATE POLICY "Teachers can manage class enrollments" ON class_enrollments
        FOR ALL USING (
            class_id IN (SELECT id FROM classes WHERE teacher_id = (select auth.uid()))
        );
    
    -- Assignments
    CREATE POLICY "Teachers can manage their assignments" ON assignments
        FOR ALL USING (teacher_id = (select auth.uid()));
    
    CREATE POLICY "Students can view class assignments" ON assignments
        FOR SELECT USING (
            class_id IN (
                SELECT class_id FROM class_enrollments 
                WHERE student_id = (select auth.uid()) AND status = 'active'
            ) OR class_id IS NULL
        );
    
    -- Notifications
    CREATE POLICY "Users can view their notifications" ON notifications
        FOR SELECT USING (recipient_id = (select auth.uid()));
    
    CREATE POLICY "Users can update their notifications" ON notifications
        FOR UPDATE USING (recipient_id = (select auth.uid()));
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Policy conflicts fixed and consolidated policies created!';
END $$; 