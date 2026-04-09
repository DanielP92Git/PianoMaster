---
phase: 25
slug: unified-mixed-lesson-engine-for-trail-nodes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **Framework**          | Vitest                                                                                |
| **Config file**        | `vite.config.js` (vitest section)                                                     |
| **Quick run command**  | `npx vitest run src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx` |
| **Full suite command** | `npm run test:run`                                                                    |
| **Estimated runtime**  | ~15 seconds                                                                           |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement                  | Threat Ref | Secure Behavior | Test Type   | Automated Command                                                                                         | File Exists | Status     |
| -------- | ---- | ---- | ---------------------------- | ---------- | --------------- | ----------- | --------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 25-01-01 | 01   | 1    | D-01, D-02, D-04             | —          | N/A             | unit        | `npx vitest run src/components/games/rhythm-games/renderers/__tests__/VisualRecognitionQuestion.test.jsx` | ❌ W0       | ⬜ pending |
| 25-01-02 | 01   | 1    | D-01, D-02, D-04             | —          | N/A             | unit        | `npx vitest run src/components/games/rhythm-games/renderers/__tests__/SyllableMatchingQuestion.test.jsx`  | ❌ W0       | ⬜ pending |
| 25-01-03 | 01   | 1    | D-03                         | —          | N/A             | integration | `npx vitest run src/components/games/rhythm-games/__tests__/VisualRecognitionGame.test.jsx`               | ✅          | ⬜ pending |
| 25-01-04 | 01   | 1    | D-03                         | —          | N/A             | integration | `npx vitest run src/components/games/rhythm-games/__tests__/SyllableMatchingGame.test.jsx`                | ✅          | ⬜ pending |
| 25-02-01 | 02   | 1    | D-05, D-06, D-08, D-10, D-12 | —          | N/A             | unit        | `npx vitest run src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx`                     | ❌ W0       | ⬜ pending |
| 25-03-01 | 03   | 2    | D-05, D-17, D-18             | —          | N/A             | unit        | `npx vitest run scripts/__tests__/validateTrail.test.mjs`                                                 | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `src/components/games/rhythm-games/renderers/__tests__/VisualRecognitionQuestion.test.jsx` — stubs for renderer rendering
- [ ] `src/components/games/rhythm-games/renderers/__tests__/SyllableMatchingQuestion.test.jsx` — stubs for renderer rendering
- [ ] `src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx` — stubs for engine session flow

---

## Notes

Existing tests in `__tests__/VisualRecognitionGame.test.jsx` and `__tests__/SyllableMatchingGame.test.jsx` should continue to pass after the thin-wrapper refactor — they test the full game component which will still exist as a wrapper.
