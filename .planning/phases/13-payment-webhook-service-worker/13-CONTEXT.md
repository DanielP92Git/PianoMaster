# Phase 13: Payment Webhook and Service Worker - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Receive, verify, and apply subscription lifecycle events from Lemon Squeezy to the database via a Supabase Edge Function. The webhook is idempotent and handles duplicate delivery. The service worker never caches subscription state, and the cache version is bumped for the monetization deploy.

New subscription features (context provider, UI gating, parent checkout) belong in Phases 14-16.

</domain>

<decisions>
## Implementation Decisions

### Webhook Deployment
- **Platform:** Supabase Edge Function (Deno-based)
- **Function name:** `lemon-squeezy-webhook` — URL: `https://<project-ref>.supabase.co/functions/v1/lemon-squeezy-webhook`
- **Code location:** `supabase/functions/lemon-squeezy-webhook/` in this repo, deployed via `supabase functions deploy`
- **Scope:** Webhook-only — single responsibility, no general subscription API endpoints
- **Secrets:** Signing secret stored via `supabase secrets set`, accessed as `Deno.env.get()` in the function
- **Target:** Deploy directly to production Supabase project; test with LS sandbox events hitting real function
- **Testing environment:** Sandbox-only testing via LS dashboard "Send test webhook" — no local tunnel (ngrok) needed

### Event Handling Logic
- **Events handled:** Core lifecycle only — `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`
- **Status mapping:** Direct mapping of LS status strings to DB — `on_trial`, `active`, `paused`, `past_due`, `unpaid`, `cancelled`, `expired` (matches existing `parent_subscriptions.status` column)
- **Student linking:** Student ID passed via checkout metadata (custom data embedded when creating LS checkout URL in Phase 16). Webhook reads `student_id` from the event's custom data field
- **Idempotency:** UPSERT on `ls_subscription_id` via Postgres ON CONFLICT — same event arriving twice overwrites with identical data

### Error & Retry Behavior
- **Transient failures (DB errors):** Return HTTP 500 so Lemon Squeezy retries (up to 5 times with exponential backoff)
- **Logging:** `console.error()` in Edge Function — visible in Supabase dashboard Edge Function logs. No external alerting for now
- **Unknown student_id handling:** Claude's discretion on response code (likely 200 to stop retries, with error logged)
- **No alerting system** — rely on Supabase dashboard logs and LS delivery status for now

### Testing & Verification
- **E2E testing:** LS sandbox test events from dashboard → verify DB row appears in `parent_subscriptions`
- **Unit tests:** Extract pure business logic (signature verification, event type routing, status mapping, idempotency) into shared modules testable by Vitest
- **Test location:** Pure logic modules tested in Vitest alongside existing test suite; Edge Function entry point is a thin Deno wrapper
- **Verification checklist:** Include step-by-step manual QA checklist in the plan covering each success criterion

### Security Hardening
- **Signature verification:** HMAC-SHA256 signature check on every request — reject invalid/missing signatures with 400
- **Additional layers:** Basic field validation only (no IP allowlist, no rate limiting beyond what Supabase provides)
- **Data sanitization:** Whitelist specific fields from LS payload — only extract `subscription_id`, `customer_id`, `variant_id`, `status`, `email`, `current_period_end`. Ignore all other payload data
- **PII in logs:** Parent email logged in redacted format (`j***@example.com`) — COPPA-compliant logging
- **Request body size:** Claude's discretion (Supabase Edge Functions have platform-level limits)

### Service Worker Updates
- **Cache exclusion:** All Supabase REST API requests (`supabase.co/rest`) excluded from cache — broad pattern covers subscription queries and any future API calls. Auth endpoints already excluded
- **Cache version:** Bump to `pianomaster-v3` to force fresh caches on monetization deploy
- **Offline behavior:** Show last known subscription state — if user was premium before going offline, keep showing premium content. Don't block access due to network issues

### Deployment Workflow
- **Deploy method:** Manual via `supabase functions deploy lemon-squeezy-webhook`
- **Environment separation:** Use sandbox keys during development. Swap to live keys via `supabase secrets set` when going production
- **Documentation:** Create `DEPLOY.md` with step-by-step checklist (set secrets, deploy function, register webhook URL in LS dashboard)
- **Webhook URL registration:** Manual setup in LS dashboard — URL format documented in DEPLOY.md

### Claude's Discretion
- Unknown student_id response code (200 vs 400)
- Request body size enforcement (trust Supabase defaults or add explicit limit)
- Edge Function file structure within `supabase/functions/lemon-squeezy-webhook/`
- Shared module structure for testable business logic
- Exact DEPLOY.md format and checklist content

</decisions>

<specifics>
## Specific Ideas

- Business logic (signature check, event routing, status mapping) should be extractable into modules that Vitest can test — the Edge Function entry point is a thin wrapper
- UPSERT on `ls_subscription_id` is the idempotency mechanism — no separate dedup table needed
- The `student_id` linkage depends on Phase 16 embedding it in checkout metadata — the webhook reads it from LS custom data
- Parent email is denormalized into `parent_subscriptions` for display purposes, not for auth — log it redacted
- Service worker cache version bump (`pianomaster-v3`) ensures no stale pre-monetization code runs

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-payment-webhook-service-worker*
*Context gathered: 2026-02-26*
