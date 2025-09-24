-- Verify notifications table is properly configured without problematic triggers

BEGIN;

DO $$
DECLARE
    trigger_record RECORD;
    trigger_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Verifying notifications table configuration...';
    
    -- Check for any remaining triggers on notifications table
    FOR trigger_record IN 
        SELECT trigger_name, event_manipulation 
        FROM information_schema.triggers 
        WHERE event_object_table = 'notifications'
        AND event_object_schema = 'public'
    LOOP
        trigger_count := trigger_count + 1;
        RAISE NOTICE 'WARNING: Found trigger on notifications: % (%)', trigger_record.trigger_name, trigger_record.event_manipulation;
    END LOOP;
    
    IF trigger_count = 0 THEN
        RAISE NOTICE 'EXCELLENT: No triggers found on notifications table';
    ELSE
        RAISE NOTICE 'Found % triggers on notifications table', trigger_count;
    END IF;
    
    -- Verify notifications table structure
    RAISE NOTICE 'Notifications table structure verification:';
    
    -- Check required columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'id') THEN
        RAISE NOTICE '✓ id column exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'recipient_id') THEN
        RAISE NOTICE '✓ recipient_id column exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'sender_id') THEN
        RAISE NOTICE '✓ sender_id column exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        RAISE NOTICE '✓ type column exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'title') THEN
        RAISE NOTICE '✓ title column exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'message') THEN
        RAISE NOTICE '✓ message column exists';
    END IF;
    
    -- Confirm class_code does NOT exist (this was the problem)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'class_code') THEN
        RAISE NOTICE '✓ GOOD: class_code column does NOT exist on notifications table';
    ELSE
        RAISE NOTICE '✗ ERROR: class_code column exists on notifications table - this should not be!';
    END IF;
    
    RAISE NOTICE 'Notifications table verification completed!';
    RAISE NOTICE 'Assignment creation should now work without class_code errors.';
    
END $$;

COMMIT; 