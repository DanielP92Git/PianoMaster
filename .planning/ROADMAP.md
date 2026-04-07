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
- 🚧 **v3.2 Rhythm Trail Rework** — Phases 20-23 (in progress)

See `.planning/milestones/` for archived details of each milestone.

## Phases

<details>
<summary>v1.0 through v2.8 -- See milestones/ for archived details</summary>

See individual milestone archives in `.planning/milestones/` for full phase breakdowns.

</details>

<details>
<summary>v2.9 Game Variety & Ear Training (Phases 7-11) -- SHIPPED 2026-03-30</summary>

- [x] Phase 7: Data Foundation + TrailMap Refactor (2/2 plans) -- completed 2026-03-27
- [x] Phase 8: Audio Infrastructure + Rhythm Games (4/4 plans) -- completed 2026-03-29
- [x] Phase 9: Ear Training Games (4/4 plans) -- completed 2026-03-29
- [x] Phase 10: Ear Training Trail Data + Trail Tab (2/2 plans) -- completed 2026-03-29
- [x] Phase 11: Arcade Rhythm Game + Rhythm Node Remapping (3/3 plans) -- completed 2026-03-30

</details>

<details>
<summary>v3.0 Cleanup & Polish (Phases 12-16) -- SHIPPED 2026-04-03</summary>

- [x] Phase 12: Trail Config Fixes (2/2 plans) -- completed 2026-03-30
- [x] Phase 13: Code Quality Quick Wins (2/2 plans) -- completed 2026-03-31
- [x] Phase 14: Console Logging Cleanup (1/1 plan) -- completed 2026-03-31
- [x] Phase 15: Verification & Deploy (5/5 plans) -- completed 2026-03-31
- [x] Phase 16: Milestone Cleanup (1/1 plan) -- completed 2026-04-02

</details>

<details>
<summary>v3.1 Trail-First Navigation (Phases 17-19) -- SHIPPED 2026-04-05</summary>

- [x] Phase 17: Navigation Restructuring (2/2 plans) -- completed 2026-04-04
- [x] Phase 18: Dashboard Compaction (1/1 plan) -- completed 2026-04-05
- [x] Phase 19: Post-Game Trail Return (2/2 plans) -- completed 2026-04-05

</details>

### 🚧 v3.2 Rhythm Trail Rework (In Progress)

**Milestone Goal:** Rework the rhythm trail's pedagogy so every node introduces one concept at a time, uses the correct game for each learning stage, and draws from a curated hand-crafted pattern library — replacing the current random-generative approach with pedagogically sequenced content following Kodaly/Orff principles.

#### Phases

- [ ] **Phase 20: Curriculum Audit** - Audit all 50 rhythm nodes and lock game-type policy before touching any files
- [ ] **Phase 21: Pattern Library Construction** - Author ~120+ hand-crafted tagged patterns as a new synchronous JS module
- [ ] **Phase 22: Service Layer & Trail Wiring** - Wire generator, unit files, game components, and validator as a coordinated change
- [ ] **Phase 23: UX Polish** - Widen timing thresholds, rename games, replace MISS text, add measure length progression, and render Kodaly syllables

## Phase Details

### Phase 20: Curriculum Audit

**Goal**: All pedagogical decisions about the rhythm trail are documented and locked before any file is modified
**Depends on**: Nothing (first phase of this milestone)
**Requirements**: CURR-01, CURR-02, CURR-03, CURR-04
**Success Criteria** (what must be TRUE):

1. Every one of the 50 rhythm nodes has been reviewed and its single introduced concept identified — violations are documented
2. A written decision exists for which game type belongs at each node type: Discovery uses notation-showing game, Practice uses echo game, Speed/Boss uses ArcadeRhythmGame
3. A node-by-node remediation list exists covering every node that currently violates the one-concept or wrong-game rule
4. The audit output is committed as a reference document that Phase 22 implementation follows exactly
   **Plans**: TBD

### Phase 21: Pattern Library Construction

**Goal**: A curated library of ~120+ hand-crafted rhythm patterns exists as a synchronous Vite-bundled JS module, tagged by duration set
**Depends on**: Phase 20
**Requirements**: PAT-01, PAT-02
**Success Criteria** (what must be TRUE):

1. `src/data/patterns/rhythmPatterns.js` exists with at minimum 120 patterns, each a complete VexFlow-compatible pattern definition
2. Every pattern carries a `tags` array with at least one duration-set tag (e.g. `quarter-only`, `quarter-half`, `quarter-eighth`)
3. The file is a plain synchronous ES module import — no async fetch, no JSON file, no dynamic loading
4. Patterns cover all duration sets used across the 50 rhythm nodes (quarter-only through syncopation/compound)
   **Plans**: TBD

### Phase 22: Service Layer & Trail Wiring

**Goal**: Rhythm nodes use curated patterns instead of duration allowlists, the generator resolves by tags/IDs, Unit 1 Node 1 has a pulse exercise, and the build validator enforces pattern correctness
**Depends on**: Phase 21
**Requirements**: CURR-05, PAT-03, PAT-04, PAT-05, PAT-06
**Success Criteria** (what must be TRUE):

1. `RhythmPatternGenerator.js` exposes `resolveByTags()` and `resolveByIds()` and all 50 rhythm node configs use `patternTags` or `patternIds` instead of `rhythmPatterns` duration allowlists
2. Unit 1 Node 1 delivers a pulse exercise where the child taps with the metronome beat and sees no music notation
3. A child playing a Discovery node only ever encounters patterns that contain durations from duration sets they have already encountered — no patterns with unintroduced note values appear
4. Running `npm run build` fails with a clear error if any node config references a pattern tag or ID that does not exist in `rhythmPatterns.js`
5. Running `npm run build` passes cleanly when all pattern references are valid
   **Plans**: TBD

### Phase 23: UX Polish

**Goal**: The rhythm trail feels child-friendly and appropriately calibrated — timing is forgiving, language is warm, and notation shows Kodaly syllables for all introduced durations
**Depends on**: Phase 22
**Requirements**: UX-01, UX-02, UX-03, UX-04, UX-05
**Success Criteria** (what must be TRUE):

1. A child tapping a quarter-note pattern on a Discovery or Practice node can achieve PERFECT feedback with up to 100ms timing error (not the previous 50ms)
2. The MetronomeTrainer game shows a child-friendly name in both English and Hebrew UI — the string "MetronomeTrainer" does not appear in any visible label
3. Tapping incorrectly in any rhythm game shows "Almost!" (EN) or its Hebrew equivalent — the word "MISS" does not appear anywhere in the rhythm game UI
4. A Discovery node shows a 1-bar pattern, a Practice node shows a 2-bar pattern, and a Speed or Boss node shows a 4-bar pattern
5. Kodaly syllables (ta / ti-ti / ta-a / ta-a-a-a in EN; טָה / טָה-טָה / טָה-אָה / טָה-אָה-אָה-אָה in HE) appear below VexFlow note heads for all rendered rhythm patterns
   **Plans**: TBD

## Progress

| Phase                            | Milestone | Plans Complete | Status      | Completed |
| -------------------------------- | --------- | -------------- | ----------- | --------- |
| 20. Curriculum Audit             | v3.2      | 0/TBD          | Not started | -         |
| 21. Pattern Library Construction | v3.2      | 0/TBD          | Not started | -         |
| 22. Service Layer & Trail Wiring | v3.2      | 0/TBD          | Not started | -         |
| 23. UX Polish                    | v3.2      | 0/TBD          | Not started | -         |

**Total: 22 milestones shipped, 95 phases, ~203 plans | v3.2: 4 phases, 0/4 complete**

---

_Last updated: 2026-04-06 -- v3.2 Rhythm Trail Rework roadmap created_
