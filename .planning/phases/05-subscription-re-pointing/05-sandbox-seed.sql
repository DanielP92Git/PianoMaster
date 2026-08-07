-- ############################################################################
-- SANDBOX ONLY. Do NOT run this against production (hdltcvgqrtxuxgjdvzzu).
-- It writes a Lemon Squeezy TEST-MODE variant id into subscription_plans.
-- A test-mode variant id in production subscription_plans breaks real
-- checkouts for every customer (RESEARCH Pitfall 2).
-- Target: local `supabase start` stack, or the throwaway project recorded in
--         05-discovery.md §5 as `sandbox_target` (currently: throwaway-project,
--         since Docker is unavailable locally -- see 05-discovery.md §5 Q2).
-- ############################################################################

-- =============================================================================
-- Seed:        05-sandbox-seed.sql
-- Milestone:   v4.0 -- Parent-First Account Architecture (COPPA), Phase 5
-- Description: D-10b isolated Lemon Squeezy test-mode checkout fixture data --
--              one sandbox parent, two child profiles (one linked, one
--              orphaned), and one subscription_plans row carrying the
--              confirmed test-mode variant id (861115, product "App Payment",
--              per 05-discovery.md §3).
-- Predecessor: 05-sandbox-bootstrap.sql, then
--              supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.sql
--              must already be applied to the sandbox target before this runs
--              (parent_subscriptions.parent_id, parents, child_profiles must
--              all exist).
-- =============================================================================
--
-- CORRECTION (found only by cross-checking against confirmed real schema,
-- not by running this file -- 05-06's original version had two real bugs):
--   1. `parents` has NO email column ("D-08 minimal, no email" -- the real
--      tracked migration's own comment). Step 2 below uses `display_name` as
--      the lookup marker instead.
--   2. `subscription_plans.id` is TEXT (parent_subscriptions.plan_id is
--      confirmed `text`, FK-referencing it -- 05-discovery.md §1), and the
--      real column is `amount_cents`, not `price_cents` (confirmed from
--      subscriptionService.js's actual SELECT list). Step 3 below fixed.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Sandbox auth user.
--
-- Direct auth.users insert works on a local `supabase start` stack (the GoTrue
-- container reads the same Postgres instance). On a throwaway HOSTED project,
-- auth.users is managed by Supabase Auth and a direct INSERT will not create a
-- usable, sign-in-able account -- use the Auth Admin API or a real signup call
-- instead:
--
--   npx supabase auth admin create-user \
--     --email sim-verify@example.invalid \
--     --password '<sandbox-password, generate your own, do not commit it>' \
--     --project-ref <throwaway-project-ref>
--
-- or the equivalent `supabase.auth.admin.createUser()` call from a one-off
-- Node script using the throwaway project's SERVICE_ROLE_KEY. Either way, the
-- resulting auth.users.id becomes SANDBOX_PARENT_ID below -- substitute it
-- into steps 2-4 in place of the placeholder subquery.
--
-- Local-stack-only direct insert (uncomment ONLY when targeting a local
-- `supabase start` stack, never a hosted project):
--
-- INSERT INTO auth.users (
--   id, instance_id, email, encrypted_password, email_confirmed_at,
--   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
--   aud, role
-- ) VALUES (
--   gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
--   'sim-verify@example.invalid',
--   crypt('replace-with-a-generated-sandbox-password', gen_salt('bf')),
--   NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(),
--   'authenticated', 'authenticated'
-- );

-- -----------------------------------------------------------------------------
-- 2. Matching `parents` row (id = the auth uid created in step 1) and TWO
--    `child_profiles` rows: one linked (parent_id set -- the resolve-chain's
--    probe-2 target), one orphaned (parent_id NULL -- the D-03 dead-letter
--    branch target, mirroring the 5 real teacher-owned profiles).
--
-- Replace :sandbox_parent_id below with the real auth uid from step 1 before
-- running (psql \set, or a plain text substitution -- do NOT leave the
-- placeholder literal in a pasted SQL Editor run).
-- -----------------------------------------------------------------------------

INSERT INTO parents (id, display_name, created_at, updated_at)
VALUES (
  :'sandbox_parent_id',
  'sim-verify-sandbox',
  NOW(), NOW()
);

INSERT INTO child_profiles (id, parent_id, nickname, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  :'sandbox_parent_id',
  'Sandbox Linked Child',
  NOW(), NOW()
);

INSERT INTO child_profiles (id, parent_id, nickname, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  NULL,
  'Sandbox Orphan Child',
  NOW(), NOW()
);

-- -----------------------------------------------------------------------------
-- 3. `subscription_plans` row carrying the TEST-MODE variant id (D-10, per
--    05-discovery.md §3: test_mode_variant_id = 1356600, "Monthly USD" under
--    product "App Payment", store 301493 "PianoMaster"). CORRECTION: the
--    originally recorded `861115` did not correspond to any real variant —
--    found only when plan 05-08's actual create-checkout call 404'd against
--    the live Lemon Squeezy API. See 05-discovery.md §3 addendum.
-- -----------------------------------------------------------------------------

INSERT INTO subscription_plans (
  id, name, billing_period, currency, amount_cents, lemon_squeezy_variant_id,
  is_active, created_at, updated_at
) VALUES (
  'sandbox-monthly-usd',
  'SANDBOX Monthly (test mode)',
  'monthly',
  'USD',
  999,
  '1356600',
  true,
  NOW(), NOW()
);

-- -----------------------------------------------------------------------------
-- 4. IDs TO EXPORT -- paste this SELECT's output into ready-to-use `export`
--    lines for 05-webhook-replay.mjs and 05-sandbox-runbook.md section 2-4.
-- -----------------------------------------------------------------------------

SELECT
  'export REPLAY_PARENT_ID=' || p.id AS export_parent_id,
  'export REPLAY_LINKED_CHILD_ID=' || (
    SELECT cp.id FROM child_profiles cp
    WHERE cp.parent_id = p.id ORDER BY cp.created_at ASC LIMIT 1
  ) AS export_linked_child_id,
  'export REPLAY_ORPHAN_CHILD_ID=' || (
    SELECT cp.id FROM child_profiles cp
    WHERE cp.parent_id IS NULL AND cp.nickname = 'Sandbox Orphan Child'
    ORDER BY cp.created_at DESC LIMIT 1
  ) AS export_orphan_child_id,
  'export SANDBOX_PLAN_ID=' || (
    SELECT sp.id FROM subscription_plans sp
    WHERE sp.name = 'SANDBOX Monthly (test mode)' ORDER BY sp.created_at DESC LIMIT 1
  ) AS export_plan_id
FROM parents p
WHERE p.display_name = 'sim-verify-sandbox'
ORDER BY p.created_at DESC
LIMIT 1;

-- -----------------------------------------------------------------------------
-- 5. TEARDOWN (commented out -- uncomment and run at the end of the sandbox
--    session, per 05-sandbox-runbook.md's Cleanup section). CASCADE via the
--    parents FK deletes the two child_profiles rows and any
--    parent_subscriptions rows written during the session automatically.
-- -----------------------------------------------------------------------------

-- DELETE FROM subscription_plans WHERE name = 'SANDBOX Monthly (test mode)';
-- DELETE FROM parents WHERE display_name = 'sim-verify-sandbox';
-- -- (local-stack only) DELETE FROM auth.users WHERE email = 'sim-verify@example.invalid';
