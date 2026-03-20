# Phase 14: COPPA Hard Delete - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy a cron-triggered Edge Function that permanently deletes accounts past their 30-day deletion grace period. The function must remove all student data rows, cancel active Lemon Squeezy subscriptions, delete the auth.users entry, send a parent confirmation email, and log an audit record. Must meet the April 22, 2026 COPPA deadline.

</domain>

<decisions>
## Implementation Decisions

### LS Subscription Handling
- If the Lemon Squeezy cancel API call fails (timeout, 5xx, LS down), **block deletion and retry on the next cron run** — prevents orphan billing where parent is charged for a deleted account
- Only call the LS cancel API if `parent_subscriptions.status` is `active`, `on_trial`, or `paused` — skip already cancelled/expired subscriptions to save API calls and avoid LS errors
- If no `parent_subscriptions` row exists (free-tier user), treat as normal — no warning, proceed silently with data deletion

### Parent Confirmation Email
- **Warm & supportive tone** — acknowledge the child's journey, thank them, mention they're welcome back
- Include: child's name, deletion date, summary of data categories removed, and a note that they can re-register anytime
- Use the **same branded purple gradient header template** as consent and weekly report emails (table-based layout for Outlook compatibility)
- If parent_email is null, **proceed with deletion anyway** — confirmation email is a courtesy, not a blocker; log that email wasn't sent
- **CRITICAL ordering:** Read parent email address from the students row BEFORE any data deletion begins

### Cron Schedule & Dry-Run
- Run **daily at 03:00 UTC** during low-traffic hours (matches send-daily-push pattern)
- Dry-run mode via **query parameter `?dry_run=true`** — function logs what it would delete but touches no data; easy to test from Supabase dashboard
- Process **all eligible accounts** in one invocation (no batch size limit) — with <100 users currently, batching adds complexity for no benefit

### Audit Trail
- Log deletion events to **both** a persistent DB table and Edge Function console logs
- Create a new **`account_deletion_log`** table (not reuse parental_consent_log — different schema, cleaner separation)
- Audit record fields:
  - Student ID as **anonymized hash** (can't identify someone, but can prove deletion if queried with original ID)
  - Deletion timestamp
  - Data categories removed (list of table names)
  - Confirmation email status (sent/failed/skipped)
- **Keep audit records indefinitely** — no retention policy; COPPA audit records are lightweight (no PII), negligible storage cost

### Claude's Discretion
- Deletion order across tables (CASCADE vs explicit per-table deletes)
- Exact Supabase admin API usage for auth.users removal
- Edge Function error handling and retry patterns
- Hash algorithm for student ID anonymization in audit log
- Exact HTML email template content (following warm & supportive guidelines)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### COPPA & Deletion Infrastructure
- `supabase/migrations/20260201000001_coppa_schema.sql` — Account status enum, deletion_scheduled_at/deletion_requested_at columns, indexes, consent functions
- `src/services/accountDeletionService.js` — Soft-delete flow (request, cancel, status check); hard delete is the missing piece this phase delivers
- `src/services/dataExportService.js` — STUDENT_DATA_TABLES list (NOTE: missing parent_subscriptions, push_subscriptions, student_daily_challenges — must be included in deletion scope)
- `.planning/milestones/v1.0-phases/02-coppa-compliance/02-CONTEXT.md` — Original COPPA decisions (30-day grace, soft delete pattern)

### Existing Edge Function Patterns
- `supabase/functions/send-weekly-report/index.ts` — Cron-triggered function with CRON_SECRET auth, Brevo email, HMAC tokens, service_role DB access
- `supabase/functions/send-consent-email/index.ts` — Branded HTML email template, CORS headers, Brevo API integration
- `supabase/functions/cancel-subscription/index.ts` — Lemon Squeezy cancel API pattern (fetch ls_subscription_id, call DELETE endpoint)

### Subscription Schema
- `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` — Subscription status values and webhook handling

### Requirements
- `.planning/REQUIREMENTS.md` — DEL-01 through DEL-07 define acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cancel-subscription/index.ts`: Lemon Squeezy cancel pattern (JWT auth, fetch ls_subscription_id, DELETE to LS API) — reuse the LS API call logic
- `send-weekly-report/index.ts`: Cron-triggered Edge Function pattern (CRON_SECRET verification, service_role client, Brevo email with branded HTML) — use as structural template
- `send-consent-email/index.ts`: Branded HTML email generator with table-based Outlook-compatible layout — reuse template structure
- `accountDeletionService.js`: `getAccountsReadyForDeletion()` reference implementation — shows the query pattern (account_status = 'suspended_deletion' AND deletion_scheduled_at < NOW())
- `dataExportService.js`: `STUDENT_DATA_TABLES` array — use as starting point for deletion scope, but add missing tables

### Established Patterns
- Edge Functions authenticate cron via `x-cron-secret` header (not JWT) with `verify_jwt = false` in config.toml
- Service role client for DB operations that bypass RLS
- Brevo API for transactional emails with branded HTML template
- CORS headers pattern (ALLOWED_ORIGINS array)
- No PII in logs — student IDs only

### Integration Points
- `students` table: `account_status`, `deletion_scheduled_at` columns drive the query
- `parent_subscriptions` table: `ls_subscription_id`, `status` for LS cancel logic
- `push_subscriptions` table: Must be deleted (contains student_id FK)
- `student_daily_challenges` table: Must be deleted (new in v2.3, not in STUDENT_DATA_TABLES)
- `auth.users`: Supabase Admin API to delete auth entry (admin.deleteUser)
- `config.toml`: Needs new function entry with `verify_jwt = false`
- Supabase cron (pg_cron or external): Schedule daily 03:00 UTC invocation

</code_context>

<specifics>
## Specific Ideas

- STATE.md pre-check: Run `SELECT conname, confdeltype FROM pg_constraint WHERE confrelid = 'students'::regclass` to confirm FK cascade status before implementation
- STATE.md note: Brevo parent email must be read and stored in a local variable BEFORE any row deletion begins
- Warm email tone: "Thank you for being part of PianoMaster. [Child]'s musical journey with us has come to an end..." style
- Re-registration invitation: "If [child] ever wants to start a new musical adventure, you're always welcome back"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-coppa-hard-delete*
*Context gathered: 2026-03-20*
