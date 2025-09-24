-- Fix Assignment and Teacher-Student Connection Foreign Key Relationships
-- Ensure consistent referencing of auth.users.id throughout the system

BEGIN;

-- Check if teacher_student_connections table exists and fix its foreign key references
DO $$
BEGIN
    -- Drop existing foreign key constraint from teacher_student_connections.student_id to students(id)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'teacher_student_connections_student_id_fkey'
        AND table_name = 'teacher_student_connections'
    ) THEN
        ALTER TABLE teacher_student_connections 
        DROP CONSTRAINT teacher_student_connections_student_id_fkey;
        
        RAISE NOTICE 'Dropped constraint: teacher_student_connections_student_id_fkey';
    END IF;

    -- Add correct foreign key constraint from teacher_student_connections.student_id to auth.users(id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'teacher_student_connections_student_id_auth_fkey'
        AND table_name = 'teacher_student_connections'
    ) THEN
        ALTER TABLE teacher_student_connections 
        ADD CONSTRAINT teacher_student_connections_student_id_auth_fkey 
        FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: teacher_student_connections_student_id_auth_fkey';
    END IF;

    -- Also ensure teacher_id references auth.users correctly
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'teacher_student_connections_teacher_id_fkey'
        AND table_name = 'teacher_student_connections'
    ) THEN
        ALTER TABLE teacher_student_connections 
        DROP CONSTRAINT teacher_student_connections_teacher_id_fkey;
        
        RAISE NOTICE 'Dropped constraint: teacher_student_connections_teacher_id_fkey';
    END IF;

    -- Add correct foreign key constraint from teacher_student_connections.teacher_id to auth.users(id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'teacher_student_connections_teacher_id_auth_fkey'
        AND table_name = 'teacher_student_connections'
    ) THEN
        ALTER TABLE teacher_student_connections 
        ADD CONSTRAINT teacher_student_connections_teacher_id_auth_fkey 
        FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: teacher_student_connections_teacher_id_auth_fkey';
    END IF;

    -- Update RLS policies to work with the new constraint structure
    DROP POLICY IF EXISTS "Allow teacher and student access" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Teachers can manage their own connections" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Teachers can view their connections" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Students can manage their connections" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Students can view their connections" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Consolidated connections access" ON teacher_student_connections;
    DROP POLICY IF EXISTS "Unified teacher student connections access" ON teacher_student_connections;

    -- Create unified policy for teacher-student connections
    CREATE POLICY "Unified teacher student connections access" ON teacher_student_connections
    FOR ALL USING (
        auth.uid() = teacher_id OR 
        auth.uid() = student_id
    );

    RAISE NOTICE 'Fixed teacher_student_connections foreign key relationships and updated RLS policies';
    
END $$;

COMMIT; 