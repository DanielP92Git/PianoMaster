-- Drop students_total_score table and dependent objects - no longer used
-- Points are now calculated dynamically from students_score + student_achievements
-- Generated on 2025-12-07

begin;

-- Drop dependent view first
DROP VIEW IF EXISTS public.student_progress_summary CASCADE;

-- Drop the table
DROP TABLE IF EXISTS public.students_total_score CASCADE;

commit;

