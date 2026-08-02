---
phase: 02-rls-rewrite-ownership-based-access-control
plan: 04
subsystem: database
tags: [postgres, rls, supabase, rehearsal]

# Dependency graph
requires:
  - phase: 02-rls-rewrite-ownership-based-access-control (plan 03)
    provides: "supabase/migrations/20260801120000_rls_ownership_rewrite.sql + .down.sql (authored, unapplied)"
provides:
  - "02-apply-log.md — PASS: transaction-wrapped (BEGIN...ROLLBACK) rehearsal against production proved the migration applies cleanly, is fully reversible, is idempotent on re-apply, and enforces ownership (RLS-01..RLS-06 all green). Nothing persisted."
  - "02-rehearsal-runbook.sql — the owner-run consolidated rehearsal script (apply + seed + assertions + down + re-apply, all inside one rolled-back transaction)."
affects: [02-05, phase 8]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Transaction-wrapped no-branch rehearsal directly against production: BEGIN; up-migration; synthetic seed; assertion suite; down-migration; re-apply; ROLLBACK. Migration BEGIN;/COMMIT; wrappers stripped so the inner sequence does not prematurely commit the outer transaction."
    - "Session-persistent CREATE TEMP TABLE _rehearsal_vars (created pre-BEGIN) to carry live-looked-up UUIDs through a single-paste script with no interactive variable capture; GRANT SELECT ... TO authenticated so impersonated (SET ROLE) reads can see it."
    - "RLS impersonation for adversarial testing: set_config('request.jwt.claims', ...) + SET ROLE authenticated; per case, RESET after."

key-files:
  created:
    - .planning/phases/02-rls-rewrite-ownership-based-access-control/02-apply-log.md
    - .planning/phases/02-rls-rewrite-ownership-based-access-control/02-rehearsal-runbook.sql
  modified: []

key-decisions:
  - "Rehearsal run manually by the owner in the Supabase SQL Editor after automated sessions could not obtain a credentialed transport to production (auto-mode classifier denied curl/CLI/MCP in the worktree agent, and denied the orchestrator's agent-spawn). Orchestrator supplied the exact runnable SQL; owner pasted+ran it as one execution and relayed output."
  - "Synthetic teachers seeded inside the rollback-only transaction because production has exactly one real teacher, connected to none of the 5 null-parent profiles — RLS-06 cases 4/5 had no real subject otherwise."
  - "RLS-05 empirical EXPLAIN timings deferred to Wave 4's real apply (D-29): the SQL Editor surfaces only the final result grid, and Supabase Advisors read via a separate connection that cannot see uncommitted mid-transaction DDL. Structural inlining precondition (INVOKER+STABLE) is verified via RLS-01."

requirements-completed: [RLS-01, RLS-02, RLS-03, RLS-04, RLS-06]

# Metrics
duration: iterative (owner-run rehearsal + harness fixes)
completed: 2026-08-03
---

# Phase 2 Plan 04: RLS Rehearsal — PASS (transaction-wrapped, production, rolled back)

**The owner-run rehearsal completed cleanly end-to-end. The full `up-migration -> synthetic seed -> assertion suite -> down-migration -> re-apply` sequence ran inside one `BEGIN; ... ROLLBACK;` against production `hdltcvgqrtxuxgjdvzzu`. All assertions passed (reaching the final post-rollback `SELECT` is proof — any failed ASSERT would have raised P0004 and aborted first), and the post-rollback counts confirm nothing persisted: `owned_child_ids()` gone, all 50 `_parent_owner` policies gone, synthetic Parent B + synthetic teachers gone. RLS-01, RLS-02, RLS-03, RLS-04, and all 6 RLS-06 cases verified green against real production data shape.**

## Accomplishments

- **Task 1 (apply / down / re-apply) — PASS.** Migration applies cleanly; down-migration cleanly reverses it (function dropped, 0 `_parent_owner` policies); re-apply is idempotent (function + 50 policies recreated). All asserted inside the transaction.
- **Task 2 (assertion suite) — PASS.** RLS-01 (INVOKER+STABLE), RLS-02 (dual-policy coverage over the 24-table/46-cmd inventory), RLS-03 (non-trivial WITH CHECK on every INSERT/UPDATE sibling), RLS-04(a) static recursion guard + RLS-04(b) 26-table runtime touch with zero errors, and the full 6-case RLS-06 adversarial matrix including cross-family UPDATE rejection.
- **Task 3 (RLS-05 perf) — structurally verified, empirical timings deferred to Wave 4.** `owned_child_ids()` confirmed `SECURITY INVOKER` + `STABLE` (the planner-inlinable shape per `02-inlining-verdict.md`); empirical EXPLAIN before/after + Advisors + `get_logs` 42P17 check will be captured against the committed schema in Plan 05 per D-29 (the SQL Editor returned only the final grid, and Advisors can't see uncommitted DDL).
- **Authored the consolidated runbook** (`02-rehearsal-runbook.sql`) that made a single-paste, self-contained, fully-rolled-back production rehearsal possible with no branch and no interactive variable capture.

## Runbook fixes during the run (harness only — migration untouched)

1. `GRANT SELECT ON _rehearsal_vars TO authenticated;` — temp table is owned by the connecting role; impersonated reads failed without it.
2. Seeded two synthetic teachers (`...d0` connected, `...d1` unconnected) + one accepted connection inside the rollback-only transaction, since production's single real teacher has no null-parent-profile connection.
3. Rewrote `parent_a`/`parent_a_child` as a single joined `pa` CTE row (two independent LIMIT-1 subqueries had resolved to different parents, causing a false RLS-06 case-1 failure).
4. Corrected the policy-count asserts from `51` to `50` (the `51` wrongly counted `child_profiles_select_teacher`, which lacks the `_parent_owner` suffix).

Neither `20260801120000_rls_ownership_rewrite.sql` nor its `.down.sql` was modified.

## Files Created/Modified

- `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-apply-log.md` — rewritten with the real PASS outcome, per-requirement verdict table, RLS-06 matrix, policy-count reconciliation, harness fixes, and accepted gaps.
- `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-rehearsal-runbook.sql` — the consolidated owner-run rehearsal script.

## Next Phase Readiness

- **Ready to proceed to Plan 05 (Wave 4 — owner-gated production apply).** Plan 05's precondition — RLS-02..RLS-06 proven green against a real applied schema — is now satisfied by this rehearsal. The migration and down-migration are unchanged.
- Plan 05 still owns the actual production `COMMIT`, the post-apply D-29 verification (empirical EXPLAIN/Advisors/42P17), and the Phase 8 handoff — all explicitly `autonomous: false`.
- `npm run test:run` (DB-independent, mocked) still to be run separately per CLAUDE.md.

---

_Phase: 02-rls-rewrite-ownership-based-access-control_
_Completed: 2026-08-03 (PASS)_
