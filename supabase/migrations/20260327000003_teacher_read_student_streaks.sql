-- Allow teachers to read current_streak for their connected students
-- Without this, getTeacherStudents silently gets 0 for all streaks

DROP POLICY IF EXISTS "Users can access current streak" ON current_streak;

CREATE POLICY "Users can access current streak" ON current_streak
    FOR ALL USING (
        -- Students can manage their own streak
        student_id = (select auth.uid())
        OR
        -- Service role can manage all streaks
        (select auth.role()) = 'service_role'
        OR
        -- Teachers can read streaks for their connected students
        EXISTS (
            SELECT 1 FROM teacher_student_connections tsc
            WHERE tsc.teacher_id = (select auth.uid())
              AND tsc.student_id = current_streak.student_id
              AND tsc.status = 'accepted'
        )
    );
