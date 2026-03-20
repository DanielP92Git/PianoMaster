-- Migration: Account Deletion Audit Log
-- Date: 2026-03-21
-- Description: Audit table for COPPA-compliant permanent account deletions.
--              Records are standalone (NO FK to students) so they survive deletion.
--              Student ID is stored as HMAC-SHA256 hash for privacy.

CREATE TABLE IF NOT EXISTS account_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NO FK to students — audit record must survive student deletion
  student_id_hash TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_categories_removed TEXT[] NOT NULL,
  ls_subscription_cancelled BOOLEAN NOT NULL DEFAULT false,
  email_status TEXT NOT NULL,
  dry_run BOOLEAN NOT NULL DEFAULT false
);

-- Add check constraint for email_status
ALTER TABLE account_deletion_log
  ADD CONSTRAINT account_deletion_log_email_status_check
  CHECK (email_status IN ('sent', 'failed', 'skipped'));

-- No RLS needed — only writable by Edge Function service role, never by authenticated users
-- No FK to students — audit records must persist after student deletion
-- No retention policy — COPPA audit records kept indefinitely (no PII, negligible storage)

COMMENT ON TABLE account_deletion_log IS
  'COPPA compliance audit trail for permanent account deletions. No FK to students — records survive deletion. Student IDs stored as HMAC-SHA256 hashes.';
