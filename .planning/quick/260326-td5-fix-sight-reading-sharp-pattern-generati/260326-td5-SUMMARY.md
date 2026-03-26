---
phase: quick
plan: 260326-td5
subsystem: trail-data, sight-reading-game
tags: [key-signature, sight-reading, trail-nodes, unit4, sharps, vexflow]
dependency_graph:
  requires: []
  provides: [keySignature-A-in-unit4-sight-reading]
  affects: [treble_4_4, treble_4_5, boss_treble_4, bass_4_4, bass_4_5, boss_bass_4]
tech_stack:
  added: []
  patterns: [key-signature-pipeline, filterNotesToKey, mapNoteToKey, applyAccidentals]
key_files:
  created: []
  modified:
    - src/data/units/trebleUnit4Redesigned.js
    - src/data/units/bassUnit4Redesigned.js
    - src/components/games/sight-reading-game/utils/patternBuilder.test.js
decisions:
  - "Add keySignature: 'A' to SIGHT_READING exercise configs only — not NOTE_RECOGNITION or MEMORY_GAME — to avoid breaking keyboard input and those exercise types"
  - "Keep original mixed notePools (natural + sharp) in exercise configs since filterNotesToKey deduplicates automatically"
  - "Use the existing key signature pipeline (filterNotesToKey + mapNoteToKey in patternBuilder) rather than manually filtering notePools in trail data"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-03-26"
  tasks_completed: 1
  files_changed: 3
---

# Quick Task 260326-td5: Fix Sight-Reading Sharp Pattern Generation (Unit 4 Key Signature)

**One-liner:** Added `keySignature: 'A'` to all six Unit 4 SIGHT_READING exercise configs (treble and bass), routing them through the existing key signature pipeline to prevent F/C/G naturals from appearing alongside their sharp forms.

## Problem

Unit 4 sharp practice nodes (treble_4_4, treble_4_5, boss_treble_4, bass_4_4, bass_4_5, boss_bass_4) used SIGHT_READING exercises with mixed natural+sharp note pools but no key signature. This caused two issues:
1. F natural could appear in patterns when F# is the musically correct form (A major context)
2. Every sharp note got a manual accidental glyph even if the same sharp appeared earlier in the bar (no carry-through)

## Solution

Added `keySignature: 'A'` to the `config` object of each SIGHT_READING exercise in the six affected nodes. A major contains exactly F#, C#, G# — the three sharps these nodes practice.

The existing infrastructure handles everything:
- `filterNotesToKey` removes staff positions not in A major (F4, C4, G4)
- `mapNoteToKey` maps remaining naturals to their sharp forms (F->F#, C->C#, G->G#)
- `Accidental.applyAccidentals()` in VexFlow handles accidental carry-through within bars
- VexFlow renders the A major key signature glyph (3 sharps) on the staff

## Changes Made

### src/data/units/trebleUnit4Redesigned.js
- `treble_4_4` exercises[0].config: added `keySignature: 'A'`
- `treble_4_5` exercises[0].config: added `keySignature: 'A'`
- `boss_treble_4` exercises[1].config (SIGHT_READING): added `keySignature: 'A'`

### src/data/units/bassUnit4Redesigned.js
- `bass_4_4` exercises[0].config: added `keySignature: 'A'`
- `bass_4_5` exercises[0].config: added `keySignature: 'A'`
- `boss_bass_4` exercises[1].config (SIGHT_READING): added `keySignature: 'A'`

### src/components/games/sight-reading-game/utils/patternBuilder.test.js
Added describe block `"patternBuilder (A major key signature for sharp practice)"` with 3 tests:
1. Verifies F/C/G naturals are removed when `keySignature: 'A'` is active
2. Verifies deduplication when pool contains both naturals and sharps
3. Verifies `result.keySignature === 'A'` passthrough

## Verification

- All 26 tests in patternBuilder.test.js pass (23 existing + 3 new)
- Trail validation passes: 171 nodes, no broken prereqs, cycles, or invalid data
- The 3 new tests confirm the A major key signature pipeline works correctly

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | 1eb3814 | feat(quick-260326-td5): add keySignature 'A' to Unit 4 SIGHT_READING exercises |

## Deviations from Plan

None — plan executed exactly as written. The plan's "IMPORTANT" note correctly identified that keeping the mixed notePools and just adding `keySignature: 'A'` was the safest approach. The key signature filter in patternBuilder already handles the deduplication.

## Known Stubs

None.

## Self-Check: PASSED

- `src/data/units/trebleUnit4Redesigned.js` — verified contains `keySignature: 'A'` in 3 SIGHT_READING configs
- `src/data/units/bassUnit4Redesigned.js` — verified contains `keySignature: 'A'` in 3 SIGHT_READING configs
- `src/components/games/sight-reading-game/utils/patternBuilder.test.js` — verified A major describe block added
- Commit `1eb3814` — exists in git log
