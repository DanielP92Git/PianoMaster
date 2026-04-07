---
phase: 22-service-layer-trail-wiring
plan: "01"
subsystem: rhythm-trail
tags: [constants, resolver, tdd, pattern-library]
dependency_graph:
  requires: []
  provides:
    [RHYTHM_PULSE constant, resolveByTags, resolveByIds, unit1-test-scaffold]
  affects: [RhythmPatternGenerator.js, constants.js]
tech_stack:
  added: []
  patterns: [TDD red-green, named-export extension, filter-chain resolver]
key_files:
  created:
    - src/components/games/rhythm-games/RhythmPatternGenerator.test.js
    - src/data/units/rhythmUnit1Redesigned.test.js
  modified:
    - src/data/constants.js
    - src/components/games/rhythm-games/RhythmPatternGenerator.js
decisions:
  - "resolveByTags uses tag-union semantics: a pattern matches if any of its tags is in the input set"
  - "Resolver functions appended after existing default export to avoid disturbing legacy generator code (D-09)"
  - "Import added at top of file per ES module conventions; linter reformatted quote style to double-quotes"
metrics:
  duration_seconds: 192
  completed_date: "2026-04-06"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
---

# Phase 22 Plan 01: Resolver Foundation Summary

**One-liner:** RHYTHM_PULSE exercise-type constant + resolveByTags()/resolveByIds() resolver API added to RhythmPatternGenerator.js, backed by 11 passing tests and TDD RED scaffolds for Plan 02's node migration.

## Tasks Completed

| Task | Name                                                        | Commit  | Files                                                                       |
| ---- | ----------------------------------------------------------- | ------- | --------------------------------------------------------------------------- |
| 1    | Add RHYTHM_PULSE constant and create resolver test scaffold | 6fb5172 | constants.js, RhythmPatternGenerator.test.js, rhythmUnit1Redesigned.test.js |
| 2    | Implement resolveByTags() and resolveByIds()                | 1a1cd6a | RhythmPatternGenerator.js                                                   |

## What Was Built

### EXERCISE_TYPES.RHYTHM_PULSE constant

Added `RHYTHM_PULSE: 'rhythm_pulse'` to the `EXERCISE_TYPES` object in `src/data/constants.js` after the `INTERVAL_ID` entry, in a new `// v3.2 new game types` block. This constant is required by Plan 02 (pulse exercise on Unit 1 Node 1) and the trail navigator switch.

### resolveByTags(tags, options) — new named export

Filters `RHYTHM_PATTERNS` by tag union (a pattern qualifies if any of its tags appears in the input set), then applies optional `difficulty` and `measureCount` filters. Returns full pattern objects per D-08. Game components pick randomly from the returned pool per D-10.

### resolveByIds(ids) — new named export

Returns the subset of `RHYTHM_PATTERNS` whose `id` appears in the input array. Used by nodes that need exact, deterministic pattern selection.

### RhythmPatternGenerator.test.js (11 tests, all GREEN)

- 1 constant test (RHYTHM_PULSE === 'rhythm_pulse')
- 7 resolveByTags tests: basic tag lookup, tag inclusion enforcement, difficulty filter, measureCount filter, empty result for unknown tag, PAT-05 learning-order enforcement (quarter-only returns no patterns with h/w/8/16/qd/hd in durationSet), multi-tag union semantics
- 3 resolveByIds tests: single ID, multiple IDs, nonexistent ID

### rhythmUnit1Redesigned.test.js (14 tests: 8 GREEN, 6 RED)

- 8 structural tests pass immediately: node count, ID uniqueness, ID naming convention, order sequence (100-106), prerequisite chain, pitch C4, mini-boss properties, category values, xpReward ranges
- 6 RED tests will turn GREEN when Plan 02 migrates Unit 1: pulse exercise type, pulseOnly config, tempo/beats config, no old rhythmPatterns field, patternTags present on non-pulse exercises

## Verification Results

- `npx vitest run src/components/games/rhythm-games/RhythmPatternGenerator.test.js` — 11/11 PASSED
- `npm run verify:trail` — PASSED with warnings (pre-existing XP variance warning, unrelated to this plan)
- Existing generator exports (DURATION_CONSTANTS, TIME_SIGNATURES, DIFFICULTY_LEVELS, default export) — unchanged

## Deviations from Plan

None — plan executed exactly as written.

The linter (lint-staged via Husky pre-commit) reformatted single-quoted strings to double-quotes in both test files. This is expected project behavior per CLAUDE.md and does not affect test behavior.

## Known Stubs

None. This plan creates pure functions and test scaffolds with no UI rendering or data wiring.

## Threat Flags

None. All changes are client-side data files and pure functions with no I/O, trust boundaries, or network endpoints per the plan's threat model.

## Self-Check: PASSED

All key files exist on disk. Both commits (6fb5172, 1a1cd6a) verified in git history.
