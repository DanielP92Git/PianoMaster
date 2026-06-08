---
gsd_state_version: 1.0
milestone: v3.5
milestone_name: Rhythm Pedagogy
status: completed
stopped_at: Phase 36 context gathered
last_updated: "2026-06-08T10:25:32.626Z"
last_activity: 2026-06-01
progress:
  total_phases: 1
  completed_phases: 1
  total_plans: 10
  completed_plans: 10
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-12 after v3.4 milestone)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** Phase 01 — refactor-rhythm-trail-pedagogical-ordering-restructure-units

## Current Position

Phase: 01
Plan: Not started
Status: Milestone complete
Last activity: 2026-06-01

### Quick Tasks Completed

| #          | Description                                                                     | Date       | Commit  | Directory                                                                                                           |
| ---------- | ------------------------------------------------------------------------------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| 260514-w1y | Merge rhythm trail nodes 1_1 and 1_2 into a single quarter-notes discovery node | 2026-05-14 | 8500313 | [260514-w1y-merge-rhythm-trail-nodes-1-1-and-1-2-int](./quick/260514-w1y-merge-rhythm-trail-nodes-1-1-and-1-2-int/) |
| 260524-l3r | Refactor Rhythm Unit 8 syncopation pedagogy and engagement (gsd-quick --full)   | 2026-05-24 | 28b92d4 | [260524-l3r-refactor-rhythm-unit-8-syncopation-pedag](./quick/260524-l3r-refactor-rhythm-unit-8-syncopation-pedag/) |

## Performance Metrics

**Velocity:**

- Total plans completed: ~252 (across 25 shipped milestones)
- 25 milestones shipped in 102 days (2026-01-31 to 2026-05-12)

## Deferred Items

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

### Phase 01 Execution Metrics

| Plan  | Duration | Tasks | Files | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----- | -------- | ----- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01-01 | 6 min    | 3     | 5     | Wave 0 validation layer (3 new lint rules + 7 sibling unit tests + 2 parity gates). `validateConceptPerUnit` RED on today's data by design; `freeNodes.parity` RED until 01-04.                                                                                                                                                                                                                                                      |
| 01-02 | 3 min    | 2     | 5     | Hidden Syncopation unit IDs renamed rhythm*8*_ → rhythm*synco*_ per D-10. Frees rhythm*8*\* numeric namespace for new U8 (3/4 Meter) in Wave 2. HIDDEN-V1 markers preserved with expanded 4-step re-enable checklist.                                                                                                                                                                                                                |
| 01-03 | 4 min    | 3     | 4     | Scaffolding card + unit-name locale infrastructure. EN+HE `game.discovery.cards.*` tree authored for all 12 concepts (89 paths each, exact parity). 7 new unit display names added to EN+HE trail.json (3 pre-existing preserved). Parity test substantively GREEN (was vacuous). Kodaly nikud verbatim.                                                                                                                             |
| 01-04 | 7 min    | 2     | 3     | Atomic Supabase migration authored (BEGIN/COMMIT wraps scoped rhythm wipe + `is_free_node()` body swap with 6-ID U1 whitelist per D-12). JS FREE_RHYTHM_NODE_IDS updated 4→5 IDs; new FREE_BOSS_RHYTHM_NODE_IDS export spread into FREE_NODE_IDS Set. freeNodes.parity test RED→GREEN. Migration committed to repo, NOT applied (Plan 01-10 owner-gated). Pre-existing subscriptionConfig.test.js stale assertions updated (Rule 1). |

## Decisions (Phase 01)

- **01-01:** Console.error spy per-test (not `hasErrors` module flag) for validator rule assertions — prevents state leak across describe blocks
- **01-01:** Extend `vitest.config.js` `include` glob to discover `scripts/**/__tests__/*.{test,spec}.{js,mjs}` — Rule 3 deviation, sibling-test pattern for script-level validators
- **01-01:** Meter-unit branch in `validateConceptPerUnit` uses strict allowlist `{q, qd, 8}` against any non-4/4 timeSignature — no separate meter family map
- **01-01:** U10 hard exemption (`unit === 10` skip) in `validateConceptPerUnit` per D-11 single cumulative review boss
- **01-02:** Top-of-file rename history comment in `rhythmUnit8Redesigned.js` documents the rhythm*8*_ → rhythm*synco*_ migration + D-10 source decision
- **01-02:** HIDDEN-V1 lead comment expanded from single sentence to 4-step re-enable checklist (uncomment import, uncomment both spreads, add RHYTHM_SYNCO UNITS entry pre-authored by Plan 08, update CLAUDE.md node counts)
- **01-02:** trail.json EN+HE unit8Nodes block keys renamed in lockstep with source (not removed) — they are direct ID references, not display-name keys, so leaving them in place would collide with new U8 namespace
- **01-03:** Auto-selected option-a in Task 1 checkpoint — planner front-loaded a complete q example in EN+HE with kid-friendly voice; sequential executor mode with no human-loop available made option-a the recommended path per checkpoint protocol
- **01-03:** Variable card-count per concept (3 vs 4) — duration concepts get full 4-card arc (meet/sound/music/ready); rests (qr/hr/wr) and meters (3_4/6_8) skip 'sound' (rest = silence, meter is structural). Honors D-07 2–4 envelope while keeping every card semantically meaningful
- **01-03:** Reused user-confirmed Hebrew Kodaly nikud verbatim in card body text (טָה, טָה-אָה, טי-טי, טָה-פָה-טֶה-פֶה) — never invented new diacritics. `game.discovery.syllableOverride.*` subtree verified byte-identical via git diff (zero deletions, only additions of identical nikud forms in new contexts)
- **01-03:** Orphan unit display names (Quarter & Half Notes, Rests, Dotted Notes & 3/4 Time, Syncopation, Steady Beat) deliberately NOT removed — they may still be referenced by current rhythm unit data files that Wave 2 replaces. Plan 01-10 cleanup will sweep when Wave 2 has fully landed
- **01-03:** TDD RED→GREEN split commits for locale parity (EN-only RED commit `ad52a47` → HE counterparts GREEN commit `edf5fac`) — makes the parity gate's enforcement visible in git history as a permanent audit trail
- **01-04:** Case A boss-routing chosen (new FREE_BOSS_RHYTHM_NODE_IDS sub-export spread into FREE_NODE_IDS) over Case B (inline ID in Set construction) — smallest structural delta from existing per-category-array pattern; extensible for future free-boss additions without re-architecting
- **01-04:** Pre-existing subscriptionConfig.test.js Rule 1 fix — three hardcoded assertions (`PAYWALL_BOSS_NODE_IDS.toHaveLength(5)`, `FREE_NODE_IDS.size === 23`, `FREE_TIER_SUMMARY.total === 23`/`bossNodeCount === 5`) pinned pre-D-12 counts and would block CI; updated in lockstep with Task 1 commit `a8f40aa`
- **01-04:** Migration filename uses `20260601000001` timestamp per plan instructions (today is 2026-06-01); single atomic transaction per D-13 (rhythm wipe + is_free_node body swap inseparable so partial-apply impossible)
- **01-04:** Defense-in-depth `RAISE EXCEPTION` post-flight invariant — if any rhythm rows survive DELETE the transaction aborts; complements pre-flight RAISE NOTICE counts as a forensic audit pair

## Resolved Items

**DATA-02 (closed 2026-05-12)** — pulse hold path filter validation. Re-triage confirmed no action needed: `PulseQuestion.jsx` uses a hardcoded `PULSE_BEATS` constant (4 quarter notes) and never invokes `resolveByTags`. `MixedLessonGame.buildRhythmTapConfig()` does not emit a `beats` field for `pulse` questions, and `allowRests` / `patternNeedsRests` propagate only through the dictation path. The filter is structurally inapplicable to PulseQuestion.

**35-VALIDATION.md backfill (closed 2026-05-12)** — Nyquist validation strategy authored retroactively for Phase 35. `nyquist_compliant: true`. ARCADE-02 covered by existing `ArcadeRhythmGame.test.js` (12/12 passing) + grep-based source-of-truth checks recorded in 35-VERIFICATION.md; ARCADE-01 is a spike requirement (manual-only by nature, verdict artifact in 35-SPIKE.md).

**phase-33-WIP stash triage (closed 2026-05-12)** — Stash inspected and dropped. Chunks C (tag-based pattern resolution) and E (`boss_rhythm_7` `isBoss` flip) already on main via Phase 33 Plan 06 / BLOCKER-1 close. Chunks B (arcade hold-notes) + D (dynamic tile heights) are substantive unfinished feature work, captured in `.planning/BACKLOG-arcade-hold-notes-WIP.md` for future milestone scoping. Recommended approach when revisited: re-derive from PulseQuestion's shipped hold pattern rather than re-applying the (now-rebase-stale) diff.

**VITE_SUPABASE_URL test env failure (closed 2026-05-12)** — Added stub Supabase env values to `vitest.config.js` (`test.env: { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY }`). Verified by temporarily removing `.env` and running the previously-failing test files (`NoteSpeedCards.test.js`, `NotesRecognitionGame.autogrow.test.js`, `SightReadingGame.micRestart.test.jsx`) — all 24 tests green. Full suite remains green (1685/1685). Tests should never make real Supabase calls; stubs make tests deterministic regardless of `.env` presence.

## Session Continuity

**Next action:** Phase 01 Plan 01-04 complete (atomic Supabase migration + FREE_NODE_IDS D-12 sync). Ready to execute Plan 01-05 (Wave 2: Unit data U1-U3).

- `supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql` authored — BEGIN/COMMIT transaction, scoped DELETE on `student_skill_progress WHERE node_id LIKE 'rhythm_%' OR LIKE 'boss_rhythm_%'`, conditional `student_unit_progress` cleanup, `CREATE OR REPLACE is_free_node()` with 25-ID whitelist (D-12), pre/post-flight DO blocks with `RAISE EXCEPTION` invariant trip-wire
- Migration committed to repo at canonical path but NOT YET APPLIED — Plan 01-10 owner-gated `supabase db push` per D-13 deploy ordering
- `src/config/subscriptionConfig.js` updated in lockstep: `FREE_RHYTHM_NODE_IDS` = 5 IDs (1_1..1_5); new `FREE_BOSS_RHYTHM_NODE_IDS = ['boss_rhythm_1']`; `boss_rhythm_1` removed from `PAYWALL_BOSS_NODE_IDS`; `FREE_NODE_IDS` Set spreads `FREE_BOSS_RHYTHM_NODE_IDS`
- `FREE_TIER_SUMMARY`: rhythm 4→6, total 23→25, bossNodeCount 5→4
- `freeNodes.parity.test.js` GREEN (was RED after Plan 01-01) — JS Set membership exactly mirrors SQL whitelist
- `subscriptionConfig.test.js` 3 stale assertions updated to D-12 invariants (Rule 1 — would have broken CI otherwise)
- `npx vitest run src/config/` → 10/10 green
- Wave 2 (01-05..01-08) unit-data plans can reference `boss_rhythm_1` as free + `rhythm_1_5` as new U1 terminus; Plan 01-10 has migration artifact ready to apply

**Plan 01-03 context (still current):**

- `game.discovery.cards.*` tree authored in EN + HE common.json for all 12 concepts (q, qr, h, hr, w, wr, 8_pair, 16, hd, qd, 3_4, 6_8) — 89 paths each, exact key-for-key parity verified
- 7 new unit display names added to EN + HE trail.json (3 pre-existing preserved: Eighth Notes, Sixteenth Notes, Six-Eight Time)
- scaffolding-card-parity test transitioned from vacuously-passing → substantively-passing (was 0/0 paths, now 89/89 each)
- Kodaly nikud forms reused verbatim from `syllableOverride.*` in new card body text; `syllableOverride` subtree byte-identical
- `rhythm_synco_*` namespace from Plan 01-02 preserved

**Hidden Syncopation context (from 01-02, still current):**

- Hidden Syncopation unit IDs renamed: `rhythm_8_1..6` → `rhythm_synco_1..6`, `boss_rhythm_8` → `boss_rhythm_synco`
- `rhythm_8_*` / `boss_rhythm_8` numeric namespace is now FREE across src/, scripts/, supabase/, public/ (only 2 doc references remain — rename-history comment + describe label, neither a code-path ID reference)
- HIDDEN-V1 markers in `src/data/expandedNodes.js` preserved with expanded 4-step re-enable checklist naming Plan 08 as RHYTHM_SYNCO UNITS pre-author
- trail.json EN+HE `unit8Nodes` block keys renamed in lockstep
- `npm run verify:trail` introduces ZERO new failures (still RED on pre-existing U1/U4/U5 concept-per-unit + 3 orphan-tag warnings — both Wave 0 known states from Plan 01-01)

**Stopped at:** Phase 36 context gathered
**Resume file:** .planning/phases/36-game-screen-ui-unification/36-CONTEXT.md

---

_State updated: 2026-06-01 — Plan 01-04 complete. Atomic Supabase migration authored (rhythm wipe + is_free_node() body swap per D-13). JS FREE_NODE_IDS Set synced with SQL whitelist; freeNodes.parity test GREEN. Migration NOT applied (Plan 01-10 owner-gated). Ready to execute Plan 01-05 (Wave 2: Unit data U1-U3)._
