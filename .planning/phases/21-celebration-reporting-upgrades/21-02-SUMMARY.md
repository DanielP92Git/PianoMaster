---
phase: 21-celebration-reporting-upgrades
plan: 02
subsystem: infra
tags: [brevo, email, supabase-edge-functions, cron, hmac, deno]

# Dependency graph
requires:
  - phase: 17-push-notifications
    provides: push_subscriptions table, parent_consent_granted column, COPPA consent flow
  - phase: 15-content-gate
    provides: send-consent-email Brevo pattern, send-daily-push cron pattern
provides:
  - weekly_report_opted_out and last_weekly_report_at columns on push_subscriptions
  - send-weekly-report Edge Function (cron-triggered, Brevo email)
  - unsubscribe-weekly-report Edge Function (GET endpoint with HMAC verification)
affects: [parent-portal, settings, notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "HMAC-signed unsubscribe tokens for stateless email opt-out"
    - "Cron-triggered email Edge Function with Brevo API (same as send-daily-push + send-consent-email)"

key-files:
  created:
    - supabase/migrations/20260307000002_add_weekly_report_opt_out.sql
    - supabase/functions/send-weekly-report/index.ts
    - supabase/functions/unsubscribe-weekly-report/index.ts
  modified:
    - supabase/config.toml

key-decisions:
  - "HMAC-SHA256 via Web Crypto API for unsubscribe tokens -- stateless verification, no session/login needed"
  - "6-day dedup guard on last_weekly_report_at prevents duplicate Monday sends without blocking next week"
  - "HTML entities used for emojis in email (&#127929; &#128293;) for cross-client compatibility"
  - "Unsubscribe page uses modern CSS (not table-based) since it's a web page, not an email"

patterns-established:
  - "HMAC unsubscribe: generateUnsubscribeToken in sender, verifyUnsubscribeToken in handler"
  - "Weekly report email branding matches consent email: purple gradient #6366f1->#8b5cf6->#a855f7"

requirements-completed: [PROG-07]

# Metrics
duration: 4min
completed: 2026-03-07
---

# Phase 21 Plan 02: Weekly Parent Report Summary

**Cron-triggered Edge Function sends weekly Brevo email to consented parents with 7-day stats (days practiced, streak, nodes completed, level) and HMAC-signed unsubscribe link**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-07T18:59:12Z
- **Completed:** 2026-03-07T19:03:14Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Database migration adds weekly_report_opted_out (BOOLEAN DEFAULT false) and last_weekly_report_at (TIMESTAMPTZ) to push_subscriptions
- send-weekly-report Edge Function authenticates via x-cron-secret, queries consented non-opted-out parents, gathers 7-day stats per student, sends PianoMaster-branded HTML email via Brevo
- unsubscribe-weekly-report Edge Function verifies HMAC token and sets weekly_report_opted_out=true, returns branded HTML confirmation page

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration and send-weekly-report Edge Function** - `4a45d0e` (feat)
2. **Task 2: Create unsubscribe-weekly-report Edge Function** - `89b95b8` (feat)

## Files Created/Modified
- `supabase/migrations/20260307000002_add_weekly_report_opt_out.sql` - Adds opt-out and last-sent columns to push_subscriptions
- `supabase/functions/send-weekly-report/index.ts` - Cron-triggered Edge Function: queries parents, gathers stats, sends Brevo email (492 lines)
- `supabase/functions/unsubscribe-weekly-report/index.ts` - GET endpoint for one-click unsubscribe with HMAC verification (207 lines)
- `supabase/config.toml` - Added verify_jwt=false for both new Edge Functions

## Decisions Made
- HMAC-SHA256 via Web Crypto API (crypto.subtle) for unsubscribe tokens -- Deno-native, no external dependencies, stateless verification without requiring parent login
- 6-day dedup guard prevents duplicate sends if cron fires more than once per week, while still allowing the next Monday's send
- HTML entities used for emojis in email templates for cross-email-client compatibility
- Unsubscribe confirmation page uses modern CSS (flexbox, border-radius) since it renders in a browser, not an email client
- Email subject: "Weekly Progress Report - PianoMaster" -- clear, professional, matches brand

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

**External services require manual configuration:**
- `WEEKLY_REPORT_HMAC_SECRET` environment variable must be set in Supabase Edge Function secrets (generate a random 32+ character string)
- `BREVO_API_KEY` is already configured (shared with send-consent-email)
- pg_cron job must be created manually in Supabase SQL Editor:
  ```sql
  SELECT cron.schedule(
    'send-weekly-report',
    '0 8 * * 1',
    $$SELECT net.http_post(
      url := '<SUPABASE_URL>/functions/v1/send-weekly-report',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
      body := '{}'::jsonb
    );$$
  );
  ```

## Issues Encountered
None

## Next Phase Readiness
- Weekly report infrastructure complete, ready for pg_cron deployment
- Plan 01 (Dashboard UI components) can proceed independently
- PROG-07 requirement fulfilled

---
*Phase: 21-celebration-reporting-upgrades*
*Completed: 2026-03-07*
