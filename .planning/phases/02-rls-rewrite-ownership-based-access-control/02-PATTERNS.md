# Phase 2: RLS Rewrite — Ownership-Based Access Control - Pattern Map

**Mapped:** 2026-08-01
**Files analyzed:** 5 planned artifacts (1 migration + 1 optional down-migration + 2 committed docs, all covering the same ~39-policy / 24-table + helper-function + 2-function-repoint worklist)
**Analogs found:** 5 / 5

This is a **DB/DDL phase** — no React/JS files. Every planned file is a SQL migration or a committed
SQL-assertion / markdown-inventory artifact under `.planning/phases/02-.../`.

---

## File Classification

| New/Modified File                                                                                                                                                                                                                                                 | Role                                                      | Data Flow                                            | Closest Analog                                                                                                                                                                                                                                                                                                                                                | Match Quality                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `supabase/migrations/<ts>_rls_ownership_rewrite.sql` (main Phase 2 migration: `owned_child_ids()` helper + `child_profiles` own policies + ~39 `_parent_owner` sibling policies across Group A/B/C tables + edge cases + `award_xp`/`check_rate_limit` re-points) | migration (DDL)                                           | CRUD (policy predicates), event-driven (N/A)         | `supabase/migrations/20260127000003_optimize_rls_auth_plan.sql` (owner-first `(SELECT auth.uid())` template, DROP+CREATE POLICY pairing) + `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql` (structural shape: numbered `BEGIN`/`COMMIT` sections, header comment block, additive-only discipline)                                     | exact (structure) / role-match (content — this migration ADDs siblings, doesn't DROP+replace) |
| `supabase/migrations/<ts>_rls_ownership_rewrite.down.sql` (optional rollback, mirrors Phase 1's D-27 rehearsal precedent)                                                                                                                                         | migration (DDL, rollback)                                 | CRUD (reverse)                                       | `supabase/migrations/20260722120000_add_parents_and_child_profiles.down.sql`                                                                                                                                                                                                                                                                                  | exact                                                                                         |
| `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-db-assertions.sql`                                                                                                                                                                             | test (SQL-assertion suite)                                | batch / request-response (impersonated SQL sessions) | `.planning/phases/01-identity-schema-expand/01-db-assertions.sql`                                                                                                                                                                                                                                                                                             | exact                                                                                         |
| `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-policy-inventory.md`                                                                                                                                                                           | config / committed inventory (owner-reviewable checklist) | batch (generated-then-hand-annotated)                | `.planning/phases/01-identity-schema-expand/01-fk-checklist.md`                                                                                                                                                                                                                                                                                               | exact                                                                                         |
| `owned_child_ids()` function body (lives inside the main migration, not a separate file)                                                                                                                                                                          | utility (SQL helper, `SECURITY INVOKER` `STABLE`)         | request-response (inlined subquery)                  | `is_admin()` in `supabase/migrations/20260131000001_audit_rls_policies.sql` (closest _shape_ precedent — single-purpose auth-check function) — **NOTE: `is_admin()` is `SECURITY DEFINER`/`plpgsql`, the opposite of RLS-H1's required `SECURITY INVOKER`/`sql STABLE`; do not copy its security posture, only its search_path-pinning + comment convention** | role-match (convention only, NOT security posture)                                            |

---

## Pattern Assignments

### `supabase/migrations/<ts>_rls_ownership_rewrite.sql` (migration, CRUD policy rewrite)

**Primary analog:** `supabase/migrations/20260127000003_optimize_rls_auth_plan.sql`
**Structural analog:** `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql`
**Secondary analogs:** `supabase/migrations/20260131000001_audit_rls_policies.sql` (search_path pinning, audit-query-as-verification), `supabase/migrations/20260128000001_consolidate_rls_policies.sql` (explicit-inline-SQL-over-shared-functions convention, though Phase 2 deliberately breaks this convention once for `owned_child_ids()` per RLS-H1)

**Header/structure pattern** (copy from `20260722120000_add_parents_and_child_profiles.sql` lines 1-24):

```sql
-- =============================================================================
-- Migration:   <ts>_rls_ownership_rewrite
-- Date:        2026-08-0X
-- Milestone:   v4.0 — Parent-First Account Architecture (COPPA), Phase 2
-- Description: Additive, reversible RLS rewrite (RLS-01..RLS-06). Adds
--              owned_child_ids() SECURITY INVOKER SQL STABLE helper +
--              ~39 parent-ownership sibling policies across the 24-table
--              inventory (Groups A/B/C), OR'd alongside legacy
--              `student_id = auth.uid()` policies (dual-policy, D-02-style
--              additive discipline). Re-points award_xp/check_rate_limit
--              ownership checks (D-23). Legacy policies are NOT dropped —
--              that is Phase 8's contract step.
-- Source artifacts (owner-signed):
--               .planning/phases/02-.../02-policy-inventory.md
--               .planning/phases/02-.../02-CONTEXT.md (D-31/D-32/D-33)
-- Rollback:     <ts>_rls_ownership_rewrite.down.sql
-- =============================================================================

BEGIN;
```

Section-numbering convention (`-- 1. ...`, `-- 2. ...`) from the same file's body — use one numbered
section per table (or per Group), not one giant undifferentiated block, so the migration reads the
same way `02-policy-inventory.md` is organized (Group A / Group B / Group C / edge cases / function
re-points).

**Ownership helper — exact text to ship** (per RESEARCH's "Ownership Helper — Exact Contract", styled
per `20260131000001_audit_rls_policies.sql`'s `search_path` pinning convention, lines 34-54 of that
file, but note the SECURITY posture flips):

```sql
CREATE OR REPLACE FUNCTION public.owned_child_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT id
  FROM public.child_profiles
  WHERE parent_id = (SELECT auth.uid());
$$;

COMMENT ON FUNCTION public.owned_child_ids() IS
  'Returns the child_profiles.id set owned by the calling parent (auth.uid()). '
  'SECURITY INVOKER (deliberately NOT DEFINER, per RLS-H1 deviation — DEFINER blocks '
  'planner inlining and is the RLS-05 perf-cliff anti-pattern). Downstream-only: '
  'never call from child_profiles'' own policies (RLS-H2, immediate 42P17).';
```

`GRANT EXECUTE ... TO authenticated;` — copy the grant-after-create convention from
`20260131000001_audit_rls_policies.sql` line 50 (`GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;`).

**`child_profiles`' own two terminal policies** (Group C, additive — no DROP, table currently has zero
policies per Phase 1 D-16 deny-all):

```sql
CREATE POLICY "child_profiles_all_parent_owner"
  ON public.child_profiles
  FOR ALL
  USING (parent_id = (SELECT auth.uid()))
  WITH CHECK (parent_id = (SELECT auth.uid()));

CREATE POLICY "child_profiles_select_teacher"
  ON public.child_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_student_connections tsc
      WHERE tsc.teacher_id = (SELECT auth.uid())
        AND tsc.student_id = child_profiles.id
        AND tsc.status = 'accepted'
    )
  );
```

Teacher-branch `EXISTS` shape copied verbatim (only the joined column renamed conceptually — text is
identical since D-30 keeps `tsc.student_id`) from `20260127000003_optimize_rls_auth_plan.sql` lines
86-97 ("Teachers can view connected students").

**Per-command rewrite templates — DO NOT DROP the legacy policy** (this is the one deliberate deviation
from `20260127000003`'s and `20260128000001`'s DROP-then-CREATE convention: those two migrations
_replace_ policies; Phase 2 _adds_ new ones alongside, per CONTEXT's "add, don't replace" organizing
idea). Only `CREATE POLICY` statements appear in this migration — never `DROP POLICY IF EXISTS` against
a legacy policy name.

SELECT:

```sql
CREATE POLICY "<table>_select_parent_owner"
  ON public.<table>
  FOR SELECT
  USING (<id_col> IN (SELECT public.owned_child_ids()));
```

INSERT:

```sql
CREATE POLICY "<table>_insert_parent_owner"
  ON public.<table>
  FOR INSERT
  WITH CHECK (<id_col> IN (SELECT public.owned_child_ids()));
```

UPDATE (Pitfall 1 — both clauses always explicit, modeled on the UPDATE shape at
`20260127000003_optimize_rls_auth_plan.sql` lines 64-68 and 152-156, which already write both `USING`
and `WITH CHECK` even when identical):

```sql
CREATE POLICY "<table>_update_parent_owner"
  ON public.<table>
  FOR UPDATE
  USING (<id_col> IN (SELECT public.owned_child_ids()))
  WITH CHECK (<id_col> IN (SELECT public.owned_child_ids()));
```

DELETE:

```sql
CREATE POLICY "<table>_delete_parent_owner"
  ON public.<table>
  FOR DELETE
  USING (<id_col> IN (SELECT public.owned_child_ids()));
```

ALL (for the single-policy-per-table shapes — `assignment_submissions`, `instrument_practice_streak`,
`student_daily_challenges`, `user_accessories`, and all 7 Group B tables):

```sql
CREATE POLICY "<table>_all_parent_owner"
  ON public.<table>
  FOR ALL
  USING (<id_col> IN (SELECT public.owned_child_ids()))
  WITH CHECK (<id_col> IN (SELECT public.owned_child_ids()));
```

Naming suffix `_parent_owner` is a locked convention (RESEARCH "Naming convention" section) — every
new policy, regardless of the legacy policy's own naming style, ends in this literal string so both the
RLS-02 audit and the Phase 8 legacy-drop are trivial `LIKE '%_parent_owner'` filters.

**Business-logic-gated policies — preserve verbatim, extend only the ownership half**
(`student_skill_progress`, `students_score` — RESEARCH "Business-Logic-Gated Policies" + Pitfall 5):

```sql
CREATE POLICY "student_skill_progress_insert_parent_owner"
  ON public.student_skill_progress
  FOR INSERT
  WITH CHECK (
    student_id IN (SELECT public.owned_child_ids())
    AND (is_free_node(node_id) OR has_active_subscription((SELECT auth.uid())))
  );
```

Do NOT change the `has_active_subscription((SELECT auth.uid()))` argument — it already takes the
_caller's_ id, not `student_id`, and RESEARCH confirms this is already forward-compatible with Phase 5.
Apply the identical shape to the `_update_parent_owner` sibling and to `students_score`'s equivalent
gated policies. Treat as its own reviewed sub-task, not part of the mechanical batch (Pitfall 5).

**Edge cases (owner-resolved D-31/D-32, scope explicit in CONTEXT.md):**

- `user_preferences` (D-31 — CHILD-scoped): gets the standard SELECT/INSERT/UPDATE `_parent_owner`
  triplet exactly like any other Group B-shaped table, `id_col = student_id`.
- `accessories` (D-32 — IN scope): its two SELECT policies gate via
  `EXISTS (SELECT 1 FROM students s WHERE s.id = (SELECT auth.uid()))` (see
  `20260131000001_audit_rls_policies.sql` lines 109-125, `accessories_select_consolidated`) — do not
  rewrite as a `_parent_owner` sibling using the standard `id_col IN (...)` template (the table has no
  `student_id` column). Instead ADD an `OR EXISTS (SELECT 1 FROM child_profiles WHERE parent_id =
(SELECT auth.uid()))` sibling condition, same shape, read-only, additive.
- `assignments` (D-32 — IN scope): rewrite the embedded **correlated literal**
  `class_enrollments.student_id = auth.uid()` predicate inside `assignments`' own policy text to
  `class_enrollments.student_id IN (SELECT public.owned_child_ids())` — fixing `class_enrollments`'s
  own policy does NOT propagate here; this is a separate, explicit text edit inside `assignments`'
  policy (RESEARCH's flagged "looks-fixed-but-isn't" trap). Call this out in the plan's verification
  step, not just the mechanical batch.

**D-23 function re-points — `award_xp` and `check_rate_limit`.**
Current live block to replace (`supabase/migrations/20260126000001_fix_award_xp_security.sql` lines
28-35, and the identical shape in `supabase/migrations/20260201000002_add_rate_limiting.sql` around
line 86):

```sql
-- BEFORE (current live text, both functions):
IF auth.uid() IS NULL THEN
  RAISE EXCEPTION 'Not authenticated';
END IF;

IF auth.uid() != p_student_id THEN
  RAISE EXCEPTION 'Unauthorized: You can only award XP to yourself';
END IF;
```

Replace the second block with an ownership check (these are `SECURITY DEFINER` functions — they bypass
RLS internally, so the check must be explicit in the function body, it cannot rely on the caller's
RLS-filtered view):

```sql
-- AFTER:
IF p_student_id NOT IN (SELECT public.owned_child_ids()) THEN
  RAISE EXCEPTION 'Unauthorized: You can only award XP to a child you own';
END IF;
```

Use `CREATE OR REPLACE FUNCTION` with the full existing body (both functions), changing only this
block — mirrors `20260126000001_fix_award_xp_security.sql`'s own `DROP FUNCTION` + full
`CREATE OR REPLACE FUNCTION` + `GRANT EXECUTE` + `COMMENT ON FUNCTION` pattern (lines 1-81), i.e. ship
the complete function body in the migration, not a diff. `teacher_get_student_points`,
`teacher_link_student`, `promote_placeholder_student` need **no RLS-relevant change** per D-23
resolution — do not touch them in this migration (out of scope, confirm-read only).

**`WITH CHECK` gap already live today — do not reproduce it.**
`parental_consent_tokens_update_own` currently has `with_check: null` (Pitfall 1, confirmed live). Its
`_parent_owner` sibling MUST write both `USING` and `WITH CHECK` explicitly per the UPDATE template
above — do not copy the missing-check shape forward even though it's the "same table."

**Audit query pattern — RLS-02/RLS-03 verification** (copy shape from
`20260131000001_audit_rls_policies.sql`'s own header-comment "Affected policies" discipline, and from
RESEARCH's dual-policy coverage audit):

```sql
SELECT tablename, cmd,
       count(*) FILTER (WHERE policyname LIKE '%_parent_owner') AS new_policies,
       count(*) FILTER (WHERE policyname NOT LIKE '%_parent_owner') AS legacy_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
ORDER BY tablename, cmd;
```

**Trailer/summary comment** — copy the "Summary:" trailer convention from
`20260127000003_optimize_rls_auth_plan.sql` lines 211-217 (plain-English tally of what changed, table
by table) and end with `COMMIT;`.

---

### `supabase/migrations/<ts>_rls_ownership_rewrite.down.sql` (rollback migration)

**Analog:** `supabase/migrations/20260722120000_add_parents_and_child_profiles.down.sql`

**Pattern** (header + reverse-order idempotent drops, lines 1-13 of the analog):

```sql
-- =============================================================================
-- Down-migration:  <ts>_rls_ownership_rewrite.down.sql
-- Reverses <ts>_rls_ownership_rewrite.sql in reverse object order.
-- Drops ONLY the _parent_owner policies + owned_child_ids() this migration added.
-- Legacy `student_id = auth.uid()` policies are untouched (never touched by Phase 2).
-- award_xp/check_rate_limit revert to the pre-Phase-2 auth.uid()=p_student_id check
-- (paste the BEFORE block back in via CREATE OR REPLACE FUNCTION).
-- Idempotent (IF EXISTS everywhere) for the apply-rollback-re-apply rehearsal.
-- =============================================================================

BEGIN;

DROP POLICY IF EXISTS "<table>_select_parent_owner" ON public.<table>;
-- ... one DROP POLICY IF EXISTS per _parent_owner policy created, reverse order ...

DROP FUNCTION IF EXISTS public.owned_child_ids();

COMMIT;
```

Every `DROP` uses `IF EXISTS` (analog convention, enables safe re-run during rehearsal).

---

### `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-db-assertions.sql`

**Analog:** `.planning/phases/01-identity-schema-expand/01-db-assertions.sql`

**Structural pattern to copy** (header block, lines 1-13 of the analog):

```sql
-- =============================================================================
-- 02-db-assertions.sql  —  Phase 2 (v4.0) RLS rewrite verification suite
-- Migration: <ts>_rls_ownership_rewrite
-- Run AFTER apply, against the rehearsal branch (psql -f or MCP execute_sql).
-- Blocks map 1:1 to RLS-01..RLS-06. Each block raises on failure (DO $$ ... ASSERT).
-- Live baseline captured 2026-07-30 (project hdltcvgqrtxuxgjdvzzu):
--   child_profiles = 20 (15 parented, 5 parent_id NULL); 24 in-scope tables, ~39 new policies.
-- =============================================================================
```

**RLS-01 block** (helper shape assertion — `DO $$ ... ASSERT ... END $$;` pattern copied from the
analog's IDENT-01 block, lines 18-39):

```sql
DO $$
BEGIN
  ASSERT (SELECT prosecdef FROM pg_proc WHERE proname='owned_child_ids') = false,
    'RLS-01 FAIL: owned_child_ids() is SECURITY DEFINER, expected SECURITY INVOKER (RLS-H1 deviation)';
  ASSERT (SELECT provolatile FROM pg_proc WHERE proname='owned_child_ids') = 's',
    'RLS-01 FAIL: owned_child_ids() is not STABLE';
END $$;
```

Then the `EXPLAIN (ANALYZE, BUFFERS)` inlining-verification pair (RESEARCH's exact protocol, not an
`ASSERT` — a manual-read block, same "run+diff manual check, documented here" discipline the analog
uses for IDENT-05's pg_constraint query, lines 76-92).

**RLS-02/RLS-03 blocks** — the dual-policy coverage audit and the `WITH CHECK` null-check audit (both
given verbatim in RESEARCH's "Naming convention" and "WITH CHECK Correctness" sections) become `DO $$
... ASSERT (SELECT count(*) FROM (<audit query>) sub) = 0 ... END $$;` blocks, same wrapping style as
the analog's block 6 (RLS deny-all check, lines 120-131):

```sql
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM pg_policies
          WHERE schemaname='public' AND policyname LIKE '%_parent_owner'
            AND cmd IN ('INSERT','UPDATE') AND (with_check IS NULL OR with_check = 'true')) = 0,
    'RLS-03 FAIL: a _parent_owner INSERT/UPDATE policy has NULL or unconditional WITH CHECK';
END $$;
```

**RLS-04 (recursion) + RLS-06 (adversarial) blocks** — these need `SET request.jwt.claims` /
`SET ROLE authenticated` impersonation, which is new to this phase (Phase 1's assertions never
impersonated a session). Model the **wrapping discipline** (not the content) on the analog's blocks 7/8
(lines 157-204): synthetic setup inside `BEGIN; ... ROLLBACK;` so nothing persists, `ASSERT`s for each
expected-row-count checkpoint, one `DO $$` block per case in RESEARCH's 6-row test matrix. Use
`RESET ROLE; RESET request.jwt.claims;` after each impersonation block (RESEARCH's own protocol,
"RLS-06 Adversarial Suite Design" section) rather than the analog's `ROLLBACK`-only pattern, since these
are `SET`/session-GUC changes, not table mutations — combine both: wrap synthetic second-family
inserts in `BEGIN...ROLLBACK` (analog style) and reset role/claims after each impersonated block
(RESEARCH style).

**RLS-05 (performance)** is NOT an `ASSERT` block — it is the `EXPLAIN ANALYZE` before/after protocol
from RESEARCH, documented as commented-out SQL in the file (same treatment the analog gives IDENT-05's
generation query at lines 85-91 — commented reference SQL, not an automated assertion, because it needs
human judgment on "within noise").

**Trailer:** copy the analog's closing comment exactly (lines 206-209):

```sql
-- =============================================================================
-- End of suite. A clean run prints no ERROR. Re-run after rollback+re-apply.
-- =============================================================================
```

---

### `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-policy-inventory.md`

**Analog:** `.planning/phases/01-identity-schema-expand/01-fk-checklist.md`

**Structural pattern to copy** (the analog's full shape — header HTML comment with migration/date/
description/generated-by/total-count, then a markdown table, then an "OWNER SIGN-OFF" block):

```markdown
<!--
Migration:   <ts>_rls_ownership_rewrite (Phase 2, v4.0)
Date:        2026-08-0X
Description: Authoritative RLS policy-rewrite checklist — every policy that reads
             `student_id`/`recipient_id`/`user_id` = auth.uid() (Groups A/B/C) plus
             the 3 owner-resolved edge cases (D-31/D-32). The migration's CREATE
             POLICY statements are written FROM this file, one per row.
Predecessor: 01-fk-checklist.md (Phase 1's structural analog; this is the RLS-scoped
             re-run of the same discipline)
Generated:   LIVE query against production hdltcvgqrtxuxgjdvzzu at 2026-07-30 (RESEARCH)
Total: 24 tables, ~39 policies (30 Group A + 7 Group B + 2 Group C), + 3 edge cases
       resolved D-31 (user_preferences IN) / D-32 (accessories + assignments IN) /
       D-33 (Group B FK-target gap documented, not fixed)
-->

# 02 — Policy Inventory (RLS-02/RLS-03 worklist)

| table                                                                                           | id_col | cmd | legacy policy(ies) | new `_parent_owner` policy | notes |
| ----------------------------------------------------------------------------------------------- | ------ | --- | ------------------ | -------------------------- | ----- |
| ... one row per Group A/B/C table + edge case, transcribed from RESEARCH's inventory tables ... |

## OWNER SIGN-OFF

**Signed:** 2026-08-01 · Owner (Daniel) via CONTEXT.md D-31/D-32/D-33.

- D-31: `user_preferences` classified CHILD-scoped.
- D-32: `accessories` + `assignments` swept in.
- D-33: Group B FK-target gap (7 tables FK'd to `auth.users`) documented as a known
  item for Phase 8, not fixed here.
```

This file's table content is transcribed directly from RESEARCH's `## Concrete Per-Table Inventory`
(Groups A/B/C tables, verbatim) plus the `## Edge Cases Needing Planner Judgment` section — no new
discovery needed at planning time, only transcription + the owner-sign-off block, mirroring how
`01-fk-checklist.md` transcribes its generation query's live output into a reviewable table.

---

## Shared Patterns

### Owner-first `(SELECT auth.uid())` wrapping

**Source:** `supabase/migrations/20260127000003_optimize_rls_auth_plan.sql` (entire file — every policy
wraps `auth.uid()`/`auth.role()` in `(SELECT ...)` for initPlan caching)
**Apply to:** every new policy in the main migration, including inside `owned_child_ids()` itself and
every `_parent_owner` template.

```sql
USING (student_id = (SELECT auth.uid()))   -- NOT: student_id = auth.uid()
```

### Non-correlated `IN` subquery, never correlated `EXISTS`

**Source:** RESEARCH's Pitfall 4 + RLS-H1; no live migration in this repo does this wrong today, but
`20260131000001_audit_rls_policies.sql`'s `accessories_select_consolidated` (lines 109-125) is the one
existing correlated-`EXISTS`-against-a-tiny-table shape in the codebase — useful as a "this pattern
exists, don't extend it to the new 39 policies" negative example.
**Apply to:** every downstream `_parent_owner` policy — always `<id_col> IN (SELECT public.owned_child_ids())`, never `EXISTS (SELECT 1 FROM child_profiles cp WHERE cp.id = <outer>.student_id AND cp.parent_id = (SELECT auth.uid()))`.

### Explicit `WITH CHECK` on every INSERT/UPDATE, never omitted

**Source:** RESEARCH's Pitfall 1 (`parental_consent_tokens_update_own`'s live `with_check: null` gap) +
the UPDATE template shape already used correctly at
`20260127000003_optimize_rls_auth_plan.sql` lines 64-68.
**Apply to:** every `_parent_owner` INSERT/UPDATE/ALL policy in the main migration.

### `search_path` pinning on every new/replaced function

**Source:** `supabase/migrations/20260131000001_audit_rls_policies.sql` line 47
(`SET search_path = public`) and `20260722120000_add_parents_and_child_profiles.sql`'s trigger
functions (same convention, lines 123, 172, 217).
**Apply to:** `owned_child_ids()` and the `CREATE OR REPLACE FUNCTION` for `award_xp`/`check_rate_limit`.

### `pg_policies` audit-as-verification (no test framework)

**Source:** `supabase/migrations/20260131000001_audit_rls_policies.sql` (whole-file convention: SQL
queries ARE the test) + `.planning/phases/01-identity-schema-expand/01-db-assertions.sql` (`DO $$ ...
ASSERT ... END $$;` wrapping).
**Apply to:** `02-db-assertions.sql` in its entirety — this project has zero DB test framework (pgTAP
explicitly rejected per Phase 1 D-28 precedent, reaffirmed in RESEARCH's "Don't Hand-Roll" table).

### Additive-only / dual-policy discipline (the one deviation from the two closest analogs)

**Source:** CONTEXT.md's "organizing idea" + `20260722120000_add_parents_and_child_profiles.sql`'s own
D-02 "ADD ONLY" discipline (lines 19-21, 230-235 — new FK constraints added, legacy FK kept, no DROP).
**Apply to:** the main migration's every `CREATE POLICY` statement — explicitly do NOT copy
`20260127000003_optimize_rls_auth_plan.sql`'s or `20260128000001_consolidate_rls_policies.sql`'s
`DROP POLICY IF EXISTS <legacy-name>` pattern; those two migrations _replace_, Phase 2 _adds_.

---

## No Analog Found

None — every planned file has a same-repo structural analog (all 5 rows above matched). The one
partial-mismatch is `owned_child_ids()`'s security posture (`SECURITY INVOKER`/`sql STABLE`), which has
no same-shape precedent in this codebase (`is_admin()` is the closest _shape_ match but is deliberately
the opposite security posture — flagged explicitly in the File Classification table above so the
planner does not copy `SECURITY DEFINER` by habit).

## Metadata

**Analog search scope:** `supabase/migrations/*.sql` (37 files), `.planning/phases/01-identity-schema-expand/*`
**Files scanned:** 9 (5 fully read: `20260127000003`, `20260131000001`, `20260128000001` (partial, 80
lines), `20260722120000` + its `.down.sql`, `20260126000001_fix_award_xp_security.sql`; 2 grepped for
line hits: `20260201000002_add_rate_limiting.sql`; plus the 2 Phase 1 committed artifacts
`01-db-assertions.sql`, `01-fk-checklist.md`, and `01-function-inventory.md` read in full)
**Pattern extraction date:** 2026-08-01
