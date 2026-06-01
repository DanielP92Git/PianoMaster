# Roadmap: PianoApp

## Milestones

- ✅ **v1.0 Security Hardening** — Phases 1-4 (shipped 2026-02-01)
- ✅ **v1.1 Parental Consent Email Service** — Phase 5 (shipped 2026-02-02)
- ✅ **v1.2 Trail System Stabilization** — Phases 6-7 (shipped 2026-02-03)
- ✅ **v1.3 Trail System Redesign** — Phases 8-12 (shipped 2026-02-05)
- ✅ **v1.4 UI Polish & Celebrations** — Phases 13-18 (shipped 2026-02-09)
- ✅ **v1.5 Trail Page Visual Redesign** — Phases 19-22 (shipped 2026-02-12)
- ✅ **v1.6 Auto-Rotate Landscape for Games** — Phases 01-05 (shipped 2026-02-17)
- ✅ **v1.7 Mic Pitch Detection Overhaul** — Phases 06-10 (shipped 2026-03-04)
- ✅ **v1.8 App Monetization** — Phases 11-16 (shipped 2026-03-01)
- ✅ **v1.9 Engagement & Retention** — Phases 17-23 (shipped 2026-03-08)
- ✅ **v2.0 VictoryScreen & XP Unification** — Phases 01-02 (shipped 2026-03-08)
- ✅ **v2.1 Forgot Password Recovery** — Phase 01 (shipped 2026-03-10)
- ✅ **v2.2 Sharps & Flats** — Phases 01-05 (shipped 2026-03-17)
- ✅ **v2.3 Launch Readiness** — Phases 01-06 (shipped 2026-03-17)
- ✅ **v2.4 Content Expansion** — Phases 07-11 (shipped 2026-03-19)
- ✅ **v2.5 Launch Prep** — Phases 12-15 (shipped 2026-03-22)
- ✅ **v2.6 User Feedback** — Phases 16-17 (shipped 2026-03-23)
- ✅ **v2.7 Instrument Practice Tracking** — Phases 1-5 (shipped 2026-03-25)
- ✅ **v2.8 Introductory Single-Note Game** — Phases 1, 6 (shipped 2026-03-26)
- ✅ **v2.9 Game Variety & Ear Training** — Phases 7-11 (shipped 2026-03-30)
- ✅ **v3.0 Cleanup & Polish** — Phases 12-16 (shipped 2026-04-03)
- ✅ **v3.1 Trail-First Navigation** — Phases 17-19 (shipped 2026-04-05)
- ✅ **v3.2 Rhythm Trail Rework** — Phases 20-28 (shipped 2026-04-13)
- ✅ **v3.3 Rhythm Trail Fix & Polish** — Phases 29-33 (shipped 2026-05-04)
- ✅ **v3.4 Rhythm Games Responsive UX** — Phases 34-35 (shipped 2026-05-12)
- 🚧 **v3.5 Rhythm Pedagogy** — Phase 1 (in progress)

See `.planning/milestones/` for archived details of each milestone.

## Phases

<details>
<summary>v1.0 through v3.3 -- See milestones/ for archived details</summary>

See individual milestone archives in `.planning/milestones/` for full phase breakdowns.

</details>

<details>
<summary>✅ v3.4 Rhythm Games Responsive UX (Phases 34-35) -- SHIPPED 2026-05-12</summary>

- [x] Phase 34: Responsive Rhythm Renderers (Non-Arcade) (10/10 plans) -- completed 2026-05-10
- [x] Phase 35: ArcadeRhythmGame Portrait (4/4 plans) -- completed 2026-05-11

</details>

## 🚧 v3.5 Rhythm Pedagogy (in progress)

Phase summary:

- [ ] Phase 1: Rhythm Trail Pedagogical Restructure (4/10 plans) -- executing (4 waves)

### Phase 1: Rhythm Trail Pedagogical Restructure

**Goal**: Restructure the 29 active rhythm trail nodes into a 10-unit / 55-node pedagogical order anchored by three falsifiable principles — **Pulse-first**, **Rests-woven**, **Concept-per-unit** — and introduce 12 kid-friendly intro/scaffolding screens (Duolingo-style) for each rhythmic concept. Existing student rhythm progress is wiped on deploy; total XP is preserved. Rhythm-only; Treble / Bass / Ear-training trails untouched. Hidden Unit 8 syncopation renamed `rhythm_synco_*` to free the `rhythm_8_*` namespace for the new 3/4 Meter unit.
**Depends on**: Nothing (first phase of v3.5; data restructure + scaffolding UI in `DiscoveryIntroQuestion.jsx`; standalone of Treble / Bass / Ear)
**Spec**: `.planning/phases/01-refactor-rhythm-trail-pedagogical-ordering-restructure-units/01-SPEC.md`
**Context**: `.planning/phases/01-refactor-rhythm-trail-pedagogical-ordering-restructure-units/01-CONTEXT.md`
**Plans**: 10 plans across 4 waves (planned 2026-06-01)

Plans:

- [x] 01-01-PLAN.md — Wave 0: Validator lint rules + parity tests scaffolding
- [x] 01-02-PLAN.md — Wave 1: Hidden Unit 8 rename (rhythm*8*_ → rhythm*synco*_)
- [x] 01-03-PLAN.md — Wave 1: Locale infrastructure (EN+HE scaffolding cards + unit names)
- [x] 01-04-PLAN.md — Wave 1: Supabase migration + FREE_NODE_IDS update
- [x] 01-05-PLAN.md — Wave 2: Unit data U1-U3 (Quarter, Half, Whole + matching rests)
- [x] 01-06-PLAN.md — Wave 2: Unit data U4-U5 (Eighths, Sixteenths)
- [x] 01-07-PLAN.md — Wave 2: Unit data U6-U8 (Dotted Half, Dotted Quarter, 3/4 Meter)
- [x] 01-08-PLAN.md — Wave 2: Unit data U9-U10 + expandedNodes.js + skillTrail.js UNITS map wire-up
- [ ] 01-09-PLAN.md — Wave 3: DiscoveryIntroQuestion.jsx multi-card pagination extension
- [ ] 01-10-PLAN.md — Wave 3: PWA cache bump + OLD file cleanup + [BLOCKING] supabase db push + UAT walkthrough

**Requirements** (locked in 01-SPEC.md):

- **REQ-01**: Pulse-first ordering — quarter is the first rhythmic-content node; halves/wholes as extensions; eighths/sixteenths as subdivisions
- **REQ-02**: Rests-woven — each rest type introduced in or adjacent to its matching duration unit
- **REQ-03**: Concept-per-unit — no unit mixes two distinct learning concepts (duration / rest / dotted / meter)
- **REQ-04**: Intro/scaffolding nodes — every new rhythmic concept has a dedicated kid-friendly explainer surface before exercises
- **REQ-05**: Locale keys, paywall config (`FREE_NODE_IDS` ↔ Postgres `is_free_node()`), validator, and tests updated in lockstep
- **REQ-06**: Clean-slate rhythm progress wipe via Supabase migration; `students_score.total_xp` preserved
- **REQ-07**: Rhythm game engine changes permitted, but bounded to pedagogical necessity (traceable to a spec principle)

**Success Criteria** (from 01-SPEC.md Acceptance Criteria):

1. Each rhythm unit has at most one primary learning concept — enforced by `scripts/validateTrail.mjs` lint rule
2. Quarter note is the first rhythm-content node (after intro/scaffolding) by `order`
3. Each rest type's introduction sits within or immediately after its matching duration unit
4. Each new rhythmic concept has a dedicated intro/scaffolding node with kid-friendly explainer UI
5. `npm run verify:trail` passes; `npm run test:run` passes for all rhythm-related tests
6. `FREE_NODE_IDS` JS Set matches Postgres `is_free_node()` whitelist — diff is empty
7. Supabase migration wipes rhythm rows from `student_skill_progress`; `students_score.total_xp` unchanged
8. `src/locales/he/trail.json` contains a Hebrew translation for every new English explainer string
9. Owner walkthrough on a real student account: complete every rhythm node from new first node through new terminus without confusion / softlocks / paywall breaks

## Progress

**Total: 25 milestones shipped, 109 phases, ~252 plans | Active: v3.5 Rhythm Pedagogy — Phase 1 executing (4/10 plans complete)**

---

_Last updated: 2026-06-01 -- Phase 1 Plan 01-04 complete (atomic migration authored + FREE_NODE_IDS synced; freeNodes.parity GREEN)_
