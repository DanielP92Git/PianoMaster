-- Manual Student-Teacher Connection Script
-- Run this in Supabase SQL Editor to establish connections for testing

-- STEP 1: Get your actual user IDs
-- Replace these placeholders with your real user IDs from auth.users table

-- To find your user IDs, first run:
SELECT id, email, role FROM auth.users ORDER BY created_at DESC;

-- STEP 2: Create teacher profile if it doesn't exist
-- Replace 'YOUR_TEACHER_USER_ID' with the actual teacher user ID
INSERT INTO teachers (
  id, 
  first_name, 
  last_name, 
  email, 
  school_name, 
  department, 
  is_active
) VALUES (
  'YOUR_TEACHER_USER_ID',  -- Replace with actual teacher user ID
  'Test',
  'Teacher',
  'teacher@example.com',   -- Replace with actual teacher email
  'Test Music School',
  'Piano Department',
  true
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  school_name = EXCLUDED.school_name,
  department = EXCLUDED.department;

-- STEP 3: Create student-teacher connection
-- Replace both user IDs with your actual IDs
INSERT INTO teacher_student_connections (
  teacher_id,
  student_id,
  status,
  connected_at
) VALUES (
  'YOUR_TEACHER_USER_ID',  -- Replace with actual teacher user ID
  'YOUR_STUDENT_USER_ID',  -- Replace with actual student user ID
  'accepted',
  NOW()
) ON CONFLICT (teacher_id, student_id) DO UPDATE SET
  status = 'accepted',
  connected_at = NOW();

-- STEP 4: Verify the connection was created
SELECT 
  tsc.id,
  tsc.status,
  tsc.connected_at,
  t.first_name AS teacher_name,
  t.email AS teacher_email,
  s.first_name AS student_name,
  s.email AS student_email
FROM teacher_student_connections tsc
LEFT JOIN teachers t ON t.id = tsc.teacher_id
LEFT JOIN students s ON s.id = tsc.student_id
WHERE tsc.status = 'accepted'
ORDER BY tsc.connected_at DESC; 