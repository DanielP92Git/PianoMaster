# Phase 17: Navigation Restructuring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 17-navigation-restructuring
**Areas discussed:** Mobile tab composition, Trail page chrome, Nav item ordering, Default landing scope, Trail tab icon, URL impact on bookmarks/PWA, Trail page scroll/layout

---

## Mobile Tab Composition

| Option                       | Description                                                                                   | Selected     |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ------------ |
| Replace Dashboard with Trail | Trail takes Dashboard's spot as the first tab. Dashboard moves to sidebar-only. Keeps 5 tabs. | Initial pick |
| Drop Achievements tab        | Trail + Dashboard both stay as tabs. Achievements moves to sidebar-only.                      |              |
| Drop Recordings tab          | Trail + Dashboard both stay as tabs. Recordings moves to sidebar-only.                        |              |
| Keep all 6 tabs              | Smaller icons, tighter spacing. May feel cramped.                                             |              |

**User's choice:** Replace Dashboard with Trail initially, then refined: Trail takes position 1, Dashboard takes Recordings' position (position 3). Recordings drops out of tabs.
**Notes:** User corrected that mobile doesn't have a slide-out sidebar menu. Parent Zone is accessed via Settings tab. User proposed replacing Recordings tab with Dashboard specifically.

### Follow-up: Dashboard Mobile Access

| Option              | Description                         | Selected |
| ------------------- | ----------------------------------- | -------- |
| Hamburger menu only | Dashboard in slide-out sidebar menu |          |
| Top header link     | Small Dashboard icon in header bar  |          |
| Trail page shortcut | Stats button in trail page UI       |          |

**User's choice:** None of the above -- user clarified mobile has no hamburger menu and proposed Dashboard takes Recordings' tab position instead.

### Follow-up: Recordings Access

| Option                       | Description                                  | Selected |
| ---------------------------- | -------------------------------------------- | -------- |
| Accessible via Settings page | Add 'My Recordings' link in Settings         |          |
| Accessible via Dashboard     | Put a Recordings card/link on Dashboard page | ✓        |
| Keep in desktop sidebar only | Not reachable from mobile tabs               |          |

**User's choice:** Accessible via Dashboard

---

## Trail Page Chrome

| Option                             | Description                                                   | Selected |
| ---------------------------------- | ------------------------------------------------------------- | -------- |
| Show bottom tabs + desktop sidebar | Trail becomes a normal page in app shell. Nav chrome visible. | ✓        |
| Show bottom tabs only, no sidebar  | Mobile gets tabs, desktop keeps full-viewport                 |          |
| Keep full-viewport, no chrome      | Trail stays immersive, tabs highlight but chrome disappears   |          |

**User's choice:** Show bottom tabs + desktop sidebar

### Follow-up: Header on Trail

| Option               | Description                                                   | Selected |
| -------------------- | ------------------------------------------------------------- | -------- |
| No header on trail   | Only sidebar + bottom tabs. Keeps dark bg and immersive feel. | ✓        |
| Show header on trail | Full standard chrome including header                         |          |

**User's choice:** No header on trail

---

## Nav Item Ordering

| Option                                          | Description                   | Selected |
| ----------------------------------------------- | ----------------------------- | -------- |
| Trail, Games, Dashboard, Achievements, Settings | Trail first, Dashboard third  | ✓        |
| Trail, Dashboard, Games, Achievements, Settings | Trail first, Dashboard second |          |
| Trail, Games, Achievements, Dashboard, Settings | Dashboard near end as utility |          |

**User's choice:** Trail, Games, Dashboard, Achievements, Settings

### Follow-up: Desktop Sidebar Order

| Option                      | Description                | Selected |
| --------------------------- | -------------------------- | -------- |
| Same order as mobile        | Consistent across devices  | ✓        |
| Different order for desktop | Desktop-specific hierarchy |          |

**User's choice:** Same order as mobile

---

## Default Landing Scope

| Option                                  | Description                                | Selected |
| --------------------------------------- | ------------------------------------------ | -------- |
| All students, always                    | Every student lands on /trail after login  | ✓        |
| New students see Dashboard first        | First login goes to Dashboard, then /trail |          |
| New students see onboarding, then trail | First login shows onboarding flow          |          |

**User's choice:** All students, always

### Follow-up: Implementation Approach

| Option                                   | Description                                                  | Selected |
| ---------------------------------------- | ------------------------------------------------------------ | -------- |
| Index route renders TrailMapPage         | '/' renders trail directly. Dashboard moves to '/dashboard'. | ✓        |
| Redirect '/' to '/trail'                 | Index route does Navigate redirect                           |          |
| Keep '/' as Dashboard, redirect students | Students auto-redirected to '/trail'                         |          |

**User's choice:** Index route renders TrailMapPage

---

## Trail Tab Icon

| Option           | Description                                     | Selected |
| ---------------- | ----------------------------------------------- | -------- |
| Map              | Lucide 'Map' icon -- matches 'Trail Map' naming | ✓        |
| Route            | Lucide 'Route' icon -- path/road metaphor       |          |
| Custom home icon | Existing home.png from src/assets/icons/        |          |
| Compass          | Lucide 'Compass' icon -- exploration theme      |          |

**User's choice:** Map (Lucide)

---

## URL Impact on Bookmarks/PWA

| Option                         | Description                                              | Selected |
| ------------------------------ | -------------------------------------------------------- | -------- |
| No redirect needed             | Landing on trail is desired. PWA users see trail at '/'. | ✓        |
| Temporary redirect for 30 days | Toast notification about Dashboard moving                |          |
| Keep '/' as Dashboard          | Avoid URL breakage, add redirect complexity              |          |

**User's choice:** No redirect needed

---

## Trail Page Scroll/Layout

| Option                             | Description                                | Selected |
| ---------------------------------- | ------------------------------------------ | -------- |
| You decide                         | Let Claude figure out best layout approach | ✓        |
| Keep full-viewport with safe areas | Fixed inset-0 with padding for nav chrome  |          |

**User's choice:** Claude's discretion

---

## Claude's Discretion

- Trail page layout adaptation (how trail content fits within app shell with sidebar/tabs)

## Deferred Ideas

None -- discussion stayed within phase scope
