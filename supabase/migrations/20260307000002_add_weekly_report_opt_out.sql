-- Add weekly report opt-out column to push_subscriptions
-- Supports Phase 21 PROG-07: Parent weekly progress email reports
-- Parents who have granted consent (parent_consent_granted = true) will receive
-- weekly emails unless they opt out via the unsubscribe link.

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS weekly_report_opted_out BOOLEAN NOT NULL DEFAULT false;

-- Track when the last weekly report was sent (rate limiting / dedup)
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS last_weekly_report_at TIMESTAMPTZ;

COMMENT ON COLUMN push_subscriptions.weekly_report_opted_out IS 'If true, parent has unsubscribed from weekly progress emails';
COMMENT ON COLUMN push_subscriptions.last_weekly_report_at IS 'Last time a weekly report was sent to this student parent';

-- pg_cron job for weekly report (run manually in Supabase SQL editor):
-- SELECT cron.schedule(
--   'send-weekly-report',
--   '0 8 * * 1',  -- Monday 08:00 UTC (~10:00 AM Israel)
--   $$SELECT net.http_post(
--     url := '<SUPABASE_URL>/functions/v1/send-weekly-report',
--     headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
--     body := '{}'::jsonb
--   );$$
-- );
