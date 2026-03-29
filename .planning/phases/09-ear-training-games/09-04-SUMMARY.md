---
phase: 09-ear-training-games
plan: 04
subsystem: ui
tags: [react, routing, i18n, ear-training, trail, react-router]

# Dependency graph
requires:
  - phase: 09-ear-training-games
    plan: 02
    provides: NoteComparisonGame.jsx (full game component with GAME_PHASES FSM)
  - phase: 09-ear-training-games
    plan: 03
    provides: IntervalGame.jsx (full game component with Step/Skip/Leap classification)

provides:
  - App.jsx: lazy imports + LANDSCAPE_ROUTES + AudioContextProvider-wrapped Route registrations for both ear training games
  - TrailNodeModal.jsx: pitch_comparison and interval_id navigate to actual game routes (not /coming-soon)
  - en/common.json: noteComparison and intervalGame i18n keys (full game content + card entries)
  - he/common.json: Hebrew noteComparison and intervalGame i18n keys (full game content + card entries)
  - All 7 existing game handleNextExercise functions: pitch_comparison and interval_id routing cases

affects:
  - 09-05 (Phase 10 trail data: can now register ear_training nodes pointing at /ear-training-mode/* routes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Ear training routes follow same pattern as rhythm-mode routes (lazyWithRetry + AudioContextProvider wrapper)
    - LANDSCAPE_ROUTES array extended for ear training game paths
    - handleNextExercise cross-game routing: consistent pattern across all 7 game components
    - Cherry-pick pattern: bring foundation files from parallel worktree commits into integration worktree

key-files:
  created:
    - src/components/games/ear-training-games/NoteComparisonGame.jsx (cherry-picked from 09-02)
    - src/components/games/ear-training-games/IntervalGame.jsx (cherry-picked from 09-03)
    - src/components/games/ear-training-games/earTrainingUtils.js (cherry-picked from 09-01/09-03)
    - src/components/games/ear-training-games/components/PianoKeyboardReveal.jsx (cherry-picked)
    - src/components/games/ear-training-games/NoteComparisonGame.test.js (cherry-picked)
    - src/components/games/ear-training-games/IntervalGame.test.js (cherry-picked)
    - src/components/games/ear-training-games/earTrainingUtils.test.js (cherry-picked)
    - src/components/games/ear-training-games/PianoKeyboardReveal.test.jsx (cherry-picked)
  modified:
    - src/App.jsx
    - src/components/trail/TrailNodeModal.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
    - src/components/games/rhythm-games/MetronomeTrainer.jsx
    - src/components/games/rhythm-games/RhythmReadingGame.jsx
    - src/components/games/rhythm-games/RhythmDictationGame.jsx
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx
    - src/components/games/notes-master-games/MemoryGame.jsx
    - src/components/games/notes-master-games/NoteSpeedCards.jsx
    - src/components/games/sight-reading-game/SightReadingGame.jsx

key-decisions:
  - "Ear training game files cherry-picked from parallel worktree branches into integration worktree (Plans 02/03 ran in separate worktrees)"
  - "Ear training routes use /ear-training-mode/* path prefix (consistent with /rhythm-mode/* and /notes-master-mode/*)"
  - "All 7 existing game handleNextExercise functions now handle pitch_comparison and interval_id — full cross-game trail chaining supported"
  - "rhythm_reading self-route in RhythmReadingGame uses replace:true + reload; cross-game rhythm_reading/rhythm_dictation navigates normally (no replace/reload)"

patterns-established:
  - "Integration worktree cherry-pick pattern: when foundation files exist on parallel worktree branches, use git cherry-pick --no-commit to stage files before committing as part of integration task"
  - "handleNextExercise completeness: all game components must handle all exercise types (pitch_comparison, interval_id, rhythm_reading, rhythm_dictation, etc.) for full trail chaining"

requirements-completed: [PITCH-01, PITCH-02, PITCH-04, PITCH-05, INTV-01, INTV-04, INTV-05]

# Metrics
duration: 15min
completed: 2026-03-29
---

# Phase 9 Plan 04: Route Integration + i18n + Cross-Game Trail Chaining Summary

**Both ear training games fully wired into App.jsx routing, TrailNodeModal navigation updated from /coming-soon to actual game routes, EN+HE i18n keys added, and all 7 existing game handleNextExercise functions extended with pitch_comparison and interval_id cases**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-29T08:10:00Z
- **Completed:** 2026-03-29T08:24:00Z
- **Tasks:** 2
- **Files modified:** 11 (+ 8 cherry-picked foundation files)

## Accomplishments

- App.jsx updated with:
  - `const NoteComparisonGame = lazyWithRetry(...)` and `const IntervalGame = lazyWithRetry(...)` imports
  - `/ear-training-mode/note-comparison-game` and `/ear-training-mode/interval-game` added to `LANDSCAPE_ROUTES`
  - Both routes registered with `<AudioContextProvider>` wrappers in protected routes section

- TrailNodeModal.jsx: `pitch_comparison` and `interval_id` cases now navigate to `/ear-training-mode/note-comparison-game` and `/ear-training-mode/interval-game` respectively (no longer go to `/coming-soon`)

- EN/HE locale files updated with full `noteComparison` and `intervalGame` i18n key sets (game content + card entries)

- All 7 existing game handleNextExercise/handleNextTrailExercise functions updated:
  - MetronomeTrainer, NotesRecognitionGame, MemoryGame: added rhythm_reading, rhythm_dictation, pitch_comparison, interval_id
  - RhythmReadingGame: added rhythm_dictation, pitch_comparison, interval_id
  - RhythmDictationGame, SightReadingGame: added pitch_comparison, interval_id
  - NoteSpeedCards: added rhythm_reading, rhythm_dictation, pitch_comparison, interval_id

- 72 ear training tests all passing (NoteComparisonGame: 8, IntervalGame: 10, earTrainingUtils: 28, PianoKeyboardReveal: 26)

## Task Commits

1. **Task 1: Register routes, update trail routing, add i18n keys** - `15bbed5` (feat)
2. **Task 2: Update handleNextExercise in all 7 game components** - `81aa3ca` (feat)

## Files Created/Modified

- `src/App.jsx` - Lazy imports, LANDSCAPE_ROUTES, route registrations for both ear training games
- `src/components/trail/TrailNodeModal.jsx` - pitch_comparison and interval_id now route to actual game routes
- `src/locales/en/common.json` - noteComparison and intervalGame keys (English)
- `src/locales/he/common.json` - noteComparison and intervalGame keys (Hebrew)
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` - handleNextExercise: +4 cases
- `src/components/games/rhythm-games/RhythmReadingGame.jsx` - handleNextExercise: +3 cases
- `src/components/games/rhythm-games/RhythmDictationGame.jsx` - handleNextExercise: +2 cases
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` - handleNextExercise: +4 cases
- `src/components/games/notes-master-games/MemoryGame.jsx` - handleNextExercise: +4 cases
- `src/components/games/notes-master-games/NoteSpeedCards.jsx` - handleNextExercise: +4 cases
- `src/components/games/sight-reading-game/SightReadingGame.jsx` - handleNextTrailExercise: +4 cases

Cherry-picked foundation files (from Plans 02/03 worktrees):
- `src/components/games/ear-training-games/NoteComparisonGame.jsx`
- `src/components/games/ear-training-games/IntervalGame.jsx`
- `src/components/games/ear-training-games/earTrainingUtils.js`
- `src/components/games/ear-training-games/components/PianoKeyboardReveal.jsx`
- `src/components/games/ear-training-games/NoteComparisonGame.test.js`
- `src/components/games/ear-training-games/IntervalGame.test.js`
- `src/components/games/ear-training-games/earTrainingUtils.test.js`
- `src/components/games/ear-training-games/PianoKeyboardReveal.test.jsx`

## Decisions Made

- Ear training game files cherry-picked from parallel worktree branches (Plans 02/03 ran in different worktrees, files needed in this integration worktree)
- Ear training routes use `/ear-training-mode/*` prefix for consistency with `/rhythm-mode/*` and `/notes-master-mode/*`
- `rhythm_reading` self-routing in RhythmReadingGame: uses `replace:true + window.location.reload()` (same-route remount pattern); cross-game routing navigates normally without replace/reload
- All 7 game components now have complete handleNextExercise coverage for all exercise types introduced through Plan 09

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cherry-picked ear training foundation files from parallel worktree branches**
- **Found during:** Task 1 (npm run build failed with "Could not resolve ./components/games/ear-training-games/NoteComparisonGame")
- **Issue:** NoteComparisonGame.jsx, IntervalGame.jsx, and supporting files (earTrainingUtils.js, PianoKeyboardReveal.jsx, tests) were created in Plans 02/03 which ran in different parallel worktrees. This integration worktree (agent-aad94887) did not have those files.
- **Fix:** Used `git cherry-pick ced9331 704c3ee 0258b6a 237926f 7eeea20 --no-commit` to stage all 8 ear training files from the parallel worktree commits, then included them in the Task 1 commit.
- **Files modified:** All 8 ear-training-games/ files
- **Verification:** Build succeeded after cherry-pick, all 72 ear training tests passing
- **Committed in:** 15bbed5 (included in Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking: missing foundation files from parallel worktree)
**Impact on plan:** Essential — routes cannot resolve without the game component files. Cherry-pick is the correct parallel worktree integration pattern.

## Issues Encountered

- Parallel worktree isolation: Plans 02/03 game files were committed to their own worktree branches and not yet merged to main. Cherry-pick resolved this cleanly by selectively importing only the relevant commits without modifying the branch structure.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both ear training games are fully navigable from URL (`/ear-training-mode/note-comparison-game`, `/ear-training-mode/interval-game`)
- TrailNodeModal will navigate to the actual games when a trail node with `pitch_comparison` or `interval_id` exercise type is tapped
- All cross-game trail chaining is complete — any trail node mixing ear training with other exercise types will route correctly
- Phase 10 (ear training trail data): can now register actual trail nodes with `pitch_comparison` and `interval_id` exercise types, confident the routes exist and are functional

## Known Stubs

None — all routes point to fully-implemented game components (NoteComparisonGame, IntervalGame) with real audio playback, real scoring, and real VictoryScreen/trail integration.

## Self-Check: PASSED

- FOUND: src/App.jsx contains NoteComparisonGame lazyWithRetry import
- FOUND: src/App.jsx contains IntervalGame lazyWithRetry import
- FOUND: src/App.jsx contains /ear-training-mode/note-comparison-game in LANDSCAPE_ROUTES
- FOUND: src/App.jsx contains /ear-training-mode/interval-game in LANDSCAPE_ROUTES
- FOUND: src/App.jsx contains Route path="/ear-training-mode/note-comparison-game"
- FOUND: src/App.jsx contains Route path="/ear-training-mode/interval-game"
- FOUND: TrailNodeModal.jsx pitch_comparison navigates to /ear-training-mode/note-comparison-game
- FOUND: TrailNodeModal.jsx interval_id navigates to /ear-training-mode/interval-game
- FOUND: en/common.json contains noteComparison and intervalGame keys under games
- FOUND: he/common.json contains noteComparison and intervalGame keys under games
- FOUND: he/common.json noteComparison.title = "השוואת צלילים"
- FOUND: he/common.json intervalGame.step = "שלב"
- FOUND commit: 15bbed5 (Task 1 - routes + i18n + cherry-pick)
- FOUND commit: 81aa3ca (Task 2 - handleNextExercise updates)
- Build: PASSED (npm run build exits 0)
- Tests: 72/72 ear training tests passing, 447 total tests passing

---
*Phase: 09-ear-training-games*
*Completed: 2026-03-29*
