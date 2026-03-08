# Deferred Items - Phase 02

## Out-of-Scope Discoveries

### 1. TeacherDashboard.jsx still has extensive `total_points` references
- **Discovered during:** Plan 02-04, Task 1
- **File:** `src/components/layout/TeacherDashboard.jsx`
- **Details:** The TeacherDashboard (~2500 lines) has ~20+ references to `total_points`, `calculateGameplayPoints` (inlined stub from Plan 02-02), `achievementPoints`, `pointsRange` filter, and "Points" labels in sorting/filtering UI. The plan only scoped the 3 chart components (TopPerformersLeaderboard, ClassPerformanceChart, AnalyticsDashboard).
- **Impact:** Teacher student detail view and student list still show "Points" instead of "XP". This is a teacher-only view so lower priority.
- **Recommended fix:** Full TeacherDashboard XP migration (replace total_points with total_xp, remove calculateGameplayPoints stub, rename points filters to XP). Estimate: ~30 minutes due to file size and many interrelated references.
