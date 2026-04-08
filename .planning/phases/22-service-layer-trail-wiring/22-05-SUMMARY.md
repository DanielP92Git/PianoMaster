---
phase: 22-service-layer-trail-wiring
plan: "05"
subsystem: audio-context, rhythm-games
tags: [react, audio, pulse-exercise, gesture-gate, metronome, bug-fix]

requires:
  - phase: 22-service-layer-trail-wiring
    provides: "MetronomeTrainer pulseOnly mode (plan 03)"

provides:
  - "AudioContextProvider micEverRequestedRef guard prevents false isInterrupted on pages without mic"
  - "Pulse exercise gesture gate: always shows tap-to-start before audio plays"
  - "Overlay priority: gesture gate takes precedence over interrupted overlay"
  - "Pulse mode looping metronome with first-tap-triggers-bar-completion flow"
  - "Pulse scoring: only beats from first-tap to end-of-bar are evaluated"

affects:
  - "AudioContextProvider visibilitychange handler — now checks micEverRequestedRef instead of streamRef"
  - "MetronomeTrainer handleTap — pulse-specific branch snaps to nearest beat (any, not downbeat)"
  - "MetronomeTrainer startContinuousMetronome — pulse piano sounds integrated into beat loop"

tech-stack:
  added: []
  patterns:
    - "micEverRequestedRef guard: track whether mic was ever requested to prevent false-positive interrupted state"
    - "Pulse first-tap: snap to nearest beat, rebuild patternInfoRef with zeroed pre-tap beats for correct scoring"

key-files:
  created: []
  modified:
    - "src/contexts/AudioContextProvider.jsx"
    - "src/components/games/rhythm-games/MetronomeTrainer.jsx"

key-decisions:
  - "Used micEverRequestedRef (never reset) instead of streamRef to guard visibilitychange handler — once mic is requested, the guard stays active even after releaseMic()"
  - "Pulse mode snaps to nearest beat (any) not nearest downbeat, so child can tap on beat 2 or 3 and still get scored from that point"
  - "Pattern reduced to ONE bar (beatsPerMeasure) instead of pulseBeatCount beats — scoring is per-bar, not per-session"
  - "Pre-tap beats zeroed in patternInfoRef.pattern so evaluatePerformance only scores from first-tap onward"
  - "Also updated else-if branch in visibilitychange to allow silent resume when mic was never requested and context is running"

requirements-completed: [CURR-05]

duration: 11min
completed: "2026-04-08"
---

# Phase 22 Plan 05: Pulse Exercise Bug Fixes Summary

**Fix three compounding pulse exercise bugs: false Paused modal, missing gesture gate, and pre-scheduled-then-auto-evaluate timing flow replaced with looping metronome and first-tap-triggers-bar-completion**

## Performance

- **Duration:** ~11 min
- **Started:** 2026-04-08T20:05:54Z
- **Completed:** 2026-04-08T20:17:10Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

### Task 1: AudioContextProvider false positive fix + gesture gate + overlay priority
- Added `micEverRequestedRef` to AudioContextProvider, set `true` on first `requestMic()` call, never reset
- Changed visibilitychange handler condition from `streamRef.current && !tracksLive` to `micEverRequestedRef.current && !tracksLive` -- prevents false `isInterrupted` when mic was never requested (pulse exercise)
- Updated else-if branch to allow silent resume when mic never requested: `(!micEverRequestedRef.current || tracksLive)`
- Added `pulseOnly` check before AudioContext state check in auto-start useEffect -- pulse exercises always show gesture gate
- Changed interrupted overlay visibility from `isInterrupted` to `isInterrupted && !needsGestureToStart` so gesture gate takes priority

### Task 2: Pulse timing redesign -- looping metronome with first-tap-triggers-bar-completion
- Removed entire pre-scheduled pulse block from `startContinuousMetronome` (the `if (pulseOnly) {...}` block that pre-fired N beats and auto-evaluated)
- Integrated continuous piano C4 sound into the simple-time beat scheduling loop -- plays on every beat via `audioEngine.playPianoSound(0.6, pulsePitch)` with visual pulse flash
- Changed pulse pattern from `pulseBeatCount * unitsPerBeat` slots to `beatsPerMeasure * unitsPerBeat` (ONE bar)
- Added pulse-specific first-tap branch in `handleTap`: snaps to nearest beat (any, not just downbeat), calculates `beatInMeasure` position, rebuilds expected taps from first-tap beat onward
- Zeros out pre-tap beats in `patternInfoRef.current.pattern` so `evaluatePerformance` only scores from first-tap
- Schedules bar completion: `stopContinuousMetronome()` at measure end, `evaluatePerformance()` 200ms later

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix AudioContextProvider false positive + gesture gate + overlay priority | 31d40c4 | AudioContextProvider.jsx, MetronomeTrainer.jsx |
| 2 | Redesign pulse timing -- looping metronome with first-tap-triggers-bar-completion | 706769f | MetronomeTrainer.jsx |

## Files Modified

| File | Changes |
|------|---------|
| `src/contexts/AudioContextProvider.jsx` | Added micEverRequestedRef, updated visibilitychange handler conditions |
| `src/components/games/rhythm-games/MetronomeTrainer.jsx` | Gesture gate for pulse, overlay priority, looping piano C4, one-bar pattern, pulse handleTap branch |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical] Updated else-if branch in visibilitychange handler**
- **Found during:** Task 1
- **Issue:** The `else if (ctx?.state === "running" && tracksLive)` branch would fail when mic was never requested (`tracksLive` is false when no stream exists), causing unnecessary `resumeAudio()` calls
- **Fix:** Changed to `(!micEverRequestedRef.current || tracksLive)` so pages without mic get silent resume
- **Files modified:** src/contexts/AudioContextProvider.jsx
- **Commit:** 31d40c4

## Verification

- All tests pass (6 pre-existing failures in unrelated files confirmed on base commit)
- `npm run build` passes successfully
- No new test failures introduced

## Self-Check: PASSED

- All source files exist: AudioContextProvider.jsx, MetronomeTrainer.jsx
- SUMMARY.md created at expected path
- Commit 31d40c4 found (Task 1)
- Commit 706769f found (Task 2)
