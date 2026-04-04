# Phase 17: Navigation Restructuring - Research

**Researched:** 2026-04-05
**Domain:** React Router v7 + Tailwind CSS layout restructuring (navigation config, routing, AppLayout)
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Trail replaces Dashboard as the first tab in the mobile bottom navigation
- **D-02:** Dashboard replaces Recordings in the third tab position
- **D-03:** Recordings is removed from the bottom tabs; it becomes accessible via the Dashboard page (link/card on Dashboard)
- **D-04:** Final mobile tab order: **Trail, Games, Dashboard, Achievements, Settings** (5 tabs)
- **D-05:** Desktop sidebar follows the same ordering as mobile tabs: Trail, Games, Dashboard, Recordings, Achievements, Parent Zone, with Settings pinned at the bottom
- **D-06:** Recordings stays visible in the desktop sidebar (only removed from mobile tabs)
- **D-07:** Trail page shows bottom tabs (mobile) and sidebar (desktop) — it becomes a normal page within the app shell instead of a full-viewport overlay
- **D-08:** Trail page does NOT show the top header bar — keeps the dark background and immersive feel (same pattern as Dashboard which also hides the header)
- **D-09:** Trail appears first in both sidebar and mobile tabs (position 1, leftmost on mobile)
- **D-10:** Dashboard appears third in the tab bar (after Trail and Games)
- **D-11:** The index route (`/`) renders TrailMapPage directly (no redirect) — trail IS the home page
- **D-12:** Dashboard moves to `/dashboard` route
- **D-13:** ALL students land on trail, including brand new students (no conditional routing based on onboarding state)
- **D-14:** Teachers still redirect to `/teacher` (existing TeacherRedirect pattern preserved)
- **D-15:** Trail uses the Lucide `Map` icon in both sidebar and bottom tabs
- **D-16:** No redirect or migration needed from old `/` (Dashboard) to new `/` (Trail). Users hitting `/` see the trail, which is the intended behavior.

### Claude's Discretion

- Trail page layout adaptation: Claude decides the best approach for fitting trail content within the app shell (accounting for sidebar width on desktop and bottom tab height on mobile). Trail should fill available space with its dark `bg-[#1a1040]` background.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                         | Research Support                                                                                                                                                                               |
| ------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NAV-01  | Trail is accessible from the desktop sidebar as a primary navigation item           | Add Trail nav item to `appNavigationConfig.js`; sidebar consumes config automatically                                                                                                          |
| NAV-02  | Trail is accessible from the mobile bottom tab bar as a primary navigation item     | Update `tabIds` array in `MobileTabsNav.jsx` to include "trail"; reorder accordingly                                                                                                           |
| NAV-03  | Returning students land on the trail map by default after login (not the dashboard) | Change index route in `App.jsx` from `<TeacherRedirect>` (renders `<Dashboard>`) to `<TrailMapPage>`; add `/dashboard` route; update `TeacherRedirect` to render `<TrailMapPage>` for students |
| NAV-04  | Navigation highlight/active state correctly reflects the current page               | React Router `NavLink` `isActive` handles this automatically when `to` paths match; the `end` prop is needed on the Trail nav item (index route at `/`) to prevent false activation            |
| DASH-04 | Dashboard is accessible from sidebar and mobile bottom tabs as a secondary nav item | Update nav config and tab IDs; Dashboard gets its own nav item pointing to `/dashboard`                                                                                                        |

</phase_requirements>

---

## Summary

This phase restructures the app's navigation so that the trail map (`/`) becomes the primary destination for students, with the dashboard demoted to a secondary route at `/dashboard`. The work is a concentrated set of changes across five files: `appNavigationConfig.js`, `MobileTabsNav.jsx`, `AppLayout.jsx`, `App.jsx`, and `TrailMapPage.jsx`.

The codebase is already well-prepared for this change. The i18n locale files for both English and Hebrew already contain a `navigation.links.trail` key. The Lucide `Map` icon just needs to be imported — it is not yet used. The `BottomNavigation` component uses React Router `NavLink` with the `isActive` callback, which handles active states automatically once routes are correct. The biggest layout concern is converting `TrailMapPage` from a `fixed inset-0` full-viewport overlay to a scrollable child of the `AppLayout` shell while preserving its immersive dark background.

There are navigation links throughout the codebase that point to `"/"` with the intent of going to the Dashboard. After this phase, `"/"` is the trail. Those links (`navigate("/")` in `useVictoryState`, `BackButton to="/"` in `TrailMapPage` and `StudentAssignments`, etc.) must be updated to point to `"/dashboard"`.

**Primary recommendation:** Work in this order — (1) update `appNavigationConfig.js` to add Trail item and reorder, (2) update `MobileTabsNav.jsx` tab IDs, (3) update `App.jsx` routes and `TeacherRedirect`, (4) update `AppLayout.jsx` to treat trail as a normal nav page, (5) update `TrailMapPage.jsx` layout from fixed overlay to flow content, (6) update all `navigate("/")` and `to="/"` Dashboard references to `"/dashboard"`.

---

## Standard Stack

### Core

| Library         | Version                 | Purpose                                                  | Why Standard                                                              |
| --------------- | ----------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| React Router v7 | 7.x (already installed) | Route definitions, `NavLink` active states, `<Navigate>` | Already the app's router; `NavLink` provides `isActive` callback natively |
| Lucide React    | already installed       | `Map` icon for trail nav item                            | Already used for all other nav icons                                      |
| i18next         | already installed       | `navigation.links.trail` label key                       | Both locales already have the key                                         |

### Supporting

| Library        | Version           | Purpose                                       | When to Use                                                                           |
| -------------- | ----------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Tailwind CSS 3 | already installed | Layout adjustments for trail within app shell | All existing layout is Tailwind; trail shell adaptation uses existing utility classes |

No new dependencies required. This phase is purely a restructuring of existing components.

**Installation:** None needed.

---

## Architecture Patterns

### Recommended Project Structure

No structural changes needed. All changes are within existing files.

### Pattern 1: Config-Driven Navigation

**What:** `appNavigationConfig.js` is the single source of truth for nav items. Both `Sidebar` and `MobileTabsNav` consume `getSidebarNavItems()`. Adding/reordering nav items in the config propagates to both surfaces automatically.

**When to use:** Always — this is the established pattern. Do not add nav items directly to Sidebar or MobileTabsNav.

**Example:**

```javascript
// Source: src/components/layout/appNavigationConfig.js
// Add Map import alongside existing Lucide imports
import { Map, Home, Mic, Gamepad2, Settings, ShieldCheck, Trophy } from "lucide-react";

// New trail item (first position in student array):
{
  id: "trail",
  to: "/",          // index route IS the trail after D-11
  icon: Map,
  labelKey: "navigation.links.trail",
  theme: "indigo",
}
// Dashboard item moves to /dashboard:
{
  id: "studentDashboard",
  to: "/dashboard",
  icon: Home,
  labelKey: "navigation.links.studentDashboard",
  theme: "indigo",
}
```

Final student array order (D-05/D-09): `trail`, `practiceGames`, `studentDashboard`, `recordings`, `achievements`, `parentZone`

### Pattern 2: MobileTabsNav Tab Filtering

**What:** `MobileTabsNav` maintains a `tabIds` array that selects which nav items from the config appear as mobile tabs. The array order does NOT control display order — display order comes from `sidebarItems` (which follows config order), filtered to only items in `tabIds`.

**When to use:** When adding or removing items from the mobile bottom tabs.

**Important:** Because `tabIds` uses `.filter()` against the `sidebarItems` array (which is config-ordered), the final tab display order equals the config order filtered to only the tab IDs. To achieve Trail, Games, Dashboard, Achievements, Settings (D-04), the config order must be: trail, practiceGames, studentDashboard, achievements, settings — with recordings and parentZone excluded from `tabIds`.

```javascript
// Source: src/components/layout/MobileTabsNav.jsx
const tabIds = isStudent
  ? ["trail", "practiceGames", "studentDashboard", "achievements", "settings"]
  : isTeacher
    ? ["teacherDashboard", "settings"]
    : ["settings"];
```

### Pattern 3: AppLayout Route Visibility

**What:** `AppLayout.jsx` uses boolean flags (`isGameRoute`, `isTrailPage`, `isDashboard`) to conditionally show/hide header, sidebar, tabs, and set background. Per D-07 and D-08, the trail page needs sidebar + tabs visible but header hidden — same treatment as dashboard.

**When to use:** This pattern determines what chrome shows per route.

**Key change needed:** `isTrailPage` currently suppresses sidebar, tabs, and main padding. With D-07 active, `isTrailPage` should only suppress the header (like `isDashboard`). The sidebar and tabs must show.

```javascript
// BEFORE (current):
const isDashboard = location.pathname === "/";  // was the dashboard
const isTrailPage = location.pathname === "/trail";

// AFTER:
const isDashboard = location.pathname === "/dashboard"; // dashboard at new route
const isTrailPage = location.pathname === "/";          // trail is now the index

// Header hidden for: games, dashboard, trail (same as today)
{!isGameRoute && !isDashboard && !isTrailPage && <Header ... />}

// Sidebar shows for: everything except games (trail NOW included)
{!isGameRoute && (
  <div className="hidden xl:block">
    <Sidebar ... />
  </div>
)}

// Main padding: trail page gets sidebar offset like other pages
// but no top padding (same as dashboard pt-0 treatment)

// Tabs show for: everything except games (trail NOW included)
{!isGameRoute && <MobileTabsNav />}
```

### Pattern 4: NavLink Active State for Index Route

**What:** React Router `NavLink` uses prefix matching by default. A nav item with `to="/"` would be considered active on every route. The `end` prop restricts matching to exact path only.

**When to use:** Whenever a nav item points to the index route `/`.

**Example in BottomNavigation:** The `BottomNavigation` component renders `NavLink` components and receives `isActive` from React Router automatically. No changes needed to `Navigation.jsx`. The fix is in the nav item config itself or via the `NavLink` props.

For `Sidebar.jsx`, the `NavLink` components use `getNavLinkClasses(item.theme)` which returns a function `({ isActive }) => ...`. React Router passes `isActive` from its own matching. To prevent the trail item (at `/`) from matching all routes, the `NavLink` on the trail item needs `end` prop.

**Option A (recommended):** Add `end: true` as a property to the nav item config entry for trail, and apply it as a prop in `Sidebar.jsx` and `BottomNavigation.jsx`'s `NavLink` when the property is present.

**Option B (simpler):** Hardcode `end` on the NavLink for any item with `to="/"` using a conditional check inside Sidebar/Navigation render.

**Note:** The `BottomNavigation` component in `Navigation.jsx` currently renders `<NavLink to={item.to} ...>` without `end`. The Trail item points to `/`, so without `end`, every page would highlight the Trail tab. This is a critical detail.

### Pattern 5: TrailMapPage Layout Conversion

**What:** `TrailMapPage` currently uses `fixed inset-0 overflow-y-auto` — a full-viewport overlay that covers the app shell entirely. Per D-07, it must become a normal page within the app shell.

**Layout mechanics after change:**

- `AppLayout` gives `<main>` a left padding of `xl:pl-[19rem]` (for sidebar) and bottom padding of `pb-20 xl:pb-0` (for mobile tabs)
- Trail page gets `min-h-screen` equivalent via the flex column layout in AppLayout
- The scroll container must move from `TrailMapPage`'s root div to the browser window (remove `overflow-y-auto` from the component, rely on natural document scroll)

**Background color:** `AppLayout` already switches to `bg-[#1a1040]` when `isTrailPage` is true. After the route swap, `isTrailPage` will be `location.pathname === "/"`. No background logic change needed beyond the pathname update.

**The internal nav bar in TrailMapPage:** Currently has a `BackButton to="/" name="Dashboard"` — this must be removed since the trail is no longer navigating back to dashboard; it IS the home. The nav bar with XP progress and level badge can remain, but the BackButton is obsolete once trail is the home page.

**Jump-to-Top FAB:** Currently uses `fixed bottom-6 right-6`. With mobile tabs showing, `bottom-6` will overlap the tabs on mobile. Must increase to `bottom-24` or similar (accounting for ~4rem tab bar + safe-area padding). On desktop with sidebar, `right-6` is fine.

```javascript
// TrailMapPage root div BEFORE:
className =
  "trail-page trail-forest-bg fixed inset-0 overflow-y-auto font-quicksand...";

// TrailMapPage root div AFTER:
// Remove fixed/inset-0/overflow-y-auto — let AppLayout control scroll
// Add min-h-full to fill the available space in AppLayout's flex-1 main
className = "trail-page trail-forest-bg min-h-full font-quicksand...";
```

### Anti-Patterns to Avoid

- **Putting `end` only on Sidebar NavLink but not BottomNavigation:** Both surfaces render NavLinks for the trail item pointing to `/`. Both need `end` behavior.
- **Leaving `isTrailPage = location.pathname === "/trail"`:** After D-11, the trail lives at `/`. Stale path check means `isTrailPage` never fires.
- **Hardcoding `isDashboard = location.pathname === "/"`:** After D-12, dashboard is at `/dashboard`. This check controls sidebar offset and zero top-padding — must be updated.
- **Not removing the BackButton from TrailMapPage:** Once trail IS the home, the Back button pointing to Dashboard makes no sense (D-11).
- **Leaving the internal `TrailMapPage` `useEffect` that sets `html/body` background:** This effect (lines 38-56 in `TrailMapPage.jsx`) overrides `html` and `body` background colors to `#1a1040` and restores them on unmount. With trail as the permanent home page, this may cause a flash when navigating away. Evaluate whether it's still needed — AppLayout's `backgroundClass` already handles the background switch.

---

## Don't Hand-Roll

| Problem          | Don't Build                                            | Use Instead                                                         | Why                                                                    |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Active nav state | Custom active-detection logic                          | React Router `NavLink` `isActive` prop + `end` prop for index route | Built-in, SSR-safe, handles edge cases                                 |
| Route redirects  | Manual `useEffect` + `navigate` for role-based routing | Existing `TeacherRedirect` component pattern                        | Already established pattern — just change what it renders for students |
| i18n labels      | Hardcode "Trail" text                                  | `navigation.links.trail` key (already exists in both locales)       | Consistency, RTL support                                               |

**Key insight:** The nav config-driven architecture means almost all changes flow from editing `appNavigationConfig.js`. Both sidebar and mobile tabs pick up changes automatically.

---

## Common Pitfalls

### Pitfall 1: NavLink `/` Activates on Every Route

**What goes wrong:** Trail tab/sidebar item glows active on all pages because `to="/"` matches as a prefix for all routes.
**Why it happens:** React Router `NavLink` uses prefix matching unless `end` prop is present.
**How to avoid:** Add `end` prop to all `NavLink` instances that point to `"/"`. Both `Sidebar.jsx` and `BottomNavigation` in `Navigation.jsx` render NavLinks — both need `end`.
**Warning signs:** Trail tab highlights even when on `/dashboard` or `/settings`.

### Pitfall 2: TrailMapPage Scroll Breaks After Removing `fixed inset-0`

**What goes wrong:** The trail content no longer scrolls, or scrolls behind the bottom tab bar.
**Why it happens:** The scroll was on the `fixed inset-0 overflow-y-auto` container. After removal, scroll context changes to the document/window. The `scrollRef.current?.scrollTo(...)` in the Jump-to-Top FAB will break because `scrollRef` points to a regular div, not the scroll container.
**How to avoid:** Update the Jump-to-Top FAB to use `window.scrollTo({ top: 0, behavior: "smooth" })` instead of `scrollRef.current?.scrollTo(...)`. Remove the `scrollRef` entirely from the root div.
**Warning signs:** Jump-to-top button does nothing after layout change.

### Pitfall 3: Old `navigate("/")` Calls Go to Trail Instead of Dashboard

**What goes wrong:** After login/signup, or clicking "Back to Dashboard", users land on trail instead of dashboard.
**Why it happens:** Multiple places call `navigate("/")` or `<BackButton to="/">` with the intent to reach Dashboard. After D-11, `"/"` is trail.
**How to avoid:** Audit and update all such references:

- `useVictoryState.js` line 173: `navigate("/")` → `navigate("/dashboard")`
- `useSignup.js` line 148: `navigate("/")` → `navigate("/dashboard")`
- `useSocialAuth.js` line 14: `navigate("/")` → `navigate("/dashboard")`
- `TrailMapPage.jsx` line 150: `<BackButton to="/" name="Dashboard" />` → remove entirely (trail is home)
- `StudentAssignments.jsx` line 170: `<BackButton to="/" name="Dashboard" />` → `<BackButton to="/dashboard" name="Dashboard" />`
- `SubscribeSuccessPage.jsx` line 107: `navigate("/")` → `navigate("/dashboard")` (or `/` if post-subscribe should go to trail)
- `SubscribePage.jsx` line 178: `navigate("/")` → `navigate("/dashboard")`
  **Warning signs:** Clicking "Dashboard" goes to the trail map.

### Pitfall 4: `theme-color` Meta Tag Doesn't Update for New `/` Route

**What goes wrong:** Android PWA status bar color stays indigo-950 on the trail page.
**Why it happens:** `App.jsx` line 524 checks `location.pathname === "/trail"` to switch to `#1a1040`. After D-11, trail is at `/`.
**How to avoid:** Update that condition to `location.pathname === "/"`.
**Warning signs:** Status bar color mismatch on trail page on Android.

### Pitfall 5: `TrailMapPage` Body Background Override Effect

**What goes wrong:** When navigating away from trail, the white/light background briefly flashes before AppLayout's gradient restores.
**Why it happens:** `TrailMapPage.jsx` `useEffect` (lines 38-56) sets `html` and `body` background colors directly and restores them on unmount. With trail as the default page, this restoration may cause visual artifacts on navigation.
**How to avoid:** Since `AppLayout` already handles `backgroundClass` via `isTrailPage`, the manual body override in `TrailMapPage` may be redundant. Evaluate removing the `html`/`body` override effect after the AppLayout change is in place. If removed, verify there's no flash of non-trail background on iOS.
**Warning signs:** Brief color flash when navigating from trail to another page.

### Pitfall 6: `appNavigationConfig` Test Will Fail

**What goes wrong:** `appNavigationConfig.test.js` has tests asserting on the current array structure. Reordering items and adding Trail will break the `parentZone is positioned after achievements` assertion.
**Why it happens:** The test asserts on index positions.
**How to avoid:** Update the test to reflect the new ordering. Trail should be first, then practiceGames, studentDashboard, recordings, achievements, parentZone.
**Warning signs:** `npx vitest run src/components/layout/appNavigationConfig.test.js` fails.

---

## Code Examples

### Verified Current Structure: appNavigationConfig student array

```javascript
// Source: src/components/layout/appNavigationConfig.js (current state)
// Current student order: studentDashboard, practiceGames, recordings, achievements, parentZone
// Required new order (D-05): trail, practiceGames, studentDashboard, recordings, achievements, parentZone

// New trail entry to add at position 0:
{
  id: "trail",
  to: "/",
  icon: Map,       // import Map from "lucide-react"
  labelKey: "navigation.links.trail",
  theme: "indigo",
}
// Update studentDashboard to:
{
  id: "studentDashboard",
  to: "/dashboard",   // changed from "/"
  icon: Home,
  labelKey: "navigation.links.studentDashboard",
  theme: "indigo",
}
```

### Verified Current Structure: MobileTabsNav tabIds

```javascript
// Source: src/components/layout/MobileTabsNav.jsx (current state, line 20)
// BEFORE:
["studentDashboard", "practiceGames", "recordings", "achievements", "settings"][
  // AFTER (D-04):
  ("trail", "practiceGames", "studentDashboard", "achievements", "settings")
];
```

### Verified Current Structure: App.jsx Routes

```javascript
// Source: src/App.jsx (current state, lines 397-399)
// BEFORE:
<Route index element={<TeacherRedirect />} />   // TeacherRedirect renders <Dashboard />
<Route path="/trail" element={<TrailMapPage />} />

// AFTER (D-11, D-12):
<Route index element={<TeacherRedirect />} />          // TeacherRedirect renders <TrailMapPage />
<Route path="/dashboard" element={<Dashboard />} />    // new route
<Route path="/trail" element={<Navigate to="/" replace />} />  // optional: redirect old trail URL
```

### Verified Current: TeacherRedirect Component

```javascript
// Source: src/App.jsx lines 235-243 (current)
function TeacherRedirect() {
  const { isTeacher } = useUser();
  if (isTeacher) {
    return <Navigate to="/teacher" replace />;
  }
  return <Dashboard />; // CHANGE THIS to <TrailMapPage />
}
```

### Verified Current: AppLayout isTrailPage logic

```javascript
// Source: src/components/layout/AppLayout.jsx lines 15-34
// BEFORE:
const isDashboard = location.pathname === "/";
const isTrailPage = location.pathname === "/trail";

// AFTER:
const isDashboard = location.pathname === "/dashboard";
const isTrailPage = location.pathname === "/";

// These two booleans drive all header/sidebar/tabs/padding logic.
// isDashboard: hides header, sets pt-0 (no top padding)
// isTrailPage: previously hid sidebar+tabs; must now only hide header like isDashboard
// The simplest approach: treat isTrailPage identically to isDashboard for header logic.
// For sidebar/tabs/padding: remove the isTrailPage exclusion — trail gets full app chrome.
```

### Sidebar NavLink `end` Prop

The sidebar renders NavLinks in `Sidebar.jsx` lines 145-165. The `NavLink` component accepts an `end` prop. To support it from config:

```javascript
// In Sidebar.jsx, add end={!!item.end} to NavLink:
<NavLink
  key={item.id}
  to={item.to}
  end={!!item.end}   // add this
  onClick={onClose}
  className={...}
>
```

And in `appNavigationConfig.js`, add `end: true` to the trail item:

```javascript
{ id: "trail", to: "/", icon: Map, labelKey: "...", theme: "indigo", end: true }
```

For `BottomNavigation` in `Navigation.jsx` (line 282), similarly add `end={item.end}` to the NavLink.

---

## State of the Art

| Old Approach                                                        | Current Approach                                               | When Changed | Impact                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| Dashboard as default landing                                        | Trail as default landing                                       | Phase 17     | Index route renders TrailMapPage; Dashboard moves to /dashboard    |
| Trail as full-viewport overlay (fixed inset-0)                      | Trail as normal app shell page                                 | Phase 17     | TrailMapPage layout loses fixed/inset-0, gains sidebar/tabs chrome |
| 5 mobile tabs: Dashboard, Games, Recordings, Achievements, Settings | 5 mobile tabs: Trail, Games, Dashboard, Achievements, Settings | Phase 17     | Recordings removed from mobile tabs                                |

**Deprecated after this phase:**

- `location.pathname === "/trail"` as the `isTrailPage` check — trail is now at `/`
- `fixed inset-0 overflow-y-auto` on TrailMapPage root div
- `BackButton to="/" name="Dashboard"` in TrailMapPage (trail IS the home now)

---

## Open Questions

1. **Should `/trail` redirect to `/` or just co-exist?**
   - What we know: Decision D-11 says the index route renders TrailMapPage directly. `/trail` route currently exists and many games navigate to it.
   - What's unclear: Games that call `navigate("/trail")` will still work because `/trail` exists as a route. The planner should decide whether to keep `/trail` rendering TrailMapPage directly (two routes, same component) or add a `<Navigate to="/" replace />` redirect for cleanup.
   - Recommendation: Keep `/trail` rendering `<TrailMapPage />` directly (not a redirect) to avoid double render. Games already navigate to `/trail` and that continues to work. The sidebar/tabs link points to `/` (the canonical home URL). Both are valid; the nav just uses `/`.

2. **Should `useSignup.js` and `useSocialAuth.js` redirect to trail or dashboard after signup?**
   - What we know: Both currently call `navigate("/")`. After D-11, `/` is trail. D-13 says all students land on trail.
   - What's unclear: For brand-new students, is the trail the right first destination (no context yet), or does the existing onboarding tour work from the trail page?
   - Recommendation: D-13 resolves this — all students land on trail. Leave `navigate("/")` as-is for signup/social-auth since `/` will be trail. Only update explicit `navigate("/")` calls that were intentionally targeting the dashboard UI (VictoryScreen's handleGoToDashboard, BackButton labels saying "Dashboard").

3. **Trail Jump-to-Top FAB position with bottom tabs**
   - What we know: FAB is `fixed bottom-6 right-6`. Mobile tabs are ~4rem (64px) + safe area.
   - What's unclear: Exact value needed; varies by device safe area.
   - Recommendation: Change to `bottom-24` on mobile (xl:bottom-6 for desktop where tabs don't show). Use `xl:bottom-6` responsive variant.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase is purely code/config changes within the existing React/Vite stack)

---

## Validation Architecture

### Test Framework

| Property           | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| Framework          | Vitest + @testing-library/react                                    |
| Config file        | vitest.config.js (root)                                            |
| Quick run command  | `npx vitest run src/components/layout/appNavigationConfig.test.js` |
| Full suite command | `npm run test:run`                                                 |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                      | Test Type | Automated Command                                                  | File Exists?      |
| ------- | ------------------------------------------------------------- | --------- | ------------------------------------------------------------------ | ----------------- |
| NAV-01  | Trail item exists in student sidebar nav                      | unit      | `npx vitest run src/components/layout/appNavigationConfig.test.js` | ✅ (needs update) |
| NAV-02  | Trail is in mobile tab IDs                                    | unit      | `npx vitest run src/components/layout/appNavigationConfig.test.js` | ✅ (needs update) |
| NAV-03  | Index route renders TrailMapPage (not Dashboard) for students | smoke     | manual browser check                                               | N/A               |
| NAV-04  | Active state highlights correctly                             | smoke     | manual browser check                                               | N/A               |
| DASH-04 | Dashboard item exists in sidebar and tabs                     | unit      | `npx vitest run src/components/layout/appNavigationConfig.test.js` | ✅ (needs update) |

### Sampling Rate

- **Per task commit:** `npx vitest run src/components/layout/appNavigationConfig.test.js`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

The existing `appNavigationConfig.test.js` will fail after the reorder. It must be updated as part of the implementation, not after. Specifically:

- [ ] `src/components/layout/appNavigationConfig.test.js` — update assertions to:
  - Trail item (`id: "trail"`) exists as first item in student array
  - Trail item has `to: "/"`, `labelKey: "navigation.links.trail"`
  - studentDashboard now has `to: "/dashboard"`
  - parentZone is still after achievements (position test still valid)
  - Tab IDs include "trail" and "studentDashboard", exclude "recordings"

_(All other new behaviors — route rendering, active states — are browser-level smoke tests not suited to unit tests)_

---

## Sources

### Primary (HIGH confidence)

- Direct source code reading: `src/components/layout/appNavigationConfig.js` — full nav config, current item IDs and routes
- Direct source code reading: `src/components/layout/MobileTabsNav.jsx` — current tabIds array and filter logic
- Direct source code reading: `src/components/layout/AppLayout.jsx` — complete isTrailPage/isDashboard logic
- Direct source code reading: `src/App.jsx` — TeacherRedirect component, route definitions, theme-color meta logic
- Direct source code reading: `src/pages/TrailMapPage.jsx` — full-viewport overlay structure, scroll ref, BackButton
- Direct source code reading: `src/components/ui/Navigation.jsx` — BottomNavigation NavLink rendering
- Direct source code reading: `src/locales/en/common.json` and `src/locales/he/common.json` — `navigation.links.trail` key confirmed present in both
- Direct source code reading: `src/components/layout/appNavigationConfig.test.js` — existing test assertions that will need updating
- Direct source code reading: `src/hooks/useVictoryState.js` — `navigate("/")` usage at line 173
- grep audit: all `to="/"` and `navigate("/")` references (Dashboard-intent links), all `navigate("/trail")` references (game back-navigation)

### Secondary (MEDIUM confidence)

- React Router v7 docs (training knowledge): `NavLink` `isActive` callback, `end` prop behavior for index routes

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependencies; all tools already in use
- Architecture: HIGH — all patterns verified directly in source code
- Pitfalls: HIGH — identified from direct code reading (e.g., NavLink end prop gap, stale isTrailPage check, navigate("/") audit)

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable codebase; no fast-moving external dependencies)
