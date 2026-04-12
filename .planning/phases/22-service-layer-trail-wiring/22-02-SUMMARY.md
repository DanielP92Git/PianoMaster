---
phase: 22-service-layer-trail-wiring
plan: 02
subsystem: ui
tags: [react, tailwind, vitest, rhythm-games, pulse, metronome, web-audio]

# Dependency graph
requires:
  - phase: 25-unified-mixed-lesson-engine-for-trail-nodes
    provides: MixedLessonGame renderer switch and handleRhythmTapComplete callback

provides:
  - PULSE exercise type constant in EXERCISE_TYPES
  - PulseQuestion renderer (pulsing circle, no notation, metronome-synced tap exercise)
  - Unit tests for PulseQuestion (9 tests, render contract + callback)
  - MixedLessonGame wired for "pulse" question type
  - TrailNodeModal display name for "pulse"
  - validateTrail.mjs accepts "pulse" renderer type + mini_boss 10-12 question range

affects: [22-service-layer-trail-wiring plans 03-05, trail node definitions that use pulse exercise]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PulseQuestion follows same stateful renderer contract as RhythmTapQuestion (onComplete signature, hasStartedRef auto-start, useAudioEngine + useAudioContext)"
    - "Inline <style> keyframes scoped to component for CSS beat animation"
    - "vi.mock paths in __tests__/ subdirectory require one extra ../ level vs sibling test files"

key-files:
  created:
    - src/components/games/rhythm-games/renderers/PulseQuestion.jsx
    - src/components/games/rhythm-games/renderers/__tests__/PulseQuestion.test.jsx
  modified:
    - src/data/constants.js
    - src/components/games/rhythm-games/MixedLessonGame.jsx
    - src/components/trail/TrailNodeModal.jsx
    - scripts/validateTrail.mjs

key-decisions:
  - "PulseQuestion reuses handleRhythmTapComplete callback from MixedLessonGame (no new callback needed)"
  - "Timing threshold uses FAIR window (not PERFECT/GOOD) for on-time scoring — welcoming for first-time rhythm learners"
  - "4 bars at 65 BPM default (~15 seconds); totalPlayBeats = beatsPerMeasure * 4"
  - "CSS animation keyframes inlined in component <style> tag rather than Tailwind config (avoids config change for single component)"
  - "mini_boss nodes allowed 10-12 questions in validator (was 8-10)"

patterns-established:
  - "Pulse renderer pattern: pulsing circle with no staff/notation, tap anywhere, reports (onTimeTaps, totalExpectedTaps)"

requirements-completed: [CURR-05]

# Metrics
duration: 6min
completed: 2026-04-12
---

# Phase 22 Plan 02: Pulse Exercise Type Summary

**PULSE exercise type added to constants, MixedLessonGame, TrailNodeModal, and validator; PulseQuestion renderer with pulsing circle beat animation, Web Audio metronome, and kid-friendly tap scoring**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-12T10:02:49Z
- **Completed:** 2026-04-12T10:08:15Z
- **Tasks:** 2 of 2
- **Files modified:** 6

## Accomplishments

- PULSE constant added to EXERCISE_TYPES; MixedLessonGame, TrailNodeModal, and validateTrail.mjs all register the new type
- PulseQuestion renderer created: glass card, large pulsing circle (CSS animation synced to beat interval), no VexFlow or notation elements
- State machine WAITING → COUNT_IN → PLAYING → EVALUATING → DONE; onComplete(onTimeTaps, totalPlayBeats) fires at end
- 9 unit tests pass: render contract, no-VexFlow assertion, glass card, callback with (number, number) args
- validateTrail.mjs now accepts mini_boss nodes with 10-12 questions (was 8-10)

## Task Commits

1. **Task 1: Add PULSE constant + register in MixedLessonGame, TrailNodeModal, validator** - `ccc25f2` (feat)
2. **Task 2: Create PulseQuestion renderer component + tests** - `b5f8f48` (feat)

## Files Created/Modified

- `src/data/constants.js` — Added `PULSE: "pulse"` to EXERCISE_TYPES
- `src/components/games/rhythm-games/MixedLessonGame.jsx` — Import PulseQuestion; startGame and renderQuestion "pulse" cases
- `src/components/trail/TrailNodeModal.jsx` — Added `case "pulse":` in getExerciseTypeName
- `scripts/validateTrail.mjs` — Added "pulse" to RENDERER_TYPES; mini_boss-aware question count (10-12)
- `src/components/games/rhythm-games/renderers/PulseQuestion.jsx` — New renderer, 285 lines
- `src/components/games/rhythm-games/renderers/__tests__/PulseQuestion.test.jsx` — 9 unit tests

## Decisions Made

- PulseQuestion reuses `handleRhythmTapComplete` from MixedLessonGame — same `(onTimeTaps, totalExpectedTaps)` signature, no new callback needed
- On-time scoring uses FAIR threshold (~125ms at 65 BPM after tempo scaling) — generous for welcoming first exercise
- Inline `<style>` keyframes inside the component rather than extending Tailwind config; keeps the animation self-contained
- mini_boss question range widened to 10-12 to accommodate richer lesson sequences in future plans

## Deviations from Plan

None — plan executed exactly as written. The TypeScript cast (`as React.CSSProperties`) was written by mistake in a JSX file and caught immediately by the test runner; removed before committing.

## Issues Encountered

- `vi.mock` paths from inside `__tests__/` subdirectory need one extra `../` level vs sibling test files — corrected by adjusting all mock paths.
- JSX file had `as React.CSSProperties` TypeScript cast which esbuild rejected — removed cast, replaced with plain object literal.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- PulseQuestion renderer is wired and tested; ready for trail node data (phase 22 plan 03+) to author "pulse" questions in node configs
- validateTrail.mjs will accept pulse questions without errors
- TrailNodeModal will display "Pulse" as the exercise type name

---
*Phase: 22-service-layer-trail-wiring*
*Completed: 2026-04-12*
