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
- 🚧 **v3.5 Rhythm Pedagogy** — Phase 1 (code-complete, owner UAT pending)
- 📋 **v3.6 Game Screen UI Unification** — Phase 36 (planning)

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
- [x] 01-09-PLAN.md — Wave 3: DiscoveryIntroQuestion.jsx multi-card pagination extension
- [x] 01-10-PLAN.md — Wave 3: PWA cache bump + OLD file cleanup + [BLOCKING] supabase db push + UAT walkthrough

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

## 📋 v3.6 Game Screen UI Unification (planning)

Phase summary:

- [ ] Phase 36: Game Screen UI Unification (11 plans) -- planned

> Numbering note: this phase uses **36** (continuing the global 34/35 sequence from v3.4) rather
> than restarting at 01, to avoid a `.planning/phases/01-*` directory-glob collision with v3.5's
> Phase 01. Milestone-roll (archive v3.5 / update STATE.md) deferred to `/gsd-complete-milestone`
> once v3.5 owner UAT passes.

### Phase 36: Game Screen UI Unification

**Goal**: Bring the other game screens up to the polished UI standard set by **NotesRecognitionGame**
by extracting its inline HUD/shell (progress bar, score pill, lives/hearts, combo + on-fire,
timer, speed-bonus, tier-up, nav, feedback) into reusable shared components under
`src/components/games/shared/`, and adopting them across the other games where they fit —
component-based reuse, not forced uniformity. Games with fundamentally different mechanics
(staff-based sight-reading, tile/card grids, fixed-length ear-training) adopt only the suitable
subset. ArcadeRhythmGame's existing inline lives/combo/on-fire are de-duplicated onto the shared
components. No game-mechanics changes; HUD presentation only.
**Depends on**: Nothing hard. v3.5 owner UAT is independent; this phase touches game-screen UI, not rhythm trail data.
**Spec**: `.planning/phases/36-game-screen-ui-unification/36-SPEC.md`
**Plans**: 11 plans across 7 execution waves

Plans:

**Wave 1**

- [x] 36-01-PLAN.md — Wave 0: base-shell HUD contract tests (ProgressBar/ScorePill, RED)

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 36-02-PLAN.md — Wave 1: extract base-shell components + refactor NotesRecognition (reference)

**Wave 3** _(blocked on Wave 2 completion)_

- [ ] 36-03-PLAN.md — Wave 1 gate: owner verifies NotesRecognition zero-regression

**Wave 4** _(blocked on Wave 3 completion)_

- [ ] 36-04-PLAN.md — Wave 2 rollout A: SightReading + Memory adopt base shell
- [ ] 36-05-PLAN.md — Wave 2 rollout B: RhythmReading + RhythmDictation adopt base shell
- [ ] 36-06-PLAN.md — Wave 2 rollout C: MixedLesson (unify progress bar) + Metronome adopt base shell

**Wave 5** _(blocked on Wave 4 completion)_

- [ ] 36-07-PLAN.md — Wave 3: engagement tests + extract LivesDisplay/ComboPill/OnFireBadge/OnFireSplash

**Wave 6** _(blocked on Wave 5 completion)_

- [ ] 36-08-PLAN.md — Wave 3: extract SpeedBonusFlash/TierUpPopup + refactor NotesRecognition engagement
- [ ] 36-09-PLAN.md — Wave 3: de-duplicate ArcadeRhythmGame onto shared lives/combo/on-fire
- [ ] 36-10-PLAN.md — Wave 3: ear-training (NoteComparison + Interval) gain combo/on-fire (no lives)

**Wave 7** _(blocked on Wave 6 completion)_

- [ ] 36-11-PLAN.md — Phase gate: full suite + owner walkthrough of all 10 game screens

**Requirements** (seeded in 36-SPEC.md — confirm in discuss):

- **REQ-01**: Extract NotesRecognition's inline HUD into shared components; refactor it to consume them with zero regression
- **REQ-02**: Per-game adoption matrix — each game adopts only the HUD subset that fits its mechanics
- **REQ-03**: De-duplicate ArcadeRhythmGame's inline lives/combo/on-fire onto shared components
- **REQ-04**: Design-system visual consistency; unify MixedLessonGame's divergent progress bar
- **REQ-05**: Consistent VictoryScreen/GameOverScreen wiring for games that adopt a lives/score model
- **REQ-06**: No regressions — tests pass, landscape-lock intact, reduced-motion + RTL parity
- **REQ-07**: i18n parity (en+he) for any new HUD strings

## Progress

**Total: 25 milestones shipped, 109 phases, ~252 plans | Active: v3.5 Rhythm Pedagogy (Phase 1 code-complete, owner UAT pending) · v3.6 Game Screen UI Unification (Phase 36 spec seeded)**

---

_Last updated: 2026-06-10 -- Phase 36 (Game Screen UI Unification) planned: 11 plans across 7 waves (base-shell extraction + reference refactor, base-shell rollout to 6 games, engagement-layer extraction + ArcadeRhythm de-dup + ear-training engagement)._
