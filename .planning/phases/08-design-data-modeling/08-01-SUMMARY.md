---
phase: 08-design-data-modeling
plan: 01
subsystem: audio
tags: [pitch-detection, mic-input, fsm, bpm, timing, midi]

# Dependency graph
requires:
  - phase: 07-audio-architecture
    provides: useMicNoteInput, usePitchDetection, AudioContextProvider shared analyser (ARCH-02/03)
provides:
  - calcMicTimingFromBpm(bpm, shortestNoteDuration) exported from micInputPresets.js
  - IDLE/ARMED/ACTIVE FSM inside useMicNoteInput replacing ad-hoc candidateFrames
  - MIN_MIDI = 45 in usePitchDetection covering A2/B2 bass trail notes
affects:
  - 08-02 (game components wiring BPM context via calcMicTimingFromBpm)
  - any game component using useMicNoteInput (NotesRecognitionGame, SightReadingGame)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "calcMicTimingFromBpm: BPM-to-frame-timing formula — onFrames=15%/16.7ms, offMs=40%, changeFrames=onFrames+1, minInterOnMs=25%"
    - "FSM enum at module scope — const FSM = { IDLE, ARMED, ACTIVE } — transitions inside stateRef.current"

key-files:
  created: []
  modified:
    - src/hooks/micInputPresets.js
    - src/hooks/useMicNoteInput.js
    - src/hooks/usePitchDetection.js

key-decisions:
  - "calcMicTimingFromBpm uses 60fps assumption (16.7ms/frame) — consistent with existing onFrames semantics"
  - "MIN_MIDI lowered from 48 (C3) to 45 (A2) — required for bass trail notes A2 and B2 to pass frequencyToNote filter"
  - "FSM ARMED→IDLE on silence emits no noteOff — noteOn was never sent so no paired noteOff is needed"
  - "ARMED state resets candidateNote on different pitch (not back to IDLE) — keeps onset detection active without re-arming overhead"
  - "debug object adds fsmState field — zero external API change, observability only"

patterns-established:
  - "FSM pattern: module-scope FSM enum + fsmState field in stateRef + explicit if/else state dispatch in callbacks"
  - "BPM timing formula: all timing params derived from noteMs with minimum floors (2 frames / 60ms / 40ms)"

requirements-completed: [PIPE-01, PIPE-02, PIPE-03, PIPE-04]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 08 Plan 01: Detection Pipeline Foundation Summary

**BPM-adaptive mic timing calculator, IDLE/ARMED/ACTIVE FSM refactor for useMicNoteInput, and MIN_MIDI lowered to A2 for bass trail note coverage**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-22T18:08:19Z
- **Completed:** 2026-02-22T18:11:39Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `calcMicTimingFromBpm(bpm, shortestNoteDuration)` to `micInputPresets.js` — returns dynamic `{ onFrames, offMs, changeFrames, minInterOnMs }` scaling with tempo (PIPE-01, PIPE-02)
- Refactored `useMicNoteInput` to use formal `FSM = { IDLE, ARMED, ACTIVE }` enum with explicit state transitions in `handlePitchDetected` and `handleLevelChange` (PIPE-03)
- Lowered `MIN_MIDI` from 48 (C3) to 45 (A2) in `usePitchDetection.js` — bass trail notes A2 and B2 now pass through `frequencyToNote` (PIPE-04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create calcMicTimingFromBpm utility and lower MIN_MIDI** - `7f4a2e5` (feat)
2. **Task 2: Refactor useMicNoteInput to formal IDLE/ARMED/ACTIVE FSM** - `ed91205` (feat)

## Files Created/Modified

- `src/hooks/micInputPresets.js` - Added `calcMicTimingFromBpm` export; `MIC_INPUT_PRESETS` object unchanged
- `src/hooks/usePitchDetection.js` - Changed `MIN_MIDI` from 48 to 45; updated JSDoc range description
- `src/hooks/useMicNoteInput.js` - Added `FSM` enum, `fsmState` field in stateRef, rewrote `handlePitchDetected` and `handleLevelChange` with FSM transitions; added `fsmState` to debug object

## Decisions Made

- `calcMicTimingFromBpm` uses 16.7ms/frame (60fps) — consistent with the existing `onFrames` semantics already in use by presets
- MIN_MIDI lowered from C3 to A2 — smallest change needed to unblock bass trail notes without widening to B1 or below
- ARMED→IDLE on silence emits no noteOff — noteOn was never emitted from ARMED so no paired event is needed
- ARMED state resets candidateNote on different pitch but stays ARMED — avoids returning to IDLE which would waste the already-armed state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failure in `SightReadingGame.micRestart.test.jsx` (1 of 4 test files) — confirmed pre-existing before this plan's changes by running tests on stashed state. All other tests (29/30) pass. This failure is documented in STATE.md blockers.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Foundation layer complete: `calcMicTimingFromBpm` available for Plan 02 game component BPM wiring
- `useMicNoteInput` FSM ready for Plan 02 to pass dynamic timing params without internal changes
- Bass trail notes A2/B2 detectable — trail integration can proceed
- Plan 02 (`08-02-PLAN.md`) can begin immediately

---
*Phase: 08-design-data-modeling*
*Completed: 2026-02-22*
