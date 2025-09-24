-- Fix notifications policy to use 'accepted' status instead of 'active'
-- This fixes the 403 error when teachers try to send notifications to connected students

-- Drop and recreate the policy with correct status
DROP POLICY IF EXISTS "Teachers can create notifications for their students" ON notifications;
CREATE POLICY "Teachers can create notifications for their students" ON notifications
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        (
            -- Teachers can message students they are connected with (status = 'accepted')
            recipient_id IN (
                SELECT student_id FROM teacher_student_connections
                WHERE teacher_id = auth.uid() AND status = 'accepted'
            )
            -- Teachers can also message themselves
            OR recipient_id = auth.uid()
            -- Keep the old class-based logic as well for backwards compatibility
            OR recipient_id IN (
                SELECT ce.student_id FROM class_enrollments ce
                JOIN classes c ON ce.class_id = c.id
                WHERE c.teacher_id = auth.uid() AND ce.status = 'active'
            )
        )
    );

COMMENT ON POLICY "Teachers can create notifications for their students" ON notifications IS 
'Allows teachers to send notifications to connected students (status=accepted) via teacher_student_connections or enrolled students via class_enrollments'; 