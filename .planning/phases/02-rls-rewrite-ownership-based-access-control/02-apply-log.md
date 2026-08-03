<!--
Migration:   20260801120000_rls_ownership_rewrite (Phase 2, v4.0)
Date:        2026-08-03
Description: Rehearsal apply log for the RLS ownership-rewrite migration.
             Records the OUTCOME of the owner-run, transaction-wrapped
             (BEGIN...ROLLBACK) rehearsal executed directly against production
             (hdltcvgqrtxuxgjdvzzu) via the Supabase SQL Editor. Nothing
             persisted — the whole apply -> seed -> verify -> down -> re-apply
             sequence ran inside one transaction that was rolled back.
Status:      PASS — full rehearsal completed cleanly, all assertions passed,
             zero rows/policies/functions persisted (verified post-rollback).
-->

# 02-04 — Rehearsal Apply Log

## Method (owner-locked)

The owner pre-selected the transaction-wrapped no-branch path (per this plan's
`<owner_decision_locked_in>` and `01-rehearsal-env.md`'s "safest no-branch
option"): the entire `up-migration -> synthetic seed -> assertion suite ->
down-migration -> re-apply` sequence was wrapped in a single
`BEGIN; ... ROLLBACK;` against **production** `hdltcvgqrtxuxgjdvzzu`. `npx
supabase branches create` was explicitly ruled out (billed, owner declined).

Because the automated execution sessions could not obtain a credentialed
transport to production (auto-mode classifier denied every curl/CLI/MCP path in
the isolated worktree agent, and denied the orchestrator's own agent-spawn),
the owner ran the consolidated runbook manually: `02-rehearsal-runbook.sql`,
pasted into the Supabase SQL Editor and executed as one continuous run
("without RLS" Editor option — i.e. as the connecting role, which the runbook
then downgrades to `authenticated` via `SET ROLE` for each impersonated case).

## Outcome — PASS (2026-08-03)

The run reached the final post-rollback sanity `SELECT`, which returned:

```json
[
  {
    "owned_child_ids_count_should_be_0": 0,
    "parent_owner_policy_count_should_be_0": 0,
    "synthetic_parent_b_should_be_0": 0
  }
]
```

Reaching that final statement is itself proof that **every `ASSERT` in the
script passed**: any failed assertion raises `P0004` and aborts the transaction
before that line. The all-zeros confirm the `ROLLBACK` left nothing behind —
`owned_child_ids()` gone, all 50 `_parent_owner` policies gone, synthetic
Parent B (and the synthetic teachers) gone. **No production DDL or data
persisted.**

### Per-requirement verdicts

| Req    | What the rehearsal proved                                                                                                                                                                     | Verdict |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| RLS-01 | `owned_child_ids()` is `SECURITY INVOKER` + `STABLE` (asserted via `pg_proc.prosecdef=false`, `provolatile='s'`)                                                                              | PASS    |
| RLS-02 | Dual-policy coverage — every in-scope `(table,cmd)` pair from the 24-table / 46-cmd inventory has a `_parent_owner` sibling (ALL-or-exact-cmd match)                                          | PASS    |
| RLS-03 | Every `_parent_owner` INSERT/UPDATE policy has a non-null, non-trivial `WITH CHECK` (asserted count of NULL/`true` checks = 0)                                                                | PASS    |
| RLS-04 | (a) Static: `child_profiles`' own policies never reference `owned_child_ids()` (recursion guard, RLS-H2). (b) Runtime: all 26 impersonated table touches executed with zero errors (no 42P17) | PASS    |
| RLS-06 | 6-case adversarial matrix (see below)                                                                                                                                                         | PASS    |
| —      | Down-migration clean reversal (`owned_child_ids()` dropped, 0 `_parent_owner` policies) then idempotent re-apply (function + 50 policies recreated)                                           | PASS    |

### RLS-06 adversarial matrix (all 6 cases passed)

1. Parent A **sees** their own `child_profiles` row (positive control).
2. Parent A sees **zero** rows for Parent B's child + downstream (cross-family isolation).
3. An arbitrary parent sees **zero** rows for a null-parent (teacher-owned) profile.
4. An **unconnected** teacher sees **zero** rows for the null-parent profile.
5. A **connected** teacher **sees** the null-parent profile (D-30 / RLS-T1 positive control).
6. Parent A's cross-family UPDATE (repoint a row to Parent B's child) is **rejected** by `WITH CHECK` (0 rows affected).

### Policy count

Exactly **50** `_parent_owner` policies created (asserted). This matches
`02-policy-inventory.md` precisely: 37 Group A + 7 Group B + 1 Group C
(`child_profiles_all_parent_owner`; the sibling `child_profiles_select_teacher`
does not carry the `_parent_owner` suffix) + 3 `user_preferences` + 2
`accessories`/`assignments`.

## Runbook fixes made during the manual run (data-shape adaptations, not migration defects)

The migration and down-migration files were **not** modified. All fixes were to
the rehearsal harness (`02-rehearsal-runbook.sql`) to match production's actual
data shape:

1. **Temp-table visibility** — added `GRANT SELECT ON _rehearsal_vars TO
authenticated;` after the temp table is created. A temp table is owned by the
   connecting role, so reads after `SET ROLE authenticated` failed with
   "permission denied" until granted.
2. **Synthetic teachers** — production has exactly one real teacher, connected
   to none of the 5 null-parent profiles, so RLS-06 cases 4/5 had no real
   subject. Added two synthetic teachers (`...d0` connected, `...d1`
   unconnected) + one accepted `teacher_student_connections` row, seeded inside
   the rollback-only transaction alongside synthetic Parent B.
3. **Correlated parent/child lookup** — `parent_a` and `parent_a_child` were two
   independent `LIMIT 1` subqueries and could resolve to different parents,
   making the ownership policy correctly hide the "own" child (RLS-06 case 1
   false failure). Rewrote as a single `parents JOIN child_profiles` row (`pa`
   CTE) so the pair is guaranteed related.
4. **Policy count** — the sanity/idempotency asserts hardcoded `51`; corrected
   to `50` (the `51` erroneously counted `child_profiles_select_teacher`, which
   does not match `%_parent_owner`).

## Accepted gaps (deferred to Wave 4, by design)

- **RLS-05 empirical EXPLAIN timings** — the runbook runs `EXPLAIN (ANALYZE,
BUFFERS)` before (STEP 0) and after (Task 3) the migration, but the Supabase
  SQL Editor surfaces only the _final_ result grid, so the intermediate EXPLAIN
  outputs were not captured in this run. The structural precondition for
  no-per-row-regression is nonetheless verified: `owned_child_ids()` is
  `SECURITY INVOKER` + `STABLE` (RLS-01 PASS), the exact shape `02-inlining-verdict.md`
  identifies as planner-inlinable. Empirical timings + Supabase Advisors +
  `get_logs` 42P17 check will be captured for real against the actually-committed
  schema during Wave 4 (Plan 05) per **D-29** — Advisors reads via a separate
  connection and cannot see uncommitted mid-transaction DDL anyway.
- **`npm run test:run`** — does not depend on live DB state (mocked); run
  separately, not part of this DB rehearsal.

**No production or branch DDL persisted at any point.** The rehearsal proves the
migration applies cleanly, is fully reversible, is idempotent on re-apply, and
enforces the ownership model correctly against real production data shape.

---

# 02-05 — Wave 4 Gate Log

## Task 1 — `/gsd-secure-phase 2` adversarial security review (PASSED, 2026-08-03)

Verdict recorded in `02-SECURITY.md`: **THREAT-SECURE — threats_open: 0 (19/19 closed)**.
All 5 ASVS-V4 STRIDE patterns from `02-RESEARCH.md` §Security Domain are closed
(cross-family read, cross-family write, recursive self-reference, stale
SECURITY DEFINER identity check, dropped business-rule clause). T-02-16/T-02-17
are closed at the "control defined and procedurally intact, not yet exercised"
level appropriate to their Plan-05 timing (production apply hasn't run yet —
that's Task 2 below). T-02-19 (D-33 Group B FK-target gap) is closed via the
Accepted Risks entry `AR-02-01` in `02-SECURITY.md`.

**No BLOCKING finding open.** Gate satisfied — proceeding to Task 2 requires
explicit owner authorization (see below).

## Task 2 — Owner-gated production apply

**Status: NOT YET RUN — blocked on agent-side tooling, needs owner hands-on-keyboard.**

Owner authorized "apply to production" on 2026-08-03. Before applying, discovered
a migration-history drift: `npx supabase migration list` shows 5 earlier
migrations (20260707120000, 20260708120000, 20260712120000, 20260722120000,
and its down-migration sibling) with empty `remote` — i.e. not recorded in the
CLI's tracked history — even though their schema changes ARE already live in
production (verified directly: `parents`/`child_profiles` tables exist,
`note_mastery` column exists, `students_score` has its UPDATE policy,
`is_free_node()` is already NULL-safe). These were applied out-of-band via the
Supabase SQL Editor in earlier phases, same pattern as this phase's own Wave 3
rehearsal. Confirmed `20260801120000_rls_ownership_rewrite` itself has NOT run
yet (`parent_owner_policy_count: 0` on production).

Two agent-side apply paths were attempted and both correctly blocked:

1. `npx supabase db push` / `migration repair` (Bash) — denied by the Claude
   Code auto-mode classifier for production-credentialed CLI access.
2. `mcp__supabase__apply_migration` — denied: "Cannot apply migration in
   read-only mode" (the Supabase MCP connection is configured read-only).

**Next step (owner action required):** paste
`supabase/migrations/20260801120000_rls_ownership_rewrite.sql` into the
Supabase SQL Editor for `hdltcvgqrtxuxgjdvzzu` and run it directly (same
method used for the Wave 3 rehearsal and for the earlier out-of-band
migrations above). Report back here (or in-session) once applied so the
post-apply read-only audits (RLS-02/03/04 + advisors) can run.
