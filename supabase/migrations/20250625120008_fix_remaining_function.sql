-- Fix generate_class_code function to reference correct table
-- The function was incorrectly checking teacher_student_connections instead of classes table

DO $$
BEGIN
    RAISE NOTICE 'Fixing generate_class_code function table reference...';
END $$;

-- Fix the generate_class_code function to check the correct table
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER; -- First loop variable
    j INTEGER; -- Second loop variable for uniqueness check
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    
    -- Ensure uniqueness - check against classes table, not teacher_student_connections
    WHILE EXISTS (SELECT 1 FROM classes WHERE class_code = result) LOOP
        result := '';
        FOR j IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
        END LOOP;
    END LOOP;
    
    RETURN result;
END $$;

DO $$
BEGIN
    RAISE NOTICE 'generate_class_code function fixed successfully!';
    RAISE NOTICE 'Function now correctly checks classes table for uniqueness';
END $$; 