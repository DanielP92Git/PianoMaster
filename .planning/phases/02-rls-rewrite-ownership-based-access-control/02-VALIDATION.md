---
phase: 2
slug: rls-rewrite-ownership-based-access-control
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-01
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

| Req ID | Behavior                                                                                           | Test Type                                | Automated Command                                                                                         | File Exists |
| ------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- |
| RLS-01 | `owned_child_ids()` exists, is `SECURITY INVOKER` SQL `STABLE`, and inlines                        | SQL assertion + `EXPLAIN ANALYZE`        | `SELECT prosecdef, provolatile, prolang FROM pg_proc WHERE proname='owned_child_ids'` + inlining protocol | ❌ W0       |
| RLS-02 | Every table in the ~24-table inventory has BOTH a legacy and a `_parent_owner` sibling per command | SQL assertion (`pg_policies` count)      | Dual-policy coverage audit query (RESEARCH §RLS-02 audit)                                                 | ❌ W0       |
| RLS-03 | Every `_parent_owner` INSERT/UPDATE has non-null, correct `with_check`                             | SQL assertion                            | RLS-03 audit query (RESEARCH)                                                                             | ❌ W0       |
| RLS-04 | No `42P17` recursion after all policies live                                                       | SQL assertion + Advisors/logs            | Recursion test + `get_advisors` / `get_logs` MCP                                                          | ❌ W0       |
| RLS-05 | No measurable regression vs. legacy baseline @ ~20-student counts                                  | `EXPLAIN ANALYZE` before/after           | Performance-verification protocol (RESEARCH §RLS-05)                                                      | ❌ W0       |
| RLS-06 | Cross-family zero-rows + null-parent (teacher-owned) 3-way reachability proven adversarially       | SQL assertion (JWT-claims impersonation) | 6-case test matrix (RESEARCH §RLS-06)                                                                     | ❌ W0       |

_Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `02-db-assertions.sql` — full SQL-assertion suite (RLS-01…RLS-06 checks), structured like Phase 1's `01-db-assertions.sql`
- [ ] `02-policy-inventory.md` — committed, owner-reviewable version of the RESEARCH Concrete Per-Table Inventory (mirrors Phase 1 D-04 `01-fk-checklist.md` discipline). Edge-case scoping is already resolved by CONTEXT.md D-31/D-32/D-33 — the inventory must reflect those.
- [ ] Rehearsal branch confirmed with a **synthetic second family** seeded (2nd parent + child) for RLS-06 case 2/6 and RLS-05's cross-family cost check
- [ ] Framework install: none needed

---

## Manual-Only Verifications

| Behavior                        | Requirement   | Why Manual                                                                       | Test Instructions                                                                       |
| ------------------------------- | ------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Owner-gated production apply    | all           | Production DDL apply is owner-authorized (Phase 1 D-27 precedent), not automated | Owner reviews the applied migration + post-apply `pg_policies` audit against production |
| `/gsd-secure-phase` review pass | RLS-01…RLS-06 | Dedicated adversarial security review flagged in ROADMAP                         | Run `/gsd-secure-phase 2` against the implemented policies before production apply      |

---

## Validation Sign-Off

- [ ] All requirements have an `<automated>` SQL assertion or Wave 0 dependency
- [ ] Sampling continuity: no wave merges without the full SQL suite + `npm run test:run`
- [ ] Wave 0 covers all MISSING references (`02-db-assertions.sql`, `02-policy-inventory.md`, seeded 2nd family)
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
