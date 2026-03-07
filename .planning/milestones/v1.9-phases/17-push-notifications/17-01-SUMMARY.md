---
phase: 17-push-notifications
plan: "01"
subsystem: infra
tags: [supabase, edge-functions, web-push, vapid, pg-cron, rls, deno, typescript]

# Dependency graph
requires:
  - phase: 13-monetization-backend
    provides: Edge Function patterns (service role client, verify_jwt = false, header-based auth)
  - phase: 16-lemon-squeezy-integration
    provides: config.toml function block patterns (create-checkout, cancel-subscription)
provides:
  - push_subscriptions table with COPPA-ready schema (parent_consent_granted, parent_consent_at)
  - RLS policies for student own-row access; service_role bypasses for Edge Function writes
  - send-daily-push Edge Function with VAPID Web Push, priority-based message selection
  - pg_cron invocation documentation (manual setup SQL in migration comments)
affects: [17-02-client-side, 18-streak-mechanics, future-notification-features]

# Tech tracking
tech-stack:
  added:
    - "@negrel/webpush (jsr:@negrel/webpush) — Deno-native VAPID Web Push sender"
  patterns:
    - "Edge Function with x-cron-secret header authentication (pg_cron pattern)"
    - "Supabase join in select() to pull related table data in single round-trip"
    - "Per-student error isolation in send loop (one failure doesn't stop others)"
    - "XP_THRESHOLDS array replicated server-side to avoid client/server drift"

key-files:
  created:
    - supabase/migrations/20260304000001_add_push_subscriptions.sql
    - supabase/functions/send-daily-push/index.ts
  modified:
    - supabase/config.toml

key-decisions:
  - "verify_jwt = false for send-daily-push; security via x-cron-secret header checked inside function — pg_cron sends no JWT"
  - "Single Edge Function file (no lib/ subdirectory) — logic is linear and straightforward, splitting would add indirection without benefit"
  - "UNIQUE constraint on student_id in push_subscriptions — one subscription per student; update row rather than insert on re-subscribe"
  - "last_notified_at checked as date string split on T[0] — avoids timezone edge cases in UTC comparison"
  - "Partial index WHERE is_enabled = true — Edge Function query only touches eligible rows, not full table scan"
  - "parent_consent_at stored as TIMESTAMPTZ — audit trail for COPPA compliance; Plan 02 writes this on math problem solve"
  - "Expired subscription (410 Gone) sets subscription = null AND is_enabled = false — prevents retry loop; client must re-subscribe"

patterns-established:
  - "pg_cron -> Edge Function auth: x-cron-secret header with CRON_SECRET env var, documented setup in Vault"
  - "Per-student loop with isolated try/catch: one student failure logs and increments failed count, loop continues"
  - "selectNotification() pure function: priority-ordered conditionals with random variant selection per tier"

requirements-completed: [NOTIF-03, NOTIF-04]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 17 Plan 01: Push Notifications Backend Summary

**push_subscriptions table with COPPA consent schema and send-daily-push Edge Function using @negrel/webpush with priority-based message selection (streak > XP > goals > generic)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T11:25:22Z
- **Completed:** 2026-03-04T11:27:44Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `push_subscriptions` table with all required columns: student_id (UNIQUE FK), subscription JSONB, is_enabled, parent_consent_granted, parent_consent_at, last_notified_at, created_at, updated_at. RLS enables student own-row CRUD; service_role bypasses for Edge Function writes (last_notified_at updates and expired subscription cleanup).
- Created `send-daily-push` Edge Function: authenticates via x-cron-secret header, queries enabled subscriptions joined with students XP data, skips students who practiced today or were already notified, gathers streak/XP/goals context, selects priority-ordered message with child-friendly emoji variants, sends via @negrel/webpush, handles 410 Gone by disabling expired subscriptions.
- Added `[functions.send-daily-push]` block to config.toml with `verify_jwt = false` and documented the full pg_cron setup SQL as a manual step in the migration comments (including Vault secret storage instructions).

## Task Commits

Each task was committed atomically:

1. **Task 1: push_subscriptions migration and config.toml entry** - `329642d` (feat)
2. **Task 2: send-daily-push Edge Function** - `253f092` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `supabase/migrations/20260304000001_add_push_subscriptions.sql` - push_subscriptions table, RLS policies, partial index, updated_at trigger, pg_cron setup documentation
- `supabase/functions/send-daily-push/index.ts` - Daily push notification Edge Function (cron auth, VAPID init, eligible student query, practiced-today skip, context gathering, priority message selection, Web Push send, 410 cleanup)
- `supabase/config.toml` - Added [functions.send-daily-push] with verify_jwt = false

## Decisions Made

- `verify_jwt = false` for send-daily-push since pg_cron invocations carry no Supabase JWT; security is enforced via the shared `x-cron-secret` header matched against the CRON_SECRET environment variable.
- Single-file Edge Function (no lib/ subdirectory): the send loop and selectNotification() are linear enough that splitting would add indirection without benefit.
- UNIQUE constraint on student_id: one push subscription row per student. Plan 02 will upsert (not insert) when re-subscribing after a toggle.
- `last_notified_at` compared as UTC date string (`split('T')[0]`) to avoid timezone edge cases.
- Partial index `WHERE is_enabled = true` ensures the Edge Function query only scans eligible rows.
- `parent_consent_at` stored as TIMESTAMPTZ for COPPA audit trail; Plan 02 writes this timestamp when parent solves the math verification problem.
- On 410 Gone: set `is_enabled = false` AND `subscription = null` to prevent retry loops. Client (Plan 02) must re-subscribe and re-upsert.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Manual steps required before notifications can send (documented in migration comments):

1. Store project URL in Vault: `SELECT vault.create_secret('https://[project-ref].supabase.co', 'project_url');`
2. Store cron secret in Vault: `SELECT vault.create_secret('[your-cron-secret]', 'cron_secret');`
3. Set Edge Function secrets: `supabase secrets set CRON_SECRET=[value] VAPID_PUBLIC_KEY=[value] VAPID_PRIVATE_KEY=[value] VAPID_SUBJECT=mailto:admin@pianomaster.app`
4. Register pg_cron job via Supabase SQL Editor (SQL provided in migration comments)
5. Deploy migration: `supabase db push`
6. Deploy Edge Function: `supabase functions deploy send-daily-push`

## Next Phase Readiness

- Backend foundation complete — Plan 02 (client-side) can now register subscriptions against `push_subscriptions` table
- Plan 02 needs to: implement VAPID public key fetch/embed, browser push subscription registration, UPSERT to push_subscriptions, parent math-gate consent flow writing `parent_consent_granted = true` and `parent_consent_at`, and toggle UI in AppSettings
- pg_cron setup is a manual deploy step; developer must run it in Supabase SQL Editor after Edge Function is deployed

## Self-Check: PASSED

- FOUND: supabase/migrations/20260304000001_add_push_subscriptions.sql
- FOUND: supabase/functions/send-daily-push/index.ts
- FOUND: .planning/phases/17-push-notifications/17-01-SUMMARY.md
- FOUND commit: 329642d (Task 1 — migration + config.toml)
- FOUND commit: 253f092 (Task 2 — Edge Function)

---
*Phase: 17-push-notifications*
*Completed: 2026-03-04*
