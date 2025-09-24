-- Debug Student-Teacher Connection and Recordings
-- Run this in Supabase SQL Editor to check what's happening

-- STEP 1: Check all users in auth.users
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  created_at,
  updated_at
FROM auth.users 
ORDER BY created_at DESC;

-- STEP 2: Check teacher profiles
SELECT 
  id,
  first_name,
  last_name,
  email,
  is_active,
  created_at
FROM teachers
ORDER BY created_at DESC;

-- STEP 3: Check student profiles
SELECT 
  id,
  first_name,
  last_name,
  email,
  username,
  level,
  created_at
FROM students
ORDER BY created_at DESC;

-- STEP 4: Check teacher-student connections
SELECT 
  tsc.id,
  tsc.teacher_id,
  tsc.student_id,
  tsc.status,
  tsc.connected_at,
  tsc.created_at,
  t.email AS teacher_email,
  s.email AS student_email,
  CONCAT(s.first_name, ' ', s.last_name) AS student_name
FROM teacher_student_connections tsc
LEFT JOIN teachers t ON t.id = tsc.teacher_id
LEFT JOIN students s ON s.id = tsc.student_id
ORDER BY tsc.created_at DESC;

-- STEP 5: Check practice sessions (recordings)
SELECT 
  ps.id,
  ps.student_id,
  ps.recording_url,
  ps.status,
  ps.submitted_at,
  ps.duration,
  ps.recording_description,
  s.email AS student_email,
  CONCAT(s.first_name, ' ', s.last_name) AS student_name
FROM practice_sessions ps
LEFT JOIN students s ON s.id = ps.student_id
WHERE ps.recording_url IS NOT NULL
ORDER BY ps.submitted_at DESC;

-- STEP 6: Check if there are recordings from students who have teacher connections
SELECT 
  ps.id AS session_id,
  ps.student_id,
  ps.recording_url,
  ps.status,
  ps.submitted_at,
  s.email AS student_email,
  tsc.teacher_id,
  t.email AS teacher_email,
  tsc.status AS connection_status
FROM practice_sessions ps
JOIN students s ON s.id = ps.student_id
LEFT JOIN teacher_student_connections tsc ON tsc.student_id = ps.student_id AND tsc.status = 'accepted'
LEFT JOIN teachers t ON t.id = tsc.teacher_id
WHERE ps.recording_url IS NOT NULL
ORDER BY ps.submitted_at DESC;

-- STEP 7: Simulate what getTeacherRecordings() should return for a specific teacher
-- Replace 'YOUR_TEACHER_ID' with your actual teacher user ID
SELECT 
  ps.id,
  ps.student_id,
  ps.recording_url,
  ps.submitted_at,
  ps.duration,
  ps.analysis_score,
  ps.teacher_feedback,
  ps.status,
  ps.notes_played,
  ps.recording_description,
  ps.reviewed_at,
  s.first_name,
  s.last_name,
  s.username,
  s.email
FROM practice_sessions ps
JOIN students s ON s.id = ps.student_id
WHERE ps.student_id IN (
  SELECT student_id 
  FROM teacher_student_connections 
  WHERE teacher_id = 'YOUR_TEACHER_ID' -- Replace with your teacher ID
)
AND ps.recording_url IS NOT NULL
ORDER BY ps.submitted_at DESC; 