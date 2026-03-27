---
phase: 08-audio-infrastructure-rhythm-games
plan: 04
subsystem: infra
tags: [react, react-router, i18n, pwa, service-worker, rhythm-games]

# Dependency graph
requires:
  - phase: 08-02
    provides: RhythmReadingGame component
  - phase: 08-03
    provides: RhythmDictationGame component
provides:
  - Route registration for /rhythm-mode/rhythm-reading-game and /rhythm-mode/rhythm-dictation-game
  - TrailNodeModal navigation from rhythm_tap/rhythm_dictation to real game routes
  - Complete EN+HE i18n coverage for both rhythm games
  - Service worker cache bumped to pianomaster-v9
affects:
  - Phase 09 (ear training games — will follow same routing pattern)
  - Phase 11 (arcade rhythm — will follow same routing pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - New rhythm game routes wrapped in AudioContextProvider at route level (same as MetronomeTrainer)
    - Both rhythm game routes added to LANDSCAPE_ROUTES for consistent orientation lock

key-files:
  created: []
  modified:
    - src/App.jsx
    - src/components/trail/TrailNodeModal.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
    - public/sw.js

key-decisions:
  - "Both rhythm game routes in LANDSCAPE_ROUTES — RhythmReadingGame is landscape-locked; RhythmDictationGame portrait-primary but included for consistent layout handling"
  - "navState passed unchanged to rhythm game routes — already contains nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType"

patterns-established:
  - "New game routes: lazyWithRetry import + LANDSCAPE_ROUTES entry + Route wrapped in AudioContextProvider"
  - "TrailNodeModal: each new exercise type gets its own navigate() case pointing to real route (not /coming-soon)"

requirements-completed: [INFRA-07, INFRA-08, RTAP-05, RDICT-06]

# Metrics
duration: 8min
completed: 2026-03-27
---

# Phase 08 Plan 04: Route Integration + i18n Summary

**Both rhythm games wired into app routing via lazyWithRetry + AudioContextProvider, trail navigation updated from ComingSoon to real routes, complete EN+HE i18n added, service worker bumped to v9**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-27T22:50:00Z
- **Completed:** 2026-03-27T22:56:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Registered `/rhythm-mode/rhythm-reading-game` and `/rhythm-mode/rhythm-dictation-game` routes in App.jsx with AudioContextProvider wrappers
- Added both routes to LANDSCAPE_ROUTES for orientation lock
- Updated TrailNodeModal `rhythm_tap` and `rhythm_dictation` cases to navigate to real game routes (not /coming-soon)
- Added 86 lines of EN+HE i18n covering game titles, tap feedback, countdown, errors, and game card descriptions
- Bumped service worker cache to pianomaster-v9 for clean PWA update

## Task Commits

Each task was committed atomically:

1. **Task 1: Register routes, update trail navigation, and bump service worker cache** - `8388fd1` (feat)
2. **Task 2: Add complete i18n keys for rhythm games in English and Hebrew** - `c997a02` (feat)

## Files Created/Modified

- `src/App.jsx` - Added lazyWithRetry imports for RhythmReadingGame/RhythmDictationGame, LANDSCAPE_ROUTES entries, Route elements wrapped in AudioContextProvider
- `src/components/trail/TrailNodeModal.jsx` - Updated rhythm_tap/rhythm_dictation cases to navigate to real routes
- `src/locales/en/common.json` - Added games.rhythmReading, games.rhythmDictation, games.cards.rhythmReading, games.cards.rhythmDictation
- `src/locales/he/common.json` - Added matching Hebrew translations for all new keys
- `public/sw.js` - Bumped CACHE_NAME from pianomaster-v8 to pianomaster-v9

## Decisions Made

None - followed plan as specified. navState construction in TrailNodeModal was kept unchanged; it already contains the correct trail state shape.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Pre-existing lint errors in `Dashboard.jsx` (fetchpriority) and `ParentZoneEntryCard.test.jsx` (await outside async) are out of scope — not in files modified by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both rhythm games are fully reachable from trail and direct URL
- AudioContextProvider wrapped at route level — games must NOT add AudioContextProvider internally
- i18n keys follow games.metronomeTrainer nesting pattern — Phase 09 ear training games should follow same convention
- Service worker v9 deployed — PWA users will receive clean update on next visit

---
*Phase: 08-audio-infrastructure-rhythm-games*
*Completed: 2026-03-27*
