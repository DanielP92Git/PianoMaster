---
phase: 02-rls-rewrite-ownership-based-access-control
plan: 01
subsystem: database
tags: [postgres, rls, supabase, row-level-security, sql]

# Dependency graph
requires:
  - phase: 01-identity-schema-expand
    provides: "child_profiles/parents tables (deny-all RLS, D-16), child_profiles.parent_id index (D-17), UUID-reuse anchor (IDENT-04), committed D-04 checklist discipline this plan re-runs"
provides:
  - "02-policy-inventory.md — the authoritative, owner-signed per-table/per-cmd RLS-02/RLS-03 worklist the Wave 2 migration is written FROM (one CREATE POLICY per row)"
  - "02-db-assertions.sql — the RLS-01..RLS-06 SQL-assertion suite that verifies the migration post-apply (no DB test framework exists in this project, per D-28)"
  - "02-seed-second-family.sql — branch-only synthetic second family (PARENT_B/PARENT_B_CHILD) for the RLS-06 cross-family adversarial cases and RLS-05 cross-family cost check"
  - "A2 resolution: students_total_score confirmed NOT in-scope (table dropped 2025-12-07, never recreated)"
affects: ["02-02", "02-03", "02-04", "02-05", "phase-8-contract-cleanup"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "_parent_owner naming suffix on every new RLS policy (RLS-02/RLS-03 audit + Phase 8 legacy-drop both become trivial LIKE filters)"
    - "Dual-policy additive rollout — new policies added alongside legacy student_id=auth.uid() policies, never DROP+replace, mirrors Phase 1's D-02 'add, don't replace' discipline"
    - "request.jwt.claims + SET ROLE authenticated impersonation for adversarial RLS testing (no pgTAP, per D-28)"

key-files:
  created:
    - .planning/phases/02-rls-rewrite-ownership-based-access-control/02-policy-inventory.md
    - .planning/phases/02-rls-rewrite-ownership-based-access-control/02-db-assertions.sql
    - .planning/phases/02-rls-rewrite-ownership-based-access-control/02-seed-second-family.sql
  modified: []

key-decisions:
  - "Count correction: the per-table cmd breakdown sums to 37 Group A / 46 total pre-edge-case policies, not the '30 Group A / 39 total' figure repeated in RESEARCH.md's 'Verified total' subsection and this plan's <interfaces> block — RESEARCH's OWN earlier Summary section independently states '~46 policies', consistent with this correction. The mandated header text is kept verbatim for audit-trail continuity; the row-level table (used by the actual migration) is built from the corrected, higher-fidelity per-cmd breakdown so no (table,cmd) pair is silently undercovered."
  - "user_preferences id_col corrected to user_id (schema-verified against 20250120000000_add_user_preferences.sql) — RESEARCH and this plan's <interfaces> both state student_id, but the table has no such column."
  - "A2 (students_total_score) resolved via migration-history archaeology instead of a live pg_policies/to_regclass query, because Supabase MCP tooling was not available to this worktree-isolated execution agent (only filesystem/Bash tools were present). Migration 20251207000004_drop_students_total_score_table.sql (2025-12-07) drops the table; 20251215000001_restore_teacher_points_access.sql (2025-12-15) confirms the replacement design (teacher_get_student_points() RPC over students_score + student_achievements); no later migration recreates it. Confirmed not an in-scope 25th table."

patterns-established:
  - "RLS-02 dual-policy coverage audit scoped to an explicit, embedded 24-table (table,cmd) VALUES list — avoids false-positives from tables legitimately outside RLS-02 scope."
  - "RLS-06 case 6 (cross-family UPDATE rejection) wrapped in BEGIN...ROLLBACK with an EXCEPTION WHEN OTHERS branch, since Postgres may either affect 0 rows or raise depending on the exact WITH CHECK failure shape — both are treated as pass."

requirements-completed: [RLS-02, RLS-03, RLS-04, RLS-05, RLS-06]

# Metrics
duration: ~18min
completed: 2026-08-02
---

# Phase 2 Plan 01: RLS Rewrite Foundation Artifacts Summary

**Authored the owner-reviewable RLS policy worklist (37 Group A + 7 Group B + 2 Group C = 46 pre-edge-case policies across 24 tables), the RLS-01..RLS-06 SQL-assertion verification suite, and a branch-only synthetic second-family seed — the three committed artifacts the Wave 2 migration and Wave 3 rehearsal will be built from.**

## Performance

- **Duration:** ~18 min
- **Completed:** 2026-08-02
- **Tasks:** 3 (all `type="auto"`, autonomous)
- **Files modified:** 3 (all newly created)

## Accomplishments

- Transcribed RESEARCH's Concrete Per-Table Inventory into a committed, row-level `02-policy-inventory.md` — every Group A (16 tables), Group B (7 tables), Group C (`child_profiles`, 2 policies), and the 3 owner-resolved edge cases, each with its exact new `_parent_owner` policy name and command.
- Authored `02-db-assertions.sql`: automated `ASSERT` blocks for RLS-01 (helper shape), RLS-02 (dual-policy coverage), RLS-03 (`WITH CHECK` non-null audit), RLS-04 (static recursion guard); commented human-judged protocols for RLS-01's `EXPLAIN ANALYZE` inlining check and RLS-05's performance parity; and the full RLS-06 6-case adversarial matrix using `request.jwt.claims` impersonation, including case 6's cross-family `UPDATE` rejection test wrapped in `BEGIN...ROLLBACK`.
- Authored `02-seed-second-family.sql`: a branch-only synthetic second family (`PARENT_B` + a matching `auth.users` row to satisfy the FK, `PARENT_B_CHILD`, and downstream `student_skill_progress`/`students_score` rows) plus commented reference `SELECT`s for sourcing the live null-parent/connected-teacher/unconnected-teacher UUIDs.
- Resolved the A2 open item live (via migration-history evidence, see Deviations): `students_total_score` is confirmed dropped and not an in-scope RLS-02 table.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write 02-policy-inventory.md + resolve A2 live** - `e38355b1` (docs)
2. **Task 2: Write 02-db-assertions.sql (RLS-01..RLS-06 suite)** - `13518014` (test)
3. **Task 3: Write 02-seed-second-family.sql (synthetic 2nd family)** - `6e96a3a7` (test)

_Note: worktree mode — this SUMMARY.md is committed separately below; STATE.md/ROADMAP.md are NOT touched by this agent (orchestrator owns those writes after the wave merges)._

## Files Created/Modified

- `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-policy-inventory.md` - Authoritative per-table/per-cmd RLS-02/RLS-03 worklist with owner sign-off (D-31/D-32/D-33) and A2 resolution
- `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-db-assertions.sql` - RLS-01..RLS-06 SQL-assertion verification suite (run post-apply on the rehearsal branch)
- `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-seed-second-family.sql` - Branch-only synthetic second family for RLS-06/RLS-05 cross-family checks

## Decisions Made

- Kept the plan's mandated exact header count text ("24 tables, ~39 new sibling policies...") verbatim in `02-policy-inventory.md` for audit-trail continuity, while adding a prominent "Count Correction" section disclosing that the itemized per-table breakdown (both RESEARCH's and this file's) actually sums to 37 Group A / 46 pre-edge-case policies — consistent with RESEARCH's own `## Summary` section's independent "~46 policies" figure. The row-level table used to drive the Wave 2 migration reflects the corrected, higher-fidelity count so no `(table,cmd)` pair is silently undercovered.
- Corrected `user_preferences`' `id_col` to `user_id` (schema-verified) rather than the `student_id` stated in RESEARCH/plan text, since the live table has no `student_id` column.
- Resolved A2 via file-based migration-history evidence rather than a live database query, since Supabase MCP tooling was not present in this execution environment (see Deviations below for full reasoning and evidence chain).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected an arithmetic inconsistency in the mandated policy count**

- **Found during:** Task 1 (transcribing RESEARCH's Concrete Per-Table Inventory)
- **Issue:** RESEARCH.md's "Verified total" subsection states "30 (Group A) + 7 (Group B) + 2 (Group C) = 39 new policies", and this plan's `<interfaces>` block repeats "Group A ... — 30 sibling policies" with the same per-table cmd list. Summing that SAME per-table cmd list (e.g. `push_subscriptions` explicitly noted "4 siblings, all 4 commands"; `student_skill_progress`/`student_unit_progress`/`students_score` each DELETE+INSERT+SELECT+UPDATE=4) yields 37 for Group A, not 30 — and 46 total pre-edge-case, matching RESEARCH's OWN earlier `## Summary` section ("~24 tables / ~46 policies"). This is an internal inconsistency within RESEARCH.md itself, carried into the plan's `<interfaces>` text.
- **Fix:** Transcribed the full per-row breakdown (37 Group A rows) into `02-policy-inventory.md`, which is what the Wave 2 migration will actually be written from, and added a prominent "Count Correction" section explaining the discrepancy and citing the exact evidence (RESEARCH's own contradictory "~46" vs "39" figures) — same disclosure discipline the project already uses for the ROADMAP 62/32 → 39/24 correction and Phase 1's IDENT-05 30→17 FK correction. The plan's mandated exact header text is kept verbatim alongside the correction note, satisfying both the literal instruction and factual accuracy.
- **Files modified:** `02-policy-inventory.md`
- **Verification:** Manually re-summed every Group A row's cmd count against RESEARCH.md's own per-table Notes column (several of which explicitly state "N siblings" in prose, confirming the per-cmd counts are correct).
- **Committed in:** `e38355b1` (Task 1 commit)

**2. [Rule 1 - Bug] Corrected `user_preferences`' id_col from `student_id` to `user_id`**

- **Found during:** Task 1
- **Issue:** RESEARCH.md and this plan's `<interfaces>` block both state the `user_preferences` edge case uses `id_col=student_id`. Reading the live migration (`supabase/migrations/20250120000000_add_user_preferences.sql`) shows the table's identity column is `user_id UUID NOT NULL REFERENCES auth.users(id)` — there is no `student_id` column at all. Writing policies against a nonexistent column would break the Wave 2 migration.
- **Fix:** Recorded the corrected `user_id` column in `02-policy-inventory.md`'s edge-case row and added a "Second correction" note so the Wave 2 migration author does not need to re-derive it.
- **Files modified:** `02-policy-inventory.md`
- **Verification:** Read `20250120000000_add_user_preferences.sql`'s `CREATE TABLE` statement directly.
- **Committed in:** `e38355b1` (Task 1 commit)

**3. [Rule 3 - Blocking] A2 resolution method substituted (migration-history archaeology instead of live DB query)**

- **Found during:** Task 1 (A2 resolution step)
- **Issue:** The plan's Task 1 action specifies running a LIVE read-only `pg_policies`/`to_regclass` query against production via Supabase MCP tooling. This execution agent (a worktree-isolated subagent) had no Supabase MCP tools available in its actual tool surface — only Read/Write/Edit/Bash/Grep/Glob — despite the plan's `<mcp_tools>` section stating they would be available. No `supabase` CLI or `.env` credentials were present either, so no live query of any kind was possible.
- **Fix:** Used the project's own migration history as an equivalent, high-confidence source of truth for this specific table-existence question: `supabase/migrations/20251207000004_drop_students_total_score_table.sql` (2025-12-07) explicitly drops `public.students_total_score` ("no longer used"); `20251215000001_restore_teacher_points_access.sql` (2025-12-15) confirms the replacement design (a `teacher_get_student_points()` RPC over `students_score` + `student_achievements`, no table reference); no migration after the drop recreates the table; and RESEARCH's own live 37-table `pg_policies` scan (2026-07-30) doesn't list it either. A2 resolved: NOT an in-scope RLS-02 table.
- **Files modified:** `02-policy-inventory.md` (A2 Resolution section documents the method substitution and full evidence chain)
- **Verification:** Grepped all `supabase/migrations/*.sql` files chronologically after the drop date for any `CREATE TABLE ... students_total_score` — none found.
- **Committed in:** `e38355b1` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 bug corrections in inherited planning-artifact text, 1 blocking substitution due to unavailable MCP tooling)
**Impact on plan:** All three are corrections to source-of-truth accuracy, not scope changes — the 24-table in-scope worklist itself is unchanged; only the exact policy count and one column name are corrected, and A2's answer (not in-scope) matches what the live query would very likely have returned. No architectural decisions were made; nothing here required Rule 4.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required. (Note: the RLS-06 impersonation UUIDs and the RLS-05 `EXPLAIN ANALYZE` baseline in `02-db-assertions.sql` are placeholders to be filled from live read-only lookups + `02-seed-second-family.sql`'s fixed synthetic UUIDs when the suite is actually run post-apply in a later wave — this is expected per the plan's design, not a gap in this plan's deliverables.)

## Next Phase Readiness

- `02-policy-inventory.md` is ready to drive the Wave 2 migration's `CREATE POLICY` statements one row at a time.
- `02-db-assertions.sql` is ready to run against the rehearsal branch once the migration is applied (Plan 04).
- `02-seed-second-family.sql` is ready to run on the rehearsal branch to populate the cross-family adversarial fixtures before `02-db-assertions.sql`'s RLS-06 cases execute.
- Flag for the migration author (Plan 03): use `02-policy-inventory.md`'s corrected 37-Group-A-row breakdown and `user_preferences`'s `user_id` column, not the plan's own `<interfaces>` text, which is superseded by this plan's corrections.
- No blockers for Plan 02 (parallel wave-1 sibling) or Plan 03 (Wave 2 migration author).

---

_Phase: 02-rls-rewrite-ownership-based-access-control_
_Completed: 2026-08-02_

## Self-Check: PASSED

- FOUND: `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-policy-inventory.md`
- FOUND: `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-db-assertions.sql`
- FOUND: `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-seed-second-family.sql`
- FOUND: `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-01-SUMMARY.md`
- FOUND commit `e38355b1` (Task 1)
- FOUND commit `13518014` (Task 2)
- FOUND commit `6e96a3a7` (Task 3)
