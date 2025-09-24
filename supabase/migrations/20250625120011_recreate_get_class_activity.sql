-- Recreate get_class_activity function with proper security settings
-- This function was dropped in security fixes but never recreated with SECURITY INVOKER

DO $$
BEGIN
    RAISE NOTICE 'Recreating get_class_activity function with proper security settings...';
END $$;

-- Recreate the get_class_activity function with proper security settings
CREATE OR REPLACE FUNCTION public.get_class_activity(class_id UUID, teacher_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    activity_type TEXT,
    activity_id UUID,
    user_id UUID,
    user_name TEXT,
    class_id UUID,
    class_name TEXT,
    activity_title TEXT,
    activity_status TEXT,
    score NUMERIC,
    activity_date TIMESTAMP WITH TIME ZONE,
    activity_description TEXT
)
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
    SELECT 
        rca.activity_type,
        rca.activity_id,
        rca.user_id,
        rca.user_name,
        rca.class_id,
        rca.class_name,
        rca.activity_title,
        rca.activity_status,
        rca.score,
        rca.activity_date,
        rca.activity_description
    FROM recent_class_activity rca
    JOIN classes c ON c.id = rca.class_id
    WHERE (get_class_activity.class_id IS NULL OR rca.class_id = get_class_activity.class_id)
      AND c.teacher_id = get_class_activity.teacher_id
      AND (get_class_activity.teacher_id = auth.uid() OR auth.uid() IN (SELECT id FROM teachers))
    ORDER BY rca.activity_date DESC;
$$;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.get_class_activity TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_class_activity IS 'Secure function for teachers to access class activity data with proper search path';

DO $$
BEGIN
    RAISE NOTICE 'get_class_activity function recreated successfully with SECURITY INVOKER!';
    RAISE NOTICE 'Function Search Path Mutable warning should now be resolved';
END $$; 