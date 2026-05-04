---
phase: 32-game-design-differentiation
plan: "02"
subsystem: rhythm-trail-data
tags: [rhythm, trail-nodes, data-cleanup, subscription-config]
dependency_graph:
  requires: []
  provides: [6-node-rhythm-units, clean-mix-up-removal]
  affects: [trail-map, subscription-gate, skill-progress]
tech_stack:
  added: []
  patterns: [node-removal-with-cascade, START_ORDER-chain]
key_files:
  created: []
  modified:
    - src/data/units/rhythmUnit1Redesigned.js
    - src/data/units/rhythmUnit2Redesigned.js
    - src/data/units/rhythmUnit3Redesigned.js
    - src/data/units/rhythmUnit4Redesigned.js
    - src/data/units/rhythmUnit5Redesigned.js
    - src/data/units/rhythmUnit6Redesigned.js
    - src/data/units/rhythmUnit7Redesigned.js
    - src/data/units/rhythmUnit8Redesigned.js
    - src/config/subscriptionConfig.js
    - src/data/units/rhythmUnit7Redesigned.test.js
    - src/data/units/rhythmUnit8Redesigned.test.js
decisions:
  - "Kept rhythm_X_6 IDs for Speed Round nodes (renumbered orderInUnit only, not IDs) to minimize DB orphan impact"
metrics:
  duration: "7m 17s"
  completed: "2026-04-20T18:22:04Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 11
---

# Phase 32 Plan 02: Remove Mix-Up Nodes from Rhythm Units Summary

Deleted 6 aspirational Mix-Up nodes (rhythm_X_5) from rhythm Units 1, 2, 3, 6, 7, 8 and cascaded START_ORDER renumbering across all 8 unit files. Shrinks affected units from 7 to 6 nodes with a clean Discovery-Practice-Discovery-Practice-Speed-Boss flow.

## Task Results

### Task 1: Remove Mix-Up nodes from Units 1-3 and cascade START_ORDER

**Commit:** `17832f9`
**Files:** rhythmUnit1Redesigned.js, rhythmUnit2Redesigned.js, rhythmUnit3Redesigned.js, rhythmUnit4Redesigned.js, rhythmUnit5Redesigned.js

- Deleted rhythm_1_5, rhythm_2_5, rhythm_3_5 (Mix-Up nodes)
- Re-wired Speed Round prerequisites from rhythm_X_5 to rhythm_X_4
- Renumbered Speed Round (orderInUnit 6->5) and Boss (orderInUnit 7->6)
- Cascaded START_ORDER: U1=100 (unchanged), U2=106, U3=112, U4=118, U5=125
- Updated header comments from "7 nodes" to "6 nodes"

### Task 2: Remove Mix-Up nodes from Units 6-8, update subscriptionConfig, and fix tests

**Commit:** `5fe696e`
**Files:** rhythmUnit6Redesigned.js, rhythmUnit7Redesigned.js, rhythmUnit8Redesigned.js, subscriptionConfig.js, rhythmUnit7Redesigned.test.js, rhythmUnit8Redesigned.test.js

- Deleted rhythm_6_5, rhythm_7_5, rhythm_8_5 (Mix-Up nodes)
- Re-wired Speed Round prerequisites from rhythm_X_5 to rhythm_X_4
- Renumbered Speed Round (orderInUnit 6->5) and Boss (orderInUnit 7->6)
- Cascaded START_ORDER: U6=132, U7=138, U8=144
- Removed rhythm_1_5 from FREE_RHYTHM_NODE_IDS (rhythm count 6->5, total 25->24)
- Updated Unit 7 tests: 7->6 nodes, orders 138-143, removed mix_up exercise type
- Updated Unit 8 tests: 7->6 nodes, orders 144-149, removed mix_up exercise type, adjusted indices

## Order Cascade Summary

| Unit | Old START_ORDER | New START_ORDER | Old Range | New Range | Nodes         |
| ---- | --------------- | --------------- | --------- | --------- | ------------- |
| 1    | 100             | 100             | 100-106   | 100-105   | 7->6          |
| 2    | 107             | 106             | 107-113   | 106-111   | 7->6          |
| 3    | 114             | 112             | 114-120   | 112-117   | 7->6          |
| 4    | 121             | 118             | 121-127   | 118-124   | 7 (unchanged) |
| 5    | 128             | 125             | 128-134   | 125-131   | 7 (unchanged) |
| 6    | 135             | 132             | 135-141   | 132-137   | 7->6          |
| 7    | 142             | 138             | 142-148   | 138-143   | 7->6          |
| 8    | 149             | 144             | 149-155   | 144-149   | 7->6          |

Total rhythm nodes: 56 -> 50 (6 removed)

## Verification Results

- Trail validator (`npm run verify:trail`): PASSED (with pre-existing warnings)
- Unit 7 tests: 15/15 passed
- Unit 8 tests: 21/21 passed
- Grep confirms: no unit file contains any of the 6 removed node IDs as `id:` values
- Grep confirms: all Speed Round prerequisites point to rhythm_X_4

**Note:** `npm run build` fails due to a pre-existing unrelated issue (missing `Teacher-Hat.svg` file referenced in `appNavigationConfig.jsx`). This file was already untracked before this plan's execution and is not related to Mix-Up node removal.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED
