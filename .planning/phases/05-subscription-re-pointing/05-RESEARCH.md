# Phase 5: Subscription Re-Pointing - Research

**Researched:** 2026-08-05
**Domain:** Supabase RLS/Postgres migration + Lemon Squeezy webhook/checkout Edge Functions (Deno)
**Confidence:** MEDIUM (HIGH on codebase/migration mechanics via direct file reads; MEDIUM on Lemon Squeezy test-mode mechanics via cross-verified WebSearch — no Context7 library exists for Lemon Squeezy and official docs pages returned HTTP 403 to WebFetch, so those claims rest on WebSearch snippets of the same official-docs pages, not a direct fetch. Flagged per-claim below.)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Webhook Compatibility Shim & Failure Mode**

- **D-01:** The webhook resolves an incoming `custom_data` id to a parent via a resolve-chain: try `parents.id = X` first; on miss, try `child_profiles.id = X` and take its `parent_id`; on a second miss, treat as unresolved. All 3 live subscriptions are expected to hit `parents` on the first probe — the `child_profiles` hop is the safety net for a legacy/unexpected payload shape.
- **D-02:** `create-checkout` embeds both `parent_id` and legacy `student_id` in `checkout_data.custom`, both carrying the parent uid. The resolve-chain prefers `parent_id` when present. `student_id` is dropped from the payload in Phase 8.
- **D-03:** When the resolve-chain finds no parent for an incoming paid webhook, the function persists the whole payload to an unresolved-webhook dead-letter/audit table, fires a Sentry error, and returns HTTP 200. Reuse the `account_deletion_log` precedent for shape/RLS. A child id whose `parent_id` is NULL (5 teacher-owned, parent-less profiles) falls into this same unresolved path by construction.
- **D-04:** The shim is removed in Phase 8, tracked as a handoff item, held to the same evidence bar (verified zero traffic first).

**Multi-Row Semantics**

- **D-05:** Authoritative premium rule is "any active row wins." Keep the Postgres `EXISTS(... any qualifying row)` semantics and rewrite the JS to match — fetch all of the parent's rows and return premium if any one qualifies. Fails open toward the paying customer.
- **D-06:** `cancel-subscription` selects the parent's rows, filters to active ones, cancels that one. Zero active → existing 404. More than one active → a distinct error response plus an alert, never an arbitrary pick.
- **D-07:** `fetchSubscriptionDetail` shows the active row, falling back to the most-recent row when none is active.
- **D-08:** No database constraint against two simultaneously-active subscriptions per parent. Ship a read-only audit query in the verification step plus the D-06 ambiguity alert instead.

**Sandbox Verification & Live Rollout**

- **D-09:** The DB half is verified in production, inside a rolled-back transaction — reusing the Phase 2 Wave 3 pattern (`BEGIN … ROLLBACK`). Chosen over a Supabase branch because of pre-existing migration-history drift (5 migrations live but unrecorded in `npx supabase migration list`).
- **D-10:** Edge Functions get both: (a) scripted HMAC-signed synthetic webhook replays against the deployed function covering branches LS won't produce on demand (legacy `student_id` shape, unresolvable id → dead-letter, parent-less child, duplicate active rows — SC-3); and (b) one real Lemon Squeezy test-mode checkout proving the full LS → webhook → DB → UI loop end to end, including `create-checkout` and `cancel-subscription` (SC-4).
- **D-11:** SC-2 is satisfied by a committed per-row before/after table, owner-signed — each of the 3 subscriptions listed by `ls_subscription_id` with resolved `parent_id`, parent email, status, period end, captured pre- and post-backfill. Mirrors Phase 1's `01-fk-checklist.md`.
- **D-12:** Backout path is a committed down-migration authored in the same commit as the forward migration, plus previous Edge Function versions kept redeployable.
- **D-13 (precedent):** Production apply is owner-gated, run by the owner in the Supabase SQL Editor. Both CLI `db push` and MCP `apply_migration` are blocked by design.

**Legacy `student_id` Lifecycle**

- **D-14:** Add `parent_id` with FK to `parents(id)`, backfill using the same resolve-chain (D-01), then all writers target `parent_id` only. `student_id` frozen until Phase 8. Not dual-writing, not renaming.
- **D-15:** Add a `parent_id` sibling SELECT policy alongside the existing `parent_subscriptions_select_own`, rather than replacing it. Postgres ORs permissive policies. Legacy policy drops in Phase 8.
- **D-16:** `has_active_subscription(uuid)` changed by `CREATE OR REPLACE` on the body in place, matching `parent_id = p_id OR student_id = p_id`. Call sites need no change. The `OR` branch drops in Phase 8. Rejected creating a new `has_active_family_subscription()`.
- **D-17:** The four Phase 8 cleanup items are handed off by appending a Phase 5 section to `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-phase8-handoff.md`.

### Claude's Discretion

- Shape, name, retention, and RLS of the unresolved-webhook dead-letter table (D-03) — follow the `account_deletion_log` precedent.
- Whether `parent_id` is nullable initially then tightened, or `NOT NULL` from the start after backfill within the same transaction.
- Test structure for the new resolve-chain and multi-row logic — follow `src/services/__tests__/webhookLogic.test.js`'s pure-function pattern.
- Exact wording of the ambiguity error returned by `cancel-subscription` (D-06).
- Whether the `SubscriptionContext` React Query key and Realtime channel name change beyond the mandatory `filter: student_id=eq.` → `parent_id=eq.` swap.

### Deferred Ideas (OUT OF SCOPE)

- Parent-facing "one subscription covers every child" copy — ROADMAP marks this phase UI hint: no; belongs with Phase 6 if wanted.
- `SubscriptionContext` semantics beyond the mandatory filter swap (e.g. query key encoding family vs user identity) — internal naming concern, no behavioral consequence.
- Dropping `student_id` from the checkout payload, the column, the legacy policy, and the shim — all Phase 8 (D-04/D-14/D-15/D-16/D-17).
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID         | Description                                                                                                                                                    | Research Support                                                                                                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIGRATE-04 | Subscriptions become parent-scoped and all 3 live subscriptions keep working, including when a real Lemon Squeezy webhook fires against legacy metadata (D-05) | Backfill/resolve-chain SQL mechanics (§Code Examples), dead-letter table DDL (§Don't Hand-Roll / §Code Examples), LS test-mode sandbox mechanics (§State of the Art), HMAC replay harness (§Code Examples), D-11 per-row sign-off template (§Validation Architecture) |

</phase_requirements>

## Summary

This phase is a schema/RLS/Edge-Function re-pointing job, not new-feature work. The codebase side is unambiguous and already read in full: `parent_subscriptions` has no `CREATE TABLE` in any tracked migration (it was created out-of-band, consistent with the documented migration-history drift from Phase 2) — its live columns are known only from the code that reads/writes it (`student_id`, `status`, `current_period_end`, `plan_id`, `ls_subscription_id`, `ls_customer_id`, `ls_variant_id`, `parent_email`, `created_at`). The three Edge Functions (`lemon-squeezy-webhook`, `create-checkout`, `cancel-subscription`) are small, already factored into pure/injectable units for the webhook, and every change point CONTEXT.md names (D-01 through D-16) maps to an exact line or block that was read directly, not inferred.

The genuinely under-researched area — and the one the ROADMAP flags for dedicated attention — is Lemon Squeezy's test-mode mechanics. This is external, cannot be verified via Context7 (no LS library indexed) or WebFetch (docs.lemonsqueezy.com returned HTTP 403 to the fetch tool), so findings below are WebSearch-derived from official-docs snippets, cross-checked across 8 independent queries landing consistently on the same docs pages. Confidence is MEDIUM, not HIGH — the planner should have the owner spot-check the two load-bearing claims (API-key-determines-mode; products/variants don't share IDs across modes) against the live LS dashboard before committing to the exact verification mechanics in a plan.

**Primary recommendation:** Verify the DB half (parent_id column, backfill, dual RLS policy, `has_active_subscription()` body swap) via an owner-run `BEGIN…ROLLBACK` rehearsal against production, using `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-rehearsal-runbook.sql` as the direct template. Verify the Edge Functions via two independent tracks that never touch real customer data: (1) HMAC-signed synthetic webhook replays against the deployed production function using the owner's own real test account (`danieltest@gmail.com`, a real parent/child pair, confirmed live in STATE.md) with an obviously-fake `ls_subscription_id` for the resolvable branches, and a genuinely-unresolvable synthetic UUID for the dead-letter branch; and (2) one real Lemon Squeezy test-mode checkout run against a **local Supabase stack** (`supabase functions serve`) seeded with a synthetic parent/child/plan row carrying a **test-mode** LS variant ID and a **test-mode** `LS_API_KEY`/`LS_SIGNING_SECRET`, so the live `subscription_plans` table (which holds only live variant IDs) and live `parent_subscriptions` are never touched by the sandbox checkout.

## Architectural Responsibility Map

| Capability                                                         | Primary Tier                                       | Secondary Tier                                      | Rationale                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subscription ownership resolution (webhook `custom_data` → parent) | API / Backend (Edge Function)                      | Database (RLS helper)                               | The resolve-chain is pure business logic that must run before any DB write; it belongs in the webhook's `lib/` layer (already the pattern), not in a DB trigger — testability and Sentry-error visibility both require it in application code. |
| Premium/gating check (`has_active_subscription`)                   | Database / Storage (Postgres function)             | API/Backend (JS mirror in `subscriptionService.js`) | This is the RLS hot path (`WITH CHECK` on `student_skill_progress`/`students_score`) — must live in Postgres as the source of truth; JS mirrors it only for UI display, per the existing split-brain this phase closes (D-05).                 |
| Checkout creation                                                  | API / Backend (Edge Function)                      | —                                                   | LS API key must never reach the browser (existing `create-checkout` design); unchanged tier, only the embedded identity fields change (D-02).                                                                                                  |
| Cancellation + ambiguity handling                                  | API / Backend (Edge Function)                      | Database (read)                                     | Same reasoning; the "more than one active row" decision (D-06) requires a DB read before the LS API call, staying server-side.                                                                                                                 |
| Client premium status display                                      | Frontend Server / Browser (React Query + Realtime) | —                                                   | `SubscriptionContext`/`ParentPortalPage` only read; the Realtime filter swap (`student_id=eq.` → `parent_id=eq.`) is a client-side concern with no new tier.                                                                                   |
| Dead-letter audit persistence                                      | Database / Storage                                 | API/Backend (write path)                            | Mirrors `account_deletion_log` — service-role write from the Edge Function, no authenticated read/write policy (consistent with existing audit-table precedent).                                                                               |

## Standard Stack

This phase introduces no new libraries. All work happens inside the existing stack:

| Component                                        | Version (verified)                                                                                                   | Role in this phase                                                                                                                                                                                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Edge Functions (Deno)                   | Runtime per `supabase/functions/*/deno.json`/imports (`https://esm.sh/@supabase/supabase-js@2`) [VERIFIED: codebase] | Hosts the 3 functions being changed                                                                                                                                                                                                             |
| `@supabase/supabase-js@2`                        | Pinned via esm.sh import URL, no local package.json entry for functions [VERIFIED: codebase]                         | Service-role and user-JWT clients in all 3 functions                                                                                                                                                                                            |
| Postgres `pg_catalog` (not `information_schema`) | N/A                                                                                                                  | Required for any new verifier query — Phase 1's `01-fk-checklist.md` DEVIATION already proved `information_schema` returns `[]` under Supabase's non-owner query role; the same trap applies to any new backfill/RLS verifier this phase writes |
| Vitest                                           | Per `package.json` (existing) [VERIFIED: codebase]                                                                   | New resolve-chain module tests follow `webhookLogic.test.js`'s zero-Deno-import pattern                                                                                                                                                         |

**No installation step needed** — this phase edits existing files only.

## Architecture Patterns

### System Architecture Diagram

```
                     ┌─────────────────────────┐
                     │   Lemon Squeezy (LS)     │
                     │  (checkout / webhooks)   │
                     └───────────┬──────────────┘
                                 │ POST (HMAC-signed)
                                 ▼
                 ┌───────────────────────────────────┐
                 │  lemon-squeezy-webhook (Edge Fn)   │
                 │  1. verifySignature (raw body)     │
                 │  2. extractPayload (whitelist +    │
                 │     NEW: parent_id field)          │
                 │  3. NEW: resolveParent() ──┐        │
                 │     try parents.id         │        │
                 │     miss → child_profiles  │        │
                 │     .id → parent_id        │        │
                 │     miss → UNRESOLVED ──┐  │        │
                 │  4. upsertSubscription   │  │        │
                 │     (parent_id column)   │  │        │
                 └───────────┬───────────────┘  │        │
                             │                   │        │
                 resolved    │        unresolved │        │
                             ▼                   ▼        │
                  ┌────────────────────┐  ┌──────────────────────────┐
                  │ parent_subscriptions│  │ unresolved_webhook_log    │
                  │ (parent_id + legacy │  │ (D-03 dead-letter table,  │
                  │  student_id both    │  │  full payload + Sentry    │
                  │  present, additive) │  │  error, returns HTTP 200) │
                  └──────────┬──────────┘  └───────────────────────────┘
                             │
                  RLS: parent_id = auth.uid()  OR  student_id = auth.uid()
                  (dual policy, D-15; both SELECT-only, additive)
                             │
                  ┌──────────▼──────────────────────┐
                  │ has_active_subscription(uuid)     │
                  │ CREATE OR REPLACE body:           │
                  │ parent_id = p_id OR student_id=p_id│
                  └──────────┬─────────────────────────┘
                             │ called from
              ┌──────────────┴───────────────────────┐
              │ students_score / student_skill_progress│
              │ INSERT/UPDATE WITH CHECK               │
              │ (is_free_node OR has_active_subscription)│
              └─────────────────────────────────────────┘

  Browser (SubscribePage) ──POST──▶ create-checkout (Edge Fn)
      embeds checkout_data.custom = { parent_id, student_id } (D-02)
      both = user.id (the parent auth uid)

  Browser (ParentPortalPage) ──POST──▶ cancel-subscription (Edge Fn)
      SELECT rows for parent_id, filter to active,
      0 → 404 | 1 → cancel | >1 → distinct ambiguity error + alert (D-06)

  Browser (SubscriptionContext) ──Realtime──▶ parent_subscriptions
      filter: parent_id=eq.${userId}  (swap from student_id=eq.)
```

### Recommended Migration File Structure

Following the existing up/down pairing convention (`20260803120000_add_parent_age_verified.sql` + `.down.sql` is the most recent precedent):

```
supabase/migrations/
├── 2026080XXXXXXX_add_parent_subscriptions_parent_id.sql       # NEW: column + backfill + dual policy + has_active_subscription() CREATE OR REPLACE
└── 2026080XXXXXXX_add_parent_subscriptions_parent_id.down.sql  # NEW: committed alongside (D-12), drops column/policy/reverts function body
```

```
supabase/functions/lemon-squeezy-webhook/lib/
├── extractPayload.ts       # MODIFY: add parent_id field to whitelist + WebhookPayload interface
├── verifySignature.ts      # UNCHANGED
├── upsertSubscription.ts   # MODIFY: write parent_id (not student_id) as the primary column
├── resolveParent.ts        # NEW: the D-01 resolve-chain, pure + injectable (matches existing sibling pattern)
└── deadLetter.ts           # NEW (discretion): isolates the D-03 audit-table write + Sentry call, testable independent of index.ts
```

### Pattern 1: Injectable pure-function resolve-chain (matches existing lib/ convention)

**What:** `resolveParent(supabase, id)` takes an already-created Supabase client (service role) and a candidate id, returns `{ parentId: string } | { unresolved: true }`. Zero Deno-specific imports beyond the client type, so it is directly unit-testable in Vitest exactly like `upsertSubscription.ts` already is.

**When to use:** Any time the webhook needs to turn a `custom_data` id (which may be a `parent_id`, a legacy `student_id`, or garbage) into an authoritative `parent_id` before writing.

**Example (shape, not copy-paste — mirrors `upsertSubscription.ts`'s signature convention):**

```typescript
// Source: pattern derived from supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts
// (same "takes injected client" convention, same file this phase edits alongside)
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

### Pattern 2: Dead-letter write (D-03), mirroring `account_deletion_log`'s service-role insert

**What:** On `{ unresolved: true }`, persist the full raw payload (not just the whitelisted fields — the whole thing is useful for debugging an unknown shape), fire a Sentry error, return HTTP 200.

**Example:**

```typescript
// Source: pattern verified against supabase/functions/process-account-deletions/index.ts
// lines 346-352 / 489-495 — the existing account_deletion_log insert pattern.
const { error: dlError } = await supabase
  .from("unresolved_webhook_log")
  .insert({
    raw_payload: body, // the full parsed JSON, not just extractPayload()'s whitelist
    event_name: payload.event_name,
    ls_subscription_id: payload.ls_subscription_id,
    attempted_id: payload.parent_id ?? payload.student_id ?? null,
  });
if (dlError) console.error("Webhook: dead-letter insert failed", dlError);
// Sentry.captureException(new Error('Unresolved webhook parent'), { extra: { ... } });
return new Response("OK", { status: 200 });
```

### Pattern 3: "Any active row wins" JS/SQL parity (D-05)

**What:** Replace the `.order('created_at', { ascending: false }).limit(1).maybeSingle()` pattern in `fetchSubscriptionStatus` with a full-row fetch + JS-side qualifying check, matching the Postgres `EXISTS` semantics exactly.

**Example:**

```javascript
// Source: pattern derived from src/services/subscriptionService.js (existing file, D-05 target)
// and the has_active_subscription() SQL body in
// supabase/migrations/20260404000001_ensure_subscription_rls.sql lines 43-54
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

### Anti-Patterns to Avoid

- **Renaming `student_id` to `parent_id` on `parent_subscriptions`:** D-14 explicitly rejects this — it is a breaking, non-additive change on the live billing table. Add `parent_id` as a new column instead.
- **Dual-writing both `student_id` and `parent_id` on every new row:** D-14 rejects this too — the two columns would drift the moment a parent has a second child (the new child's id would need to go somewhere, and `student_id` has no second slot).
- **A partial unique index preventing >1 active row per parent:** D-08 explicitly rejects this — it would make the webhook's upsert throw at the exact moment a real customer is paying, turning a rare anomaly into a hard payment failure plus an LS retry storm.
- **`.maybeSingle()` on a query that can return >1 row:** This is the literal bug D-06 fixes in `cancel-subscription` today (`.maybeSingle()` throws on multiple rows, silently blocking cancellation). Any new query against `parent_subscriptions` in this phase must anticipate multiple rows per parent.
- **Verifying FK/RLS changes with `information_schema`:** Confirmed dead end — Phase 1's `01-fk-checklist.md` DEVIATION shows it returns `[]` under Supabase's non-owner query role. Use `pg_catalog.pg_constraint` / `pg_policies` instead for any new verifier query this phase writes.

## Don't Hand-Roll

| Problem                                                               | Don't Build                                       | Use Instead                                                                                                                                                                                                                                                                                   | Why                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit table for an anomalous/unresolvable event                       | A new audit-table design from scratch             | Copy `account_deletion_log`'s shape (standalone, no FK, `dry_run`-style flags, deny-all RLS via `AS RESTRICTIVE ... USING (false)`)                                                                                                                                                           | It is the established, security-linter-clean precedent in this exact codebase for "audit record that must survive/predate normal referential integrity." Re-deriving the shape risks missing the RLS deny-all step Phase 2's linter fix (`20260326000001_fix_security_linter_warnings.sql`) already proved necessary. |
| HMAC-SHA256 signature computation for the replay script               | A new crypto implementation                       | Reuse the exact algorithm `verifySignature.ts` already implements (Node's `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')` — already proven equivalent to the Deno WebCrypto version in `webhookLogic.test.js`'s `verifySignatureNode` helper)                             | The test file already contains a battle-tested Node-compatible re-implementation; the replay script is the same algorithm applied to a live HTTP POST instead of an in-memory assertion.                                                                                                                              |
| Rehearsal transaction harness for the DB half                         | A bespoke BEGIN/ROLLBACK script written from zero | Copy the structure of `02-rehearsal-runbook.sql` (temp-vars table with `GRANT SELECT ... TO authenticated`, `SET ROLE authenticated` + `set_config('request.jwt.claims', ...)` impersonation blocks, `DO $$ ... ASSERT ... $$` per requirement, apply→assert→down→re-apply→ROLLBACK sequence) | This exact pattern was proven against this exact production database 3 days prior (2026-08-03) and the apply log documents the gotchas (temp-table GRANT, correlated parent/child lookup) that a fresh script would rediscover the hard way.                                                                          |
| Per-row owner sign-off table for the 3 live subscriptions (D-11/SC-2) | A new sign-off format                             | Copy `01-fk-checklist.md`'s structure (checklist table + explicit "OWNER SIGN-OFF" section with date/signer)                                                                                                                                                                                  | Same milestone, same owner, same evidentiary bar already established and referenced by name in CONTEXT.md D-11.                                                                                                                                                                                                       |

**Key insight:** Every "don't hand-roll" item in this phase is an in-repo precedent, not a third-party library. The risk this phase carries is re-deriving patterns that already exist and are already correct — CONTEXT.md's canonical_refs section names every one of them explicitly.

## Common Pitfalls

### Pitfall 1 (ROADMAP Pitfall 13): Billing ownership mismatch — silent access revocation

**What goes wrong:** A webhook that can't resolve the incoming id today (missing `student_id`) logs a `console.error` and returns 200 — the row is never written, and nothing surfaces this to anyone. A paying customer's renewal silently fails to update.
**Why it happens:** The current guard at `index.ts` lines 86-92 treats "can't resolve" as equivalent to "nothing to do," because pre-Phase-5 every checkout embedded exactly one identity shape.
**How to avoid:** D-03's dead-letter table + Sentry error + still-200 (to stop LS retry storms) makes this loud without breaking LS's retry contract.
**Warning signs:** Any `unresolved_webhook_log` row appearing in production after this phase ships is real signal, not noise — the D-01 resolve-chain is expected to always succeed on the 3 known live subscriptions.

### Pitfall 2: LS test-mode data leaking into or being blocked by live tables

**What goes wrong:** Test-mode checkouts use a completely separate LS environment (separate products, variants, API keys) [MEDIUM confidence, WebSearch cross-verified — see State of the Art]. If `create-checkout`'s sandbox verification run points at the live `subscription_plans` table (which holds only live `lemon_squeezy_variant_id` values), the LS API call fails outright (unknown variant in test mode) — or worse, someone "fixes" this by temporarily overwriting a live plan row's variant id with a test-mode id, which would break real checkouts for the remainder of the test window.
**Why it happens:** `create-checkout`'s variant lookup (`index.ts` lines 103-108) has no environment awareness — it always reads from `subscription_plans` via the service-role client pointed at whatever `SUPABASE_URL` the function's environment variables target.
**How to avoid:** Run the D-10(b) real test-mode checkout against a **local** Supabase stack (`supabase start` + `supabase functions serve`) with a seeded local `subscription_plans` row carrying a real LS test-mode variant id, local `LS_API_KEY`/`LS_SIGNING_SECRET`/`LS_STORE_ID` set to LS test-mode values. This fully decouples the sandbox run from production data — no live row is ever at risk of being overwritten.
**Warning signs:** Any `SELECT * FROM subscription_plans` diff in production before/after the sandbox verification session would indicate this pitfall was hit.

### Pitfall 3: HMAC replay script signs one string, sends a re-serialized copy

**What goes wrong:** A script builds a JS/TS object, computes the HMAC over `JSON.stringify(payload)`, but then passes the _object_ (not the exact string) to the HTTP client, which re-serializes it — potentially with different key ordering or whitespace — before sending. The signature computed no longer matches the bytes the server receives, and `verifySignature.ts`'s `req.text()` + byte-for-byte comparison correctly rejects it.
**Why it happens:** `verifySignature.ts` deliberately reads `req.text()` (raw bytes) before any JSON parsing (index.ts comment: "HMAC must be verified against the exact raw bytes before any parsing") — this is correct and strict by design, so any client-side re-serialization is a real mismatch, not a false negative.
**How to avoid:** Compute `const rawBody = JSON.stringify(payload)` exactly once, store it in a variable, sign that variable, and send that same variable as the request body (e.g., `fetch(url, { body: rawBody, headers: { 'X-Signature': sig } })`). If using `curl`, use `--data-binary @payload.json` (not `-d @payload.json` or `-d "$(cat file)"` through a shell that might mangle newlines) to guarantee byte-identical transmission.
**Warning signs:** Every replay request returns HTTP 400 "Invalid signature" despite the secret being correct — this is the signature-vs-transmitted-bytes mismatch, not a wrong-secret problem.

### Pitfall 4: Sandbox verification writes real rows to production `parent_subscriptions` with no cleanup plan

**What goes wrong:** D-10(a)'s resolvable-branch replays need a real, existing `parents.id` or `child_profiles.id` to resolve against (a synthetic UUID that doesn't exist in `parents`/`child_profiles` would just exercise the dead-letter path, not the resolve-chain's success path). Using the owner's real test account (`danieltest@gmail.com`) means the replay's `upsertSubscription` call writes a real row into production `parent_subscriptions` for that parent. If the `ls_subscription_id` used isn't obviously synthetic, it becomes indistinguishable from real billing history later.
**Why it happens:** The webhook's upsert is idempotent on `ls_subscription_id` and has no environment tag — there's no `is_test` column on `parent_subscriptions` today.
**How to avoid:** Use an unambiguous, greppable `ls_subscription_id` prefix for every synthetic replay (e.g., `sim_verify_<date>_<n>`), and delete those rows as an explicit last step of the verification session (query: `DELETE FROM parent_subscriptions WHERE ls_subscription_id LIKE 'sim_verify_%'`). Record the deletion in the same verification doc as the replay results.
**Warning signs:** A `parent_subscriptions` row with a `ls_subscription_id` that doesn't correspond to any real LS dashboard subscription is either test debris or a real audit gap — grep the prefix convention to tell which.

### Pitfall 5: `has_active_subscription()` signature/call-site drift

**What goes wrong:** D-16 changes the function body but keeps the same signature `has_active_subscription(UUID)`. If a plan accidentally changes the parameter name or type, every call site in `20260801120000_rls_ownership_rewrite.sql` (3 sites, all passing `(SELECT auth.uid())`) would need updating too — turning a one-file change into a re-opened RLS-rewrite blast radius.
**Why it happens:** `CREATE OR REPLACE FUNCTION` only allows changing the body/return type in place if the argument list is unchanged; changing argument names is safe for callers using positional args (all 3 call sites do) but changing the type or count is not.
**How to avoid:** Keep `has_active_subscription(p_student_id UUID)`'s exact signature (parameter name can be cosmetic, e.g., could stay `p_student_id` even though it's now compared against `parent_id` too — renaming it to `p_id` per CONTEXT.md's own wording is fine and matches the D-16 text, but the type and arg count must not change).
**Warning signs:** `CREATE OR REPLACE FUNCTION` erroring with "cannot change name of input parameter" (safe to ignore/rename) vs "cannot change return type of existing function" (would require `DROP FUNCTION` first, touching all 3 call sites' GRANT).

## Code Examples

### Backfill SQL (resolve-chain expressed in SQL, D-01/D-14)

```sql
-- Source: pattern verified against the live resolve-chain semantics (D-01) and
-- parent_subscriptions' known columns (student_id) confirmed via
-- src/services/subscriptionService.js + supabase/functions/*/index.ts reads.
-- NOTE: parent_subscriptions has NO CREATE TABLE in any tracked migration
-- (created out-of-band, per the documented migration-history drift) — this
-- backfill assumes the column set observed in application code is complete.
-- The owner should run `\d parent_subscriptions` in the SQL Editor to confirm
-- no unobserved columns exist before finalizing this migration.

-- Step 1: add the column, nullable first (Claude's Discretion: nullable-then-tighten
-- chosen here over NOT NULL-from-start, because the backfill is a separate,
-- auditable UPDATE step the owner can inspect before tightening — matches
-- Phase 1's IDENT-05 "add second FK, verify, then rely on it" additive posture).
ALTER TABLE parent_subscriptions
  ADD COLUMN parent_id UUID REFERENCES parents(id);

-- Step 2: backfill via the resolve-chain, in two passes (mirrors D-01 exactly).
-- Pass 1: direct parents.id match (expected to cover all 3 live rows).
UPDATE parent_subscriptions ps
SET parent_id = p.id
FROM parents p
WHERE ps.student_id = p.id
  AND ps.parent_id IS NULL;

-- Pass 2: legacy child_profiles.id -> parent_id fallback (safety net, D-01).
UPDATE parent_subscriptions ps
SET parent_id = cp.parent_id
FROM child_profiles cp
WHERE ps.student_id = cp.id
  AND cp.parent_id IS NOT NULL
  AND ps.parent_id IS NULL;

-- Verification query (run BEFORE tightening to NOT NULL): any row still NULL
-- after both passes is either a parent-less-child subscription (should not
-- exist for real billing — the 5 teacher-owned profiles have no billing) or
-- a genuine anomaly requiring manual investigation before this migration ships.
SELECT id, student_id, ls_subscription_id, parent_email
FROM parent_subscriptions
WHERE parent_id IS NULL;
-- Expected for the 3 live subscriptions: zero rows returned.

-- Step 3 (only after the above returns zero rows for live data): tighten.
-- ALTER TABLE parent_subscriptions ALTER COLUMN parent_id SET NOT NULL;
```

### Dual RLS policy (D-15) — additive sibling, not replacement

```sql
-- Source: pattern verified against supabase/migrations/20260404000001_ensure_subscription_rls.sql
-- lines 11-18 (the exact policy this is additive alongside).
CREATE POLICY "parent_subscriptions_select_own_parent"
  ON parent_subscriptions
  FOR SELECT
  TO authenticated
  USING (parent_id = (SELECT auth.uid()));
-- The pre-existing "parent_subscriptions_select_own" policy
-- (USING (student_id = (SELECT auth.uid()))) is left untouched — Postgres
-- ORs permissive policies for the same command, so both are evaluated.
```

### `has_active_subscription()` body swap (D-16)

```sql
-- Source: CREATE OR REPLACE target verified against
-- supabase/migrations/20260404000001_ensure_subscription_rls.sql lines 36-54
-- (exact function this replaces in place, same signature).
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM parent_subscriptions
    WHERE (parent_id = p_student_id OR student_id = p_student_id)
      AND (
        status = 'active'
        OR status = 'on_trial'
        OR (status = 'cancelled' AND current_period_end > NOW())
        OR (status = 'past_due'  AND current_period_end > NOW() - INTERVAL '3 days')
      )
  );
$$;
-- Signature UNCHANGED (p_student_id UUID) — call sites in
-- 20260801120000_rls_ownership_rewrite.sql (3 sites, all pass (SELECT auth.uid()))
-- need no edits (Pitfall 5).
```

### Dead-letter table DDL (D-03, discretion — following `account_deletion_log` precedent)

```sql
-- Source: shape verified against supabase/migrations/20260321000001_account_deletion_log.sql
-- (the precedent this reuses) and the deny-all RLS fix pattern in
-- supabase/migrations/20260326000001_fix_security_linter_warnings.sql lines 16-22.
CREATE TABLE IF NOT EXISTS unresolved_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_name TEXT,
  ls_subscription_id TEXT,
  attempted_id TEXT,          -- the custom_data id that failed to resolve
  raw_payload JSONB NOT NULL, -- full parsed body, for debugging an unknown shape
  resolved BOOLEAN NOT NULL DEFAULT FALSE  -- discretion: lets a human mark
                                            -- "investigated, no action needed"
                                            -- without deleting the audit row
);

ALTER TABLE unresolved_webhook_log ENABLE ROW LEVEL SECURITY;

-- Deny-all policy, matching the account_deletion_log linter-fix precedent
-- (service role bypasses RLS; this silences the "rls enabled no policy" advisor).
CREATE POLICY "deny_all_access"
  ON public.unresolved_webhook_log
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE unresolved_webhook_log IS
  'D-03 dead-letter table: paid Lemon Squeezy webhooks whose custom_data id could
   not be resolved to a parent via the resolve-chain. Written by the webhook
   Edge Function service-role client; never written/read by authenticated users.';
```

### HMAC-signed synthetic webhook replay script skeleton (D-10a)

```javascript
// Source: signing algorithm verified byte-identical to
// src/services/__tests__/webhookLogic.test.js's verifySignatureNode() helper,
// which is itself verified equivalent to
// supabase/functions/lemon-squeezy-webhook/lib/verifySignature.ts's Deno impl.
// This is a standalone Node script, NOT part of the app's test suite —
// it makes a real HTTP call to the DEPLOYED production function.
import { createHmac } from "crypto";

const WEBHOOK_URL =
  "https://<project-ref>.supabase.co/functions/v1/lemon-squeezy-webhook";
const SIGNING_SECRET = process.env.LS_SIGNING_SECRET; // must match the deployed secret

async function sendSignedWebhook(payloadObj) {
  // Compute the raw body ONCE — this exact string is both signed and sent (Pitfall 3).
  const rawBody = JSON.stringify(payloadObj);
  const signature = createHmac("sha256", SIGNING_SECRET)
    .update(rawBody)
    .digest("hex");

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Signature": signature },
    body: rawBody, // send the SAME string that was signed, not payloadObj
  });
  console.log(res.status, await res.text());
}

// Branch 1: legacy student_id shape, resolvable via child_profiles hop.
// Use a REAL child_profiles.id owned by the owner's own test account so the
// resolve-chain's second probe genuinely succeeds (a synthetic UUID would
// just prove the dead-letter path, not the fallback hop).
await sendSignedWebhook({
  meta: {
    event_name: "subscription_created",
    custom_data: { student_id: "<real-child_profiles-id>" },
  },
  data: {
    id: "sim_verify_2026-08-05_1",
    type: "subscriptions",
    attributes: {
      status: "active",
      customer_id: 999999,
      variant_id: 111111,
      user_email: "sim-verify@example.invalid",
      renews_at: "2027-01-01T00:00:00.000000Z",
    },
  },
});

// Branch 2: unresolvable id -> dead-letter (D-03).
await sendSignedWebhook({
  meta: {
    event_name: "subscription_created",
    custom_data: { student_id: "00000000-0000-0000-0000-000000000fff" },
  },
  data: {
    id: "sim_verify_2026-08-05_2",
    type: "subscriptions",
    attributes: { status: "active", customer_id: 999998, variant_id: 111111 },
  },
});

// Branch 3: parent-less child (one of the 5 teacher-owned profiles, parent_id IS NULL)
// -> must also land in dead-letter (D-03 "falls into this same unresolved path by construction").
await sendSignedWebhook({
  meta: {
    event_name: "subscription_created",
    custom_data: { student_id: "<real-parent-less-child_profiles-id>" },
  },
  data: {
    id: "sim_verify_2026-08-05_3",
    type: "subscriptions",
    attributes: { status: "active", customer_id: 999997, variant_id: 111111 },
  },
});

// Cleanup after verification (Pitfall 4):
// DELETE FROM parent_subscriptions WHERE ls_subscription_id LIKE 'sim_verify_%';
// SELECT * FROM unresolved_webhook_log WHERE ls_subscription_id LIKE 'sim_verify_%'; -- inspect, then delete.
```

### Invoking `create-checkout`/`cancel-subscription` for sandbox verification (JWT-gated, D-10b)

Both functions require `verify_jwt = true` [VERIFIED: `supabase/config.toml` lines 311-317] — a real Supabase-issued JWT is required, not just an HMAC signature. For a local-stack sandbox run:

```bash
# Source: pattern derived from supabase/config.toml's verify_jwt settings and
# the existing anon-key sign-in flow the app itself uses (src/services/supabase.js).
# Sign in as the synthetic/local test parent to obtain a real access_token,
# then invoke the locally-served function with it.
curl -X POST http://localhost:54321/auth/v1/token?grant_type=password \
  -H "apikey: <local-anon-key>" -H "Content-Type: application/json" \
  -d '{"email":"sim-verify@example.invalid","password":"<test-password>"}'
# -> extract .access_token from the response

curl -X POST http://localhost:54321/functions/v1/create-checkout \
  -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" \
  -d '{"planId":"monthly-usd","studentId":"<the-signed-in-users-own-id>"}'
```

## State of the Art

### Lemon Squeezy test mode — mechanics [MEDIUM confidence — WebSearch only, cross-verified across 8 independent queries against the same official docs.lemonsqueezy.com pages; WebFetch was blocked (HTTP 403) so no direct-fetch verification was possible this session]

| Claim                                                                                                                                                                                                                                                                                                                                                                                                                          | Confidence | Source                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test mode is a store-wide dashboard toggle (bottom-left), switching the whole account into a separate environment: separate products, customers, purchases                                                                                                                                                                                                                                                                     | MEDIUM     | [CITED via WebSearch: docs.lemonsqueezy.com/help/getting-started/test-mode]                                                                                      |
| Test-mode and live-mode webhooks are **kept separate** — a webhook created while toggled to test mode only fires for test-mode events, and vice versa. Practically this means **two separate webhook registrations** are needed (one per mode), each with its own signing secret chosen at creation time — but the secret VALUE can be set to the same string in both registrations since it's user-supplied, not LS-generated | MEDIUM     | [CITED via WebSearch: docs.lemonsqueezy.com/help/webhooks/simulate-webhook-events, docs.lemonsqueezy.com/api/webhooks/create-webhook]                            |
| A webhook payload carries `test_mode` as a boolean, both at `data.attributes.test_mode` (subscription/order object level) and reportedly at top-level `meta.test_mode`                                                                                                                                                                                                                                                         | LOW        | [WebSearch-derived example only, not directly fetched — verify against a real "Send test webhook" payload before relying on this field name for any code branch] |
| **API key mode determines which store data an API call operates on** — a test-mode `LS_API_KEY` only sees/creates test-mode checkouts, products, and subscriptions; a live-mode key only sees live data. This is the load-bearing fact for D-10(b): the sandbox checkout needs its own `LS_API_KEY` env value, not the production one                                                                                          | MEDIUM     | [CITED via WebSearch: docs.lemonsqueezy.com/guides/developer-guide/testing-going-live, docs.lemonsqueezy.com/api/getting-started/requests]                       |
| Products/variants do **not** automatically exist in both modes — a test-mode variant id is a genuinely different id than any live variant id for "the same" product, and test products don't auto-copy to live (only a manual one-way "Copy to Live Mode" action exists)                                                                                                                                                       | MEDIUM     | [CITED via WebSearch: docs.lemonsqueezy.com/help/getting-started/activate-your-store, docs.lemonsqueezy.com/guides/developer-guide/testing-going-live]           |
| Subscription cancellation (`DELETE /v1/subscriptions/{id}`) works identically in test mode — same endpoint, test-mode API key                                                                                                                                                                                                                                                                                                  | MEDIUM     | [CITED via WebSearch: docs.lemonsqueezy.com/api/subscriptions/cancel-subscription]                                                                               |

**Consequence for planning:** `docs/DEPLOY.md`'s existing "Test with Sandbox" section (§5, "Send test webhook" from the LS dashboard) is a _simulated event through the dashboard UI_, not a real checkout — it is a valid, low-effort way to exercise D-10(a)'s replay-style branches without scripting HMAC at all (LS signs it for you, using whichever webhook registration — test or live — the dashboard is currently viewing). It does **not** exercise D-10(b)'s "full LS → webhook → DB → UI loop end to end, including `create-checkout` and `cancel-subscription`" requirement, which needs a genuine checkout completion and therefore the local-stack + test-mode-variant approach described above.

### Migration-history drift (carried forward from Phase 2, directly relevant to D-09)

`parent_subscriptions` itself has **no `CREATE TABLE` statement in any tracked migration** [VERIFIED: `grep -rn "parent_subscriptions" supabase/migrations/` returns only the two files that ALTER/reference it, `20260404000001` and `20260722120000`, both of which assume the table pre-exists]. This is the same class of drift `02-05-SUMMARY.md` documented for 5 other migrations — applied out-of-band via the Supabase SQL Editor at some point before `20260404000001`. **Practical consequence:** the forward migration this phase writes must be defensive about the exact live column set (confirmed via application code reads: `student_id`, `status`, `current_period_end`, `plan_id`, `ls_subscription_id`, `ls_customer_id`, `ls_variant_id`, `parent_email`, `created_at` — no `updated_at` observed in any query). The owner should run `\d parent_subscriptions` (or the MCP `list_tables` tool, if available in the planning/execution session) before finalizing the migration to catch any column this session's code-only read missed.

## Assumptions Log

| #   | Claim                                                                                                                                                                                                                                                                              | Section                              | Risk if Wrong                                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `parent_subscriptions`'s full column set is exactly the 9 columns observed in application code (no unobserved columns like `updated_at`, `created_by`, etc.)                                                                                                                       | Backfill SQL, State of the Art       | Low — an `ALTER TABLE ADD COLUMN` is additive regardless of what else exists on the table; only risk is a missed NOT NULL column that would need a default in the same migration, which would surface immediately as a migration error, not a silent bug                        |
| A2  | LS test-mode and live-mode webhooks require **separate registrations** (not a single registration receiving both, filterable by a `test_mode` payload field)                                                                                                                       | State of the Art, Common Pitfalls #2 | Medium — if wrong, the plan could unnecessarily register a second webhook endpoint/secret when the existing one already receives test events; owner should confirm against the live LS dashboard's Webhooks settings page before the plan finalizes the exact registration step |
| A3  | The `test_mode` field's exact JSON path in a webhook payload (`data.attributes.test_mode` and/or top-level `meta.test_mode`)                                                                                                                                                       | State of the Art                     | Low — this phase's webhook code doesn't need to branch on `test_mode` at all (CONTEXT.md doesn't ask for this); it only matters if a future plan wants to reject/flag test-mode events reaching the production endpoint, which is out of this phase's decided scope             |
| A4  | A test-mode `LS_API_KEY` and test-mode variant id are obtainable without the owner creating new products in the LS dashboard (i.e., the store may already have test-mode products from earlier development, since `docs/DEPLOY.md` mentions "Sandbox (dev)" secrets already exist) | State of the Art, Common Pitfalls #2 | Medium — if the store has never had test-mode products created, Wave 0 of the plan needs an explicit "create/copy a test-mode product+variant in the LS dashboard" step before the sandbox checkout can run at all                                                              |

**If this table is empty:** N/A — see above; all Lemon Squeezy test-mode claims are WebSearch-sourced and warrant the owner's own dashboard confirmation before the plan locks in exact verification steps, per the ROADMAP's explicit research flag for this phase.

## Open Questions

1. **Does the Lemon Squeezy store already have test-mode products/variants configured, or does Wave 0 need to create them?**
   - What we know: `docs/DEPLOY.md`'s "Environment Separation" table already distinguishes "Sandbox (dev)" vs "Production" `LS_SIGNING_SECRET` values, implying some sandbox setup exists or was anticipated.
   - What's unclear: Whether a test-mode product/variant with a real `lemon_squeezy_variant_id` currently exists, or whether this phase's plan needs an explicit manual dashboard step to create one.
   - Recommendation: First plan task/Wave 0 step should be the owner confirming (via LS dashboard, toggled to Test mode) whether a usable test-mode variant already exists; if not, creating one is a ~5-minute manual dashboard action that should be an explicit, owner-gated plan step (consistent with this phase's other owner-gated steps).

2. **Exact wording/shape of the "ambiguity error" `cancel-subscription` returns on >1 active row (D-06, Claude's Discretion)**
   - What we know: Must be "a distinct error response plus an alert," never an arbitrary pick.
   - What's unclear: Whether "alert" means a Sentry error (matching D-03's pattern for the webhook), a dedicated admin notification, or both; and the exact HTTP status/error code the frontend should branch on.
   - Recommendation: Mirror D-03's Sentry-error convention for consistency (both are "billing anomaly needs human eyes" cases) — a distinct HTTP status (e.g., 409 Conflict) with a machine-readable error code the frontend can special-case, separate from the existing generic "Cancellation failed" 500 path.

3. **Whether the `unresolved_webhook_log` write should happen before or after attempting `upsertSubscription` for resolvable ids that still throw a DB error**
   - What we know: D-03 covers the "resolve-chain found no parent" case specifically, not "resolve-chain succeeded but the subsequent upsert threw."
   - What's unclear: Whether a DB-level upsert failure for a _resolved_ parent should also land in the dead-letter table, or keep the existing "return 500, let LS retry" behavior (index.ts lines 102-108, unchanged by this phase per CONTEXT.md's scope).
   - Recommendation: Keep the two failure modes separate as CONTEXT.md's decisions imply — unresolved-id failures are D-03's dead-letter path (permanent, human-reviewed); upsert failures after successful resolution stay on the existing 500-and-retry path (transient, LS retries fix it). Do not conflate them.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest (existing project-wide)                                                                                                                              |
| Config file        | `vitest.config.js` (existing; already stubs `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` per STATE.md's "VITE_SUPABASE_URL test env failure" resolved item) |
| Quick run command  | `npx vitest run src/services/__tests__/webhookLogic.test.js src/services/__tests__/subscriptionService.test.js`                                             |
| Full suite command | `npm run test:run`                                                                                                                                          |

### Phase Requirements → Test Map

| Req ID                                                                                          | Behavior                                                                                                                               | Test Type                                                                                                               | Automated Command                                                                                                                                                        | File Exists?                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIGRATE-04 (SC-1: `parent_id` column + plain-equality RLS)                                      | New column exists, dual SELECT policy present, no `owned_child_ids()` indirection                                                      | DB assertion (SQL, inside rehearsal transaction)                                                                        | Owner-run `BEGIN...ROLLBACK` rehearsal, `pg_policies`/`pg_constraint` ASSERT blocks (pattern: `02-rehearsal-runbook.sql`)                                                | ❌ Wave 0 — new rehearsal script needed, e.g. `05-rehearsal-runbook.sql`                                                                                                                                                                                          |
| MIGRATE-04 (SC-1: `has_active_subscription()` body)                                             | Function returns TRUE for a row with only `parent_id` set, TRUE for a row with only legacy `student_id` set                            | Unit test (pure SQL function, can be asserted inside the same rehearsal transaction)                                    | Same rehearsal script, `DO $$ ASSERT ... $$` block                                                                                                                       | ❌ Wave 0                                                                                                                                                                                                                                                         |
| MIGRATE-04 (SC-1: JS `fetchSubscriptionStatus`/`fetchSubscriptionDetail` "any active row wins") | Multiple rows, one qualifying → premium true; zero qualifying → false                                                                  | Unit test (Vitest, mocked Supabase client)                                                                              | `npx vitest run src/services/__tests__/subscriptionService.test.js`                                                                                                      | ✅ exists — extend with new multi-row test cases (D-05)                                                                                                                                                                                                           |
| MIGRATE-04 (SC-2: 3 live subscriptions resolve correctly)                                       | Each real `ls_subscription_id` maps to the correct real `parent_id`, verified individually                                             | Manual, owner-signed (not automatable — requires correlating real LS dashboard customer identity with DB rows)          | N/A — owner-signed before/after table (D-11), template: `01-fk-checklist.md`                                                                                             | N/A — manual gate by design                                                                                                                                                                                                                                       |
| MIGRATE-04 (SC-3: resolve-chain + dead-letter branches)                                         | Legacy shape resolves via `child_profiles` hop; unresolvable id → dead-letter row + Sentry + HTTP 200; parent-less child → dead-letter | Unit test (Vitest, pure function) + integration (HMAC replay against deployed function)                                 | `npx vitest run src/services/__tests__/webhookLogic.test.js` (unit) + manual replay script run (integration, D-10a)                                                      | ❌ Wave 0 — new `resolveParent.test.js` (or extend `webhookLogic.test.js`) + new replay script `05-webhook-replay.mjs`                                                                                                                                            |
| MIGRATE-04 (SC-3: extractPayload gains `parent_id`)                                             | `extractPayload()` extracts `parent_id` from `custom_data` when present, prefers it over `student_id`                                  | Unit test (Vitest, existing pattern)                                                                                    | `npx vitest run src/services/__tests__/webhookLogic.test.js`                                                                                                             | ✅ existing file, extend `describe('extractPayload')` block                                                                                                                                                                                                       |
| MIGRATE-04 (SC-4: `create-checkout`/`cancel-subscription` on `parent_id` against sandbox)       | Full checkout completes in LS test mode, webhook fires, DB row correct, cancel succeeds                                                | Manual (real LS test-mode checkout, cannot be scripted end-to-end — requires an actual browser/API checkout completion) | N/A — owner or agent-driven manual walkthrough against local Supabase stack (D-10b)                                                                                      | N/A — manual gate by design                                                                                                                                                                                                                                       |
| MIGRATE-04 (D-06: cancel-subscription ambiguity on >1 active row)                               | 2 active rows for one parent → distinct error + alert, no cancellation performed                                                       | Unit/integration test (mocked Supabase client returning 2 active rows)                                                  | New test file, e.g. `supabase/functions/cancel-subscription/__tests__/` or extend `webhookLogic.test.js`-style pattern for this function's logic if factored into `lib/` | ❌ Wave 0 — `cancel-subscription/index.ts` is currently NOT factored into pure `lib/` units (unlike the webhook); extracting the "select rows, classify active, decide" logic into a testable pure function is recommended so this branch is unit-testable at all |

### Sampling Rate

- **Per task commit:** Quick run command above (webhook + subscription service test files) — sub-5-second Vitest run, no DB/network dependency.
- **Per wave merge:** `npm run test:run` (full suite) — must stay green throughout, per this codebase's existing zero-regression convention (Phase 2 closed at 2160/2160, Phase 4 at 2303/2303).
- **Phase gate:** Full suite green + the owner-signed D-11 per-row table + the D-09 rehearsal transaction PASS output + the D-10 replay/checkout evidence, all four required before `/gsd-verify-work` — this phase has no single automated gate that proves MIGRATE-04 end-to-end; it is inherently a mixed automated+manual gate given the "verified individually against each real customer" requirement (SC-2) and the "real Lemon Squeezy test-mode checkout" requirement (SC-4).

### Wave 0 Gaps

- [ ] `05-rehearsal-runbook.sql` — new file, templated from `02-rehearsal-runbook.sql`, covering: `ALTER TABLE ADD COLUMN parent_id`, backfill UPDATE (2-pass resolve-chain), dual-policy `CREATE POLICY`, `has_active_subscription()` `CREATE OR REPLACE`, down-migration, re-apply, all wrapped in one `BEGIN...ROLLBACK` against production (D-09).
- [ ] `supabase/functions/lemon-squeezy-webhook/lib/resolveParent.ts` + a corresponding test block in `webhookLogic.test.js` (or a new sibling file) — covers the D-01 resolve-chain unit tests.
- [ ] `supabase/functions/lemon-squeezy-webhook/lib/deadLetter.ts` (or inline in `index.ts`, discretion) + test coverage for the D-03 dead-letter write.
- [ ] A pure, testable extraction of `cancel-subscription`'s "select rows → classify active → decide" logic (currently monolithic in `index.ts`) — needed to unit-test D-06's ambiguity branch without a live DB.
- [ ] `05-webhook-replay.mjs` (or `.js`) — the HMAC-signed synthetic replay script (D-10a), following the Code Examples skeleton above.
- [ ] `05-fk-checklist.md`-style owner sign-off table (D-11) — new file, templated from `01-fk-checklist.md`'s structure, for the 3 live subscriptions' before/after `parent_id` resolution.
- [ ] Local Supabase stack seed data (synthetic parent/child/plan row with a test-mode LS variant id) for the D-10(b) real checkout — new seed script or manual SQL, scoped to local dev only.
- [ ] Committed down-migration file (`.down.sql` sibling), authored in the same commit as the forward migration (D-12) — naming convention confirmed via `20260803120000_add_parent_age_verified.sql` + `.down.sql`.

## Environment Availability

| Dependency                                                               | Required By                                                           | Available                                                                                                                                                           | Version | Fallback                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase CLI (local stack: `supabase start`, `supabase functions serve`) | D-10(b) local sandbox checkout verification                           | Not verified this session — Bash tool did not probe for `supabase` CLI presence                                                                                     | —       | If unavailable locally, the owner can run the equivalent verification via a throwaway/free-tier second Supabase project instead of local Docker-based stack; slower but achieves the same production-isolation goal                                                                                                                                                   |
| Lemon Squeezy test-mode store access (dashboard)                         | D-10(a) dashboard-simulated webhooks, D-10(b) real test-mode checkout | Assumed available (existing LS account, per `docs/DEPLOY.md`) — not independently verified this session (no LS API credentials available to this research session)  | —       | None needed — this is inherent to the existing LS account, not a new dependency                                                                                                                                                                                                                                                                                       |
| Sentry (error capture for D-03)                                          | D-03 dead-letter Sentry error                                         | Confirmed used elsewhere in the codebase (CLAUDE.md: "Monitoring: Sentry (error tracking)") — not independently re-verified for Edge Function usage in this session | —       | If Sentry SDK isn't already wired into Edge Functions (client-side Sentry per CLAUDE.md may not cover Deno functions), fall back to `console.error` with a clearly-greppable prefix (e.g., `WEBHOOK_UNRESOLVED:`) plus the dead-letter table row as the durable record — the table itself is the primary evidence trail regardless of whether Sentry capture succeeds |

**Missing dependencies with no fallback:** None identified — every dependency above has a stated fallback.

**Missing dependencies with fallback:** Supabase CLI local stack (fallback: second throwaway Supabase project); Sentry Edge Function wiring (fallback: console.error + dead-letter table as primary record).

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V2 Authentication     | Partial | `create-checkout`/`cancel-subscription` already verify JWT (`verify_jwt = true`) + defense-in-depth `user.id !== studentId` check (unchanged mechanism, only the compared field's meaning shifts from student to parent identity)                                                                                                                                                                            |
| V3 Session Management | No      | Not touched — Supabase session handling is unchanged                                                                                                                                                                                                                                                                                                                                                         |
| V4 Access Control     | Yes     | RLS is the entire mechanism here — plain `parent_id = auth.uid()` equality (SC-1), no `owned_child_ids()` indirection, matching Phase 2's precedent that the billing hot path stays simple equality, not the ownership-fan-out helper used elsewhere                                                                                                                                                         |
| V5 Input Validation   | Yes     | The webhook's `extractPayload()` whitelist pattern (already correct — only 8, soon 9, named fields survive; everything else in the LS payload is discarded) continues unchanged; the dead-letter table's `raw_payload JSONB` column is the one deliberate exception (stores the full unvalidated body for debugging), and it carries the deny-all RLS policy specifically because it holds unvalidated input |
| V6 Cryptography       | Yes     | HMAC-SHA256 signature verification (`verifySignature.ts`) is unchanged — never hand-roll; this phase's only crypto-adjacent work is the replay script reusing the identical algorithm for testing, not new production crypto                                                                                                                                                                                 |

### Known Threat Patterns for this stack

| Pattern                                                                                                                                       | STRIDE                 | Standard Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Webhook replay by a third party who captured a legitimate LS payload                                                                          | Spoofing               | HMAC-SHA256 signature verification, unchanged by this phase; the D-10 synthetic replay script uses the same secret the real function verifies against, so it is not a demonstration of a real vulnerability — it is the legitimate verification mechanism working as intended                                                                                                                                                                         |
| IDOR via `studentId`/`parent_id` mismatch in `create-checkout`                                                                                | Tampering              | Existing `user.id !== studentId` check (line 87 of `create-checkout/index.ts`) continues to function unchanged — the field still ends up being the caller's own `auth.uid()`, just re-labeled in meaning                                                                                                                                                                                                                                              |
| Cross-parent billing data leak via a missing `WITH CHECK` on the new policy                                                                   | Elevation of Privilege | The new `parent_subscriptions_select_own_parent` policy is SELECT-only (no INSERT/UPDATE for authenticated users — writes are service-role only, unchanged), so a `WITH CHECK` gap cannot occur on this specific policy by construction; RLS-03-style verification (require non-null `WITH CHECK` on INSERT/UPDATE policies) still applies to any other authenticated-write policy this phase might introduce, but CONTEXT.md's scope introduces none |
| Dead-letter table becoming a data exfiltration vector (it stores raw, unvalidated webhook payloads which could include a real parent's email) | Information Disclosure | Deny-all RLS policy (matching `account_deletion_log`'s precedent) ensures only the service-role key can read it — no authenticated user, including the parent whose email might appear in a dead-lettered payload, can query this table directly                                                                                                                                                                                                      |

## Sources

### Primary (HIGH confidence — direct file reads this session)

- `.planning/phases/05-subscription-re-pointing/05-CONTEXT.md` — all 17 locked decisions, canonical refs, code insights
- `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md` (Phase 5 section), `.planning/STATE.md`
- `supabase/functions/lemon-squeezy-webhook/index.ts`, `lib/extractPayload.ts`, `lib/verifySignature.ts`, `lib/upsertSubscription.ts`
- `supabase/functions/create-checkout/index.ts`, `supabase/functions/cancel-subscription/index.ts`
- `supabase/migrations/20260404000001_ensure_subscription_rls.sql`, `20260722120000_add_parents_and_child_profiles.sql`, `20260321000001_account_deletion_log.sql`, `20260326000001_fix_security_linter_warnings.sql`
- `supabase/functions/process-account-deletions/index.ts` (account_deletion_log write pattern)
- `src/services/subscriptionService.js`, `src/contexts/SubscriptionContext.jsx`, `src/pages/ParentPortalPage.jsx`, `src/pages/SubscribePage.jsx`, `src/pages/SubscribeSuccessPage.jsx`
- `src/services/__tests__/webhookLogic.test.js`, `src/services/__tests__/subscriptionService.test.js`
- `docs/DEPLOY.md`, `supabase/config.toml` (verify_jwt settings)
- `.planning/phases/01-identity-schema-expand/01-fk-checklist.md`
- `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-rehearsal-runbook.sql`, `02-apply-log.md`, `02-phase8-handoff.md`

### Secondary (MEDIUM confidence — WebSearch cross-verified against official docs.lemonsqueezy.com pages, multiple independent queries converging on the same pages)

- [Docs: Test Mode • Lemon Squeezy](https://docs.lemonsqueezy.com/help/getting-started/test-mode)
- [Docs: Simulate Webhook Events • Lemon Squeezy](https://docs.lemonsqueezy.com/help/webhooks/simulate-webhook-events)
- [Guides: Testing & Going Live • Lemon Squeezy](https://docs.lemonsqueezy.com/guides/developer-guide/testing-going-live)
- [Guides: Sync With Webhooks • Lemon Squeezy](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks)
- [API Docs: Create a Webhook • Lemon Squeezy](https://docs.lemonsqueezy.com/api/webhooks/create-webhook)
- [API Docs: The Webhook Object • Lemon Squeezy](https://docs.lemonsqueezy.com/api/webhooks)
- [API Docs: Requests • Lemon Squeezy](https://docs.lemonsqueezy.com/api/getting-started/requests)
- [API Docs: Cancel a Subscription • Lemon Squeezy](https://docs.lemonsqueezy.com/api/subscriptions/cancel-subscription)
- [Docs: Activate Your Store • Lemon Squeezy](https://docs.lemonsqueezy.com/help/getting-started/activate-your-store)

### Tertiary (LOW confidence — WebSearch-only, single-pass summary, not independently cross-checked)

- The exact JSON path of `test_mode` in a webhook payload (`meta.test_mode` claim specifically) — see Assumptions Log A3.

## Metadata

**Confidence breakdown:**

- Standard stack / codebase mechanics: HIGH — every file cited above was read directly this session, not inferred.
- Architecture: HIGH — the diagram and patterns are derived from code that already exists and follows an established `lib/` convention; no new architectural style is introduced.
- Lemon Squeezy test-mode mechanics: MEDIUM — WebFetch was blocked (HTTP 403) for direct docs verification; findings rest on WebSearch summaries of the same official pages, cross-checked across 8 queries with consistent answers, but not independently confirmed via a raw fetch or Context7.
- Pitfalls: HIGH for codebase-specific pitfalls (all traced to exact line numbers); MEDIUM for the LS test-mode pitfall (depends on the MEDIUM-confidence test-mode mechanics above).

**Research date:** 2026-08-05
**Valid until:** 14 days for the Lemon Squeezy test-mode mechanics section (external, unverified-by-direct-fetch, should be re-confirmed against the live dashboard before the plan finalizes exact steps); 30 days for the codebase-mechanics sections (stable, direct file reads).
