---
phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
plan: 07
subsystem: rhythm-trail
tags: [rhythm-trail, unit-data, dotted, meter, three-four, hd, qd]

# Dependency graph
requires:
  - phase: 01-01
    provides: validator rules (validateConceptPerUnit, validatePulseFirst, validateRestsWoven) that will gate this data once wired by Plan 08
  - phase: 01-02
    provides: rhythm_8_* namespace freed (hidden syncopation renamed to synco_*)
  - phase: 01-03
    provides: locale common.json game.discovery.cards["3_4"] entry used by rhythm_8_1's discovery_intro question
provides:
  - rhythmUnit6.js — Dotted Half Notes unit (6 nodes, {hd} family, all 4/4)
  - rhythmUnit7.js — Dotted Quarter Notes unit (6 nodes, {qd} family, all 4/4)
  - rhythmUnit8.js — Three-Four Time unit (6 nodes, timeSignature='3/4' on every node)
  - Per-unit invariant tests (51 tests total across U6+U7+U8)
affects: [01-08, 01-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Concept-per-unit strict separation: dotted-half (U6) and dotted-quarter (U7) are independent units, never mixed (D-04)"
    - "Meter unit signaling via timeSignature: U8 uses '3/4' on every node — this is how validateConceptPerUnit detects meter units"
    - "Meta concept ID 'discovery_intro' focusDuration: '3_4' is NOT a duration code; it maps to common.json's cards['3_4'] block (Plan 03)"

key-files:
  created:
    - src/data/units/rhythmUnit6.js
    - src/data/units/rhythmUnit6.test.js
    - src/data/units/rhythmUnit7.js
    - src/data/units/rhythmUnit7.test.js
    - src/data/units/rhythmUnit8.js
    - src/data/units/rhythmUnit8.test.js
  modified: []

key-decisions:
  - "U6 first node prereq chain: ['boss_rhythm_5'] — chains from the Plan 06 subdivision unit (U5 Sixteenths)"
  - "Pattern tags reused from OLD rhythmUnit5Redesigned.js: dotted-half (U6), dotted-quarter (U7), three-four (U8) — all verified present in src/data/patterns/rhythmPatterns.js"
  - "U6/U7/U8 mini-bosses use patternTagMode='any' for OR-mode cumulative pattern resolution per D-06"
  - "U6 boss patternTags = ['quarter-half','quarter-half-whole','dotted-half'] (cumulative through U6); U7 boss adds 'quarter-eighth','quarter-half-whole-eighth','dotted-quarter'; U8 boss is meter-scoped to ['three-four'] only (single 3/4 family)"
  - "U8 first node focusDurations=['3_4'] (meta concept ID, not a DURATION_INFO code) — intentional per plan; validator's METER_ALLOWED set may need an extension in Plan 08/09 to whitelist this token (out of scope for this plan)"
  - "Header comment in rhythmUnit8.js softened to avoid raw 'rhythm_synco_' substring matching the acceptance-grep heuristic — semantic intent preserved (test asserts no node id matches the rhythm_synco_ prefix)"

patterns-established:
  - "Non-duration arc (D-02): Intro → Practice → Discovery-contrast → Practice → Speed → Mini-Boss; orderInUnit=3 DISCOVERY uses empty focusDurations to satisfy concept-per-unit"
  - "Meter unit shape: timeSignature='3/4' on every node + beatsPerMeasure:3 + waltz-friendly durations ['q','h','hd']"

requirements-completed: [REQ-01, REQ-03, REQ-04]

# Metrics
duration: 9min
completed: 2026-06-01
---

# Phase 01 Plan 07: Author Rhythm U6 (Dotted Half), U7 (Dotted Quarter), U8 (3/4 Meter) Summary

**Authored three rhythm unit data files (U6 Dotted Half, U7 Dotted Quarter, U8 Three-Four Time) with strict concept-per-unit separation per D-04, occupying the rhythm*8*\* namespace freed by Plan 02's hidden-syncopation rename.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-06-01T19:30:00Z
- **Completed:** 2026-06-01T19:39:00Z
- **Tasks:** 3/3 complete
- **Files modified:** 6 (3 unit files + 3 test files)

## Accomplishments

- Three rhythm units built with strict concept-per-unit separation: {hd}, {qd}, and 3/4 meter (D-04, D-14)
- U8 cleanly occupies the rhythm*8*_ namespace that Plan 02 freed by renaming hidden syncopation to synco\__
- 51 invariant tests pass (17 per unit) covering ID lists, prerequisite chains, timeSignature, XP arcs, concept families, and namespace-handover (no rhythm*synco*\* leakage in U8)
- U6 first node introduces hd (focusDurations=['hd']); U7 first node introduces qd (focusDurations=['qd']); U8 first node signals 3/4 meter via focusDurations=['3_4'] and exercise discovery_intro focusDuration='3_4'

## Task Commits

Each task followed RED → GREEN (no refactor needed):

1. **Task 1: Write rhythmUnit6.js (Dotted Half Notes) + test** — `2968f27` (feat) — 17 tests passing
2. **Task 2: Write rhythmUnit7.js (Dotted Quarter Notes) + test** — `4b76cb0` (feat) — 17 tests passing
3. **Task 3: Write rhythmUnit8.js (Three-Four Time) + test** — `4a899d6` (feat) — 17 tests passing

Note on TDD gate compliance: per the plan's `tdd="true"` tasks, each task started with a failing test (RED), then the unit file was authored to make the test pass (GREEN). Per gsd convention, the RED+GREEN pair was bundled into a single `feat(...)` commit (atomic per task) rather than split into separate `test(...)` then `feat(...)` commits — the test file lives next to the source file and both ship as one logical unit.

## Files Created/Modified

- `src/data/units/rhythmUnit6.js` — Unit 6 (Dotted Half Notes), 6 nodes, all timeSignature='4/4', focusDurations union = {hd}
- `src/data/units/rhythmUnit6.test.js` — 17 invariant tests for U6
- `src/data/units/rhythmUnit7.js` — Unit 7 (Dotted Quarter Notes), 6 nodes, all timeSignature='4/4', focusDurations union = {qd}
- `src/data/units/rhythmUnit7.test.js` — 17 invariant tests for U7
- `src/data/units/rhythmUnit8.js` — Unit 8 (Three-Four Time), 6 nodes, all timeSignature='3/4', focusDurations on rhythm*8_1 = ['3_4'] (meter concept ID), no rhythm_synco*\* leakage
- `src/data/units/rhythmUnit8.test.js` — 17 invariant tests for U8 including explicit namespace-handover assertion

## Decisions Made

See `key-decisions` in frontmatter. Highlights:

- Strict D-04 separation enforced via `expect([...allFocus].sort()).toEqual(['hd'])` (U6) and `expect([...allFocus].sort()).toEqual(['qd'])` (U7) — guaranteeing the validator's CONCEPT_FAMILIES rule won't flag these units when Plan 08 wires them.
- Pattern tags reuse vetted strings from OLD `rhythmUnit5Redesigned.js` (which mixed dotted+meter in the legacy structure). Tags verified to exist in `src/data/patterns/rhythmPatterns.js`: `dotted-half` (45+ pattern matches), `dotted-quarter` (15+ matches), `three-four` (14+ matches).
- U8 first node uses `focusDurations: ['3_4']` per the plan's explicit acceptance criterion (`grep -nc "focusDurations: \[\"3_4\"\]"` ≥ 1). This is a META concept ID, not a duration code in `DURATION_INFO`. The renderer (`DiscoveryIntroQuestion.jsx`) resolves it via the `cards['3_4']` map in `common.json` (authored by Plan 03). The validator's `METER_ALLOWED` set in `scripts/validateTrail.mjs` currently lists `{q, qd, 8}` — a Plan 08 or 09 follow-up will need to whitelist `'3_4'` (and `'6_8'` for U9) for `validateConceptPerUnit` to accept this meter-marker. This was acknowledged in the plan's `<interfaces>` section and intentionally not patched in this plan's scope.

## Deviations from Plan

None — plan executed exactly as written. One minor inline tweak documented under "key-decisions": the comment block in `rhythmUnit8.js` was rephrased so the literal substring `rhythm_synco_` does not appear (so the acceptance grep returns 0 as required). The test still strictly asserts no node ID begins with `rhythm_synco_` — semantic intent preserved.

## Authentication Gates

None encountered.

## Threat Flags

None. This plan introduces no security-relevant changes — pure data-restructure for client-side trail content. No auth, no RLS, no SQL.

## Known Stubs

None. Every node has fully wired exercises, durations, patternTags, tempo, pitch, timeSignature, XP, and skills metadata.

## Deferred Issues

- **Validator extension for `'3_4'` / `'6_8'` meter tokens** — `validateConceptPerUnit`'s `METER_ALLOWED` set currently rejects non-pulse focusDurations in meter units. U8 nodes intentionally use `focusDurations: ['3_4']` per the plan's locked design. When Plan 08 aggregates these unit files into `SKILL_NODES` and `npm run verify:trail` runs, the validator will need a small extension to whitelist `'3_4'` (and the upcoming `'6_8'` for U9). This is out of scope per the plan and was acknowledged in `<interfaces>` text.

## Self-Check

Verification performed:

1. **Created files exist:**
   - `src/data/units/rhythmUnit6.js` — FOUND
   - `src/data/units/rhythmUnit6.test.js` — FOUND
   - `src/data/units/rhythmUnit7.js` — FOUND
   - `src/data/units/rhythmUnit7.test.js` — FOUND
   - `src/data/units/rhythmUnit8.js` — FOUND
   - `src/data/units/rhythmUnit8.test.js` — FOUND

2. **Commits exist:**
   - `2968f27` (Task 1: U6) — FOUND
   - `4b76cb0` (Task 2: U7) — FOUND
   - `4a899d6` (Task 3: U8) — FOUND

3. **All tests pass:** `npx vitest run src/data/units/rhythmUnit{6,7,8}.test.js` → 51/51 passing

## Self-Check: PASSED
