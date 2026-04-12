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
- **v3.2 Rhythm Trail Rework** — Phases 20-28 (gap closure in progress)

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

### v3.2 Rhythm Trail Rework

**Milestone Goal:** Rework the rhythm trail's pedagogy so every node introduces one concept at a time, uses the correct game for each learning stage, and draws from a curated hand-crafted pattern library — replacing the current random-generative approach with pedagogically sequenced content following Kodaly/Orff principles.

#### Phases

- [x] **Phase 20: Curriculum Audit** - Audit all 56 rhythm nodes and lock game-type policy before touching any files (completed 2026-04-11)
- [x] **Phase 21: Pattern Library Construction** - Author ~120+ hand-crafted tagged patterns as a new synchronous JS module (completed 2026-04-11)
- [x] **Phase 22: Service Layer & Trail Wiring** - Wire generator, unit files, game components, and validator as a coordinated change (completed 2026-04-12)
- [x] **Phase 23: UX Polish** - Widen timing thresholds, rename games, replace MISS text, add measure length progression, and render Kodaly syllables (completed 2026-04-09)
- [x] **Phase 24: Multi-Angle Rhythm Games** - Visual recognition + syllable matching games for rhythm trail nodes (completed 2026-04-09)
- [x] **Phase 25: Unified Mixed Lesson Engine** - Duolingo-style interleaved lesson engine for trail nodes (completed 2026-04-09)
- [ ] **Phase 26: Restore Phase 23 UX Regression** - Restore 12 files reverted by commit 13cff54; fix all UX + integration regressions
- [ ] **Phase 27: Verification & Traceability Cleanup** - Generate missing verification docs, fix stale artifacts, add MLE requirements
- [ ] **Phase 28: Tech Debt Fixes** - Fix code review findings from Phases 22 and 25

## Phase Details

### Phase 20: Curriculum Audit

**Goal**: All pedagogical decisions about the rhythm trail are documented and locked before any file is modified
**Depends on**: Nothing (first phase of this milestone)
**Requirements**: CURR-01, CURR-02, CURR-03, CURR-04
**Plans:** 1/1 plans complete

Plans:

- [x] 20-01-PLAN.md — Audit all 56 rhythm nodes and produce curriculum audit reference document

**Success Criteria** (what must be TRUE):

1. Every one of the 56 rhythm nodes has been reviewed and its single introduced concept identified — violations are documented
2. A written decision exists for which game type belongs at each node type: Discovery/Practice/MIX_UP/REVIEW/MINI_BOSS use mixed_lesson, SPEED_ROUND/CHALLENGE/BOSS use arcade_rhythm
3. A node-by-node remediation list exists covering every node that currently violates the one-concept or wrong-game rule
4. The audit output is committed as a reference document that Phase 22 implementation follows exactly

### Phase 21: Pattern Library Construction

**Goal**: A curated library of ~120+ hand-crafted rhythm patterns exists as a synchronous Vite-bundled JS module, tagged by duration set
**Depends on**: Phase 20
**Requirements**: PAT-01, PAT-02
**Plans:** 1/1 plans complete

Plans:

- [x] 21-01-PLAN.md — Create test suite and author 130+ rhythm patterns across all 15 duration-set tags

**Success Criteria** (what must be TRUE):

1. `src/data/patterns/rhythmPatterns.js` exists with at minimum 120 patterns, each a complete VexFlow-compatible pattern definition
2. Every pattern carries a `tags` array with at least one duration-set tag (e.g. `quarter-only`, `quarter-half`, `quarter-eighth`)
3. The file is a plain synchronous ES module import — no async fetch, no JSON file, no dynamic loading
4. Patterns cover all duration sets used across the 56 rhythm nodes (quarter-only through syncopation/compound)

### Phase 22: Service Layer & Trail Wiring

**Goal**: Rhythm nodes use curated patterns instead of duration allowlists, the generator resolves by tags/IDs, Unit 1 Node 1 has a pulse exercise, and the build validator enforces pattern correctness
**Depends on**: Phase 21
**Requirements**: CURR-05, PAT-03, PAT-04, PAT-05, PAT-06
**Plans:** 5/5 plans complete

Plans:

- [x] 22-01-PLAN.md — Create RhythmPatternGenerator module with resolveByTags/resolveByIds + TDD tests
- [x] 22-02-PLAN.md — Add PULSE exercise type, PulseQuestion renderer, register in MixedLessonGame/validator
- [x] 22-03-PLAN.md — Update game consumers + migrate Units 1-4 (28 nodes) to patternTags
- [x] 22-04-PLAN.md — Migrate Units 5-8 (28 nodes) to patternTags + fix rhythm_7_4 violation
- [x] 22-05-PLAN.md — Extend build validator with tag existence, coverage, duration safety, game-type policy checks

**Success Criteria** (what must be TRUE):

1. `RhythmPatternGenerator.js` exposes `resolveByTags()` and `resolveByIds()` and all 56 rhythm node configs use `patternTags` or `patternIds` instead of `rhythmPatterns` duration allowlists
2. Unit 1 Node 1 delivers a pulse exercise where the child taps with the metronome beat and sees no music notation
3. A child playing a Discovery node only ever encounters patterns that contain durations from duration sets they have already encountered — no patterns with unintroduced note values appear
4. Running `npm run build` fails with a clear error if any node config references a pattern tag or ID that does not exist in `rhythmPatterns.js`
5. Running `npm run build` passes cleanly when all pattern references are valid

### Phase 23: UX Polish

**Goal**: The rhythm trail feels child-friendly and appropriately calibrated — timing is forgiving, language is warm, and notation shows Kodaly syllables for all introduced durations
**Depends on**: Phase 22
**Requirements**: UX-01, UX-02, UX-03, UX-04, UX-05
**Plans:** 3/3 plans complete

Plans:

- [x] 23-01-PLAN.md — Widen timing thresholds, rename MetronomeTrainer, replace MISS text
- [x] 23-02-PLAN.md — Measure count policy (1/2/4 bars), multi-stave rendering, curated patterns
- [x] 23-03-PLAN.md — Kodaly syllable annotations below VexFlow note heads

**Success Criteria** (what must be TRUE):

1. A child tapping a quarter-note pattern on a Discovery or Practice node can achieve PERFECT feedback with up to 100ms timing error (not the previous 50ms)
2. The MetronomeTrainer game shows a child-friendly name in both English and Hebrew UI — the string "MetronomeTrainer" does not appear in any visible label
3. Tapping incorrectly in any rhythm game shows "Almost!" (EN) or its Hebrew equivalent — the word "MISS" does not appear anywhere in the rhythm game UI
4. A Discovery node shows a 1-bar pattern, a Practice node shows a 2-bar pattern, and a Speed or Boss node shows a 4-bar pattern
5. Kodaly syllables (ta / ti-ti / ta-a / ta-a-a-a in EN; ta-a-a-a / ta-a-a-a in HE) appear below VexFlow note heads for all rendered rhythm patterns

## Progress

| Phase                              | Milestone | Plans Complete | Status   | Completed  |
| ---------------------------------- | --------- | -------------- | -------- | ---------- |
| 20. Curriculum Audit               | v3.2      | 1/1            | Complete | 2026-04-11 |
| 21. Pattern Library Construction   | v3.2      | 1/1            | Complete | 2026-04-11 |
| 22. Service Layer & Trail Wiring   | v3.2      | 5/5            | Complete | 2026-04-12 |
| 23. UX Polish                      | v3.2      | 3/3            | Complete | 2026-04-09 |
| 24. Multi-Angle Rhythm Games       | v3.2      | 3/3            | Complete | 2026-04-09 |
| 25. Unified Mixed Lesson Engine    | v3.2      | 3/3            | Complete | 2026-04-09 |
| 26. Restore Phase 23 UX Regression | v3.2      | 0/0            | Planned  | —          |
| 27. Verification & Traceability    | v3.2      | 0/0            | Planned  | —          |
| 28. Tech Debt Fixes                | v3.2      | 0/0            | Planned  | —          |

**Total: 22 milestones shipped, 98 phases, ~203 plans | v3.2: 9 phases, 6/9 complete**

### Phase 25: Unified Mixed Lesson Engine for Trail Nodes

**Goal:** Build a MixedLessonGame component that plays through a pre-authored sequence of different question types (visual recognition, syllable matching, and future types) within one unified game session — Duolingo-style interleaved learning instead of separate sequential games per exercise.
**Requirements**: MLE-01, MLE-02, MLE-03, MLE-04, MLE-05, MLE-06, MLE-07
**Depends on:** Phase 24
**Plans:** 3/3 plans complete

Plans:

- [x] 25-01-PLAN.md — Extract stateless renderers + refactor standalone games to thin wrappers
- [x] 25-02-PLAN.md — Register MIXED_LESSON exercise type, route, TrailNodeModal, i18n, and build validator
- [x] 25-03-PLAN.md — Build MixedLessonGame engine component + wire trail node data + engine tests

### Phase 26: Restore Phase 23 UX Regression

**Goal**: Restore all 12 source files reverted by commit 13cff54 to their Phase 23 state — fixing all UX requirements, integration gaps, and broken E2E flows
**Depends on**: Phase 23, Phase 22
**Requirements**: UX-01, UX-02, UX-03, UX-04, UX-05, PAT-04, PAT-06
**Gap Closure:** Closes gaps from v3.2 milestone audit

**Success Criteria** (what must be TRUE):

1. `EASY_NODE_TYPES` and `BASE_TIMING_THRESHOLDS_EASY` exist in rhythmTimingUtils.js; `scoreTap()` accepts `nodeType` param (UX-01)
2. i18n shows "Listen & Tap" (EN) and Hebrew equivalent; `useDocumentTitle` default updated (UX-02)
3. i18n shows "Almost!" (EN) and Hebrew equivalent — "MISS" does not appear in rhythm game UI (UX-03)
4. RhythmStaffDisplay accepts `measures` prop; RhythmReadingGame passes `trailMeasureCount`; `validateMeasureCountPolicy()` exists in validator (UX-04)
5. `beatsToVexNotes` accepts syllable params with Annotation imports; RhythmStaffDisplay accepts syllable props; games have syllable toggle (UX-05)
6. RhythmReadingGame imports `resolveByTags` from RhythmPatternGenerator (PAT-04)
7. Pulse exercise type has i18n key in trail.json for Hebrew (integration gap 4)

### Phase 27: Verification & Traceability Cleanup

**Goal**: Close all process/documentation gaps so milestone audit passes with no partial requirements due to missing verification artifacts
**Depends on**: Phase 26
**Requirements**: CURR-01, CURR-02, CURR-03, CURR-04, PAT-01, PAT-02, PAT-03, PAT-05, PAT-06
**Gap Closure:** Closes documentation gaps from v3.2 milestone audit

**Success Criteria** (what must be TRUE):

1. Phase 20 has a valid VERIFICATION.md confirming CURR-01 through CURR-04
2. Phase 21 VERIFICATION.md contains current-milestone content (not stale v1.4 data)
3. Phase 22 SUMMARY frontmatter includes PAT-03, PAT-05, PAT-06 in `requirements_completed`
4. MLE-01 through MLE-07 are formally defined in REQUIREMENTS.md with traceability to Phase 25
5. REQUIREMENTS.md traceability table reflects all gap closure phase assignments

### Phase 28: Tech Debt Fixes

**Goal**: Fix code review findings from Phases 22 and 25 to eliminate known bugs and code quality issues
**Depends on**: Phase 26
**Gap Closure:** Addresses tech debt from v3.2 milestone audit

**Success Criteria** (what must be TRUE):

1. `handleRhythmTapComplete` in MixedLessonGame does not read stale `currentIndex` from closure (22-REVIEW HR-01)
2. `ArcadeRhythmGame` `scoredRef` excludes rest tiles — score cannot exceed 100 (22-REVIEW HR-02)
3. `validateGameTypePolicy` correctly handles boss-category mini-boss nodes (22-REVIEW MD-01)
4. `VEX_TO_OLD_NAME` is defined in one shared location, not duplicated (22-REVIEW LW-01)
5. `binaryToVexDurations` handles `qd` rest correctly (22-REVIEW MD-04)
6. `MixedLessonGame` line 134 safely handles empty `generated` array (25-VERIFICATION)

---

_Last updated: 2026-04-12 -- v3.2 gap closure phases added (26-28)_
