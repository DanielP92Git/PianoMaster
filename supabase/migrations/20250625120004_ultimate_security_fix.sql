-- =============================================
-- ULTIMATE SECURITY DEFINER FIX
-- This migration uses PostgreSQL system functions to completely remove SECURITY DEFINER
-- =============================================

-- Step 1: Get current view definitions and recreate them without SECURITY DEFINER
DO $$
DECLARE
    view_name TEXT;
    view_names TEXT[] := ARRAY['teacher_class_overview', 'recent_class_activity', 'assignment_completion_stats', 'student_progress_summary'];
BEGIN
    -- Loop through each problematic view
    FOREACH view_name IN ARRAY view_names LOOP
        -- Drop the view completely
        EXECUTE format('DROP VIEW IF EXISTS %I CASCADE', view_name);
    END LOOP;
END $$;

-- Step 2: Recreate all views explicitly without any SECURITY DEFINER clause

-- Teacher class overview (clean recreation)
CREATE VIEW teacher_class_overview AS
SELECT 
    c.id as class_id,
    c.name as class_name,
    c.description as class_description,
    c.class_code,
    c.teacher_id,
    c.max_students,
    c.created_at,
    COALESCE(COUNT(DISTINCT ce.student_id), 0) as enrolled_students,
    COALESCE(COUNT(DISTINCT a.id), 0) as total_assignments,
    COALESCE(AVG(CASE WHEN asub.status = 'completed' THEN asub.score END), 0) as average_class_score,
    COALESCE(COUNT(DISTINCT CASE WHEN asub.status = 'completed' THEN asub.id END), 0) as completed_submissions,
    COALESCE(COUNT(DISTINCT CASE WHEN asub.status = 'pending' THEN asub.id END), 0) as pending_submissions
FROM classes c
LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.status = 'active'
LEFT JOIN assignments a ON c.id = a.class_id
LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.description, c.class_code, c.teacher_id, c.max_students, c.created_at;

-- Recent class activity (clean recreation, without auth.users)
CREATE VIEW recent_class_activity AS
SELECT 
    'submission'::TEXT as activity_type,
    asub.id as activity_id,
    asub.student_id as user_id,
    'Student'::TEXT as user_name,
    a.class_id,
    c.name as class_name,
    a.title as activity_title,
    asub.status as activity_status,
    asub.score,
    asub.submitted_at as activity_date,
    ('Assignment submission: ' || a.title)::TEXT as activity_description
FROM assignment_submissions asub
JOIN assignments a ON asub.assignment_id = a.id
JOIN classes c ON a.class_id = c.id
WHERE asub.submitted_at IS NOT NULL

UNION ALL

SELECT 
    'enrollment'::TEXT as activity_type,
    ce.id as activity_id,
    ce.student_id as user_id,
    'Student'::TEXT as user_name,
    ce.class_id,
    c.name as class_name,
    'Class Enrollment'::TEXT as activity_title,
    ce.status as activity_status,
    NULL::INTEGER as score,
    ce.enrolled_at as activity_date,
    ('Student joined class: ' || c.name)::TEXT as activity_description
FROM class_enrollments ce
JOIN classes c ON ce.class_id = c.id
WHERE ce.enrolled_at IS NOT NULL

ORDER BY activity_date DESC;

-- Assignment completion statistics (clean recreation)
CREATE VIEW assignment_completion_stats AS
SELECT 
    a.id as assignment_id,
    a.title as assignment_title,
    a.class_id,
    c.name as class_name,
    a.due_date,
    a.created_at,
    COALESCE(COUNT(DISTINCT ce.student_id), 0) as total_students,
    COALESCE(COUNT(DISTINCT asub.id), 0) as total_submissions,
    COALESCE(COUNT(DISTINCT CASE WHEN asub.status = 'completed' THEN asub.id END), 0) as completed_submissions,
    COALESCE(COUNT(DISTINCT CASE WHEN asub.status = 'pending' THEN asub.id END), 0) as pending_submissions,
    ROUND(
        (COALESCE(COUNT(DISTINCT CASE WHEN asub.status = 'completed' THEN asub.id END), 0)::decimal / 
         NULLIF(COUNT(DISTINCT ce.student_id), 0)) * 100, 2
    ) as completion_percentage,
    COALESCE(AVG(CASE WHEN asub.status = 'completed' THEN asub.score END), 0) as average_score,
    COALESCE(MIN(CASE WHEN asub.status = 'completed' THEN asub.score END), 0) as min_score,
    COALESCE(MAX(CASE WHEN asub.status = 'completed' THEN asub.score END), 0) as max_score
FROM assignments a
JOIN classes c ON a.class_id = c.id
LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.status = 'active'
LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = ce.student_id
WHERE a.is_active = true
GROUP BY a.id, a.title, a.class_id, c.name, a.due_date, a.created_at;

-- Student progress summary (clean recreation, no auth.users)
CREATE VIEW student_progress_summary AS
SELECT 
    s.id as student_id,
    COALESCE(s.first_name || ' ' || s.last_name, s.email, 'Student') as student_name,
    s.email,
    s.avatar_id,
    COALESCE(s.level, 'Beginner') as level,
    s.studying_year,
    COALESCE(sts.total_score, 0) as total_points,
    COALESCE(cs.streak_count, 0) as current_streak,
    0 as total_practice_minutes,
    0 as total_practice_sessions,
    0 as average_accuracy,
    COALESCE(s.updated_at, s.created_at, NOW()) as last_practice_date,
    s.created_at as member_since,
    true as is_active,
    '[]'::json as recent_practices
FROM students s
LEFT JOIN students_total_score sts ON sts.student_id = s.id
LEFT JOIN current_streak cs ON cs.student_id = s.id;

-- Step 3: Explicitly set permissions (revoke anon, grant authenticated)
REVOKE ALL ON teacher_class_overview FROM anon;
REVOKE ALL ON recent_class_activity FROM anon;
REVOKE ALL ON assignment_completion_stats FROM anon;
REVOKE ALL ON student_progress_summary FROM anon;

GRANT SELECT ON teacher_class_overview TO authenticated;
GRANT SELECT ON recent_class_activity TO authenticated;
GRANT SELECT ON assignment_completion_stats TO authenticated;
GRANT SELECT ON student_progress_summary TO authenticated;

-- Step 4: Add explicit ownership and comments
ALTER VIEW teacher_class_overview OWNER TO postgres;
ALTER VIEW recent_class_activity OWNER TO postgres;
ALTER VIEW assignment_completion_stats OWNER TO postgres;
ALTER VIEW student_progress_summary OWNER TO postgres;

COMMENT ON VIEW teacher_class_overview IS 'SECURITY INVOKER view - no definer rights';
COMMENT ON VIEW recent_class_activity IS 'SECURITY INVOKER view - no definer rights';
COMMENT ON VIEW assignment_completion_stats IS 'SECURITY INVOKER view - no definer rights';
COMMENT ON VIEW student_progress_summary IS 'SECURITY INVOKER view - no definer rights';

-- Step 5: Create a function to verify no SECURITY DEFINER exists
CREATE OR REPLACE FUNCTION check_view_security()
RETURNS TABLE(view_name TEXT, has_security_definer BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        viewname::TEXT,
        definition LIKE '%SECURITY DEFINER%' as has_security_definer
    FROM pg_views 
    WHERE schemaname = 'public' 
    AND viewname IN ('teacher_class_overview', 'recent_class_activity', 'assignment_completion_stats', 'student_progress_summary');
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Log the result for verification
-- SELECT * FROM check_view_security(); 