-- =============================================
-- Rate Limiting Infrastructure for XP System
-- =============================================
-- Purpose: Prevent XP farming by limiting score submissions
-- Limit: 10 submissions per 5 minutes per student per node
-- Pattern: Fixed window rate limiting with advisory locks
-- =============================================

-- Table to track rate limits per student per node
CREATE TABLE IF NOT EXISTS rate_limits (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  tokens INTEGER NOT NULL DEFAULT 10,
  last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, node_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_student_node
  ON rate_limits(student_id, node_id);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Students can only see/modify their own rate limits
CREATE POLICY "Students can view own rate limits"
  ON rate_limits
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own rate limits"
  ON rate_limits
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own rate limits"
  ON rate_limits
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON rate_limits TO authenticated;

-- =============================================
-- Rate Limit Check Function
-- =============================================
-- SECURITY DEFINER to ensure atomic operations
-- Uses advisory lock to prevent race conditions
-- =============================================

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_student_id UUID,
  p_node_id TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 300 -- 5 minutes
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tokens INTEGER;
  v_elapsed_seconds NUMERIC;
BEGIN
  -- =============================================
  -- Authorization Check: User can only check their own rate limit
  -- =============================================
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Not authenticated';
  END IF;

  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot check rate limit for another user';
  END IF;

  -- =============================================
  -- Advisory Lock: Prevent race conditions
  -- Lock is released at end of transaction
  -- =============================================
  PERFORM pg_advisory_xact_lock(hashtext(p_student_id::text || p_node_id));

  -- =============================================
  -- Get current token count and calculate elapsed time
  -- =============================================
  SELECT tokens, EXTRACT(EPOCH FROM (NOW() - last_refill))
  INTO v_tokens, v_elapsed_seconds
  FROM rate_limits
  WHERE student_id = p_student_id AND node_id = p_node_id;

  -- =============================================
  -- Case 1: First submission - create record with max-1 tokens
  -- =============================================
  IF NOT FOUND THEN
    INSERT INTO rate_limits (student_id, node_id, tokens, last_refill)
    VALUES (p_student_id, p_node_id, p_max_requests - 1, NOW());
    RETURN TRUE;
  END IF;

  -- =============================================
  -- Case 2: Window expired - reset tokens (fixed window)
  -- =============================================
  IF v_elapsed_seconds >= p_window_seconds THEN
    UPDATE rate_limits
    SET tokens = p_max_requests - 1, last_refill = NOW()
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  END IF;

  -- =============================================
  -- Case 3: Window active, tokens available - consume one
  -- =============================================
  IF v_tokens > 0 THEN
    UPDATE rate_limits
    SET tokens = tokens - 1
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  END IF;

  -- =============================================
  -- Case 4: Rate limited - no tokens left
  -- =============================================
  RETURN FALSE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- Documentation
COMMENT ON TABLE rate_limits IS 'Tracks rate limit tokens per student per trail node. Used to prevent XP farming.';
COMMENT ON COLUMN rate_limits.student_id IS 'Student ID (foreign key to students table)';
COMMENT ON COLUMN rate_limits.node_id IS 'Trail node ID being rate limited';
COMMENT ON COLUMN rate_limits.tokens IS 'Remaining tokens in current window (0-10)';
COMMENT ON COLUMN rate_limits.last_refill IS 'Timestamp when tokens were last reset';

COMMENT ON FUNCTION public.check_rate_limit IS 'Fixed window rate limiter: 10 requests per 5 minutes per student per node. Returns TRUE if request allowed, FALSE if rate limited. Uses advisory lock to prevent race conditions.';
