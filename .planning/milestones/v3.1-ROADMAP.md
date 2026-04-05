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
- 🚧 **v3.1 Trail-First Navigation** — Phases 17-19 (in progress)

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

### v3.1 Trail-First Navigation (In Progress)

- [x] **Phase 17: Navigation Restructuring** - Trail becomes the primary nav destination with correct active states (completed 2026-04-04)
- [x] **Phase 18: Dashboard Compaction** - Dashboard redesigned as a compact stats hub without the hero CTA (completed 2026-04-05)
- [x] **Phase 19: Post-Game Trail Return** - VictoryScreen flows guide players back to the trail (completed 2026-04-05)

## Phase Details

### Phase 17: Navigation Restructuring

**Goal**: Students navigate to and from the trail as the app's primary destination
**Depends on**: Nothing (first phase of v3.1)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, DASH-04
**Success Criteria** (what must be TRUE):

1. Trail map appears as a top-level item in the desktop sidebar and is clickable
2. Trail map appears as a tab in the mobile bottom navigation bar
3. A returning student who logs in lands on the trail map (not the dashboard)
4. The active/highlighted state in both sidebar and bottom tabs correctly reflects whichever page the user is on (trail, dashboard, settings, etc.)
5. Dashboard remains accessible from both sidebar and bottom tabs as a secondary item

**Plans:** 2/2 plans complete

Plans:

- [x] 17-01-PLAN.md — Nav config, routing, AppLayout, and NavLink end prop wiring (completed 2026-04-05)
- [x] 17-02-PLAN.md — TrailMapPage layout conversion and URL reference audit

**UI hint**: yes

### Phase 18: Dashboard Compaction

**Goal**: Dashboard serves as a quick-glance stats hub rather than the app's front door
**Depends on**: Phase 17
**Requirements**: DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):

1. Dashboard displays a compact layout that feels like a stats overview, not a landing page
2. The PlayNextButton ("Continue/Begin Journey") hero CTA no longer appears anywhere on the dashboard
3. Existing dashboard cards (streak display, XP progress, daily goals, practice log, daily message) are all still visible and functional in the compact layout

**Plans:** 1/1 plans complete

Plans:

- [ ] 18-01-PLAN.md — Compact dashboard redesign: hero removal, greeting bar, gap reduction, Recordings button, URL updates

**UI hint**: yes

### Phase 19: Post-Game Trail Return

**Goal**: After completing a game, students are guided back to the trail as the natural next step
**Depends on**: Phase 17
**Requirements**: POST-01, POST-02
**Success Criteria** (what must be TRUE):

1. VictoryScreen for trail-originated games shows "Next Adventure" as the single primary action button (Duolingo-style single CTA)
2. VictoryScreen for free play games shows "Play Again" + "Back to Games" (no trail option)
3. GameOverScreen for trail games shows "Try Again" + "Back to Trail" (context-aware, not hardcoded)
4. GameOverScreen for free play games shows "Try Again" + "Back to Games"

**Plans:** 2/2 plans complete

Plans:

- [ ] 19-01-PLAN.md — VictoryScreen button simplification + useVictoryState cleanup + i18n
- [x] 19-02-PLAN.md — GameOverScreen context-aware navigation + game component threading (completed 2026-04-05)

**UI hint**: yes

## Progress

| Phase                        | Milestone | Plans Complete | Status      | Completed  |
| ---------------------------- | --------- | -------------- | ----------- | ---------- |
| 17. Navigation Restructuring | v3.1      | 2/2            | Complete    | 2026-04-04 |
| 18. Dashboard Compaction     | v3.1      | 0/1            | Complete    | 2026-04-05 |
| 19. Post-Game Trail Return   | v3.1      | 1/2            | Complete    | 2026-04-05 |

**Total: 21 milestones shipped, 92 phases, ~199 plans | v3.1 in progress: 3 phases**

---

_Last updated: 2026-04-05 -- Phase 19 Plan 02 complete_
