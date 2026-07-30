# Phase 2: RLS Rewrite — Ownership-Based Access Control - Context

**Gathered:** 2026-07-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite the child-scoped Row-Level Security policies so every policy that today reads
`student_id = auth.uid()` instead authorizes by **parent ownership**, via a single tested ownership
helper. Rolled out **dual-policy** (new policies added _alongside_ the legacy ones — Postgres OR's
them), non-recursive, and performance-neutral, gated by its own security-review pass. The 20 existing
child rows already carry reused UUIDs (Phase 1 anchor), so no data moves and no downstream FK value
changes — only the policy predicate changes.

**In scope:** the ownership helper function (RLS-01); rewriting the `student_id = auth.uid()` policy
set to parent-ownership across the child-scoped tables (RLS-02); explicit `WITH CHECK` on every
rewritten INSERT/UPDATE (RLS-03); recursion-free design (RLS-04); performance parity (RLS-05); an
adversarial cross-family + null-parent reachability proof (RLS-06).

**Not in this phase:**

- Dropping the legacy `student_id = auth.uid()` policies — that is the **contract** step, Phase 8
  (this phase leaves both live).
- Rewriting teacher-connection policies — they stay structurally unchanged (see D-30 below).
- Signup/age gate (Phase 3), child-profile CRUD & the parental route gate (Phase 4), subscription
  re-pointing (Phase 5 — `parent_subscriptions` stays parent-scoped, no child indirection),
  live cutover/re-consent (Phase 6), recording removal (Phase 7).
- Auditing/repointing the 47 service call sites / 151 `user?.id` references (Phase 8).

**Boundary note carried from Phase 1 (D-23), for the planner to scope explicitly:** Phase 2 is the
first of two phases that re-point the inventoried `SECURITY DEFINER` identity functions
(`is_free_node`, `has_active_subscription`, `award_xp`, COPPA export/delete, rate-limiting fns, etc.)
_from the committed inventory, not grep_. Whether a given function needs touching in Phase 2 vs Phase 8
is a planning-time scoping call against that inventory — not re-opened here.

</domain>

<decisions>
## Implementation Decisions

### Ownership Helper Contract

- **RLS-H1 — Single set-returning SQL `STABLE` helper, `SECURITY INVOKER`, non-correlated `IN`.**
  The one source of truth is `owned_child_ids() RETURNS SETOF uuid` (or equivalent set-returning SQL
  `STABLE` function), consumed as a **non-correlated** `student_id IN (SELECT owned_child_ids())` on
  every child-scoped downstream table. This satisfies RLS-01's _intent_ (one authoritative
  ownership source), RLS-02 (non-correlated so Postgres folds it into a cacheable initPlan), and
  RLS-05 (inlinable, no per-row cliff).
  - **DEVIATION from RLS-01's literal wording, owner-signed.** RLS-01 says
    "`SECURITY DEFINER STABLE`". We use **`SECURITY INVOKER`** SQL `STABLE` instead, because
    `ARCHITECTURE.md`:116 + Pitfall 4 + RLS-05 establish that a `SECURITY DEFINER`/`plpgsql` helper
    runs per-row, cannot be inlined into an initPlan, and is _slower_ than the inline subquery. The
    invoker helper relies on `child_profiles`' own terminal `parent_id = (SELECT auth.uid())` policy
    to resolve the lookup. Recorded with the same deviation discipline as Phase 1's IDENT-05.
  - **Verify inlining with `EXPLAIN ANALYZE`** before trusting it (research's explicit caveat). If the
    planner cannot confirm inlining, fall back to the repeated inline non-correlated subquery (still
    keeping one canonical text) rather than accepting a correlated per-row call.

- **RLS-H2 — Helper is downstream-only; `child_profiles`' own policies use terminal predicates.**
  Because an _invoker_ helper reads `child_profiles` under RLS, calling it from `child_profiles`' own
  policy would be immediate `42P17`. Load-bearing invariant:
  - `owned_child_ids()` is used **only** on the ~31 downstream child-scoped tables.
  - `child_profiles`' own policies never call the helper. Parent branch:
    `parent_id = (SELECT auth.uid())`. Teacher branch: a **direct** `EXISTS` on
    `teacher_student_connections` filtered owner-first by `teacher_id = (SELECT auth.uid())`
    (matches the `20260127000003_optimize_rls_auth_plan.sql` owner-first template).
  - Neither branch reads `child_profiles`-via-policy, so the teacher→connection→child→parent chain
    terminates. **Asserted by the RLS-04 recursion test**, not assumed.

- **RLS-H3 — Helper is strictly parent-scope; teacher access is a separate, unchanged mechanism.**
  `owned_child_ids()` returns only the _calling parent's_ owned children — exactly RLS-01's meaning
  ("does this parent own this child"). Teacher access is NOT folded into the helper; it remains the
  pre-existing connection-based policies. Consequence: the dual-policy rollout **only adds**
  parent-ownership policies alongside the legacy `student_id = auth.uid()` set. (See D-30 for the
  teacher-policy scope this implies.)

### Teacher Access + Null-Parent Profiles

- **D-30 — Teacher-connection policies are left structurally unchanged and are OUT of RLS-02's rewrite
  scope.** They already authorize via `EXISTS (teacher_student_connections …)`, not via
  `student_id = auth.uid()`, so they are not part of the "policies that read `student_id = auth.uid()`"
  set RLS-02 rewrites. Phase 1's D-01 kept the joined column named `student_id`, and UUID reuse keeps
  `tsc.student_id` valid against `child_profiles`, so no re-point is needed. Research
  `ARCHITECTURE.md`:118 confirms teacher policies "keep their existing shape almost unchanged." This
  keeps the blast radius small and gives Phase 8 a clean, unambiguous legacy-drop set (only the
  parent-ownership legacy `student_id = auth.uid()` policies).

- **RLS-T1 — Null-parent (teacher-owned) profiles are handled by natural NULL-exclusion; correctness
  is proven by test, not inspection.** The 5 teacher-created profiles have `parent_id = NULL`
  (milestone D-06). Since `owned_child_ids()` filters `WHERE parent_id = (SELECT auth.uid())`, SQL
  three-valued logic means a NULL `parent_id` never matches any parent, and an anon/NULL `auth.uid()`
  matches nothing either — so those profiles are reachable **only** by their connected teacher, which
  is exactly the intended model (D-06 + Phase 6 SC #3). **No defensive `IS NOT NULL` guard is added**
  (the equality already excludes NULL). Correctness is locked by REQUIRING the RLS-06 adversarial
  suite to explicitly cover this edge:
  - (a) an arbitrary parent session returns **zero rows** for a null-parent profile _and its
    downstream data_,
  - (b) a **non-connected** teacher returns zero rows,
  - (c) the **connected** teacher still sees it.

### Claude's Discretion

Resolve during research/planning without returning to the owner:

- **Dual-policy labeling / Phase 8 handoff (unpicked area).** Default: mirror Phase 1's committed-
  checklist discipline (D-04) — a generated `pg_policies` inventory is the authoritative list that
  drives both the rewrite and the RLS-02/RLS-03 verification, with a naming/tagging convention that
  lets a `pg_policies` query cleanly separate new parent-ownership policies from legacy ones so
  Phase 8 can drop exactly the legacy set. Adopt unless research surfaces a reason not to.
- **Proof & rollout gating (unpicked area).** Default: follow Phase 1's D-27/D-28 precedent —
  branch-rehearsed apply, owner-gated production apply, SQL-assertion tests (row counts + `pg_policies`
  audits + the RLS-06 adversarial cases) run on a Supabase branch with a synthetic second family and
  real ~20-student row counts for RLS-05 `EXPLAIN ANALYZE`. The dedicated `/gsd-secure-phase` pass
  (ROADMAP research flag) runs against the implemented policies before production apply.
- Helper null-safety, `search_path` pinning, exact function signature/naming, and per-table policy
  text — following existing migration style (`20260127000003_optimize_rls_auth_plan.sql`,
  `20260131000001_audit_rls_policies.sql`).
- Which of the D-23-inventoried `SECURITY DEFINER` functions are re-pointed in Phase 2 vs deferred to
  Phase 8 — scoped from the committed inventory during planning.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope & locked decisions

- `.planning/ROADMAP.md` §"Phase 2: RLS Rewrite — Ownership-Based Access Control" — goal, 5 success
  criteria, Pitfalls 1/3/4, and the "own security-review gate" / `/gsd-secure-phase` research flag.
- `.planning/REQUIREMENTS.md` — RLS-01…RLS-06 (this phase), Owner Decisions D-01…D-08 (esp. **D-02**
  teachers re-pointed via connections, **D-05** subscriptions parent-scoped, **D-06** nullable
  `parent_id` / 5 teacher-owned profiles, **D-07** ungated sibling switching), and the UUID-reuse
  anchor decision. Locked — do not re-litigate.
- `.planning/phases/01-identity-schema-expand/01-CONTEXT.md` — Phase 1 decisions this phase builds on:
  **D-16** (new tables ship RLS-enabled/deny-all — Phase 2 adds onto a locked table), **D-17**
  (`child_profiles(parent_id)` already indexed for the ownership subquery), **D-23** (committed
  inventory of `SECURITY DEFINER` identity functions — re-point from it, not grep).
- `COPPA_REFACTOR_PRD.md` (repo root) — source PRD for the target ownership model.

### Research (read before planning — this is the highest-stakes phase)

- `.planning/research/ARCHITECTURE.md` §Q1 (esp. **line 116** — why `SECURITY DEFINER`/`plpgsql` is
  the perf anti-pattern and the inline/`SQL STABLE` alternative that RLS-H1 is built on; **line 118**
  — teacher policies keep their shape, owner-first `EXISTS` template) and the ownership-helper /
  expand-contract sequencing sections.
- `.planning/research/PITFALLS.md` — **Pitfall 1** (USING/WITH CHECK mismatch on UPDATE/INSERT →
  RLS-03), **Pitfall 3** (recursive RLS via teacher→connection→child→parent → RLS-04/RLS-H2),
  **Pitfall 4** (ownership-subquery perf cliff; use non-correlated `IN`, never correlated `EXISTS` →
  RLS-H1/RLS-05).
- `.planning/research/SUMMARY.md` — executive summary + the 5 critical pitfalls. Note: its examples
  use a renamed `child_profile_id` column; Phase 1 D-01 kept the name `student_id`, so read column
  names through that lens.

### Existing schema/RLS precedents to copy

- `supabase/migrations/20260127000003_optimize_rls_auth_plan.sql` — the owner-first `(SELECT auth.uid())`
  - `EXISTS(teacher_student_connections …)` policy template reused verbatim for the teacher branch.
- `supabase/migrations/20260128000001_consolidate_rls_policies.sql`,
  `supabase/migrations/20260131000001_audit_rls_policies.sql` — repo convention favoring explicit
  inline SQL over shared functions; the `pg_policies` audit pattern for RLS-02/RLS-03.
- `supabase/migrations/20250105000005_fix_teacher_student_connections_rls.sql` and
  `20250105000002/003_fix_notifications_policy*.sql` — existing teacher-connection policy shapes that
  D-30 leaves unchanged.
- `supabase/migrations/20260722120000_add_parents_and_child_profiles.sql` — the Phase 1 tables this
  phase writes policies onto (deny-all today, per D-16).

### Codebase maps

- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md` — current identity/RLS model
  and known weak points.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`child_profiles.parent_id` + its index (Phase 1 D-17)** — the ownership subquery's target; index
  already exists so RLS-05 `EXPLAIN ANALYZE` measures real steady state.
- **`teacher_student_connections`** — the small, owner-first-filterable table the teacher branch and
  D-30 rely on; already the basis of shipped teacher-access policies.
- **Owner-first `(SELECT auth.uid())` policy template** — `20260127000003_optimize_rls_auth_plan.sql`;
  reused for both the parent branch and the (unchanged) teacher branch.
- **`pg_policies` audit pattern** — `20260131000001_audit_rls_policies.sql`; the mechanical verifier
  for RLS-02/RLS-03 dual-policy checks.
- **Owner-gated branch-rehearsed migration flow** — Phase 1 D-27/D-28 precedent (also the
  `note_mastery` and v3.5 production applies).

### Established Patterns

- **Deny-all-then-add** — Phase 1 shipped `parents`/`child_profiles` with RLS enabled and zero
  policies (D-16); Phase 2 adds real policies onto an already-locked table.
- **Non-correlated `IN` for cacheable initPlans** — this repo's RLS-perf convention; RLS-H1 conforms.
- **SQL-first verification (no ORM)** — `pg_policies` / SQL-assertion checks on a Supabase branch, not
  a code test harness.

### Integration Points

- **`child_profiles.parent_id`** — read by `owned_child_ids()` on every downstream policy evaluation.
- **The ~31 downstream child-scoped tables** — where new parent-ownership policies are OR'd alongside
  legacy `student_id = auth.uid()` policies.
- **D-23-inventoried `SECURITY DEFINER` functions** — Phase 2 re-points the subset that resolves child
  identity; the rest are Phase 8.
- **Phase 8** — consumes the dual-policy naming convention to drop exactly the legacy set.

</code_context>

<specifics>
## Specific Ideas

- **The organizing idea of this phase is "add, don't replace."** New parent-ownership policies live
  _alongside_ the legacy `student_id = auth.uid()` policies (Postgres OR's them), so nothing a real
  user can do today breaks mid-rollout; Phase 8 removes the legacy half only after verified zero
  traffic.
- **One reinterpretation was made against a locked requirement, deliberately:** RLS-01's literal
  `SECURITY DEFINER` is overridden to `SECURITY INVOKER` SQL `STABLE` (RLS-H1) because the research +
  RLS-05 + Pitfall 4 agree the definer/plpgsql path is the per-row performance cliff. Recorded as an
  owner-signed deviation, mirroring how Phase 1 corrected IDENT-05's "30 FKs" estimate to 17.
- **The null-parent case is treated as a first-class test target, not an afterthought** — the 5
  teacher-owned profiles are the exact rows a naive `IN`-list bug would silently expose or hide, so
  RLS-06 must prove their three-way reachability rather than infer it.

</specifics>

<deferred>
## Deferred Ideas

- **Dropping the legacy `student_id = auth.uid()` policies** — Phase 8 (contract step), gated on
  verified zero traffic. This phase leaves both policy sets live.
- **Rewriting teacher-connection policies** — deliberately not done (D-30); they stay valid via UUID
  reuse. If a future rename of `student_id → child_profile_id` happens (Phase 8's call, Phase 1 D-05),
  the teacher join re-points then.
- **Re-pointing the remaining D-23-inventoried `SECURITY DEFINER` functions** — split between Phase 2
  (child-identity-resolving subset, scoped at planning) and Phase 8.
- **Auditing the 47 service call sites / 151 `user?.id` references** — Phase 8.
- **Subscription RLS** — `parent_subscriptions` stays parent-scoped (`parent_id = auth.uid()`, no
  child indirection); its re-point is Phase 5 after Lemon Squeezy sandbox verification (milestone
  D-05).

</deferred>

---

_Phase: 2-RLS Rewrite — Ownership-Based Access Control_
_Context gathered: 2026-07-30_
