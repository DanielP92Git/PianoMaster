-- Remove any incorrect triggers on notifications table that reference class_code
-- Fix the class_code error in notifications table

BEGIN;

-- Drop any triggers that might be incorrectly applied to notifications table
DO $$
BEGIN
    -- Check if ensure_class_code trigger exists on notifications table (it shouldn't)
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_ensure_class_code' 
        AND event_object_table = 'notifications'
    ) THEN
        DROP TRIGGER trigger_ensure_class_code ON notifications;
        RAISE NOTICE 'Removed incorrect trigger_ensure_class_code from notifications table';
    END IF;
    
    -- Check if any other class_code related triggers exist on notifications
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE event_object_table = 'notifications'
        AND trigger_name LIKE '%class_code%'
    ) THEN
        -- Drop any class_code related triggers from notifications table
        DROP TRIGGER IF EXISTS trigger_ensure_class_code ON notifications;
        RAISE NOTICE 'Removed class_code triggers from notifications table';
    END IF;
    
    -- Ensure the ensure_class_code trigger only exists on classes table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_ensure_class_code' 
        AND event_object_table = 'classes'
    ) THEN
        -- Recreate the trigger only on classes table
        CREATE TRIGGER trigger_ensure_class_code
        BEFORE INSERT ON classes
        FOR EACH ROW
        EXECUTE FUNCTION ensure_class_code();
        RAISE NOTICE 'Ensured trigger_ensure_class_code exists only on classes table';
    END IF;
    
    RAISE NOTICE 'Fixed class_code trigger placement';
    
END $$;

COMMIT; 