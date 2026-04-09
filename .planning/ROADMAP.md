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
- 🚧 **v3.2 Rhythm Trail Rework** — Phases 20-24 (in progress)

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

### v3.2 Rhythm Trail Rework (In Progress)

**Milestone Goal:** Rework the rhythm trail's pedagogy so every node introduces one concept at a time, uses the correct game for each learning stage, and draws from a curated hand-crafted pattern library — replacing the current random-generative approach with pedagogically sequenced content following Kodaly/Orff principles.

#### Phases

- [x] **Phase 20: Curriculum Audit** — completed 2026-04-06
- [x] **Phase 21: Pattern Library Construction** (2/2 plans) — completed 2026-04-06
- [x] **Phase 22: Service Layer & Trail Wiring** (6/6 plans) — completed 2026-04-08
- [x] **Phase 23: UX Polish** (3/3 plans) — completed 2026-04-09
- [ ] **Phase 24: Multi-Angle Rhythm Games** (3 plans) — Visual recognition + syllable matching games for low-variety rhythm nodes

### Phase 24: Multi-Angle Rhythm Games

**Goal**: Nodes with few rhythm values (quarter-only, whole-note) stay engaging through varied mini-games that teach the same concept from different angles — visual recognition, syllable matching — instead of relying solely on rhythm reading
**Depends on**: Phase 23
**Requirements**: SC-1 through SC-4
**Success Criteria** (what must be TRUE):

1. A "Visual Recognition" game exists where the child sees 4 cards with different VexFlow-rendered rhythm notation values and picks the correct one (e.g., "Which one is a quarter note?")
2. A "Syllable Matching" game exists where the child sees a rhythm notation value and picks the correct Kodaly syllable from 4 answer cards (e.g., "ta" for quarter note)
3. Low-variety rhythm trail nodes (e.g., quarter-only, whole-note discovery nodes) use these new game types in their exercise sequence alongside existing rhythm games
4. Both games integrate with the trail system (progress tracking, star rating, XP awards)

**Plans:** 3 plans

Plans:

- [ ] 24-01-PLAN.md — Foundation: SVG sprites, DURATION_INFO lookup, DurationCard component, EXERCISE_TYPES, i18n
- [ ] 24-02-PLAN.md — Game components: VisualRecognitionGame, SyllableMatchingGame, route registration
- [ ] 24-03-PLAN.md — Trail wiring: TrailNodeModal, node unit files, build validator extension

## Progress

| Phase                            | Milestone | Plans Complete | Status      | Completed  |
| -------------------------------- | --------- | -------------- | ----------- | ---------- |
| 20. Curriculum Audit             | v3.2      | 0/TBD          | Complete    | 2026-04-06 |
| 21. Pattern Library Construction | v3.2      | 2/2            | Complete    | 2026-04-06 |
| 22. Service Layer & Trail Wiring | v3.2      | 6/6            | Complete    | 2026-04-08 |
| 23. UX Polish                    | v3.2      | 3/3            | Complete    | 2026-04-09 |
| 24. Multi-Angle Rhythm Games     | v3.2      | 0/3            | Not started | -          |

**Total: 22 milestones shipped, 100 phases, ~218 plans | v3.2: 5 phases, 4/5 complete**

---

_Last updated: 2026-04-09 -- Phase 24 plans created_
