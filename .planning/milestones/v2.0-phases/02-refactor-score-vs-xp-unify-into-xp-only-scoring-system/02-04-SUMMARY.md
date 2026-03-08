---
phase: 02-refactor-score-vs-xp-unify-into-xp-only-scoring-system
plan: 04
subsystem: ui
tags: [xp, teacher-analytics, charts, database-migration, dead-code-removal]

# Dependency graph
requires:
  - "02-02: VictoryScreen and hooks fully XP-based, TeacherDashboard inline stub"
  - "02-03: All user-facing UI shows XP, i18n updated"
provides:
  - "XP-based teacher chart components (leaderboard, performance chart, analytics dashboard)"
  - "DB migration to drop achievement_points, student_achievements.points, calculate_score_percentile"
affects:
  - "TeacherDashboard.jsx still has total_points references (deferred, see deferred-items.md)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "calculateLevel imported in teacher leaderboard for XP + level context display"
    - "Teacher XP display format: '1,250 XP (Lv. 6)' for meaningful teacher-facing data"

key-files:
  created:
    - "supabase/migrations/20260308000001_drop_points_columns.sql"
  modified:
    - "src/components/charts/TopPerformersLeaderboard.jsx"
    - "src/components/charts/ClassPerformanceChart.jsx"
    - "src/components/charts/AnalyticsDashboard.jsx"

key-decisions:
  - "Teacher leaderboard shows 'X XP (Lv. Y)' format for meaningful teacher-facing data rather than raw XP numbers"
  - "TeacherDashboard.jsx total_points cleanup deferred as out-of-scope (not in plan files list, ~2500-line file)"
  - "Migration uses IF EXISTS guards for safe re-run"

patterns-established:
  - "Teacher XP display: toLocaleString() + calculateLevel() for 'XP (Lv. N)' pattern"

requirements-completed: [XP-TEACHER, XP-DB-CLEANUP]

# Metrics
duration: 5min
completed: 2026-03-08
---

# Phase 2 Plan 04: Teacher Analytics XP Switch + DB Points Cleanup Summary

**Teacher chart components switched from points to XP with level context, and DB migration created to drop achievement_points, student_achievements.points, and calculate_score_percentile function**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T01:13:17Z
- **Completed:** 2026-03-08T01:18:10Z
- **Tasks:** 2
- **Files modified:** 3 modified, 1 created

## Accomplishments
- TopPerformersLeaderboard sorts and displays by total_xp with level context ("1,250 XP (Lv. 6)")
- ClassPerformanceChart uses xp dataKey for bar chart data instead of points
- AnalyticsDashboard metric dropdown shows "XP" instead of "Points"
- DB migration drops 2 unused columns (achievement_points, points) and 1 function (calculate_score_percentile)

## Task Commits

Each task was committed atomically:

1. **Task 1: Switch teacher charts from points to XP** - `a3987dc` (feat)
2. **Task 2: Create DB migration to drop unused points columns and functions** - `7877447` (feat)

## Files Created/Modified
- `src/components/charts/TopPerformersLeaderboard.jsx` - Switched metric from "points" to "xp", added calculateLevel import for level context display
- `src/components/charts/ClassPerformanceChart.jsx` - Changed data mapping from total_points to total_xp, updated chart config dataKey
- `src/components/charts/AnalyticsDashboard.jsx` - Changed dropdown option from "Points" to "XP"
- `supabase/migrations/20260308000001_drop_points_columns.sql` - Drops achievement_points, points columns and calculate_score_percentile function in transaction

## Decisions Made
- Teacher leaderboard formats XP as "1,250 XP (Lv. 6)" using calculateLevel() to provide meaningful context rather than just raw numbers. This addresses the plan's guidance that "Teacher views should show meaningful XP-based data."
- TeacherDashboard.jsx cleanup was deferred as out-of-scope. The plan explicitly scoped Task 1 to the 3 chart files, and TeacherDashboard is a ~2500-line file with ~20+ total_points references that would require significant work. Logged in deferred-items.md.
- Migration uses `IF EXISTS` guards on all DROP statements for idempotent re-run safety.

## Deviations from Plan

None - plan executed exactly as written for the 3 chart files and migration.

**Note:** The success criteria's "No points concept remains anywhere in the codebase" is not fully achieved due to TeacherDashboard.jsx having pre-existing total_points references that were out of plan scope. This is documented in deferred-items.md.

## Issues Encountered
None

## User Setup Required
None - the DB migration file is created but must be applied to the database manually or via `supabase db push`.

## Next Phase Readiness
- All 4 plans of Phase 02 are complete
- Chart components fully migrated to XP
- DB migration ready to apply
- Remaining cleanup: TeacherDashboard.jsx total_points references (deferred)

## Self-Check: PASSED

All 4 modified/created files verified on disk. Both task commits (a3987dc, 7877447) verified in git log. SUMMARY.md exists.

---
*Phase: 02-refactor-score-vs-xp-unify-into-xp-only-scoring-system*
*Completed: 2026-03-08*
