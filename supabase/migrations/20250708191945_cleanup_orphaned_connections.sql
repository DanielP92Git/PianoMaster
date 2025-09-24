-- Clean up orphaned teacher-student connections before applying foreign key fixes
-- Remove connections that reference non-existent users

BEGIN;

-- Clean up orphaned teacher-student connections
DO $$
BEGIN
    -- Remove connections where student_id doesn't exist in auth.users
    DELETE FROM teacher_student_connections 
    WHERE student_id NOT IN (
        SELECT id FROM auth.users
    );
    
    -- Remove connections where teacher_id doesn't exist in auth.users
    DELETE FROM teacher_student_connections 
    WHERE teacher_id NOT IN (
        SELECT id FROM auth.users
    );
    
    RAISE NOTICE 'Cleaned up orphaned teacher-student connections';
    
END $$;

COMMIT; 