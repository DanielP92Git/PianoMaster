---
phase: 08-design-data-modeling
plan: 02
subsystem: audio
tags: [pitch-detection, mic-input, bpm, timing, scoring, dedup]

# Dependency graph
requires:
  - phase: 08-design-data-modeling
    plan: 01
    provides: calcMicTimingFromBpm exported from micInputPresets.js (PIPE-01/02)
affects:
  - SightReadingGame mic detection timing (now BPM-adaptive)
  - NotesRecognitionGame mic detection timing (now BPM-adaptive)
  - both games' scoring layers (per-note dedup prevents double-scoring)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "micTiming useMemo: gameSettings.tempo fed to calcMicTimingFromBpm, result spread into useMicNoteInput"
    - "lastScoredRef dedup: { pitch, time } ref blocks same-pitch re-scoring within minInterOnMs*2 window"
    - "NotesRecognitionGame fallback: settings.tempo || settings.bpm || 90 — always has a BPM value"

key-files:
  created: []
  modified:
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx

key-decisions:
  - "SightReadingGame uses gameSettings.tempo as BPM source with MIC_INPUT_PRESETS.sightReading as explicit fallback when tempo is absent"
  - "NotesRecognitionGame uses settings.tempo || settings.bpm || 90 — always computes from BPM, no preset fallback needed"
  - "Dedup window is minInterOnMs*2 — double the minimum inter-onset to block held-note re-triggers without blocking legitimate repeated melody notes"
  - "micTiming added to handleNoteEvent/handleMicNoteEvent useCallback dep arrays — callbacks rebuild when BPM changes"
  - "MIC_INPUT_PRESETS unused in NotesRecognitionGame (removed from import) — game always has a BPM value via fallback"

requirements-completed: [PIPE-05, PIPE-06]

# Metrics
duration: ~2min
completed: 2026-02-22
---

# Phase 08 Plan 02: Game Component BPM Wiring Summary

**BPM-derived timing wired from game settings into useMicNoteInput in both games, plus per-note scoring dedup guards blocking same-pitch double-scoring**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-22T18:14:17Z
- **Completed:** 2026-02-22T18:16:42Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `calcMicTimingFromBpm` import and `micTiming` useMemo to `SightReadingGame.jsx` — `gameSettings.tempo` now drives mic detection timing (PIPE-05). Falls back to `MIC_INPUT_PRESETS.sightReading` when no BPM is available.
- Added `calcMicTimingFromBpm` import and `micTiming` useMemo to `NotesRecognitionGame.jsx` — `settings.tempo` (or 90 BPM default) now drives mic detection timing (PIPE-05). Timing params spread into `useMicNoteInput` while preserving the `analyserNode`/`sampleRate` call-time override pattern (ARCH-04).
- Added `lastScoredRef` and per-note dedup guards in both `handleNoteEvent` (SightReading) and `handleMicNoteEvent` (NotesRecognition) — blocks same-pitch double-scoring within `minInterOnMs * 2` window (PIPE-06).

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire BPM timing and per-note dedup into SightReadingGame** - `3316948` (feat)
2. **Task 2: Wire BPM timing and per-note dedup into NotesRecognitionGame** - `a6026ab` (feat)

## Files Created/Modified

- `src/components/games/sight-reading-game/SightReadingGame.jsx` - Added `calcMicTimingFromBpm` import, `micTiming` useMemo, replaced `...MIC_INPUT_PRESETS.sightReading` spread with `...micTiming`, added `lastScoredRef` + dedup guard in `handleNoteEvent`
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` - Added `calcMicTimingFromBpm` import, `micTiming` useMemo with 90 BPM fallback, spread `...micTiming` into `useMicNoteInput`, added `lastScoredRef` + dedup guard in `handleMicNoteEvent`

## Decisions Made

- `SightReadingGame` uses `MIC_INPUT_PRESETS.sightReading` as fallback when `gameSettings.tempo` is absent — covers edge cases where settings haven't loaded yet
- `NotesRecognitionGame` always computes from BPM via `settings.tempo || settings.bpm || 90` — no preset fallback needed; `MIC_INPUT_PRESETS` import removed
- Dedup window of `minInterOnMs * 2` chosen to block held-note re-triggers while allowing legitimate repeated notes in a melody
- `micTiming` added to `useCallback` dep arrays for both handlers — ensures callbacks rebuild when tempo changes (correct React semantics)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Removed unused MIC_INPUT_PRESETS import from NotesRecognitionGame**
- **Found during:** Task 2 verification
- **Issue:** Plan spec said to import `{ calcMicTimingFromBpm, MIC_INPUT_PRESETS }` but NotesRecognitionGame always computes from BPM (no preset fallback path), leaving `MIC_INPUT_PRESETS` unused
- **Fix:** Changed import to `{ calcMicTimingFromBpm }` only — no functional change, avoids lint warning
- **Files modified:** NotesRecognitionGame.jsx

## Issues Encountered

Pre-existing test failure: `SightReadingGame.micRestart.test.jsx` (1 of 4 test files, 1 of 30 tests) — confirmed pre-existing before Phase 08. All other 29 tests pass.

## User Setup Required

None.

## Next Phase Readiness

- PIPE-05 and PIPE-06 complete — BPM context flows from game settings to detection hooks in both games with per-note dedup
- Phase 08 complete — all 2 plans delivered (PIPE-01 through PIPE-06)
- Ready for Phase 09 (audio reliability / iOS recovery) or Phase 10 (AudioWorklet profiling)

## Self-Check: PASSED

- SUMMARY.md: FOUND
- Commit 3316948 (Task 1): FOUND
- Commit a6026ab (Task 2): FOUND

---
*Phase: 08-design-data-modeling*
*Completed: 2026-02-22*
