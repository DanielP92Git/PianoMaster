-- Add user role support to distinguish between students and teachers
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'student';

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  school_name TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  grade_level TEXT,
  subject TEXT DEFAULT 'Music',
  class_code TEXT UNIQUE NOT NULL, -- 6-character code for students to join
  is_active BOOLEAN DEFAULT TRUE,
  max_students INTEGER DEFAULT 30,
  
  CONSTRAINT class_code_format CHECK (class_code ~ '^[A-Z0-9]{6}$')
);

-- Create class_enrollments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'withdrawn')),
  
  UNIQUE(class_id, student_id)
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE, -- NULL if assigned to all classes
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  assignment_type TEXT DEFAULT 'practice' CHECK (assignment_type IN ('practice', 'exercise', 'assessment', 'project')),
  due_date TIMESTAMPTZ,
  points_possible INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  requirements JSONB -- Store structured requirements (e.g., minimum practice time, specific exercises)
);

-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'graded', 'returned')),
  score INTEGER,
  feedback TEXT,
  practice_sessions INTEGER DEFAULT 0,
  total_practice_time INTEGER DEFAULT 0, -- in minutes
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  UNIQUE(assignment_id, student_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('achievement', 'assignment', 'message', 'reminder', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB, -- Store structured notification data
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Create teacher_student_messages table (for direct messaging)
CREATE TABLE IF NOT EXISTS teacher_student_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  reply_to UUID REFERENCES teacher_student_messages(id) ON DELETE SET NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_class_code ON classes(class_code);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON teacher_student_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON teacher_student_messages(recipient_id);

-- Create function to generate unique class codes
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate class codes
CREATE OR REPLACE FUNCTION ensure_class_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.class_code IS NULL THEN
    LOOP
      NEW.class_code := generate_class_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM classes WHERE class_code = NEW.class_code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for class code generation
DROP TRIGGER IF EXISTS trigger_ensure_class_code ON classes;
CREATE TRIGGER trigger_ensure_class_code
  BEFORE INSERT ON classes
  FOR EACH ROW
  EXECUTE FUNCTION ensure_class_code();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_teachers_updated_at ON teachers;
CREATE TRIGGER trigger_teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_classes_updated_at ON classes;
CREATE TRIGGER trigger_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_assignments_updated_at ON assignments;
CREATE TRIGGER trigger_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_assignment_submissions_updated_at ON assignment_submissions;
CREATE TRIGGER trigger_assignment_submissions_updated_at
  BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_student_messages ENABLE ROW LEVEL SECURITY;

-- Teachers table policies
DROP POLICY IF EXISTS "Teachers can view their own profile" ON teachers;
CREATE POLICY "Teachers can view their own profile" ON teachers
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;
CREATE POLICY "Teachers can update their own profile" ON teachers
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Teachers can insert their own profile" ON teachers;
CREATE POLICY "Teachers can insert their own profile" ON teachers
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Classes table policies
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON classes;
CREATE POLICY "Teachers can manage their own classes" ON classes
  FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Students can view classes they're enrolled in" ON classes;
CREATE POLICY "Students can view classes they're enrolled in" ON classes
  FOR SELECT USING (
    id IN (
      SELECT class_id FROM class_enrollments 
      WHERE student_id = auth.uid() AND status = 'active'
    )
  );

-- Class enrollments policies
DROP POLICY IF EXISTS "Teachers can manage enrollments for their classes" ON class_enrollments;
CREATE POLICY "Teachers can manage enrollments for their classes" ON class_enrollments
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can view their own enrollments" ON class_enrollments;
CREATE POLICY "Students can view their own enrollments" ON class_enrollments
  FOR SELECT USING (auth.uid() = student_id);

-- Assignments policies
DROP POLICY IF EXISTS "Teachers can manage their own assignments" ON assignments;
CREATE POLICY "Teachers can manage their own assignments" ON assignments
  FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Students can view assignments for their classes" ON assignments;
CREATE POLICY "Students can view assignments for their classes" ON assignments
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM class_enrollments 
      WHERE student_id = auth.uid() AND status = 'active'
    ) OR class_id IS NULL -- Global assignments
  );

-- Assignment submissions policies
DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON assignment_submissions;
CREATE POLICY "Teachers can view submissions for their assignments" ON assignment_submissions
  FOR SELECT USING (
    assignment_id IN (SELECT id FROM assignments WHERE teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can manage their own submissions" ON assignment_submissions;
CREATE POLICY "Students can manage their own submissions" ON assignment_submissions
  FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can update submissions for their assignments" ON assignment_submissions;
CREATE POLICY "Teachers can update submissions for their assignments" ON assignment_submissions
  FOR UPDATE USING (
    assignment_id IN (SELECT id FROM assignments WHERE teacher_id = auth.uid())
  );

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Teachers can create notifications for their students" ON notifications;
CREATE POLICY "Teachers can create notifications for their students" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    (recipient_id IN (
      SELECT student_id FROM class_enrollments ce
      JOIN classes c ON c.id = ce.class_id
      WHERE c.teacher_id = auth.uid() AND ce.status = 'active'
    ) OR auth.uid() = recipient_id)
  );

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON teacher_student_messages;
CREATE POLICY "Users can view messages they sent or received" ON teacher_student_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON teacher_student_messages;
CREATE POLICY "Users can send messages" ON teacher_student_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update messages they sent" ON teacher_student_messages;
CREATE POLICY "Users can update messages they sent" ON teacher_student_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Create views for common queries

-- View for teacher's class overview
DROP VIEW IF EXISTS teacher_class_overview;
CREATE OR REPLACE VIEW teacher_class_overview AS
SELECT 
  c.id as class_id,
  c.name as class_name,
  c.description,
  c.grade_level,
  c.class_code,
  c.teacher_id,
  COUNT(ce.student_id) as student_count,
  COUNT(CASE WHEN ce.status = 'active' THEN 1 END) as active_students,
  c.created_at,
  c.updated_at
FROM classes c
LEFT JOIN class_enrollments ce ON c.id = ce.class_id
WHERE c.is_active = TRUE
GROUP BY c.id, c.name, c.description, c.grade_level, c.class_code, c.teacher_id, c.created_at, c.updated_at;

-- View for student progress summary
-- TODO: Fix this view to reference existing tables
-- DROP VIEW IF EXISTS student_progress_summary;
-- CREATE OR REPLACE VIEW student_progress_summary AS
-- SELECT 
--   ce.student_id,
--   ce.class_id,
--   s.first_name,
--   s.email,
--   s.avatar_id,
--   COALESCE(sp.achievement_points, sts.total_score, 0) as total_points,
--   COALESCE(sp.practice_time, 0) as practice_time,
--   COALESCE(cs.streak_count, 0) as current_streak,
--   COUNT(ps.id) as total_sessions,
--   COALESCE(AVG(ps.analysis_score), 0) as avg_accuracy,
--   MAX(ps.submitted_at) as last_practice_date,
--   ce.enrolled_at,
--   ce.status as enrollment_status
-- FROM class_enrollments ce
-- JOIN students s ON s.id = ce.student_id
-- LEFT JOIN student_profiles sp ON sp.student_id = ce.student_id
-- LEFT JOIN students_total_score sts ON sts.student_id = ce.student_id
-- LEFT JOIN current_streak cs ON cs.student_id = ce.student_id
-- LEFT JOIN practice_sessions ps ON ps.student_id = ce.student_id
-- WHERE ce.status = 'active'
-- GROUP BY ce.student_id, ce.class_id, s.first_name, s.email, s.avatar_id, 
--          sp.achievement_points, sts.total_score, sp.practice_time, cs.streak_count, 
--          ce.enrolled_at, ce.status;

-- Insert some sample data for testing (if needed)
-- Note: This should be removed in production
-- INSERT INTO teachers (id, first_name, last_name, email, school_name, department) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'Sarah', 'Johnson', 'sarah.johnson@school.edu', 'Music Academy', 'Piano Department');

COMMENT ON TABLE teachers IS 'Teacher profiles and information';
COMMENT ON TABLE classes IS 'Classes created by teachers';
COMMENT ON TABLE class_enrollments IS 'Student enrollment in classes';
COMMENT ON TABLE assignments IS 'Assignments created by teachers';
COMMENT ON TABLE assignment_submissions IS 'Student submissions for assignments';
COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON TABLE teacher_student_messages IS 'Direct messages between teachers and students'; 