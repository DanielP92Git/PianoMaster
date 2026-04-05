---
phase: 19-post-game-trail-return
plan: 01
subsystem: ui
tags: [react, victory-screen, i18n, trail-navigation, gamification]

# Dependency graph
requires:
  - phase: 17-navigation-restructuring
    provides: Trail as primary navigation destination
provides:
  - Simplified VictoryScreen with single-destination flow per game mode
  - "Next Adventure" CTA for trail-complete games
  - Challenge mode routing to trail instead of dashboard
  - Cleaned useVictoryState without next-node fetching
affects: [19-02 (GameOverScreen buttons), BossUnlockModal]

# Tech tracking
tech-stack:
  added: []
  patterns: [single-destination post-game flow, trail-first navigation]

key-files:
  modified:
    - src/hooks/useVictoryState.js
    - src/components/games/VictoryScreen.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "Removed navigateToNextNode and getNextNodeInPath entirely -- kids return to trail map to see progress and choose next node themselves (Duolingo-style)"
  - "BossUnlockModal receives null nextNode to force 'Back to Trail' path instead of 'Start Next Node'"
  - "Challenge mode now navigates to trail (not dashboard) matching trail-first nav paradigm"
  - "Renamed common.toGamesMode to common.backToGames for clearer wording"

patterns-established:
  - "Single-destination post-game flow: trail games -> trail, free play -> games menu, challenge -> trail"

requirements-completed: [POST-01, POST-02]

# Metrics
duration: 7min
completed: 2026-04-05
---

# Phase 19 Plan 01: VictoryScreen Post-Game Trail Return Summary

**Simplified VictoryScreen to Duolingo-style single-destination flow: trail-complete shows "Next Adventure", free play shows "Play Again" + "Back to Games", challenge navigates to trail**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-05T09:13:40Z
- **Completed:** 2026-04-05T09:21:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Removed the entire "Continue to Next Node" direct-jump flow from useVictoryState (getNextNodeInPath fetch, navigateToNextNode callback, EXERCISE_TYPES routing)
- Replaced complex 4-branch trail button logic with clean 3-mode structure: trail (single CTA), challenge (trail), free play (play again + back to games)
- Added "nextAdventure" i18n key in English and Hebrew, renamed "toGamesMode" to "backToGames"
- Updated BossUnlockModal integration to navigate to trail instead of directly to next node

## Task Commits

Each task was committed atomically:

1. **Task 1: Clean up useVictoryState -- remove next-node fetching and navigateToNextNode** - `799c44e` (feat)
2. **Task 2: Rewrite VictoryScreen action buttons + add i18n keys** - `c8afb45` (feat)

## Files Created/Modified
- `src/hooks/useVictoryState.js` - Removed getNextNodeInPath import, EXERCISE_TYPES import, nextNode/fetchingNextNode state, fetch-next-node effect, navigateToNextNode callback (101 lines removed)
- `src/components/games/VictoryScreen.jsx` - Replaced action buttons with 3-mode single-destination flow, removed translateNodeName import, removed unused destructured values
- `src/locales/en/common.json` - Added victory.nextAdventure, renamed common.toGamesMode to common.backToGames
- `src/locales/he/common.json` - Added victory.nextAdventure, renamed common.toGamesMode to common.backToGames

## Decisions Made
- Removed navigateToNextNode entirely rather than simplifying it -- per D-02, kids should always return to trail map to see their progress visually then tap the next node themselves
- Passed `nextNode={null}` to BossUnlockModal so the preview stage shows "Path Complete / Back to Trail" rather than "Start Next Node" -- consistent with removing direct node jumping
- Challenge mode button changed from `handleExit` (goes to `/practice-modes`) to `handleNavigateToTrail` per D-07 -- trail is home now
- Removed `nodeComplete` from VictoryScreen destructuring since it's no longer needed for button logic (was only used in the removed `nodeComplete && nextNode` branch and the `nodeComplete ? backToTrail : continueLearning` ternary)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated BossUnlockModal props in VictoryScreen**
- **Found during:** Task 2 (VictoryScreen button rewrite)
- **Issue:** Plan didn't explicitly address BossUnlockModal which receives nextNode and onNavigateToNext (calling navigateToNextNode). Removing navigateToNextNode without updating BossUnlockModal would break boss celebration flow.
- **Fix:** Passed `nextNode={null}` to BossUnlockModal and changed `onNavigateToNext` to call `handleNavigateToTrail()` instead of `navigateToNextNode()`. This makes boss celebrations end with "Back to Trail" rather than "Start Next Node".
- **Files modified:** src/components/games/VictoryScreen.jsx
- **Verification:** Build succeeds, lint passes
- **Committed in:** c8afb45 (Task 2 commit)

**2. [Rule 1 - Bug] Removed unused nodeComplete destructure and i18n from VictoryScreen**
- **Found during:** Task 2 (VictoryScreen button rewrite)
- **Issue:** After removing the old button logic, `nodeComplete` and `i18n` were destructured but never used, causing lint warnings
- **Fix:** Removed `nodeComplete` and `i18n` from useVictoryState destructuring in VictoryScreen
- **Files modified:** src/components/games/VictoryScreen.jsx
- **Verification:** `npx eslint` returns 0 warnings/errors
- **Committed in:** c8afb45 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## Known Stubs
None - all button modes are fully wired to real navigation handlers.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- VictoryScreen simplified, ready for Phase 19 Plan 02 (GameOverScreen buttons)
- GameOverScreen still has the old navigation pattern and needs the same single-destination treatment (D-08, D-09, D-10)

---
*Phase: 19-post-game-trail-return*
*Completed: 2026-04-05*
