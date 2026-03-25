---
phase: 06-dedicated-parent-portal-with-math-gate
plan: 01
subsystem: ui
tags: [react, i18n, navigation, lucide-react, tailwind]

# Dependency graph
requires: []
provides:
  - parentZone nav entry in APP_NAV_ITEMS.student sidebar (desktop only)
  - AppLayout title mapping for /parent-portal route
  - ParentZoneEntryCard component for mobile entry via Settings
  - All i18n keys for phase 06 in both en and he locales
affects:
  - 06-02 (QuickStatsGrid uses parentPortal i18n keys added here)
  - 06-03 (AppSettings integration uses ParentZoneEntryCard)
  - 06-04 (ParentPortalPage uses parentZoneTitle and other keys)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ShieldCheck (lucide-react) as Parent Zone icon throughout phase"
    - "Glass card pattern: bg-white/10 backdrop-blur-md border border-white/20 rounded-xl"
    - "RTL support via flex-row-reverse + rotate-180 on directional icons"

key-files:
  created:
    - src/components/settings/ParentZoneEntryCard.jsx
  modified:
    - src/components/layout/appNavigationConfig.js
    - src/components/layout/AppLayout.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "parentZone placed as last item in APP_NAV_ITEMS.student (after achievements, before common Settings)"
  - "MobileTabsNav NOT modified — parentZone intentionally excluded from mobile bottom nav per D-02"
  - "All phase i18n keys added in single plan to avoid key-missing errors in later plans"

patterns-established:
  - "ParentZoneEntryCard: glass card button with ShieldCheck + text + ChevronRight for settings-page entry points"

requirements-completed: [D-01, D-02, D-03, D-09, D-12, D-14, REQ-01, REQ-02, REQ-09, REQ-10]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 06 Plan 01: Navigation Entry Points and i18n Foundation Summary

**Parent Zone added to desktop sidebar with ShieldCheck icon, ParentZoneEntryCard component created, and all 12 i18n keys added to en + he locales for the entire phase**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T18:57:21Z
- **Completed:** 2026-03-25T19:01:04Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Desktop sidebar renders Parent Zone entry (ShieldCheck icon, amber-400) between Achievements and Settings
- AppLayout.jsx title mapping resolves "Parent Zone" / "אזור הורים" for /parent-portal route
- ParentZoneEntryCard component created with glass card styling, RTL support, and navigate to /parent-portal
- All 10 new parentPortal keys + 1 navigation.links.parentZone key added to both en and he locales
- Mobile bottom nav unchanged (parentZone excluded from MobileTabsNav tabIds per spec)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Parent Zone sidebar nav entry, AppLayout title, and all i18n keys** - `d090d04` (feat)
2. **Task 2: Create ParentZoneEntryCard component** - `19209b4` (feat)

## Files Created/Modified
- `src/components/layout/appNavigationConfig.js` - Added ShieldCheck import + parentZone nav item after achievements
- `src/components/layout/AppLayout.jsx` - Added /parent-portal title mapping in getPageTitleKey()
- `src/components/settings/ParentZoneEntryCard.jsx` - New mobile entry card component for /parent-portal
- `src/locales/en/common.json` - Added navigation.links.parentZone + 10 parentPortal keys
- `src/locales/he/common.json` - Added Hebrew translations for all new keys

## Decisions Made
- parentZone placed as last item in student array, rendering it between Achievements (last student item) and Settings (first common item)
- MobileTabsNav.jsx deliberately not modified — parentZone must NOT appear in mobile bottom tabs (D-02)
- i18n keys for the full phase (quickStatsHeading, parentSettingsHeading, statLevel, etc.) added now to prevent key-missing errors in plans 02-04

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. Pre-existing test failure in ParentEmailStep.test.jsx (`i18n.dir is not a function` in test mock) exists before these changes and is unrelated.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 02 (QuickStatsGrid) can use parentPortal.quickStatsHeading, statLevel, statStars, statNodes, statStreak keys
- Plan 03 (AppSettings integration) can import ParentZoneEntryCard from src/components/settings/
- Plan 04 (ParentPortalPage) can use parentPortal.parentZoneTitle for the page header
- All i18n keys are wired and verified in both locales

---
*Phase: 06-dedicated-parent-portal-with-math-gate*
*Completed: 2026-03-25*
