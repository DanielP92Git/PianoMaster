-- Comprehensive RLS Performance Optimization
-- Fix ALL remaining auth.uid() calls in RLS policies to resolve the 185 performance warnings
-- This migration addresses all unoptimized policies from earlier migrations

DO $$
BEGIN
    RAISE NOTICE 'Starting comprehensive RLS performance optimization for ALL remaining policies...';
    RAISE NOTICE 'This should fix all 185 remaining performance warnings';
END $$;

-- =============================================
-- OPTIMIZE TEACHERS TABLE POLICIES
-- =============================================

-- Drop and recreate all teachers table policies with optimization
DROP POLICY IF EXISTS "Teachers can select own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can update own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can insert own profile" ON teachers;

CREATE POLICY "Teachers can select own profile" ON teachers
    FOR SELECT USING (id = (select auth.uid()));

CREATE POLICY "Teachers can update own profile" ON teachers
    FOR UPDATE USING (id = (select auth.uid()));

CREATE POLICY "Teachers can insert own profile" ON teachers
    FOR INSERT WITH CHECK (id = (select auth.uid()));

-- =============================================
-- OPTIMIZE CLASSES TABLE POLICIES
-- =============================================

-- Drop and recreate all classes table policies with optimization
DROP POLICY IF EXISTS "Teachers can select their classes" ON classes;
DROP POLICY IF EXISTS "Teachers can insert their classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update their classes" ON classes;
DROP POLICY IF EXISTS "Teachers can delete their classes" ON classes;

CREATE POLICY "Teachers can select their classes" ON classes
    FOR SELECT USING (teacher_id = (select auth.uid()));

CREATE POLICY "Teachers can insert their classes" ON classes
    FOR INSERT WITH CHECK (teacher_id = (select auth.uid()));

CREATE POLICY "Teachers can update their classes" ON classes
    FOR UPDATE USING (teacher_id = (select auth.uid()));

CREATE POLICY "Teachers can delete their classes" ON classes
    FOR DELETE USING (teacher_id = (select auth.uid()));

-- =============================================
-- OPTIMIZE CLASS_ENROLLMENTS TABLE POLICIES
-- =============================================

-- Drop and recreate class_enrollments policies with optimization
DROP POLICY IF EXISTS "Students can view their own enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Students can update their enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Teachers can view enrollments for their classes" ON class_enrollments;

CREATE POLICY "Students can view their own enrollments" ON class_enrollments
    FOR SELECT USING (student_id = (select auth.uid()));

CREATE POLICY "Students can update their enrollments" ON class_enrollments
    FOR UPDATE USING (student_id = (select auth.uid()))
    WITH CHECK (student_id = (select auth.uid()));

CREATE POLICY "Teachers can view enrollments for their classes" ON class_enrollments
    FOR SELECT USING (
        class_id IN (SELECT id FROM classes WHERE teacher_id = (select auth.uid()))
    );

-- =============================================
-- OPTIMIZE ASSIGNMENTS TABLE POLICIES
-- =============================================

-- Drop and recreate assignments policies with optimization
DROP POLICY IF EXISTS "Students can view assignments for enrolled classes" ON assignments;
DROP POLICY IF EXISTS "Teachers can manage their assignments" ON assignments;

CREATE POLICY "Students can view assignments for enrolled classes" ON assignments
    FOR SELECT USING (
        class_id IN (SELECT class_id FROM class_enrollments 
                    WHERE student_id = (select auth.uid()) AND status = 'active')
    );

CREATE POLICY "Teachers can manage their assignments" ON assignments
    FOR ALL USING (teacher_id = (select auth.uid()));

-- =============================================
-- OPTIMIZE ASSIGNMENT_SUBMISSIONS TABLE POLICIES
-- =============================================

-- Drop and recreate assignment_submissions policies with optimization
DROP POLICY IF EXISTS "Students can view their submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Students can manage their submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON assignment_submissions;

CREATE POLICY "Students can view their submissions" ON assignment_submissions
    FOR SELECT USING (
        student_id = (select auth.uid()) OR
        assignment_id IN (SELECT id FROM assignments WHERE teacher_id = (select auth.uid()))
    );

CREATE POLICY "Students can manage their submissions" ON assignment_submissions
    FOR ALL USING (student_id = (select auth.uid()));

CREATE POLICY "Teachers can view submissions for their assignments" ON assignment_submissions
    FOR SELECT USING (
        assignment_id IN (SELECT id FROM assignments WHERE teacher_id = (select auth.uid()))
    );

-- =============================================
-- OPTIMIZE NOTIFICATIONS TABLE POLICIES
-- =============================================

-- Drop and recreate notifications policies with optimization
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Teachers can send notifications to their students" ON notifications;
DROP POLICY IF EXISTS "Users can view and update their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can send and receive notifications" ON notifications;

CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (recipient_id = (select auth.uid()));

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (recipient_id = (select auth.uid()));

CREATE POLICY "Teachers can send notifications to their students" ON notifications
    FOR INSERT WITH CHECK (
        sender_id = (select auth.uid()) AND
        recipient_id IN (
            SELECT ce.student_id FROM class_enrollments ce
            JOIN classes c ON c.id = ce.class_id
            WHERE c.teacher_id = (select auth.uid()) AND ce.status = 'active'
        ) OR recipient_id = (select auth.uid())
    );

CREATE POLICY "Users can send and receive notifications" ON notifications
    FOR SELECT USING (sender_id = (select auth.uid()) OR recipient_id = (select auth.uid()));

CREATE POLICY "Users can send notifications" ON notifications
    FOR INSERT WITH CHECK (sender_id = (select auth.uid()));

CREATE POLICY "Users can update sent notifications" ON notifications
    FOR UPDATE USING (sender_id = (select auth.uid()));

-- =============================================
-- OPTIMIZE STUDENTS TABLE POLICIES (Extended)
-- =============================================

-- Drop and recreate any remaining students policies
DROP POLICY IF EXISTS "Students can view own profile" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;
DROP POLICY IF EXISTS "Students can insert own profile" ON students;
DROP POLICY IF EXISTS "Teachers can view enrolled students" ON students;

CREATE POLICY "Students can view own profile" ON students
    FOR SELECT USING (id = (select auth.uid()));

CREATE POLICY "Students can update own profile" ON students
    FOR UPDATE USING (id = (select auth.uid()));

CREATE POLICY "Students can insert own profile" ON students
    FOR INSERT WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Teachers can view enrolled students" ON students
    FOR SELECT USING (
        (select auth.uid()) IN (
            SELECT teacher_id FROM teacher_student_connections 
            WHERE student_id = students.id AND status = 'accepted'
        ) OR
        (select auth.uid()) IN (SELECT id FROM teachers WHERE is_active = true)
    );

-- =============================================
-- OPTIMIZE CURRENT_STREAK TABLE POLICIES
-- =============================================

-- Drop and recreate current_streak policies with optimization
DROP POLICY IF EXISTS "Users can manage their streak" ON current_streak;

CREATE POLICY "Users can manage their streak" ON current_streak
    FOR ALL USING (student_id = (select auth.uid()));

-- =============================================
-- OPTIMIZE PRACTICE_RECORDINGS TABLE POLICIES
-- =============================================

-- Drop and recreate practice_recordings policies with optimization (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_recordings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Students can manage their recordings" ON practice_recordings';
        EXECUTE 'CREATE POLICY "Students can manage their recordings" ON practice_recordings
                 FOR ALL USING (student_id = (select auth.uid()))';
        
        EXECUTE 'DROP POLICY IF EXISTS "Teachers can view student recordings" ON practice_recordings';
        EXECUTE 'CREATE POLICY "Teachers can view student recordings" ON practice_recordings
                 FOR SELECT USING (
                     (select auth.uid()) IN (
                         SELECT teacher_id FROM teacher_student_connections 
                         WHERE student_id = practice_recordings.student_id AND status = ''accepted''
                     )
                 )';
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Comprehensive RLS performance optimization completed!';
    RAISE NOTICE 'All remaining auth.uid() calls have been replaced with (select auth.uid())';
    RAISE NOTICE 'This should resolve all 185 performance warnings';
    RAISE NOTICE 'Check Supabase Performance Advisor in 10-15 minutes for updated metrics';
END $$; 