---
phase: 17-navigation-restructuring
plan: 02
subsystem: ui
tags: [react-router, navigation, trail-layout, app-shell, url-audit]

# Dependency graph
requires:
  - phase: 17-01
    provides: "Trail as index route (/), dashboard at /dashboard, nav config, AppLayout sidebar/tabs on trail"
provides:
  - TrailMapPage renders as normal AppLayout child (not fixed overlay)
  - Jump-to-Top FAB clears mobile bottom tabs
  - BackButton removed from TrailMapPage
  - All Dashboard-intent navigate("/") updated to navigate("/dashboard")
affects: [visual-verification, dashboard-navigation, subscribe-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TrailMapPage uses min-h-full instead of fixed inset-0 to render inside AppLayout shell"
    - "FAB uses bottom-24 on mobile and xl:bottom-6 on desktop to clear bottom tabs"
    - "window.scrollTo replaces scrollRef for page-level scrolling"

key-files:
  created: []
  modified:
    - src/pages/TrailMapPage.jsx
    - src/hooks/useVictoryState.js
    - src/pages/StudentAssignments.jsx
    - src/pages/SubscribePage.jsx
    - src/pages/SubscribeSuccessPage.jsx

key-decisions:
  - "Removed html/body background override from TrailMapPage since AppLayout handles bg-[#1a1040] via backgroundClass"
  - "Removed redundant dir attribute from TrailMapPage since AppLayout already sets dir={direction}"
  - "Preserved navigate('/trail') in SubscribeSuccessPage Start Learning button per plan specification"

patterns-established:
  - "Trail page as normal flow child: uses min-h-full instead of fixed overlay, scrolls via browser window"
  - "Dashboard-intent links use /dashboard explicitly (not /) since / is now trail"

requirements-completed: [NAV-01, NAV-02, NAV-04]

# Metrics
duration: 5min
completed: 2026-04-05
---

# Phase 17 Plan 02: TrailMapPage Layout Conversion and URL Audit Summary

**Converted TrailMapPage from fixed overlay to AppLayout child, updated FAB positioning for mobile tabs, removed BackButton, audited all dashboard-intent navigate("/") calls to use /dashboard**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-04T23:01:01Z
- **Completed:** 2026-04-04T23:06:13Z
- **Tasks:** 1 of 2 (Task 2 is checkpoint:human-verify)
- **Files modified:** 5

## Accomplishments
- TrailMapPage now renders as a normal child of AppLayout (min-h-full, not fixed inset-0), with sidebar visible on desktop and bottom tabs on mobile
- Removed scrollRef, BackButton, html/body background override useEffect, and TRAIL_BG constant from TrailMapPage
- Jump-to-Top FAB uses window.scrollTo and bottom-24/xl:bottom-6 to clear mobile tab bar
- Updated navigate("/") to navigate("/dashboard") in 4 files: useVictoryState, StudentAssignments, SubscribePage, SubscribeSuccessPage
- Preserved navigate("/trail") in SubscribeSuccessPage Start Learning button and navigate("/") in auth flows (useSignup, useSocialAuth, Header)

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert TrailMapPage layout and update URL references** - `392c9e3` (feat)
2. **Task 2: Visual verification of trail-first navigation** - CHECKPOINT (awaiting human-verify)

## Files Created/Modified
- `src/pages/TrailMapPage.jsx` - Removed fixed overlay, scrollRef, BackButton, bg override; added min-h-full, window.scrollTo, FAB tab clearance
- `src/hooks/useVictoryState.js` - handleGoToDashboard navigate("/") -> navigate("/dashboard")
- `src/pages/StudentAssignments.jsx` - BackButton to="/" -> to="/dashboard"
- `src/pages/SubscribePage.jsx` - Already-subscribed navigate("/") -> navigate("/dashboard")
- `src/pages/SubscribeSuccessPage.jsx` - Pending state navigate("/") -> navigate("/dashboard"), preserved Start Learning navigate("/trail")

## Decisions Made
- Removed html/body background override useEffect entirely since AppLayout now handles the bg-[#1a1040] via its backgroundClass conditional (set in 17-01)
- Removed redundant dir attribute from TrailMapPage root div since AppLayout already sets dir={direction} on its wrapper
- Kept isRTL variable in TrailMapPage since it's still used by the nav bar text-right conditional

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing test failures in 5 files (xpSystem, NoteSpeedCards, NotesRecognitionGame.autogrow, SightReadingGame.micRestart, AppSettings.cleanup) - all unrelated to this plan's changes, documented in 17-01 SUMMARY already

## Known Stubs
None - all functionality is fully wired.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Task 2 (visual verification checkpoint) blocks plan completion
- Once human-verify passes, the full navigation restructuring is complete
- All nav config, routing, layout, and URL references are in place

## Self-Check: PENDING

Self-check will be completed after human verification (Task 2 checkpoint).

---
*Phase: 17-navigation-restructuring*
*Completed: 2026-04-05 (Task 1 only, Task 2 pending human-verify)*
