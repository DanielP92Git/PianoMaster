---
phase: 13-payment-webhook-service-worker
plan: 01
subsystem: payments
tags: [supabase-edge-functions, deno, lemon-squeezy, webhook, hmac-sha256, typescript, vitest]

# Dependency graph
requires:
  - phase: 12-database-schema-and-rls
    provides: parent_subscriptions table with UNIQUE constraint on ls_subscription_id; RLS policies (no authenticated writes — service role only)

provides:
  - Supabase Edge Function at supabase/functions/lemon-squeezy-webhook/ ready for `supabase functions deploy`
  - HMAC-SHA256 signature verification using WebCrypto + timingSafeEqual (pinned std@0.224.0)
  - Whitelisted payload extraction from LS JSON:API format
  - Idempotent UPSERT to parent_subscriptions via ON CONFLICT on ls_subscription_id
  - config.toml updated with verify_jwt = false for the webhook function
  - 25 Vitest tests covering all pure business logic modules

affects:
  - 13-02 (service worker): independent deliverable in same phase
  - 16-checkout-flow: Phase 16 embeds student_id in custom_data that this webhook reads
  - DEPLOY.md: needs to reference this function name and secrets setup

# Tech tracking
tech-stack:
  added:
    - Supabase Edge Functions (Deno runtime) — new file type in repo
    - deno.land/std@0.224.0/crypto/timing_safe_equal.ts — pinned Deno std import for timing-safe comparison
    - esm.sh/@supabase/supabase-js@2 — Deno-compatible Supabase client (URL import)
  patterns:
    - Verify-before-parse: req.text() before JSON.parse() — HMAC signs raw bytes; any re-serialization breaks verification
    - Injected client pattern: upsertSubscription takes supabase client as arg rather than creating its own (enables unit testing without Deno runtime)
    - Whitelist-only extraction: extractPayload returns exactly 8 fields — all other LS payload data ignored
    - 200-to-stop-retries: missing student_id returns 200 (not 400) — LS retries can't fix a missing student_id
    - Option B Vitest strategy: Deno-specific imports (deno.land/std) can't resolve in Node; test the ALGORITHM with Node-equivalent, document why

key-files:
  created:
    - supabase/functions/lemon-squeezy-webhook/index.ts
    - supabase/functions/lemon-squeezy-webhook/lib/verifySignature.ts
    - supabase/functions/lemon-squeezy-webhook/lib/extractPayload.ts
    - supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts
    - src/services/__tests__/webhookLogic.test.js
  modified:
    - supabase/config.toml

key-decisions:
  - "Unknown student_id returns HTTP 200 (not 400/500) — LS retries can't fix a missing student_id; 200 stops wasteful retries and logs error for investigation"
  - "verifySignature uses pinned deno.land/std@0.224.0/crypto/timing_safe_equal.ts — avoids version ambiguity per RESEARCH.md Open Question 1"
  - "upsertSubscription takes injected supabase client arg (not createClient internally) — enables testability without Deno runtime"
  - "Vitest tests use Node-equivalent HMAC implementation (Option B) for verifySignature — deno.land/std URL imports don't resolve in Node; algorithm is the same (WebCrypto)"
  - "plan_id left NULL in upsert — Phase 16 will map ls_variant_id to plan_id; webhook stores raw LS data only"
  - "No CORS headers added — LS sends server-to-server POST, not browser request"

patterns-established:
  - "Supabase Edge Function structure: thin index.ts entry point + lib/ subdirectory of pure modules testable by Vitest"
  - "Webhook security: verify-before-parse (req.text → verifySignature → JSON.parse) prevents stream consumption bug"
  - "Idempotency via UPSERT: .upsert({...}, { onConflict: 'ls_subscription_id' }) — no separate dedup table"

requirements-completed: [PAY-02, PAY-03, PAY-04]

# Metrics
duration: 4min
completed: 2026-02-27
---

# Phase 13 Plan 01: Lemon Squeezy Webhook Edge Function Summary

**Supabase Deno Edge Function with HMAC-SHA256 signature verification, idempotent UPSERT to parent_subscriptions, and 25 Vitest tests for all pure business logic modules**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-26T22:40:37Z
- **Completed:** 2026-02-26T22:44:38Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Deployed-ready Supabase Edge Function that receives, verifies, and persists Lemon Squeezy subscription lifecycle events
- HMAC-SHA256 signature verification with timing-safe byte comparison and all pitfall guards (empty header, length mismatch, body-consumed-before-verify)
- Idempotent UPSERT ensures duplicate LS events produce exactly one database row via `ON CONFLICT (ls_subscription_id) DO UPDATE`
- 25 Vitest tests covering extractPayload (8 tests), verifySignature algorithm (7 tests), event routing (4 tests), and redactEmail (6 tests) — all pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Create webhook Edge Function with pure business logic modules** - `ca7283c` (feat)
2. **Task 2: Add Vitest tests for pure webhook business logic** - `68cccb3` (test)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `supabase/functions/lemon-squeezy-webhook/index.ts` — Thin Deno entry point: POST-only, raw body read, HMAC verify, event routing, student_id guard, service role UPSERT
- `supabase/functions/lemon-squeezy-webhook/lib/verifySignature.ts` — Pure WebCrypto HMAC-SHA256 verification with pinned timingSafeEqual (std@0.224.0)
- `supabase/functions/lemon-squeezy-webhook/lib/extractPayload.ts` — Whitelists 8 fields from LS JSON:API payload; coerces integer IDs to strings
- `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` — UPSERT to parent_subscriptions with injected supabase client; plan_id null (Phase 16)
- `src/services/__tests__/webhookLogic.test.js` — 25 Vitest tests: extractPayload, verifySignature (Node-equivalent), event routing Set, redactEmail
- `supabase/config.toml` — Added `[functions.lemon-squeezy-webhook]` with `verify_jwt = false`

## Decisions Made

- **Unknown student_id → HTTP 200:** Returns 200 instead of 400 to stop LS retries (LS can't fix missing student_id by retrying). Logs error for investigation.
- **Pinned std@0.224.0:** `timingSafeEqual` imported from `https://deno.land/std@0.224.0/crypto/timing_safe_equal.ts` to avoid version ambiguity (RESEARCH.md Open Question 1 recommendation).
- **Injected client in upsertSubscription:** Takes `supabase: any` arg rather than calling `createClient()` internally — enables testability without Deno environment.
- **Option B for verifySignature tests:** `deno.land/std` URL imports don't resolve in Node 20/Vitest. Used Node `crypto.subtle` + `timingSafeEqual` to verify the identical HMAC algorithm. Documents clearly why Deno std import isn't directly testable.
- **No CORS headers:** LS sends server-to-server POST — no browser origins to allow.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all dependencies (WebCrypto in Node 20, Vitest TypeScript transform for extractPayload.ts) resolved without issues.

## User Setup Required

**External services require manual configuration before this function can receive live webhooks:**

1. **Set the signing secret:**
   ```bash
   supabase secrets set LS_SIGNING_SECRET=<your-lemon-squeezy-webhook-secret>
   ```

2. **Deploy the function:**
   ```bash
   supabase functions deploy lemon-squeezy-webhook
   ```

3. **Register webhook URL in Lemon Squeezy dashboard:**
   ```
   https://<your-project-ref>.supabase.co/functions/v1/lemon-squeezy-webhook
   ```
   Events to subscribe: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`

4. **Test with sandbox event** from LS dashboard → verify row appears in `parent_subscriptions` table (requires a valid `student_id` in custom_data)

Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase — no manual setup needed for those.

## Next Phase Readiness

- Edge Function ready for deployment via `supabase functions deploy lemon-squeezy-webhook`
- Phase 13-02 (service worker updates) is independent and can proceed immediately
- Phase 16 (checkout flow) must embed `student_id` in checkout `custom_data` for webhook to link events to students

## Self-Check: PASSED

All files verified present:
- supabase/functions/lemon-squeezy-webhook/index.ts: FOUND
- supabase/functions/lemon-squeezy-webhook/lib/verifySignature.ts: FOUND
- supabase/functions/lemon-squeezy-webhook/lib/extractPayload.ts: FOUND
- supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts: FOUND
- src/services/__tests__/webhookLogic.test.js: FOUND
- .planning/phases/13-payment-webhook-service-worker/13-01-SUMMARY.md: FOUND

All task commits verified:
- ca7283c: feat(13-01): create Lemon Squeezy webhook Edge Function — FOUND
- 68cccb3: test(13-01): add Vitest tests for webhook business logic — FOUND

---
*Phase: 13-payment-webhook-service-worker*
*Completed: 2026-02-27*
