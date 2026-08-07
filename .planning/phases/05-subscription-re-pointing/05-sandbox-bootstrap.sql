-- ############################################################################
-- SANDBOX ONLY. Run this in the THROWAWAY project's own SQL Editor
-- (bfzdqhsdbqkhznwjfghk), never against production (hdltcvgqrtxuxgjdvzzu).
--
-- WHY THIS FILE EXISTS (not in plan 05-06's original scope): `supabase db push`
-- fails on the very first tracked migration in this repo -- it assumes
-- `teachers`/`students` already exist, because (like `parent_subscriptions`)
-- the entire base schema was created out-of-band, before migration tracking
-- started. Docker is also unavailable locally, which blocks both the local
-- `supabase start` stack AND the CLI's own `db dump` (it shells out to a
-- Dockerized pg_dump even for a remote dump). Native psql/pg_dump are not
-- installed either. So: a minimal, purpose-built schema, hand-authored from
-- facts already CONFIRMED against real production (05-discovery.md, plus the
-- tracked `20260722120000_add_parents_and_child_profiles.sql` migration and
-- `subscriptionService.js`'s actual column usage) -- not guessed.
--
-- Deliberately OMITTED (irrelevant to this plan's scope -- webhook/checkout/
-- cancel resolve-chain behavior against parent_subscriptions):
--   - The 16 unrelated tables the real parents/child_profiles migration adds
--     dual-FKs to (assignment_submissions, feedback_submissions, etc.)
--   - The bidirectional students<->child_profiles sync trigger system (D-19/
--     D-20/D-21) -- nothing in this plan mutates `students` after seeding
--   - avatars table / child_profiles.avatar_id FK -- left as a plain nullable
--     column, no FK, since nothing here reads or writes it
-- ############################################################################

-- -----------------------------------------------------------------------------
-- 1. students -- minimal stub. Only needed to satisfy
--    parent_subscriptions.student_id's FK (confirmed ON DELETE CASCADE,
--    05-discovery.md §1 Q2). No PII columns, no triggers -- this plan never
--    reads student-facing data.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- -----------------------------------------------------------------------------
-- 2. parents -- matches the REAL tracked migration's column set exactly
--    (20260722120000_add_parents_and_child_profiles.sql lines 29-35).
--    Confirmed: NO email column by design ("D-08 minimal, no email" -- the
--    real migration's own comment). Email comes from auth.users when needed.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parents (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  display_name       TEXT,
  requires_reconsent BOOLEAN NOT NULL DEFAULT FALSE
);

-- -----------------------------------------------------------------------------
-- 3. child_profiles -- simplified from the real migration: same identity
--    columns (id, parent_id, nickname, birth_year, is_active), avatar_id kept
--    as a plain nullable UUID with no FK (no avatars table in this sandbox --
--    nothing here reads or writes it).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS child_profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  UUID REFERENCES parents(id) ON DELETE SET NULL,
  nickname   TEXT,
  avatar_id  UUID,
  birth_year INTEGER,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_profiles_parent_id ON child_profiles(parent_id);

-- Deny-all RLS, matching the real migration's D-16 posture (access is granted
-- by later phases in production; nothing here needs authenticated-role access
-- to these two tables directly -- the webhook/create-checkout/cancel-
-- subscription functions all use a service-role client, which bypasses RLS).
ALTER TABLE parents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4. subscription_plans -- column set matches subscriptionService.js's actual
--    confirmed SELECT list exactly: "id, name, billing_period, currency,
--    amount_cents, lemon_squeezy_variant_id" (grepped from the real client
--    code, not guessed). `id` is TEXT: parent_subscriptions.plan_id is
--    confirmed `text` (05-discovery.md §1 Q1/Q2), FK-referencing this column,
--    and docs/DEPLOY.md's real plan ids ('monthly-ils' etc.) are strings, not
--    uuids -- the pre-existing 05-sandbox-seed.sql assumed a uuid id and a
--    price_cents column; both were wrong against the real schema, fixed here
--    and in that file.
--
--    CORRECTION 2 (found only when preparing plan 05-08 Task 2's create-checkout
--    call, not by running this file): the original version of this table omitted
--    `is_active`. create-checkout/index.ts filters
--    `.eq("is_active", true).maybeSingle()` -- without this column every
--    create-checkout call 400s with "Plan not found" before ever reaching Lemon
--    Squeezy. Real production column, confirmed in
--    .planning/milestones/v1.8-phases/12-database-schema-and-rls/12-01-PLAN.md:
--    `is_active BOOLEAN DEFAULT true NOT NULL`.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                       TEXT PRIMARY KEY,
  name                     TEXT NOT NULL,
  billing_period           TEXT,
  currency                 TEXT,
  amount_cents             INTEGER,
  lemon_squeezy_variant_id TEXT,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Matches the REAL tracked policy (20260404000001_ensure_subscription_rls.sql
-- lines 21-29): public SELECT, no PII, reference data.
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscription_plans_select_public" ON subscription_plans;
CREATE POLICY "subscription_plans_select_public"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- 5. parent_subscriptions -- BASE table, pre-parent_id state, exactly matching
--    the CONFIRMED live production schema (05-discovery.md §1 Q1/Q2/Q3/Q4 --
--    real pg_catalog output the owner ran against production, not inferred).
--    The real forward migration file (next step) only ALTERs this table --
--    it assumes it already exists (true on production, out-of-band; not true
--    in a fresh sandbox until this statement runs).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parent_subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  ls_subscription_id  TEXT NOT NULL UNIQUE,
  ls_customer_id      TEXT,
  ls_variant_id       TEXT,
  plan_id             TEXT REFERENCES subscription_plans(id),
  status              TEXT NOT NULL CHECK (status IN
                         ('on_trial','active','paused','past_due','unpaid','cancelled','expired')),
  current_period_end  TIMESTAMPTZ,
  parent_email        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Matches the confirmed live policy exactly (05-discovery.md §1 Q3):
-- parent_subscriptions_select_own, SELECT, student_id = auth.uid().
ALTER TABLE parent_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parent_subscriptions_select_own" ON parent_subscriptions;
CREATE POLICY "parent_subscriptions_select_own"
  ON parent_subscriptions
  FOR SELECT
  TO authenticated
  USING (student_id = (SELECT auth.uid()));

-- ############################################################################
-- NEXT STEPS (do not run yet -- separate steps, in order):
--   1. Run this file (you're doing that now).
--   2. Run the REAL forward migration file verbatim, already proven correct
--      by plan 05-07's production rehearsal:
--      supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.sql
--      (this creates parent_subscriptions itself, unresolved_webhook_log,
--      has_active_subscription(), and their RLS policies -- all confirmed
--      against real production in 05-apply-log.md)
--   3. Run the corrected 05-sandbox-seed.sql
-- ############################################################################
