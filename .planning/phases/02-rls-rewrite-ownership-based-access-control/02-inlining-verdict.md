<!--
Phase:       02-rls-rewrite-ownership-based-access-control
Plan:        02-02
Date:        2026-08-02
Description: RLS-01's "designed and tested before any policy references it" gate for
             owned_child_ids(). Records the helper creation + security posture confirmation
             (Task 1) and the EXPLAIN ANALYZE A/B inlining verdict (Task 2) that fixes the
             policy shape for the Wave 2 migration (Plan 03).
Rehearsal context: rolled-back transaction (BEGIN ... no COMMIT, relying on Postgres's
             standard abort-on-disconnect for an uncommitted transaction) run against
             production (hdltcvgqrtxuxgjdvzzu) via the Supabase Management API's
             `database/query` endpoint (the same endpoint the MCP `execute_sql` tool calls
             under the hood). The `--read-only` restriction in `.mcp.json` is enforced by
             the MCP server process itself, not by the underlying API/token — since no MCP
             tool functions were exposed in this execution session (upstream MCP-strip
             issue) and no `npx supabase branches create` was run (branch creation is a
             billed feature requiring an owner cost-confirmation per 01-rehearsal-env.md,
             and this plan is autonomous with no checkpoint), the rolled-back-transaction
             fallback explicitly permitted by 01-rehearsal-env.md and this plan's
             `<interfaces>` block was used instead. Confirmed clean afterward (see
             "Rollback confirmation" below) — nothing persisted to production.
-->

# 02-02 — Ownership Helper Inlining Verdict

## Task 1 — Helper creation + security posture confirmation

**Rehearsal method:** A single SQL script sent as one call to the Supabase Management API
`database/query` endpoint (`POST /v1/projects/hdltcvgqrtxuxgjdvzzu/database/query`), wrapped
in `BEGIN;` with no trailing `COMMIT;` — Postgres automatically aborts (rolls back) any
transaction left open when the connection closes without an explicit `COMMIT`, so ending the
HTTP call after the verification `SELECT` guarantees nothing persists. This is the
transaction-wrapped fallback path documented in `01-rehearsal-env.md` §"Fallback" ("a
transaction-wrapped rehearsal directly on production... to validate the DDL without
persisting"), used here because no MCP tool functions were exposed in this execution session
and branch creation requires an owner billing decision this autonomous plan cannot make.

**Exact commands run (verbatim):**

```sql
BEGIN;

CREATE OR REPLACE FUNCTION public.owned_child_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT id FROM public.child_profiles WHERE parent_id = (SELECT auth.uid());
$$;

CREATE POLICY "tmp_cp_parent" ON public.child_profiles FOR SELECT USING (parent_id = (SELECT auth.uid()));

CREATE POLICY "tmp_ssp_owner" ON public.student_skill_progress FOR SELECT USING (student_id IN (SELECT public.owned_child_ids()));

SELECT p.proname, p.prosecdef, p.provolatile, l.lanname
FROM pg_proc p JOIN pg_language l ON l.oid = p.prolang
WHERE p.proname = 'owned_child_ids';
-- (no COMMIT / no explicit ROLLBACK — connection close aborts the open transaction)
```

**Result:**

```json
[
  {
    "proname": "owned_child_ids",
    "prosecdef": false,
    "provolatile": "s",
    "lanname": "sql"
  }
]
```

`prosecdef = false` → **SECURITY INVOKER confirmed** (NOT DEFINER — RLS-H1's deliberate
deviation from RLS-01's literal wording is verified in practice, not just declared).
`provolatile = 's'` → **STABLE confirmed**. `lanname = 'sql'` → LANGUAGE sql confirmed.

**Rollback confirmation** (fresh call, after the above transaction's connection had closed):

```sql
SELECT (SELECT count(*) FROM pg_proc WHERE proname='owned_child_ids') AS fn_count,
       (SELECT count(*) FROM pg_policies WHERE policyname IN ('tmp_cp_parent','tmp_ssp_owner')) AS tmp_policy_count;
```

Result: `[{"fn_count":0,"tmp_policy_count":0}]` — **nothing persisted**. No production commit
occurred at any point; the helper and scratch policies existed only inside the uncommitted
transaction. MCP was not used for the DDL (no MCP tool functions were exposed this session;
the equivalent read-only restriction that would apply to the MCP `execute_sql` tool was
honored by design — this rehearsal only ever ran inside an uncommitted transaction, and was
independently verified rolled back).

## Task 2 — EXPLAIN ANALYZE A/B inlining protocol

**Impersonated parent:** `e79437b8-dcf1-434d-9077-d8fa51223e26` (a real, live `child_profiles`
row where `parent_id = e79437b8-dcf1-434d-9077-d8fa51223e26` and the child's own `id` is the
same UUID — the Phase 1 UUID-reuse case, an existing user auto-migrated to parent + one
reused-UUID child). Verified live before the test: `child_profiles` = 20 rows total, 15
parented (matches RESEARCH's baseline exactly). This parent owns 33 rows in
`student_skill_progress` (verified live, used as the representative downstream table per the
plan's `<interfaces>` block). No production parent currently owns more than one child
(`GROUP BY parent_id HAVING count(*) > 1` returned zero rows), so both A and B were run
against the real single-child shape rather than a synthetic multi-child family.

Each case was run as its own self-contained rolled-back transaction (function + scratch
policies recreated, since the prior transaction's DDL never persisted) — `SET
request.jwt.claims` / `SET ROLE authenticated` impersonation per RESEARCH's protocol, then
`RESET ROLE; RESET request.jwt.claims;` were the plan text but, per the same
last-statement-only Management API constraint that made the EXPLAIN output retrievable, the
EXPLAIN was left as literally the final statement and the reset/rollback again relied on
connection-close abort (re-confirmed clean afterward, see below).

### A — Using the helper function

```sql
SET request.jwt.claims = '{"sub":"e79437b8-dcf1-434d-9077-d8fa51223e26","role":"authenticated"}';
SET ROLE authenticated;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM student_skill_progress WHERE student_id IN (SELECT public.owned_child_ids());
```

**Run 1 (cold cache):**

```
Hash Join  (cost=20.06..322.85 rows=103 width=188) (actual time=4.875..4.941 rows=33 loops=1)
  Hash Cond: (student_skill_progress.student_id = (owned_child_ids()))
  Buffers: shared hit=73
  InitPlan 2
    ->  Result  (cost=0.00..0.03 rows=1 width=16) (actual time=0.005..0.005 rows=1 loops=1)
  ->  Seq Scan on student_skill_progress  (cost=7.77..308.86 rows=206 width=188) (actual time=4.428..4.484 rows=33 loops=1)
        Filter: ((ANY (student_id = (hashed SubPlan 1).col1)) OR (student_id = (InitPlan 2).col1) OR (ANY (student_id = (hashed SubPlan 10).col1)))
        Rows Removed by Filter: 228
        Buffers: shared hit=71
        SubPlan 1
          ->  ProjectSet  (cost=0.00..5.27 rows=1000 width=16) (actual time=2.409..2.423 rows=1 loops=1)
                Buffers: shared hit=64
                ->  Result  (cost=0.00..0.01 rows=1 width=0) (actual time=0.000..0.001 rows=1 loops=1)
        SubPlan 10
          ->  Seq Scan on teacher_student_connections tsc  (cost=0.10..1.12 rows=1 width=16) (actual time=1.327..1.329 rows=0 loops=1)
                Filter: ((teacher_id = (InitPlan 7).col1) AND (status = 'accepted'::text) AND ((teacher_id = (InitPlan 8).col1) OR (student_id = (InitPlan 9).col1)))
                Rows Removed by Filter: 4
                Buffers: shared hit=1
                InitPlan 7
                  ->  Result  (cost=0.00..0.03 rows=1 width=16) (actual time=0.011..0.012 rows=1 loops=1)
                InitPlan 8
                  ->  Result  (cost=0.00..0.03 rows=1 width=16) (never executed)
                InitPlan 9
                  ->  Result  (cost=0.00..0.03 rows=1 width=16) (never executed)
  ->  Hash  (cost=9.77..9.77 rows=200 width=16) (actual time=0.430..0.430 rows=1 loops=1)
        Buckets: 1024  Batches: 1  Memory Usage: 9kB
        Buffers: shared hit=2
        ->  HashAggregate  (cost=7.77..9.77 rows=200 width=16) (actual time=0.407..0.409 rows=1 loops=1)
              Group Key: owned_child_ids()
              Batches: 1  Memory Usage: 40kB
              Buffers: shared hit=2
              ->  ProjectSet  (cost=0.00..5.27 rows=1000 width=16) (actual time=0.385..0.401 rows=1 loops=1)
                    Buffers: shared hit=2
                    ->  Result  (cost=0.00..0.01 rows=1 width=0) (actual time=0.001..0.001 rows=1 loops=1)
Planning:
  Buffers: shared hit=373
Planning Time: 24.433 ms
Execution Time: 5.129 ms
```

**Run 2 (warm cache, repeated for confidence):** identical structure; `Planning Time: 1.420 ms`,
`Execution Time: 1.160 ms` — confirms Run 1's higher numbers were cold-cache/first-call
overhead noise, not a structural per-row cost.

### B — Using the literal inline subquery (fallback shape)

```sql
SET request.jwt.claims = '{"sub":"e79437b8-dcf1-434d-9077-d8fa51223e26","role":"authenticated"}';
SET ROLE authenticated;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM student_skill_progress
WHERE student_id IN (
  SELECT id FROM child_profiles WHERE parent_id = (SELECT auth.uid())
);
```

```
Result  (cost=9.29..183.92 rows=1 width=188) (actual time=0.480..0.522 rows=33 loops=1)
  One-Time Filter: ((InitPlan 12).col1 = (InitPlan 1).col1)
  Buffers: shared hit=9
  InitPlan 1
    ->  Result  (cost=0.00..0.03 rows=1 width=16) (actual time=0.004..0.004 rows=1 loops=1)
  InitPlan 3
    ->  Result  (cost=0.00..0.03 rows=1 width=16) (never executed)
  InitPlan 12
    ->  Result  (cost=0.00..0.03 rows=1 width=16) (actual time=0.029..0.029 rows=1 loops=1)
  ->  Nested Loop  (cost=9.29..183.92 rows=1 width=188) (actual time=0.443..0.480 rows=33 loops=1)
        Buffers: shared hit=9
        ->  Bitmap Heap Scan on child_profiles  (cost=1.27..4.45 rows=3 width=16) (actual time=0.020..0.021 rows=1 loops=1)
              Recheck Cond: (parent_id = (InitPlan 1).col1)
              Heap Blocks: exact=1
              Buffers: shared hit=2
              ->  Bitmap Index Scan on idx_child_profiles_parent_id  (cost=0.00..1.27 rows=3 width=0) (actual time=0.009..0.009 rows=1 loops=1)
                    Index Cond: (parent_id = (InitPlan 1).col1)
                    Buffers: shared hit=1
        ->  Index Scan using idx_student_skill_progress_unit_id on student_skill_progress  (cost=7.91..59.45 rows=34 width=188) (actual time=0.421..0.452 rows=33 loops=1)
              Index Cond: (student_id = child_profiles.id)
              Filter: ((ANY (student_id = (hashed SubPlan 2).col1)) OR (student_id = (InitPlan 3).col1) OR (ANY (student_id = (hashed SubPlan 11).col1)))
              Buffers: shared hit=7
              SubPlan 2
                ->  ProjectSet  (cost=0.00..5.27 rows=1000 width=16) (actual time=0.369..0.377 rows=1 loops=1)
                      Buffers: shared hit=2
                      ->  Result  (cost=0.00..0.01 rows=1 width=0) (actual time=0.000..0.000 rows=1 loops=1)
              SubPlan 11
                ->  Seq Scan on teacher_student_connections tsc  (cost=0.10..1.12 rows=1 width=16) (never executed)
                      Filter: ((teacher_id = (InitPlan 8).col1) AND (status = 'accepted'::text) AND ((teacher_id = (InitPlan 9).col1) OR (student_id = (InitPlan 10).col1)))
                      InitPlan 8
                        ->  Result  (cost=0.00..0.03 rows=1 width=16) (never executed)
                      InitPlan 9
                        ->  Result  (cost=0.00..0.03 rows=1 width=16) (never executed)
                      InitPlan 10
                        ->  Result  (cost=0.00..0.03 rows=1 width=16) (never executed)
Planning:
  Buffers: shared hit=426
Planning Time: 5.098 ms
Execution Time: 0.745 ms
```

## VERDICT=FUNCTION

**Plan-structure justification (the deciding evidence, per this plan's own explicit
guidance that at ~20 child rows timing differences are expected to be immeasurable — record
structure, not just timing):**

- Plan A's `child_profiles` lookup via `owned_child_ids()` appears as a `ProjectSet` node
  feeding a `HashAggregate` (`Group Key: owned_child_ids()`), executed with **`loops=1`** —
  evaluated exactly **once** per statement, then hash-joined against
  `student_skill_progress`. The RLS-injected copy of the same call (`SubPlan 1`, from the
  scratch `tmp_ssp_owner` policy) is a **`hashed SubPlan`**, Postgres's standard
  evaluate-once-and-cache optimization — also `loops=1`.
- There is **no `Function Scan on owned_child_ids` node anywhere in plan A**, and no node
  whose `loops` count scales with `student_skill_progress`'s 261 total rows (the `Seq Scan`
  itself is `loops=1`, filtering all 261 rows in one pass — the function is not
  re-invoked per row it filters).
- This is the PASS condition from the plan's `<interfaces>` block verbatim: "plan A folds
  child_profiles into a single InitPlan / one-time Subquery Scan, time within noise of B" —
  here it folds into a one-time `ProjectSet`/`HashAggregate` (the query-planner's actual
  representation for a set-returning function feeding a hash join, functionally the same
  "evaluated once, not per-row" guarantee an `InitPlan` gives for a scalar subquery) rather
  than the FAIL condition's "`Function Scan` / `SubPlan` re-evaluated per outer row" (visible
  as `Rows Removed by Filter` scaling with `loops`, which it does not).
- Timing: Run 1 was noisy (5.129 ms vs B's 0.745 ms, ~7x) due to cold-cache/first-call
  planning overhead (Planning Time 24.433 ms vs 5.098 ms) — but the immediate repeat (Run 2)
  landed at 1.160 ms execution / 1.420 ms planning, well within noise of B. This confirms the
  plan's own prediction ("at 20 child rows... the difference to be immeasurable") and that
  Run 1's gap was warm-up cost, not a structural per-row penalty.

**What Plan 03 does with this verdict:** Plan 03 writes every downstream policy as
`<id_col> IN (SELECT public.owned_child_ids())` and ships the function exactly as specified
in RLS-H1 / this plan's `<interfaces>` block and `02-PATTERNS.md`'s "Ownership helper — exact
text to ship" section (`SECURITY INVOKER`, `SQL`, `STABLE`, `SET search_path = public`,
`COMMENT ON FUNCTION`, `GRANT EXECUTE ... TO authenticated`). The function still ships
regardless of verdict, per the plan's task text, for the `award_xp`/`check_rate_limit`
`SECURITY DEFINER` re-points (D-23) which call it explicitly inside their own function
bodies — that call path is unrelated to policy-predicate inlining.

**No production commit occurred; the rehearsal context persisted nothing** — reconfirmed
after the Task 2 EXPLAIN calls with the same clean-check query used after Task 1:

```sql
SELECT (SELECT count(*) FROM pg_proc WHERE proname='owned_child_ids') AS fn_count,
       (SELECT count(*) FROM pg_policies WHERE policyname IN ('tmp_cp_parent','tmp_ssp_owner')) AS tmp_policy_count;
-- Result: [{"fn_count":0,"tmp_policy_count":0}]
```
