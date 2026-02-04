---
phase: 11-integration-cutover
plan: 01
subsystem: database, data
tags: [supabase, migrations, trail-system, node-definitions]

# Dependency graph
requires:
  - phase: 08-trail-validation-infrastructure
    provides: validateTrail.mjs prebuild validation
  - phase: 09-bass-clef-implementation
    provides: Bass Units 1-3 in expandedNodes.js
  - phase: 10-rhythm-implementation
    provides: Rhythm Units 1-6 in expandedNodes.js
provides:
  - SKILL_NODES exports only expandedNodes (93 redesigned nodes)
  - Progress reset migration for v1.3 deployment
  - LEGACY_NODES deprecated but retained for Phase 12 cleanup
affects: [12-cleanup-legacy, deployment, trail-system]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single-commit cutover for atomic code+migration deployment"
    - "XP preservation during progress reset"

key-files:
  created:
    - supabase/migrations/20260204000001_reset_trail_progress_v13.sql
  modified:
    - src/data/skillTrail.js

key-decisions:
  - "93 nodes in final system (not 87 as originally estimated)"
  - "LEGACY_NODES kept in file with @deprecated for Phase 12 cleanup"

patterns-established:
  - "Progress reset preserves XP totals but clears trail-specific progress"
  - "Database migration uses transaction block for atomicity"

# Metrics
duration: 8min
completed: 2026-02-04
---

# Phase 11 Plan 01: Atomic Cutover Summary

**SKILL_NODES cutover to 93-node redesigned system with progress reset migration preserving XP totals**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-04T17:49:15Z
- **Completed:** 2026-02-04T17:57:XX
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created progress reset migration that deletes trail progress while preserving XP totals
- Updated skillTrail.js to export only expandedNodes (93 nodes vs legacy 18)
- Added @deprecated JSDoc to LEGACY_NODES array for Phase 12 cleanup
- Validated trail system passes with 93 nodes (treble: 23, bass: 22, rhythm: 36, boss: 12)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create progress reset migration** - `4649abd` (feat)
2. **Task 2: Update skillTrail.js for cutover** - `7b2f643` (feat)

## Files Created/Modified
- `supabase/migrations/20260204000001_reset_trail_progress_v13.sql` - Progress reset migration with transaction block, deletes student_skill_progress, student_daily_goals, student_unit_progress while preserving students.total_xp
- `src/data/skillTrail.js` - SKILL_NODES now exports only expandedNodes, LEGACY_NODES marked @deprecated

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 11-01-01 | 93 nodes in final system | Actual count from expandedNodes.js (was estimated as 87 in planning) |
| 11-01-02 | Keep LEGACY_NODES with @deprecated | Phase 12 will handle deletion, keeps atomic change small |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **XP variance warning:** validateTrail.mjs reports 50.2% XP variance between paths (Rhythm: 2270 vs Bass: 1130). This is expected due to rhythm path being longer (36 nodes vs 22). Not a blocker - documented for potential Phase 12 rebalancing if needed after user testing.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Migration file ready for Supabase deployment
- Code changes ready for production deployment
- Both files can be deployed as single atomic unit
- Rollback procedure documented in 11-RESEARCH.md if critical issues surface
- Phase 12 cleanup can proceed to delete LEGACY_NODES and nodeGenerator.js

---
*Phase: 11-integration-cutover*
*Completed: 2026-02-04*
