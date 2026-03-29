-- Phase 10: Add ear training free nodes to is_free_node() function
-- Synced with src/config/subscriptionConfig.js FREE_NODE_IDS
-- Per D-07: All of Unit 1 is free (6 nodes). Unit 2 is premium.
-- Per D-08: All boss nodes paywalled.

CREATE OR REPLACE FUNCTION public.is_free_node(node_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN node_id = ANY(ARRAY[
    -- Treble clef Unit 1 (7 free nodes)
    'treble_1_1', 'treble_1_2', 'treble_1_3', 'treble_1_4',
    'treble_1_5', 'treble_1_6', 'treble_1_7',
    -- Bass clef Unit 1 (6 free nodes)
    'bass_1_1', 'bass_1_2', 'bass_1_3', 'bass_1_4',
    'bass_1_5', 'bass_1_6',
    -- Rhythm Unit 1 (6 free nodes)
    'rhythm_1_1', 'rhythm_1_2', 'rhythm_1_3', 'rhythm_1_4',
    'rhythm_1_5', 'rhythm_1_6',
    -- Ear training Unit 1 (6 free nodes) — D-07, D-09
    'ear_1_1', 'ear_1_2', 'ear_1_3', 'ear_1_4',
    'ear_1_5', 'ear_1_6'
  ]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_free_node(TEXT) TO authenticated;
COMMENT ON FUNCTION public.is_free_node IS
  'Returns true for free-tier accessible trail nodes. Synced with JS subscriptionConfig.js FREE_NODE_IDS. Updated in Phase 10 to include ear training Unit 1.';
