---
phase: 22
slug: service-layer-trail-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| **Framework**          | Vitest                                                              |
| **Config file**        | `vite.config.js`                                                    |
| **Quick run command**  | `npx vitest run src/data/units/ src/components/games/rhythm-games/` |
| **Full suite command** | `npm run test:run`                                                  |
| **Estimated runtime**  | ~30 seconds                                                         |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/data/units/ src/components/games/rhythm-games/`
- **After every plan wave:** Run `npm run verify:trail && npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement    | Threat Ref | Secure Behavior | Test Type   | Automated Command                                                                 | File Exists | Status     |
| -------- | ---- | ---- | -------------- | ---------- | --------------- | ----------- | --------------------------------------------------------------------------------- | ----------- | ---------- |
| 22-01-01 | 01   | 0    | PAT-04         | —          | N/A             | unit        | `npx vitest run src/components/games/rhythm-games/RhythmPatternGenerator.test.js` | ❌ W0       | ⬜ pending |
| 22-01-02 | 01   | 0    | CURR-05        | —          | N/A             | unit        | `npx vitest run src/data/units/rhythmUnit1Redesigned.test.js`                     | ❌ W0       | ⬜ pending |
| 22-02-01 | 02   | 1    | PAT-04, PAT-05 | —          | N/A             | unit        | `npx vitest run src/components/games/rhythm-games/RhythmPatternGenerator.test.js` | ❌ W0       | ⬜ pending |
| 22-03-01 | 03   | 1    | CURR-05        | —          | N/A             | unit        | `npx vitest run src/components/games/rhythm-games/MetronomeTrainer.test.jsx`      | ❌ W0       | ⬜ pending |
| 22-04-01 | 04   | 2    | PAT-03         | —          | N/A             | unit        | `npx vitest run src/data/units/`                                                  | Partial     | ⬜ pending |
| 22-05-01 | 05   | 3    | PAT-06         | —          | N/A             | integration | `npm run verify:trail`                                                            | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `src/components/games/rhythm-games/RhythmPatternGenerator.test.js` — stubs for resolveByTags/resolveByIds (PAT-04, PAT-05)
- [ ] `src/data/units/rhythmUnit1Redesigned.test.js` — extend/create for pulse exercise presence (CURR-05) + patternTags migration shape
- [ ] Update existing `rhythmUnit7Redesigned.test.js` and `rhythmUnit8Redesigned.test.js` expected exercise types after game-type remediation

---

## Manual-Only Verifications

| Behavior                                              | Requirement    | Why Manual        | Test Instructions                                                                       |
| ----------------------------------------------------- | -------------- | ----------------- | --------------------------------------------------------------------------------------- |
| Pulse circle animation feels engaging for 8-year-olds | CURR-05 (D-02) | Visual/subjective | Open Unit 1 Node 1 on mobile, verify pulsing circle animates on beat, no notation shown |
| Reduced-motion respects prefers-reduced-motion        | CURR-05 (D-02) | OS-level toggle   | Enable reduced-motion in OS settings, verify pulse animation is simplified              |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
