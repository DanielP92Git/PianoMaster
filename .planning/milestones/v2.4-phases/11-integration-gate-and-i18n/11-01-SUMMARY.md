---
phase: 11-integration-gate-and-i18n
plan: 01
subsystem: trail-data
tags: [integration, trail, expandedNodes, skillTrail, content-expansion]
dependency_graph:
  requires:
    - 10-01 (rhythmUnit7Redesigned.js — 6/8 compound meter nodes)
    - 10-02 (rhythmUnit8Redesigned.js — syncopation nodes)
    - 08-02 (trebleUnit6/7 and bassUnit6/7 key signature nodes)
  provides:
    - All 6 new unit files wired into trail node aggregation
    - UNITS metadata for 8 units (6 new + 2 backfill) in skillTrail.js
  affects:
    - TrailMap UI (new nodes now visible and navigable)
    - getNodesByCategory() returns correct expanded counts per category
    - UnitProgressCard UNITS display includes all 8 new unit headers
tech_stack:
  added: []
  patterns:
    - expandedNodes.js import aggregation pattern (spread into 4 arrays)
    - UNITS metadata object with section header comments
key_files:
  modified:
    - src/data/expandedNodes.js
    - src/data/skillTrail.js
  created: []
decisions:
  - "subscriptionConfig.js left untouched — default-deny gate means all new nodes are premium by default (INTG-02 satisfied without code change)"
  - "RHYTHM_7.name = 'Six-Eight Time' in UNITS (not 'Big Beats') per CONTEXT.md locked decision; node-level unitName in rhythmUnit7Redesigned.js remains 'Big Beats' — intentional harmless divergence"
  - "No icon field on TREBLE_6/7, BASS_6/7, RHYTHM_5-8 entries — UnitProgressCard does not render it (CONTEXT.md locked decision)"
  - "RHYTHM_5 and RHYTHM_6 backfilled to close gap in UNITS (was missing after RHYTHM_4)"
metrics:
  duration: 3 minutes
  completed_date: "2026-03-19"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
  files_created: 0
---

# Phase 11 Plan 01: Integration Gate Summary

Wire 6 new unit files into expandedNodes.js import aggregation and add 8 UNITS metadata entries (6 new + 2 backfill) to skillTrail.js so all new key signature and advanced rhythm nodes appear in the trail UI.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wire 6 new unit imports into expandedNodes.js | 65f08c8 | src/data/expandedNodes.js |
| 2 | Add 8 UNITS metadata entries to skillTrail.js | a12a84f | src/data/skillTrail.js |

## What Was Built

### Task 1: expandedNodes.js Wiring

Added 6 new import statements and spread each into all 4 export arrays:

- `trebleUnit6Nodes` and `trebleUnit7Nodes` (key signature treble units) — imported and spread into `EXPANDED_NODES` and `EXPANDED_TREBLE_NODES`
- `bassUnit6Nodes` and `bassUnit7Nodes` (key signature bass units) — imported and spread into `EXPANDED_NODES` and `EXPANDED_BASS_NODES`
- `rhythmUnit7Nodes` and `rhythmUnit8Nodes` (6/8 + syncopation) — imported and spread into `EXPANDED_NODES` and `EXPANDED_RHYTHM_NODES`

Header comment updated to reflect Units 1-7 treble/bass and Units 1-8 rhythm.

`verify:trail` confirms 171 total nodes (previously 93 + prior expansion from phases 07-10).

### Task 2: skillTrail.js UNITS Metadata

Added 8 entries under organized section headers:

**Backfill (filling gap after RHYTHM_4):**
- `RHYTHM_5`: Magic Dots (dotted notes and 3/4 time)
- `RHYTHM_6`: Speed Champions (sixteenth notes)

**New key signature treble (under "KEY SIGNATURE UNITS (TREBLE)" header):**
- `TREBLE_6`: Key Signatures: Sharps (G major, D major)
- `TREBLE_7`: Key Signatures: Mixed (all six major key signatures)

**New key signature bass (under "KEY SIGNATURE UNITS (BASS)" header):**
- `BASS_6`: Key Signatures: Sharps (G major, D major in bass)
- `BASS_7`: Key Signatures: Mixed (all six in bass)

**New advanced rhythm:**
- `RHYTHM_7`: Six-Eight Time (compound meter)
- `RHYTHM_8`: Off-Beat Magic (syncopation)

## Verification Results

- `npm run verify:trail` — Passed with warnings (XP variance 22.1% — pre-existing, non-blocking)
- `npm run build` — Passed (exit 0, 42.48s)
- `grep -c` for 6 unit names in expandedNodes.js — 18 occurrences (>= 12 required)
- `grep -c` for 8 UNITS keys in skillTrail.js — 8 occurrences
- `git diff src/config/subscriptionConfig.js` — empty (no changes; INTG-02 satisfied)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- `src/data/expandedNodes.js` modified — FOUND
- `src/data/skillTrail.js` modified — FOUND
- Commit 65f08c8 exists — FOUND
- Commit a12a84f exists — FOUND
- `src/config/subscriptionConfig.js` unchanged — CONFIRMED
