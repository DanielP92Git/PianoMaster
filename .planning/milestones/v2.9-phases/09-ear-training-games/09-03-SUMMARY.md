---
phase: 09-ear-training-games
plan: 03
subsystem: ui
tags: [react, audio, ear-training, vitest, tailwind, web-audio, piano-synthesis]

# Dependency graph
requires:
  - phase: 09-ear-training-games/09-01
    provides: earTrainingUtils.js (generateIntervalQuestion, classifyInterval, getNotesInBetween), PianoKeyboardReveal SVG component

provides:
  - IntervalGame.jsx: full game FSM with Step/Skip/Leap classification, ascending-first question ordering, piano keyboard reveal with in-between key dim-highlights
  - IntervalGame.test.js: 10 unit tests all passing

affects:
  - 09-04 (trail data + routes must register /ear-training/interval-game route)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Game FSM pattern: SETUP→LISTENING→CHOOSING→FEEDBACK→SESSION_COMPLETE (consistent with RhythmDictationGame)
    - Sequential note playback via AudioContext.currentTime scheduling (note1 at now, note2 at now + NOTE_DURATION + NOTE_GAP)
    - Ascending-first progression delegated entirely to generateIntervalQuestion utility (no inline logic in component)

key-files:
  created:
    - src/components/games/ear-training-games/IntervalGame.jsx
    - src/components/games/ear-training-games/IntervalGame.test.js
  modified: []

key-decisions:
  - "classifyInterval not directly imported — generateIntervalQuestion returns category field internally, no duplicate calls"
  - "DEFAULT_ASCENDING_RATIO=0.6 constant matches D-10 spec; overridable via nodeConfig.ascendingRatio for trail configuration"
  - "intervalLabel format: 'SKIP — C4 to E4' (em dash, uppercase category, note names) per D-08"
  - "subLabel: 'Jumped over D4' for 1 in-between note, 'N notes between' for multiple, null for adjacent notes (step)"
  - "handleNextExercise includes both pitch_comparison and interval_id routing for full ear training trail support"

patterns-established:
  - "Sequential interval playback: playNote(note1) + playNote(note2, {startTime: now + NOTE_DURATION + NOTE_GAP})"
  - "Test mocking: usePianoSampler mock must export NOTE_FREQS object (required by earTrainingUtils module load)"
  - "i18n mock for BackButton: useTranslation must return i18n: { dir: () => 'ltr' } to prevent dir() crash in tests"

requirements-completed: [INTV-01, INTV-02, INTV-03, INTV-04, INTV-05]

# Metrics
duration: 15min
completed: 2026-03-29
---

# Phase 9 Plan 03: IntervalGame Summary

**IntervalGame component with Step/Skip/Leap three-button vertical layout, ascending-first question ordering (60% ascending), and PianoKeyboardReveal with dim in-between key highlights + interval label**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-29T11:07:00Z
- **Completed:** 2026-03-29T11:12:00Z
- **Tasks:** 2
- **Files created:** 2 (+ 4 carried from Plan 01)

## Accomplishments

- IntervalGame.jsx: 640 lines, full game lifecycle from setup through VictoryScreen
- Three answer buttons (Step/Skip/Leap) stacked vertically with inline hint text ("next door", "jump one", "far apart") per D-06/D-07
- Ascending-first ordering via `generateIntervalQuestion(qIndex, 10, 0.6)` — first 6 of 10 questions forced ascending per D-10
- Piano keyboard reveal using `PianoKeyboardReveal` with `showInBetween={true}` highlighting keys between note1 and note2 per D-08
- Interval label ("SKIP — C4 to E4") and subLabel ("Jumped over D4") rendered below keyboard
- Full trail integration: `hasAutoStartedRef`, `handleNextExercise` routing for all 9 exercise types including `pitch_comparison` and `interval_id`
- 10 passing tests covering setup screen, all three buttons + hints, LISTENING disabled state, keyboard reveal, VictoryScreen, audio playback

## Task Commits

Each task was committed atomically:

1. **Task 1: Build IntervalGame component** - `ced9331` (feat)
2. **Task 2: Create IntervalGame test file** - `704c3ee` (test)
3. **Lint fix: unused import** - `0258b6a` (fix)

_Note: Foundation files from Plan 01 (earTrainingUtils.js, PianoKeyboardReveal.jsx, test files) were cherry-picked into this worktree branch and included in Task 1 commit._

## Files Created/Modified

- `src/components/games/ear-training-games/IntervalGame.jsx` - Full game component: FSM, interval audio playback, Step/Skip/Leap buttons, keyboard reveal, trail integration
- `src/components/games/ear-training-games/IntervalGame.test.js` - 10 unit tests, all passing

## Decisions Made

- `classifyInterval` not imported directly in component — `generateIntervalQuestion` already returns `category` field (calling classifyInterval internally), so no need to duplicate
- `DEFAULT_ASCENDING_RATIO = 0.6` matches D-10; overridable via `nodeConfig.ascendingRatio` for trail difficulty tuning
- `intervalLabel` format: uppercase category + em dash + note names (e.g., "SKIP — C4 to E4") — uses `\u2014` for cross-browser em dash
- `subLabel` logic: 1 note between → "Jumped over D4"; 2+ notes → "N notes between"; 0 notes (step) → null

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `classifyInterval` import causing lint failure**
- **Found during:** Post-task lint check
- **Issue:** `classifyInterval` was imported but not called directly (it's used internally by `generateIntervalQuestion`)
- **Fix:** Removed from import statement
- **Files modified:** `src/components/games/ear-training-games/IntervalGame.jsx`
- **Committed in:** `0258b6a`

**2. [Rule 3 - Blocking] Updated usePianoSampler mock to export NOTE_FREQS**
- **Found during:** Task 2 test run
- **Issue:** `earTrainingUtils.js` imports `NOTE_FREQS` from `usePianoSampler` at module load — test mock needed to export it or the test suite failed to parse
- **Fix:** Added `NOTE_FREQS` object to vi.mock for usePianoSampler in test file
- **Files modified:** `src/components/games/ear-training-games/IntervalGame.test.js`
- **Committed in:** `704c3ee`

**3. [Rule 3 - Blocking] Added i18n.dir mock to fix BackButton crash in tests**
- **Found during:** Task 2 test run
- **Issue:** `BackButton.jsx` calls `i18n.dir()` but the standard react-i18next mock only returned `t` function, causing `Cannot read properties of undefined (reading 'dir')` crash
- **Fix:** Extended react-i18next mock to include `i18n: { dir: () => 'ltr', language: 'en' }`
- **Files modified:** `src/components/games/ear-training-games/IntervalGame.test.js`
- **Committed in:** `704c3ee`

---

**Total deviations:** 3 auto-fixed (1 unused import, 2 blocking test setup)
**Impact on plan:** All fixes necessary for lint compliance and test execution. No scope creep.

## Issues Encountered

- Test file mock for `usePianoSampler` needed `NOTE_FREQS` export because `earTrainingUtils.js` calls `Object.keys(NOTE_FREQS)` at module scope during import — resolved automatically.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04 (trail data + subscription config + routes): Can register `/ear-training/interval-game` route with `IntervalGame` component
- Both ear training games are now implemented (NoteComparisonGame from Plan 02, IntervalGame from Plan 03)
- i18n keys needed: `games.intervalGame.{step,skip,leap,stepHint,skipHint,leapHint,title,description,question,listening,correct,wrong,startGame,playAgain,jumpedOver,jumpedOverMultiple}` — using defaultValue fallbacks until Plan 04 adds them

## Known Stubs

None — IntervalGame fully wires to `generateIntervalQuestion` for real note pairs, real audio playback via `usePianoSampler`, and real `PianoKeyboardReveal` with live note data. All i18n keys use defaultValue fallbacks (not stubs — functional without translation).

## Self-Check: PASSED

- FOUND: src/components/games/ear-training-games/IntervalGame.jsx
- FOUND: src/components/games/ear-training-games/IntervalGame.test.js
- FOUND commit: ced9331 (Task 1 - IntervalGame component)
- FOUND commit: 704c3ee (Task 2 - test file)
- FOUND commit: 0258b6a (lint fix)
- Test run: 10/10 passing

---
*Phase: 09-ear-training-games*
*Completed: 2026-03-29*
