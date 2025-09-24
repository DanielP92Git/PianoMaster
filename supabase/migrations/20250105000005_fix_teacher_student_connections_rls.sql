-- Fix RLS policies for teacher_student_connections table
-- This addresses the 406 errors when querying connections

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can manage their own connections" ON teacher_student_connections;
DROP POLICY IF EXISTS "Teachers can view their connections" ON teacher_student_connections;

-- Create more specific policies

-- Teachers can view and manage connections where they are the teacher
CREATE POLICY "Teachers can manage as teacher" ON teacher_student_connections
  FOR ALL USING (
    auth.uid() = teacher_id
  );

-- Students can view connections where they are the student  
CREATE POLICY "Students can view as student" ON teacher_student_connections
  FOR SELECT USING (
    auth.uid() = student_id
  );

-- Allow teachers to insert new connections (for adding students)
CREATE POLICY "Teachers can create connections" ON teacher_student_connections
  FOR INSERT WITH CHECK (
    auth.uid() = teacher_id
  );

-- Allow teachers to update connection status
CREATE POLICY "Teachers can update connections" ON teacher_student_connections
  FOR UPDATE USING (
    auth.uid() = teacher_id OR auth.uid() = student_id
  );

-- Allow checking if connections exist (needed for duplicate checking)
CREATE POLICY "Check connection exists" ON teacher_student_connections
  FOR SELECT USING (
    auth.uid() = teacher_id OR auth.uid() = student_id
  ); 