# Phase 5: Subscription Re-Pointing - Context

**Gathered:** 2026-08-05
**Status:** Ready for planning

<domain>
## Phase Boundary

`parent_subscriptions` becomes family-wide instead of child-scoped, end to end: a `parent_id`
column with plain-equality RLS, a `has_active_subscription()` that resolves by parent, and the
three Lemon Squeezy Edge Functions (`lemon-squeezy-webhook`, `create-checkout`,
`cancel-subscription`) plus the client read paths all operating on parent identity — sandbox-
verified before any of the 3 live subscriptions is touched.

**In scope:** the `parent_id` column + backfill; the additive RLS sibling policy; the
`has_active_subscription()` body swap; the webhook compatibility shim + dead-letter path; the
checkout/cancel Edge Function changes; the client read-path changes in `subscriptionService.js`,
`SubscriptionContext.jsx`, and `ParentPortalPage.jsx`; the sandbox verification and owner-gated
production apply.

**Not in scope:** migrating the 15 live auth accounts (Phase 6); dropping anything legacy
(Phase 8); the parental gate protecting the billing screens (Phase 4, done); any change to
pricing, plans, or the Lemon Squeezy store configuration; new billing UI.

</domain>

<decisions>
## Implementation Decisions

### Webhook Compatibility Shim & Failure Mode

- **D-01:** The webhook resolves an incoming `custom_data` id to a parent via a **resolve-chain**:
  try `parents.id = X` first; on miss, try `child_profiles.id = X` and take its `parent_id`; on a
  second miss, treat as unresolved. Because Phase 1 reused UUIDs, all 3 live subscriptions are
  expected to hit `parents` on the first probe — the `child_profiles` hop is the genuine safety
  net for a legacy or unexpected payload shape. One code path serves legacy and new payloads.
  (Satisfies ROADMAP SC-3.)
- **D-02:** `create-checkout` embeds **both** `parent_id` and legacy `student_id` in
  `checkout_data.custom`, both carrying the parent uid. Costs one extra field and zero
  Lemon-Squeezy-side configuration, and means a checkout started before the deploy and completed
  after it resolves correctly under either code path. The resolve-chain prefers `parent_id` when
  present. `student_id` is dropped from the payload in Phase 8.
- **D-03:** When the resolve-chain finds no parent for an incoming paid webhook, the function
  **persists the whole payload to an unresolved-webhook dead-letter/audit table, fires a Sentry
  error, and returns HTTP 200** (so Lemon Squeezy stops retrying). This replaces today's silent
  `console.error` + 200 + never-written-row, which is invisible access loss for a paying customer
  — Pitfall 13 exactly. Reuse the existing `account_deletion_log` audit-table precedent for shape
  and RLS. A child id whose `parent_id` is NULL (the 5 teacher-owned, parent-less profiles) falls
  into this same unresolved path by construction.
- **D-04:** The shim is **removed in Phase 8**, tracked as a handoff item alongside the legacy
  policy drop and held to the same evidence bar (verified zero traffic first). Not removed
  earlier — Phase 6's live account migration is still ahead, and that is the window where an
  unexpected id shape is most likely.

### Multi-Row Semantics

- **D-05:** The authoritative premium rule is **"any active row wins."** Keep the Postgres
  `EXISTS(... any qualifying row)` semantics and rewrite the JS to match — fetch all of the
  parent's rows and return premium if any one qualifies. This removes the current split-brain
  where JS picks the most-recent row (`order created_at desc limit 1`) while Postgres uses EXISTS,
  so the DB can allow a write the UI says is impossible. Fails open toward the paying customer.
- **D-06:** `cancel-subscription` selects the parent's rows, filters to the ones that qualify as
  active, and cancels **that one**. Zero active → the existing 404. **More than one active → a
  distinct error response plus an alert**, never an arbitrary pick — cancelling the wrong
  subscription while another keeps billing is the Pitfall 13 incident class. This also fixes the
  current `.maybeSingle()`, which throws outright on multiple rows and blocks cancellation
  entirely.
- **D-07:** `fetchSubscriptionDetail` (Parent Portal display) shows **the active row, falling back
  to the most-recent row when none is active.** The portal then always agrees with the gate the
  parent actually experiences, while a genuinely-lapsed parent still sees their billing history
  and the renew/cancel UI has something to render.
- **D-08:** **No database constraint** against two simultaneously-active subscriptions per parent.
  Ship a read-only audit query in the verification step plus the D-06 ambiguity alert instead. A
  partial unique index would make the webhook's upsert throw at the exact moment a real customer
  is paying — converting a rare billing anomaly into a hard payment failure and an LS retry storm.

### Sandbox Verification & Live Rollout

- **D-09:** The DB half is verified **in production, inside a rolled-back transaction** — reusing
  the Phase 2 Wave 3 pattern (owner runs the migration + assertion suite inside
  `BEGIN … ROLLBACK`). Chosen over a Supabase branch because of the pre-existing migration-history
  drift recorded in `02-05-SUMMARY.md`: 5 migrations are live in production but unrecorded in
  `npx supabase migration list`, so a branch does not reproduce production schema faithfully.
  Production is also the only environment where the 3 live subscription rows genuinely exist.
- **D-10:** The Edge Functions cannot live inside a transaction, so they get **both** vehicles:
  (a) scripted **HMAC-signed synthetic webhook replays** against the deployed function covering
  the branches Lemon Squeezy will not produce on demand — legacy `student_id` shape, unresolvable
  id → dead-letter, parent-less child, duplicate active rows (SC-3); and (b) **one real Lemon
  Squeezy test-mode checkout** proving the full LS → webhook → DB → UI loop end to end, including
  `create-checkout` and `cancel-subscription` (SC-4).
- **D-11:** SC-2's "verified individually against each real customer, not by row count alone" is
  satisfied by a **committed per-row before/after table, owner-signed** — each of the 3
  subscriptions listed by `ls_subscription_id` with its resolved `parent_id`, the parent's email,
  status, and period end, captured pre- and post-backfill. Mirrors Phase 1's `01-fk-checklist.md`
  and account-segmentation sign-off pattern.
- **D-12:** Backout path is a **committed down-migration authored in the same commit as the
  forward migration** (Phase 1's `01-04` pattern), plus the previous Edge Function versions kept
  redeployable. Because the change is purely additive — new column, new policy, new function body
  — backing out is a drop plus a redeploy with no data loss.
- **D-13 (precedent, not re-asked):** The production apply is **owner-gated** and run by the owner
  in the Supabase SQL Editor. Both the CLI `db push` path and the MCP `apply_migration` path were
  blocked by design in Phases 1 and 2 (auto-mode classifier and read-only MCP connection
  respectively); assume the same here.

### Legacy `student_id` Lifecycle

- **D-14:** Add `parent_id` with an FK to `parents(id)`, **backfill it using the same resolve-chain
  the webhook uses (D-01)**, then have all writers target `parent_id` only. `student_id` is left
  frozen as a historical record until Phase 8 drops it. Additive and reversible — the milestone's
  expand/contract contract. Explicitly **not** dual-writing `student_id` (the two columns would
  drift the moment a parent has a second child) and explicitly **not** renaming (a breaking,
  non-additive change on the live billing table).
- **D-15:** Add a **`parent_id` sibling SELECT policy alongside** the existing
  `parent_subscriptions_select_own` (`student_id = (SELECT auth.uid())`), rather than replacing
  it. Postgres OR's permissive policies, so neither the pre- nor post-deploy client is locked out
  during rollout — and on the billing table a lockout reads to the user as "my subscription
  vanished." This is the same dual-policy pattern Phase 2 applied to all ~39 rewritten policies.
  Legacy policy drops in Phase 8.
- **D-16:** `has_active_subscription(uuid)` is changed by **`CREATE OR REPLACE` on the body in
  place**, matching `parent_id = p_id OR student_id = p_id`. Call sites need no change — the
  `students_score` policies already pass `(SELECT auth.uid())`, which is the parent uid. The `OR`
  branch is deploy-window insurance: a warm old function version could still write a row carrying
  only `student_id`, and on the billing path a false negative means a paying customer loses
  access. The `OR` branch drops in Phase 8. Rejected creating a new
  `has_active_family_subscription()` — it would drag Phase 2's finished, security-reviewed policy
  set back into scope for no functional gain.
- **D-17:** The four Phase 8 cleanup items (legacy `student_id` column, legacy SELECT policy, the
  helper's `OR student_id` branch, the webhook shim + the `student_id` key in the checkout
  payload) are handed off by **appending a Phase 5 section to the existing
  `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-phase8-handoff.md`** — the
  file STATE.md already flags as authoritative reading before Phase 8 planning.

### Claude's Discretion

- Shape, name, retention, and RLS of the unresolved-webhook dead-letter table (D-03) — follow the
  `account_deletion_log` precedent.
- Whether `parent_id` is nullable initially then tightened, or `NOT NULL` from the start after
  backfill within the same transaction.
- Test structure for the new resolve-chain and multi-row logic — follow the existing
  `src/services/__tests__/webhookLogic.test.js` pure-function pattern (the webhook lib is already
  factored into injectable, testable units).
- Exact wording of the ambiguity error returned by `cancel-subscription` (D-06).
- Whether the `SubscriptionContext` React Query key and Realtime channel name change beyond the
  mandatory `filter: student_id=eq.` → `parent_id=eq.` swap.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements

- `.planning/ROADMAP.md` §"Phase 5: Subscription Re-Pointing" — the 4 success criteria, the
  Pitfall 13 warning, and the research flag requiring dedicated LS sandbox verification.
- `.planning/REQUIREMENTS.md` — MIGRATE-04 (the sole requirement this phase satisfies).

### Prior-phase decisions this phase inherits

- `.planning/phases/01-identity-schema-expand/01-CONTEXT.md` — **D-06**: `parent_subscriptions` is
  the sole carve-out from the `child_profiles` FK sweep, deliberately left for Phase 5 to point at
  `parents`. Also D-05 (child-scoped columns keep the name `student_id` for now) and D-02
  (additive-only; legacy FKs retained until Phase 8).
- `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-CONTEXT.md` — the decision
  that `parent_subscriptions` stays parent-scoped on plain `= auth.uid()` equality with **no**
  `owned_child_ids()` indirection in the billing hot path, and the dual-policy (additive) rollout
  convention.
- `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-phase8-handoff.md` —
  authoritative Phase 8 handoff doc; **this phase appends to it** (D-17).
- `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-05-SUMMARY.md` — records the
  pre-existing migration-history drift (5 migrations live but unrecorded) that rules out a
  Supabase branch as a rehearsal environment (D-09), and the owner-runs-SQL-Editor apply path.

### Live schema & policies being changed

- `supabase/migrations/20260404000001_ensure_subscription_rls.sql` — the current
  `parent_subscriptions_select_own` policy, the `has_active_subscription()` body, and the Realtime
  publication registration. This is the file whose behaviour D-15 and D-16 change.
- `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql` — the `parents` /
  `child_profiles` tables and the dual-FK block; line ~234 documents the `parent_subscriptions`
  carve-out.
- `supabase/migrations/20260801120000_rls_ownership_rewrite.sql` — the `students_score` policies at
  lines ~413/428/447 that call `has_active_subscription((SELECT auth.uid()))`; confirms the call
  sites already pass the parent uid, so only the function body is wrong.
- `supabase/migrations/20260708120000_is_free_node_null_safe.sql` — the `is_free_node(node_id) OR
has_active_subscription(...)` gate shape and its NULL-safety history.

### Code surface

- `supabase/functions/lemon-squeezy-webhook/index.ts` — event routing and the current
  missing-`student_id` guard (returns 200 and drops) that D-03 replaces.
- `supabase/functions/lemon-squeezy-webhook/lib/extractPayload.ts` — the whitelist that must gain
  `parent_id`.
- `supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription.ts` — the upsert with
  `onConflict: 'ls_subscription_id'`; the conflict target stays, the written column changes.
- `supabase/functions/create-checkout/index.ts` — `checkout_data.custom` (D-02) and the
  `user.id !== studentId` defence-in-depth check.
- `supabase/functions/cancel-subscription/index.ts` — the `.maybeSingle()` that D-06 replaces.
- `src/services/subscriptionService.js` — `fetchSubscriptionStatus` (D-05) and
  `fetchSubscriptionDetail` (D-07).
- `src/contexts/SubscriptionContext.jsx` — the Realtime `filter: student_id=eq.${userId}` that must
  become `parent_id`.
- `src/pages/SubscribePage.jsx` (checkout body), `src/pages/ParentPortalPage.jsx` (detail query +
  cancel call), `src/pages/SubscribeSuccessPage.jsx` (query invalidation).
- `src/config/subscriptionConfig.js` — `FREE_NODE_IDS`, which must stay in sync with the Postgres
  `is_free_node()`; unchanged by this phase but adjacent to the gate.

### Existing tests to extend

- `src/services/__tests__/webhookLogic.test.js` — pure-function tests for `extractPayload`; the
  resolve-chain and dead-letter branches belong here.
- `src/services/__tests__/subscriptionService.test.js` — the premium-rule tests that change under
  D-05.

### Deployment

- `docs/DEPLOY.md` — Lemon Squeezy webhook deployment, secret names, and the
  `subscription_plans.lemon_squeezy_variant_id` wiring needed for a test-mode variant (D-10).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`supabase/functions/lemon-squeezy-webhook/lib/`** is already factored into three pure,
  injectable units (`extractPayload`, `verifySignature`, `upsertSubscription`) that take a Supabase
  client rather than creating one. The resolve-chain (D-01) should land as a fourth sibling module
  and be unit-testable with zero Deno environment.
- **`account_deletion_log`** is the established audit-table precedent (HMAC audit log from the
  COPPA hard-delete work) — reuse its shape and RLS posture for the D-03 dead-letter table.
- **Phase 2's transaction-wrapped rehearsal harness** (`02-04-PLAN.md`, `02-apply-log.md`) is the
  template for D-09: an owner-run `BEGIN … assertions … ROLLBACK` against production.
- **Phase 1's `01-fk-checklist.md` / account-segmentation sign-off** is the template for D-11's
  per-row, owner-signed before/after table.
- **`verifySignature.ts`** already implements LS's HMAC scheme — the D-10 replay script signs its
  synthetic payloads with the same secret, so no new crypto work is needed.

### Established Patterns

- **Additive dual-policy rollout.** Phase 2 added all ~39 rewritten policies alongside their legacy
  siblings and let Postgres OR them, deferring drops to Phase 8. D-15 follows this exactly. The
  ~460 `multiple_permissive_policies` advisor WARNs this produces are the expected design, not a
  regression.
- **Owner-gated production applies.** Both the Supabase CLI `db push` path (auto-mode classifier)
  and the MCP `apply_migration` path (read-only connection) are blocked; the owner pastes SQL into
  the Supabase SQL Editor and read-only verification queries confirm the result.
- **Fail-closed content gating with a fail-open billing check.** The subscription gate defaults
  `isPremium` to `false` on error (safe degradation), but D-05 and D-16 deliberately fail _open_
  within the "does this parent have any qualifying row" question — a false negative there revokes
  a paying customer's access.
- **UUID reuse from Phase 1** means that for all 15 migrated accounts,
  `parents.id === child_profiles.id === legacy students.id === auth.uid()`. This makes the backfill
  near-trivial for existing rows _and_ is why the resolve-chain's first probe (`parents`) is
  expected to succeed — but it also means a test that only exercises migrated data proves nothing
  about a second child, whose UUID is fresh.

### Integration Points

- The client is already parent-keyed **by accident**: `SubscriptionContext`, `SubscribePage`, and
  `ParentPortalPage` all pass `user.id` — now the parent auth uid post-Phase 3/4 — into a column
  literally named `student_id`. The client work is therefore a rename plus the Realtime filter
  swap, not a re-architecture.
- `students_score` INSERT/UPDATE RLS calls `has_active_subscription((SELECT auth.uid()))` at three
  sites in `20260801120000_rls_ownership_rewrite.sql`. Those call sites are already correct; only
  the function body changes (D-16), so Phase 2's security-reviewed policy set stays untouched.
- `parent_subscriptions` is in the `supabase_realtime` publication; the Realtime filter change is
  a client-side concern only, no publication change needed.

</code_context>

<specifics>
## Specific Ideas

- Explicit framing throughout the discussion: a broken webhook that silently fails to renew a real
  paying customer's access is a **support/refund incident, not just a bug** (ROADMAP Pitfall 13).
  Every failure-mode decision in this phase (D-03, D-06, D-08, D-16's `OR` branch) was chosen to
  make that failure loud and recoverable rather than silent.
- The `child_profiles` hop in the resolve-chain is expected to be dead code for the 3 live
  subscriptions — it exists as a safety net, and the D-10 replay suite is where it actually gets
  exercised.

</specifics>

<deferred>
## Deferred Ideas

- **Parent-facing "one subscription covers every child" copy.** Raised as a candidate area and set
  aside — ROADMAP marks this phase **UI hint: no**, and the paywall/portal copy change is
  cosmetic. If wanted, it belongs with Phase 6's re-consent screen work, where parent-facing copy
  is already in scope.
- **`SubscriptionContext` semantics under the Phase 4 active-child model** beyond the mandatory
  filter swap — e.g. whether the query key should encode family rather than user identity. Set
  aside as an internal naming concern with no behavioural consequence, since the subscription is
  family-wide by definition (D-05 milestone-level).
- **Dropping `student_id` from the checkout payload, the column, the legacy policy, and the
  shim** — all four are Phase 8 by D-04/D-14/D-15/D-16/D-17, recorded in `02-phase8-handoff.md`.

</deferred>

---

_Phase: 5-Subscription Re-Pointing_
_Context gathered: 2026-08-05_
