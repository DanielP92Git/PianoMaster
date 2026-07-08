-- ============================================================================
-- Migration: Make is_free_node() NULL-safe (non-trail scores always allowed)
-- Date: 2026-07-08
-- ============================================================================
-- Non-trail games (NotesRecognition, MemoryGame, free practice, etc.) save a
-- students_score row with node_id = NULL. The students_score INSERT gate is:
--
--   WITH CHECK (
--     student_id = auth.uid()
--     AND (is_free_node(node_id) OR has_active_subscription(auth.uid()))
--   )
--
-- But the previous is_free_node() body was `RETURN p_node_id = ANY(ARRAY[...])`,
-- and in SQL `NULL = ANY(ARRAY[...])` evaluates to NULL, not FALSE. So for a
-- non-trail score the gate collapsed to `NULL OR has_active_subscription(...)`,
-- which is NULL (treated as FALSE) for any user WITHOUT an active subscription.
-- Result: free / non-subscriber users were silently blocked from saving ANY
-- non-trail score -- contradicting the documented contract ("non-trail games
-- pass node_id: null which always passes"; see CLAUDE.md Content Gate section).
--
-- Fix at the root: a NULL node_id means "no trail node to gate", so treat it as
-- free (return TRUE). This makes the gate pass for non-trail scores regardless
-- of subscription, and is null-safe for every other caller of is_free_node().
-- Real trail node IDs are unaffected -- a paywalled node still returns FALSE, so
-- premium content stays gated. The whitelist array is copied verbatim from the
-- prior authoritative definition (20260601000001_phase1_rhythm_pedagogy.sql);
-- CREATE OR REPLACE rewrites the whole body, so the full list must be present.
--
-- Kept in sync with the JS mirror isFreeNode() in src/config/subscriptionConfig.js
-- (which now returns true for null/undefined for the same reason).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_free_node(p_node_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- No trail node (non-trail games pass NULL) is always allowed on the free tier.
  IF p_node_id IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN p_node_id = ANY(ARRAY[
    -- Treble Unit 1
    'treble_1_1','treble_1_2','treble_1_3','treble_1_4',
    'treble_1_5','treble_1_6','treble_1_7',
    -- Bass Unit 1
    'bass_1_1','bass_1_2','bass_1_3','bass_1_4',
    'bass_1_5','bass_1_6',
    -- Rhythm Unit 1 (Phase 1 v3.5: all 6 nodes free per D-12)
    'rhythm_1_1','rhythm_1_2','rhythm_1_3','rhythm_1_4','rhythm_1_5',
    'boss_rhythm_1',
    -- Ear Training Unit 1
    'ear_1_1','ear_1_2','ear_1_3','ear_1_4','ear_1_5','ear_1_6'
  ]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_free_node(TEXT) TO authenticated;

COMMENT ON FUNCTION public.is_free_node IS
  'Returns true for free-tier accessible trail nodes, AND for a NULL node_id (non-trail games always pass). Synced with JS subscriptionConfig.js isFreeNode(). NULL-safe as of 2026-07-08.';
