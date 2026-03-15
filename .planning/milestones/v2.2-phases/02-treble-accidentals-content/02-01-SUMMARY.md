---
phase: 02-treble-accidentals-content
plan: 01
subsystem: trail-content
tags: [data-authoring, accidentals, sharps, flats, trail-nodes]
dependency_graph:
  requires: [boss_treble_3]
  provides: [trebleUnit4Nodes, trebleUnit5Nodes, boss_treble_accidentals]
  affects: [expandedNodes.js (Phase 04 integration)]
tech_stack:
  added: []
  patterns: [nearest-neighbor-context-pairing, progressive-pool-expansion, enharmonic-safety-constraint]
key_files:
  created:
    - src/data/units/trebleUnit4Redesigned.js
    - src/data/units/trebleUnit5Redesigned.js
  modified: []
decisions:
  - "SIGHT_READING excluded from flats regular practice nodes due to enharmonic mic bug (INTG-03): mic outputs A#4/D#4 not Bb4/Eb4"
  - "Boss nodes in Unit 5 may include SIGHT_READING because they are inert until Phase 04 wires them into expandedNodes.js"
  - "boss_treble_accidentals is the only node in the flats file with sharps in notePool (it is a cross-unit challenge)"
  - "Unit 4 boss (boss_treble_4) must have category 'boss' string not CATEGORY constant"
metrics:
  duration_seconds: 187
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_created: 2
  total_nodes_authored: 15
---

# Phase 02 Plan 01: Treble Accidentals Content Summary

Authored two treble clef accidental unit data files (sharps F#4/C#4 and flats Bb4/Eb4) plus a cross-unit accidentals boss node — 15 new trail nodes covering the full accidentals curriculum.

## What Was Built

### trebleUnit4Redesigned.js (Sharps Unit)
7 nodes, orders 27-33, prerequisite entry: `boss_treble_3`

| Order | ID | Type | Notes | Exercise |
|-------|-----|------|-------|---------|
| 27 | treble_4_1 | DISCOVERY | F4, F#4, G4 | NOTE_RECOGNITION x8 |
| 28 | treble_4_2 | DISCOVERY | C4, C#4, D4 | NOTE_RECOGNITION x8 |
| 29 | treble_4_3 | PRACTICE | C#4, F#4 | SIGHT_READING (safe for sharps) |
| 30 | treble_4_4 | PRACTICE | C4, C#4, D4, F4, F#4, G4 | SIGHT_READING |
| 31 | treble_4_5 | MIX_UP | Full pool (10 notes) | MEMORY_GAME |
| 32 | treble_4_6 | SPEED_ROUND | Full pool (10 notes) | NOTE_RECOGNITION x20 timed |
| 33 | boss_treble_4 | BOSS | Full pool (10 notes) | NOTE_RECOGNITION x15 + SIGHT_READING |

### trebleUnit5Redesigned.js (Flats Unit + Accidentals Boss)
8 nodes, orders 34-41, prerequisite entry: `boss_treble_4`

| Order | ID | Type | Notes | Exercise |
|-------|-----|------|-------|---------|
| 34 | treble_5_1 | DISCOVERY | A4, Bb4, B4 | NOTE_RECOGNITION x8 |
| 35 | treble_5_2 | DISCOVERY | D4, Eb4, E4 | NOTE_RECOGNITION x8 |
| 36 | treble_5_3 | PRACTICE | Bb4, Eb4 | NOTE_RECOGNITION x10 (no SIGHT_READING) |
| 37 | treble_5_4 | PRACTICE | D4, Eb4, E4, A4, Bb4, B4 | NOTE_RECOGNITION x12 (no SIGHT_READING) |
| 38 | treble_5_5 | MIX_UP | Full flat pool (10 notes) | MEMORY_GAME |
| 39 | treble_5_6 | SPEED_ROUND | Full flat pool (10 notes) | NOTE_RECOGNITION x20 timed |
| 40 | boss_treble_5 | BOSS | Full flat pool (10 notes) | NOTE_RECOGNITION x15 + SIGHT_READING (inert until Ph04) |
| 41 | boss_treble_accidentals | BOSS | All 4 accidentals + C4-C5 (12 notes) | NOTE_RECOGNITION x15 + SIGHT_READING (inert until Ph04) |

## Structural Invariants Verified

- All 15 nodes: `accidentals: true` in noteConfig
- Orders 27-41 contiguous with no gaps or overlaps
- Flats regular nodes (orders 34-39): no SIGHT_READING exercises, no F#4/C#4 in notePools
- All three boss nodes (boss_treble_4, boss_treble_5, boss_treble_accidentals): exactly 2 exercises each
- boss_treble_accidentals notePool: 12 notes (C4, C#4, D4, Eb4, E4, F4, F#4, G4, A4, Bb4, B4, C5)
- Prerequisite chain linear: boss_treble_3 → treble_4_1 → ... → treble_4_6 → boss_treble_4 → treble_5_1 → ... → treble_5_6 → boss_treble_5 → boss_treble_accidentals
- `npm run test:run`: 109/109 passed (0 regressions)

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 38bc50a | feat(02-01): author trebleUnit4Redesigned.js (sharps unit F#4, C#4) |
| Task 2 | 042e1e1 | feat(02-01): author trebleUnit5Redesigned.js (flats unit Bb4, Eb4 + accidentals boss) |

## Self-Check: PASSED

- FOUND: src/data/units/trebleUnit4Redesigned.js
- FOUND: src/data/units/trebleUnit5Redesigned.js
- FOUND: commit 38bc50a
- FOUND: commit 042e1e1
