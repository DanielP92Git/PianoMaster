-- =============================================================================
-- Down-migration: reverses 20260803120000_add_parent_age_verified.sql
-- =============================================================================
BEGIN;
ALTER TABLE parents DROP COLUMN IF EXISTS age_verified_at;
COMMIT;
