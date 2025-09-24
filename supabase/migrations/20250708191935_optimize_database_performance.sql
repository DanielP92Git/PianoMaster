-- Optimize Database Performance
-- Fix unindexed foreign keys and remove unused indexes based on Performance Advisor recommendations

DO $$
BEGIN
    RAISE NOTICE 'Optimizing database performance - adding missing indexes and removing unused ones...';
END $$;

-- ====================================================================
-- PART 1: ADD MISSING INDEXES FOR FOREIGN KEYS
-- ====================================================================

-- Add index for notifications.sender_id foreign key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_sender_id') THEN
        CREATE INDEX idx_notifications_sender_id ON notifications (sender_id);
        RAISE NOTICE 'Created index: idx_notifications_sender_id';
    END IF;
END $$;

-- Add index for practice_sessions.student_id foreign key  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_practice_sessions_student_id') THEN
        CREATE INDEX idx_practice_sessions_student_id ON practice_sessions (student_id);
        RAISE NOTICE 'Created index: idx_practice_sessions_student_id';
    END IF;
END $$;

-- Add index for student_achievements.student_id foreign key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_achievements_student_id') THEN
        CREATE INDEX idx_student_achievements_student_id ON student_achievements (student_id);
        RAISE NOTICE 'Created index: idx_student_achievements_student_id';
    END IF;
END $$;

-- Add index for students.avatar_id foreign key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_avatar_id') THEN
        CREATE INDEX idx_students_avatar_id ON students (avatar_id);
        RAISE NOTICE 'Created index: idx_students_avatar_id';
    END IF;
END $$;

-- Add index for students_score.game_id foreign key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_score_game_id') THEN
        CREATE INDEX idx_students_score_game_id ON students_score (game_id);
        RAISE NOTICE 'Created index: idx_students_score_game_id';
    END IF;
END $$;

-- Add index for students_score.student_id foreign key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_score_student_id') THEN
        CREATE INDEX idx_students_score_student_id ON students_score (student_id);
        RAISE NOTICE 'Created index: idx_students_score_student_id';
    END IF;
END $$;

-- Add index for teacher_student_messages.class_id foreign key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_teacher_student_messages_class_id') THEN
        CREATE INDEX idx_teacher_student_messages_class_id ON teacher_student_messages (class_id);
        RAISE NOTICE 'Created index: idx_teacher_student_messages_class_id';
    END IF;
END $$;

-- Add index for teacher_student_messages.reply_to foreign key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_teacher_student_messages_reply_to') THEN
        CREATE INDEX idx_teacher_student_messages_reply_to ON teacher_student_messages (reply_to);
        RAISE NOTICE 'Created index: idx_teacher_student_messages_reply_to';
    END IF;
END $$;

-- ====================================================================
-- PART 2: REMOVE UNUSED INDEXES (STORAGE OPTIMIZATION)
-- ====================================================================

-- Remove unused indexes from assignment_submissions table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignment_submissions_assignment') THEN
        DROP INDEX IF EXISTS idx_assignment_submissions_assignment;
        RAISE NOTICE 'Dropped unused index: idx_assignment_submissions_assignment';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignment_submissions_assignment_id') THEN
        DROP INDEX IF EXISTS idx_assignment_submissions_assignment_id;
        RAISE NOTICE 'Dropped unused index: idx_assignment_submissions_assignment_id';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignment_submissions_student') THEN
        DROP INDEX IF EXISTS idx_assignment_submissions_student;
        RAISE NOTICE 'Dropped unused index: idx_assignment_submissions_student';
    END IF;
END $$;

-- Remove unused indexes from assignments table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignments_class_due_date') THEN
        DROP INDEX IF EXISTS idx_assignments_class_due_date;
        RAISE NOTICE 'Dropped unused index: idx_assignments_class_due_date';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assignments_class_id') THEN
        DROP INDEX IF EXISTS idx_assignments_class_id;
        RAISE NOTICE 'Dropped unused index: idx_assignments_class_id';
    END IF;
END $$;

-- Remove unused indexes from class_enrollments table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_class_enrollments_class_id') THEN
        DROP INDEX IF EXISTS idx_class_enrollments_class_id;
        RAISE NOTICE 'Dropped unused index: idx_class_enrollments_class_id';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_class_enrollments_student_class') THEN
        DROP INDEX IF EXISTS idx_class_enrollments_student_class;
        RAISE NOTICE 'Dropped unused index: idx_class_enrollments_student_class';
    END IF;
END $$;

-- Remove unused indexes from classes table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_classes_class_code') THEN
        DROP INDEX IF EXISTS idx_classes_class_code;
        RAISE NOTICE 'Dropped unused index: idx_classes_class_code';
    END IF;
END $$;

-- Remove unused indexes from teacher_student_messages table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_sender_id') THEN
        DROP INDEX IF EXISTS idx_messages_sender_id;
        RAISE NOTICE 'Dropped unused index: idx_messages_sender_id';
    END IF;
END $$;

-- Remove unused indexes from notifications table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_created_at') THEN
        DROP INDEX IF EXISTS idx_notifications_created_at;
        RAISE NOTICE 'Dropped unused index: idx_notifications_created_at';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_recipient_id') THEN
        DROP INDEX IF EXISTS idx_notifications_recipient_id;
        RAISE NOTICE 'Dropped unused index: idx_notifications_recipient_id';
    END IF;
END $$;

-- Remove unused indexes from teachers table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_teachers_email') THEN
        DROP INDEX IF EXISTS idx_teachers_email;
        RAISE NOTICE 'Dropped unused index: idx_teachers_email';
    END IF;
END $$;

-- ====================================================================
-- PART 3: ADD PERFORMANCE-OPTIMIZED INDEXES
-- ====================================================================

-- Add composite index for common query patterns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_practice_sessions_student_date') THEN
        CREATE INDEX idx_practice_sessions_student_date ON practice_sessions (student_id, submitted_at DESC);
        RAISE NOTICE 'Created composite index: idx_practice_sessions_student_date';
    END IF;
END $$;

-- Add index for student achievements by date
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_achievements_student_date') THEN
        CREATE INDEX idx_student_achievements_student_date ON student_achievements (student_id, earned_at DESC);
        RAISE NOTICE 'Created composite index: idx_student_achievements_student_date';
    END IF;
END $$;

-- Add index for notifications by recipient and date
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_recipient_date') THEN
        CREATE INDEX idx_notifications_recipient_date ON notifications (recipient_id, created_at DESC);
        RAISE NOTICE 'Created composite index: idx_notifications_recipient_date';
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Database performance optimization completed successfully!';
    RAISE NOTICE 'Summary: Added 8 missing foreign key indexes, removed 13 unused indexes, added 3 composite indexes for common queries.';
END $$; 