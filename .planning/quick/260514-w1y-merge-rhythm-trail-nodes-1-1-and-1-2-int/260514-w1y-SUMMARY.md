---
phase: quick-260514-w1y
plan: 01
subsystem: rhythm-trail
tags: [trail-data, gamification, subscription-config]
requires: []
provides:
  - "Merged Rhythm Unit 1 node definitions (5 nodes, rhythm_1_2 deleted)"
  - "FREE_RHYTHM_NODE_IDS without rhythm_1_2"
affects:
  - src/data/units/rhythmUnit1Redesigned.js
  - src/config/subscriptionConfig.js
tech-stack:
  added: []
  patterns:
    ["Stable node IDs preserved across merge to protect student progress rows"]
key-files:
  created: []
  modified:
    - src/data/units/rhythmUnit1Redesigned.js
    - src/config/subscriptionConfig.js
    - src/config/subscriptionConfig.test.js
    - src/components/parent/QuickStatsGrid.test.jsx
decisions:
  - "Kept merged node id rhythm_1_1; deleted rhythm_1_2 entirely; numbering gap (1_1, 1_3, 1_4) intentional to preserve student progress rows keyed by node_id"
  - "No Supabase migration — orphaned rhythm_1_2 progress rows and the Postgres is_free_node() mirror left alone as harmless"
metrics:
  duration: ~10m
  completed: 2026-05-14
---

# Quick Task 260514-w1y: Merge Rhythm Trail Nodes 1-1 and 1-2 Summary

Merged the redundant quarter-note-only Discovery node `rhythm_1_1` and Practice node `rhythm_1_2` into a single Discovery node (id `rhythm_1_1`) that both introduces and practices quarter notes, removing the repetitive grind from Rhythm Unit 1.

## What Changed

### Task 1 — Merge nodes and re-sequence Unit 1

- Replaced the two separate node objects with one merged Discovery node: `id: rhythm_1_1`, `name: "Quarter Notes"`, `nodeType: DISCOVERY`, blended tempo `{ min: 60, max: 75, default: 68 }`, `xpReward: 45`.
- Merged node's `mixed_lesson` has 8 questions: `discovery_intro` opener followed by a 7-question practice mix (syllable_matching, visual_recognition, rhythm_tap, rhythm_reading, rhythm_dictation).
- Deleted `rhythm_1_2` entirely.
- Re-sequenced remaining nodes contiguously: `rhythm_1_1` (100/1), `rhythm_1_3` (101/2), `rhythm_1_4` (102/3), `rhythm_1_6` (103/4), `boss_rhythm_1` (104/5).
- Repaired `rhythm_1_3.prerequisites` from `["rhythm_1_2"]` to `["rhythm_1_1"]`.
- Updated file header comment (6 nodes → 5) and section banner comments.
- Commit: `095f662`

### Task 2 — Remove rhythm_1_2 from free-tier list

- Removed `'rhythm_1_2'` from `FREE_RHYTHM_NODE_IDS` (now 4 entries).
- Updated `FREE_TIER_SUMMARY`: `rhythm.count` 5 → 4, `total` 24 → 23.
- Added inline comment noting the Postgres `is_free_node()` mirror is intentionally left alone (no-migration decision).
- Commit: `8500313`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated tests for new node counts**

- **Found during:** Task 2 verification (`npm run test:run`)
- **Issue:** `subscriptionConfig.test.js` asserted 24 total free nodes; `QuickStatsGrid.test.jsx` asserted `SKILL_NODES.length` of 179. Both are direct consequences of the intentional merge (one node removed → 23 free / 178 total).
- **Fix:** Updated `subscriptionConfig.test.js` (24 → 23) and `QuickStatsGrid.test.jsx` (`3/179` → `3/178`, `2/179` → `2/178`, test title `N/179` → `N/178`).
- **Files modified:** src/config/subscriptionConfig.test.js, src/components/parent/QuickStatsGrid.test.jsx
- **Commit:** `8500313` (bundled with Task 2 since they validate the same change)

## Verification

- `npm run verify:trail` — exits 0, "Validation passed with warnings". Warnings are pre-existing low-variety multi-angle warnings (including `rhythm_1_1`, which warned before this change too); no errors.
- `npm run test:run` — 1685 passed, 13 todo, 0 failed. The 2 reported "errors" are pre-existing unhandled rejections in `PulseQuestion.test.jsx` (`audioEngine.isReady is not a function`) — untouched by this task, matches known tech-debt pattern in STATE.md. Out of scope.
- Grep confirms no node id `rhythm_1_2` remains (only descriptive comments referencing the merge).
- Grep confirms `prerequisites: ["rhythm_1_1"]` on the `rhythm_1_3` node.

## Deferred Issues

- Pre-existing `PulseQuestion.test.jsx` unhandled rejections (`audioEngine.isReady is not a function`) — not caused by this task, not fixed.

## Self-Check: PASSED

- FOUND: src/data/units/rhythmUnit1Redesigned.js (5 nodes, rhythm_1_2 absent)
- FOUND: src/config/subscriptionConfig.js (FREE_RHYTHM_NODE_IDS has 4 entries)
- FOUND commit: 095f662
- FOUND commit: 8500313
