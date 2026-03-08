---
phase: 02-refactor-score-vs-xp-unify-into-xp-only-scoring-system
plan: 02
subsystem: ui
tags: [xp, victory-screen, hooks, react-query, dead-code-removal]

# Dependency graph
requires:
  - "02-01: calculateFreePlayXP function, awardXP for achievements, deleted points.js/useTotalPoints.js/scoreComparisonService.js"
provides:
  - "Free play XP awarding via calculateFreePlayXP in useVictoryState"
  - "Unified XP display on VictoryScreen for both trail and free play modes"
  - "Zero total-points/pre-total-points React Query keys in codebase"
  - "student-xp query invalidation replacing total-points across all hooks"
affects:
  - "02-03: UI components now show XP consistently, i18n keys need updating"
  - "02-04: Teacher analytics still use total_points (TeacherDashboard inline stub)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Free play XP awarding: calculateFreePlayXP(scorePercentage, comebackMultiplier) in processTrailCompletion else-branch"
    - "student-xp query key replaces total-points for all XP invalidation"
    - "totalXP replaces totalPoints in accessory unlock progress tracking"

key-files:
  created: []
  modified:
    - "src/hooks/useVictoryState.js"
    - "src/components/games/VictoryScreen.jsx"
    - "src/components/layout/Dashboard.jsx"
    - "src/features/games/hooks/useGameProgress.js"
    - "src/features/userData/useScores.js"
    - "src/hooks/useStreakWithAchievements.js"
    - "src/hooks/usePracticeSessionWithAchievements.js"
    - "src/components/games/sight-reading-game/SightReadingGame.jsx"
    - "src/components/layout/TeacherDashboard.jsx"

key-decisions:
  - "Free play XP badge uses same blue gradient style as trail XP badge for visual consistency"
  - "isProcessingTrail initialized to true for both trail and free play (shows loading state during XP award)"
  - "Removed percentileMessage feature entirely (depended on deleted scoreComparisonService)"
  - "Removed scoresData query from Dashboard (only consumer was deleted pointsTrend)"
  - "Inlined calculateGameplayPoints in TeacherDashboard to fix build (full teacher cleanup deferred to Plan 04)"

patterns-established:
  - "student-xp query key for all XP-related cache invalidation"
  - "refreshQueries (renamed from refreshPointQueries) invalidates student-scores and earned-achievements only"

requirements-completed: [XP-FREEPLAY, XP-VICTORY, XP-DASHBOARD, XP-HOOKS]

# Metrics
duration: 8min
completed: 2026-03-08
---

# Phase 2 Plan 02: Core Hooks + VictoryScreen XP Integration Summary

**Free play games now award XP via calculateFreePlayXP and display "+X XP" badge on VictoryScreen; all total-points/pre-total-points React Query references removed from 9 files**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-08T00:59:36Z
- **Completed:** 2026-03-08T01:08:08Z
- **Tasks:** 2
- **Files modified:** 9 modified

## Accomplishments
- Refactored useVictoryState to award XP for free play games using calculateFreePlayXP (10-50 XP range with comeback multiplier)
- Replaced free play points badge with XP badge on VictoryScreen (matching trail XP visual style)
- Removed all total-points and pre-total-points React Query references across 9 files
- Replaced total-points invalidations with student-xp in useStreakWithAchievements, usePracticeSessionWithAchievements
- Removed ~105 lines of dead points logic from useVictoryState (useTotalPoints, achievementBonus, pointsAnimation, percentile)
- Fixed build-breaking import of deleted points.js in TeacherDashboard

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor useVictoryState to award XP for free play** - `b3b4a9b` (feat)
2. **Task 2: Update VictoryScreen display and clean up points query references** - `12980f3` (feat)

## Files Created/Modified
- `src/hooks/useVictoryState.js` - Removed useTotalPoints/scoreComparisonService imports, added calculateFreePlayXP, free play XP awarding, totalXP in progress tracking
- `src/components/games/VictoryScreen.jsx` - Replaced points badge with XP badge for free play, removed actualGain
- `src/components/layout/Dashboard.jsx` - Removed useTotalPoints import, totalPointsData, calculateRecentTrend, pointsTrend, dead scoresData query
- `src/features/games/hooks/useGameProgress.js` - Removed total-points cache read and pre-total-points set
- `src/features/userData/useScores.js` - Removed total-points/pre-total-points cache operations and invalidation
- `src/hooks/useStreakWithAchievements.js` - Replaced total-points invalidation with student-xp
- `src/hooks/usePracticeSessionWithAchievements.js` - Replaced total-points invalidation with student-xp
- `src/components/games/sight-reading-game/SightReadingGame.jsx` - Removed total-points invalidation
- `src/components/layout/TeacherDashboard.jsx` - Inlined calculateGameplayPoints to fix deleted points.js import

## Decisions Made
- Free play XP badge uses the same indigo/blue gradient style as the trail XP badge, providing visual consistency across both modes.
- Changed `isProcessingTrail` initial state from `!!nodeId` to `true` so free play also shows loading state during XP award.
- Removed the percentileMessage feature entirely since it depended on the deleted scoreComparisonService. This was a non-essential "top X%" message on the victory screen.
- Removed the scoresData query from Dashboard because its only consumer (pointsTrend calculation) was deleted. The student-scores query is still available elsewhere.
- Inlined a minimal calculateGameplayPoints function in TeacherDashboard.jsx as a temporary fix. The full teacher analytics XP migration is planned for Plan 02-04.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed build error: TeacherDashboard imports deleted points.js**
- **Found during:** Task 2 (build verification)
- **Issue:** TeacherDashboard.jsx imported calculateGameplayPoints from deleted src/utils/points.js, causing build failure
- **Fix:** Inlined a minimal calculateGameplayPoints function (sums scores from array) with TODO comment for Plan 02-04
- **Files modified:** src/components/layout/TeacherDashboard.jsx
- **Verification:** `npm run build` succeeds
- **Committed in:** 12980f3 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added student-xp invalidation to replace total-points**
- **Found during:** Task 2 (useStreakWithAchievements, usePracticeSessionWithAchievements)
- **Issue:** After removing total-points invalidation, achievement and practice session completion would not refresh XP display
- **Fix:** Replaced total-points invalidation with student-xp invalidation in both hooks
- **Files modified:** src/hooks/useStreakWithAchievements.js, src/hooks/usePracticeSessionWithAchievements.js
- **Verification:** Both files now invalidate student-xp query on success
- **Committed in:** 12980f3 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both fixes necessary for build success and correct XP cache behavior. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- VictoryScreen and all hooks are fully XP-based, ready for Plan 02-03 (UI + i18n)
- TeacherDashboard has inline stub for calculateGameplayPoints, needs full XP migration in Plan 02-04
- Build passes cleanly

## Self-Check: PASSED

All 9 modified files verified on disk. Both task commits (b3b4a9b, 12980f3) verified in git log. SUMMARY.md exists.

---
*Phase: 02-refactor-score-vs-xp-unify-into-xp-only-scoring-system*
*Completed: 2026-03-08*
