-- Final Performance Fix Migration
-- Addresses the 9 remaining Performance Advisor suggestions

-- Add missing foreign key indexes (8 total)
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id 
ON public.notifications (sender_id);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_student_id 
ON public.practice_sessions (student_id);

CREATE INDEX IF NOT EXISTS idx_student_achievements_student_id 
ON public.student_achievements (student_id);

CREATE INDEX IF NOT EXISTS idx_students_avatar_id 
ON public.students (avatar_id);

CREATE INDEX IF NOT EXISTS idx_students_score_game_id 
ON public.students_score (game_id);

CREATE INDEX IF NOT EXISTS idx_students_score_student_id 
ON public.students_score (student_id);

CREATE INDEX IF NOT EXISTS idx_teacher_student_messages_class_id 
ON public.teacher_student_messages (class_id);

CREATE INDEX IF NOT EXISTS idx_teacher_student_messages_reply_to 
ON public.teacher_student_messages (reply_to);

-- Remove only the unused index (not unique constraints)
DROP INDEX IF EXISTS public.idx_assignments_class_id; 