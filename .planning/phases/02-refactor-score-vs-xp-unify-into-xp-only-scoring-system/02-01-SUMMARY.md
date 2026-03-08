---
phase: 02-refactor-score-vs-xp-unify-into-xp-only-scoring-system
plan: 01
subsystem: api
tags: [xp, achievements, accessories, dead-code-removal, scoring]

# Dependency graph
requires: []
provides:
  - "calculateFreePlayXP function for non-trail XP rewards"
  - "XP-based achievement awarding via awardXP()"
  - "XP-based accessory unlock checks (totalXP instead of totalPoints)"
  - "Dead code removal: points.js, useTotalPoints.js, scoreComparisonService.js"
affects:
  - "02-02: VictoryScreen and hooks need to consume calculateFreePlayXP"
  - "02-03: UI components (Avatars, Achievements) need to display XP"
  - "02-04: Teacher analytics and DB migration"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Free play XP formula: 10 + floor(scorePercentage * 0.4) with comeback multiplier"
    - "XP-based accessory unlock: xp_earned case with points_earned backward compat"

key-files:
  created: []
  modified:
    - "src/utils/xpSystem.js"
    - "src/services/achievementService.js"
    - "src/utils/accessoryUnlocks.js"
    - "src/services/apiAccessories.js"

key-decisions:
  - "Free play XP formula: base 10 + floor(score% * 0.4), giving 10-50 XP range (less than trail nodes)"
  - "Achievement XP failure is non-critical: achievement recorded even if awardXP fails"
  - "points_earned kept as fallback case alias for backward compatibility with existing DB records"
  - "getUserPointBalance reads students.total_xp directly instead of aggregating from scores"

patterns-established:
  - "calculateFreePlayXP(scorePercentage, comebackMultiplier) for non-trail XP"
  - "xp_earned/points_earned dual case pattern for backward-compatible unlock checks"

requirements-completed: [XP-SERVICE, XP-ACHIEVE, XP-DEAD-CODE]

# Metrics
duration: 3min
completed: 2026-03-08
---

# Phase 2 Plan 01: Service Layer XP Unification Summary

**Replaced points with XP as sole reward currency: calculateFreePlayXP for non-trail games, awardXP for achievements, total_xp for accessories, and 3 dead code files deleted**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-08T00:53:42Z
- **Completed:** 2026-03-08T00:56:55Z
- **Tasks:** 2
- **Files modified:** 4 modified, 3 deleted

## Accomplishments
- Added calculateFreePlayXP to xpSystem.js with score-based formula (10-50 XP range)
- Refactored achievementService to use awardXP instead of updateUserPoints, deleted updateUserPoints method
- Switched accessory unlock system from totalPoints to totalXP with backward-compatible case handling
- Rewired getUserPointBalance to read students.total_xp instead of calculating from score aggregation
- Deleted 3 dead code files: points.js, useTotalPoints.js, scoreComparisonService.js

## Task Commits

Each task was committed atomically:

1. **Task 1: Add calculateFreePlayXP and refactor achievementService** - `2cb9ceb` (feat)
2. **Task 2: Switch accessory system to XP-based and delete dead code** - `6809620` (feat)

## Files Created/Modified
- `src/utils/xpSystem.js` - Added calculateFreePlayXP export and added to default export object
- `src/services/achievementService.js` - Replaced updateUserPoints with awardXP, updated HIGH_SCORER to total_xp, switched all condition/progress parsers
- `src/utils/accessoryUnlocks.js` - Renamed points_earned to xp_earned (with fallback), switched to totalXP
- `src/services/apiAccessories.js` - Removed points.js import, rewrote getUserPointBalance to query students.total_xp
- `src/utils/points.js` - DELETED
- `src/hooks/useTotalPoints.js` - DELETED
- `src/services/scoreComparisonService.js` - DELETED

## Decisions Made
- Free play XP formula: `10 + Math.floor(scorePercentage * 0.4)` giving 10 XP for 0% and 50 XP for 100%. This keeps free play rewarding but less than trail nodes (which give 50-150+ XP with bonuses).
- Achievement XP award wrapped in try/catch: if awardXP fails, the achievement record is still saved. This prevents XP failures from blocking achievement progression.
- Kept "points_earned" as a case fallback alongside "xp_earned" so existing DB accessory records with the old type still evaluate correctly.
- getUserPointBalance now queries `students.total_xp` directly (single DB call) rather than aggregating scores + achievement points (two DB calls + calculation).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cleaned up comment referencing updateUserPoints**
- **Found during:** Post-Task 2 verification
- **Issue:** Comment in achievementService.js still contained "updateUserPoints" text
- **Fix:** Simplified comment to "Award XP for achievement"
- **Files modified:** src/services/achievementService.js
- **Verification:** grep confirms no remaining updateUserPoints references
- **Committed in:** 6809620 (amended into Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial comment cleanup. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Service layer is fully XP-based, ready for Plan 02 (hooks + VictoryScreen)
- Deleting useTotalPoints.js and scoreComparisonService.js will cause import errors in consumers (Dashboard, useVictoryState) - this is intentional and will be resolved in Plan 02
- calculateFreePlayXP is ready for useVictoryState to consume for free play XP awards

---
*Phase: 02-refactor-score-vs-xp-unify-into-xp-only-scoring-system*
*Completed: 2026-03-08*
