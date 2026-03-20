# Phase 14: COPPA Hard Delete - Research

**Researched:** 2026-03-21
**Domain:** Supabase Edge Functions, Supabase Admin API, Lemon Squeezy cancellation, Brevo email, PostgreSQL hard delete
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**LS Subscription Handling**
- If the Lemon Squeezy cancel API call fails (timeout, 5xx, LS down), block deletion and retry on the next cron run — prevents orphan billing where parent is charged for a deleted account
- Only call the LS cancel API if `parent_subscriptions.status` is `active`, `on_trial`, or `paused` — skip already cancelled/expired subscriptions to save API calls and avoid LS errors
- If no `parent_subscriptions` row exists (free-tier user), treat as normal — no warning, proceed silently with data deletion

**Parent Confirmation Email**
- Warm & supportive tone — acknowledge the child's journey, thank them, mention they're welcome back
- Include: child's name, deletion date, summary of data categories removed, and a note that they can re-register anytime
- Use the same branded purple gradient header template as consent and weekly report emails (table-based layout for Outlook compatibility)
- If parent_email is null, proceed with deletion anyway — confirmation email is a courtesy, not a blocker; log that email wasn't sent
- CRITICAL ordering: Read parent email address from the students row BEFORE any data deletion begins

**Cron Schedule & Dry-Run**
- Run daily at 03:00 UTC during low-traffic hours (matches send-daily-push pattern)
- Dry-run mode via query parameter `?dry_run=true` — function logs what it would delete but touches no data; easy to test from Supabase dashboard
- Process all eligible accounts in one invocation (no batch size limit)

**Audit Trail**
- Log deletion events to both a persistent DB table and Edge Function console logs
- Create a new `account_deletion_log` table (not reuse parental_consent_log)
- Audit record fields: student ID as anonymized hash, deletion timestamp, data categories removed (list of table names), confirmation email status (sent/failed/skipped)
- Keep audit records indefinitely — no retention policy; COPPA audit records are lightweight (no PII)

### Claude's Discretion
- Deletion order across tables (CASCADE vs explicit per-table deletes)
- Exact Supabase admin API usage for auth.users removal
- Edge Function error handling and retry patterns
- Hash algorithm for student ID anonymization in audit log
- Exact HTML email template content (following warm & supportive guidelines)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEL-01 | Cron-triggered Edge Function identifies accounts past 30-day grace period | Query pattern from `accountDeletionService.js`; pg_cron manual schedule established for other functions |
| DEL-02 | Edge Function cascades deletion across all student data tables (scores, progress, goals, challenges, push subscriptions) | FK CASCADE on most tables confirmed in migration files; `dataExportService.js` table list is the starting point, three tables are missing |
| DEL-03 | Edge Function removes `auth.users` entry so credentials cannot be reused | Supabase `supabase.auth.admin.deleteUser()` pattern — service role required |
| DEL-04 | Edge Function cancels active Lemon Squeezy subscription before deletion (if exists) | `cancel-subscription/index.ts` LS API pattern directly reusable; status gate logic defined |
| DEL-05 | Parent receives confirmation email via Brevo after successful permanent deletion | `send-weekly-report` + `send-consent-email` Brevo pattern fully reusable; read email before deletion |
| DEL-06 | `parent_subscriptions` and `push_subscriptions` included in data deletion scope (verify FK cascade or explicit delete) | Both tables have `ON DELETE CASCADE` from their `students(id)` FK — confirmed in migration files |
| DEL-07 | Hard delete is idempotent — re-running on same account produces no errors | `deleted` account_status check; `auth.deleteUser` returns graceful error on missing user |
</phase_requirements>

---

## Summary

Phase 14 delivers the final piece of the COPPA compliance pipeline: a cron-triggered Supabase Edge Function that permanently removes accounts whose 30-day deletion grace period has expired. The existing codebase already contains every building block — a query pattern for eligible accounts (`accountDeletionService.js`), a Lemon Squeezy cancellation pattern (`cancel-subscription/index.ts`), a Brevo email pipeline (`send-weekly-report/index.ts`), and a cron auth pattern with `verify_jwt = false` + `x-cron-secret` header (used by both `send-daily-push` and `send-weekly-report`).

The implementation requires: (1) a new Edge Function `process-account-deletions` following the established structural template, (2) a new `account_deletion_log` migration for the audit table, and (3) a manual pg_cron schedule registration (following the documented pattern in the push subscriptions migration). The deletion scope covers 13 tables — `dataExportService.js` `STUDENT_DATA_TABLES` (10 entries) plus `parent_subscriptions`, `push_subscriptions`, and `student_daily_challenges` which were added after that file was written.

The most sensitive design decision delegated to Claude's discretion is deletion ordering: since `students` has `ON DELETE CASCADE` FK relationships to all child tables (confirmed in migration files), a single `DELETE FROM students WHERE id = $1` will cascade to all child data rows. Explicit per-table deletes are not required, but are acceptable if preferred for audit transparency. The `auth.users` entry must be deleted last via the Supabase admin API (`supabase.auth.admin.deleteUser(studentId)`) because the `students` table `id` column is the FK source.

**Primary recommendation:** Use the `send-weekly-report/index.ts` file as the structural template. Copy the cron-secret auth pattern, service role client init, Brevo send pattern, and per-item error isolation loop verbatim, then layer in the deletion-specific logic.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2 (2.99.3 installed) | Service role DB client + admin auth API | Already used in all Edge Functions via `https://esm.sh/@supabase/supabase-js@2` |
| Deno Web Crypto API | built-in | HMAC SHA-256 for student ID hashing | Already used in `send-weekly-report` for HMAC token generation; no extra import needed |
| Brevo SMTP API | v3 | Transactional email | Already wired; API key in env |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lemon Squeezy REST API | v1 | Cancel subscription | Only if `status` is `active`, `on_trial`, or `paused` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CASCADE delete via `students` row | Explicit per-table `DELETE` statements | CASCADE is simpler and guaranteed by DB schema; explicit deletes are more transparent for audit logging but redundant |
| HMAC-SHA256 hash for student ID | SHA-256 without key (plain hash) | HMAC adds a secret — harder for an adversary to probe "was X deleted?" without the key; preferred for COPPA audit records |

**Installation:** No new packages. All imports already present in existing Edge Functions.

---

## Architecture Patterns

### Recommended Project Structure
```
supabase/
├── functions/
│   └── process-account-deletions/
│       └── index.ts          # New Edge Function
├── migrations/
│   └── 20260321000001_account_deletion_log.sql  # New audit table
└── config.toml               # Add [functions.process-account-deletions] entry
```

### Pattern 1: Cron-Authenticated Edge Function (established)
**What:** Edge Function with `verify_jwt = false` in config.toml; authenticates via `x-cron-secret` header checked against `CRON_SECRET` env var.
**When to use:** All cron-triggered functions in this project.
**Example (from send-weekly-report/index.ts):**
```typescript
// verify_jwt = false in config.toml
const cronSecret = Deno.env.get('CRON_SECRET');
const incomingSecret = req.headers.get('x-cron-secret');
if (!cronSecret || incomingSecret !== cronSecret) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, ... });
}
```

### Pattern 2: Supabase Admin deleteUser
**What:** Delete an `auth.users` entry using the service role admin API. This is the only supported way to remove auth credentials from a server-side context.
**When to use:** After all public schema data rows have been deleted for a student.
**Example:**
```typescript
// Source: Supabase JS v2 admin API (supabase-js@2)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
const { error } = await supabase.auth.admin.deleteUser(studentId);
// If student is already gone (idempotent run): error.message contains "User not found"
// Treat "User not found" as success, not failure
```

### Pattern 3: Dry-Run Gate
**What:** Query parameter `?dry_run=true` short-circuits all mutating operations after logging what would happen.
**When to use:** Called explicitly for testing.
**Example:**
```typescript
const url = new URL(req.url);
const isDryRun = url.searchParams.get('dry_run') === 'true';

if (!isDryRun) {
  // perform actual deletion
  await supabase.from('students').delete().eq('id', studentId);
  await supabase.auth.admin.deleteUser(studentId);
} else {
  console.log(`[dry-run] would delete student ${studentId}`);
}
```

### Pattern 4: Student ID Anonymization via HMAC
**What:** Compute HMAC-SHA256(studentId, AUDIT_HMAC_SECRET) before writing to audit log. Allows proving "this ID was deleted" without storing the raw UUID in the audit record.
**When to use:** Audit log `student_id_hash` column.
**Example (from send-weekly-report HMAC pattern):**
```typescript
async function hashStudentId(studentId: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(studentId));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Pattern 5: Pre-Deletion Email Capture
**What:** Read `parent_email` from `students` row into a local variable before any `DELETE` statement executes. Once the `students` row is deleted, the email is gone.
**When to use:** Any function that needs to email after deletion.
**Example:**
```typescript
// Step 1: Capture all data needed post-deletion BEFORE touching the DB
const { data: student } = await supabase
  .from('students')
  .select('parent_email, first_name, deletion_scheduled_at')
  .eq('id', studentId)
  .single();
const parentEmail = student?.parent_email ?? null;   // captured in local var

// Step 2: Cancel LS subscription (if applicable)
// Step 3: Delete students row (CASCADE wipes child tables)
// Step 4: Delete auth.users entry
// Step 5: Send confirmation email using captured parentEmail
```

### Deletion Execution Order
The correct sequence within the per-student loop:

```
1. Capture student data (parent_email, first_name, deletion_scheduled_at)
2. Fetch parent_subscriptions row to check LS status
3. If LS status requires cancellation → call LS DELETE API
   - On LS failure: log + skip entire account (retry next run)
4. DELETE FROM students WHERE id = $studentId
   - CASCADE deletes: students_score, student_skill_progress, student_daily_goals,
     practice_sessions, student_achievements, assignment_submissions,
     parental_consent_log, parental_consent_tokens, student_point_transactions,
     user_accessories, push_subscriptions, student_daily_challenges,
     parent_subscriptions (all via ON DELETE CASCADE FK)
5. supabase.auth.admin.deleteUser(studentId)
   - "User not found" error → treat as success (idempotent)
6. Send Brevo confirmation email to parentEmail (if not null)
7. INSERT INTO account_deletion_log (...)
```

### Anti-Patterns to Avoid
- **Deleting auth.users before the students row:** auth.users deletion can succeed while the public data deletion fails, leaving orphan rows with no FK anchor. Always delete public data first.
- **Reading parent_email after deletion:** The `students` row is gone — the join data is gone. Capture before step 4.
- **Blocking on email failure:** Email send failure must never block the COPPA deletion. Log the failure and proceed.
- **Treating "User not found" from admin.deleteUser as a hard error:** This is the normal idempotent case where the function already ran successfully once.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth user deletion | Custom auth table manipulation | `supabase.auth.admin.deleteUser()` | Auth schema is managed by Supabase; direct table access is unsupported and may break auth internals |
| HMAC token generation | Custom crypto | `crypto.subtle` (Deno built-in) | Already used in send-weekly-report; Web Crypto API is available in all Deno environments |
| Brevo email send | Custom SMTP client | Brevo REST API via `fetch` | Established pattern in all existing email functions |
| LS subscription cancel | Custom LS API wrapper | Existing `cancel-subscription` pattern | Already tested, handles response parsing and error logging |
| Cron scheduling | Timer-based polling | pg_cron via Supabase SQL Editor (manual) | Established project pattern; cron jobs are registered manually per the push_subscriptions migration docs |

**Key insight:** Every sub-problem in this phase has an existing solved implementation in the codebase. The task is integration, not invention.

---

## Common Pitfalls

### Pitfall 1: parent_email Captured After Deletion
**What goes wrong:** The `students` row is deleted (along with its `parent_email` column) before the email address is saved. The confirmation email can't be sent.
**Why it happens:** Natural code flow — delete first, email second.
**How to avoid:** Explicitly query and store `parent_email` in a local `const` variable as step 1 of the per-student loop, before any `DELETE` statement.
**Warning signs:** `Cannot read properties of null (reading 'parent_email')` after the delete step.

### Pitfall 2: LS Cancel Called on Already-Cancelled Subscription
**What goes wrong:** Lemon Squeezy returns 4xx for a subscription that's already in `cancelled` or `expired` status. The function may treat this as a blocker and skip deletion.
**Why it happens:** Not filtering by status before calling the API.
**How to avoid:** Only call LS DELETE API when `parent_subscriptions.status` IN ('active', 'on_trial', 'paused'). Skip silently for other statuses.
**Warning signs:** LS API returning 422 or 404 on a subscription that has `status = 'cancelled'` in the DB.

### Pitfall 3: auth.deleteUser Failure Blocks the Loop
**What goes wrong:** If `admin.deleteUser()` throws for a user that was already deleted on a previous run, the function counts it as a failure and the audit log is never written.
**Why it happens:** Not distinguishing "user not found" from a real auth failure.
**How to avoid:** Check `error.message` for "User not found" — treat it as success. All other auth errors are real failures.

### Pitfall 4: account_deletion_log Cascades on Future Migration
**What goes wrong:** If `account_deletion_log` has a `student_id` FK referencing `students(id)`, Postgres CASCADE would delete the audit log when the student is deleted — defeating the purpose.
**Why it happens:** Copy-paste from other tables that reference `students`.
**How to avoid:** The `account_deletion_log` table must have NO FK to `students`. Store the raw student UUID alongside the hash only for the initial write. Once stored, the record is standalone.

### Pitfall 5: FK Cascade Assumption Without Verification
**What goes wrong:** Assuming all tables have CASCADE; in reality, a table added post-migration might use `ON DELETE RESTRICT` or `ON DELETE SET NULL`, causing the `students` delete to fail with a FK violation.
**Why it happens:** Not auditing the actual constraint type.
**How to avoid:** Per STATE.md, run `SELECT conname, confdeltype FROM pg_constraint WHERE confrelid = 'students'::regclass` in the Supabase SQL Editor before implementing. `confdeltype = 'c'` means CASCADE; `'a'` means NO ACTION (blocks delete).
**Warning signs:** `23503 foreign_key_violation` when attempting to delete a `students` row.

### Pitfall 6: dataExportService.js STUDENT_DATA_TABLES Is Incomplete
**What goes wrong:** Using `STUDENT_DATA_TABLES` directly as the deletion scope misses three tables added after that file was written.
**Why it happens:** `dataExportService.js` hasn't been updated since these tables were added.
**How to avoid:** Add to the deletion scope (not needed for explicit delete if CASCADE is confirmed, but needed for the audit log's "data categories removed" list):
  - `parent_subscriptions` (added in subscription phase)
  - `push_subscriptions` (added in 20260304000001)
  - `student_daily_challenges` (added in 20260317000001)
**Warning signs:** Parent subscription still active after student deletion; push_subscriptions orphan rows.

### Pitfall 7: Dry-Run Mode Omitted from Testing
**What goes wrong:** The only way to test is to delete real data, which is irreversible.
**Why it happens:** Dry-run not implemented.
**How to avoid:** Implement `?dry_run=true` as a first-class path that logs but does not execute any `DELETE`, LS cancel, or `deleteUser` call.

---

## Code Examples

Verified patterns from existing project sources:

### Supabase Admin deleteUser
```typescript
// supabase-js@2 — service role required
const { error } = await supabase.auth.admin.deleteUser(studentId);
if (error) {
  if (error.message?.includes('User not found')) {
    // Idempotent — already deleted on a previous run
    console.log(`process-account-deletions: auth user already gone for ${studentId}`);
  } else {
    throw error; // Real failure
  }
}
```

### LS Subscription Cancel (from cancel-subscription/index.ts)
```typescript
const LS_API_KEY = Deno.env.get('LS_API_KEY');
const lsResponse = await fetch(
  `https://api.lemonsqueezy.com/v1/subscriptions/${ls_subscription_id}`,
  {
    method: 'DELETE',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${LS_API_KEY}`,
    },
  }
);
if (!lsResponse.ok) {
  // Block this account's deletion; retry on next cron run
  throw new Error(`LS cancel failed: ${lsResponse.status}`);
}
```

### pg_cron Registration (manual, from push_subscriptions migration comments)
```sql
-- Run manually in Supabase SQL Editor:
SELECT cron.schedule(
  'process-account-deletions',
  '0 3 * * *',   -- 03:00 UTC daily
  $$SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/process-account-deletions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );$$
);
```

### config.toml Entry
```toml
[functions.process-account-deletions]
# Called by pg_cron (no Supabase JWT). Security enforced via x-cron-secret header check inside the function.
verify_jwt = false
```

### account_deletion_log Migration
```sql
CREATE TABLE IF NOT EXISTS account_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NO FK to students — audit record must survive student deletion
  student_id_hash TEXT NOT NULL,      -- HMAC-SHA256(student_id, AUDIT_HMAC_SECRET)
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_categories_removed TEXT[] NOT NULL,  -- e.g. ARRAY['students', 'students_score', ...]
  ls_subscription_cancelled BOOLEAN NOT NULL DEFAULT false,
  email_status TEXT NOT NULL,         -- 'sent' | 'failed' | 'skipped'
  dry_run BOOLEAN NOT NULL DEFAULT false
);

-- No RLS needed — only writable by Edge Function service role, never by authenticated users
-- No retention policy — COPPA audit records kept indefinitely
```

### Eligible Accounts Query (from accountDeletionService.js getAccountsReadyForDeletion pattern)
```typescript
const { data: eligibleAccounts, error } = await supabase
  .from('students')
  .select('id, parent_email, first_name, deletion_scheduled_at')
  .eq('account_status', 'suspended_deletion')
  .lt('deletion_scheduled_at', new Date().toISOString());
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual/ad-hoc deletion | Cron-triggered Edge Function | Phase 14 (this phase) | Automated, auditable, COPPA-compliant |
| `dataExportService.js` as deletion table list | Extended list (+3 tables) | Phase 14 (this phase) | Complete data removal |

**Deprecated/outdated:**
- `dataExportService.js` STUDENT_DATA_TABLES: Missing `parent_subscriptions`, `push_subscriptions`, `student_daily_challenges`. The deletion scope in the Edge Function must use an extended list — do not import from this client-side file.

---

## Open Questions

1. **FK cascade coverage for `parent_subscriptions`**
   - What we know: The migration file `20260317000001_daily_challenges.sql` shows `student_daily_challenges` uses `ON DELETE CASCADE`. The `push_subscriptions` migration (20260304000001) also uses `ON DELETE CASCADE`.
   - What's unclear: `parent_subscriptions` FK constraint type has not been confirmed from migration files in this research session — it was not found in the scanned migrations (the subscription schema may be part of the remote schema migration `20250623204325_remote_schema.sql`).
   - Recommendation: Run `SELECT conname, confdeltype FROM pg_constraint WHERE confrelid = 'students'::regclass` in the Supabase SQL Editor as the first step of Wave 0 implementation. If `confdeltype != 'c'` for any table, add an explicit `DELETE FROM <table> WHERE student_id = $1` before the `students` row deletion.

2. **AUDIT_HMAC_SECRET environment variable**
   - What we know: `WEEKLY_REPORT_HMAC_SECRET` is already in the Edge Function env. The audit log will need its own secret or can reuse an existing one.
   - What's unclear: Whether to create a new `AUDIT_HMAC_SECRET` env var or reuse `CRON_SECRET` as the HMAC key for student ID hashing.
   - Recommendation: Use a dedicated `AUDIT_HMAC_SECRET` — allows independent rotation without affecting cron auth. Document in the migration's manual setup notes.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (globals: true) |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run src/services/accountDeletionService.test.js` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

Edge Functions cannot be unit-tested with Vitest (Deno runtime). Validation for this phase is done via:
1. **Dry-run mode** against a seeded test account with `deletion_scheduled_at` in the past (manual test, callable from Supabase dashboard)
2. **Live mode** against a test account (manual, destructive test)
3. **Idempotency check** — run live mode twice on the same account (manual)

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEL-01 | Eligible accounts query returns accounts past grace period | manual (dry-run) | N/A — Edge Function test | N/A |
| DEL-02 | All student data rows removed after deletion | manual (live mode + DB inspect) | N/A | N/A |
| DEL-03 | auth.users entry gone after deletion | manual (attempt login after deletion) | N/A | N/A |
| DEL-04 | LS subscription cancelled before data deletion | manual (check LS dashboard) | N/A | N/A |
| DEL-05 | Parent receives confirmation email | manual (check Brevo sent log) | N/A | N/A |
| DEL-06 | parent_subscriptions + push_subscriptions deleted | manual (DB inspect after deletion) | N/A | N/A |
| DEL-07 | Idempotent — second run produces no errors | manual (run function twice) | N/A | N/A |

The 5 success criteria from the phase definition map directly to these manual test steps and serve as the pass/fail spec for verification.

### Sampling Rate
- **Per task commit:** No automated tests — use dry-run mode for each code change
- **Per wave merge:** Full dry-run + live test against dedicated test account
- **Phase gate:** All 5 success criteria from phase description pass before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Test account setup: Create a student row with `account_status = 'suspended_deletion'` and `deletion_scheduled_at` in the past (seeded manually in Supabase)
- [ ] Verify `AUDIT_HMAC_SECRET` is defined in Supabase Vault before the Edge Function is deployed

---

## Sources

### Primary (HIGH confidence)
- `supabase/functions/send-weekly-report/index.ts` — Cron auth pattern, Brevo send pattern, per-item error isolation, no-PII log discipline
- `supabase/functions/cancel-subscription/index.ts` — Lemon Squeezy DELETE API pattern, LS_API_KEY usage
- `supabase/functions/send-consent-email/index.ts` — Branded HTML email template structure, Brevo payload format
- `supabase/migrations/20260201000001_coppa_schema.sql` — `account_status` enum values, `deletion_scheduled_at` column, FK relationships
- `supabase/migrations/20260304000001_add_push_subscriptions.sql` — `push_subscriptions` FK cascade confirmation, pg_cron manual registration pattern
- `supabase/migrations/20260317000001_daily_challenges.sql` — `student_daily_challenges` FK cascade confirmation
- `supabase/config.toml` — `verify_jwt = false` pattern for cron functions, existing function configs
- `src/services/accountDeletionService.js` — `getAccountsReadyForDeletion()` query pattern, `GRACE_PERIOD_DAYS` constant
- `src/services/dataExportService.js` — `STUDENT_DATA_TABLES` as deletion scope starting point; identifies the 3 missing tables

### Secondary (MEDIUM confidence)
- Supabase JS v2 admin API: `supabase.auth.admin.deleteUser(userId)` — confirmed available in supabase-js@2 (2.99.3 installed). "User not found" error behavior for idempotency is standard Supabase admin API behavior.
- pg_cron `net.http_post` scheduling: Pattern confirmed in migration comments for both `send-daily-push` and `send-weekly-report` jobs.

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already used in the codebase
- Architecture: HIGH — deletion patterns derived from existing Edge Functions and migrations
- Pitfalls: HIGH — derived from code-reading and explicit STATE.md pre-check notes
- FK cascade for parent_subscriptions: MEDIUM — must be confirmed at implementation start

**Research date:** 2026-03-21
**Valid until:** 2026-04-22 (COPPA deadline) — all findings based on stable project code
