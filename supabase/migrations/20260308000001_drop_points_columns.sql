-- Migration: Drop points-related columns and functions
-- Part of the score-to-XP unification (Phase 02)
-- Points have been replaced by XP as the sole reward currency
-- student_profiles.achievement_points -> XP awarded via award_xp() RPC
-- student_achievements.points -> XP amount stored in app-level ACHIEVEMENTS const
-- calculate_score_percentile -> unused after VictoryScreen Phase 1 redesign

BEGIN;

-- 1. Drop achievement_points column from student_profiles
-- This column tracked cumulative achievement-earned points.
-- XP is now awarded directly via the award_xp() RPC when achievements are earned.
ALTER TABLE student_profiles DROP COLUMN IF EXISTS achievement_points;

-- 2. Drop points column from student_achievements
-- This column stored per-achievement point values.
-- XP reward amounts are now defined in the app-level ACHIEVEMENTS constant
-- in src/services/achievementService.js and awarded via awardXP().
ALTER TABLE student_achievements DROP COLUMN IF EXISTS points;

-- 3. Drop calculate_score_percentile function
-- This function was used by VictoryScreen to show "top X%" messages.
-- The percentile feature was removed during the VictoryScreen redesign (Phase 01)
-- and the scoreComparisonService that called it was deleted in Plan 02-01.
DROP FUNCTION IF EXISTS calculate_score_percentile(UUID, INTEGER, TEXT);

-- NOTE: The following are intentionally NOT dropped:
-- - students_score table: still used for raw game analytics and daily goals
-- - students.total_xp: active XP system column
-- - students.current_level: active XP level column
-- - award_xp() function: active XP awarding RPC

COMMIT;
