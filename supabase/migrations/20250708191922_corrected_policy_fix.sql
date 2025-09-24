-- Corrected RLS Policy Performance Fix
-- Use actual column names from the database schema

DO $$
BEGIN
    RAISE NOTICE 'Starting corrected RLS policy performance optimization...';
END $$;

-- 1. STUDENTS TABLE POLICIES
DO $$
BEGIN
    RAISE NOTICE 'Fixing students table policies...';
    
    -- Drop and recreate students policies with optimized auth patterns
    DROP POLICY IF EXISTS "Students can view their own profile" ON students;
    CREATE POLICY "Students can view their own profile" ON students
        FOR SELECT USING (id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Students can update their own profile" ON students;
    CREATE POLICY "Students can update their own profile" ON students
        FOR UPDATE USING (id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Students can insert their own profile" ON students;
    CREATE POLICY "Students can insert their own profile" ON students
        FOR INSERT WITH CHECK (id = (select auth.uid()));
END $$;

-- 2. TEACHERS TABLE POLICIES
DO $$
BEGIN
    RAISE NOTICE 'Fixing teachers table policies...';
    
    DROP POLICY IF EXISTS "Teachers can view their own profile" ON teachers;
    CREATE POLICY "Teachers can view their own profile" ON teachers
        FOR SELECT USING (id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;
    CREATE POLICY "Teachers can update their own profile" ON teachers
        FOR UPDATE USING (id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Teachers can insert their own profile" ON teachers;
    CREATE POLICY "Teachers can insert their own profile" ON teachers
        FOR INSERT WITH CHECK (id = (select auth.uid()));
END $$;

-- 3. STUDENTS_SCORE TABLE POLICIES
DO $$
BEGIN
    RAISE NOTICE 'Fixing students_score table policies...';
    
    DROP POLICY IF EXISTS "Students can view their own scores" ON students_score;
    CREATE POLICY "Students can view their own scores" ON students_score
        FOR SELECT USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Students can insert their own scores" ON students_score;
    CREATE POLICY "Students can insert their own scores" ON students_score
        FOR INSERT WITH CHECK (student_id = (select auth.uid()));
END $$;

-- 4. STUDENTS_TOTAL_SCORE TABLE POLICIES
DO $$
BEGIN
    RAISE NOTICE 'Fixing students_total_score table policies...';
    
    DROP POLICY IF EXISTS "Students can view their own total_score" ON students_total_score;
    CREATE POLICY "Students can view their own total_score" ON students_total_score
        FOR SELECT USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Students can insert their own total_score" ON students_total_score;
    CREATE POLICY "Students can insert their own total_score" ON students_total_score
        FOR INSERT WITH CHECK (student_id = (select auth.uid()));
        
    DROP POLICY IF EXISTS "Students can update their own total_score" ON students_total_score;
    CREATE POLICY "Students can update their own total_score" ON students_total_score
        FOR UPDATE USING (student_id = (select auth.uid()));
END $$;

-- 5. PRACTICE_SESSIONS TABLE POLICIES
DO $$
BEGIN
    RAISE NOTICE 'Fixing practice_sessions table policies...';
    
    DROP POLICY IF EXISTS "Students can view their own practice sessions" ON practice_sessions;
    CREATE POLICY "Students can view their own practice sessions" ON practice_sessions
        FOR SELECT USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Students can insert their own practice sessions" ON practice_sessions;
    CREATE POLICY "Students can insert their own practice sessions" ON practice_sessions
        FOR INSERT WITH CHECK (student_id = (select auth.uid()));
END $$;

-- 6. NOTIFICATIONS TABLE POLICIES (using recipient_id)
DO $$
BEGIN
    RAISE NOTICE 'Fixing notifications table policies...';
    
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
    CREATE POLICY "Users can view their own notifications" ON notifications
        FOR SELECT USING (recipient_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
    CREATE POLICY "Users can update their own notifications" ON notifications
        FOR UPDATE USING (recipient_id = (select auth.uid()));
        
    DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
    CREATE POLICY "Users can insert notifications" ON notifications
        FOR INSERT WITH CHECK (sender_id = (select auth.uid()));
END $$;

-- 7. CLASSES TABLE POLICIES
DO $$
BEGIN
    RAISE NOTICE 'Fixing classes table policies...';
    
    DROP POLICY IF EXISTS "Teachers can manage their own classes" ON classes;
    CREATE POLICY "Teachers can manage their own classes" ON classes
        FOR ALL USING (teacher_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON classes;
    CREATE POLICY "Students can view classes they're enrolled in" ON classes
        FOR SELECT USING (
            id IN (
                SELECT class_id FROM class_enrollments 
                WHERE student_id = (select auth.uid()) AND status = 'active'
            )
        );
END $$;

-- 8. ASSIGNMENTS TABLE POLICIES
DO $$
BEGIN
    RAISE NOTICE 'Fixing assignments table policies...';
    
    DROP POLICY IF EXISTS "Teachers can manage their own assignments" ON assignments;
    CREATE POLICY "Teachers can manage their own assignments" ON assignments
        FOR ALL USING (teacher_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Students can view assignments for their classes" ON assignments;
    CREATE POLICY "Students can view assignments for their classes" ON assignments
        FOR SELECT USING (
            class_id IN (
                SELECT class_id FROM class_enrollments 
                WHERE student_id = (select auth.uid()) AND status = 'active'
            ) OR class_id IS NULL -- Global assignments
        );
END $$;

-- 9. ASSIGNMENT_SUBMISSIONS TABLE POLICIES
DO $$
BEGIN
    RAISE NOTICE 'Fixing assignment_submissions table policies...';
    
    DROP POLICY IF EXISTS "Students can manage their own submissions" ON assignment_submissions;
    CREATE POLICY "Students can manage their own submissions" ON assignment_submissions
        FOR ALL USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON assignment_submissions;
    CREATE POLICY "Teachers can view submissions for their assignments" ON assignment_submissions
        FOR SELECT USING (
            assignment_id IN (
                SELECT id FROM assignments WHERE teacher_id = (select auth.uid())
            )
        );
    
    DROP POLICY IF EXISTS "Teachers can update submissions for their assignments" ON assignment_submissions;
    CREATE POLICY "Teachers can update submissions for their assignments" ON assignment_submissions
        FOR UPDATE USING (
            assignment_id IN (
                SELECT id FROM assignments WHERE teacher_id = (select auth.uid())
            )
        );
END $$;

-- 10. CLASS_ENROLLMENTS TABLE POLICIES
DO $$
BEGIN
    RAISE NOTICE 'Fixing class_enrollments table policies...';
    
    DROP POLICY IF EXISTS "Teachers can manage enrollments for their classes" ON class_enrollments;
    CREATE POLICY "Teachers can manage enrollments for their classes" ON class_enrollments
        FOR ALL USING (
            class_id IN (SELECT id FROM classes WHERE teacher_id = (select auth.uid()))
        );
    
    DROP POLICY IF EXISTS "Students can view their own enrollments" ON class_enrollments;
    CREATE POLICY "Students can view their own enrollments" ON class_enrollments
        FOR SELECT USING (student_id = (select auth.uid()));
END $$;

-- 11. TEACHER_STUDENT_MESSAGES TABLE POLICIES
DO $$
BEGIN
    RAISE NOTICE 'Fixing teacher_student_messages table policies...';
    
    DROP POLICY IF EXISTS "Users can view their own messages" ON teacher_student_messages;
    CREATE POLICY "Users can view their own messages" ON teacher_student_messages
        FOR SELECT USING (sender_id = (select auth.uid()) OR recipient_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Users can send messages" ON teacher_student_messages;
    CREATE POLICY "Users can send messages" ON teacher_student_messages
        FOR INSERT WITH CHECK (sender_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Users can update their own messages" ON teacher_student_messages;
    CREATE POLICY "Users can update their own messages" ON teacher_student_messages
        FOR UPDATE USING (sender_id = (select auth.uid()) OR recipient_id = (select auth.uid()));
END $$;

-- 12. STREAK TABLES POLICIES
DO $$
BEGIN
    RAISE NOTICE 'Fixing streak tables policies...';
    
    -- Current streak
    DROP POLICY IF EXISTS "Students can view their own current streak" ON current_streak;
    CREATE POLICY "Students can view their own current streak" ON current_streak
        FOR SELECT USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Students can update their own current streak" ON current_streak;
    CREATE POLICY "Students can update their own current streak" ON current_streak
        FOR UPDATE USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Students can insert their own current streak" ON current_streak;
    CREATE POLICY "Students can insert their own current streak" ON current_streak
        FOR INSERT WITH CHECK (student_id = (select auth.uid()));
    
    -- Highest streak
    DROP POLICY IF EXISTS "Students can view their own highest streak" ON highest_streak;
    CREATE POLICY "Students can view their own highest streak" ON highest_streak
        FOR SELECT USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Students can update their own highest streak" ON highest_streak;
    CREATE POLICY "Students can update their own highest streak" ON highest_streak
        FOR UPDATE USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Students can insert their own highest streak" ON highest_streak;
    CREATE POLICY "Students can insert their own highest streak" ON highest_streak
        FOR INSERT WITH CHECK (student_id = (select auth.uid()));
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Corrected RLS policy performance optimization completed!';
    RAISE NOTICE 'This should address the majority of auth.uid() performance warnings with correct column names.';
END $$; 