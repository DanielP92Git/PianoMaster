-- Test Recording Query
-- Run this in Supabase SQL Editor to verify the recording can be found

-- STEP 1: Check if practice session exists with recording
SELECT 
  id,
  student_id,
  recording_url,
  status,
  submitted_at,
  duration,
  recording_description,
  teacher_feedback
FROM practice_sessions 
WHERE student_id = '107dbcbe-44bd-4daa-82a9-e9273a10d6eb'
  AND recording_url IS NOT NULL
ORDER BY submitted_at DESC;

-- STEP 2: Check the exact recording_url value and data types
SELECT 
  id,
  student_id,
  recording_url,
  LENGTH(recording_url) as url_length,
  recording_url IS NULL as is_null,
  recording_url = '' as is_empty_string,
  status,
  submitted_at
FROM practice_sessions 
WHERE student_id = '107dbcbe-44bd-4daa-82a9-e9273a10d6eb';

-- STEP 3: Test with the IN filter (simulating the API query)
SELECT 
  id,
  student_id,
  recording_url,
  status,
  submitted_at
FROM practice_sessions 
WHERE student_id IN ('121bfa30-e656-4b93-92e3-dfec8495254b', '5989f9b8-a4d2-4d4d-9124-8d1d41fc3eb1', '107dbcbe-44bd-4daa-82a9-e9273a10d6eb')
  AND recording_url IS NOT NULL
ORDER BY submitted_at DESC;

-- STEP 4: Test with additional studentId filter (simulating filtered query)
SELECT 
  id,
  student_id,
  recording_url,
  status,
  submitted_at
FROM practice_sessions 
WHERE student_id IN ('121bfa30-e656-4b93-92e3-dfec8495254b', '5989f9b8-a4d2-4d4d-9124-8d1d41fc3eb1', '107dbcbe-44bd-4daa-82a9-e9273a10d6eb')
  AND recording_url IS NOT NULL
  AND student_id = '107dbcbe-44bd-4daa-82a9-e9273a10d6eb'
ORDER BY submitted_at DESC; 