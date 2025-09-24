-- Create teacher_student_connections table for explicit relationships
CREATE TABLE IF NOT EXISTS teacher_student_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  connected_at TIMESTAMPTZ,
  
  UNIQUE(teacher_id, student_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_student_connections_teacher_id ON teacher_student_connections(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_student_connections_student_id ON teacher_student_connections(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_student_connections_status ON teacher_student_connections(status);

-- Enable RLS
ALTER TABLE teacher_student_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teacher_student_connections
CREATE POLICY "Teachers can manage their own connections" ON teacher_student_connections
  FOR ALL USING (
    auth.uid() = teacher_id OR 
    auth.uid() = student_id
  );

CREATE POLICY "Teachers can view their connections" ON teacher_student_connections
  FOR SELECT USING (
    auth.uid() = teacher_id OR 
    auth.uid() = student_id
  );

-- Function to auto-accept connections when notification is created
CREATE OR REPLACE FUNCTION auto_accept_teacher_connection()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a teacher connection request notification
  IF NEW.type = 'message' AND NEW.data ? 'connection_request' THEN
    -- Create or update the connection
    INSERT INTO teacher_student_connections (teacher_id, student_id, status, connected_at)
    VALUES (
      (NEW.data->>'teacher_id')::UUID,
      NEW.recipient_id,
      'accepted',
      NOW()
    )
    ON CONFLICT (teacher_id, student_id) 
    DO UPDATE SET 
      status = 'accepted',
      connected_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-accept connections
CREATE TRIGGER trigger_auto_accept_teacher_connection
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION auto_accept_teacher_connection(); 