-- Migration: Add Score Percentile Function
-- Date: 2026-02-08
-- Description: Adds PostgreSQL function to calculate percentile rank of a score
--              against a student's historical trail scores using PERCENT_RANK().
--              Used by VictoryScreen celebration system for performance comparison.

-- ============================================
-- Score Percentile Calculation Function
-- ============================================

CREATE OR REPLACE FUNCTION calculate_score_percentile(
  p_student_id UUID,
  p_current_score INTEGER,
  p_node_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_historical_count INTEGER;
  v_percentile_rank DECIMAL;
BEGIN
  -- SECURITY CHECK: User can only calculate their own percentile
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access another student''s data';
  END IF;

  -- Count historical scores for this student across ALL trail nodes
  -- This gives us the total number of past attempts to compare against
  SELECT COUNT(*)
  INTO v_historical_count
  FROM student_skill_progress
  WHERE student_id = p_student_id
    AND best_score > 0;

  -- If fewer than 3 historical attempts, return null (insufficient data for meaningful percentile)
  IF v_historical_count < 3 THEN
    RETURN jsonb_build_object(
      'percentile', NULL,
      'insufficient_data', true,
      'count', v_historical_count
    );
  END IF;

  -- Calculate percentile rank of current score against ALL student's trail scores
  -- This answers: "How does this score rank against all your past trail attempts?"
  -- PERCENT_RANK returns a value from 0 (lowest) to 1 (highest)
  SELECT COALESCE(
    (SELECT pct FROM (
      SELECT best_score, PERCENT_RANK() OVER (ORDER BY best_score) as pct
      FROM (
        -- Combine all historical scores with the current score
        SELECT best_score FROM student_skill_progress
        WHERE student_id = p_student_id
          AND best_score > 0
        UNION ALL
        SELECT p_current_score AS best_score
      ) all_scores
    ) ranked
    WHERE best_score = p_current_score
    ORDER BY pct DESC
    LIMIT 1), 0)
  INTO v_percentile_rank;

  -- Return percentile as 0-100 integer
  RETURN jsonb_build_object(
    'percentile', ROUND(v_percentile_rank * 100),
    'insufficient_data', false,
    'count', v_historical_count
  );
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_score_percentile(UUID, INTEGER, TEXT) TO authenticated;

-- Add documentation comment
COMMENT ON FUNCTION calculate_score_percentile IS
  'Calculates percentile rank of a score against student''s historical trail scores. '
  'Returns null if fewer than 3 historical attempts exist (insufficient data). '
  'Security: Users can only calculate their own percentile (auth.uid() must equal p_student_id). '
  'Uses SET search_path = public to prevent search_path manipulation attacks.';
