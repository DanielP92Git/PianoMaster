---
phase: quick
plan: 260326-s6x
subsystem: sight-reading-game, trail-data
tags: [bugfix, sight-reading, accidentals, pattern-generation, trail-nodes]
dependency_graph:
  requires: []
  provides: [correct-accidental-sorting, musical-sharp-practice-patterns]
  affects: [patternBuilder.js, treble_4_4, bass_4_4]
tech_stack:
  added: []
  patterns: [NOTE_FREQUENCIES lookup, chromatic equal-temperament frequencies]
key_files:
  modified:
    - src/components/games/sight-reading-game/constants/staffPositions.js
    - src/components/games/sight-reading-game/utils/patternBuilder.test.js
    - src/data/units/trebleUnit4Redesigned.js
    - src/data/units/bassUnit4Redesigned.js
decisions:
  - Expand treble_4_4 and bass_4_4 notePools to include full natural context (C-A range) alongside sharps, matching the pattern of the successor node (treble_4_5 / bass_4_5)
  - Add both sharp and flat spellings for all enharmonic pairs in NOTE_FREQUENCIES to handle future flat-based pools
metrics:
  duration_seconds: 140
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_modified: 4
---

# Quick Task 260326-s6x Summary

## One-liner

Fixed sight-reading sharp practice nodes by expanding sharp-only note pools to mixed sharp+natural pools and adding chromatic accidental frequencies to NOTE_FREQUENCIES for correct beginner-mode sorting.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add accidental frequencies to NOTE_FREQUENCIES and test beginner-mode sorting | 1ee1fb7 | staffPositions.js, patternBuilder.test.js |
| 2 | Update sharp-only notePool data in treble and bass unit 4 nodes | 7ab6fe0 | trebleUnit4Redesigned.js, bassUnit4Redesigned.js |

## Problem Fixed

The "Sharps Together" trail nodes (treble_4_4, bass_4_4) passed only 3 sharp notes to the sight-reading pattern generator:
- `treble_4_4`: `['F#4', 'C#4', 'G#4']` — only sharps
- `bass_4_4`: `['F#3', 'C#3', 'G#3']` — only sharps

This produced unmusical patterns of nothing but sharp notes. Additionally, since `NOTE_FREQUENCIES` had no entries for accidentals, all sharps sorted to frequency=0, breaking beginner-mode adjacent-note selection.

## Fixes Applied

**Task 1 — staffPositions.js:**
- Added 50+ chromatic accidental entries to `NOTE_FREQUENCIES` covering octaves 2-6
- Both sharp (`F#4: 369.99`) and flat (`Gb4: 369.99`) spellings for all enharmonic pairs
- Used standard equal temperament (each semitone = natural × 2^(1/12))

**Task 2 — Unit data files:**
- `treble_4_4` notePool expanded: `['C4','C#4','D4','E4','F4','F#4','G4','G#4','A4']`
- `bass_4_4` notePool expanded: `['C3','C#3','D3','E3','F3','F#3','G3','G#3','A3']`
- Same expansion applied to `noteConfig.contextNotes`, `exercises[0].config.notePool`, and `skills`
- Updated description to "Play F#, C#, and G# mixed with natural notes"
- Node IDs, prerequisites, exercise types, XP rewards, and rhythm configs unchanged

## Verification

- `npm run verify:trail`: passed (171 nodes, no broken prereqs, cycles, or invalid data)
- `npx vitest run patternBuilder.test.js`: 23/23 tests pass including 3 new accidental sorting tests

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `src/components/games/sight-reading-game/constants/staffPositions.js` — FOUND
- `src/components/games/sight-reading-game/utils/patternBuilder.test.js` — FOUND
- `src/data/units/trebleUnit4Redesigned.js` — FOUND
- `src/data/units/bassUnit4Redesigned.js` — FOUND
- Commit 1ee1fb7 — FOUND
- Commit 7ab6fe0 — FOUND
