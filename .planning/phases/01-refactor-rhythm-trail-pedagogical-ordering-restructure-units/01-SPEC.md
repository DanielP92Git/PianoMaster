# Phase 1: Rhythm Trail Pedagogical Restructure — Specification

**Created:** 2026-05-26
**Ambiguity score:** 0.13 (gate: ≤ 0.20) ✓
**Requirements:** 7 locked

## Goal

Restructure the 29 active rhythm trail nodes across the 7 active rhythm units (ending at `boss_rhythm_7`) into a new pedagogical order anchored by three falsifiable principles — **Pulse-first**, **Rests-woven**, and **Concept-per-unit** — and introduce **intro/scaffolding nodes** with kid-friendly explainer UI for each rhythmic concept. Existing student rhythm progress is wiped on deploy (clean slate).

## Background

The rhythm trail today contains 29 active nodes grouped into 7 units (Unit 8 syncopation is built but hidden), with a consistent intra-unit arc of DISCOVERY → PRACTICE → DISCOVERY → PRACTICE → SPEED_ROUND → MINI_BOSS. Boss node `boss_rhythm_7` is the current terminus.

Pedagogical concerns identified during codebase scout:

- **Whole notes come after half notes** (Unit 2 follows Unit 1 quarter+half) — contradicts both longest-to-shortest pedagogy and pulse-first/extension-based pedagogy.
- **Rests sit at Unit 4** — far from their matching duration units; quarter rest (the conceptually simplest rest) is taught well after eighth notes.
- **Unit 5 mixes a duration concept (dotted notes) with a meter (3/4 time)** — two distinct learning targets in one unit.
- **Unit 6 combines sixteenths introduction with the all-duration BOSS** — overloaded.
- The DISCOVERY pattern lacks dedicated kid-friendly _explainer_ content before exercises begin — concepts go directly to exercises with minimal scaffolding.

No formal pedagogical framework has been encoded; the existing order reflects iterative authoring rather than a documented pedagogy. This phase encodes the owner's pedagogical instinct as falsifiable principles, then restructures the trail to enforce them.

## Requirements

1. **Pulse-first ordering principle**: Quarter note is the first rhythmic-content node a learner encounters; halves and wholes are introduced as extensions of the pulse; eighths and sixteenths as subdivisions.
   - Current: Quarter and half notes are introduced together in Unit 1; whole notes are deferred to Unit 2.
   - Target: The first rhythmic content node after any intro/scaffolding nodes introduces the quarter note alone. Subsequent units introduce extensions/subdivisions of the quarter pulse.
   - Acceptance: `SKILL_NODES` filtered to `category === 'rhythm'` and sorted by `order`, skipping intro/scaffolding nodes, has the quarter-note discovery node first; whole-note discovery appears later than half-note discovery, OR both wholes & halves are reframed as extensions (documented in CONTEXT.md after planning).

2. **Rests-woven principle**: Each rest type is introduced in or immediately adjacent to its matching duration unit — not aggregated into a single late "Rests" unit.
   - Current: All three rests (quarter, half, whole) are grouped into Unit 4, which appears after eighth notes.
   - Target: Quarter rest appears in or directly after the quarter-note unit; half rest appears in or directly after the half-note unit; whole rest appears in or directly after the whole-note unit.
   - Acceptance: For each rest node, the closest preceding non-intro node (by `order`) introduces the matching duration. Verifiable by a static check in `scripts/validateTrail.mjs`.

3. **Concept-per-unit principle**: No unit mixes two distinct learning concepts. A "concept" is a duration introduction, a rest introduction, a dotted-note introduction, or a meter introduction. Each unit has exactly one primary learning concept (intro nodes for that concept may pair with practice/speed/boss nodes).
   - Current: Unit 5 introduces dotted halves, dotted quarters, AND 3/4 time in the same unit. Unit 6 introduces sixteenths AND hosts the all-rhythm BOSS.
   - Target: Each unit's nodes share a single primary concept. Meters (3/4, 6/8) live in dedicated meter units, separate from duration-introduction units. Aggregate/all-rhythm bosses sit in their own review unit if retained.
   - Acceptance: A linter rule in `scripts/validateTrail.mjs` (or equivalent test) flags any unit whose nodes introduce more than one of {duration, rest, dotted-note, meter}.

4. **Intro/scaffolding nodes**: Each new rhythmic concept has a dedicated intro/scaffolding node that displays a kid-friendly instructional explanation of the concept _before_ any exercises begin — analogous to lesson-intro slides in established kids-education apps (e.g., Duolingo).
   - Current: Concepts are introduced via DISCOVERY-type nodes that proceed directly to exercises; there is no dedicated explainer surface before exercises.
   - Target: Each new rhythmic concept (quarter, half, whole, eighth, sixteenth, quarter-rest, half-rest, whole-rest, dotted-half, dotted-quarter, 3/4 meter, 6/8 meter) has an intro/scaffolding node whose first screen is an instructional explainer (visuals + text) that the child must acknowledge before the exercise portion begins.
   - Acceptance: Every new rhythmic concept has a node marked as intro/scaffolding (via existing `DISCOVERY` extended with explainer content, or via a new node type — decided in planning). Owner walkthrough confirms the explainer UI displays correctly for every concept node.

5. **Locale keys, paywall config, validator, and tests updated in lockstep**: Any structural change to nodes propagates to all dependent artifacts.
   - Current: `src/locales/{en,he}/trail.json`, `src/config/subscriptionConfig.js` (`FREE_NODE_IDS`), Postgres `is_free_node()`, `scripts/validateTrail.mjs`, and `src/data/units/rhythmUnit*.test.js` all reference the existing node IDs and structure.
   - Target: All five artifacts updated to reflect the new structure. `FREE_NODE_IDS` (JS) and Postgres `is_free_node()` remain in sync. Validator gains lint rules covering principles 1–3.
   - Acceptance: `npm run verify:trail` passes; `npm run test:run` passes for rhythm-related tests; `FREE_NODE_IDS` JS Set equals the Postgres `is_free_node()` whitelist (verified via test or manual diff).

6. **Clean-slate rhythm progress wipe**: Existing per-node star ratings on rhythm nodes are dropped on deploy; no migration mapping; total accumulated XP is preserved.
   - Current: `student_skill_progress` rows exist for rhythm nodes with stars and `exercise_progress` JSONB. `students_score.total_xp` accumulates XP earned across all categories.
   - Target: A Supabase migration deletes rows from `student_skill_progress` where the node belongs to the rhythm category (or matching renamed/restructured IDs). `students_score.total_xp` is untouched.
   - Acceptance: After migration runs on a test database with seeded rhythm progress, `SELECT count(*) FROM student_skill_progress WHERE node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%'` returns 0; `SELECT total_xp FROM students_score` is unchanged from pre-migration values.

7. **Rhythm game engine changes permitted, but bounded to pedagogical necessity**: The rhythm game engine (MetronomeTrainer, MixedLessonGame, ArcadeRhythmGame, PulseQuestion, DictationQuestion, and adjacent renderers) may be modified to support the new structure (e.g., new intro UI component, new question type), but only when a spec principle requires it.
   - Current: Engine code supports today's exercise types and question structures.
   - Target: Engine code adapts to support intro/scaffolding explainer UI and any new question types needed by principles 1–4. Changes outside that scope (refactors, optimizations, unrelated features) are deferred.
   - Acceptance: Each engine code change is traceable to a specific spec principle in `CONTEXT.md`/`PLAN.md`. Existing rhythm game tests pass; new tests cover any new question components.

## Boundaries

**In scope:**

- Reorder/regroup the 29 active rhythm nodes across the 7 active rhythm units
- Add new intro/scaffolding nodes for each new rhythmic concept
- Introduce new node types (e.g., `SCAFFOLDING`) if existing types (`DISCOVERY`/`PRACTICE`/`SPEED_ROUND`/`MINI_BOSS`/`BOSS`) don't fit the explainer-UI requirement
- Update all rhythm unit data files (`src/data/units/rhythmUnit*Redesigned.js`)
- Update `src/data/expandedNodes.js` and `src/data/skillTrail.js` (`UNITS` map, exports)
- Update i18n locale keys: `src/locales/en/trail.json` and `src/locales/he/trail.json` (rhythm namespace, unit names/descriptions, node names/descriptions, explainer copy)
- Update `src/config/subscriptionConfig.js` (`FREE_NODE_IDS`) and Postgres `is_free_node()` (via Supabase migration)
- Update `scripts/validateTrail.mjs` — add lint rules enforcing principles 1–3
- Update rhythm unit tests (`src/data/units/rhythmUnit*Redesigned.test.js`) and any rhythm-dependent test files
- Modify rhythm game engine code (MetronomeTrainer, MixedLessonGame, ArcadeRhythmGame, PulseQuestion, DictationQuestion, etc.) _only_ when a principle requires it (e.g., explainer UI component)
- Supabase migration that wipes rhythm rows from `student_skill_progress`

**Out of scope:**

- Treble, Bass, and Ear-training trails — not touched. _Reason: phase is rhythm-only; other category restructures (if any) are separate future phases._
- Rhythm Unit 8 (syncopation, "Off-Beat Magic") re-enable — stays HIDDEN. _Reason: re-enable is a separate product decision; this phase ships with `boss_rhythm_7` (or its replacement) as the terminus._
- Trail map UI / visual layout (`TrailMap.jsx`, `TrailNode.jsx`, `TrailNodeModal.jsx`) — rendering stays as-is. _Reason: data restructure is independent of map rendering; UI is governed by node category + `isBoss` flag, which we preserve._
- Migration _mapping_ logic for rhythm progress — clean wipe only, no ID translation, no compatibility shims. _Reason: beta-stage user base; the cost of migration code outweighs the value of preserved stars on restructured content._
- Student leaderboards / `students_score.total_xp` — preserved untouched. _Reason: total XP reflects effort already invested; wiping it would penalize users for an authoring-side restructure._
- Daily-goals, streaks, XP-system code beyond rhythm-node-ID references. _Reason: these systems are category-agnostic; rhythm restructure only affects what content they reference._
- Re-pedagogizing other category trails or the boss-node taxonomy. _Reason: scope creep — separate phases._

## Constraints

- **Validator must pass on the new structure**: `npm run verify:trail` (i.e., `scripts/validateTrail.mjs`) must run clean — no broken prereqs, no cycles, no duplicate IDs, valid XP rewards, all node types recognized. The validator is a `prebuild` hook; failure blocks production builds.
- **All rhythm-related tests must pass**: `npm run test:run` succeeds on rhythm unit tests, MixedLessonGame tests, MetronomeTrainer tests, ArcadeRhythmGame tests, PulseQuestion/DictationQuestion tests, and any locale-key tests.
- **FREE_NODE_IDS sync constraint (defense in depth)**: The JS `FREE_NODE_IDS` Set in `src/config/subscriptionConfig.js` must equal the rhythm node IDs returned by Postgres `is_free_node()`. Drift between the two breaks the content paywall.
- **Progress wipe must be a Supabase migration**: Performed server-side via SQL migration with RLS-safe targeting; not a client-side delete. Migration is reversible only by manual re-seed (no rollback expected).
- **Hebrew RTL parity**: Any new explainer-UI text must have a Hebrew translation in `src/locales/he/trail.json`. RTL layout must render correctly.
- **No COPPA/child-safety regressions**: New explainer content uses age-appropriate language; no new data collection; no external resources loaded without parent gate.

## Acceptance Criteria

- [ ] Each rhythm unit has at most one primary learning concept (duration / rest / dotted / meter) — enforced by a `scripts/validateTrail.mjs` lint rule
- [ ] Quarter note is the first rhythm-content node (after any intro/scaffolding) by `order` — verifiable via `SKILL_NODES` sort
- [ ] Each rest type's introduction node sits within or immediately after its matching duration unit — verifiable via static check
- [ ] Each new rhythmic concept has a dedicated intro/scaffolding node with kid-friendly explainer UI rendered before exercises begin — verifiable via node metadata + owner walkthrough
- [ ] `npm run verify:trail` passes (validator clean)
- [ ] `npm run test:run` passes for all rhythm-related test files (rhythm units, MixedLessonGame, MetronomeTrainer, ArcadeRhythmGame, PulseQuestion, DictationQuestion)
- [ ] `FREE_NODE_IDS` (JS Set) matches Postgres `is_free_node()` whitelist — diff is empty
- [ ] Supabase migration wipes rhythm rows from `student_skill_progress`; `students_score.total_xp` rows are unchanged — verified on test DB
- [ ] `src/locales/he/trail.json` contains a Hebrew translation for every new English explainer string
- [ ] Owner walkthrough on a real student account: complete every rhythm node from the new first node through the new terminus (`boss_rhythm_7` or its replacement) without confusion / softlocks / paywall breaks

## Ambiguity Report

| Dimension           | Score | Min   | Status | Notes                                                                     |
| ------------------- | ----- | ----- | ------ | ------------------------------------------------------------------------- |
| Goal Clarity        | 0.90  | 0.75  | ✓      | Three named principles + intro/scaffolding deliverable                    |
| Boundary Clarity    | 0.90  | 0.70  | ✓      | Explicit in/out-of-scope lists with reasoning per exclusion               |
| Constraint Clarity  | 0.80  | 0.65  | ✓      | Validator, tests, FREE_NODE_IDS sync, migration, Hebrew parity locked     |
| Acceptance Criteria | 0.85  | 0.70  | ✓      | 10 pass/fail criteria covering data, tests, paywall, locales, walkthrough |
| **Ambiguity**       | 0.13  | ≤0.20 | ✓      |                                                                           |

Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective     | Question summary                                 | Decision locked                                                            |
| ----- | --------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| 1     | Researcher      | What triggered this refactor?                    | Pedagogical inconsistency + grouping incoherence + personal review         |
| 1     | Researcher      | Pedagogical framework?                           | Owner's own pedagogical instinct — codified as principles in this spec     |
| 1     | Researcher      | How deep is the refactor?                        | Full restructure incl. new/removed nodes                                   |
| 2     | Simplifier      | Which pedagogical principles to enforce?         | Concept-per-unit + Rests-woven + Pulse-first/Quarter-anchored              |
| 2     | Simplifier      | Irreducible core?                                | Same content reordered/regrouped + new intro/scaffolding nodes             |
| 2     | Simplifier      | Migration strategy for existing rhythm progress? | Clean wipe (no migration code)                                             |
| 2     | Simplifier      | How to verify "correct"?                         | Data-checkable principles + owner walkthrough + validator script passes    |
| 3     | Boundary Keeper | Out-of-scope surfaces?                           | Treble/Bass/Ear, Unit 8 stays hidden, Trail map UI                         |
| 3     | Boundary Keeper | Must-update artifacts?                           | i18n (en+he), FREE_NODE_IDS, validator, unit tests                         |
| 3     | Boundary Keeper | What does an intro/scaffolding node look like?   | Kids-friendly instructional explainer UI before exercises (Duolingo-style) |
| 4     | Failure Analyst | Rhythm game engine scope?                        | IN SCOPE — engine may be modified when principles require                  |
| 4     | Failure Analyst | Failure modes to rule out?                       | Kid confusion, validator break, rhythm test failures                       |
| 4     | Failure Analyst | Sentinel anti-patterns?                          | None forbidden — flexibility preserved                                     |

---

_Phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units_
_Spec created: 2026-05-26_
_Next step: `/gsd-discuss-phase 1` — implementation decisions (exact new unit order, intro-node implementation, migration SQL, etc.)_
