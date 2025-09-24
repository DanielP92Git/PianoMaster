-- Targeted RLS Performance Fix
-- Simple approach: fix the specific policies we know are causing the 212 performance warnings
-- Based on the grep search results showing unoptimized auth.uid() calls

DO $$
BEGIN
    RAISE NOTICE 'Starting targeted RLS performance fix...';
    RAISE NOTICE 'Fixing specific policies causing the 212 performance warnings';
END $$;

-- =============================================
-- FIX POLICIES FROM 20250708191912 MIGRATION
-- =============================================

-- These policies were created with unoptimized auth.uid() calls
DROP POLICY IF EXISTS "Students can insert their own score" ON students_total_score;
CREATE POLICY "Students can insert their own score" ON students_total_score
    FOR INSERT WITH CHECK (student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can update their own score" ON students_total_score;
CREATE POLICY "Students can update their own score" ON students_total_score
    FOR UPDATE USING (student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can view their own scores" ON students_score;
CREATE POLICY "Students can view their own scores" ON students_score
    FOR SELECT USING (student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can insert their own scores" ON students_score;
CREATE POLICY "Students can insert their own scores" ON students_score
    FOR INSERT WITH CHECK (student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Teachers can view connected students scores" ON students_score;
CREATE POLICY "Teachers can view connected students scores" ON students_score
    FOR SELECT USING (
        (select auth.uid()) IN (
            SELECT teacher_id FROM teacher_student_connections 
            WHERE student_id = students_score.student_id AND status = 'accepted'
        )
    );

-- =============================================
-- FIX POLICIES FROM 20250625120002 MIGRATION
-- =============================================

-- Fix teacher profile policies
DROP POLICY IF EXISTS "Teachers can select own profile" ON teachers;
CREATE POLICY "Teachers can select own profile" ON teachers
    FOR SELECT USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Teachers can update own profile" ON teachers;
CREATE POLICY "Teachers can update own profile" ON teachers
    FOR UPDATE USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Teachers can insert own profile" ON teachers;
CREATE POLICY "Teachers can insert own profile" ON teachers
    FOR INSERT WITH CHECK (id = (select auth.uid()));

-- Fix class management policies
DROP POLICY IF EXISTS "Teachers can select their classes" ON classes;
CREATE POLICY "Teachers can select their classes" ON classes
    FOR SELECT USING (teacher_id = (select auth.uid()));

DROP POLICY IF EXISTS "Teachers can insert their classes" ON classes;
CREATE POLICY "Teachers can insert their classes" ON classes
    FOR INSERT WITH CHECK (teacher_id = (select auth.uid()));

DROP POLICY IF EXISTS "Teachers can update their classes" ON classes;
CREATE POLICY "Teachers can update their classes" ON classes
    FOR UPDATE USING (teacher_id = (select auth.uid()));

DROP POLICY IF EXISTS "Teachers can delete their classes" ON classes;
CREATE POLICY "Teachers can delete their classes" ON classes
    FOR DELETE USING (teacher_id = (select auth.uid()));

-- Fix student policies
DROP POLICY IF EXISTS "Students can view their own enrollments" ON class_enrollments;
CREATE POLICY "Students can view their own enrollments" ON class_enrollments
    FOR SELECT USING (student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can update their enrollments" ON class_enrollments;
CREATE POLICY "Students can update their enrollments" ON class_enrollments
    FOR UPDATE USING (student_id = (select auth.uid()))
    WITH CHECK (student_id = (select auth.uid()));

-- Fix notification policies
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (recipient_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (recipient_id = (select auth.uid()));

-- =============================================
-- FIX ADDITIONAL PROBLEMATIC POLICIES
-- =============================================

-- Fix any remaining students table policies
DROP POLICY IF EXISTS "Students can view own profile" ON students;
CREATE POLICY "Students can view own profile" ON students
    FOR SELECT USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can update own profile" ON students;
CREATE POLICY "Students can update own profile" ON students
    FOR UPDATE USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can insert own profile" ON students;
CREATE POLICY "Students can insert own profile" ON students
    FOR INSERT WITH CHECK (id = (select auth.uid()));

-- Fix practice sessions policies
DROP POLICY IF EXISTS "Students can view practice sessions" ON practice_sessions;
CREATE POLICY "Students can view practice sessions" ON practice_sessions
    FOR SELECT USING (student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can insert practice sessions" ON practice_sessions;
CREATE POLICY "Students can insert practice sessions" ON practice_sessions
    FOR INSERT WITH CHECK (student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can update practice sessions" ON practice_sessions;
CREATE POLICY "Students can update practice sessions" ON practice_sessions
    FOR UPDATE USING (student_id = (select auth.uid()));

-- Fix teacher-student connection policies
DROP POLICY IF EXISTS "Students can manage their connections" ON teacher_student_connections;
CREATE POLICY "Students can manage their connections" ON teacher_student_connections
    FOR ALL USING (student_id = (select auth.uid()));

DROP POLICY IF EXISTS "Teachers can manage their connections" ON teacher_student_connections;
CREATE POLICY "Teachers can manage their connections" ON teacher_student_connections
    FOR ALL USING (teacher_id = (select auth.uid()));

DO $$
BEGIN
    RAISE NOTICE 'Targeted RLS performance fix completed!';
    RAISE NOTICE 'Fixed all known policies with unoptimized auth.uid() calls';
    RAISE NOTICE 'This should significantly reduce the 212 performance warnings';
    RAISE NOTICE 'Check Performance Advisor in 15-20 minutes for results';
END $$; 