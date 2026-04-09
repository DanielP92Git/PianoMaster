---
phase: 24
slug: multi-angle-rhythm-games
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                               |
| ---------------------- | ----------------------------------- |
| **Framework**          | vitest                              |
| **Config file**        | `vite.config.js` (test section)     |
| **Quick run command**  | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm run test:run`                  |
| **Estimated runtime**  | ~15 seconds                         |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type   | Automated Command                                                                           | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | --------------- | ----------- | ------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 24-01-01 | 01   | 1    | SC-1        | —          | N/A             | unit        | `npx vitest run src/components/games/rhythm-games/utils/durationInfo.test.js`               | ❌ W0       | ⬜ pending |
| 24-01-02 | 01   | 1    | SC-1        | —          | N/A             | manual      | Visual inspection of SVG sprites                                                            | —           | ⬜ pending |
| 24-02-01 | 02   | 1    | SC-1        | —          | N/A             | unit        | `npx vitest run src/components/games/rhythm-games/__tests__/VisualRecognitionGame.test.jsx` | ❌ W0       | ⬜ pending |
| 24-02-02 | 02   | 1    | SC-2        | —          | N/A             | unit        | `npx vitest run src/components/games/rhythm-games/__tests__/SyllableMatchingGame.test.jsx`  | ❌ W0       | ⬜ pending |
| 24-03-01 | 03   | 2    | SC-3        | —          | N/A             | unit        | `npx vitest run src/data/units/__tests__/rhythmUnit1Redesigned.test.js`                     | ❌ W0       | ⬜ pending |
| 24-03-02 | 03   | 2    | SC-3        | —          | N/A             | validation  | `npm run verify:trail`                                                                      | ✅          | ⬜ pending |
| 24-04-01 | 04   | 2    | SC-4        | —          | N/A             | integration | `npx vitest run src/components/trail/__tests__/TrailNodeModal.test.jsx`                     | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Test stubs for durationInfo utility
- [ ] Test stubs for VisualRecognitionGame and SyllableMatchingGame components
- [ ] Test stubs for node wiring validation

_Existing infrastructure (vitest + testing-library) covers all phase requirements._

---

## Manual-Only Verifications

| Behavior                                 | Requirement | Why Manual           | Test Instructions                                              |
| ---------------------------------------- | ----------- | -------------------- | -------------------------------------------------------------- |
| SVG sprites render correctly on glass bg | SC-1        | Visual quality check | Open each SVG in browser, verify white fill on purple/glass bg |
| Card tap animation feels responsive      | SC-1,2      | UX feel check        | Play both games, verify scale+color feedback timing            |
| Landscape layout switches to 1x4 row     | SC-1,2      | Responsive layout    | Rotate device/resize to landscape, verify card layout          |
| Progress dots update correctly           | SC-1,2      | Visual progression   | Play through 5 questions, verify dot colors                    |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
