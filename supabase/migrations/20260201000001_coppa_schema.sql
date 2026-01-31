-- Migration: COPPA Compliance Schema
-- Date: 2026-02-01
-- Description: Adds database schema required for COPPA compliance:
--              - DOB tracking for age verification
--              - Account status states (active, suspended, deleted)
--              - Parental consent logging with audit trail
--              - Consent verification tokens
--              - Anonymous musical nicknames for child privacy

-- ============================================
-- 1. Alter Students Table - Add COPPA Fields
-- ============================================

-- Date of birth for age calculation
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Computed column: is_under_13 based on date_of_birth
-- Note: Using trigger instead of GENERATED ALWAYS AS for better compatibility
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS is_under_13 BOOLEAN DEFAULT false;

-- Account status for consent/deletion workflow
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';

-- Add check constraint for account_status (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_account_status_check'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_account_status_check
      CHECK (account_status IN ('active', 'suspended_consent', 'suspended_deletion', 'deleted'));
  END IF;
END $$;

-- Parent/guardian email for consent workflow
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS parent_email TEXT;

-- Consent tracking timestamps
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS consent_verified_at TIMESTAMPTZ;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS consent_revoked_at TIMESTAMPTZ;

-- Soft delete scheduling timestamps
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ;

-- Anonymous display name for shared features (COPPA child privacy)
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS musical_nickname TEXT;

-- ============================================
-- 2. Trigger to Compute is_under_13
-- ============================================

-- Function to calculate is_under_13 from date_of_birth
CREATE OR REPLACE FUNCTION calculate_is_under_13()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    NEW.is_under_13 := NEW.date_of_birth > CURRENT_DATE - INTERVAL '13 years';
  ELSE
    NEW.is_under_13 := false;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_calculate_is_under_13 ON students;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trigger_calculate_is_under_13
  BEFORE INSERT OR UPDATE OF date_of_birth ON students
  FOR EACH ROW
  EXECUTE FUNCTION calculate_is_under_13();

-- ============================================
-- 3. Parental Consent Log Table
-- ============================================

CREATE TABLE IF NOT EXISTS parental_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_email TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add check constraint for action (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parental_consent_log_action_check'
  ) THEN
    ALTER TABLE parental_consent_log ADD CONSTRAINT parental_consent_log_action_check
      CHECK (action IN ('requested', 'verified', 'revoked', 'expired'));
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE parental_consent_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parental_consent_log
-- Students can read their own consent logs
CREATE POLICY parental_consent_log_select_own
  ON parental_consent_log
  FOR SELECT
  USING (
    student_id = auth.uid()
  );

-- Teachers can read consent logs of their connected students
CREATE POLICY parental_consent_log_select_teacher
  ON parental_consent_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_student_connections tsc
      WHERE tsc.student_id = parental_consent_log.student_id
        AND tsc.teacher_id = auth.uid()
        AND tsc.status = 'accepted'
    )
  );

-- No direct INSERT/UPDATE/DELETE policies - managed by service functions only

-- ============================================
-- 4. Parental Consent Tokens Table
-- ============================================

CREATE TABLE IF NOT EXISTS parental_consent_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (no direct access - service functions only)
ALTER TABLE parental_consent_tokens ENABLE ROW LEVEL SECURITY;

-- No RLS policies - all access through SECURITY DEFINER functions
-- This prevents any direct manipulation of consent tokens

-- ============================================
-- 5. Indexes for Query Performance
-- ============================================

-- Index for filtering students by account status
CREATE INDEX IF NOT EXISTS idx_students_account_status
  ON students(account_status);

-- Index for finding students scheduled for deletion
CREATE INDEX IF NOT EXISTS idx_students_deletion_scheduled
  ON students(deletion_scheduled_at)
  WHERE deletion_scheduled_at IS NOT NULL;

-- Index for finding under-13 students
CREATE INDEX IF NOT EXISTS idx_students_is_under_13
  ON students(is_under_13)
  WHERE is_under_13 = true;

-- Index for consent token lookups by student
CREATE INDEX IF NOT EXISTS idx_consent_tokens_student
  ON parental_consent_tokens(student_id);

-- Index for consent token expiry checks
CREATE INDEX IF NOT EXISTS idx_consent_tokens_expires
  ON parental_consent_tokens(expires_at)
  WHERE used_at IS NULL;

-- Index for consent log lookups by student
CREATE INDEX IF NOT EXISTS idx_consent_log_student
  ON parental_consent_log(student_id);

-- Index for consent log time-based queries
CREATE INDEX IF NOT EXISTS idx_consent_log_created
  ON parental_consent_log(created_at DESC);

-- ============================================
-- 6. Musical Nickname Generator Function
-- ============================================

-- Function to generate random musical nicknames for child privacy
CREATE OR REPLACE FUNCTION generate_musical_nickname()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  adjectives TEXT[] := ARRAY[
    'Happy', 'Funny', 'Bouncy', 'Sparkly', 'Silly',
    'Jazzy', 'Groovy', 'Peppy', 'Merry', 'Zippy',
    'Cheerful', 'Lively', 'Jolly', 'Sunny', 'Perky',
    'Snappy', 'Breezy', 'Chipper', 'Spirited', 'Bright'
  ];
  nouns TEXT[] := ARRAY[
    'Composer', 'Pianist', 'Melody', 'Harmony', 'Rhythm',
    'Note', 'Chord', 'Piano', 'Music', 'Beat',
    'Treble', 'Bass', 'Tempo', 'Tune', 'Song',
    'Scale', 'Key', 'Clef', 'Octave', 'Sound'
  ];
BEGIN
  RETURN adjectives[1 + floor(random() * array_length(adjectives, 1))] || ' ' ||
         nouns[1 + floor(random() * array_length(nouns, 1))];
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_musical_nickname() TO authenticated;

-- ============================================
-- 7. Service Functions for Consent Management
-- ============================================

-- Function to request parental consent (creates token and logs request)
CREATE OR REPLACE FUNCTION request_parental_consent(
  p_student_id UUID,
  p_parent_email TEXT,
  p_token_hash TEXT,
  p_expires_hours INTEGER DEFAULT 72,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_id UUID;
BEGIN
  -- Authorization: user can only request consent for themselves
  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot request consent for another user';
  END IF;

  -- Insert consent token
  INSERT INTO parental_consent_tokens (
    student_id,
    token_hash,
    expires_at
  ) VALUES (
    p_student_id,
    p_token_hash,
    NOW() + (p_expires_hours || ' hours')::INTERVAL
  )
  RETURNING id INTO v_token_id;

  -- Update student's parent email
  UPDATE students
  SET parent_email = p_parent_email
  WHERE id = p_student_id;

  -- Log the consent request
  INSERT INTO parental_consent_log (
    student_id,
    parent_email,
    action,
    ip_address,
    user_agent
  ) VALUES (
    p_student_id,
    p_parent_email,
    'requested',
    p_ip_address,
    p_user_agent
  );

  RETURN v_token_id;
END;
$$;

-- Function to verify parental consent (validates token and updates status)
CREATE OR REPLACE FUNCTION verify_parental_consent(
  p_student_id UUID,
  p_token_hash TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_record parental_consent_tokens%ROWTYPE;
  v_parent_email TEXT;
BEGIN
  -- Find valid, unused token
  SELECT * INTO v_token_record
  FROM parental_consent_tokens
  WHERE student_id = p_student_id
    AND token_hash = p_token_hash
    AND used_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get parent email from student record
  SELECT parent_email INTO v_parent_email
  FROM students
  WHERE id = p_student_id;

  -- Mark token as used
  UPDATE parental_consent_tokens
  SET used_at = NOW()
  WHERE id = v_token_record.id;

  -- Update student consent status
  UPDATE students
  SET consent_verified_at = NOW(),
      consent_revoked_at = NULL,
      account_status = 'active'
  WHERE id = p_student_id;

  -- Log the verification
  INSERT INTO parental_consent_log (
    student_id,
    parent_email,
    action,
    ip_address,
    user_agent
  ) VALUES (
    p_student_id,
    COALESCE(v_parent_email, ''),
    'verified',
    p_ip_address,
    p_user_agent
  );

  RETURN true;
END;
$$;

-- Function to revoke parental consent
CREATE OR REPLACE FUNCTION revoke_parental_consent(
  p_student_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_email TEXT;
BEGIN
  -- Get parent email from student record
  SELECT parent_email INTO v_parent_email
  FROM students
  WHERE id = p_student_id;

  -- Update student consent status
  UPDATE students
  SET consent_revoked_at = NOW(),
      account_status = 'suspended_consent'
  WHERE id = p_student_id;

  -- Log the revocation
  INSERT INTO parental_consent_log (
    student_id,
    parent_email,
    action,
    ip_address,
    user_agent
  ) VALUES (
    p_student_id,
    COALESCE(v_parent_email, ''),
    'revoked',
    p_ip_address,
    p_user_agent
  );
END;
$$;

-- Grant execute permissions to service role only (not authenticated)
-- These functions will be called from server-side code
REVOKE ALL ON FUNCTION verify_parental_consent FROM PUBLIC;
REVOKE ALL ON FUNCTION revoke_parental_consent FROM PUBLIC;
GRANT EXECUTE ON FUNCTION request_parental_consent TO authenticated;

-- ============================================
-- 8. Auto-generate Musical Nickname on Insert
-- ============================================

-- Function to auto-generate nickname if not provided
CREATE OR REPLACE FUNCTION auto_generate_nickname()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.musical_nickname IS NULL THEN
    NEW.musical_nickname := generate_musical_nickname();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_generate_nickname ON students;

-- Create trigger for INSERT
CREATE TRIGGER trigger_auto_generate_nickname
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_nickname();

-- ============================================
-- 9. Documentation Comments
-- ============================================

COMMENT ON COLUMN students.date_of_birth IS
  'User birthday for age verification (COPPA compliance)';

COMMENT ON COLUMN students.is_under_13 IS
  'Computed from date_of_birth - true if user is under 13 years old';

COMMENT ON COLUMN students.account_status IS
  'Account state: active, suspended_consent (awaiting parental consent), suspended_deletion (pending deletion), deleted';

COMMENT ON COLUMN students.parent_email IS
  'Parent/guardian email for COPPA consent workflow';

COMMENT ON COLUMN students.consent_verified_at IS
  'Timestamp when parental consent was verified';

COMMENT ON COLUMN students.consent_revoked_at IS
  'Timestamp when parental consent was revoked';

COMMENT ON COLUMN students.deletion_requested_at IS
  'Timestamp when account deletion was requested (soft delete)';

COMMENT ON COLUMN students.deletion_scheduled_at IS
  'Timestamp when hard delete will be executed (after grace period)';

COMMENT ON COLUMN students.musical_nickname IS
  'Anonymized display name for shared features (COPPA child privacy)';

COMMENT ON TABLE parental_consent_log IS
  'Audit log for all parental consent actions (COPPA compliance)';

COMMENT ON TABLE parental_consent_tokens IS
  'Verification tokens for parental consent emails (COPPA compliance)';

COMMENT ON FUNCTION generate_musical_nickname IS
  'Generates random musical nickname for child privacy in shared features';

COMMENT ON FUNCTION request_parental_consent IS
  'Initiates parental consent workflow - creates token and logs request';

COMMENT ON FUNCTION verify_parental_consent IS
  'Verifies parental consent token and activates account';

COMMENT ON FUNCTION revoke_parental_consent IS
  'Revokes parental consent and suspends account';
