---
phase: 09-ios-safari-hardening
plan: 02
subsystem: ui
tags: [audio, ios, safari, react, games, accessibility, i18n]

# Dependency graph
requires:
  - phase: 09-ios-safari-hardening plan 01
    provides: isIOSSafari utility, AudioContextProvider isInterrupted/handleTapToResume, AudioInterruptedOverlay component, i18n keys
provides:
  - AudioInterruptedOverlay wired into SightReadingGame, NotesRecognitionGame, MetronomeTrainer
  - Trail auto-start gesture gate for suspended/interrupted AudioContext
  - Start button synchronous resume() on all platforms
  - iOS-specific permission denial instructions in MicErrorOverlay
  - Exercise timer freeze during interruption
affects: [sight-reading-game, notes-recognition-game, metronome-trainer, mic-error-overlay]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "IOS-02: audioContextRef.current?.resume() as first call in startListeningSync/startAudioInput — before any await"
    - "Trail gesture gate: check ctx.state before auto-start, show overlay if suspended/interrupted"
    - "Timer freeze: useEffect watches isInterrupted to call pauseTimer/resumeTimer"
    - "iOS permission denial: conditional render of numbered Settings steps vs generic hint based on isIOSSafari"

key-files:
  created: []
  modified:
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx
    - src/components/games/rhythm-games/MetronomeTrainer.jsx
    - src/components/games/sight-reading-game/components/MicErrorOverlay.jsx

key-decisions:
  - "audioContextRef.current?.resume() called on ALL platforms in Start flows, not gated behind isIOSSafari — resume() is a no-op when already running"
  - "Trail gesture gate reuses AudioInterruptedOverlay for the tap-to-start prompt — avoids creating a separate overlay component"
  - "SightReadingGame inline isIOSSafari IIFE replaced with shared utility import from src/utils/isIOSSafari.js"
  - "Timer freeze via useEffect watching isInterrupted — same pattern as existing MicErrorOverlay timer handling"

patterns-established:
  - "Synchronous resume before mic: all game Start flows call ctx.resume() before await requestMic()"
  - "Trail gesture gate: detect suspended/interrupted ctx before auto-start, defer to user tap"

requirements-completed: [IOS-01, IOS-02, IOS-03, IOS-04]

# Metrics
duration: 7min
completed: 2026-03-03
---

# Phase 09 Plan 02: Game Integration, Gesture Gates, iOS Error UX Summary

**AudioInterruptedOverlay wired into all 3 game components, synchronous resume() on Start buttons, trail gesture gate, iOS-specific permission denial instructions in MicErrorOverlay**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-03T14:30:00Z
- **Completed:** 2026-03-03T14:37:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 4

## Accomplishments
- Wired AudioInterruptedOverlay into SightReadingGame, NotesRecognitionGame, and MetronomeTrainer — all show tap-to-resume overlay when isInterrupted is true
- Added synchronous audioContextRef.current?.resume() as first call in startListeningSync (SightReadingGame) and startAudioInput (NotesRecognitionGame) on ALL platforms
- Implemented trail auto-start gesture gate — detects suspended/interrupted AudioContext and shows tap-to-start overlay instead of silently failing
- Added iOS-specific numbered 5-step Settings instructions to MicErrorOverlay for permission denied state
- Added generic browser settings hint for non-iOS permission denied state
- Replaced inline isIOSSafari IIFE in SightReadingGame with shared utility import
- Added useEffect timer freeze during interruption for SightReadingGame and NotesRecognitionGame

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire AudioInterruptedOverlay into game components** - `2327366` (feat)
2. **Task 2: Add iOS-specific permission denial instructions to MicErrorOverlay** - `338553d` (feat)
3. **Task 3: Human verification checkpoint** - approved with notes (desktop quick-check passed; iOS device testing deferred to pre-deployment)

## Files Created/Modified
- `src/components/games/sight-reading-game/SightReadingGame.jsx` - AudioInterruptedOverlay, gesture gate, resume(), isIOSSafari import replacement
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` - AudioInterruptedOverlay, gesture gate, resume()
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` - AudioInterruptedOverlay, gesture gate, resume()
- `src/components/games/sight-reading-game/components/MicErrorOverlay.jsx` - iOS-specific permission steps, generic hint

## Decisions Made
- resume() called on ALL platforms (not iOS-gated) — no-op when AudioContext already running, ensures consistent behavior
- Gesture gate reuses AudioInterruptedOverlay component — consistent UX, no extra component needed
- Timer freeze uses same useEffect pattern as existing MicErrorOverlay timer handling

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

**Human verification notes:**
- Desktop quick-check passed (no console errors, games start normally)
- MicErrorOverlay permission denial test was inconclusive — existing MicErrorOverlay doesn't reliably trigger when mic is blocked mid-session on desktop Chrome. This is pre-existing behavior unrelated to Phase 09 changes.
- iOS Safari physical device testing deferred — no device available during verification. Will test before deployment.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All iOS Safari hardening requirements (IOS-01 through IOS-04) are implemented
- iOS device testing needed before production deployment
- Pre-existing MicErrorOverlay trigger reliability on desktop is a separate concern from Phase 09 scope

---
*Phase: 09-ios-safari-hardening*
*Completed: 2026-03-03*
