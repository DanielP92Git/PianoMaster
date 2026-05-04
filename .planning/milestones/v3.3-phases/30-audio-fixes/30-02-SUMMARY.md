---
phase: 30-audio-fixes
plan: "02"
subsystem: rhythm-games/renderers
tags: [audio, tdd, bug-fix, eighth-notes, discovery]
dependency_graph:
  requires: []
  provides: [AUDIO-03-fix]
  affects: [DiscoveryIntroQuestion, schedulePatternPlayback]
tech_stack:
  added: []
  patterns: [pitch-alternating-wrapper, Array.from-beats-array]
key_files:
  created:
    - src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx
  modified:
    - src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx
decisions:
  - pitch-alternation-local: pitch-alternating wrapper is local to playDemo only; component-level enginePlayNote unchanged (D-07)
  - noteIndexRef-plain-object: used plain object { current: 0 } instead of useRef for noteIndexRef inside playDemo closure — avoids React hook rules
metrics:
  duration_minutes: 30
  completed_date: "2026-04-13"
  tasks_completed: 2
  files_modified: 2
---

# Phase 30 Plan 02: Eighths Discovery Demo Fix Summary

**One-liner:** Fixed 8_pair discovery demo to play 4 beamed pairs (8 eighth notes) with high/low pitch alternation using local pitch-alternating wrapper inside playDemo.

## What Was Built

Fixed `DiscoveryIntroQuestion.jsx` to correctly play the eighths discovery demo (AUDIO-03). The bug caused only 2 notes (1 pair) to play instead of 8 notes (4 pairs). Additionally added pitch alternation so each pair is aurally distinct (high-low), and added `initializeAudioContext` guard for reliable first-click audio.

## Tasks Completed

| Task | Name                                                          | Commit  | Files                                                                               |
| ---- | ------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| 1    | Create DiscoveryIntroQuestion test scaffold (RED)             | 733c262 | `renderers/__tests__/DiscoveryIntroQuestion.test.jsx`                               |
| 2    | Fix playDemo — 8-note beats array + pitch alternation (GREEN) | fa03701 | `renderers/DiscoveryIntroQuestion.jsx`, `__tests__/DiscoveryIntroQuestion.test.jsx` |

## Decisions Made

1. **Pitch alternation is local to playDemo only** — the component-level `enginePlayNote` callback is untouched. The alternating wrapper is created inside the `isBeamedPair` branch of `playDemo` per D-07 (pitch alternation is discovery-intro-only).

2. **Plain object for noteIndexRef** — used `{ current: 0 }` instead of `useRef` because the reference lives inside a `useCallback` closure. `useRef` is a React hook and cannot be called inside a conditional branch inside a hook body. A plain mutable object achieves the same result safely.

3. **initializeAudioContext added** — added before `resumeAudioContext()` to ensure gainNodeRef is populated on first click (same pattern as AUDIO-01/02 fix in Plan 01).

## Verification Results

```
npx vitest run src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx
  4 tests pass (GREEN)
  - schedules 8 eighth notes for 8_pair focusDuration ✓
  - uses pitch-alternating playNote for 8_pair ✓
  - schedules 4 quarter notes for quarter focusDuration (no pitch alternation) ✓
  - renders Got it! button ✓

npx vitest run src/components/games/rhythm-games/renderers/
  14 tests pass across 2 test files (no regressions in PulseQuestion)

npx vitest run src/components/games/rhythm-games/
  74 tests pass across 9 test files (8 pre-existing env errors in ArcadeRhythmGame.test.js unrelated to this plan)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test spy capture used wrong mock instance**

- **Found during:** Task 1 → Task 2 GREEN phase
- **Issue:** Test 2 called `useAudioEngine()` before `render()`, creating a separate mock instance with its own `createPianoSound` spy. The component's `playNoteFn` called `audioEngine.createPianoSound` on the instance returned during `render()`, not the pre-render instance.
- **Fix:** Replaced `useAudioEngine()` pre-render call with `useAudioEngine.mock.results[lastIndex].value` after render to get the spy from the component's actual audioEngine instance.
- **Files modified:** `renderers/__tests__/DiscoveryIntroQuestion.test.jsx`
- **Commit:** fa03701

## Known Stubs

None — all beats arrays are wired to real `schedulePatternPlayback` and `createPianoSound` calls.

## Threat Flags

None — pure client-side audio scheduling fix, no security surface.

## Self-Check: PASSED

- `src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx` exists: FOUND
- `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` contains `Array.from({ length: 8 }`: FOUND
- `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` contains `noteIndexRef.current % 2 === 0 ? 0 : -7`: FOUND
- `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` contains `await audioEngine.initializeAudioContext()`: FOUND
- Commit 733c262 (RED test scaffold): FOUND
- Commit fa03701 (GREEN fix): FOUND
