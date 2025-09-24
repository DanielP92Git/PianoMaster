-- Sample Teacher Data for Testing Teacher Dashboard
-- Run this in Supabase SQL Editor after ensuring you have a test teacher user

-- Note: Replace 'your-teacher-user-id' with an actual user ID from auth.users
-- You can get this from the Supabase Auth users table

-- Insert sample teacher profile
-- IMPORTANT: Replace the UUID below with your actual teacher user ID
INSERT INTO teachers (id, first_name, last_name, email, school_name, department, bio, is_active)
VALUES (
  'your-teacher-user-id',  -- Replace with actual user ID
  'Professor',
  'Williams', 
  'teacher@example.com',
  'Harmony Music Academy',
  'Piano & Theory',
  'Experienced piano instructor with 15 years of teaching experience.',
  true
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  school_name = EXCLUDED.school_name,
  department = EXCLUDED.department,
  bio = EXCLUDED.bio;

-- Insert sample classes
INSERT INTO classes (teacher_id, name, description, grade_level, subject, is_active, max_students)
VALUES 
  ('your-teacher-user-id', 'Beginner Piano', 'Introduction to piano fundamentals and basic theory', 'Elementary', 'Piano', true, 20),
  ('your-teacher-user-id', 'Intermediate Piano', 'Building technique and exploring classical repertoire', 'Middle School', 'Piano', true, 15),
  ('your-teacher-user-id', 'Music Theory Basics', 'Understanding scales, chords, and harmony', 'All Levels', 'Theory', true, 25)
ON CONFLICT DO NOTHING;

-- Note: To properly test, you'll also need actual student users in auth.users
-- For testing purposes, you can create sample students through the normal signup process
-- Then manually enroll them in classes using the class codes generated above

-- Get the class codes that were generated
SELECT name, class_code FROM classes WHERE teacher_id = 'your-teacher-user-id';

-- Sample assignments (optional)
INSERT INTO assignments (teacher_id, class_id, title, description, instructions, assignment_type, due_date, points_possible, requirements)
SELECT 
  'your-teacher-user-id',
  c.id,
  'Daily Practice Session',
  'Complete 30 minutes of focused practice',
  'Practice your assigned pieces for at least 30 minutes. Focus on proper technique and rhythm.',
  'practice',
  NOW() + INTERVAL '7 days',
  100,
  '{"minimum_practice_time": 30, "focus_areas": ["technique", "rhythm"]}'::jsonb
FROM classes c 
WHERE c.teacher_id = 'your-teacher-user-id' AND c.name = 'Beginner Piano';

-- Sample notifications
INSERT INTO notifications (recipient_id, sender_id, type, title, message, priority)
VALUES (
  'your-teacher-user-id',
  'your-teacher-user-id', 
  'system',
  'Welcome to Teacher Dashboard!',
  'Your teacher dashboard is now set up and ready to use. You can manage classes, view student progress, and track assignments.',
  'normal'
);

-- Instructions for testing:
-- 1. Replace 'your-teacher-user-id' with your actual user ID from auth.users
-- 2. Create some student accounts through normal signup
-- 3. Use the generated class codes to enroll students in classes
-- 4. Test the Teacher Dashboard functionality

COMMENT ON SCRIPT IS 'Sample data for testing Teacher Dashboard functionality'; 