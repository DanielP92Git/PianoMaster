---
phase: 12-database-schema-and-rls
plan: 02
subsystem: database
tags: [supabase, postgres, rls, row-level-security, subscriptions, content-gate, paywall]

# Dependency graph
requires:
  - phase: 12-01
    provides: is_free_node() and has_active_subscription() Postgres functions

provides:
  - node_id column on students_score table with sparse index
  - students_score_select policy (own + service_role + connected teachers, replaces Consolidated scores access ALL policy)
  - students_score_insert_gate policy (content gate: is_free_node OR has_active_subscription)
  - student_skill_progress_insert_gate policy (content gate replaces _insert_own)
  - student_skill_progress_update_gate policy (content gate replaces _update_own)
  - apiScores.js passes node_id in INSERT for gate enforcement

affects:
  - 14-paywall-ui (gate now enforced at DB level — React isPremium check is UI layer only)
  - 13-webhook-handler (service_role bypasses RLS, unaffected)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Content gate at DB layer: INSERT/UPDATE policies check is_free_node(node_id) OR has_active_subscription(uid())"
    - "Append-only score table: no UPDATE policy on students_score — all writes via INSERT"
    - "Defense in depth: React isPremium check (fast UX) + RLS gate (database enforcement)"

key-files:
  created:
    - supabase/migrations/20260226000003_add_content_gate_rls.sql
  modified:
    - src/services/apiScores.js

key-decisions:
  - "students_score has no UPDATE policy — it is append-only; all write paths use INSERT"
  - "Teacher SELECT access consolidated into students_score_select (dropped separate Teachers can view policy to avoid duplicate permissive SELECT policies)"
  - "node_id uses sparse index (WHERE node_id IS NOT NULL) — free disk/memory for non-trail scores"
  - "Migration applied via Supabase Management API + migration repair (duplicate timestamp 20260127000003 blocks CLI push)"

requirements-completed: [SUB-03, GATE-03]

# Metrics
duration: 3min
completed: 2026-02-26
---

# Phase 12 Plan 02: Content Gate RLS Summary

**Content gate enforcement at database level: INSERT/UPDATE policies on students_score and student_skill_progress now call is_free_node(node_id) OR has_active_subscription() — premium node scores are blocked even if client-side checks are bypassed.**

## Performance

- **Duration:** 3 minutes
- **Started:** 2026-02-26T01:54:09Z
- **Completed:** 2026-02-26T01:57:00Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Added `node_id TEXT` column to `students_score` with sparse index (only indexes non-NULL values — saves space for non-trail scores)
- Replaced `Consolidated scores access` ALL policy on `students_score` with three fine-grained per-command policies: `students_score_select`, `students_score_insert_gate`, plus preserved `Students can delete own scores`
- Dropped separate `Teachers can view connected students scores` SELECT policy — consolidated teacher subquery into the new `students_score_select` policy (avoids duplicate permissive policies, same pattern as prior consolidation migrations)
- Added `students_score_insert_gate`: INSERT requires `student_id = auth.uid()` AND (`is_free_node(node_id)` OR `has_active_subscription(uid())`)
- Dropped `student_skill_progress_insert_own` and `student_skill_progress_update_own` policies
- Added `student_skill_progress_insert_gate` and `student_skill_progress_update_gate` with same content gate logic
- Updated `apiScores.js` INSERT to include `node_id: nodeId || null` — non-trail games pass `null` (always allowed by `is_free_node(NULL)`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add node_id to students_score, replace RLS policies with content gate** - `ad205a0` (feat)
2. **Task 2: Update apiScores.js to pass node_id into the students_score INSERT** - `6a366dc` (feat)

**Plan metadata:** committed with docs commit after SUMMARY

## Files Created/Modified

- `supabase/migrations/20260226000003_add_content_gate_rls.sql` - node_id column + index, students_score_select, students_score_insert_gate, student_skill_progress_insert_gate, student_skill_progress_update_gate
- `src/services/apiScores.js` - INSERT now includes `node_id: nodeId || null`

## Decisions Made

- **Append-only students_score:** No UPDATE policy added — the existing write pattern is INSERT-only (one row per game session). No behavioral change.
- **Sparse index:** `WHERE node_id IS NOT NULL` index skips the majority of historical rows (non-trail games), keeping index size minimal.
- **Teacher access consolidation:** Dropping the separate `Teachers can view connected students scores` SELECT policy was required to avoid the duplicate permissive policies anti-pattern (two SELECT policies on the same table both allowing teacher access would be evaluated independently, each allowing access). The teacher subquery is now inside the single `students_score_select` policy using OR logic.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

**Migration CLI duplicate timestamp (pre-existing):** Same as Plan 01 — `20260127000003` appears twice in local migration history with different filenames. Applied migration via Supabase Management REST API (`POST /v1/projects/{ref}/database/query`) and registered in history with `migration repair --status applied 20260226000003`. No data integrity risk.

## User Setup Required

None — migration is live in remote database. No environment variables or dashboard configuration needed.

## Next Phase Readiness

- Content gate is live at the database layer for both `students_score` and `student_skill_progress`
- Phase 14 (Paywall UI) can rely on RLS as the ground-truth enforcement layer
- Phase 13 (Webhook Handler) uses service_role which bypasses RLS — unaffected

## Self-Check: PASSED

- supabase/migrations/20260226000003_add_content_gate_rls.sql: FOUND
- src/services/apiScores.js: FOUND (node_id in INSERT)
- commit ad205a0 (content gate migration): FOUND
- commit 6a366dc (apiScores node_id): FOUND
- Remote DB: node_id column on students_score: 1 row
- Remote DB: Consolidated scores access policy: 0 rows (dropped)
- Remote DB: students_score INSERT policy: students_score_insert_gate
- Remote DB: student_skill_progress INSERT policy: student_skill_progress_insert_gate
- Remote DB: Teachers can view connected students scores policy: 0 rows (dropped/consolidated)

---
*Phase: 12-database-schema-and-rls*
*Completed: 2026-02-26*
