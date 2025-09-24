-- Fix Notifications RLS Policy to Allow Teachers to Send Notifications
-- Allow teachers to create notifications for their connected students

BEGIN;

-- Fix notifications table RLS policies
DO $$
BEGIN
    -- Drop existing restrictive policies
    DROP POLICY IF EXISTS "Teachers can send notifications to students" ON notifications;
    DROP POLICY IF EXISTS "Teachers can send notifications to connected students" ON notifications;
    DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Teachers can send notifications to enrolled students" ON notifications;
    DROP POLICY IF EXISTS "Students can view their notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
    DROP POLICY IF EXISTS "Teachers can view sent notifications" ON notifications;
    
    -- Create comprehensive policy for notification access
    CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL USING (
        auth.uid() = recipient_id OR auth.uid() = sender_id
    );
    
    -- Create policy to allow teachers to send notifications to their students
    CREATE POLICY "Teachers can send notifications to connected students" ON notifications
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND (
            -- Allow if sender is teacher and recipient is their connected student
            EXISTS (
                SELECT 1 FROM teacher_student_connections tsc 
                WHERE tsc.teacher_id = auth.uid() 
                AND tsc.student_id = recipient_id 
                AND tsc.status = 'accepted'
            )
            OR
            -- Allow if sender is teacher and recipient is in their class
            EXISTS (
                SELECT 1 FROM classes c
                JOIN class_enrollments ce ON c.id = ce.class_id
                WHERE c.teacher_id = auth.uid()
                AND ce.student_id = recipient_id
                AND ce.status = 'active'
            )
        )
    );
    
    RAISE NOTICE 'Fixed notifications RLS policies to allow teacher-student communication';
    
END $$;

COMMIT; 