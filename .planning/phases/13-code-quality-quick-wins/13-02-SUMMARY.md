---
phase: 13-code-quality-quick-wins
plan: "02"
subsystem: ui
tags: [react, lazy-loading, i18n, dead-code, bundle-optimization]

# Dependency graph
requires: []
provides:
  - TeacherDashboard as lazy-loaded separate chunk (students never download teacher bundle)
  - AchievementsLegacy.jsx deleted (dead code removed)
  - Three non-migration debug/test files deleted from supabase/migrations/
  - XP terminology consistent across en and he locale files
affects: [bundle-size, i18n, teacher-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "lazyWithRetry used for role-gated components (TeacherDashboard) — students never receive teacher bundle"

key-files:
  created: []
  modified:
    - src/App.jsx
    - src/pages/Achievements.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "TeacherDashboard lazy-loaded with lazyWithRetry — no separate Suspense boundary added since existing boundary at route level covers it"
  - "No prefetch added for TeacherDashboard (unlike TrailMapPage) — teacher route is role-gated and not worth prefetching for student users"
  - "Locale keys not renamed (points* -> xp*) — deferred per CONTEXT.md. Only string values updated this plan"

patterns-established:
  - "Role-gated components should be lazy-loaded to prevent bundle pollution across roles"

requirements-completed: [QUAL-04, QUAL-05, QUAL-07, XP-01]

# Metrics
duration: 15min
completed: 2026-03-31
---

# Phase 13 Plan 02: Dead Code Removal, TeacherDashboard Lazy Load, and XP Locale Migration Summary

**TeacherDashboard split into 433 kB separate chunk via lazyWithRetry; 4 dead files deleted; 12 locale strings migrated from "points" to "XP" across English and Hebrew**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-31T01:40:00Z
- **Completed:** 2026-03-31T01:55:00Z
- **Tasks:** 2
- **Files modified:** 4 modified, 5 deleted

## Accomplishments

- Deleted AchievementsLegacy.jsx (424-line dead component with no live imports) and removed stale rollback comment from Achievements.jsx
- Deleted 3 non-migration files from supabase/migrations/ (DEBUG_check_teacher_status.sql, README_USER_PREFERENCES.md, TEST_direct_insert.sql)
- Replaced eager `import TeacherDashboard` with `lazyWithRetry(() => import(...))` — TeacherDashboard is now a 433 kB separate chunk that students never receive
- Migrated 6 English locale string values and 6 Hebrew locale string values from "points"/"נקודות" terminology to "XP" in achievements and accessory unlock namespaces

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete dead code and lazy-load TeacherDashboard** - `5e02daa` (feat)
2. **Task 2: Migrate points locale strings to XP terminology** - `d0890e1` (feat)

## Files Created/Modified

- `src/App.jsx` - Replaced eager import with lazyWithRetry lazy import for TeacherDashboard
- `src/pages/Achievements.jsx` - Removed stale rollback comment (line 2)
- `src/pages/AchievementsLegacy.jsx` - DELETED (dead code, 424 lines)
- `supabase/migrations/DEBUG_check_teacher_status.sql` - DELETED
- `supabase/migrations/README_USER_PREFERENCES.md` - DELETED
- `supabase/migrations/TEST_direct_insert.sql` - DELETED
- `src/locales/en/common.json` - 6 string values updated: "Total Points"→"Total XP", "badge points"→"badge XP", "pts total"→"XP total", 3 accessory unlock strings migrated
- `src/locales/he/common.json` - 6 string values updated: "סך כל הנקודות"→"סך כל ה-XP", 5 accessory/achievement strings migrated from "נקודות" to "XP"

## Decisions Made

- TeacherDashboard lazy-loaded with lazyWithRetry — no separate Suspense boundary added since the existing boundary at the route level already covers `/teacher/*`
- No prefetch added for TeacherDashboard (unlike TrailMapPage) — teacher route is role-gated; prefetching for student users wastes bandwidth
- Locale keys not renamed (e.g., `points` → `xp`, `pointsEarnedDescription` → `xpEarnedDescription`) — deferred per CONTEXT.md. Only string values updated this plan to avoid call-site i18n key refactoring

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Test suite shows 4 pre-existing failures due to `Missing VITE_SUPABASE_URL environment variable` in the test environment. These failures are unrelated to plan changes and were present before execution.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 13 plan 02 complete. Both plans in phase 13 are now done.
- All dead code removed, bundle optimized for role-based splitting, and XP terminology is now consistent across both locales.

## Self-Check: PASSED

- SUMMARY.md: FOUND
- AchievementsLegacy.jsx: FOUND (confirmed deleted)
- commit 5e02daa: FOUND
- commit d0890e1: FOUND
- All 7 verification checks passed

---
*Phase: 13-code-quality-quick-wins*
*Completed: 2026-03-31*
