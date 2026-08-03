---
phase: 2
slug: rls-rewrite-ownership-based-access-control
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-01
last_audited: 2026-08-03
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **DB/DDL phase** — validation is SQL-assertion-based against a Supabase rehearsal
> branch, mirroring Phase 1's D-28 precedent. No JS test framework covers RLS policy behavior.
> Source of truth: `02-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property               | Value                                                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | None (DB/DDL) — SQL-assertion scripts (`02-db-assertions.sql`) run against a Supabase branch                                                                                                                   |
| **Config file**        | none — Wave 0 authors `02-db-assertions.sql`                                                                                                                                                                   |
| **Quick run command**  | Supabase MCP `execute_sql` (read-only assertions) against the rehearsal branch, or `npx supabase db execute --file .planning/phases/02-rls-rewrite-ownership-based-access-control/02-db-assertions.sql`        |
| **Full suite command** | `02-db-assertions.sql` (pg_policies audits + adversarial suite + recursion test) + `EXPLAIN ANALYZE` performance protocol + `npm run test:run` (proves zero client-visible regression, mirroring Phase 1 D-29) |
| **Estimated runtime**  | ~60s SQL suite + `npm run test:run`                                                                                                                                                                            |

---

## Sampling Rate

- **After every task commit:** Re-run the relevant `pg_policies` audit block for the table(s) just touched, against the rehearsal branch.
- **After every plan wave:** Full `02-db-assertions.sql` (all 6 requirement checks) + `npm run test:run`.
- **Before `/gsd-verify-work`:** Full SQL suite green + `/gsd-secure-phase` pass closed + owner-gated production apply (mirroring Phase 1 D-27).
- **Max feedback latency:** ~90 seconds.

---

## Per-Requirement Verification Map

| Req ID | Behavior                                                                                           | Test Type                                                     | Automated Command                                                                                                                    | File Exists | Status                     |
| ------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------- | -------------------------- |
| RLS-01 | `owned_child_ids()` exists, is `SECURITY INVOKER` SQL `STABLE`, and inlines                        | SQL assertion + `EXPLAIN ANALYZE`                             | `02-db-assertions.sql` L24–31 (`prosecdef`/`provolatile` ASSERT) + inlining protocol (`02-inlining-verdict.md`)                      | ✅          | ✅ green (rehearsal PASS)  |
| RLS-02 | Every table in the ~24-table inventory has BOTH a legacy and a `_parent_owner` sibling per command | SQL assertion (`pg_policies` count)                           | `02-db-assertions.sql` L59–101 (dual-policy coverage ASSERT over embedded 24-table/46-cmd list)                                      | ✅          | ✅ green (rehearsal PASS)  |
| RLS-03 | Every `_parent_owner` INSERT/UPDATE has non-null, correct `with_check`                             | SQL assertion                                                 | `02-db-assertions.sql` L115–122 (non-null `WITH CHECK` ASSERT)                                                                       | ✅          | ✅ green (rehearsal PASS)  |
| RLS-04 | No `42P17` recursion after all policies live                                                       | SQL assertion + Advisors/logs                                 | `02-db-assertions.sql` L126–133 (static guard ASSERT) + L136 (26-table runtime touch); Advisors/`get_logs` deferred to Wave 4 (D-29) | ✅          | ✅ green (rehearsal PASS)  |
| RLS-05 | No measurable regression vs. legacy baseline @ ~20-student counts                                  | `EXPLAIN ANALYZE` before/after (human-judged — not an ASSERT) | `02-db-assertions.sql` L172 protocol; empirical timings + Advisors deferred to Wave 4 / Plan 05 (D-29)                               | ✅ protocol | ⚠️ manual-only — see below |
| RLS-06 | Cross-family zero-rows + null-parent (teacher-owned) 3-way reachability proven adversarially       | SQL assertion (JWT-claims impersonation)                      | `02-db-assertions.sql` L194–293 (6-case adversarial matrix, `request.jwt.claims` + `SET ROLE`)                                       | ✅          | ✅ green (rehearsal PASS)  |

_Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ manual-only/deferred_

_All 6 assertion blocks were exercised in the Plan 04 owner-run rehearsal (transaction-wrapped `BEGIN…ROLLBACK` against production `hdltcvgqrtxuxgjdvzzu`). Reaching the final post-rollback all-zeros `SELECT` proves every `ASSERT` passed (a failed ASSERT raises P0004 and aborts first). Full trail: `02-apply-log.md`._

---

## Wave 0 Requirements

- [x] `02-db-assertions.sql` — full SQL-assertion suite (RLS-01…RLS-06 checks), structured like Phase 1's `01-db-assertions.sql` — committed `13518014`
- [x] `02-policy-inventory.md` — committed, owner-reviewable version of the RESEARCH Concrete Per-Table Inventory (mirrors Phase 1 D-04 `01-fk-checklist.md` discipline). Edge-case scoping resolved by CONTEXT.md D-31/D-32/D-33 — committed `e38355b1`
- [x] Synthetic second family seeded (`02-seed-second-family.sql`, `6e96a3a7`) — used by the Plan 04 rehearsal (seeded inside the rollback-only transaction) for RLS-06 case 2/6 and RLS-05's cross-family cost check
- [x] Framework install: none needed (DB/DDL phase)

---

## Manual-Only Verifications

| Behavior                        | Requirement   | Why Manual                                                                                                                                                                                                                                                                                                    | Test Instructions                                                                                                                                                                                                                                                                              |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance parity (RLS-05)     | RLS-05        | `EXPLAIN ANALYZE` before/after is a human-judged perf comparison, not a pass/fail `ASSERT`; empirical timings + Advisors can't read uncommitted mid-transaction DDL, so **deferred to Wave 4 / Plan 05** by owner decision **D-29**. Structural precondition (INVOKER+STABLE) already verified by RLS-01 PASS | At the owner-gated production apply (Plan 05): run `02-db-assertions.sql` L172 `EXPLAIN (ANALYZE, BUFFERS)` before/after against the committed schema + `get_advisors` + `get_logs` 42P17 — confirm no per-row `Function Scan on owned_child_ids` and no cost regression at ~20-student counts |
| Owner-gated production apply    | all           | Production DDL apply is owner-authorized (Phase 1 D-27 precedent), not automated                                                                                                                                                                                                                              | Owner reviews the applied migration + post-apply `pg_policies` audit against production                                                                                                                                                                                                        |
| `/gsd-secure-phase` review pass | RLS-01…RLS-06 | Dedicated adversarial security review flagged in ROADMAP                                                                                                                                                                                                                                                      | `/gsd-secure-phase 2` — DONE (`02-SECURITY.md`, commit `abf4269f`); production apply itself remains owner-gated in Plan 05                                                                                                                                                                     |

---

## Validation Sign-Off

- [x] All requirements have an `<automated>` SQL assertion or a justified manual verification (RLS-01/02/03/04/06 automated ASSERTs; RLS-05 manual-only/deferred per D-29)
- [x] Sampling continuity: no wave merges without the full SQL suite + `npm run test:run`
- [x] Wave 0 covers all MISSING references (`02-db-assertions.sql`, `02-policy-inventory.md`, seeded 2nd family) — all committed
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-02 (plan-checker VERIFICATION PASSED; Nyquist Dimension 8 satisfied). `wave_0_complete` flipped `true` on 2026-08-03 after Wave 0 artifacts were committed and exercised in the Plan 04 rehearsal.

---

## Validation Audit 2026-08-03

State A audit (`/gsd-validate-phase 2`). Cross-referenced RLS-01…RLS-06 against `02-db-assertions.sql` and the Plan 04 rehearsal (`02-apply-log.md`).

| Metric                                              | Count                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| Requirements                                        | 6                                                                 |
| Automated (SQL ASSERT, exists + green in rehearsal) | 5 (RLS-01, -02, -03, -04, -06)                                    |
| Manual-only / deferred                              | 1 (RLS-05 — perf parity, deferred to Wave 4/Plan 05 per D-29)     |
| Missing (no coverage)                               | 0                                                                 |
| Gaps found                                          | 0                                                                 |
| Test files generated                                | 0 (SQL suite already complete; no JS target for the DB/DDL phase) |
| Escalated                                           | 0                                                                 |

**Outcome:** Nyquist-compliant. No test-generation gaps — the SQL-assertion suite pre-existed Wave 0 and covers every automatable requirement; the single non-automated requirement (RLS-05) is an inherent performance judgment with a documented manual protocol and owner-gated deferral. `wave_0_complete` and File-Exists flags updated to reflect committed artifacts.

**Open (by design, not a validation gap):** Plan 05 (Wave 4, owner-gated production apply) not yet executed — it owns the RLS-05 empirical EXPLAIN/Advisors/`42P17` capture against the committed schema.
