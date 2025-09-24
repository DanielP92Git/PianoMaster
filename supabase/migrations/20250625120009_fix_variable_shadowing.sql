-- Fix variable shadowing warnings in generate_class_code function
-- Use different variable names for the two loops to avoid shadowing

DO $$
BEGIN
    RAISE NOTICE 'Fixing variable shadowing in generate_class_code function...';
END $$;

-- Recreate the generate_class_code function with distinct variable names
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
    
    -- Ensure uniqueness - check against classes table
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
    RAISE NOTICE 'Variable shadowing in generate_class_code function fixed successfully!';
    RAISE NOTICE 'All security warnings should now be resolved';
END $$; 