-- Fix RLS policies for students_total_score table
-- This resolves 406 errors when students try to create/update their scores

-- Add missing policies for students to manage their own scores
CREATE POLICY "Students can insert their own score" ON students_total_score
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own score" ON students_total_score
    FOR UPDATE USING (student_id = auth.uid());

-- Also ensure the students_score table has proper policies
ALTER TABLE students_score ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students can view their own scores" ON students_score;
DROP POLICY IF EXISTS "Students can insert their own scores" ON students_score;
DROP POLICY IF EXISTS "Teachers can view connected students scores" ON students_score;
DROP POLICY IF EXISTS "Service role can manage scores" ON students_score;

-- Students can manage their own individual scores
CREATE POLICY "Students can view their own scores" ON students_score
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own scores" ON students_score
    FOR INSERT WITH CHECK (student_id = auth.uid());

-- Teachers can view scores of connected students
CREATE POLICY "Teachers can view connected students scores" ON students_score
    FOR SELECT USING (
        auth.uid() IN (
            SELECT teacher_id FROM teacher_student_connections 
            WHERE student_id = students_score.student_id AND status = 'accepted'
        )
    );

-- Allow service role to manage scores
CREATE POLICY "Service role can manage scores" ON students_score
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

COMMENT ON POLICY "Students can insert their own score" ON students_total_score IS 
'Allows students to create their initial total score record';

COMMENT ON POLICY "Students can update their own score" ON students_total_score IS 
'Allows students to update their total score when earning points';
