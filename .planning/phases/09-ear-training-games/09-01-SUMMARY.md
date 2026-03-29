---
phase: 09-ear-training-games
plan: 01
subsystem: ui
tags: [react, svg, audio, ear-training, vitest, tailwind, web-audio]

# Dependency graph
requires:
  - phase: 08-audio-infrastructure-rhythm-games
    provides: usePianoSampler with NOTE_FREQS export (C3-B4 piano synthesis)

provides:
  - earTrainingUtils.js with 8 exported functions (NOTE_ORDER, COMPARISON_TIERS, getTierForQuestion, generateNotePair, classifyInterval, generateIntervalQuestion, getNotesInBetween, getDisplayOctaveRoot)
  - PianoKeyboardReveal SVG component (shared by NoteComparisonGame and IntervalGame)
  - Unit tests (54 tests total, 100% passing)

affects:
  - 09-02 (NoteComparisonGame imports earTrainingUtils + PianoKeyboardReveal)
  - 09-03 (IntervalGame imports earTrainingUtils + PianoKeyboardReveal with showInBetween=true)
  - 09-04 (trail/subscription config for ear training nodes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure utility module pattern for game domain logic (no React state, pure functions)
    - SVG keyboard rendering with controlled fill state derived from note state map
    - TDD: RED (failing tests) → GREEN (implementation) → commit pattern

key-files:
  created:
    - src/components/games/ear-training-games/earTrainingUtils.js
    - src/components/games/ear-training-games/earTrainingUtils.test.js
    - src/components/games/ear-training-games/components/PianoKeyboardReveal.jsx
    - src/components/games/ear-training-games/PianoKeyboardReveal.test.jsx
  modified: []

key-decisions:
  - "earTrainingUtils imports NOTE_FREQS from usePianoSampler — single source of truth for note range"
  - "COMPARISON_TIERS maps Q0-2 (wide 6-12), Q3-6 (medium 3-5), Q7-9 (close 1-2) per D-09"
  - "classifyInterval: 1-2 semitones = step, 3-4 = skip, 5+ = leap per INTV-02 age-appropriate vocabulary"
  - "generateIntervalQuestion: first 60% of questions forced ascending per D-10, category distributed as step/skip/leap cycling"
  - "PianoKeyboardReveal test file uses .jsx extension (required for JSX syntax in Vitest)"
  - "getDisplayOctaveRoot centers octave around lower note using 12-semitone boundaries from NOTE_ORDER"

patterns-established:
  - "Ear training utils: pure function module, no React hooks, importable in both components and tests"
  - "PianoKeyboardReveal: dir=ltr enforced (RTL-safe), aria-hidden=true on SVG (decorative)"
  - "Note state map: note → note1|note2|between|default, derived via useMemo from note1/note2/showInBetween"
  - "TDD test file naming: .test.jsx for JSX tests, .test.js for pure JS tests"

requirements-completed: [PITCH-03, INTV-02, INTV-03, INTV-04]

# Metrics
duration: 5min
completed: 2026-03-29
---

# Phase 9 Plan 01: Ear Training Shared Foundation Summary

**Shared earTrainingUtils module (8 exports) + PianoKeyboardReveal SVG component (1-octave blue/orange keyboard) powering both NoteComparisonGame and IntervalGame**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-29T07:57:20Z
- **Completed:** 2026-03-29T08:01:41Z
- **Tasks:** 2
- **Files modified:** 4 created

## Accomplishments
- earTrainingUtils.js with all 8 exported functions: NOTE_ORDER (24 chromatic notes C3-B4), COMPARISON_TIERS (3-tier band progression), getTierForQuestion, generateNotePair (random pairs within semitone range, no duplicates), classifyInterval (step/skip/leap), generateIntervalQuestion (ascending-first with category distribution), getNotesInBetween, getDisplayOctaveRoot
- PianoKeyboardReveal SVG component: 1-octave keyboard (7 white + 5 black keys) with blue/orange highlights, in-between dim state for IntervalGame (showInBetween prop), slide-in animation (translateY 300ms), reducedMotion support, dir="ltr", aria-hidden="true"
- 54 unit tests (39 + 15) all passing, lint clean

## Task Commits

Each task was committed atomically:

1. **Task 1: TDD RED - earTrainingUtils failing tests** - `a96495d` (test)
2. **Task 1: TDD GREEN - earTrainingUtils implementation** - `a96c5e6` (feat)
3. **Task 2: PianoKeyboardReveal component + tests** - `04c1e6d` (feat)

_Note: TDD task has two commits — RED (tests) then GREEN (implementation)_

## Files Created/Modified
- `src/components/games/ear-training-games/earTrainingUtils.js` - Note pair generation, tier logic, interval classification, ascending-first ordering
- `src/components/games/ear-training-games/earTrainingUtils.test.js` - 39 unit tests for all utility functions
- `src/components/games/ear-training-games/components/PianoKeyboardReveal.jsx` - Shared SVG piano keyboard reveal component with blue/orange highlight states
- `src/components/games/ear-training-games/PianoKeyboardReveal.test.jsx` - 15 unit tests for PianoKeyboardReveal

## Decisions Made
- earTrainingUtils imports NOTE_FREQS from usePianoSampler — single source of truth for note range, no hardcoded duplicates
- COMPARISON_TIERS covers Q0-2 (wide), Q3-6 (medium), Q7-9 (close) per D-09
- PianoKeyboardReveal test file uses `.jsx` extension (required for JSX syntax in Vitest/Rollup parsing)
- Note state map uses `Map` derived via useMemo with note1/note2 taking highest priority over between notes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Initial test file used `.test.js` extension but contained JSX — Rollup parse error. Auto-fixed by renaming to `.test.jsx`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 02 (NoteComparisonGame): Can import earTrainingUtils and PianoKeyboardReveal directly
- Plan 03 (IntervalGame): Can import earTrainingUtils and use PianoKeyboardReveal with showInBetween=true
- All 8 utility functions verified through unit tests
- No blockers for Plans 02 and 03

## Self-Check: PASSED

- FOUND: src/components/games/ear-training-games/earTrainingUtils.js
- FOUND: src/components/games/ear-training-games/earTrainingUtils.test.js
- FOUND: src/components/games/ear-training-games/components/PianoKeyboardReveal.jsx
- FOUND: src/components/games/ear-training-games/PianoKeyboardReveal.test.jsx
- FOUND: .planning/phases/09-ear-training-games/09-01-SUMMARY.md
- FOUND commit: a96495d (TDD RED)
- FOUND commit: a96c5e6 (TDD GREEN)
- FOUND commit: 04c1e6d (PianoKeyboardReveal)

---
*Phase: 09-ear-training-games*
*Completed: 2026-03-29*
