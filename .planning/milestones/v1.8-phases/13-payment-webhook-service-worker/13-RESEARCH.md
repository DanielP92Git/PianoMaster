# Phase 13: Payment Webhook and Service Worker - Research

**Researched:** 2026-02-27
**Domain:** Supabase Edge Functions / Lemon Squeezy webhooks / Service Worker cache exclusion
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Webhook Deployment**
- Platform: Supabase Edge Function (Deno-based)
- Function name: `lemon-squeezy-webhook` — URL: `https://<project-ref>.supabase.co/functions/v1/lemon-squeezy-webhook`
- Code location: `supabase/functions/lemon-squeezy-webhook/` in this repo, deployed via `supabase functions deploy`
- Scope: Webhook-only — single responsibility, no general subscription API endpoints
- Secrets: Signing secret stored via `supabase secrets set`, accessed as `Deno.env.get()` in the function
- Target: Deploy directly to production Supabase project; test with LS sandbox events hitting real function
- Testing environment: Sandbox-only testing via LS dashboard "Send test webhook" — no local tunnel (ngrok) needed

**Event Handling Logic**
- Events handled: Core lifecycle only — `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`
- Status mapping: Direct mapping of LS status strings to DB — `on_trial`, `active`, `paused`, `past_due`, `unpaid`, `cancelled`, `expired` (matches existing `parent_subscriptions.status` column)
- Student linking: Student ID passed via checkout metadata (custom data embedded when creating LS checkout URL in Phase 16). Webhook reads `student_id` from the event's custom data field
- Idempotency: UPSERT on `ls_subscription_id` via Postgres ON CONFLICT — same event arriving twice overwrites with identical data

**Error & Retry Behavior**
- Transient failures (DB errors): Return HTTP 500 so Lemon Squeezy retries (up to 4 total attempts with exponential backoff: 5s, 25s, 125s)
- Logging: `console.error()` in Edge Function — visible in Supabase dashboard Edge Function logs. No external alerting for now
- Unknown student_id handling: Claude's discretion on response code (likely 200 to stop retries, with error logged)
- No alerting system — rely on Supabase dashboard logs and LS delivery status for now

**Testing & Verification**
- E2E testing: LS sandbox test events from dashboard → verify DB row appears in `parent_subscriptions`
- Unit tests: Extract pure business logic (signature verification, event type routing, status mapping, idempotency) into shared modules testable by Vitest
- Test location: Pure logic modules tested in Vitest alongside existing test suite; Edge Function entry point is a thin Deno wrapper
- Verification checklist: Include step-by-step manual QA checklist in the plan covering each success criterion

**Security Hardening**
- Signature verification: HMAC-SHA256 signature check on every request — reject invalid/missing signatures with 400
- Additional layers: Basic field validation only (no IP allowlist, no rate limiting beyond what Supabase provides)
- Data sanitization: Whitelist specific fields from LS payload — only extract `subscription_id`, `customer_id`, `variant_id`, `status`, `email`, `current_period_end`. Ignore all other payload data
- PII in logs: Parent email logged in redacted format (`j***@example.com`) — COPPA-compliant logging
- Request body size: Claude's discretion (trust Supabase defaults)

**Service Worker Updates**
- Cache exclusion: All Supabase REST API requests (`supabase.co/rest`) excluded from cache — broad pattern covers subscription queries and any future API calls. Auth endpoints already excluded
- Cache version: Bump to `pianomaster-v3` to force fresh caches on monetization deploy (NOTE: current sw.js already uses `pianomaster-v5` — actual bump target must be determined from current code)
- Offline behavior: Show last known subscription state — if user was premium before going offline, keep showing premium content. Don't block access due to network issues

**Deployment Workflow**
- Deploy method: Manual via `supabase functions deploy lemon-squeezy-webhook`
- Environment separation: Use sandbox keys during development. Swap to live keys via `supabase secrets set` when going production
- Documentation: Create `DEPLOY.md` with step-by-step checklist (set secrets, deploy function, register webhook URL in LS dashboard)
- Webhook URL registration: Manual setup in LS dashboard — URL format documented in DEPLOY.md

### Claude's Discretion
- Unknown student_id response code (200 vs 400) — recommend 200 (stops retries, logs the error; LS can't fix an unknown student_id by retrying)
- Request body size enforcement — trust Supabase platform defaults (no explicit limit needed)
- Edge Function file structure within `supabase/functions/lemon-squeezy-webhook/`
- Shared module structure for testable business logic
- Exact DEPLOY.md format and checklist content

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAY-02 | Webhook Edge Function receives and processes subscription lifecycle events (created, updated, canceled) | Supabase Edge Functions use `Deno.serve()` with `verify_jwt = false` in config.toml; LS sends POST to function URL with JSON payload; `meta.event_name` field routes to correct handler |
| PAY-03 | Webhook handler is idempotent and handles duplicate or out-of-order events | Postgres UPSERT on `ls_subscription_id` via `ON CONFLICT (ls_subscription_id) DO UPDATE SET ...`; identical payloads overwrite with same data; no separate dedup table needed |
| PAY-04 | Webhook verifies cryptographic signature before processing any event | LS sends HMAC-SHA256 signature in `X-Signature` header as hex string; verify using `crypto.subtle` WebCrypto API with `timingSafeEqual` from Deno std; reject with 400 if missing or invalid |
| COMP-01 | Service worker excludes subscription status endpoints from cache | Add `/rest/` to SW exclusion pattern; `RUNTIME_CACHE_PATTERNS` currently includes all `supabase.co` — add an `SW_EXCLUDED_REST_PATTERNS` check that skips `/rest/v1/` paths before caching |
| COMP-02 | Service worker cache version bumped to force refresh on monetization deploy | Current sw.js uses `pianomaster-v5`; bump to `pianomaster-v6` (or next sequential); old caches deleted on activate via `CACHE_WHITELIST` check |
</phase_requirements>

---

## Summary

Phase 13 delivers two independent deliverables: (1) a Supabase Edge Function that receives, verifies, and applies Lemon Squeezy subscription webhook events to the `parent_subscriptions` database table, and (2) service worker updates that exclude subscription API endpoints from caching and bump the cache version for the monetization deploy.

The Edge Function architecture is straightforward: Deno-based, deployed with `verify_jwt = false` (the function does its own signature verification), reads the raw request body before parsing JSON (required for HMAC), verifies the `X-Signature` HMAC-SHA256 header, routes by `meta.event_name`, and UPSERTs into `parent_subscriptions` using the service role key which bypasses RLS. The idempotency mechanism is a Postgres `ON CONFLICT (ls_subscription_id) DO UPDATE` clause — no additional dedup infrastructure needed.

The service worker change is a targeted two-line modification: bump `CACHE_NAME` from `pianomaster-v5` to `pianomaster-v6`, and add `/rest/v1/` (Supabase REST API path) to the cache exclusion logic alongside the existing `AUTH_EXCLUDED_PATTERNS`. The existing `RUNTIME_CACHE_PATTERNS` pattern `^https:\/\/.*\.supabase\.co` catches ALL supabase.co traffic for potential caching — the fix is to exclude `/rest/` paths before the cache write, ensuring subscription queries (and all other REST API calls) always fetch from network.

**Primary recommendation:** Build the Edge Function as a thin `index.ts` entry point plus a `lib/` subdirectory of pure business logic modules. The pure modules (signature verification, payload extraction, event routing) can be tested by Vitest without Deno runtime. The entry point calls them and handles HTTP response formatting.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Deno (platform) | 1.x (config.toml: `deno_version = 1`) | Edge Function runtime | Supabase Edge Functions are Deno-based; no choice |
| `@supabase/supabase-js` | 2.x (via `esm.sh`) | Database writes with service role | Same client library used in React app; service role key bypasses RLS |
| WebCrypto API (`crypto.subtle`) | Built-in | HMAC-SHA256 signature verification | Available in Deno without imports; no external crypto dependency needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `https://deno.land/std/crypto` | std@0.170+ | `timingSafeEqual` for constant-time comparison | Required for timing-attack-safe signature comparison (not in WebCrypto standard) |
| Vitest | 3.2.4 (existing) | Unit test pure business logic modules | Tests run in Node/jsdom; pure functions have no Deno dependency |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `crypto.subtle` WebCrypto | Deno `node:crypto` module | `node:crypto` also works in Deno 1.x but WebCrypto is the idiomatic Deno approach and already available |
| Manual UPSERT logic | Separate dedup table | ON CONFLICT is simpler, no extra table, idempotent by definition |
| `timingSafeEqual` from std | Manual constant-time comparison | Never hand-roll timing-safe comparison; always use a vetted implementation |

**Installation:** No `npm install` needed. Edge Function dependencies are imported via URL in Deno (ESM). The existing `send-consent-email` function demonstrates the pattern.

---

## Architecture Patterns

### Recommended Project Structure

```
supabase/functions/lemon-squeezy-webhook/
├── index.ts                    # Thin Deno entry point — HTTP in/out only
└── lib/
    ├── verifySignature.ts      # Pure: HMAC-SHA256 check, returns boolean
    ├── extractPayload.ts       # Pure: whitelist fields from LS payload
    ├── routeEvent.ts           # Pure: maps event_name to DB action
    └── upsertSubscription.ts   # DB: UPSERT to parent_subscriptions (takes supabase client)
```

Pure modules in `lib/` have no Deno-specific APIs — they accept plain objects and return plain objects. This makes them importable by Vitest tests running in Node/jsdom.

### Pattern 1: Verify Before Parse

**What:** Read the raw request body as text FIRST, verify HMAC signature against raw text, then `JSON.parse()` the text. Never parse first and re-serialize.

**When to use:** Every webhook handler. HMAC signs the raw wire bytes — any intermediate parsing/re-serialization changes the byte sequence and breaks verification.

**Example:**
```typescript
// Source: Lemon Squeezy signing-requests docs + Supabase Stripe webhook example pattern
Deno.serve(async (req) => {
  // 1. Read raw body as text (for HMAC)
  const rawBody = await req.text();

  // 2. Verify signature BEFORE parsing
  const signature = req.headers.get('X-Signature') ?? '';
  const isValid = await verifySignature(rawBody, signature, signingSecret);
  if (!isValid) {
    return new Response('Invalid signature', { status: 400 });
  }

  // 3. Now safe to parse
  const payload = JSON.parse(rawBody);
  // ... route and handle
});
```

### Pattern 2: UPSERT Idempotency

**What:** Use `ON CONFLICT (ls_subscription_id) DO UPDATE SET` on the `parent_subscriptions` table. The same `subscription_created` event arriving twice writes the same data twice — net effect is one row.

**When to use:** All subscription writes. Never INSERT without conflict handling.

**Example:**
```typescript
// Source: Phase 12 schema — parent_subscriptions has ls_subscription_id as unique key
const { error } = await supabase
  .from('parent_subscriptions')
  .upsert(
    {
      student_id: payload.student_id,
      ls_subscription_id: payload.ls_subscription_id,
      ls_customer_id: payload.ls_customer_id,
      ls_variant_id: payload.ls_variant_id,
      plan_id: null,                    // Phase 16 will map variant_id → plan_id
      status: payload.status,
      current_period_end: payload.current_period_end,
      parent_email: payload.parent_email,
    },
    { onConflict: 'ls_subscription_id' }
  );
```

Note: The Supabase JS client's `.upsert()` with `onConflict` maps to `ON CONFLICT (...) DO UPDATE SET` in Postgres.

### Pattern 3: Service Role Client in Edge Function

**What:** Create the Supabase client with `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for all DB writes. The `parent_subscriptions` table has NO authenticated write policies — only service role can write.

**When to use:** In webhook handlers that perform authorized writes. Never expose service role key to client code.

**Example:**
```typescript
// Source: Supabase Edge Functions docs + send-consent-email pattern in this repo
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
```

Note: Both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase — no manual `secrets set` needed for these two.

### Pattern 4: Deno WebCrypto HMAC-SHA256 Verification

**What:** Use `crypto.subtle` (global in Deno) to verify HMAC-SHA256. Use `timingSafeEqual` from Deno std for the byte comparison.

**When to use:** Signature verification in the `verifySignature.ts` module.

**Example:**
```typescript
// Source: https://docs.deno.com/examples/hmac_generate_verify/
// + https://docs.lemonsqueezy.com/help/webhooks/signing-requests
import { timingSafeEqual } from 'https://deno.land/std/crypto/timing_safe_equal.ts';

export async function verifySignature(
  rawBody: string,
  receivedHex: string,
  secret: string
): Promise<boolean> {
  if (!receivedHex) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(rawBody)
  );

  // Convert computed signature to hex string
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Timing-safe comparison
  const computedBytes = encoder.encode(computedHex);
  const receivedBytes = encoder.encode(receivedHex);

  if (computedBytes.length !== receivedBytes.length) return false;
  return timingSafeEqual(computedBytes, receivedBytes);
}
```

### Pattern 5: Lemon Squeezy Payload Field Extraction

**What:** Whitelist specific fields from the LS webhook payload. The payload follows JSON:API format with `meta` and `data.attributes` structure.

**Field map (verified from LS API docs):**
```
meta.event_name          → event type string (e.g., 'subscription_created')
meta.custom_data.student_id → our student UUID (set at checkout by Phase 16)
data.id                  → ls_subscription_id (the LS subscription's integer ID, as string)
data.attributes.customer_id  → ls_customer_id
data.attributes.variant_id   → ls_variant_id
data.attributes.status       → status string (active, cancelled, expired, etc.)
data.attributes.user_email   → parent email (denormalized for display)
data.attributes.renews_at    → current_period_end (ISO 8601 timestamp)
```

**Example:**
```typescript
// Source: Lemon Squeezy API docs (retrieve-subscription)
export function extractPayload(body: unknown) {
  const { meta, data } = body as { meta: any; data: any };
  return {
    event_name: meta?.event_name as string,
    student_id: meta?.custom_data?.student_id as string | undefined,
    ls_subscription_id: data?.id as string,
    ls_customer_id: String(data?.attributes?.customer_id ?? ''),
    ls_variant_id: String(data?.attributes?.variant_id ?? ''),
    status: data?.attributes?.status as string,
    parent_email: data?.attributes?.user_email as string | undefined,
    current_period_end: data?.attributes?.renews_at as string | undefined,
  };
}
```

### Pattern 6: Service Worker REST API Exclusion

**What:** In `public/sw.js`, add a check that skips caching for ALL Supabase REST API paths (`.supabase.co/rest/`). Currently the SW caches all `supabase.co` responses that pass the auth exclusion check.

**Current state (sw.js):**
```javascript
const RUNTIME_CACHE_PATTERNS = [
  /^https:\/\/.*\.supabase\.co/,  // Catches ALL supabase.co including /rest/
];
```

**Fix — add REST exclusion alongside auth exclusion:**
```javascript
// Add to exclusion logic (alongside isAuthEndpoint check):
function isRestApiEndpoint(url) {
  if (!url.hostname.includes('supabase.co')) return false;
  return url.pathname.startsWith('/rest/');
}

// In fetch handler — existing pattern:
const shouldCache = matchesPattern && !isAuth && !isRestApiEndpoint(url);
```

**Cache version bump (current sw.js uses `pianomaster-v5`):**
```javascript
// Current:
const CACHE_NAME = "pianomaster-v5";
// After bump:
const CACHE_NAME = "pianomaster-v6";
```

The `CACHE_WHITELIST` already handles old cache cleanup on activate — bumping the version is the only change needed to force fresh caches.

### Pattern 7: config.toml — Disable JWT for Webhook Function

**What:** Lemon Squeezy sends webhooks without a Supabase JWT. The function must be configured to skip JWT verification (it does its own HMAC verification instead).

**Example:**
```toml
# Add to supabase/config.toml:
[functions.lemon-squeezy-webhook]
verify_jwt = false
```

**Deploy command:**
```bash
supabase functions deploy lemon-squeezy-webhook --no-verify-jwt
```

Note: The `--no-verify-jwt` flag can be passed at deploy time OR set in `config.toml`. Both work. The `config.toml` approach is preferred for reproducibility.

### Anti-Patterns to Avoid

- **Parse-then-verify:** Parsing JSON before verifying the HMAC breaks the signature check. Always `req.text()` first.
- **Anon key in webhook handler:** Using `SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY` — the anonymous key is subject to RLS. `parent_subscriptions` has no authenticated write policies, so the upsert would fail silently.
- **Returning 400 for unknown student_id:** Causes LS to retry 3 more times. Since LS cannot fix an unknown student_id by retrying, return 200 and log the error — the retry bandwidth is wasted.
- **Caching subscription API responses:** The `RUNTIME_CACHE_PATTERNS` regex catches all supabase.co URLs. Without the REST exclusion fix, subscription status queries (`/rest/v1/parent_subscriptions`) get cached — a subscriber could see stale "not subscribed" state after payment.
- **Importing `node:crypto`:** Works in Deno but requires `node:` specifier. Use `crypto.subtle` (global) + Deno std for idiomatic code consistent with the project's existing function style.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timing-safe byte comparison | Custom constant-time loop | `timingSafeEqual` from Deno std | Timing attacks on HMAC comparison are a real vulnerability; hand-rolled comparisons fail under compiler optimization |
| HMAC signature verification | Custom crypto implementation | `crypto.subtle.sign` + `timingSafeEqual` | WebCrypto is audited, standardized, and available in Deno without imports |
| Idempotency tracking | Separate `processed_webhooks` table | Postgres `ON CONFLICT DO UPDATE` | UPSERT makes dedup implicit and atomic; a separate table adds a race condition window |
| Payload schema validation | Custom JSON schema library | Simple field whitelist extraction | LS payload structure is stable; whitelist is sufficient and avoids library import overhead in Deno |

**Key insight:** Webhook security primitives (HMAC, timing-safe comparison) are subtle enough that any hand-rolled implementation carries meaningful risk. Use platform-provided implementations.

---

## Common Pitfalls

### Pitfall 1: Body Consumption Before Signature Check

**What goes wrong:** Calling `req.json()` before the HMAC check means the body stream is consumed. When you try to get the raw bytes for verification, the stream is empty. Signature check fails for every valid request.

**Why it happens:** Supabase/Deno request bodies are readable streams — reading them once consumes them. The Stripe webhook pattern (using `.text()`) exists for exactly this reason.

**How to avoid:** Always `const rawBody = await req.text()` first. Verify HMAC against `rawBody`. Then `JSON.parse(rawBody)`.

**Warning signs:** Every request returns 400 even during testing with correct signing secret.

### Pitfall 2: Hex String Length Mismatch in timingSafeEqual

**What goes wrong:** `timingSafeEqual` requires both buffers to be the same length. If `receivedHex` is empty (missing `X-Signature` header) or malformed, the comparison throws rather than returning false.

**Why it happens:** Missing header guard and length check are often omitted.

**How to avoid:** Guard for empty/missing header before attempting comparison. Check buffer lengths match before calling `timingSafeEqual`. Return `false` (not throw) on any mismatch.

**Warning signs:** 500 errors on requests with missing `X-Signature` header.

### Pitfall 3: Wrong Status String Mapping

**What goes wrong:** Lemon Squeezy returns status strings like `on_trial`, `active`, `cancelled`, `expired`, `paused`, `past_due`, `unpaid`. The `parent_subscriptions.status` column must accept the exact same strings. If the DB column has a CHECK constraint that doesn't include `on_trial` or `paused`, valid subscription events fail.

**Why it happens:** Phase 12 schema defined the status column — verify the accepted values match LS's actual status strings.

**How to avoid:** Cross-check the `parent_subscriptions.status` column definition from `20260226000001_add_subscription_tables.sql` against the full LS status enum. The CONTEXT.md says they match — confirm during implementation.

**Warning signs:** DB insert errors on `subscription_created` events for trial subscriptions.

### Pitfall 4: student_id Missing from custom_data

**What goes wrong:** Phase 16 (checkout URL creation) is responsible for embedding `student_id` in checkout custom data. Until Phase 16 is implemented, sandbox test webhooks will have no `student_id` in `meta.custom_data`. The webhook must handle missing `student_id` gracefully.

**Why it happens:** The webhook is built before the checkout flow that populates custom data.

**How to avoid:** When testing in Phase 13, manually send test webhooks from LS dashboard with custom data JSON `{"student_id": "<real-student-uuid>"}` to simulate Phase 16's behavior. The handler must still guard for undefined `student_id` and log it appropriately.

**Warning signs:** DB upsert fails with NOT NULL violation on `student_id` column (if `student_id` is required).

### Pitfall 5: Migration CLI Duplicate Timestamp

**What goes wrong:** The local migration history has a pre-existing duplicate timestamp `20260127000003` that blocks `supabase db push`. This blocked Phases 12-01 and 12-02 from using the CLI.

**Why it happens:** Two files share timestamp `20260127000003` (`optimize_rls_auth_plan.sql` and `regenerate_daily_goals.sql`).

**How to avoid:** Phase 13 creates no new migrations — only a new Edge Function. No migration CLI usage needed. The service worker and config.toml changes are file edits only. This pitfall does not apply to Phase 13 but is noted for awareness.

**Warning signs:** `supabase db push` error "migration already applied".

### Pitfall 6: SUPABASE_SERVICE_ROLE_KEY vs Legacy Key Format

**What goes wrong:** Supabase is migrating to a new API key format in 2026. Some projects on the new key system may have `SUPABASE_SECRET_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`.

**Why it happens:** Supabase announced a new key format (`sb_publishable_xxx` / `sb_secret_xxx`) during 2025-2026. Edge Functions auto-inject the old format during the transition period.

**How to avoid:** The auto-injected `SUPABASE_SERVICE_ROLE_KEY` still works for projects that haven't migrated. Use it as documented. If the function fails to authenticate, check whether the project has migrated to the new key format.

**Warning signs:** DB writes return auth errors despite using the service role client.

---

## Code Examples

Verified patterns from official sources:

### Complete verifySignature.ts Module

```typescript
// Source: https://docs.deno.com/examples/hmac_generate_verify/
//         https://docs.lemonsqueezy.com/help/webhooks/signing-requests
// Pure function — no Deno runtime APIs other than crypto.subtle (global)

export async function verifySignature(
  rawBody: string,
  receivedHex: string,
  secret: string
): Promise<boolean> {
  // Guard: missing or empty signature = reject
  if (!receivedHex || !secret) return false;

  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(rawBody)
  );

  // Convert computed HMAC to hex string (matches LS's X-Signature format)
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Timing-safe comparison (constant time regardless of where mismatch occurs)
  const computedBytes = encoder.encode(computedHex);
  const receivedBytes = encoder.encode(receivedHex);

  // Length mismatch guard (timingSafeEqual requires equal-length buffers)
  if (computedBytes.length !== receivedBytes.length) return false;

  // crypto.subtle.timingSafeEqual is available in modern Deno
  // Fallback: import from deno.land/std if not available as a global
  return crypto.subtle.timingSafeEqual(computedBytes, receivedBytes);
}
```

### Edge Function Entry Point Skeleton (index.ts)

```typescript
// Source: Supabase Stripe webhook example + Lemon Squeezy docs
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifySignature } from './lib/verifySignature.ts';
import { extractPayload } from './lib/extractPayload.ts';
import { handleEvent } from './lib/routeEvent.ts';

const HANDLED_EVENTS = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_expired',
]);

Deno.serve(async (req) => {
  // Reject non-POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // 1. Read raw body (MUST be before JSON.parse)
  const rawBody = await req.text();

  // 2. Verify signature
  const signingSecret = Deno.env.get('LS_SIGNING_SECRET') ?? '';
  const signature = req.headers.get('X-Signature') ?? '';
  const valid = await verifySignature(rawBody, signature, signingSecret);
  if (!valid) {
    console.error('Webhook: invalid signature');
    return new Response('Invalid signature', { status: 400 });
  }

  // 3. Parse and extract
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const payload = extractPayload(body);

  // 4. Skip unhandled event types (return 200 to stop retries)
  if (!HANDLED_EVENTS.has(payload.event_name)) {
    return new Response('Event not handled', { status: 200 });
  }

  // 5. Guard: unknown student_id (return 200 to stop retries; LS cannot fix this by retrying)
  if (!payload.student_id) {
    console.error('Webhook: missing student_id in custom_data', {
      event: payload.event_name,
      ls_subscription_id: payload.ls_subscription_id,
    });
    return new Response('Missing student_id', { status: 200 });
  }

  // 6. Initialize DB client with service role (bypasses RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 7. Handle event (UPSERT to parent_subscriptions)
  try {
    await handleEvent(supabase, payload);
  } catch (err) {
    // Return 500 → LS retries (transient DB error may resolve)
    console.error('Webhook: DB error', err);
    return new Response('Internal server error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
});
```

### Service Worker REST Exclusion Fix

```javascript
// Source: public/sw.js (this project) — targeted addition

// ADD this function alongside existing isAuthEndpoint():
function isRestApiEndpoint(url) {
  if (!url.hostname.includes('supabase.co')) return false;
  // Exclude all Supabase REST API calls — covers /rest/v1/parent_subscriptions,
  // /rest/v1/subscription_plans, and all other table queries
  return url.pathname.startsWith('/rest/');
}

// MODIFY the shouldCache condition (existing code around line 224):
// Before:
const shouldCache = matchesPattern && !isAuth;
// After:
const shouldCache = matchesPattern && !isAuth && !isRestApiEndpoint(url);
```

### PII-Redacted Email Logging

```typescript
// Source: CONTEXT.md COPPA requirement — parent email logged redacted
function redactEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 0) return '***';
  return email[0] + '***@' + email.slice(at + 1);
}

// Usage:
console.log('Processing subscription for', redactEmail(payload.parent_email ?? ''));
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `node:crypto` for HMAC | `crypto.subtle` WebCrypto (global) | Deno 1.x+ | WebCrypto is standardized; works in Deno without `node:` specifier |
| Manual dedup table | Postgres `ON CONFLICT DO UPDATE` | Always best practice | Atomic idempotency; no race conditions |
| `--no-verify-jwt` CLI flag only | `config.toml [functions.X] verify_jwt = false` | Supabase CLI 1.x+ | `config.toml` is reproducible; flag at deploy time is error-prone |
| Cache all API calls in SW | Exclude REST + auth endpoints | Security audit (this project, Jan 2026) | Auth exclusion was already done; REST exclusion needed for subscription state |

**Deprecated/outdated:**
- `supabase secrets set` with `--env-file` was added in recent CLI versions — use for bulk secret setup if available, but `supabase secrets set KEY=value` is always safe.

---

## Open Questions

1. **`crypto.subtle.timingSafeEqual` availability in Deno 1.x**
   - What we know: `timingSafeEqual` is documented in Deno std (`deno.land/std/crypto`) as a non-WebCrypto extension. Some sources suggest it's also available on `crypto.subtle` in newer Deno versions.
   - What's unclear: Whether `crypto.subtle.timingSafeEqual` (global) is available in Deno 1.x (config.toml `deno_version = 1`) without the std import.
   - Recommendation: Import explicitly from `https://deno.land/std/crypto/timing_safe_equal.ts` to avoid version ambiguity. This is the safer path.

2. **parent_subscriptions.status column type**
   - What we know: Migration `20260226000001` created the column. Phase 12 SUMMARY says LS status strings match the DB column.
   - What's unclear: Whether the column is `TEXT` (accepts any string) or has a `CHECK` constraint listing valid values. If CHECK constraint, its list must include all LS status strings.
   - Recommendation: Read `20260226000001_add_subscription_tables.sql` at plan time to verify the column definition before writing the upsert code.

3. **Cache version sequencing**
   - What we know: CONTEXT.md says bump to `pianomaster-v3`. Current sw.js uses `pianomaster-v5` (observed during research).
   - What's unclear: The CONTEXT.md was written before reviewing the actual current sw.js. The actual bump should be `pianomaster-v6`.
   - Recommendation: The planner should confirm the current CACHE_NAME value in sw.js at plan time and bump sequentially (current + 1). Do not use the v3 value from CONTEXT.md.

4. **lemon_squeezy_variant_id in subscription_plans**
   - What we know: Phase 12 Plan 01 SUMMARY states `lemon_squeezy_variant_id` is left NULL intentionally, to be populated in Phase 13 when LS variants are created in the dashboard.
   - What's unclear: Whether Phase 13 scope includes updating `subscription_plans` rows with variant IDs, or whether that is deferred to the Phase 16 checkout implementation.
   - Recommendation: The CONTEXT.md for Phase 13 does not mention updating `subscription_plans`. The upsert to `parent_subscriptions` stores `ls_variant_id` as-received from LS — no join to `subscription_plans` is needed in the webhook handler. Updating `subscription_plans.lemon_squeezy_variant_id` with real LS variant IDs is a manual setup step that belongs in `DEPLOY.md`, not Phase 13 code.

---

## Lemon Squeezy Webhook Reference

### Verified Event Names (from LS docs)

The CONTEXT.md handles 4 core lifecycle events:
- `subscription_created` → insert new row, status = LS status
- `subscription_updated` → update existing row (UPSERT by ls_subscription_id)
- `subscription_cancelled` → update status to 'cancelled'
- `subscription_expired` → update status to 'expired'

Full LS event list (others ignored with 200 response):
`subscription_created`, `subscription_updated`, `subscription_cancelled`,
`subscription_resumed`, `subscription_expired`, `subscription_paused`,
`subscription_unpaused`, `subscription_payment_success`,
`subscription_payment_failed`, `subscription_payment_recovered`,
`subscription_payment_refunded`

### LS Retry Behavior (verified from docs)

- **Success response:** HTTP 200
- **Retry trigger:** Any non-200 response
- **Total attempts:** 4 (1 initial + 3 retries)
- **Retry delays:** 5 seconds, 25 seconds, 125 seconds (exponential backoff)
- **After 4 failures:** No automatic retry; can manually resend from LS dashboard
- **Implication:** Return 500 for transient DB errors (encourages retry). Return 200 for permanent issues like unknown student_id (stops wasteful retries).

### LS Webhook Headers

```
POST /functions/v1/lemon-squeezy-webhook
Content-Type: application/json
X-Event-Name: subscription_created
X-Signature: <hmac-sha256-hex>
```

### LS Payload Structure

```json
{
  "meta": {
    "event_name": "subscription_created",
    "custom_data": {
      "student_id": "<uuid>"
    }
  },
  "data": {
    "type": "subscriptions",
    "id": "<ls-subscription-id>",
    "attributes": {
      "status": "active",
      "customer_id": 12345,
      "variant_id": 67890,
      "user_email": "parent@example.com",
      "renews_at": "2026-03-27T00:00:00.000000Z",
      "ends_at": null,
      "cancelled": false
    }
  }
}
```

---

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json` (field absent = false). Skip this section.

---

## Sources

### Primary (HIGH confidence)
- `https://docs.lemonsqueezy.com/help/webhooks/signing-requests` — HMAC-SHA256, X-Signature header, hex encoding, raw body requirement
- `https://docs.lemonsqueezy.com/help/webhooks/webhook-requests` — retry count (4 total), backoff delays (5s/25s/125s), 200 = success
- `https://docs.lemonsqueezy.com/help/webhooks/event-types` — complete list of subscription event names
- `https://docs.lemonsqueezy.com/guides/developer-guide/taking-payments#passing-custom-data` — `meta.custom_data` field path for student_id
- `https://docs.lemonsqueezy.com/api/subscriptions/retrieve-subscription` — subscription attribute field names (customer_id, variant_id, status, user_email, renews_at)
- `https://docs.deno.com/examples/hmac_generate_verify/` — WebCrypto HMAC generate/verify pattern in Deno
- `https://supabase.com/docs/guides/functions/secrets` — `supabase secrets set`, `Deno.env.get()`, auto-injected SUPABASE_SERVICE_ROLE_KEY
- `https://supabase.com/docs/guides/functions/function-configuration` — `config.toml [functions.X] verify_jwt = false`
- `https://supabase.com/docs/guides/functions/examples/stripe-webhooks` — `req.text()` before parse, 400 on signature failure pattern
- `C:/Users/pagis/OneDrive/WebDev/Projects/MainPianoApp2/PianoApp2/public/sw.js` — current CACHE_NAME value (`pianomaster-v5`), existing auth exclusion pattern, RUNTIME_CACHE_PATTERNS
- `C:/Users/pagis/OneDrive/WebDev/Projects/MainPianoApp2/PianoApp2/supabase/config.toml` — `deno_version = 1`, project_id, no existing `[functions.*]` sections
- `.planning/phases/12-database-schema-and-rls/12-01-SUMMARY.md` — `parent_subscriptions` schema, auto-injected Supabase secrets, migration delivery method
- `.planning/phases/12-database-schema-and-rls/12-VERIFICATION.md` — confirmed table structure, RLS policies, service role bypass behavior

### Secondary (MEDIUM confidence)
- WebSearch: Supabase Edge Function service role key 2026 — confirmed `SUPABASE_SERVICE_ROLE_KEY` env var, service role bypasses RLS, Node.js 20+ for CLI
- `https://supabase.com/docs/guides/functions/quickstart` — general deploy pattern, `Deno.env.get()` usage
- `https://docs.lemonsqueezy.com/help/webhooks` — overview of webhook configuration, simulate webhook events feature in sandbox

### Tertiary (LOW confidence)
- WebSearch: `crypto.subtle.timingSafeEqual` availability — mentioned in search results but not verified via official Deno docs; use explicit std import instead

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Deno/Supabase/WebCrypto all verified via official docs; LS payload structure verified via API docs
- Architecture: HIGH — Pattern 1 (raw body first) verified in Supabase Stripe example; UPSERT idempotency is standard Postgres; service role client is proven in existing send-consent-email function
- Pitfalls: HIGH — Body consumption and timingSafeEqual length check are documented gotchas; status mapping and student_id issues are logic analysis from CONTEXT.md constraints
- Open questions: MEDIUM — Three genuinely open items flagged with honest uncertainty and mitigations

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (30 days — Supabase and LS APIs are stable, Deno 1.x config won't change)
