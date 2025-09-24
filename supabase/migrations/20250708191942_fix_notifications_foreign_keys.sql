-- Fix Notifications Table Foreign Key Relationships
-- Add proper foreign key constraints to enable PostgREST relationships

BEGIN;

-- Check if notifications table exists and has the expected columns
DO $$
BEGIN
    -- Add foreign key constraint for sender_id to users table (auth.users)
    -- This allows notifications to reference who sent them
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_sender_id_fkey'
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: notifications_sender_id_fkey';
    END IF;

    -- Add foreign key constraint for recipient_id to users table (auth.users)
    -- This allows notifications to reference who receives them
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_recipient_id_fkey'
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_recipient_id_fkey 
        FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: notifications_recipient_id_fkey';
    END IF;

    -- Since both students and teachers use auth.users.id as their primary key,
    -- we can now join notifications with students table through the user id
    RAISE NOTICE 'Notifications table foreign key relationships fixed';
    
END $$;

COMMIT; 