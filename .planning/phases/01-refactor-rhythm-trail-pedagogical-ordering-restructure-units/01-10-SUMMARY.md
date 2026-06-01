---
phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
plan: 10
subsystem: deploy
tags:
  [pwa, cache-bump, cleanup, claude-md, supabase, db-push, uat, owner-pending]

requires:
  - phase: 01
    provides: |
      Plan 04 — Supabase migration file at supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql
      (atomic rhythm-row DELETE + is_free_node() body swap to D-12 whitelist).
  - phase: 01
    provides: |
      Plan 08 — expandedNodes.js no longer imports the OLD rhythmUnit{1..7}Redesigned.js files;
      rhythmUnits.difficulty.test.js covers v3.5 variety assertions, replacing OLD DATA-04 coverage.
  - phase: 01
    provides: |
      Plan 09 — DiscoveryIntroQuestion multi-card pagination landed and tests are green
      (so the UAT walkthrough at Task 5 will actually exercise the new scaffolding contract).

provides:
  - PWA cache version bumped (v11 → v12) so clients re-fetch new locales + rhythm bundles after deploy.
  - Legacy unit files removed (7 OLD rhythmUnit{1..7}Redesigned.js + rhythmUnit7Redesigned.test.js).
  - CLAUDE.md node-count math updated to reflect the v3.5 structure (Rhythm 55, Boss 12, total 106).
  - Owner-pending blocking gates surfaced in 01-VERIFICATION.md as human_verification items
    (Task 4 supabase db push per D-13, Task 5 SC-9 UAT walkthrough).

affects:
  - "v3.5 deploy window — Task 4/5 are owner-gated and unblock the rhythm trail release."
  - "Future syncopation re-enable plan — preserved hidden Unit 8 (rhythmUnit8Redesigned.{js,test.js}) untouched."

tech-stack:
  added: []
  patterns:
    - "Owner-gated checkpoint completion — non-autonomous tasks recorded as owner-pending in SUMMARY + surfaced for human_verification rather than executed by the agent."

key-files:
  created:
    - .planning/phases/01-refactor-rhythm-trail-pedagogical-ordering-restructure-units/01-10-SUMMARY.md
  modified:
    - public/sw.js
    - CLAUDE.md
    - src/data/units/rhythmUnit8Redesigned.test.js
  deleted:
    - src/data/units/rhythmUnit1Redesigned.js
    - src/data/units/rhythmUnit2Redesigned.js
    - src/data/units/rhythmUnit3Redesigned.js
    - src/data/units/rhythmUnit4Redesigned.js
    - src/data/units/rhythmUnit5Redesigned.js
    - src/data/units/rhythmUnit6Redesigned.js
    - src/data/units/rhythmUnit7Redesigned.js
    - src/data/units/rhythmUnit7Redesigned.test.js

key-decisions:
  - "Task 2 took Option 2: strip DATA-04 from rhythmUnit8Redesigned.test.js + delete 7 OLD source files + 1 OLD test. Option 1 (remap to v3.5 IDs) would silently encode wrong assertions because OLD/NEW rhythm_{1,2,3}_4 IDs diverged in meaning under Plans 04–05; Option 3 (defer) leaves dead code the validator can't reason about. DATA-04's variety invariant is now covered by Plan 08's rhythmUnits.difficulty.test.js."
  - "Task 4 (supabase db push) and Task 5 (UAT walkthrough) recorded as owner-pending — Claude does not execute production DB pushes or device-level UAT inside a worktree per D-13/SC-9."
  - "Plan listed rhythmUnit1Redesigned.test.js for deletion but the file never existed; recorded the discrepancy here rather than fixing the plan post-hoc."

patterns-established:
  - "Pre-deletion grep guard — when a plan deletes shared source, run the plan's own grep guard before rm so cross-cutting imports (e.g. the syncopation test's DATA-04 block) are surfaced as architectural decisions rather than discovered as test failures post-merge."

requirements-completed:
  - REQ-05
  - REQ-06

duration: 12min
completed: 2026-06-02
---

# Phase 01 / Plan 10: Deploy and verify — SUMMARY

**Closed out Phase 1 v3.5 at the code layer: PWA cache bumped, legacy OLD unit files cleared, CLAUDE.md node math updated, and the two owner-gated tasks (supabase db push + UAT) surfaced as human_verification items so the verifier and `update_roadmap` warning scan can track them.**

## Performance

- **Duration:** ~12 min of executor work + ~5 min orchestrator inline (Task 2 + SUMMARY)
- **Started:** 2026-06-01T22:00Z (executor agent dispatch)
- **Completed:** 2026-06-02T00:20Z (orchestrator SUMMARY commit)
- **Tasks (code-layer):** 3 of 3 complete (Task 1, Task 2, Task 3)
- **Tasks (owner-pending):** 2 of 2 surfaced (Task 4, Task 5)
- **Files modified / deleted:** 3 modified, 8 deleted

## Accomplishments

- PWA cache version bumped `pianomaster-v11 → pianomaster-v12` (`public/sw.js`) so PWA clients re-fetch new locales + rhythm bundle code on first navigation after deploy.
- 7 OLD `rhythmUnit{1..7}Redesigned.js` source files + `rhythmUnit7Redesigned.test.js` deleted. Hidden syncopation files (`rhythmUnit8Redesigned.{js,test.js}`) preserved per D-10 / HIDDEN-V1 re-enable contract.
- DATA-04 "Combined-values node variety" describe block (and its U1/U2/U3 imports + `resolveByTags` import) stripped from `rhythmUnit8Redesigned.test.js`. Plan 08's `rhythmUnits.difficulty.test.js` now owns the v3.5 variety invariant.
- CLAUDE.md "Gamification Trail System" + "Hidden Content: Rhythm Unit 8 (Syncopation)" sections rewritten to: 106 active nodes (Treble 23 / Bass 22 / Rhythm 55 / Boss 12), rhythm terminus `boss_rhythm_10`, syncopation rename `rhythm_8_*` → `rhythm_synco_*` documented with re-enable steps.
- Task 4 + Task 5 documented as owner-pending; verifier will pick them up as `human_verification` items.

## Task Commits

1. **Task 1: Bump SW cache v11 → v12** — `b13acdb` (feat)
2. **Task 3: Update CLAUDE.md node count math + Hidden Unit 8 section** — `23faf3f` (docs)
   - _Task 3 was executed before Task 2 because Task 2's pre-deletion grep guard tripped and required a user decision; Task 3 is text-only and independent._
3. **Task 2: Delete OLD Redesigned files + strip DATA-04 from syncopation test (Option 2)** — `ec216f0` (chore)
4. **Plan SUMMARY** — to be committed alongside this file.

Tasks 4 and 5 are owner-gated checkpoints; they do not produce commits inside this worktree.

## Files Created / Modified / Deleted

### Modified

- `public/sw.js` — `CACHE_NAME = "pianomaster-v12"` + dated comment.
- `CLAUDE.md` — Gamification Trail System node-count math + Hidden Content section rewrite.
- `src/data/units/rhythmUnit8Redesigned.test.js` — removed DATA-04 describe block (lines 169–221) + 4 OLD imports (rhythmUnit1/2/3Nodes + resolveByTags). Now 20 tests (was 23).

### Deleted (8 files, ~2,975 lines)

- `src/data/units/rhythmUnit1Redesigned.js`
- `src/data/units/rhythmUnit2Redesigned.js`
- `src/data/units/rhythmUnit3Redesigned.js`
- `src/data/units/rhythmUnit4Redesigned.js`
- `src/data/units/rhythmUnit5Redesigned.js`
- `src/data/units/rhythmUnit6Redesigned.js`
- `src/data/units/rhythmUnit7Redesigned.js`
- `src/data/units/rhythmUnit7Redesigned.test.js`

### Preserved (per D-10 / HIDDEN-V1)

- `src/data/units/rhythmUnit8Redesigned.js` (renamed-ID syncopation, hidden)
- `src/data/units/rhythmUnit8Redesigned.test.js` (now sans DATA-04)

## Decisions Made

- **Option 2 over Options 1 and 3 for Task 2's DATA-04 collision.** Reasoning recorded in `key-decisions` above. Owner confirmed delegation; orchestrator chose.
- **Owner-pending recording over inline execution for Tasks 4 + 5.** D-13 explicitly ties supabase db push to owner sign-off; SC-9 requires real-device UAT. Recording them in SUMMARY + letting the verifier surface them as `human_verification` matches the established GSD pattern for `checkpoint:human-action` / `checkpoint:human-verify` tasks.
- **Did not fix the plan post-hoc** when `rhythmUnit1Redesigned.test.js` (listed in plan but absent from repo) failed to delete. Recorded the discrepancy here.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Plan accuracy] `rhythmUnit1Redesigned.test.js` listed but missing.**

- **Found during:** Task 2 deletion command (`rm` returned non-zero on that path).
- **Issue:** Plan frontmatter `files_modified` and Task 2's deletion list included `rhythmUnit1Redesigned.test.js`, but the file did not exist in the repo at any reachable commit on this branch.
- **Fix:** Proceeded with the remaining 8 file deletions; documented the discrepancy in this SUMMARY rather than editing the plan after the fact.
- **Files modified:** none (no edit to plan).
- **Verification:** `ls src/data/units/rhythmUnit*Redesigned*` returns only `rhythmUnit8Redesigned.{js,test.js}` (the preserved syncopation pair).
- **Committed in:** part of `ec216f0`.

### Checkpoint Deviation

**2. [Plan structure] Task 3 executed before Task 2.**

- **Found during:** Task 2 grep guard returned matches; plan said STOP and surface to user.
- **Issue:** Original plan ordering was 1 → 2 → 3 → 4 → 5. Stopping at Task 2 would have blocked Task 3 (text-only edit to CLAUDE.md) unnecessarily.
- **Fix:** Executor opportunistically executed Task 3 (independent, text-only, no shared deps) before pausing for the Task 2 checkpoint. Orchestrator approved.
- **Files modified:** `CLAUDE.md` (Task 3) was committed before `src/data/units/*` (Task 2).
- **Verification:** Linear history `b13acdb → 23faf3f → ec216f0` shows ordering; both `verify:trail` and `vitest run src/data/units/` are green at HEAD.

## Owner-Pending Gates

The following two tasks remain blocking on owner action and are surfaced here so the phase verifier can pick them up as `human_verification` items:

### Task 4 — `[BLOCKING]` `supabase db push` (D-13)

**Owner action required:** Apply `supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql` to production BEFORE the Netlify code deploy.

**Pre-push checklist:**

1. `supabase status` — confirm CLI session targets the prod project ref.
2. `supabase migration list` — confirm the Phase 1 migration is the only pending entry.
3. `supabase db diff --linked --schema public` — dry-run inspection.
4. Record pre-push `SELECT SUM(total_xp) FROM students;` value.
5. `supabase db push`.

**Post-push verification:**

- `SELECT COUNT(*) FROM student_skill_progress WHERE node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%';` → expect `0`.
- `SELECT SUM(total_xp) FROM students;` → unchanged from pre-push value.
- `SELECT is_free_node('rhythm_1_1');` → `TRUE`
- `SELECT is_free_node('rhythm_1_5');` → `TRUE`
- `SELECT is_free_node('boss_rhythm_1');` → `TRUE`
- `SELECT is_free_node('rhythm_1_6');` → `FALSE`
- `SELECT is_free_node('rhythm_2_1');` → `FALSE`
- **Only after the above pass:** trigger Netlify deploy and tail the build log for `pianomaster-v12` in the deployed `sw.js`.

### Task 5 — Owner UAT walkthrough (SC-9)

**Owner action required:** After Task 4 and Netlify deploy, walk every rhythm node `rhythm_1_1 → boss_rhythm_10` on a real device.

**Per the plan, the UAT covers:**

- Pulse-first ordering, rests-woven scaffolding cards (4 cards on duration intros, 3 on rest intros).
- Paywall: U1 free, U2+ paid.
- XP preservation against the value recorded in Task 4.
- Hebrew RTL spot-check on 2–3 scaffolding nodes (no clipping, correct nikud).
- `/trail` UI: 10 rhythm units render; U10 = terminus; hidden syncopation invisible.
- Non-rhythm regression spot-check on Treble U1 + Bass U1.

**Resume signals (from plan):**

- "walkthrough complete — all 55 rhythm nodes pass …" → Phase 1 verified, proceed to `/gsd-verify-work`.
- "walkthrough complete — issues found: …" → triage to hotfix plan or defer.
- "walkthrough incomplete — blocked on …" → assist with blocker.

## Verification

- `npm run verify:trail` → all 5 principle checks OK (game-type policy, pulse-first REQ-01, rests-woven REQ-02, concept-per-unit REQ-03, measure count policy).
- `npx vitest run src/data/units/` → 14 files / 253 tests / all passing.
- `grep -c "pianomaster-v12" public/sw.js` → 2 (constant + dated comment).
- `grep -c "Rhythm: 55" CLAUDE.md` → ≥ 1.
- `grep -c "rhythm_synco_" CLAUDE.md` → ≥ 2.
- `ls src/data/units/rhythmUnit8Redesigned.js` → exists (preserved).
- `ls src/data/units/rhythmUnit{1..7}Redesigned.js` → none exist (deleted).
