# Phase 2: RLS Rewrite — Ownership-Based Access Control - Research

**Researched:** 2026-07-30
**Domain:** Postgres Row-Level Security rewrite (Supabase project `hdltcvgqrtxuxgjdvzzu`) — dual-policy ownership-based access control
**Confidence:** HIGH (every claim below verified live against the production database via the Supabase Management API `database/query` endpoint — see Sources — not inferred from prior research files)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Ownership Helper Contract**

- **RLS-H1 — Single set-returning SQL `STABLE` helper, `SECURITY INVOKER`, non-correlated `IN`.** The
  one source of truth is `owned_child_ids() RETURNS SETOF uuid` (or equivalent set-returning SQL
  `STABLE` function), consumed as a **non-correlated** `student_id IN (SELECT owned_child_ids())` on
  every child-scoped downstream table. **DEVIATION from RLS-01's literal wording, owner-signed.** Uses
  **`SECURITY INVOKER`** SQL `STABLE` instead of the literal `SECURITY DEFINER STABLE`, because
  `ARCHITECTURE.md`:116 + Pitfall 4 + RLS-05 establish that a `SECURITY DEFINER`/`plpgsql` helper runs
  per-row, cannot be inlined into an initPlan, and is _slower_ than the inline subquery. The invoker
  helper relies on `child_profiles`' own terminal `parent_id = (SELECT auth.uid())` policy to resolve
  the lookup. **Verify inlining with `EXPLAIN ANALYZE`** before trusting it. If the planner cannot
  confirm inlining, fall back to the repeated inline non-correlated subquery (still keeping one
  canonical text) rather than accepting a correlated per-row call.
- **RLS-H2 — Helper is downstream-only; `child_profiles`' own policies use terminal predicates.**
  Because an _invoker_ helper reads `child_profiles` under RLS, calling it from `child_profiles`' own
  policy would be immediate `42P17`. `owned_child_ids()` is used **only** on the downstream child-scoped
  tables. `child_profiles`' own policies never call the helper. Parent branch:
  `parent_id = (SELECT auth.uid())`. Teacher branch: a **direct** `EXISTS` on
  `teacher_student_connections` filtered owner-first by `teacher_id = (SELECT auth.uid())`. Neither
  branch reads `child_profiles`-via-policy, so the chain terminates. **Asserted by the RLS-04 recursion
  test**, not assumed.
- **RLS-H3 — Helper is strictly parent-scope; teacher access is a separate, unchanged mechanism.**
  `owned_child_ids()` returns only the _calling parent's_ owned children. Teacher access is NOT folded
  into the helper; it remains the pre-existing connection-based policies. Consequence: the dual-policy
  rollout **only adds** parent-ownership policies alongside the legacy `student_id = auth.uid()` set.

**Teacher Access + Null-Parent Profiles**

- **D-30 — Teacher-connection policies are left structurally unchanged and are OUT of RLS-02's rewrite
  scope.** They already authorize via `EXISTS (teacher_student_connections …)`, not via
  `student_id = auth.uid()`. Phase 1's D-01 kept the joined column named `student_id`, and UUID reuse
  keeps `tsc.student_id` valid against `child_profiles`, so no re-point is needed. This keeps the blast
  radius small and gives Phase 8 a clean, unambiguous legacy-drop set (only the parent-ownership legacy
  `student_id = auth.uid()` policies).
- **RLS-T1 — Null-parent (teacher-owned) profiles are handled by natural NULL-exclusion; correctness is
  proven by test, not inspection.** The 5 teacher-created profiles have `parent_id = NULL`. Since
  `owned_child_ids()` filters `WHERE parent_id = (SELECT auth.uid())`, SQL three-valued logic means a
  NULL `parent_id` never matches any parent. **No defensive `IS NOT NULL` guard is added.** Correctness
  is locked by REQUIRING the RLS-06 adversarial suite to explicitly cover:
  - (a) an arbitrary parent session returns **zero rows** for a null-parent profile _and its downstream
    data_,
  - (b) a **non-connected** teacher returns zero rows,
  - (c) the **connected** teacher still sees it.

### Claude's Discretion

- **Dual-policy labeling / Phase 8 handoff.** Default: mirror Phase 1's committed-checklist discipline
  (D-04) — a generated `pg_policies` inventory is the authoritative list that drives both the rewrite
  and the RLS-02/RLS-03 verification, with a naming/tagging convention that lets a `pg_policies` query
  cleanly separate new parent-ownership policies from legacy ones so Phase 8 can drop exactly the
  legacy set.
- **Proof & rollout gating.** Default: follow Phase 1's D-27/D-28 precedent — branch-rehearsed apply,
  owner-gated production apply, SQL-assertion tests (row counts + `pg_policies` audits + the RLS-06
  adversarial cases) run on a Supabase branch with a synthetic second family and real ~20-student row
  counts for RLS-05 `EXPLAIN ANALYZE`. The dedicated `/gsd-secure-phase` pass runs against the
  implemented policies before production apply.
- Helper null-safety, `search_path` pinning, exact function signature/naming, and per-table policy
  text — following existing migration style.
- Which of the D-23-inventoried `SECURITY DEFINER` functions are re-pointed in Phase 2 vs deferred to
  Phase 8 — scoped from the committed inventory during planning (see `## D-23 Function Scoping` below —
  RESOLVED by this research).

### Deferred Ideas (OUT OF SCOPE)

- Dropping the legacy `student_id = auth.uid()` policies — Phase 8 (contract step), gated on verified
  zero traffic. This phase leaves both policy sets live.
- Rewriting teacher-connection policies — deliberately not done (D-30); they stay valid via UUID reuse.
- Re-pointing the remaining D-23-inventoried `SECURITY DEFINER` functions not scoped to Phase 2 below —
  Phase 8.
- Auditing the 47 service call sites / 151 `user?.id` references — Phase 8.
- Subscription RLS — `parent_subscriptions` stays parent-scoped (`parent_id = auth.uid()`, no child
  indirection); its re-point is Phase 5.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                                                                                         | Research Support                                                                                                                                                                                |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS-01 | A single ownership helper is the one source of truth for "does this parent own this child profile", designed/tested before any policy references it | `## Ownership Helper — Exact Contract` gives the verified final SQL text, `EXPLAIN ANALYZE` inlining-verification method, and fallback                                                          |
| RLS-02 | Every policy that previously read `student_id = auth.uid()` authorizes by ownership, via a non-correlated `IN` subquery                             | `## Concrete Per-Table Inventory` enumerates every live policy (verified via `pg_policies`) needing a parent-ownership sibling, with the exact rewrite template per command                     |
| RLS-03 | Every rewritten INSERT/UPDATE policy declares `WITH CHECK` explicitly, verified via `pg_policies`                                                   | `## WITH CHECK Correctness` gives the exact template per table shape, flags the 2 tables (`parental_consent_tokens`, `student_point_transactions`) already missing symmetric `WITH CHECK` today |
| RLS-04 | No policy chain produces recursion (`42P17`) once teacher → connection → child profile → parent is in place                                         | `## Recursion Proof` explains why RLS-H2's terminal-predicate design is structurally non-recursive and gives the exact test                                                                     |
| RLS-05 | Rewritten policies show no per-row performance regression against real row counts                                                                   | `## Performance Verification Method` gives the exact `EXPLAIN ANALYZE` protocol and what "no regression" means concretely at this project's scale                                               |
| RLS-06 | A child profile is unreachable by any authenticated user who does not own it, proven adversarially                                                  | `## RLS-06 Adversarial Suite Design` gives the concrete test matrix (cross-family + 3-way null-parent reachability)                                                                             |

</phase_requirements>

---

## Summary

This phase rewrites Row-Level Security across 24 tables (23 downstream + `child_profiles` itself) so
that a **parent's** `auth.uid()` — not a child's — governs access to that parent's children's data.
Every claim below was verified live against production (project `hdltcvgqrtxuxgjdvzzu`) via the Supabase
Management API `database/query` endpoint, not inferred from the milestone's earlier research files —
this matters because two of this research's findings **correct** the milestone's working estimates:

1. **The true policy-rewrite worklist is ~24 tables / ~46 policies, not "32 tables / 62 policies."**
   The ROADMAP's "62 of 80" figure was a milestone-kickoff estimate. Live `pg_policies` enumeration
   finds 46 policies across 24 tables (23 downstream + `child_profiles`) that literally match the
   `student_id`/`recipient_id`/`user_id` `= auth.uid()` ownership shape RLS-02 targets, plus 3 edge-case
   tables needing planner judgment (`accessories`, `assignments`, `user_preferences` — see
   `## Edge Cases Needing Planner Judgment`). This mirrors Phase 1's own IDENT-05 deviation (30 FKs →
   17 verified) — same discipline, same magnitude of correction, recorded here rather than silently
   adopted.
2. **7 of the 24 in-scope tables were invisible to Phase 1's FK checklist and still have no
   `child_profiles` FK at all.** `class_enrollments`, `current_streak`, `highest_streak`,
   `last_practiced_date`, `practice_sessions`, `student_achievements`, and `student_profiles` all carry
   a `student_id`/`_fkey` constraint pointing at **`auth.users`**, not `students(id)` — so Phase 1's
   `pg_constraint`-driven checklist (scoped to FKs targeting `students`) correctly never saw them. They
   still need the RLS-02 rewrite (their live policies literally read `student_id = auth.uid()`), because
   an RLS predicate is a boolean expression, not an FK-constrained join — it works correctly against the
   UUID values already sitting in those columns (UUID reuse, Phase 1's anchor decision) with or without
   a formal FK. This is flagged as its own finding, not silently folded in, because it changes what
   "the 62 policies" actually means and is exactly the kind of thing Pitfall 2 (FK target drift) warns
   about resurfacing.

**Primary recommendation:** Ship `owned_child_ids()` as a `SECURITY INVOKER` SQL `STABLE` function
exactly as RLS-H1 specifies, verify its inlining with `EXPLAIN ANALYZE` on a Supabase branch before
writing a single downstream policy, then mechanically apply one of four command-shaped templates
(SELECT / INSERT / UPDATE / DELETE) from the concrete 24-table inventory below, using a
`_parent_owner` naming suffix that makes both the Phase 2 `pg_policies` audit and the Phase 8
legacy-drop trivial `LIKE` queries.

---

## Architectural Responsibility Map

| Capability                                                                   | Primary Tier                      | Secondary Tier                           | Rationale                                                                                                                                                            |
| ---------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parent-owns-child authorization                                              | Database / Storage (Postgres RLS) | —                                        | This phase is exclusively a DB-tier change; RLS is the actual security boundary per `ARCHITECTURE.md` Anti-Pattern 1 — client `activeChildId` is never authoritative |
| Ownership helper function (`owned_child_ids()`)                              | Database / Storage                | —                                        | SQL `STABLE` function, evaluated inside the Postgres planner; no application-tier equivalent exists or should exist                                                  |
| Teacher → child visibility                                                   | Database / Storage                | —                                        | Unchanged `EXISTS` on `teacher_student_connections`, per D-30; not touched this phase                                                                                |
| `SECURITY DEFINER` identity functions (`award_xp`, `check_rate_limit`, etc.) | Database / Storage                | API / Backend (Edge Functions call them) | The functions themselves live in Postgres; Edge Functions/RPC callers are unaffected by this phase's changes to the functions' internal ownership checks             |
| Policy verification (`pg_policies` audits, `EXPLAIN ANALYZE`)                | Database / Storage                | —                                        | SQL-only; no test framework or client code involved (matches Phase 1's D-28 precedent)                                                                               |
| Client `activeChildId` state                                                 | Browser / Client                  | —                                        | Explicitly OUT of this phase (Phase 4) — UX convenience only, never an authorization signal                                                                          |

---

## Concrete Per-Table Inventory

**[VERIFIED: live `pg_policies` query against `hdltcvgqrtxuxgjdvzzu`, 2026-07-30]** — every row below is
transcribed from the actual `SELECT schemaname, tablename, policyname, cmd, qual, with_check FROM
pg_policies WHERE schemaname='public'` result set (80 total policies, 37 tables), cross-referenced
against Phase 1's `01-fk-checklist.md` (16 tables) and a live `pg_constraint` query for the 7 tables
outside that checklist.

### Group A — 16 tables with an existing `child_profiles(id)` FK (Phase 1's swept set)

| Table                        | Legacy policy(ies) needing a sibling                                                                  | Cmd                            | Notes                                                                                                                                                                                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assignment_submissions`     | "Users can access assignment submissions"                                                             | ALL                            | Combined teacher+student policy in ONE text; add a new ALL sibling for the ownership branch, leave the combined one untouched                                                                                                                                   |
| `feedback_submissions`       | "Students can insert own feedback"                                                                    | INSERT                         | Only INSERT has a policy on this table today — no SELECT/UPDATE/DELETE exist; add only an INSERT sibling                                                                                                                                                        |
| `instrument_practice_logs`   | "Students can insert own practice log", "Students can read own practice logs"                         | INSERT, SELECT                 | 2 siblings                                                                                                                                                                                                                                                      |
| `instrument_practice_streak` | "Students can manage own practice streak"                                                             | ALL                            | 1 sibling                                                                                                                                                                                                                                                       |
| `notifications`              | "Consolidated notifications access optimized"                                                         | ALL                            | Two identity columns (`recipient_id`, `sender_id`); only extend the `recipient_id` branch — `sender_id` semantics (self OR connected teacher) are D-30-adjacent, leave as-is                                                                                    |
| `parental_consent_log`       | "...insert_own", "...select_own" (skip "...select_teacher" — D-30 shape)                              | INSERT, SELECT                 | 2 siblings                                                                                                                                                                                                                                                      |
| `parental_consent_tokens`    | "...insert_own", "...select_own", "...update_own" (skip "...select_anon" — `USING (true)`, unrelated) | INSERT, SELECT, UPDATE         | **`...update_own` has NO `with_check` today** (`with_check: null`) — this table is Pitfall 1 already live in production; the rewrite MUST add an explicit `WITH CHECK`, not copy the missing-check pattern forward                                              |
| `push_subscriptions`         | delete_own, insert_own, select_own, update_own                                                        | DELETE, INSERT, SELECT, UPDATE | 4 siblings, all 4 commands already correctly split                                                                                                                                                                                                              |
| `rate_limits`                | insert, select, update (own)                                                                          | INSERT, SELECT, UPDATE         | 3 siblings                                                                                                                                                                                                                                                      |
| `student_daily_challenges`   | "students_own_challenges"                                                                             | ALL                            | 1 sibling                                                                                                                                                                                                                                                       |
| `student_daily_goals`        | insert_own, select (combined w/ teacher `EXISTS`), update_own                                         | INSERT, SELECT, UPDATE         | 3 siblings                                                                                                                                                                                                                                                      |
| `student_point_transactions` | "student_point_transactions_insert", "student_point_transactions_select"                              | INSERT, SELECT                 | Only 2 of 8 policies on this table reference `student_id`; the other 6 are pure admin/service-role gates (untouched). The INSERT/SELECT ones mix ownership with `is_admin()`/`service_role`/`delta<=0` — preserve those clauses, extend only the ownership half |
| `student_skill_progress`     | delete (own), insert_gate, select (+teacher), update_gate                                             | DELETE, INSERT, SELECT, UPDATE | `insert_gate`/`update_gate` embed `is_free_node(node_id) OR has_active_subscription((SELECT auth.uid()))` — preserve verbatim, extend only the `student_id = ...` half (see `## Business-Logic-Gated Policies`)                                                 |
| `student_unit_progress`      | delete, insert, select-own, update (skip select-teacher — D-30 shape)                                 | DELETE, INSERT, SELECT, UPDATE | 4 siblings                                                                                                                                                                                                                                                      |
| `students_score`             | delete, insert_gate, select (+teacher inline), update                                                 | DELETE, INSERT, SELECT, UPDATE | Same gated-policy caveat as `student_skill_progress`                                                                                                                                                                                                            |
| `user_accessories`           | "user_accessories_access" (skip "Admin can manage..." — service_role/is_admin only)                   | ALL                            | 1 sibling                                                                                                                                                                                                                                                       |

**Group A total: 30 new sibling policies across 16 tables.**

### Group B — 7 tables whose FK points at `auth.users`, NOT `students`/`child_profiles` (NOT in Phase 1's checklist — new finding this research)

**[VERIFIED: live `pg_constraint` query, 2026-07-30]** — `conrelid::regclass` / `confrelid::regclass` for
each table's `student_id` FK resolves to `auth.users`, confirmed independently of Phase 1's checklist
(which only ever queried FKs targeting `public.students`).

| Table                  | FK currently targets | Legacy policy(ies) needing a sibling                                                                                                               | Cmd |
| ---------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `class_enrollments`    | `auth.users`         | "Consolidated class enrollments access" (student branch `student_id = auth.uid()`; teacher branch via `classes.teacher_id`, D-30-shape, untouched) | ALL |
| `current_streak`       | `auth.users`         | "Users can access current streak" (student branch; teacher `EXISTS` branch untouched; `service_role` untouched)                                    | ALL |
| `highest_streak`       | `auth.users`         | "Users can access highest streak"                                                                                                                  | ALL |
| `last_practiced_date`  | `auth.users`         | "Consolidated practice date access"                                                                                                                | ALL |
| `practice_sessions`    | `auth.users`         | "Consolidated practice sessions access" (student branch; teacher `IN` branch via `teacher_student_connections`, untouched)                         | ALL |
| `student_achievements` | `auth.users`         | "Consolidated achievements access" (skip "Teachers can view connected students achievements" — D-30 shape)                                         | ALL |
| `student_profiles`     | `auth.users`         | "Consolidated profiles access"                                                                                                                     | ALL |

**Group B total: 7 new sibling policies across 7 tables.**

> **Recommendation, not a decision:** these 7 tables' FK-to-`auth.users` is a genuine latent schema gap
> (the exact class of bug Pitfall 2 describes — this project has fixed it 3× before). RLS-02's literal
> wording ("every policy that previously read `student_id = auth.uid()`") covers them regardless of FK
> target, so the RLS rewrite does NOT require fixing the FK first — the predicate works correctly against
> the UUID values already there (UUID reuse). Recommend flagging the FK gap itself as a Phase 8 (or an
> inserted Phase 1.x) candidate — **do not silently fix it inside this RLS-only phase** without an
> explicit planning decision, since CONTEXT.md scopes Phase 2 as RLS-only.

### Group C — `child_profiles` itself (Phase 1 shipped deny-all, zero legacy policies)

| Table            | New policies (no legacy sibling — additive from zero)                                                                     | Cmd                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `child_profiles` | Parent branch (`parent_id = (SELECT auth.uid())`), Teacher branch (`EXISTS` on `teacher_student_connections`, D-30 shape) | ALL (parent), SELECT (teacher) |

**Group C total: 2 new policies.**

### Verified total

**30 (Group A) + 7 (Group B) + 2 (Group C) = 39 new policies across 24 tables**, plus the 3 edge-case
tables below (0–5 additional policies depending on planner scoping decisions). This is the corrected,
live-verified number — present it to the planner as a deviation from ROADMAP's "62 policies / 32
tables" estimate, following the same disclosure discipline as Phase 1's IDENT-05 correction (record the
correction, don't silently absorb it).

### Edge Cases Needing Planner Judgment

**[VERIFIED live, flagged for explicit scoping — do not default silently]**

| Table              | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Recommendation                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accessories`      | Two SELECT policies both gate via `EXISTS (SELECT 1 FROM students s WHERE s.id = (SELECT auth.uid()))` — a catalog-read gate, not per-row ownership (the table itself has no `student_id` column). Under the new model, a parent with children but whose own `auth.uid()` no longer equals any `students.id` (post Phase 3+ new signups) would fail this gate.                                                                                                                                                                                                                                                                                                                                                              | RECOMMEND including in RLS-02 scope: add `OR EXISTS (SELECT 1 FROM child_profiles WHERE parent_id = (SELECT auth.uid()))` as a sibling condition. Same shape as the existing gate, read-only, low risk. Low-risk enough that it can also be deferred to whichever phase first breaks it if the planner wants to keep Phase 2 to the literal `student_id =` set only — flag for an explicit yes/no, not a default.                                 |
| `assignments`      | Its own policy has NO `student_id` column — it embeds a **correlated, literal** `class_enrollments.student_id = auth.uid()` check inline. Even after `class_enrollments` gets its own Group B sibling policy, `assignments`' hardcoded literal predicate does NOT automatically inherit it — Postgres RLS subqueries evaluate the referenced table's OWN RLS as an independent filter on the `FROM`, but `assignments`' explicit `WHERE class_enrollments.student_id = auth.uid()` predicate is separate literal text that must ALSO be rewritten to `class_enrollments.student_id IN (SELECT owned_child_ids())` or the parent will still see zero assignments for a child even after `class_enrollments` itself is fixed. | RECOMMEND treating as in-scope: rewrite the embedded correlated condition, not just `class_enrollments`'s own policy. This is a genuine "looks fixed but isn't" trap specific to this table — call it out explicitly in the plan's verification step.                                                                                                                                                                                             |
| `user_preferences` | FK → `auth.users`. Columns are notification/sound/reminder preferences (`notifications_enabled`, `quiet_hours_*`, `daily_reminder_time`, etc.) — genuinely ambiguous whether these are per-child (device/learner-level, like `push_subscriptions` which IS child-scoped) or per-parent (family-level settings a parent sets once). No existing precedent in this codebase resolves it either way.                                                                                                                                                                                                                                                                                                                           | DO NOT default. Flag as an explicit scoping decision for the planner/owner, mirroring Phase 1's D-07 process (child-scoped vs parent-scoped classification, reviewed and signed). Whichever way it's classified determines whether it gets an `owned_child_ids()`-based sibling (child-scoped) or is left entirely alone this phase (parent-scoped, no `auth.uid()` change needed since `user_id` would already resolve correctly to the parent). |

### Minor Observation (not an action item)

`teacher_student_connections`'s own live policy ("Unified teacher student connections access
optimized") is `(teacher_id = (SELECT auth.uid())) OR (student_id = (SELECT auth.uid()))` — the
second branch is structurally the same self-access pattern being rewritten everywhere else, and it will
stop granting a parent direct access to a second/third child's connection row (only the UUID-reused
first child still matches). **[VERIFIED via `Grep`]** no client code in `src/` queries this table
filtered by `student_id` from a self/child perspective (`authorizationUtils.js` only filters by
`teacher_id`) — so this branch is currently dead code, not a live risk. Recorded for awareness only;
D-30 is locked and this does not override it.

---

## Ownership Helper — Exact Contract

**[VERIFIED against RLS-H1's spec + this project's existing `SECURITY DEFINER` function style]**

```sql
-- Source: RLS-H1 (02-CONTEXT.md), styled per this repo's SET search_path convention
-- (20260131000001_audit_rls_policies.sql's is_admin() pins search_path the same way).
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
```

Null-safety: no explicit `IF auth.uid() IS NULL` guard is needed. If `auth.uid()` is `NULL` (unauthenticated/service-role context bypassing RLS anyway), `parent_id = NULL` evaluates to `NULL` (not `TRUE`) for every row under SQL three-valued logic, so the function returns zero rows — correctly matching nothing. This is the same reasoning RLS-T1 already establishes for the null-parent case, applied symmetrically to the null-caller case.

`SECURITY INVOKER` (the default — can be omitted, but write it explicitly per this repo's convention of never leaving security posture implicit) means the function runs with the **calling role's** privileges and is therefore subject to `child_profiles`' own RLS when it queries that table — this is precisely why RLS-H2 forbids calling it from `child_profiles`' own policies (would be immediate self-reference recursion) and why it is safe to call from every downstream table (those tables don't own `child_profiles`, so no cycle).

### Verify inlining with `EXPLAIN ANALYZE` (RLS-H1's explicit caveat)

Postgres can inline a single-statement `LANGUAGE sql STABLE` function directly into the calling query's
plan — collapsing `student_id IN (SELECT owned_child_ids())` into the same shape as the literal inline
subquery, with the same initPlan-caching benefit. This inlining is NOT guaranteed by the function
declaration alone; it depends on the planner's inlining heuristics (single SQL statement, no
side effects, `SECURITY INVOKER` — `SECURITY DEFINER` explicitly blocks inlining, which is the other
half of why RLS-H1 deviates from the literal RLS-01 wording).

**Verification protocol for the planner to execute on a Supabase branch, after `owned_child_ids()` exists and at least one downstream policy uses it:**

```sql
-- A. Using the helper function
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM student_skill_progress
WHERE student_id IN (SELECT owned_child_ids());

-- B. Using the literal inline subquery (the fallback shape)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM student_skill_progress
WHERE student_id IN (
  SELECT id FROM child_profiles WHERE parent_id = (SELECT auth.uid())
);
```

**Pass condition:** plan (A) shows the `child_profiles` scan folded into a single `InitPlan` (or an
equivalent one-time `Subquery Scan`) with `Cost` and `Actual Total Time` within noise of plan (B) — no
`Function Scan on owned_child_ids` node repeated once per outer row.
**Fail condition:** plan (A) shows a `Function Scan` or `SubPlan` re-evaluated per row of
`student_skill_progress` (visible as a `Rows Removed by Filter` pattern scaling with outer row count, or
a materially higher `Actual Total Time` than plan B).
**On fail:** do not use the function in policy text. Fall back to writing the literal inline subquery
`student_id IN (SELECT id FROM child_profiles WHERE parent_id = (SELECT auth.uid()))` directly in every
one of the ~39 policies — still "one canonical text" in the sense that it should be copy-pasted
identically everywhere (a single documented template), matching this repo's own precedent
(`20260128000001_consolidate_rls_policies.sql`, `20260131000001_audit_rls_policies.sql` both already
favor explicit inline SQL over shared functions for exactly this reason).

**This cannot be executed today** (the function does not exist yet, and `EXPLAIN` against
`owned_child_ids()` would error) — it is documented here as the exact protocol the planner's Wave 0 /
first task must run before any of the 39 downstream policies are written, since RLS-01 explicitly
requires the helper be "designed and tested before any policy references it."

---

## `child_profiles`' Own Policies (RLS-H2, non-recursive by construction)

```sql
-- Parent branch: full CRUD on their own children. Terminal predicate — no subquery, no helper call.
CREATE POLICY "child_profiles_all_parent_owner"
  ON public.child_profiles
  FOR ALL
  USING (parent_id = (SELECT auth.uid()))
  WITH CHECK (parent_id = (SELECT auth.uid()));

-- Teacher branch: read-only, owner-first EXISTS — reuses the exact shape from
-- 20260127000003_optimize_rls_auth_plan.sql's "Teachers can view connected students" policy,
-- only the joined column changes (tsc.student_id already valid via UUID reuse, D-30).
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

Both policies are **terminal** — neither references `owned_child_ids()`, and neither queries
`child_profiles` from inside its own predicate. This is what makes RLS-04's recursion proof structural
rather than incidental (see `## Recursion Proof` below).

---

## Per-Command Rewrite Templates

**[CITED: Supabase RLS Performance and Best Practices, https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv — the owner-first `(SELECT auth.uid())` + non-correlated `IN` shape]**, styled to this repo's existing convention.

### SELECT

```sql
CREATE POLICY "<table>_select_parent_owner"
  ON public.<table>
  FOR SELECT
  USING (<id_col> IN (SELECT public.owned_child_ids()));
```

### INSERT

```sql
CREATE POLICY "<table>_insert_parent_owner"
  ON public.<table>
  FOR INSERT
  WITH CHECK (<id_col> IN (SELECT public.owned_child_ids()));
```

### UPDATE (Pitfall 1 — both clauses ALWAYS written explicitly, never omitted)

```sql
CREATE POLICY "<table>_update_parent_owner"
  ON public.<table>
  FOR UPDATE
  USING (<id_col> IN (SELECT public.owned_child_ids()))
  WITH CHECK (<id_col> IN (SELECT public.owned_child_ids()));
```

### DELETE

```sql
CREATE POLICY "<table>_delete_parent_owner"
  ON public.<table>
  FOR DELETE
  USING (<id_col> IN (SELECT public.owned_child_ids()));
```

### ALL (for the single-policy-per-table shapes: `assignment_submissions`, `instrument_practice_streak`, `student_daily_challenges`, `user_accessories`, `class_enrollments`, `current_streak`, `highest_streak`, `last_practiced_date`, `practice_sessions`, `student_achievements`, `student_profiles`)

```sql
CREATE POLICY "<table>_all_parent_owner"
  ON public.<table>
  FOR ALL
  USING (<id_col> IN (SELECT public.owned_child_ids()))
  WITH CHECK (<id_col> IN (SELECT public.owned_child_ids()));
```

### Naming convention (Claude's Discretion — resolved)

Every new policy gets the literal suffix **`_parent_owner`**, regardless of what the corresponding
legacy policy is named (legacy names are inconsistent — some already end `_own`/`_select_own`, some are
free-text like `"Students can read own practice logs"`). This makes both the RLS-02/RLS-03 audit and the
Phase 8 legacy-drop a trivial, unambiguous filter:

```sql
-- RLS-02 dual-policy coverage audit
SELECT tablename, cmd,
       count(*) FILTER (WHERE policyname LIKE '%_parent_owner') AS new_policies,
       count(*) FILTER (WHERE policyname NOT LIKE '%_parent_owner') AS legacy_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- Phase 8 (future) legacy-drop candidate set — NOT run in this phase, documented for handoff
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public' AND policyname NOT LIKE '%_parent_owner'
  AND tablename = ANY(ARRAY[/* the 24-table list above */]);
```

---

## Business-Logic-Gated Policies (`student_skill_progress`, `students_score`)

**[VERIFIED live]** `student_skill_progress_insert_gate` and `student_skill_progress_update_gate` (and
their `students_score` equivalents) combine ownership with a subscription/free-node business rule in a
single `AND`:

```text
-- Current live text (student_skill_progress_insert_gate.with_check):
(student_id = ( SELECT auth.uid())) AND (is_free_node(node_id) OR has_active_subscription(( SELECT auth.uid())))
```

**Critical nuance:** `has_active_subscription()` is called with `(SELECT auth.uid())` — the **caller's**
id — NOT `student_id`. This is already forward-compatible with the family-wide subscription model Phase
5 introduces; do not change this argument. The rewrite template for these two policies is:

```sql
CREATE POLICY "student_skill_progress_insert_parent_owner"
  ON public.student_skill_progress
  FOR INSERT
  WITH CHECK (
    student_id IN (SELECT public.owned_child_ids())
    AND (is_free_node(node_id) OR has_active_subscription((SELECT auth.uid())))
  );
```

Apply the identical pattern to `_update_parent_owner` (with matching `USING`/`WITH CHECK`) and to
`students_score`'s equivalent gated policies. **Preserve the business-rule clause verbatim** — this
phase changes only the ownership half.

---

## WITH CHECK Correctness (RLS-03, Pitfall 1)

**[VERIFIED live]** Two concrete, currently-live gaps exist TODAY in production that the rewrite must
not reproduce:

1. `parental_consent_tokens_update_own` (UPDATE) has `with_check: null` — `USING` only. Postgres
   silently reuses `USING` for `WITH CHECK` when it's omitted on an `UPDATE` policy, so this technically
   "works" today, but it is exactly the footgun Pitfall 1 describes: the NEW row's value is not
   independently validated, only implicitly matching the old row's ownership. The new
   `parental_consent_tokens_update_parent_owner` sibling MUST write both clauses explicitly, per the
   UPDATE template above.
2. `student_point_transactions_update`/`_delete` have NO `student_id` reference at all (admin/service
   role only) — nothing to rewrite there; do not invent a new ownership UPDATE/DELETE policy where none
   existed, that would be scope creep beyond "every policy that previously read `student_id = auth.uid()`".

**RLS-03 audit query** (run post-migration against every new `_parent_owner` policy):

```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%_parent_owner'
  AND cmd IN ('INSERT', 'UPDATE')
  AND (with_check IS NULL OR with_check = 'true');
-- Expect ZERO rows. Any row returned is an RLS-03 failure.
```

---

## Recursion Proof (RLS-04, RLS-H2)

**Why the design is structurally non-recursive, not just empirically so:**

- `owned_child_ids()` is `SECURITY INVOKER` and queries `child_profiles` — meaning `child_profiles`'
  own RLS policies apply when the helper runs.
- `child_profiles`' own two policies (`child_profiles_all_parent_owner`,
  `child_profiles_select_teacher`) are both **terminal**: the parent branch is a bare column equality
  (`parent_id = (SELECT auth.uid())`, no subquery at all), and the teacher branch is a direct `EXISTS`
  against `teacher_student_connections` (a table with its own simple, non-recursive policy —
  `teacher_id = (SELECT auth.uid()) OR student_id = (SELECT auth.uid())`, verified live, no further
  indirection).
- Therefore the maximum call depth from any downstream table is exactly 2 hops:
  `downstream table → owned_child_ids() → child_profiles' own (terminal) policy`. Nothing in that chain
  calls back into a table whose policy is still being evaluated. Compare against the chain Pitfall 3
  warns about (`teacher → connection → child_profiles → parent`) — that chain does NOT exist in this
  design because the teacher branch on `child_profiles` reads `teacher_student_connections` directly,
  never through `owned_child_ids()` or back through `child_profiles` again.

**RLS-04 test (run on a Supabase branch after all 39 policies are live):**

```sql
-- As an authenticated parent session (see RLS-06 adversarial suite for how to impersonate),
-- touch every downstream table once. Zero 42P17 errors is the pass condition.
SELECT * FROM student_skill_progress LIMIT 1;
SELECT * FROM students_score LIMIT 1;
-- ... one representative query per table in the 24-table inventory ...

-- Cross-check: confirm owned_child_ids() is never referenced inside child_profiles' own policy text
-- (a static guard against a future accidental regression, not just a runtime check).
SELECT policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'child_profiles'
  AND (qual ILIKE '%owned_child_ids%' OR with_check ILIKE '%owned_child_ids%');
-- Expect ZERO rows.
```

Also check Supabase Advisors/logs (`get_advisors` / `get_logs` via MCP, or the dashboard) for any
`42P17` entries in the window after the branch rehearsal runs.

---

## Performance Verification Method (RLS-05)

**[CITED: Supabase RLS Performance and Best Practices]** + **[VERIFIED: this project's own prior fix,
`20260127000003_optimize_rls_auth_plan.sql`, already applies the identical wrap-in-`SELECT` pattern for
a simpler predicate]**.

**What "no measurable regression" means concretely at this project's scale:** `child_profiles` has 20
rows today (verified live: 20 total, 15 parented, 5 null-parent). A parent realistically owns 1-3
children. The `owned_child_ids()` subquery, once confirmed inlined into an initPlan, is evaluated
**once per statement**, not once per row of the downstream table — meaning its cost is bounded by
`child_profiles`' own tiny size (with its existing `idx_child_profiles_parent_id` index, verified live)
regardless of how large the downstream table (`student_skill_progress`, etc.) grows. "No regression"
therefore means: `EXPLAIN ANALYZE`'s `Actual Total Time` for a representative dashboard/trail query
(e.g., `SELECT * FROM student_skill_progress WHERE <RLS predicate implicitly applied>`) under the new
dual-policy set is within normal query-to-query variance (a few percent, not a multiplier) of the same
query's time under the legacy-only policy, measured on the SAME branch with the SAME data before/after
the migration is applied.

**Protocol:**

1. On the rehearsal branch, before applying the Phase 2 migration: `EXPLAIN ANALYZE` a representative
   query against each of the highest-read tables (`student_skill_progress`, `students_score`,
   `student_daily_goals`, `practice_sessions`) as a seeded test parent, using only the legacy policy.
   Record baseline timings.
2. Apply the Phase 2 migration (dual-policy).
3. Re-run the identical `EXPLAIN ANALYZE` queries as the same test parent. Compare.
4. Additionally run the same queries as a **synthetic second family's** parent (per CONTEXT's Claude's
   Discretion default) to confirm the `IN`-list correctly scopes to a different set with no cross-family
   cost anomaly.
5. Confirm via Supabase Advisors (`get_advisors` MCP tool or dashboard) that no new "unindexed foreign
   key" or "RLS performance" warnings appear for any of the 24 tables.

**Realistic risk assessment:** at 20 real child rows, this project's own research (`ARCHITECTURE.md`
Scaling Considerations) already concludes "at 20 students today, none of this is measurable" — the value
of doing this verification now is catching a wrongly-shaped (correlated) policy before it's copied 39
times, not chasing a real regression at current scale.

---

## RLS-06 Adversarial Suite Design

**[VERIFIED live]** `child_profiles` today: 20 rows, 15 with a real `parents` row, 5 with
`parent_id IS NULL` (teacher-owned). This is the real data the suite's null-parent cases (RLS-T1 a/b/c)
must exercise, plus a synthetic second family per CONTEXT's discretion default (branch-only, not
production).

**Impersonation technique** — Supabase's `auth.uid()` resolves from the `request.jwt.claims` GUC
(`nullif(current_setting('request.jwt.claims', true)::json->>'sub','')::uuid`), so a session can be
adversarially impersonated directly in SQL without needing a real JWT/login flow, on a branch:

```sql
-- Impersonate parent A
SET request.jwt.claims = '{"sub":"<parent-A-uuid>","role":"authenticated"}';
SET ROLE authenticated;

-- (a) Cross-family zero-rows: parent A queries a child NOT theirs
SELECT * FROM child_profiles WHERE id = '<parent-B-child-uuid>';               -- expect 0 rows
SELECT * FROM student_skill_progress WHERE student_id = '<parent-B-child-uuid>'; -- expect 0 rows

-- (b) Null-parent: an arbitrary (non-connected) parent queries a teacher-owned profile
SELECT * FROM child_profiles WHERE id = '<null-parent-profile-uuid>';          -- expect 0 rows
SELECT * FROM student_skill_progress WHERE student_id = '<null-parent-profile-uuid>'; -- expect 0 rows

RESET ROLE;
RESET request.jwt.claims;

-- Impersonate the NON-connected teacher (a real teacher who has no row in
-- teacher_student_connections for the null-parent profile)
SET request.jwt.claims = '{"sub":"<unconnected-teacher-uuid>","role":"authenticated"}';
SET ROLE authenticated;
SELECT * FROM child_profiles WHERE id = '<null-parent-profile-uuid>';          -- expect 0 rows
RESET ROLE;

-- Impersonate the CONNECTED teacher
SET request.jwt.claims = '{"sub":"<connected-teacher-uuid>","role":"authenticated"}';
SET ROLE authenticated;
SELECT * FROM child_profiles WHERE id = '<null-parent-profile-uuid>';          -- expect 1 row
RESET ROLE;
```

**Test matrix (all REQUIRED per RLS-T1 + RLS-06):**

| #   | Actor               | Target                                                                         | Expected                   |
| --- | ------------------- | ------------------------------------------------------------------------------ | -------------------------- |
| 1   | Parent A            | Parent A's own child + downstream rows                                         | Visible (positive control) |
| 2   | Parent A            | Parent B's child + downstream rows (synthetic second family)                   | Zero rows                  |
| 3   | Any parent (A or B) | A null-parent (teacher-owned) profile + downstream rows                        | Zero rows                  |
| 4   | Unconnected teacher | Null-parent profile                                                            | Zero rows                  |
| 5   | Connected teacher   | Null-parent profile                                                            | Visible                    |
| 6   | Parent A            | Cross-family UPDATE attempt (repoint a row's `student_id` to Parent B's child) | Rejected by `WITH CHECK`   |

Case 6 is the direct regression test for Pitfall 1 — attempt `UPDATE student_skill_progress SET
student_id = '<parent-B-child-uuid>' WHERE student_id = '<parent-A-child-uuid>'` as Parent A and confirm
it is rejected (this is exactly what a missing/wrong `WITH CHECK` would silently allow).

---

## D-23 Function Scoping — Resolved

**[VERIFIED: live `pg_proc` source read for all 5 functions D-23's inventory tags "Phase 2"]** — see
`.planning/phases/01-identity-schema-expand/01-function-inventory.md` for the committed inventory this
resolves against.

| Function                                                     | D-23 tag | Live body finding                                                                                                                                                                                                                                                                                                                                                                                                        | Phase 2 action                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `award_xp(p_student_id, p_xp_amount)`                        | Phase 2  | `IF auth.uid() != p_student_id THEN RAISE EXCEPTION` — a **hard block**. Under the new model, a parent calling this on behalf of a child has `auth.uid() = parent_id ≠ child's id` for any non-UUID-reused child, so this function actively breaks for exactly the cases this milestone exists to enable.                                                                                                                | **MUST change.** Replace the equality check with an ownership check: `IF p_student_id NOT IN (SELECT public.owned_child_ids()) THEN RAISE EXCEPTION 'Unauthorized...'`. This is a `SECURITY DEFINER` function so it bypasses RLS internally — the ownership check must be explicit in the function body, it cannot rely on the caller's RLS-filtered view.                                                                                                                                                                                                                                                                                                                                                                           |
| `check_rate_limit(p_student_id, p_node_id, ...)`             | Phase 2  | Identical pattern: `IF auth.uid() != p_student_id THEN RAISE EXCEPTION`.                                                                                                                                                                                                                                                                                                                                                 | **MUST change**, same fix as `award_xp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `teacher_get_student_points()`                               | Phase 2  | No `auth.uid() = student_id` comparison anywhere — resolves via `teacher_student_connections WHERE teacher_id = (SELECT auth.uid())`, already the D-30 teacher-shape, then joins aggregate data by `student_id`.                                                                                                                                                                                                         | **Likely no change required.** Recommend the planner do a quick read-confirm rather than skip it outright, but this function's identity resolution is already teacher-ownership-based, not parent/child-identity-based — outside RLS-02's literal scope.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `teacher_link_student(...)`                                  | Phase 2  | Manages teacher-created placeholder `students` rows; checks `teachers.id = auth.uid() AND is_active` — no parent/child ownership check at all. Writes to `students`, which Phase 1's forward-sync trigger (`sync_student_to_child_profile`) automatically mirrors into `child_profiles` with `parent_id = NULL` (correct — matches the existing teacher-placeholder pattern).                                            | **No change required.** Teacher-only path, already produces a correct parent-less `child_profiles` row via the Phase 1 substrate with zero code change needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `promote_placeholder_student(p_student_id, p_student_email)` | Phase 2  | No `auth.uid()` check of any kind — operates on explicit ids passed by its (presumably teacher-context) caller. Reassigns `teacher_student_connections`, `assignment_submissions`, `notifications`, `students_total_score`\*, `current_streak`, `highest_streak`, `last_practiced_date`, then deletes placeholder `students` rows (triggering Phase 1's D-24/D-25 cascade to also clean up their `child_profiles` rows). | **No RLS-relevant change required in Phase 2.** Note (not a Phase 2 action item): this function does NOT reassign `practice_sessions`, `student_achievements`, `student_profiles`, `class_enrollments`, `rate_limits`, `student_daily_goals`, `student_skill_progress`, `students_score`, or `student_unit_progress` — a pre-existing function-completeness gap orthogonal to RLS, flag for whoever owns placeholder-promotion correctness (not this phase). \*`students_total_score` referenced in the function body — verify this table name during implementation; it did not appear in the live 37-table policy list under that exact name, may be a typo/legacy reference in the function source worth flagging to the planner. |

`is_free_node` and `has_active_subscription` are confirmed **out of Phase 2 scope** (D-23's own tags: "none" and "Phase 5" respectively) — live inspection confirms `has_active_subscription(p_student_id)` is already called with the CALLER's own `auth.uid()` (not a child id) inside the two gated policies above, which is already forward-compatible with Phase 5's family-wide model — no Phase 2 action needed.

---

## Don't Hand-Roll

| Problem                   | Don't Build                                    | Use Instead                                                                                                         | Why                                                                                                                                                                                                                                                                          |
| ------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-table ownership check | A bespoke `EXISTS`/join per table, hand-varied | The single `owned_child_ids()` helper (or its verified-equivalent inline text), copy-pasted identically             | RLS-01's entire point is one source of truth; hand-varied per-table logic is how Pitfall 1 (missing `WITH CHECK`) and Pitfall 4 (perf cliff) both actually happen in practice — under time pressure across 24 tables, at least one gets written slightly differently         |
| Recursion avoidance       | A `SECURITY DEFINER` wrapper "to be safe"      | The terminal-predicate design (RLS-H2) — `SECURITY INVOKER` + non-recursive call graph                              | `SECURITY DEFINER` was the pre-registered instinct (RLS-01's literal wording, and Pitfall 3's own suggested fix) but is explicitly the SLOWER path here (RLS-H1's deviation) — the terminal-predicate design achieves the same recursion-safety without the performance cost |
| Adversarial RLS testing   | A new test framework (pgTAP, Jest+pg, etc.)    | Direct SQL impersonation via `SET request.jwt.claims` + `SET ROLE authenticated`, run as `.sql` scripts on a branch | Matches Phase 1's D-28 precedent (pgTAP explicitly rejected as new infra); this project has zero DB test framework installed and this phase doesn't need one — Supabase's own JWT-claims GUC mechanism is sufficient and requires no new tooling                             |

**Key insight:** every "don't hand-roll" here is really the same lesson twice — this phase's entire
risk profile is "one correct pattern, copied 39 times" vs. "39 slightly different hand-written
policies." The tooling that keeps that copy operation honest (naming convention + `pg_policies` audit
queries) is not optional infrastructure, it IS the verification strategy.

---

## Common Pitfalls

### Pitfall 1: USING/WITH CHECK mismatch (already live in production today)

**What goes wrong:** Confirmed live — `parental_consent_tokens_update_own` already has `with_check:
null`. If the new `_parent_owner` sibling is written by copy-pasting this table's existing policy shape
without noticing the gap, the rewrite reproduces the exact vulnerability it exists to close.
**How to avoid:** Every UPDATE/INSERT template in this document writes `WITH CHECK` explicitly, always,
even when textually identical to `USING`. The RLS-03 audit query above catches any miss mechanically.
**Warning signs:** Any `_parent_owner` policy where `pg_policies.with_check` is `NULL` for an
INSERT/UPDATE command.

### Pitfall 2: FK target drift resurfacing as an RLS-scope gap

**What goes wrong:** This research's Group B finding (7 tables FK'd to `auth.users`, invisible to Phase
1's `students`-scoped checklist) is a live instance of exactly this pitfall — a table silently outside
the swept set. Missing it here means `current_streak`/`practice_sessions`/etc. keep working for the 15
existing UUID-reused single-child parents (masking the gap) but silently break for any parent with a
second child or any new Phase 3+ signup.
**How to avoid:** Use the Group A + Group B + Group C inventory in this document as the authoritative
worklist, not Phase 1's FK checklist alone (which was correctly scoped to a narrower question).
**Warning signs:** A parent's dashboard shows XP/skill-progress data but a blank streak/achievement
widget post-Phase-2 — exactly the "some tables migrated, some didn't" signature this bug class always
produces.

### Pitfall 3: Recursive RLS

**What goes wrong:** Calling `owned_child_ids()` from `child_profiles`' own policy, or writing a new
teacher-side policy on any downstream table that routes back through `child_profiles` a second time.
**How to avoid:** RLS-H2's terminal-predicate design (see `## Recursion Proof`) — verify structurally
during code review (grep the migration file for `owned_child_ids` occurring inside anything touching
`child_profiles`), not just via the runtime `42P17` test.
**Warning signs:** `42P17: infinite recursion detected in policy for relation "child_profiles"` in
Supabase logs.

### Pitfall 4: Performance cliff from a correlated rewrite

**What goes wrong:** Someone writes `EXISTS (SELECT 1 FROM child_profiles cp WHERE cp.id = outer_table.student_id AND cp.parent_id = auth.uid())` instead of the `IN (SELECT owned_child_ids())` shape — functionally equivalent, structurally a correlated subquery that cannot be cached as an initPlan.
**How to avoid:** Use ONLY the templates in this document. Never write a correlated `EXISTS` referencing the outer table's column inside the ownership check.
**Warning signs:** `EXPLAIN ANALYZE` shows cost/time scaling with the outer table's row count instead of staying flat.

### Pitfall 5 (new to this phase): Business-logic clause silently dropped during rewrite

**What goes wrong:** `student_skill_progress`/`students_score`'s gated INSERT/UPDATE policies combine ownership with `is_free_node()`/`has_active_subscription()`. A mechanical find-replace of `student_id = (SELECT auth.uid())` → `student_id IN (SELECT owned_child_ids())` is safe IF the `AND (is_free_node... OR has_active_subscription...)` clause is preserved verbatim — but a careless full-policy rewrite (rather than a targeted substitution) risks dropping the subscription gate entirely, silently making paid content free.
**How to avoid:** Treat these two tables as their own explicit sub-task with a before/after diff review, not part of the mechanical batch.
**Warning signs:** A free-tier account gains access to premium nodes post-migration with no error.

---

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | None (DB/DDL phase) — SQL-assertion scripts, matching Phase 1's D-28 precedent                                                                                                                                   |
| Config file        | none — a committed `02-db-assertions.sql` (planner authors in Wave 0) run against a Supabase branch                                                                                                              |
| Quick run command  | Paste into Supabase SQL Editor / MCP `execute_sql` against the rehearsal branch, or `npx supabase db execute --file .planning/phases/02-.../02-db-assertions.sql`                                                |
| Full suite command | `02-db-assertions.sql` (pg_policies audits + adversarial suite + recursion test) + `EXPLAIN ANALYZE` performance protocol + `npm run test:run` (proves zero client-visible regression, mirroring Phase 1's D-29) |

### Phase Requirements → Test Map

| Req ID | Behavior                                                                                          | Test Type                                | Automated Command                                                                                                   | File Exists? |
| ------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------ |
| RLS-01 | Helper exists, is `SECURITY INVOKER` SQL `STABLE`, inlines                                        | SQL assertion + `EXPLAIN ANALYZE`        | `SELECT prosecdef, provolatile, prolang FROM pg_proc WHERE proname='owned_child_ids'` + the inlining protocol above | ❌ Wave 0    |
| RLS-02 | Every table in the 24-table inventory has BOTH a legacy and a `_parent_owner` sibling per command | SQL assertion (`pg_policies` count)      | The dual-policy coverage audit query above                                                                          | ❌ Wave 0    |
| RLS-03 | Every `_parent_owner` INSERT/UPDATE has non-null, correct `with_check`                            | SQL assertion                            | The RLS-03 audit query above                                                                                        | ❌ Wave 0    |
| RLS-04 | No `42P17` after all policies live                                                                | SQL assertion + Advisors/logs check      | The recursion test above + `get_advisors`/`get_logs` MCP                                                            | ❌ Wave 0    |
| RLS-05 | No measurable regression vs. baseline                                                             | `EXPLAIN ANALYZE` before/after protocol  | The performance verification protocol above                                                                         | ❌ Wave 0    |
| RLS-06 | Cross-family + null-parent 3-way reachability proven adversarially                                | SQL assertion (JWT-claims impersonation) | The 6-case test matrix above                                                                                        | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** re-run the relevant `pg_policies` audit block for the table(s) just touched, against the rehearsal branch.
- **Per wave merge:** full `02-db-assertions.sql` (all 6 requirement checks) + `npm run test:run`.
- **Phase gate:** full suite green + owner-gated production apply (mirroring Phase 1's D-27), `/gsd-secure-phase` pass closed, before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `02-db-assertions.sql` — the full SQL-assertion suite (RLS-01 through RLS-06 checks, structured like Phase 1's `01-db-assertions.sql`)
- [ ] `02-policy-inventory.md` — the committed, owner-reviewable version of the Concrete Per-Table Inventory in this document (mirrors Phase 1's D-04 `01-fk-checklist.md` discipline) — MUST include an explicit owner decision on the 3 Edge Cases table before the migration is written
- [ ] Rehearsal branch confirmed with a synthetic second family seeded (2nd parent + child, for RLS-06 case 2/6 and RLS-05's cross-family cost check)
- [ ] Framework install: none needed

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category       | Applies                     | Standard Control                                                                                                              |
| ------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| V4 Access Control   | **yes — this entire phase** | Row-Level Security (Postgres native), ownership-based, dual-policy rollout                                                    |
| V1 Architecture     | yes                         | Expand/contract migration pattern (additive, reversible until Phase 8)                                                        |
| V6 Cryptography     | no                          | Not touched this phase                                                                                                        |
| V2/V3 Auth/Session  | no                          | Unchanged — `auth.uid()` resolution itself is not modified, only how it's used in policy predicates                           |
| V5 Input Validation | partial                     | `WITH CHECK` clauses are Postgres's input-validation mechanism for the identity dimension specifically — covered under RLS-03 |

### Known Threat Patterns for this stack

| Pattern                                                                                                                                | STRIDE                                                        | Standard Mitigation                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Cross-tenant (cross-family) data read via a missing/wrong ownership predicate                                                          | Information Disclosure                                        | Non-correlated `IN (SELECT owned_child_ids())` on every table in the inventory; RLS-06 adversarial proof |
| Cross-tenant data write via missing `WITH CHECK` (repoint a row to another family's child)                                             | Tampering                                                     | Explicit `WITH CHECK` on every INSERT/UPDATE `_parent_owner` policy (RLS-03); RLS-06 case 6              |
| Recursive policy self-reference causing either a crash or (worse) an over-broad bypass workaround                                      | Denial of Service / (if "fixed" wrong) Elevation of Privilege | Terminal-predicate design (RLS-H2); RLS-04 structural + runtime proof                                    |
| `SECURITY DEFINER` function with a stale identity check (`auth.uid() = p_student_id`) silently blocking legitimate parent-driven calls | Denial of Service (against the legitimate parent)             | D-23 function scoping — `award_xp`/`check_rate_limit` ownership-check rewrite                            |
| Subscription/free-node business-rule clause accidentally dropped during the ownership rewrite                                          | Elevation of Privilege (free access to paid content)          | Business-Logic-Gated Policies section — explicit preserve-verbatim instruction + dedicated review        |

---

## Assumptions Log

| #   | Claim                                                                                                                                                                                                                            | Section                             | Risk if Wrong                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `owned_child_ids()` as a single-statement `LANGUAGE sql STABLE SECURITY INVOKER` function WILL be inlined by the Postgres planner in Supabase's Postgres version                                                                 | Ownership Helper — Exact Contract   | If wrong, the fallback (literal inline subquery everywhere) is already documented and functionally equivalent — low risk, but adds ~39x text duplication instead of one function definition. RLS-H1 already mandates verifying this with `EXPLAIN ANALYZE` before trusting it, so this assumption is explicitly gated by a required test, not accepted blind. |
| A2  | The `students_total_score` table name referenced inside `promote_placeholder_student`'s live source is either a typo/legacy name or a table this research's `pg_policies` scan (37 tables) did not surface under that exact name | D-23 Function Scoping               | If a real table by that name exists and was missed, it could be a 25th in-scope table for RLS-02. Flagged explicitly for planner verification, not silently assumed away.                                                                                                                                                                                     |
| A3  | The `accessories`/`assignments`/`user_preferences` edge-case tables' correct scoping (in vs. out of RLS-02) can be decided by the planner during Wave 0 without a separate `/gsd-discuss-phase` round                            | Edge Cases Needing Planner Judgment | If the owner disagrees with treating this as planner-resolvable, the phase may need a short discussion round before implementation, similar to Phase 1's D-07 sign-off gate.                                                                                                                                                                                  |

---

## Open Questions (RESOLVED 2026-08-01 — see 02-CONTEXT.md D-31/D-32/D-33)

> All three open questions below were resolved by owner decision during plan-phase and are
> implemented in plans 02-01/02-03. Retained for traceability.

1. **(RESOLVED — D-33: rewrite policies, document FK gap, do NOT fix FK this phase)** Are the 7 Group B tables' `auth.users`-targeting FKs corrected in this phase or deferred?
   - What we know: the RLS predicate works correctly without fixing the FK (UUID reuse means the values
     are valid regardless of constraint target); CONTEXT.md scopes Phase 2 as RLS-only.
   - What's unclear: whether leaving a 7-table FK gap live through Phases 2-7 creates any risk this
     research hasn't modeled (e.g., a future migration assuming the FK checklist from Phase 1 is
     complete).
   - Recommendation: leave the FK as-is this phase (RLS-only scope, matches CONTEXT.md), but the planner
     should explicitly note this gap in the phase's SUMMARY/handoff artifact so Phase 8 (or an inserted
     phase) inherits it as a known, documented item rather than rediscovering it from scratch.

2. **(RESOLVED — D-31: CHILD-scoped, add `_parent_owner` sibling)** `user_preferences` scope classification (child vs. parent).
   - What we know: FK → `auth.users`, columns are notification/reminder/sound settings.
   - What's unclear: whether this app's product intent treats these as per-learner or per-family
     settings — no existing code comment or schema documentation resolves it.
   - Recommendation: explicit owner/planner decision before the migration is written, mirroring Phase
     1's D-07 process. Do not default.

3. **(RESOLVED — D-32: YES, include both)** Should `accessories` and `assignments` be included in this phase's literal worklist?
   - What we know: both have live `student_id`-shaped identity checks that will break for multi-child/
     new-signup parents if left unrewritten; both are low-risk, mechanically similar rewrites.
   - What's unclear: whether the owner wants Phase 2 scoped strictly to the literal
     `student_id = auth.uid()` pattern (in which case `assignments`' correlated check and `accessories`'
     `EXISTS` gate are technically a different shape) or wants "anything that will break under the new
     model" swept together now.
   - Recommendation: include both — the rewrite cost is low and deferring them creates the exact
     "looks done but isn't" gap this milestone's own Pitfalls research warns about repeatedly.

---

## Sources

### Primary (HIGH confidence)

- **[VERIFIED: Supabase Management API, `POST /v1/projects/hdltcvgqrtxuxgjdvzzu/database/query`]** — live `pg_policies` enumeration (80 policies / 37 tables), live `pg_constraint` FK-target queries for the 7 Group B tables and the 10 edge-case candidate tables, live `pg_proc`/`pg_get_functiondef` source reads for `award_xp`, `check_rate_limit`, `promote_placeholder_student`, `teacher_get_student_points`, `teacher_link_student`, `has_active_subscription`, `is_free_node`, live `child_profiles`/`parents` row counts and index listing. Run 2026-07-30, this session — not carried over from any prior research file.
- `C:\Development\PianoApp2\supabase\migrations\20260722120000_add_parents_and_child_profiles.sql` — Phase 1's actual applied migration; source of the 16-table Group A FK-add list and the sync-trigger/deletion-cascade mechanics `owned_child_ids()` implicitly relies on.
- `C:\Development\PianoApp2\.planning\phases\01-identity-schema-expand\01-fk-checklist.md` — Phase 1's owner-signed 16-table + 1-carve-out checklist (D-04), cross-referenced against this phase's live `pg_policies` scan to derive Group A vs. Group B.
- `C:\Development\PianoApp2\.planning\phases\01-identity-schema-expand\01-function-inventory.md` — Phase 1's committed D-23 function inventory; this research resolves the "Phase 2 vs Phase 8" scoping question it left open.
- `C:\Development\PianoApp2\supabase\migrations\20260127000003_optimize_rls_auth_plan.sql` — the owner-first `(SELECT auth.uid())` + `EXISTS(teacher_student_connections...)` template reused verbatim for the teacher branch.
- `C:\Development\PianoApp2\supabase\migrations\20260131000001_audit_rls_policies.sql` — `SECURITY DEFINER`/`search_path`-pinning style precedent, `pg_policies`-audit-as-verification precedent.
- `C:\Development\PianoApp2\supabase\migrations\20250105000005_fix_teacher_student_connections_rls.sql` — historical (superseded) teacher_student_connections policy shape; live shape confirmed superseded via `pg_policies`, current live version documented directly.
- `C:\Development\PianoApp2\src\services\authorizationUtils.js` — confirmed via `Grep` that no client code queries `teacher_student_connections` by `student_id` from a self-access perspective (Minor Observation section).
- [Supabase Docs — RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — official source for the `(SELECT auth.uid())` initPlan-caching guidance, the non-correlated `IN` vs. correlated `EXISTS` distinction, and the `SECURITY DEFINER`-blocks-inlining fact underlying RLS-H1's deviation.

### Secondary (MEDIUM confidence)

- `C:\Development\PianoApp2\.planning\research\ARCHITECTURE.md`, `PITFALLS.md`, `SUMMARY.md` — milestone-kickoff research (2026-07-21); used for pitfall framing and the ownership-subquery shape recommendation, but its own policy/table counts are superseded by this session's live verification where they differ (documented explicitly in `## Summary`).
- [GitHub — supabase/discussions#14576](https://github.com/orgs/supabase/discussions/14576) — community elaboration of the initPlan-caching guidance, cited by the official doc.

### Tertiary (LOW confidence, flagged for validation)

- The exact intended classification of `user_preferences` (child- vs. parent-scoped) — no source resolves this; flagged as Open Question 2, not asserted.
- Whether `students_total_score` (referenced inside `promote_placeholder_student`'s source) is a live table under a different name than what this session's 37-table `pg_policies` scan surfaced — flagged as Assumption A2, not resolved.

---

## Metadata

**Confidence breakdown:**

- Concrete per-table inventory (Groups A/B/C): HIGH — every table/policy/column claim verified live against production via direct SQL query in this session, not inherited from prior research.
- Ownership helper design (RLS-H1 mechanics, inlining behavior): HIGH on the SQL shape and the `SECURITY DEFINER`-blocks-inlining fact (official Supabase docs + this project's own prior fix precedent); MEDIUM on whether Postgres will actually inline this specific function on Supabase's current Postgres version — explicitly gated by the required `EXPLAIN ANALYZE` verification step, not assumed.
- D-23 function scoping: HIGH — resolved by reading live function source text directly, not inference.
- RLS-06 adversarial suite / JWT-claims impersonation technique: HIGH — `request.jwt.claims` GUC mechanism is Supabase's documented `auth.uid()` implementation, used the same way this project's own SQL Editor workflow already would.
- Edge cases (`accessories`, `assignments`, `user_preferences`) and Open Questions: MEDIUM — findings themselves are verified live, but the recommended resolution is this researcher's judgment, explicitly flagged as needing planner/owner confirmation rather than presented as settled.

**Research date:** 2026-07-30
**Valid until:** Treat as valid through this phase's implementation window only — re-verify the `pg_policies` inventory if implementation is delayed more than ~2 weeks or if any other phase/hotfix touches RLS in the interim (fast-moving surface, live production database).
