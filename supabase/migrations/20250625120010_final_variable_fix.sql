-- Final fix for variable shadowing warnings in generate_class_code function
-- Remove explicit variable declarations since FOR loops create automatic variables

DO $$
BEGIN
    RAISE NOTICE 'Final fix for variable shadowing in generate_class_code function...';
END $$;

-- Recreate the generate_class_code function without explicit loop variable declarations
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
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
    RAISE NOTICE 'Variable shadowing completely resolved!';
    RAISE NOTICE 'All security issues should now be fixed';
END $$; 