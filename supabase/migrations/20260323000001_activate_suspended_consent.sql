-- Migration: Activate all accounts suspended pending parental consent
-- Date: 2026-03-23
-- Phase: 01-signup-flow-redesign
-- Context: Signup flow redesign removes consent requirement (D-12).
--          Existing suspended_consent accounts are immediately activated.
--          The 'suspended_consent' value remains valid in the check constraint (harmless).

UPDATE students
  SET account_status = 'active',
      updated_at = NOW()
  WHERE account_status = 'suspended_consent';
