-- Run this query to debug why teacher can't create students
-- This will show you the current state of your account

-- 1. Check current authenticated user
SELECT 
    'Current User' as check_type,
    auth.uid() as user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as email,
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) as role_in_metadata;

-- 2. Check if user exists in teachers table
SELECT 
    'Teacher Record' as check_type,
    id,
    email,
    first_name,
    is_active,
    created_at
FROM public.teachers
WHERE id = auth.uid();

-- 3. Check existing RLS policies on students table
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'students'
ORDER BY policyname;

-- 4. Test if the teacher exists check would pass
SELECT 
    'Policy Check Test' as check_type,
    EXISTS (
        SELECT 1 FROM public.teachers 
        WHERE id = auth.uid() 
        AND is_active = true
    ) as would_pass_check;

-- 5. List all teachers in the database
SELECT 
    'All Teachers' as check_type,
    id,
    email,
    first_name,
    is_active
FROM public.teachers
ORDER BY created_at DESC;


