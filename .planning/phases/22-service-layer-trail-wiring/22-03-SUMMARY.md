---
phase: 22-service-layer-trail-wiring
plan: "03"
subsystem: rhythm-trail-data
tags: [migration, unit-files, exercise-types, pattern-tags]
dependency_graph:
  requires: [22-01, 22-02]
  provides: [migrated-units-1-4, consumer-components-updated]
  affects: [MixedLessonGame, ArcadeRhythmGame, rhythmUnit1-4]
tech_stack:
  added: []
  patterns: [VEX_TO_OLD_NAME mapping, patternTags in rhythmConfig, MIXED_LESSON question sequences]
key_files:
  created: []
  modified:
    - src/components/games/rhythm-games/MixedLessonGame.jsx
    - src/components/games/rhythm-games/ArcadeRhythmGame.jsx
    - src/data/units/rhythmUnit1Redesigned.js
    - src/data/units/rhythmUnit2Redesigned.js
    - src/data/units/rhythmUnit3Redesigned.js
    - src/data/units/rhythmUnit4Redesigned.js
decisions:
  - VEX_TO_OLD_NAME bridge map added to both consumer components for backward compat with RhythmTapQuestion/getPattern()
  - ArcadeRhythmGame rhythmPatterns now derived via useMemo from node.rhythmConfig.durations with fallback to nodeConfig.rhythmPatterns
  - Unit 4 speed_round (rhythm_4_6) durations expanded to include wr for complete rest vocabulary in arcade mode
metrics:
  duration: "~25 minutes"
  completed: "2026-04-12T10:21:35Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 6
---

# Phase 22 Plan 03: Consumer Updates + Units 1-4 Migration Summary

**One-liner:** Migrated 28 rhythm nodes (Units 1-4) from legacy `patterns` allowlist to tag-based `patternTags`, corrected all exercise types per Phase 20 audit, and updated MixedLessonGame/ArcadeRhythmGame to read the new config shape.

## What Was Built

### Task 1: Consumer Components Updated

**MixedLessonGame.jsx:**
- Added `VEX_TO_OLD_NAME` module-level constant mapping VexFlow codes (`q`, `h`, `w`, `8`, `qr`, etc.) to legacy pattern names
- Updated `buildRhythmTapConfig` to return three keys: `patterns` (backward-compat, translated via VEX_TO_OLD_NAME), `patternTags` (new), and `durations` (new)
- RhythmTapQuestion continues to consume `config.patterns` unchanged — no breaking changes

**ArcadeRhythmGame.jsx:**
- Added `useMemo` to React import
- Added same `VEX_TO_OLD_NAME` constant
- Replaced static `const rhythmPatterns = nodeConfig?.rhythmPatterns ?? null` with a `useMemo` that derives allowed patterns from `node.rhythmConfig.durations`, with backward-compat fallback to `nodeConfig.rhythmPatterns`

### Task 2: Units 1-4 Migrated (28 nodes)

For every node across all 4 unit files:
- **Removed:** `patterns: [...]` field from `rhythmConfig`
- **Added:** `patternTags: [...]` field per the tag-to-unit mapping
- **Removed:** all `config.rhythmPatterns` fields from exercise configs
- **Fixed:** exercise types per Phase 20 audit remediation

**Exercise type corrections applied:**
| Node Type | Old (violations) | New (correct) |
|-----------|-----------------|---------------|
| DISCOVERY | rhythm, rhythm_tap, 3 separate | single mixed_lesson (notation-weighted 8 questions) |
| PRACTICE | rhythm, rhythm_dictation, 3 separate | single mixed_lesson (balanced 8 questions) |
| MIX_UP | rhythm_tap, 3 separate | single mixed_lesson (variety-focused 8 questions) |
| SPEED_ROUND | rhythm + multi-angle | single arcade_rhythm |
| MINI_BOSS | arcade_rhythm | single mixed_lesson (comprehensive 12 questions) |

**Special case — rhythm_1_1 (D-05):** Question sequence starts with two `{ type: 'pulse' }` entries before any rhythm_tap questions.

**patternTags assigned:**
- Unit 1: `quarter-only`, `quarter-half`
- Unit 2: `quarter-half-whole`, `quarter-half` (mix nodes)
- Unit 3: `quarter-eighth`, `quarter-half-whole-eighth`
- Unit 4: `quarter-rest`, `half-rest`, `whole-rest`

## Verification Results

- `npm run verify:trail` — passes with warnings only (pre-existing low-variety warnings for Units 5-8, out of scope)
- `npx vitest run src/data/patterns/rhythmPatterns.test.js` — 859 tests passed
- `grep -c "patternTags:"` — returns 7 per unit file (all 28 nodes confirmed)
- `grep "patterns:"` — returns 0 matches in unit files (old field fully removed)
- `grep "rhythmPatterns:"` — returns 0 matches in unit files (exercise-level field removed)
- Unit 1 Node 1 confirmed starts with `{ type: 'pulse' }, { type: 'pulse' }`

## Commits

| Hash | Description |
|------|-------------|
| d19e633 | feat(22-03): update MixedLessonGame and ArcadeRhythmGame for patternTags |
| 46c9064 | feat(22-03): migrate rhythm Units 1-4 to patternTags and correct exercise types |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All 28 nodes have real patternTags wired to the RhythmPatternGenerator tag vocabulary from Plan 01.

## Threat Flags

None. This plan modifies static data configuration only — no user input, network access, or trust boundaries involved.

## Self-Check: PASSED

- `src/components/games/rhythm-games/MixedLessonGame.jsx` — VEX_TO_OLD_NAME present, buildRhythmTapConfig returns patternTags+durations+patterns
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — VEX_TO_OLD_NAME present, useMemo rhythmPatterns derivation present
- `src/data/units/rhythmUnit1Redesigned.js` — 7 patternTags, 0 patterns fields, pulse questions confirmed
- `src/data/units/rhythmUnit2Redesigned.js` — 7 patternTags, 0 patterns fields
- `src/data/units/rhythmUnit3Redesigned.js` — 7 patternTags, 0 patterns fields
- `src/data/units/rhythmUnit4Redesigned.js` — 7 patternTags, 0 patterns fields
- Commits d19e633 and 46c9064 confirmed in git log
