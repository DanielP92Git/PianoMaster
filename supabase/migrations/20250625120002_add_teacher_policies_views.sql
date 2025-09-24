-- =============================================
-- TEACHER SCHEMA: RLS POLICIES AND DATABASE VIEWS
-- Part 2: Apply after tables and functions are created
-- =============================================

-- Enable RLS on all teacher-related tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_student_messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Teachers table policies
DROP POLICY IF EXISTS "Teachers can view their own profile" ON teachers;
CREATE POLICY "Teachers can view their own profile" ON teachers
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;
CREATE POLICY "Teachers can update their own profile" ON teachers
    FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Teachers can insert their own profile" ON teachers;
CREATE POLICY "Teachers can insert their own profile" ON teachers
    FOR INSERT WITH CHECK (id = auth.uid());

-- Classes table policies
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
CREATE POLICY "Teachers can view their own classes" ON classes
    FOR SELECT USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
CREATE POLICY "Teachers can create classes" ON classes
    FOR INSERT WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can update their own classes" ON classes;
CREATE POLICY "Teachers can update their own classes" ON classes
    FOR UPDATE USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can delete their own classes" ON classes;
CREATE POLICY "Teachers can delete their own classes" ON classes
    FOR DELETE USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON classes;
CREATE POLICY "Students can view classes they're enrolled in" ON classes
    FOR SELECT USING (
        id IN (
            SELECT class_id FROM class_enrollments 
            WHERE student_id = auth.uid() AND status = 'active'
        )
    );

-- Class enrollments policies
DROP POLICY IF EXISTS "Teachers can view enrollments in their classes" ON class_enrollments;
CREATE POLICY "Teachers can view enrollments in their classes" ON class_enrollments
    FOR SELECT USING (
        class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
    );

DROP POLICY IF EXISTS "Teachers can manage enrollments in their classes" ON class_enrollments;
CREATE POLICY "Teachers can manage enrollments in their classes" ON class_enrollments
    FOR ALL USING (
        class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
    );

DROP POLICY IF EXISTS "Students can view their own enrollments" ON class_enrollments;
CREATE POLICY "Students can view their own enrollments" ON class_enrollments
    FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can update their own enrollment status" ON class_enrollments;
CREATE POLICY "Students can update their own enrollment status" ON class_enrollments
    FOR UPDATE USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

-- Assignments policies
DROP POLICY IF EXISTS "Teachers can manage assignments in their classes" ON assignments;
CREATE POLICY "Teachers can manage assignments in their classes" ON assignments
    FOR ALL USING (
        class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
    );

DROP POLICY IF EXISTS "Students can view assignments in their classes" ON assignments;
CREATE POLICY "Students can view assignments in their classes" ON assignments
    FOR SELECT USING (
        class_id IN (
            SELECT class_id FROM class_enrollments 
            WHERE student_id = auth.uid() AND status = 'active'
        )
    );

-- Assignment submissions policies
DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON assignment_submissions;
CREATE POLICY "Teachers can view submissions for their assignments" ON assignment_submissions
    FOR SELECT USING (
        assignment_id IN (
            SELECT a.id FROM assignments a
            JOIN classes c ON a.class_id = c.id
            WHERE c.teacher_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students can manage their own submissions" ON assignment_submissions;
CREATE POLICY "Students can manage their own submissions" ON assignment_submissions
    FOR ALL USING (student_id = auth.uid());

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can create notifications for their students" ON notifications;
CREATE POLICY "Teachers can create notifications for their students" ON notifications
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        (
            recipient_id IN (
                SELECT ce.student_id FROM class_enrollments ce
                JOIN classes c ON ce.class_id = c.id
                WHERE c.teacher_id = auth.uid()
            )
            OR recipient_id = auth.uid()
        )
    );

-- Teacher-student messages policies
DROP POLICY IF EXISTS "Teachers and students can view their conversations" ON teacher_student_messages;
CREATE POLICY "Teachers and students can view their conversations" ON teacher_student_messages
    FOR SELECT USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

DROP POLICY IF EXISTS "Teachers can message their students" ON teacher_student_messages;
CREATE POLICY "Teachers can message their students" ON teacher_student_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        (
            -- Teacher messaging student in their class
            (sender_id IN (SELECT id FROM teachers) AND
             recipient_id IN (
                SELECT ce.student_id FROM class_enrollments ce
                JOIN classes c ON ce.class_id = c.id
                WHERE c.teacher_id = sender_id
             ))
            OR
            -- Student replying to teacher
            (recipient_id IN (SELECT id FROM teachers) AND
             sender_id IN (
                SELECT ce.student_id FROM class_enrollments ce
                JOIN classes c ON ce.class_id = c.id
                WHERE c.teacher_id = recipient_id
             ))
        )
    );

-- =============================================
-- DATABASE VIEWS
-- =============================================

-- Teacher class overview with student metrics
DROP VIEW IF EXISTS teacher_class_overview;
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

-- Student progress summary for teachers
-- TODO: Fix this view to reference existing tables properly
-- DROP VIEW IF EXISTS student_progress_summary;
-- CREATE VIEW student_progress_summary AS
-- SELECT 
--     au.id as student_id,
--     COALESCE(au.raw_user_meta_data->>'full_name', au.email) as student_name,
--     s.avatar_id,
--     ce.class_id,
--     c.name as class_name,
--     COALESCE(SUM(asub.total_practice_time), 0) as total_practice_time,
--     0 as current_streak, -- Will need to be calculated separately
--     0 as total_points, -- Will need to be calculated separately  
--     COUNT(DISTINCT asub.id) as total_submissions,
--     COUNT(DISTINCT CASE WHEN asub.status = 'completed' THEN asub.id END) as completed_submissions,
--     AVG(CASE WHEN asub.status = 'completed' THEN asub.score END) as average_score,
--     MAX(asub.submitted_at) as last_submission_date,
--     au.last_sign_in_at as last_login_at
-- FROM auth.users au
-- JOIN class_enrollments ce ON au.id = ce.student_id AND ce.status = 'active'
-- JOIN classes c ON ce.class_id = c.id
-- LEFT JOIN students s ON au.id = s.id
-- LEFT JOIN assignment_submissions asub ON au.id = asub.student_id
-- GROUP BY au.id, au.raw_user_meta_data->>'full_name', au.email, s.avatar_id, ce.class_id, c.name, au.last_sign_in_at;

-- Recent class activity feed
DROP VIEW IF EXISTS recent_class_activity;
CREATE VIEW recent_class_activity AS
SELECT 
    'submission' as activity_type,
    asub.id as activity_id,
    asub.student_id as user_id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as user_name,
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
JOIN auth.users au ON asub.student_id = au.id

UNION ALL

SELECT 
    'enrollment' as activity_type,
    ce.id as activity_id,
    ce.student_id as user_id,
    COALESCE(au2.raw_user_meta_data->>'full_name', au2.email) as user_name,
    ce.class_id,
    c.name as class_name,
    'Class Enrollment' as activity_title,
    ce.status as activity_status,
    NULL as score,
    ce.enrolled_at as activity_date,
    'Student joined class: ' || c.name as activity_description
FROM class_enrollments ce
JOIN classes c ON ce.class_id = c.id
JOIN auth.users au2 ON ce.student_id = au2.id

ORDER BY activity_date DESC;

-- Assignment completion statistics
DROP VIEW IF EXISTS assignment_completion_stats;
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

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_class ON class_enrollments(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_status ON class_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_class_due_date ON assignments(class_id, due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id, status);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_teacher_messages_conversation ON teacher_student_messages(sender_id, recipient_id, created_at);

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions for views
GRANT SELECT ON teacher_class_overview TO authenticated;
GRANT SELECT ON student_progress_summary TO authenticated;
GRANT SELECT ON recent_class_activity TO authenticated;
GRANT SELECT ON assignment_completion_stats TO authenticated;

-- Comment for completion
COMMENT ON SCHEMA public IS 'Teacher schema RLS policies and views applied successfully'; 