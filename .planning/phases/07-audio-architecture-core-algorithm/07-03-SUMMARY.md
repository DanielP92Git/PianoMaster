---
phase: 07-audio-architecture-core-algorithm
plan: 03
subsystem: audio
tags: [web-audio-api, hooks, react, pitch-detection, audio-context]

requires:
  - phase: 07-01
    provides: AudioContextProvider with shared AudioContext and AnalyserNode

provides:
  - useAudioEngine accepts optional sharedAudioContext, skips own context creation when shared, does not close shared context on cleanup
  - useMicNoteInput forwards analyserNode, sampleRate, clarityThreshold to usePitchDetection at hook-prop and call-time levels

affects:
  - 07-04 (NotesRecognitionGame integration uses these new params)
  - MetronomeTrainer (can pass sharedAudioContext to useAudioEngine)
  - SightReadingGame (can pass sharedAudioContext to useAudioEngine)

tech-stack:
  added: []
  patterns:
    - "isOwnedContextRef pattern: hook tracks whether it created the AudioContext to determine cleanup responsibility"
    - "Pass-through prop pattern: intermediate hooks forward new props transparently to inner hooks"
    - "Call-time override pattern: startListening(overrides={}) enables analyser injection at invocation site"

key-files:
  created: []
  modified:
    - src/hooks/useAudioEngine.js
    - src/hooks/useMicNoteInput.js

key-decisions:
  - "useAudioEngine uses isOwnedContextRef (not a state var) to track context ownership — no re-render needed"
  - "Shared context path skips AudioContext constructor entirely — uses provider's existing instance"
  - "cleanup nulls audioContextRef.current in both owned and shared paths to prevent stale ref usage"
  - "useMicNoteInput passes clarityThreshold through to usePitchDetection even though current usePitchDetection ignores it — ready for Plan 02 pitchy integration"
  - "startListeningWrapped(overrides={}) passes overrides object directly to inner startListening — no arg parsing at this layer"

patterns-established:
  - "Shared context: pass sharedAudioContext={ctx} as second arg to useAudioEngine; hook handles both paths transparently"
  - "Analyser injection: pass analyserNode and sampleRate at hook-prop level OR as call-time overrides to startListening"

requirements-completed:
  - ARCH-03

duration: 3min
completed: 2026-02-17
---

# Phase 07 Plan 03: Audio Hook Refactoring Summary

**useAudioEngine gains shared AudioContext support (ARCH-03) and useMicNoteInput gains analyserNode passthrough for the shared analyser pipeline**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T18:16:40Z
- **Completed:** 2026-02-17T18:19:20Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- useAudioEngine accepts optional `sharedAudioContext` parameter; MetronomeTrainer and SightReadingGame can now pass the shared context from AudioContextProvider instead of creating their own
- Ownership tracking via `isOwnedContextRef` ensures cleanup never closes a shared AudioContext (provider manages lifecycle)
- useMicNoteInput forwards `analyserNode`, `sampleRate`, and `clarityThreshold` to usePitchDetection at both hook-prop and call-time levels
- `startListeningWrapped` extended to accept `overrides={}` argument, enabling Plan 04 pattern where analyser is obtained at call time

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor useAudioEngine to accept shared AudioContext** - `ab25961` (feat)
2. **Task 2: Update useMicNoteInput to pass through analyserNode** - `4674c56` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/hooks/useAudioEngine.js` - Added sharedAudioContext param, isOwnedContextRef tracking, modified initializeAudioContext and cleanup
- `src/hooks/useMicNoteInput.js` - Added analyserNode/sampleRate/clarityThreshold params, forwarded to usePitchDetection, extended startListeningWrapped with overrides

## Decisions Made
- `isOwnedContextRef` is a `useRef` (not state) — ownership is a stable implementation detail, not a value driving re-renders
- `cleanup` nulls `audioContextRef.current` in both paths to prevent accidental stale-ref usage after cleanup
- `clarityThreshold` is passed through even though current `usePitchDetection` ignores it — future-proofs for Plan 02's pitchy integration without another refactor pass
- `startListeningWrapped(overrides={})` passes the object directly to the inner `startListening` — no destructuring at this layer, keeps the wrapper thin

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04 (NotesRecognitionGame integration) can now call `startMicListening({ analyserNode, sampleRate })` with the shared analyser
- MetronomeTrainer and SightReadingGame can pass `sharedAudioContext` to `useAudioEngine` once their contexts are wired up in Phase 08-09
- usePitchDetection still ignores `analyserNode`/`sampleRate`/`clarityThreshold` — those will be wired in Plan 02's pitchy refactor

---
*Phase: 07-audio-architecture-core-algorithm*
*Completed: 2026-02-17*
