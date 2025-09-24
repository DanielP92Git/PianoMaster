-- Fix practice_sessions RLS policies to allow teachers to view their students' recordings
-- Current issue: Teachers cannot access practice_sessions from their connected students

-- 1. Check current RLS policies on practice_sessions
SELECT 
    'CURRENT_PRACTICE_SESSIONS_POLICIES' as query_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'practice_sessions'
ORDER BY policyname;

-- 2. Add missing policy for teachers to view their students' practice sessions
DROP POLICY IF EXISTS "Teachers can view practice sessions from their students" ON practice_sessions;

CREATE POLICY "Teachers can view practice sessions from their students" ON practice_sessions
    FOR SELECT USING (
        -- Allow if current user is a teacher AND the student is connected to them
        auth.uid() IN (
            SELECT tsc.teacher_id 
            FROM teacher_student_connections tsc 
            WHERE tsc.student_id = practice_sessions.student_id 
            AND tsc.status = 'accepted'
        )
    );

-- 3. Add policy for teachers to update practice sessions (for reviews/feedback)
DROP POLICY IF EXISTS "Teachers can update practice sessions from their students" ON practice_sessions;

CREATE POLICY "Teachers can update practice sessions from their students" ON practice_sessions
    FOR UPDATE USING (
        -- Allow if current user is a teacher AND the student is connected to them
        auth.uid() IN (
            SELECT tsc.teacher_id 
            FROM teacher_student_connections tsc 
            WHERE tsc.student_id = practice_sessions.student_id 
            AND tsc.status = 'accepted'
        )
    );

-- 4. Verify the new policies were created
SELECT 
    'UPDATED_PRACTICE_SESSIONS_POLICIES' as query_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'practice_sessions'
ORDER BY policyname; 