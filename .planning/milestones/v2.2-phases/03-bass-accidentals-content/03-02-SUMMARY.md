---
phase: 03-bass-accidentals-content
plan: "02"
subsystem: trail-content
tags: [treble-clef, accidentals, sharps, flats, curriculum-data]
dependency_graph:
  requires:
    - 03-01 (bass accidentals content — runs in same phase wave 1)
    - trebleUnit3Redesigned.js (anchor: last order 26, boss_treble_3)
  provides:
    - trebleUnit4Redesigned.js: 8 nodes (orders 27-34), F#4/C#4/G#4 sharps
    - trebleUnit5Redesigned.js: 10 nodes (orders 35-44), Bb4/Eb4/Ab4/Db4 flats + 2 boss nodes
    - boss_treble_accidentals: 15-note pool (all 7 treble accidentals + octave), xpReward:200
  affects:
    - expandedNodes.js (imports both files — but Phase 03 does NOT modify it; Phase 04 wires these in)
    - skillTrail.js (reads node order chain; contiguous 27-44 respected)
tech_stack:
  added: []
  patterns:
    - "One Discovery node per accidental (nearest-neighbor naturals: e.g. G4, G#4, A4)"
    - "SIGHT_READING excluded from flats regular nodes (enharmonic mic bug INTG-03)"
    - "Boss nodes SIGHT_READING safe: inert until Phase 04 wires into expandedNodes.js"
    - "boss_treble_accidentals is sole node with sharps in Unit 5 file (cross-unit challenge)"
key_files:
  created: []
  modified:
    - src/data/units/trebleUnit4Redesigned.js
    - src/data/units/trebleUnit5Redesigned.js
decisions:
  - "Unit 4 expanded from 7 to 8 nodes: G#4 Discovery added (Phase 03 requirement)"
  - "Unit 5 expanded from 8 to 10 nodes: Ab4/Db4 Discovery nodes added (Phase 03 requirement)"
  - "Unit 5 START_ORDER updated from 34 to 35 (Unit 4 now ends at order 34 after expansion)"
  - "boss_treble_accidentals pool expanded from 12 to 15 notes: G#4, Ab4, Db4 added to cover all 7 treble accidentals"
  - "SIGHT_READING excluded from all regular (non-boss) flats nodes: mic outputs enharmonic sharp form only"
  - "SIGHT_READING included in both boss nodes (boss_treble_5, boss_treble_accidentals): safe because these nodes are inert until Phase 04 adds them to expandedNodes.js"
  - "No sharps in any flats regular node notePool: flats unit is strictly flat-only except the cross-unit accidentals boss"
metrics:
  duration_seconds: 226
  completed_date: "2026-03-15"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 03 Plan 02: Treble Accidentals Unit Replacement Summary

Replaced both Phase 02 treble accidental unit files with expanded versions covering 3 sharps (F#4, C#4, G#4) and 4 flats (Bb4, Eb4, Ab4, Db4) — one Discovery node per accidental each. Boss node for all 7 treble accidentals covers 15-note pool with xpReward 200.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Delete and re-author trebleUnit4Redesigned.js (3 sharps) | 789b3fe | src/data/units/trebleUnit4Redesigned.js |
| 2 | Delete and re-author trebleUnit5Redesigned.js (4 flats + treble boss) | 1355728 | src/data/units/trebleUnit5Redesigned.js |

## What Was Built

### trebleUnit4Redesigned.js (8 nodes, orders 27-34)

The Phase 02 version had 7 nodes covering only F#4 and C#4. The Phase 03 replacement adds G#4:

| Order | ID | Type | notePool | Exercise |
|-------|----|------|----------|---------|
| 27 | treble_4_1 | DISCOVERY | F4, F#4, G4 | NOTE_RECOGNITION x8 (focusNotes: F#4) |
| 28 | treble_4_2 | DISCOVERY | C4, C#4, D4 | NOTE_RECOGNITION x8 (focusNotes: C#4) |
| 29 | treble_4_3 | DISCOVERY | G4, G#4, A4 | NOTE_RECOGNITION x8 (focusNotes: G#4) — NEW |
| 30 | treble_4_4 | PRACTICE | F#4, C#4, G#4 | SIGHT_READING (2 measures, quarter, tempo 65) |
| 31 | treble_4_5 | PRACTICE | CDE context + 3 sharps (9 notes) | SIGHT_READING (2 measures, quarter+half, tempo 70) |
| 32 | treble_4_6 | MIX_UP | Full octave + 3 sharps (11 notes) | MEMORY_GAME (4x4, treble, 180s) |
| 33 | treble_4_7 | SPEED_ROUND | Same 11 notes | NOTE_RECOGNITION x20 (timeLimit: 150000) |
| 34 | boss_treble_4 | BOSS | Same 11 notes | NOTE_RECOGNITION x15 + SIGHT_READING |

### trebleUnit5Redesigned.js (10 nodes, orders 35-44)

The Phase 02 version had 8 nodes covering only Bb4 and Eb4. The Phase 03 replacement adds Ab4 and Db4:

| Order | ID | Type | notePool | Exercise |
|-------|----|------|----------|---------|
| 35 | treble_5_1 | DISCOVERY | A4, Bb4, B4 | NOTE_RECOGNITION x8 (focusNotes: Bb4) |
| 36 | treble_5_2 | DISCOVERY | D4, Eb4, E4 | NOTE_RECOGNITION x8 (focusNotes: Eb4) |
| 37 | treble_5_3 | DISCOVERY | G4, Ab4, A4 | NOTE_RECOGNITION x8 (focusNotes: Ab4) — NEW |
| 38 | treble_5_4 | DISCOVERY | C4, Db4, D4 | NOTE_RECOGNITION x8 (focusNotes: Db4) — NEW |
| 39 | treble_5_5 | PRACTICE | Bb4, Eb4, Ab4, Db4 | NOTE_RECOGNITION x10 |
| 40 | treble_5_6 | PRACTICE | CDE context + all 4 flats (10 notes) | NOTE_RECOGNITION x12 |
| 41 | treble_5_7 | MIX_UP | Full octave + 4 flats (12 notes) | MEMORY_GAME (4x4, treble, 180s) |
| 42 | treble_5_8 | SPEED_ROUND | Same 12 notes | NOTE_RECOGNITION x20 (timeLimit: 150000) |
| 43 | boss_treble_5 | BOSS | Same 12 notes | NOTE_RECOGNITION x15 + SIGHT_READING |
| 44 | boss_treble_accidentals | BOSS | All 7 accidentals + octave (15 notes) | NOTE_RECOGNITION x15 + SIGHT_READING, xpReward: 200 |

### Prerequisite Chain

```
boss_treble_3 -> treble_4_1 -> treble_4_2 -> treble_4_3 -> treble_4_4 ->
treble_4_5 -> treble_4_6 -> treble_4_7 -> boss_treble_4 ->
treble_5_1 -> treble_5_2 -> treble_5_3 -> treble_5_4 -> treble_5_5 ->
treble_5_6 -> treble_5_7 -> treble_5_8 -> boss_treble_5 -> boss_treble_accidentals
```

## Decisions Made

1. **G#4 Discovery node added to Unit 4**: Phase 03 expanded sharps coverage from 2 to 3. Node uses nearest-neighbor naturals G4 and A4.

2. **Ab4 and Db4 Discovery nodes added to Unit 5**: Phase 03 expanded flats coverage from 2 to 4. Ab4 uses G4/A4 context; Db4 uses C4/D4 context.

3. **Unit 5 START_ORDER updated 34 → 35**: Unit 4 gained one node (order 34 is boss_treble_4), so Unit 5 correctly starts at 35.

4. **boss_treble_accidentals expanded from 12 to 15 notes**: Phase 02 pool had only F#4, C#4, Bb4, Eb4. Phase 03 adds G#4, Ab4, Db4 to cover all 7 treble accidentals.

5. **SIGHT_READING excluded from all regular flats nodes**: Mic pitch detection outputs enharmonic sharp form (A#4, D#4, G#4, C#4) — not flat form. All regular nodes in Unit 5 use NOTE_RECOGNITION only. This constraint applies to both the discovery and practice nodes.

6. **SIGHT_READING present in boss nodes only**: boss_treble_5 and boss_treble_accidentals include SIGHT_READING exercises. These are safe because both boss nodes remain inert (not in expandedNodes.js) until Phase 04 wires them in and fixes INTG-03.

7. **No sharps in regular flats node notePools**: The flats unit is strictly flat-only. F#4, C#4, G#4 only appear in boss_treble_accidentals (the cross-unit challenge).

## Verification Results

- trebleUnit4Redesigned.js: 8 nodes, orders 27-34, all accidentals:true, all clef:'treble', boss has category:'boss'/isBoss:true/2 exercises, G#4 Discovery present, prereq chain starts from boss_treble_3
- trebleUnit5Redesigned.js: 10 nodes, orders 35-44, all accidentals:true, all clef:'treble', no SIGHT_READING in regular nodes, 2 boss nodes with category:'boss'/isBoss:true/2 exercises each, Ab4/Db4 Discovery present, 15-note accidentals boss pool, xpReward:200, prereq chain starts from boss_treble_4
- Orders contiguous 27-44, no collisions
- All 7 treble accidentals (F#4, C#4, G#4, Bb4, Eb4, Ab4, Db4) present in boss_treble_accidentals pool
- All 109 tests pass (no regressions)

## Deviations from Plan

None — plan executed exactly as written. Both files replaced with expanded accidental coverage matching all `must_haves` truths.

## Self-Check

Files created/modified:
- [x] src/data/units/trebleUnit4Redesigned.js — FOUND
- [x] src/data/units/trebleUnit5Redesigned.js — FOUND

Commits:
- [x] 789b3fe (trebleUnit4) — FOUND
- [x] 1355728 (trebleUnit5) — FOUND

## Self-Check: PASSED
