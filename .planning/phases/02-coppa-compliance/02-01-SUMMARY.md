---
phase: 02-coppa-compliance
plan: 01
subsystem: database
tags: [coppa, database-schema, parental-consent, age-verification]
dependency-graph:
  requires: []
  provides: [coppa-schema, consent-tracking, account-states]
  affects: [02-02, 02-03, 02-04, 02-05, 02-06]
tech-stack:
  added: []
  patterns: [trigger-computed-column, security-definer-functions, audit-logging]
key-files:
  created:
    - supabase/migrations/20260201000001_coppa_schema.sql
  modified: []
decisions:
  - name: "Trigger-based computed column instead of GENERATED ALWAYS AS"
    rationale: "Better compatibility across Postgres versions, allows NULL handling"
    alternatives: ["GENERATED ALWAYS AS"]
  - name: "Service functions for consent management"
    rationale: "Centralizes business logic, enforces authorization in database layer"
    alternatives: ["Client-side RLS only"]
  - name: "No direct RLS policies on parental_consent_tokens"
    rationale: "Tokens must only be accessed through verified service functions"
    alternatives: ["SELECT-only policy for own tokens"]
metrics:
  duration: "0 minutes (pre-completed)"
  completed: "2026-01-31"
---

# Phase 02 Plan 01: COPPA Database Schema Summary

**One-liner:** Complete COPPA compliance database schema with DOB tracking, account states, parental consent audit logging, and verification tokens.

## What Was Built

### Students Table Extensions

Nine new columns added to the `students` table:

| Column | Type | Purpose |
|--------|------|---------|
| `date_of_birth` | DATE | User's birthday for age calculation |
| `is_under_13` | BOOLEAN | Computed via trigger (DOB > 13 years ago) |
| `account_status` | TEXT | State machine: active, suspended_consent, suspended_deletion, deleted |
| `parent_email` | TEXT | Parent/guardian email for consent workflow |
| `consent_verified_at` | TIMESTAMPTZ | When parent verified consent |
| `consent_revoked_at` | TIMESTAMPTZ | When consent was revoked |
| `deletion_requested_at` | TIMESTAMPTZ | Soft delete request timestamp |
| `deletion_scheduled_at` | TIMESTAMPTZ | When hard delete will execute |
| `musical_nickname` | TEXT | Anonymous display name (auto-generated) |

### New Tables

**parental_consent_log** - Audit trail for all consent events:
- `student_id`, `parent_email`, `action` (requested/verified/revoked/expired)
- `ip_address`, `user_agent`, `metadata`, `created_at`
- RLS: Students read own, teachers read connected students

**parental_consent_tokens** - Email verification tokens:
- `student_id`, `token_hash`, `expires_at`, `used_at`
- RLS: No direct access (service functions only)

### Service Functions

Three SECURITY DEFINER functions for consent management:

1. **request_parental_consent(student_id, parent_email, token_hash, ...)** - Creates token, logs request, updates parent_email
2. **verify_parental_consent(student_id, token_hash, ...)** - Validates token, updates account to active, logs verification
3. **revoke_parental_consent(student_id, ...)** - Suspends account, logs revocation

All functions include authorization checks to prevent unauthorized access.

### Musical Nickname Generator

**generate_musical_nickname()** function returns random combinations:
- 20 adjectives: Happy, Jazzy, Groovy, Sparkly, Bouncy, etc.
- 20 nouns: Composer, Pianist, Melody, Harmony, Rhythm, etc.
- Auto-generated on student insert via trigger

### Indexes

Seven indexes for query performance:
- `idx_students_account_status` - Filter by account state
- `idx_students_deletion_scheduled` - Find deletion-scheduled accounts (partial)
- `idx_students_is_under_13` - Find under-13 users (partial)
- `idx_consent_tokens_student` - Token lookups by student
- `idx_consent_tokens_expires` - Find unexpired tokens (partial)
- `idx_consent_log_student` - Log lookups by student
- `idx_consent_log_created` - Time-based log queries

## Key Patterns Established

### Trigger-Based Computed Column

Instead of `GENERATED ALWAYS AS` (which has limitations), `is_under_13` is computed via a `BEFORE INSERT OR UPDATE` trigger:

```sql
IF NEW.date_of_birth IS NOT NULL THEN
  NEW.is_under_13 := NEW.date_of_birth > CURRENT_DATE - INTERVAL '13 years';
ELSE
  NEW.is_under_13 := false;
END IF;
```

This handles NULL DOB gracefully and works across Postgres versions.

### Service Functions with Authorization

All consent service functions verify authorization:

```sql
IF auth.uid() != p_student_id THEN
  RAISE EXCEPTION 'Unauthorized: Cannot request consent for another user';
END IF;
```

### Audit Logging Pattern

Every consent action is logged with:
- Actor (student_id)
- Action type (requested, verified, revoked, expired)
- Metadata (ip_address, user_agent)
- Timestamp

## Verification Results

| Check | Status |
|-------|--------|
| Migration file exists | Pass |
| 9 new columns on students | Pass |
| parental_consent_log table created | Pass |
| parental_consent_tokens table created | Pass |
| RLS enabled on 2 new tables | Pass |
| 7 indexes created | Pass |
| generate_musical_nickname function exists | Pass |

## Commits

| Hash | Message |
|------|---------|
| 84a295b | feat(02-02): add AgeGate component for COPPA-compliant DOB collection |

Note: The migration file was committed alongside the AgeGate component in plan 02-02. This was an unintended bundling but the work is complete and functional.

## Deviations from Plan

### Commit Bundling

**1. [Deviation] Migration committed with different plan**
- **Found during:** Execution verification
- **Issue:** The migration file was staged and committed as part of plan 02-02 commit (84a295b)
- **Impact:** No functional impact - the schema is in place and works correctly
- **Resolution:** Documented in 02-02-SUMMARY.md as deviation, creating this summary for completeness

## Integration Points

This schema supports:
- **Age Gate (02-02):** `date_of_birth` storage, `is_under_13` calculation
- **Signup Flow (02-03):** Account creation with consent workflow
- **Consent Email (02-04):** Token creation/verification functions
- **Account Suspension (02-05):** `account_status` state machine
- **Data Deletion (02-06):** `deletion_scheduled_at` for soft delete

## Next Steps

Plan 02-02 (already complete) adds the AgeGate UI component. Plan 02-03 will integrate age collection into the signup flow.
