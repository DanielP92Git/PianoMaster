-- Final Performance Cleanup Migration
-- Addresses remaining 12 Performance Advisor suggestions

-- Add missing foreign key index for assignments table
CREATE INDEX IF NOT EXISTS idx_assignments_class_id 
ON public.assignments (class_id);

-- Remove unused indexes (as identified by Performance Advisor)
DROP INDEX IF EXISTS public.idx_notifications_sender_id;
DROP INDEX IF EXISTS public.idx_practice_sessions_student_id;
DROP INDEX IF EXISTS public.idx_student_achievements_student_id;
DROP INDEX IF EXISTS public.idx_students_avatar_id;
DROP INDEX IF EXISTS public.idx_students_score_game_id;
DROP INDEX IF EXISTS public.idx_students_score_student_id;
DROP INDEX IF EXISTS public.idx_teacher_student_messages_class_id;
DROP INDEX IF EXISTS public.idx_teacher_student_messages_reply_to;
DROP INDEX IF EXISTS public.idx_practice_sessions_student_date;
DROP INDEX IF EXISTS public.idx_student_achievements_student_date;
DROP INDEX IF EXISTS public.idx_notifications_recipient_date;

-- Add comment for tracking
COMMENT ON INDEX idx_assignments_class_id IS 'Foreign key index for assignments.class_id - Performance Advisor recommendation'; 