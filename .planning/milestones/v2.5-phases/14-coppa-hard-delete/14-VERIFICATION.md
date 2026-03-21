---
phase: 14-coppa-hard-delete
verified: 2026-03-21T00:00:00Z
status: human_needed
score: 9/9 must-haves verified
human_verification:
  - test: "Deployed Edge Function callable at production URL"
    expected: "curl POST with correct x-cron-secret returns 200 with JSON summary"
    why_human: "Cannot verify Supabase deployment state programmatically from local codebase"
  - test: "pg_cron schedule registered"
    expected: "SELECT jobname, schedule FROM cron.job WHERE jobname = 'process-account-deletions' returns one row with '0 3 * * *'"
    why_human: "pg_cron state lives in production Supabase — not verifiable from local files"
  - test: "account_deletion_log table exists in production"
    expected: "SELECT to_regclass('public.account_deletion_log') returns non-null"
    why_human: "Migration file exists locally; whether it has been applied to production requires DB access"
  - test: "AUDIT_HMAC_SECRET is set in Supabase Edge Function secrets"
    expected: "Edge Function can read AUDIT_HMAC_SECRET from Deno.env — if missing, function returns 500"
    why_human: "Env secrets are not stored in the repository; can only verify via dashboard or function invocation"
  - test: "Live mode deletes all child table rows via CASCADE"
    expected: "After live invocation, queries on students_score, student_skill_progress, parent_subscriptions, push_subscriptions, student_daily_challenges for the deleted student_id all return 0 rows"
    why_human: "CASCADE behavior depends on production FK constraints confirmed applied; DEL-06 specifically requires verifying the cascade actually fires"
  - test: "Parent confirmation email is sent after successful live deletion"
    expected: "Brevo activity log (app.brevo.com) shows email with subject 'Account Deletion Confirmation - PianoMaster' sent to the test account's parent_email"
    why_human: "External email delivery cannot be verified from codebase; DEL-05 requires real Brevo API call"
---

# Phase 14: COPPA Hard-Delete Verification Report

**Phase Goal:** Deploy cron-triggered Edge Function that permanently deletes accounts past their 30-day grace period
**Verified:** 2026-03-21
**Status:** human_needed — all automated checks pass; 6 items require human verification against deployed infrastructure
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Accounts with `account_status='suspended_deletion'` AND `deletion_scheduled_at < NOW()` are identified by the Edge Function | VERIFIED | Lines 311-314: `.eq('account_status', 'suspended_deletion').lt('deletion_scheduled_at', new Date().toISOString())` — exact query present |
| 2 | All student data rows are removed via CASCADE delete on the students row | VERIFIED | Lines 397-400: `supabase.from('students').delete().eq('id', studentId)` — CASCADE confirmed by FK migrations: all 13 child tables have `REFERENCES students(id) ON DELETE CASCADE` |
| 3 | auth.users entry is deleted via `supabase.auth.admin.deleteUser` after public data deletion | VERIFIED | Line 412: `const { error: authError } = await supabase.auth.admin.deleteUser(studentId)` — present and wired |
| 4 | Active Lemon Squeezy subscriptions are cancelled before data deletion; LS failure blocks that account's deletion | VERIFIED | Lines 364-385: status gate `['active', 'on_trial', 'paused'].includes(subscription.status)` + `if (!lsResponse.ok) { failed++; continue; }` — blocks deletion on failure |
| 5 | Parent receives a branded confirmation email via Brevo after successful deletion | VERIFIED | Lines 442-455: POST to `https://api.brevo.com/v3/smtp/email` with purple gradient HTML template (`linear-gradient(135deg, #6366f1`) — wired and substantive |
| 6 | `parent_subscriptions` and `push_subscriptions` are included in deletion scope (via CASCADE) | VERIFIED | Both tables confirmed `REFERENCES students(id) ON DELETE CASCADE` in migrations 20260201000001 (line 96) and 20260304000001 (line 18); also listed in `DATA_CATEGORIES_REMOVED` array |
| 7 | Re-running the function on an already-deleted account produces no errors | VERIFIED | Line 414: `if (authError.message?.includes('User not found'))` treated as success; deleted student no longer appears in eligible accounts query (idempotent by design) |
| 8 | Dry-run mode logs what would be deleted without touching any data | VERIFIED | Lines 342-355: `if (isDryRun)` gate inside loop writes audit record with `dry_run: true` and calls `continue` — skips all deletion steps |
| 9 | An audit record is written to `account_deletion_log` with HMAC-hashed student ID | VERIFIED | Lines 488-495: `hashStudentId(studentId, AUDIT_HMAC_SECRET)` + `supabase.from('account_deletion_log').insert(...)` — HMAC pattern uses `crypto.subtle` SHA-256 |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260321000001_account_deletion_log.sql` | Audit table with no FK to students | VERIFIED | 29 lines, contains `CREATE TABLE IF NOT EXISTS account_deletion_log`, `student_id_hash TEXT NOT NULL`, `email_status IN ('sent', 'failed', 'skipped')` constraint, zero `REFERENCES students` occurrences |
| `supabase/config.toml` | Function config entry with `verify_jwt = false` | VERIFIED | Lines 335-337: `[functions.process-account-deletions]` followed immediately by `verify_jwt = false` |
| `supabase/functions/process-account-deletions/index.ts` | Cron-triggered Edge Function (>200 lines) | VERIFIED | 530 lines, `Deno.serve` export present, complete pipeline implemented |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `process-account-deletions/index.ts` | `students` table (eligible query) | `.eq('account_status', 'suspended_deletion').lt('deletion_scheduled_at', ...)` | WIRED | Pattern `suspended_deletion` appears 2 times; query also selects `parent_email, first_name` before deletion |
| `process-account-deletions/index.ts` | Lemon Squeezy API | `fetch DELETE https://api.lemonsqueezy.com/v1/subscriptions/{id}` | WIRED | `api.lemonsqueezy.com` appears 1 time at line 367; uses `Bearer ${LS_API_KEY}` auth |
| `process-account-deletions/index.ts` | Brevo API | `fetch POST https://api.brevo.com/v3/smtp/email` | WIRED | `api.brevo.com` appears 1 time at line 442; response handling sets `emailStatus` to `sent`/`failed` |
| `process-account-deletions/index.ts` | `auth.users` | `supabase.auth.admin.deleteUser(studentId)` | WIRED | `admin.deleteUser` appears 1 time at line 412; error handling distinguishes "User not found" from real errors |
| `process-account-deletions/index.ts` | `account_deletion_log` | `supabase.from('account_deletion_log').insert(...)` | WIRED | Referenced 3 times: dry-run insert (line 346), live insert (line 489), no FK to students (confirmed) |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DEL-01 | 14-01-PLAN.md | Cron-triggered Edge Function identifies accounts past 30-day grace period | SATISFIED | Query at lines 310-314 with `account_status='suspended_deletion'` AND `deletion_scheduled_at < NOW()` |
| DEL-02 | 14-01-PLAN.md | CASCADE deletion across all student data tables | SATISFIED | `students.delete().eq('id', studentId)` at lines 397-400; 13 child tables confirmed with `ON DELETE CASCADE` in migrations |
| DEL-03 | 14-01-PLAN.md | Removes `auth.users` entry so credentials cannot be reused | SATISFIED | `supabase.auth.admin.deleteUser(studentId)` at line 412 |
| DEL-04 | 14-01-PLAN.md | Cancels active Lemon Squeezy subscription before deletion (blocks on failure) | SATISFIED | Status gate + `!lsResponse.ok` block at lines 364-385 |
| DEL-05 | 14-01-PLAN.md | Parent receives confirmation email via Brevo after successful deletion | SATISFIED (code-level) | Brevo POST at line 442; email failure does not block deletion per design |
| DEL-06 | 14-01-PLAN.md | `parent_subscriptions` and `push_subscriptions` included in deletion scope | SATISFIED | Both tables have `REFERENCES students(id) ON DELETE CASCADE`; both in `DATA_CATEGORIES_REMOVED` |
| DEL-07 | 14-01-PLAN.md | Hard delete is idempotent | SATISFIED | "User not found" treated as success (line 414); already-deleted account absent from eligible query |

All 7 DEL requirements are satisfied at the code level. DEL-01 through DEL-07 are all claimed by `14-01-PLAN.md`. No orphaned requirements found — REQUIREMENTS.md maps DEL-01 through DEL-07 exclusively to Phase 14 (lines 86-92).

---

### Anti-Patterns Found

No anti-patterns detected.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TODOs, FIXMEs, stubs, placeholder returns, or console-log-only implementations found | — | — |

Notable observations (informational):
- The dry-run detection flag (`isDryRun`) is set at line 296 but the eligible accounts query still executes; dry-run blocking happens per-account inside the loop (line 342). This is intentional and correct — the function needs to know the total count to include in the summary response.
- Email failure does not block deletion (by design per `14-CONTEXT.md` decisions). This is documented at line 480 with a comment.
- `VALIDATION.md` was left with `nyquist_compliant: false` and `wave_0_complete: false` in frontmatter — these are planning artifacts that were not updated post-execution, not a code issue.

---

### Human Verification Required

#### 1. Edge Function Deployment Reachable

**Test:** Call the deployed function with a valid `x-cron-secret`:
```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/process-account-deletions?dry_run=true" \
  -H "x-cron-secret: <your-cron-secret>" \
  -H "Content-Type: application/json"
```
**Expected:** HTTP 200 with `{"deleted":0,"failed":0,"skipped":0,"dryRun":true,"total":0}` (assuming no eligible accounts)
**Why human:** Supabase deployment state is not verifiable from the local codebase.

#### 2. pg_cron Schedule Registered

**Test:** In Supabase SQL Editor:
```sql
SELECT jobname, schedule FROM cron.job WHERE jobname = 'process-account-deletions';
```
**Expected:** One row with `schedule = '0 3 * * *'`
**Why human:** pg_cron job registry is in the production database, not verifiable locally.

#### 3. account_deletion_log Table Applied in Production

**Test:** In Supabase SQL Editor:
```sql
SELECT to_regclass('public.account_deletion_log');
```
**Expected:** Returns `account_deletion_log` (non-null)
**Why human:** Migration file exists locally but whether it has been applied to production requires DB access.

#### 4. AUDIT_HMAC_SECRET Set in Supabase Secrets

**Test:** Invoke the function without the secret set and confirm it returns 500, OR verify in Supabase Dashboard under Settings > Edge Functions > Secrets.
**Expected:** `AUDIT_HMAC_SECRET` is present; invoking the function with a valid cron secret does not return a 500 "Server configuration error"
**Why human:** Env secrets are not stored in the repository.

#### 5. Live Mode CASCADE Actually Fires for All 13 Child Tables

**Test:** After a live invocation against a test account, query:
```sql
SELECT count(*) FROM parent_subscriptions WHERE student_id = '<deleted-id>';
SELECT count(*) FROM push_subscriptions WHERE student_id = '<deleted-id>';
SELECT count(*) FROM student_daily_challenges WHERE student_id = '<deleted-id>';
```
**Expected:** All return 0
**Why human:** CASCADE behavior is confirmed by migration FK definitions, but actual production behavior (whether FK constraints were applied without errors) requires a live test.

#### 6. Parent Confirmation Email Delivered

**Test:** After a live invocation against a test account that has a `parent_email`, check Brevo transactional log (app.brevo.com > Transactional > Logs) for an email with subject `Account Deletion Confirmation - PianoMaster`.
**Expected:** Email present in Brevo logs; `email_status = 'sent'` in `account_deletion_log` for that account
**Why human:** External email delivery to Brevo API is an external side-effect that cannot be verified from the codebase.

---

### Gaps Summary

No gaps. All code-level must-haves are fully satisfied:
- The Edge Function (`process-account-deletions/index.ts`) is 530 lines, substantive, and wired to all required external systems.
- The migration (`20260321000001_account_deletion_log.sql`) creates the correct table with no FK to students and the proper email_status constraint.
- `config.toml` has the function entry with `verify_jwt = false`.
- All 7 DEL requirements are implemented correctly.
- Commits `70ebf49` and `a66f435` confirmed in git log.

The 6 human verification items are deployment-state checks that require production infrastructure access, not code gaps. The SUMMARY.md for Plan 02 claims all 5 E2E criteria passed — these should be re-confirmed against the running deployment if there is any doubt about the production state.

---

_Verified: 2026-03-21_
_Verifier: Claude (gsd-verifier)_
