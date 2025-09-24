-- Ensure students table has proper UUID default generation
-- This ensures new student records get valid UUIDs automatically

-- Set default for students.id to generate random UUID if not already set
ALTER TABLE students ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure the extension for UUID generation is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 