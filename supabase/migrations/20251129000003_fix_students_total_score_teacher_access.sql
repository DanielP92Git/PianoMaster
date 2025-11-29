-- Restore teacher visibility into students_total_score
ALTER TABLE students_total_score ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view connected students total_score" ON students_total_score;

CREATE POLICY "Teachers can view connected students total_score" ON students_total_score
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM teacher_student_connections
            WHERE teacher_student_connections.teacher_id = (select auth.uid())
              AND teacher_student_connections.student_id = students_total_score.student_id
              AND teacher_student_connections.status = 'accepted'
        )
    );

