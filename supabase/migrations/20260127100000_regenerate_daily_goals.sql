-- Migration: Regenerate Daily Goals with New Structure
-- Date: 2026-01-27
-- Description: Clears existing daily goals to force regeneration with nameKey/descriptionKey structure
--              This fixes translation issues where old goals don't have the new key fields.

BEGIN;

-- Delete all existing daily goals
-- They will be automatically regenerated with the correct structure when users next visit the dashboard
TRUNCATE TABLE student_daily_goals;

-- Add comment explaining the purpose
COMMENT ON TABLE student_daily_goals IS
  'Daily goals for student engagement. Goals are automatically generated daily with nameKey/descriptionKey for i18n support. Last regenerated: 2026-01-27';

COMMIT;
