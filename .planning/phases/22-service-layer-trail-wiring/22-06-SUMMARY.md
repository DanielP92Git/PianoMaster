---
phase: 22-service-layer-trail-wiring
plan: "06"
subsystem: trail-data
tags: [trail, section-headers, data-fix, gap-closure]
dependency_graph:
  requires: []
  provides: [corrected-rhythm-section-headers]
  affects: [trail-map-ui]
tech_stack:
  added: []
  patterns: []
key_files:
  modified:
    - src/data/skillTrail.js
decisions:
  - "Kept RHYTHM_4 reward ID as rest_master_badge since unit 4 IS about rests"
  - "Updated RHYTHM_2 reward ID to beat_builder_badge and RHYTHM_3 to fast_note_badge to match content"
metrics:
  duration_seconds: 127
  completed: "2026-04-08T20:09:06Z"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 22 Plan 06: Fix Rhythm Section Headers Summary

Corrected RHYTHM_2/3/4 section headers, descriptions, themes, and reward names in skillTrail.js to match redesigned unit file content.

## What Changed

After the unit files were redesigned in Phase 22 Plan 02, the section headers in skillTrail.js were not updated, causing misleading labels in the trail map UI.

| Section   | Before (wrong)          | After (correct)     | Actual Unit Content |
| --------- | ----------------------- | ------------------- | ------------------- |
| RHYTHM_2  | Eighth Notes            | Beat Builders       | Half/whole notes    |
| RHYTHM_3  | Whole Notes & Rests     | Fast Note Friends   | Eighth notes        |
| RHYTHM_4  | Dotted & Syncopation    | Quiet Moments       | Quarter/half rests  |

Fields updated per section: `name`, `description`, `theme`, `reward.id`, `reward.name`.

## Task Completion

### Task 1: Update RHYTHM_2/3/4 section headers, descriptions, themes, and reward names

- **Status:** Complete
- **Commit:** fb83eb5
- **Files:** src/data/skillTrail.js
- **Verification:** Trail validator passes (11 validators), build passes, all three section names confirmed correct

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `npm run verify:trail` -- PASSED (all 11 validators pass, 185 nodes)
2. `npm run build` -- PASSED (built in ~41s)
3. RHYTHM_2 name confirmed: "Beat Builders"
4. RHYTHM_3 name confirmed: "Fast Note Friends"
5. RHYTHM_4 name confirmed: "Quiet Moments"

## Self-Check: PASSED

- src/data/skillTrail.js: FOUND
- 22-06-SUMMARY.md: FOUND
- Commit fb83eb5: FOUND
