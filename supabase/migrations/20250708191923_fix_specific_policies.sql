-- Fix Specific RLS Policies Based on Performance Warnings
-- Target the exact policy names found in warnings.json

DO $$
BEGIN
    RAISE NOTICE 'Fixing specific policies identified in performance warnings...';
END $$;

-- 1. LAST_PRACTICED_DATE TABLE
DO $$
BEGIN
    RAISE NOTICE 'Fixing last_practiced_date table policies...';
    
    DROP POLICY IF EXISTS "Users can update their own practice date" ON last_practiced_date;
    CREATE POLICY "Users can update their own practice date" ON last_practiced_date
        FOR UPDATE USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Users can view their own practice date" ON last_practiced_date;
    CREATE POLICY "Users can view their own practice date" ON last_practiced_date
        FOR SELECT USING (student_id = (select auth.uid()));
END $$;

-- 2. CLASS_ENROLLMENTS TABLE
DO $$
BEGIN
    RAISE NOTICE 'Fixing class_enrollments table policies...';
    
    DROP POLICY IF EXISTS "Students can update their own enrollment status" ON class_enrollments;
    CREATE POLICY "Students can update their own enrollment status" ON class_enrollments
        FOR UPDATE USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Teachers can manage their class enrollments" ON class_enrollments;
    CREATE POLICY "Teachers can manage their class enrollments" ON class_enrollments
        FOR ALL USING (
            class_id IN (SELECT id FROM classes WHERE teacher_id = (select auth.uid()))
        );
    
    DROP POLICY IF EXISTS "Teachers can view their class enrollments" ON class_enrollments;
    CREATE POLICY "Teachers can view their class enrollments" ON class_enrollments
        FOR SELECT USING (
            class_id IN (SELECT id FROM classes WHERE teacher_id = (select auth.uid()))
        );
END $$;

-- 3. ASSIGNMENTS TABLE
DO $$
BEGIN
    RAISE NOTICE 'Fixing assignments table policies...';
    
    DROP POLICY IF EXISTS "Students can view assignments in their classes" ON assignments;
    CREATE POLICY "Students can view assignments in their classes" ON assignments
        FOR SELECT USING (
            class_id IN (
                SELECT class_id FROM class_enrollments 
                WHERE student_id = (select auth.uid()) AND status = 'active'
            ) OR class_id IS NULL
        );
    
    DROP POLICY IF EXISTS "Teachers can manage assignments in their classes" ON assignments;
    CREATE POLICY "Teachers can manage assignments in their classes" ON assignments
        FOR ALL USING (teacher_id = (select auth.uid()));
END $$;

-- 4. STUDENTS_SCORE TABLE
DO $$
BEGIN
    RAISE NOTICE 'Fixing students_score table policies...';
    
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON students_score;
    CREATE POLICY "Enable insert for authenticated users only" ON students_score
        FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
    
    DROP POLICY IF EXISTS "Enable users to update their own total score" ON students_score;
    CREATE POLICY "Enable users to update their own total score" ON students_score
        FOR UPDATE USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Enable users to view their own total score" ON students_score;
    CREATE POLICY "Enable users to view their own total score" ON students_score
        FOR SELECT USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Service role can manage scores" ON students_score;
    CREATE POLICY "Service role can manage scores" ON students_score
        FOR ALL USING ((select auth.role()) = 'service_role');
END $$;

-- 5. STUDENTS_TOTAL_SCORE TABLE
DO $$
BEGIN
    RAISE NOTICE 'Fixing students_total_score table policies...';
    
    DROP POLICY IF EXISTS "Enable users to update their own total score" ON students_total_score;
    CREATE POLICY "Enable users to update their own total score" ON students_total_score
        FOR UPDATE USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Enable users to view their own total score" ON students_total_score;
    CREATE POLICY "Enable users to view their own total score" ON students_total_score
        FOR SELECT USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Service role can manage student scores" ON students_total_score;
    CREATE POLICY "Service role can manage student scores" ON students_total_score
        FOR ALL USING ((select auth.role()) = 'service_role');
    
    DROP POLICY IF EXISTS "Students can view their own score" ON students_total_score;
    CREATE POLICY "Students can view their own score" ON students_total_score
        FOR SELECT USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Teachers can view connected students scores" ON students_total_score;
    CREATE POLICY "Teachers can view connected students scores" ON students_total_score
        FOR SELECT USING (
            student_id IN (
                SELECT student_id FROM teacher_student_connections 
                WHERE teacher_id = (select auth.uid())
            )
        );
END $$;

-- 6. STUDENTS TABLE
DO $$
BEGIN
    RAISE NOTICE 'Fixing students table policies...';
    
    DROP POLICY IF EXISTS "Service role can manage students" ON students;
    CREATE POLICY "Service role can manage students" ON students
        FOR ALL USING ((select auth.role()) = 'service_role');
    
    DROP POLICY IF EXISTS "Teachers can update student records" ON students;
    CREATE POLICY "Teachers can update student records" ON students
        FOR UPDATE USING (
            id IN (
                SELECT student_id FROM teacher_student_connections 
                WHERE teacher_id = (select auth.uid())
            )
        );
    
    DROP POLICY IF EXISTS "Teachers can view students" ON students;
    CREATE POLICY "Teachers can view students" ON students
        FOR SELECT USING (
            id IN (
                SELECT student_id FROM teacher_student_connections 
                WHERE teacher_id = (select auth.uid())
            )
        );
    
    DROP POLICY IF EXISTS "Users can update their own info" ON students;
    CREATE POLICY "Users can update their own info" ON students
        FOR UPDATE USING (id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Users can view insert and update their own info" ON students;
    CREATE POLICY "Users can view insert and update their own info" ON students
        FOR ALL USING (id = (select auth.uid()));
END $$;

-- 7. TEACHERS TABLE
DO $$
BEGIN
    RAISE NOTICE 'Fixing teachers table policies...';
    
    DROP POLICY IF EXISTS "Service role can manage teachers" ON teachers;
    CREATE POLICY "Service role can manage teachers" ON teachers
        FOR ALL USING ((select auth.role()) = 'service_role');
END $$;

-- 8. CURRENT_STREAK TABLE
DO $$
BEGIN
    RAISE NOTICE 'Fixing current_streak table policies...';
    
    DROP POLICY IF EXISTS "Enable users to update their own current streak" ON current_streak;
    CREATE POLICY "Enable users to update their own current streak" ON current_streak
        FOR UPDATE USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Enable users to view their own current streak" ON current_streak;
    CREATE POLICY "Enable users to view their own current streak" ON current_streak
        FOR SELECT USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Service role can manage current streak" ON current_streak;
    CREATE POLICY "Service role can manage current streak" ON current_streak
        FOR ALL USING ((select auth.role()) = 'service_role');
END $$;

-- 9. HIGHEST_STREAK TABLE
DO $$
BEGIN
    RAISE NOTICE 'Fixing highest_streak table policies...';
    
    DROP POLICY IF EXISTS "Enable users to update their own highest streak" ON highest_streak;
    CREATE POLICY "Enable users to update their own highest streak" ON highest_streak
        FOR UPDATE USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Enable users to view their own highest streak" ON highest_streak;
    CREATE POLICY "Enable users to view their own highest streak" ON highest_streak
        FOR SELECT USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Service role can manage highest streak" ON highest_streak;
    CREATE POLICY "Service role can manage highest streak" ON highest_streak
        FOR ALL USING ((select auth.role()) = 'service_role');
END $$;

-- 10. PRACTICE_SESSIONS TABLE
DO $$
BEGIN
    RAISE NOTICE 'Fixing practice_sessions table policies...';
    
    DROP POLICY IF EXISTS "Enable users to update their own practice sessions" ON practice_sessions;
    CREATE POLICY "Enable users to update their own practice sessions" ON practice_sessions
        FOR UPDATE USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Enable users to view their own practice sessions" ON practice_sessions;
    CREATE POLICY "Enable users to view their own practice sessions" ON practice_sessions
        FOR SELECT USING (student_id = (select auth.uid()));
    
    DROP POLICY IF EXISTS "Service role can manage practice sessions" ON practice_sessions;
    CREATE POLICY "Service role can manage practice sessions" ON practice_sessions
        FOR ALL USING ((select auth.role()) = 'service_role');
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Fixed specific policies based on performance warnings!';
    RAISE NOTICE 'This should significantly reduce the number of auth.uid() performance warnings.';
END $$; 