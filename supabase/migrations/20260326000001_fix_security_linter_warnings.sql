-- Fix 8 Supabase Security Advisor warnings
-- Part 1: Pin search_path on 4 functions (ALTER avoids rewriting function body)
-- Part 2: Add deny-all policy for account_deletion_log (RLS enabled, no policies)
-- Part 3: Drop 3 dangerous always-true anon RLS policies (exist only in live DB)

-- Part 1: Function search_path fixes
ALTER FUNCTION public.award_xp(UUID, INTEGER) SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.update_unit_progress_on_node_completion() SET search_path = public;
ALTER FUNCTION public.update_push_subscriptions_updated_at() SET search_path = public;

-- Part 2: Add deny-all policy for account_deletion_log
-- RLS is enabled (via dashboard) but no policies exist. Service role bypasses RLS,
-- so this table is already inaccessible to anon/authenticated. Adding an explicit
-- deny-all policy silences the linter and documents the intent.
CREATE POLICY "deny_all_access"
  ON public.account_deletion_log
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

-- Part 3: Drop dangerous anon policies (IF EXISTS — they only exist in live DB)
DROP POLICY IF EXISTS "parental_consent_log_insert_anon" ON public.parental_consent_log;
DROP POLICY IF EXISTS "parental_consent_tokens_update_anon" ON public.parental_consent_tokens;
DROP POLICY IF EXISTS "students_update_consent_anon" ON public.students;
