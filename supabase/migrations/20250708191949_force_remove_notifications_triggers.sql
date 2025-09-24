-- Force remove any triggers on notifications table that reference class_code
-- This should fix the "record new has no field class_code" error

BEGIN;

DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE 'Checking for triggers on notifications table...';
    
    -- List all triggers on notifications table
    FOR trigger_record IN 
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers 
        WHERE event_object_table = 'notifications'
        AND event_object_schema = 'public'
    LOOP
        RAISE NOTICE 'Found trigger: % on notifications table', trigger_record.trigger_name;
        RAISE NOTICE 'Event: %, Action: %', trigger_record.event_manipulation, trigger_record.action_statement;
    END LOOP;
    
    -- Force drop any triggers that might be incorrectly attached to notifications
    DROP TRIGGER IF EXISTS trigger_ensure_class_code ON notifications;
    DROP TRIGGER IF EXISTS ensure_class_code_trigger ON notifications;
    DROP TRIGGER IF EXISTS class_code_trigger ON notifications;
    DROP TRIGGER IF EXISTS auto_class_code ON notifications;
    
    -- Drop any other potential triggers
    DROP TRIGGER IF EXISTS trigger_auto_class_code ON notifications;
    DROP TRIGGER IF EXISTS trg_ensure_class_code ON notifications;
    DROP TRIGGER IF EXISTS generate_class_code_trigger ON notifications;
    
    RAISE NOTICE 'Dropped all potential class_code triggers from notifications table';
    
    -- Verify the notifications table structure
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'class_code'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'ERROR: notifications table has class_code column - this should not exist!';
    ELSE
        RAISE NOTICE 'GOOD: notifications table does not have class_code column';
    END IF;
    
    -- List remaining triggers on notifications table after cleanup
    FOR trigger_record IN 
        SELECT trigger_name, event_manipulation 
        FROM information_schema.triggers 
        WHERE event_object_table = 'notifications'
        AND event_object_schema = 'public'
    LOOP
        RAISE NOTICE 'Remaining trigger after cleanup: % (%)', trigger_record.trigger_name, trigger_record.event_manipulation;
    END LOOP;
    
    -- Ensure the class_code trigger exists ONLY on classes table where it belongs
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_ensure_class_code' 
        AND event_object_table = 'classes'
        AND event_object_schema = 'public'
    ) THEN
        RAISE NOTICE 'Re-creating trigger_ensure_class_code on classes table where it belongs';
        CREATE TRIGGER trigger_ensure_class_code
        BEFORE INSERT ON classes
        FOR EACH ROW
        EXECUTE FUNCTION ensure_class_code();
    ELSE
        RAISE NOTICE 'GOOD: trigger_ensure_class_code exists on classes table';
    END IF;
    
    RAISE NOTICE 'Notification triggers cleanup completed successfully';
    
END $$;

COMMIT; 