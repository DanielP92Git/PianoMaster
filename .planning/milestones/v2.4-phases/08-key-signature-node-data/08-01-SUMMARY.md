---
phase: 08-key-signature-node-data
plan: 01
subsystem: ui
tags: [trail, nodes, key-signature, sight-reading, vexflow, treble-clef]

# Dependency graph
requires:
  - phase: 07-key-signature-rendering
    provides: keySignature field pipeline in TrailNodeModal + SightReadingGame; filterNotesToKey utility
provides:
  - 14 treble clef key signature trail nodes across 2 unit files
  - trebleUnit6Nodes (G major, D major — 4 nodes, orders 45-48)
  - trebleUnit7Nodes (A, F, Bb, Eb major + Memory Mix-Up + Boss — 10 nodes, orders 49-58)
affects: [phase-11-trail-wiring, expandedNodes.js, skillTrail.js, SKILL_NODES]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Key signature nodes use keySignature in exercise.config (not noteConfig); accidentals: false"
    - "Natural C4-C5 octave notePool for all key sig nodes; key sig glyph handles accidentals at render time"
    - "Boss node uses category: 'boss' string literal; other nodes use CATEGORY constant"
    - "Memory Mix-Up node uses mixed-key explicit accidental pool (F#4, Bb4); no keySignature in MEMORY_GAME config"
    - "3-exercise boss pattern: Exercise 1 (sharp superset: A major), Exercise 2 (flat superset: Eb major), Exercise 3 (middle difficulty: D major)"

key-files:
  created:
    - src/data/units/trebleUnit6Redesigned.js
    - src/data/units/trebleUnit7Redesigned.js
  modified: []

key-decisions:
  - "Boss exercise 3 uses keySignature: 'D' (2 sharps, middle difficulty) as mixed representative; not a rotation mechanism"
  - "Memory game note pool uses explicit accidental spellings (F#4, Bb4) for richer matching challenge since MEMORY_GAME ignores keySignature"
  - "patternCount field omitted from all SIGHT_READING exercise configs; SightReadingGame manages session length internally"
  - "New unit files are standalone modules with no wiring into expandedNodes.js; Phase 11 handles integration"

patterns-established:
  - "Pattern: Key signature Discovery node — NODE_TYPES.DISCOVERY, RHYTHM_COMPLEXITY.SIMPLE, measuresPerPattern: 1, tempo: 65, newContent: NEW_CONTENT_TYPES.NOTE"
  - "Pattern: Key signature Practice node — NODE_TYPES.PRACTICE, RHYTHM_COMPLEXITY.MEDIUM, measuresPerPattern: 2, tempo: 72, newContent: NEW_CONTENT_TYPES.NONE"

requirements-completed: [TREB-01, TREB-02, TREB-03, TREB-04, TREB-05, TREB-06, TREB-07]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 08 Plan 01: Key Signature Node Data (Treble) Summary

**14 treble clef key signature trail nodes authored across trebleUnit6Redesigned.js (G/D major) and trebleUnit7Redesigned.js (A/F/Bb/Eb major + memory + boss), all using SIGHT_READING with keySignature field in exercise config**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-18T18:25:36Z
- **Completed:** 2026-03-18T18:28:55Z
- **Tasks:** 2
- **Files modified:** 2 (both created new)

## Accomplishments

- Unit 6: 4 nodes covering G major (1 sharp) and D major (2 sharps), orders 45-48, prerequisite chain from boss_treble_accidentals
- Unit 7: 10 nodes covering A major (3 sharps), F/Bb/Eb major (flat keys), Memory Mix-Up, and a 3-exercise boss challenge covering all 6 key signatures
- Boss node (boss_treble_keysig) has 3 SIGHT_READING exercises with keySignature A, Eb, D respectively; isBoss: true; xpReward: 150

## Task Commits

Each task was committed atomically:

1. **Task 1: Author trebleUnit6Redesigned.js** - `b0d95dc` (feat)
2. **Task 2: Author trebleUnit7Redesigned.js** - `55da5b5` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `src/data/units/trebleUnit6Redesigned.js` - G major and D major treble nodes (4 nodes, Unit 6, orders 45-48)
- `src/data/units/trebleUnit7Redesigned.js` - A/F/Bb/Eb major + memory + boss treble nodes (10 nodes, Unit 7, orders 49-58)

## Decisions Made

- **Boss exercise 3 key choice:** Used `keySignature: 'D'` (2 sharps) as the "mixed" representative per PLAN.md spec. This is a single key per exercise — no rotation mechanism exists in the game engine.
- **Memory game note pool:** Used explicit accidental spellings (`'F#4'`, `'Bb4'`) in the mixed pool since MEMORY_GAME does not use key signature glyphs and benefits from richer note variety.
- **patternCount omitted:** Confirmed SightReadingGame manages its own session length; `patternCount` was not added to any SIGHT_READING exercise config.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Pre-existing `verify:patterns` failure (out of scope):** `npm run verify:patterns` fails with `ERR_MODULE_NOT_FOUND` for `keySignatureUtils.js` import missing `.js` extension. This failure predates this plan and is unrelated to the new unit files (which are not yet wired into `expandedNodes.js` — Phase 11 handles that). The failure exists on the commit immediately before this plan's work began. Logged to deferred items.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Treble key signature node data complete; ready for bass clef mirroring (Plan 02)
- Phase 11 can wire `trebleUnit6Nodes` and `trebleUnit7Nodes` into `expandedNodes.js` when integration phase begins
- Prerequisite chain verified: boss_treble_accidentals -> treble_6_1 -> ... -> treble_6_4 -> treble_7_1 -> ... -> boss_treble_keysig

## Self-Check: PASSED

- src/data/units/trebleUnit6Redesigned.js: FOUND
- src/data/units/trebleUnit7Redesigned.js: FOUND
- .planning/milestones/v2.4-phases/08-key-signature-node-data/08-01-SUMMARY.md: FOUND
- commit b0d95dc: FOUND
- commit 55da5b5: FOUND

---
*Phase: 08-key-signature-node-data*
*Completed: 2026-03-18*
