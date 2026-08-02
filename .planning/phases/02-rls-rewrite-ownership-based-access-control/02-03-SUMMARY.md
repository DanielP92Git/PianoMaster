---
phase: 02-rls-rewrite-ownership-based-access-control
plan: 03
subsystem: database
tags: [postgres, rls, supabase, row-level-security, sql-migration]

# Dependency graph
requires:
  - phase: 02-rls-rewrite-ownership-based-access-control (plan 01)
    provides: policy inventory (02-policy-inventory.md), db-assertions.sql verification suite
  - phase: 02-rls-rewrite-ownership-based-access-control (plan 02)
    provides: owned_child_ids() helper design + VERDICT=FUNCTION inlining verdict (02-inlining-verdict.md)
provides:
  - "supabase/migrations/20260801120000_rls_ownership_rewrite.sql — atomic additive migration: owned_child_ids() helper, child_profiles' 2 terminal policies, 51 new _parent_owner sibling policies across 24 tables, award_xp/check_rate_limit D-23 re-points"
  - "supabase/migrations/20260801120000_rls_ownership_rewrite.down.sql — committed, idempotent rollback"
affects:
  [
    02-rls-rewrite-ownership-based-access-control (plan 04 — branch rehearsal + production apply),
    phase 8 (legacy policy drop / contract step),
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    [
      "dual-policy additive RLS rewrite (new sibling ADDED alongside legacy, never DROP POLICY)",
      "SECURITY INVOKER STABLE SQL helper function for RLS predicate reuse (owned_child_ids())",
      "SECURITY DEFINER function ownership re-point (explicit IN-list check in body since DEFINER bypasses RLS)",
    ]

key-files:
  created:
    - supabase/migrations/20260801120000_rls_ownership_rewrite.sql
    - supabase/migrations/20260801120000_rls_ownership_rewrite.down.sql
  modified: []

key-decisions:
  - "VERDICT=FUNCTION honored throughout — every _parent_owner predicate uses `<id_col> IN (SELECT public.owned_child_ids())`, per 02-inlining-verdict.md"
  - "students_score_update_parent_owner shipped UNGATED (ownership-only), deviating from the plan's abbreviated 'combine ownership with business rule VERBATIM for both tables' prose — the live 20260707120000_add_students_score_update_policy.sql migration's own comment confirms students_score's UPDATE has no subscription re-gate by design ('the row already passed the insert gate when it was created, and retries must work for all users'); only students_score INSERT is gated, matching 02-policy-inventory.md's own GATED annotation (which marks only INSERT, not UPDATE)"
  - "assignments_select_parent_owner rewrites the embedded correlated predicate using the REAL join column `class_id` (confirmed against 20250708191932_fix_multiple_permissive_policies.sql), not `assignment_id` as literally written in the plan's task text — class_enrollments has no assignment_id column, so the plan's literal text would have produced a migration that fails to apply"
  - "accessories and assignments edge cases (D-32) shipped as brand-new additive CREATE POLICY siblings (accessories_select_parent_owner, assignments_select_parent_owner) rather than in-place edits to the existing consolidated policies — matches the plan's own task text ('ADD a new SELECT policy' / 'ADD an assignments_select_parent_owner sibling') and keeps the migration at zero DROP POLICY statements throughout, even though 02-policy-inventory.md's edge-case table describes these as '0 new policies, 1 modified'"
  - "award_xp's CREATE OR REPLACE FUNCTION explicitly re-adds SET search_path = public inside the function definition — the live function only has this pinned via a separate ALTER FUNCTION (20260326000001_fix_security_linter_warnings.sql), which CREATE OR REPLACE FUNCTION does not preserve; omitting it would have silently regressed that prior security-linter fix"

patterns-established:
  - "Additive dual-policy discipline: every new RLS policy in this migration ends in the literal suffix _parent_owner and never issues DROP POLICY against a legacy policy name — both the RLS-02 audit and Phase 8's eventual legacy-drop become trivial LIKE '%_parent_owner' filters"

requirements-completed: [RLS-01, RLS-02, RLS-03, RLS-04]

# Metrics
duration: 59min
completed: 2026-08-02
---

# Phase 2 Plan 03: RLS Ownership Rewrite Migration Summary

**Atomic additive Postgres migration adding `owned_child_ids()` SECURITY INVOKER helper + 51 new `_parent_owner` RLS sibling policies across 24 tables, OR'd alongside every legacy `student_id = auth.uid()` policy, with `award_xp`/`check_rate_limit` re-pointed to ownership checks and a committed rollback.**

## Performance

- **Duration:** 59 min
- **Started:** 2026-08-02T23:17:14+03:00 (Task 1 commit)
- **Completed:** 2026-08-03T00:16:29+03:00 (Task 3 commit)
- **Tasks:** 3
- **Files modified:** 2 (both new files)

## Accomplishments

- `owned_child_ids()` SECURITY INVOKER SQL STABLE helper function, matching the VERDICT=FUNCTION inlining verdict from Plan 02 (folds into a one-time ProjectSet/HashAggregate, `loops=1`, not re-evaluated per row)
- `child_profiles` gets its own two TERMINAL policies (parent-owner ALL via bare `parent_id` equality, teacher SELECT via direct `EXISTS`) — neither references `owned_child_ids()`, avoiding 42P17 recursion (RLS-04/RLS-H2 grep-guarded)
- 51 new `_parent_owner` sibling policies across 24 tables (2 Group C + 37 Group A [29 non-gated + 8 gated] + 7 Group B + 5 edge cases), every one additive — zero `DROP POLICY` statements anywhere in the up-migration
- `parental_consent_tokens_update_parent_owner` ships with an explicit `WITH CHECK` (the live legacy sibling has `with_check: NULL` — Pitfall 1 gap deliberately not reproduced)
- `student_skill_progress` and `students_score` gated INSERT policies (and `student_skill_progress` UPDATE) preserve `is_free_node(node_id) OR has_active_subscription((SELECT auth.uid()))` verbatim (Pitfall 5)
- `award_xp` and `check_rate_limit` re-emitted via `CREATE OR REPLACE FUNCTION` with their full existing bodies, identity check swapped to `p_student_id NOT IN (SELECT public.owned_child_ids())` (D-23); `teacher_get_student_points`/`teacher_link_student`/`promote_placeholder_student` confirmed no-change and untouched
- Committed, idempotent down-migration drops all 51 policies (reverse order, `IF EXISTS`) + the helper function, and reverts both functions to their pre-Phase-2 bodies — verified the 51 `DROP POLICY` names are byte-identical to the 51 `CREATE POLICY` names in the up-migration

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration header + owned_child_ids() + child_profiles' two terminal policies** - `63c2a824` (feat)
2. **Task 2: The ~37 mechanical \_parent_owner sibling policies (Group A non-gated + Group B + edge cases)** - `38dca662` (feat)
3. **Task 3: Gated policies (Pitfall 5) + award_xp/check_rate_limit re-point (D-23) + COMMIT + down-migration** - `6a7a53c3` (feat)

_Non-TDD plan — one commit per task, no test→feat→refactor cycle._

## Files Created/Modified

- `supabase/migrations/20260801120000_rls_ownership_rewrite.sql` (653 lines) - The atomic additive up-migration: helper function, child_profiles' terminal policies, 51 new `_parent_owner` sibling policies, gated-policy preservation, 2 function re-points, plain-English Summary trailer, `COMMIT;`
- `supabase/migrations/20260801120000_rls_ownership_rewrite.down.sql` (270 lines) - Committed rollback: reverts both functions to pre-Phase-2 bodies, drops all 51 policies in reverse object order + the helper, all `IF EXISTS`

## Decisions Made

See `key-decisions` in frontmatter above for full rationale. Summary:

- Followed VERDICT=FUNCTION from Plan 02 throughout (no inline-literal fallback needed)
- `students_score` UPDATE shipped ungated (ownership-only), matching the live table's actual business rule rather than the plan's generalized "verbatim for both tables" prose
- `assignments_select_parent_owner` uses the real `class_id` join column instead of the plan text's `assignment_id` (which does not exist on `class_enrollments`)
- `accessories`/`assignments` D-32 edge cases shipped as new additive siblings, not in-place edits, keeping the additive-only/zero-DROP-POLICY discipline intact
- Re-added `SET search_path = public` inside `award_xp`'s `CREATE OR REPLACE FUNCTION` to avoid regressing a prior security-linter fix that `CREATE OR REPLACE` would otherwise silently drop

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan text's `assignments` join column (`assignment_id`) does not exist on `class_enrollments`**

- **Found during:** Task 2 (edge cases — `assignments_select_parent_owner`)
- **Issue:** The plan's task text specified `EXISTS (SELECT 1 FROM class_enrollments ce WHERE ce.assignment_id = assignments.id AND ...)`. `class_enrollments` has no `assignment_id` column (verified via `20250708191932_fix_multiple_permissive_policies.sql`'s live "Users can access assignments" policy text, which joins on `class_id`). Using the plan's literal predicate would produce a migration that fails to apply (`column "assignment_id" does not exist`).
- **Fix:** Rewrote the predicate to `class_id IN (SELECT class_id FROM class_enrollments WHERE student_id IN (SELECT public.owned_child_ids()) AND status = 'active')`, matching the real schema and the shape of the existing live policy it's a sibling to. The plan's own task text anticipated this ("confirm the real join column names against the live assignments/class_enrollments policy text before writing").
- **Files modified:** `supabase/migrations/20260801120000_rls_ownership_rewrite.sql`
- **Verification:** Cross-referenced against the live "Users can access assignments" policy text; the class_enrollments table schema has no assignment_id column anywhere in migration history.
- **Committed in:** `38dca662` (Task 2 commit)

**2. [Rule 2 - Missing Critical] `award_xp`'s `CREATE OR REPLACE FUNCTION` would have silently dropped its `search_path` pinning**

- **Found during:** Task 3 (D-23 function re-points)
- **Issue:** The live `award_xp` function has `SET search_path = public` applied via a separate `ALTER FUNCTION` statement (`20260326000001_fix_security_linter_warnings.sql`), not embedded in its `CREATE OR REPLACE FUNCTION` body. `CREATE OR REPLACE FUNCTION` does not preserve config parameters set via a prior `ALTER FUNCTION ... SET` — replacing the function without re-adding the clause would silently regress that prior security-linter fix (search_path-injection surface reopened).
- **Fix:** Added `SET search_path = public` directly inside the re-emitted `award_xp` definition (matching `check_rate_limit`, which already had it embedded from its original migration).
- **Files modified:** `supabase/migrations/20260801120000_rls_ownership_rewrite.sql`
- **Verification:** Confirmed both `award_xp` and `check_rate_limit` definitions in the migration carry `SET search_path = public`.
- **Committed in:** `6a7a53c3` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 missing-critical addition)
**Impact on plan:** Both fixes were necessary for the migration to actually apply cleanly and to avoid a silent security regression. No scope creep — both stayed inside the plan's own explicitly-anticipated verification steps.

## Issues Encountered

- **Worktree base staleness at agent startup:** the worktree branch's HEAD (`abcadb7d`) was not a descendant of the expected base commit (`8b84a8d2`, "docs(phase-02): update tracking after wave 1" on `main`). Corrected via the sanctioned `git reset --hard 8b84a8d204175d30e0f9fce907015480ca4545a5` inside the mandatory `<worktree_branch_check>` startup step (not a mid-task self-recovery) before any file edits or commits.
- **Business-logic-gate research required archaeology beyond the provided artifacts:** neither `student_skill_progress`'s nor `students_score`'s live gated INSERT/UPDATE policy text exists in any committed migration file (applied directly via Dashboard SQL Editor per project history) — resolved by cross-referencing `20260707120000_add_students_score_update_policy.sql`'s own comment block (which documents the live policy names and the "no subscription re-gate on UPDATE" business reasoning) plus 02-PATTERNS.md's `<interfaces>` block for the exact WITH CHECK shape.

## User Setup Required

None - no external service configuration required. This migration is authored only, not applied to any database (rehearsal or production) — application is [BLOCKING] and owner-gated in a later plan (Plan 04 per STATE.md's phase roadmap).

## Next Phase Readiness

- The migration file + committed down-migration are ready for the next plan's [BLOCKING] rehearsal-branch apply and `02-db-assertions.sql` verification pass (RLS-01 through RLS-06).
- All 24 in-scope tables from `02-policy-inventory.md` are covered; `02-db-assertions.sql`'s RLS-02 coverage assertion's full `(table, cmd)` list is satisfied by this migration.
- Both `award_xp` and `check_rate_limit` are ready for a live smoke test confirming a parent can award XP / consume rate-limit tokens for an owned child post-apply.
- No blockers identified. This migration was NOT applied to any database (rehearsal or production) per this plan's explicit scope boundary — application is the next plan's responsibility.

---

_Phase: 02-rls-rewrite-ownership-based-access-control_
_Completed: 2026-08-02_

## Self-Check: PASSED

- FOUND: supabase/migrations/20260801120000_rls_ownership_rewrite.sql
- FOUND: supabase/migrations/20260801120000_rls_ownership_rewrite.down.sql
- FOUND: .planning/phases/02-rls-rewrite-ownership-based-access-control/02-03-SUMMARY.md
- FOUND commit: 63c2a824 (Task 1)
- FOUND commit: 38dca662 (Task 2)
- FOUND commit: 6a7a53c3 (Task 3)
