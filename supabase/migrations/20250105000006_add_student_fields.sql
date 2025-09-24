-- Add last_name and studying_year fields to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS studying_year VARCHAR(20); 