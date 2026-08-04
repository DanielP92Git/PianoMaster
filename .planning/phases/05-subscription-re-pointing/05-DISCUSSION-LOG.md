# Phase 5: Subscription Re-Pointing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-05
**Phase:** 5-subscription-re-pointing
**Areas discussed:** Webhook shim & failure mode, Multi-row semantics, Sandbox verification plan, Legacy student_id lifecycle

---

## Webhook shim & failure mode

### Q1 — How should a legacy `custom_data.student_id` resolve to a parent?

| Option                                      | Description                                                                                                                 | Selected |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| Resolve-chain: `parents` → `child_profiles` | Try `parents.id = X`, then `child_profiles.id = X → parent_id`, then unresolved. One code path for legacy and new payloads. | ✓        |
| Child-first lookup only                     | Always treat the id as a `child_profiles.id`. Breaks for ids already parent uids; NULL for the 5 teacher-owned children.    |          |
| Explicit key discrimination                 | Use `custom_data.parent_id` when present, fall back to child lookup. Depends on the checkout change shipping first.         |          |

**User's choice:** Resolve-chain
**Notes:** UUID reuse from Phase 1 means all 3 live subs are expected to hit `parents` on the first probe; the child hop is the safety net.

### Q2 — What should `create-checkout` embed in `checkout_data.custom`?

| Option                                        | Description                                                                                                        | Selected |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| Both `parent_id` and legacy `student_id`      | Parent uid under both keys during transition; zero LS-side config; covers in-flight checkouts spanning the deploy. | ✓        |
| `parent_id` only                              | Clean immediately; slightly riskier if a warm old function version only reads `student_id`.                        |          |
| Keep only `student_id` holding the parent uid | Zero code change; permanently cements a misleading field name in the LS payload.                                   |          |

**User's choice:** Both keys
**Notes:** `student_id` is dropped from the payload in Phase 8.

### Q3 — What happens when the resolve-chain finds no parent?

| Option                               | Description                                                                                                                      | Selected |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 200 + dead-letter row + Sentry alert | Persist the payload to an audit table, alert, stop LS retries. Replayable by hand. Follows the `account_deletion_log` precedent. | ✓        |
| 500 so LS retries                    | An unresolvable UUID never becomes resolvable — converts one failure into days of retry noise with no persisted evidence.        |          |
| 200 + Sentry alert, no table         | Lighter, but the payload only lives in Edge Function logs.                                                                       |          |

**User's choice:** 200 + dead-letter row + Sentry alert
**Notes:** Replaces today's silent `console.error` + 200 + never-written-row. A child with `parent_id = NULL` (the 5 teacher-owned profiles) falls into this same path by construction.

### Q4 — How long does the shim live?

| Option                                        | Description                                                                     | Selected |
| --------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| Remove in Phase 8 with the legacy policy drop | Tracked handoff item, same evidence bar (verified zero traffic first).          | ✓        |
| Keep permanently                              | LS can replay historical events; ~10 lines. Carries a dead branch forever.      |          |
| Remove once the 3 live subs are re-pointed    | Tightest cleanup, but removes the net while Phase 6's migration is still ahead. |          |

**User's choice:** Remove in Phase 8

---

## Multi-row semantics

### Q1 — Authoritative rule for "is this family premium?"

| Option                                      | Description                                                                                                                               | Selected |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Any active row wins — align JS to Postgres  | Keep the `EXISTS(any qualifying row)` semantics; rewrite JS to match. Removes the split-brain where the DB allows a write the UI forbids. | ✓        |
| Most-recent row wins — align Postgres to JS | Tidier conceptually, but a stale cancelled row created after an active one revokes a paying customer's access.                            |          |
| Enforce one row per parent (unique index)   | Strongest invariant, but the webhook upserts on `ls_subscription_id`, so a genuine second LS subscription would start failing.            |          |

**User's choice:** Any active row wins
**Notes:** Fails open toward the paying customer.

### Q2 — Which row should Cancel target?

| Option                                           | Description                                                                                                      | Selected |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------- |
| The one active row — distinct error if ambiguous | Zero active → existing 404. More than one active → distinct error + alert rather than an arbitrary pick.         | ✓        |
| Cancel every active row                          | Guarantees billing stops, but multi-call with no transaction — partial failure leaves the parent half-cancelled. |          |
| Most-recent row only                             | Minimal change, never throws, but can leave an older subscription silently billing.                              |          |

**User's choice:** The one active row, error if ambiguous
**Notes:** Also fixes today's `.maybeSingle()`, which throws on multiple rows and blocks cancellation entirely.

### Q3 — What should the Parent Portal display?

| Option                                       | Description                                                                                                       | Selected |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| Active row; fall back to most-recent if none | Portal always agrees with the gate the parent experiences; lapsed parents keep their history and renew/cancel UI. | ✓        |
| Active row only, empty state if none         | Strictest agreement, but a just-lapsed parent loses all billing history exactly when they want it.                |          |
| Leave it on most-recent                      | Smallest diff; accepts a known display/behaviour divergence on the one screen built for parents.                  |          |

**User's choice:** Active row, fall back to most-recent

### Q4 — Add a DB-level guard against two simultaneously-active subscriptions?

| Option                              | Description                                                                                                                   | Selected |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| No constraint — detect and alert    | Read-only audit query in verification plus the Q2 ambiguity alert.                                                            | ✓        |
| Partial unique index on active rows | Self-enforcing, but a legitimate second LS subscription → constraint violation → 500 → retry storm on a live payment.         |          |
| Constraint plus a webhook pre-check | Strongest correctness, but makes the webhook mutate rows it wasn't asked about — big added blast radius on the riskiest path. |          |

**User's choice:** No constraint

---

## Sandbox verification plan

### Q1 — Where should verification run?

| Option                                   | Description                                                                                      | Selected |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| Production, in a rolled-back transaction | Phase 2 Wave 3 pattern. Immune to the migration-history drift; only place the 3 live rows exist. | ✓        |
| A Supabase branch                        | Clean isolation, but the 5 drifted migrations mean a branch doesn't reproduce production schema. |          |
| Local `supabase start`                   | Fast, but same drift problem plus no real LS callbacks without a tunnel.                         |          |

**User's choice:** Production, rolled-back transaction
**Notes:** Drift evidence: `02-05-SUMMARY.md` records 5 migrations live in production but unrecorded in `npx supabase migration list`.

### Q2 — How should the three Edge Functions be verified?

| Option                                                     | Description                                                                                                   | Selected |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| Both: HMAC-signed replays + one real LS test-mode checkout | Replays cover branches LS won't produce on demand (SC-3); the test-mode checkout proves the full loop (SC-4). | ✓        |
| Signed replays only                                        | Fully scriptable, but never proves the real payload shape matches expectations.                               |          |
| Real test-mode checkout only                               | Highest realism, but can't produce a legacy or unresolvable payload, leaving SC-3 untested.                   |          |

**User's choice:** Both

### Q3 — What counts as SC-2's per-customer proof?

| Option                                     | Description                                                                                                                                         | Selected |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Per-row before/after table, owner-signed   | Each sub by `ls_subscription_id` with resolved `parent_id`, parent email, status, period end — pre and post backfill. Mirrors `01-fk-checklist.md`. | ✓        |
| Per-row table plus a live login smoke test | Strongest evidence (matches the D-29 smoke tests), but needs a real account you can sign into.                                                      |          |
| Automated SQL assertions only              | Repeatable and cheap, but proves internal consistency, not that row X belongs to customer X.                                                        |          |

**User's choice:** Per-row before/after table, owner-signed

### Q4 — Backout path?

| Option                                                 | Description                                                                                                                 | Selected |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| Committed down-migration + revertable function deploys | Reverse migration in the same commit as the forward one (Phase 1 `01-04` pattern); previous function versions redeployable. | ✓        |
| Down-migration only                                    | Lighter, but the functions are where the paying-customer risk lives.                                                        |          |
| Forward-fix only                                       | Least work; leaves you improvising during a live billing incident.                                                          |          |

**User's choice:** Down-migration + revertable function deploys

---

## Legacy student_id lifecycle

### Q1 — How to introduce `parent_id`?

| Option                                    | Description                                                                                                              | Selected |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| Add + backfill, stop writing `student_id` | FK to `parents(id)`, backfill via the resolve-chain, writers target `parent_id` only; `student_id` frozen until Phase 8. | ✓        |
| Add + backfill + dual-write `student_id`  | Max rollback safety, but the columns drift the moment a parent has a second child.                                       |          |
| Rename `student_id` → `parent_id`         | One column, no Phase 8 cleanup, but a breaking non-additive rename on the live billing table.                            |          |

**User's choice:** Add + backfill, stop writing `student_id`

### Q2 — What happens to `parent_subscriptions_select_own`?

| Option                                                | Description                                                                                                           | Selected |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| Add a `parent_id` sibling policy, keep the legacy one | Postgres OR's permissive policies — neither pre- nor post-deploy client is locked out. Phase 2's dual-policy pattern. | ✓        |
| Replace outright                                      | One policy, no new advisor warning, but a window where an unreloaded client is locked out of the billing table.       |          |
| Single policy covering both columns                   | Same coverage, no extra policy row, but diverges from Phase 2's convention so Phase 8 must special-case it.           |          |

**User's choice:** Sibling policy alongside the legacy one

### Q3 — How should `has_active_subscription(uuid)` change?

| Option                                          | Description                                                                                                                     | Selected |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Swap body in place, `parent_id OR student_id`   | Call sites unchanged; the `OR` is deploy-window insurance against a stale function writing only `student_id`. Drops in Phase 8. | ✓        |
| Swap body in place, `parent_id` only            | Cleanest, but a narrow window where a stale-written row reads as unsubscribed.                                                  |          |
| New `has_active_family_subscription(parent_id)` | Explicit, but forces re-pointing every `students_score` policy — drags Phase 2's security-reviewed set back into scope.         |          |

**User's choice:** Body swap in place with the `OR` branch

### Q4 — How should the Phase 8 cleanup items be handed off?

| Option                                        | Description                                                                                     | Selected |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| Append to the existing `02-phase8-handoff.md` | STATE.md already flags it as authoritative reading before Phase 8 planning — one place to look. | ✓        |
| A separate `05-phase8-handoff.md`             | Self-contained, but Phase 8 must know to read both.                                             |          |
| CONTEXT.md only                               | No extra artifact, but the highest-odds way for a cleanup item to be silently dropped.          |          |

**User's choice:** Append to `02-phase8-handoff.md`

---

## Claude's Discretion

- Shape, name, retention, and RLS of the unresolved-webhook dead-letter table — follow the `account_deletion_log` precedent.
- Whether `parent_id` starts nullable then tightens, or is `NOT NULL` from the start after in-transaction backfill.
- Test structure for the resolve-chain and multi-row logic — follow the existing `webhookLogic.test.js` pure-function pattern.
- Exact wording of the `cancel-subscription` ambiguity error.
- Whether the `SubscriptionContext` query key / Realtime channel name change beyond the mandatory filter swap.

## Deferred Ideas

- **Parent-facing "one subscription covers every child" copy** — ROADMAP marks this phase UI hint: no. Belongs with Phase 6's re-consent screen work if wanted.
- **`SubscriptionContext` semantics under the Phase 4 active-child model** beyond the filter swap — internal naming only, no behavioural consequence.
- **Dropping `student_id` from the payload, column, policy, and shim** — all four are Phase 8, recorded in `02-phase8-handoff.md`.
