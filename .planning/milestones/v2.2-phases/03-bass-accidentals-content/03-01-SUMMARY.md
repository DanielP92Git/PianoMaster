---
phase: 03-bass-accidentals-content
plan: 01
subsystem: trail-data
tags: [bass-clef, accidentals, sharps, flats, trail-nodes, content-data]
dependency_graph:
  requires: [boss_bass_3 (prerequisite chain anchor)]
  provides: [bassUnit4Nodes, bassUnit5Nodes, boss_bass_4, boss_bass_5, boss_bass_accidentals]
  affects: [expandedNodes.js (Phase 04 integration), subscriptionConfig.js (Phase 04 gating)]
tech_stack:
  added: []
  patterns: [ESM module with named + default export, accidentals:true noteConfig flag, nearest-neighbor discovery pools, cross-unit boss node]
key_files:
  created:
    - src/data/units/bassUnit4Redesigned.js
    - src/data/units/bassUnit5Redesigned.js
  modified: []
decisions:
  - "SIGHT_READING safe for sharps (mic outputs F#3/C#3/G#3 matching exactly) — used in all bass_4 practice nodes and boss"
  - "SIGHT_READING excluded from regular flats nodes (bass_5_1 through bass_5_8) — mic enharmonic issue"
  - "Boss nodes in Unit 5 include SIGHT_READING as inert placeholder — wired in Phase 04"
  - "boss_bass_accidentals placed in Unit 5 file with unitName:'Accidentals Master' override"
  - "FULL_SHARP_POOL and FULL_FLAT_POOL as module-scope constants to avoid repetition and ensure consistency"
metrics:
  duration_seconds: 197
  completed_date: "2026-03-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 03 Plan 01: Bass Accidentals Content Summary

**One-liner:** Authored two bass clef accidental unit files — 8-node sharps unit (F#3/C#3/G#3) using all 4 game modes, and 10-node flats unit (Bb3/Eb3/Ab3/Db3) with NOTE_RECOGNITION-only constraint plus cross-unit accidentals boss covering all 7 bass accidentals.

## What Was Built

### bassUnit4Redesigned.js — Bass Sharps Unit
- 8 nodes, orders 76-83, prerequisite: boss_bass_3
- 3 Discovery nodes: each introduces exactly one sharp (F#3, C#3, G#3) with nearest-neighbor naturals
  - bass_4_1: F3/F#3/G3 (order 76)
  - bass_4_2: C3/C#3/D3 (order 77)
  - bass_4_3: G3/G#3/A3 (order 78)
- 2 Practice nodes using SIGHT_READING (safe for sharps — mic outputs exact sharp names)
  - bass_4_4: sharps-only pool, quarter notes, tempo 65 (order 79)
  - bass_4_5: BCA + sharps expanded pool, quarter+half, tempo 70 (order 80)
- 1 Mix-Up: MEMORY_GAME with full octave + 3 sharps (11 notes, 4x4, 180s) (order 81)
- 1 Speed Round: timed NOTE_RECOGNITION x20, 150s limit (order 82)
- Boss (boss_bass_4): category:'boss', isBoss:true, xpReward:150, 2 exercises (NR + SR) (order 83)

### bassUnit5Redesigned.js — Bass Flats Unit + Cross-Unit Boss
- 10 nodes, orders 84-93, prerequisite: boss_bass_4
- 4 Discovery nodes: each introduces exactly one flat (circle-of-fifths progression)
  - bass_5_1: A3/Bb3/B3 (order 84)
  - bass_5_2: D3/Eb3/E3 (order 85)
  - bass_5_3: G3/Ab3/A3 (order 86)
  - bass_5_4: C3/Db3/D3 (order 87)
- 2 Practice nodes using NOTE_RECOGNITION only (SIGHT_READING excluded — mic enharmonic issue)
  - bass_5_5: flats-only pool, questionCount:10 (order 88)
  - bass_5_6: BCA + flats pool, questionCount:12 (order 89)
- 1 Mix-Up: MEMORY_GAME with full octave + 4 flats (12 notes, 4x4, 180s) (order 90)
- 1 Speed Round: timed NOTE_RECOGNITION x20 (order 91)
- Unit Boss (boss_bass_5): category:'boss', isBoss:true, xpReward:150, 2 exercises (NR + SR inert) (order 92)
- Cross-unit Boss (boss_bass_accidentals): all 7 accidentals + full C3-C4 octave = 15 notes, xpReward:200, unitName:'Accidentals Master' (order 93)

## Prerequisite Chain

```
boss_bass_3
  → bass_4_1 → bass_4_2 → bass_4_3 → bass_4_4 → bass_4_5 → bass_4_6 → bass_4_7
  → boss_bass_4
  → bass_5_1 → bass_5_2 → bass_5_3 → bass_5_4 → bass_5_5 → bass_5_6 → bass_5_7 → bass_5_8
  → boss_bass_5
  → boss_bass_accidentals
```

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author bassUnit4Redesigned.js | 5607fd6 | src/data/units/bassUnit4Redesigned.js (+492 lines) |
| 2 | Author bassUnit5Redesigned.js | ae9aa1b | src/data/units/bassUnit5Redesigned.js (+627 lines) |

## Verification Results

All automated checks passed:
- Unit 4: 8 nodes, orders 76-83, all accidentals:true, all clef:'bass', boss cat:'boss', boss exercises:2, no duplicate IDs, first prereq boss_bass_3
- Unit 5: 10 nodes, orders 84-93, all accidentals:true, all clef:'bass', no SIGHT_READING in regular nodes, 2 boss nodes both with 2 exercises, accidentals boss pool = 15 notes, xpReward 200, first prereq boss_bass_4
- Orders contiguous 76-93, no collisions across both units
- `npx vitest run`: 109 tests passed, 0 failures

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] src/data/units/bassUnit4Redesigned.js exists (492 lines, 8 nodes)
- [x] src/data/units/bassUnit5Redesigned.js exists (627 lines, 10 nodes)
- [x] Commit 5607fd6 exists (bassUnit4Redesigned.js)
- [x] Commit ae9aa1b exists (bassUnit5Redesigned.js)
- [x] All success criteria met
