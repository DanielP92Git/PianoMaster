-- Fix teacher_link_student RPC to handle:
-- 1. Existing students in students table (email unique constraint conflict)
-- 2. Always create 'accepted' connections for teacher-added students
-- 3. Re-link if connection already exists (update status instead of raising exception)

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
  conn_id UUID;
  conn_status TEXT;
  teacher_active BOOLEAN;
  auth_student RECORD;
  db_student_id UUID;
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

  -- 1. Check auth.users for existing account
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

  -- 2. Upsert into students table (handles both id and email conflicts)
  IF existing_student THEN
    -- Check if student already exists in students table by id OR email
    SELECT s.id INTO db_student_id
      FROM students s
      WHERE s.id = target_student_id OR lower(s.email) = normalized_email
      LIMIT 1;

    IF db_student_id IS NOT NULL THEN
      -- Student row exists — update it, use existing id
      target_student_id := db_student_id;
      UPDATE students
        SET first_name = COALESCE(p_first_name, students.first_name),
            last_name = COALESCE(p_last_name, students.last_name),
            email = normalized_email,
            level = COALESCE(p_level, students.level),
            studying_year = COALESCE(p_studying_year, students.studying_year),
            is_placeholder = FALSE,
            placeholder_status = 'accepted'
        WHERE id = db_student_id;
    ELSE
      -- No row yet — insert fresh
      INSERT INTO students (
        id, first_name, last_name, email, level, studying_year,
        username, is_placeholder, invited_by_teacher, placeholder_status
      )
      VALUES (
        target_student_id,
        student_first, student_last, normalized_email,
        COALESCE(p_level, 'Beginner'), COALESCE(p_studying_year, 'N/A'),
        CONCAT('student_', substr(md5(target_student_id::text), 1, 6)),
        FALSE, NULL, 'accepted'
      );
    END IF;
  ELSE
    -- Unregistered email — check for existing placeholder
    SELECT s.id INTO db_student_id
      FROM students s
      WHERE lower(s.email) = normalized_email
      LIMIT 1;

    IF db_student_id IS NOT NULL THEN
      -- Placeholder already exists, reuse it
      target_student_id := db_student_id;
    ELSE
      -- Create new placeholder
      pending_username := CONCAT('pending_', substr(md5(gen_random_uuid()::text), 1, 8));
      INSERT INTO students (
        first_name, last_name, email, level, studying_year,
        username, is_placeholder, invited_by_teacher, placeholder_status
      )
      VALUES (
        student_first, student_last, normalized_email,
        COALESCE(p_level, 'Beginner'), COALESCE(p_studying_year, 'N/A'),
        pending_username, TRUE, current_teacher_id, 'pending'
      )
      RETURNING id INTO target_student_id;
    END IF;
  END IF;

  -- 3. Upsert connection — always set to 'accepted' for teacher-added students
  SELECT tc.id, tc.status
    INTO conn_id, conn_status
    FROM teacher_student_connections tc
    WHERE tc.teacher_id = current_teacher_id
      AND tc.student_id = target_student_id
    LIMIT 1;

  IF conn_id IS NOT NULL THEN
    -- Connection exists — update to accepted if not already
    IF conn_status <> 'accepted' THEN
      UPDATE teacher_student_connections
        SET status = 'accepted',
            connected_at = COALESCE(p_start_date, connected_at)
        WHERE id = conn_id;
    END IF;
  ELSE
    -- Create new connection as accepted
    INSERT INTO teacher_student_connections (
      teacher_id, student_id, status, connected_at
    )
    VALUES (
      current_teacher_id, target_student_id, 'accepted',
      COALESCE(p_start_date, NOW())
    )
    RETURNING id INTO conn_id;
  END IF;

  RETURN QUERY
    SELECT
      target_student_id,
      trim(both ' ' FROM CONCAT(student_first, ' ', student_last)),
      normalized_email,
      'accepted'::TEXT,
      conn_id,
      requires_signup,
      existing_student;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions;
