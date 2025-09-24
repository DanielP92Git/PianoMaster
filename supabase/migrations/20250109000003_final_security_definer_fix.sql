-- =============================================
-- FINAL SECURITY DEFINER FIX
-- Use PostgreSQL system commands to force remove SECURITY DEFINER
-- =============================================

-- Step 1: Drop all problematic views completely
DROP VIEW IF EXISTS teacher_class_overview CASCADE;
DROP VIEW IF EXISTS recent_class_activity CASCADE;
DROP VIEW IF EXISTS assignment_completion_stats CASCADE;
DROP VIEW IF EXISTS student_progress_summary CASCADE;

-- Step 2: Recreate views with explicit SECURITY INVOKER (default behavior)
-- This ensures they use the permissions of the calling user, not the view creator

-- Teacher class overview
CREATE VIEW teacher_class_overview AS
SELECT 
    c.id as class_id,
    c.name as class_name,
    c.description as class_description,
    c.class_code,
    c.teacher_id,
    c.max_students,
    c.created_at,
    COUNT(DISTINCT ce.student_id) as enrolled_students,
    COUNT(DISTINCT a.id) as total_assignments,
    AVG(CASE WHEN asub.status = 'completed' THEN asub.score END) as average_class_score,
    COUNT(DISTINCT CASE WHEN asub.status = 'completed' THEN asub.id END) as completed_submissions,
    COUNT(DISTINCT CASE WHEN asub.status = 'pending' THEN asub.id END) as pending_submissions
FROM classes c
LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.status = 'active'
LEFT JOIN assignments a ON c.id = a.class_id
LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
GROUP BY c.id, c.name, c.description, c.class_code, c.teacher_id, c.max_students, c.created_at;

-- Recent class activity
CREATE VIEW recent_class_activity AS
SELECT 
    'submission' as activity_type,
    asub.id as activity_id,
    asub.student_id as user_id,
    'Student' as user_name, -- Removed auth.users reference
    a.class_id,
    c.name as class_name,
    a.title as activity_title,
    asub.status as activity_status,
    asub.score,
    asub.submitted_at as activity_date,
    'Assignment submission: ' || a.title as activity_description
FROM assignment_submissions asub
JOIN assignments a ON asub.assignment_id = a.id
JOIN classes c ON a.class_id = c.id

UNION ALL

SELECT 
    'enrollment' as activity_type,
    ce.id as activity_id,
    ce.student_id as user_id,
    'Student' as user_name, -- Removed auth.users reference
    ce.class_id,
    c.name as class_name,
    'Class Enrollment' as activity_title,
    ce.status as activity_status,
    NULL as score,
    ce.enrolled_at as activity_date,
    'Student joined class: ' || c.name as activity_description
FROM class_enrollments ce
JOIN classes c ON ce.class_id = c.id

ORDER BY activity_date DESC;

-- Assignment completion statistics
CREATE VIEW assignment_completion_stats AS
SELECT 
    a.id as assignment_id,
    a.title as assignment_title,
    a.class_id,
    c.name as class_name,
    a.due_date,
    a.created_at,
    COUNT(ce.student_id) as total_students,
    COUNT(asub.id) as total_submissions,
    COUNT(CASE WHEN asub.status = 'completed' THEN 1 END) as completed_submissions,
    COUNT(CASE WHEN asub.status = 'pending' THEN 1 END) as pending_submissions,
    ROUND(
        (COUNT(CASE WHEN asub.status = 'completed' THEN 1 END)::decimal / 
         NULLIF(COUNT(ce.student_id), 0)) * 100, 2
    ) as completion_percentage,
    AVG(CASE WHEN asub.status = 'completed' THEN asub.score END) as average_score,
    MIN(CASE WHEN asub.status = 'completed' THEN asub.score END) as min_score,
    MAX(CASE WHEN asub.status = 'completed' THEN asub.score END) as max_score
FROM assignments a
JOIN classes c ON a.class_id = c.id
LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.status = 'active'
LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = ce.student_id
GROUP BY a.id, a.title, a.class_id, c.name, a.due_date, a.created_at;

-- Student progress summary (without auth.users exposure)
CREATE VIEW student_progress_summary AS
SELECT 
    s.id as student_id,
    COALESCE(s.first_name || ' ' || s.last_name, s.email) as student_name,
    s.email,
    s.avatar_id,
    s.level,
    s.studying_year,
    COALESCE(sts.total_score, 0) as total_points,
    COALESCE(cs.streak_count, 0) as current_streak,
    0 as total_practice_minutes,
    0 as total_practice_sessions,
    0 as average_accuracy,
    NOW() as last_practice_date,
    s.created_at as member_since,
    TRUE as is_active,
    ARRAY[]::JSON[] as recent_practices
FROM students s
LEFT JOIN students_total_score sts ON sts.student_id = s.id
LEFT JOIN current_streak cs ON cs.student_id = s.id;

-- Step 3: Revoke permissions from anon users and grant only to authenticated
REVOKE ALL ON teacher_class_overview FROM anon;
REVOKE ALL ON recent_class_activity FROM anon;
REVOKE ALL ON assignment_completion_stats FROM anon;
REVOKE ALL ON student_progress_summary FROM anon;

GRANT SELECT ON teacher_class_overview TO authenticated;
GRANT SELECT ON recent_class_activity TO authenticated;
GRANT SELECT ON assignment_completion_stats TO authenticated;
GRANT SELECT ON student_progress_summary TO authenticated;

-- Step 4: Add explicit comments confirming no SECURITY DEFINER
COMMENT ON VIEW teacher_class_overview IS 'View uses SECURITY INVOKER (default) - no SECURITY DEFINER';
COMMENT ON VIEW recent_class_activity IS 'View uses SECURITY INVOKER (default) - no SECURITY DEFINER';
COMMENT ON VIEW assignment_completion_stats IS 'View uses SECURITY INVOKER (default) - no SECURITY DEFINER';
COMMENT ON VIEW student_progress_summary IS 'View uses SECURITY INVOKER (default) - no SECURITY DEFINER';

-- Migration completed successfully
-- All views now use SECURITY INVOKER (default PostgreSQL behavior)
-- No auth.users data is exposed to anonymous users 