---
phase: 08-key-signature-node-data
plan: 02
subsystem: ui
tags: [trail-nodes, key-signatures, bass-clef, sight-reading, vexflow]

# Dependency graph
requires:
  - phase: 07-key-signature-rendering
    provides: keySignature field in exercise config pipeline (TrailNodeModal -> SightReadingGame)
  - phase: 08-01
    provides: treble Unit 6 and 7 structure (bass mirrors exactly)
provides:
  - Bass clef key signature trail nodes — Units 6 and 7 (14 nodes total)
  - bassUnit6Redesigned.js (G major, D major — 4 nodes)
  - bassUnit7Redesigned.js (A, F, Bb, Eb major + Memory Mix-Up + Boss — 10 nodes)
affects: [phase-11-trail-wiring, expandedNodes.js integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bass key sig nodes use keySignature in exercises[n].config, not noteConfig"
    - "Note pools use natural C3-C4 octave; keySignature + filterNotesToKey handles accidentals at runtime"
    - "Boss category must be string literal 'boss', not CATEGORY constant"
    - "Memory game node has no keySignature field (deferred — memory game does not read key sig)"

key-files:
  created:
    - src/data/units/bassUnit6Redesigned.js
    - src/data/units/bassUnit7Redesigned.js
  modified: []

key-decisions:
  - "Boss exercise 3 uses keySignature: 'D' (2 sharps, representative mid-difficulty) rather than G to vary from exercise 1's A-major superset approach"
  - "Memory Mix-Up note pool uses explicit accidental spellings (F#3, Bb3) since MEMORY_GAME shows individual notes on piano cards without key sig glyph"
  - "verify:patterns was already failing before this plan (pre-existing import path issue in patternVerifier.mjs); new unit files not yet wired into expandedNodes.js so validator does not see them — expected behavior per RESEARCH.md"

patterns-established:
  - "Pattern: Bass key sig unit mirrors treble unit exactly — only clef ('bass') and note octave (C3-C4 vs C4-C5) differ"

requirements-completed: [BASS-01, BASS-02, BASS-03, BASS-04, BASS-05, BASS-06, BASS-07]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 08 Plan 02: Key Signature Node Data (Bass) Summary

**14 bass clef key signature trail nodes authored across bassUnit6 and bassUnit7, covering G/D/A/F/Bb/Eb major with SIGHT_READING exercises using keySignature pipeline**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T18:26:35Z
- **Completed:** 2026-03-18T18:29:19Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Authored bassUnit6Redesigned.js with 4 nodes: G Major Discovery/Practice and D Major Discovery/Practice (orders 94-97)
- Authored bassUnit7Redesigned.js with 10 nodes: A/F/Bb/Eb major Discovery+Practice pairs, Key Sig Memory Mix-Up, and boss_bass_keysig boss with 3 exercises (orders 98-107)
- Established complete prerequisite chain: boss_bass_accidentals -> bass_6_1 -> ... -> bass_6_4 -> bass_7_1 -> ... -> boss_bass_keysig
- All SIGHT_READING exercises include keySignature field; memory game correctly omits it

## Task Commits

Each task was committed atomically:

1. **Task 1: Author bassUnit6Redesigned.js** - `4721803` (feat)
2. **Task 2: Author bassUnit7Redesigned.js** - `db14de1` (feat)

## Files Created/Modified
- `src/data/units/bassUnit6Redesigned.js` - 4 bass key sig nodes: G major (1 sharp) and D major (2 sharps), Discovery + Practice pairs, orders 94-97
- `src/data/units/bassUnit7Redesigned.js` - 10 bass key sig nodes: A/F/Bb/Eb major (8 Discovery+Practice), Key Sig Memory Mix-Up, boss_bass_keysig with 3 exercises, orders 98-107

## Decisions Made
- Boss exercise 3 uses `keySignature: 'D'` (2 sharps) as the "mixed" representative key, providing variety vs. exercise 1's A-major (3 sharps). The plan specified 'D' for boss exercise 3 explicitly.
- Memory Mix-Up note pool `['C3','D3','E3','F#3','G3','A3','Bb3','B3','C4']` uses explicit accidental spellings since MEMORY_GAME exercises show individual piano card notes without a key sig glyph — this creates a richer matching challenge.
- `verify:patterns` was already failing before this plan due to a pre-existing import path issue in `patternVerifier.mjs` (missing `.js` extension in `keySignatureConfig` import). This is out of scope — new unit files are not wired into expandedNodes.js until Phase 11, so the validator does not see them regardless.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run verify:patterns` fails with a pre-existing `ERR_MODULE_NOT_FOUND` for `keySignatureConfig` (missing `.js` extension in import). This is unrelated to Phase 08 changes and was present before any edits. Logged for deferred resolution. New unit files are not yet wired into expandedNodes.js (Phase 11), so the validator does not process them.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Bass key signature nodes are complete and ready for wiring
- Phase 11 can import `bassUnit6Nodes` from `bassUnit6Redesigned.js` and `bassUnit7Nodes` from `bassUnit7Redesigned.js` into expandedNodes.js
- Prerequisite chain verified: boss_bass_accidentals -> bass_6_1 -> ... -> boss_bass_keysig
- All 14 nodes use correct bass clef and C3-C4 range

---
*Phase: 08-key-signature-node-data*
*Completed: 2026-03-18*
