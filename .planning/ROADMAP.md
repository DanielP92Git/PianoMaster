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
- **v3.3 Rhythm Trail Fix & Polish** — Phases 29-32 (in progress)

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

<details>
<summary>v3.2 Rhythm Trail Rework (Phases 20-28) -- SHIPPED 2026-04-13</summary>

- [x] **Phase 20: Curriculum Audit** - Audit all 56 rhythm nodes and lock game-type policy before touching any files (completed 2026-04-11)
- [x] **Phase 21: Pattern Library Construction** - Author ~120+ hand-crafted tagged patterns as a new synchronous JS module (completed 2026-04-11)
- [x] **Phase 22: Service Layer & Trail Wiring** - Wire generator, unit files, game components, and validator as a coordinated change (completed 2026-04-12)
- [x] **Phase 23: UX Polish** - Widen timing thresholds, rename games, replace MISS text, add measure length progression, and render Kodaly syllables (completed 2026-04-09)
- [x] **Phase 24: Multi-Angle Rhythm Games** - Visual recognition + syllable matching games for rhythm trail nodes (completed 2026-04-09)
- [x] **Phase 25: Unified Mixed Lesson Engine** - Duolingo-style interleaved lesson engine for trail nodes (completed 2026-04-09)
- [x] **Phase 26: Restore Phase 23 UX Regression** - Restore 12 files reverted by commit 13cff54; fix all UX + integration regressions (completed 2026-04-13)
- [x] **Phase 27: Verification & Traceability Cleanup** - Skipped — carried to v3.3 (completed N/A)
- [x] **Phase 28: Tech Debt Fixes** - Skipped — CODE-01/02/03 carried to v3.3 Phase 29 (completed N/A)

</details>

### v3.3 Rhythm Trail Fix & Polish

**Milestone Goal:** Fix known audio bugs, data/curriculum errors, and code quality issues from v3.2, then tune gameplay so long notes require sustained press, speed challenge has appropriate variety, boss nodes feel distinctly harder, and pattern nodes are meaningfully differentiated.

#### Phases

- [x] **Phase 29: Code Quality & Data Fixes** - Fix stale-closure and score-cap bugs, guard empty arrays, correct unit data errors and section titles (completed 2026-04-13)
- [x] **Phase 30: Audio Fixes** - Pre-warm audio context, fix dictation listen-button, fix eighths discovery audio sequencing (completed 2026-04-13)
- [x] **Phase 31: Long-Press Sustain** - Implement piano-like sustained press for half/whole notes in listen&tap, pulse, and rhythm reading games (completed 2026-04-14)
- [x] **Phase 32: Game Design Differentiation** - Tune speed challenge variety and count, redesign boss nodes, differentiate pattern nodes from practice nodes (completed 2026-04-20)

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

### Phase 26: Restore Phase 23 UX Regression

**Goal**: Restore all 12 source files reverted by commit 13cff54 to their Phase 23 state — fixing all UX requirements, integration gaps, and broken E2E flows
**Depends on**: Phase 23, Phase 22
**Requirements**: UX-01, UX-02, UX-03, UX-04, UX-05, PAT-04, PAT-06
**Gap Closure:** Closes gaps from v3.2 milestone audit
**Plans:** 2/2 plans complete

Plans:

- [x] 26-01-PLAN.md — Timing forgiveness, game rename, "Almost!" feedback, pulse i18n
- [x] 26-02-PLAN.md — Multi-stave display, resolveByTags, syllable toggle, measure count validator

**Success Criteria** (what must be TRUE):

1. `EASY_NODE_TYPES` and `BASE_TIMING_THRESHOLDS_EASY` exist in rhythmTimingUtils.js; `scoreTap()` accepts `nodeType` param (UX-01)
2. i18n shows "Listen & Tap" (EN) and Hebrew equivalent; `useDocumentTitle` default updated (UX-02)
3. i18n shows "Almost!" (EN) and Hebrew equivalent — "MISS" does not appear in rhythm game UI (UX-03)
4. RhythmStaffDisplay accepts `measures` prop; RhythmReadingGame passes `trailMeasureCount`; `validateMeasureCountPolicy()` exists in validator (UX-04)
5. `beatsToVexNotes` accepts syllable params with Annotation imports; RhythmStaffDisplay accepts syllable props; games have syllable toggle (UX-05)
6. RhythmReadingGame imports `resolveByTags` from RhythmPatternGenerator (PAT-04)
7. Pulse exercise type has i18n key in trail.json for Hebrew (integration gap 4)

### Phase 29: Code Quality & Data Fixes

**Goal**: Known bugs from v3.2 code review are eliminated and unit data errors that cause wrong patterns or incorrect section labels are corrected
**Depends on**: Phase 26 (v3.2 complete)
**Requirements**: CODE-01, CODE-02, CODE-03, DATA-01, DATA-02, DATA-03, DATA-04
**Plans:** 2/2 plans complete

Plans:

- [x] 29-01-PLAN.md — Fix stale-closure, score-cap, and empty-array bugs in game components
- [x] 29-02-PLAN.md — Add rest-aware pattern filtering, fix section titles, ensure duration variety

**Success Criteria** (what must be TRUE):

1. Tapping a rhythm answer in MixedLessonGame always advances to the correct next question — no question is skipped or repeated due to a stale-closure index read
2. Completing an ArcadeRhythmGame session with all notes correct (and any number of rests) shows exactly 100% score — the score cannot display above 100%
3. MixedLessonGame handles nodes with zero generated questions by showing an error or fallback rather than crashing
4. Playing node 1_3 never presents a rest value that has not yet been introduced to the child — only note values from completed prior nodes appear
5. The pulse game on a quarter-only node generates only quarter-note patterns — no half notes appear in the beat
6. Every section header on the rhythm trail accurately describes the nodes it contains — no section title mismatches its content
7. Combined-values practice nodes use all expected duration values and vary order across sessions — no single duration dominates every play

### Phase 30: Audio Fixes

**Goal**: All audio playback issues in rhythm games are resolved — patterns play on first attempt with no trimming, dictation listen button works on first click, and the eighths discovery plays its full sequence
**Depends on**: Phase 29
**Requirements**: AUDIO-01, AUDIO-02, AUDIO-03
**Plans:** 2/2 plans complete

Plans:

- [x] 30-01-PLAN.md — Fix dictation first-click audio (initializeAudioContext guard) + test scaffold
- [x] 30-02-PLAN.md — Fix eighths discovery to play 4 pairs with pitch alternation + test scaffold

**Success Criteria** (what must be TRUE):

1. The very first time a child opens a rhythm game in a session and taps play, the quarter or eighth note sound is heard in full with no audible clipping or silence at the start
2. Tapping the "Listen" button in a dictation game for the first time plays the pattern — the child does not need to tap "Replay" to hear the first playback
3. The eighths discovery presentation plays all 4 beamed eighth-note pairs in sequence — the child hears all 4 pairs, not just the first

### Phase 31: Long-Press Sustain

**Goal**: Half and whole notes in listen&tap and pulse exercises require the child to hold their finger down for the note's full duration, giving the game a piano-like physical feel
**Depends on**: Phase 30
**Requirements**: PLAY-01
**Plans**: 3 plans
**UI hint**: yes

Plans:

- [x] 31-01-PLAN.md — Hold scoring utility, HoldRing component, TapArea extension, i18n keys
- [x] 31-02-PLAN.md — RhythmTapQuestion hold integration (listen&tap game)
- [x] 31-03-PLAN.md — PulseQuestion hold integration + stretched beat indicator

**Success Criteria** (what must be TRUE):

1. Tapping and immediately releasing on a half note in listen&tap registers as incorrect — the child must hold for the note's duration to score a correct answer
2. Tapping and immediately releasing on a whole note in a pulse exercise registers as incorrect — sustained hold is required
3. A child holding a half note for the correct duration receives positive feedback equivalent to a correctly timed quarter-note tap
4. The hold-duration requirement scales with note value — a whole note requires roughly twice the hold time of a half note

### Phase 32: Game Design Differentiation

**Goal**: Speed challenge nodes have appropriately varied content and exercise count for kids, boss nodes feel distinctly harder than regular nodes, and rhythm pattern nodes offer a meaningfully different experience from practice nodes
**Depends on**: Phase 31
**Requirements**: PLAY-02, PLAY-03, PLAY-04
**Plans**: 3 plans

Plans:

- [x] 32-01-PLAN.md — Speed challenge session length (8 patterns) and variety enforcement
- [x] 32-02-PLAN.md — Remove 6 Mix-Up nodes, cascade renumbering, update subscription config and tests
- [x] 32-03-PLAN.md — Boss difficulty tuning (cumulative durations, timing tier, question mix, measureCount) + PEDAGOGY.md

**Success Criteria** (what must be TRUE):

1. Playing a speed challenge node presents a set of varied patterns — no two consecutive questions are identical, and the total exercise count is appropriate for a child's attention span
2. Playing a boss node presents a noticeably harder challenge than the practice nodes in the same unit — it uses a wider duration set, longer patterns, or a higher tempo
3. Playing a rhythm pattern node presents content that feels distinct from its neighbouring practice node — it is not a duplicate of the practice node's question sequence
4. After completing a speed challenge, a boss node, and a practice node in the same unit, the child can describe each as a different kind of challenge

## Progress

| Phase                              | Milestone | Plans Complete | Status   | Completed  |
| ---------------------------------- | --------- | -------------- | -------- | ---------- |
| 20. Curriculum Audit               | v3.2      | 1/1            | Complete | 2026-04-11 |
| 21. Pattern Library Construction   | v3.2      | 1/1            | Complete | 2026-04-11 |
| 22. Service Layer & Trail Wiring   | v3.2      | 5/5            | Complete | 2026-04-12 |
| 23. UX Polish                      | v3.2      | 3/3            | Complete | 2026-04-09 |
| 24. Multi-Angle Rhythm Games       | v3.2      | 3/3            | Complete | 2026-04-09 |
| 25. Unified Mixed Lesson Engine    | v3.2      | 3/3            | Complete | 2026-04-09 |
| 26. Restore Phase 23 UX Regression | v3.2      | 2/2            | Complete | 2026-04-13 |
| 27. Verification & Traceability    | v3.2      | —              | Skipped  | —          |
| 28. Tech Debt Fixes                | v3.2      | —              | Skipped  | —          |
| 29. Code Quality & Data Fixes      | v3.3      | 2/2            | Complete | 2026-04-13 |
| 30. Audio Fixes                    | v3.3      | 2/2            | Complete | 2026-04-13 |
| 31. Long-Press Sustain             | v3.3      | 3/3            | Complete | 2026-04-14 |
| 32. Game Design Differentiation    | v3.3      | 3/3            | Complete | 2026-04-20 |

**Total: 23 milestones shipped, 102 phases, ~218 plans | v3.3: 4 phases, 3/4 complete**

### Phase 33: Rhythm Issues Cleanup

**Goal:** Triage and resolve the 13 rhythm UAT issues from Phases 30-32 — verify-first manual UAT, fix only confirmed survivors. Ship rate-limit migration, data audit cleanup (rest pool + section/title drifts), ArcadeRhythmGame migration to tag-based pattern resolution with central duration filter and per-session duration coverage rule, dictation-listen race fix via shared audio prewarm hook. Hold contingent boss UX overlay + cumulative speed-pool tag layers ready to fire only if user retest still reports flatness.
**Requirements**: AUDIO-01, AUDIO-02, AUDIO-03, DATA-01, DATA-03, DATA-04, PLAY-02, PLAY-03 (cleanup pass over Phases 30/31/32)
**Depends on:** Phase 32
**Plans:** 7/10 plans executed

Plans:

- [x] 33-01-PLAN.md — Pre-flight UAT scaffold + verify:trail + boss measureCount audit (Wave 0)
- [x] 33-02-PLAN.md — Wave 1 manual UAT execution (Wave 1; gates Wave 2/3)
- [x] 33-03-PLAN.md — D-13 prewarm hook + dictation race fix (Wave 2; D-13/D-16/AUDIO-02)
- [x] 33-04-PLAN.md — D-08/D-11/D-12 data audit edits (Wave 2; DATA-01/DATA-03)
- [x] 33-05-PLAN.md — D-07 rate-limit migration deploy (Wave 2; UAT issue 6)
- [x] 33-06-PLAN.md — Stash Chunk A salvage + D-09 + D-10 (Wave 2; DATA-04/PLAY-02)
- [x] 33-07-PLAN.md — D-14/D-15 audio buffer hardening (Wave 2 contingent; AUDIO-01/AUDIO-03)
- [ ] 33-08-PLAN.md — D-18 boss intro overlay + victory VFX (Wave 3 contingent; PLAY-03)
- [ ] 33-09-PLAN.md — D-19 cumulative speed-pool tags (Wave 3 contingent; PLAY-02)
- [ ] 33-10-PLAN.md — Final UAT + STATE/ROADMAP/REQUIREMENTS update (Wave 4)

---

_Last updated: 2026-05-03 -- Phase 33 planned (10 plans, 5 waves; 3 contingent on UAT outcome)_
