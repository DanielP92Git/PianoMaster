-- Re-link teacher/student connections to canonical auth user IDs
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      placeholder.id AS placeholder_id,
      real_student.id AS real_student_id
    FROM students placeholder
    JOIN students real_student
      ON lower(placeholder.email) = lower(real_student.email)
    JOIN auth.users au
      ON au.id = real_student.id
    WHERE placeholder.id <> real_student.id
  LOOP
    UPDATE teacher_student_connections
      SET student_id = rec.real_student_id
      WHERE student_id = rec.placeholder_id;

    UPDATE assignment_submissions
      SET student_id = rec.real_student_id
      WHERE student_id = rec.placeholder_id;

    UPDATE notifications
      SET recipient_id = rec.real_student_id
      WHERE recipient_id = rec.placeholder_id;

    UPDATE students_total_score
      SET student_id = rec.real_student_id
      WHERE student_id = rec.placeholder_id;

    UPDATE current_streak
      SET student_id = rec.real_student_id
      WHERE student_id = rec.placeholder_id;

    UPDATE highest_streak
      SET student_id = rec.real_student_id
      WHERE student_id = rec.placeholder_id;

    UPDATE last_practiced_date
      SET student_id = rec.real_student_id
      WHERE student_id = rec.placeholder_id;

    DELETE FROM students
      WHERE id = rec.placeholder_id;
  END LOOP;
END $$;

-- Flag existing non-auth students as placeholders so new logic can manage them
UPDATE students
SET is_placeholder = TRUE,
    placeholder_status = 'pending'
WHERE id NOT IN (SELECT id FROM auth.users);

