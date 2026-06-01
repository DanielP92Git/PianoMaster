---
phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
verified: 2026-06-02T00:42:00Z
status: human_needed
score: 7/7 must-haves verified (code-layer); 2 owner-pending gates remain
overrides_applied: 0
human_verification:
  - test: "Apply Supabase migration to production: supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql"
    expected: "MUST run BEFORE Netlify code deploy per D-13. Post-flight checks per 01-10-SUMMARY: SELECT COUNT(*) FROM student_skill_progress WHERE node_id LIKE 'rhythm_%' OR 'boss_rhythm_%' returns 0; SELECT SUM(total_xp) FROM students unchanged from pre-push value; is_free_node('rhythm_1_1'..'rhythm_1_5','boss_rhythm_1') all TRUE; is_free_node('rhythm_1_6','rhythm_2_1') FALSE."
    why_human: "Production DB push gated to owner per D-13; agent does not execute production migrations. Requires supabase CLI session targeting prod project and owner sign-off on the pre-push checklist."
  - test: "Owner UAT walkthrough of every rhythm node rhythm_1_1 → boss_rhythm_10 on a real device (SC-9)"
    expected: "All 55 rhythm nodes traversable. Multi-card scaffolding renders correctly on duration intros (4 cards) and rest intros (3 cards). Paywall: U1 free, U2+ paid. XP preserved against value recorded in migration pre-push snapshot. Hebrew RTL spot-check on 2-3 scaffolding nodes (no clipping, correct nikud). /trail UI: 10 rhythm units render; U10 = terminus; hidden syncopation invisible. Non-rhythm regression spot-check on Treble U1 + Bass U1."
    why_human: "SC-9 explicitly requires real-device user walkthrough — visual rendering, Hebrew RTL, tactile interaction, paywall surfaces, and live XP preservation across the deployed environment cannot be verified programmatically."
---

# Phase 01: Refactor Rhythm Trail Pedagogical Ordering / Restructure Units — Verification Report

**Phase Goal:** Restructure the 29 active rhythm trail nodes into a 10-unit / 55-node pedagogical order anchored by three falsifiable principles — Pulse-first, Rests-woven, Concept-per-unit — and introduce 12 kid-friendly intro/scaffolding screens (Duolingo-style) for each rhythmic concept. Existing student rhythm progress is wiped on deploy; total XP is preserved. Rhythm-only; Treble / Bass / Ear-training trails untouched. Hidden Unit 8 syncopation renamed `rhythm_synco_*` to free the `rhythm_8_*` namespace for the new 3/4 Meter unit.

**Verified:** 2026-06-02T00:42Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP success criteria + all 10 PLAN must_haves)

| #   | Truth                                                                                                    | Status                   | Evidence                                                                                                                                                                                                                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Quarter note is the first rhythmic-content node (REQ-01, Pulse-first)                                    | ✓ VERIFIED               | Loaded `SKILL_NODES` from `src/data/skillTrail.js`; filtered to `category === 'rhythm'`, sorted by `order`. First node: `rhythm_1_1` with `focusDurations: ["q"]`. `npm run verify:trail` reports `Pulse-first: OK`.                                                                                                                                                         |
| 2   | Each rest type sits within or immediately adjacent to its matching duration unit (REQ-02, Rests-woven)   | ✓ VERIFIED               | `npm run verify:trail` reports `Rests-woven: OK`. Inspection of `rhythmUnit{1,2,3}.js`: `rhythm_1_3` (qr) follows `rhythm_1_1`/`rhythm_1_2` (q); `rhythm_2_3` (hr) follows `rhythm_2_1`/`rhythm_2_2` (h); `rhythm_3_3` (wr) follows `rhythm_3_1`/`rhythm_3_2` (w).                                                                                                           |
| 3   | No unit mixes two distinct concepts (REQ-03, Concept-per-unit)                                           | ✓ VERIFIED               | `npm run verify:trail` reports `Concept-per-unit: OK`. Validator's `validateConceptPerUnit` (lines 740+ in `scripts/validateTrail.mjs`) enforces single-family per unit. U8 meter unit and U9 meter unit use `METER_ALLOWED ⊇ {3_4, 6_8}` per Wave 2 gap-closure commit.                                                                                                     |
| 4   | Each new rhythmic concept has a dedicated intro/scaffolding node with kid-friendly explainer UI (REQ-04) | ✓ VERIFIED               | 12 `cards.<concept>` blocks exist in both `src/locales/en/common.json` and `src/locales/he/common.json` (q, qr, h, hr, w, wr, 8_pair, 16, hd, qd, 3_4, 6_8). `discovery_intro` question type present in 10 rhythm unit files. `DiscoveryIntroQuestion.jsx` contains 20 references to `CONCEPT_CARDS / cardIndex / setCardIndex / REQ-04` markers. 11/11 renderer tests pass. |
| 5   | Locale keys, paywall, validator, tests updated in lockstep (REQ-05)                                      | ✓ VERIFIED               | Locale parity test green (89 paths EN = 89 paths HE). FREE_NODE_IDS parity test green (`rhythm_1_1..rhythm_1_5 + boss_rhythm_1` matches SQL whitelist). Validator gains REQ-01/02/03 lint rules at `scripts/validateTrail.mjs` lines 649/686/740. All 10 unit names exist in EN+HE `trail.json`.                                                                             |
| 6   | Clean-slate rhythm progress wipe via migration; total XP preserved (REQ-06)                              | ⚠ AUTHORED, NOT APPLIED | Migration file authored at `supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql`. WHERE clause: `node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%'`. is_free_node body rebuilt with D-12 whitelist (5 rhythm + boss_rhythm_1). No UPDATE/DELETE against `students` table. **Owner-pending: `supabase db push` per D-13 (see human_verification 1).**         |
| 7   | Rhythm engine changes bounded to pedagogical necessity (REQ-07)                                          | ✓ VERIFIED               | Engine change scoped to `DiscoveryIntroQuestion.jsx` only — 9 `// REQ-04` traceability comments inline. Pattern-mode legacy preserved (focusPattern.id qhq/synsyn → single-card flow intact). All 233 rhythm-game tests pass (`MetronomeTrainer`, `MixedLessonGame`, `ArcadeRhythmGame`, `PulseQuestion`, `DictationQuestion`, etc.).                                        |

**Score:** 7/7 truths verified at the code layer. Truth 6 has the migration artifact verified but DB application is owner-pending.

### Required Artifacts

| Artifact                                                                 | Expected                                                                                             | Status                     | Details                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/validateTrail.mjs`                                              | 3 new exported lint rules                                                                            | ✓ VERIFIED                 | `export function validatePulseFirst` (line 649), `export function validateRestsWoven` (line 686), `export function validateConceptPerUnit` (line 740). All three invoked in main block.                                                                                                   |
| `scripts/__tests__/validateTrail.principles.test.mjs`                    | 7 unit tests for new rules                                                                           | ✓ VERIFIED                 | 7/7 tests passing.                                                                                                                                                                                                                                                                        |
| `src/locales/__tests__/scaffolding-card-parity.test.js`                  | EN ↔ HE card parity gate                                                                            | ✓ VERIFIED                 | 2/2 tests passing; 89 paths each side.                                                                                                                                                                                                                                                    |
| `src/config/__tests__/freeNodes.parity.test.js`                          | FREE_NODE_IDS ↔ SQL whitelist parity                                                                | ✓ VERIFIED                 | 1/1 test passing.                                                                                                                                                                                                                                                                         |
| `src/data/units/rhythmUnit1.js` … `rhythmUnit10.js`                      | 10 new rhythm unit files                                                                             | ✓ VERIFIED                 | All 10 present. 45 rhythm nodes + 10 boss_rhythm nodes = 55 active rhythm domain nodes (matches phase goal).                                                                                                                                                                              |
| `src/data/units/rhythmUnit1.test.js` … `rhythmUnit10.test.js`            | 10 sibling test files                                                                                | ✓ VERIFIED                 | All 10 present; 174 unit-data assertions total + 12 difficulty test assertions = 186 unit tests; 100% green.                                                                                                                                                                              |
| `src/data/units/rhythmUnit8Redesigned.js` (hidden syncopation)           | Renamed IDs to `rhythm_synco_*`/`boss_rhythm_synco`; file preserved                                  | ✓ VERIFIED                 | 21 references to renamed IDs; 1 stray match to `rhythm_8_/boss_rhythm_8` (top-of-file rename history comment, prose only, not a code-path ID).                                                                                                                                            |
| `src/data/expandedNodes.js`                                              | 10 NEW imports; HIDDEN-V1 markers with `rhythmUnit8SyncoNodes` binding                               | ✓ VERIFIED                 | Lines 48-57: 10 imports of `rhythmUnit{1..10}.js`. HIDDEN-V1 markers at lines 59, 62, 101, 138 reference renamed `rhythmUnit8SyncoNodes` binding (commented).                                                                                                                             |
| `src/data/skillTrail.js` UNITS map                                       | RHYTHM_1..RHYTHM_10 + RHYTHM_SYNCO entries                                                           | ✓ VERIFIED                 | Lines 232-364: all 11 entries present.                                                                                                                                                                                                                                                    |
| `src/config/subscriptionConfig.js`                                       | FREE_RHYTHM_NODE_IDS = `[rhythm_1_1..rhythm_1_5]`; new `FREE_BOSS_RHYTHM_NODE_IDS = [boss_rhythm_1]` | ✓ VERIFIED                 | Both arrays present; `boss_rhythm_1` removed from PAYWALL_BOSS_NODE_IDS.                                                                                                                                                                                                                  |
| `supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql`          | Atomic rhythm wipe + is_free_node body replacement                                                   | ✓ VERIFIED (file authored) | File exists with `DELETE FROM student_skill_progress WHERE node_id LIKE 'rhythm_%' OR 'boss_rhythm_%'`; CREATE OR REPLACE FUNCTION includes 5 rhythm + boss_rhythm_1 IDs in ARRAY whitelist; no UPDATE/DELETE on `students_score`/`students` total_xp; pre/post-flight DO blocks present. |
| `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` | Multi-card pagination renderer                                                                       | ✓ VERIFIED                 | 20 hits on CONCEPT_CARDS/cardIndex/setCardIndex/REQ-04 markers. 11/11 renderer tests pass.                                                                                                                                                                                                |
| `src/locales/en/common.json` & `src/locales/he/common.json`              | 12 `cards.<concept>` blocks per language                                                             | ✓ VERIFIED                 | 12 EN, 12 HE blocks confirmed.                                                                                                                                                                                                                                                            |
| `src/locales/en/trail.json` & `src/locales/he/trail.json`                | 10 unit display-name entries in both locales                                                         | ✓ VERIFIED                 | All 10 verified present in both locales by JSON key-lookup.                                                                                                                                                                                                                               |
| `public/sw.js` cache bump                                                | `pianomaster-v12`                                                                                    | ✓ VERIFIED                 | `grep -c "pianomaster-v12"` = 1 (constant).                                                                                                                                                                                                                                               |
| `CLAUDE.md`                                                              | Updated counts (Rhythm: 55, Boss: 12, total 106) + syncopation rename docs                           | ✓ VERIFIED                 | Line 188: "106 active nodes". Line 192: "Treble: 23, Bass: 22, Rhythm: 55, Boss: 12". Line 207: "Rhythm trail currently ends at boss_rhythm_10". Hidden syncopation re-enable steps reference `rhythmUnit8SyncoNodes`.                                                                    |
| Legacy `rhythmUnit{1..7}Redesigned.js` files                             | Deleted                                                                                              | ✓ VERIFIED                 | `ls src/data/units/rhythmUnit*Redesigned.js` returns only `rhythmUnit8Redesigned.js` (the preserved hidden syncopation file).                                                                                                                                                             |

### Key Link Verification

| From                                                            | To                                                        | Via                                                                        | Status                            | Details                                                                                                               |
| --------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `scripts/validateTrail.mjs`                                     | `src/data/skillTrail.js` SKILL_NODES                      | `import { SKILL_NODES }`                                                   | ✓ WIRED                           | Validator runs against SKILL_NODES; all 5 principle checks OK.                                                        |
| `scripts/__tests__/validateTrail.principles.test.mjs`           | `scripts/validateTrail.mjs`                               | dynamic import of named exports                                            | ✓ WIRED                           | 7 tests exercise the 3 rule functions; all pass.                                                                      |
| `src/data/expandedNodes.js`                                     | `src/data/units/rhythmUnit{1..10}.js`                     | 10 default imports + 2 spreads (EXPANDED_NODES + EXPANDED_RHYTHM_NODES)    | ✓ WIRED                           | All 10 imports present (lines 48-57); spreads applied.                                                                |
| `src/data/skillTrail.js`                                        | `src/data/expandedNodes.js` SKILL_NODES export            | reads aggregator output                                                    | ✓ WIRED                           | UNITS map RHYTHM_1..RHYTHM_10 + RHYTHM_SYNCO entries match aggregator IDs.                                            |
| `DiscoveryIntroQuestion.jsx`                                    | `common.json` `game.discovery.cards.<concept>.*`          | `useTranslation('common')` resolves `CONCEPT_CARDS[focusDuration]` lookups | ✓ WIRED                           | 11/11 tests verify multi-card pagination, Listen-button gating, label flip.                                           |
| `subscriptionConfig.js` `FREE_NODE_IDS`                         | Postgres `is_free_node()`                                 | parity test enforces 1:1 mirror                                            | ✓ WIRED                           | Parity test green; SQL ARRAY in migration matches JS Set verbatim.                                                    |
| Hidden syncopation `rhythmUnit8Redesigned.js` (rhythm*synco*\*) | aggregator HIDDEN-V1 spread (commented)                   | re-enable workflow                                                         | ✓ WIRED (intentionally commented) | All 3 HIDDEN-V1 markers in aggregator reference `rhythmUnit8SyncoNodes`; binding rename avoids collision with NEW U8. |
| Migration `is_free_node()` rebuild                              | `FREE_RHYTHM_NODE_IDS + FREE_BOSS_RHYTHM_NODE_IDS` JS Set | parity-test enforced equality                                              | ⚠ AUTHORED, NOT APPLIED          | SQL written and asserted by JS parity test. Live DB application is owner-pending (see human_verification 1).          |

### Data-Flow Trace (Level 4)

| Artifact                      | Data Variable                  | Source                                                                 | Produces Real Data                                                                                          | Status                   |
| ----------------------------- | ------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------ |
| `SKILL_NODES` (skillTrail.js) | rhythm nodes                   | `EXPANDED_RHYTHM_NODES` spread from 10 unit files                      | Yes — 45 rhythm + 10 boss_rhythm = 55 nodes; first node `rhythm_1_1` has `focusDurations: ["q"]` per REQ-01 | ✓ FLOWING                |
| `DiscoveryIntroQuestion.jsx`  | `CONCEPT_CARDS[focusDuration]` | `i18next` resolves `game.discovery.cards.<concept>.*` from common.json | Yes — 12 concepts × 3 or 4 cards each = 44 card entries in both EN + HE                                     | ✓ FLOWING                |
| Migration `is_free_node()`    | rhythm subset                  | hardcoded ARRAY in SQL function body                                   | Yes (when applied) — 6 IDs: rhythm_1_1..rhythm_1_5 + boss_rhythm_1                                          | ⚠ AUTHORED, NOT APPLIED |

### Behavioral Spot-Checks

| Behavior                                                                                                                    | Command                                                                | Result                                                                    | Status |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------ |
| Trail validator passes all 5 principle checks (Pulse-first, Rests-woven, Concept-per-unit, game-type policy, measure count) | `npm run verify:trail`                                                 | Validation passed with warnings (low-variety, orphan tags — pre-existing) | ✓ PASS |
| All rhythm unit data tests pass                                                                                             | `npx vitest run src/data/units/`                                       | 14 files / 253 tests / all passing                                        | ✓ PASS |
| Validator principle rule tests pass                                                                                         | `npx vitest run scripts/__tests__/validateTrail.principles.test.mjs`   | 7/7 passing                                                               | ✓ PASS |
| Locale parity test passes                                                                                                   | `npx vitest run src/locales/__tests__/scaffolding-card-parity.test.js` | 2/2 passing (89 paths each)                                               | ✓ PASS |
| FREE_NODE_IDS parity test passes                                                                                            | `npx vitest run src/config/__tests__/freeNodes.parity.test.js`         | 1/1 passing                                                               | ✓ PASS |
| DiscoveryIntroQuestion renderer tests pass                                                                                  | `npx vitest run …/DiscoveryIntroQuestion.test.jsx`                     | 11/11 passing                                                             | ✓ PASS |
| Rhythm-game engine regression (REQ-07 bound check)                                                                          | `npx vitest run src/components/games/rhythm-games/`                    | 22 files / 233 tests / all passing                                        | ✓ PASS |
| SKILL_NODES node-count math matches phase goal                                                                              | `node -e "..."`                                                        | rhythm: 45, boss_rhythm: 10, total: 55                                    | ✓ PASS |
| First rhythm node introduces quarter (REQ-01)                                                                               | `node -e "..."`                                                        | `rhythm_1_1` focusDurations: `["q"]`                                      | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan(s)                    | Description                                          | Status                                             | Evidence                                                                                                                                                               |
| ----------- | --------------------------------- | ---------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-01      | 01-01, 01-05, 01-06, 01-07        | Pulse-first ordering                                 | ✓ SATISFIED                                        | First rhythm node is `rhythm_1_1` with focusDurations `["q"]`; validator's Pulse-first lint rule reports OK.                                                           |
| REQ-02      | 01-01, 01-05                      | Rests-woven principle                                | ✓ SATISFIED                                        | Validator's Rests-woven lint rule reports OK; rhythm\_{1,2,3}\_3 introduce qr/hr/wr each in matching duration unit.                                                    |
| REQ-03      | 01-01, 01-05, 01-06, 01-07, 01-08 | Concept-per-unit                                     | ✓ SATISFIED                                        | Validator's Concept-per-unit lint rule reports OK; all 10 units pass single-family check (meter units U8/U9 covered by extended METER_ALLOWED).                        |
| REQ-04      | 01-03, 01-05, 01-06, 01-07, 01-09 | Intro/scaffolding nodes with explainer UI            | ✓ SATISFIED                                        | 12-concept cards tree in EN+HE; multi-card pagination in DiscoveryIntroQuestion.jsx with 9 inline REQ-04 traceability comments; 11/11 renderer tests pass.             |
| REQ-05      | 01-01, 01-02, 01-03, 01-04, 01-08 | Locale, paywall, validator, tests lockstep           | ✓ SATISFIED                                        | All 4 parity/principle tests green; UNITS map + locale + FREE config + Supabase migration whitelist all consistent.                                                    |
| REQ-06      | 01-04, 01-10                      | Clean-slate rhythm progress wipe; total_xp preserved | ⚠ PARTIALLY SATISFIED (CODE) / OWNER-PENDING (DB) | Migration file authored; correct WHERE clause; pre/post-flight DO blocks; no UPDATE/DELETE on `students` table. Owner sign-off + `supabase db push` required per D-13. |
| REQ-07      | 01-09                             | Rhythm engine changes bounded to necessity           | ✓ SATISFIED                                        | Engine change scoped to `DiscoveryIntroQuestion.jsx` only with REQ-04 inline traceability; pattern-mode legacy (qhq/synsyn) preserved; all 233 rhythm-game tests pass. |

All 7 REQ IDs from REQUIREMENTS.md are claimed by at least one plan's `requirements:` frontmatter:

- REQ-01: plans 01-01, 01-05, 01-06, 01-07
- REQ-02: plans 01-01, 01-05
- REQ-03: plans 01-01, 01-05, 01-06, 01-07, 01-08
- REQ-04: plans 01-03, 01-05, 01-06, 01-07, 01-09
- REQ-05: plans 01-01, 01-02, 01-03, 01-04, 01-08, 01-10
- REQ-06: plans 01-04, 01-10
- REQ-07: plan 01-09

No orphaned requirements.

### Anti-Patterns Found

| File                          | Line | Pattern                                                                                       | Severity | Impact                                                                                                                                                           |
| ----------------------------- | ---- | --------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify:trail` output | n/a  | Pre-existing low-variety warnings (14 rhythm nodes)                                           | ℹ Info  | Documented pre-existing; not a regression — same warnings appeared before phase. Multi-angle game backlog (see MEMORY.md `backlog_rhythm_multi_angle_games.md`). |
| `npm run verify:trail` output | n/a  | 4 orphan pattern tags (`syncopation-heavy`, `dotted-syncopation`, `syncopation`, `six-eight`) | ℹ Info  | Pre-existing from hidden syncopation unit + 6/8 baseline. Not blocking; documented in plan 01-02 and 01-WAVE2-GAPS.md.                                           |

No TODO/FIXME/PLACEHOLDER/stub returns or empty-handler patterns found in any modified file.

### Human Verification Required

Two blocking gates remain that the agent cannot execute inside the worktree:

#### 1. Apply Supabase migration to production (D-13)

**Test:** Run `supabase db push` to apply `supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql` to the production project. MUST happen BEFORE Netlify code deploy.

**Pre-push checklist (from 01-10-SUMMARY):**

1. `supabase status` — confirm CLI session targets prod project ref
2. `supabase migration list` — confirm Phase 1 migration is the only pending entry
3. `supabase db diff --linked --schema public` — dry-run inspection
4. Record pre-push `SELECT SUM(total_xp) FROM students;` value
5. `supabase db push`

**Post-push verification:**

- `SELECT COUNT(*) FROM student_skill_progress WHERE node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%';` → `0`
- `SELECT SUM(total_xp) FROM students;` → unchanged from pre-push value
- `SELECT is_free_node('rhythm_1_1');` → `TRUE`
- `SELECT is_free_node('rhythm_1_5');` → `TRUE`
- `SELECT is_free_node('boss_rhythm_1');` → `TRUE`
- `SELECT is_free_node('rhythm_1_6');` → `FALSE`
- `SELECT is_free_node('rhythm_2_1');` → `FALSE`
- Only after the above pass: trigger Netlify deploy and tail the build log for `pianomaster-v12` in deployed `sw.js`.

**Why human:** Production DB push requires owner sign-off + supabase CLI session targeting prod; gate locked in D-13.

#### 2. Owner UAT walkthrough — SC-9

**Test:** After Task 4 and Netlify deploy, walk every rhythm node `rhythm_1_1 → boss_rhythm_10` on a real device.

**Expected (per 01-10-SUMMARY):**

- Pulse-first ordering renders; rests-woven scaffolding cards (4 cards on duration intros, 3 on rest intros) display
- Paywall: U1 free; U2+ paid
- XP preserved against pre-push value recorded in Task 4
- Hebrew RTL spot-check on 2-3 scaffolding nodes (no clipping, correct nikud)
- `/trail` UI: 10 rhythm units render; U10 = terminus; hidden syncopation invisible
- Non-rhythm regression spot-check on Treble U1 + Bass U1

**Why human:** SC-9 requires real-device walkthrough — visual rendering quality, Hebrew RTL behavior, tactile interaction, paywall surfaces, and live XP preservation against the deployed environment cannot be verified programmatically.

### Gaps Summary

No code-layer gaps. All 10 plans delivered against their must_haves, all 7 REQs are accounted for, and all relevant test suites are green:

- `npm run verify:trail` — passes (4 OK principle checks + measure-count; only pre-existing low-variety/orphan-tag warnings)
- `npx vitest run src/data/units/ scripts/__tests__/ src/locales/__tests__/scaffolding-card-parity.test.js src/config/__tests__/freeNodes.parity.test.js .../DiscoveryIntroQuestion.test.jsx` — 274/274 passing
- `npx vitest run src/components/games/rhythm-games/` — 233/233 passing (REQ-07 regression bound)

The only remaining gates are the two owner-pending blocking items documented above. These were planned as `human_verification` in 01-10-PLAN per D-13 and SC-9, are not unmet gaps but unblocked-by-design deferrals.

Wave 2 integration gaps documented in `01-WAVE2-GAPS.md` were closed prior to this verification (commits 42b2824, 69905f1, 6ff0fa1, c54f68f visible in git log). The closure is confirmed by the current `verify:trail` Pulse-first/Rests-woven/Concept-per-unit OK status.

---

_Verified: 2026-06-02T00:42Z_
_Verifier: Claude (gsd-verifier)_
