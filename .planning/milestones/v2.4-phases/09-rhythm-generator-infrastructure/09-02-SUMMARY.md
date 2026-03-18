---
phase: 09-rhythm-generator-infrastructure
plan: "02"
subsystem: vexflow-rendering
tags: [vexflow, beaming, compound-time, 6/8, notation, tdd]
dependency_graph:
  requires: []
  provides:
    - beamGroupUtils.js with beamGroupsForTimeSignature() helper
    - Correct 3+3 beam grouping for 6/8 in all rendering paths
  affects:
    - src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx
    - src/components/games/sight-reading-game/components/RhythmPatternPreview.jsx
tech_stack:
  added: []
  patterns:
    - beamGroupsForTimeSignature returns Fraction[] for compound time, null for simple time
    - beamConfig = beamGroups ? { groups: beamGroups } : {} spread pattern for zero-regression on 4/4
key_files:
  created:
    - src/components/games/sight-reading-game/utils/beamGroupUtils.js
    - src/components/games/sight-reading-game/utils/beamGroupUtils.test.js
  modified:
    - src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx
    - src/components/games/sight-reading-game/components/RhythmPatternPreview.jsx
decisions:
  - "beamGroupsForTimeSignature returns null (not []) for simple time so beamConfig = {} leaves VexFlow defaults fully intact"
  - "RhythmPatternPreview received new optional timeSignature prop (default 4/4) rather than hardcoding — callers can pass 6/8 to get correct beaming in preview tiles"
  - "beamConfig computed once per renderStaff call (not per-bar) since all bars in a pattern share the same time signature"
metrics:
  duration_minutes: 4
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_changed: 4
---

# Phase 09 Plan 02: Beam Group Helper and 6/8 Rendering Fix Summary

**One-liner:** beamGroupsForTimeSignature helper threads 3+3 compound beaming through all 7 VexFlow Beam.generateBeams call sites so 6/8 displays correctly instead of VexFlow's default 2+2+2.

## What Was Built

A new utility `beamGroupUtils.js` exports `beamGroupsForTimeSignature(timeSignature)` which returns an array of VexFlow `Fraction(3, 8)` objects for compound time signatures and `null` for simple time. This null-returns-default pattern means passing `beamConfig = {}` to `Beam.generateBeams` for 4/4/3/4/2/4 leaves VexFlow's behavior completely unchanged — zero regression risk.

The helper was threaded into:
- **VexFlowStaffDisplay.jsx** — all 6 call sites (4 grand staff paths + 2 single staff paths) now pass `beamConfig`
- **RhythmPatternPreview.jsx** — the single call site now merges `groups` into the existing `{ stem_direction: Stem.UP }` config

A `timeSignature` prop was added to `RhythmPatternPreview` (default `"4/4"`) so callers showing 6/8 rhythm preview tiles can get correct beaming.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create beamGroupUtils.js helper with tests | 5b91e0d | beamGroupUtils.js, beamGroupUtils.test.js |
| 2 | Thread beam groups into all VexFlow rendering paths | e4f7082 | VexFlowStaffDisplay.jsx, RhythmPatternPreview.jsx |

## Verification Results

- `npx vitest run src/components/games/sight-reading-game/utils/beamGroupUtils.test.js` — 8/8 tests pass
- `npm run build` — exits 0, no new errors
- `grep -c "beamConfig" VexFlowStaffDisplay.jsx` — 8 (2 assignment + 6 call sites)
- All 7 `Beam.generateBeams()` call sites verified updated; no bare single-argument calls remain

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Functionality] Added timeSignature prop to RhythmPatternPreview**
- **Found during:** Task 2
- **Issue:** The plan stated to check how RhythmPatternPreview accesses timeSignature. It did not have the prop at all — it only received `events`. Without the prop, beamGroupsForTimeSignature could not be called with a dynamic value.
- **Fix:** Added optional `timeSignature = "4/4"` prop to the component signature and dependency array. Default preserves existing behavior; callers showing 6/8 patterns can now pass `timeSignature="6/8"` for correct beaming.
- **Files modified:** RhythmPatternPreview.jsx
- **Commit:** e4f7082

## Self-Check: PASSED
