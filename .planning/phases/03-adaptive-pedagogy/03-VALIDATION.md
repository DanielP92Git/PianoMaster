---
phase: 03
slug: adaptive-pedagogy
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-12
approved: 2026-07-12
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Generated from the actual `03-01`…`03-07` PLAN.md task list (not a template).

---

## Test Infrastructure

| Property               | Value                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| **Framework**          | Vitest ^3.2.4 (jsdom environment)                                                                      |
| **Config file**        | `vitest.config.js` (repo root)                                                                         |
| **Quick run command**  | `npx vitest run src/components/games/sight-reading-game/utils/adaptiveEngine.test.js` (per-file quick) |
| **Full suite command** | `npm run test:run`                                                                                     |
| **Estimated runtime**  | Quick per-file ~2-5s · Full suite ~90s (~1963 tests)                                                   |

---

## Sampling Rate

- **After every task commit:** Run the targeted `npx vitest run <touched file>` for that task (see Per-Task Verification Map).
- **After every plan wave:** Run `npm run test:run` (full suite).
- **Before `/gsd-verify-work`:** Full suite green, PLUS the mandatory `/gsd-secure-phase` pass (this phase's non-negotiable extra gate — covers the live-DB RLS check for `note_mastery`).
- **Max feedback latency:** ~5 seconds (per-file quick run).

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement        | Threat Ref        | Secure Behavior                                                                      | Test Type             | Automated Command                                                                                                                          | File Exists | Status     |
| -------- | ---- | ---- | ------------------ | ----------------- | ------------------------------------------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------- |
| 03-01-01 | 01   | 1    | ADAPT-01/02        | T-03-01           | Tempo clamp constants bound an absurd `tempoDeltaBpm` to a readable band             | structural (grep)     | `grep -q "export const ADAPTIVE_TIERS" …/constants/adaptiveTiers.js && grep -q "…FRACTION = 0.75" …`                                       | ✅ (self)   | ⬜ pending |
| 03-01-02 | 01   | 1    | ADAPT-01/02        | T-03-01 / T-03-02 | Pure engine: easing-wins-tie, tempo clamp extremes, cold-start uniform               | unit (tdd)            | `npx vitest run src/components/games/sight-reading-game/utils/adaptiveEngine.test.js`                                                      | ❌ W0       | ⬜ pending |
| 03-02-01 | 02   | 1    | ADAPT-03/04        | T-03-04           | Migration is DDL-only, no `CREATE POLICY`/`ALTER POLICY` (RLS inherited)             | structural (grep)     | `test -f …/20260712120000_add_note_mastery.sql && grep -q "ADD COLUMN IF NOT EXISTS note_mastery"`                                         | ✅ (self)   | ⬜ pending |
| 03-02-02 | 02   | 1    | ADAPT-03/04        | T-03-03 / T-03-05 | Per-pitch delta validated (non-neg ints, correct<=total); no-op when omitted         | unit (tdd)            | `npx vitest run src/services/skillProgressService.test.js`                                                                                 | ✅ extend   | ⬜ pending |
| 03-03-01 | 03   | 1    | ADAPT-01 / I18N-01 | T-03-07           | EN↔HE key parity; no easing/negative copy exists                                    | unit (parity)         | `npx vitest run src/locales/__tests__/sight-reading-parity.test.js`                                                                        | ✅ existing | ⬜ pending |
| 03-03-02 | 03   | 1    | ADAPT-01 / I18N-01 | T-03-07           | Cue is reduced-motion aware; copy localized (no hardcoded literal)                   | component             | `npx vitest run src/components/games/sight-reading-game/components/LevelUpCue.test.jsx`                                                    | ❌ W0       | ⬜ pending |
| 03-04-01 | 04   | 1    | ADAPT-01/02        | T-03-08           | Ref-mirrored streak/tier reset on BOTH session boundaries; no regression             | component             | `npx vitest run src/contexts`                                                                                                              | ✅ existing | ⬜ pending |
| 03-04-02 | 04   | 1    | ADAPT-01/02        | T-03-08           | `loadExercisePattern(overrideSettings)` seam is byte-for-byte no-op default          | component             | `npx vitest run src/components/games/sight-reading-game`                                                                                   | ✅ existing | ⬜ pending |
| 03-05-01 | 05   | 2    | ADAPT-01/02        | T-03-09           | Tier computed from pristine baseline (no compounding); tempo clamped                 | structural (grep)     | `grep -q "computeNextTier(" …/SightReadingGame.jsx && grep -q "applyTierToSettings(" … && grep -q "loadExercisePattern(adaptedSettings" …` | ✅ (self)   | ⬜ pending |
| 03-05-02 | 05   | 2    | ADAPT-01/02        | T-03-09 / T-03-10 | Tier lands at N+1 not N+2 (stale-closure guard); escalation cue only                 | integration           | `npx vitest run src/components/games/sight-reading-game/__tests__/SightReadingGame.adaptive.test.jsx`                                      | ❌ W0       | ⬜ pending |
| 03-05-03 | 05   | 2    | ADAPT-02           | T-03-09           | Timing windows stay positive/non-degenerate at 1.25x tempo (both modes)              | unit                  | `npx vitest run src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js`                                                   | ✅ extend   | ⬜ pending |
| 03-06-01 | 06   | 3    | ADAPT-03/04        | T-03-12 / T-03-13 | Session mastery accumulates; Practice mode skips the write (suppressPersistence)     | integration           | `npx vitest run src/components/games/sight-reading-game/__tests__/SightReadingGame.mastery.test.jsx`                                       | ✅ (self)   | ⬜ pending |
| 03-06-02 | 06   | 3    | ADAPT-03/04        | T-03-11           | Read gated by `verifyStudentDataAccess`; bias stays in node pool; cold-start uniform | integration           | `npx vitest run src/components/games/sight-reading-game/__tests__/SightReadingGame.mastery.test.jsx`                                       | ✅ extend   | ⬜ pending |
| 03-07-01 | 07   | 2    | ADAPT-03/04        | T-03-14           | Owner-approval gate before touching production (checkpoint:decision)                 | checkpoint (manual)   | N/A — human decision gate                                                                                                                  | N/A         | ⬜ pending |
| 03-07-02 | 07   | 2    | ADAPT-03/04        | T-03-15 / T-03-16 | Live `note_mastery` column exists (jsonb), inherits RLS, no new policy               | manual-only (live DB) | MISSING — see Manual-Only Verifications (`/gsd-secure-phase`)                                                                              | N/A         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_
_File Exists: ✅ (self) = task authors the checked artifact itself · ❌ W0 = new test file authored within its owning task (see Wave 0 Requirements) · ✅ existing/extend = pre-existing suite._

---

## Wave 0 Requirements

All new test files are authored **inside their owning plan/task** (TDD tasks write the test alongside the implementation; component/integration tasks author the render/regression test in the same task). No separate scaffold plan is outstanding:

- [x] `adaptiveEngine.js` + `adaptiveEngine.test.js` — authored in **03-01 Task 2** (tdd RED→GREEN).
- [x] `LevelUpCue.test.jsx` — authored in **03-03 Task 2** (alongside the component).
- [x] `SightReadingGame.adaptive.test.jsx` — authored in **03-05 Task 2** (stale-closure regression, Pitfall 2). 03-05 Task 1 self-verifies its boundary wiring via structural grep (the test file does not exist yet when Task 1 runs).
- [x] `SightReadingGame.mastery.test.jsx` — **created in 03-06 Task 1** (accumulation + Practice-skip plumbing), **extended in 03-06 Task 2** (read-side weak-note bias + cold-start).
- [x] `20260712120000_add_note_mastery.sql` — authored in **03-02 Task 1** (migration file).

Existing suites extended in-place: `skillProgressService.test.js` (03-02), `useTimingAnalysis.test.js` (03-05), `sight-reading-parity.test.js` (03-03), `src/contexts` context tests (03-04).

---

## Manual-Only Verifications

| Behavior                                                                                      | Requirement | Why Manual                                                                                                                                     | Test Instructions                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live `note_mastery` column exists on `student_skill_progress` (jsonb, GIN index)              | ADAPT-03    | Requires a live Supabase project; no Supabase CLI on PATH in the exec env and this app derives no types from the DB (build passes without it). | Via `/gsd-secure-phase` / Supabase MCP: `mcp__supabase__execute_sql` → `select column_name, data_type from information_schema.columns where table_name = 'student_skill_progress' and column_name = 'note_mastery'` returns exactly one `jsonb` row; `mcp__supabase__list_tables` confirms it. |
| RLS: a student cannot read/write another student's `note_mastery`; teacher SELECT still works | ADAPT-04    | DB-level RLS enforcement is not testable in Vitest; needs the live project and `/gsd-secure-phase` tooling.                                    | Via `/gsd-secure-phase`: confirm no new policy on `student_skill_progress` beyond the pre-existing `_insert_own` / `_update_own` / `_select_consolidated` set; verify the new column inherits row-level `student_id = auth.uid()` on write and the existing SELECT policy for read.            |

_The 03-07 checkpoint gate (owner approval to apply production DDL) is a `checkpoint:decision`, resolved by the owner at execution time — recorded in the map above, not a behavior verification._

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or a recorded manual-only exception (only 03-07-02, covered by `/gsd-secure-phase`).
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (only the two 03-07 tasks are manual, and they are the phase's terminal deploy gate).
- [x] Wave 0 covers all MISSING references (all new test files authored inside their owning tasks).
- [x] No watch-mode flags (all commands use `vitest run`).
- [x] Feedback latency < 5s (per-file quick run).
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-07-12
