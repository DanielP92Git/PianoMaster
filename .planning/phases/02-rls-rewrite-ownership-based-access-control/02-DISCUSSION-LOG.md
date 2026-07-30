# Phase 2: RLS Rewrite — Ownership-Based Access Control - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-30
**Phase:** 2-rls-rewrite-ownership-based-access-control
**Areas discussed:** Ownership helper contract, Teacher access + null-parent kids

---

## Gray-area selection

| Option                                 | Description                                                                                                                  | Selected |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| Teacher access + null-parent kids      | Rewrite teacher policies now vs valid-by-UUID-reuse; how the 5 parent-less profiles stay teacher-reachable without recursion | ✓        |
| Ownership helper contract              | RLS-01 keystone: parent-only vs unified access helper; shape/security context                                                | ✓        |
| Dual-policy labeling / Phase 8 handoff | Naming/tagging so pg_policies separates legacy vs new for Phase 8                                                            |          |
| Proof & rollout gate                   | How RLS-05/RLS-06 are staged; owner-gated apply; secure-phase timing                                                         |          |

**User's choice:** Teacher access + null-parent kids; Ownership helper contract.
**Notes:** The two are intertwined — the helper's scope determines teacher/null-parent authorization.

---

## Ownership helper contract — Q1: helper shape

| Option                                 | Description                                                                                                                          | Selected |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Set-returning SQL STABLE (Recommended) | `owned_child_ids()` SETOF uuid, non-correlated IN, SECURITY INVOKER; signed deviation from RLS-01's literal SECURITY DEFINER wording | ✓        |
| SECURITY DEFINER, literal RLS-01       | Keep definer as written; bypasses child_profiles RLS (kills recursion) but slower per-row path, accept only if EXPLAIN proves parity |          |
| No function — inline subquery          | Repeated non-correlated inline subquery per table; fastest but no single source of truth (drift risk, Pitfall 2)                     |          |

**User's choice:** Set-returning SQL STABLE (Recommended) → **RLS-H1**.
**Notes:** Reconciles RLS-01 intent with RLS-02 (initPlan cacheability) + RLS-05 + Pitfall 4 (perf).
Tension surfaced from ARCHITECTURE.md:116, which warns SECURITY DEFINER/plpgsql is the per-row cliff.
Inlining to be verified with EXPLAIN ANALYZE.

---

## Ownership helper contract — Q2: recursion invariant

| Option                                                                  | Description                                                                                                                                             | Selected |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Helper downstream-only + terminal child_profiles policies (Recommended) | Helper used only on ~31 downstream tables; child_profiles' own policies use terminal parent + direct teacher-connection EXISTS; asserted by RLS-04 test | ✓        |
| Switch helper to SECURITY DEFINER                                       | Bypass RLS so helper is callable anywhere; contradicts RLS-H1 perf decision                                                                             |          |
| Let me describe it                                                      | —                                                                                                                                                       |          |

**User's choice:** Helper downstream-only + terminal child_profiles policies (Recommended) → **RLS-H2**.
**Notes:** An invoker helper reads child_profiles under RLS, so calling it from child_profiles' own
policy would be immediate 42P17. Downstream-only usage keeps the teacher→connection→child→parent
chain terminating.

---

## Ownership helper contract — Q3: helper scope

| Option                                                             | Description                                                                                                                               | Selected |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Strictly parent-scope; teacher access stays separate (Recommended) | Helper returns only calling parent's children; teacher policies unchanged & outside RLS-02 rewrite; dual-policy only adds parent policies | ✓        |
| Unified can_access_child() (parent OR teacher)                     | One predicate for both; couples two auth models, blurs RLS-01, larger blast radius                                                        |          |

**User's choice:** Strictly parent-scope; teacher access stays separate (Recommended) → **RLS-H3 / D-30**.
**Notes:** Matches RLS-01's exact meaning and research ARCHITECTURE.md:118 (teacher policies keep
their shape). Gives Phase 8 a clean legacy-drop set.

---

## Teacher access + null-parent kids — Q1: null-parent (5 teacher-owned) profiles

| Option                                                                           | Description                                                                                                                              | Selected |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Rely on natural NULL-exclusion + mandate a dedicated negative test (Recommended) | `parent_id = auth.uid()` structurally excludes NULL rows; RLS-06 must prove parent→0, non-connected teacher→0, connected teacher→sees it | ✓        |
| Add a defensive parent_id IS NOT NULL guard                                      | Redundant belt-and-suspenders; no behavior change                                                                                        |          |
| Let me describe it                                                               | —                                                                                                                                        |          |

**User's choice:** Rely on natural NULL-exclusion + mandate a dedicated negative test (Recommended) → **RLS-T1**.
**Notes:** Intended model per milestone D-06 + Phase 6 SC #3 (teacher-owned profiles reachable only by
their connected teacher). No guard added; correctness proven by RLS-06, not inspection.

---

## Wrap-up

| Option                  | Description                                                                                     | Selected |
| ----------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| I'm ready for context   | Write CONTEXT.md; unpicked areas get Phase 1-precedent defaults as Claude's-discretion pointers | ✓        |
| Explore more gray areas | Discuss dual-policy labeling and/or rollout gate                                                |          |

**User's choice:** I'm ready for context.

---

## Claude's Discretion

- Dual-policy labeling / Phase 8 handoff — default to Phase 1 D-04 committed-checklist + a naming
  convention that lets `pg_policies` separate new vs legacy.
- Proof & rollout gating — default to Phase 1 D-27/D-28 (branch rehearsal, owner-gated apply, SQL
  assertions, synthetic second family, real 20-student counts) + `/gsd-secure-phase` before prod.
- Helper null-safety, `search_path`, signature/naming, per-table policy text.
- Which D-23-inventoried SECURITY DEFINER functions are re-pointed in Phase 2 vs Phase 8.

## Deferred Ideas

- Dropping legacy `student_id = auth.uid()` policies — Phase 8.
- Rewriting teacher-connection policies — not done (D-30); re-point only if a future rename happens.
- Re-pointing remaining D-23 functions — split Phase 2 / Phase 8.
- 47 service call sites / 151 `user?.id` audit — Phase 8.
- `parent_subscriptions` RLS re-point — Phase 5 (parent-scoped, sandbox-verified).
