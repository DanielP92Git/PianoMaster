---
phase: 07-data-foundation-trailmap-refactor
plan: 02
subsystem: ui
tags: [trail, react, tailwind, lucide-react, react-router]

requires:
  - phase: 07-01
    provides: TRAIL_TAB_CONFIGS array with 4 tab entries, EXERCISE_TYPES with 11 types, NODE_CATEGORIES with EAR_TRAINING
provides:
  - TrailMap fully data-driven from TRAIL_TAB_CONFIGS (adding 5th tab = one array entry, zero code changes)
  - ComingSoon placeholder page for all 5 new exercise types
  - /coming-soon route registered in App.jsx
  - 5 new exercise type cases in TrailNodeModal.getExerciseTypeName()
  - 5 new exercise type cases in TrailNodeModal.navigateToExercise() routing to /coming-soon
  - Ear Training tab visible with teal/cyan icon, colors, and glow from config
  - Empty state guard for tabs with no nodes (ear_training tab)
  - ear_training entry in MODAL_ICON_STYLES and BUBBLE_COLORS
affects:
  - Phase 8 (new rhythm games can add tab entries without code changes)
  - Phase 9 (ear training games replace /coming-soon navigation with real routes)
  - Phase 10 (ear training trail data will populate the now-empty ear_training tab)

tech-stack:
  added: []
  patterns:
    - Data-driven tab bar via TRAIL_TAB_CONFIGS.map — zero code changes to add a tab
    - Single nodesWithBossByTab useMemo replaces N separate useMemo blocks
    - ComingSoon shared placeholder serves all new exercise types via location.state.gameName
    - Boss node filtering via tab.bossPrefix (config-driven, not hardcoded startsWith strings)

key-files:
  created:
    - src/components/shared/ComingSoon.jsx
  modified:
    - src/components/trail/TrailMap.jsx
    - src/components/trail/TrailNodeModal.jsx
    - src/App.jsx

key-decisions:
  - "nodesWithBossByTab useMemo computed once (not 3 times) using TRAIL_TAB_CONFIGS.map — O(1) lookup during render"
  - "Empty state guard added before ZigzagTrailLayout (ear_training tab has no nodes yet)"
  - "ComingSoon uses navigate('/trail') not navigate(-1) for predictable back navigation"
  - "Target icon kept in TrailMap import (used by Jump-to-top FAB, not replaced)"

patterns-established:
  - "Data-driven tab rendering: TRAIL_TAB_CONFIGS.map drives all tab UI — icon, label, colors, glow, boss filtering"
  - "Shared placeholder pattern: ComingSoon reads gameName from location.state; reusable for any future unimplemented game"

requirements-completed: [INFRA-03, INFRA-04]

duration: 4min
completed: 2026-03-27
---

# Phase 7 Plan 2: TrailMap Refactor + ComingSoon Summary

**TrailMap fully data-driven from TRAIL_TAB_CONFIGS (4 tabs, zero hardcoded category references); ComingSoon placeholder wires all 5 new exercise types; Ear Training tab visible with teal/cyan design.**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-03-27T15:45:37Z
- **Completed:** 2026-03-27T15:49:48Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- Deleted hardcoded `TRAIL_TABS` array; TrailMap now renders 4 tabs from `TRAIL_TAB_CONFIGS` with category-specific icons (Music, Music2, Drum, Ear), gradients, borders, and glow from config
- Created `ComingSoon.jsx` (glass card, Hourglass icon, gameName from `location.state`; Back to Trail button) and registered `/coming-soon` route in App.jsx
- Extended TrailNodeModal with 5 new exercise type cases in both `getExerciseTypeName()` and `navigateToExercise()` (rhythm_tap, rhythm_dictation, arcade_rhythm, pitch_comparison, interval_id)
- Added `ear_training` to `MODAL_ICON_STYLES`, `BUBBLE_COLORS`, and `progressGradient` ternary
- Added empty state guard before ZigzagTrailLayout (ear_training tab renders "Coming soon!" message when no nodes present)

## Task Commits

1. **Task 1: Create ComingSoon component and add route to App.jsx** - `61ceb05` (feat)
2. **Task 2: Refactor TrailMap to data-driven tabs and extend TrailNodeModal routing** - `3c88f6a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/shared/ComingSoon.jsx` — Shared placeholder page; reads `gameName` from location.state; Back to Trail button navigates to `/trail`
- `src/components/trail/TrailMap.jsx` — Fully refactored: TRAIL_TAB_CONFIGS drives all tab rendering, nodesWithBossByTab replaces 3 separate useMemo blocks, dynamic fetchProgress loop, config-driven boss filtering
- `src/components/trail/TrailNodeModal.jsx` — 5 new exercise type cases in getExerciseTypeName() and navigateToExercise(); ear_training added to MODAL_ICON_STYLES, BUBBLE_COLORS, progressGradient
- `src/App.jsx` — Lazy import and `/coming-soon` protected route added

## Decisions Made

- `nodesWithBossByTab` single useMemo replaces 3 separate useMemo blocks (`trebleWithBoss`, `bassWithBoss`, `rhythmWithBoss`) — unified lookup map by tab id, O(1) access during render
- `ComingSoon` uses `navigate('/trail')` not `navigate(-1)` — predictable behavior regardless of navigation history
- `Target` import kept in TrailMap — still used by Jump-to-top FAB button
- Merged main branch into worktree at start of execution to get Plan 01 constants (TRAIL_TAB_CONFIGS etc.)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

The worktree (`worktree-agent-a52fb889`) was based on an older commit that predated the Plan 01 merge. Ran `git merge main` to bring in Plan 01 constants (fast-forward, no conflicts). This was expected per the parallel execution setup.

## Known Stubs

The Ear Training tab (and any future tabs added to TRAIL_TAB_CONFIGS) renders an empty state message because no ear training nodes exist yet. This is intentional — Phase 10 will author ear training trail data that populates this tab. The empty state guard prevents crashes.

All 5 new exercise types navigate to `/coming-soon` with `gameName` — intentional placeholders until Phase 8 (rhythm) and Phase 9 (ear training) implement the real games.

## Next Phase Readiness

- Phase 8 (rhythm games): Can register real routes for `rhythm_tap`, `rhythm_dictation`, `arcade_rhythm` — just replace `/coming-soon` navigation cases in TrailNodeModal
- Phase 9 (ear training games): Can register real routes for `pitch_comparison`, `interval_id`
- Phase 10 (ear training trail data): Will add nodes with `category: 'ear_training'` — Ear Training tab will auto-populate
- Adding a 5th tab: One entry in `TRAIL_TAB_CONFIGS` in constants.js — zero code changes anywhere else

## Self-Check: PASSED

Files confirmed to exist:
- `src/components/shared/ComingSoon.jsx` — contains export default ComingSoon, Hourglass, text-cyan-300, navigate('/trail'), location.state?.gameName, active:scale-95
- `src/components/trail/TrailMap.jsx` — contains TRAIL_TAB_CONFIGS import, TRAIL_TAB_CONFIGS.map, tab.bossPrefix, tab.colorActive, TabIcon, nodesWithBossByTab; does NOT contain const TRAIL_TABS = or trebleWithBoss
- `src/components/trail/TrailNodeModal.jsx` — contains case 'rhythm_tap': (x2), case 'pitch_comparison': (x2), case 'interval_id': (x2), navigate('/coming-soon', ear_training: in MODAL_ICON_STYLES and BUBBLE_COLORS
- `src/App.jsx` — contains import("./components/shared/ComingSoon"), path="/coming-soon"

Commits confirmed:
- 61ceb05: feat(07-02): add ComingSoon placeholder component and /coming-soon route
- 3c88f6a: feat(07-02): refactor TrailMap to data-driven tabs and extend TrailNodeModal routing

---
*Phase: 07-data-foundation-trailmap-refactor*
*Completed: 2026-03-27*
