---
phase: 1
slug: refactor-rhythm-trail-pedagogical-ordering-restructure-units
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-01
updated: 2026-06-29
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> See `01-RESEARCH.md` § "Validation Architecture" for the principle-by-principle falsifiability map this strategy implements.

---

## Test Infrastructure

| Property               | Value                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| **Framework**          | Vitest (jsdom) + Node CLI validator (`scripts/validateTrail.mjs`)      |
| **Config file**        | `vitest.config.js`, `package.json` (`verify:trail`, `verify:patterns`) |
| **Quick run command**  | `npm run verify:trail`                                                 |
| **Full suite command** | `npm run verify:trail && npm run test:run`                             |
| **Estimated runtime**  | ~60 seconds (full suite)                                               |

---

## Sampling Rate

- **After every task commit:** Run `npm run verify:trail` (~2 s; catches structural breakage immediately)
- **After every plan wave:** Run `npm run verify:trail && npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green; manual UAT (SC-9) signed off
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

> Filled by the planner during plan-phase. Each row records one task's automated verify command + which spec/security gate it covers.

| Task ID  | Plan | Wave | Requirement                    | Threat Ref                | Secure Behavior                                                                                                       | Test Type                            | Automated Command                                                                                                                                                                                                                                                                                                                   | File Exists           | Status      |
| -------- | ---- | ---- | ------------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------- |
| 01-01-T1 | 01   | 0    | REQ-01, REQ-02, REQ-03         | T-01-01                   | Validator rules enforce principle gates                                                                               | unit (validator)                     | `npm run verify:trail`                                                                                                                                                                                                                                                                                                              | ✅ exists             | ✅ green    |
| 01-01-T2 | 01   | 0    | REQ-01, REQ-02, REQ-03         | T-01-01                   | Sibling tests exercise rule logic with positive + negative fixtures                                                   | unit (vitest)                        | `npx vitest run scripts/__tests__/validateTrail.principles.test.mjs`                                                                                                                                                                                                                                                                | ✅ exists             | ✅ green    |
| 01-01-T3 | 01   | 0    | REQ-05                         | T-03-02, T-04-02          | Parity tests catch JS↔SQL and EN↔HE drift                                                                           | unit (vitest)                        | `npx vitest run src/locales/__tests__/scaffolding-card-parity.test.js src/config/__tests__/freeNodes.parity.test.js`                                                                                                                                                                                                                | ✅ exists             | ✅ green    |
| 01-02-T1 | 02   | 1    | REQ-05                         | T-02-01                   | Hidden unit ID rename frees rhythm*8*\* namespace                                                                     | unit (vitest)                        | `npx vitest run src/data/units/rhythmUnit8Redesigned.test.js src/data/units/rhythmUnits.difficulty.test.js`                                                                                                                                                                                                                         | ✅ exists             | ✅ green    |
| 01-02-T2 | 02   | 1    | REQ-05                         | T-02-01                   | No leftover rhythm*8*\* references in repo                                                                            | grep + validator                     | `npm run verify:trail && grep -rn "rhythm_8_\|boss_rhythm_8" src/ scripts/ supabase/ public/ \| grep -v rhythm_synco` (must return zero)                                                                                                                                                                                            | ✅ exists             | ✅ green    |
| 01-03-T1 | 03   | 1    | REQ-04                         | n/a                       | (decision checkpoint — no auto verify)                                                                                | checkpoint                           | n/a (user signs off voice/structure)                                                                                                                                                                                                                                                                                                | n/a                   | ✅ manual ✓ |
| 01-03-T2 | 03   | 1    | REQ-04, REQ-05                 | T-03-01, T-03-02          | Scaffolding card copy exists in EN+HE with key parity                                                                 | unit (vitest)                        | `node -e "JSON.parse(require('fs').readFileSync('src/locales/en/common.json'))" && node -e "JSON.parse(require('fs').readFileSync('src/locales/he/common.json'))" && npx vitest run src/locales/__tests__/scaffolding-card-parity.test.js`                                                                                          | ✅ exists             | ✅ green    |
| 01-03-T3 | 03   | 1    | REQ-05                         | n/a                       | Unit display-name entries parsable JSON                                                                               | unit (node)                          | `node -e "JSON.parse(require('fs').readFileSync('src/locales/en/trail.json'))" && node -e "JSON.parse(require('fs').readFileSync('src/locales/he/trail.json'))"`                                                                                                                                                                    | ✅ exists             | ✅ green    |
| 01-04-T1 | 04   | 1    | REQ-05                         | T-04-02                   | FREE_NODE_IDS parity test green; boss_rhythm_1 in FREE_NODE_IDS Set                                                   | unit (vitest)                        | `npx vitest run src/config/__tests__/freeNodes.parity.test.js`                                                                                                                                                                                                                                                                      | ✅ exists             | ✅ green    |
| 01-04-T2 | 04   | 1    | REQ-06                         | T-04-01, T-04-03, T-04-04 | Migration scoped DELETE; no students_score touch; safe predicate                                                      | grep gate                            | `test -f supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql && grep -c "DELETE FROM student_skill_progress" $_ \| grep -q "^1$" && grep -c "CREATE OR REPLACE FUNCTION public.is_free_node" $_ \| grep -q "^1$" && (grep -E "UPDATE.*students_score\|DELETE FROM students_score" $_ ; if [ $? -eq 0 ]; then exit 1; fi)` | ✅ exists             | ✅ green    |
| 01-05-T1 | 05   | 2    | REQ-01, REQ-02, REQ-03, REQ-04 | n/a                       | U1 data file has correct rhythm_1_1 anchor + qr in rhythm_1_3                                                         | unit (vitest)                        | `npx vitest run src/data/units/rhythmUnit1.test.js`                                                                                                                                                                                                                                                                                 | ✅ exists             | ✅ green    |
| 01-05-T2 | 05   | 2    | REQ-01, REQ-02, REQ-03, REQ-04 | n/a                       | U2 data file (Half + Half Rest)                                                                                       | unit (vitest)                        | `npx vitest run src/data/units/rhythmUnit2.test.js`                                                                                                                                                                                                                                                                                 | ✅ exists             | ✅ green    |
| 01-05-T3 | 05   | 2    | REQ-01, REQ-02, REQ-03, REQ-04 | n/a                       | U3 data file (Whole + Whole Rest)                                                                                     | unit (vitest)                        | `npx vitest run src/data/units/rhythmUnit3.test.js`                                                                                                                                                                                                                                                                                 | ✅ exists             | ✅ green    |
| 01-06-T1 | 06   | 2    | REQ-01, REQ-03, REQ-04         | n/a                       | U4 (Eighths) — first-subdivision concept anchored; mixed-contrast orderInUnit=3 has empty focusDurations              | unit (vitest)                        | `npx vitest run src/data/units/rhythmUnit4.test.js`                                                                                                                                                                                                                                                                                 | ✅ exists             | ✅ green    |
| 01-06-T2 | 06   | 2    | REQ-01, REQ-03, REQ-04         | n/a                       | U5 (Sixteenths)                                                                                                       | unit (vitest)                        | `npx vitest run src/data/units/rhythmUnit5.test.js`                                                                                                                                                                                                                                                                                 | ✅ exists             | ✅ green    |
| 01-07-T1 | 07   | 2    | REQ-01, REQ-03, REQ-04         | n/a                       | U6 (Dotted Half) — {hd}-only family                                                                                   | unit (vitest)                        | `npx vitest run src/data/units/rhythmUnit6.test.js`                                                                                                                                                                                                                                                                                 | ✅ exists             | ✅ green    |
| 01-07-T2 | 07   | 2    | REQ-01, REQ-03, REQ-04         | n/a                       | U7 (Dotted Quarter) — {qd}-only family, strict separation from U6 per D-04                                            | unit (vitest)                        | `npx vitest run src/data/units/rhythmUnit7.test.js`                                                                                                                                                                                                                                                                                 | ✅ exists             | ✅ green    |
| 01-07-T3 | 07   | 2    | REQ-01, REQ-03, REQ-04         | n/a                       | U8 (3/4 Meter) — all timeSignature='3/4'; occupies freed rhythm*8*_ namespace; no rhythm*synco*_ leakage              | unit (vitest)                        | `npx vitest run src/data/units/rhythmUnit8.test.js`                                                                                                                                                                                                                                                                                 | ✅ exists             | ✅ green    |
| 01-08-T1 | 08   | 2    | REQ-01, REQ-03, REQ-04         | n/a                       | U9 (6/8 Meter) — all timeSignature='6/8'                                                                              | unit (vitest)                        | `npx vitest run src/data/units/rhythmUnit9.test.js`                                                                                                                                                                                                                                                                                 | ✅ exists             | ✅ green    |
| 01-08-T2 | 08   | 2    | REQ-01, REQ-03, REQ-04         | n/a                       | U10 (Rhythm Review) — single BOSS, patternTagMode='any', prereq=boss_rhythm_9, ARCADE_RHYTHM exercise per BOSS policy | unit (vitest)                        | `npx vitest run src/data/units/rhythmUnit10.test.js`                                                                                                                                                                                                                                                                                | ✅ exists             | ✅ green    |
| 01-08-T3 | 08   | 2    | REQ-05                         | n/a                       | expandedNodes.js wired; HIDDEN-V1 marker preserved with renamed binding                                               | module-load                          | `node --input-type=module -e "import('./src/data/expandedNodes.js').then(m => { if (m.EXPANDED_RHYTHM_NODES.length < 50) process.exit(1); })"`                                                                                                                                                                                      | ✅ exists             | ✅ green    |
| 01-08-T4 | 08   | 2    | REQ-05                         | n/a                       | skillTrail.js UNITS map has RHYTHM_1..10 + RHYTHM_SYNCO entries                                                       | module-load                          | `node --input-type=module -e "import('./src/data/skillTrail.js').then(m => { const k = Object.keys(m.UNITS).filter(x => x.startsWith('RHYTHM')); if (k.length < 11) process.exit(1); })"`                                                                                                                                           | ✅ exists             | ✅ green    |
| 01-08-T5 | 08   | 2    | REQ-05                         | n/a                       | Full integration gate — verify:trail + all unit tests green                                                           | full suite                           | `npm run verify:trail && npx vitest run src/data/units/`                                                                                                                                                                                                                                                                            | ✅ exists             | ✅ green    |
| 01-09-T1 | 09   | 3    | REQ-04                         | n/a                       | 5 new pagination test cases authored (RED phase)                                                                      | unit (vitest)                        | `npx vitest run src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx` (5 new tests fail initially — intentional)                                                                                                                                                                                   | ✅ exists             | ✅ green    |
| 01-09-T2 | 09   | 3    | REQ-04, REQ-07                 | n/a                       | DiscoveryIntroQuestion supports multi-card pagination; focusPattern path preserved                                    | unit (vitest)                        | `npx vitest run src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx`                                                                                                                                                         | ✅ exists             | ✅ green    |
| 01-10-T1 | 10   | 3    | REQ-05                         | T-10-02                   | SW cache version bumped to v12                                                                                        | grep                                 | `grep -c "pianomaster-v12" public/sw.js`                                                                                                                                                                                                                                                                                            | ✅ exists             | ✅ green    |
| 01-10-T2 | 10   | 3    | REQ-05                         | T-10-03                   | OLD rhythmUnit{1..7}Redesigned.js deleted; hidden U8 preserved; verify still green                                    | full suite                           | `test ! -f src/data/units/rhythmUnit1Redesigned.js && test -f src/data/units/rhythmUnit8Redesigned.js && npm run verify:trail && npx vitest run src/data/units/`                                                                                                                                                                    | n/a (deletions)       | ✅ green    |
| 01-10-T3 | 10   | 3    | REQ-05                         | n/a                       | CLAUDE.md node count math updated                                                                                     | grep                                 | `grep -c "Rhythm: 55" CLAUDE.md && grep -c "rhythm_synco_" CLAUDE.md && grep -c "boss_rhythm_10" CLAUDE.md`                                                                                                                                                                                                                         | ✅ exists             | ✅ green    |
| 01-10-T4 | 10   | 3    | REQ-06                         | T-10-01                   | Production migration applied with post-flight checks (manual)                                                         | manual (checkpoint:human-action)     | Owner runs `supabase db push` + post-flight SELECT queries                                                                                                                                                                                                                                                                          | n/a (production gate) | ✅ manual ✓ |
| 01-10-T5 | 10   | 3    | All                            | n/a                       | Owner UAT walkthrough — every rhythm node, EN+HE parity, XP preserved (SC-9)                                          | manual UAT (checkpoint:human-verify) | Owner walkthrough on real student account                                                                                                                                                                                                                                                                                           | n/a (UAT)             | ✅ manual ✓ |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [x] `scripts/validateTrail.mjs` — extend with principle lint rules (`validatePulseFirst`, `validateRestsWoven`, `validateConceptPerUnit`); covered by Plan 01 Task 1
- [x] `scripts/__tests__/validateTrail.principles.test.mjs` — unit tests for each new lint rule (positive + negative fixtures); covered by Plan 01 Task 2
- [x] `src/config/__tests__/freeNodes.parity.test.js` — diff test that the JS `FREE_NODE_IDS` Set matches the SQL `is_free_node()` whitelist; covered by Plan 01 Task 3
- [x] `src/locales/__tests__/scaffolding-card-parity.test.js` — every new EN key has a HE counterpart (and vice versa); covered by Plan 01 Task 3

---

## Manual-Only Verifications

| Behavior                                                                                                                                                      | Requirement                                 | Why Manual                                                              | Test Instructions                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Owner walkthrough on a real student account: complete every rhythm node from rhythm_1_1 through boss_rhythm_10 without confusion / softlocks / paywall breaks | SC-9 (Acceptance Criteria #9 in 01-SPEC.md) | Subjective UX gate — "kid-friendly", "no confusion" cannot be automated | See Plan 10 Task 5 `<how-to-verify>` — full 55-node walkthrough including EN+HE parity, paywall checks, XP preservation, trail map UI spot-check, no regression in non-rhythm trails |
| Hebrew RTL render of all new explainer copy                                                                                                                   | SC-8                                        | Hebrew nikud + RTL layout — visual-only failure modes                   | Plan 10 Task 5 step 5: switch locale to `he`; walk through 2-3 scaffolding nodes; confirm card titles + body in Hebrew, Kodaly nikud unchanged, no RTL clipping                      |
| Supabase migration applied before code deploy (D-13 ordering)                                                                                                 | REQ-06                                      | Deploy choreography — not testable in CI                                | Plan 10 Task 4 `[BLOCKING]` checkpoint — owner runs `supabase db push` + post-flight SELECT queries before triggering Netlify deploy                                                 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify OR Wave 0 dependencies OR are explicit human-checkpoint tasks (Plan 03 Task 1, Plan 10 Tasks 4-5)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (Wave 0/1/2/3 all have automated gates per task)
- [x] Wave 0 covers all MISSING references (validator rules, validator test, scaffolding parity test, FREE_NODE_IDS parity test)
- [x] No watch-mode flags
- [x] Feedback latency < 60 s (verify:trail ~2s; per-unit tests ~5-10s; full suite ~60s)
- [x] Manual UAT (SC-9) walkthrough scheduled before phase verify (Plan 10 Task 5)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner sign-off 2026-06-01. Ready for `/gsd-execute-phase 1`.

---

## Validation Audit 2026-06-29

Retroactive Nyquist audit (State A) of the executed phase. All 17 map-referenced test
files exist on disk; every automated gate re-run green at audit time:

- `npm run verify:trail` → Pulse-first / Rests-woven / Concept-per-unit / duration-safety /
  game-type / measure-count all **OK** (only pre-existing low-variety + orphan-tag warnings).
- `npx vitest run` over all map suites (validator principles, locale + FREE_NODE_IDS parity,
  `rhythmUnit1..10` + difficulty, `rhythmUnit8Redesigned`, `DiscoveryIntroQuestion`,
  `MixedLessonGame`) → **292 / 292 passing across 19 files**.
- Grep gates: migration file present with scoped `DELETE FROM student_skill_progress` (×1),
  `is_free_node` redefine (×1), zero `students_score` mutations; legacy `rhythmUnit*Redesigned.js`
  deleted except the hidden-syncopation `rhythmUnit8Redesigned.js`; CLAUDE.md counts updated.

Notes on intentional drift (not gaps):

- **`rhythm_8_*` references** in `rhythmUnit8.js` are the **new U8 (3/4 Meter)** unit occupying the
  freed namespace — exactly the v3.5 rename intent. Syncopation now lives under `rhythm_synco_*`.
- **`pianomaster-v12`** has advanced to **`pianomaster-v14`** via later phases; the "SW cache bumped"
  gate (01-10-T1) remains satisfied — only the version number drifted forward.

The two owner-pending blocking gates from VERIFICATION (D-13 production migration, SC-9 UAT
walkthrough) are now closed per commit `5e3f9e86 test(01): complete UAT - 2 passed, 0 issues`.

| Metric                  | Count                                                               |
| ----------------------- | ------------------------------------------------------------------- |
| Gaps found              | 0                                                                   |
| Resolved                | 0                                                                   |
| Escalated               | 0                                                                   |
| Manual-only (by design) | 3 (01-03-T1 voice/structure, 01-10-T4 prod migration, 01-10-T5 UAT) |

**Verdict:** Phase 1 is **Nyquist-compliant** — every requirement has automated verification
(or an explicit, now-satisfied human checkpoint). No tests generated; no gaps to fill.

**Auditor:** Claude (gsd-validate-phase, State A) 2026-06-29.
