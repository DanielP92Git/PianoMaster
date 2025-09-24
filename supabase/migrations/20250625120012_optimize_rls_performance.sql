-- Optimize RLS Policy Performance
-- Replace auth.uid() with (select auth.uid()) to improve query performance at scale
-- This prevents re-evaluation of auth functions for each row

DO $$
BEGIN
    RAISE NOTICE 'Starting RLS performance optimization...';
    RAISE NOTICE 'Replacing auth.uid() with (select auth.uid()) in RLS policies...';
END $$;

-- =============================================
-- OPTIMIZE STUDENTS_SCORE TABLE POLICIES
-- =============================================

-- Drop and recreate students_score policies with performance optimization
DROP POLICY IF EXISTS "Students can view their own scores" ON students_score;
DROP POLICY IF EXISTS "Students can insert their own scores" ON students_score;
DROP POLICY IF EXISTS "Teachers can view connected students scores" ON students_score;
DROP POLICY IF EXISTS "Service role can manage scores" ON students_score;

-- Optimized students_score policies
CREATE POLICY "Students can view their own scores" ON students_score
    FOR SELECT USING (student_id = (select auth.uid()));

CREATE POLICY "Students can insert their own scores" ON students_score
    FOR INSERT WITH CHECK (student_id = (select auth.uid()));

CREATE POLICY "Teachers can view connected students scores" ON students_score
    FOR SELECT USING (
        (select auth.uid()) IN (
            SELECT teacher_id FROM teacher_student_connections 
            WHERE student_id = students_score.student_id AND status = 'accepted'
        )
    );

CREATE POLICY "Service role can manage scores" ON students_score
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- =============================================
-- OPTIMIZE STUDENTS_TOTAL_SCORE TABLE POLICIES
-- =============================================

-- Drop and recreate students_total_score policies with performance optimization
DROP POLICY IF EXISTS "Students can insert their own score" ON students_total_score;
DROP POLICY IF EXISTS "Students can update their own score" ON students_total_score;

-- Optimized students_total_score policies
CREATE POLICY "Students can insert their own score" ON students_total_score
    FOR INSERT WITH CHECK (student_id = (select auth.uid()));

CREATE POLICY "Students can update their own score" ON students_total_score
    FOR UPDATE USING (student_id = (select auth.uid()));

-- =============================================
-- OPTIMIZE STUDENTS TABLE POLICIES
-- =============================================

-- Drop and recreate students table policies with performance optimization
DROP POLICY IF EXISTS "Students can view their own profile" ON students;
DROP POLICY IF EXISTS "Students can update their own profile" ON students;
DROP POLICY IF EXISTS "Students can insert their own profile" ON students;
DROP POLICY IF EXISTS "Teachers can view connected students" ON students;
DROP POLICY IF EXISTS "Teachers can create students" ON students;

-- Optimized students table policies
CREATE POLICY "Students can view their own profile" ON students
    FOR SELECT USING (id = (select auth.uid()));

CREATE POLICY "Students can update their own profile" ON students
    FOR UPDATE USING (id = (select auth.uid()));

CREATE POLICY "Students can insert their own profile" ON students
    FOR INSERT WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Teachers can view connected students" ON students
    FOR SELECT USING (
        (select auth.uid()) IN (
            SELECT teacher_id FROM teacher_student_connections 
            WHERE student_id = students.id AND status = 'accepted'
        )
    );

CREATE POLICY "Teachers can create students" ON students
    FOR INSERT WITH CHECK (
        (select auth.uid()) IN (SELECT id FROM teachers WHERE is_active = true)
    );

-- =============================================
-- OPTIMIZE TEACHERS TABLE POLICIES
-- =============================================

-- Drop and recreate teachers table policies with performance optimization
DROP POLICY IF EXISTS "Teachers can view own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can update own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can insert own profile" ON teachers;

-- Optimized teachers table policies
CREATE POLICY "Teachers can view own profile" ON teachers
    FOR SELECT USING (id = (select auth.uid()));

CREATE POLICY "Teachers can update own profile" ON teachers
    FOR UPDATE USING (id = (select auth.uid()));

CREATE POLICY "Teachers can insert own profile" ON teachers
    FOR INSERT WITH CHECK (id = (select auth.uid()));

-- =============================================
-- OPTIMIZE CLASSES TABLE POLICIES
-- =============================================

-- Drop and recreate classes table policies with performance optimization
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update their classes" ON classes;
DROP POLICY IF EXISTS "Teachers can delete their classes" ON classes;

-- Optimized classes table policies
CREATE POLICY "Teachers can manage their own classes" ON classes
    FOR ALL USING (teacher_id = (select auth.uid()));

CREATE POLICY "Teachers can create classes" ON classes
    FOR INSERT WITH CHECK (teacher_id = (select auth.uid()));

CREATE POLICY "Teachers can update their classes" ON classes
    FOR UPDATE USING (teacher_id = (select auth.uid()));

CREATE POLICY "Teachers can delete their classes" ON classes
    FOR DELETE USING (teacher_id = (select auth.uid()));

-- =============================================
-- OPTIMIZE TEACHER_STUDENT_CONNECTIONS TABLE POLICIES
-- =============================================

-- Drop and recreate teacher_student_connections policies with performance optimization
DROP POLICY IF EXISTS "Teachers can manage their own connections" ON teacher_student_connections;
DROP POLICY IF EXISTS "Teachers can view their connections" ON teacher_student_connections;

-- Optimized teacher_student_connections policies
CREATE POLICY "Teachers can manage their own connections" ON teacher_student_connections
    FOR ALL USING (
        (select auth.uid()) = teacher_id OR 
        (select auth.uid()) = student_id
    );

CREATE POLICY "Teachers can view their connections" ON teacher_student_connections
    FOR SELECT USING (
        (select auth.uid()) = teacher_id OR 
        (select auth.uid()) = student_id
    );

-- =============================================
-- OPTIMIZE PRACTICE_SESSIONS TABLE POLICIES
-- =============================================

-- Drop and recreate practice_sessions policies with performance optimization
DROP POLICY IF EXISTS "Students can view their own practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Students can insert their own practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Teachers can view connected students practice sessions" ON practice_sessions;

-- Optimized practice_sessions policies
CREATE POLICY "Students can view their own practice sessions" ON practice_sessions
    FOR SELECT USING (student_id = (select auth.uid()));

CREATE POLICY "Students can insert their own practice sessions" ON practice_sessions
    FOR INSERT WITH CHECK (student_id = (select auth.uid()));

CREATE POLICY "Teachers can view connected students practice sessions" ON practice_sessions
    FOR SELECT USING (
        (select auth.uid()) IN (
            SELECT teacher_id FROM teacher_student_connections 
            WHERE student_id = practice_sessions.student_id AND status = 'accepted'
        )
    );

DO $$
BEGIN
    RAISE NOTICE 'RLS performance optimization completed successfully!';
    RAISE NOTICE 'Replaced auth.uid() with (select auth.uid()) in critical RLS policies';
    RAISE NOTICE 'This should significantly improve query performance at scale';
    RAISE NOTICE 'Check Supabase Performance Advisor in 5-10 minutes for updated metrics';
END $$; 