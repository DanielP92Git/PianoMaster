# Phase 5: Subscription Re-Pointing - Pattern Map

**Mapped:** 2026-08-05
**Files analyzed:** 20 (11 new, 9 modified)
**Analogs found:** 20 / 20 (one schema unknown flagged — see "Unknowns" section)

## File Classification

| New/Modified File                                                                                                                                                                     | Role                                  | Data Flow                                      | Closest Analog                                                                                                                                                                                             | Match Quality                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `supabase/functions/lemon-squeezy-webhook/lib/resolveParent.ts`                                                                                                                       | service (pure lib module)             | request-response / CRUD-lookup                 | `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts`                                                                                                                                       | exact (same file, same convention)                                       |
| `supabase/functions/lemon-squeezy-webhook/lib/deadLetter.ts`                                                                                                                          | service (pure lib module)             | event-driven / audit-write                     | `supabase/functions/process-account-deletions/index.ts` (insert block) + `supabase/migrations/20260321000001_account_deletion_log.sql` (table shape)                                                       | role-match (write pattern is inline in analog, not factored into `lib/`) |
| `supabase/functions/lemon-squeezy-webhook/lib/extractPayload.ts` (MODIFY)                                                                                                             | service (pure lib module)             | transform                                      | itself (in-place edit)                                                                                                                                                                                     | exact                                                                    |
| `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` (MODIFY)                                                                                                         | service (pure lib module)             | CRUD                                           | itself (in-place edit)                                                                                                                                                                                     | exact                                                                    |
| `supabase/functions/lemon-squeezy-webhook/index.ts` (MODIFY)                                                                                                                          | controller (Edge Function entrypoint) | request-response                               | itself (in-place edit)                                                                                                                                                                                     | exact                                                                    |
| `supabase/functions/create-checkout/index.ts` (MODIFY)                                                                                                                                | controller (Edge Function entrypoint) | request-response                               | itself (in-place edit); cross-ref `cancel-subscription/index.ts` for CORS/JWT boilerplate                                                                                                                  | exact                                                                    |
| `supabase/functions/cancel-subscription/index.ts` (MODIFY)                                                                                                                            | controller (Edge Function entrypoint) | request-response                               | itself (in-place edit); needs a new pure-extraction module (see below)                                                                                                                                     | exact                                                                    |
| a pure extraction of cancel-subscription's "select→classify→decide" logic (e.g. `supabase/functions/cancel-subscription/lib/selectActiveSubscription.ts`, discretion)                 | service (pure lib module)             | transform                                      | `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` (injectable-client convention)                                                                                                        | role-match (net-new factoring in a currently-monolithic function)        |
| `supabase/migrations/2026080XXXXXXX_add_parent_subscriptions_parent_id.sql`                                                                                                           | migration                             | schema-change / CRUD-backfill                  | `supabase/migrations/20260803120000_add_parent_age_verified.sql` (up/down pairing, `BEGIN...COMMIT`) + `supabase/migrations/20260404000001_ensure_subscription_rls.sql` (idempotent policy/function shape) | exact                                                                    |
| `supabase/migrations/2026080XXXXXXX_add_parent_subscriptions_parent_id.down.sql`                                                                                                      | migration                             | schema-change (reversal)                       | `supabase/migrations/20260803120000_add_parent_age_verified.down.sql`                                                                                                                                      | exact                                                                    |
| new/extended `unresolved_webhook_log` DDL (inline in the forward migration above, not a separate file)                                                                                | migration (table DDL)                 | event-driven / audit                           | `supabase/migrations/20260321000001_account_deletion_log.sql` + `supabase/migrations/20260326000001_fix_security_linter_warnings.sql` (deny-all RLS)                                                       | exact                                                                    |
| `05-rehearsal-runbook.sql`                                                                                                                                                            | test (manual DB harness)              | batch / transform                              | `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-rehearsal-runbook.sql`                                                                                                                  | exact                                                                    |
| `05-webhook-replay.mjs`                                                                                                                                                               | test (standalone Node script)         | event-driven (HTTP POST)                       | `supabase/functions/lemon-squeezy-webhook/lib/verifySignature.ts` (algorithm) + `src/services/__tests__/webhookLogic.test.js`'s `verifySignatureNode`/`computeValidSignature` helpers                      | exact (algorithm); RESEARCH.md already has a full skeleton               |
| `05-fk-checklist.md`-style owner sign-off table (per D-11; e.g. `05-subscription-signoff.md`)                                                                                         | doc (sign-off artifact)               | batch                                          | `.planning/phases/01-identity-schema-expand/01-fk-checklist.md`                                                                                                                                            | exact                                                                    |
| `src/services/subscriptionService.js` (MODIFY: `fetchSubscriptionStatus`)                                                                                                             | service                               | CRUD (read, multi-row)                         | itself (in-place edit); SQL parity source: `has_active_subscription()` body in `20260404000001_ensure_subscription_rls.sql`                                                                                | exact                                                                    |
| `src/services/subscriptionService.js` (MODIFY: `fetchSubscriptionDetail`)                                                                                                             | service                               | CRUD (read, multi-row + fallback)              | itself (in-place edit)                                                                                                                                                                                     | exact                                                                    |
| `src/contexts/SubscriptionContext.jsx` (MODIFY)                                                                                                                                       | provider (React context)              | pub-sub (Realtime)                             | itself (in-place edit)                                                                                                                                                                                     | exact                                                                    |
| `src/pages/SubscribePage.jsx` (MODIFY)                                                                                                                                                | component/page                        | request-response (Edge Fn invoke)              | itself (in-place edit)                                                                                                                                                                                     | exact                                                                    |
| `src/pages/ParentPortalPage.jsx` (MODIFY)                                                                                                                                             | component/page                        | CRUD (read) + request-response (cancel invoke) | itself (in-place edit)                                                                                                                                                                                     | exact                                                                    |
| `src/pages/SubscribeSuccessPage.jsx` (MODIFY)                                                                                                                                         | component/page                        | CRUD (query invalidation only)                 | itself (in-place edit)                                                                                                                                                                                     | exact                                                                    |
| new/extended tests: `src/services/__tests__/webhookLogic.test.js` (extend), `src/services/__tests__/subscriptionService.test.js` (extend), new `resolveParent`/dead-letter test block | test                                  | unit (pure function)                           | both files exist and are read in full below                                                                                                                                                                | exact                                                                    |
| `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-phase8-handoff.md` (MODIFY — append)                                                                               | doc                                   | batch                                          | itself (append pattern already established: dated `##` sections)                                                                                                                                           | exact                                                                    |

## Pattern Assignments

### `supabase/functions/lemon-squeezy-webhook/lib/resolveParent.ts` (service, request-response/CRUD-lookup)

**Analog:** `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` (sibling module in the same directory — copy its conventions exactly, not just its "shape")

**Imports pattern** (upsertSubscription.ts lines 1-4):

```typescript
// Takes an injected Supabase client — does NOT create its own client.
// This makes the function testable without Deno environment.

import type { WebhookPayload } from "./extractPayload.ts";
```

`resolveParent.ts` needs **no import** at all (it doesn't consume `WebhookPayload` — it takes a raw candidate id string) — match `extractPayload.ts`'s "zero imports" header comment style instead:

```typescript
// Pure function — zero imports
```

**Signature/injection convention** (upsertSubscription.ts lines 20-23, JSDoc lines 6-19):

```typescript
/**
 * @param supabase - A Supabase client initialized with SUPABASE_SERVICE_ROLE_KEY
 * @param payload  - The whitelisted webhook payload from extractPayload()
 * @throws If the upsert fails (caller handles HTTP 500 response + LS retry)
 */
export async function upsertSubscription(
  supabase: any,
  payload: WebhookPayload
): Promise<void> {
```

`resolveParent` must mirror this exact style: `supabase: any` as first param (matches this codebase's convention — no `SupabaseClient<Database>` typing anywhere in this dir), JSDoc block above the export, `async function`, injected client never created inside the module.

**Core resolve-chain pattern** — RESEARCH.md already produced the exact target implementation (§Pattern 1, verified against this file's conventions):

```typescript
export async function resolveParent(
  supabase: any,
  candidateId: string | undefined
): Promise<{ parentId: string } | { unresolved: true }> {
  if (!candidateId) return { unresolved: true };

  // Probe 1: does this id already identify a parent?
  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("id", candidateId)
    .maybeSingle();
  if (parent) return { parentId: parent.id };

  // Probe 2: legacy shape — is this a child_profiles.id with a resolvable parent_id?
  const { data: child } = await supabase
    .from("child_profiles")
    .select("parent_id")
    .eq("id", candidateId)
    .maybeSingle();
  if (child?.parent_id) return { parentId: child.parent_id };

  // Both probes missed, or child.parent_id is NULL (teacher-owned, parent-less profile)
  return { unresolved: true };
}
```

Note `upsertSubscription.ts`'s error-handling convention (lines 48-51) — it does **not** swallow errors from its `.select()...maybeSingle()` plan lookup (only destructures `data`, ignoring `error`, matching the "defensive — handles unknown variant IDs" comment at line 25). `resolveParent` should follow the same "ignore lookup error, treat as miss" posture for both probes — a transient DB error on the lookup falls through to `{ unresolved: true }`, which is the safe (loud, dead-lettered) failure mode, not a thrown exception.

---

### `supabase/functions/lemon-squeezy-webhook/lib/deadLetter.ts` (service, event-driven/audit-write) — Claude's Discretion (D-03)

**Analog for the write call:** `supabase/functions/process-account-deletions/index.ts` lines 489-495 (verified live — same file's dry-run variant at lines 346-352 is the same shape with different field values):

```typescript
const { error: auditError } = await supabase.from('account_deletion_log').insert({
  student_id_hash: studentIdHash,
  data_categories_removed: DATA_CATEGORIES_REMOVED,
  ls_subscription_cancelled: lsCancelled,
  email_status: emailStatus,
  dry_run: false,
});

if (auditError) {
  // (verified: process-account-deletions logs and continues rather than throwing —
  // an audit-write failure must not block the primary operation it's auditing)
```

**DDL to copy verbatim in shape** — `supabase/migrations/20260321000001_account_deletion_log.sql` (full file, lines 1-28):

```sql
CREATE TABLE IF NOT EXISTS account_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NO FK to students — audit record must survive student deletion
  student_id_hash TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_categories_removed TEXT[] NOT NULL,
  ls_subscription_cancelled BOOLEAN NOT NULL DEFAULT false,
  email_status TEXT NOT NULL,
  dry_run BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE account_deletion_log
  ADD CONSTRAINT account_deletion_log_email_status_check
  CHECK (email_status IN ('sent', 'failed', 'skipped'));

-- No RLS needed — only writable by Edge Function service role, never by authenticated users
```

**IMPORTANT deviation to apply for `unresolved_webhook_log`:** this precedent has **no RLS enabled at all** (comment says "No RLS needed"), but a later linter pass overturned that for other audit tables — see the deny-all fix below. RESEARCH.md's dead-letter DDL (§Code Examples "Dead-letter table DDL") already corrects for this and should be used as the actual target, not this older precedent verbatim:

```sql
CREATE TABLE IF NOT EXISTS unresolved_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_name TEXT,
  ls_subscription_id TEXT,
  attempted_id TEXT,          -- the custom_data id that failed to resolve
  raw_payload JSONB NOT NULL, -- full parsed body, for debugging an unknown shape
  resolved BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE unresolved_webhook_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_access"
  ON public.unresolved_webhook_log
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);
```

**Deny-all RLS precedent** (why `RESTRICTIVE ... USING (false)` and not "no RLS") — `supabase/migrations/20260326000001_fix_security_linter_warnings.sql` lines 16-22 is the fix that established this pattern for other RLS-enabled-no-policy audit tables; do not repeat the older "No RLS needed" comment style from `account_deletion_log` — enable RLS + deny-all from the start.

**index.ts call site for the dead-letter write** — RESEARCH.md §Pattern 2 gives the exact call shape; verified consistent with this codebase's `console.error` + still-200 convention already present in `index.ts` lines 86-92:

```typescript
const { error: dlError } = await supabase
  .from("unresolved_webhook_log")
  .insert({
    raw_payload: body,
    event_name: payload.event_name,
    ls_subscription_id: payload.ls_subscription_id,
    attempted_id: payload.parent_id ?? payload.student_id ?? null,
  });
if (dlError) console.error("Webhook: dead-letter insert failed", dlError);
return new Response("OK", { status: 200 });
```

---

### `supabase/functions/lemon-squeezy-webhook/lib/extractPayload.ts` (MODIFY)

**Analog:** itself — full current file read (52 lines). Current whitelist interface (lines 10-19):

```typescript
export interface WebhookPayload {
  event_name: string;
  student_id: string | undefined;
  ls_subscription_id: string;
  ls_customer_id: string;
  ls_variant_id: string;
  status: string;
  parent_email: string | undefined;
  current_period_end: string | undefined;
}
```

Extraction body to extend (lines 40-50) — add a `parent_id` field read the same way `student_id` is read:

```typescript
return {
  event_name: meta?.event_name as string,
  student_id: meta?.custom_data?.student_id as string | undefined,
  ls_subscription_id: data?.id as string,
  ls_customer_id: String(data?.attributes?.customer_id ?? ""),
  ls_variant_id: String(data?.attributes?.variant_id ?? ""),
  status: data?.attributes?.status as string,
  parent_email: data?.attributes?.user_email as string | undefined,
  current_period_end: data?.attributes?.renews_at as string | undefined,
};
```

Add `parent_id: meta?.custom_data?.parent_id as string | undefined` following the exact same `meta?.custom_data?.X as string | undefined` pattern (D-02: `create-checkout` will embed both keys). Update the doc-comment's "8 whitelisted fields" (line 35, and the test's `toHaveLength(8)` assertion — see test section below) to 9.

---

### `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` (MODIFY)

**Analog:** itself — full current file read (53 lines). Current upsert body (lines 32-46):

```typescript
const { error } = await supabase.from("parent_subscriptions").upsert(
  {
    student_id: payload.student_id,
    ls_subscription_id: payload.ls_subscription_id,
    ls_customer_id: payload.ls_customer_id,
    ls_variant_id: payload.ls_variant_id,
    plan_id: plan?.id ?? null,
    status: payload.status,
    current_period_end: payload.current_period_end || null,
    parent_email: payload.parent_email || null,
  },
  { onConflict: "ls_subscription_id" }
);
```

D-14 says writers target `parent_id` only (not dual-write). The resolved `parentId` from `resolveParent()` must be threaded in by the caller (`index.ts`) and this function's signature/body changed to write `parent_id: resolvedParentId` in place of (or alongside legacy-read compatibility for) `student_id`. The `onConflict: 'ls_subscription_id'` conflict target is explicitly unchanged per CONTEXT.md canonical_refs.

---

### `supabase/functions/lemon-squeezy-webhook/index.ts` (MODIFY)

**Analog:** itself — full current file read (121 lines). The guard this phase replaces (D-03) is lines 84-92:

```typescript
// 7. Guard: missing student_id means Phase 16 checkout didn't embed custom_data.
//    Return 200 (not 400/500) — LS retries cannot fix a missing student_id.
if (!payload.student_id) {
  console.error("Webhook: missing student_id in custom_data", {
    event: payload.event_name,
    ls_subscription_id: payload.ls_subscription_id,
  });
  return new Response("Missing student_id", { status: 200 });
}
```

This becomes: call `resolveParent(supabase, payload.parent_id ?? payload.student_id)` (D-01/D-02: prefer `parent_id`), branch on `unresolved` → call the dead-letter write + return 200 (per Pattern 2 above), else pass the resolved `parentId` into `upsertSubscription`. Note the service-role client is created **after** this guard today (line 96-99) — the resolve-chain needs the client created **before** it now, since `resolveParent` needs it for its two probes. Reorder: create client (step 8 today) before the guard (step 7 today).

The imports block to extend (lines 23-26):

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySignature } from "./lib/verifySignature.ts";
import { extractPayload } from "./lib/extractPayload.ts";
import { upsertSubscription } from "./lib/upsertSubscription.ts";
```

Add `import { resolveParent } from './lib/resolveParent.ts';` and the dead-letter import, following the exact same relative-path + `.ts` extension convention (Deno requires the extension).

---

### `supabase/functions/create-checkout/index.ts` (MODIFY, D-02)

**Analog:** itself — full current file read (190 lines). The `checkout_data.custom` block to extend (lines 147-151):

```typescript
checkout_data: {
  custom: {
    student_id: studentId,
  },
},
```

becomes (D-02 — both fields, both carrying the parent uid):

```typescript
checkout_data: {
  custom: {
    parent_id: studentId,   // both fields carry the same value: the caller's own auth.uid()
    student_id: studentId,  // legacy shape kept for in-flight checkouts started pre-deploy; dropped Phase 8
  },
},
```

The existing defense-in-depth check this phase does NOT need to touch (lines 86-93):

```typescript
if (user.id !== studentId) {
  console.error("create-checkout: studentId mismatch", {
    authUid: user.id,
    requestedStudentId: studentId,
  });
  return jsonResponse(
    { error: "Forbidden: studentId does not match authenticated user" },
    403
  );
}
```

CORS/JWT/error-response boilerplate (`getCorsHeaders`, `jsonResponse`, OPTIONS preflight, `supabaseUser.auth.getUser()` block) is identical across `create-checkout` and `cancel-subscription` — see the shared-pattern section below rather than re-deriving it per file.

---

### `supabase/functions/cancel-subscription/index.ts` (MODIFY, D-06)

**Analog:** itself — full current file read (150 lines). The exact bug D-06 fixes (lines 81-96):

```typescript
// 4. Fetch ls_subscription_id for the authenticated student
const { data: subscription, error: subError } = await supabaseService
  .from("parent_subscriptions")
  .select("ls_subscription_id, current_period_end")
  .eq("student_id", studentId)
  .maybeSingle(); // <-- THROWS on >1 row; must become a plain array select

if (subError) {
  console.error(
    "cancel-subscription: DB error fetching subscription",
    subError
  );
  return jsonResponse({ error: "Cancellation failed" }, 500);
}

if (!subscription) {
  console.error("cancel-subscription: no subscription found for student", {
    studentId,
  });
  return jsonResponse({ error: "No active subscription found" }, 404);
}
```

Replace with: `.eq('parent_id', studentId)` (no `.maybeSingle()`) → fetch all rows → filter to "qualifying/active" using the **same predicate** as `fetchSubscriptionStatus`'s `isQualifying` (RESEARCH.md §Pattern 3) for JS/SQL parity → branch: 0 active → existing 404 path (unchanged), 1 active → proceed to the existing LS DELETE call (lines 103-136, unchanged), >1 active → new distinct error response (discretion — see Open Question #2 in RESEARCH.md; recommend a `409` with a machine-readable `code: 'AMBIGUOUS_ACTIVE_SUBSCRIPTIONS'` field, mirroring D-03's "Sentry error + non-500 status" convention rather than the generic `{ error: 'Cancellation failed' }, 500` used elsewhere in this file).

**Recommended factoring (Wave 0 gap, RESEARCH.md explicit callout):** extract "select rows → classify active → decide" into a pure function (e.g. `supabase/functions/cancel-subscription/lib/selectActiveSubscription.ts`) so D-06's 3-branch logic (0/1/>1) is unit-testable without a live DB, following the exact `resolveParent`/`upsertSubscription` "takes an injected client, returns a plain result, no thrown side effects for expected branches" convention documented above.

---

### `src/services/subscriptionService.js` — `fetchSubscriptionStatus` (MODIFY, D-05)

**Analog:** itself — full current file read (167 lines). Current single-row logic (lines 15-65) uses `.order("created_at", { ascending: false }).limit(1).maybeSingle()` — this is the exact split-brain D-05 fixes (JS picks most-recent row; Postgres `has_active_subscription()` uses `EXISTS` over ALL rows).

**Target implementation** — RESEARCH.md §Pattern 3, cross-verified against both this file's existing per-status branches (lines 42-62) and `has_active_subscription()`'s SQL body (`20260404000001_ensure_subscription_rls.sql` lines 43-54):

```javascript
export async function fetchSubscriptionStatus(parentId) {
  if (!parentId) return { isPremium: false };
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("parent_subscriptions")
    .select("status, current_period_end")
    .eq("parent_id", parentId); // NOT .limit(1).maybeSingle() — fetch ALL rows

  if (error || !data) return { isPremium: false };

  const isQualifying = (row) => {
    if (row.status === "active" || row.status === "on_trial") return true;
    if (
      row.status === "cancelled" &&
      row.current_period_end &&
      row.current_period_end > now
    )
      return true;
    if (row.status === "past_due" && row.current_period_end) {
      const grace = new Date(
        new Date(row.current_period_end).getTime() + 3 * 86400000
      ).toISOString();
      if (grace > now) return true;
    }
    return false;
  };

  return { isPremium: data.some(isQualifying) };
}
```

Note the fail-open framing already documented in this file's JSDoc (lines 4-10: "Everything else -> isPremium: false (safe default)") — D-05's "any active row wins" is a fail-_open_ posture toward `.some()` returning true on any qualifying row, while `error` still fails closed (`isPremium: false`), matching the existing error branch (lines 30-37) unchanged.

---

### `src/services/subscriptionService.js` — `fetchSubscriptionDetail` (MODIFY, D-07)

**Analog:** itself — current implementation lines 108-160, same `.order().limit(1).maybeSingle()` pattern as above. D-07: show the active row, falling back to most-recent when none active. Fetch all rows via `.eq("parent_id", parentId)` (no limit), then: `const active = data.find(isQualifying); const chosen = active ?? data[0];` (rows are naturally most-recent-first only if an `.order("created_at", { ascending: false })` is kept on the multi-row fetch — keep that `.order()` clause, just drop `.limit(1).maybeSingle()`). The rest of the function (plan lookup block, lines 130-149, and return shape, lines 151-159) is unchanged, just operating on `chosen` instead of `data`.

---

### `src/contexts/SubscriptionContext.jsx` (MODIFY)

**Analog:** itself — full current file read (102 lines). Realtime filter to change (lines 39-52):

```javascript
const channel = supabase.channel(`subscription-changes-${userId}`).on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table: "parent_subscriptions",
    filter: `student_id=eq.${userId}`,
  },
  () => {
    queryClient.invalidateQueries({ queryKey: ["subscription", userId] });
  }
);
```

Change `filter: \`student_id=eq.${userId}\`` → `filter: \`parent_id=eq.${userId}\``(mandatory per CONTEXT.md; channel name and query key are Claude's Discretion — RESEARCH.md's Deferred Ideas section explicitly says no behavioral consequence either way, so leaving`subscription-changes-${userId}`and`["subscription", userId]`unchanged is acceptable and lower-risk). The`useQuery`call (line 26-33) passes`userId`into`fetchSubscriptionStatus(userId)`— no change needed there since the function's parameter is now semantically`parentId`but still receives`user.id` (parent uid), matching the "client is already parent-keyed by accident" integration note in CONTEXT.md.

---

### `src/pages/SubscribePage.jsx` (MODIFY, D-02 client side)

**Analog:** itself — checkout invoke at line 122: `body: { planId: checkoutPlanId, studentId: user.id }`. `create-checkout`'s request body shape is unchanged by this phase (still `{ planId, studentId }` — D-02 only changes what the _Edge Function_ embeds into `checkout_data.custom`, not what the browser sends). **No change expected here** unless the plan chooses to also send `parentId` from the client — CONTEXT.md's decisions don't require it since `create-checkout/index.ts` derives both custom-data keys server-side from the single verified `studentId`/`user.id`.

---

### `src/pages/ParentPortalPage.jsx` (MODIFY, D-06/D-07 client side)

**Analog:** itself. Detail query (line 183-188):

```javascript
const { data: detail, isLoading: detailLoading } = useQuery({
  queryKey: ["subscription-detail", user?.id],
  queryFn: () => fetchSubscriptionDetail(user?.id),
  enabled: !!user?.id,
  staleTime: 0,
});
```

No change needed to this call site — `fetchSubscriptionDetail` keeps its `(parentId)` positional signature, still fed `user?.id` (the parent uid). Cancel invoke (lines 246-274) already has zero request body (`supabase.functions.invoke("cancel-subscription")` — JWT-only, D-06's server logic change) — the only client change needed is the `catch`/error-branch handling if D-06's ambiguity response gets a distinct shape the UI should special-case (e.g. checking `data?.code === 'AMBIGUOUS_ACTIVE_SUBSCRIPTIONS'` before falling into the generic `toast.error(t("parentPortal.cancelError"))` at line 269) — Claude's Discretion per Open Question #2.

---

### `src/pages/SubscribeSuccessPage.jsx` (MODIFY)

**Analog:** itself — line 41: `queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });`. No change needed unless the query key changes (Claude's Discretion, not required) — invalidation target stays `["subscription", user?.id]` regardless of the underlying column rename, since the key was always semantically "this user's subscription status," never `student_id`-named.

---

### Tests

**`src/services/__tests__/webhookLogic.test.js`** (extend) — full current file read (347 lines). Cross-runtime seam pattern (lines 15-21, 74-92 comments) — the Deno lib is imported directly into Vitest because it has zero non-portable imports:

```javascript
import { extractPayload } from "../../../supabase/functions/lemon-squeezy-webhook/lib/extractPayload";
```

`resolveParent.ts` also has zero Deno-specific imports, so it can be imported the **same way** — `import { resolveParent } from '../../../supabase/functions/lemon-squeezy-webhook/lib/resolveParent';` — and unit-tested with a hand-rolled mock client object (the existing file doesn't yet mock a Supabase client anywhere; `subscriptionService.test.js` below is the analog for that part). The `extractPayload` whitelist test at line 130 (`extracts all 8 whitelisted fields`) and line 215 (`expect(Object.keys(result)).toHaveLength(8)`) must both bump to 9 once `parent_id` is added, plus a new test asserting `parent_id` extraction from `custom_data.parent_id`.

For `verifySignature`, this file **already contains** (lines 24-72) the exact Node-compatible HMAC helper the D-10(a) replay script (`05-webhook-replay.mjs`) must reuse — `verifySignatureNode` and `computeValidSignature`. The replay script is a standalone Node script (not part of the Vitest suite), but should copy `computeValidSignature`'s one-liner:

```javascript
function computeValidSignature(rawBody, secret) {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}
```

**`src/services/__tests__/subscriptionService.test.js`** (extend) — full current file read (127 lines). Mock-chain pattern to copy for the new multi-row tests (lines 5-39):

```javascript
const { mockMaybeSingle, mockLimit, mockOrder, mockEq, mockSelect, mockFrom } =
  vi.hoisted(() => {
    const mockMaybeSingle = vi.fn();
    const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockOrder = vi.fn(() => ({ limit: mockLimit }));
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    const mockSelect = vi.fn(() => ({ eq: mockEq }));
    const mockFrom = vi.fn(() => ({ select: mockSelect }));
    return {
      mockMaybeSingle,
      mockLimit,
      mockOrder,
      mockEq,
      mockSelect,
      mockFrom,
    };
  });

vi.mock("../supabase", () => ({ default: { from: mockFrom } }));
```

D-05's rewritten `fetchSubscriptionStatus` no longer calls `.order().limit().maybeSingle()` — it ends the chain at `.eq(...)` returning a promise directly (array result). The mock chain must be **shortened** to match: `mockEq` should resolve directly (`vi.fn(() => Promise.resolve({ data: [...], error: null }))`) rather than returning `{ order: mockOrder }`. New test cases needed: "returns isPremium: true when ANY of 2 rows qualifies" (one active + one expired), "returns isPremium: false when multiple rows all fail to qualify", "calls `.eq('parent_id', ...)` not `.eq('student_id', ...)`" (locks in the D-14 column rename at the query layer). Existing single-row test cases (lines 47-125) all still apply conceptually but need their mock setup adjusted to return an array (`data: [{ status: 'active', ... }]`) instead of a single object.

---

### `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-phase8-handoff.md` (MODIFY — append)

**Analog:** itself. Structure to match — a new dated `##` section (the file currently has 4 numbered sections plus a "Summary for Phase 8" table at the end, lines 21-110). Append a new `## 5. Phase 5 — Subscription Re-Pointing handoff items` section listing the four D-17 items (legacy `student_id` column, legacy SELECT policy `parent_subscriptions_select_own`, `has_active_subscription()`'s `OR student_id` branch, the webhook shim + `student_id` key in `checkout_data.custom`) in the same `| Item | Type | Action needed in Phase 8 |` table format as the existing "Summary for Phase 8" table (lines 105-110), then add a new row to that existing summary table itself rather than only writing a standalone new table — match the file's existing convention of both a narrative section AND a summary-table row per item.

---

## Shared Patterns

### CORS + JWT auth boilerplate (create-checkout & cancel-subscription)

**Source:** identical in both `supabase/functions/create-checkout/index.ts` (lines 22-70) and `supabase/functions/cancel-subscription/index.ts` (lines 23-70)
**Apply to:** both files, unchanged by this phase — cited so the planner does not accidentally "fix" or refactor this duplication as part of Phase 5's scope

```typescript
const ALLOWED_ORIGINS = [
  "https://my-pianomaster.netlify.app",
  "http://localhost:5174",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
// ... OPTIONS preflight handling, then:
const supabaseUser = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
  { global: { headers: { Authorization: authHeader } } }
);
const {
  data: { user },
  error: authError,
} = await supabaseUser.auth.getUser();
```

### Service-role client creation (all 3 Edge Functions)

**Source:** `supabase/functions/lemon-squeezy-webhook/index.ts` lines 96-99, `cancel-subscription/index.ts` lines 76-79, `create-checkout/index.ts` lines 98-101 — all three construct it identically

```typescript
const supabaseService = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
```

**Apply to:** `resolveParent`'s caller (`index.ts`) must reuse the already-created service-role client — do not create a second one for the resolve-chain probes.

### Injectable pure-lib module convention (`lib/*.ts`)

**Source:** every existing file in `supabase/functions/lemon-squeezy-webhook/lib/` — `extractPayload.ts` (zero imports), `verifySignature.ts` (only `crypto.subtle` + one `deno.land/std` import), `upsertSubscription.ts` (`supabase: any` injected, typed payload param, JSDoc block, throws on real DB errors but returns plain values for expected branches)
**Apply to:** `resolveParent.ts`, `deadLetter.ts` (if factored as its own module rather than inlined), and the new `cancel-subscription` extraction module

### Audit-table shape + deny-all RLS

**Source:** `supabase/migrations/20260321000001_account_deletion_log.sql` (shape) + `supabase/migrations/20260326000001_fix_security_linter_warnings.sql` lines 16-22 (the deny-all `RESTRICTIVE ... USING (false)` fix that should be applied _from the start_ on the new table, not retrofitted later)
**Apply to:** `unresolved_webhook_log` DDL inside the forward migration

### Migration up/down pairing + `BEGIN...COMMIT` wrapper

**Source:** `supabase/migrations/20260803120000_add_parent_age_verified.sql` + `.down.sql` (most recent precedent, both files read in full — 22 and 7 lines respectively)
**Apply to:** `2026080XXXXXXX_add_parent_subscriptions_parent_id.sql` + `.down.sql`. Note the header-comment convention to copy verbatim (Migration name / Date / Milestone / Description / Predecessors / Rollback pointer):

```sql
-- =============================================================================
-- Migration:   <name>
-- Date:        <date>
-- Milestone:   v4.0 — Parent-First Account Architecture (COPPA), Phase 5
-- Description: <what and why, referencing the D-number>
-- Predecessors: <prior migration this depends on>
-- Rollback:     <name>.down.sql
-- =============================================================================

BEGIN;
-- ... ALTER TABLE / CREATE POLICY / CREATE OR REPLACE FUNCTION ...
COMMIT;
```

### Idempotent policy/function migration shape (drop-then-create, `CREATE OR REPLACE`)

**Source:** `supabase/migrations/20260404000001_ensure_subscription_rls.sql` (full file, 76 lines) — this is the file whose `parent_subscriptions_select_own` policy and `has_active_subscription()` function D-15/D-16 change
**Apply to:** the new forward migration's dual-policy `CREATE POLICY` (additive, no `DROP POLICY IF EXISTS` on the _new_ policy name since it doesn't pre-exist) and the `has_active_subscription()` `CREATE OR REPLACE` (in-place body swap, signature `p_student_id UUID` unchanged per Pitfall 5)

### Owner-run `BEGIN...ROLLBACK` rehearsal transaction structure

**Source:** `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-rehearsal-runbook.sql` (1625 lines total; structure sampled at lines 1-30 header, 46-99 `_rehearsal_vars` temp-table + baseline EXPLAIN, 108-115 `BEGIN;` + Task 1a apply, 664-737 `DO $$ ... ASSERT ... RAISE NOTICE 'X PASS'; END $$;` blocks per requirement, 933-1144 down-migration + re-apply-idempotency proof)
**Apply to:** `05-rehearsal-runbook.sql`. The reusable skeleton per requirement is:

```sql
DO $$
BEGIN
  ASSERT <condition>, '<REQ-ID> FAIL: <message>';
  RAISE NOTICE '<REQ-ID> PASS';
END $$;
```

And the temp-vars + GRANT gotcha (lines 68-72, load-bearing — a temp table is owned by the connecting role, not `authenticated`, so every read after the first `SET ROLE authenticated` fails without this):

```sql
GRANT SELECT ON _rehearsal_vars TO authenticated;
```

And the impersonation pattern used throughout (e.g. lines 745-747, 793-795):

```sql
SELECT set_config('request.jwt.claims',
  format('{"sub":"%s","role":"authenticated"}', (SELECT parent_a FROM _rehearsal_vars)), true);
SET ROLE authenticated;
-- ... assertions ...
RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);
```

The whole file is wrapped in exactly one `BEGIN;` ... apply ... assert ... down-migration ... re-apply ... at the very end an implicit `ROLLBACK` (not shown in the sampled range but referenced in the header comment at lines 1-9) — the entire sequence must be one continuous paste/execution, not split across multiple Editor "Run" clicks (this is called out explicitly in the header).

### HMAC-SHA256 signing (D-10a replay script)

**Source:** `supabase/functions/lemon-squeezy-webhook/lib/verifySignature.ts` (full file, 57 lines — the Deno WebCrypto implementation) verified byte-identical to `src/services/__tests__/webhookLogic.test.js`'s Node re-implementation (lines 33-72)
**Apply to:** `05-webhook-replay.mjs`. Signature header is `X-Signature` (verified: `index.ts` line 59: `req.headers.get('X-Signature')`), raw body must be signed and sent as the exact same string (Pitfall 3) — RESEARCH.md's full skeleton (§Code Examples "HMAC-signed synthetic webhook replay script skeleton") is copy-paste ready and already verified against this exact algorithm; use it directly rather than re-deriving.

### Owner sign-off table format

**Source:** `.planning/phases/01-identity-schema-expand/01-fk-checklist.md` (full file, 128 lines) — header comment block (lines 1-10: Migration/Date/Description/Predecessor/Generated/Total), a `## Checklist` markdown table, a `## OWNER SIGN-OFF` section with **Signed:** date + owner name/email via which gate
**Apply to:** the new D-11 per-row sign-off doc — one row per live `ls_subscription_id` with columns for resolved `parent_id`, parent email, status, and period end, captured pre- and post-backfill (two such tables, or one table with before/after column pairs), plus a matching `## OWNER SIGN-OFF` section at the end.

## Unknowns

- **`parent_subscriptions` has no `CREATE TABLE` in any tracked migration.** Confirmed via direct grep during this session's context: `supabase/migrations/20260404000001_ensure_subscription_rls.sql` and `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql` both `ALTER`/reference the table assuming it pre-exists; neither creates it. This is the same class of migration-history drift `02-05-SUMMARY.md` documents for 5 other objects. **Do not fabricate a `CREATE TABLE parent_subscriptions (...)` statement for this phase's migration or its down-migration** — the forward migration must be a pure `ALTER TABLE ... ADD COLUMN` against the live table, and the down-migration a pure `ALTER TABLE ... DROP COLUMN`. The live column set is known only from application code reads (`student_id`, `status`, `current_period_end`, `plan_id`, `ls_subscription_id`, `ls_customer_id`, `ls_variant_id`, `parent_email`, `created_at` — confirmed present via `subscriptionService.js`, `upsertSubscription.ts`, `cancel-subscription/index.ts` reads in this session). RESEARCH.md's Wave 0 Gaps and State of the Art sections both already flag this and recommend an owner `\d parent_subscriptions` (or MCP `list_tables`) confirmation step before the migration is finalized — the plan should carry this forward as an explicit Wave 0 task, not skip it.
- **`has_active_subscription()`'s live current form** is fully known (read directly, `20260404000001_ensure_subscription_rls.sql` lines 36-59) — no unknown there, only `parent_subscriptions`' full column set is unverified-by-schema-introspection.

## Metadata

**Analog search scope:** `supabase/functions/lemon-squeezy-webhook/`, `supabase/functions/create-checkout/`, `supabase/functions/cancel-subscription/`, `supabase/functions/process-account-deletions/`, `supabase/migrations/` (5 files read in full), `src/services/subscriptionService.js` + its test, `src/contexts/SubscriptionContext.jsx`, `src/pages/{SubscribePage,ParentPortalPage,SubscribeSuccessPage}.jsx`, `.planning/phases/01-identity-schema-expand/01-fk-checklist.md`, `.planning/phases/02-rls-rewrite-ownership-based-access-control/{02-rehearsal-runbook.sql,02-phase8-handoff.md}`
**Files scanned:** 22 (all read directly this session; zero inferred-only files)
**Pattern extraction date:** 2026-08-05
