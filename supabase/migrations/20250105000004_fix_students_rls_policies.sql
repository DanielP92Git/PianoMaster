-- Fix RLS policies for students table
-- This fixes the 406 errors by allowing proper access to student data

-- Enable RLS if not already enabled
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students can view their own profile" ON students;
DROP POLICY IF EXISTS "Students can update their own profile" ON students;
DROP POLICY IF EXISTS "Students can insert their own profile" ON students;
DROP POLICY IF EXISTS "Teachers can view connected students" ON students;
DROP POLICY IF EXISTS "System can create student profiles" ON students;

-- Students can view and update their own profile
CREATE POLICY "Students can view their own profile" ON students
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Students can update their own profile" ON students
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Students can insert their own profile" ON students
    FOR INSERT WITH CHECK (id = auth.uid());

-- Teachers can view students they are connected to
CREATE POLICY "Teachers can view connected students" ON students
    FOR SELECT USING (
        -- Allow if current user is a teacher connected to this student
        auth.uid() IN (
            SELECT teacher_id FROM teacher_student_connections 
            WHERE student_id = students.id AND status = 'accepted'
        )
    );

-- Allow service role to create profiles (for signup process)
CREATE POLICY "Service role can manage students" ON students
    FOR ALL USING (
        -- Allow service role full access (for signup and system operations)
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Also fix teachers table RLS if needed
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing teacher policies if any
DROP POLICY IF EXISTS "Teachers can view their own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can insert their own profile" ON teachers;
DROP POLICY IF EXISTS "Service role can manage teachers" ON teachers;

-- Teachers can view and update their own profile
CREATE POLICY "Teachers can view their own profile" ON teachers
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Teachers can update their own profile" ON teachers
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Teachers can insert their own profile" ON teachers
    FOR INSERT WITH CHECK (id = auth.uid());

-- Allow service role to create profiles (for signup process)
CREATE POLICY "Service role can manage teachers" ON teachers
    FOR ALL USING (
        -- Allow service role full access (for signup and system operations)
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Fix other essential tables that might have similar issues
-- students_total_score table
ALTER TABLE students_total_score ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own score" ON students_total_score;
DROP POLICY IF EXISTS "Teachers can view connected students scores" ON students_total_score;

CREATE POLICY "Students can view their own score" ON students_total_score
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view connected students scores" ON students_total_score
    FOR SELECT USING (
        auth.uid() IN (
            SELECT teacher_id FROM teacher_student_connections 
            WHERE student_id = students_total_score.student_id AND status = 'accepted'
        )
    );

-- Allow service role to manage scores
CREATE POLICY "Service role can manage student scores" ON students_total_score
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

COMMENT ON TABLE students IS 'RLS policies allow students to manage their own profiles and teachers to view connected students';
COMMENT ON TABLE teachers IS 'RLS policies allow teachers to manage their own profiles';
COMMENT ON TABLE students_total_score IS 'RLS policies allow students to view their own scores and teachers to view connected students scores'; 