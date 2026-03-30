---
phase: 09-ear-training-games
plan: 02
subsystem: ui
tags: [react, audio, ear-training, game, vitest, tailwind, web-audio]

# Dependency graph
requires:
  - phase: 09-ear-training-games
    plan: 01
    provides: earTrainingUtils (generateNotePair, getTierForQuestion) + PianoKeyboardReveal SVG component

provides:
  - NoteComparisonGame.jsx: full game component (SETUP/LISTENING/CHOOSING/FEEDBACK/SESSION_COMPLETE FSM)
  - NoteComparisonGame.test.js: 8 unit tests (all passing)

affects:
  - 09-03 (IntervalGame follows same structural pattern)
  - 09-04 (trail/subscription config needs pitch_comparison exercise type registered)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - GAME_PHASES FSM pattern cloned from RhythmDictationGame (structural template)
    - Web Audio API dual-note scheduling via audioContextRef.currentTime + startTime offsets
    - Tier-band progression: questions 0-2 wide (6-12 semitones), 3-6 medium (3-5), 7-9 close (1-2)
    - D-05 reveal sequence: 100ms keyboard slide-in, CORRECT_PAUSE_MS/WRONG_PAUSE_MS before advance
    - STATE_CLASSES object for button visual states (default/correct/wrong/dimmed/disabled)
    - handleNextExercise full switch for all 9 exercise types including pitch_comparison and interval_id
    - hasAutoStartedRef pattern for one-time trail auto-start

key-files:
  created:
    - src/components/games/ear-training-games/NoteComparisonGame.jsx
    - src/components/games/ear-training-games/NoteComparisonGame.test.js
  modified: []

key-decisions:
  - "nextQuestion takes questionIndex directly (no prevCorrectCount needed — state already tracked)"
  - "React.createElement used in test mocks to avoid JSX in .test.js file (avoids .jsx rename)"
  - "NOTE_FREQS inlined in usePianoSampler mock factory to avoid vi.mock hoisting issues"
  - "react-i18next mock includes i18n.dir() for BackButton RTL compatibility"

patterns-established:
  - "NoteComparisonGame structural pattern: clone RhythmDictationGame FSM skeleton, adapt audio/UI"
  - "Test mock pattern: NOTE_FREQS inline in usePianoSampler factory to satisfy earTrainingUtils import"

requirements-completed: [PITCH-01, PITCH-02, PITCH-03, PITCH-04, PITCH-05]

# Metrics
duration: 10min
completed: 2026-03-29
---

# Phase 9 Plan 02: NoteComparisonGame Summary

**NoteComparisonGame component with GAME_PHASES FSM, Web Audio dual-note scheduling, tier-band narrowing (6-12 → 3-5 → 1-2 semitones), animated keyboard reveal, and VictoryScreen trail integration — 8 unit tests passing**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-03-29
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- `NoteComparisonGame.jsx` (523 lines): Full game component with GAME_PHASES FSM cloned from RhythmDictationGame structural template
  - SETUP: glass card + start button (standalone mode) or auto-start (trail mode)
  - LISTENING: two piano notes scheduled via Web Audio API currentTime offsets, replay button disabled
  - CHOOSING: HIGHER/LOWER buttons enabled with ArrowUp/ArrowDown icons, replay button active
  - FEEDBACK: green glow (correct) or red flash (wrong) + correct answer revealed + PianoKeyboardReveal slides in from bottom 100ms after selection
  - SESSION_COMPLETE: VictoryScreen with score/totalPossibleScore/nodeId/exerciseIndex/trailExerciseType props
  - `handleNextExercise` routes all 9 exercise types: note_recognition, sight_reading, memory_game, rhythm, rhythm_reading, rhythm_dictation, pitch_comparison, interval_id, boss_challenge
  - COMPARISON_TIERS: questions 0-2 (wide 6-12), 3-6 (medium 3-5), 7-9 (close 1-2) per D-09

- `NoteComparisonGame.test.js` (282 lines): 8 unit tests using React.createElement (no JSX) to stay as .js file
  - Renders setup screen with start button
  - Transitions to LISTENING on click
  - HIGHER/LOWER buttons present after note playback timeout
  - HIGHER button aria-label correct
  - LOWER button aria-label correct
  - Buttons disabled during LISTENING
  - VictoryScreen renders after 10 questions
  - Piano keyboard reveal shown after answer

## Task Commits

1. **Task 1: Build NoteComparisonGame component** - `237926f` (feat)
2. **Task 2: Create NoteComparisonGame test file** - `7eeea20` (test)

## Files Created/Modified

- `src/components/games/ear-training-games/NoteComparisonGame.jsx` - Full game component, 523 lines
- `src/components/games/ear-training-games/NoteComparisonGame.test.js` - 8 tests, all passing

## Decisions Made

- nextQuestion takes questionIndex directly (no prevCorrectCount needed — state already tracked in React state)
- React.createElement used in test mocks to avoid JSX syntax in .test.js file, preventing Rollup parse error
- NOTE_FREQS inlined in usePianoSampler mock factory to avoid vi.mock hoisting reference errors
- react-i18next mock extended with i18n.dir() for BackButton RTL compatibility

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed unused prevCorrectCount parameter in nextQuestion**
- **Found during:** Task 1 implementation + lint
- **Issue:** nextQuestion was receiving a prevCorrectCount param it never used, causing ESLint no-unused-vars warning
- **Fix:** Removed the parameter; correctCount is already tracked via React state
- **Files modified:** NoteComparisonGame.jsx
- **Commit:** 237926f (included in task commit)

**2. [Rule 1 - Bug] Test file required React.createElement instead of JSX**
- **Found during:** Task 2 test run
- **Issue:** .test.js file with JSX mocks triggers Rollup parse error ("JSX in .js file")
- **Fix:** Used React.createElement for VictoryScreen and PianoKeyboardReveal mocks
- **Files modified:** NoteComparisonGame.test.js
- **Commit:** 7eeea20

**3. [Rule 1 - Bug] NOTE_FREQS must be exported from usePianoSampler mock**
- **Found during:** Task 2 test run
- **Issue:** earTrainingUtils.js imports NOTE_FREQS from usePianoSampler; mock missing it causes import analysis error
- **Fix:** Inlined NOTE_FREQS object inside vi.mock factory (can't reference top-level var due to hoisting)
- **Files modified:** NoteComparisonGame.test.js
- **Commit:** 7eeea20

**4. [Rule 1 - Bug] react-i18next mock needed i18n.dir() for BackButton**
- **Found during:** Task 2 test run
- **Issue:** BackButton calls i18n.dir() to determine RTL; mock only had { t } causing "Cannot read properties of undefined (reading 'dir')"
- **Fix:** Added i18n: { dir: () => 'ltr', language: 'en' } to mock return value
- **Files modified:** NoteComparisonGame.test.js
- **Commit:** 7eeea20

## Known Stubs

None — all props are wired from real game state.

## Self-Check: PASSED

- FOUND: src/components/games/ear-training-games/NoteComparisonGame.jsx
- FOUND: src/components/games/ear-training-games/NoteComparisonGame.test.js
- FOUND commit: 237926f (feat(09-02))
- FOUND commit: 7eeea20 (test(09-02))

---
*Phase: 09-ear-training-games*
*Completed: 2026-03-29*
