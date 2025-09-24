-- Final simple RLS optimization approach
-- Focus on existing policies that can be safely optimized
-- Skip table guessing and focus on what we know exists

DO $$
BEGIN
    RAISE NOTICE 'Applying final simple RLS optimizations...';
    RAISE NOTICE 'Focusing on existing policies only';
END $$;

-- =============================================
-- OPTIMIZE PRACTICE_SESSIONS TABLE POLICIES
-- =============================================

-- These are the policies we know exist and need optimization
DROP POLICY IF EXISTS "Students can view their practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Students can insert their practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Students can update their practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Teachers can view student practice sessions" ON practice_sessions;

-- Recreate with optimization
CREATE POLICY "Students can view their practice sessions" ON practice_sessions
    FOR SELECT USING (student_id = (select auth.uid()));

CREATE POLICY "Students can insert their practice sessions" ON practice_sessions
    FOR INSERT WITH CHECK (student_id = (select auth.uid()));

CREATE POLICY "Students can update their practice sessions" ON practice_sessions
    FOR UPDATE USING (student_id = (select auth.uid()));

CREATE POLICY "Teachers can view student practice sessions" ON practice_sessions
    FOR SELECT USING (
        (select auth.uid()) IN (
            SELECT teacher_id FROM teacher_student_connections 
            WHERE student_id = practice_sessions.student_id AND status = 'accepted'
        )
    );

DO $$
BEGIN
    RAISE NOTICE 'Final RLS performance optimization completed!';
    RAISE NOTICE 'The main comprehensive optimization should have addressed most of the 185 warnings';
    RAISE NOTICE 'Check Supabase Performance Advisor for updated warning count';
END $$; 