---
phase: 08-audio-infrastructure-rhythm-games
plan: 03
subsystem: ui
tags: [react, vexflow, rhythm-games, audio, web-audio-api, dictation, game]

# Dependency graph
requires:
  - phase: 08-01
    provides: usePianoSampler hook, rhythmTimingUtils (generateDistractors, schedulePatternPlayback), rhythmVexflowHelpers (binaryPatternToBeats, beatsToVexNotes)
  - phase: 08-02
    provides: RhythmStaffDisplay VexFlow renderer sub-component (reused pattern), i18n keys for rhythmDictation namespace

provides:
  - RhythmDictationGame.jsx — complete hear-and-pick aural rhythm recognition game (RDICT-01 to RDICT-06)
  - DictationChoiceCard.jsx — selectable VexFlow notation card with 4 visual states (default/correct/wrong/dimmed)
  - RhythmDictationGame.test.js — 9 unit tests for distractor generation and choice tracking

affects:
  - App.jsx (route registration for /rhythm-mode/rhythm-dictation-game)
  - TrailNodeModal.jsx (already routes rhythm_dictation to ComingSoon — needs update to RhythmDictationGame)
  - Phase 10 (Ear Training Trail Data) — rhythm_dictation exercise type now playable

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DictationChoiceCard: VexFlow rendered inside a div-role-button with 4 state classes (default/correct/wrong/dimmed) from UI-SPEC"
    - "RhythmDictationGame FSM: SETUP → LISTENING → CHOOSING → FEEDBACK → SESSION_COMPLETE"
    - "schedulePatternPlayback auto-play on phase transition (LISTENING useEffect)"
    - "isPlayingRef ref + isPlaying state dual guard prevents double-play (D-08)"
    - "advanceQuestion closure increments question counter or triggers SESSION_COMPLETE"
    - "handleNextExercise mirrors MetronomeTrainer switch routing for all exercise types + rhythm_reading/rhythm_dictation"

key-files:
  created:
    - src/components/games/rhythm-games/components/DictationChoiceCard.jsx
    - src/components/games/rhythm-games/RhythmDictationGame.jsx
    - src/components/games/rhythm-games/RhythmDictationGame.test.js
  modified: []

key-decisions:
  - "DictationChoiceCard renders VexFlow directly (not RhythmStaffDisplay) at compact h-96px to avoid nested glass card wrappers"
  - "LISTENING phase useEffect triggers auto-play via playPattern callback; transition to CHOOSING after totalDuration+300ms"
  - "Wrong answer: 300ms red flash then reveal correct + auto-replay correct pattern; 2s total before advancing (D-09)"
  - "selectedIndex state prefixed _selectedIndex (unused in render — cardStates drives all visual feedback)"
  - "generateQuestion dep array is empty [] — all side-effectful deps passed as args to keep function stable"

patterns-established:
  - "Pattern 1: Hear-and-pick game structure — LISTENING auto-play → CHOOSING selection → FEEDBACK reveal → advance"
  - "Pattern 2: DictationChoiceCard state machine classes from UI-SPEC table applied via STATE_CLASSES lookup object"
  - "Pattern 3: playPattern callback wraps schedulePatternPlayback with isPlayingRef guard and timeout-based completion"

requirements-completed: [RDICT-01, RDICT-02, RDICT-03, RDICT-04, RDICT-05, RDICT-06]

# Metrics
duration: 4min
completed: 2026-03-27
---

# Phase 8 Plan 03: RhythmDictationGame Summary

**VexFlow hear-and-pick rhythm dictation game with 10-question sessions, piano-synthesized audio playback, 3-card distractor choices, and correct/wrong reveal feedback completing through VictoryScreen**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-27T22:45:58Z
- **Completed:** 2026-03-27T22:50:11Z
- **Tasks:** 2
- **Files modified:** 3 created

## Accomplishments

- DictationChoiceCard renders VexFlow rhythm notation with 4 visual states (default, correct green glow, wrong red flash, dimmed) per UI-SPEC choice card states table
- RhythmDictationGame implements complete RDICT-01–06 requirements: auto-play C4 piano pattern, replay button, 3 vertically-stacked VexFlow choices, distractor generation, correct/wrong reveal with auto-replay, VictoryScreen completion
- 9 unit tests covering distractor generation, measure duration preservation, shuffled correctIndex tracking, and schedulePatternPlayback timing shape — all passing

## Task Commits

1. **Task 1: DictationChoiceCard sub-component** - `bd92e03` (feat)
2. **Task 2: RhythmDictationGame + test file** - `9041624` (feat)

## Files Created/Modified

- `src/components/games/rhythm-games/components/DictationChoiceCard.jsx` — Selectable VexFlow notation card with 4 visual states; accessible button role; touch target min-h-[96px]; white SVG fill override for glassmorphism dark theme
- `src/components/games/rhythm-games/RhythmDictationGame.jsx` — 602-line game component with GAME_PHASES FSM, auto-play audio, replay button, card selection feedback loop, VictoryScreen integration, trail routing, iOS overlay handling
- `src/components/games/rhythm-games/RhythmDictationGame.test.js` — 9 Vitest tests for distractor logic and timing utilities

## Decisions Made

- DictationChoiceCard renders VexFlow directly (not via RhythmStaffDisplay wrapper) to avoid nested glass card styling conflicts at compact card height
- LISTENING useEffect drives auto-play when phase transitions — clean dependency on `[gamePhase, correctBeats]` rather than callbacks
- Wrong answer sequence: 300ms red → correct reveal + auto-replay → 2s total advance. This matches D-09 timing from CONTEXT.md
- `_selectedIndex` prefix for unused-in-render state (used in logic only) to satisfy ESLint no-unused-vars

## Deviations from Plan

None - plan executed exactly as written. Both tasks completed as specified. All RDICT requirements implemented.

## Issues Encountered

- Plan 01 and 02 outputs (usePianoSampler, rhythmTimingUtils, RhythmStaffDisplay) were on `main` branch but not yet merged into this worktree's branch. Resolved by merging `main` before starting implementation (deviation-free — standard multi-worktree coordination).

## Known Stubs

None — all game logic is fully wired. The game is functional end-to-end (subject to route registration in App.jsx and TrailNodeModal.jsx update, which are tracked separately per Phase 8 CONTEXT.md integration points).

## Next Phase Readiness

- RhythmDictationGame ready for route registration in `App.jsx` at `/rhythm-mode/rhythm-dictation-game`
- TrailNodeModal.jsx needs update to route `rhythm_dictation` exercise type to RhythmDictationGame (currently goes to ComingSoon)
- Phase 9 (Ear Training Games) can proceed — no blocking dependencies from this plan

---
*Phase: 08-audio-infrastructure-rhythm-games*
*Completed: 2026-03-27*
