-- =============================================================================
-- Migration:   20260805120000_add_parent_subscriptions_parent_id (down)
-- Date:        2026-08-05
-- Milestone:   v4.0 — Parent-First Account Architecture (COPPA), Phase 5
-- Description: Reverses 20260805120000_add_parent_subscriptions_parent_id.sql
-- Predecessors: 20260805120000_add_parent_subscriptions_parent_id.sql
-- Rollback:     (this file is itself the rollback)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Restore the ORIGINAL has_active_subscription(p_student_id UUID) body,
--    copied character-for-character from 20260404000001_ensure_subscription_rls.sql
--    lines 36-59. No parent_id branch.
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 2. Drop the additive sibling SELECT policy. The legacy
--    parent_subscriptions_select_own was never dropped, so RLS coverage on the
--    table is uninterrupted by this backout.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "parent_subscriptions_select_own_parent" ON parent_subscriptions;

-- -----------------------------------------------------------------------------
-- 3. Drop the parent_id index.
-- -----------------------------------------------------------------------------
DROP INDEX IF EXISTS parent_subscriptions_parent_id_idx;

-- -----------------------------------------------------------------------------
-- 4. Drop the parent_id FK.
-- -----------------------------------------------------------------------------
ALTER TABLE parent_subscriptions DROP CONSTRAINT IF EXISTS parent_subscriptions_parent_id_fkey;

-- -----------------------------------------------------------------------------
-- 5. Restore student_id NOT NULL (mirrors forward Section 1's relaxation).
--    Loud failure over silent data loss: if any row was written after the forward
--    migration with parent_id set and student_id NULL (a real D-02 "new checkout
--    shape" row), this ALTER fails natively with a NOT NULL violation and aborts
--    the whole backout transaction — which is correct. A row like that has no
--    owner column left once parent_id is dropped in the next step; backing out
--    would silently orphan it. Resolve manually (assign a student_id, or accept
--    the row must wait for a future migration) before re-attempting backout.
-- -----------------------------------------------------------------------------
ALTER TABLE parent_subscriptions ALTER COLUMN student_id SET NOT NULL;

-- -----------------------------------------------------------------------------
-- 6. Drop the parent_id column. Safe now: step 5 above proved every remaining row
--    has a non-null student_id, so nothing is orphaned by removing parent_id.
-- -----------------------------------------------------------------------------
ALTER TABLE parent_subscriptions DROP COLUMN IF EXISTS parent_id;

-- -----------------------------------------------------------------------------
-- 7. Dead-letter table.
--    PRE-BACKOUT STEP: if rows exist in unresolved_webhook_log at backout time,
--    they are unreviewed billing anomalies — SELECT * FROM unresolved_webhook_log
--    and save the output before running this file. Safe in a backout because the
--    forward-migration webhook code is redeployed to its previous version at the
--    same time (D-12), so nothing writes to it after backout.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deny_all_access" ON public.unresolved_webhook_log;
DROP TABLE IF EXISTS unresolved_webhook_log;

COMMIT;
