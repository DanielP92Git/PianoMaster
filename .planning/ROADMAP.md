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
- **v2.9 Game Variety & Ear Training** — Phases 7-11 (in progress)

See `.planning/milestones/` for archived details of each milestone.

## Phases

<details>
<summary>✅ v1.0 through v2.7 — See milestones/ for archived details</summary>

See individual milestone archives in `.planning/milestones/` for full phase breakdowns.

</details>

<details>
<summary>✅ v2.8 Introductory Single-Note Game (Phases 1, 6) — SHIPPED 2026-03-26</summary>

- [x] Phase 1: Introductory Single-Note Game (2/2 plans) — completed 2026-03-25
- [x] Phase 6: Dedicated Parent Portal with Math Gate (3/3 plans) — completed 2026-03-25

</details>

### v2.9 Game Variety & Ear Training

- [x] **Phase 7: Data Foundation + TrailMap Refactor** — New EXERCISE_TYPES constants, EAR_TRAINING category, TrailNodeModal routing, data-driven TrailMap, validateTrail extension (completed 2026-03-27)
- [x] **Phase 8: Audio Infrastructure + Rhythm Games** — usePianoSampler hook, RhythmReadingGame, RhythmDictationGame, i18n for all new game types (completed 2026-03-29)
- [x] **Phase 9: Ear Training Games** — NoteComparisonGame, IntervalGame, shared piano keyboard SVG, subscriptionConfig for ear nodes (completed 2026-03-29)
- [ ] **Phase 10: Ear Training Trail Data + Trail Tab** — 12-15 ear training nodes across 2 units, Ear tab on TrailMap, boss nodes, DB subscription gate sync
- [ ] **Phase 11: Arcade Rhythm Game + Rhythm Node Remapping** — ArcadeRhythmGame, 36 rhythm nodes remapped to mixed exercise types, DB migration clearing stale progress

---

## Phase Details

### Phase 7: Data Foundation + TrailMap Refactor
**Goal**: The routing and data infrastructure required by all new game types is in place and validated at build time
**Depends on**: Nothing (first v2.9 phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Adding any new exercise type to a trail node data file causes validateTrail.mjs to emit an error if the type string is not in EXERCISE_TYPES
  2. Tapping a trail node with any of the 5 new exercise types opens the correct game screen (no blank screen, no console error)
  3. TrailMap displays a 4th tab for Ear Training without code changes to tab layout logic (driven entirely by a data array)
  4. Build succeeds with all 5 new EXERCISE_TYPES and EAR_TRAINING category constants present in constants.js
**Plans:** 2/2 plans complete
Plans:
- [x] 07-01-PLAN.md — Data constants, build validation, i18n keys (INFRA-01, INFRA-02, INFRA-05)
- [x] 07-02-PLAN.md — TrailMap data-driven refactor, ComingSoon component, TrailNodeModal routing (INFRA-03, INFRA-04)

### Phase 8: Audio Infrastructure + Rhythm Games
**Goal**: Children can tap along with rhythm notation and identify rhythms by ear, with correct piano sample playback powering all new audio-dependent games
**Depends on**: Phase 7
**Requirements**: INFRA-06, INFRA-07, INFRA-08, RTAP-01, RTAP-02, RTAP-03, RTAP-04, RTAP-05, RDICT-01, RDICT-02, RDICT-03, RDICT-04, RDICT-05, RDICT-06
**Success Criteria** (what must be TRUE):
  1. A child can tap the screen in time with a displayed VexFlow rhythm pattern and receive PERFECT/GOOD/MISS feedback on each tap, with a scrolling cursor tracking position
  2. A child can hear a rhythm played audio-only, replay it as many times as needed, then select the correct notation card from 2-4 VexFlow choices
  3. Both rhythm games complete through VictoryScreen with star rating and XP award after a full session
  4. Piano note playback works on iOS without silence (AudioContext resumed before every bufferSource.start())
  5. All Rhythm Reading and Rhythm Dictation UI text appears in both English and Hebrew with correct RTL layout
**Plans:** 4/4 plans complete
**UI hint**: yes
Plans:
- [x] 08-01-PLAN.md — usePianoSampler hook + rhythm utility modules (INFRA-06)
- [x] 08-02-PLAN.md — RhythmReadingGame tap-along component (RTAP-01 through RTAP-05)
- [x] 08-03-PLAN.md — RhythmDictationGame hear-and-pick component (RDICT-01 through RDICT-06)
- [x] 08-04-PLAN.md — Route wiring, i18n EN+HE, service worker cache bump (INFRA-07, INFRA-08)

### Phase 9: Ear Training Games
**Goal**: Children can distinguish higher from lower pitches and categorize melodic intervals by ear using age-appropriate vocabulary
**Depends on**: Phase 8
**Requirements**: PITCH-01, PITCH-02, PITCH-03, PITCH-04, PITCH-05, INTV-01, INTV-02, INTV-03, INTV-04, INTV-05
**Success Criteria** (what must be TRUE):
  1. A child hears two piano notes played in sequence and can tap HIGHER or LOWER to correctly identify the second note's direction
  2. Interval distance narrows progressively across a Note Comparison session (starting with wide intervals, ending with close ones)
  3. A child hears a two-note melody and identifies it as Step, Skip, or Leap — ascending intervals are presented before descending intervals
  4. After answering an interval question, a piano keyboard SVG highlights the two played notes so the child can see where they fell
  5. Both ear training games complete through VictoryScreen with star rating and XP award
**Plans**: TBD
**UI hint**: yes

### Phase 10: Ear Training Trail Data + Trail Tab
**Goal**: The Ear Training learning path is live on the trail with progression nodes, a distinct visual identity, correct subscription gating, and a boss challenge
**Depends on**: Phase 9
**Requirements**: EAR-01, EAR-02, EAR-03, EAR-04, EAR-05
**Success Criteria** (what must be TRUE):
  1. A child on the TrailMap sees an "Ear" tab with a distinct color palette separate from Treble, Bass, and Rhythm
  2. Tapping into the Ear tab reveals 12-15 progressive nodes across 2 units with appropriate prerequisite locks
  3. Free tier children can access the defined free ear training nodes and are shown a paywall for premium nodes — no silent RLS failures
  4. A boss node combining ear training skills is present and completable end-to-end through VictoryScreen
**Plans:** 1/2 plans executed
**UI hint**: yes
Plans:
- [x] 10-01-PLAN.md — Ear training unit data files (14 nodes), expandedNodes registration, UNITS map (EAR-01, EAR-02, EAR-03, EAR-05)
- [ ] 10-02-PLAN.md — Subscription gating (JS + Postgres migration), tests (EAR-04)

### Phase 11: Arcade Rhythm Game + Rhythm Node Remapping
**Goal**: An arcade-style falling-tile rhythm game is playable, and all 36 existing rhythm nodes are remapped to a mixed distribution of exercise types that reflects the full new game variety
**Depends on**: Phase 8
**Requirements**: ARCR-01, ARCR-02, ARCR-03, ARCR-04, ARCR-05, RMAP-01, RMAP-02, RMAP-03
**Success Criteria** (what must be TRUE):
  1. Falling tiles descend in sync with the beat schedule; a child can tap the hit zone and see PERFECT/GOOD/MISS judgments with a combo counter
  2. Missing enough tiles depletes 3 lives and triggers GameOverScreen; hitting a streak triggers on-fire mode
  3. A DB migration has cleared exercise_progress and stars for all remapped rhythm nodes before the new node data deploys to production
  4. All 36 rhythm nodes are playable end-to-end through VictoryScreen with their new exercise type (MetronomeTrainer, Rhythm Reading, Dictation, or Arcade)
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Introductory Single-Note Game | v2.8 | 2/2 | Complete | 2026-03-25 |
| 6. Dedicated Parent Portal | v2.8 | 3/3 | Complete | 2026-03-25 |
| 7. Data Foundation + TrailMap Refactor | v2.9 | 2/2 | Complete   | 2026-03-27 |
| 8. Audio Infrastructure + Rhythm Games | v2.9 | 4/4 | Complete   | 2026-03-29 |
| 9. Ear Training Games | v2.9 | 2/2 | Complete   | 2026-03-29 |
| 10. Ear Training Trail Data + Trail Tab | v2.9 | 1/2 | In Progress|  |
| 11. Arcade Rhythm + Rhythm Remapping | v2.9 | 0/? | Not started | - |

**Total: 19 milestones shipped (v1.0-v2.8) — ~179 plans across ~82 phases**

---
*Last updated: 2026-03-29 — Phase 10 plans created (2 plans, 2 waves)*
