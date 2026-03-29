-- Phase 11: Reset exercise_progress and stars for all remapped rhythm nodes
-- All rhythm nodes are being remapped from single EXERCISE_TYPES.RHYTHM to mixed exercise types.
-- Stale single-exercise progress records would conflict with the new exercise type assignments.
-- DEPLOY CONSTRAINT: This migration MUST run before updated rhythmUnit*.js files deploy to production.

UPDATE public.student_skill_progress
SET
  exercise_progress = '[]'::jsonb,
  stars = 0,
  best_score = NULL
WHERE node_id LIKE 'rhythm_%'
   OR node_id LIKE 'boss_rhythm_%';
