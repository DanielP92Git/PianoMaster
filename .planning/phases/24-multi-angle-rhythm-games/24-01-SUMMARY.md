---
phase: 24-multi-angle-rhythm-games
plan: 01
subsystem: ui
tags: [svg, i18n, rhythm, vexflow, vitest, glassmorphism]

# Dependency graph
requires: []
provides:
  - 10 SVG rhythm duration sprite files (quarter, half, whole, eighth, sixteenth, dotted-quarter, dotted-half, quarter-rest, half-rest, whole-rest)
  - DURATION_INFO lookup table mapping VexFlow codes to metadata
  - generateQuestions utility for quiz question generation with syllable dedup
  - DurationCard shared component (icon/text modes, glass styling, accessibility)
  - EXERCISE_TYPES extended with VISUAL_RECOGNITION and SYLLABLE_MATCHING
  - i18n keys for EN/HE (exercise type names, game prompts, duration names)
  - Wave 0 test stubs for VisualRecognitionGame, SyllableMatchingGame, TrailNodeModal
affects: [24-02, 24-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SVG sprite import via ?react suffix for rhythm icons"
    - "DURATION_INFO pure-JS lookup (Node-safe, no VexFlow/React imports)"
    - "DurationCard glass-styled card with 4 visual states matching DictationChoiceCard"
    - "generateQuestions with cycling, Fisher-Yates shuffle, syllable dedup"

key-files:
  created:
    - src/assets/icons/rhythm/*.svg (10 files)
    - src/components/games/rhythm-games/utils/durationInfo.js
    - src/components/games/rhythm-games/utils/durationInfo.test.js
    - src/components/games/rhythm-games/components/DurationCard.jsx
    - src/components/games/rhythm-games/__tests__/VisualRecognitionGame.test.jsx
    - src/components/games/rhythm-games/__tests__/SyllableMatchingGame.test.jsx
    - src/components/trail/__tests__/TrailNodeModal.test.jsx
  modified:
    - src/data/constants.js
    - src/locales/en/trail.json
    - src/locales/he/trail.json
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "Inline syllable map in durationInfo.js to avoid importing rhythmVexflowHelpers (VexFlow is browser-only)"
  - "SVG_COMPONENTS exported from DurationCard for reuse by SyllableMatchingGame prompt panel"

patterns-established:
  - "DurationCard: shared card sub-component for rhythm quiz games with icon/text mode switching"
  - "durationInfo.js: pure-JS lookup table kept Node-safe for validateTrail.mjs compatibility"

requirements-completed: [SC-1, SC-2, SC-4]

# Metrics
duration: 10min
completed: 2026-04-09
---

# Phase 24 Plan 01: Foundation Layer Summary

**10 SVG rhythm sprites, DURATION_INFO lookup with question generator, DurationCard glass component, and i18n keys for EN/HE**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-09T12:00:39Z
- **Completed:** 2026-04-09T12:10:46Z
- **Tasks:** 3
- **Files modified:** 21

## Accomplishments
- Created 10 SVG sprite files for rhythm duration icons with 64x96 viewBox and white fill/stroke
- Built DURATION_INFO lookup table mapping 10 VexFlow duration codes to metadata, plus generateQuestions utility with cycling, distractor selection, and syllable dedup (13 tests passing)
- Created DurationCard shared component with icon/text rendering, glass styling, 4 visual states, reduced-motion support, and full ARIA accessibility
- Extended EXERCISE_TYPES with VISUAL_RECOGNITION and SYLLABLE_MATCHING
- Added complete i18n keys for EN and HE (exercise type names, game prompts, all 10 duration names)
- Created Wave 0 test stubs (18 todos) for VisualRecognitionGame, SyllableMatchingGame, and TrailNodeModal

## Task Commits

Each task was committed atomically:

0. **Task 0: Wave 0 test stubs** - `13cff54` (test)
1. **Task 1 RED: Failing durationInfo tests** - `50078d4` (test)
2. **Task 1 GREEN: SVG sprites + DURATION_INFO + EXERCISE_TYPES + i18n** - `42668cc` (feat)
3. **Task 2: DurationCard shared component** - `216fcd0` (feat)

## Files Created/Modified
- `src/assets/icons/rhythm/*.svg` (10 files) - SVG sprite artwork for rhythm duration icons
- `src/components/games/rhythm-games/utils/durationInfo.js` - DURATION_INFO lookup + generateQuestions utility
- `src/components/games/rhythm-games/utils/durationInfo.test.js` - 13 tests for lookup and question generation
- `src/components/games/rhythm-games/components/DurationCard.jsx` - Shared card component (icon/text, glass styling, accessibility)
- `src/components/games/rhythm-games/__tests__/VisualRecognitionGame.test.jsx` - 7 todo stubs
- `src/components/games/rhythm-games/__tests__/SyllableMatchingGame.test.jsx` - 7 todo stubs
- `src/components/trail/__tests__/TrailNodeModal.test.jsx` - 4 todo stubs
- `src/data/constants.js` - Added VISUAL_RECOGNITION and SYLLABLE_MATCHING to EXERCISE_TYPES
- `src/locales/en/trail.json` - Added exercise type names
- `src/locales/he/trail.json` - Added exercise type names (Hebrew)
- `src/locales/en/common.json` - Added visualRecognition, syllableMatching, rhythm.duration keys
- `src/locales/he/common.json` - Added Hebrew translations for all game UI strings

## Decisions Made
- Used inline syllable map in durationInfo.js rather than importing from rhythmVexflowHelpers.js, because that file imports VexFlow which is browser-only and would break the Node.js trail validator
- Exported SVG_COMPONENTS from DurationCard as a named export so SyllableMatchingGame can render the large SVG prompt without duplicating imports

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All foundation artifacts ready for Plan 02 (VisualRecognitionGame + SyllableMatchingGame implementation)
- DurationCard, durationInfo.js, SVG sprites, and i18n keys are the shared dependencies Plan 02 consumes
- EXERCISE_TYPES constants and i18n keys ready for Plan 03 (trail wiring)
- Wave 0 test stubs ready to be filled with real assertions in Plan 02/03

---
*Phase: 24-multi-angle-rhythm-games*
*Completed: 2026-04-09*
