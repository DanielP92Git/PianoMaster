---
phase: 10-advanced-rhythm-node-data
plan: "02"
subsystem: trail-data
tags: [rhythm, syncopation, boss, trail-nodes, unit-8]
dependency_graph:
  requires:
    - rhythmUnit7Redesigned.js (boss_rhythm_7 prerequisite)
    - src/data/nodeTypes.js (NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES)
    - src/data/constants.js (EXERCISE_TYPES)
  provides:
    - rhythmUnit8Nodes (7 nodes, orders 149-155)
    - boss_rhythm_8 (capstone boss of entire rhythm path)
  affects:
    - src/data/expandedNodes.js (must import rhythmUnit8Redesigned.js)
tech_stack:
  added: []
  patterns:
    - Multi-exercise boss node (3 exercises, 5 questions each = 15 total)
    - Mixed time signature boss (6/8 exercise 1 + 4/4 exercises 2-3)
    - Syncopation rhythm node series (eighth-quarter, dotted quarter-eighth)
key_files:
  created:
    - src/data/units/rhythmUnit8Redesigned.js
    - src/data/units/rhythmUnit8Redesigned.test.js
  modified: []
decisions:
  - "Boss exercise 1 uses 6/8 to review Unit 7 compound meter; exercises 2-3 use 4/4 for syncopation — mirrors the dual-concept capstone design"
  - "Boss xpReward set to 250 (vs 200 in boss_rhythm_6) — capstone of ALL rhythm content warrants highest reward"
  - "Tempo range for regular nodes: 67-83 BPM (deliberately slow for syncopation clarity at introductory level)"
metrics:
  duration: "3 minutes"
  completed: "2026-03-19"
  tasks_completed: 2
  files_created: 2
  tests_passing: 21
---

# Phase 10 Plan 02: Rhythm Unit 8 — Syncopation Nodes + True Boss Summary

**One-liner:** 7-node syncopation unit (orders 149-155) with eighth-quarter and dotted quarter-eighth patterns in 4/4, ending with a 3-exercise capstone boss mixing 6/8 review and 4/4 syncopation for 15 questions at 250 XP.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create rhythmUnit8Redesigned.js | 381eb35 | src/data/units/rhythmUnit8Redesigned.js |
| 2 | Create rhythmUnit8Redesigned.test.js | 4ee42a8 | src/data/units/rhythmUnit8Redesigned.test.js |

## What Was Built

### rhythmUnit8Redesigned.js (420 lines)

Exports `rhythmUnit8Nodes` — 7 trail nodes teaching syncopation patterns:

| # | ID | Type | Order | Key Feature |
|---|-----|------|-------|-------------|
| 1 | rhythm_8_1 | DISCOVERY | 149 | Eighth-quarter syncopation intro, "Syncopation: Tap between the beats!" |
| 2 | rhythm_8_2 | PRACTICE | 150 | Reinforces eighth-quarter patterns |
| 3 | rhythm_8_3 | DISCOVERY | 151 | Dotted quarter-eighth intro, new duration 'qd' |
| 4 | rhythm_8_4 | PRACTICE | 152 | Dotted quarter groove practice |
| 5 | rhythm_8_5 | MIX_UP | 153 | All syncopation patterns + half notes |
| 6 | rhythm_8_6 | SPEED_ROUND | 154 | Syncopation speed challenge at tempo 83 |
| 7 | boss_rhythm_8 | BOSS | 155 | 3-exercise capstone: 6/8 + 4/4 + 4/4, 15 questions, 250 XP |

**Prerequisite chain:** boss_rhythm_7 -> rhythm_8_1 -> rhythm_8_2 -> rhythm_8_3 -> rhythm_8_4 -> rhythm_8_5 -> rhythm_8_6 -> boss_rhythm_8

### Boss Node Details (boss_rhythm_8)

- `category: 'boss'`, `nodeType: NODE_TYPES.BOSS`, `isBoss: true`
- `xpReward: 250` — highest in entire rhythm path
- `accessoryUnlock: 'advanced_rhythm_badge'`
- Exercise 1: 6/8 time, dotted-quarter/quarter/eighth patterns, 5 questions (Unit 7 review)
- Exercise 2: 4/4 time, eighth/quarter/dotted-quarter syncopation, 5 questions
- Exercise 3: 4/4 time, all syncopation patterns at tempo 80, 5 questions

### rhythmUnit8Redesigned.test.js (150 lines)

21 tests in 2 describe blocks validating:
- Node count, unique IDs, naming convention
- Sequential order (149-155), prerequisite chain
- Regular nodes: 4/4 time signature, 'rhythm' category, RHYTHM exercise type
- All nodes: pitch C4
- First discovery: syncopation description, DISCOVERY type
- Third node: DISCOVERY type, 'qd' duration present, dotted quarter description
- Boss: ID, nodeType, category, isBoss, 250 XP, accessory, 3 exercises
- Boss: 15 total questions (5 each), 6/8 exercise 1, 4/4 exercises 2-3, mixed time sigs
- Tempo progression (first < last regular), XP range (75-90 regular, 250 boss)

## Verification Results

1. `node --check src/data/units/rhythmUnit8Redesigned.js` — PASS (Syntax OK)
2. `npx vitest run src/data/units/rhythmUnit8Redesigned.test.js` — PASS (21/21 tests)
3. 7 unique node IDs confirmed: rhythm_8_1 through rhythm_8_6 + boss_rhythm_8
4. Boss exercise time signatures: 6/8, 4/4, 4/4 (verified via dynamic import)
5. Boss questionCount total: 15 (5 + 5 + 5)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `src/data/units/rhythmUnit8Redesigned.js` exists (420 lines)
- [x] `src/data/units/rhythmUnit8Redesigned.test.js` exists (150 lines)
- [x] Commit 381eb35 exists (feat: rhythmUnit8Redesigned.js)
- [x] Commit 4ee42a8 exists (test: rhythmUnit8Redesigned.test.js)
- [x] 21/21 tests pass
