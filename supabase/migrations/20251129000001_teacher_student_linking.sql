-- Teacher ↔ Student linking improvements

---------------------------------------------
-- 1. Placeholder metadata + email index
---------------------------------------------
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS invited_by_teacher UUID REFERENCES teachers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS placeholder_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS placeholder_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_students_email_lower
  ON students (lower(email));

---------------------------------------------
-- 2. RPC: teacher_link_student
---------------------------------------------
DROP FUNCTION IF EXISTS public.teacher_link_student(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION public.teacher_link_student(
  p_student_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_level TEXT DEFAULT NULL,
  p_studying_year TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  email TEXT,
  connection_status TEXT,
  connection_id UUID,
  needs_signup BOOLEAN,
  was_existing_student BOOLEAN
) AS $$
DECLARE
  normalized_email TEXT := lower(trim(p_student_email));
  current_teacher_id UUID := auth.uid();
  target_student_id UUID;
  connection_record RECORD;
  teacher_active BOOLEAN;
  auth_student RECORD;
  student_first TEXT;
  student_last TEXT;
  requires_signup BOOLEAN := FALSE;
  existing_student BOOLEAN := FALSE;
  pending_username TEXT;
BEGIN
  IF current_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT TRUE
    INTO teacher_active
    FROM teachers
    WHERE id = current_teacher_id
      AND is_active = TRUE
    LIMIT 1;

  IF NOT COALESCE(teacher_active, FALSE) THEN
    RAISE EXCEPTION 'Only active teachers can add students';
  END IF;

  IF normalized_email IS NULL OR normalized_email = '' THEN
    RAISE EXCEPTION 'Student email is required';
  END IF;

    SELECT
    au.id,
    au.raw_user_meta_data->>'first_name' AS meta_first,
    au.raw_user_meta_data->>'last_name' AS meta_last
  INTO auth_student
  FROM auth.users AS au
  WHERE lower(au.email) = normalized_email
  LIMIT 1;

  IF auth_student.id IS NOT NULL THEN
    target_student_id := auth_student.id;
    existing_student := TRUE;
    student_first := COALESCE(p_first_name, auth_student.meta_first, 'Student');
    student_last := COALESCE(p_last_name, auth_student.meta_last, '');
  ELSE
    requires_signup := TRUE;
    student_first := COALESCE(p_first_name, 'Pending');
    student_last := COALESCE(p_last_name, '');
  END IF;

  IF existing_student THEN
    INSERT INTO students (
      id,
      first_name,
      last_name,
      email,
      level,
      studying_year,
      username,
      is_placeholder,
      invited_by_teacher,
      placeholder_status
    )
    VALUES (
      target_student_id,
      student_first,
      student_last,
      normalized_email,
      COALESCE(p_level, 'Beginner'),
      COALESCE(p_studying_year, 'N/A'),
      CONCAT('student_', substr(md5(target_student_id::text), 1, 6)),
      FALSE,
      NULL,
      'accepted'
    )
    ON CONFLICT (id) DO UPDATE
      SET first_name = COALESCE(EXCLUDED.first_name, students.first_name),
          last_name = COALESCE(EXCLUDED.last_name, students.last_name),
          email = EXCLUDED.email,
          level = COALESCE(EXCLUDED.level, students.level),
          studying_year = COALESCE(EXCLUDED.studying_year, students.studying_year),
          is_placeholder = FALSE,
          invited_by_teacher = NULL,
          placeholder_status = 'accepted';
  ELSE
    pending_username := CONCAT('pending_', substr(md5(gen_random_uuid()::text), 1, 8));

    INSERT INTO students (
      first_name,
      last_name,
      email,
      level,
      studying_year,
      username,
      is_placeholder,
      invited_by_teacher,
      placeholder_status
    )
    VALUES (
      student_first,
      student_last,
      normalized_email,
      COALESCE(p_level, 'Beginner'),
      COALESCE(p_studying_year, 'N/A'),
      pending_username,
      TRUE,
      current_teacher_id,
      'pending'
    )
    RETURNING id INTO target_student_id;
  END IF;

  SELECT id, status
    INTO connection_record
    FROM teacher_student_connections
    WHERE teacher_student_connections.teacher_id = current_teacher_id
      AND teacher_student_connections.student_id = target_student_id
    LIMIT 1;

  IF connection_record.id IS NOT NULL THEN
    RAISE EXCEPTION 'Connection already exists with status: %', connection_record.status;
  END IF;

  INSERT INTO teacher_student_connections (
    teacher_id,
    student_id,
    status,
    connected_at
  )
  VALUES (
    current_teacher_id,
    target_student_id,
    CASE WHEN requires_signup THEN 'pending' ELSE 'accepted' END,
    COALESCE(p_start_date, NOW())
  )
  RETURNING id INTO connection_record;

  RETURN QUERY
    SELECT
      target_student_id,
      trim(both ' ' FROM CONCAT(student_first, ' ', student_last)) AS student_name,
      normalized_email AS email,
      CASE WHEN requires_signup THEN 'pending' ELSE 'accepted' END AS connection_status,
      connection_record.id AS connection_id,
      requires_signup AS needs_signup,
      existing_student AS was_existing_student;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.teacher_link_student(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TIMESTAMPTZ
) TO authenticated;

---------------------------------------------
-- 3. RPC: promote_placeholder_student
---------------------------------------------
DROP FUNCTION IF EXISTS public.promote_placeholder_student(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.promote_placeholder_student(
  p_student_id UUID,
  p_student_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  normalized_email TEXT := lower(trim(p_student_email));
  placeholder_ids UUID[];
BEGIN
  IF p_student_id IS NULL THEN
    RAISE EXCEPTION 'Student id is required';
  END IF;

  IF normalized_email IS NULL OR normalized_email = '' THEN
    RAISE EXCEPTION 'Student email is required';
  END IF;

   SELECT ARRAY_AGG(s.id)
    INTO placeholder_ids
    FROM students AS s
    WHERE lower(s.email) = normalized_email
      AND s.id <> p_student_id;

  IF placeholder_ids IS NULL OR array_length(placeholder_ids, 1) = 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE teacher_student_connections
    SET student_id = p_student_id,
        status = 'accepted'
    WHERE student_id = ANY(placeholder_ids);

  UPDATE assignment_submissions
    SET student_id = p_student_id
    WHERE student_id = ANY(placeholder_ids);

  UPDATE notifications
    SET recipient_id = p_student_id
    WHERE recipient_id = ANY(placeholder_ids);

  UPDATE students_total_score
    SET student_id = p_student_id
    WHERE student_id = ANY(placeholder_ids);

  UPDATE current_streak
    SET student_id = p_student_id
    WHERE student_id = ANY(placeholder_ids);

  UPDATE highest_streak
    SET student_id = p_student_id
    WHERE student_id = ANY(placeholder_ids);

  UPDATE last_practiced_date
    SET student_id = p_student_id
    WHERE student_id = ANY(placeholder_ids);

  DELETE FROM students
    WHERE id = ANY(placeholder_ids)
      AND id <> p_student_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.promote_placeholder_student(UUID, TEXT) TO authenticated;

