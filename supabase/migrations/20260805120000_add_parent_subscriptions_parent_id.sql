-- =============================================================================
-- Migration:   20260805120000_add_parent_subscriptions_parent_id
-- Date:        2026-08-05
-- Milestone:   v4.0 — Parent-First Account Architecture (COPPA), Phase 5
-- Description: D-14 additive parent_id on parent_subscriptions + D-01 resolve-chain
--              backfill + D-15 sibling SELECT policy + D-16 has_active_subscription()
--              body swap + D-03 unresolved_webhook_log dead-letter table.
--              parent_subscriptions has no CREATE TABLE in any tracked migration
--              (created out-of-band) — this is a pure ALTER against the live table.
-- Predecessors: 20260404000001_ensure_subscription_rls.sql,
--               20260722120000_add_parents_and_child_profiles.sql,
--               20260801120000_rls_ownership_rewrite.sql
-- Rollback:     20260805120000_add_parent_subscriptions_parent_id.down.sql
-- =============================================================================

-- DISCOVERY FINDING (05-discovery.md §1): unexpected_columns = id, updated_at — both
-- benign (id is the PK, updated_at is an audit timestamp); neither is disturbed here.
-- notnull_columns_without_default = student_id, ls_subscription_id, status — all
-- already satisfied on every existing row; informational only for parent_id's design
-- (see Section 1's nullability rationale below). Neither finding blocks this migration.

BEGIN;

-- -----------------------------------------------------------------------------
-- Section 1 — additive column + FK (D-14)
-- -----------------------------------------------------------------------------
ALTER TABLE parent_subscriptions
  ADD COLUMN IF NOT EXISTS parent_id UUID;

-- The column is nullable and stays nullable in this phase (Claude's Discretion,
-- exercised). Rationale: D-03 requires an unresolvable webhook to be dead-lettered,
-- never to hard-fail an insert; a NOT NULL column would convert that designed
-- soft-failure into a payment-time exception. The tightening is deferred to Phase 8
-- and recorded in the handoff (Task 3 / 02-phase8-handoff.md §5).

ALTER TABLE parent_subscriptions
  DROP CONSTRAINT IF EXISTS parent_subscriptions_parent_id_fkey;

-- ON DELETE CASCADE matches 05-discovery.md's existing_student_id_fk_on_delete: CASCADE
-- (confirmed via pg_catalog.pg_constraint, §1 Q2). NO ACTION would make a parents row
-- deletion fail whenever a billing row exists, breaking the COPPA hard-delete flow in
-- supabase/functions/process-account-deletions/index.ts.
ALTER TABLE parent_subscriptions
  ADD CONSTRAINT parent_subscriptions_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;

-- The new RLS policy (Section 3), the webhook's writes, cancel-subscription's lookup,
-- and has_active_subscription() (Section 4) all filter on parent_id; the table's only
-- existing index is on student_id.
CREATE INDEX IF NOT EXISTS parent_subscriptions_parent_id_idx
  ON parent_subscriptions (parent_id);

-- -----------------------------------------------------------------------------
-- Section 2 — two-pass resolve-chain backfill (D-01 / D-14)
-- -----------------------------------------------------------------------------

-- Pass 1: direct parents.id match (Phase 1 reused UUIDs — expected to cover the
-- majority of live rows).
UPDATE parent_subscriptions ps
SET    parent_id = p.id
FROM   parents p
WHERE  ps.student_id = p.id
  AND  ps.parent_id IS NULL;

-- Pass 2: legacy child_profiles.id -> parent_id fallback (D-01's safety-net hop).
UPDATE parent_subscriptions ps
SET    parent_id = cp.parent_id
FROM   child_profiles cp
WHERE  ps.student_id = cp.id
  AND  cp.parent_id IS NOT NULL
  AND  ps.parent_id IS NULL;

-- Reports (does not assert — this must not abort a production apply) the count of
-- rows still parent_id IS NULL after both backfill passes. Per 05-discovery.md §2
-- (SC-2 correction), the live table has 9 rows, not the 3 originally assumed; this
-- block is written generically (set-based) and makes no assumption about row count.
DO $$
DECLARE unresolved_count INT;
BEGIN
  SELECT COUNT(*) INTO unresolved_count
  FROM parent_subscriptions WHERE parent_id IS NULL;
  RAISE NOTICE 'BACKFILL: % row(s) left with parent_id IS NULL (expected 0)', unresolved_count;
END $$;

-- -----------------------------------------------------------------------------
-- Section 3 — additive sibling SELECT policy (D-15)
-- -----------------------------------------------------------------------------

-- ADDITIVE: the legacy "parent_subscriptions_select_own" (student_id = auth.uid()) is
-- deliberately NOT dropped. Postgres ORs permissive policies, so neither the pre-deploy
-- nor the post-deploy client is locked out during rollout. Legacy drops in Phase 8.
DROP POLICY IF EXISTS "parent_subscriptions_select_own_parent" ON parent_subscriptions;
CREATE POLICY "parent_subscriptions_select_own_parent"
  ON parent_subscriptions
  FOR SELECT
  TO authenticated
  USING (parent_id = (SELECT auth.uid()));

-- SELECT-only by construction (T-5-03) — no INSERT/UPDATE/DELETE policy is created for
-- authenticated, writes remain service-role only, so no WITH CHECK clause is applicable.
-- Note also: plain equality, no owned_child_ids() indirection — the billing hot path
-- stays simple per Phase 2's inherited decision (SC-1).

-- -----------------------------------------------------------------------------
-- Section 4 — has_active_subscription() body swap (D-16)
-- -----------------------------------------------------------------------------

-- Signature unchanged (Pitfall 5) — changing arg name/type/count would drag Phase 2's
-- 3 students_score call sites (20260801120000_rls_ownership_rewrite.sql, ~lines
-- 413/428/447) back into scope.
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
    WHERE (parent_id = p_student_id OR student_id = p_student_id)
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
  'Returns true if the parent (or, transitionally, a legacy student row) has an active, trial, or grace-period subscription. Mirrors JS fetchSubscriptionStatus() logic.';

-- The "OR student_id = p_student_id" branch is deploy-window insurance — a warm old
-- function instance can still write a student_id-only row, and a false negative here
-- revokes a paying customer's write access. It drops in Phase 8.

-- -----------------------------------------------------------------------------
-- Section 5 — dead-letter table (D-03)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS unresolved_webhook_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_name          TEXT,
  ls_subscription_id  TEXT,
  attempted_id        TEXT,          -- the custom_data id that failed to resolve
  raw_payload         JSONB NOT NULL, -- full parsed body, for debugging an unknown shape
  resolved            BOOLEAN NOT NULL DEFAULT FALSE
);

-- Corrected RLS posture (per 20260326000001_fix_security_linter_warnings.sql) — enable
-- RLS + deny-all RESTRICTIVE from the start. Do NOT repeat account_deletion_log's
-- superseded "No RLS needed" comment style.
ALTER TABLE unresolved_webhook_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_all_access" ON public.unresolved_webhook_log;
CREATE POLICY "deny_all_access"
  ON public.unresolved_webhook_log
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS unresolved_webhook_log_received_at_idx
  ON unresolved_webhook_log (received_at DESC);

COMMENT ON TABLE unresolved_webhook_log IS
  'D-03 dead-letter table: Lemon Squeezy webhook payloads whose resolve-chain (parents -> child_profiles) could not identify an owning parent. Service-role write only; deny-all RLS.';

-- -----------------------------------------------------------------------------
-- Section 6 — explicit non-action comment (D-08)
-- -----------------------------------------------------------------------------

-- D-08: NO unique index or constraint is created against two simultaneously-active
-- subscriptions per parent. A partial unique index would make the webhook's upsert throw at
-- the exact moment a real customer is paying, turning a rare billing anomaly into a hard
-- payment failure and an LS retry storm. The anomaly is surfaced instead by (a) the read-only
-- audit query in 05-discovery.md / 05-apply-log.md and (b) cancel-subscription's D-06
-- ambiguity branch (HTTP 409 AMBIGUOUS_ACTIVE_SUBSCRIPTIONS).

COMMIT;
