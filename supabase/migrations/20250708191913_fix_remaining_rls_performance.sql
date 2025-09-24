-- Fix remaining RLS performance issues
-- The 20250708191912 migration recreated policies with auth.uid() after our optimization
-- This migration re-optimizes those specific policies for performance

DO $$
BEGIN
    RAISE NOTICE 'Fixing remaining RLS performance issues after 20250708191912 migration...';
END $$;

-- =============================================
-- RE-OPTIMIZE STUDENTS_TOTAL_SCORE POLICIES
-- =============================================

-- Drop and recreate the policies that were created in 20250708191912 with performance optimization
DROP POLICY IF EXISTS "Students can insert their own score" ON students_total_score;
DROP POLICY IF EXISTS "Students can update their own score" ON students_total_score;

-- Recreate with performance optimization
CREATE POLICY "Students can insert their own score" ON students_total_score
    FOR INSERT WITH CHECK (student_id = (select auth.uid()));

CREATE POLICY "Students can update their own score" ON students_total_score
    FOR UPDATE USING (student_id = (select auth.uid()));

-- =============================================
-- RE-OPTIMIZE STUDENTS_SCORE POLICIES
-- =============================================

-- Drop and recreate the policies that were created in 20250708191912 with performance optimization
DROP POLICY IF EXISTS "Students can view their own scores" ON students_score;
DROP POLICY IF EXISTS "Students can insert their own scores" ON students_score;
DROP POLICY IF EXISTS "Teachers can view connected students scores" ON students_score;
DROP POLICY IF EXISTS "Service role can manage scores" ON students_score;

-- Recreate with performance optimization
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

-- Keep the service role policy as is (auth.jwt() doesn't need optimization)
CREATE POLICY "Service role can manage scores" ON students_score
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Preserve the comments from the original migration
COMMENT ON POLICY "Students can insert their own score" ON students_total_score IS 
'Allows students to create their initial total score record - Performance optimized';

COMMENT ON POLICY "Students can update their own score" ON students_total_score IS 
'Allows students to update their total score when earning points - Performance optimized';

DO $$
BEGIN
    RAISE NOTICE 'RLS performance re-optimization completed!';
    RAISE NOTICE 'All auth.uid() calls replaced with (select auth.uid()) for better performance';
    RAISE NOTICE 'This should resolve the remaining performance warnings';
END $$; 