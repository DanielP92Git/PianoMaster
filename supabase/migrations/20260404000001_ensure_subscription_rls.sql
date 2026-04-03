-- Ensure subscription tables have correct RLS policies, helper functions,
-- and Realtime publication. Idempotent -- safe to run even if some pieces
-- already exist (e.g. applied via Management API).

-- ============================================================
-- 1. parent_subscriptions: RLS + SELECT policy for students
-- ============================================================
ALTER TABLE parent_subscriptions ENABLE ROW LEVEL SECURITY;

-- Idempotent: drop-then-create
DROP POLICY IF EXISTS "parent_subscriptions_select_own" ON parent_subscriptions;
DROP POLICY IF EXISTS "parent_subscriptions_select_student" ON parent_subscriptions;

CREATE POLICY "parent_subscriptions_select_own"
  ON parent_subscriptions
  FOR SELECT
  TO authenticated
  USING (student_id = (SELECT auth.uid()));

-- ============================================================
-- 2. subscription_plans: public SELECT (no PII, reference data)
-- ============================================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_plans_select_public" ON subscription_plans;
DROP POLICY IF EXISTS "subscription_plans_public_read" ON subscription_plans;

CREATE POLICY "subscription_plans_select_public"
  ON subscription_plans
  FOR SELECT
  USING (true);

-- ============================================================
-- 3. has_active_subscription() -- mirrors JS subscriptionService logic
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM parent_subscriptions
    WHERE student_id = p_student_id
      AND (
        status = 'active'
        OR status = 'on_trial'
        OR (status = 'cancelled' AND current_period_end > NOW())
        OR (status = 'past_due'  AND current_period_end > NOW() - INTERVAL '3 days')
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated;

COMMENT ON FUNCTION public.has_active_subscription IS
  'Returns true if the student has an active, trial, or grace-period subscription. Mirrors JS fetchSubscriptionStatus() logic.';

-- ============================================================
-- 4. Enable Realtime on parent_subscriptions
--    (SubscriptionContext.jsx listens for postgres_changes)
-- ============================================================
DO $$
BEGIN
  -- Only add if not already published
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'parent_subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE parent_subscriptions;
  END IF;
END $$;
