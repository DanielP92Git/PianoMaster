---
phase: 20-curriculum-audit
plan: 01
subsystem: curriculum-audit
tags: [documentation, curriculum, rhythm, audit, pedagogy]
dependency_graph:
  requires: []
  provides:
    - "20-CURRICULUM-AUDIT.md: locked reference for Phase 22 implementation"
  affects:
    - "Phase 22: unit file rewiring driven by remediation table"
tech_stack:
  added: []
  patterns:
    - "Game-type policy: nodeType -> exercise type mapping"
    - "One-concept rule: single musical concept per discovery node"
    - "Question mix guidelines: rhythm_tap/visual_recognition/syllable_matching ratios by nodeType"
key_files:
  created:
    - ".planning/phases/20-curriculum-audit/20-CURRICULUM-AUDIT.md"
  modified: []
decisions:
  - "D-01 through D-17 from CONTEXT.md all encoded into audit document"
  - "rhythm_7_1 (6/8 + dotted quarter) ruled as single concept -- dotted quarter already known from Unit 5"
  - "rhythm_7_4 flagged as one-concept violation -- practice node with focusDurations=['8'] should have empty focusDurations"
  - "boss_rhythm_8 multi-exercise (3x arcade_rhythm) kept as-is -- intentional capstone boss design"
  - "Target state: 46 mixed_lesson + 10 arcade_rhythm = 56 total nodes"
metrics:
  duration: "5m 36s"
  completed_date: "2026-04-11"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 20 Plan 01: Curriculum Audit Summary

56-node rhythm curriculum audit documenting game-type policy, one-concept rule, and node-by-node remediation table as the locked reference for Phase 22 unit file rewiring.

## What Was Done

Audited all 56 rhythm nodes across 8 units by reading every `rhythmUnitNRedesigned.js` source file and extracting the exact current state of each node (exercise types, focusDurations, timeSignature, nodeType). Produced a comprehensive reference document at `.planning/phases/20-curriculum-audit/20-CURRICULUM-AUDIT.md` containing:

1. **Game-Type Policy** -- 8-row table mapping NODE_TYPE to required exercise type, referencing decisions D-03 through D-14
2. **One-Concept Rule** -- Definition of musical concept (duration OR time signature), with concept introduction order table showing 12 distinct concept introductions across the trail
3. **Node-by-Node Audit** -- 8 unit subsections, each with a 7-row table showing Node ID, Name, nodeType, Current Exercises, Concept Introduced, Violations, and Remediation
4. **Remediation Summary** -- 51 exercise type violations, 1 one-concept violation, 5 nodes with no violations
5. **Question Mix Guidelines** -- Recommended question distributions by nodeType with example sequences
6. **Unit Narrative Notes** -- Pedagogical flow description for each unit
7. **Appendix** -- Current vs target state summary showing transition from fragmented exercise types to unified mixed_lesson/arcade_rhythm model

## Key Findings

- **51 of 56 nodes** need exercise type changes
- **43 nodes** need conversion to `mixed_lesson` (discovery, practice, mix_up, mini_boss types)
- **8 nodes** need conversion to `arcade_rhythm` (all speed_round nodes currently using `rhythm`)
- **5 nodes** need multi-exercise consolidation into single exercises
- **1 node** (rhythm_7_4) has a one-concept violation: practice node with non-empty focusDurations
- **5 nodes** require no changes (rhythm_1_1, rhythm_1_2, rhythm_1_3, boss_rhythm_6, boss_rhythm_8)

## Commits

| Task | Name                                         | Commit    | Files                                                         |
| ---- | -------------------------------------------- | --------- | ------------------------------------------------------------- |
| 1    | Generate curriculum audit reference document | `9ba40c2` | `.planning/phases/20-curriculum-audit/20-CURRICULUM-AUDIT.md` |

## Deviations from Plan

None -- plan executed exactly as written.

## Self-Check: PASSED

- FOUND: `.planning/phases/20-curriculum-audit/20-CURRICULUM-AUDIT.md`
- FOUND: `.planning/phases/20-curriculum-audit/20-01-SUMMARY.md`
- FOUND: commit `9ba40c2`
