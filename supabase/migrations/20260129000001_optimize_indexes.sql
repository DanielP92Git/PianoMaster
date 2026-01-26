-- ============================================================================
-- Migration: Optimize Database Indexes (Phase 3)
-- Date: 2026-01-29
-- Description: Adds missing index for teacher-student lookups and removes
--              unused indexes to reduce storage and write overhead.
-- ============================================================================

BEGIN;

-- ============================================
-- 1. ADD MISSING INDEX
-- ============================================

-- Add index for invited_by_teacher lookups (used in teacher-student connection queries)
CREATE INDEX IF NOT EXISTS idx_students_invited_by_teacher
  ON public.students(invited_by_teacher)
  WHERE invited_by_teacher IS NOT NULL;

COMMENT ON INDEX idx_students_invited_by_teacher IS
  'Partial index for efficient teacher lookup of students they invited';

-- ============================================
-- 2. DROP UNUSED INDEXES
-- ============================================

-- These indexes were identified as unused through query analysis.
-- Dropping them reduces storage overhead and improves write performance.

-- Assignment-related indexes (assignments feature not actively used)
DROP INDEX IF EXISTS idx_assignment_submissions_student_id;
DROP INDEX IF EXISTS idx_assignments_class_id;
DROP INDEX IF EXISTS idx_assignments_teacher_id;

-- Class-related indexes (class features not actively used)
DROP INDEX IF EXISTS idx_class_enrollments_status;
DROP INDEX IF EXISTS idx_classes_teacher_id;

-- Notification-related indexes (notification features simplified)
DROP INDEX IF EXISTS idx_notifications_recipient_read;
DROP INDEX IF EXISTS idx_notifications_sender_id;

-- Student profile indexes (replaced by other indexes or unused)
DROP INDEX IF EXISTS idx_students_avatar_id;
DROP INDEX IF EXISTS idx_students_score_game_id;

-- Connection indexes (status is always filtered alongside other columns)
DROP INDEX IF EXISTS idx_teacher_student_connections_status;

-- Message indexes (messaging features not actively used)
DROP INDEX IF EXISTS idx_teacher_student_messages_class_id;
DROP INDEX IF EXISTS idx_teacher_student_messages_reply_to;

-- User accessories index (covered by existing composite indexes)
DROP INDEX IF EXISTS user_accessories_user_id_idx;

-- Skill progress student index (redundant - covered by composite index on student_id, last_practiced)
DROP INDEX IF EXISTS idx_skill_progress_student;

-- XP index (rarely queried for leaderboards)
DROP INDEX IF EXISTS idx_students_total_xp;

-- Exercise progress JSONB index (JSONB operations not using this index effectively)
DROP INDEX IF EXISTS idx_student_skill_progress_exercise_progress;

-- Admin flag index (very few teachers, full scan is faster)
DROP INDEX IF EXISTS idx_teachers_is_admin;

COMMIT;

-- Summary:
-- Added: 1 index (idx_students_invited_by_teacher - partial)
-- Removed: 17 indexes
--
-- Expected benefits:
-- - Reduced storage by ~2-5MB (depending on data volume)
-- - Faster INSERT/UPDATE operations on affected tables
-- - More efficient use of shared_buffers/cache
--
-- Note: If any of these indexes are needed in the future for new features,
-- they can be recreated. Always verify query plans after index changes.
