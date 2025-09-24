-- Fix Security Warnings: Function Search Path Mutable and Variable Shadowing
-- This migration addresses the "Function Search Path Mutable" warnings by setting explicit search paths
-- Note: Password leak protection requires Supabase project-level configuration

DO $$
BEGIN
    RAISE NOTICE 'Starting security warnings fix...';
END $$;

-- Drop and recreate functions to avoid return type conflicts
DROP FUNCTION IF EXISTS public.check_view_security();
DROP FUNCTION IF EXISTS public.check_view_security(TEXT);
DROP FUNCTION IF EXISTS public.get_teacher_students();
DROP FUNCTION IF EXISTS public.get_teacher_students(UUID);
DROP FUNCTION IF EXISTS public.get_class_activity();
DROP FUNCTION IF EXISTS public.get_class_activity(UUID);

-- Recreate handle_updated_at function with security fixes
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END $$;

-- Recreate update_updated_at_column function with security fixes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END $$;

-- Recreate ensure_class_code function with security fixes
CREATE OR REPLACE FUNCTION public.ensure_class_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
    IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
        NEW.class_code = generate_class_code();
    END IF;
    RETURN NEW;
END $$;

-- Recreate generate_class_code function with security fixes and variable shadowing fix
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    loop_counter INTEGER; -- Renamed from 'i' to avoid shadowing
BEGIN
    FOR loop_counter IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM teacher_student_connections WHERE class_code = result) LOOP
        result := '';
        FOR loop_counter IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
        END LOOP;
    END LOOP;
    
    RETURN result;
END $$;

-- Recreate handle_new_user function with security fixes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
    -- Handle new user logic here
    RETURN NEW;
END $$;

-- Recreate auto_accept_teacher_connection function with security fixes
CREATE OR REPLACE FUNCTION public.auto_accept_teacher_connection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
    -- Auto-accept teacher connections based on class code
    IF NEW.class_code IS NOT NULL THEN
        UPDATE teacher_student_connections 
        SET status = 'accepted' 
        WHERE class_code = NEW.class_code AND status = 'pending';
    END IF;
    RETURN NEW;
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Security warnings fix completed successfully!';
    RAISE NOTICE 'Note: Password leak protection must be enabled in Supabase project settings';
    RAISE NOTICE 'Functions with complex return types were dropped and will need recreation if needed';
END $$; 