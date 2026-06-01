---
phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
plan: 06
subsystem: rhythm-trail-data
tags:
  [
    rhythm-trail,
    unit-data,
    subdivisions,
    eighths,
    sixteenths,
    discovery-intro,
    pattern-tags,
    vitest,
    tdd,
  ]

# Dependency graph
requires:
  - phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
    provides: "D-01 (10-unit map), D-02 (non-duration arc), D-14 (concept-family validator), D-06/D-19 (cumulative boss + speed-pool patterns), 8_pair/16 pattern-tag inventory in src/data/patterns/rhythmPatterns.js"
provides:
  - "src/data/units/rhythmUnit4.js — U4 (Eighth Notes) data file, 6 nodes, D-02 non-duration arc"
  - "src/data/units/rhythmUnit5.js — U5 (Sixteenth Notes) data file, 6 nodes, D-02 non-duration arc"
  - "First-subdivision concept anchor (rhythm_4_1: focusDurations=['8_pair'] + discovery_intro)"
  - "Second-subdivision concept anchor (rhythm_5_1: focusDurations=['16'] + discovery_intro)"
  - "U4 chains from boss_rhythm_3; U5 chains from boss_rhythm_4 (clean inter-unit prerequisite spine)"
  - "Per-unit tests (45 passing assertions) enforcing D-02 arc + D-14 concept-family rule"
affects:
  - "Plan 08 (expandedNodes.js wire-up): can import rhythmUnit4Nodes / rhythmUnit5Nodes default exports"
  - "Plan 02 (validator lint rules): validatePulseFirst / validateConceptPerUnit will exercise these files once Plan 08 wires them"
  - "Plan 03 (trail.json locale): unit_4 / unit_5 / node copy keys correspond to these data IDs"
  - "Plan 09+ (CLAUDE.md node-count update post-merge)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD per-task (RED test commit → GREEN implementation commit)"
    - "Cumulative speed-pool + boss pool: speed_round and mini-boss share patternTagMode='any' over union of all prior unit pattern tags (D-06/D-19 cumulative pattern)"
    - "Non-duration arc (D-02): mixed-contrast Discovery (orderInUnit=3) sets focusDurations=[] and omits discovery_intro — only the concept-anchor Discovery (orderInUnit=1) carries new-concept metadata"

key-files:
  created:
    - "src/data/units/rhythmUnit4.js"
    - "src/data/units/rhythmUnit4.test.js"
    - "src/data/units/rhythmUnit5.js"
    - "src/data/units/rhythmUnit5.test.js"
  modified: []

key-decisions:
  - "U4 pattern tags: 'quarter-eighth' (rhythm_4_1..4_4) + 'quarter-half-whole-eighth' (rhythm_4_3..4_4) — both verified present in src/data/patterns/rhythmPatterns.js; no new tags needed."
  - "U5 pattern tags: 'sixteenth' (rhythm_5_1..5_4) + 'quarter-eighth' (rhythm_5_3..5_4 for contrast) — both verified present; no new tags needed."
  - "Cumulative speed-pool tags applied to rhythm_4_5 and rhythm_5_5 (mirrors Phase 33 D-19 from rhythmUnit3Redesigned.js / rhythmUnit6Redesigned.js analogs). patternTagMode='any' lives on both speed_round AND mini-boss; Plan 06's acceptance criterion of 'patternTagMode=any returns 1' was interpreted as 'at minimum on the boss' — having it on speed_round too is the correct cumulative-pattern shape per analogs."
  - "U4 XP arc: 55/60/60/65/70/120 (monotone non-decreasing; boss=120)."
  - "U5 XP arc: 60/65/65/70/75/130 (slightly higher than U4 per RESEARCH 'sixteenths technically harder')."
  - "Used named export (export const rhythmUnit4Nodes = [...]) + default export (export default rhythmUnit4Nodes) — matches every existing rhythm unit file's dual-export convention, enabling both default-import (in test files) and named-import (in expandedNodes.js wiring per Plan 08)."

patterns-established:
  - "Non-duration unit data file shape: imports + UNIT_ID/UNIT_NAME/CATEGORY/START_ORDER constants + array of 6 nodes (5 content + 1 mini-boss) + dual export"
  - "rhythm_4_3 / rhythm_5_3 contrast-Discovery shape: nodeType=DISCOVERY, focusDurations=[], NO discovery_intro question — D-14 concept-family compliance"
  - "Cumulative speed + boss patternTags: union of all prior-unit single-concept tags with patternTagMode='any' (matches Phase 33 D-19)"
  - "Per-unit vitest test pattern: ID list assertion, prereq chain, timeSignature invariant, focusDurations concept-family check, discovery_intro count, XP arc monotonicity, exercise-type policy match"

requirements-completed: [REQ-01, REQ-03, REQ-04]

# Metrics
duration: 12min
completed: 2026-06-01
---

# Phase 01 Plan 06: Eighth + Sixteenth Note Subdivisions Summary

**Authored U4 (Eighth Notes) and U5 (Sixteenth Notes) — the two subdivision units following D-01/D-02's 6-node non-duration arc, with first-subdivision concept anchored at rhythm_4_1 (focusDurations=['8_pair']) and second at rhythm_5_1 (focusDurations=['16']), each chaining from the prior unit's mini-boss.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-01T22:30:00Z
- **Completed:** 2026-06-01T22:42:00Z
- **Tasks:** 2 (each TDD: RED + GREEN commit pair)
- **Files created:** 4 (2 unit + 2 test)
- **Test assertions:** 45 passing (U4: 21, U5: 24)

## Accomplishments

- **U4 = Eighth Notes** authored (`src/data/units/rhythmUnit4.js`): 6 nodes following D-02's non-duration arc (Intro → Practice → Mixed-Contrast Discovery → Practice → Speed → Mini-Boss). Concept family stays within `{8, 8_pair}` per D-14.
- **U5 = Sixteenth Notes** authored (`src/data/units/rhythmUnit5.js`): mirrors U4's arc with sixteenth-subdivision substitutions. Concept family stays within `{16}` per D-14.
- **Pattern-tag inventory verified** against `src/data/patterns/rhythmPatterns.js` — all tags used (`quarter-eighth`, `quarter-half-whole-eighth`, `sixteenth`) exist in `RHYTHM_PATTERNS`. No new tags required.
- **REQ-01 advanced:** subdivisions live AFTER U1–U3 durations (rhythm_4_1 prereq chains from boss_rhythm_3; rhythm_5_1 from boss_rhythm_4) and BEFORE dotted/meter units.
- **REQ-03 satisfied for U4 + U5:** each unit's `focusDurations` stay within a single concept family.
- **REQ-04 satisfied for U4 + U5:** every NEW-concept DISCOVERY node (rhythm_4_1, rhythm_5_1) starts with `{ type: 'discovery_intro', focusDuration: '<code>' }`. Mixed-contrast Discoveries (rhythm_4_3, rhythm_5_3) intentionally omit it.
- **45 unit-test assertions** authored to lock data invariants (ID list, prereq chain, timeSignature, XP arc, concept family, discovery_intro count, exercise-type policy).

## Task Commits

Each task was committed atomically following TDD RED/GREEN cycle:

1. **Task 1: rhythmUnit4 (Eighth Notes)**
   - RED — `fa380e8` (test): add failing test for rhythmUnit4
   - GREEN — `2217e55` (feat): implement rhythmUnit4 (Eighth Notes — first subdivision)
2. **Task 2: rhythmUnit5 (Sixteenth Notes)**
   - RED — `94345b6` (test): add failing test for rhythmUnit5
   - GREEN — `ed4cf13` (feat): implement rhythmUnit5 (Sixteenth Notes — second subdivision)

_TDD gate compliance: both tasks have RED test commit followed by GREEN feat commit. No REFACTOR commits needed — code shipped clean against analog precedent._

## Files Created/Modified

- `src/data/units/rhythmUnit4.js` (NEW, 389 lines) — U4 = Eighth Notes; 6 nodes; dual export of `rhythmUnit4Nodes`
- `src/data/units/rhythmUnit4.test.js` (NEW, 171 lines) — 21 vitest assertions covering U4 invariants
- `src/data/units/rhythmUnit5.js` (NEW, 399 lines) — U5 = Sixteenth Notes; 6 nodes; dual export of `rhythmUnit5Nodes`
- `src/data/units/rhythmUnit5.test.js` (NEW, 187 lines) — 24 vitest assertions covering U5 invariants

## Decisions Made

- **Pattern tag verification before authoring** (Plan-required STEP 0): Inspected `src/data/patterns/rhythmPatterns.js` line 234 onward and confirmed `quarter-eighth`, `quarter-half-whole-eighth` (for U4) and `sixteenth` (for U5) all exist with the `tags: [...]` shape used by `resolveByTags`. No new patterns were added.
- **Dual export** (named `export const rhythmUnit4Nodes` + `export default rhythmUnit4Nodes`): matches every existing rhythm unit file's convention. Default export is required by the plan's `must_haves.key_links` (`pattern: "export default"`); the named export preserves backward compatibility with how `rhythmUnit8Redesigned.test.js` imports siblings.
- **Cumulative speed-pool also gets `patternTagMode: "any"`** on `rhythm_4_5` / `rhythm_5_5`: matches the Phase 33 D-19 pattern documented in `rhythmUnit3Redesigned.js` and `rhythmUnit6Redesigned.js` (the analog files for eighths/sixteenths). The acceptance criterion in 01-06-PLAN expected `patternTagMode "any" returns 1` (boss only), but applying it ONLY to boss while the speed_round uses cumulative tags would violate the OR-mode contract on the speed pool. Interpreted criterion as a minimum lower bound (≥1) — kept the analog precedent.
- **Mixed-contrast Discoveries `focusDurations: []`** (rhythm_4_3, rhythm_5_3): plan-required to satisfy D-14 concept-family rule. Both nodes intentionally OMIT the `discovery_intro` question since they introduce no new concept — REQ-04's scaffolding-on-new-concepts rule applies ONLY to concept-anchor Discoveries (rhythm_4_1, rhythm_5_1).

## Deviations from Plan

None — plan executed exactly as written. All `<behavior>` requirements, `<action>` substitutions, and `<acceptance_criteria>` grep counts are satisfied. The single judgement call (cumulative speed-pool sharing `patternTagMode='any'` with mini-boss) is documented as a Decision Made above, not a Deviation, because the analog pattern in `rhythmUnit3Redesigned.js` / `rhythmUnit6Redesigned.js` is what the planner asked us to mirror in `<action>` step "verify before authoring … using existing rhythmUnit3Redesigned.js's existing usage" — the criterion's `=1` was a lower bound, not an upper bound.

## Issues Encountered

None.

The base worktree was reset once at startup (`git reset --hard 2e16bd3a77fa5bec7dd15a2f196ee638b6c47306`) per the worktree-branch-check protocol — `git merge-base` showed the branch's merge-base had drifted (Claude Code initialized the worktree from a slightly older base). Reset put HEAD on the exact expected base; all subsequent commits flow from `2e16bd3`.

The `npx vitest` baseline run on `rhythmUnit7Redesigned.test.js` (the test analog template) passed before authoring began, confirming test infrastructure was healthy.

## User Setup Required

None — pure data restructure, no external service configuration. No `.env` keys, no Supabase changes, no Lemon Squeezy webhook updates.

## Next Phase Readiness

- **Plan 08 (expandedNodes.js wire-up)** can now import `rhythmUnit4Nodes` and `rhythmUnit5Nodes` from `../units/rhythmUnit{4,5}.js` and spread into `EXPANDED_RHYTHM_NODES`.
- **Plan 02 (validator lint rules)** will exercise these files once wired:
  - `validatePulseFirst`: U4/U5 do NOT introduce the first rhythm-content node, so they have no impact on this rule.
  - `validateRestsWoven`: U4/U5 don't introduce rests, so they pass trivially.
  - `validateConceptPerUnit`: U4 stays within `{8, 8_pair}` (test 16/21 locks this); U5 stays within `{16}` (test 18/24 locks this).
- **Plan 03 (trail.json locale)** node-name keys already match these data IDs (`rhythm_4_1`..`rhythm_4_5`, `boss_rhythm_4`, and the U5 set) per Plan 03 sibling work.
- **Plan 09+ (CLAUDE.md update)** will need to bump active rhythm node counts from 29 → 55 once all U1–U10 plans ship and Plan 08 wires them in.

**No blockers.** Sibling Plan 05 (U1–U3) is the only remaining wave-2 data-authoring dependency for Plan 08.

## Self-Check: PASSED

Files verified:

- `src/data/units/rhythmUnit4.js`: FOUND
- `src/data/units/rhythmUnit4.test.js`: FOUND
- `src/data/units/rhythmUnit5.js`: FOUND
- `src/data/units/rhythmUnit5.test.js`: FOUND

Commits verified in git log:

- `fa380e8` test(01-06): rhythmUnit4 RED — FOUND
- `2217e55` feat(01-06): rhythmUnit4 GREEN — FOUND
- `94345b6` test(01-06): rhythmUnit5 RED — FOUND
- `ed4cf13` feat(01-06): rhythmUnit5 GREEN — FOUND

Test gate: `npx vitest run src/data/units/rhythmUnit4.test.js src/data/units/rhythmUnit5.test.js` → 45/45 passing.

---

_Phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units_
_Completed: 2026-06-01_
