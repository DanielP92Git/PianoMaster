---
phase: 17-navigation-restructuring
plan: 01
subsystem: ui
tags: [react-router, navigation, nav-config, navlink, end-prop, trail, layout]

# Dependency graph
requires: []
provides:
  - Trail as first student nav item (sidebar + mobile tabs) with Map icon
  - Index route (/) renders TrailMapPage for students, teachers redirect to /teacher
  - Dashboard accessible at /dashboard route
  - NavLink end prop support prevents false active highlighting on trail
  - AppLayout shows sidebar and bottom tabs on trail page
affects: [17-02, TrailMapPage layout, Dashboard route references]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "NavLink end prop passthrough from nav config through MobileTabsNav to BottomNavigation"
    - "Exported TeacherRedirect for unit testing"

key-files:
  created:
    - src/__tests__/App.test.jsx
  modified:
    - src/components/layout/appNavigationConfig.js
    - src/components/layout/appNavigationConfig.test.js
    - src/components/layout/MobileTabsNav.jsx
    - src/components/layout/Sidebar.jsx
    - src/components/ui/Navigation.jsx
    - src/App.jsx
    - src/components/layout/AppLayout.jsx

key-decisions:
  - "Exported TeacherRedirect from App.jsx as named export to enable isolated unit testing with mocked useUser"
  - "Used findByTestId (async) in App.test.jsx to handle lazy-loaded TrailMapPage via Suspense boundary"

patterns-established:
  - "Nav item end prop: items with to='/' include end:true to prevent prefix matching on all routes"
  - "MobileTabsNav passes end prop through item mapping to BottomNavigation NavLink"

requirements-completed: [NAV-01, NAV-02, NAV-03, NAV-04, DASH-04]

# Metrics
duration: 11min
completed: 2026-04-05
---

# Phase 17 Plan 01: Navigation Restructuring Summary

**Trail wired as primary nav destination: first in sidebar/tabs, index route renders TrailMapPage, dashboard moved to /dashboard, NavLink end prop prevents false active states**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-04T22:43:43Z
- **Completed:** 2026-04-04T22:54:39Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Trail nav item added as first student entry in appNavigationConfig with Map icon, end:true, and / route
- Index route renders TrailMapPage for students (TeacherRedirect updated), teachers still redirect to /teacher
- Dashboard accessible at /dashboard, /trail kept for backward compatibility
- NavLink end prop threaded through MobileTabsNav, Sidebar, and BottomNavigation to prevent false active highlights
- AppLayout updated: sidebar and bottom tabs visible on trail page, header hidden, correct padding and background
- 20 automated tests (18 nav config + 2 routing) all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Update nav config, tab IDs, NavLink end prop support** - `b2a81bf` (feat)
2. **Task 2: Update routing, AppLayout, theme-color, App.test.jsx** - `7f4b041` (feat)

## Files Created/Modified
- `src/components/layout/appNavigationConfig.js` - Trail as first student nav item with end:true, dashboard to /dashboard
- `src/components/layout/appNavigationConfig.test.js` - 18 tests covering nav structure, ordering, end prop, and tab passthrough
- `src/components/layout/MobileTabsNav.jsx` - Updated tabIds (trail replaces recordings), end prop passthrough
- `src/components/layout/Sidebar.jsx` - end={!!item.end} on both main and bottom NavLinks
- `src/components/ui/Navigation.jsx` - end={item.end} on BottomNavigation NavLink
- `src/App.jsx` - TeacherRedirect renders TrailMapPage, /dashboard route added, theme-color for / and /trail
- `src/components/layout/AppLayout.jsx` - isDashboard=/dashboard, isTrailPage=/ or /trail, sidebar+tabs visible on trail
- `src/__tests__/App.test.jsx` - NAV-03 routing tests (student sees trail, teacher redirects)

## Decisions Made
- Exported TeacherRedirect as named export from App.jsx to enable isolated testing without rendering the full app
- Used async findByTestId in App.test.jsx to handle lazy-loaded TrailMapPage through Suspense boundary
- Mocked supabase in App.test.jsx to prevent env var errors during test collection

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Exported TeacherRedirect for testing**
- **Found during:** Task 2 (App.test.jsx creation)
- **Issue:** TeacherRedirect was a private function inside App.jsx, not importable for testing
- **Fix:** Changed `function TeacherRedirect()` to `export function TeacherRedirect()` - minimal change, no behavioral impact
- **Files modified:** src/App.jsx
- **Verification:** App.test.jsx imports and tests TeacherRedirect successfully
- **Committed in:** 7f4b041 (Task 2 commit)

**2. [Rule 3 - Blocking] Added supabase mock and Suspense wrapper in App.test.jsx**
- **Found during:** Task 2 (App.test.jsx creation)
- **Issue:** Importing App.jsx triggers supabase initialization which requires env vars not available in test. TrailMapPage is lazy-loaded so needs Suspense boundary.
- **Fix:** Added vi.mock for supabase service, wrapped render in Suspense, used findByTestId for async assertion
- **Files modified:** src/__tests__/App.test.jsx
- **Verification:** Both tests pass reliably
- **Committed in:** 7f4b041 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary to make App.test.jsx work. No scope creep.

## Issues Encountered
- Pre-existing test failures in ArcadeRhythmGame.test.js (getOrCreateAudioContext not a function) and pre-existing lint error in ParentZoneEntryCard.test.jsx - both unrelated to this plan's changes

## Known Stubs
None - all functionality is fully wired.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 can proceed: TrailMapPage layout adaptation (fixed inset-0 to normal flow), URL reference updates (navigate('/') to navigate('/dashboard')), and BackButton removal
- All nav config, routing, and layout logic is in place for plan 02 to build upon

## Self-Check: PASSED

- All 9 files verified present
- Commit b2a81bf (Task 1) verified in git log
- Commit 7f4b041 (Task 2) verified in git log
- 20 tests pass (18 nav config + 2 routing)
- Production build succeeds

---
*Phase: 17-navigation-restructuring*
*Completed: 2026-04-05*
