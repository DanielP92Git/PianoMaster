---
phase: 26-restore-ux-regression
plan: "02"
subsystem: rhythm-games
tags:
  - vexflow
  - syllables
  - multi-stave
  - pattern-resolution
  - trail-validation
dependency_graph:
  requires:
    - 26-01 (timing thresholds, scoreTap nodeType param)
  provides:
    - Multi-stave VexFlow rendering (RhythmStaffDisplay)
    - Kodaly syllable annotations below note heads (rhythmVexflowHelpers)
    - resolveByTags trail-mode pattern fetch (RhythmReadingGame)
    - Syllable toggle with localStorage persistence (RhythmReadingGame, RhythmDictationGame)
    - Build-time measure count policy validation (validateTrail.mjs)
  affects:
    - RhythmReadingGame (measures prop, syllable toggle, resolveByTags)
    - RhythmDictationGame (syllable toggle, DictationChoiceCard pass-through)
    - RhythmStaffDisplay (measures and syllable props)
    - DictationChoiceCard (showSyllables, language props)
    - validateTrail.mjs (validateMeasureCountPolicy added)
tech_stack:
  added:
    - VexFlow Annotation API (syllable text below note heads)
  patterns:
    - localStorage preference persistence (syllablesEnabled key)
    - Multi-stave vertical stack via DOM createElement in VexFlow useEffect
    - resolveByTags for curated trail-mode pattern selection
    - Build-time policy validation function pattern
key_files:
  created: []
  modified:
    - src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx
    - src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js
    - src/components/games/rhythm-games/RhythmReadingGame.jsx
    - src/components/games/rhythm-games/RhythmDictationGame.jsx
    - src/components/games/rhythm-games/components/DictationChoiceCard.jsx
    - scripts/validateTrail.mjs
    - src/locales/en/common.json
    - src/locales/he/common.json
decisions:
  - resolveByTags imported from src/data/patterns/RhythmPatternGenerator (not the local rhythm-games copy which lacks the export)
  - Multi-stave rendering uses DOM createElement loop inside the VexFlow useEffect rather than React state to avoid re-renders
  - DictationChoiceCard syllable deps added to useEffect array to re-render when toggle changes
  - Syllable toggle button uses "ta" text label per UI-SPEC discretion (not icon SVG)
  - Hebrew syllable toggle i18n: "הצג הברות" / "הסתר הברות" (standard Hebrew)
metrics:
  duration_minutes: 35
  completed_date: "2026-04-13"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 8
requirements:
  - UX-04
  - UX-05
  - PAT-04
  - PAT-06
---

# Phase 26 Plan 02: Multi-Stave Display, Syllable Annotations, resolveByTags, and Validator Summary

**One-liner:** Multi-stave VexFlow rendering (1–4 measures), Kodaly syllable annotations via VexFlow Annotation API, resolveByTags curated trail-mode patterns, and validateMeasureCountPolicy build-time enforcement.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Multi-stave display, resolveByTags import, trailMeasureCount, validator | `3310b74` | RhythmStaffDisplay.jsx, RhythmReadingGame.jsx, validateTrail.mjs |
| 2 | Kodaly syllable annotations and toggle UI | `22f0f2e` | rhythmVexflowHelpers.js, RhythmReadingGame.jsx, RhythmDictationGame.jsx, DictationChoiceCard.jsx, i18n |

## What Was Built

### UX-04: Progressive Measure Length (D-13, D-14)

`RhythmStaffDisplay` now accepts `measures` (1–4), `showSyllables`, and `language` props. When `measures > 1`, beats are split into measure-sized chunks via `splitBeatsIntoMeasures()` (calculates sixteenth-note units per measure from time signature), then each chunk is rendered as an independent VexFlow stave stacked vertically with 8px gap. Only the first stave reports bounds via `onStaveBoundsReady` for cursor tracking.

`RhythmReadingGame` extracts `trailMeasureCount = nodeConfig?.measureCount ?? 1` and passes it as `measures={trailMeasureCount}` to `RhythmStaffDisplay`.

### PAT-04: resolveByTags Import (D-23)

`RhythmReadingGame` imports `resolveByTags` from `src/data/patterns/RhythmPatternGenerator` (the data-layer version with the full implementation). `fetchNewPattern` now checks `nodeConfig?.patternTags` first and calls `resolveByTags(patternTags, durations, { timeSignature })` for trail mode, falling back to legacy `getPattern` for free-practice mode.

### PAT-06: validateMeasureCountPolicy (D-15)

`validateTrail.mjs` now includes `validateMeasureCountPolicy()` which enforces the D-12 table:
- discovery=1, practice=2, mix_up=1, review=2, challenge=2, speed_round=4, mini_boss=4, boss=4

Skips exercise types that don't use measureCount (mixed_lesson, pulse, visual_recognition, syllable_matching, note_recognition, memory_game). Only errors when `measureCount` is explicitly set to a wrong value — nodes without `measureCount` pass (not yet required). Called in the main validation block after `validateGameTypePolicy`.

### UX-05: Kodaly Syllable Annotations (D-16, D-17, D-18, D-19, D-20)

`beatsToVexNotes` in `rhythmVexflowHelpers.js` now accepts `{ showSyllables, language }` options. When `showSyllables` is true, it attaches a VexFlow `Annotation` to each note using `SYLLABLE_MAP_EN`/`SYLLABLE_MAP_HE` constants (already present) with `Annotation.VerticalJustify.BOTTOM`, font size 11px, Heebo for Hebrew and sans-serif for English.

`RhythmReadingGame` and `RhythmDictationGame` each have:
- `showSyllables` state (localStorage `syllablesEnabled`, default true)
- `isDiscoveryNode = trailNodeType === 'discovery'` — enforces syllables, hides toggle
- `effectiveShowSyllables = isDiscoveryNode ? true : showSyllables`
- `handleSyllableToggle` — flips state and persists to localStorage
- "ta" button in the controls area with `aria-pressed` and `aria-label`
- `showSyllables` and `language` passed to RhythmStaffDisplay / DictationChoiceCard

`DictationChoiceCard` accepts `showSyllables` and `language` props, passes them to `beatsToVexNotes`, and includes them in the useEffect dependency array.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- The `resolveByTags` export lives in `src/data/patterns/RhythmPatternGenerator.js`, not the local `src/components/games/rhythm-games/RhythmPatternGenerator.js`. The plan's interface block specifies the correct `../../../data/patterns/` path which was used.

## Known Stubs

None — all features are fully wired. Syllable maps are hardcoded constants (immutable per user confirmation in CONTEXT.md).

## Threat Flags

None beyond what is documented in the plan's threat model (T-26-03, T-26-04, T-26-05). Syllable text sourced exclusively from hardcoded constants, not user input.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| RhythmStaffDisplay.jsx | FOUND |
| rhythmVexflowHelpers.js | FOUND |
| RhythmReadingGame.jsx | FOUND |
| RhythmDictationGame.jsx | FOUND |
| DictationChoiceCard.jsx | FOUND |
| validateTrail.mjs | FOUND |
| commit 3310b74 (Task 1) | FOUND |
| commit 22f0f2e (Task 2) | FOUND |
| npm run verify:trail | PASS |
| npm run build | PASS |
