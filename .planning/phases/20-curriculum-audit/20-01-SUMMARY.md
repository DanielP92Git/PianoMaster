---
phase: 20-curriculum-audit
plan: "01"
subsystem: curriculum-documentation
tags:
  - curriculum-audit
  - rhythm-trail
  - documentation
  - phase-22-blueprint
dependency_graph:
  requires: []
  provides:
    - docs/curriculum-audit-v3.2.md
  affects:
    - .planning/phases/22-*/
tech_stack:
  added: []
  patterns:
    - markdown-audit-document
key_files:
  created:
    - docs/curriculum-audit-v3.2.md
  modified: []
decisions:
  - Game-type policy locked in table form (D-04 through D-11, 8 node types to exercise types)
  - One-concept rule codified verbatim (D-12 through D-14)
  - 44 game-type violations catalogued with node IDs and required changes (G-01 through G-44)
  - 5 CURR-01 concept violations catalogued (C-01 through C-05)
  - Kodaly resequencing deferred to CURR-F01 — violations flagged but not in remediation list
metrics:
  duration: "6 minutes"
  completed_date: "2026-04-06"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 0
requirements:
  - CURR-01
  - CURR-02
  - CURR-03
  - CURR-04
---

# Phase 20 Plan 01: Rhythm Trail Curriculum Audit Document Summary

**One-liner:** Complete rhythm trail audit for Phase 22 — 56-node policy compliance inventory with 44 game-type fixes and 5 concept fixes committed to docs/curriculum-audit-v3.2.md

## What Was Built

Created `docs/curriculum-audit-v3.2.md` as the sole implementation reference for Phase 22. The document locks all pedagogical decisions before any source files are modified:

1. **Game-Type Policy table** — maps all 8 node types (DISCOVERY, PRACTICE, MIX_UP, REVIEW, CHALLENGE, SPEED_ROUND, MINI_BOSS, BOSS) to required exercise types (D-04 through D-11)
2. **One-Concept Rule definitions** — D-12, D-13, D-14 stated verbatim
3. **Kodaly Ordering section** — expected sequence, deferred resequencing explanation
4. **8 unit node tables** — 56 rows (7 per unit x 8 units) with node ID, name, node type, current game, introduced concept, violations, and Kodaly order flag
5. **Violation Summary Statistics** — game-type counts by unit, 5 CURR-01 violations, 2 Kodaly flags
6. **Remediation List** — G-01 through G-44 (game-type fixes) and C-01 through C-05 (concept fixes)
7. **Open Questions section** — 2 unresolved items for Phase 22 planner
8. **Assumptions table** — A1 through A4 with risk assessments

## Tasks Completed

| Task | Name                                                            | Commit  | Files                                    |
| ---- | --------------------------------------------------------------- | ------- | ---------------------------------------- |
| 1    | Write audit document header, policy sections, and 8 unit tables | e3f9c1b | docs/curriculum-audit-v3.2.md (created)  |
| 2    | Write the remediation list and open questions sections          | 6adcd3d | docs/curriculum-audit-v3.2.md (extended) |

## Key Findings from Audit

- **Primary finding:** Game-type policy violations are pervasive — 39 of 56 nodes use the wrong exercise type
- **Most common violation:** Bare `RHYTHM` legacy type on Discovery/Practice nodes (predates v2.9 redesign)
- **MINI_BOSS pattern:** All 6 MINI_BOSS nodes incorrectly use ARCADE_RHYTHM; should use RHYTHM_TAP per D-10
- **SPEED_ROUND pattern:** All 8 SPEED_ROUND nodes incorrectly use RHYTHM; should use ARCADE_RHYTHM per D-09
- **Concept violations:** Units 7 and 8 list already-learned durations in focusDurations — real concepts are "duration in compound meter" and "syncopation technique"

## Decisions Made

- **Game-type policy is the authoritative reference** for Phase 22 node updates; EXERCISE_TYPES constant mapping to game components must be verified during Phase 22 implementation (Open Question 1)
- **Kodaly resequencing explicitly deferred** to CURR-F01; violations flagged in tables but excluded from remediation list per D-17
- **G-26 (rhythm_5_5) is conditional** — marked as violation pending Open Question 1 resolution (RHYTHM_TAP may already be the correct MetronomeTrainer type)
- **CURR-01 fix strategy for Units 7-8** — set focusDurations: [] and update newContentDescription to describe the technique (syncopation, compound meter context) rather than the duration

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan produces a documentation artifact, not application code.

## Threat Flags

None — documentation file only; no secrets, PII, or credentials. No attack surface change.

## Self-Check: PASSED

- `docs/curriculum-audit-v3.2.md` exists at `/c/Development/PianoApp2/.claude/worktrees/agent-acaaa0f2/docs/curriculum-audit-v3.2.md`
- Commit e3f9c1b exists: Task 1 (policy + unit tables)
- Commit 6adcd3d exists: Task 2 (remediation list + open questions + assumptions)
- All 56 node IDs verified present
- All 44 G-entries and 5 C-entries verified present
- No Kodaly resequencing in remediation list (D-17 compliant)
