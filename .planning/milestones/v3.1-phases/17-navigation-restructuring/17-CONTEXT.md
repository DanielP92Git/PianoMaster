# Phase 17: Navigation Restructuring - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Trail becomes the primary navigation destination for students. The app's navigation structure (sidebar, mobile bottom tabs, default landing) is restructured so that the trail map is the "home" of the app, with dashboard demoted to a secondary stats hub accessible from the tabs.

Requirements covered: NAV-01, NAV-02, NAV-03, NAV-04, DASH-04

</domain>

<decisions>
## Implementation Decisions

### Mobile Bottom Tab Composition

- **D-01:** Trail replaces Dashboard as the first tab in the mobile bottom navigation
- **D-02:** Dashboard replaces Recordings in the third tab position
- **D-03:** Recordings is removed from the bottom tabs; it becomes accessible via the Dashboard page (link/card on Dashboard)
- **D-04:** Final mobile tab order: **Trail, Games, Dashboard, Achievements, Settings** (5 tabs)

### Desktop Sidebar

- **D-05:** Desktop sidebar follows the same ordering as mobile tabs: Trail, Games, Dashboard, Recordings, Achievements, Parent Zone, with Settings pinned at the bottom
- **D-06:** Recordings stays visible in the desktop sidebar (only removed from mobile tabs)

### Trail Page Chrome

- **D-07:** Trail page shows bottom tabs (mobile) and sidebar (desktop) — it becomes a normal page within the app shell instead of a full-viewport overlay
- **D-08:** Trail page does NOT show the top header bar — keeps the dark background and immersive feel (same pattern as Dashboard which also hides the header)

### Nav Item Ordering

- **D-09:** Trail appears first in both sidebar and mobile tabs (position 1, leftmost on mobile)
- **D-10:** Dashboard appears third in the tab bar (after Trail and Games)

### Default Landing Page

- **D-11:** The index route (`/`) renders TrailMapPage directly (no redirect) — trail IS the home page
- **D-12:** Dashboard moves to `/dashboard` route
- **D-13:** ALL students land on trail, including brand new students (no conditional routing based on onboarding state)
- **D-14:** Teachers still redirect to `/teacher` (existing TeacherRedirect pattern preserved)

### Trail Icon

- **D-15:** Trail uses the Lucide `Map` icon in both sidebar and bottom tabs

### URL Transition

- **D-16:** No redirect or migration needed from old `/` (Dashboard) to new `/` (Trail). Users hitting `/` see the trail, which is the intended behavior.

### Claude's Discretion

- Trail page layout adaptation: Claude decides the best approach for fitting trail content within the app shell (accounting for sidebar width on desktop and bottom tab height on mobile). Trail should fill available space with its dark `bg-[#1a1040]` background.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Navigation Components

- `src/components/layout/appNavigationConfig.js` -- Nav item definitions (student/teacher/common arrays)
- `src/components/layout/Sidebar.jsx` -- Desktop sidebar with NavLink active states
- `src/components/layout/MobileTabsNav.jsx` -- Mobile bottom tab bar (filters by tab IDs)
- `src/components/layout/AppLayout.jsx` -- App shell: sidebar/header/tabs visibility logic, `isTrailPage` and `isGameRoute` checks, background class, main content padding

### Routing

- `src/App.jsx` -- Route definitions, `TeacherRedirect` component (line ~235), index route, `/trail` route, `LANDSCAPE_ROUTES` array
- `src/components/layout/AppLayout.jsx` -- `gameRoutes` array (must stay in sync with `LANDSCAPE_ROUTES`)

### Trail Page

- `src/pages/TrailMapPage.jsx` -- Trail map page component (currently full-viewport overlay)
- `src/components/trail/TrailMap.jsx` -- Main trail map container

### Dashboard

- `src/components/layout/Dashboard.jsx` -- Student dashboard (849 lines, will need Recordings link added in Phase 18)

### Design System

- `docs/DESIGN_SYSTEM.md` -- Glassmorphism patterns, glass card pattern

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `appNavigationConfig.js`: Centralized nav config with `APP_NAV_ITEMS` and `getSidebarNavItems()` — add Trail item here and both sidebar + tabs pick it up
- `NavLink` from React Router: Already used in Sidebar with `isActive` callback for active/inactive styling — will work for Trail active state (NAV-04)
- `BottomNavigation` component (`src/components/ui/Navigation.jsx`): Used by MobileTabsNav, accepts items array — reusable for new tab composition
- Lucide `Map` icon: Available in lucide-react (already a dependency)

### Established Patterns

- **Nav config-driven rendering**: Both Sidebar and MobileTabsNav consume `appNavigationConfig.js` — adding/reordering items in config propagates to both
- **MobileTabsNav filtering**: Uses a `tabIds` array to select which nav items appear as mobile tabs — change the array to swap items
- **Header visibility**: AppLayout already conditionally hides header for Dashboard (`isDashboard`) and trail (`isTrailPage`) — extend this pattern
- **Background per route**: AppLayout switches background class based on `isTrailPage` — already handles trail's dark bg

### Integration Points

- `AppLayout.jsx` line 68-103: All the `isTrailPage` conditional checks that currently hide nav chrome — these need to be removed/modified
- `App.jsx` TeacherRedirect component: Currently renders `<Dashboard />` for students at index — needs to render `<TrailMapPage />` instead
- `App.jsx` route definitions: `/trail` route exists, needs to become the index; new `/dashboard` route needed
- `TrailMapPage.jsx`: Currently assumes full-viewport (`fixed inset-0`) — needs layout adjustment for nav chrome

</code_context>

<specifics>
## Specific Ideas

- Mobile bottom tabs currently have no hamburger/slide-out sidebar on mobile — Parent Zone is accessed via Settings page, not a separate sidebar
- Recordings becomes accessible from Dashboard page when Dashboard is redesigned as a stats hub (Phase 18 will implement this)

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

_Phase: 17-navigation-restructuring_
_Context gathered: 2026-04-05_
