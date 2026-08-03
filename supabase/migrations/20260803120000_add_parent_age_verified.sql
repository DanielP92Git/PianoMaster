-- =============================================================================
-- Migration:   20260803120000_add_parent_age_verified
-- Date:        2026-08-03
-- Milestone:   v4.0 — Parent-First Account Architecture (COPPA), Phase 3
-- Description: Adds a minimal age-verified marker to `parents` (D-09) — the
--              DOB itself is discarded after the 18+ check; only a
--              boolean/timestamp marker persists, following the existing
--              `consent_verified_at` naming pattern.
-- Predecessors: 20260722120000_add_parents_and_child_profiles.sql (parents table)
-- Rollback:     20260803120000_add_parent_age_verified.down.sql
-- =============================================================================

BEGIN;

ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN parents.age_verified_at IS
  'Timestamp when the account owner''s 18+ self-attested DOB check passed. The birth date itself is never stored (D-09) — only this marker.';

COMMIT;
