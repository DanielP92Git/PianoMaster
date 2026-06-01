---
phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
plan: 05
subsystem: trail-data
tags:
  [
    rhythm-trail,
    unit-data,
    durations,
    rests,
    pulse-first,
    rests-woven,
    concept-per-unit,
    discovery-intro,
    tdd,
  ]

# Dependency graph
requires:
  - phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
    provides: "validator principle rules (validatePulseFirst, validateRestsWoven, validateConceptPerUnit) from Plan 01-01 — define the static contract this plan's data must satisfy once wired"
  - phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
    provides: "freed rhythm_8_* / boss_rhythm_8 numeric namespace from Plan 01-02 (D-10 rename) — not directly used by U1-U3 but unblocks the full U1-U10 set"
  - phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
    provides: "FREE_NODE_IDS update from Plan 01-04 (D-12) — boss_rhythm_1 now free; rhythm_1_5 is the new U1 terminus reachable by free-tier students"

provides:
  - "src/data/units/rhythmUnit1.js — Unit 1 (Quarter + Quarter Rest, 6 nodes, START_ORDER=100, family q_qr) per D-01/D-02"
  - "src/data/units/rhythmUnit2.js — Unit 2 (Half + Half Rest, 6 nodes, START_ORDER=110, chain-in from boss_rhythm_1, family h_hr) per D-01/D-02"
  - "src/data/units/rhythmUnit3.js — Unit 3 (Whole + Whole Rest, 6 nodes, START_ORDER=120, chain-in from boss_rhythm_2, family w_wr) per D-01/D-02"
  - "Three sibling Vitest invariant test files (21 assertions each = 63 total) pinning IDs, prereq chain, focusDurations family, REQ-04 discovery_intro contract, XP arc, and game-type policy"
  - "REQ-01 anchor verified at the data-file level: rhythm_1_1 is the new pulse-first first-content node with focusDurations=['q']"
  - "REQ-02 verified at the data-file level: rhythm_1_3 (qr), rhythm_2_3 (hr), rhythm_3_3 (wr) each introduce the rest adjacent to its matching duration unit"
  - "REQ-03 verified at the data-file level: every unit's focusDurations union is a clean concept-family signature (q_qr / h_hr / w_wr)"
  - "REQ-04 verified at the data-file level: every DISCOVERY node opens with { type: 'discovery_intro', focusDuration: '<x>' } as its first MIXED_LESSON question"

affects: [01-06, 01-07, 01-08, 01-09, 01-10, future-rhythm-content-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-unit single-file-export convention: const UNIT_ID + UNIT_NAME + CATEGORY + START_ORDER header block, default-export array (drops the *Redesigned suffix per 01-RESEARCH.md Open Question #1 recommendation)"
    - "6-node duration-unit arc (D-02 for duration units U1-U3): DISCOVERY (duration intro, measureCount-policy=1) → PRACTICE → DISCOVERY (rest intro) → PRACTICE → SPEED_ROUND (ARCADE_RHYTHM) → MINI_BOSS (MIXED_LESSON, patternTagMode=any)"
    - "Pulse-anchored extension framing: for U2/U3, `durations` includes `q` (and `h` in U3) as contextual pulse reference, but `focusDurations` stays strictly within the unit's concept family so validateConceptPerUnit sees one family per unit"
    - "REQ-04 discovery_intro contract: every DISCOVERY node's first MIXED_LESSON question is { type: 'discovery_intro', focusDuration: '<code>' } where <code> ∈ focusDurations[0]; PRACTICE/MIXED_LESSON nodes omit the intro slot"
    - "Sibling test invariants per unit: array length=6, ID list, unique IDs, orderInUnit 1..6, sequential order from START_ORDER, prereq chain (with explicit chain-in for U2/U3), timeSignature 4/4 invariant, pitch C4 invariant, category split (5 'rhythm' + 1 'boss'), REQ-04 discovery_intro contract, REQ-03 family confinement, monotone XP arc, locked exact XP values"

key-files:
  created:
    - src/data/units/rhythmUnit1.js
    - src/data/units/rhythmUnit1.test.js
    - src/data/units/rhythmUnit2.js
    - src/data/units/rhythmUnit2.test.js
    - src/data/units/rhythmUnit3.js
    - src/data/units/rhythmUnit3.test.js
  modified: []

key-decisions:
  - "Filename suffix dropped (rhythmUnit{1,2,3}.js, not *Redesigned.js) per 01-RESEARCH.md Open Question #1 recommendation — the 'Redesigned' suffix is a v1.3 historical marker that no longer carries meaning; new files use the clean numeric name"
  - "Default export (export default rhythmUnit{N}Nodes) preserved per the plan's <interfaces> spec and consistent with rhythmUnit1Redesigned.js's existing default export — Plan 01-08 will import via `import rhythmUnit1Nodes from './units/rhythmUnit1.js'`"
  - "Pattern tags chosen from existing inventory in src/data/patterns/rhythmPatterns.js (NOT new tags): U1 = 'quarter-only' + 'quarter-rest'; U2 = 'quarter-half' + 'half-rest'; U3 = 'quarter-half-whole' + 'whole-rest'. No new tags introduced — validatePatternTagExistence would have caught it"
  - "U2 'Half Notes' DISCOVERY node uses durations=['q','h'] (NOT just ['h']) because the only available U2-appropriate pattern tag 'quarter-half' requires both durations for resolveByTags to find matches — q stays in durations as pulse context but is OMITTED from focusDurations to preserve REQ-03 family h_hr confinement"
  - "U3 'Whole Notes' DISCOVERY node uses durations=['q','h','w'] for the same reason (pattern tag 'quarter-half-whole' is the only existing tag covering whole-note bars; q+h provide pulse context). focusDurations=['w'] only — preserves REQ-03 family w_wr confinement"
  - "Speed-round exercise uses difficulty: 'beginner' for all three units (U1/U2/U3 are the first duration units; intermediate/advanced reserved for later subdivision/dotted units)"
  - "Mini-boss MIXED_LESSON question count is exactly 10 (satisfies validateMixedLessons rule 4's [10,12] boss range; matches the existing rhythmUnit1Redesigned.js boss precedent)"
  - "XP arc tuned per 01-RESEARCH.md envelopes (DISCOVERY 45-55, PRACTICE 50-65, SPEED_ROUND 55-70, MINI_BOSS 100-150): U1=[45,50,50,55,60,100], U2=[50,55,55,60,65,110], U3=[55,60,60,65,70,120] — monotone non-decreasing within each unit; total XP increases unit-over-unit (U1+U2+U3 = 1095 XP) matching scaffolded progression"
  - "Mini-boss XP scales 100 → 110 → 120 across U1 → U2 → U3 (within mini-boss envelope) — gives students a tangible incremental reward signal as they progress through the duration trinity"
  - "TDD discipline enforced: each task = test commit (RED) → source commit (GREEN) pair. 6 commits total, never amended, makes the principle-gate contract visible in git history"

patterns-established:
  - "Unit-data plan template (re-usable for Plans 01-06/07/08 covering U4-U10): 1 unit file + 1 sibling test file per task. Test asserts (a) length=6, (b) locked ID list, (c) unique IDs, (d) orderInUnit 1..6, (e) sequential order from START_ORDER, (f) prereq chain with explicit chain-in from prior unit's boss, (g) timeSignature invariant (4/4 for duration units; 3/4 for U8; 6/8 for U9), (h) pitch C4, (i) 5+1 category split, (j) nodeType per orderInUnit, (k) REQ-04 discovery_intro contract, (l) REQ-03 family confinement, (m) monotone XP arc + locked exact values, (n) MINI_BOSS isBoss=true with patternTagMode='any'."
  - "Pulse-context-without-family-pollution pattern: include 'q' (and 'h' in U3) in `durations` for early non-quarter units so patterns can resolve, but omit them from `focusDurations` so the validator's concept-family check sees a clean single-family signature."
  - "ARCADE_RHYTHM exercise config: `{ difficulty: 'beginner' | 'intermediate' | 'advanced' }` — no measureCount needed (validator skips ARCADE_RHYTHM in validateMeasureCountPolicy for SPEED_ROUND, even though policy expects 4 — verified by inspection of validateMeasureCountPolicy SKIP_EXERCISE_TYPES set)"

requirements-completed: [REQ-01, REQ-02, REQ-03, REQ-04]

# Metrics
duration: 8min
completed: 2026-06-01
---

# Phase 01 Plan 05: Rhythm Unit Data U1-U3 Summary

**Authored the first three rhythm units (Quarter + Quarter Rest, Half + Half Rest, Whole + Whole Rest) — six 6-node files (3 unit-data + 3 sibling test) totaling 63 invariant assertions. Every assertion green. REQ-01/02/03/04 satisfied at the data-file level; full validator-level confirmation lands in Plan 01-08 when expandedNodes.js rewires to these files.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-01T22:31:00Z (approximate, from session resume)
- **Completed:** 2026-06-01T22:39:00Z
- **Tasks:** 3
- **Files created:** 6 (3 unit + 3 test)
- **Files modified:** 0
- **Commits:** 6 (3 RED + 3 GREEN, one TDD pair per task)
- **Tests added:** 63 (21 per unit)
- **Tests passing:** 63/63

## Accomplishments

- Authored `src/data/units/rhythmUnit1.js` — Unit 1: Quarter + Quarter Rest (6 nodes, START_ORDER=100, family q_qr, prereq=[])
- Authored `src/data/units/rhythmUnit2.js` — Unit 2: Half + Half Rest (6 nodes, START_ORDER=110, family h_hr, chains in from boss_rhythm_1)
- Authored `src/data/units/rhythmUnit3.js` — Unit 3: Whole + Whole Rest (6 nodes, START_ORDER=120, family w_wr, chains in from boss_rhythm_2)
- Authored 3 sibling Vitest invariant tests with 21 assertions each (63 total) covering D-01/D-02/D-09 structural locks + REQ-01/02/03/04 principle locks
- REQ-01 (Pulse-first) anchor verified: `rhythm_1_1` is the first rhythm-content node and its `focusDurations` is `['q']`
- REQ-02 (Rests-woven) verified across all three units: `rhythm_1_3` (qr), `rhythm_2_3` (hr), `rhythm_3_3` (wr) — each rest introduced adjacent to its matching duration within the same unit
- REQ-03 (Concept-per-unit) verified per unit: focusDurations union ⊆ {q,qr} for U1, ⊆ {h,hr} for U2, ⊆ {w,wr} for U3 — single concept family per unit
- REQ-04 (Scaffolding) verified: every DISCOVERY node (6 total across U1-U3) opens with `{ type: 'discovery_intro', focusDuration: '<code>' }` as the first MIXED_LESSON question
- TDD discipline maintained: each task split into a RED test commit (`test(01-05): add failing test for ...`) followed by a GREEN source commit (`feat(01-05): implement ...`) — makes the principle-gate contract visible in git history

## Task Commits

Each task was committed atomically as a RED → GREEN TDD pair:

1. **Task 1: rhythmUnit1.js (Quarter + Quarter Rest) + test**
   - RED: `e8068ce` — `test(01-05): add failing test for rhythmUnit1 (Quarter + Quarter Rest)`
   - GREEN: `c04091f` — `feat(01-05): implement rhythmUnit1 (Quarter + Quarter Rest)`

2. **Task 2: rhythmUnit2.js (Half + Half Rest) + test**
   - RED: `63872d9` — `test(01-05): add failing test for rhythmUnit2 (Half + Half Rest)`
   - GREEN: `5e3e347` — `feat(01-05): implement rhythmUnit2 (Half + Half Rest)`

3. **Task 3: rhythmUnit3.js (Whole + Whole Rest) + test**
   - RED: `d1dcd42` — `test(01-05): add failing test for rhythmUnit3 (Whole + Whole Rest)`
   - GREEN: `336b4f1` — `feat(01-05): implement rhythmUnit3 (Whole + Whole Rest)`

_Note: Pre-commit Husky hook ran ESLint + Prettier on staged JS files; minor whitespace normalizations applied automatically (visible in lockfile back-tick re-flow on test files). No semantic changes._

## Files Created/Modified

- `src/data/units/rhythmUnit1.js` (CREATED, 370 lines) — Unit 1: Quarter + Quarter Rest. 6 nodes: rhythm_1_1 (DISCOVERY, focusDurations=['q'], measureCount-policy 1, MIXED_LESSON 8q starting with discovery_intro), rhythm_1_2 (PRACTICE, focusDurations=[], 8q), rhythm_1_3 (DISCOVERY, focusDurations=['qr'], 8q starting with discovery_intro), rhythm_1_4 (PRACTICE, focusDurations=[], 8q), rhythm_1_5 (SPEED_ROUND, ARCADE_RHYTHM, difficulty:'beginner'), boss_rhythm_1 (MINI_BOSS, MIXED_LESSON 10q, patternTagMode='any', xpReward=100, accessoryUnlock='rhythm_badge_1'). All timeSignature 4/4, pitch C4. Pattern tags 'quarter-only' and 'quarter-rest'.
- `src/data/units/rhythmUnit1.test.js` (CREATED, 172 lines) — 21 assertions covering D-01/D-02/D-09 structure + REQ-01..04 principles + locked XP arc [45,50,50,55,60,100].
- `src/data/units/rhythmUnit2.js` (CREATED, 361 lines) — Unit 2: Half + Half Rest. 6 nodes following same arc with focusDurations h/hr, START_ORDER=110, chain-in from boss_rhythm_1, pattern tags 'quarter-half' + 'half-rest'. boss_rhythm_2 xpReward=110, accessoryUnlock='rhythm_badge_2'. XP arc [50,55,55,60,65,110].
- `src/data/units/rhythmUnit2.test.js` (CREATED, 166 lines) — 21 assertions; family h_hr confinement; chain-in from boss_rhythm_1.
- `src/data/units/rhythmUnit3.js` (CREATED, 365 lines) — Unit 3: Whole + Whole Rest. 6 nodes with focusDurations w/wr, START_ORDER=120, chain-in from boss_rhythm_2, pattern tags 'quarter-half-whole' + 'whole-rest'. boss_rhythm_3 xpReward=120, accessoryUnlock='rhythm_badge_3'. XP arc [55,60,60,65,70,120].
- `src/data/units/rhythmUnit3.test.js` (CREATED, 165 lines) — 21 assertions; family w_wr confinement; chain-in from boss_rhythm_2.

## Decisions Made

- **Drop the `Redesigned` filename suffix** (per 01-RESEARCH.md Open Question #1 recommendation): new files are `rhythmUnit{1,2,3}.js`, not `rhythmUnit{1,2,3}Redesigned.js`. The suffix is a v1.3 historical marker that no longer carries meaning; Plan 01-10 will delete the legacy `*Redesigned.js` siblings. Plan 01-08 will rewire `expandedNodes.js` to the new clean names.
- **Default export, named const internal**: `const rhythmUnit{N}Nodes = [...]; export default rhythmUnit{N}Nodes;` — matches the analog `rhythmUnit1Redesigned.js` shape (which has both `export const rhythmUnit1Nodes` AND `export default`). The new files use only the default export per the plan's `<interfaces>` spec, keeping the consumer API single-binding.
- **Pattern tags chosen from EXISTING inventory** in `src/data/patterns/rhythmPatterns.js`: U1 uses `quarter-only` (rest-free quarter bars) + `quarter-rest` (rest-bearing quarter bars); U2 uses `quarter-half` + `half-rest`; U3 uses `quarter-half-whole` + `whole-rest`. The plan's `<context>` block tentatively listed `"quarter-with-rest"`, `"half-with-rest"`, `"whole"`, `"whole-with-rest"` as candidates — none exist in the patterns library, so I substituted with the closest existing equivalents. Documented this verification in each unit file's top-of-file comment.
- **U2 'Half Notes' DISCOVERY uses durations=['q','h']** (not just `['h']`) because the only U2-appropriate pattern tag `quarter-half` requires both durations for `resolveByTags` to find matches. `q` stays in `durations` (and `contextDurations`) as pulse context but is OMITTED from `focusDurations` to preserve REQ-03 family h_hr confinement. The validator's concept-family check inspects `focusDurations` only, so this is clean.
- **U3 'Whole Notes' DISCOVERY uses durations=['q','h','w']** for the same reason — pattern tag `quarter-half-whole` is the only existing tag that produces whole-note bars (via single-onset patterns like `qhw_44_001`). focusDurations=['w'] only.
- **Speed-round difficulty='beginner' for all three units** — U1/U2/U3 are the first duration units; `intermediate`/`advanced` is reserved for later subdivision/dotted units. The validator doesn't enforce difficulty per nodeType; this is purely a UX-tuning choice for early learners.
- **Mini-boss MIXED_LESSON question count = exactly 10** — satisfies `validateMixedLessons` rule 4's `[10, 12]` boss range (the lower bound). Matches the existing `rhythmUnit1Redesigned.js::boss_rhythm_1`'s 12-question precedent reduced for consistency across U1-U3.
- **XP arc tuned per 01-RESEARCH.md envelopes** (DISCOVERY 45-55, PRACTICE 50-65, SPEED_ROUND 55-70, MINI_BOSS 100-150):
  - U1: [45, 50, 50, 55, 60, 100] — opens at envelope floor, climbs steadily
  - U2: [50, 55, 55, 60, 65, 110] — opens at +5 over U1 (motivates progression)
  - U3: [55, 60, 60, 65, 70, 120] — opens at +10 over U1 (consolidates pulse-extension narrative)
- **Mini-boss XP scales 100 → 110 → 120 across U1 → U2 → U3** within the mini-boss envelope — gives students a tangible incremental reward signal as they master the duration trinity (Q → H → W).
- **TDD RED → GREEN split commits** for each of the 3 tasks (6 commits total, never amended) — makes the principle-gate contract visible in git history as a permanent audit trail. Same discipline applied in Plan 01-03 (locale parity TDD split).

## Deviations from Plan

### Auto-fixed Issues

None — plan executed cleanly with one minor scope adjustment documented under "Decisions Made" above (pattern-tag substitution using existing inventory rather than introducing new tags, per the plan's explicit guidance in `<interfaces>` Step 0).

The plan's `<action>` Step 0 explicitly instructed: _"If any tag does NOT exist in RHYTHM_PATTERNS, the validator's validatePatternTagExistence will fail. Mitigation: read RhythmPatternGenerator.js BEFORE writing, and EITHER (a) substitute an existing tag of equivalent semantics OR (b) add the new tag to the patterns file in this plan's first task (escalate to user if scope creep)."_ — I chose (a), as documented above. This is in-scope per the plan's own mitigation guidance, not a deviation.

### Locale-of-truth correction (documented in each unit file's top-of-file comment)

The plan's `<read_first>` directive pointed to `src/components/games/rhythm-games/RhythmPatternGenerator.js` for pattern tag verification, but the actual `RHYTHM_PATTERNS` library lives at `src/data/patterns/rhythmPatterns.js` (the `RhythmPatternGenerator.js` in the components directory is a thin wrapper). Pattern tag verification was performed against the canonical data file. Not a code change — just clarification that the canonical-refs section pointed to the right semantic location.

---

**Total deviations:** 0 auto-fixed bugs (Rule 1), 0 added critical functionality (Rule 2), 0 blocking issues (Rule 3), 0 architectural escalations (Rule 4).
**Impact on plan:** None. Plan executed exactly as written; all 9 acceptance criteria per task pass; 63/63 sibling tests green.

## Issues Encountered

None. Every test passed on first run after authoring the corresponding data file. No iteration needed.

The pre-existing validator failures (3 errors: U1 mixes q_qr/h_hr; U4 mixes q_qr/h_hr/w_wr; U5 meter-unit contains 'hd') are NOT regressions caused by this plan — they exist on the OLD `rhythmUnit*Redesigned.js` files in the legacy data layer and are documented as Wave 0 known states in STATE.md (Plan 01-01's `validateConceptPerUnit` is RED by design on today's data). They will clear in Plan 01-08 when `expandedNodes.js` is rewired to the new U1-U10 files authored across Plans 01-05/06/07/08.

## Threat Surface Notes

Plan's `<threat_model>` declared **N/A — data restructure only, no security surface**. Verified: no SQL, no auth, no RLS, no network surface introduced. Files added are pure JS data modules consumed at build time. No new threat surface.

No threat flags raised.

## User Setup Required

None for this plan. The new files exist on the worktree branch and are committed. They are NOT yet wired into `expandedNodes.js` — that's Plan 01-08's job. Until Plan 01-08 ships, the runtime trail continues to use the legacy `rhythmUnit*Redesigned.js` files (no user-facing change yet).

## Next Phase Readiness

- **Plan 01-06 (U4-U5: Eighths + Sixteenths):** Unblocked. Can mirror the unit-data plan template established here. Reads `src/data/units/rhythmUnit3.js` as the most-recent analog. Eighths use the non-duration-unit arc per D-02 (Intro → Practice → Discovery [mixed contrast] → Practice → Speed → Mini-Boss), differing slightly from this plan's duration-unit arc.
- **Plan 01-07 (U6-U8: Dotted Half + Dotted Quarter + 3/4 Meter):** Unblocked. U8 is the first meter unit (timeSignature='3/4') and tests against the meter-unit branch of `validateConceptPerUnit` (METER_ALLOWED set).
- **Plan 01-08 (U9-U10 + expandedNodes rewire):** Unblocked. Will import all 10 new unit files into `expandedNodes.js` and update `skillTrail.js` UNITS map. At that point the full validator suite goes green (today's RED states in U1/U4/U5 of the legacy data are replaced by the new U1-U10 structure).
- **Plan 01-09 (DiscoveryIntroQuestion pagination):** Unblocked in parallel. The data files authored here include `{ type: 'discovery_intro', focusDuration: '<code>' }` first questions in every DISCOVERY node, providing the entry point for the multi-card pagination feature.
- **freeNodes.parity.test.js (from Plan 01-04):** Unaffected by this plan. The free-tier whitelist's reference to `rhythm_1_5` and `boss_rhythm_1` continues to match Plan 01-08's wiring expectations.

## Self-Check: PASSED

Verified before SUMMARY commit:

- `src/data/units/rhythmUnit1.js` exists with 370 lines — FOUND
- `src/data/units/rhythmUnit1.test.js` exists, 21 assertions, 21/21 GREEN — FOUND
- `src/data/units/rhythmUnit2.js` exists with 361 lines — FOUND
- `src/data/units/rhythmUnit2.test.js` exists, 21 assertions, 21/21 GREEN — FOUND
- `src/data/units/rhythmUnit3.js` exists with 365 lines — FOUND
- `src/data/units/rhythmUnit3.test.js` exists, 21 assertions, 21/21 GREEN — FOUND
- Commit `e8068ce` (Task 1 RED) in `git log` — FOUND
- Commit `c04091f` (Task 1 GREEN) in `git log` — FOUND
- Commit `63872d9` (Task 2 RED) in `git log` — FOUND
- Commit `5e3e347` (Task 2 GREEN) in `git log` — FOUND
- Commit `d1dcd42` (Task 3 RED) in `git log` — FOUND
- Commit `336b4f1` (Task 3 GREEN) in `git log` — FOUND
- `npx vitest run src/data/units/rhythmUnit{1,2,3}.test.js` → 63/63 passing — VERIFIED
- All plan acceptance criteria grep gates pass (focusDurations q/qr/h/hr/w/wr present, category 'boss' present in each file exactly once, patternTagMode 'any' present in each boss exactly once, discovery_intro present at least twice in each DISCOVERY-containing unit) — VERIFIED

## TDD Gate Compliance

All three tasks followed the RED → GREEN gate sequence:

- Task 1: `test(01-05): ...` commit (RED, `e8068ce`) → `feat(01-05): ...` commit (GREEN, `c04091f`) ✓
- Task 2: `test(01-05): ...` commit (RED, `63872d9`) → `feat(01-05): ...` commit (GREEN, `5e3e347`) ✓
- Task 3: `test(01-05): ...` commit (RED, `d1dcd42`) → `feat(01-05): ...` commit (GREEN, `336b4f1`) ✓

No REFACTOR commits — none needed; data files were authored straight to passing state.

---

_Phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units_
_Completed: 2026-06-01_
