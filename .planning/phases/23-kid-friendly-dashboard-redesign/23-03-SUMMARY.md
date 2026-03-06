---
phase: 23-kid-friendly-dashboard-redesign
plan: 03
subsystem: ui
tags: [react, tailwind, accessibility, framer-motion, dashboard]

# Dependency graph
requires:
  - phase: 23-02
    provides: Dashboard.jsx kid-friendly layout rewrite with hero section and Fireflies component
provides:
  - Horizontal avatar+pill level badge layout with 'LEVEL X' text
  - Accessibility-aware Fireflies component using app AccessibilityContext
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fireflies uses app AccessibilityContext instead of framer-motion useReducedMotion for consistent in-app reduced motion control"
    - "Static div fallback pattern for motion components when reducedMotion is true"

key-files:
  created: []
  modified:
    - src/components/layout/Dashboard.jsx
    - src/components/ui/Fireflies.jsx

key-decisions:
  - "Level pill uses i18n key 'dashboard.header.level' with uppercase tracking-wider for 'LEVEL X' display"
  - "Fireflies renders plain div (not motion.div) when reducedMotion is true to eliminate animation loop entirely"
  - "Shared fireflyStyle/fireflyClassName helpers extracted to avoid duplication between static and animated branches"

patterns-established:
  - "AccessibilityContext over framer-motion useReducedMotion: app-level toggle controls all animation, not just OS preference"

requirements-completed: [DASH-01]

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 23 Plan 03: Gap Closure Summary

**Horizontal avatar+pill level badge with 'LEVEL X' text and AccessibilityContext-aware Fireflies static dot fallback**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T21:06:59Z
- **Completed:** 2026-03-06T21:09:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced tiny absolute-positioned "LV.X" corner chip with horizontal avatar+pill layout showing "LEVEL X" uppercase text
- Made Fireflies use app's AccessibilityContext instead of framer-motion useReducedMotion
- Static div elements render when reducedMotion is true, eliminating all animation loops
- RTL support: pill extends left from avatar with -mr-3 negative margin in Hebrew

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor hero level badge to horizontal avatar+pill layout** - `58c7aa1` (feat)
2. **Task 2: Fix Fireflies reduced motion to use AccessibilityContext** - `aca77e4` (fix)

## Files Created/Modified
- `src/components/layout/Dashboard.jsx` - Hero section refactored: horizontal flex row with avatar left + level pill right, RTL-aware
- `src/components/ui/Fireflies.jsx` - Replaced useReducedMotion with useAccessibility; static div fallback when reducedMotion is true

## Decisions Made
- Level pill uses i18n key `dashboard.header.level` with `{ level }` interpolation and Tailwind `uppercase tracking-wider` for visual "LEVEL X" display
- Fireflies renders plain `<div>` (not `<motion.div>`) when reducedMotion is true -- eliminates animation loop entirely rather than just setting amplitude to 0
- Extracted `fireflyStyle()` and `fireflyClassName()` helpers to avoid code duplication between static and animated render branches

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 plans in Phase 23 complete
- UAT gaps closed: level badge layout and Fireflies accessibility
- Ready for Phase 23 UAT re-verification

## Self-Check: PASSED

- [x] src/components/layout/Dashboard.jsx exists
- [x] src/components/ui/Fireflies.jsx exists
- [x] 23-03-SUMMARY.md exists
- [x] Commit 58c7aa1 found (Task 1)
- [x] Commit aca77e4 found (Task 2)
- [x] Dashboard.jsx contains "Level" text (not "LV.")
- [x] Fireflies.jsx imports useAccessibility from AccessibilityContext
- [x] Fireflies.jsx has no useReducedMotion import

---
*Phase: 23-kid-friendly-dashboard-redesign*
*Completed: 2026-03-06*
