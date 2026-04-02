---
phase: 15-verification-deploy
plan: 03
subsystem: ui
tags: [vexflow, rhythm-game, animation, navigation, react]

# Dependency graph
requires:
  - phase: 08-audio-infrastructure-rhythm-games
    provides: RhythmReadingGame, RhythmStaffDisplay, cursor RAF loop
provides:
  - Single cursor during RhythmReadingGame playback (showCursor=false on child)
  - Cursor aligned to VexFlow stave note-area bounds via onStaveBoundsReady callback
  - BackButton navigates immediately without stuck spinner
affects: [rhythm-games, UAT-01]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parent cursor div pattern: child component never renders its own cursor when parent owns animation"
    - "VexFlow stave bounds callback: expose getNoteStartX()/getNoteEndX() to parent for cursor alignment"

key-files:
  created: []
  modified:
    - src/components/games/rhythm-games/RhythmReadingGame.jsx
    - src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx
    - src/components/ui/BackButton.jsx

key-decisions:
  - "showCursor=false on RhythmStaffDisplay — parent owns cursor div, child must not duplicate it"
  - "onStaveBoundsReady callback fires after each VexFlow render with getNoteStartX/getNoteEndX"
  - "BackButton loading state removed entirely — SPA navigation is near-instant, spinner adds no value and caused stuck UI"

patterns-established:
  - "RAF cursor loop: use stave note-area bounds (not container width) to compute left % position"
  - "BackButton: call navigate() directly without intermediate state machine"

requirements-completed: [UAT-01]

# Metrics
duration: 15min
completed: 2026-04-01
---

# Phase 15 Plan 03: RhythmReadingGame Bug Fixes Summary

**Three UAT bugs fixed: duplicate cursor eliminated, cursor/beat alignment corrected via VexFlow stave bounds, and BackButton stuck spinner removed**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-31T22:10:00Z
- **Completed:** 2026-04-01T22:13:26Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Eliminated duplicate cursor during RhythmReadingGame playback by setting `showCursor={false}` on RhythmStaffDisplay (parent owns cursor div via RAF)
- Fixed cursor/metronome desync by mapping cursor sweep to VexFlow stave note-area bounds (`stave.getNoteStartX()` to `stave.getNoteEndX()`) instead of full container width
- Removed stuck spinner from BackButton by eliminating `isNavigating` state entirely and calling `navigate()` directly

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix double cursor** - `f53007d` (fix)
2. **Task 2: Fix cursor/metronome desync** - `7551c71` (fix)
3. **Task 3: Fix BackButton stuck spinning** - `e6392e0` (fix)

## Files Created/Modified

- `src/components/games/rhythm-games/RhythmReadingGame.jsx` - Changed showCursor to false, added staveBoundsRef + handleStaveBoundsReady, updated RAF cursor calc to use stave bounds, passes onStaveBoundsReady prop
- `src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx` - Added onStaveBoundsReady prop, fires after VexFlow render with stave.getNoteStartX()/getNoteEndX()
- `src/components/ui/BackButton.jsx` - Removed isNavigating state, Loader2 import, useState; navigate() called directly

## Decisions Made

- `showCursor={false}` on RhythmStaffDisplay: the parent's RAF-driven cursor div is the correct cursor; the child's internal cursor was always rendered at cursorProgress=0 (static at left edge) which was incorrect
- Stave bounds callback over SVG DOM query: using VexFlow API (`getNoteStartX()`/`getNoteEndX()`) is more reliable than querying `.vf-stave .vf-line` elements, and fires synchronously after each render
- BackButton spinner removed (not simplified): the spinner state machine had no recovery path — `setIsNavigating(true)` with no reset made the button permanently disabled on any navigation delay

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing 8 unhandled errors in `ArcadeRhythmGame.test.js` (TypeError: getOrCreateAudioContext is not a function) were present before these changes and are out of scope for this plan. All 47 tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three RhythmReadingGame UAT bugs (UAT-01) are resolved
- Visual verification of single cursor, beat alignment, and navigation still requires manual UAT in browser
- Rhythm game test suite: 47 tests passing, 6 test files green

## Self-Check: PASSED

- FOUND: src/components/games/rhythm-games/RhythmReadingGame.jsx
- FOUND: src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx
- FOUND: src/components/ui/BackButton.jsx
- FOUND: .planning/phases/15-verification-deploy/15-03-SUMMARY.md
- FOUND commit f53007d: fix(15-03): disable duplicate cursor in RhythmStaffDisplay
- FOUND commit 7551c71: fix(15-03): align cursor sweep to VexFlow stave note-area bounds
- FOUND commit e6392e0: fix(15-03): remove stuck spinner state from BackButton

---

_Phase: 15-verification-deploy_
_Completed: 2026-04-01_
