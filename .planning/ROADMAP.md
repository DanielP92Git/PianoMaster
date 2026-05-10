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
- 🚧 **v3.4 Rhythm Games Responsive UX** — Phases 34-35 (active)

See `.planning/milestones/` for archived details of each milestone.

## Phases

<details>
<summary>v1.0 through v3.1 -- See milestones/ for archived details</summary>

See individual milestone archives in `.planning/milestones/` for full phase breakdowns.

</details>

<details>
<summary>✅ v3.2 Rhythm Trail Rework (Phases 20-28) -- SHIPPED 2026-04-13</summary>

- [x] Phase 20: Curriculum Audit (1/1 plans) -- completed 2026-04-11
- [x] Phase 21: Pattern Library Construction (1/1 plans) -- completed 2026-04-11
- [x] Phase 22: Service Layer & Trail Wiring (5/5 plans) -- completed 2026-04-12
- [x] Phase 23: UX Polish (3/3 plans) -- completed 2026-04-09
- [x] Phase 24: Multi-Angle Rhythm Games (3/3 plans) -- completed 2026-04-09
- [x] Phase 25: Unified Mixed Lesson Engine (3/3 plans) -- completed 2026-04-09
- [x] Phase 26: Restore Phase 23 UX Regression (2/2 plans) -- completed 2026-04-13
- [skipped] Phase 27: Verification & Traceability -- carried to v3.3
- [skipped] Phase 28: Tech Debt Fixes -- CODE-01/02/03 carried to v3.3 Phase 29

</details>

<details>
<summary>✅ v3.3 Rhythm Trail Fix & Polish (Phases 29-33) -- SHIPPED 2026-05-04</summary>

- [x] Phase 29: Code Quality & Data Fixes (2/2 plans) -- completed 2026-04-13
- [x] Phase 30: Audio Fixes (2/2 plans) -- completed 2026-04-13
- [x] Phase 31: Long-Press Sustain (3/3 plans) -- completed 2026-04-14
- [x] Phase 32: Game Design Differentiation (3/3 plans) -- completed 2026-04-20
- [x] Phase 33: Rhythm Issues Cleanup (10/10 plans; 33-07 skipped per UAT) -- completed 2026-05-04

</details>

### v3.4 Rhythm Games Responsive UX (Phases 34-35) — ACTIVE

- [ ] **Phase 34: Responsive Rhythm Renderers (Non-Arcade)** — Drop route-based landscape lock for rhythm games and make non-arcade renderers responsive across all 4 phone/tablet × portrait/landscape quadrants
- [ ] **Phase 35: ArcadeRhythmGame Portrait** — Spike vertical-lane prototype for ArcadeRhythmGame on phone-portrait, then ship vertical-lane redesign OR declare `needsLandscape=true` based on spike outcome

## Phase Details

### Phase 34: Responsive Rhythm Renderers (Non-Arcade)

**Goal**: Replace `LANDSCAPE_ROUTES` with content-driven `NeedsLandscapeContext` for rhythm games and make every non-arcade rhythm renderer + wrapper render correctly on phone-portrait, phone-landscape, tablet-portrait, and tablet-landscape — vertical card stacks stop scrolling on small phones, and tablets get real 2-column layouts that use the available width.
**Depends on**: Nothing (first phase of v3.4; standalone infrastructure + renderer work)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, NOTATION-01, NOTATION-02, NOTATION-03, WRAPPER-01, WRAPPER-02, WRAPPER-03, TABLET-01
**Success Criteria** (what must be TRUE):

1. On iPhone SE portrait (375×667), the rhythm dictation game shows the staff plus all 3 choice cards in a 2×2 grid (last card spans 2 columns) with no vertical scroll required to see or tap any card
2. Opening any short-pattern rhythm reading or rhythm tap exercise on a phone in portrait renders the notation inline with no rotate prompt; long-pattern variants surface the rotate prompt only because the pattern truly does not fit
3. On a tablet (≥768px) in either orientation, the rotate prompt never appears for any rhythm game, regardless of pattern length or current orientation
4. On tablet-landscape, cards-based renderers (dictation, syllable-matching, visual-recognition) lay out as a real 2-column grid that fills the available width — not a centered single column with whitespace gutters
5. The rhythm game setup screens (`RhythmGameSetup`, `RhythmGameSettings`) and supporting overlays (`CountdownOverlay`, `BossIntroOverlay`, `FloatingFeedback`, `MetronomeDisplay`, `TapArea`) render and remain interactive in all 4 quadrants without clipping, overflow, or hidden controls

**Plans:** 9 plans (6 original + 3 gap-closure + 1 UAT-delta); 5 executed, 1 routed-to-gap-closure (34-06), 4 awaiting execution

Plans:

- [x] 34-01-PLAN.md — Wave 0 infrastructure: needsLandscape helper + test, NeedsLandscapeContext provider + hooks + lifecycle test (NOTATION-03, INFRA-02)
- [x] 34-02-PLAN.md — 13-component audit punch list across 4 quadrants (D-08/D-09; informs Plans 04 and 05)
- [x] 34-03-PLAN.md — Wiring: AppLayout provider mount, App.jsx LANDSCAPE_ROUTES rhythm removal, useLandscapeLock context-aware (INFRA-01, INFRA-04, D-19)
- [x] 34-04-PLAN.md — 7 renderer declarations + card grids + 6 wrapper gate composition + TapArea widths (CORE-01..05, NOTATION-01/02, INFRA-03, WRAPPER-01, TABLET-01)
- [x] 34-05-PLAN.md — Supporting components responsive bumps + RhythmGameSettings glass conversion (D-18) (WRAPPER-02, WRAPPER-03)
- [-] 34-06-PLAN.md — Manual UAT walkthrough + ship-gate sign-off (D-12; covers all SC #1-5) — UAT routed 3 gap categories to gap-closure (see 34-UAT.md)
- [ ] 34-07-PLAN.md — GAP 1: standalone RhythmDictationGame wrapper 2x2 grid + col-span-2 (CORE-02/04/05, TABLET-01)
- [ ] 34-08-PLAN.md — GAP 2: dev-only ?measures URL param helper for UAT long-pattern verification (NOTATION-01/02)
- [ ] 34-09-PLAN.md — GAP 3: investigate RhythmGameSetup/RhythmGameSettings + minimal wrapper-level fix; mark dead RhythmGameSettings @deprecated (WRAPPER-02/03, D-10/D-18 boundary respected)
- [ ] 34-10-PLAN.md — UAT delta walkthrough re-tests failed rows + newly-affected regression (D-12; ship gate)
      **UI hint**: yes

### Phase 35: ArcadeRhythmGame Portrait

**Goal**: Decide and ship a portrait experience for `ArcadeRhythmGame` on phone — either a vertical-lane (top-down scrolling) redesign that runs natively in portrait, or a clean rotate-prompt path that declares `needsLandscape=true` and reuses Phase 34's infrastructure — based on a short feel-test prototype.
**Depends on**: Phase 34 (specifically INFRA-02 `NeedsLandscapeContext` must ship first; both Phase 35 outcomes consume it — either to register `needsLandscape=true` from the renderer, or to keep `needsLandscape=false` while a vertical-lane variant takes over on phone-portrait)
**Requirements**: ARCADE-01, ARCADE-02
**Success Criteria** (what must be TRUE):

1. A throwaway vertical-lanes prototype of ArcadeRhythmGame has been run on a real phone in portrait, and the spike outcome (ship vertical lanes vs. fall back to rotate prompt) is documented as a recorded decision
2. On phone-portrait, opening ArcadeRhythmGame either plays in a vertical-lane layout without orientation change OR shows the rotate prompt via the Phase 34 `NeedsLandscapeContext` mechanism — never a broken horizontal-lanes layout that spills off-screen
3. On tablet-landscape (and on phone-landscape if the rotate-prompt path is chosen), ArcadeRhythmGame continues to render with the existing horizontal-lanes layout — no regression for the orientation it was originally designed for
   **Plans**: TBD
   **UI hint**: yes

## Progress

**Total: 24 milestones shipped, 107 phases, ~238 plans | Active: v3.4 (Phases 34-35, 0/2 phases complete)**

| Phase                                        | Plans Complete | Status      | Completed |
| -------------------------------------------- | -------------- | ----------- | --------- |
| 34. Responsive Rhythm Renderers (Non-Arcade) | 5/6            | In Progress |           |
| 35. ArcadeRhythmGame Portrait                | 0/0            | Not started | -         |

---

_Last updated: 2026-05-07 -- v3.4 roadmap drafted (Phases 34-35)_
