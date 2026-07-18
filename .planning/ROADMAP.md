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
- ✅ **v3.7 Sight-Reading Engagement & Pedagogy** — Phases 01-03 (shipped 2026-07-18)

See `.planning/milestones/` for archived details of each milestone.

## Phases

No milestone in progress. Run `/gsd-new-milestone` to start the next one.

<details>
<summary>✅ v3.7 Sight-Reading Engagement & Pedagogy (Phases 01-03) — SHIPPED 2026-07-18</summary>

- [x] Phase 01: Engagement HUD Parity (2/2 plans) — completed 2026-07-09
- [x] Phase 02: Practice Tooling (9/9 plans) — completed 2026-07-10
- [x] Phase 03: Adaptive Pedagogy (7/7 plans) — completed 2026-07-12

Turned the hardened sight-reading game (Phases A/B/C shipped on `main` as PRs #10/#11/#12) into an
elite learning experience: session-wide combo/on-fire HUD parity, practice tooling (replay,
Practice/Test grading mode, Review-mistakes drill), and adaptive per-note-mastery pedagogy
(in-session difficulty/tempo + cross-session `note_mastery` JSONB persistence under RLS). 10/12
requirements shipped; HUD-02 (lives/game-over) and PRAC-02 (comparison playback — built + device-
verified, hidden as too busy for 8-year-olds) deferred. Audit PASSED; secure-phase 03 closed 12/12
threats. Ships via PR #13.

Full details: `.planning/milestones/v3.7-ROADMAP.md` · Requirements: `.planning/milestones/v3.7-REQUIREMENTS.md` · Audit: `.planning/milestones/v3.7-MILESTONE-AUDIT.md`

</details>

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

## Progress

**Total: 28 milestones shipped, 114 phases, ~291 plans | No milestone in progress — run `/gsd-new-milestone`**

v3.7 phases 01-03 shipped 2026-07-18 (see the collapsed section above and `.planning/milestones/v3.7-ROADMAP.md`).

---

_Last updated: 2026-07-18 -- v3.7 Sight-Reading Engagement & Pedagogy shipped and archived (10/12 requirements; HUD-02 + PRAC-02 deferred). Audit PASSED. Next: `/gsd-new-milestone`._
