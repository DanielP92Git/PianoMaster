# Phase 16: Backend & Email Infrastructure - Research

**Researched:** 2026-03-22
**Domain:** Supabase Edge Functions (Deno), Brevo transactional email API, PostgreSQL RLS
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `verify_jwt = true` in config.toml — Supabase handles JWT verification automatically (same pattern as `create-checkout` and `cancel-subscription`)
- **D-02:** CORS whitelist pattern from `send-consent-email` — allow `testpianomaster.netlify.app` and `localhost:5174`
- **D-03:** POST-only handler with OPTIONS preflight, matching all existing Edge Function patterns
- **D-04:** Server rejects if `type` is not one of `bug`, `suggestion`, `other` (lowercase enum)
- **D-05:** Server rejects if `message` length < 10 or > 1000 characters (after trimming)
- **D-06:** All validation failures return 400 with a generic `{ success: false, error: "..." }` shape
- **D-07:** New `feedback_submissions` table tracking per-user submissions (not reusing `rate_limits` table)
- **D-08:** Rate check via row count: `SELECT COUNT(*) FROM feedback_submissions WHERE student_id = $1 AND created_at > NOW() - INTERVAL '1 hour'` — simpler than token-bucket
- **D-09:** 429 response when limit exceeded with `{ success: false, error: "rate_limit" }`
- **D-10:** RLS on `feedback_submissions`: authenticated users can INSERT own rows only; no SELECT/UPDATE/DELETE from client (service role reads for rate check inside Edge Function)
- **D-11:** Plain text-style email (no branded HTML template) — scannable over pretty
- **D-12:** Subject line format: `[Bug] PianoMaster Feedback` / `[Suggestion] PianoMaster Feedback` / `[Other] PianoMaster Feedback`
- **D-13:** Email body includes: feedback type, message text, truncated student ID (first 8 chars of UUID), app version, submission timestamp (UTC)
- **D-14:** Sent TO the support Gmail (same as SENDER_EMAIL), FROM the same address
- **D-15:** First 8 characters of the student UUID in the email body
- **D-16:** No student name, email, or other PII in the feedback email body
- **D-17:** Client sends `version` field in the request body — sourced from `package.json` version at build time via Vite's `define` config or import
- **D-18:** Version is optional — if missing, email shows "unknown". Server does not reject missing version.
- **D-19:** Single env var change: update `SENDER_EMAIL` on Supabase dashboard to the new support Gmail address
- **D-20:** Pre-requisite: new Gmail must be added and verified as a sender in Brevo before updating the env var
- **D-21:** After env var update, manually trigger a test consent email and verify weekly report still sends — all 3 email functions read the same `SENDER_EMAIL` env var
- **D-22:** Rollback plan: revert `SENDER_EMAIL` env var to previous value if any email delivery fails

### Claude's Discretion

- Exact table schema for `feedback_submissions` (columns, indexes)
- Edge Function error handling and logging patterns
- Brevo API timeout duration
- Whether to use service_role for rate check or RLS-based approach
- Migration file naming and ordering

### Deferred Ideas (OUT OF SCOPE)

- In-app DB storage of feedback (if volume warrants) — future enhancement
- Auto-reply confirmation email to user — explicitly out of scope for v1
- File/screenshot attachment support — out of scope
- Honeypot field processing — Phase 17 (client-side field, but server could validate)

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BACK-01 | Supabase Edge Function receives form submissions and sends via Brevo API | send-consent-email pattern: Deno.serve + AbortController timeout + Brevo /v3/smtp/email POST |
| BACK-02 | Email includes feedback type, message, student ID (anonymized), and app version | D-12 through D-18 specify email content; user ID from JWT via supabase.auth.getUser() |
| MAIL-01 | Brevo SENDER_EMAIL updated to new shared support Gmail | D-19/D-20: Brevo sender verification + Supabase env var update (dashboard only) |
| MAIL-02 | Existing transactional emails continue working with new sender | D-21/D-22: all 3 email functions share SENDER_EMAIL env var; manual smoke test required |
| SPAM-01 | Edge Function requires valid Supabase JWT (rejects unauthenticated requests) | D-01: verify_jwt = true in config.toml; pattern confirmed in create-checkout and cancel-subscription |
| SPAM-02 | Rate limiting enforced at database level (max 3 submissions per hour per user) | D-07/D-08: feedback_submissions row-count pattern; service role client for rate check inside function |
| SPAM-04 | Server-side input validation (min 10 chars, max 1000 chars, type must be valid enum) | D-04/D-05/D-06: validation before Brevo call, 400 on failure |

</phase_requirements>

## Summary

Phase 16 creates a single new Supabase Edge Function (`send-feedback`) and one new migration (`feedback_submissions` table), then updates one env var on the Supabase dashboard. Every technical pattern needed is already present in the codebase and has been battle-tested in production.

The function mirrors `create-checkout` for JWT-authenticated structure and mirrors `send-consent-email` for Brevo API invocation. The rate limiting mirrors the spirit of `rate_limits` but uses a simpler row-count approach (D-08) rather than a token-bucket, appropriate for the low-volume feedback use case. The SENDER_EMAIL migration is pure configuration — no code changes to existing functions.

The phase has zero net-new technical dependencies. All patterns, env vars, and library calls are already in production use. The main risk is the SENDER_EMAIL sender verification workflow in Brevo (an external manual step) blocking deployment of the full function. Research recommends completing the Brevo sender verification before writing any code so that end-to-end email testing is possible during implementation.

**Primary recommendation:** Build `send-feedback` by compositing the CORS+validation pattern from `send-consent-email` with the JWT-extraction pattern from `create-checkout`, then add the row-count rate check using a service role client.

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Supabase Edge Functions (Deno) | Deno 1 (per config.toml) | Serverless function host | Already used for all 9 existing functions |
| `@supabase/supabase-js` | `2` (via `https://esm.sh/@supabase/supabase-js@2`) | DB access + auth.getUser() inside function | Same import used in create-checkout and send-weekly-report |
| Brevo SMTP API (`/v3/smtp/email`) | v3 | Transactional email delivery | Already integrated; BREVO_API_KEY already configured |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `AbortController` (built-in Deno) | Brevo request timeout | Wrap all Brevo fetch calls — established pattern in send-consent-email (30s timeout) |
| PostgreSQL `COUNT(*)` window query | Row-count rate limiting | Rate check inside Edge Function using service role client |
| Vite `define` config | Expose `package.json` version to client | `__APP_VERSION__` global constant injected at build time |

### No New Dependencies

No new npm packages or Deno modules are needed. This phase adds no new env vars (BREVO_API_KEY and SENDER_EMAIL already exist).

**Installation:** None required.

## Architecture Patterns

### Edge Function Structure (send-feedback)

Pattern composited from two existing functions:

```
supabase/functions/send-feedback/
└── index.ts     # Single-file function (self-contained, no shared modules)
```

```typescript
// Source: composited from create-checkout/index.ts + send-consent-email/index.ts

// 1. CORS headers (copy from send-consent-email)
const ALLOWED_ORIGINS = ['https://testpianomaster.netlify.app', 'http://localhost:5174'];
function getCorsHeaders(req: Request) { ... }

// 2. Deno.serve entry point
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // 3. OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // 4. POST-only guard
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  // 5. Extract user from JWT (verify_jwt = true means Supabase already validated it,
  //    but we still need auth.uid() for rate limiting — use user client pattern)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }
  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await supabaseUser.auth.getUser();
  // user.id is the authenticated student_id

  // 6. Parse + validate body
  const { type, message, version } = await req.json();
  const VALID_TYPES = ['bug', 'suggestion', 'other'];
  const trimmed = (message ?? '').trim();
  // 400 if type invalid or trimmed length < 10 or > 1000

  // 7. Rate check via service role (D-10: service role bypasses RLS)
  const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  // SELECT COUNT(*) FROM feedback_submissions WHERE student_id = user.id AND created_at > NOW() - INTERVAL '1 hour'
  // 429 if count >= 3

  // 8. Insert row to feedback_submissions (service role or anon — INSERT RLS allows own rows)
  // (Use service role client already open — consistent, avoids second client)

  // 9. Brevo call with AbortController (30s timeout)
  // Plain text email body, subject [Type] PianoMaster Feedback

  // 10. Return { success: true }
});
```

### JWT Extraction Pattern (from create-checkout)

When `verify_jwt = true` is set, Supabase validates the JWT before the function runs — but the function still needs `user.id` to enforce per-user rate limiting. The established pattern:

```typescript
// Source: create-checkout/index.ts lines 54-69
const authHeader = req.headers.get('Authorization');
const supabaseUser = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  { global: { headers: { Authorization: authHeader } } }
);
const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
if (authError || !user) {
  return jsonResponse({ error: 'Unauthorized' }, 401);
}
// user.id is now available for rate limiting
```

### Rate Check Pattern (service role row count)

```typescript
// Service role client (already initialized for insert step)
const supabaseService = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Count submissions in the last hour
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const { count, error: countError } = await supabaseService
  .from('feedback_submissions')
  .select('*', { count: 'exact', head: true })
  .eq('student_id', user.id)
  .gt('created_at', oneHourAgo);

if ((count ?? 0) >= 3) {
  return jsonResponse({ success: false, error: 'rate_limit' }, 429);
}
```

### Brevo Plain Text Email Pattern

Feedback emails go to the developer inbox (same address as sender), not to parents. No HTML template needed:

```typescript
// Source: send-consent-email/index.ts pattern, adapted for plain text
const typeLabel = type.charAt(0).toUpperCase() + type.slice(1); // "Bug", "Suggestion", "Other"
const studentPrefix = user.id.substring(0, 8);
const timestamp = new Date().toISOString();
const appVersion = version ?? 'unknown';

const emailBody = [
  `Type: ${typeLabel}`,
  `Student: ${studentPrefix}...`,
  `Version: ${appVersion}`,
  `Submitted: ${timestamp}`,
  '',
  '--- Message ---',
  trimmed,
].join('\n');

// Brevo send (same endpoint, same auth, same AbortController pattern)
// sender and to both use SENDER_EMAIL — feedback loops to the same inbox
```

### config.toml Entry

```toml
[functions.send-feedback]
# Called by authenticated browser clients — Supabase verifies the JWT automatically.
verify_jwt = true
```

### Migration Pattern (feedback_submissions table)

Migration naming follows `YYYYMMDDNNNNNN_description.sql`. Next available date-ordered name after `20260321000001_account_deletion_log.sql`:

```sql
-- File: 20260322000001_add_feedback_submissions.sql

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for rate check query (the only query this table serves)
CREATE INDEX idx_feedback_submissions_student_created
  ON feedback_submissions(student_id, created_at DESC);

ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Students can INSERT their own rows (used by Edge Function via service role,
-- but RLS allows authenticated user too — defense in depth)
CREATE POLICY "Students can insert own feedback"
  ON feedback_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- No SELECT/UPDATE/DELETE policies for clients (D-10)
-- Service role bypasses RLS for rate check COUNT query

GRANT INSERT ON feedback_submissions TO authenticated;

COMMENT ON TABLE feedback_submissions IS
  'Tracks feedback form submissions for rate limiting. Message content is not stored — sent via Brevo only.';
```

### App Version Exposure (Vite define)

The current `vite.config.js` does not yet inject `APP_VERSION`. The standard pattern for this project:

```javascript
// vite.config.js addition
import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // ... existing config
});
```

Client usage (in the form component, Phase 17):
```javascript
const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown';
```

Note: `package.json` currently shows `"version": "0.0.0"`. This value will be sent as-is — it is informational and the server accepts any string (D-18).

### Anti-Patterns to Avoid

- **Shared utility modules across Edge Functions:** Edge Functions are self-contained — copy `getCorsHeaders()` into the new function rather than trying to import from a shared path. The existing 9 functions all duplicate this helper intentionally.
- **Using the anon client for the rate check:** The anon client respects RLS, and D-10 specifies no SELECT policy for clients. Use the service role client for the COUNT query.
- **Sending the full student UUID in the email body:** D-15 specifies first 8 chars only (`user.id.substring(0, 8)`).
- **Rejecting missing `version` field:** D-18 explicitly allows missing version — use fallback `'unknown'`.
- **HTML email for feedback:** D-11 specifies plain text-style. The Brevo API `textContent` field or a minimal HTML wrapper with no styling is sufficient.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT verification | Manual JWT decode/verify | `verify_jwt = true` in config.toml | Supabase handles verification before function runs; only need `getUser()` to extract `user.id` |
| Email delivery | SMTP client in Deno | Brevo REST API (`/v3/smtp/email`) | Already integrated, API key configured, sender verified |
| Rate limiting algorithm | Token bucket, leaky bucket, Redis | PostgreSQL `COUNT(*)` with timestamp window | Sufficient for 3/hour limit; no additional infrastructure needed |
| CORS handling | Per-method logic | `getCorsHeaders(req)` pattern | Established pattern; copy from send-consent-email |

**Key insight:** Every mechanism needed already exists in production. This phase is pure composition — no net-new patterns.

## Common Pitfalls

### Pitfall 1: Brevo Sender Not Verified Before Dev
**What goes wrong:** The Edge Function is complete and deployed but Brevo returns 401 or sender rejection on every email send because the new Gmail hasn't been verified in the Brevo account.
**Why it happens:** Brevo requires sender verification before transactional emails can come from that address.
**How to avoid:** Complete the Brevo sender verification step (D-20) as the very first task, before writing any code. The verification can take minutes but requires manual browser steps in the Brevo dashboard.
**Warning signs:** Brevo API returns `{"code":"unauthorized"}` or `{"code":"invalid_parameter","message":"...sender..."}` in logs.

### Pitfall 2: Rate Check Using Wrong Client
**What goes wrong:** Rate check uses the anon/user client and returns 0 rows regardless of actual submissions, because there is no SELECT RLS policy on `feedback_submissions` for authenticated users.
**Why it happens:** D-10 explicitly restricts client reads. The SELECT COUNT query must use the service role client.
**How to avoid:** Initialize the service role client once at the top of the handler and reuse it for both the rate check and the insert.
**Warning signs:** Rate limiting never triggers even after multiple rapid submissions.

### Pitfall 3: SENDER_EMAIL Update Breaks Existing Emails
**What goes wrong:** After updating SENDER_EMAIL in Supabase dashboard, one of the three email functions (consent, weekly report, process-account-deletions) silently fails because the new Gmail address wasn't verified in Brevo before the env var was changed.
**Why it happens:** All three functions read the same `SENDER_EMAIL` env var with no fallback. D-20 and D-21 require verification before the update, and smoke testing after.
**How to avoid:** Verify sender in Brevo first (D-20), update env var, immediately trigger a test consent email (D-21), check send-weekly-report logs on next cron run.
**Warning signs:** Consent emails stop arriving; Brevo logs show sender rejection.

### Pitfall 4: `auth.getUser()` Called Without Authorization Header
**What goes wrong:** Function crashes or returns unexpected 500 when `authHeader` is null, even though `verify_jwt = true` should prevent unauthenticated requests from reaching the handler.
**Why it happens:** `verify_jwt = true` rejects requests at the Supabase gateway, but local development (`supabase functions serve`) may not enforce this. The function should still guard against null header for local dev safety.
**How to avoid:** Keep the `if (!authHeader)` guard at the top (copy from create-checkout pattern). This is a cheap defensive check.
**Warning signs:** 500 errors in local dev with no Authorization header.

### Pitfall 5: Race Condition in Rate Check
**What goes wrong:** Two simultaneous submissions from the same user both pass the COUNT check (both see count=2 before either inserts), allowing a burst of 4+ submissions.
**Why it happens:** Non-atomic read-then-insert. The existing `check_rate_limit` function uses advisory locks to prevent this, but the simpler COUNT approach has no lock.
**Why it's acceptable:** D-08 explicitly chose the simpler row-count approach because "volume is tiny." The 3/hour limit for a children's feedback form does not warrant advisory lock complexity. A brief race window at exactly 3 submissions is an acceptable edge case.
**Warning signs:** None needed — documented design tradeoff.

## Code Examples

### jsonResponse Helper (from create-checkout)

```typescript
// Source: create-checkout/index.ts lines 36-41
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

Note: `corsHeaders` must be in scope (captured from `getCorsHeaders(req)` at top of handler).

### Brevo Call with AbortController Timeout

```typescript
// Source: send-consent-email/index.ts lines 244-271
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

try {
  const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: SENDER_EMAIL }],     // feedback loops to same inbox (D-14)
      subject: `[${typeLabel}] PianoMaster Feedback`,
      textContent: emailBody,            // plain text, not htmlContent (D-11)
    }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!brevoResponse.ok) {
    const errorData = await brevoResponse.json().catch(() => ({}));
    console.error('send-feedback: Brevo error', brevoResponse.status, JSON.stringify(errorData));
    return jsonResponse({ success: false, error: 'Email delivery failed' }, 500);
  }
} catch (fetchError) {
  clearTimeout(timeoutId);
  if (fetchError.name === 'AbortError') {
    return jsonResponse({ success: false, error: 'Email service timeout' }, 504);
  }
  throw fetchError;
}
```

### Brevo Sender Verification (Manual Step)

Navigate to: `https://app.brevo.com/senders/list`
- Click "Add a new sender"
- Enter the new support Gmail address
- Brevo sends a verification email to that Gmail
- Click the verification link in Gmail
- Sender is now authorized — SENDER_EMAIL env var can be updated

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Token-bucket rate limiting | Row-count window check | Decision D-08 (2026-03-22) | Simpler, no advisory lock needed at low volume |
| HTML branded email | Plain text email | Decision D-11 (2026-03-22) | Developer inbox; scannable over pretty |

**No deprecated patterns apply:** All patterns used in this phase are current and in production use in this codebase.

## Open Questions

1. **`package.json` version is `0.0.0`**
   - What we know: D-17 says client sends version; D-18 says missing version shows "unknown" and server doesn't reject.
   - What's unclear: Whether the version will ever be bumped to a meaningful value in this project.
   - Recommendation: Implement version injection as specified (D-17); the `0.0.0` value is informational and acceptable for diagnostic purposes. Planner should note that `vite.config.js` needs the `define` addition.

2. **`process-account-deletions` function also reads SENDER_EMAIL**
   - What we know: D-21 mentions "all 3 email functions" but CONTEXT.md lists it by name alongside consent and weekly report.
   - What's unclear: Whether `process-account-deletions` actually sends email or just uses the variable for something else.
   - Recommendation: The verification task (MAIL-02) should explicitly list all three functions to smoke-test, not just the two mentioned in D-21.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run src/services/__tests__/` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SPAM-01 | Edge Function rejects unauthenticated POST (no JWT) | Manual smoke | `curl -X POST https://<project>.functions.supabase.co/send-feedback` → expect 401 | N/A (Edge Function) |
| SPAM-02 | Rate limit blocks 4th submission within 1 hour | Manual smoke | 4 successive curl POSTs with valid JWT → 4th returns 429 | N/A (Edge Function) |
| SPAM-04 | Validation rejects short message (< 10 chars) | Manual smoke | POST with `{"type":"bug","message":"hi"}` → expect 400 | N/A (Edge Function) |
| SPAM-04 | Validation rejects invalid type enum | Manual smoke | POST with `{"type":"invalid","message":"valid message here"}` → expect 400 | N/A (Edge Function) |
| BACK-01 | Valid POST delivers email to support inbox | Manual smoke | POST with valid JWT + valid body → email arrives in Gmail | N/A (Edge Function) |
| BACK-02 | Email body contains type, message, student prefix, version | Manual smoke | Inspect received email | N/A (Edge Function) |
| MAIL-01 | Brevo sender updated to new Gmail | Manual check | Brevo dashboard → senders list shows new address verified | N/A (config) |
| MAIL-02 | Consent email still arrives from new sender | Manual smoke | Trigger consent email via app flow → check inbox | N/A (integration) |

**Note on Edge Function testing:** Vitest (jsdom environment) cannot invoke Supabase Edge Functions directly. All SPAM-*/BACK-*/MAIL-* requirements for this phase are validated via manual curl smoke tests against the deployed function. This is consistent with how existing Edge Functions are tested in this project — there are no automated tests for any existing Edge Function.

### Sampling Rate

- **Per task commit:** No automated test (manual smoke applies)
- **Per wave merge:** Run full Vitest suite (`npx vitest run`) to confirm no regressions in existing client code
- **Phase gate:** All manual smoke tests passing + full Vitest suite green before `/gsd:verify-work`

### Wave 0 Gaps

- No new test files needed — Edge Functions use manual smoke testing (consistent with project precedent)
- `vite.config.js` must add `define: { __APP_VERSION__: JSON.stringify(pkg.version) }` — this is a code change, not a test gap

## Sources

### Primary (HIGH confidence)

- `supabase/functions/send-consent-email/index.ts` — CORS pattern, Brevo API call, AbortController timeout, error response shapes — read directly
- `supabase/functions/create-checkout/index.ts` — JWT extraction via getUser(), jsonResponse helper, POST-only guard — read directly
- `supabase/functions/send-weekly-report/index.ts` — service role client initialization pattern — read directly
- `supabase/migrations/20260201000002_add_rate_limiting.sql` — RLS policy structure, index patterns, GRANT syntax for this codebase — read directly
- `supabase/config.toml` lines 306-338 — `verify_jwt` per-function configuration — read directly
- `supabase/functions/.env.example` — confirmed BREVO_API_KEY and SENDER_EMAIL already exist, no new env vars needed — read directly
- `package.json` — confirmed `"version": "0.0.0"`, no existing `__APP_VERSION__` define — read directly
- `vite.config.js` — confirmed no existing `define` block; needs addition — read directly

### Secondary (MEDIUM confidence)

- Brevo API documentation pattern (`/v3/smtp/email` with `textContent` field) — inferred from existing `htmlContent` usage in send-consent-email; `textContent` is the plain-text equivalent field in the same API request schema

### Tertiary (LOW confidence)

- None — all findings verified from authoritative project source files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in production use, versions confirmed from package.json and existing imports
- Architecture patterns: HIGH — all patterns copied directly from existing production Edge Functions
- Rate limiting design: HIGH — confirmed from CONTEXT.md D-07/D-08 decisions and existing rate_limits migration as structural reference
- Email delivery: HIGH — Brevo API confirmed from send-consent-email; textContent field is MEDIUM (inferred from htmlContent sibling field)
- Migration schema: HIGH — column types, RLS structure, index syntax confirmed from existing migrations
- Pitfalls: HIGH — all pitfalls derived from reading actual code paths and documented decisions

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable domain — Supabase Edge Functions and Brevo API are not fast-moving)
