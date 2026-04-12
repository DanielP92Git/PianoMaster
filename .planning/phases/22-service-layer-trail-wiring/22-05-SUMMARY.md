---
phase: 22-service-layer-trail-wiring
plan: 05
subsystem: build-tooling
tags: [validator, pattern-tags, duration-safety, game-type-policy, build]
dependency_graph:
  requires: [22-01, 22-03, 22-04]
  provides: [PAT-06]
  affects: [scripts/validateTrail.mjs]
tech_stack:
  added: []
  patterns: [build-time-validation, tag-taxonomy-enforcement, duration-safety-check]
key_files:
  created: []
  modified:
    - scripts/validateTrail.mjs
    - src/data/units/rhythmUnit5Redesigned.js
    - src/data/units/rhythmUnit7Redesigned.test.js
    - src/data/units/rhythmUnit8Redesigned.test.js
    - src/data/units/rhythmUnit8Redesigned.js
decisions:
  - "Orphan tags (library tags unused by any node) emit WARNING not ERROR — they don't break functionality"
  - "three-four and six-eight tags removed from nodes with mismatched timeSignature rather than changing timeSignature — nodes are 4/4 content using dotted rhythms, not compound meter nodes"
  - "boss_rhythm_8 retains syncopation + dotted-syncopation only — 6/8 mastery already gated by boss_rhythm_7"
metrics:
  duration: ~18 minutes
  completed: 2026-04-12
  tasks_completed: 2
  files_modified: 5
---

# Phase 22 Plan 05: Build Validator Extension Summary

**One-liner:** Extended build validator with 4 new checks (tag existence, tag coverage, duration safety, game-type policy) catching misconfigured pattern references at compile time.

## What Was Built

Four new validation functions added to `scripts/validateTrail.mjs`:

1. **`validatePatternTagExistence()`** — Hard error when any `patternTags` entry in a rhythm node doesn't exist in the RHYTHM_PATTERNS tag taxonomy. Catches misspelled or invented tag names before they reach production.

2. **`validatePatternTagCoverage()`** — Warning when a tag exists in the pattern library but is not referenced by any node. Identifies orphan patterns (unused content) without failing the build.

3. **`validateDurationSafety()`** — Hard error when `resolveByTags([tag], node.durations)` returns null for any tag in a node's `patternTags`. This means no pattern with that tag can be rendered using the node's allowed duration vocabulary — a configuration error that would cause silent runtime failures.

4. **`validateGameTypePolicy()`** — Hard error when a rhythm node's exercise type doesn't match the audit policy: `DISCOVERY/PRACTICE/MIX_UP/REVIEW/MINI_BOSS` must use `mixed_lesson`, `CHALLENGE/SPEED_ROUND/BOSS` must use `arcade_rhythm`.

The validator also imports `RHYTHM_PATTERNS` and `resolveByTags` from the pattern library, establishing a direct dependency from the build tool to the runtime pattern data — ensuring both stay in sync.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed `three-four` tag from `rhythm_5_6` and `boss_rhythm_5`**
- **Found during:** Task 1 — duration safety check caught it immediately
- **Issue:** Both nodes have `timeSignature: '4/4'` but included `'three-four'` tag. The `three-four` tag only has `3/4` patterns. `resolveByTags` filters by time signature, so no pattern could be selected — `null` returned at runtime.
- **Root cause:** Tags were added to express "this node teaches dotted notes like those in 3/4", but the node itself runs in 4/4. The tag taxonomy is per-pattern, not per-concept.
- **Fix:** Removed `'three-four'` from both nodes' `patternTags`. Both nodes teach dotted rhythms (`dotted-half`, `dotted-quarter`) in 4/4 — the remaining tags are sufficient and correct.
- **Files modified:** `src/data/units/rhythmUnit5Redesigned.js`
- **Commits:** `47c8b93`

**2. [Rule 1 - Bug] Removed `six-eight` tag from `boss_rhythm_8`**
- **Found during:** Task 1 — duration safety check
- **Issue:** `boss_rhythm_8` has `timeSignature: '4/4'` but included `'six-eight'` tag. The `six-eight` tag only has `6/8` patterns — incompatible.
- **Root cause:** Boss node description says "6/8 AND syncopation" but the generator cannot mix two time signatures in a single node call. The 6/8 content is already gated through `boss_rhythm_7` (mini-boss prerequisite).
- **Fix:** Removed `'six-eight'` from `patternTags`. Boss retains `syncopation` and `dotted-syncopation` tags — both `4/4`, matching the node's time signature. The multi-time-signature intent is preserved via the 3-exercise structure (exercise 1 explicitly sets `timeSignature: '6/8'` in its config).
- **Files modified:** `src/data/units/rhythmUnit8Redesigned.js`
- **Commits:** `47c8b93`

**3. [Rule 1 - Bug] Updated stale unit 7 and unit 8 test assertions**
- **Found during:** Task 2 — `npm run test:run` revealed 2 failed test files (4 failing tests)
- **Issue:** `rhythmUnit7Redesigned.test.js` and `rhythmUnit8Redesigned.test.js` were written before the wave 1-4 migration and still expected old exercise types (`RHYTHM`, `RHYTHM_TAP`, `RHYTHM_DICTATION`) and `exercises[0].config.timeSignature` which no longer exists in `mixed_lesson` configs.
- **Fix:** Updated both test files to assert the correct post-migration exercise types (`MIXED_LESSON` for discovery/practice/mix_up, `ARCADE_RHYTHM` for speed_round) and removed the `config.timeSignature` assertion from exercise configs (mixed_lesson uses `config.questions`).
- **Files modified:** `src/data/units/rhythmUnit7Redesigned.test.js`, `src/data/units/rhythmUnit8Redesigned.test.js`
- **Commits:** `6fb36ea`

## Known Stubs

None. All checks are fully implemented and active.

## Threat Flags

None. Build validator is a development-time tool with no runtime exposure.

## Self-Check

### Created files exist:
- `.planning/phases/22-service-layer-trail-wiring/22-05-SUMMARY.md` — this file

### Commits exist:
- `47c8b93` — feat(22-05): extend build validator with 4 new pattern checks
- `6fb36ea` — fix(22-05): update stale unit 7+8 tests to match patternTags migration

### Verification commands passed:
- `npm run verify:trail` — exits 0, all four new checks show OK
- `npm run test:run` — 57 test files passed (1579 tests), 0 test failures (8 pre-existing unhandled errors from ArcadeRhythmGame audio mock — out of scope)
- `npm run build` — exits 0 (prebuild validation + Vite build complete)
- `npm run lint` — exits 0 on all modified files

## Self-Check: PASSED
