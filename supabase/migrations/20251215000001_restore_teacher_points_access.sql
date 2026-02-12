-- Restore teacher visibility for student points after students_total_score removal.
-- Teachers should be able to read connected students' points derived from:
-- - students_score.score (gameplay points)
-- - student_achievements.points (achievement points)
--
-- This migration:
-- 1) Adds SELECT-only policies for teachers on students_score and student_achievements
--    (keeps consolidated user/service_role write policies intact).
-- 2) Adds an RPC (SECURITY DEFINER) to fetch per-student totals for a teacher in one call,
--    so the teacher dashboard stays robust even if future RLS consolidation changes again.

begin;

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.students_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;

-- 1) SELECT-only teacher policies (do not grant write access)
DROP POLICY IF EXISTS "Teachers can view connected students scores" ON public.students_score;
CREATE POLICY "Teachers can view connected students scores"
ON public.students_score
FOR SELECT
USING (
  (select auth.uid()) IN (
    SELECT teacher_id
    FROM public.teacher_student_connections
    WHERE student_id = public.students_score.student_id
      AND status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Teachers can view connected students achievements" ON public.student_achievements;
CREATE POLICY "Teachers can view connected students achievements"
ON public.student_achievements
FOR SELECT
USING (
  (select auth.uid()) IN (
    SELECT teacher_id
    FROM public.teacher_student_connections
    WHERE student_id = public.student_achievements.student_id
      AND status = 'accepted'
  )
);

-- 2) RPC for teacher points (read-only, enforces teacher->student relationship inside the function)
DROP FUNCTION IF EXISTS public.teacher_get_student_points();
CREATE OR REPLACE FUNCTION public.teacher_get_student_points()
RETURNS TABLE (
  student_id uuid,
  total_points bigint,
  gameplay_points bigint,
  achievement_points bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH connected AS (
    SELECT tsc.student_id
    FROM public.teacher_student_connections tsc
    WHERE tsc.teacher_id = (select auth.uid())
      AND tsc.status = 'accepted'
  ),
  game_points AS (
    SELECT ss.student_id, COALESCE(SUM(ss.score), 0)::bigint AS gameplay_points
    FROM public.students_score ss
    GROUP BY ss.student_id
  ),
  achievement_points AS (
    SELECT sa.student_id, COALESCE(SUM(sa.points), 0)::bigint AS achievement_points
    FROM public.student_achievements sa
    GROUP BY sa.student_id
  )
  SELECT
    c.student_id,
    COALESCE(gp.gameplay_points, 0) + COALESCE(ap.achievement_points, 0) AS total_points,
    COALESCE(gp.gameplay_points, 0) AS gameplay_points,
    COALESCE(ap.achievement_points, 0) AS achievement_points
  FROM connected c
  LEFT JOIN game_points gp ON gp.student_id = c.student_id
  LEFT JOIN achievement_points ap ON ap.student_id = c.student_id;
$$;

REVOKE ALL ON FUNCTION public.teacher_get_student_points() FROM anon;
GRANT EXECUTE ON FUNCTION public.teacher_get_student_points() TO authenticated;

commit;






