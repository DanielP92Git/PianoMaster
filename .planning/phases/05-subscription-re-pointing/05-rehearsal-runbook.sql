-- ============================================================================
-- 05-rehearsal-runbook.sql
-- Phase 5 (v4.0) subscription re-pointing -- owner-run rehearsal, transaction-
-- wrapped on PRODUCTION (project hdltcvgqrtxuxgjdvzzu). Nothing below persists:
-- the whole apply -> assert -> down -> re-apply sequence runs inside ONE
-- BEGIN...ROLLBACK. Run this as ONE continuous execution (one paste into the
-- Supabase SQL Editor, or `psql "<connection-string>" -f 05-rehearsal-runbook.sql`)
-- -- splitting it across multiple separate Editor "Run" clicks may open separate
-- sessions/connections and break the transaction continuity this depends on.
--
-- What this proves:
--   - SC-1 in full: the parent_id column/FK/index (D-14), the D-01 resolve-chain
--     backfill against the 9 real production rows (05-discovery.md's SC-2
--     correction -- the real count is 9, not the plan's original "3 live
--     subscriptions" assumption; this script makes no row-count assumption),
--     the D-15 additive dual SELECT policy, the D-16 has_active_subscription()
--     body swap (both the parent_id and legacy student_id OR-branches), the
--     D-03 dead-letter table + deny-all RLS, and the D-08 deliberate absence
--     of a uniqueness constraint against >1 active row per parent.
--   - D-12: the down-migration cleanly reverses the forward migration, and the
--     forward migration re-applies idempotently.
--
-- What this CANNOT prove (accepted gap, same as Phase 2's
-- 02-rehearsal-runbook.sql):
--   - Supabase Advisors (get_advisors) read via a SEPARATE connection and will
--     not see this transaction's uncommitted DDL. Re-run Advisors for real
--     after plan 05-09's actual production apply.
--   - npm run test:run does not depend on live DB state (mocked) -- run it
--     separately, any time, per CLAUDE.md.
--
-- After running: paste the FULL output back -- especially every NOTICE and any
-- ERROR -- so 05-apply-log.md can be filled with real PASS/FAIL verdicts per
-- assertion.
-- ============================================================================


-- ============================================================================
-- STEP 0 -- pre-migration baseline (read-only, BEFORE the rehearsal transaction
-- opens; these are ordinary auto-committed reads, completely safe)
-- ============================================================================

-- parent_a: a real parent who owns at least one parent_subscriptions row today
--           (matched via the pre-Phase-5 student_id = parents.id UUID-reuse fact).
-- parent_b: a different real parent with NO subscription row (cross-family
--           isolation subject for the RLS assertions).
-- null_parent_child: a child_profiles.id whose parent_id IS NULL (one of the
--           teacher-owned, parent-less profiles -- the D-03 dead-letter subject).
-- linked_child / linked_child_parent: a child_profiles.id whose parent_id IS
--           NOT NULL, plus that parent's id (the D-01 resolve-chain's second
--           probe target -- exercised for real by 05-webhook-replay.mjs, only
--           captured here for reference).
CREATE TEMP TABLE _r5 AS
WITH pa AS (
  SELECT p.id AS parent_a
  FROM parents p
  WHERE EXISTS (
    SELECT 1 FROM parent_subscriptions ps WHERE ps.student_id = p.id
  )
  LIMIT 1
),
pb AS (
  SELECT p.id AS parent_b
  FROM parents p
  WHERE p.id NOT IN (SELECT parent_a FROM pa)
    AND p.id NOT IN (
      SELECT student_id FROM parent_subscriptions WHERE student_id IS NOT NULL
    )
  LIMIT 1
),
npc AS (
  SELECT cp.id AS null_parent_child
  FROM child_profiles cp
  WHERE cp.parent_id IS NULL
  LIMIT 1
),
lc AS (
  SELECT cp.id AS linked_child, cp.parent_id AS linked_child_parent
  FROM child_profiles cp
  WHERE cp.parent_id IS NOT NULL
  LIMIT 1
)
SELECT
  (SELECT parent_a FROM pa)              AS parent_a,
  (SELECT parent_b FROM pb)              AS parent_b,
  (SELECT null_parent_child FROM npc)    AS null_parent_child,
  (SELECT linked_child FROM lc)          AS linked_child,
  (SELECT linked_child_parent FROM lc)   AS linked_child_parent;

-- The rest of this script repeatedly SET ROLE authenticated to impersonate
-- users for RLS testing. A temp table is owned by the connecting role (not
-- `authenticated`), so without this grant every _r5 read after the first
-- SET ROLE fails with "permission denied for table _r5" (Phase 2 gotcha).
GRANT SELECT ON _r5 TO authenticated;

-- Fail loudly now if any lookup came back NULL, rather than a confusing
-- failure deep inside a later assertion block.
DO $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM _r5;
  IF r.parent_a IS NULL OR r.parent_b IS NULL OR r.null_parent_child IS NULL
     OR r.linked_child IS NULL OR r.linked_child_parent IS NULL THEN
    RAISE EXCEPTION 'Rehearsal variable lookup failed -- one or more required rows do not exist: %', r;
  END IF;
END $$;

-- NOTE THIS OUTPUT -- these are the real IDs used throughout the rehearsal:
SELECT * FROM _r5;

-- Pre-state baseline: confirm parent_id does NOT exist yet (pg_attribute, NOT
-- information_schema -- Phase 1's 01-fk-checklist.md DEVIATION precedent:
-- information_schema returns [] under Supabase's non-owner query role).
DO $$
DECLARE
  total_rows INT;
  col_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO total_rows FROM parent_subscriptions;
  SELECT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.parent_subscriptions'::regclass
      AND attname = 'parent_id' AND NOT attisdropped
  ) INTO col_exists;
  RAISE NOTICE 'PRE-STATE: % total row(s) in parent_subscriptions (05-discovery.md SC-2 correction: expect 9, not 3)', total_rows;
  ASSERT col_exists = false, 'PRE-STATE FAIL: parent_id column already exists -- this migration may already be applied';
  RAISE NOTICE 'PRE-STATE PASS: parent_id column does not yet exist';
END $$;

-- Pre-state row dump -- every live row's identity keys, for the operator's own
-- before/after comparison alongside 05-subscription-signoff.md:
SELECT ls_subscription_id, student_id, status FROM parent_subscriptions ORDER BY created_at;


-- ============================================================================
-- STEP 1 -- THE REHEARSAL TRANSACTION. Nothing from here to the final ROLLBACK
-- persists in production, regardless of outcome (an ASSERT failure aborts the
-- transaction, which also guarantees nothing persists).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Section A -- apply the forward migration (D-14 / D-01 / D-15 / D-16 / D-03 /
-- D-08). Body of
-- supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.sql,
-- its own transaction-control statements stripped -- this whole file already
-- IS the transaction.
-- ----------------------------------------------------------------------------

ALTER TABLE parent_subscriptions
  ADD COLUMN IF NOT EXISTS parent_id UUID;

ALTER TABLE parent_subscriptions
  DROP CONSTRAINT IF EXISTS parent_subscriptions_parent_id_fkey;

ALTER TABLE parent_subscriptions
  ADD CONSTRAINT parent_subscriptions_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS parent_subscriptions_parent_id_idx
  ON parent_subscriptions (parent_id);

-- Pass 1: direct parents.id match.
UPDATE parent_subscriptions ps
SET    parent_id = p.id
FROM   parents p
WHERE  ps.student_id = p.id
  AND  ps.parent_id IS NULL;

-- Pass 2: legacy child_profiles.id -> parent_id fallback (D-01 safety-net hop).
UPDATE parent_subscriptions ps
SET    parent_id = cp.parent_id
FROM   child_profiles cp
WHERE  ps.student_id = cp.id
  AND  cp.parent_id IS NOT NULL
  AND  ps.parent_id IS NULL;

DO $$
DECLARE unresolved_count INT;
BEGIN
  SELECT COUNT(*) INTO unresolved_count
  FROM parent_subscriptions WHERE parent_id IS NULL;
  RAISE NOTICE 'BACKFILL: % row(s) left with parent_id IS NULL (expected 0)', unresolved_count;
END $$;

DROP POLICY IF EXISTS "parent_subscriptions_select_own_parent" ON parent_subscriptions;
CREATE POLICY "parent_subscriptions_select_own_parent"
  ON parent_subscriptions
  FOR SELECT
  TO authenticated
  USING (parent_id = (SELECT auth.uid()));

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

CREATE TABLE IF NOT EXISTS unresolved_webhook_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_name          TEXT,
  ls_subscription_id  TEXT,
  attempted_id        TEXT,
  raw_payload         JSONB NOT NULL,
  resolved            BOOLEAN NOT NULL DEFAULT FALSE
);

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

-- D-08: deliberately NO unique index/constraint against >1 simultaneously-
-- active row per parent -- see the D08-NOCONSTRAINT assertion below.


-- ----------------------------------------------------------------------------
-- Section B -- assertions. One DO $$ ... ASSERT ... RAISE NOTICE '<ID> PASS';
-- END $$; block per must_have. pg_catalog only -- information_schema returns
-- [] under Supabase's non-owner query role (Phase 1 01-fk-checklist.md
-- DEVIATION precedent).
-- ----------------------------------------------------------------------------

-- SC1-COL: parent_id exists, type uuid, via pg_attribute.
DO $$
DECLARE col_type TEXT;
BEGIN
  SELECT format_type(atttypid, atttypmod) INTO col_type
  FROM pg_attribute
  WHERE attrelid = 'public.parent_subscriptions'::regclass
    AND attname = 'parent_id' AND NOT attisdropped;
  ASSERT col_type = 'uuid', format('SC1-COL FAIL: parent_id type is %s, expected uuid', col_type);
  RAISE NOTICE 'SC1-COL PASS';
END $$;

-- SC1-FK: a pg_constraint row of contype='f' on parent_id referencing parents.
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.parent_subscriptions'::regclass
      AND contype = 'f'
      AND confrelid = 'public.parents'::regclass
      AND conname = 'parent_subscriptions_parent_id_fkey'
  ), 'SC1-FK FAIL: no FK constraint parent_subscriptions_parent_id_fkey -> parents found';
  RAISE NOTICE 'SC1-FK PASS';
END $$;

-- SC1-IDX: parent_subscriptions_parent_id_idx exists.
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'parent_subscriptions'
      AND indexname = 'parent_subscriptions_parent_id_idx'
  ), 'SC1-IDX FAIL: parent_subscriptions_parent_id_idx does not exist';
  RAISE NOTICE 'SC1-IDX PASS';
END $$;

-- SC1-POL-NEW: the new sibling SELECT policy exists, correct shape.
DO $$
DECLARE pol record;
BEGIN
  SELECT * INTO pol FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'parent_subscriptions'
    AND policyname = 'parent_subscriptions_select_own_parent';
  ASSERT pol.policyname IS NOT NULL, 'SC1-POL-NEW FAIL: parent_subscriptions_select_own_parent does not exist';
  ASSERT pol.cmd = 'SELECT', format('SC1-POL-NEW FAIL: cmd is %s, expected SELECT', pol.cmd);
  ASSERT pol.permissive = 'PERMISSIVE', format('SC1-POL-NEW FAIL: permissive is %s, expected PERMISSIVE', pol.permissive);
  ASSERT pol.qual ILIKE '%parent_id%', format('SC1-POL-NEW FAIL: qual does not reference parent_id: %s', pol.qual);
  RAISE NOTICE 'SC1-POL-NEW PASS';
END $$;

-- SC1-POL-LEGACY: the pre-existing legacy policy still exists (D-15 additive
-- -- asserting its survival is as important as asserting the new one's
-- creation).
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parent_subscriptions'
      AND policyname = 'parent_subscriptions_select_own'
  ), 'SC1-POL-LEGACY FAIL: legacy parent_subscriptions_select_own policy was dropped -- D-15 requires additive-only';
  RAISE NOTICE 'SC1-POL-LEGACY PASS';
END $$;

-- SC1-POL-PLAIN: no policy on parent_subscriptions references owned_child_ids
-- (SC-1: no child-profile indirection in the billing hot path).
DO $$
BEGIN
  ASSERT (
    SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parent_subscriptions'
      AND (qual ILIKE '%owned_child_ids%' OR with_check ILIKE '%owned_child_ids%')
  ) = 0, 'SC1-POL-PLAIN FAIL: a parent_subscriptions policy references owned_child_ids';
  RAISE NOTICE 'SC1-POL-PLAIN PASS';
END $$;

-- SC1-NOWRITE: zero non-SELECT policies on parent_subscriptions for
-- authenticated (T-5-03 -- writes stay service-role only).
DO $$
BEGIN
  ASSERT (
    SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parent_subscriptions'
      AND cmd <> 'SELECT'
      AND 'authenticated' = ANY(roles)
  ) = 0, 'SC1-NOWRITE FAIL: a non-SELECT policy for authenticated exists on parent_subscriptions';
  RAISE NOTICE 'SC1-NOWRITE PASS';
END $$;

-- MIG-BACKFILL: zero rows left with parent_id IS NULL after both backfill
-- passes.
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM parent_subscriptions WHERE parent_id IS NULL;
  ASSERT n = 0, format('MIG-BACKFILL FAIL: %s row(s) still have parent_id IS NULL', n);
  RAISE NOTICE 'MIG-BACKFILL PASS';
END $$;

-- MIG-BACKFILL-MATCH: every row's parent_id is explained by the D-01
-- resolve-chain -- either the direct parents.id match (Pass 1) or the
-- child_profiles hop (Pass 2). Proves the backfill did not assign arbitrarily.
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n
  FROM parent_subscriptions ps
  WHERE NOT (
    ps.parent_id = ps.student_id
    OR ps.parent_id = (SELECT cp.parent_id FROM child_profiles cp WHERE cp.id = ps.student_id)
  );
  ASSERT n = 0, format('MIG-BACKFILL-MATCH FAIL: %s row(s) have a parent_id not explained by the resolve-chain', n);
  RAISE NOTICE 'MIG-BACKFILL-MATCH PASS';
END $$;

-- SC1-HAS-PARENT: a parent_id-only row (D-02 new checkout shape) qualifies.
INSERT INTO parent_subscriptions (parent_id, student_id, ls_subscription_id, status)
SELECT parent_a, NULL, 'rehearsal_parentonly', 'active' FROM _r5;

DO $$
BEGIN
  ASSERT has_active_subscription((SELECT parent_a FROM _r5)) = true,
    'SC1-HAS-PARENT FAIL: has_active_subscription() is false for a parent_id-only active row';
  RAISE NOTICE 'SC1-HAS-PARENT PASS';
END $$;

DELETE FROM parent_subscriptions WHERE ls_subscription_id = 'rehearsal_parentonly';

-- SC1-HAS-LEGACY: a legacy student_id-only row still qualifies (D-16's OR
-- branch -- the deploy-window insurance for a warm old function instance).
INSERT INTO parent_subscriptions (parent_id, student_id, ls_subscription_id, status)
SELECT NULL, parent_b, 'rehearsal_legacyonly', 'active' FROM _r5;

DO $$
BEGIN
  ASSERT has_active_subscription((SELECT parent_b FROM _r5)) = true,
    'SC1-HAS-LEGACY FAIL: has_active_subscription() is false for a legacy student_id-only active row';
  RAISE NOTICE 'SC1-HAS-LEGACY PASS';
END $$;

DELETE FROM parent_subscriptions WHERE ls_subscription_id = 'rehearsal_legacyonly';

-- SC1-HAS-NEG: an unrelated random uuid with no rows has no active subscription.
DO $$
BEGIN
  ASSERT has_active_subscription(gen_random_uuid()) = false,
    'SC1-HAS-NEG FAIL: has_active_subscription() is true for a random uuid with no rows';
  RAISE NOTICE 'SC1-HAS-NEG PASS';
END $$;

-- SC1-RLS-SELF / SC1-RLS-CROSS: impersonating parent_a, they see exactly their
-- own probe row and zero of parent_b's.
INSERT INTO parent_subscriptions (parent_id, student_id, ls_subscription_id, status)
SELECT parent_a, NULL, 'rehearsal_rls_a', 'active' FROM _r5;
INSERT INTO parent_subscriptions (parent_id, student_id, ls_subscription_id, status)
SELECT parent_b, NULL, 'rehearsal_rls_b', 'active' FROM _r5;

SELECT set_config('request.jwt.claims',
  format('{"sub":"%s","role":"authenticated"}', (SELECT parent_a FROM _r5)), true);
SET ROLE authenticated;

DO $$
DECLARE
  own_count INT;
  cross_count INT;
BEGIN
  SELECT COUNT(*) INTO own_count FROM parent_subscriptions WHERE ls_subscription_id = 'rehearsal_rls_a';
  SELECT COUNT(*) INTO cross_count FROM parent_subscriptions WHERE ls_subscription_id = 'rehearsal_rls_b';
  ASSERT own_count = 1, format('SC1-RLS-SELF FAIL: parent_a could not see own probe row (count=%s)', own_count);
  RAISE NOTICE 'SC1-RLS-SELF PASS';
  ASSERT cross_count = 0, format('SC1-RLS-CROSS FAIL: parent_a could see parent_b probe row (count=%s)', cross_count);
  RAISE NOTICE 'SC1-RLS-CROSS PASS';
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);

DELETE FROM parent_subscriptions WHERE ls_subscription_id IN ('rehearsal_rls_a', 'rehearsal_rls_b');

-- D03-TABLE: unresolved_webhook_log exists, RLS enabled, deny_all_access
-- RESTRICTIVE.
DO $$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'unresolved_webhook_log' AND relkind = 'r'),
    'D03-TABLE FAIL: unresolved_webhook_log does not exist';
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE relname = 'unresolved_webhook_log') = true,
    'D03-TABLE FAIL: RLS is not enabled on unresolved_webhook_log';
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'unresolved_webhook_log'
      AND policyname = 'deny_all_access' AND permissive = 'RESTRICTIVE'
  ), 'D03-TABLE FAIL: deny_all_access RESTRICTIVE policy missing on unresolved_webhook_log';
  RAISE NOTICE 'D03-TABLE PASS';
END $$;

-- D03-DENY: impersonating parent_a, SELECT COUNT(*) on unresolved_webhook_log
-- returns 0 even after a service-role insert of a probe row inside this
-- transaction.
INSERT INTO unresolved_webhook_log (event_name, ls_subscription_id, attempted_id, raw_payload)
VALUES ('rehearsal_probe', 'rehearsal_dl_probe', '00000000-0000-0000-0000-000000000fff', '{}'::jsonb);

SELECT set_config('request.jwt.claims',
  format('{"sub":"%s","role":"authenticated"}', (SELECT parent_a FROM _r5)), true);
SET ROLE authenticated;

DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM unresolved_webhook_log;
  ASSERT n = 0, format('D03-DENY FAIL: authenticated role could read %s row(s) from unresolved_webhook_log', n);
  RAISE NOTICE 'D03-DENY PASS';
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);

-- D08-NOCONSTRAINT: zero unique indexes/constraints on parent_subscriptions
-- involving parent_id (D-08 -- verifying the deliberate absence).
DO $$
BEGIN
  ASSERT (
    SELECT count(*) FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.parent_subscriptions'::regclass
      AND c.contype = 'u'
      AND a.attname = 'parent_id'
  ) = 0, 'D08-NOCONSTRAINT FAIL: a unique constraint on parent_id exists -- D-08 requires none';
  RAISE NOTICE 'D08-NOCONSTRAINT PASS';
END $$;

-- D08-AUDIT: informational only (RAISE NOTICE, not ASSERT) -- count of parents
-- with more than one currently-qualifying subscription row.
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM (
    SELECT parent_id FROM parent_subscriptions
    WHERE parent_id IS NOT NULL
      AND (status = 'active' OR status = 'on_trial'
           OR (status = 'cancelled' AND current_period_end > NOW())
           OR (status = 'past_due' AND current_period_end > NOW() - INTERVAL '3 days'))
    GROUP BY parent_id HAVING COUNT(*) > 1
  ) dupes;
  RAISE NOTICE 'D08-AUDIT: % parent(s) currently have more than one qualifying subscription row', n;
END $$;


-- ----------------------------------------------------------------------------
-- Section C -- down-migration (proves clean reversal). Body of
-- supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.down.sql,
-- its own transaction-control statements stripped.
-- ----------------------------------------------------------------------------

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

DROP POLICY IF EXISTS "parent_subscriptions_select_own_parent" ON parent_subscriptions;

DROP INDEX IF EXISTS parent_subscriptions_parent_id_idx;

ALTER TABLE parent_subscriptions DROP CONSTRAINT IF EXISTS parent_subscriptions_parent_id_fkey;

ALTER TABLE parent_subscriptions DROP COLUMN IF EXISTS parent_id;

DROP POLICY IF EXISTS "deny_all_access" ON public.unresolved_webhook_log;
DROP TABLE IF EXISTS unresolved_webhook_log;

-- Inverse assertions: confirm the down-migration left nothing behind.
DO $$
BEGIN
  ASSERT NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.parent_subscriptions'::regclass
      AND attname = 'parent_id' AND NOT attisdropped
  ), 'DOWN-COL FAIL: parent_id column still exists after down-migration';
  RAISE NOTICE 'DOWN-COL PASS';
END $$;

DO $$
BEGIN
  ASSERT NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parent_subscriptions'
      AND policyname = 'parent_subscriptions_select_own_parent'
  ), 'DOWN-POL FAIL: parent_subscriptions_select_own_parent policy still exists after down-migration';
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parent_subscriptions'
      AND policyname = 'parent_subscriptions_select_own'
  ), 'DOWN-POL FAIL: legacy parent_subscriptions_select_own policy is missing after down-migration -- it must never be touched';
  RAISE NOTICE 'DOWN-POL PASS';
END $$;

DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'unresolved_webhook_log' AND relkind = 'r'),
    'DOWN-TABLE FAIL: unresolved_webhook_log still exists after down-migration';
  RAISE NOTICE 'DOWN-TABLE PASS';
END $$;

DO $$
DECLARE fn_src TEXT;
BEGIN
  SELECT prosrc INTO fn_src FROM pg_proc WHERE proname = 'has_active_subscription';
  ASSERT fn_src NOT ILIKE '%parent_id%',
    'DOWN-FUNC FAIL: has_active_subscription() prosrc still references parent_id after down-migration';
  RAISE NOTICE 'DOWN-FUNC PASS';
END $$;


-- ----------------------------------------------------------------------------
-- Section D -- re-apply the forward migration once more (idempotency proof).
-- Identical body to Section A above.
-- ----------------------------------------------------------------------------

ALTER TABLE parent_subscriptions
  ADD COLUMN IF NOT EXISTS parent_id UUID;

ALTER TABLE parent_subscriptions
  DROP CONSTRAINT IF EXISTS parent_subscriptions_parent_id_fkey;

ALTER TABLE parent_subscriptions
  ADD CONSTRAINT parent_subscriptions_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS parent_subscriptions_parent_id_idx
  ON parent_subscriptions (parent_id);

UPDATE parent_subscriptions ps
SET    parent_id = p.id
FROM   parents p
WHERE  ps.student_id = p.id
  AND  ps.parent_id IS NULL;

UPDATE parent_subscriptions ps
SET    parent_id = cp.parent_id
FROM   child_profiles cp
WHERE  ps.student_id = cp.id
  AND  cp.parent_id IS NOT NULL
  AND  ps.parent_id IS NULL;

DROP POLICY IF EXISTS "parent_subscriptions_select_own_parent" ON parent_subscriptions;
CREATE POLICY "parent_subscriptions_select_own_parent"
  ON parent_subscriptions
  FOR SELECT
  TO authenticated
  USING (parent_id = (SELECT auth.uid()));

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

CREATE TABLE IF NOT EXISTS unresolved_webhook_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_name          TEXT,
  ls_subscription_id  TEXT,
  attempted_id        TEXT,
  raw_payload         JSONB NOT NULL,
  resolved            BOOLEAN NOT NULL DEFAULT FALSE
);

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

-- Re-apply idempotency assertions.
DO $$
DECLARE col_type TEXT;
BEGIN
  SELECT format_type(atttypid, atttypmod) INTO col_type
  FROM pg_attribute
  WHERE attrelid = 'public.parent_subscriptions'::regclass
    AND attname = 'parent_id' AND NOT attisdropped;
  ASSERT col_type = 'uuid', 'REAPPLY-SC1-COL FAIL: parent_id column was not recreated correctly';
  RAISE NOTICE 'REAPPLY-SC1-COL PASS';
END $$;

DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parent_subscriptions'
      AND policyname = 'parent_subscriptions_select_own_parent'
  ), 'REAPPLY-SC1-POL-NEW FAIL: sibling policy missing after re-apply';
  RAISE NOTICE 'REAPPLY-SC1-POL-NEW PASS';
END $$;

DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM parent_subscriptions WHERE parent_id IS NULL;
  ASSERT n = 0, format('REAPPLY-MIG-BACKFILL FAIL: %s row(s) still have parent_id IS NULL after re-apply', n);
  RAISE NOTICE 'REAPPLY-MIG-BACKFILL PASS';
END $$;


-- ============================================================================
-- UNDO EVERYTHING. Nothing above this line persists in production.
-- ============================================================================

ROLLBACK;

-- Post-rollback sanity check (separate implicit read, confirms nothing survived):
SELECT
  (SELECT count(*) FROM pg_attribute WHERE attrelid = 'public.parent_subscriptions'::regclass AND attname = 'parent_id' AND NOT attisdropped) AS parent_id_column_count_should_be_0,
  (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='parent_subscriptions' AND policyname = 'parent_subscriptions_select_own_parent') AS new_policy_count_should_be_0,
  (SELECT count(*) FROM pg_class WHERE relname = 'unresolved_webhook_log') AS dead_letter_table_count_should_be_0,
  (SELECT count(*) FROM parent_subscriptions WHERE ls_subscription_id LIKE 'rehearsal_%') AS probe_rows_should_be_0;

DROP TABLE IF EXISTS _r5;

-- ============================================================================
-- AFTER RUNNING: paste the FULL output back -- especially every NOTICE and any
-- ERROR -- so 05-apply-log.md can be filled with real PASS/FAIL verdicts per
-- assertion. A clean run shows: no ERROR anywhere above, every RAISE NOTICE
-- reads "... PASS" (except D08-AUDIT, which is informational only), and the
-- final sanity-check SELECT returns all zeros.
-- ============================================================================
