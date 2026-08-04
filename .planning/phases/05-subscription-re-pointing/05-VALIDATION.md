---
phase: 5
slug: subscription-re-pointing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-05
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `05-RESEARCH.md` §"Validation Architecture".

**Standing note:** this phase has **no single automated gate that proves MIGRATE-04 end-to-end**. It is
inherently a mixed automated + owner-signed manual gate, because SC-2 requires per-customer
verification against real billing identities and SC-4 requires a real Lemon Squeezy test-mode
checkout. Do not let a green Vitest suite be read as phase completion.

---

## Test Infrastructure

| Property               | Value                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest (existing, project-wide)                                                                                 |
| **Config file**        | `vitest.config.js` (existing; already stubs `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`)                     |
| **Quick run command**  | `npx vitest run src/services/__tests__/webhookLogic.test.js src/services/__tests__/subscriptionService.test.js` |
| **Full suite command** | `npm run test:run`                                                                                              |
| **Estimated runtime**  | Quick ~5s · Full ~90s (2303 tests green at Phase 4 close)                                                       |

---

## Sampling Rate

- **After every task commit:** Run the quick run command (webhook + subscription-service test files) — no DB or network dependency.
- **After every plan wave:** Run `npm run test:run`. Zero-regression convention applies (Phase 2 closed 2160/2160, Phase 4 closed 2303/2303).
- **Before `/gsd-verify-work`:** Full suite green **AND** all four manual gates below signed off.
- **Max feedback latency:** 5 seconds (quick) / 90 seconds (full).

---

## Per-Task Verification Map

> Populated by `gsd-planner` — one row per task across all Phase 5 plans.
> Every task must resolve to an `<automated>` verify command **or** an explicit manual gate below.

| Task ID   | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status     |
| --------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | ----------------- | ----------- | ---------- |
| _pending_ | —    | —    | MIGRATE-04  | —          | —               | —         | —                 | —           | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

### Success-criteria → evidence map (from RESEARCH.md)

| SC                                        | Behavior                                                                                                                                   | Test Type                                 | Command / Evidence                                                                       | Exists?                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| SC-1 (column + RLS)                       | `parent_id` column exists; dual SELECT policy present; no `owned_child_ids()` in the billing path                                          | DB assertion inside rehearsal transaction | Owner-run `BEGIN … ROLLBACK` with `pg_policies` / `pg_constraint` `ASSERT` blocks        | ❌ Wave 0 — `05-rehearsal-runbook.sql`                                      |
| SC-1 (`has_active_subscription()`)        | Returns TRUE for a `parent_id`-only row **and** for a legacy `student_id`-only row                                                         | SQL assertion, same transaction           | `DO $$ … ASSERT … $$` block in the rehearsal script                                      | ❌ Wave 0                                                                   |
| SC-1 (JS "any active row wins")           | Multiple rows, one qualifying → premium true; zero qualifying → false                                                                      | Vitest, mocked Supabase client            | `npx vitest run src/services/__tests__/subscriptionService.test.js`                      | ✅ extend (D-05)                                                            |
| SC-2 (3 live subs)                        | Each real `ls_subscription_id` maps to the correct real `parent_id`, **individually**                                                      | Manual, owner-signed                      | Per-row before/after table (D-11), templated on `01-fk-checklist.md`                     | N/A — manual by design                                                      |
| SC-3 (resolve-chain + dead-letter)        | Legacy shape resolves via the `child_profiles` hop; unresolvable id → dead-letter row + Sentry + HTTP 200; parent-less child → dead-letter | Vitest unit + HMAC replay integration     | `npx vitest run src/services/__tests__/webhookLogic.test.js` + replay script run (D-10a) | ❌ Wave 0 — `resolveParent` tests + `05-webhook-replay.mjs`                 |
| SC-3 (`extractPayload` gains `parent_id`) | Extracts `parent_id` from `custom_data`, prefers it over `student_id`                                                                      | Vitest unit                               | `npx vitest run src/services/__tests__/webhookLogic.test.js`                             | ✅ extend existing `describe`                                               |
| SC-4 (checkout/cancel on `parent_id`)     | Full LS test-mode checkout → webhook → DB row correct → cancel succeeds                                                                    | Manual walkthrough                        | Local Supabase stack, test-mode LS key + variant (D-10b)                                 | N/A — manual by design                                                      |
| D-06 (cancel ambiguity)                   | 2 active rows for one parent → distinct error + alert, **no** cancellation performed                                                       | Vitest unit, mocked client                | New test over the extracted decision function                                            | ❌ Wave 0 — requires factoring `cancel-subscription` logic into a pure unit |

---

## Wave 0 Requirements

- [ ] `05-rehearsal-runbook.sql` — templated from `02-rehearsal-runbook.sql`; covers `ALTER TABLE ADD COLUMN parent_id`, the two-pass resolve-chain backfill `UPDATE`, the dual-policy `CREATE POLICY`, the `has_active_subscription()` `CREATE OR REPLACE`, the down-migration, and re-apply — all inside one `BEGIN … ROLLBACK` against production (D-09)
- [ ] `supabase/functions/lemon-squeezy-webhook/lib/resolveParent.ts` — the D-01 resolve-chain as a fourth pure, injectable sibling module
- [ ] Resolve-chain unit tests in `src/services/__tests__/webhookLogic.test.js` (or a new sibling file)
- [ ] Dead-letter write path (`lib/deadLetter.ts` or inline — discretion) + its test coverage (D-03)
- [ ] **Pure extraction of `cancel-subscription`'s "select rows → classify active → decide" logic** — currently monolithic in `index.ts`, so D-06's ambiguity branch is not unit-testable at all today
- [ ] `05-webhook-replay.mjs` — HMAC-signed synthetic replay script reusing `verifySignature.ts`'s scheme (D-10a)
- [ ] `05-subscription-checklist.md` — owner sign-off before/after table for the 3 live subscriptions, templated on `01-fk-checklist.md` (D-11)
- [ ] Local Supabase stack seed data (synthetic parent/child/plan row + test-mode LS variant id) for the D-10b real checkout — **local only**, must not touch production `subscription_plans`
- [ ] Committed down-migration authored in the same commit as the forward migration (D-12), following the `20260803120000_add_parent_age_verified.sql` + `.down.sql` convention

---

## Manual-Only Verifications

| Behavior                                                      | Requirement       | Why Manual                                                                                                                                   | Test Instructions                                                                                                                                                                 |
| ------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All 3 live subscriptions resolve to the correct owning parent | MIGRATE-04 / SC-2 | Requires correlating real Lemon Squeezy dashboard customer identity with DB rows — no automated oracle for "is this the right human"         | Capture the per-row table (ls_subscription_id, resolved parent_id, parent email, status, period end) pre- and post-backfill; owner signs each row individually (D-11)             |
| Real LS test-mode checkout → webhook → DB → UI loop           | MIGRATE-04 / SC-4 | A genuine checkout completion cannot be scripted end-to-end; LS test mode is keyed on the API key, so it needs an isolated stack             | Local Supabase stack with test-mode `LS_API_KEY` + test-mode variant; complete a checkout, assert the resulting row carries `parent_id`, then cancel it via `cancel-subscription` |
| Production migration apply                                    | MIGRATE-04 / SC-1 | Owner-gated by precedent (D-13) — CLI `db push` is blocked by the auto-mode classifier and MCP `apply_migration` by the read-only connection | Owner pastes SQL into the Supabase SQL Editor; read-only verification queries confirm the result                                                                                  |
| Rehearsal transaction PASS output                             | MIGRATE-04 / SC-1 | Runs against production inside `BEGIN … ROLLBACK`; cannot run unattended                                                                     | Owner runs `05-rehearsal-runbook.sql`, captures the assertion output into `05-apply-log.md`                                                                                       |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references above
- [ ] No watch-mode flags in any verify command
- [ ] Feedback latency < 90s (full suite)
- [ ] All four manual gates signed off (SC-2 table, SC-4 checkout, production apply, rehearsal PASS)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
