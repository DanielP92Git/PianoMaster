---
phase: 16-backend-email-infrastructure
plan: 01
subsystem: api
tags: [supabase, edge-functions, brevo, rate-limiting, postgres, rls, deno, typescript]

# Dependency graph
requires:
  - phase: 14-coppa-hard-delete
    provides: "process-account-deletions Edge Function pattern (service role client, cron secret)"
  - phase: 11-parental-consent-email
    provides: "send-consent-email Edge Function (Brevo API call pattern with AbortController)"
  - phase: 8-monetization
    provides: "create-checkout Edge Function (JWT extraction, jsonResponse, CORS pattern)"
provides:
  - "feedback_submissions table with RLS (INSERT-only for authenticated, service role for COUNT)"
  - "send-feedback Edge Function: JWT auth, input validation, rate limiting (3/hr), Brevo plain-text delivery"
  - "__APP_VERSION__ Vite define injected from package.json at build time"
  - "supabase/config.toml: [functions.send-feedback] with verify_jwt = true"
affects: [17-feedback-ui, future-phases-using-feedback-submissions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "service role client for rate-check COUNT (bypasses RLS when no SELECT policy)"
    - "INSERT-only RLS policy: no SELECT/UPDATE/DELETE for authenticated users"
    - "Plain-text Brevo email using textContent (not htmlContent) for support inbox"
    - "AbortController 30s timeout on Brevo fetch (consistent with consent email pattern)"
    - "Student UUID truncated to 8 chars in email body (COPPA PII minimization)"

key-files:
  created:
    - supabase/migrations/20260322000001_add_feedback_submissions.sql
    - supabase/functions/send-feedback/index.ts
  modified:
    - supabase/config.toml
    - vite.config.js

key-decisions:
  - "Service role bypasses RLS for COUNT rate-check (no SELECT policy on feedback_submissions per D-10)"
  - "Message content not stored in DB — Brevo email is ground truth (COPPA-safe, per D-07)"
  - "Rate limit: 3 submissions/hour per user, returns 429 with error 'rate_limit' (consistent with existing patterns)"
  - "Plain text email (textContent) not HTML for support inbox (per D-11)"
  - "version field optional with 'unknown' fallback (per D-18)"
  - "Student UUID truncated to 8 chars in email (per D-15 PII minimization)"
  - "__APP_VERSION__ injected via Vite define from package.json — current value 0.0.0 (acceptable per D-18)"

patterns-established:
  - "Feedback Edge Function: composite of create-checkout (JWT/CORS) + send-consent-email (Brevo/timeout) patterns"
  - "Rate limiting table: INSERT-only RLS + service role COUNT query (matches score rate limiting pattern)"

requirements-completed: [BACK-01, BACK-02, SPAM-01, SPAM-02, SPAM-04]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 16 Plan 01: Backend Email Infrastructure Summary

**send-feedback Edge Function with DB rate limiting (3/hr), JWT auth, input validation, and Brevo plain-text delivery to support inbox**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T21:51:25Z
- **Completed:** 2026-03-22T21:54:24Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `feedback_submissions` migration with INSERT-only RLS policy, composite index for rate-check queries, and `ON DELETE CASCADE` FK to students
- Created `send-feedback` Edge Function compositing JWT auth from create-checkout and Brevo timeout from send-consent-email, with full input validation (type enum + message 10-1000 chars), rate limiting (3/hr via service role COUNT), DB insert (type only, no message content), and plain-text Brevo email to SENDER_EMAIL inbox
- Added `[functions.send-feedback]` with `verify_jwt = true` to `supabase/config.toml`
- Injected `__APP_VERSION__` Vite define from `package.json` for client-side version reporting in feedback submissions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create feedback_submissions migration, config.toml entry, and Vite version define** - `f0bdd37` (chore)
2. **Task 2: Create send-feedback Edge Function** - `7880210` (feat)

**Plan metadata:** (to be committed with SUMMARY.md)

## Files Created/Modified
- `supabase/migrations/20260322000001_add_feedback_submissions.sql` - Rate-limiting table with RLS, composite index, INSERT-only policy for authenticated users
- `supabase/functions/send-feedback/index.ts` - Edge Function: JWT auth, POST-only, input validation, service-role rate check, DB insert, Brevo plain-text email
- `supabase/config.toml` - Added `[functions.send-feedback]` entry with `verify_jwt = true`
- `vite.config.js` - Added `readFileSync` import + `__APP_VERSION__` Vite define from package.json

## Decisions Made
- Service role client used for COUNT rate-check because no SELECT RLS policy exists on `feedback_submissions` (authenticated clients can only INSERT per D-10); anon client would fail the COUNT query
- Message content intentionally not stored in DB — sent via Brevo only (COPPA-safe, prevents PII accumulation per D-07)
- 429 returns `{ success: false, error: 'rate_limit' }` with the string `'rate_limit'` to enable client-side detection for localized display in Phase 17
- Email body uses `textContent` (not `htmlContent`) because support inbox needs plain readable text, not rendered HTML

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all 211 existing tests pass after both tasks.

## User Setup Required

**Env vars required before `supabase functions deploy send-feedback`:**
- `BREVO_API_KEY` — existing Brevo key (already set for other Edge Functions)
- `SENDER_EMAIL` — update to dedicated support Gmail when created (tracked as blocker in STATE.md)
- `SENDER_NAME` — optional, defaults to 'PianoMaster'

**Database:** Run `supabase db push` to apply `20260322000001_add_feedback_submissions.sql` migration.

## Known Stubs

None — no data flows to UI in this plan (backend-only).

## Next Phase Readiness
- Backend pipeline fully ready for Phase 17 (Settings UI form integration)
- Edge Function accepts `{ type, message, version }` POST body with JWT bearer token
- Returns `{ success: true }` on success, typed error responses (`rate_limit`, validation errors) for Phase 17 error handling
- `__APP_VERSION__` global available for frontend to pass as `version` field in feedback body

---
*Phase: 16-backend-email-infrastructure*
*Completed: 2026-03-22*
