# Phase 16: Backend & Email Infrastructure - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the `send-feedback` Supabase Edge Function that receives feedback submissions from authenticated users, validates input, enforces rate limiting, and sends the feedback to the support Gmail inbox via Brevo API. Update the shared SENDER_EMAIL to the new support Gmail and verify all existing transactional emails continue working.

</domain>

<decisions>
## Implementation Decisions

### Edge Function auth and structure
- **D-01:** `verify_jwt = true` in config.toml — Supabase handles JWT verification automatically (same pattern as `create-checkout` and `cancel-subscription`)
- **D-02:** CORS whitelist pattern from `send-consent-email` — allow `testpianomaster.netlify.app` and `localhost:5174`
- **D-03:** POST-only handler with OPTIONS preflight, matching all existing Edge Function patterns

### Input validation
- **D-04:** Server rejects if `type` is not one of `bug`, `suggestion`, `other` (lowercase enum)
- **D-05:** Server rejects if `message` length < 10 or > 1000 characters (after trimming)
- **D-06:** All validation failures return 400 with a generic `{ success: false, error: "..." }` shape

### Rate limiting
- **D-07:** New `feedback_submissions` table tracking per-user submissions (not reusing `rate_limits` table — different domain, different key shape: per-user not per-node)
- **D-08:** Rate check via row count: `SELECT COUNT(*) FROM feedback_submissions WHERE student_id = $1 AND created_at > NOW() - INTERVAL '1 hour'` — simpler than token-bucket since volume is tiny
- **D-09:** 429 response when limit exceeded with `{ success: false, error: "rate_limit" }` — frontend will translate this to a user-friendly message
- **D-10:** RLS on `feedback_submissions`: authenticated users can INSERT own rows only; no SELECT/UPDATE/DELETE from client (service role reads for rate check inside Edge Function)

### Feedback email presentation
- **D-11:** Plain text-style email (no branded HTML template) — this goes to the developer support inbox, not to parents. Scannable over pretty.
- **D-12:** Subject line format: `[Bug] PianoMaster Feedback` / `[Suggestion] PianoMaster Feedback` / `[Other] PianoMaster Feedback` — enables Gmail filtering by type
- **D-13:** Email body includes: feedback type, message text, truncated student ID (first 8 chars of UUID), app version, submission timestamp (UTC)
- **D-14:** Sent TO the support Gmail (same as SENDER_EMAIL), FROM the same address — feedback loop to a single inbox

### Student anonymization
- **D-15:** First 8 characters of the student UUID in the email body (e.g., `Student: a1b2c3d4...`) — enough to correlate with the database if investigation needed, but not exposing full UUIDs in email transit
- **D-16:** No student name, email, or other PII in the feedback email body

### App version
- **D-17:** Client sends `version` field in the request body — sourced from `package.json` version at build time via Vite's `define` config or import
- **D-18:** Version is optional — if missing, email shows "unknown". Server does not reject missing version.

### Sender email migration
- **D-19:** Single env var change: update `SENDER_EMAIL` on Supabase dashboard to the new support Gmail address
- **D-20:** Pre-requisite: new Gmail must be added and verified as a sender in Brevo before updating the env var
- **D-21:** After env var update, manually trigger a test consent email and verify weekly report still sends — all 3 email functions (`send-consent-email`, `send-weekly-report`, `process-account-deletions`) read the same `SENDER_EMAIL` env var
- **D-22:** Rollback plan: revert `SENDER_EMAIL` env var to previous value if any email delivery fails

### Claude's Discretion
- Exact table schema for `feedback_submissions` (columns, indexes)
- Edge Function error handling and logging patterns
- Brevo API timeout duration
- Whether to use service_role for rate check or RLS-based approach
- Migration file naming and ordering

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches matching existing Edge Function patterns.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Edge Function patterns
- `supabase/functions/send-consent-email/index.ts` — Browser-invoked Brevo email pattern: CORS, validation, Brevo API call with timeout, error handling
- `supabase/functions/create-checkout/index.ts` — Browser-invoked with `verify_jwt = true` pattern
- `supabase/functions/send-weekly-report/index.ts` — Brevo API call with service role DB access pattern

### Rate limiting
- `supabase/migrations/20260201000002_add_rate_limiting.sql` — Existing rate limit table + function (token-bucket pattern, advisory locks, RLS)

### Edge Function config
- `supabase/config.toml` — `verify_jwt` settings per function (lines 307-338)

### Environment
- `supabase/functions/.env.example` — Current env vars (BREVO_API_KEY, SENDER_EMAIL, SENDER_NAME)

### Requirements
- `.planning/REQUIREMENTS.md` — BACK-01, BACK-02, MAIL-01, MAIL-02, SPAM-01, SPAM-02, SPAM-04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getCorsHeaders(req)` pattern from `send-consent-email` — copy for new function (not shared module; Edge Functions are self-contained)
- Brevo API call with AbortController timeout — identical pattern across all email functions
- `rate_limits` migration as template for `feedback_submissions` table structure

### Established Patterns
- All browser-invoked Edge Functions use `Deno.serve()` + CORS + JSON responses
- `verify_jwt = true` functions get `req.headers.get('authorization')` automatically validated by Supabase
- For service role DB access inside Edge Functions: `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`
- Error responses follow `{ success: false, error: string }` shape
- Brevo sender config from env vars with fallback defaults

### Integration Points
- `supabase/config.toml` — needs new `[functions.send-feedback]` section with `verify_jwt = true`
- `supabase/functions/.env.example` — no new env vars needed (reuses existing BREVO_API_KEY, SENDER_EMAIL)
- New migration file for `feedback_submissions` table
- `SENDER_EMAIL` env var on Supabase dashboard — manual update to new Gmail (affects all email functions)

</code_context>

<deferred>
## Deferred Ideas

- In-app DB storage of feedback (if volume warrants) — future enhancement
- Auto-reply confirmation email to user — explicitly out of scope for v1
- File/screenshot attachment support — out of scope
- Honeypot field processing — Phase 17 (client-side field, but server could validate)

</deferred>

---

*Phase: 16-backend-email-infrastructure*
*Context gathered: 2026-03-22*
