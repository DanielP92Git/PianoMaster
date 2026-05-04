# Phase 33: Rhythm Issues Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-03
**Phase:** 33-rhythm-issues-cleanup
**Areas discussed:** Scope & triage approach, Curriculum & data integrity, Audio bugs that survived Phase 30, Boss & Speed Challenge feel

---

## Scope & triage approach

### Q1: How to treat the seed list?

| Option                                         | Description                                                                                                                                                                       | Selected |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Verify each first, fix only survivors          | Researcher reproduces each issue against current code/build before planning fixes. Faster phase, smaller diff, no churn on already-fixed code. Risk: requires retest after fixes. | ✓        |
| Treat seed list as authoritative               | Plan fixes for all 13 issues regardless of current state. Some may be no-ops or duplicate Phase 30/31/32 work. Bigger phase, more touch points.                                   |          |
| Verify first, but assume Phase 30/31/32 worked | If shipped code looks correct, mark issue as 'likely fixed by deploy' and skip. Reduces investigation but may miss real bugs.                                                     |          |

**User's choice:** Verify each first, fix only survivors

### Q2: How should the researcher actually verify each issue?

| Option                                                 | Description                                                                                                                                                                     | Selected |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Researcher writes triage doc, user confirms by playing | Researcher reads code paths per issue, writes 'expected behavior per current code' + 'reproduction steps for user'. User plays through and marks each issue confirmed/resolved. | ✓        |
| Claude writes automated tests for each issue           | For each issue, Claude writes a test that fails if the bug exists. Tests become regression suite. Heavier upfront, but catches future regressions.                              |          |
| Skip verification — fix everything plausibly broken    | If code review shows a path where the bug could occur, fix it. No reproduction step. Risks fixing non-bugs.                                                                     |          |

**User's choice:** Researcher writes triage doc, user confirms by playing

### Q3: Rate-limit migration (issue 6) in scope?

| Option                                 | Description                                                                                                                                             | Selected |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| In scope — deploy migration this phase | Apply `20260201000002_add_rate_limiting.sql` to remote Supabase as part of Phase 33. One-line ops task; closes the console 404 alongside other cleanup. | ✓        |
| Defer — separate ops task outside GSD  | Keep Phase 33 focused on rhythm code/data. User deploys migration manually.                                                                             |          |
| Defer to a future infra phase          | Wait until other DB migrations accumulate; ship together. Console warning persists.                                                                     |          |

**User's choice:** In scope — deploy migration this phase

### Q4: How to handle confirmed regressions of shipped phases?

| Option                                   | Description                                                                                                                                   | Selected |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Treat as bug, fix in Phase 33            | Whatever survived shipping is fair game for this cleanup phase. Don't bounce back to Phase 30/31/32 — they're closed.                         | ✓        |
| File as separate hotfix outside Phase 33 | Phase 33 only handles new issues; regressions of shipped phases get a hotfix branch off main. Cleaner audit trail but more workflow friction. |          |
| Reopen the original phase                | If issue 3 traces to Phase 31, reopen Phase 31. Maintains phase-level provenance but breaks 'phases don't reopen' rule.                       |          |

**User's choice:** Treat as bug, fix in Phase 33

### Q5: Drop any seed issues outright?

| Option                                           | Description                                                                                   | Selected |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- | -------- |
| Issue 11 (rhythm pattern feels same as practice) | Phase 32 D-11 already removed all 6 Mix-Up nodes. Structurally resolved.                      | ✓        |
| Issue 12 (10 exercises too long, no halves)      | Phase 32 D-01 reduced to 8. 'No halves' part is by-design for quarters-only nodes.            | ✓        |
| Keep all — don't drop anything yet               | Defer all close/drop decisions to triage. Researcher catalogs each, user marks resolved/open. |          |

**User's choice:** Drop Issue 11 + Issue 12 (the session-length subclaim only — variety subclaim of issue 12 still gets retested)

### Q6: Done bar for Phase 33?

| Option                                                          | Description                                                                                                      | Selected |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| All confirmed-survivor bugs fixed + manual UAT passes           | Researcher's triage doc has every open issue marked resolved by user. No automated coverage requirement.         | ✓        |
| All survivors fixed + regression tests for each                 | Every fix lands with a vitest test that pins the behavior. Slower phase, but future regressions break CI.        |          |
| Survivors fixed + spot-check, user flags if more issues surface | Lighter bar — fix the obvious ones and ship. Anything discovered during ongoing UAT becomes a Phase 34 followup. |          |

**User's choice:** All confirmed-survivor bugs fixed + manual UAT passes

---

## Curriculum & data integrity

### Q1: Audit thoroughness?

| Option                                           | Description                                                                                                                                                         | Selected |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Full audit of all 8 unit files + pattern library | Researcher reads every unit's `rhythmConfig` and every pattern tag definition; flags every mismatch. Higher upfront cost but catches unreported issues before beta. | ✓        |
| Targeted fixes only for reported issues          | Fix only the specific reported nodes. Smaller diff; risk: similar bugs in unreported nodes.                                                                         |          |
| Targeted now, schedule full audit phase later    | Fix what's reported in Phase 33; defer comprehensive audit to a later phase before beta.                                                                            |          |

**User's choice:** Full audit of all 8 unit files + pattern library

### Q2: Where to enforce 'node-allowed durations'?

| Option                      | Description                                                                                                                     | Selected |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| In `RhythmPatternGenerator` | Pattern generator filters resolved patterns against `rhythmConfig.durations`. One central fix protecting all four rhythm games. | ✓        |
| In pattern tag definitions  | Re-curate which patterns belong to which tag. Doesn't fix root cause; tags can drift again.                                     |          |
| In each game component      | Every game filters generator output. Defensive but duplicates logic.                                                            |          |

**User's choice:** In `RhythmPatternGenerator`

### Q3: How to guarantee variety in combined-values nodes (issue 10)?

| Option                                                       | Description                                                                                                         | Selected |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------- |
| Force at least one pattern per declared duration per session | If `durations: ['q','h']`, session must include >=1 pattern with halves AND >=1 with quarters. Beyond that, random. | ✓        |
| Round-robin across declared durations                        | Cycle pattern selection: quarter-only → half-containing → repeat. Predictable but mechanical.                       |          |
| Weight by 'newness'                                          | `focusDurations` weighted higher than `contextDurations`. Pedagogically intentional.                                |          |

**User's choice:** Force at least one pattern per declared duration per session

### Q4: Section/content title mismatches — specific list or audit?

| Option                                    | Description                                                                                                                            | Selected |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| General impression — audit will find them | User noticed mismatches but didn't catalog. Researcher reads all `name`/`description`/exercise content per node and flags every drift. | ✓        |
| User has specific nodes in mind           | User lists specific nodes; locked targets in CONTEXT.md.                                                                               |          |
| Not sure — defer to UAT after other fixes | Skip naming; if mismatches still feel off after audit, capture as Phase 34 followups.                                                  |          |

**User's choice:** General impression — audit will find them

### Q5: Fix for node 1_3 rests issue?

| Option                                            | Description                                                                                                             | Selected |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| Remove all rests from the 'quarter-half' tag pool | Tag should yield only quarters and halves — no rests, no eighths. Same audit logic applies to every tag in early units. | ✓        |
| Add explicit `excludeDurations` to rhythmConfig   | Per-node override to filter rests at resolve time without touching pattern library. Adds config surface.                |          |
| Introduce rests earlier in curriculum             | Curriculum redesign — promote rests to Unit 1 so they're 'learned' by node 1_3. Out of scope.                           |          |

**User's choice:** Remove all rests from the 'quarter-half' tag pool

---

## Audio bugs that survived Phase 30

### Q1: Where should the dictation-listen-in-MIXED_LESSON fix live?

| Option                                                    | Description                                                                                                                                                               | Selected |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Make audio prewarm a shared hook/wrapper                  | Extract prewarm-then-schedule into a shared utility. Every renderer mount uses it — standalone OR inside MixedLessonGame. Fixes integration gap and prevents future ones. | ✓        |
| Patch MixedLessonGame to prewarm before mounting renderer | Single point of fix; doesn't generalize to other host games.                                                                                                              |          |
| Patch RhythmDictationQuestion to prewarm on every mount   | Force handleListen to always await `resumeAudioContext()`. Defensive but doesn't address other dictation bugs sharing the pattern.                                        |          |

**User's choice:** Make audio prewarm a shared hook/wrapper

### Q2: First-play trim approach if it still reproduces?

| Option                                              | Description                                                                                                                                               | Selected |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Investigate scheduler buffer + audio start time     | Likely `audioContext.currentTime + 0.1` buffer is too small OR `sound.start()` isn't waiting for context resume. Researcher traces actual playback start. | ✓        |
| Add a longer 'first-play' buffer specifically       | On first play after resume, add extra 100–200ms buffer. Subsequent plays use normal buffer.                                                               |          |
| Trust Phase 30 fix — verify via actual retest first | Maybe build tested was pre-Phase 30. Triage retests; if reproduces, then investigate.                                                                     |          |

**User's choice:** Investigate scheduler buffer + audio start time

### Q3: Eighths first-play — trim only or trim + sequence?

| Option                                                            | Description                                                                | Selected |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| Just trimming — 4-pair sequence with alternating pitch is shipped | Lock that AUDIO-03 is verified working. Phase 33 only addresses the trim.  |          |
| Both — trim AND sequence still missing                            | AUDIO-03 fix didn't deploy/work. Phase 33 redoes both.                     |          |
| Don't remember — triage will confirm                              | Researcher triage doc will reproduce and tell us. Plan covers either case. | ✓        |

**User's choice:** Don't remember — triage will confirm

### Q4: Hardening scope?

| Option                                            | Description                                                                                                        | Selected |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| Only fix what reproduces                          | Don't preemptively touch RhythmReadingGame, MetronomeTrainer, etc. unless triage shows the same bug. Smaller diff. | ✓        |
| Apply shared prewarm hook to ALL rhythm renderers | Eliminate the bug class everywhere. Larger touch surface, more retest needed.                                      |          |
| Audit but don't fix — leave as Phase 34 followups | Researcher lists every renderer that lacks prewarm; decide per-renderer in a future phase.                         |          |

**User's choice:** Only fix what reproduces

---

## Boss & Speed Challenge feel

### Q1: Boss differentiation — UX layer now or contingent?

| Option                                                         | Description                                                                                                         | Selected |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| Retest Phase 32 first; add UX layer only if still flat         | Triage confirms whether Phase 32's cumulative-units + 4-bar + harder Q-mix actually feels harder once user replays. | ✓        |
| Add UX layer regardless — boss-only intro screen + VFX + sound | Pull deferred boss-celebration ideas from Phase 32 even if content already feels harder. Bigger phase.              |          |
| Trust Phase 32 content; if still flat, defer UX to Phase 34    | Don't expand Phase 33 into UX work. Capture as polish phase for later.                                              |          |

**User's choice:** Retest Phase 32 first; add UX layer only if still flat

### Q2: Speed challenge — same-4-quarters-repeating fix?

| Option                                                       | Description                                                                                                                                          | Selected |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Retest Phase 32 D-02 first; expand pool if still feels stale | If no-consecutive rule ships and user still feels boredom, the pool is too small. Solution: pull from later units' duration sets like the boss does. | ✓        |
| Reduce session to 5–6 patterns for quarters-only sections    | Per-section TOTAL_PATTERNS override.                                                                                                                 |          |
| Accept that quarters-only speed is intrinsically limited     | Variety isn't possible if there are only quarters. No code change.                                                                                   |          |

**User's choice:** Retest Phase 32 D-02 first; expand pool if still feels stale

### Q3: Contingent boss UX minimum?

| Option                                         | Description                                                                                                                                   | Selected |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Boss intro overlay + victory VFX               | 2-second 'BOSS FIGHT' intro before game starts; on success, special VFX/sound on VictoryScreen distinct from regular nodes. No new mechanics. | ✓        |
| Just boss intro overlay                        | Smallest UX add; reuse standard victory screen.                                                                                               |          |
| Boss intro + victory VFX + boss-specific music | Full theatrical: intro, distinct music, victory celebration. Most engaging, biggest scope.                                                    |          |
| Decide post-retest — don't pre-commit          | Skip locking the contingent design until triage confirms it's needed.                                                                         |          |

**User's choice:** Boss intro overlay + victory VFX

### Q4: Contingent speed-pool fix approach?

| Option                                     | Description                                                                                                 | Selected |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------- |
| Speed challenge uses cumulative-units pool | Mirror Phase 32 boss D-06 logic: speed challenge in unit N pulls from units 1..N. Same code helper as boss. | ✓        |
| Add curated pattern variations per tag     | Hand-author more 4-beat quarter patterns to bulk up the 'quarter-only' tag pool. Bigger pattern library.    |          |
| Decide post-retest                         | Skip locking now; triage tells us if pool size is the actual problem.                                       |          |

**User's choice:** Speed challenge uses cumulative-units pool

---

## Claude's Discretion

- Exact name and signature of the shared prewarm hook (`useEnsureAudioReady`, `useAudioPrewarm`, etc.)
- Whether the duration-filter in `RhythmPatternGenerator` (D-09) goes inside `resolveByTags()` or wraps it
- Concrete algorithm for "at least one pattern per declared duration" (rejection-sample-then-fill, weighted-pull, two-phase pick)
- Exact triage doc structure (markdown table, JSON manifest, per-issue subsection)
- How to handle nodes with `focusDurations`/`contextDurations` weighting in D-10
- Visual treatment of boss intro overlay and VFX (if D-18 fires) — copy patterns from Phase 23 polish work
- Concrete buffer increase value for D-14 if confirmed (e.g., 200ms vs. 300ms)
- Whether to also add `excludeDurations` config field as a defense layer behind D-09/D-12
- Order of execution: triage → audio fixes → data audit → contingent UX, vs. fully parallel

## Deferred Ideas

- Automated regression test suite for rhythm games
- Boss-specific music sting / theatrical music swap
- Hand-authored pattern variation library expansion
- `excludeDurations` config field on rhythmConfig (defense in depth)
- Per-node `TOTAL_PATTERNS` override
- Proactive audio prewarm hardening across ALL rhythm renderers
- Curriculum redesign to introduce rests in Unit 1
- `RHYTHM_COMPLEXITY` enum cleanup
