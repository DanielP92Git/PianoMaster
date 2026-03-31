---
phase: 15
slug: verification-deploy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| **Framework**          | vitest                                                            |
| **Config file**        | `vite.config.js` (vitest config section)                          |
| **Quick run command**  | `npx vitest run src/services/__tests__/dailyGoalsService.test.js` |
| **Full suite command** | `npm run test:run`                                                |
| **Estimated runtime**  | ~15 seconds                                                       |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/services/__tests__/dailyGoalsService.test.js`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type   | Automated Command                                                 | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ----------- | ----------------------------------------------------------------- | ----------- | ---------- |
| 15-01-01 | 01   | 1    | GOAL-01     | unit        | `npx vitest run src/services/__tests__/dailyGoalsService.test.js` | ❌ W0       | ⬜ pending |
| 15-02-01 | 02   | 1    | DEPLOY-01   | file-exists | `test -f docs/DEPLOY_SEQUENCING.md`                               | ❌ W0       | ⬜ pending |
| 15-03-01 | 03   | 2    | UAT-01      | manual      | N/A — device testing                                              | N/A         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `src/services/__tests__/dailyGoalsService.test.js` — stubs for GOAL-01 regression tests
- [ ] Test mocking pattern for two-table Supabase queries (`students_score` + `student_skill_progress`)

_Existing vitest infrastructure covers framework needs._

---

## Manual-Only Verifications

| Behavior                                  | Requirement   | Why Manual                                  | Test Instructions                                         |
| ----------------------------------------- | ------------- | ------------------------------------------- | --------------------------------------------------------- |
| Rhythm game metronome plays correct tempo | UAT-01 item 1 | Requires physical audio output verification | Play rhythm game on Android PWA, verify audible metronome |
| Piano tone quality acceptable             | UAT-01 item 2 | Subjective audio quality assessment         | Play notes on device, verify tone sounds correct          |
| PWA cache invalidation on deploy          | UAT-01 item 5 | Requires installed PWA on real device       | Install PWA, deploy update, verify new version loads      |
| Rhythm game visual feedback               | UAT-01 item 3 | Requires visual verification on device      | Play rhythm game, verify visual hit/miss feedback         |
| Offline fallback page                     | UAT-01 item 4 | Requires airplane mode on device            | Enable airplane mode in PWA, verify offline page          |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
