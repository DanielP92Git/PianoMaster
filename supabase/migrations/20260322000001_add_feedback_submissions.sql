-- Feedback submission tracking for rate limiting.
-- Message content is NOT stored — sent via Brevo only (per D-07, COPPA-safe).

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for rate check query: COUNT(*) WHERE student_id = X AND created_at > 1 hour ago
CREATE INDEX idx_feedback_submissions_student_created
  ON feedback_submissions(student_id, created_at DESC);

ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Per D-10: authenticated users can INSERT own rows only.
-- No SELECT/UPDATE/DELETE policies for clients.
-- Service role bypasses RLS for rate check COUNT query.
CREATE POLICY "Students can insert own feedback"
  ON feedback_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

GRANT INSERT ON feedback_submissions TO authenticated;

COMMENT ON TABLE feedback_submissions IS
  'Tracks feedback form submissions for rate limiting. Message content is not stored — sent via Brevo only.';
