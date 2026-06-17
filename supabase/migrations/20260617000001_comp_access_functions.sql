-- Complimentary (free "full version") access helpers.
--
-- Lets the app owner grant the full subscription experience to specific
-- accounts (e.g. students' parents) without payment, by upserting an
-- 'active' row into parent_subscriptions keyed off the account email.
--
-- The entire premium gate hinges on a single signal: a parent_subscriptions
-- row with status = 'active' (see fetchSubscriptionStatus in
-- src/services/subscriptionService.js and public.has_active_subscription).
-- SubscriptionContext.jsx listens via Realtime, so a granted account unlocks
-- live with no logout.
--
-- Comp rows are tagged with a synthetic, deterministic
-- ls_subscription_id = 'comp_' || uid so they are idempotent on re-grant and
-- never collide with real Lemon Squeezy subscription ids.
--
-- SECURITY: these functions read auth.users and write a table with no INSERT
-- RLS policy, so they run as SECURITY DEFINER. EXECUTE is REVOKED from app
-- roles (anon/authenticated) so they can ONLY be called from the SQL editor /
-- service role -- otherwise a logged-in student could comp themselves via RPC.
--
-- NOTE: parent_subscriptions was created via the Supabase Management API, so
-- its columns are not in repo migrations. The INSERT column list below matches
-- supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts. Verify
-- against the live schema before relying on this in production.

-- ============================================================
-- grant_comp_access(email) -- upsert a lifetime 'active' comp row
-- ============================================================
CREATE OR REPLACE FUNCTION public.grant_comp_access(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email));

  IF v_uid IS NULL THEN
    RETURN 'NO USER FOUND for ' || p_email;
  END IF;

  INSERT INTO public.parent_subscriptions
    (student_id, ls_subscription_id, status, current_period_end, parent_email, plan_id)
  VALUES
    (v_uid, 'comp_' || v_uid::text, 'active', '2999-12-31T00:00:00Z'::timestamptz, p_email, NULL)
  ON CONFLICT (ls_subscription_id) DO UPDATE
    SET status = 'active',
        current_period_end = '2999-12-31T00:00:00Z'::timestamptz,
        parent_email = EXCLUDED.parent_email;

  RETURN 'Comp access GRANTED to ' || p_email || ' (uid ' || v_uid::text || ')';
END;
$$;

COMMENT ON FUNCTION public.grant_comp_access(TEXT) IS
  'Grants free full-version (comp) access to an account by email. SQL-editor / service-role only.';

-- ============================================================
-- revoke_comp_access(email) -- remove the comp row only
--   (real Lemon Squeezy subscriptions are left untouched)
-- ============================================================
CREATE OR REPLACE FUNCTION public.revoke_comp_access(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID;
  v_count INT;
BEGIN
  SELECT id INTO v_uid
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email));

  IF v_uid IS NULL THEN
    RETURN 'NO USER FOUND for ' || p_email;
  END IF;

  DELETE FROM public.parent_subscriptions
  WHERE ls_subscription_id = 'comp_' || v_uid::text;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN 'Comp access REVOKED for ' || p_email || ' (' || v_count || ' row(s) removed)';
END;
$$;

COMMENT ON FUNCTION public.revoke_comp_access(TEXT) IS
  'Removes a comp access row (comp_<uid>) for an account by email. Does not touch real subscriptions.';

-- ============================================================
-- Lock down: app users must NOT be able to call these.
-- ============================================================
REVOKE ALL ON FUNCTION public.grant_comp_access(TEXT)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_comp_access(TEXT) FROM PUBLIC, anon, authenticated;
