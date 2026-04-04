---
phase: 17-navigation-restructuring
verified: 2026-04-05T02:35:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Visual check: Trail page shows sidebar on desktop, bottom tabs on mobile, no layout gaps"
    expected: "Dark forest background fills content area, sidebar visible on wide viewport, bottom tabs visible on mobile, no white strips or gaps"
    why_human: "Layout gaps, background bleed, and responsive breakpoints can only be verified visually"
  - test: "Visual check: Active nav state highlights trail on /, dashboard on /dashboard, correct item on other pages"
    expected: "Trail item highlighted when on /, Dashboard highlighted when on /dashboard, neither highlighted on /settings"
    why_human: "CSS active states depend on rendering context and cannot be verified by code inspection alone"
  - test: "Visual check: Jump-to-Top FAB does not overlap mobile bottom tabs"
    expected: "FAB sits above the tab bar on mobile (bottom-24), at bottom-6 on desktop"
    why_human: "Overlap depends on device safe-area insets and actual rendered layout"
  - test: "Visual check: Trail page scrolls via browser window with no double scrollbars"
    expected: "Page content scrolls normally, no internal scroll container visible, FAB scrolls page to top"
    why_human: "Scroll behavior depends on actual DOM rendering and overflow stacking"
---

# Phase 17: Navigation Restructuring Verification Report

**Phase Goal:** Students navigate to and from the trail as the app's primary destination
**Verified:** 2026-04-05T02:35:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                         | Status   | Evidence                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Trail map appears as a top-level item in the desktop sidebar and is clickable                                 | VERIFIED | `appNavigationConfig.js` line 24-31: `id: "trail"` is first student item with `to: "/"`, `icon: Map`. `Sidebar.jsx` line 140-168: renders all `mainNavItems` including trail via `getSidebarNavItems`.                                                                           |
| 2   | Trail map appears as a tab in the mobile bottom navigation bar                                                | VERIFIED | `MobileTabsNav.jsx` line 20: `tabIds = ["trail", "practiceGames", "studentDashboard", "achievements", "settings"]`. `end: item.end` passed through at line 42. `Navigation.jsx` BottomNavigation line 285: `end={item.end}` on NavLink.                                          |
| 3   | A returning student who logs in lands on the trail map (not the dashboard)                                    | VERIFIED | `App.jsx` line 230-238: `TeacherRedirect` returns `<TrailMapPage />` for non-teachers, `<Navigate to="/teacher">` for teachers. Index route at line 392: `<Route index element={<TeacherRedirect />} />`. 2 automated tests in `App.test.jsx` confirm behavior.                  |
| 4   | The active/highlighted state in both sidebar and bottom tabs correctly reflects whichever page the user is on | VERIFIED | Trail nav item has `end: true` (appNavigationConfig.js line 30). Sidebar NavLink uses `end={!!item.end}` (line 148). BottomNavigation NavLink uses `end={item.end}` (Navigation.jsx line 285). The `end` prop prevents React Router from prefix-matching `/` against all routes. |
| 5   | Dashboard remains accessible from both sidebar and bottom tabs as a secondary item                            | VERIFIED | `appNavigationConfig.js` line 40-45: `studentDashboard` with `to: "/dashboard"`. `MobileTabsNav.jsx` line 20: `tabIds` includes `"studentDashboard"`. `App.jsx` line 393: `<Route path="/dashboard" element={<Dashboard />} />`.                                                 |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                                            | Expected                                                                 | Status   | Details                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/layout/appNavigationConfig.js`      | Trail nav item with id=trail, to=/, end=true, Map icon                   | VERIFIED | Lines 24-31: all fields present and correct. `end: true` confirmed.                                                                                                                                                                                                                         |
| `src/components/layout/MobileTabsNav.jsx`           | Updated tabIds with trail replacing recordings                           | VERIFIED | Line 20: `["trail", "practiceGames", "studentDashboard", "achievements", "settings"]`. Line 42: `end: item.end` passthrough.                                                                                                                                                                |
| `src/components/layout/Sidebar.jsx`                 | NavLink end prop support for index route                                 | VERIFIED | Line 148: `end={!!item.end}` on mainNavItems NavLink. Line 178: `end={!!item.end}` on bottomNavItems NavLink.                                                                                                                                                                               |
| `src/components/ui/Navigation.jsx`                  | BottomNavigation NavLink end prop support                                | VERIFIED | Line 285: `end={item.end}` on NavLink.                                                                                                                                                                                                                                                      |
| `src/components/layout/AppLayout.jsx`               | isDashboard=/dashboard, isTrailPage=/, sidebar+tabs visible for trail    | VERIFIED | Line 15: `isDashboard = location.pathname === "/dashboard"`. Line 33: `isTrailPage = location.pathname === "/" \|\| location.pathname === "/trail"`. Line 76: sidebar shown when `!isGameRoute` (no `!isTrailPage`). Line 103: MobileTabsNav shown when `!isGameRoute` (no `!isTrailPage`). |
| `src/App.jsx`                                       | TeacherRedirect renders TrailMapPage, /dashboard route, theme-color at / | VERIFIED | Line 237: `return <TrailMapPage />`. Line 393: `<Route path="/dashboard" element={<Dashboard />} />`. Line 516: `location.pathname === "/" \|\| location.pathname === "/trail"` for theme-color.                                                                                            |
| `src/__tests__/App.test.jsx`                        | Automated test for NAV-03                                                | VERIFIED | 2 tests: student sees TrailMapPage at /, teacher redirected to /teacher. All pass.                                                                                                                                                                                                          |
| `src/components/layout/appNavigationConfig.test.js` | Nav config tests updated                                                 | VERIFIED | 18 tests covering trail-first ordering, end prop, MobileTabsNav passthrough, teacher exclusion. All pass.                                                                                                                                                                                   |
| `src/pages/TrailMapPage.jsx`                        | Normal AppLayout child, not fixed overlay                                | VERIFIED | Line 32: `min-h-full` (no `fixed inset-0`). No `scrollRef`, no `BackButton`, no `TRAIL_BG`, no `html.style.backgroundColor`. FAB uses `bottom-24 xl:bottom-6` (line 178).                                                                                                                   |
| `src/hooks/useVictoryState.js`                      | handleGoToDashboard navigates to /dashboard                              | VERIFIED | Line 173: `navigate("/dashboard")`                                                                                                                                                                                                                                                          |
| `src/pages/StudentAssignments.jsx`                  | BackButton points to /dashboard                                          | VERIFIED | Line 170: `to="/dashboard"`                                                                                                                                                                                                                                                                 |
| `src/pages/SubscribePage.jsx`                       | Navigate to /dashboard after subscribe cancel                            | VERIFIED | Line 178: `navigate("/dashboard")`                                                                                                                                                                                                                                                          |
| `src/pages/SubscribeSuccessPage.jsx`                | Navigate to /dashboard for pending, /trail for Start Learning            | VERIFIED | Line 107: `navigate("/dashboard")`. Line 84: `navigate("/trail")` preserved.                                                                                                                                                                                                                |

### Key Link Verification

| From                       | To                  | Via                                               | Status | Details                                                                                              |
| -------------------------- | ------------------- | ------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| `appNavigationConfig.js`   | `Sidebar.jsx`       | `getSidebarNavItems` consumed by Sidebar          | WIRED  | Sidebar imports `getSidebarNavItems` (line 7) and calls it (line 20)                                 |
| `appNavigationConfig.js`   | `MobileTabsNav.jsx` | `getSidebarNavItems` + tabIds filter              | WIRED  | MobileTabsNav imports `getSidebarNavItems` (line 6), filters by `tabIds` including "trail" (line 20) |
| `App.jsx`                  | `TrailMapPage.jsx`  | TeacherRedirect renders TrailMapPage for students | WIRED  | Line 237: `return <TrailMapPage />` inside TeacherRedirect                                           |
| `AppLayout.jsx`            | `MobileTabsNav.jsx` | MobileTabsNav rendered when not game route        | WIRED  | Line 103: `{!isGameRoute && <MobileTabsNav />}`                                                      |
| `TrailMapPage.jsx`         | `AppLayout.jsx`     | TrailMapPage is a child of AppLayout main         | WIRED  | Uses `min-h-full` (line 32), rendered via `<Outlet />` in AppLayout (line 101)                       |
| `useVictoryState.js`       | `/dashboard` route  | handleGoToDashboard navigates to /dashboard       | WIRED  | Line 173: `navigate("/dashboard")`                                                                   |
| `SubscribeSuccessPage.jsx` | `/trail` route      | Start Learning button navigates to /trail         | WIRED  | Line 84: `navigate("/trail")` preserved                                                              |

### Data-Flow Trace (Level 4)

Not applicable for this phase. The phase is about navigation routing and layout, not dynamic data rendering. The nav config is static data consumed directly by components.

### Behavioral Spot-Checks

| Behavior                   | Command                                                            | Result                                   | Status |
| -------------------------- | ------------------------------------------------------------------ | ---------------------------------------- | ------ |
| Nav config tests pass      | `npx vitest run src/components/layout/appNavigationConfig.test.js` | 18 tests passed                          | PASS   |
| NAV-03 routing tests pass  | `npx vitest run src/__tests__/App.test.jsx`                        | 2 tests passed                           | PASS   |
| Production build succeeds  | `npm run build`                                                    | Built in 32.70s, no errors               | PASS   |
| Trail i18n key exists (EN) | Check `src/locales/en/common.json` for `navigation.links.trail`    | "Trail" at line 152                      | PASS   |
| Trail i18n key exists (HE) | Check `src/locales/he/common.json` for `navigation.links.trail`    | Hebrew translation at line 152           | PASS   |
| Auth flows preserved       | `navigate("/")` in useSignup.js and useSocialAuth.js               | Both still point to `/` (trail, correct) | PASS   |
| Header logo link preserved | `to={"/"}` in Header.jsx                                           | Still points to `/` (trail, correct)     | PASS   |

### Requirements Coverage

| Requirement | Source Plan  | Description                                                                         | Status    | Evidence                                                                                                                                                 |
| ----------- | ------------ | ----------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NAV-01      | 17-01, 17-02 | Trail is accessible from the desktop sidebar as a primary navigation item           | SATISFIED | Trail is first student item in nav config, Sidebar renders it with NavLink, AppLayout shows sidebar on trail page                                        |
| NAV-02      | 17-01, 17-02 | Trail is accessible from the mobile bottom tab bar as a primary navigation item     | SATISFIED | Trail is first tab in MobileTabsNav tabIds, BottomNavigation renders it with NavLink, AppLayout shows tabs on trail page                                 |
| NAV-03      | 17-01        | Returning students land on the trail map by default after login (not the dashboard) | SATISFIED | TeacherRedirect returns TrailMapPage for non-teachers at index route. 2 automated tests confirm.                                                         |
| NAV-04      | 17-01, 17-02 | Navigation highlight/active state correctly reflects the current page               | SATISFIED | `end: true` on trail nav item prevents prefix matching. Threaded through Sidebar, MobileTabsNav, and BottomNavigation NavLinks. 3 tests verify end prop. |
| DASH-04     | 17-01        | Dashboard is accessible from sidebar and mobile bottom tabs as a secondary nav item | SATISFIED | studentDashboard with `to: "/dashboard"` in nav config, included in MobileTabsNav tabIds, `/dashboard` route defined in App.jsx                          |

No orphaned requirements found. All 5 requirement IDs declared in plans (NAV-01, NAV-02, NAV-03, NAV-04, DASH-04) are mapped in REQUIREMENTS.md to Phase 17 and all show as "Done".

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact                                      |
| ---- | ---- | ------- | -------- | ------------------------------------------- |
| None | -    | -       | -        | No anti-patterns detected in modified files |

No TODO, FIXME, PLACEHOLDER, stub returns, or empty handlers found in any of the modified files.

### Human Verification Required

### 1. Trail Page Layout in App Shell

**Test:** Open the app at `http://localhost:5174/` on desktop (>1280px) and mobile (<1280px)
**Expected:** Dark forest background fills content area, sidebar visible on desktop, bottom tabs visible on mobile, no white strips or gaps between sidebar and content
**Why human:** Layout gaps and background rendering depend on actual CSS rendering and viewport dimensions

### 2. Active Nav State Correctness

**Test:** Navigate between /, /dashboard, /settings, /achievements and observe nav highlighting
**Expected:** Only the current page's nav item is highlighted in both sidebar and bottom tabs. Trail is NOT highlighted when on /dashboard or /settings.
**Why human:** CSS active state styling depends on React Router runtime behavior and visual rendering

### 3. Jump-to-Top FAB Positioning

**Test:** On mobile viewport, scroll down on trail page and observe FAB position relative to bottom tabs
**Expected:** FAB floats above the bottom tab bar (bottom-24 = 96px), not overlapping tabs. On desktop, FAB is at bottom-6.
**Why human:** Overlap depends on device safe-area insets and actual rendered layout

### 4. Trail Page Scroll Behavior

**Test:** Scroll down on trail page, click Jump-to-Top FAB
**Expected:** Page scrolls via browser window (or #root container), no double scrollbars, FAB smoothly scrolls to top
**Why human:** Scroll behavior depends on DOM rendering and overflow stacking context

### Gaps Summary

No gaps found. All 5 success criteria are verified through code inspection and automated tests. The implementation is complete with:

- 20 automated tests (18 nav config + 2 routing) all passing
- Production build succeeding
- All URL references correctly audited (4 files updated to `/dashboard`, 3 files preserved as `/`)
- i18n keys present in both English and Hebrew

4 items need human visual verification to confirm the layout, active states, FAB positioning, and scroll behavior work correctly in the browser.

---

_Verified: 2026-04-05T02:35:00Z_
_Verifier: Claude (gsd-verifier)_
