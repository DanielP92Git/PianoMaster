---
phase: 08
plan: 02
subsystem: rhythm-games
tags: [rhythm, vexflow, tap-scoring, animation, audio, games]
dependency_graph:
  requires: [08-01]
  provides: [RhythmReadingGame, RhythmStaffDisplay, FloatingFeedback, CountdownOverlay, rhythmScoringUtils]
  affects: [rhythm-mode routes, trail nodes with rhythm_reading exercise type]
tech_stack:
  added: []
  patterns:
    - VexFlow SVG rhythm-only rendering (b/4 notes, stems up, automatic beaming)
    - RAF cursor sweep via direct DOM mutation (not React state — GPU compositor path)
    - audioContext.currentTime for tap capture clock (not Date.now)
    - scoreTap pure function extracted to utils for unit testability
    - hasAutoStartedRef trail auto-start guard (MetronomeTrainer pattern)
key_files:
  created:
    - src/components/games/rhythm-games/RhythmReadingGame.jsx
    - src/components/games/rhythm-games/RhythmReadingGame.test.js
    - src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx
    - src/components/games/rhythm-games/components/FloatingFeedback.jsx
    - src/components/games/rhythm-games/components/CountdownOverlay.jsx
    - src/components/games/rhythm-games/components/RhythmStaffDisplay.test.js
    - src/components/games/rhythm-games/utils/rhythmScoringUtils.js
  modified:
    - src/locales/en/common.json (add rhythmReading + rhythmDictation i18n keys)
    - src/locales/he/common.json (add Hebrew translations for same keys)
decisions:
  - scoreTap extracted to rhythmScoringUtils.js (not inline in component) to avoid Supabase chain in test imports
  - useAccessibility wrapped in try/catch matching MetronomeTrainer useSessionTimeout pattern
  - RhythmReadingGame.test.js imports scoreTap from utils (not component) for same reason
  - Cursor div is a sibling ref outside RhythmStaffDisplay to enable direct style mutations from RAF
metrics:
  duration: "~11 minutes"
  completed: "2026-03-27"
  tasks: 2
  files: 9
---

# Phase 8 Plan 02: RhythmReadingGame — Tap-Along Rhythm Game Summary

VexFlow rhythm notation + indigo cursor sweep + count-in + PERFECT/GOOD/MISS tap scoring via audioContext.currentTime, completing through VictoryScreen after 10 exercises.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create RhythmStaffDisplay, FloatingFeedback, CountdownOverlay sub-components | de908c0 | RhythmStaffDisplay.jsx, FloatingFeedback.jsx, CountdownOverlay.jsx, RhythmStaffDisplay.test.js, en/he common.json |
| 2 | Create RhythmReadingGame main component with full game loop and tap scoring tests | 35b5049 | RhythmReadingGame.jsx, RhythmReadingGame.test.js, rhythmScoringUtils.js |

## What Was Built

### RhythmReadingGame (RTAP-01 through RTAP-05)

Full tap-along rhythm game following MetronomeTrainer structural template:

- **GAME_PHASES FSM**: SETUP → COUNT_IN → PLAYING → FEEDBACK → SESSION_COMPLETE
- **RTAP-01**: VexFlow renders 1-measure rhythm pattern with all notes on b/4, stems forced up
- **RTAP-02**: Indigo cursor div sweeps left-to-right via `requestAnimationFrame` + direct DOM `style.left` mutation, synced to `audioContext.currentTime`
- **RTAP-03**: Count-in schedules N metronome oscillator clicks, visual 3-2-1-GO countdown using `setTimeout` intervals of `(60/tempo)*1000`ms
- **RTAP-04**: `onPointerDown` captures `ctx.currentTime`, finds nearest scheduled beat, scores via `calculateTimingThresholds(tempo)` thresholds (PERFECT/GOOD/MISS)
- **RTAP-05**: 10 exercises per session, scores accumulated, transitions to VictoryScreen with `nodeId + exerciseIndex` for trail progress

### Sub-components

- **RhythmStaffDisplay**: VexFlow SVG renderer, cursor overlay (`bg-indigo-400`, glow shadow skipped when `reducedMotion`), note color update via `tapResults` DOM mutation
- **FloatingFeedback**: `PERFECT` (green-400) / `GOOD` (yellow-400) / `MISS` (red-400) floating text, `translateY(-40px) opacity-0` over 800ms ease-out, `aria-live="polite"`
- **CountdownOverlay**: `fixed inset-0 z-50`, `text-3xl font-bold`, yellow for numbers / green for GO!, `animate-pulse` (skipped when `reducedMotion`)

### rhythmScoringUtils.js

Pure `scoreTap` function: searches scheduledBeatTimes from `nextBeatIndex`, calculates `deltaMs`, returns PERFECT/GOOD/MISS + `newNextBeatIndex` to prevent double-scoring.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Extracted scoreTap to separate utility module**

- **Found during**: Task 2 — test run failed with "Missing VITE_SUPABASE_URL" because RhythmReadingGame.jsx imports react-router/react components which transitively pull in Supabase services
- **Issue**: Inline `export function scoreTap` inside the component file makes it impossible to test without the full React + Supabase context
- **Fix**: Created `src/components/games/rhythm-games/utils/rhythmScoringUtils.js` as a pure module with no React or service imports. Component imports from there. Tests import from there directly.
- **Files modified**: RhythmReadingGame.jsx (import + remove inline), utils/rhythmScoringUtils.js (new)
- **Commit**: 35b5049 (included in Task 2 commit)

## Test Results

```
Test Files: 2 passed (2)
Tests:      12 passed (12)
  - RhythmReadingGame.test.js: 8 tests (scoreTap PERFECT/GOOD/MISS paths)
  - RhythmStaffDisplay.test.js: 4 tests (smoke tests + beatsToVexNotes)
```

## Build Status

Build succeeds (`npm run build` exit 0). Large chunk warnings are pre-existing, not caused by this plan.

## Known Stubs

None. All game phases are fully wired. The setup screen Start button calls `startGame()` which fetches a real pattern from `RhythmPatternGenerator`. The count-in, playing, and feedback phases all execute real logic.

## Self-Check: PASSED

All 7 created files exist. Both task commits (de908c0, 35b5049) confirmed in git log.
