---
phase: 22
slug: service-layer-trail-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                               |
| ---------------------- | ----------------------------------- |
| **Framework**          | Vitest                              |
| **Config file**        | `vite.config.js`                    |
| **Quick run command**  | `npx vitest run src/data/patterns/` |
| **Full suite command** | `npm run test:run`                  |
| **Estimated runtime**  | ~15 seconds                         |

---

## Sampling Rate

- **After every task commit:** Run `npm run verify:trail`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green + `npm run build` passes
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type   | Automated Command                                                 | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | --------------- | ----------- | ----------------------------------------------------------------- | ----------- | ---------- |
| 22-01-01 | 01   | 1    | PAT-04      | —          | N/A             | unit        | `npx vitest run src/data/patterns/RhythmPatternGenerator.test.js` | ❌ W0       | ⬜ pending |
| 22-01-02 | 01   | 1    | PAT-04      | —          | N/A             | unit        | `npx vitest run src/data/patterns/RhythmPatternGenerator.test.js` | ❌ W0       | ⬜ pending |
| 22-02-01 | 02   | 1    | CURR-05     | —          | N/A             | unit        | `npx vitest run src/components/games/rhythm-games/renderers/`     | ❌ W0       | ⬜ pending |
| 22-03-01 | 03   | 2    | PAT-03      | —          | N/A             | unit        | `npx vitest run src/data/units/`                                  | ❌ W0       | ⬜ pending |
| 22-04-01 | 04   | 3    | PAT-06      | —          | N/A             | integration | `npm run verify:trail`                                            | ✅ extend   | ⬜ pending |
| 22-04-02 | 04   | 3    | PAT-05      | —          | N/A             | integration | `npm run verify:trail`                                            | ✅ extend   | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `src/data/patterns/RhythmPatternGenerator.test.js` — covers resolveByTags, resolveByIds, binary-to-VexFlow rendering, tag filtering, null returns
- [ ] `src/components/games/rhythm-games/renderers/__tests__/PulseQuestion.test.jsx` — covers render, beat detection, scoring, onComplete callback
- [ ] Unit file migration structural assertion (patterns field absent, patternTags present)

_Existing infrastructure covers validator tests (npm run verify:trail already exists)._

---

## Manual-Only Verifications

| Behavior                                 | Requirement | Why Manual                                        | Test Instructions                                         |
| ---------------------------------------- | ----------- | ------------------------------------------------- | --------------------------------------------------------- |
| Pulse circle animation syncs with beat   | CURR-05     | CSS animation timing requires visual confirmation | Play Node 1 → verify circle pulses on each beat at 65 BPM |
| Child sees no notation in pulse exercise | CURR-05     | Absence of VexFlow rendering is visual            | Play Node 1 → verify no staff lines or notes visible      |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
