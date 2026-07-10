---
gsd_state_version: 1.0
milestone: v3.7
milestone_name: Sight-Reading Engagement & Pedagogy
status: executing
stopped_at: Phase 02 context gathered
last_updated: "2026-07-10T06:11:18.740Z"
last_activity: 2026-07-10 -- Phase 02 execution started
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 11
  completed_plans: 2
  percent: 18
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-09 after v3.7 milestone opened)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** Phase 02 — practice-tooling

## Current Position

Phase: 02 (practice-tooling) — EXECUTING
Plan: 1 of 9
Status: Executing Phase 02
Last activity: 2026-07-10 -- Phase 02 execution started

Progress: [██████████] 100%

### Quick Tasks Completed

| #          | Description                                                                     | Date       | Commit   | Directory                                                                                                           |
| ---------- | ------------------------------------------------------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| 260514-w1y | Merge rhythm trail nodes 1_1 and 1_2 into a single quarter-notes discovery node | 2026-05-14 | 8500313  | [260514-w1y-merge-rhythm-trail-nodes-1-1-and-1-2-int](./quick/260514-w1y-merge-rhythm-trail-nodes-1-1-and-1-2-int/) |
| 260524-l3r | Refactor Rhythm Unit 8 syncopation pedagogy and engagement (gsd-quick --full)   | 2026-05-24 | 28b92d4  | [260524-l3r-refactor-rhythm-unit-8-syncopation-pedag](./quick/260524-l3r-refactor-rhythm-unit-8-syncopation-pedag/) |
| 260614-5wj | Unify Listen & Tap (MetronomeTrainer) HUD with other games per Phase 36         | 2026-06-14 | df2bdff4 | [260614-5wj-make-listen-and-tap-game-ui-consistent-w](./quick/260614-5wj-make-listen-and-tap-game-ui-consistent-w/) |

## Performance Metrics

**Velocity:**

- Total plans completed: ~252 (across 27 shipped milestones)
- 27 milestones shipped in 102 days (2026-01-31 to 2026-06-29, plus v3.6 out-of-order close on 2026-06-14)

### Phase 01 Execution Metrics (v3.7)

| Plan  | Duration | Tasks | Files | Notes                                                                                                                                                                                                                              |
| ----- | -------- | ----- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01-01 | 6 min    | 3     | 2     | Session-wide combo/on-fire state added to `SightReadingSessionContext` (ref+state double-write, D-06). Task 3 (HUD-02 deferral) already satisfied from context-gathering, no edit needed.                                          |
| 01-02 | 15 min   | 2     | 3     | Wired `incrementCombo()`/`resetCombo()` into the two existing record sites in `SightReadingGame.jsx`; rendered `ComboPill`/`OnFireBadge`/`OnFireSplash` in HUD + root. No fire sound (mic-safety). Full suite green (1975 passed). |

## Deferred Items

Items acknowledged and deferred at **v3.5 milestone close on 2026-06-29** (artifact audit `audit-open`, 12 items — all pre-existing or stale-status; none a functional v3.5 gap):

| Category     | Item                                                            | Status                                                                                                    |
| ------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| verification | Phase 01 `01-VERIFICATION.md` flagged `human_needed`            | Stale flag — superseded by passed v3.5 milestone audit + completed SC-9 UAT (`5e3f9e86`, 2 pass/0 issues) |
| debug        | `assignment-update-400` debug session [investigating]           | Unrelated teacher-dashboard `assign_to` column bug from 2026-04-08; long-standing carry-over              |
| quick_task   | `1-fix-sight-reading-feedback-panel-spacing` [missing]          | Historical quick task; status field unparseable                                                           |
| quick_task   | `260326-mrm-add-install-app-button-to-settings-insta` [missing] | Historical quick task; status field unparseable                                                           |
| quick_task   | `260326-s6x-fix-sight-reading-pattern-generation-for` [missing] | Historical quick task; status field unparseable                                                           |
| quick_task   | `260326-td5-fix-sight-reading-sharp-pattern-generati` [missing] | Historical quick task; status field unparseable                                                           |
| quick_task   | `260326-wo7-add-note-staff-image-and-mini-keyboard-i` [missing] | Historical quick task; status field unparseable                                                           |
| quick_task   | `260504-jbu-fix-three-rhythm-trail-bugs-1-meet-the-q` [missing] | Historical quick task; status field unparseable                                                           |
| quick_task   | `260514-w1y-merge-rhythm-trail-nodes-1-1-and-1-2-int` [missing] | Completed (commit 8500313, logged in Quick Tasks table); auditor status field unparseable                 |
| quick_task   | `260523-ugm-insert-q-h-q-syncopation-as-gentler-intr` [missing] | Historical quick task; status field unparseable                                                           |
| quick_task   | `260524-l3r-refactor-rhythm-unit-8-syncopation-pedag` [missing] | Completed (commit 28b92d4, logged in Quick Tasks table); auditor status field unparseable                 |
| quick_task   | `260614-5wj-make-listen-and-tap-game-ui-consistent-w` [missing] | Completed (commit df2bdff4, logged in Quick Tasks table); auditor status field unparseable                |

Net-new tech debt from v3.5 (non-blocking): stale `subscriptionConfig.js` header comment citing `rhythmUnit1Redesigned.js` (IDs correct); `student_daily_goals.node_id` stale rhythm refs not cleaned by migration (self-heal on next regeneration).

---

Items acknowledged and deferred at v3.4 milestone close on 2026-05-12:

| Category  | Item                                                                                                 | Status                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| process   | No formal 34-VERIFICATION.md — UAT delta serves as gate                                              | Functional verification complete via owner-signed UAT walkthrough        |
| process   | 9 of 16 Phase 34 requirements not listed in any plan SUMMARY `requirements-completed`                | Audit cross-reference gap; functional verification complete              |
| cleanup   | RhythmGameSettings.jsx dead code (@deprecated, no UI consumer)                                       | Removable in future cleanup pass                                         |
| deferred  | UnifiedGameSettings cross-cutting responsive concerns (D-10 OOS)                                     | Future shared-setup-screen milestone                                     |
| deferred  | Notes-master responsive (NM-01) — NotesRecognitionGame, MemoryGame, SightReadingGame, NoteSpeedCards | Future milestone using same NeedsLandscapeContext infra                  |
| deferred  | Ear-training responsive (ET-01) — NoteComparisonGame, IntervalGame                                   | Quick task candidate (small surface)                                     |
| bug       | ArcadeRhythmGame mid-game rotation regression (laneHeightRef cache not refreshed)                    | Pre-existing, lower risk under ROTATE-PROMPT path; 35-SPIKE.md Follow-up |
| tech-debt | Card-internal staff cropping in trail-mode dictation entry                                           | Renderer-level concern, deferred                                         |
| flake     | rhythmUnit8Redesigned.test.js > rhythm_2_4 probabilistic flake                                       | Pre-existing; future RNG seed quick task                                 |

**Carried from prior milestones (still open):**

| Category  | Item                                                                                           | Origin |
| --------- | ---------------------------------------------------------------------------------------------- | ------ |
| warning   | WARNING-1 — DiscoveryIntroQuestion not on shared prewarm hook                                  | v3.3   |
| info      | INFO-1 — dictation→rhythm_tap silent fallback (no allowRests)                                  | v3.3   |
| tech-debt | No VERIFICATION.md for Phases 31, 32                                                           | v3.3   |
| tech-debt | 8 unhandled rejections in ArcadeRhythmGame.test.js (pre-existing getOrCreateAudioContext mock) | v3.3   |
| process   | Worktree base-staleness recurring concern                                                      | v3.3   |
| process   | Pre-deploy gate would have caught two post-deploy survivors                                    | v3.3   |
| infra     | Pre-existing lint parse error: ParentZoneEntryCard.test.jsx:32 (await outside async)           | v3.4   |

### Phase 01 Execution Metrics (v3.5, historical)

| Plan  | Duration | Tasks | Files | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----- | -------- | ----- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01-01 | 6 min    | 3     | 5     | Wave 0 validation layer (3 new lint rules + 7 sibling unit tests + 2 parity gates). `validateConceptPerUnit` RED on today's data by design; `freeNodes.parity` RED until 01-04.                                                                                                                                                                                                                                                      |
| 01-02 | 3 min    | 2     | 5     | Hidden Syncopation unit IDs renamed rhythm*8*_ → rhythm*synco*_ per D-10. Frees rhythm*8*\* numeric namespace for new U8 (3/4 Meter) in Wave 2. HIDDEN-V1 markers preserved with expanded 4-step re-enable checklist.                                                                                                                                                                                                                |
| 01-03 | 4 min    | 3     | 4     | Scaffolding card + unit-name locale infrastructure. EN+HE `game.discovery.cards.*` tree authored for all 12 concepts (89 paths each, exact parity). 7 new unit display names added to EN+HE trail.json (3 pre-existing preserved). Parity test substantively GREEN (was vacuous). Kodaly nikud verbatim.                                                                                                                             |
| 01-04 | 7 min    | 2     | 3     | Atomic Supabase migration authored (BEGIN/COMMIT wraps scoped rhythm wipe + `is_free_node()` body swap with 6-ID U1 whitelist per D-12). JS FREE_RHYTHM_NODE_IDS updated 4→5 IDs; new FREE_BOSS_RHYTHM_NODE_IDS export spread into FREE_NODE_IDS Set. freeNodes.parity test RED→GREEN. Migration committed to repo, NOT applied (Plan 01-10 owner-gated). Pre-existing subscriptionConfig.test.js stale assertions updated (Rule 1). |

## Decisions (v3.7)

- **Roadmap:** 3-phase split is owner-agreed and fixed (P1 HUD parity → P2 practice tooling → P3 adaptive pedagogy). Phase numbering restarts at 01 for this milestone (milestone-scoped numbering convention).
- **Roadmap:** I18N-01 attached as a cross-cutting success criterion on all 3 phases rather than its own phase — every phase ships its own new strings in EN+HE.
- **Roadmap:** Phase 03 is the only phase touching Supabase (JSONB per-note-mastery field); it gets its own `/gsd-secure-phase` pass before merge, mirroring the security rigor applied to `student_skill_progress` elsewhere in the codebase.
- **01-01:** Combo/isOnFire kept as sibling `useState`/`useRef` pairs outside the existing state blob in `SightReadingSessionContext`, matching `NotesRecognitionGame`'s precedent rather than nesting inside `createInitialState()`.
- **01-01:** `ON_FIRE_THRESHOLD = 5` defined locally in `SightReadingSessionContext.jsx` (D-06) — reused verbatim from `NotesRecognitionGame`'s module-level constant rather than imported (not exported there).
- **01-02:** No fire sound wired for the on-fire celebration — sight-reading runs continuous mic pitch-detection during PERFORMANCE, and an audible oscillator blip (as used in `NotesRecognitionGame`) risks a phantom mic detection / false note; the splash + badge deliver the celebration safely without touching audio.
- **01-02:** `isOnFire` passed to `ComboPill` (diverges from `NotesRecognitionGame`'s own usage, which omits it) — surfaces a double signal (dedicated `OnFireBadge` + `ComboPill`'s own flame-icon swap), intentional per "maximum motivational juice" framing (RESEARCH.md).

## Resolved Items

**DATA-02 (closed 2026-05-12)** — pulse hold path filter validation. Re-triage confirmed no action needed: `PulseQuestion.jsx` uses a hardcoded `PULSE_BEATS` constant (4 quarter notes) and never invokes `resolveByTags`. `MixedLessonGame.buildRhythmTapConfig()` does not emit a `beats` field for `pulse` questions, and `allowRests` / `patternNeedsRests` propagate only through the dictation path. The filter is structurally inapplicable to PulseQuestion.

**35-VALIDATION.md backfill (closed 2026-05-12)** — Nyquist validation strategy authored retroactively for Phase 35. `nyquist_compliant: true`. ARCADE-02 covered by existing `ArcadeRhythmGame.test.js` (12/12 passing) + grep-based source-of-truth checks recorded in 35-VERIFICATION.md; ARCADE-01 is a spike requirement (manual-only by nature, verdict artifact in 35-SPIKE.md).

**phase-33-WIP stash triage (closed 2026-05-12)** — Stash inspected and dropped. Chunks C (tag-based pattern resolution) and E (`boss_rhythm_7` `isBoss` flip) already on main via Phase 33 Plan 06 / BLOCKER-1 close. Chunks B (arcade hold-notes) + D (dynamic tile heights) are substantive unfinished feature work, captured in `.planning/BACKLOG-arcade-hold-notes-WIP.md` for future milestone scoping. Recommended approach when revisited: re-derive from PulseQuestion's shipped hold pattern rather than re-applying the (now-rebase-stale) diff.

**VITE_SUPABASE_URL test env failure (closed 2026-05-12)** — Added stub Supabase env values to `vitest.config.js` (`test.env: { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY }`). Verified by temporarily removing `.env` and running the previously-failing test files (`NoteSpeedCards.test.js`, `NotesRecognitionGame.autogrow.test.js`, `SightReadingGame.micRestart.test.jsx`) — all 24 tests green. Full suite remains green (1685/1685). Tests should never make real Supabase calls; stubs make tests deterministic regardless of `.env` presence.

## Session Continuity

**Next action:** Phase 01 (Engagement HUD Parity) is fully executed (Plans 01-01, 01-02) and ready for verification. Run `/gsd-verify-phase 01` (or equivalent phase-close step), then plan Phase 02 (Practice Tooling) via `/gsd-plan-phase 02`. Phase 03 additionally requires a `/gsd-secure-phase` pass before merge (JSONB per-note-mastery field on the student progress row, under RLS).

**Historical context (v3.5 Phase 01, retained for reference):**

- `supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql` applied to production 2026-06-28 — rhythm wipe + `is_free_node()` body swap, `total_xp` preserved.
- Hidden Syncopation renamed `rhythm_8_*` → `rhythm_synco_*`; HIDDEN-V1 4-step re-enable checklist in `src/data/expandedNodes.js`.
- `game.discovery.cards.*` EN+HE tree authored for all 12 rhythm concepts (89 paths each, exact parity), Kodaly nikud reused verbatim.

**Stopped at:** Phase 02 context gathered
**Resume file:** .planning/phases/02-practice-tooling/02-CONTEXT.md

---

_State updated: 2026-07-09 — v3.7 Sight-Reading Engagement & Pedagogy roadmap created: 3 phases (01 Engagement HUD Parity, 02 Practice Tooling, 03 Adaptive Pedagogy), 12/12 v1 requirements mapped, 0 gaps. Next: `/gsd-plan-phase 01`._
