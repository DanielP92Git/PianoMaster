---
phase: 01-introductory-single-note-game
plan: 01
subsystem: ui
tags: [react, trail, i18n, vitest, note-recognition]

# Dependency graph
requires: []
provides:
  - NOTE_CATCH exercise type constant in EXERCISE_TYPES
  - treble_1_1 and bass_1_1 nodes updated to use note_catch exercise type
  - NoteSpeedCards stub component with exported pure functions (generateCardSequence, getSpeedForCard, calculateScore)
  - TrailNodeModal routes note_catch to /notes-master-mode/note-speed-cards
  - App.jsx lazy route at /notes-master-mode/note-speed-cards
  - i18n strings in en + he for note_catch exercise type and all game copy
  - Wave 0 test scaffolds for constants and NoteSpeedCards pure functions (17 tests GREEN)
affects: [01-02-PLAN, trail-routing, note-speed-cards-game]

# Tech tracking
tech-stack:
  added: []
  patterns: [TDD Wave 0 test scaffolds, pure-function exports for testability, lazy route without AudioContextProvider for tap-only games]

key-files:
  created:
    - src/data/constants.test.js
    - src/components/games/notes-master-games/NoteSpeedCards.test.js
    - src/components/games/notes-master-games/NoteSpeedCards.jsx
  modified:
    - src/data/constants.js
    - src/data/units/trebleUnit1Redesigned.js
    - src/data/units/bassUnit1Redesigned.js
    - src/components/trail/TrailNodeModal.jsx
    - src/App.jsx
    - src/locales/en/trail.json
    - src/locales/he/trail.json
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "NoteSpeedCards stub created in Plan 01 (not Plan 02) because Vite resolves dynamic imports at build time — lazy imports still fail build if module does not exist"
  - "Pure functions (generateCardSequence, getSpeedForCard, calculateScore) exported from stub so NoteSpeedCards.test.js turns GREEN immediately instead of staying RED"
  - "NoteSpeedCards route does NOT use AudioContextProvider — game uses screen tap only, no mic input"
  - "Speed ramp: 4 tiers — 2000ms learning, 1500ms warming up, 1200ms challenge, 1000ms fast"
  - "Session: 20 total cards, 5 targets (25% target ratio) — age-appropriate for 8-year-olds"

patterns-established:
  - "Pure function exports: game pure functions exported from component file for unit testability (pattern from NotesRecognitionGame.autogrow.test.js)"
  - "Wave 0 scaffold: test files created before implementation to establish TDD contracts"

requirements-completed: [REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-08, REQ-09]

# Metrics
duration: 6min
completed: 2026-03-25
---

# Phase 01 Plan 01: Wire NOTE_CATCH Trail Integration Summary

**NOTE_CATCH exercise type wired end-to-end: constant, node data, TrailNodeModal routing, App.jsx route, i18n strings, and NoteSpeedCards stub with all pure functions tested (17/17 GREEN)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-25T00:18:00Z
- **Completed:** 2026-03-25T00:24:16Z
- **Tasks:** 3 (Task 0, Task 1, Task 2)
- **Files modified:** 9 files + 3 created = 12 total

## Accomplishments
- Added `NOTE_CATCH: 'note_catch'` to EXERCISE_TYPES and updated treble_1_1 and bass_1_1 to use it with targetNote/distractorNotes config
- Wired full trail routing pipeline: TrailNodeModal routes note_catch to /notes-master-mode/note-speed-cards; App.jsx lazy import + route + LANDSCAPE_ROUTES entry
- Created NoteSpeedCards stub with pure functions (generateCardSequence, getSpeedForCard, calculateScore) — 17 tests GREEN, build passes
- Added all 22+ i18n keys in both English and Hebrew (trail exerciseTypes + complete noteSpeedCards namespace)

## Task Commits

Each task was committed atomically:

1. **Task 0: Wave 0 test scaffolds** - `4ea4d59` (test)
2. **Task 1: NOTE_CATCH constant + node data + i18n** - `63abcc4` (feat)
3. **Task 2: TrailNodeModal routing + App.jsx route + NoteSpeedCards stub** - `c58e663` (feat)

## Files Created/Modified
- `src/data/constants.js` — added NOTE_CATCH: 'note_catch' to EXERCISE_TYPES
- `src/data/constants.test.js` — Wave 0 tests for NOTE_CATCH constant and node data (5 tests GREEN)
- `src/data/units/trebleUnit1Redesigned.js` — treble_1_1 exercise changed to NOTE_CATCH with targetNote/distractorNotes config
- `src/data/units/bassUnit1Redesigned.js` — bass_1_1 exercise changed to NOTE_CATCH with bass-appropriate distractors
- `src/components/trail/TrailNodeModal.jsx` — added note_catch case to getExerciseTypeName and navigateToExercise switch
- `src/App.jsx` — added NoteSpeedCards lazy import, /notes-master-mode/note-speed-cards route, LANDSCAPE_ROUTES entry
- `src/components/games/notes-master-games/NoteSpeedCards.jsx` — stub with exported pure functions + placeholder component
- `src/components/games/notes-master-games/NoteSpeedCards.test.js` — 12 tests for pure functions (all GREEN)
- `src/locales/en/trail.json` — added note_catch: "Speed Cards" to exerciseTypes
- `src/locales/he/trail.json` — added note_catch: "קלפים מהירים" to exerciseTypes
- `src/locales/en/common.json` — added noteSpeedCards namespace (9 keys)
- `src/locales/he/common.json` — added noteSpeedCards namespace with Hebrew translations

## Decisions Made
- NoteSpeedCards stub created in Plan 01 (not Plan 02) because Vite resolves dynamic imports at build time — plan assumed lazy imports would not fail at build, but they do
- Pure functions exported from stub so all 12 NoteSpeedCards.test.js tests turn GREEN immediately, not RED
- Game route does NOT use AudioContextProvider — screen tap only, no mic/audio input

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Created NoteSpeedCards.jsx stub to fix build failure**
- **Found during:** Task 2 (App.jsx lazy route)
- **Issue:** Plan stated "the import is lazy so build won't fail" — but Vite's rollup bundler resolves ALL dynamic imports at build time. Running `npm run build` produced: `Could not resolve "./components/games/notes-master-games/NoteSpeedCards"`
- **Fix:** Created `NoteSpeedCards.jsx` stub with exported pure functions (so tests pass) and a placeholder component (so build succeeds). The pure functions implement the full contracts from the test file.
- **Files modified:** `src/components/games/notes-master-games/NoteSpeedCards.jsx` (created)
- **Verification:** `npm run build` passes; 12/12 NoteSpeedCards tests GREEN
- **Committed in:** `c58e663` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - build failure)
**Impact on plan:** Deviation improves plan outcome — stub is better than empty RED tests. Plan 02 will replace the stub component with the full game implementation; pure functions in stub are already the correct implementation.

## Known Stubs
- `src/components/games/notes-master-games/NoteSpeedCards.jsx` — Game component function returns placeholder `<div>Speed Cards — Coming Soon!</div>`. Pure functions are fully implemented. Plan 02 will implement the full game component.

## Issues Encountered
- None beyond the Vite build behavior documented in Deviations

## Next Phase Readiness
- All integration points ready: constant, node data, routing, App route, i18n
- Pure functions fully implemented and tested
- Plan 02 only needs to implement the NoteSpeedCards component body — replace the placeholder with the full game UI

---
*Phase: 01-introductory-single-note-game*
*Completed: 2026-03-25*
