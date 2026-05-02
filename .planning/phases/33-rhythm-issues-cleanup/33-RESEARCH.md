# Phase 33: Rhythm Issues Cleanup - Research

**Researched:** 2026-05-03
**Domain:** Rhythm games (audio infrastructure, pattern generation, unit data, UX polish)
**Confidence:** HIGH (codebase + WIP stash + prior-phase docs all read directly; no external lookups required for verify-first triage)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Triage & Scope**

- D-01: Verify-first, fix-only-survivors. Do not re-fix already-fixed code.
- D-02: Triage doc + manual UAT confirmation. Researcher writes "expected per current code" + "repro steps"; user marks confirmed/resolved.
- D-03: Survivors of shipped phases are fair game for Phase 33; do NOT reopen Phase 30/31/32.
- D-04: Issue 11 (rhythm pattern feels same as practice) — DROPPED outright (Phase 32 D-11 removed all 6 Mix-Up nodes).
- D-05: Issue 12's session-length subclaim — DROPPED (Phase 32 D-01 already reduced TOTAL_PATTERNS to 8). The "no halves variety" subclaim still gets retested.
- D-06: Done bar = all confirmed-survivor bugs fixed + manual UAT passes. Manual playthrough is the gate; no automated regression-test requirement.
- D-07: Rate-limit migration `20260201000002_add_rate_limiting.sql` IN scope; deploy to remote Supabase as part of Phase 33.

**Curriculum & Data Integrity**

- D-08: Full audit across all 8 rhythm unit files + pattern library. Flag every mismatch.
- D-09: Enforce node-allowed durations in `RhythmPatternGenerator` (the new src/data/patterns/ one) — single central fix at the resolution layer.
- D-10: Combined-values variety = "at least one pattern per declared duration per session" + Phase 32 D-02 no-consecutive-identical.
- D-11: Section/content title mismatches resolved via audit, not user-named list.
- D-12: For node 1_3 rests, fix at the pattern-tag pool level — remove rest-containing patterns from `quarter-half` tag pool.

**Audio Bugs**

- D-13: Dictation-listen-in-MIXED_LESSON fix uses a shared prewarm hook (`useEnsureAudioReady` or equivalent).
- D-14: First-play trim — investigate scheduler buffer + actual audio start time. Pending triage confirmation.
- D-15: Eighths first-play (issue 4) — triage will confirm whether AUDIO-03's 4-pair-with-pitch-alternation actually shipped. Plan covers either case.
- D-16: Hardening scope = only renderers that reproduce a bug. No preemptive prewarm rollout.

**Boss & Speed Challenge Feel**

- D-17: Retest Phase 32 first; UX layer is contingent.
- D-18: Contingent boss UX = intro overlay + victory VFX (no new mechanics, no music swap).
- D-19: Contingent speed-pool fix = mirror Phase 32 boss D-06 cumulative-units logic.
- D-20: Plan must hold both contingent fixes ready as conditional plans.

### Claude's Discretion

- Exact name/signature of shared prewarm hook
- Whether D-09 filter goes inside `resolveByTags()` or wraps it
- Concrete algorithm for "at least one pattern per declared duration"
- Exact triage doc structure
- How to weight focusDurations vs contextDurations in D-10
- Visual treatment of boss intro overlay/VFX (if D-18 fires) — copy Phase 23 patterns
- Concrete buffer increase value for D-14 if confirmed
- Whether to add `excludeDurations` config field as belt-and-suspenders behind D-09/D-12
- Order of execution: triage → audio fixes → data audit → contingent UX, vs. fully parallel

### Deferred Ideas (OUT OF SCOPE)

- Automated regression test suite for rhythm games
- Boss-specific music sting / theatrical music swap
- Hand-authored pattern variation library expansion
- `excludeDurations` config field on rhythmConfig
- Per-node `TOTAL_PATTERNS` override
- Proactive audio prewarm hardening across ALL rhythm renderers
- Curriculum redesign to introduce rests in Unit 1
- `RHYTHM_COMPLEXITY` enum cleanup (still flagged from Phase 32 D-17)
  </user_constraints>

<phase_requirements>

## Phase Requirements

Phase 33 has no newly-pinned requirement IDs in REQUIREMENTS.md. The traceability table still lists AUDIO-01..03, DATA-01..04, PLAY-01..04, CODE-01..03 against phases 29–32 with status "Pending" (the table was never updated post-implementation — codebase verification below shows most are actually shipped). Phase 33 is a cleanup pass over those Phase-30/31/32 deliveries.

| ID       | Description                                                 | Triage verdict (this research)                                                                                                                       | Research support                |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| AUDIO-01 | First-play no audio trim                                    | LIKELY-RESOLVED in PulseQuestion (warmup oscillator at line 561-573); UNCONFIRMED for DiscoveryIntroQuestion + RhythmDictationQuestion               | Audio Trace section             |
| AUDIO-02 | Dictation `Listen` works on first click                     | LIKELY-RESOLVED standalone; SUSPECT inside MIXED_LESSON (gainNodeRef race)                                                                           | Issue 7 trace                   |
| AUDIO-03 | Eighths discovery plays 4 pairs of beamed eighths           | SHIPPED for `focusDuration: '8_pair'` (DiscoveryIntroQuestion lines 108-141); NOT for `focusDuration: '8'` (Unit 8 path)                             | DiscoveryIntroQuestion read     |
| DATA-01  | Node 1_3 patterns contain only learned values               | LIKELY-RESOLVED at filter level (`patternNeedsRests` in resolveByTags) — but only when callers pass durations correctly. NEEDS-MANUAL-UAT to confirm | Pattern audit                   |
| DATA-02  | Pulse in quarter-only nodes generates only quarter patterns | NOT-A-BUG-IN-CURRENT-CODE: PulseQuestion uses hardcoded `PULSE_BEATS` (4 quarters); user likely confused pulse with rhythm_tap. Confirm during UAT   | Pulse trace                     |
| DATA-03  | Section titles match content                                | UNCONFIRMED — covered by D-08/D-11 full audit                                                                                                        | Data Audit section              |
| DATA-04  | Combined-values shuffle                                     | LIKELY-BUG — D-09 filter resolves it; D-10 variety rule covers it                                                                                    | Issue 10 trace                  |
| PLAY-01  | Hold-press half/whole notes                                 | SHIPPED for PulseQuestion + RhythmTapQuestion; **NOT shipped for ArcadeRhythmGame** (covered by stashed WIP — see WIP Stash Review)                  | Stash diff                      |
| PLAY-02  | Speed Challenge variety + count                             | SHIPPED partially (TOTAL_PATTERNS=8 ✓, no-consecutive ✓, but pool variety still depends on `getPattern()` quirks)                                    | ArcadeRhythmGame.jsx:49,360-390 |
| PLAY-03  | Boss feels distinct                                         | SHIPPED at content level (cumulative tags + 4-bar + dictation-heavy + BOSS removed from EASY_NODE_TYPES). User-perceived flatness gates D-18         | Boss audit                      |
| PLAY-04  | Mix-Up nodes differentiated                                 | SHIPPED via removal (Phase 32 D-11) — Issue 11 dropped per D-04                                                                                      | rhythmUnit\*.js                 |

</phase_requirements>

## Summary

Phase 33 is a verify-first cleanup pass over Phases 30/31/32. Code review confirms most Phase 30/31/32 changes are actually shipped — the seed UAT report likely conflates a few real survivors (Issue 1, 4, 7, 8, 9) with already-resolved items the user re-noticed against a stale build memory. The highest-leverage technical work is **(a) the dictation-in-MixedLesson audio race in `RhythmDictationQuestion.handleListen`** and **(b) the divergent path between the OLD `getPattern()` (used by `ArcadeRhythmGame`, `MetronomeTrainer`, `RhythmDictationGame`, `RhythmReadingGame`) vs. the NEW `resolveByTags()` (used by `MixedLessonGame`, `RhythmReadingQuestion` renderer)**.

The data audit (D-08) found node 1_3 has the right config (`durations: ['q', 'h']`, `patternTags: ['quarter-half']`) and `resolveByTags` correctly filters rest-needing binaries via `patternNeedsRests` — but **the user reports rests appearing**, which means either (i) UAT was on a stale build, or (ii) the rest filter has a bug we haven't found, or (iii) the rests appeared in a renderer that doesn't go through `resolveByTags` (most rhythm renderers use `resolveByTags`/`resolveByAnyTag` now, but `ArcadeRhythmGame` is on the OLD `getPattern()` path which has its own duration-name filter).

**Primary recommendation:** Order of execution = triage UAT → fix surviving audio bugs (Issue 7 = MixedLesson dictation prewarm hook) → run data audit edits (rename mismatches + remove `tf_34_005`/`tf_34_007`/`qrest_*` style rest-only patterns from quarter-only/quarter-half tag pools) → migrate ArcadeRhythmGame to the same tag-based resolution path as MixedLessonGame (the WIP stash @{0} already implements this — partial salvage strongly recommended) → deploy rate-limit migration → contingent UX (D-18/D-19) only if user retest still flat.

## Architectural Responsibility Map

| Capability                                 | Primary Tier                                                           | Secondary Tier                                                               | Rationale                                                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Audio context lifecycle                    | `AudioContextProvider` (React Context)                                 | `useAudioEngine` hook                                                        | Single shared AudioContext; useAudioEngine wraps it per-component                                           |
| Pattern resolution (curated, by tag)       | `src/data/patterns/RhythmPatternGenerator.js`                          | `src/data/patterns/rhythmPatterns.js`                                        | Build-time-safe, Node-runnable, shared by `validateTrail.mjs`                                               |
| Pattern resolution (procedural fallback)   | `src/components/games/rhythm-games/RhythmPatternGenerator.js` (legacy) | curated JSON files (`/data/4-4.json` etc., **not present in repo**)          | Used by ArcadeRhythmGame, MetronomeTrainer, RhythmDictationGame, RhythmReadingGame for free-play / fallback |
| Pulse mechanic                             | `PulseQuestion.jsx` (hardcoded 4-quarter pulse)                        | `useAudioEngine` for clicks                                                  | Pedagogical choice — pulse is always 4 quarters, NOT pattern-driven                                         |
| Hold scoring                               | `holdScoringUtils.js` + `HoldRing.jsx` + renderers                     | `createPianoSound(duration)`                                                 | Phase 31 deliverable; integrated into PulseQuestion + RhythmTapQuestion; **MISSING in ArcadeRhythmGame**    |
| Trail node config (durations, patternTags) | `src/data/units/rhythmUnit*Redesigned.js`                              | `src/data/expandedNodes.js` (aggregator) + `src/data/skillTrail.js` (lookup) | Single source of truth                                                                                      |
| Pre-flight validation                      | `scripts/validateTrail.mjs`                                            | `npm run build` prebuild hook                                                | Runs `resolveByTags` against every node's tags+durations to catch dead pools                                |
| Rate limiting (XP submissions)             | `supabase/migrations/20260201000002_add_rate_limiting.sql`             | `students_score` insert path                                                 | DB-side enforcement; client just calls RPC                                                                  |

## 1. Triage Table

Verdicts: `CONFIRMED-BUG` (still reproduces) / `LIKELY-RESOLVED` (Phase 30/31/32 shipped a fix) / `NEEDS-MANUAL-UAT` (cannot determine without runtime test) / `DROPPED-PER-CONTEXT` / `NOT-A-BUG` (the reported behavior doesn't match what the code does).

| #   | Summary                                                                            | Verdict                                                                                                                                                                                                                                                | Fix surface (file:line)                                                                                                                                                                                                                                                                                                    | CONTEXT decision id                                                            |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Node 1_1 quarter intro: first-play missing 1 of 4 notes                            | NEEDS-MANUAL-UAT                                                                                                                                                                                                                                       | `DiscoveryIntroQuestion.jsx:59-145` (playDemo); `useAudioEngine.js:139-173` (`loadPianoSound` is fire-and-forget, fallback to synth click on first play if buffer not yet decoded)                                                                                                                                         | D-01, D-14, D-16                                                               |
| 2   | Node 1_3 still uses unlearned rests                                                | NEEDS-MANUAL-UAT (filter exists but user reports failure)                                                                                                                                                                                              | `src/data/patterns/RhythmPatternGenerator.js:177-208` (`patternNeedsRests`); should drop e.g. `qh_44_002` (onsets 1,2 in 4/4) for node 1_3                                                                                                                                                                                 | D-08, D-12                                                                     |
| 3   | Node 1_3 half-tap should require long press, not single tap                        | LIKELY-RESOLVED                                                                                                                                                                                                                                        | `PulseQuestion.jsx:172-177` (`isHoldNote`), `:436-510` (handlePressStart) — Phase 31 D-01..D-08 confirmed shipped                                                                                                                                                                                                          | D-03                                                                           |
| 4   | Eighths presentation trim on first play + need 4 pairs in sequence                 | LIKELY-RESOLVED for `8_pair` (Unit 3); CONFIRMED-BUG-OR-NOT for `8` (Unit 8) — `focusDuration: '8'` plays 4 single eighths NOT 4 pairs                                                                                                                 | `DiscoveryIntroQuestion.jsx:108-141` (8_pair shipped); line 116-118 (single eighth = 4 eighths, NOT pairs)                                                                                                                                                                                                                 | D-15                                                                           |
| 5   | Section/content title mismatches                                                   | NEEDS-MANUAL-UAT (audit catches by D-08); see Data Audit Findings § for proposed renames                                                                                                                                                               | All 8 unit files                                                                                                                                                                                                                                                                                                           | D-08, D-11                                                                     |
| 6   | Console 404 + rate-limit warning                                                   | CONFIRMED-BUG (migration exists locally, not yet deployed)                                                                                                                                                                                             | `supabase/migrations/20260201000002_add_rate_limiting.sql` — see Rate-Limit Migration Audit §                                                                                                                                                                                                                              | D-07                                                                           |
| 7   | Dictation `listen` fails inside MixedLesson                                        | CONFIRMED-BUG-LIKELY                                                                                                                                                                                                                                   | `RhythmDictationQuestion.jsx:85-120` (playPattern uses provider context but enginePlayNote calls `audioEngine.createPianoSound` which checks `audioEngine.gainNodeRef.current` — race when this renderer mounts inside MixedLesson and user clicks Listen before useAudioEngine initializeAudioContext useEffect resolves) | D-13                                                                           |
| 8   | Pulse in quarter-only node generates halves                                        | NOT-A-BUG-IN-CURRENT-CODE                                                                                                                                                                                                                              | `PulseQuestion.jsx:50-55` (PULSE_BEATS hardcoded to 4 quarters); MixedLessonGame line 199 does not inject `beats`. User likely confused PulseQuestion with RhythmTapQuestion                                                                                                                                               | D-09 (if reframed: ArcadeRhythmGame uses OLD getPattern which CAN emit halves) |
| 9   | Node 1_3 rests (duplicate of Issue 2)                                              | See Issue 2                                                                                                                                                                                                                                            | (same)                                                                                                                                                                                                                                                                                                                     | D-12                                                                           |
| 10  | Combined-values nodes not shuffling all expected durations                         | LIKELY-CONFIRMED in ArcadeRhythmGame (uses OLD `getPattern()` whose `addSubdivisionNotes` only adds one duration size); UNCONFIRMED in MixedLesson (resolveByTags returns full random). Variety rule (D-10) is a forcing function regardless           | `ArcadeRhythmGame.jsx:360-390` (`fetchNewPattern`); `RhythmPatternGenerator.js:478-495` (`addSubdivisionNotes`)                                                                                                                                                                                                            | D-10                                                                           |
| 11  | Rhythm pattern node feels same as practice                                         | DROPPED-PER-CONTEXT                                                                                                                                                                                                                                    | —                                                                                                                                                                                                                                                                                                                          | D-04                                                                           |
| 12  | Speed Challenge in quarters section repeats same 4-quarters; 10 exercises too long | session-length: DROPPED (D-05); variety: NEEDS-MANUAL-UAT-AFTER-RETEST                                                                                                                                                                                 | `ArcadeRhythmGame.jsx:49` (TOTAL_PATTERNS=8 ✓), `:360-390` (lastPatternRef no-consecutive ✓ but pool size for unit 1 quarter-only is intrinsically 1 binary `q_44_001` once OLD getPattern's filter applies)                                                                                                               | D-17, D-19                                                                     |
| 13  | Boss node doesn't feel different                                                   | NEEDS-MANUAL-UAT-AFTER-RETEST. Phase 32 content levers all SHIPPED (BOSS removed from EASY_NODE_TYPES ✓; cumulative `patternTags` ✓; full BOSS = 4 bars ✓; dictation-heavy Q mix ✓ — see boss_rhythm_2 questions array). User-felt flatness gates D-18 | `rhythmTimingUtils.js:20-26` (EASY_NODE_TYPES); rhythmUnit\*Redesigned.js boss nodes; `MixedLessonGame.jsx` (boss MIXED_LESSON renders)                                                                                                                                                                                    | D-17, D-18                                                                     |

## 2. WIP Stash Review

`stash@{0}` re-stashed 2026-05-03. 568 lines diff. Inspected read-only via `git stash show -p stash@{0}`.

| Chunk                                                     | Files                                                                                                                                                                                               | Aligns with CONTEXT decision?                                                                                                                                                              | Recommendation                                                                                                                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. ArcadeRhythmGame migration to tag-based resolution** | `ArcadeRhythmGame.jsx` lines 22, 131-143, 365-419 (imports `resolveByTags`/`resolveByAnyTag`, uses `patternTags`/`nodeDurations` from rhythmConfig, falls back to OLD getPattern only when no tags) | Aligns with **D-09** spirit at the integration level — this is exactly the central fix. Also enables **D-19** (cumulative speed pool just by reusing each speed node's tags)               | **SALVAGE** as the Phase 33 fix for issues 8/10/12                                                                                                                      |
| **B. ArcadeRhythmGame hold-note integration**             | `ArcadeRhythmGame.jsx` lines 200-260, 723-900 (refactor handleHitZoneTap → handleHitZonePointerDown/Up; HoldRing overlay; spacebar key-up handler)                                                  | Closes **PLAY-01 integration gap** for ArcadeRhythmGame (Phase 31 was confined to PulseQuestion + RhythmTapQuestion)                                                                       | **SALVAGE** — but treat as a separate concern from the curriculum/data fixes; gates on whether user retests Speed Challenge with halves and feels the hold-note absence |
| **C. ArcadeRhythmGame tile-height refactor**              | `ArcadeRhythmGame.jsx` lines 65-72 (TILE_HEIGHTS removed), 327-340 (height computed from duration), 492-510 (RAF loop targetY → hitZoneY refactor), 1080-1110 ("Hold" label inside tile)            | Tangentially related: only matters if hold-notes ship for ArcadeRhythmGame; without them, tile heights stay categorical                                                                    | **DEFER** — only ship if Chunk B ships. Dropping it doesn't affect anything else                                                                                        |
| **D. boss_rhythm_7 flipped to full BOSS**                 | `rhythmUnit7Redesigned.js:374` (`isBoss: false → true`); `rhythmUnit7Redesigned.test.js:74` test updated                                                                                            | Did NOT come up in Phase 32 — at Phase 32 only Units 6 and 8 became full BOSS. Flipping U7 to full BOSS adds 4-bar patterns + strict timing + dictation-heavy + cumulative pool for U7 too | **DEFER**. Out of Phase 33 scope (this is curriculum design, not bug fix). Not aligned with any D-XX decision. Capture as backlog idea                                  |
| **E. Test updates**                                       | `ArcadeRhythmGame.test.js` (relies on Chunk A/B), `rhythmUnit7Redesigned.test.js` (relies on Chunk D)                                                                                               | Tests follow whichever chunks ship                                                                                                                                                         | **CONDITIONAL** — only the test updates that pair with salvaged chunks                                                                                                  |

**Summary recommendation:** Salvage Chunks A + B + (parts of) C if PLAY-01-for-Arcade is in scope. Drop Chunk D. The stash is self-consistent but mixes "curriculum redesign" (Chunk D) with "code architecture" (A/B/C). Phase 33 should pick A unconditionally (it's the cleanest expression of D-09), and pick B+C only if user reports the hold-note absence is felt during retest.

## 3. Data Audit Findings (D-08, D-11, D-12)

Verdicts: `OK` / `DRIFT` (suggested rename) / `MISMATCH` (config error) / `REST-RISK` (depends on tag pool cleanup).

### Unit 1 ("Rhythm Starters" — quarter + half)

| Node ID       | Name                         | durations | focusDur | contextDur | patternTags                                           | Drift verdict          | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------- | ---------------------------- | --------- | -------- | ---------- | ----------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rhythm_1_1    | Meet Quarter Notes           | `[q]`     | `[q]`    | `[]`       | `quarter-only`                                        | OK                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| rhythm_1_2    | Practice Quarter Notes       | `[q]`     | `[]`     | `[q]`      | `quarter-only`                                        | OK                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| rhythm_1_3    | Meet Half Notes              | `[q,h]`   | `[h]`    | `[q]`      | `quarter-half`                                        | **REST-RISK**          | Patterns tagged `quarter-half`: `qh_44_001` (onsets 1,3 — fits q+h cleanly), `qh_44_002` (onsets 2,3 — leading rest), `qh_44_003` (onsets 1,2 — trailing rest), `qhw_44_001` (onset 1 — needs whole-note or whole-rest), `q_44_001..004,006` (multi-tagged with quarter-half). `patternNeedsRests` filters rest-requiring binaries when durations don't include rest codes. **Verify**: run `resolveByTags(['quarter-half'], ['q','h'])` repeatedly and confirm no rest output. |
| rhythm_1_4    | Practice Quarters and Halves | `[q,h]`   | `[]`     | `[q,h]`    | `quarter-only`, `quarter-half`                        | DRIFT                  | Combined-values node — variety rule D-10 should force "≥1 quarter-only AND ≥1 quarter-half pattern per session".                                                                                                                                                                                                                                                                                                                                                                |
| rhythm_1_6    | Speed Challenge              | `[q,h]`   | `[]`     | `[q,h]`    | `quarter-only`, `quarter-half`                        | OK; **D-19 candidate** | If retest shows flatness, swap to cumulative tags `["quarter-only", "quarter-half"]` already covers it — at Unit 1 there's no "prior unit" to add. The intrinsic pool problem here: 4 quarter-only patterns + 3 quarter-half patterns = 7 distinct binaries, randomly drawn 8 times = repeats. **Cannot improve at U1** without expanding `RHYTHM_PATTERNS`. Flag and accept.                                                                                                   |
| boss_rhythm_1 | Basic Beats Master           | `[q,h]`   | `[]`     | `[q,h]`    | `quarter-only`, `quarter-half`, `patternTagMode: any` | OK                     | Phase 32 D-06 cumulative tags — but at U1 these are the ONLY tags. MINI_BOSS, retains easy timing per D-07                                                                                                                                                                                                                                                                                                                                                                      |

### Unit 2 ("Beat Builders" — adds whole)

| Node ID       | Name                 | durations | focusDur | contextDur | patternTags                                                 | Drift verdict                                                                                                                                                                                                                          |
| ------------- | -------------------- | --------- | -------- | ---------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rhythm_2_1    | Meet Whole Notes     | `[q,h,w]` | `[w]`    | `[q,h]`    | `quarter-half-whole`                                        | OK                                                                                                                                                                                                                                     |
| rhythm_2_2    | Practice Whole Notes | `[q,h,w]` | `[]`     | `[q,h,w]`  | `quarter-half-whole`                                        | OK                                                                                                                                                                                                                                     |
| rhythm_2_3    | Long and Short       | `[q,h,w]` | `[]`     | `[q,h,w]`  | `quarter-half`, `quarter-half-whole`                        | DRIFT — `discovery_intro` question has `focusDuration: 'q'` (line 186), but no new content; should be `focusDurations` (note plural) match → consider deleting the discovery_intro question (it's a "contrast" node, not introduction) |
| rhythm_2_4    | All Basic Durations  | `[q,h,w]` | `[]`     | `[q,h,w]`  | `quarter-half`, `quarter-half-whole`                        | OK; D-10 candidate                                                                                                                                                                                                                     |
| rhythm_2_6    | Speed Basics         | `[q,h,w]` | `[]`     | `[q,h,w]`  | `quarter-half`, `quarter-half-whole`                        | OK                                                                                                                                                                                                                                     |
| boss_rhythm_2 | Duration Master      | `[q,h,w]` | `[]`     | `[q,h,w]`  | `quarter-only`, `quarter-half`, `quarter-half-whole`, `any` | OK                                                                                                                                                                                                                                     |

### Unit 3 ("Running Notes" — adds eighths)

| Node ID       | Name                  | durations   | focusDur   | patternTags                                                                                                | Drift                                                                                |
| ------------- | --------------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| rhythm_3_1    | Meet Eighth Notes     | `[q,8]`     | `[8_pair]` | `quarter-eighth`                                                                                           | OK — discovery_intro uses `8_pair` (correctly invokes 4-pair pitch-alternating demo) |
| rhythm_3_2    | Practice Eighth Notes | `[q,8]`     | `[]`       | `quarter-eighth`                                                                                           | OK                                                                                   |
| rhythm_3_3    | Running and Walking   | `[q,h,w,8]` | `[]`       | `quarter-eighth`, `quarter-half-whole-eighth`                                                              | OK                                                                                   |
| rhythm_3_4    | Mix It Up             | `[q,h,w,8]` | `[]`       | `quarter-eighth`, `quarter-half-whole-eighth`                                                              | OK; D-10 candidate                                                                   |
| rhythm_3_6    | Speed Running         | `[q,h,w,8]` | `[]`       | `quarter-eighth`, `quarter-half-whole-eighth`                                                              | OK                                                                                   |
| boss_rhythm_3 | Running Notes Master  | `[q,h,w,8]` | `[]`       | `quarter-only`, `quarter-half`, `quarter-half-whole`, `quarter-eighth`, `quarter-half-whole-eighth`, `any` | OK                                                                                   |

### Unit 4 ("Counting Silence" — introduces rests)

| Node ID       | Name                   | durations            | focusDur | patternTags                               | Drift                                                                                                                                                                                       |
| ------------- | ---------------------- | -------------------- | -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rhythm_4_1    | Meet Quarter Rest      | `[q,qr]`             | `[qr]`   | `quarter-rest`                            | OK — first node where rests are valid                                                                                                                                                       |
| rhythm_4_2    | Practice Quarter Rests | `[q,qr]`             | `[]`     | `quarter-rest`                            | OK                                                                                                                                                                                          |
| rhythm_4_3    | Meet Half Rest         | `[q,h,qr,hr]`        | `[hr]`   | `half-rest`                               | OK                                                                                                                                                                                          |
| rhythm_4_4    | Practice Rests         | `[q,h,qr,hr]`        | `[]`     | `quarter-rest`, `half-rest`               | OK; D-10 candidate                                                                                                                                                                          |
| rhythm_4_5    | Meet Whole Rest        | `[q,h,w,qr,hr,wr]`   | `[wr]`   | `whole-rest`                              | OK                                                                                                                                                                                          |
| rhythm_4_6    | Speed Silence          | `[q,h,qr,hr,wr]`     | `[]`     | `quarter-rest`, `half-rest`, `whole-rest` | **DRIFT** — durations missing `w` despite `whole-rest` being a tag and `rhythm_4_5` having introduced `w`. Suggestion: durations should be `[q,h,w,qr,hr,wr]` to match prereq's vocabulary. |
| boss_rhythm_4 | Silence Master         | `[q,h,w,8,qr,hr,wr]` | `[]`     | cumulative U1-U4, `any`                   | OK                                                                                                                                                                                          |

### Unit 5 ("Dotted Notes & 3/4")

| Node ID       | Name                      | durations                  | focusDur | patternTags                     | Drift                                                                                                                                                                                                          |
| ------------- | ------------------------- | -------------------------- | -------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rhythm_5_1    | Meet Dotted Halves        | `[q,h,w,8,qr,hr,wr,hd]`    | `[hd]`   | `dotted-half`                   | OK                                                                                                                                                                                                             |
| rhythm_5_2    | Practice Dotted Halves    | `[q,h,w,8,qr,hr,wr,hd]`    | `[]`     | `dotted-half`                   | **REST-RISK**: `dotted-half` tag includes `qhw_44_001` (single onset at beat 1) which is fine if `hd` is in durations (one dotted-half + quarter-rest? — no, would need rest) — verify via `patternNeedsRests` |
| rhythm_5_3    | Waltz Time (3/4)          | `[q,hd]`                   | `[]`     | `three-four`                    | **MISMATCH** — `three-four` tag patterns include `tf_34_005` (onsets 2,3 — leading rest), `tf_34_007` (onset 3 only — leading 2-beat rest). Without `qr`/`hr` in durations, `patternNeedsRests` filters these. |
| rhythm_5_4    | Meet Dotted Quarter       | `[q,8,qd]`                 | `[qd]`   | `dotted-quarter`                | OK                                                                                                                                                                                                             |
| rhythm_5_5    | Practice All Dotted Notes | `[q,h,hd,qd,8]`            | `[]`     | `dotted-half`, `dotted-quarter` | OK                                                                                                                                                                                                             |
| rhythm_5_6    | Speed Dots                | `[q,h,hd,qd,8]`            | `[]`     | `dotted-half`, `dotted-quarter` | OK                                                                                                                                                                                                             |
| boss_rhythm_5 | Dotted Notes Master       | `[q,h,w,8,qr,hr,wr,hd,qd]` | `[]`     | cumulative U1-U5, `any`         | OK                                                                                                                                                                                                             |

### Unit 6 ("Sixteenth Notes")

| Node ID       | Name                     | durations                     | focusDur | patternTags                                                                                                                       | Drift |
| ------------- | ------------------------ | ----------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- | ----- |
| rhythm_6_1    | Meet Sixteenth Notes     | `[q,16]`                      | `[16]`   | `sixteenth`                                                                                                                       | OK    |
| rhythm_6_2    | Practice Sixteenth Notes | `[q,16]`                      | `[]`     | `sixteenth`                                                                                                                       | OK    |
| rhythm_6_3    | Sixteenths and Eighths   | `[q,8,16]`                    | `[]`     | `sixteenth`, `quarter-eighth`                                                                                                     | OK    |
| rhythm_6_4    | Fast and Faster          | `[q,h,8,16]`                  | `[]`     | `sixteenth`, `quarter-eighth`                                                                                                     | OK    |
| rhythm_6_6    | Speed Master             | `[q,h,8,16]`                  | `[]`     | `sixteenth`, `quarter-eighth`                                                                                                     | OK    |
| boss_rhythm_6 | Rhythm Champion          | full cumulative U1-U6 + `any` | OK       | Full BOSS. Confirmed via `nodeType: NODE_TYPES.BOSS` (line ~327 of unit 6 file — implied from cumulative durations matching D-06) |

### Unit 7 ("6/8 Compound Meter")

| Node ID       | Name               | durations  | focusDur | patternTags                                                                                                         | Drift                                                                                                                                                                                                     |
| ------------- | ------------------ | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rhythm_7_1    | Two Big Beats      | `[qd]`     | `[qd]`   | `six-eight`                                                                                                         | OK                                                                                                                                                                                                        |
| rhythm_7_2    | Feel the Pulse     | `[qd]`     | `[]`     | `six-eight`                                                                                                         | **REST-RISK** — `six-eight` patterns include `se_68_011` (rest+qd+8+8+8), `se_68_012` (8+8+qd+rest), `se_68_015` (qd+rest+8+8). Without rest codes in durations, `patternNeedsRests` filters them. Verify |
| rhythm_7_3    | Adding Quarters    | `[qd,q]`   | `[q]`    | `six-eight`                                                                                                         | OK; same rest-risk filter logic                                                                                                                                                                           |
| rhythm_7_4    | Mixing It Up       | `[qd,q,8]` | `[]`     | `six-eight`                                                                                                         | OK                                                                                                                                                                                                        |
| rhythm_7_6    | Quick Beats        | `[qd,q,8]` | `[]`     | `six-eight`                                                                                                         | OK                                                                                                                                                                                                        |
| boss_rhythm_7 | Compound Commander | `[qd,q,8]` | `[]`     | `six-eight` (NOT cumulative — only six-eight tag) — **MINI_BOSS in current main**, **WIP stash flips to full BOSS** | DRIFT note: 6/8 is a standalone time-signature pool. Including 4/4 patterns from earlier units doesn't make musical sense. The `patternTags: ["six-eight"]` is correct for U7 boss.                       |

### Unit 8 ("Syncopation")

| Node ID       | Name                              | durations                     | focusDur | patternTags                         | Drift                                                                                                                                                                                                                                                                                                                                                                     |
| ------------- | --------------------------------- | ----------------------------- | -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rhythm_8_1    | Off-Beat Surprise                 | `[8,q]`                       | `[8]`    | `syncopation`                       | **DRIFT** — focusDuration is `[8]` (eighths). DiscoveryIntroQuestion line 116-118 plays 4 single eighths (NOT pairs, NOT pitch-alternating). Issue 4 confirmed-bug for this node if tested. Suggested fix: change `focusDurations` to `["8_pair"]` to invoke the existing 4-pair beamed-pair branch, OR extend `discovery_intro` config to support a `mode: 'pairs'` flag |
| rhythm_8_2    | Between the Beats                 | `[8,q]`                       | `[]`     | `syncopation`                       | OK                                                                                                                                                                                                                                                                                                                                                                        |
| rhythm_8_3    | Dotted Groove                     | `[qd,8,q]`                    | `[qd]`   | `dotted-syncopation`                | OK                                                                                                                                                                                                                                                                                                                                                                        |
| rhythm_8_4    | Swing and Sway                    | `[qd,8,q]`                    | `[]`     | `syncopation`, `dotted-syncopation` | OK                                                                                                                                                                                                                                                                                                                                                                        |
| rhythm_8_6    | Rapid Syncopation                 | `[qd,8,q]`                    | `[]`     | `syncopation`, `dotted-syncopation` | OK                                                                                                                                                                                                                                                                                                                                                                        |
| boss_rhythm_8 | Rhythm Master (`NODE_TYPES.BOSS`) | full cumulative U1-U8 + `any` | OK       |

### Section/title rename suggestions (D-11)

- **rhythm_1_4 "Practice Quarters and Halves"** → keep (matches content)
- **rhythm_2_3 "Long and Short"** → consider "Mix Long and Short" (the discovery_intro question shows quarter, but the practice mixes durations)
- **rhythm_4_6 "Speed Silence"** description "How fast can you count silence?" — but durations include note values too. Suggest "Fast Notes and Rests"
- **rhythm_5_3 "Waltz Time (3/4)"** → keep
- **rhythm_6_4 "Fast and Faster"** description "Practice mixing fast and slow rhythms" — currently no half OR whole notes in patternTags `sixteenth, quarter-eighth`. Description says "fast and slow" but durations are quarter+half+eighth+sixteenth. **DRIFT**: name implies tempo contrast, content is duration variety. Rename "Mixed Speeds" or expand to include `quarter-half-whole` tag
- **rhythm_8_1 "Off-Beat Surprise"** description "Discover the magic of playing between the beats" — but the discovery_intro plays 4 plain eighths (not off-beats). DRIFT: name promises syncopation but Q1 is plain eighth-intro. Rename to "Meet Off-Beats" + change discovery_intro to play `8_pair` followed by a syncopated example, OR keep name but acknowledge in description that intro is "first feel" of eighths

## 4. Audio Trace (Issues 1, 4, 7)

### Issue 1/4 — First-play trim in DiscoveryIntroQuestion

**Call chain:**

1. User taps "Listen" → `playDemo()` (DiscoveryIntroQuestion.jsx:59)
2. `await audioEngine.initializeAudioContext()` (line 64) — **but** if useAudioEngine's mount-effect already ran, `audioContextRef.current` is set, and `initializeAudioContext` returns early at the `state !== "closed"` check, going straight to gain-node setup at line 81-85. Idempotent — fine.
3. `await audioEngine.resumeAudioContext()` (line 65) — calls `ctx.resume()` if suspended.
4. `loadPianoSoundAsync()` was triggered at initializeAudioContext line 98 — **fire-and-forget**. The fetch + decodeAudioData of `G4.mp3` may not have resolved yet.
5. `schedulePatternPlayback(beats, 80, ctx, playNoteFn)` (line 143). For each beat: `playNoteFn` calls `audioEngine.createPianoSound(opts.startTime, ...)`.
6. `createPianoSound` (useAudioEngine.js:389-447):
   - Line 391-393: returns null if `audioContextRef.current` or `gainNodeRef.current` is null.
   - Line 396-398: returns null if `audioContextRef.current.state !== "running"`. Should be running by now.
   - Line 401: `if (pianoSoundLoadedRef.current && pianoSoundBufferRef.current)` → uses real piano sample.
   - Line 437-439: ELSE → `createPatternSound(time, "triangle", 600, 0.1)` — **synth fallback, 0.1s duration** (much shorter than the requested 0.5s+).

**Hypothesis:** On first play, `loadPianoSound` hasn't completed (fetch + decode takes ~50-300ms typically). The first 1-2 scheduled notes hit the fallback path and play a 0.1s synthetic blip; subsequent notes (after the buffer loads) play the real piano sample. From the user perspective: "I heard 3 of 4 notes" because the first synthetic blip is short/quiet enough to feel "missing".

**Why 100ms `+ 0.1` buffer in schedulePatternPlayback isn't enough:** The 100ms is a scheduling-clock buffer (`ctx.currentTime + 0.1`); it does not delay until pianoSoundBufferRef is populated. The fetch race is independent.

**Suggested fix candidates (D-14):**

- (a) Change `loadPianoSoundAsync` invocation to `await loadPianoSound()` BEFORE returning `true` from `initializeAudioContext`. Adds 50-300ms latency at first load. Idempotent on subsequent loads (early-return at line 140-142).
- (b) In renderers, pre-resolve a "ready" promise: if `pianoSoundLoadedRef` not set, await `loadPianoSound()` before calling schedulePatternPlayback.
- (c) Make the fallback sound duration match the requested duration (line 439: pass `duration` not 0.1) — would mask the symptom but not the root cause.

**Recommended:** (a) inside the shared prewarm hook from D-13 (so D-13 covers both Issues 1/4 and Issue 7).

### Issue 7 — Dictation Listen fails inside MixedLessonGame

**Call chain (the problem path):**

1. MixedLessonGame mounts a `RhythmDictationQuestion` for a `rhythm_dictation` entry.
2. RhythmDictationQuestion calls `useAudioEngine(tempo, { sharedAudioContext: audioContextRef.current })` at line 49. The hook's mount-effect (useAudioEngine.js:1183-1188) fires `initializeAudioContext()` asynchronously on mount.
3. The **shared** AudioContext from the provider is already running (set up by AudioContextProvider on app mount). So `audioContextRef.current.state === "running"` from the start.
4. **Race**: useAudioEngine's `initializeAudioContext` is async. It needs to set `gainNodeRef.current` (line 82-85). If this hasn't completed by the time user clicks Listen → `playPattern` runs:
5. `playPattern` (line 85): uses provider-context `audioContextRef.current` — that's fine, the provider context is running.
6. Calls `enginePlayNote` → `audioEngine.createPianoSound(...)` (line 56).
7. `createPianoSound` line 391-393: **`gainNodeRef.current` is null** (still being set up by initializeAudioContext effect that hasn't finished). Returns null silently.
8. No sound. User clicks Replay → by now useAudioEngine's mount effect has resolved, `gainNodeRef.current` is populated → second click works.

**Why standalone `RhythmDictationGame.jsx` doesn't have this bug:** Standalone has its own loading screen + initialization sequence with explicit gating. Inside MixedLessonGame, the renderer mounts immediately without an interstitial.

**Why Replay button works:** It calls `playPattern` directly without `initializeAudioContext`/`resumeAudioContext`. By second click, time has elapsed and the mount-effect has resolved.

**Why `handleListen` calls `await audioEngine.initializeAudioContext()` at line 125 doesn't help:** because `initializeAudioContext` checks at line 61-66 if `sharedAudioContext` exists and uses it — but it STILL needs to await creating a new gain node and connecting it. The `await` at line 125 should resolve this — UNLESS something is throwing inside initializeAudioContext on the second call. **Verify:** does `initializeAudioContext` create a SECOND gain node on every call? Looking at line 81-85: yes, it creates a new gain node each call without checking if `gainNodeRef.current` already exists. This is idempotent in result but wasteful — and crucially, the await DOES block until the gain node is set. So this should work. **Then why does the user report failure?**

**Alternative hypothesis:** `audioEngine.initializeAudioContext` at line 125 throws (e.g., shared context is in `interrupted` state on iOS), and the catch block at line 127-129 silently swallows. Then `setPhase(PHASES.LISTENING)` runs, `playPattern` runs, `createPianoSound` returns null → nothing plays. Replay works because by then iOS has recovered.

**Recommended fix (D-13):** Shared `useEnsureAudioReady()` hook that:

1. Awaits `audioEngine.resumeAudioContext()` (idempotent).
2. Awaits `loadPianoSound()` (idempotent).
3. Verifies `audioEngine.isReady()` returns true (audioContextRef running + gainNodeRef set).
4. Throws if not ready — caller surfaces a fallback "audio unavailable" UI.

Apply at every Listen/Demo button handler in renderers used inside MixedLessonGame: `RhythmDictationQuestion`, `DiscoveryIntroQuestion`. Per D-16, do NOT proactively roll out to non-bug renderers.

## 5. Phase 30 / 31 / 32 Verification (per-decision shipped status)

### Phase 30 — Audio Fixes

| Decision | Description                         | Shipped?                    | Evidence                                                                                                                                                                                                                                                                |
| -------- | ----------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01     | await-resume-then-schedule          | PARTIAL                     | Implemented per-renderer (PulseQuestion `startFlow` line 552-573 has explicit `await resumeAudioContext` + warmup oscillator; RhythmDictationQuestion `handleListen` line 125-126 awaits both init+resume). NOT centralized into a shared utility — D-13 will fix this. |
| D-02     | Defensive across all platforms      | UNCLEAR — manual UAT needed | No platform-specific branches                                                                                                                                                                                                                                           |
| D-03/04  | AUDIO-02 fix in handleListen        | PARTIAL                     | RhythmDictationQuestion has `await initializeAudioContext + resumeAudioContext` — but the gain-node race (Issue 7) suggests it's incomplete inside MixedLesson                                                                                                          |
| D-05     | 4 pairs of 8th notes, no pauses     | SHIPPED for `8_pair`        | DiscoveryIntroQuestion lines 108-112 build 8 beats at 2 sixteenth-units each                                                                                                                                                                                            |
| D-06     | High-low pitch alternation          | SHIPPED                     | DiscoveryIntroQuestion lines 126-141; pitchShift `0` (G4) → `-7` (C4)                                                                                                                                                                                                   |
| D-07     | Pitch alternation in discovery only | SHIPPED                     | enginePlayNote in dictation/reading uses `audioEngine.createPianoSound` without pitchShift override                                                                                                                                                                     |

### Phase 31 — Long-Press Sustain

| Decision                    | Description                      | Shipped?        | Evidence                                                                                                                  |
| --------------------------- | -------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| D-01                        | Filling ring + green flash       | SHIPPED         | PulseQuestion lines 482-500, 519-545; RhythmTapQuestion (verified by stash diff which shows it as a pre-existing pattern) |
| D-02                        | Sustained piano sound            | SHIPPED         | PulseQuestion line 452-459                                                                                                |
| D-03                        | 70% threshold                    | SHIPPED         | `holdScoringUtils.HOLD_THRESHOLDS` (referenced in PulseQuestion line 483)                                                 |
| D-04                        | 3-tier scoring                   | SHIPPED         | `scoreHold` function from holdScoringUtils, called at PulseQuestion line 520                                              |
| D-05                        | Threshold scales with note value | SHIPPED         | `calcHoldDurationMs(durationUnits, tempo)` — utility takes both inputs                                                    |
| D-06                        | Quarter notes remain taps        | SHIPPED         | `isHoldNote` returns false for q (4 sixteenth units < 8)                                                                  |
| D-07                        | TAP/HOLD label                   | SHIPPED         | PulseQuestion line 654-656; TapArea component receives `isHoldNote` prop                                                  |
| D-08                        | Stretched indicator in pulse     | SHIPPED         | PulseQuestion lines 694-725                                                                                               |
| **PLAY-01-INTEGRATION-GAP** | Hold-press in ArcadeRhythmGame   | **NOT SHIPPED** | ArcadeRhythmGame.jsx still uses single `handleHitZoneTap` (line 684). Stash @{0} Chunk B implements it.                   |

### Phase 32 — Game Design Differentiation

| Decision | Description                       | Shipped?                        | Evidence                                                                                                                                                                                                                                                                        |
| -------- | --------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------ |
| D-01     | TOTAL_PATTERNS = 8                | SHIPPED                         | `ArcadeRhythmGame.jsx:49`                                                                                                                                                                                                                                                       |
| D-02     | No two consecutive identical      | SHIPPED                         | `ArcadeRhythmGame.jsx:362-381` (lastPatternRef + binary signature dedup, MAX_VARIETY_RETRIES=3)                                                                                                                                                                                 |
| D-03     | Tempo fixed from node config      | SHIPPED                         | line 155 `tempo = nodeConfig?.tempo ?? 90`                                                                                                                                                                                                                                      |
| D-04     | Pattern pool unchanged for Speed  | SHIPPED                         | passes `rhythmPatterns` (mapped from durations) to OLD getPattern                                                                                                                                                                                                               |
| D-05     | Scale levers by boss type         | PARTIAL                         | MINI_BOSS retains EASY_NODE_TYPES (rhythmTimingUtils:20-26), full BOSS doesn't — confirmed                                                                                                                                                                                      |
| D-06     | Cumulative duration set for boss  | SHIPPED as data                 | Each boss node hand-lists cumulative `patternTags` + `patternTagMode: "any"`. **NO programmatic helper exists** — this is bare data. D-19's "reuse boss D-06 helper" needs reinterpretation: it really means "copy the boss data pattern: list cumulative tags on speed nodes". |
| D-07     | BOSS removed from EASY_NODE_TYPES | SHIPPED                         | `rhythmTimingUtils.js:20-26`: `EASY_NODE_TYPES = new Set(["discovery","practice","mix_up","review","mini_boss"])` — `"boss"` is intentionally absent. Comment on line 22 confirms                                                                                               |
| D-08     | Full BOSS = 4 bars                | SHIPPED at config layer         | `MixedLessonGame.jsx:167` reads `rc.measureCount                                                                                                                                                                                                                                |     | 1`. Full-BOSS unit files (Unit 6 + Unit 8) need `measureCount: 4` set on boss rhythmConfig — verify per-unit |
| D-09     | Harder Q-mix for BOSS             | SHIPPED                         | Boss MIXED_LESSON `questions` arrays already lean reading + dictation (e.g., boss_rhythm_2 line 343-362: 12 questions, 3× rhythm_dictation, 3× rhythm_reading, 2× syllable_matching, 1× visual_recognition, 3× rhythm_tap)                                                      |
| D-10     | Standard VictoryScreen for boss   | SHIPPED                         | No boss-specific branch in VictoryScreen — pending D-18 if user retest still flat                                                                                                                                                                                               |
| D-11     | Remove 6 Mix-Up nodes             | SHIPPED                         | Searched all 8 unit files: NO `rhythm_X_5` IDs except those legitimately renumbered (e.g., `rhythm_4_5 = "Meet Whole Rest"` is a different node, valid). Speed Round IDs `rhythm_X_6` are now position-5 in the array. Confirmed.                                               |
| D-12     | Shrink to 6 nodes                 | SHIPPED                         | Each unit has 6 nodes                                                                                                                                                                                                                                                           |
| D-13     | Re-wire Speed prereqs             | SHIPPED                         | rhythm_2_6 prereq = "rhythm_2_4" (line 276) — gap from 4→6 corrected                                                                                                                                                                                                            |
| D-14     | Leave orphan progress rows        | SHIPPED (deliberate non-action) |                                                                                                                                                                                                                                                                                 |
| D-15     | Clean removal                     | SHIPPED                         |                                                                                                                                                                                                                                                                                 |
| D-16     | PEDAGOGY.md 4 levers              | SHIPPED                         | `src/data/PEDAGOGY.md` exists with cumulative-tags section                                                                                                                                                                                                                      |
| D-17     | Leave RHYTHM_COMPLEXITY alone     | SHIPPED                         | unit files still use SIMPLE/MEDIUM/VARIED/ALL fields                                                                                                                                                                                                                            |

**Verdict:** Phase 32 fully shipped. User-perceived flatness in boss / speed (issues 12, 13) is real but is a perception issue post-content-changes, NOT a code regression. Decisions D-17/D-18/D-19/D-20 correctly gate UX layer on user retest.

## 6. Contingent UX Triggers (D-18, D-19, D-20)

**What user must report after fresh retest to fire each contingent fix:**

### D-18 (Boss intro overlay + victory VFX)

**Trigger:** After user replays `boss_rhythm_2` (MINI_BOSS) AND a full BOSS (`boss_rhythm_6` or `boss_rhythm_8`) on a confirmed-current build, user feels "still doesn't feel like a boss fight" → fire D-18.
**Trigger phrasing examples to capture from user:**

- "It still feels like just another lesson"
- "Even my child didn't notice it was a boss"
- "I want it to feel like a boss"

### D-19 (Speed cumulative-units pool)

**Trigger:** User replays `rhythm_1_6` (quarter-only speed; intrinsic pool ≤ 7 patterns) AND `rhythm_3_6` (eighths speed; larger pool) on confirmed-current build, user reports:

- `rhythm_1_6` still feels stale → fire D-19 with a caveat that U1 has no prior unit to draw from (intrinsic limit).
- `rhythm_3_6` AND `rhythm_2_6` still feel stale → fire D-19. Mirror boss data pattern: add cumulative `patternTags` + `patternTagMode: "any"` to each speed node's rhythmConfig.

**Implementation detail for D-19:** Since there's no shared helper (Phase 32 uses bare data per boss), D-19 = pure data edit on each speed node's `rhythmConfig`. Reuses the same data pattern documented at PEDAGOGY.md:260-264 and visible in every `boss_rhythm_X` node. **The OLD `getPattern()` path used by ArcadeRhythmGame ignores `patternTags` entirely** — so D-19 only takes effect if Stash Chunk A is salvaged (migrate ArcadeRhythmGame to `resolveByTags`/`resolveByAnyTag`). Without Chunk A, D-19 is a no-op.

### D-20 (conditional plans ready)

Plans for D-18 and D-19 should be drafted as conditional task sets with explicit "IF user-reported-still-flat after retest THEN execute". Triage UAT script (Validation Architecture §) gates them.

## 7. Rate-Limit Migration Audit (D-07)

### File: `supabase/migrations/20260201000002_add_rate_limiting.sql`

**Idempotency analysis:**

| Statement                                                      | Idempotent? | Notes                                                        |
| -------------------------------------------------------------- | ----------- | ------------------------------------------------------------ |
| `CREATE TABLE IF NOT EXISTS rate_limits`                       | YES         | Standard IF NOT EXISTS guard                                 |
| `CREATE INDEX IF NOT EXISTS idx_rate_limits_student_node`      | YES         | Same                                                         |
| `ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY`            | YES         | RLS enable is idempotent in Postgres                         |
| `CREATE POLICY "Students can view own rate limits"`            | **NO**      | Will fail with `error 42710 policy already exists` on re-run |
| `CREATE POLICY "Students can insert own rate limits"`          | **NO**      | Same                                                         |
| `CREATE POLICY "Students can update own rate limits"`          | **NO**      | Same                                                         |
| `GRANT SELECT, INSERT, UPDATE ON rate_limits TO authenticated` | YES         | GRANT is idempotent                                          |
| `CREATE OR REPLACE FUNCTION public.check_rate_limit`           | YES         | OR REPLACE handles re-run                                    |
| `GRANT EXECUTE ON FUNCTION ...`                                | YES         | Idempotent                                                   |
| `COMMENT ON TABLE / COLUMN / FUNCTION`                         | YES         | Idempotent                                                   |

**Re-run safety:** The 3 `CREATE POLICY` statements will throw on re-run. For first-time deploy this is fine. If the migration was partially applied (table created but policies missing), it will fail. Recommend wrapping policies in `DROP POLICY IF EXISTS ... ; CREATE POLICY ...;` or `DO $$ ... $$` blocks.

**Suggested hardening (Discretion item):** Add at the top of each policy:

```sql
DROP POLICY IF EXISTS "Students can view own rate limits" ON rate_limits;
CREATE POLICY "Students can view own rate limits" ...
```

This would protect against half-applied migration recovery.

**Foreign key consideration:** Migration references `students(id)` via FK with `ON DELETE CASCADE`. Verify this constraint is satisfied — `students` table must already exist (yes, established in `20250105*` migrations).

**Authorization model:** SECURITY DEFINER function checks `auth.uid() = p_student_id` (lines 82-86) — sound. Cannot be called for another user's rate limit. Advisory lock (line 91, `pg_advisory_xact_lock`) prevents race conditions. Looks well-designed.

**Deploy path:** `npx supabase db push` (or `npx supabase migration up`). Verify locally first via `supabase start && supabase db reset` to confirm the migration applies cleanly, then push to remote.

## 8. Validation Architecture (Manual UAT — Nyquist disabled)

CONTEXT.md D-06 explicitly chose **manual UAT over automated tests**. nyquist_validation is effectively NOT-APPLICABLE for this phase. The Phase 33 done-bar is "every confirmed-survivor bug is marked resolved by user during a focused replay session."

### Test Framework (existing — for reference, not new tests)

| Property      | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Framework     | Vitest (`vitest`) — for any side-effect tests planner adds |
| Config file   | `vitest.config.js` (root)                                  |
| Quick-run cmd | `npx vitest run src/components/games/rhythm-games/`        |
| Full suite    | `npm run test:run`                                         |

### Manual UAT Script (researcher-authored, user-executed)

The Phase 33 plan should produce a single `33-UAT.md` with sections matching Triage Table rows. Suggested format:

```markdown
## Issue [N]: [summary]

- Build under test: <commit SHA / branch>
- Steps: 1. Sign in as student / 2. Navigate to <node> / 3. ...
- Expected: <per-current-code behavior>
- Mark: [ ] confirmed-bug / [ ] resolved-by-deploy / [ ] cannot-reproduce
- Notes:
```

### Phase Requirements → UAT Map

| Issue | UAT route                                                                              | Specific assertion                                                                                         |
| ----- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1     | `/trail` → unit 1 → node 1_1 → Listen on quarter-intro                                 | Hear all 4 quarter-note clicks on first tap of "Listen"                                                    |
| 2/9   | `/trail` → unit 1 → node 1_3 → all 9 questions                                         | No rest is shown or sounded; replay 5x                                                                     |
| 3     | (already confirmed shipped — skip)                                                     |                                                                                                            |
| 4     | `/trail` → unit 3 → node 3_1 (8_pair) AND unit 8 → node 8_1 (single 8) → Listen        | 3_1: 4 pairs, hi-lo. 8_1: 4 plain eighths or pairs (per D-15 confirmation)                                 |
| 5     | All 8 unit files, all 48 node titles vs content                                        | Check rename suggestions in Data Audit                                                                     |
| 6     | Open browser console after completing any node                                         | No "rate limit not found" warning                                                                          |
| 7     | `/trail` → unit 1 → node 1_2 → reach rhythm_dictation question → Listen on first click | Sound plays on first click (not only on Replay)                                                            |
| 8     | (NOT-A-BUG; verify pulse only generates 4 quarters)                                    | Open node 1_1 pulse — should always be 4-beat quarter pulse                                                |
| 10    | `/trail` → unit 1 → node 1_4 (combined values) → MIXED_LESSON                          | Across one session, see ≥1 pattern with halves AND ≥1 with quarters in rhythm_tap/rhythm_reading questions |
| 12    | `/trail` → unit 1 → node 1_6 (Speed Challenge)                                         | Variety: no two consecutive identical patterns; intrinsic ceiling at U1 acceptable                         |
| 13    | `/trail` → unit 1 boss + unit 6/8 boss                                                 | Boss feels "different enough"? Free-form rating                                                            |

### Sampling Rate

- **Per fix commit**: re-run only the affected UAT entry
- **Per phase merge**: full UAT pass on confirmed-survivor entries
- **Phase gate**: every confirmed-bug entry marked resolved by user

### Wave 0 Gaps

- [ ] `33-UAT.md` — researcher will produce this once user confirms triage approach
- [ ] No test framework setup needed (Vitest already configured)
- [ ] No new tests required (D-06 explicit)

## 9. Risk Register

| #   | Risk                                                                                                                                       | Severity   | Mitigation                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | User UAT against stale build masks real bugs                                                                                               | HIGH       | UAT script must include "build under test" SHA capture; researcher verifies SHA matches latest deploy before user starts                                                                                                                                                 |
| R2  | D-09 central filter changes pattern selection for already-validated nodes                                                                  | MEDIUM     | `validateTrail.mjs` runs on prebuild and exercises `resolveByTags` against every node (current safety net). Add explicit test: for every node, `resolveByTags(node.patternTags, node.durations, { allowRests: durationsIncludeRests(node.durations) })` returns non-null |
| R3  | Salvaging Stash Chunk A breaks ArcadeRhythmGame's existing test suite                                                                      | MEDIUM     | `ArcadeRhythmGame.test.js` mocks `getPattern`. Stash makes `resolveByTags` the primary path when patternTags exist; getPattern remains the fallback. Tests likely pass with no changes if mock paths cover both                                                          |
| R4  | Stash Chunk A's `nodeDurations` rather than VEX_TO_OLD_NAME-mapped breaks tile rendering                                                   | LOW        | Stash diff shows nodeDurations is fed only to resolveByTags (which expects VexFlow codes); `binaryPatternToBeats` operates on binary array, agnostic to duration names. Safe                                                                                             |
| R5  | Rate-limit migration partial-apply on re-run blocks deploy                                                                                 | LOW-MEDIUM | Pre-deploy: run migration locally first via `supabase db reset`. If hardening (DROP POLICY IF EXISTS) is added per § 7, re-run is safe                                                                                                                                   |
| R6  | D-13 prewarm hook regressions: making `loadPianoSound` blocking adds 50-300ms first-play latency, perceived as "slow"                      | LOW        | Acceptable per D-01 of Phase 30 ("~50ms latency on first play only — acceptable tradeoff")                                                                                                                                                                               |
| R7  | Issue 4 actually requires extending `discovery_intro` to support a `mode: 'pairs' \| 'plain'` config flag (Unit 8 single eighths intro)    | LOW        | Pure data + DiscoveryIntroQuestion change; isolated. Researcher recommends mode flag over silent switch — gives content authors control                                                                                                                                  |
| R8  | Removing rest patterns from quarter-half pool (D-12) shrinks the pool size; node 1_3 and others may feel repetitive                        | LOW        | After D-12 removal, count remaining patterns per tag; if < 4, recommend adding 2-3 rest-free quarter-half patterns to `rhythmPatterns.js`                                                                                                                                |
| R9  | User-reported boss flatness (D-17) is irreducible without UX layer; D-18/D-19 contingents may both fire                                    | MEDIUM     | Plan must hold both contingents as conditional plans (D-20). Ordering: D-17 retest gates everything                                                                                                                                                                      |
| R10 | "WIP stash boss_7 → BOSS" in Chunk D is not a bug fix and not aligned with any locked decision; risk if user assumes it's part of Phase 33 | LOW        | Explicitly out of scope; capture as backlog idea after Phase 33 merge                                                                                                                                                                                                    |

## Project Constraints (from CLAUDE.md)

- **VexFlow:** SVG backend; one measure per Stave; key strings `pitch/octave`; duration codes per spec
- **Build hooks:** prebuild runs `validateTrail.mjs` — any data audit edit must pass this
- **Game routes (CRITICAL):** New games need BOTH `LANDSCAPE_ROUTES` (App.jsx) AND `gameRoutes` (AppLayout.jsx). NOT applicable here (no new game routes in Phase 33)
- **i18n:** English + Hebrew RTL — any new UI strings (D-18) must have he locale entries
- **Audio:** All audio goes through `useAudioContext()`. iOS Safari requires `AudioInterruptedOverlay` and standalone PWA detection — already in place
- **Service worker:** `pianomaster-v7` — bump to `pianomaster-v8` when shipping Phase 33 if any UI changes (D-18)
- **Trail node structure:** `student_skill_progress.exercise_progress` JSONB uses field name `index` not `exerciseIndex` (per memory)
- **Reduced motion:** `useMotionTokens()` / `AccessibilityContext` — D-18 boss VFX must respect `reducedMotion`
- **Defense in depth:** Subscription gating in BOTH `subscriptionConfig.FREE_NODE_IDS` and DB `is_free_node()`. Not directly affected by Phase 33 unless data audit adds new nodes (it doesn't)

## Sources

### Primary (HIGH confidence — direct file reads)

- `.planning/phases/33-rhythm-issues-cleanup/{33-CONTEXT.md, SEED-ISSUES.md, 33-DISCUSSION-LOG.md}` — phase context
- `.planning/phases/{30,31,32}-*/30-CONTEXT.md..32-CONTEXT.md` — prior-phase decisions
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `CLAUDE.md` — project context
- `src/hooks/useAudioEngine.js` (1259 lines) — audio infrastructure
- `src/components/games/rhythm-games/utils/rhythmTimingUtils.js` — timing + EASY_NODE_TYPES
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — OLD legacy generator (used by ArcadeRhythmGame, MetronomeTrainer, RhythmDictationGame, RhythmReadingGame)
- `src/data/patterns/RhythmPatternGenerator.js` — NEW tag-based generator (used by MixedLessonGame, RhythmReadingQuestion renderer)
- `src/data/patterns/rhythmPatterns.js` — RHYTHM_PATTERNS library
- `src/components/games/rhythm-games/MixedLessonGame.jsx` — renderer host
- `src/components/games/rhythm-games/renderers/{PulseQuestion, RhythmDictationQuestion, DiscoveryIntroQuestion}.jsx`
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` (1243 lines)
- `src/data/units/rhythmUnit{1..8}Redesigned.js` — full audit
- `supabase/migrations/20260201000002_add_rate_limiting.sql` — rate-limit RPC
- `git stash show -p stash@{0}` (568 lines diff) — WIP review
- `scripts/validateTrail.mjs` (head) — prebuild validator

### Secondary (MEDIUM confidence)

None used — research is a verify-first triage; no external lookups required.

### Tertiary (LOW confidence)

None.

## Assumptions Log

| #   | Claim                                                                                                                                                       | Section                  | Risk if Wrong                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Issue 7 root cause is the `gainNodeRef.current === null` race during MixedLessonGame mount                                                                  | §4 Audio Trace           | Fix targets wrong code; user retest reveals listen still fails. Mitigation: D-13 hook adds `isReady()` check that closes either possible cause                                                                                                                                                 |
| A2  | Issue 8 is "not-a-bug" because PulseQuestion always uses 4 quarters                                                                                         | §1 Triage Table          | If user actually meant rhythm_tap (which CAN have halves in quarter-only nodes via OLD `getPattern`), then issue 8 is a real bug requiring D-09 ArcadeRhythmGame migration. Capture in UAT script: ask user "did you see halves in pulse-game-with-circles or in tap-game-with-falling-tiles?" |
| A3  | Phase 32 D-08 "Full BOSS = 4 bars" is shipped — but research did not verify `measureCount: 4` is set in `boss_rhythm_6` and `boss_rhythm_8` rhythmConfig    | §5 Verification          | If `measureCount` is 1 (default), full BOSS uses 1-bar patterns same as MINI_BOSS. Fix: read those two unit files specifically and confirm `measureCount: 4`                                                                                                                                   |
| A4  | The OLD `getPattern()` is what makes ArcadeRhythmGame produce halves in quarter-only nodes                                                                  | §1 Triage Table issue 10 | If actually no halves are emitted (rhythmPatterns.js → schema validate fails for NPM-loaded JSON), then issue 10's variety problem is intrinsic-pool-size, fixable only by D-19 or new pattern authoring                                                                                       |
| A5  | Issue 4 for `focusDuration: '8'` (Unit 8 node 8_1) is a real bug — single-eighth intro plays plain eighths, not pairs                                       | §3 Unit 8 audit          | If user only tested Unit 3 (which uses `8_pair` correctly), then Issue 4 is fully resolved; nothing to fix in Unit 8                                                                                                                                                                           |
| A6  | Stash Chunk B (hold-notes for ArcadeRhythmGame) is in the integration-gap category; whether it's in Phase 33 scope hinges on user feedback                  | §2 WIP review            | If user retests and doesn't notice the absence, leave for later                                                                                                                                                                                                                                |
| A7  | `validateTrail.mjs` already exercises `resolveByTags` for every node. Verifying this assumption requires reading the full script (only first 40 lines read) | §9 R2                    | If validateTrail doesn't exercise resolveByTags, the safety net isn't there and D-09 changes need explicit per-node verification step in plan                                                                                                                                                  |

**If table empty:** Not applicable — multiple assumptions logged.

## Open Questions

1. **Are `boss_rhythm_6.rhythmConfig.measureCount` and `boss_rhythm_8.rhythmConfig.measureCount` set to 4?**
   - What we know: D-08 says full BOSS = 4 bars; MixedLessonGame reads `rc.measureCount || 1`; we audited rhythmConfigs above but didn't quote the `measureCount` field
   - What's unclear: Whether shipped or stuck at 1
   - Recommendation: First step of plan — read both files, fix if missing

2. **Does `validateTrail.mjs` execute `resolveByTags` against every node and fail on null?**
   - What we know: The script imports `resolveByTags` (line ~19)
   - What's unclear: Whether the loop calls it
   - Recommendation: Plan task 1 — read full validateTrail.mjs and either confirm or extend

3. **Did the rest-filter ever ship correctly for node 1_3?**
   - What we know: `patternNeedsRests` exists and is invoked when `allowRests=false` (default)
   - What's unclear: Whether MixedLessonGame's `rhythm_dictation` call at line 212-217 reaches a code path that bypasses it
   - Recommendation: Discrete UAT step (Issue 2) replays node 1_3 several times; if rests appear, instrument `resolveByTags` to log selected pattern IDs

4. **Should the discovery_intro for `focusDuration: '8'` (Unit 8) be changed to pairs OR pure off-beat demo?**
   - What we know: Unit 8 is "Syncopation"; the pedagogical goal is off-beat feel
   - What's unclear: Pedagogy author intent
   - Recommendation: Defer to user during plan-phase. Either (a) reuse `8_pair` to leverage existing 4-pair-with-pitch-alternation, or (b) add a new `mode: 'syncopated'` variant

5. **Will Stash Chunk A's migration introduce regressions in MetronomeTrainer / RhythmDictationGame / RhythmReadingGame (other consumers of OLD `getPattern`)?**
   - What we know: Stash modifies only ArcadeRhythmGame
   - What's unclear: Whether D-09's "single central fix" should also migrate those three
   - Recommendation: Per D-16, only migrate what reproduces a bug. MetronomeTrainer/RhythmDictationGame/RhythmReadingGame have not been seed-issue-implicated. Leave as-is, capture as backlog

## Environment Availability

| Dependency             | Required By                  | Available  | Version                       | Fallback                      |
| ---------------------- | ---------------------------- | ---------- | ----------------------------- | ----------------------------- |
| Vite dev server        | `npm run dev` testing        | ✓          | 6.x (per package.json)        | —                             |
| Supabase CLI           | D-07 migration deploy        | UNVERIFIED | Need `npx supabase --version` | Manual SQL via dashboard      |
| Vitest                 | optional regression tests    | ✓          | per vitest.config.js          | manual UAT only (D-06)        |
| `npm run verify:trail` | prebuild safety net for D-08 | ✓          | runs validateTrail.mjs        | run manually after data edits |
| Git stash              | inspect WIP read-only        | ✓          | git CLI                       | —                             |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** Supabase CLI is the cleanest path for D-07; if not available, manual SQL via the Supabase project dashboard works equivalently.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — codebase fully readable, all references verified
- Architecture: HIGH — both pattern-generator paths read end-to-end; flow into renderers traced
- Pitfalls: HIGH — race conditions identified by walking through async code paths
- Triage verdicts: MEDIUM-HIGH — code-level verification supports verdicts; user UAT is the ground-truth gate (per D-02)

**Research date:** 2026-05-03
**Valid until:** 2026-06-02 (30 days; rhythm code is mature, low churn)
