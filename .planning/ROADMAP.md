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
- **v3.0 Cleanup & Polish** — Phases 12-15 (in progress)

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

### v3.0 Cleanup & Polish (In Progress)

- [x] **Phase 12: Trail Config Fixes** - Rhythm games honor trail node config (patterns + difficulty mapping) (completed 2026-03-30)
- [x] **Phase 13: Code Quality Quick Wins** - Consolidate duplicated utilities, remove dead code, lazy-load teacher bundle (completed 2026-03-31)
- [ ] **Phase 14: Console Logging Cleanup** - Gate all debug logging behind DEV flag across the codebase
- [ ] **Phase 15: Verification & Deploy** - Daily goals audit, deploy sequencing docs, pending UAT items

## Phase Details

### Phase 12: Trail Config Fixes
**Goal**: Rhythm games correctly read and apply trail node configuration so difficulty and pattern constraints work as designed
**Depends on**: Nothing (first phase of v3.0)
**Requirements**: TCFG-01, TCFG-02, TCFG-03
**Success Criteria** (what must be TRUE):
  1. When a trail rhythm node specifies `rhythmPatterns`, only those durations appear in the generated exercises
  2. Trail difficulty values (`easy`/`medium`/`hard`) correctly map to generator levels (`beginner`/`intermediate`/`advanced`) so node difficulty affects actual gameplay
  3. rhythmUnit7 and rhythmUnit8 test files pass with expectations matching the D-12 distribution (3x RHYTHM + 2x RHYTHM_TAP + 1x RHYTHM_DICTATION + 1x ARCADE_RHYTHM per node)
**Plans:** 2/2 plans complete
Plans:
- [x] 12-01-PLAN.md -- Fix difficulty values in data files, regression test, build validator enhancement
- [x] 12-02-PLAN.md -- Wire allowedPatterns through generator and all 4 rhythm games, fix unit 7/8 test assertions

### Phase 13: Code Quality Quick Wins
**Goal**: Eliminate duplicated utility code, remove dead code, and reduce teacher bundle from the main chunk
**Depends on**: Nothing (independent of Phase 12)
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, QUAL-07, XP-01
**Success Criteria** (what must be TRUE):
  1. `noteNameToMidi` has a single canonical implementation and all call sites import from one module (zero duplicates)
  2. `calculateStars` has a single canonical implementation and all call sites import from one module (zero duplicates)
  3. `verifyStudentDataAccess` is defined only in authorizationUtils.js with no duplicate in apiDatabase.js
  4. AchievementsLegacy.jsx no longer exists in the codebase, and no non-migration files (DEBUG_, TEST_, README_) exist in supabase/migrations/
  5. TeacherDashboard loads via React.lazy() and all `total_points` references in teacher code use XP terminology
**Plans:** 2/2 plans complete
Plans:
- [x] 13-01-PLAN.md -- Consolidate noteNameToMidi, calculateStars, and verifyStudentDataAccess to canonical locations (completed 2026-03-30)
- [ ] 13-02-PLAN.md -- Delete dead code, lazy-load TeacherDashboard, migrate XP locale strings

### Phase 14: Console Logging Cleanup
**Goal**: Production builds contain no unguarded debug logging, keeping the browser console clean for end users
**Depends on**: Nothing (independent of other phases, but best done after code changes in 12-13 to avoid merge conflicts)
**Requirements**: QUAL-06
**Success Criteria** (what must be TRUE):
  1. Running `grep -r "console.log\|console.debug" src/` shows fewer than 50 hits, all guarded by `import.meta.env.DEV` or justified as intentional production logging (errors/warnings)
  2. Production build (`npm run build && npm run preview`) shows zero debug-level console output during normal app usage (login, trail navigation, playing a game, viewing dashboard)
**Plans:** 1 plan
Plans:
- [ ] 14-01-PLAN.md -- Remove/gate all 24 unguarded console.log/debug calls, add ESLint no-console rule

### Phase 15: Verification & Deploy
**Goal**: All operational loose ends are closed -- daily goals work with all game types, deploy process is documented, and pending manual verification items are completed
**Depends on**: Phases 12-13 (daily goals audit needs trail config fixes in place; UAT covers rhythm game behavior)
**Requirements**: GOAL-01, DEPLOY-01, UAT-01
**Success Criteria** (what must be TRUE):
  1. `dailyGoalsService.js` counts exercises from all game types (including ear training and arcade rhythm) toward daily goals with no hardcoded category arrays
  2. A deploy sequencing document exists in `.planning/` or `docs/` that describes the correct order for Supabase migration + Netlify deploy
  3. All 5 pending Phase 08 UAT items (rhythm games, piano tone, PWA cache) are verified on a real device and results documented
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 12. Trail Config Fixes | v3.0 | 2/2 | Complete    | 2026-03-30 |
| 13. Code Quality Quick Wins | v3.0 | 1/2 | Complete    | 2026-03-31 |
| 14. Console Logging Cleanup | v3.0 | 0/1 | In progress | - |
| 15. Verification & Deploy | v3.0 | 0/? | Not started | - |

**Total: 20 milestones shipped (v1.0-v2.9), v3.0 in progress -- 4 phases, 14 requirements**

---
*Last updated: 2026-03-31 -- Phase 14 planned (1 plan, console logging cleanup)*
