-- Test if you can directly insert a student record
-- This will help us identify if it's the policy or something else

-- Try to insert a test student
INSERT INTO public.students (first_name, last_name, email, level, username, user_role)
VALUES (
    'Test',
    'Student',
    'test.student.delete.me@example.com',
    'beginner',
    'test_student',
    'student'
)
RETURNING *;

-- If the above succeeds, the policy works!
-- If it fails, we'll see the exact error

-- Clean up the test record
DELETE FROM public.students 
WHERE email = 'test.student.delete.me@example.com';


