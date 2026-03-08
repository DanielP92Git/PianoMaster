---
phase: 02-refactor-score-vs-xp-unify-into-xp-only-scoring-system
plan: 05
subsystem: ui, api
tags: [xp, teacher-dashboard, supabase, react]

requires:
  - phase: 02-04
    provides: "Teacher chart components already migrated to XP; DB migration for points column removal"
provides:
  - "TeacherDashboard fully migrated from points to XP terminology"
  - "apiTeacher.js returns total_xp and current_level on student objects"
  - "Chart components now receive correct total_xp data (fixes 0-value bug)"
affects: []

tech-stack:
  added: []
  patterns:
    - "Read total_xp directly from students table instead of computing points via RPC/fallback"

key-files:
  created: []
  modified:
    - src/services/apiTeacher.js
    - src/components/layout/TeacherDashboard.jsx

key-decisions:
  - "Simplified apiTeacher.js by removing entire points RPC + fallback computation, reading canonical total_xp directly from students table"
  - "Replaced achievement/gameplay points breakdown in teacher detail modal with XP level info (cleaner, more meaningful for teachers)"

patterns-established:
  - "Teacher student objects use total_xp/current_level fields (not total_points)"

requirements-completed: [XP-TEACHER]

duration: 5min
completed: 2026-03-08
---

# Phase 2 Plan 5: TeacherDashboard XP Gap Closure Summary

**Replaced all points references in TeacherDashboard.jsx and apiTeacher.js with XP, fixing chart data bug and completing the XP unification across all user-facing views**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T10:59:20Z
- **Completed:** 2026-03-08T11:04:23Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- apiTeacher.js now reads total_xp and current_level directly from students table, eliminating 77 lines of points RPC + fallback computation
- TeacherDashboard.jsx shows "XP" everywhere: student detail modal, student list cards, filter dropdowns, sort options
- Fixes latent bug where chart components (TopPerformersLeaderboard, ClassPerformanceChart, AnalyticsDashboard) received undefined for total_xp because data source provided total_points
- Removed dead code: calculateGameplayPoints stub and getAchievementPointsTotal import

## Task Commits

Each task was committed atomically:

1. **Task 1: Switch apiTeacher.js from points computation to total_xp** - `d041c10` (feat)
2. **Task 2: Replace all points references in TeacherDashboard.jsx with XP** - `7aaa7e3` (feat)

## Files Created/Modified
- `src/services/apiTeacher.js` - Reads total_xp, current_level from students table; removed points RPC/fallback block (-77 lines)
- `src/components/layout/TeacherDashboard.jsx` - All points UI replaced with XP; dead code removed (-35 lines net)

## Decisions Made
- Simplified data fetching by reading total_xp directly from students table rather than computing it via RPC or score aggregation
- Replaced the "achievements / games" points breakdown sub-text with "Level N" which is more meaningful for teachers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed total_points reference in getStudentProgress function**
- **Found during:** Task 1 (apiTeacher.js migration)
- **Issue:** getStudentProgress function (line 397) also had `total_points: 0` in a student object literal
- **Fix:** Changed to `total_xp: 0` for consistency
- **Files modified:** src/services/apiTeacher.js
- **Verification:** grep confirms zero total_points references remain
- **Committed in:** d041c10 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor additional fix in same file, necessary for complete points removal. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 (XP unification) is now fully complete with all 15/15 verification truths satisfied
- No points terminology remains in any user-facing view (student or teacher)
- DB migration (from Plan 02-04) can be applied when ready to drop unused points columns

---
*Phase: 02-refactor-score-vs-xp-unify-into-xp-only-scoring-system*
*Completed: 2026-03-08*
