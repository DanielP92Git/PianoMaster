---
phase: 14-coppa-hard-delete
plan: 01
subsystem: supabase-edge-functions
tags: [coppa, deletion, edge-function, audit, lemon-squeezy, brevo, cron]
dependency_graph:
  requires:
    - supabase/migrations/20260201000001_coppa_schema.sql
    - supabase/functions/send-weekly-report/index.ts
    - supabase/functions/cancel-subscription/index.ts
  provides:
    - supabase/functions/process-account-deletions/index.ts
    - supabase/migrations/20260321000001_account_deletion_log.sql
  affects:
    - supabase/config.toml
tech_stack:
  added:
    - AUDIT_HMAC_SECRET env var (new requirement for account deletion audit trail)
  patterns:
    - cron-secret auth (verify_jwt=false, x-cron-secret header)
    - service-role CASCADE delete via students table
    - HMAC-SHA256 student ID hashing for audit privacy
    - per-item error isolation with LS-failure-blocks-deletion semantics
key_files:
  created:
    - supabase/migrations/20260321000001_account_deletion_log.sql
    - supabase/functions/process-account-deletions/index.ts
  modified:
    - supabase/config.toml
decisions:
  - "CASCADE delete via students table row removal (not per-table explicit deletes) — simpler, relies on existing FK cascade constraints"
  - "AUDIT_HMAC_SECRET is a separate env var from WEEKLY_REPORT_HMAC_SECRET — different audit contexts, independent rotation"
  - "LS cancel failure blocks that account's deletion and increments failed counter — orphan billing prevention takes priority over deletion speed"
  - "Email failure does not block deletion — confirmation is a courtesy, data is already gone"
  - "auth.deleteUser 'User not found' treated as success — idempotent re-run safety"
  - "parent_email read from initial query before any deletion begins — prevents null email after CASCADE"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 14 Plan 01: COPPA Hard-Delete Edge Function Summary

**One-liner:** Cron-triggered Edge Function performing permanent COPPA hard delete with LS cancel, CASCADE delete, auth removal, Brevo confirmation email, and HMAC-hashed audit log.

## What Was Built

### Migration: `account_deletion_log`
New audit table for permanent deletion records. No FK to `students` (audit records survive deletion). Student IDs stored as HMAC-SHA256 hashes. Fields: `student_id_hash`, `deleted_at`, `data_categories_removed`, `ls_subscription_cancelled`, `email_status`, `dry_run`. Email status constrained to `('sent', 'failed', 'skipped')`.

### Edge Function: `process-account-deletions` (530 lines)
Daily 03:00 UTC cron function implementing the full COPPA hard-delete pipeline:

1. **Auth**: `x-cron-secret` header verified against `CRON_SECRET` env var (same pattern as `send-daily-push`, `send-weekly-report`)
2. **Query**: `students` where `account_status = 'suspended_deletion' AND deletion_scheduled_at < NOW()`; captures `parent_email` and `first_name` from the initial query before any deletions
3. **Dry-run**: `?dry_run=true` query parameter — logs and writes audit records but makes no data changes
4. **LS cancel**: Only calls LS cancel API if subscription status is `active`, `on_trial`, or `paused`; LS failure blocks that account's deletion (retry on next cron run)
5. **CASCADE delete**: `supabase.from('students').delete().eq('id', studentId)` — removes all 14 child table categories via FK cascade
6. **Auth removal**: `supabase.auth.admin.deleteUser(studentId)` — `"User not found"` treated as success (idempotent)
7. **Brevo email**: Branded purple gradient confirmation email with data categories list; email failure does not block deletion
8. **Audit**: HMAC-SHA256 hashed student ID inserted into `account_deletion_log`
9. **Return**: `{ deleted, failed, skipped, dryRun, total }`

### config.toml Entry
```toml
[functions.process-account-deletions]
# Called by pg_cron (no Supabase JWT). Security enforced via x-cron-secret header check inside the function.
verify_jwt = false
```

## Requirements Satisfied

| Req | Description | Status |
|-----|-------------|--------|
| DEL-01 | Queries eligible accounts (status + date check) | Done |
| DEL-02 | CASCADE delete via students row removal | Done |
| DEL-03 | admin.deleteUser for auth.users | Done |
| DEL-04 | LS cancel before deletion (blocks on failure) | Done |
| DEL-05 | Brevo confirmation email to parent | Done |
| DEL-06 | parent_subscriptions + push_subscriptions in scope (CASCADE) | Done |
| DEL-07 | Idempotent (User not found = success, re-run safe) | Done |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `70ebf49` | feat(14-01): add account deletion audit log migration and Edge Function config |
| Task 2 | `a66f435` | feat(14-01): implement process-account-deletions Edge Function |

## Self-Check: PASSED

- `supabase/migrations/20260321000001_account_deletion_log.sql` — FOUND
- `supabase/functions/process-account-deletions/index.ts` — FOUND (530 lines)
- `supabase/config.toml` contains `[functions.process-account-deletions]` — FOUND
- Commits `70ebf49` and `a66f435` — FOUND in git log
- `npm run build` — PASSED (no client-side code touched)

## Next Steps (Plan 02)

Plan 02 will register the pg_cron schedule for daily 03:00 UTC invocation and verify the complete deletion pipeline end-to-end.
