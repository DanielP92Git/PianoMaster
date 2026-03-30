---
phase: 11-arcade-rhythm-game-rhythm-node-remapping
plan: "02"
subsystem: trail-data
tags: [rhythm, trail-data, exercise-types, migration]
dependency_graph:
  requires: []
  provides: [remapped-rhythm-nodes, rhythm-progress-reset-migration]
  affects: [trail-map, rhythm-game-routing, student-progress]
tech_stack:
  added: []
  patterns: [mixed-exercise-type-distribution, db-migration-reset-pattern]
key_files:
  created:
    - supabase/migrations/20260330000001_reset_rhythm_node_progress.sql
  modified:
    - src/data/units/rhythmUnit1Redesigned.js
    - src/data/units/rhythmUnit2Redesigned.js
    - src/data/units/rhythmUnit3Redesigned.js
    - src/data/units/rhythmUnit4Redesigned.js
    - src/data/units/rhythmUnit5Redesigned.js
    - src/data/units/rhythmUnit6Redesigned.js
    - src/data/units/rhythmUnit7Redesigned.js
    - src/data/units/rhythmUnit8Redesigned.js
decisions:
  - "D-12 distribution applied: 3x RHYTHM + 2x RHYTHM_TAP + 1x RHYTHM_DICTATION + 1x ARCADE_RHYTHM per unit (7 nodes)"
  - "Boss nodes with multiple exercises (units 5 and 8) have ALL exercises changed to ARCADE_RHYTHM"
  - "Migration resets exercise_progress, stars, and best_score using LIKE pattern covering both rhythm_* and boss_rhythm_* IDs"
metrics:
  duration: "~10 minutes"
  completed: "2026-03-30"
  tasks_completed: 2
  files_modified: 9
---

# Phase 11 Plan 02: Rhythm Node Remapping + DB Migration Summary

DB migration to reset stale rhythm progress and remapping all 8 rhythm unit data files from all-MetronomeTrainer to mixed exercise types (RHYTHM/RHYTHM_TAP/RHYTHM_DICTATION/ARCADE_RHYTHM).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create DB migration to reset rhythm node progress | f24123f | supabase/migrations/20260330000001_reset_rhythm_node_progress.sql |
| 2 | Remap all 8 rhythm unit data files to mixed exercise types | b32804d | src/data/units/rhythmUnit{1-8}Redesigned.js |

## What Was Built

### Task 1: DB Migration

`supabase/migrations/20260330000001_reset_rhythm_node_progress.sql` resets `exercise_progress`, `stars`, and `best_score` to clean state for all `rhythm_*` and `boss_rhythm_*` nodes. This eliminates stale single-exercise progress records that would conflict with the new multi-type exercise assignments.

**CRITICAL DEPLOY CONSTRAINT:** This migration MUST be applied via `supabase db push` or the Supabase dashboard BEFORE the updated JS files deploy to production. The migration must precede the code deploy in the deployment sequence.

### Task 2: Rhythm Unit Remapping

All 8 rhythm units (56 nodes total) now have mixed exercise types per the D-11/D-12/D-13 design decisions:

| orderInUnit | Before | After | Game |
|---|---|---|---|
| 1 | EXERCISE_TYPES.RHYTHM | EXERCISE_TYPES.RHYTHM (unchanged) | MetronomeTrainer |
| 2 | EXERCISE_TYPES.RHYTHM | EXERCISE_TYPES.RHYTHM (unchanged) | MetronomeTrainer |
| 3 | EXERCISE_TYPES.RHYTHM | EXERCISE_TYPES.RHYTHM_TAP | RhythmReadingGame |
| 4 | EXERCISE_TYPES.RHYTHM | EXERCISE_TYPES.RHYTHM_DICTATION | RhythmDictationGame |
| 5 | EXERCISE_TYPES.RHYTHM | EXERCISE_TYPES.RHYTHM_TAP | RhythmReadingGame |
| 6 | EXERCISE_TYPES.RHYTHM | EXERCISE_TYPES.RHYTHM (unchanged) | MetronomeTrainer |
| 7 (boss) | EXERCISE_TYPES.RHYTHM | EXERCISE_TYPES.ARCADE_RHYTHM | ArcadeRhythmGame |

**Distribution across all 8 units (56 nodes):**
- EXERCISE_TYPES.RHYTHM: 24 nodes (43%) — MetronomeTrainer
- EXERCISE_TYPES.RHYTHM_TAP: 16 nodes (29%) — RhythmReadingGame
- EXERCISE_TYPES.RHYTHM_DICTATION: 8 nodes (14%) — RhythmDictationGame
- EXERCISE_TYPES.ARCADE_RHYTHM: 8 nodes (14%) — ArcadeRhythmGame

Note: Units 5 and 8 have boss nodes with multiple exercises (2 and 3 respectively) — all were changed to ARCADE_RHYTHM consistently.

## Verification

- `npm run verify:trail` passes with warnings (XP variance warning is pre-existing, unrelated to this plan)
- All 8 files show: 2x RHYTHM_TAP, 1x RHYTHM_DICTATION, 1+ ARCADE_RHYTHM per file
- Migration SQL confirmed: contains UPDATE, exercise_progress, stars, best_score, WHERE LIKE patterns

## Deviations from Plan

None — plan executed exactly as written.

The plan's interface documentation showed `RHYTHM_TAP: 'rhythm_reading'` as the string value, but the actual `constants.js` has `RHYTHM_TAP: 'rhythm_tap'`. This is not a deviation — the implementation correctly uses the constant `EXERCISE_TYPES.RHYTHM_TAP` (not the string value), so the correct runtime value is used regardless.

## Deployment Checklist

1. Apply migration: `supabase db push` (or Supabase dashboard)
2. Verify migration applied: check `supabase migration list`
3. Deploy JS files (Netlify auto-deploys on push to main)
4. The migration MUST complete before step 3

## Known Stubs

None — all exercise type changes are wired to valid constants from `src/data/constants.js`. No placeholder data.

## Self-Check: PASSED
