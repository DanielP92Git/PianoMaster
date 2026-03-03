---
phase: 09-ios-safari-hardening
plan: 01
subsystem: ui
tags: [audio, ios, safari, react, i18n, accessibility]

# Dependency graph
requires:
  - phase: 07-audio-context-provider
    provides: AudioContextProvider with suspend/resume foundation
provides:
  - isIOSSafari shared utility (src/utils/isIOSSafari.js)
  - AudioContextProvider isInterrupted state and handleTapToResume handler
  - AudioContextProvider streamRef exposed in context value
  - AudioInterruptedOverlay tap-to-resume component
  - All Phase 09 i18n keys (micInterrupted.*, micError.permissionDenied.ios.*, genericHint) in en + he
affects: [09-02-ios-safari-hardening, sight-reading-game, notes-recognition-game, metronome-trainer]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "IOS-01: onstatechange on AudioContext detects interrupted state via mount-time useEffect"
    - "IOS-02: handleTapToResume calls ctx.resume() synchronously (no await before) to satisfy iOS user-gesture requirement"
    - "IOS-03: visibilitychange handler checks MediaStreamTrack.readyState for dead tracks on foreground return"
    - "Retry-once fallback pattern in overlay: try onTapToResume(), catch, retry once, then show Restart Exercise"

key-files:
  created:
    - src/utils/isIOSSafari.js
    - src/components/games/shared/AudioInterruptedOverlay.jsx
  modified:
    - src/contexts/AudioContextProvider.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "onstatechange wired in mount-time useEffect (not in ref initializer block) so setIsInterrupted is in scope as stable state setter"
  - "handleTapToResume calls ctx.resume() synchronously before any await — no code between handler invocation and resume() call (IOS-02 requirement)"
  - "visibilitychange handler distinguishes interrupted/dead-track scenario (show overlay) from running+live scenario (silent no-op) from other scenario (silent resumeAudio)"
  - "AudioInterruptedOverlay uses bg-black/30 (lighter than MicErrorOverlay bg-black/50) — calmer visual for interruption vs error"
  - "Retry-once fallback: overlay retries onTapToResume once before showing Restart Exercise button"
  - "streamRef exposed in context value so game components can check track liveness without prop drilling"

patterns-established:
  - "iOS interruption recovery: onstatechange + visibilitychange track-check + tap-to-resume overlay form the full recovery chain"
  - "Synchronous resume pattern: call ctx.resume() before any await in user-gesture handler"

requirements-completed: [IOS-01, IOS-02, IOS-03]

# Metrics
duration: 3min
completed: 2026-03-03
---

# Phase 09 Plan 01: iOS Safari Interruption Detection Infrastructure Summary

**iOS Safari AudioContext interruption detection with tap-to-resume overlay: isInterrupted state, handleTapToResume (synchronous resume), dead-track detection via visibilitychange, and AudioInterruptedOverlay component with full en/he i18n**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-03T14:21:49Z
- **Completed:** 2026-03-03T14:25:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extracted `isIOSSafari` shared utility from inline SightReadingGame.jsx IIFE into `src/utils/isIOSSafari.js`
- Extended AudioContextProvider with `isInterrupted` state, `handleTapToResume` (IOS-02 synchronous resume), `streamRef` exposure, and `onstatechange` wiring (IOS-01)
- Updated `resumeAudio` and `getOrCreateAudioContext` to handle both 'suspended' and 'interrupted' AudioContext states
- Updated `visibilitychange` handler to detect dead MediaStreamTracks and trigger `isInterrupted` instead of silently resuming (IOS-03)
- Created `AudioInterruptedOverlay` with tap-to-resume, retry-once fallback, and Restart Exercise escape hatch
- Added all Phase 09 i18n keys to both en and he locales: `micInterrupted.*`, `micError.permissionDenied.ios.*`, `micError.permissionDenied.genericHint`

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract isIOSSafari utility and extend AudioContextProvider** - `cc8ba36` (feat)
2. **Task 2: Create AudioInterruptedOverlay and add all i18n keys** - `e48e297` (feat)

## Files Created/Modified
- `src/utils/isIOSSafari.js` - Shared iOS Safari UA detection, exported as named boolean constant
- `src/contexts/AudioContextProvider.jsx` - Added isInterrupted, handleTapToResume, streamRef; wired onstatechange; updated resumeAudio and visibilitychange
- `src/components/games/shared/AudioInterruptedOverlay.jsx` - Tap-to-resume overlay for AudioContext interruption state
- `src/locales/en/common.json` - Added micInterrupted.*, micError.permissionDenied.ios.*, genericHint keys
- `src/locales/he/common.json` - Added Hebrew translations for same key set

## Decisions Made
- `onstatechange` wired in mount-time `useEffect` (not in the ref initializer block) so `setIsInterrupted` is in scope. The eager AudioContext creation happens before React state setters are available.
- `handleTapToResume` calls `ctx.resume()` synchronously before any `await` — this is the critical IOS-02 requirement. Assigning to `const resumePromise` and then awaiting preserves synchronous invocation.
- `visibilitychange` handler now distinguishes three cases: (1) interrupted or dead tracks → show overlay, (2) running + live tracks → no-op, (3) other → silent resumeAudio.
- `AudioInterruptedOverlay` uses `bg-black/30` for lighter visual treatment than `MicErrorOverlay`'s `bg-black/50` — interruptions are less alarming than errors.
- Retry-once fallback implemented: catches first failure, retries once, then sets `resumeFailed=true` to show Restart Exercise button.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All infrastructure is in place for Plan 02: wiring `isInterrupted` and `handleTapToResume` into SightReadingGame, NotesRecognitionGame, and MetronomeTrainer
- `AudioInterruptedOverlay` is ready to be rendered in game components
- All i18n keys for both plans are already in place (en + he)
- `isIOSSafari` utility is importable for Plan 02 MicErrorOverlay iOS-specific instructions

---
*Phase: 09-ios-safari-hardening*
*Completed: 2026-03-03*
