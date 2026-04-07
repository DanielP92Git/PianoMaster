---
phase: 23
slug: ux-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                               |
| ---------------------- | ----------------------------------- |
| **Framework**          | vitest                              |
| **Config file**        | `vite.config.js`                    |
| **Quick run command**  | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm run test:run`                  |
| **Estimated runtime**  | ~30 seconds                         |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command                                                                     | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | ------------------------------------------------------------------------------------- | ----------- | ---------- |
| 23-01-01 | 01   | 1    | UX-01       | —          | N/A             | unit      | `npx vitest run src/components/games/rhythm-games/utils/rhythmTimingUtils.test.js`    | ❌ W0       | ⬜ pending |
| 23-01-02 | 01   | 1    | UX-03       | —          | N/A             | unit      | `npx vitest run src/locales`                                                          | ❌ W0       | ⬜ pending |
| 23-02-01 | 02   | 1    | UX-04       | —          | N/A             | unit      | `npm run verify:trail`                                                                | ✅          | ⬜ pending |
| 23-03-01 | 03   | 2    | UX-05       | —          | N/A             | unit      | `npx vitest run src/components/games/rhythm-games/utils/rhythmVexflowHelpers.test.js` | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Test stubs for timing threshold validation (UX-01)
- [ ] Test stubs for Kodaly syllable rendering (UX-05)
- [ ] i18n key verification tests (UX-02, UX-03)

_Existing `validateTrail.mjs` covers UX-04 measureCount enforcement._

---

## Manual-Only Verifications

| Behavior                                                  | Requirement | Why Manual                                         | Test Instructions                                                                      |
| --------------------------------------------------------- | ----------- | -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Kodaly syllables render below VexFlow note heads visually | UX-05       | Visual layout cannot be verified without rendering | Open RhythmReadingGame on a Discovery node, verify syllables appear below notes        |
| "Listen & Tap" name displays in game UI                   | UX-02       | i18n rendering in context                          | Navigate to rhythm mode, verify game title shows "Listen & Tap" not "MetronomeTrainer" |
| "Almost!" shows on miss tap                               | UX-03       | Animation/feedback timing                          | Tap incorrectly during rhythm game, verify "Almost!" text appears                      |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
