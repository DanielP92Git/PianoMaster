---
phase: 07-key-signature-rendering-infrastructure
plan: 02
subsystem: ui
tags: [vexflow, react, music-notation, key-signature, sight-reading]

# Dependency graph
requires:
  - phase: 07-01
    provides: KEY_NOTE_LETTERS map, filterNotesToKey utility, keySignature in DEFAULT_SETTINGS, KeySignatureSelection step component

provides:
  - VexFlow key signature glyph rendering on bar 0 for all four rendering paths (single-clef single-bar, single-clef multi-bar, grand-staff single-bar, grand-staff multi-bar)
  - Accidental.applyAccidentals integration suppressing in-key redundant accidentals and adding natural signs for deviations
  - keySignature prop threading: TrailNodeModal navState -> SightReadingGame -> patternBuilder -> VexFlowStaffDisplay
  - Note pool filtering in generatePatternData based on active key signature
  - keySignature property on returned pattern object for downstream consumption

affects: [08-key-signature-node-data, sight-reading-game, trail-progression]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "activeKeySignature constant inside VexFlow useEffect — derived from prop then pattern fallback"
    - "skipManualAccidental flag on buildStaveNote — prevents double accidental when applyAccidentals is active"
    - "applyAccidentals called after addTickables, before Formatter — mandatory VexFlow ordering"
    - "Guard pattern: all key sig calls wrapped in (activeKeySignature && activeKeySignature !== 'C')"

key-files:
  created: []
  modified:
    - src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/components/games/sight-reading-game/hooks/usePatternGeneration.js
    - src/components/games/sight-reading-game/utils/patternBuilder.js
    - src/components/games/sight-reading-game/utils/patternBuilder.test.js
    - src/components/trail/TrailNodeModal.jsx

key-decisions:
  - "activeKeySignature reads from prop first, then pattern.keySignature — allows VexFlowStaffDisplay to work standalone or as part of the full pipeline"
  - "skipManualAccidental flag on buildStaveNote prevents double accidental symbols when applyAccidentals is handling accidentals automatically"
  - "applyAccidentals must be called after addTickables and before Formatter — VexFlow ordering constraint is enforced in all four rendering paths"
  - "C major guard (activeKeySignature !== 'C') avoids redundant glyph rendering since C major has no accidentals"
  - "filterNotesToKey in patternBuilder uses keySignature to filter note pool before random selection — ensures generated patterns contain only in-key pitches"

patterns-established:
  - "VexFlow key sig pattern: addKeySignature on stave, skipManualAccidental on buildStaveNote, applyAccidentals on voice — applied consistently across all four paths"
  - "Pattern object carries keySignature property so VexFlowStaffDisplay can read key sig from pattern when no explicit prop is passed"

requirements-completed: [RENDER-01, RENDER-02, RENDER-03]

# Metrics
duration: ~90min
completed: 2026-03-18
---

# Phase 07 Plan 02: Key Signature Rendering Infrastructure Summary

**VexFlow key signature glyphs wired end-to-end: TrailNodeModal navState to VexFlowStaffDisplay, with Accidental.applyAccidentals suppressing redundant in-key accidentals across all four rendering paths**

## Performance

- **Duration:** ~90 min
- **Started:** 2026-03-18
- **Completed:** 2026-03-18
- **Tasks:** 3 (1 TDD, 1 implementation, 1 human verify — approved)
- **Files modified:** 6

## Accomplishments
- Threaded `keySignature` through the full config pipeline: TrailNodeModal navState -> SightReadingGame trailSettings -> usePatternGeneration -> generatePatternData -> VexFlowStaffDisplay prop
- Implemented VexFlow key signature glyph rendering (`stave.addKeySignature`) on bar 0 for all four rendering paths (single-clef single-bar, single-clef multi-bar, grand-staff single-bar, grand-staff multi-bar)
- Integrated `Accidental.applyAccidentals` to suppress in-key redundant accidentals and automatically add natural signs for notes deviating from the active key
- Added note pool filtering in `generatePatternData` using `filterNotesToKey` so generated patterns only contain in-key pitches when a key signature is active
- Visual verification approved by user: G major (1 sharp on F line), Eb major (3 flats), C major (no glyphs), multi-bar (glyph on bar 0 only), grand staff (glyphs on both staves)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED — Failing key signature tests** - `6c9cc84` (test)
2. **Task 1 GREEN — Thread keySignature through config pipeline** - `fd3d655` (feat)
3. **Task 2 — VexFlow key signature glyph rendering** - `22fd6b3` (feat)
4. **Bug fix — Keep natural notes whose staff position exists in key signature** - `1e548a4` (fix)
5. **Bug fix — Map natural notes to in-key accidental forms for pattern generation** - `83e8645` (fix)
6. **Bug fix — Include accidental in VexFlow key string for correct key sig rendering** - `b5d9c07` (fix)
7. **Task 3 — Visual verification checkpoint approved** - (human verify, no commit)

_Note: TDD tasks have multiple commits (test -> feat). Three bug fixes applied during verification._

## Files Created/Modified
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` - Added `keySignature` prop, `activeKeySignature` constant, `skipManualAccidental` flag on `buildStaveNote`, `stave.addKeySignature` calls, and `Accidental.applyAccidentals` calls across all four rendering paths
- `src/components/games/sight-reading-game/SightReadingGame.jsx` - Extracts `trailKeySignature` from `location.state`, threads it through `trailSettings`, passes `keySignature` arg to `generatePattern`, passes `keySignature` prop to `VexFlowStaffDisplay`
- `src/components/games/sight-reading-game/hooks/usePatternGeneration.js` - Added `keySignature = null` as 9th parameter, passes it to `generatePatternData`
- `src/components/games/sight-reading-game/utils/patternBuilder.js` - Added `keySignature = null` param to `generatePatternData`, imports `filterNotesToKey`, filters note pool when key sig active, includes `keySignature` in returned pattern object
- `src/components/games/sight-reading-game/utils/patternBuilder.test.js` - Added "key signature filtering" describe block with 3 tests
- `src/components/trail/TrailNodeModal.jsx` - Added `keySignature: exercise.config?.keySignature ?? null` to `navState`

## Decisions Made
- `activeKeySignature` is derived as `keySignature || pattern?.keySignature || null` so VexFlowStaffDisplay works standalone (prop) or via pattern object
- `skipManualAccidental` flag prevents double-rendering accidentals: `buildStaveNote` skips manual accidental addition when `applyAccidentals` handles it
- `applyAccidentals` ordering is enforced after `addTickables` and before `Formatter` — this is a VexFlow constraint and was critical for correct rendering
- C major (`activeKeySignature !== 'C'`) guard skips redundant glyph since C major has no accidentals and `addKeySignature('C')` would show nothing useful
- Note pool filtering in `patternBuilder` uses the same `filterNotesToKey` utility from Plan 01 for consistency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed natural note exclusion during key signature filtering**
- **Found during:** Task 2 verification (visual inspection)
- **Issue:** `filterNotesToKey` was excluding natural notes (e.g., E4) when the key signature used flats (e.g., Eb major). E4 is a valid note in Eb major (the natural form of the Eb note), but it was being filtered out because the key map contains "Eb" not "E"
- **Fix:** Updated filtering logic to keep natural notes whose staff position (letter) exists in the key — natural E is valid in Eb major because "Eb" shares the E staff position
- **Files modified:** `src/components/games/sight-reading-game/utils/patternBuilder.js`
- **Verification:** Notes like E4 appeared correctly in Eb major patterns
- **Committed in:** `1e548a4`

**2. [Rule 1 - Bug] Fixed note-to-key-string mapping for pattern generation**
- **Found during:** Task 2 verification (visual inspection)
- **Issue:** When generating patterns for accidental keys (e.g., G major), the note pool mapping wasn't converting "F#4" to the correct VexFlow pitch string form. Natural pool notes like "F4" were being retained as-is instead of being mapped to "F#4" (the in-key form)
- **Fix:** Added mapping logic so that when a note's natural letter exists in the key as an accidental form (e.g., F -> F# in G major), the note is mapped to the accidental form
- **Files modified:** `src/components/games/sight-reading-game/utils/patternBuilder.js`
- **Verification:** F# appeared in G major patterns instead of F natural
- **Committed in:** `83e8645`

**3. [Rule 1 - Bug] Fixed VexFlow key string to include accidental for correct glyph rendering**
- **Found during:** Task 2 verification (visual inspection of key signature glyphs)
- **Issue:** The key string passed to `stave.addKeySignature()` was not including the accidental for flat keys. Passing "Bb" as-is worked, but the intermediate note-string parsing was stripping the accidental in some code paths
- **Fix:** Ensured the VexFlow key string passed to `addKeySignature` is the full key name (e.g., "Bb", "Eb") without stripping
- **Files modified:** `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx`
- **Verification:** Bb and Eb keys rendered the correct number of flat glyphs
- **Committed in:** `b5d9c07`

---

**Total deviations:** 3 auto-fixed (all Rule 1 bugs)
**Impact on plan:** All three bugs discovered during visual verification. Fixes were necessary for correct key signature glyph rendering and correct note pool filtering. No scope creep.

## Issues Encountered
- VexFlow's `Accidental.applyAccidentals` ordering is strict — must be called after `addTickables` and before `Formatter`. Incorrect ordering caused rendering errors. Resolved by enforcing the order in all four paths.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Key signature rendering infrastructure is complete and verified
- Phase 08 (key signature node data authoring) can now begin — rendering is confirmed working
- Trail nodes with `keySignature` in their `exercise.config` will flow through the full pipeline automatically
- The `validateTrail.mjs` pattern validator should be checked for `keySignature` field support before Phase 08 begins (noted in STATE.md research flags)

---
*Phase: 07-key-signature-rendering-infrastructure*
*Completed: 2026-03-18*
