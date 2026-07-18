---
phase: 03-adaptive-pedagogy
plan: 02
subsystem: database
tags: [supabase, postgres, jsonb, skillProgressService, rls, vitest]

# Dependency graph
requires:
  - phase: 03-adaptive-pedagogy (Plan 01)
    provides: in-session adaptive difficulty/tempo groundwork (parallel wave, no direct code dependency)
provides:
  - "note_mastery JSONB column migration (authored, not applied) on student_skill_progress"
  - "merge-on-upsert extension to updateExerciseProgress/updateNodeProgress accepting an optional per-note-mastery delta"
affects:
  [
    03-06-weak-note-targeting,
    03-07-sight-reading-integration-and-migration-apply,
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optional trailing param with null default for backward-compatible service extension (perNoteMastery)"
    - "Conditional spread (...(mergedMastery ? {...} : {})) to omit a key from an upsert payload when a feature is unused by the caller"

key-files:
  created:
    - supabase/migrations/20260712120000_add_note_mastery.sql
  modified:
    - src/services/skillProgressService.js
    - src/services/skillProgressService.test.js

key-decisions:
  - "No new RLS policy authored — note_mastery inherits existing row-level student_skill_progress policies (student_id = auth.uid()); confirmed later by /gsd-secure-phase pass per plan design."
  - "Mastery merge logic duplicated (not extracted to a shared helper) in updateExerciseProgress and updateNodeProgress to keep each function's existing single-upsert flow untouched and easy to diff against the plan's exact snippet."

patterns-established:
  - "Shared service functions extended with an optional trailing parameter that defaults to a true no-op (undefined stays undefined, key omitted from payload) so every other existing call site is byte-for-byte unaffected."

requirements-completed: []
# ADAPT-03/ADAPT-04 NOT marked complete here — this plan only lands the persistence
# layer (migration authored, not applied; service merge logic, not yet called by any
# game). Full completion requires 03-06 (weak-note targeting/consumption) and 03-07
# (sight-reading wiring + migration apply), which also declare these requirement IDs.

# Metrics
duration: 15min
completed: 2026-07-12
---

# Phase 03 Plan 02: Note Mastery Persistence Layer Summary

**Authored the `note_mastery` JSONB migration (DDL-only, no RLS policy) and extended `updateExerciseProgress`/`updateNodeProgress` with an optional per-pitch mastery delta that merges into the existing single upsert via pure addition, defaulting to a byte-for-byte no-op when omitted.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- `supabase/migrations/20260712120000_add_note_mastery.sql` authored, mirroring the `exercise_progress` migration exactly (column + comment + GIN index), with no `CREATE POLICY`/`ALTER POLICY` statements
- Both `updateExerciseProgress` and `updateNodeProgress` accept an optional trailing `perNoteMastery = null` parameter that merges into `note_mastery` inside the same existing upsert call
- Shape validation guards the merge: non-negative integers, `correct <= total` per pitch; malformed pitch entries are skipped without failing the rest of the merge
- 8 new tests added to `skillProgressService.test.js` covering merge, new-pitch-insert, existing-pitch-preservation, no-op-when-omitted, and malformed-entry rejection for both functions (15/15 total tests green)

## Task Commits

Each task was committed atomically:

1. **Task 1: Author the note_mastery migration (DDL only, no new policy)** - `8e1b2a7c` (feat)
2. **Task 2: Merge note_mastery in updateExerciseProgress/updateNodeProgress + tests** - `cf6fce93` (feat)

**Plan metadata:** (this commit) `docs(03-02): complete note-mastery-persistence plan`

## Files Created/Modified

- `supabase/migrations/20260712120000_add_note_mastery.sql` - Adds `note_mastery JSONB DEFAULT '{}'::jsonb` column, GIN index, and column comment on `student_skill_progress`; DDL-only, no policy; not applied (Plan 07 applies it)
- `src/services/skillProgressService.js` - `updateExerciseProgress`/`updateNodeProgress` gain optional trailing `perNoteMastery = null` param; merges into `note_mastery` via pure per-pitch addition before the existing single `.upsert(progressData, { onConflict: 'student_id,node_id' })` call; validates shape (non-negative integers, `correct <= total`) and skips malformed pitch entries
- `src/services/skillProgressService.test.js` - Adds `mockSupabaseFrom()` test helper (wires both the read chain `.select().eq().eq().maybeSingle()` and write chain `.upsert().select().maybeSingle()`) plus 8 tests: merge-accumulation, new-pitch-insert + existing-pitch-preservation, omitted-param no-op, and malformed-entry rejection, for both `updateExerciseProgress` and `updateNodeProgress`

## Decisions Made

- No new RLS policy — `note_mastery` sits on an already row-protected row (`student_skill_progress_insert_own`/`_update_own`/`_select_consolidated`), matching the plan's explicit instruction and ADAPT-04's "mirror existing protections" intent. The `/gsd-secure-phase` pass for this phase confirms rather than adds policy.
- Duplicated the merge-and-validate block in both functions instead of extracting a shared helper, to keep the diff minimal against the plan's exact prescribed snippet and avoid introducing a new shared code path this early in the phase (both call sites read `nodeProgress`/`existingProgress` under slightly different local variable names, and the parent-plan interface intentionally shows the pattern applied twice).
- Did NOT mark ADAPT-03/ADAPT-04 complete in `.planning/REQUIREMENTS.md` — those requirement IDs are also declared by Plans 03-06 (weak-note targeting) and 03-07 (sight-reading wiring + migration apply). Marking them complete after only the persistence layer would misrepresent status; deferring to whichever of those plans lands last.

## Deviations from Plan

None - plan executed exactly as written. The migration DDL, service merge logic, and test additions all match the plan's `<action>` blocks and `<behavior>` bullets precisely.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The migration is authored but intentionally NOT applied to any Supabase project (local or remote) per this plan's scope; Plan 07 applies it as a manual, human-approved step.

## Next Phase Readiness

- The persistence layer (migration DDL + service merge) is ready for Plan 03-06 (weak-note targeting/consumption logic) and Plan 03-07 (sight-reading game wiring + migration apply under owner gate) to build on.
- `getNodeProgress`/`getExerciseProgress` already return the full row including `note_mastery` once the column exists in the DB (no additional read-path changes needed — `SELECT *` already covers it).
- No blockers. The migration must be applied to Supabase (Plan 07, human-approved) before any game code can persist real mastery data; until then, calls with `perNoteMastery` supplied would fail against the live schema (column doesn't exist yet) — this is expected and matches the plan's staged-apply design.

---

_Phase: 03-adaptive-pedagogy_
_Completed: 2026-07-12_

## Self-Check: PASSED

- FOUND: supabase/migrations/20260712120000_add_note_mastery.sql
- FOUND: src/services/skillProgressService.js
- FOUND: src/services/skillProgressService.test.js
- FOUND commit: 8e1b2a7c (Task 1)
- FOUND commit: cf6fce93 (Task 2)
