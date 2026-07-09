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
- ✅ **v3.6 Game Screen UI Unification** — Phase 36 (shipped 2026-06-14)
- ✅ **v3.5 Rhythm Pedagogy** — Phase 1 (shipped 2026-06-29)
- 🚧 **v3.7 Sight-Reading Engagement & Pedagogy** — Phases 01-03 (in progress, started 2026-07-09)

See `.planning/milestones/` for archived details of each milestone.

## Phases

### Active: v3.7 Sight-Reading Engagement & Pedagogy

Phase D of the sight-reading deep audit (Phases A/B/C — correctness, performance, feedback wiring —
already shipped as PRs #10/#11/#12 on `main`). Turns the hardened sight-reading game into an elite
learning experience: engagement HUD parity, practice tooling, and adaptive per-note-mastery pedagogy.

- [ ] **Phase 01: Engagement HUD Parity** - Combo/on-fire positive-engagement HUD parity with sibling games (client-only, reuses v3.6 shared HUD components; lives/game-over deferred 2026-07-09)
- [ ] **Phase 02: Practice Tooling** - Replay, played-vs-correct comparison, Practice/Test mode, Review-mistakes (client-only)
- [ ] **Phase 03: Adaptive Pedagogy** - In-session adaptive difficulty/tempo + cross-session per-note mastery persistence (needs Supabase, own `/gsd-secure-phase` pass)

<details>
<summary>v1.0 through v3.3 -- See milestones/ for archived details</summary>

See individual milestone archives in `.planning/milestones/` for full phase breakdowns.

</details>

<details>
<summary>✅ v3.4 Rhythm Games Responsive UX (Phases 34-35) -- SHIPPED 2026-05-12</summary>

- [x] Phase 34: Responsive Rhythm Renderers (Non-Arcade) (10/10 plans) -- completed 2026-05-10
- [x] Phase 35: ArcadeRhythmGame Portrait (4/4 plans) -- completed 2026-05-11

</details>

<details>
<summary>✅ v3.5 Rhythm Pedagogy (Phase 01) — SHIPPED 2026-06-29</summary>

- [x] Phase 01: Rhythm Trail Pedagogical Restructure (10/10 plans across 4 waves) — completed 2026-06-29

Rebuilt the 29-node rhythm trail into a pedagogically coherent 10-unit / 55-node order anchored by
three falsifiable principles — Pulse-first, Rests-woven, Concept-per-unit — encoded as
`scripts/validateTrail.mjs` lint rules (build-time enforcement). Added 12 Duolingo-style
intro/scaffolding card blocks (EN+HE) paginated by `DiscoveryIntroQuestion.jsx`. Atomic Supabase
migration wiped rhythm progress while preserving `total_xp` (applied to production 2026-06-28).
Hidden Syncopation renamed `rhythm_8_*` → `rhythm_synco_*` to free the namespace for the new 3/4
Meter unit. All 7 requirements satisfied; owner gates D-13 (migration) + SC-9 (device UAT) closed;
milestone audit PASSED.

Full details: `.planning/milestones/v3.5-ROADMAP.md` · Requirements: `.planning/milestones/v3.5-REQUIREMENTS.md` · Audit: `.planning/milestones/v3.5-MILESTONE-AUDIT.md`

</details>

<details>
<summary>✅ v3.6 Game Screen UI Unification (Phase 36) — SHIPPED 2026-06-14</summary>

- [x] Phase 36: Game Screen UI Unification (11/11 plans across 7 waves) — completed 2026-06-14

Extracted NotesRecognition's inline HUD/shell into reusable shared components
(`src/components/games/shared/hud/`: ProgressBar, ScorePill, LivesDisplay, ComboPill,
OnFireBadge, OnFireSplash, SpeedBonusFlash, TierUpPopup, TimerDisplay, GameActionButton,
StreakBrightnessOverlay) and adopted them across the other game screens (subset-per-mechanics).
De-duplicated ArcadeRhythmGame's inline lives/combo/on-fire and unified MixedLessonGame's
progress bar. Owner walkthrough of all 10 game screens APPROVED. HUD presentation only — no
game-mechanics changes.

Full details: `.planning/milestones/v3.6-ROADMAP.md` · Requirements: `.planning/milestones/v3.6-REQUIREMENTS.md`

</details>

## Phase Details

### Phase 01: Engagement HUD Parity

**Goal**: Sight-reading players get the same combo / lives / on-fire engagement feedback loop as the
sibling games (Notes Recognition, Arcade Rhythm), by reusing the shared HUD components already
extracted in v3.6 (`src/components/games/shared/hud/`) — no new mechanics invented, just parity.

**Depends on**: Nothing (first phase; builds on the already-merged Phases A–C sight-reading refactor on `main`)

**Requirements**: HUD-01, HUD-03, I18N-01 (cross-cutting). _HUD-02 deferred — see below._

**Scope note (2026-07-09 discussion):** Phase 01 is now **positive-only**. HUD-02 (lives + `GameOverScreen`) was **deferred**: sight-reading is high-cognitive-load; a fail state punishes rather than motivates, and lives carry no business upside (subscription-gated content, not a hearts economy). Combo is refined to **session-wide** and **live note-by-note**. See `phases/01-engagement-hud-parity/01-CONTEXT.md`.

**Success Criteria** (what must be TRUE):

1. Player sees a live combo counter (`ComboPill`) that increments on consecutive correct notes and visibly resets on a miss. The combo is **session-wide** (spans exercises) and updates **live, note-by-note**.
2. ~~Player has a session-level lives indicator (`LivesDisplay`); when lives reach 0, the shared `GameOverScreen` path is shown instead of the bespoke sight-reading loss screen.~~ **DEFERRED (HUD-02).** No lives/game-over this phase; the existing gentle encouragement screen is retained.
3. Player sees an on-fire badge/splash celebration (`OnFireBadge`/`OnFireSplash`) when their combo crosses the engagement threshold, and it is suppressed when `prefers-reduced-motion` is set.
4. All new HUD strings (combo, on-fire) render correctly in Hebrew with RTL layout, matching the English source 1:1 (no missing keys, no untranslated fallback) — reusing the shared `games.engagement` keys.

**Plans**: 2 plans across 2 waves

- [x] 01-01-PLAN.md — Session-wide combo/on-fire state in `SightReadingSessionContext` + HUD-02 deferral doc (Wave 1)
- [ ] 01-02-PLAN.md — Wire combo/on-fire HUD (ComboPill/OnFireBadge/OnFireSplash) into `SightReadingGame` (Wave 2)

---

### Phase 02: Practice Tooling

**Goal**: The sight-reading game becomes an effective deliberate-practice tool, not just a scored
run — players can hear the exercise again, compare their playing to the correct rendition, choose
how strictly they're graded, and revisit only what they got wrong.

**Depends on**: Phase 01 (ships after HUD parity; reuses `useRhythmPlayback` auto-play infra, `timingStatus` early/late, `useTimingAnalysis`/`TIMING_STATUS_MAP` tolerances, and `performanceResults` with `noteIndex` already present in the Phase A–C codebase)

**Requirements**: PRAC-01, PRAC-02, PRAC-03, PRAC-04, I18N-01 (cross-cutting)

**Success Criteria** (what must be TRUE):

1. During the read/display phase, the player can tap "hear it again" to replay the exercise audio on demand, any number of times, beyond the single existing auto-play.
2. In the feedback phase, the player can trigger a played-vs-correct comparison playback (their rendition, then the correct one, or vice versa).
3. Before starting an exercise, the player can choose Practice mode (lenient timing tolerance, pitch-focused grading) or Test mode (strict timing tolerance) — the choice visibly changes how notes are graded.
4. After finishing an exercise, the player can enter a Review-mistakes mode that steps through only the wrong/missed notes from that attempt (not the full exercise again).
5. All new controls and labels (replay button, mode toggle, review-mistakes UI) ship in EN+HE with correct RTL mirroring and no locale-parity gaps.

**Plans**: TBD

---

### Phase 03: Adaptive Pedagogy

**Goal**: The game adapts in real time to how the player is doing — widening or narrowing
difficulty and tempo within a session — and remembers per-note weaknesses across sessions so future
practice can target them, all while keeping a child's mastery data locked to that child alone.

**Depends on**: Phase 02 (the practice/test mode flag from Phase 02 naturally precedes the adaptivity hooks built here); needs its own Supabase migration and a dedicated `/gsd-secure-phase` pass before merge (this phase touches the DB — the only one of the three that does)

**Requirements**: ADAPT-01, ADAPT-02, ADAPT-03, ADAPT-04, I18N-01 (cross-cutting)

**Success Criteria** (what must be TRUE):

1. Within a session, sustained correct streaks widen the note range / add rests / raise tempo, and a run of misses eases difficulty back down — observably, not just internally logged.
2. Tempo visibly slows after a run of misses and speeds back up after a run of successes.
3. After finishing a session and returning in a later session, the game can surface/target notes the player has historically struggled with, based on a per-note accuracy value persisted via a new JSONB field on the student's progress row (the `perNoteAccuracy` value already computed per exercise today, currently discarded, is now persisted).
4. The persisted per-note mastery field can only be read and written by the authenticated owning student, verified under RLS mirroring the existing `student_skill_progress` protections (defense-in-depth: JS gate + DB RLS) — confirmed by a `/gsd-secure-phase` pass before this phase is considered done.
5. All new adaptive-coaching and mode-related strings ship in EN+HE with RTL correctness.

**Plans**: TBD

## Progress

**Total: 27 milestones shipped, 111 phases, ~273 plans | Active: v3.7 Sight-Reading Engagement & Pedagogy (3 phases, 0/3 complete)**

| Phase                     | Plans Complete | Status      | Completed |
| ------------------------- | -------------- | ----------- | --------- |
| 01. Engagement HUD Parity | 1/2            | In Progress | -         |
| 02. Practice Tooling      | 0/TBD          | Not started | -         |
| 03. Adaptive Pedagogy     | 0/TBD          | Not started | -         |

---

_Last updated: 2026-07-09 -- v3.7 Sight-Reading Engagement & Pedagogy roadmap created (3 phases, 12/12 v1 requirements mapped). Phase 01 next via `/gsd-plan-phase 01`._
