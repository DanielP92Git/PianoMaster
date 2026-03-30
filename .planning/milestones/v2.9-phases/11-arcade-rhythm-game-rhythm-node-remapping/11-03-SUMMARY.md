---
phase: 11-arcade-rhythm-game-rhythm-node-remapping
plan: 03
subsystem: routing
tags: [react-router, trail-integration, game-routing, handleNextExercise]

requires:
  - phase: 11-arcade-rhythm-game-rhythm-node-remapping
    plan: 01
    provides: ArcadeRhythmGame component
  - phase: 11-arcade-rhythm-game-rhythm-node-remapping
    plan: 02
    provides: Remapped rhythm node data with arcade_rhythm exercise types

provides:
  - App.jsx route registration (lazy import, LANDSCAPE_ROUTES, Route element)
  - AppLayout.jsx gameRoutes entry (sidebar/header hiding)
  - TrailNodeModal arcade_rhythm routing (no longer goes to ComingSoon)
  - arcade_rhythm case in all 9 game handleNextExercise switches

affects:
  - All rhythm trail nodes (now reachable end-to-end through correct game types)
  - Cross-game trail chaining (arcade_rhythm exercises chain correctly)

tech-stack:
  added: []
  patterns:
    - "Dual array registration: LANDSCAPE_ROUTES (App.jsx) + gameRoutes (AppLayout.jsx) for every game route"
    - "handleNextExercise switch extension: same navigate pattern across all 9 game components"

key-files:
  created: []
  modified:
    - src/App.jsx
    - src/components/layout/AppLayout.jsx
    - src/components/trail/TrailNodeModal.jsx
    - src/components/games/rhythm-games/MetronomeTrainer.jsx
    - src/components/games/rhythm-games/RhythmReadingGame.jsx
    - src/components/games/rhythm-games/RhythmDictationGame.jsx
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx
    - src/components/games/notes-master-games/MemoryGame.jsx
    - src/components/games/notes-master-games/NoteSpeedCards.jsx
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/components/games/ear-training-games/NoteComparisonGame.jsx
    - src/components/games/ear-training-games/IntervalGame.jsx
    - CLAUDE.md
---

## What was built

Wired ArcadeRhythmGame into the app's routing and trail navigation system:

1. **Route registration** (App.jsx): Lazy import, LANDSCAPE_ROUTES entry, Route element with AudioContextProvider wrapper
2. **AppLayout gameRoutes** (AppLayout.jsx): Added arcade-rhythm-game and note-speed-cards to gameRoutes array for sidebar/header hiding during gameplay
3. **TrailNodeModal fix**: Changed arcade_rhythm case from ComingSoon redirect to actual game route (`/rhythm-mode/arcade-rhythm-game`)
4. **handleNextExercise integration**: Added `case 'arcade_rhythm'` to all 9 existing game components so multi-exercise trail nodes can chain through arcade rhythm exercises
5. **ArcadeRhythmGame improvements** (from testing): Pixel-based tile positioning (instead of vh), AudioContext gesture handling, stale closure ref fixes, tile fade-out animation
6. **CLAUDE.md update**: Documented ear-training-mode in game routes section, added CRITICAL note about dual array requirement

## Deviations

- AppLayout.jsx gameRoutes update was not in the original plan but is CRITICAL per CLAUDE.md (both LANDSCAPE_ROUTES and gameRoutes arrays must have every game route)
- ArcadeRhythmGame improvements (pixel positioning, gesture handling) were discovered during manual testing and committed as part of this plan
- CLAUDE.md documentation update added to prevent future routing gaps

## Self-Check: PASSED

- [x] ArcadeRhythmGame route registered in App.jsx (lazy import + LANDSCAPE_ROUTES + Route element)
- [x] AppLayout.jsx gameRoutes includes arcade-rhythm-game
- [x] TrailNodeModal routes arcade_rhythm to /rhythm-mode/arcade-rhythm-game
- [x] All 9 game components have arcade_rhythm case in handleNextExercise
- [x] `npm run lint` — clean
- [x] `npm run verify:trail` — passed (XP variance warning is pre-existing)
- [x] `npm run build` — production build succeeds
- [x] `npm run test:run` — all pass except 2 known deferred failures (rhythmUnit7/8 test expectations)
- [x] Human verified: correct game types open from trail nodes

## Known Issues (deferred)

1. **rhythmUnit7/8 test failures**: Test expectations still assert all-RHYTHM but data now uses mixed types (from Plan 02)
2. **Trail config → game difficulty mapping**: Trail nodes use `difficulty: 'easy'` but pattern generator expects `'beginner'`/`'intermediate'`/`'advanced'`. Also `rhythmPatterns` field in node configs is never read by any game. Documented in `deferred-items.md`.
