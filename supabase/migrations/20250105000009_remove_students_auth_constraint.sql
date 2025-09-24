-- Remove the specific foreign key constraint that's causing the 23503 error
-- This constraint forces students.id to reference auth.users.id, which we don't want

-- Remove the problematic constraint by name
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_id_fkey;

-- Also try alternative names that might exist
ALTER TABLE students DROP CONSTRAINT IF EXISTS fk_students_auth_users;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_user_id_fkey;

-- List all constraints on students table for debugging (this will show in logs)
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT conname, contype 
        FROM pg_constraint 
        WHERE conrelid = 'students'::regclass
    LOOP
        RAISE NOTICE 'Constraint found: % (type: %)', constraint_record.conname, constraint_record.contype;
    END LOOP;
END $$; 