-- Migration: Add push_subscriptions table for Web Push notification opt-in
-- Created: 2026-03-04
-- Phase: 17 - Push Notifications (NOTIF-03, NOTIF-04)
--
-- Purpose: Store Web Push subscription objects per student, with COPPA parent consent
-- tracking and a 1/day rate limit column (last_notified_at).
--
-- The Edge Function (send-daily-push) uses the service_role key to bypass RLS
-- when updating last_notified_at and disabling expired (410 Gone) subscriptions.
-- Students interact with their own row via client-side RLS policies below.

-- ============================================================
-- Table
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subscription          JSONB,      -- Full PushSubscription object: { endpoint, keys: { p256dh, auth } }
  is_enabled            BOOLEAN     NOT NULL DEFAULT false,
  parent_consent_granted BOOLEAN   NOT NULL DEFAULT false,
  parent_consent_at     TIMESTAMPTZ,  -- Timestamp when parent solved the math verification problem
  last_notified_at      TIMESTAMPTZ,  -- Server-set; enforces 1-notification-per-day rate limit
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT push_subscriptions_student_id_key UNIQUE (student_id)
);

-- ============================================================
-- Index: efficient Edge Function query for enabled subscriptions
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled
  ON push_subscriptions(is_enabled)
  WHERE is_enabled = true;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Students can read their own subscription row (to display toggle state in settings)
CREATE POLICY "push_subscriptions_select_own"
  ON push_subscriptions
  FOR SELECT
  USING (auth.uid() = student_id);

-- Students can insert their own row (first-time opt-in)
CREATE POLICY "push_subscriptions_insert_own"
  ON push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own row (toggle is_enabled, update subscription JSON after re-subscribe)
CREATE POLICY "push_subscriptions_update_own"
  ON push_subscriptions
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Students can delete their own row (full unsubscribe / account cleanup)
CREATE POLICY "push_subscriptions_delete_own"
  ON push_subscriptions
  FOR DELETE
  USING (auth.uid() = student_id);

-- Note: The Edge Function uses the service_role key (bypasses RLS) to:
--   1. Write last_notified_at after a successful push send
--   2. Set is_enabled = false and subscription = null on 410 Gone (expired subscription cleanup)
-- No separate service_role INSERT/UPDATE policy is needed for RLS bypass.

-- ============================================================
-- Auto-update updated_at on row modification
-- ============================================================

CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- ============================================================
-- pg_cron setup (run MANUALLY in Supabase SQL Editor after deploy)
-- ============================================================
-- Do NOT include this in the migration itself. This section is documentation only.
--
-- Schedule: 14:00 UTC daily = ~4pm Israel (winter) / ~5pm Israel (summer)
--
-- Prerequisites:
--   1. Store project URL in Vault:
--        SELECT vault.create_secret('https://[project-ref].supabase.co', 'project_url');
--   2. Store cron secret in Vault:
--        SELECT vault.create_secret('[your-cron-secret]', 'cron_secret');
--   3. Set CRON_SECRET as Edge Function environment secret (must match Vault value):
--        supabase secrets set CRON_SECRET=[your-cron-secret]
--   4. Set VAPID keys as Edge Function environment secrets:
--        supabase secrets set VAPID_PUBLIC_KEY=[your-vapid-public-key]
--        supabase secrets set VAPID_PRIVATE_KEY=[your-vapid-private-key]
--        supabase secrets set VAPID_SUBJECT=mailto:admin@pianomaster.app
--
-- SELECT cron.schedule(
--   'send-daily-push-notifications',
--   '0 14 * * *',
--   $$
--   SELECT net.http_post(
--     url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
--            || '/functions/v1/send-daily-push',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
--     ),
--     body := '{}'::jsonb
--   ) AS request_id;
--   $$
-- );
--
-- To verify schedule is registered:
--   SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'send-daily-push-notifications';
--
-- To remove the schedule (if needed):
--   SELECT cron.unschedule('send-daily-push-notifications');
