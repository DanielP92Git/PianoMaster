---
phase: 07-audio-architecture-core-algorithm
plan: 02
subsystem: audio
tags: [pitchy, web-audio-api, pitch-detection, McLeod, midi, react-hook]

# Dependency graph
requires:
  - phase: 07-01
    provides: AudioContextProvider with analyserNode, pitchy 4.1.0 installed

provides:
  - usePitchDetection hook with McLeod Pitch Method via pitchy
  - frequencyToNote() MIDI-math function (C3-C6 range)
  - PITCH_CLARITY_THRESHOLD constant (0.9)
  - NOTE_NAMES array exported for reuse
  - Dual-mode operation: shared analyserNode or self-created fallback
  - Call-time override support on startListening()

affects:
  - 07-03 (useMicNoteInput integration)
  - 07-04 (NotesRecognitionGame integration)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "MIDI math pitch conversion: midi = round(12 * log2(hz/440) + 69)"
    - "Clarity-gated pitch emission: only emit when clarity >= 0.9"
    - "PitchDetector stored in ref to avoid per-frame GC (pitchy pitfall)"
    - "Dual-mode hook: shared analyser (no new context) vs self-created fallback"
    - "Call-time override pattern: startListening({ analyserNode, sampleRate })"

key-files:
  created: []
  modified:
    - src/hooks/usePitchDetection.js

key-decisions:
  - "detectPitch shim kept as function (not null) to pass backward-compat test that calls and checks typeof"
  - "clarityThreshold=0.9 as hook-level param so callers can tune if needed"
  - "fftSize=4096 in fallback mode (matching AudioContextProvider config)"
  - "smoothingTimeConstant=0.0 in fallback mode (no averaging for per-frame accuracy)"
  - "Call-time analyserNode arg takes priority over hook-level prop (handles async mic init race)"

patterns-established:
  - "Pitch detection: PitchDetector.forFloat32Array(fftSize) stored in ref, never recreated per frame"
  - "MIDI range guard: midi < MIN_MIDI (48) or midi > MAX_MIDI (84) returns null"
  - "Shared mode stopListening: cancel RAF only, do NOT close context or stop stream"
  - "Exports: frequencyToNote, PITCH_CLARITY_THRESHOLD, NOTE_NAMES at module level for reuse"

requirements-completed: [ALGO-01, ALGO-02, ALGO-03, ARCH-02]

# Metrics
duration: 3min
completed: 2026-02-17
---

# Phase 07 Plan 02: usePitchDetection Summary

**McLeod Pitch Method via pitchy replacing autocorrelation in usePitchDetection, with 0.9-clarity noise gate, MIDI-math frequencyToNote (C3-C6), and dual-mode shared/self-created analyserNode operation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T18:16:44Z
- **Completed:** 2026-02-17T18:19:39Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced naive autocorrelation with pitchy McLeod Pitch Method (eliminates octave errors on piano harmonics)
- Added clarity-based noise gate (0.9 threshold) — ambient noise no longer triggers detections
- Added MIDI-math frequencyToNote covering C3 (MIDI 48) to C6 (MIDI 84) with chromatic accidentals
- Implemented dual-mode operation: accepts shared analyserNode (no new context) or creates own (backward compat)
- Added call-time override support on startListening so callers can pass freshly-resolved analyser after mic init

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace autocorrelation with pitchy McLeod Pitch Method** - `fd2d003` (feat)

**Plan metadata:** (see final docs commit below)

## Files Created/Modified

- `src/hooks/usePitchDetection.js` - Rewrote with pitchy PitchDetector, MIDI math, dual-mode, call-time overrides; kept detectPitch shim and backward-compat return shape

## Decisions Made

- **detectPitch kept as function shim:** The plan specified `detectPitch: null` but the existing test checks `typeof result.current.detectPitch === 'function'` and calls it on a buffer. Kept the old autocorrelation as a deprecated shim so all 5 existing tests continue to pass. (Rule 1 auto-fix — internal plan contradiction resolved in favor of "tests pass" requirement)
- **clarityThreshold as configurable param:** Exposed at hook level and call-time so future callers (or tests) can tune sensitivity without changing the constant
- **Call-time arg priority over hook prop:** Hook-level `analyserNode` is evaluated at render time (may be null); call-time arg is evaluated at invocation time after async mic init completes — call-time always wins

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Kept detectPitch as a function instead of null**
- **Found during:** Task 1 (implementation)
- **Issue:** Plan specified `detectPitch: null` in return value, but existing test asserts `typeof result.current.detectPitch === 'function'` and calls `result.current.detectPitch(emptyBuffer, 44100)` expecting `-1`. Returning null would break the test.
- **Fix:** Kept the old autocorrelation algorithm as a private deprecated shim, exposed as `detectPitch` in return. It is never used in the pitchy detection loop — pitchy's `findPitch` handles all real detection.
- **Files modified:** src/hooks/usePitchDetection.js
- **Verification:** All 5 existing tests pass
- **Committed in:** fd2d003 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - internal plan contradiction)
**Impact on plan:** Required to honor the "existing tests still pass" guarantee. The shim adds ~40 lines but has zero runtime impact on the pitchy detection path.

## Issues Encountered

None — pitchy import resolved correctly, build passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `usePitchDetection` now exports `frequencyToNote`, `PITCH_CLARITY_THRESHOLD`, `NOTE_NAMES` for Plan 04 (NotesRecognitionGame integration)
- `startListening({ analyserNode, sampleRate })` call-time override pattern is ready for Plan 04 callers
- Plan 03 (useMicNoteInput integration) can now wire through the new analyserNode param

---
*Phase: 07-audio-architecture-core-algorithm*
*Completed: 2026-02-17*
