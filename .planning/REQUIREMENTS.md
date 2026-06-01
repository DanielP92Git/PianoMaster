# Requirements: PianoApp v3.5 — Rhythm Pedagogy

**Status:** 🚧 IN PROGRESS — Phase 1 ready for planning
**Defined:** 2026-06-01
**Core Value:** Children's data must be protected and inaccessible to unauthorized users.

**Milestone goal:** Restructure the active rhythm trail into a pedagogically coherent order anchored by three falsifiable principles (Pulse-first, Rests-woven, Concept-per-unit) and add kid-friendly intro/scaffolding screens (Duolingo-style multi-card lesson intros) for every new rhythmic concept. Existing student rhythm progress is wiped on deploy; total XP preserved. Treble / Bass / Ear-training trails are untouched. Hidden Unit 8 syncopation stays hidden and is renamed to free the `rhythm_8_*` namespace.

## v3.5 Requirements

> Locked in `.planning/phases/01-refactor-rhythm-trail-pedagogical-ordering-restructure-units/01-SPEC.md` — see SPEC.md for full Current / Target / Acceptance breakdown of each requirement.

### Pedagogical Principles (data restructure)

- [x] **REQ-01**: Pulse-first ordering principle — quarter note is the first rhythmic-content node a learner encounters (after any intro/scaffolding); halves and wholes are introduced as extensions of the pulse; eighths and sixteenths as subdivisions
- [x] **REQ-02**: Rests-woven principle — each rest type (quarter, half, whole rest) is introduced in or immediately adjacent to its matching duration unit; no aggregate "Rests" unit
- [x] **REQ-03**: Concept-per-unit principle — no unit mixes two distinct learning concepts (a "concept" = duration intro / rest intro / dotted-note intro / meter intro); meters live in dedicated meter units; aggregate bosses sit in their own review unit

### Scaffolding & Engine

- [ ] **REQ-04**: Intro/scaffolding nodes — every new rhythmic concept has a dedicated intro/scaffolding node with kid-friendly explainer UI (visuals + text) that the child must acknowledge before any exercise begins; analogous to Duolingo lesson-intro slides
- [ ] **REQ-07**: Rhythm game engine changes permitted, but bounded to pedagogical necessity — engine modifications (MetronomeTrainer, MixedLessonGame, ArcadeRhythmGame, PulseQuestion, DictationQuestion, DiscoveryIntroQuestion, adjacent renderers) allowed _only_ when a spec principle requires them; each change traceable to a principle in CONTEXT.md/PLAN.md

### Lockstep Updates Across Dependent Artifacts

- [x] **REQ-05**: Locale keys (`src/locales/{en,he}/trail.json`), paywall config (`FREE_NODE_IDS` JS Set ↔ Postgres `is_free_node()`), validator (`scripts/validateTrail.mjs` — new lint rules for principles 1–3), and rhythm-related tests all updated in lockstep with the data restructure

### Data Migration

- [ ] **REQ-06**: Clean-slate rhythm progress wipe — Supabase migration deletes `student_skill_progress` rows where `node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%'`; `students_score.total_xp` is _never_ touched; no per-node mapping logic

## Phase Mapping

| REQ-ID | Phase 1 |
| ------ | :-----: |
| REQ-01 |    ✓    |
| REQ-02 |    ✓    |
| REQ-03 |    ✓    |
| REQ-04 |    ✓    |
| REQ-05 |    ✓    |
| REQ-06 |    ✓    |
| REQ-07 |    ✓    |

All 7 requirements are covered by Phase 1 (Rhythm Trail Pedagogical Restructure). v3.5 is a single-phase milestone.

## Out of Scope (deferred to future milestones)

- **Treble / Bass / Ear-training pedagogical restructure** — separate future milestones
- **Rhythm Unit 8 (syncopation, "Off-Beat Magic") re-enable** — stays HIDDEN; separate product decision
- **Trail map UI / visual layout** (`TrailMap.jsx`, `TrailNode.jsx`, `TrailNodeModal.jsx`) — data-driven rendering preserved as-is
- **Migration mapping logic for rhythm progress** — clean wipe only; no ID translation, no compatibility shims (beta-stage userbase)
- **Student leaderboards / total XP** — preserved untouched
- **Daily-goals / streaks / XP-system code** beyond rhythm-node-ID references
- **Eighth-rest / sixteenth-rest / dotted-rest introduction nodes** — content expansion, not restructure; deferred per 01-CONTEXT.md
- **Interactive "tap-to-feel-the-beat" scaffolding card** — rejected in favor of multi-card swipable per D-07

---

_Phase 1 ready for `/gsd-plan-phase 1`_
