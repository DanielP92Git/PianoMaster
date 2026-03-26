-- Fix FK references: assignment_submissions.student_id and notifications.recipient_id
-- should reference students(id) instead of auth.users(id) to support placeholder students.

-- 1. Fix assignment_submissions.student_id FK
ALTER TABLE assignment_submissions
  DROP CONSTRAINT IF EXISTS assignment_submissions_student_id_fkey;

ALTER TABLE assignment_submissions
  ADD CONSTRAINT assignment_submissions_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- 2. Fix notifications.recipient_id FK
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_recipient_id_fkey
  FOREIGN KEY (recipient_id) REFERENCES students(id) ON DELETE CASCADE;
