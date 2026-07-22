-- =============================================================================
-- Down-migration (D-27):  20260722120000_add_parents_and_child_profiles.down.sql
-- Reverses 20260722120000_add_parents_and_child_profiles.sql in reverse object order.
-- Drops ONLY objects this phase created — no legacy students(id) FK is touched (D-02).
-- Idempotent (IF EXISTS everywhere) for the apply→rollback→re-apply rehearsal.
-- =============================================================================

BEGIN;

-- 1. Deletion-cascade trigger + function (reverse of up §8c)
DROP TRIGGER IF EXISTS trigger_cascade_delete_child_profile ON students;
DROP FUNCTION IF EXISTS cascade_delete_child_profile_on_student_delete();

-- 2. Reverse sync triggers + function (reverse of up §8b)
DROP TRIGGER IF EXISTS trigger_sync_child_profile_update ON child_profiles;
DROP TRIGGER IF EXISTS trigger_sync_child_profile_insert ON child_profiles;
DROP FUNCTION IF EXISTS sync_child_profile_to_student();

-- 3. Forward sync triggers + function (reverse of up §8a)
DROP TRIGGER IF EXISTS trigger_sync_student_update ON students;
DROP TRIGGER IF EXISTS trigger_sync_student_insert ON students;
DROP FUNCTION IF EXISTS sync_student_to_child_profile();

-- 4. Drop ONLY the new child_profiles FKs (reverse of up §9). Legacy _fkey names untouched.
ALTER TABLE public.assignment_submissions     DROP CONSTRAINT IF EXISTS assignment_submissions_student_id_child_profiles_fkey;
ALTER TABLE public.feedback_submissions       DROP CONSTRAINT IF EXISTS feedback_submissions_student_id_child_profiles_fkey;
ALTER TABLE public.instrument_practice_logs   DROP CONSTRAINT IF EXISTS instrument_practice_logs_student_id_child_profiles_fkey;
ALTER TABLE public.instrument_practice_streak DROP CONSTRAINT IF EXISTS instrument_practice_streak_student_id_child_profiles_fkey;
ALTER TABLE public.notifications              DROP CONSTRAINT IF EXISTS notifications_recipient_id_child_profiles_fkey;
ALTER TABLE public.parental_consent_log       DROP CONSTRAINT IF EXISTS parental_consent_log_student_id_child_profiles_fkey;
ALTER TABLE public.parental_consent_tokens    DROP CONSTRAINT IF EXISTS parental_consent_tokens_student_id_child_profiles_fkey;
ALTER TABLE public.push_subscriptions         DROP CONSTRAINT IF EXISTS push_subscriptions_student_id_child_profiles_fkey;
ALTER TABLE public.rate_limits                DROP CONSTRAINT IF EXISTS rate_limits_student_id_child_profiles_fkey;
ALTER TABLE public.student_daily_challenges   DROP CONSTRAINT IF EXISTS student_daily_challenges_student_id_child_profiles_fkey;
ALTER TABLE public.student_daily_goals        DROP CONSTRAINT IF EXISTS student_daily_goals_student_id_child_profiles_fkey;
ALTER TABLE public.student_point_transactions DROP CONSTRAINT IF EXISTS student_point_transactions_student_id_child_profiles_fkey;
ALTER TABLE public.student_skill_progress     DROP CONSTRAINT IF EXISTS student_skill_progress_student_id_child_profiles_fkey;
ALTER TABLE public.students_score             DROP CONSTRAINT IF EXISTS students_score_student_id_child_profiles_fkey;
ALTER TABLE public.student_unit_progress      DROP CONSTRAINT IF EXISTS student_unit_progress_student_id_child_profiles_fkey;
ALTER TABLE public.user_accessories           DROP CONSTRAINT IF EXISTS user_accessories_user_id_child_profiles_fkey;

-- 5. updated_at triggers (redundant with the CASCADE below, dropped explicitly for clarity)
DROP TRIGGER IF EXISTS trigger_child_profiles_updated_at ON child_profiles;
DROP TRIGGER IF EXISTS trigger_parents_updated_at ON parents;

-- 6. Drop the two new tables (CASCADE removes the index + backfilled rows). Reverses up §1-2.
DROP TABLE IF EXISTS child_profiles CASCADE;
DROP TABLE IF EXISTS parents CASCADE;

COMMIT;
