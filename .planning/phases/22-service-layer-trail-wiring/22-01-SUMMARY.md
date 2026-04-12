---
phase: 22-service-layer-trail-wiring
plan: "01"
subsystem: data-layer
tags: [rhythm, pattern-generator, tdd, node-safe]
dependency_graph:
  requires: [src/data/patterns/rhythmPatterns.js]
  provides: [resolveByTags, resolveByIds, binaryToVexDurations]
  affects: [validateTrail.mjs (build time), MixedLessonGame (runtime)]
tech_stack:
  added: []
  patterns: [greedy-longest-fit, tdd-red-green, node-safe-module]
key_files:
  created:
    - src/data/patterns/RhythmPatternGenerator.js
    - src/data/patterns/RhythmPatternGenerator.test.js
  modified: []
decisions:
  - "Greedy longest-fit algorithm prefers sustain over rest (D-07): largest fitting duration wins at each onset"
  - "Rest equivalent for dotted notes mapped to plain rests (hd->hr, qd->qr) — approximate but covers all practical cases"
  - "fillRests helper handles gap-filling with rest candidates sorted descending by slot size"
metrics:
  duration_seconds: 121
  completed_date: "2026-04-12"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 22 Plan 01: RhythmPatternGenerator Summary

**One-liner:** Synchronous greedy-longest-fit pattern resolver that converts binary rhythm patterns to VexFlow duration arrays, with tag-based and ID-based selection from the curated pattern library.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write test suite (RED phase) | d3c0c7a | src/data/patterns/RhythmPatternGenerator.test.js |
| 2 | Implement module (GREEN phase) | 7e8d8cc | src/data/patterns/RhythmPatternGenerator.js |

## What Was Built

`RhythmPatternGenerator.js` — a synchronous, Node-safe module that:

1. **`binaryToVexDurations(binary, durations, timeSignature)`** — Converts a binary onset array to VexFlow duration codes using greedy longest-fit. At each onset, picks the largest allowed note duration that fits the gap to the next onset. Fills any remaining gap with the largest fitting rest. Handles leading rests, trailing space, dotted notes (hd=12, qd=6), and the invariant that all output slots sum to the pattern array length.

2. **`resolveByTags(tags, durations, options)`** — Filters `RHYTHM_PATTERNS` by AND-logic tag matching, optionally filters by `options.timeSignature`, picks randomly from matches, renders via `binaryToVexDurations`, and returns `{ patternId, binary, timeSignature, vexDurations, tags }` or `null`.

3. **`resolveByIds(ids, durations)`** — Finds the first pattern matching any provided ID, renders and returns same shape as `resolveByTags`, or `null`.

## Test Results

27 tests pass across three describe blocks:
- `binaryToVexDurations` (12 tests): quarters, greedy half preference, rest filling, whole note, leading rest, 3/4 and 6/8 patterns, dotted quarter, slot sum invariant
- `resolveByTags` (10 tests): null for unknown tag, required shape, duration safety, timeSignature filtering, binary integrity
- `resolveByIds` (5 tests): known ID, null for unknown, shape, slot sum, quarter rendering

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. This is a pure data-transformation module with no UI surface.

## Threat Flags

None. Module operates on static in-memory data only. No user input, no I/O, no network access, no persistence.

## Self-Check: PASSED

- `src/data/patterns/RhythmPatternGenerator.js` — FOUND
- `src/data/patterns/RhythmPatternGenerator.test.js` — FOUND
- Task 1 commit d3c0c7a — FOUND
- Task 2 commit 7e8d8cc — FOUND
- All 27 tests pass
- Node-safe: `node --input-type=module` loads without error, exports `[binaryToVexDurations, resolveByIds, resolveByTags]`
