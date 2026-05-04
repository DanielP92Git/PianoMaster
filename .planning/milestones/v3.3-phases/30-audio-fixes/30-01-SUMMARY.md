---
phase: 30-audio-fixes
plan: "01"
subsystem: rhythm-games/audio
tags: [audio, tdd, bug-fix, web-audio-api]
requirements: [AUDIO-01, AUDIO-02]

dependency_graph:
  requires: []
  provides:
    - RhythmDictationQuestion audio initialization guard
    - Unit tests for AUDIO-02 first-click fix
  affects:
    - src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx
    - src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx

tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN cycle for audio initialization guard
    - await initializeAudioContext() before resumeAudioContext() pattern

key_files:
  created:
    - src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx
  modified:
    - src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx

decisions:
  - Test 4 changed from "shows Playing..." to "shows Listening..." — the button is hidden during LISTENING phase so "Playing..." text is never visible; the instruction text "Listening..." is the correct observable signal

metrics:
  duration_seconds: 325
  completed_date: "2026-04-13"
  tasks_completed: 2
  files_changed: 2
---

# Phase 30 Plan 01: Fix RhythmDictationQuestion Audio First-Click Bug Summary

Fixed the dictation game's silent first-click bug by calling `initializeAudioContext()` before `resumeAudioContext()` in `handleListen`, guaranteeing `gainNodeRef.current` is set before `createPianoSound` is invoked.

## Tasks Completed

| Task | Name                                                           | Commit  | Files                                                            |
| ---- | -------------------------------------------------------------- | ------- | ---------------------------------------------------------------- |
| 1    | Create RhythmDictationQuestion test scaffold (TDD RED)         | dc7f2c4 | `renderers/__tests__/RhythmDictationQuestion.test.jsx` (created) |
| 2    | Fix handleListen with initializeAudioContext guard (TDD GREEN) | 0bd485f | `renderers/RhythmDictationQuestion.jsx` (modified)               |

## What Was Built

### AUDIO-01 + AUDIO-02 Fix

**Root cause:** When `RhythmDictationQuestion` uses a `sharedAudioContext`, `resumeAudioContext()` skips calling `initializeAudioContext()` because `audioContextRef.current` is already non-null. However, `gainNodeRef.current` is only set inside `initializeAudioContext()`. This means `createPianoSound()` receives a null `gainNodeRef` on first call, silently returns null, and produces no audio.

**Fix:** Added `await audioEngine.initializeAudioContext()` before `await audioEngine.resumeAudioContext()` in `handleListen`. Since `initializeAudioContext` is idempotent (checks `isInitialized` state and short-circuits on subsequent calls), this has zero performance cost on repeat listens.

**iOS Safety:** Both calls happen inside the click handler, so `ctx.resume()` is initiated within the user gesture tick — the iOS Safari audio activation constraint is preserved.

### Test Coverage

4 tests in `RhythmDictationQuestion.test.jsx`:

1. `calls initializeAudioContext before first listen click plays audio` — asserts `mockEngine.initializeAudioContext` was called
2. `calls resumeAudioContext after initializeAudioContext` — asserts ordering via call order tracking
3. `renders Listen button in LISTEN_PROMPT phase` — structural test
4. `shows Listening... instruction text when audio is playing after listen click` — phase transition test

## Deviations from Plan

### Auto-adjusted Test Assertion

**1. [Rule 1 - Bug] Test 4 expectation corrected from "Playing..." to "Listening..."**

- **Found during:** Task 1 RED phase
- **Issue:** Plan spec said assert `screen.getByText("Playing...")` but the component's "Playing..." text is inside the Listen/Replay button, which is hidden in the `LISTENING` phase. After clicking Listen, `phase` transitions to `LISTENING` (which hides the button), so "Playing..." is never in the DOM.
- **Fix:** Changed assertion to `screen.getByText("Listening...")` — the instruction `<p>` element that IS visible during LISTENING phase.
- **Files modified:** `RhythmDictationQuestion.test.jsx`
- **Commit:** dc7f2c4

## Known Stubs

None. All component data is wired from the `question` prop.

## Threat Flags

None. Pure client-side audio timing fix with no network calls, no PII, no auth paths.

## Self-Check: PASSED

- `src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx` — exists, all 4 tests pass
- `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx` — contains `initializeAudioContext`
- Commits dc7f2c4 and 0bd485f — verified in git log
