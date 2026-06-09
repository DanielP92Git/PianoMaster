---
phase: 36
slug: game-screen-ui-unification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-10
---

# Phase 36 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                |
| ---------------------- | ---------------------------------------------------- |
| **Framework**          | vitest (JSDOM) + @testing-library/react              |
| **Config file**        | `vitest.config.js` (setup: `src/test/setupTests.js`) |
| **Quick run command**  | `npx vitest run src/components/games/shared/hud`     |
| **Full suite command** | `npm run test:run`                                   |
| **Estimated runtime**  | ~30–90 seconds (full suite)                          |

---

## Sampling Rate

- **After every task commit:** Run the scoped quick command for the touched HUD component / game (`npx vitest run <path>`)
- **After every plan wave:** Run `npm run test:run` (full suite)
- **Before `/gsd-verify-work`:** Full suite must be green; manual reduced-motion + RTL + landscape-lock checks complete
- **Max feedback latency:** ~90 seconds

---

## Per-Task Verification Map

> Populated by the planner as plans are written. One row per task that produces verifiable behavior.

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior      | Test Type | Automated Command                                                     | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | -------------------- | --------- | --------------------------------------------------------------------- | ----------- | ---------- |
| 36-W0-xx | W0   | 0    | REQ-01      | —          | N/A (presentational) | unit      | `npx vitest run src/components/games/shared/hud/ProgressBar.test.jsx` | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

No test framework install needed — vitest + Testing Library already configured. Wave 0 creates the
missing HUD component test stubs the research flagged (no HUD render tests exist today):

- [ ] `src/components/games/shared/hud/ProgressBar.test.jsx` — X-of-N fill width, checkpoint dots, aria-label (REQ-01)
- [ ] `src/components/games/shared/hud/ScorePill.test.jsx` — value/label rendering, optional combo-tint flag (REQ-01, D-11)
- [ ] `src/components/games/shared/hud/LivesDisplay.test.jsx` — N hearts rendered for `lives` prop (REQ-01, D-07)
- [ ] `src/components/games/shared/hud/ComboPill.test.jsx` — combo value display, on-fire styling toggle (REQ-01, D-02)
- [ ] Reduced-motion guard: components read `useAccessibility()` + `useMotionTokens()` internally — assert animation props gated when reduced (REQ-06, D-10)

_Wave 0 tests are written against the shared component contract BEFORE Wave 1 extraction so the
NotesRecognition reference refactor is proven zero-regression against them._

---

## Manual-Only Verifications

| Behavior                                                        | Requirement    | Why Manual                                     | Test Instructions                                                                                                                                                                   |
| --------------------------------------------------------------- | -------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zero visual regression on NotesRecognitionGame after extraction | REQ-01, REQ-06 | Pixel/visual parity not unit-testable          | Play a NotesRecognition session pre/post Wave 1; confirm progress bar, score pill, hearts, combo, on-fire, speed-bonus, tier-up, timer, feedback all render and animate identically |
| Landscape-lock intact on ArcadeRhythmGame + rhythm games        | REQ-06         | Orientation behavior is device/viewport-driven | UAT on iPhone SE + iPad: ArcadeRhythm and rhythm games still trigger landscape prompt; HUD de-dup did not disturb `useDeclareNeedsLandscape`                                        |
| RTL (Hebrew) parity of adopted HUD                              | REQ-06, REQ-07 | Visual layout direction                        | Switch locale to he; confirm progress bar, score pill, nav mirror correctly across all adopted games                                                                                |
| Reduced-motion honored across all HUD animations                | REQ-06, D-10   | OS/app-setting-driven visual behavior          | Enable reduced-motion; confirm combo shake, on-fire splash, tier-up fly, speed-bonus flash are suppressed in every adopting game                                                    |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (HUD component test stubs)
- [ ] No watch-mode flags (use `vitest run`, not `vitest`)
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
