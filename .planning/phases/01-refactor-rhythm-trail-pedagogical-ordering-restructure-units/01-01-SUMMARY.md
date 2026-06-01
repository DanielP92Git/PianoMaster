---
phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
plan: 01
subsystem: testing
tags:
  [
    validator,
    lint-rules,
    vitest,
    parity-tests,
    rhythm-trail,
    pedagogy,
    i18n,
    paywall,
  ]

# Dependency graph
requires:
  - phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
    provides: locked decisions D-01..D-14 (CONTEXT.md), REQ-01..REQ-07 (SPEC.md), pedagogy research with concrete rule implementations (RESEARCH.md)
provides:
  - Three exported lint rule functions (validatePulseFirst, validateRestsWoven, validateConceptPerUnit) in scripts/validateTrail.mjs enforcing REQ-01..REQ-03
  - Sibling unit test suite at scripts/__tests__/validateTrail.principles.test.mjs (7 tests, all green) exercising each rule with positive + negative fixtures via vi.mock of SKILL_NODES
  - Scaffolding-card EN↔HE parity gate at src/locales/__tests__/scaffolding-card-parity.test.js (passes vacuously today; goes load-bearing when Wave 2 populates game.discovery.cards.*)
  - FREE_NODE_IDS ↔ SQL whitelist parity gate at src/config/__tests__/freeNodes.parity.test.js (intentionally RED today; goes green when 01-04 lands the migration + JS update)
  - vitest.config.js extension to discover scripts/**/__tests__/*.test.mjs (Rule 3 deviation; necessary for the sibling test pattern)
affects: [01-02, 01-03, 01-04, 01-05, 01-06, 01-07, 01-08, 01-09, 01-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave-0 validation-first pattern: write the falsifiable rules + parity tests BEFORE any data restructure begins, so every downstream wave has red/green signal of 'done'"
    - "ESM named-export validator rules (instead of module-scope-only) so unit tests can exercise individual rules in isolation"
    - "vi.mock factory with getter for fixture-per-test pattern: `get SKILL_NODES() { return fixtureNodes; }` lets tests reassign fixtures between cases without re-mocking"
    - "Console.error spy assertions (not module-scope hasErrors flag) for validator rule tests — avoids state leak across describe blocks"
    - "Intentionally-failing-then-green parity tests as wave gates: a red test in Wave 0 is the precise spec for what Wave N must deliver"

key-files:
  created:
    - scripts/__tests__/validateTrail.principles.test.mjs
    - src/locales/__tests__/scaffolding-card-parity.test.js
    - src/config/__tests__/freeNodes.parity.test.js
  modified:
    - scripts/validateTrail.mjs
    - vitest.config.js

key-decisions:
  - "Console.error spy per-test (not hasErrors module flag) for validator rule assertions — prevents state leak"
  - "Extend vitest.config.js include glob to pick up scripts/__tests__/*.test.mjs — Rule 3 deviation, required by the plan's specified file path"
  - "Meter-unit branch in validateConceptPerUnit treats any non-4/4 timeSignature as its own family with strict allowlist {q, qd, 8} — matches D-14 meter handling without inventing a meter pseudo-family"
  - "U10 hard exemption in validateConceptPerUnit (skip unit===10 entirely) — D-11 single cumulative review boss is intentionally cross-concept"
  - "fixtureNodes module-let + vi.mock getter pattern reused across all 7 validator tests — single fixture variable, reassigned per case"

patterns-established:
  - "Wave-0 falsifiable verification: lint rules + parity tests committed BEFORE the data restructure they validate. Subsequent waves drive intentionally-red tests to green as a definition of done."
  - "Named-export validator rules: any rule that needs unit-test coverage gets `export function`; main-block invocations are unchanged"
  - "Sibling-tests-for-scripts: vitest.config include now covers `scripts/**/__tests__/*.{test,spec}.{js,mjs}` — future script-level test files follow this convention"

requirements-completed: [REQ-01, REQ-02, REQ-03, REQ-05]

# Metrics
duration: 6min
completed: 2026-06-01
---

# Phase 01 Plan 01: Wave 0 Validation Layer Summary

**Three falsifiable pedagogy lint rules (validatePulseFirst, validateRestsWoven, validateConceptPerUnit) exported from scripts/validateTrail.mjs, 7 sibling unit tests via vi.mock, and two parity gates (EN/HE scaffolding + FREE_NODE_IDS↔SQL) wired BEFORE any rhythm data lands — so Waves 1–4 know exactly what "done" means.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-06-01T18:44:35Z
- **Completed:** 2026-06-01T18:50:38Z
- **Tasks:** 3
- **Files modified:** 5 (4 plan-specified + 1 Rule 3 deviation)

## Accomplishments

- Added 3 named-export validator rule functions to `scripts/validateTrail.mjs` (`validatePulseFirst`, `validateRestsWoven`, `validateConceptPerUnit`) following the exact shape of the existing `validateGameTypePolicy()` rule and invoked them in the main block between `validateGameTypePolicy()` and `validateMeasureCountPolicy()`.
- Created `scripts/__tests__/validateTrail.principles.test.mjs` — 7 tests across 3 describe blocks, all green — exercising each rule with positive + negative fixtures via `vi.mock` of `src/data/skillTrail.js`.
- Created `src/locales/__tests__/scaffolding-card-parity.test.js` — 2 tests, both passing vacuously today. Will become load-bearing the moment Wave 2 populates `game.discovery.cards.*`.
- Created `src/config/__tests__/freeNodes.parity.test.js` — 1 test, INTENTIONALLY FAILING TODAY against the pre-restructure JS list. The failure diff (`missingInJs: ['rhythm_1_2','rhythm_1_5']`, `extraInJs: ['rhythm_1_6']`) is the precise spec for Plan 01-04 to deliver.
- Confirmed the new `validateConceptPerUnit` rule fires correctly on today's known-violating data (3 violations: Unit 1 mixes {q_qr, h_hr}, Unit 4 mixes {q_qr, h_hr, w_wr}, Unit 5 meter unit contains `hd`). Pulse-first and Rests-woven both pass on current data. This is the expected Wave 0 red signal per the plan's done note.

## Task Commits

1. **Task 1: Add three new lint rules to scripts/validateTrail.mjs** — `f8dd37b` (feat)
2. **Task 2: Unit test the three new validator rules with positive + negative fixtures** — `1c7163d` (test)
3. **Task 3: Create scaffolding-card EN↔HE parity test + FREE_NODE_IDS parity test** — `edc989b` (test)

_Plan metadata commit will follow this SUMMARY._

## Files Created/Modified

- `scripts/validateTrail.mjs` — added `CONCEPT_FAMILIES`, `REST_TO_DURATION` constants and three named-export rule functions; wired main-block invocations
- `scripts/__tests__/validateTrail.principles.test.mjs` (NEW) — 7-test suite with `vi.mock` SKILL_NODES + `makeNode` fixture helper + `console.error` spy assertions
- `src/locales/__tests__/scaffolding-card-parity.test.js` (NEW) — recursive `collectPaths` walker, mutual subset assertions against `enCommon.game?.discovery?.cards` and `heCommon.game?.discovery?.cards`
- `src/config/__tests__/freeNodes.parity.test.js` (NEW) — pins documented post-restructure 6-ID whitelist; asserts JS `FREE_RHYTHM_NODE_IDS + boss_rhythm_1` matches via symmetric diff
- `vitest.config.js` — extended `include` glob to discover `scripts/**/__tests__/*.{test,spec}.{js,mjs}` (Rule 3 deviation, see below)

## Decisions Made

- **Test contract = console.error spy, not `hasErrors` flag.** The validator's module-scope `hasErrors` is a one-way latch (`true` once set). Asserting on it would leak state between tests in a single describe block. The console.error spy is reset in `beforeEach` and gives per-test signal.
- **U10 exemption in `validateConceptPerUnit` is a hard skip on `unit === 10`.** Per D-11 the U10 review boss is a single cumulative BOSS by design. The test covers it (Test 7: empty focusDurations → no error).
- **Meter-unit branch uses an allowlist `{q, qd, 8}`, not a separate family map.** Meter is identified by `timeSignature !== '4/4'` (any node in the unit). Inside a meter unit, only pulse-related durations may appear. This matches the spec's "meters live in dedicated meter units" requirement without needing to invent a `meter_3_4`/`meter_6_8` pseudo-family.
- **`fixtureNodes` module-let + `vi.mock` factory getter.** A single mutable `let fixtureNodes = []` at the top of the test file, exposed via `get SKILL_NODES()` in the mock factory, lets each test reassign fixtures without re-registering the mock. Cleaner than `vi.doMock` per test.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Extended vitest.config.js `include` to cover `scripts/__tests__/*.test.mjs`**

- **Found during:** Task 2 (running the new principles test suite)
- **Issue:** Default vitest `include` was `["src/**/*.{test,spec}.{js,jsx,ts,tsx}"]`. The plan specifies the test file path as `scripts/__tests__/validateTrail.principles.test.mjs` (under `<files>` AND `must_haves.artifacts` AND `key-links`). With the default include, `npx vitest run scripts/__tests__/validateTrail.principles.test.mjs` returned `No test files found, exiting with code 1` — the explicit-path argument is filtered through the include pattern.
- **Fix:** Added `"scripts/**/__tests__/*.{test,spec}.{js,mjs}"` to the `include` array, with an inline comment explaining the Phase 01 Plan 01 rationale.
- **Files modified:** `vitest.config.js`
- **Verification:** `npx vitest run scripts/__tests__/validateTrail.principles.test.mjs` now reports `Test Files 1 passed | Tests 7 passed`.
- **Committed in:** `1c7163d` (Task 2 commit)
- **Scope check:** Affects ONLY test discovery for sibling-style test files next to scripts. Existing `src/**` discovery unchanged. Zero runtime impact, zero risk to existing tests.

---

**Total deviations:** 1 auto-fixed (1 blocking infrastructure)
**Impact on plan:** The deviation was necessary to satisfy the plan's own file-path specification. The plan author's expected test location requires the config extension; without it, the test suite cannot be discovered. No scope creep — the change is the minimum delta to make the plan's specified path runnable.

## Issues Encountered

- **None blocking.** The validator's main block runs on module load (when the test imports `../validateTrail.mjs`), but with empty mocked `SKILL_NODES` it prints all rules as OK without setting `hasErrors=true`, so no `process.exit(1)` fires. The `beforeEach` console.error spy is attached AFTER the import-time main block runs, so the test assertions remain clean. This was lucky; future plans extending these tests should be aware of the import-time side effect.

## Expected Test State After This Plan

The validator and test suite are in a deliberately-mixed state:

| Check                                                                  | Status             | Why                                                                                                                                                             |
| ---------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify:trail`                                                 | RED (3 violations) | `validateConceptPerUnit` fires on today's known-violating Unit 1, Unit 4, Unit 5 — by design per Task 1 done note. Wave 1/2 restructures U1–U10 to drive green. |
| `npx vitest run scripts/__tests__/validateTrail.principles.test.mjs`   | GREEN (7/7)        | Tests use isolated fixtures, not real trail data                                                                                                                |
| `npx vitest run src/locales/__tests__/scaffolding-card-parity.test.js` | GREEN (2/2)        | Vacuous pass — both EN and HE `game.discovery.cards` subtrees empty                                                                                             |
| `npx vitest run src/config/__tests__/freeNodes.parity.test.js`         | RED (1 failure)    | Intentional Wave 0 red signal — Plan 01-04 drives green by updating `FREE_RHYTHM_NODE_IDS` + Postgres `is_free_node()` in lockstep per D-12/D-13                |

**Subsequent wave executors must NOT interpret these reds as bugs to fix without reading 01-PLAN.md's done notes.** The red signal IS the deliverable for those waves.

## Threat Flags

None — no new network surface, auth path, file access, or trust-boundary changes. Both new tests are pure unit tests reading local JSON/JS imports; validator rules are build-time only.

## Self-Check: PASSED

Verified all created files exist and all task commits are reachable:

- FOUND: `scripts/validateTrail.mjs` (modified)
- FOUND: `scripts/__tests__/validateTrail.principles.test.mjs` (new)
- FOUND: `src/locales/__tests__/scaffolding-card-parity.test.js` (new)
- FOUND: `src/config/__tests__/freeNodes.parity.test.js` (new)
- FOUND: `vitest.config.js` (modified — Rule 3 deviation)
- FOUND commit: `f8dd37b` (Task 1)
- FOUND commit: `1c7163d` (Task 2)
- FOUND commit: `edc989b` (Task 3)

## Next Phase Readiness

**For Plan 01-02 (Wave 1 data files U1–U10):**

- `validateConceptPerUnit` is currently RED on today's data; as Wave 1 lands new unit files, the rule fires per-unit and tells the executor exactly which family mix is illegal.
- `validatePulseFirst` will go red if the new U1's first node by `order` doesn't have `focusDurations: ['q']`.
- `validateRestsWoven` will go red if a new unit introduces a rest without a preceding matching duration introducer.

**For Plan 01-03 (Wave 2 scaffolding cards + locales):**

- `scaffolding-card-parity.test.js` is the safety net for EN/HE card-key parity. Wave 2 should add cards to EN first, then HE; the test will go red until both are in sync.

**For Plan 01-04 (Wave 3 paywall + migration):**

- `freeNodes.parity.test.js` is RED today with diff `missingInJs: ['rhythm_1_2','rhythm_1_5'], extraInJs: ['rhythm_1_6']`. Plan 01-04 must update `FREE_RHYTHM_NODE_IDS` to `['rhythm_1_1','rhythm_1_2','rhythm_1_3','rhythm_1_4','rhythm_1_5']` AND ship the matching Postgres `is_free_node()` body in the Supabase migration — at which point this test goes green and becomes a regression gate.

**No blockers.** All Wave 0 deliverables are in place and committed.

---

_Phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units_
_Completed: 2026-06-01_
