---
phase: 05-subscription-re-pointing
plan: 02
subsystem: database
tags: [postgres, supabase, rls, migration, subscriptions, lemon-squeezy]

# Dependency graph
requires:
  - phase: 05-01
    provides: "Confirmed live parent_subscriptions schema (11 columns, no parent_id), existing_student_id_fk_on_delete=CASCADE, byte-identical has_active_subscription() body, real row count (9, not 3)"
provides:
  - "Forward migration 20260805120000_add_parent_subscriptions_parent_id.sql: additive parent_id column + FK + index, two-pass resolve-chain backfill, additive sibling SELECT policy, has_active_subscription() body swap, unresolved_webhook_log dead-letter table"
  - "Committed down-migration reversing every object in exact inverse order (D-12)"
  - "Phase 8 handoff section (7-item table) documenting every legacy artefact this migration deliberately leaves in place"
affects: [05-03, 05-04, 05-05, 05-06, 05-07, 05-09, phase-08-contract-legacy-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Additive dual-policy RLS rollout (Phase 2 precedent): new parent_id policy added alongside legacy student_id policy, neither dropped"
    - "In-place CREATE OR REPLACE body swap preserving function signature to avoid touching downstream call sites"
    - "Deny-all RESTRICTIVE RLS on dead-letter/audit tables from first migration (not retrofitted)"
    - "Committed forward+down migration pair in the same commit set, down-migration authored immediately after forward"

key-files:
  created:
    - supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.sql
    - supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.down.sql
  modified:
    - .planning/phases/02-rls-rewrite-ownership-based-access-control/02-phase8-handoff.md

key-decisions:
  - "parent_id left nullable (not NOT NULL) so an unresolvable webhook dead-letters rather than throwing at payment time (D-03); tightening deferred to Phase 8"
  - "FK uses ON DELETE CASCADE, matching the confirmed live student_id FK rule from 05-discovery.md, to preserve the COPPA hard-delete flow"

patterns-established: []

requirements-completed: [MIGRATE-04]

# Metrics
duration: ~20min
completed: 2026-08-06
---

# Phase 5 Plan 02: Subscription Re-Pointing — Migration Authoring Summary

**Authored (not applied) the full DB half of the subscription re-pointing: an additive `parent_subscriptions.parent_id` column with resolve-chain backfill, a dual-policy RLS sibling, an in-place `has_active_subscription()` body swap, and a deny-all dead-letter table — plus its exact-inverse down-migration and a Phase 8 handoff section.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-06T07:26:00Z (approx, after worktree base correction)
- **Completed:** 2026-08-06T07:46:55Z
- **Tasks:** 3/3 completed
- **Files modified:** 3 (2 created, 1 appended)

## Accomplishments

- Forward migration `20260805120000_add_parent_subscriptions_parent_id.sql`: pure `ALTER TABLE` (no fabricated `CREATE TABLE`, per the discovery/pattern-map "Unknowns" constraint) adding `parent_id UUID` + `parent_subscriptions_parent_id_fkey` FK (`ON DELETE CASCADE`, matching the confirmed live `student_id` FK rule) + index, a two-pass resolve-chain backfill (`parents.id` then `child_profiles.id -> parent_id`) with a non-aborting `RAISE NOTICE` unresolved-count report, the additive `parent_subscriptions_select_own_parent` SELECT policy, the `has_active_subscription(p_student_id UUID)` body swap to `parent_id = p_student_id OR student_id = p_student_id` (signature unchanged), and the `unresolved_webhook_log` dead-letter table with `ENABLE ROW LEVEL SECURITY` + a `RESTRICTIVE` deny-all policy from its first migration.
- Down-migration `20260805120000_add_parent_subscriptions_parent_id.down.sql`, committed in the same task sequence: restores the original `has_active_subscription()` body verbatim, drops the new policy/index/FK/column, and drops `unresolved_webhook_log` with an explicit `PRE-BACKOUT STEP` comment instructing the operator to save off any dead-lettered rows first.
- Appended a `## 5. Phase 5 — Subscription Re-Pointing handoff items` section (7-row table) to `02-phase8-handoff.md`, plus one new row in the existing `## Summary for Phase 8` table, itemizing every legacy artefact this migration deliberately leaves behind: the `student_id` column, the legacy SELECT policy, the helper's `OR student_id` branch, the webhook/checkout compatibility shim, `parent_id` nullability, `unresolved_webhook_log` retention, and the `process-account-deletions` LS-cancel lookup.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author the forward migration** - `92d4eb8a` (feat)
2. **Task 2: Author the down-migration in the same commit (D-12)** - `49c76f0e` (feat)
3. **Task 3: Append the Phase 5 handoff section to 02-phase8-handoff.md (D-17)** - `c5dceb0b` (docs)

_Note: no TDD tasks in this plan — all three tasks author static SQL/markdown artifacts, verified by grep-based automated checks per the plan's `<verify>` blocks._

## Files Created/Modified

- `supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.sql` - Forward migration: parent_id column + FK + index, resolve-chain backfill, dual RLS policy, `has_active_subscription()` body swap, dead-letter table, D-08 non-action comment
- `supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.down.sql` - Exact-inverse backout, zero data loss
- `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-phase8-handoff.md` - Appended Phase 5 handoff section + one summary-table row (additions only, no existing content changed)

## Decisions Made

- `parent_id` stays **nullable** in this phase rather than `NOT NULL` — an unresolvable webhook must dead-letter (D-03), not hard-fail an insert at the exact moment a customer is paying. Tightening deferred to Phase 8 and recorded in the handoff table.
- FK delete rule set to `ON DELETE CASCADE`, matching `05-discovery.md`'s confirmed `existing_student_id_fk_on_delete: CASCADE` — `NO ACTION` would make a `parents` row deletion fail whenever a billing row exists, breaking the COPPA hard-delete flow.
- No new unique/uniqueness constraint against multiple active subscriptions per parent (D-08, explicit non-action) — a partial unique index would convert a rare billing anomaly into a hard payment failure at upsert time; the anomaly is surfaced instead via a read-only audit query and `cancel-subscription`'s D-06 ambiguity branch (implemented in a later plan).

## Deviations from Plan

None — plan executed exactly as written. All three tasks' automated `<verify>` grep checks passed on first attempt; no Rule 1/2/3 auto-fixes were needed since this plan authors static SQL/markdown artifacts with no runtime behavior to debug.

## Issues Encountered

**Worktree base mismatch at startup:** the worktree's HEAD (`abcadb7d`, an old v3.6-era commit) did not contain the Phase 5 planning artifacts (`05-02-PLAN.md`, `05-discovery.md`, etc.) needed to execute this plan — `merge-base HEAD <expected-base>` did not equal the expected base commit. Per the `<worktree_branch_check>` protocol: stashed the one uncommitted local change (`.claude/settings.local.json`, unrelated to this plan) with `git stash push -u`, then ran `git reset --hard 768f2690d61e40db99f28c82924904ad6fb78dd1` to align the worktree branch to the correct base (a prior merge-back commit containing all Phase 5 planning docs). Verified post-reset that the expected plan files existed before proceeding. No work was lost — the worktree had no prior commits of its own on this branch.

## User Setup Required

None - no external service configuration required. Nothing in this plan touches a live database; both migration files are authored artifacts only, per the plan's `<critical_context>` constraint. The actual production apply happens later in plan 05-09 (Wave 6), gated by owner sign-off.

## Next Phase Readiness

- The DB half of Phase 5's SC-1 is fully authored and reversible: `parent_id` column + FK + index, resolve-chain backfill, additive SELECT policy, `has_active_subscription()` body swap, and the dead-letter table, with a committed down-migration in the same task sequence.
- Plans 05-03/05-04/05-05 (Edge Function and client-side re-pointing) can now reference this migration's exact column/policy/function names.
- Plan 05-06 (sandbox seed) and 05-07 (rehearsal runbook) can build their `BEGIN...ROLLBACK` assertions directly against this file's Section 1-6 structure.
- Plan 05-09's production apply is unblocked pending the other Wave 2/3+ plans and final owner sign-off — this plan does not touch any live database.
- `npm run lint` (0 errors, pre-existing warnings only) and `npm run test:run` (2303/2303 passed) both confirmed zero regression, as expected since no `src/` files were touched.

## Self-Check: PASSED

- FOUND: `supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.sql`
- FOUND: `supabase/migrations/20260805120000_add_parent_subscriptions_parent_id.down.sql`
- FOUND: `.planning/phases/02-rls-rewrite-ownership-based-access-control/02-phase8-handoff.md` contains `## 5. Phase 5 — Subscription Re-Pointing handoff items`
- FOUND: commit `92d4eb8a` in `git log --oneline`
- FOUND: commit `49c76f0e` in `git log --oneline`
- FOUND: commit `c5dceb0b` in `git log --oneline`

---
*Phase: 05-subscription-re-pointing*
*Completed: 2026-08-06*
