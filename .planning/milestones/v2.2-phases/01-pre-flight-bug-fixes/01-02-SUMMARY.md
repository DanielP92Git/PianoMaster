---
phase: 01-pre-flight-bug-fixes
plan: 02
subsystem: ui
tags: [react, trail, accidentals, sharps, flats, auto-grow, tdd]

requires: []
provides:
  - Trail sessions now derive enableSharps/enableFlats from notePool and pass to games
  - NotesRecognitionGame consumes trail accidental flags instead of hardcoding false
  - SightReadingGame consumes trail accidental flags for auto-configure
  - Auto-grow boundary guard prevents natural->accidental note injection
  - filterAutoGrowCandidates exported and tested with full boundary coverage
affects:
  - 01-pre-flight-bug-fixes
  - any future phase using trail navigation state
  - any future phase modifying auto-grow logic

tech-stack:
  added: []
  patterns:
    - "Trail sessions derive enableSharps/enableFlats from notePool in TrailNodeModal, pass via location.state"
    - "Games read trailEnableSharps/trailEnableFlats from location.state with ?? false fallback for free play"
    - "filterAutoGrowCandidates pure helper at module scope — easy to test and reuse"
    - "Auto-grow boundary: natural sessions cannot receive accidentals; accidental sessions grow freely"

key-files:
  created:
    - src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js
  modified:
    - src/components/trail/TrailNodeModal.jsx
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx
    - src/components/games/sight-reading-game/SightReadingGame.jsx

key-decisions:
  - "Flag derivation from notePool in TrailNodeModal (not inside games) keeps curriculum authority in one place"
  - "trailEnableSharps/trailEnableFlats default to false via ?? so free-play mode is unaffected"
  - "filterAutoGrowCandidates exported from module scope (Approach A) for pure-function testability"
  - "Auto-grow skips entire accidentals nodes for natural sessions rather than picking arbitrary note"

patterns-established:
  - "TrailNodeModal flag derivation pattern: notePool.some(n => n.includes('#')) for enableSharps"
  - "location.state?.flag ?? false pattern for optional trail overrides that don't affect free play"
  - "getNextPedagogicalNote advances searchNodeId when filtered candidate pool is empty"

requirements-completed: [FIX-01]

duration: 10min
completed: 2026-03-15
---

# Phase 01 Plan 02: Trail Accidental Flags + Auto-Grow Boundary Guard Summary

**Trail accidental flags derived from notePool and passed via navigation state to both games, with auto-grow boundary guard preventing natural-notes sessions from receiving accidentals**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-15T13:00:00Z
- **Completed:** 2026-03-15T13:08:57Z
- **Tasks:** 2 (Task 1 auto, Task 2 TDD with RED/GREEN commits)
- **Files modified:** 4 (3 source files, 1 new test file)

## Accomplishments
- TrailNodeModal now derives `enableSharps` and `enableFlats` from `exercise.config.notePool` and includes them in every `navState` object passed to `navigate()`
- NotesRecognitionGame reads `trailEnableSharps`/`trailEnableFlats` from `location.state` and uses them in the auto-configure useEffect instead of the hardcoded `false, false`
- SightReadingGame reads the same flags and includes them in `trailSettings` during auto-configure
- `filterAutoGrowCandidates` pure helper exported at module scope; 9 boundary test cases all pass
- `getNextPedagogicalNote` now skips nodes whose entire candidate set is accidentals for natural-only sessions

## Task Commits

Each task was committed atomically:

1. **Task 1: Derive and pass enableSharps/enableFlats in TrailNodeModal + consume in both games** - `00d09c5` (feat)
2. **Task 2 RED: Failing auto-grow boundary tests** - `07b4b0d` (test)
3. **Task 2 GREEN: filterAutoGrowCandidates + boundary guard in getNextPedagogicalNote** - `52e899d` (feat)

_Note: Task 2 used TDD — separate RED commit then GREEN commit._

## Files Created/Modified
- `src/components/trail/TrailNodeModal.jsx` - Added notePool-derived `enableSharps`/`enableFlats` derivation and included in `navState`
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` - Reads trail flags from location.state; adds `filterAutoGrowCandidates` helper at module scope; wires boundary guard into `getNextPedagogicalNote`
- `src/components/games/sight-reading-game/SightReadingGame.jsx` - Reads trail flags from location.state; includes them in `trailSettings`
- `src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` - 9 boundary test cases for `filterAutoGrowCandidates` (natural/accidental session combinations + edge cases)

## Decisions Made
- Derived flags in TrailNodeModal (not in the games) to keep curriculum authority centralized — the modal knows the exercise config, the games just consume it
- Used `?? false` fallback for both flags so free-play mode (where `location.state` is null) is completely unaffected
- Chose Approach A (export pure helper at module scope) over Approach B (component behavior test) for cleaner testability
- Auto-grow skips an entire node if all its new candidates are filtered (rather than returning null immediately), allowing the search to continue to later nodes that might have naturals

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both trail accidental bugs are now fixed. Trail sessions for accidentals nodes (e.g. F#4, C#4) will correctly show those notes as answer options.
- Natural-notes sessions are protected from auto-grow contamination.
- Phase 01 plan 02 complete — ready to advance to Phase 02.

---
*Phase: 01-pre-flight-bug-fixes*
*Completed: 2026-03-15*
