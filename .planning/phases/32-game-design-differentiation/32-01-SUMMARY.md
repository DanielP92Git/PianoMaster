---
phase: 32-game-design-differentiation
plan: 01
subsystem: rhythm-games
tags: [game-design, session-length, variety, arcade-rhythm]
dependency_graph:
  requires: []
  provides: [8-pattern-sessions, variety-enforcement]
  affects: [ArcadeRhythmGame]
tech_stack:
  added: []
  patterns: [ref-based-dedup, retry-loop-with-graceful-degradation]
key_files:
  created: []
  modified:
    - src/components/games/rhythm-games/ArcadeRhythmGame.jsx
    - src/components/games/rhythm-games/ArcadeRhythmGame.test.js
decisions:
  - Used pattern binary signature (join(",")) for identity comparison — lightweight and deterministic
  - Graceful degradation after 3 retries (accept duplicate rather than return null) for tiny pattern pools
  - Reset lastPatternRef in both restart paths (startGame and nodeId change effect)
metrics:
  duration: 155s
  completed: 2026-04-20T18:17:33Z
  tasks: 2
  files: 2
---

# Phase 32 Plan 01: Speed Challenge Session Tuning Summary

Reduced ArcadeRhythmGame session to 8 patterns and added variety enforcement preventing consecutive identical patterns.

## One-liner

Speed challenge sessions shortened to 8 patterns (D-01) with retry-based dedup preventing consecutive identical questions (D-02).

## Task Results

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Reduce session length and add variety enforcement | 546314b | ArcadeRhythmGame.jsx |
| 2 | Update ArcadeRhythmGame tests for new session length | 37c8b6d | ArcadeRhythmGame.test.js |

## Changes Made

### Task 1: Session Length + Variety Enforcement
- Changed `TOTAL_PATTERNS` from 10 to 8 (D-01: targets 2-3 minute sessions for children's attention span)
- Added `lastPatternRef` to track last pattern's binary signature
- Replaced `fetchNewPattern` with retry-loop version: compares `result.pattern.join(",")` against `lastPatternRef.current`, retries up to 3 times if identical
- Graceful degradation: if all 4 attempts produce the same pattern (tiny pool), accepts it rather than returning null
- Added `lastPatternRef.current = null` reset in both restart paths (startGame function and nodeId-change effect)

### Task 2: Test Updates
- Updated Test 8 description from "10 patterns" to "8 patterns"
- Added Test 10: Verifies session completes at 8 patterns (D-01)
- Added Test 11: Verifies retry logic accepts after MAX_VARIETY_RETRIES when all attempts identical (D-02 edge case)
- Added Test 12: Verifies different patterns accepted immediately without retry (D-02 happy path)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- All 12 tests pass (9 existing + 3 new)
- `grep` confirms `TOTAL_PATTERNS = 8` in source
- Pre-existing unhandled rejections from missing `getOrCreateAudioContext` mock are NOT test failures (8 pre-existing, not introduced by this plan)

## Self-Check: PASSED
