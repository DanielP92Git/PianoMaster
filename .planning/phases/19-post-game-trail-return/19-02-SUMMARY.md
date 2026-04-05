---
phase: 19-post-game-trail-return
plan: 02
subsystem: ui
tags: [react-router, navigation, game-over, trail, i18n]

# Dependency graph
requires:
  - phase: 17-navigation-restructuring
    provides: Trail as primary destination, getTrailTabForNode smart tab routing
provides:
  - Context-aware GameOverScreen navigation (trail vs free play)
  - nodeId prop threading to GameOverScreen from all game components
  - i18n keys for backToTrail and backToGames in English and Hebrew
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [nodeId-prop-threading-to-GameOverScreen, context-aware-exit-routing]

key-files:
  created: []
  modified:
    - src/components/games/GameOverScreen.jsx
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx
    - src/components/games/notes-master-games/MemoryGame.jsx
    - src/components/games/notes-master-games/NoteSpeedCards.jsx
    - src/components/games/rhythm-games/ArcadeRhythmGame.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "Used getTrailTabForNode for smart tab routing on GameOverScreen exit (same pattern as VictoryScreen)"
  - "Free play exit navigates to /practice-modes (games menu) instead of hardcoded /notes-master-mode"

patterns-established:
  - "GameOverScreen nodeId prop: pass nodeId={nodeId} to GameOverScreen for context-aware navigation"

requirements-completed: [POST-01, POST-02]

# Metrics
duration: 6min
completed: 2026-04-05
---

# Phase 19 Plan 02: GameOverScreen Context-Aware Navigation Summary

**Replaced hardcoded /notes-master-mode exit with React Router navigation branching trail vs free play based on nodeId prop**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-05T09:13:55Z
- **Completed:** 2026-04-05T09:19:46Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- GameOverScreen now uses React Router navigate() with smart tab routing for trail games and /practice-modes for free play
- Removed hardcoded window.location.href = "/notes-master-mode" which was the only non-React-Router navigation in the game flow
- All four game components (NotesRecognitionGame, MemoryGame, NoteSpeedCards, ArcadeRhythmGame) thread nodeId to GameOverScreen
- Added i18n keys for "Back to Trail" and "Back to Games" in both English and Hebrew

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite GameOverScreen with context-aware navigation** - `3303060` (feat)
2. **Task 2: Thread nodeId to GameOverScreen in all four game components** - `43ee89f` (feat)

## Files Created/Modified
- `src/components/games/GameOverScreen.jsx` - Added nodeId prop, useNavigate, getTrailTabForNode import, handleExit function, context-aware button labels
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` - Added nodeId={nodeId} to GameOverScreen render
- `src/components/games/notes-master-games/MemoryGame.jsx` - Added nodeId={nodeId} to GameOverScreen render
- `src/components/games/notes-master-games/NoteSpeedCards.jsx` - Added nodeId={nodeId} to GameOverScreen render
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` - Added nodeId={nodeId} to GameOverScreen render
- `src/locales/en/common.json` - Added backToTrail and backToGames keys in gameOver section
- `src/locales/he/common.json` - Added backToTrail and backToGames keys in gameOver section

## Decisions Made
- Used getTrailTabForNode for smart tab routing (matches existing VictoryScreen pattern from useVictoryState.js)
- Free play exit destination is /practice-modes rather than the old /notes-master-mode (practice-modes is the correct games menu page)
- Button label switches dynamically between "Back to Trail" / "Back to Games" based on nodeId presence

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing test failures (5 test files) unrelated to changes: ArcadeRhythmGame.test.js, NoteSpeedCards.test.js, NotesRecognitionGame.autogrow.test.js, SightReadingGame.micRestart.test.jsx, AppSettings.cleanup.test.jsx. Verified same failures exist without any changes. Production build passes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 19 is fully complete (both plans done)
- All game exit flows now use context-aware React Router navigation
- Milestone v3.1 Trail-First Navigation is ready for closure

## Self-Check: PASSED

All 7 modified files exist. Both task commits (3303060, 43ee89f) verified in git log.

---
*Phase: 19-post-game-trail-return*
*Completed: 2026-04-05*
