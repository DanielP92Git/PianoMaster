---
phase: 34
slug: responsive-rhythm-renderers-non-arcade
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

# Phase 34 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 3.2.4 + JSDOM                                                                                                        |
| **Config file**        | none (defaults); shared setup at `src/test/setupTests.js`                                                                   |
| **Quick run command**  | `npx vitest run src/components/games/rhythm-games/utils/needsLandscape.test.js src/contexts/NeedsLandscapeContext.test.jsx` |
| **Full suite command** | `npm run test:run`                                                                                                          |
| **Estimated runtime**  | ~5s quick · ~60s full                                                                                                       |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` filtered to phase test paths (~5s)
- **After every plan wave:** Run `npm run test:run` (full suite)
- **Before `/gsd-verify-work`:** Full suite must be green AND manual UAT sign-off (per D-12)
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement    | Threat Ref | Secure Behavior                                            | Test Type   | Automated Command                                                               | File Exists | Status     |
| -------- | ---- | ---- | -------------- | ---------- | ---------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------- | ----------- | ---------- |
| 34-XX-XX | TBD  | 0    | NOTATION-03    | —          | N/A                                                        | unit        | `npx vitest run src/components/games/rhythm-games/utils/needsLandscape.test.js` | ❌ W0       | ⬜ pending |
| 34-XX-XX | TBD  | 0    | INFRA-02       | —          | N/A                                                        | unit        | `npx vitest run src/contexts/NeedsLandscapeContext.test.jsx`                    | ❌ W0       | ⬜ pending |
| 34-XX-XX | TBD  | TBD  | INFRA-01       | —          | rhythm routes removed from `LANDSCAPE_ROUTES`              | static grep | `grep -c '/rhythm' src/App.jsx` (expect 0)                                      | n/a (grep)  | ⬜ pending |
| 34-XX-XX | TBD  | TBD  | INFRA-03       | —          | RotatePromptOverlay predicate uses context                 | unit/grep   | `grep -n useNeedsLandscape src/components/orientation/RotatePromptOverlay.jsx`  | n/a         | ⬜ pending |
| 34-XX-XX | TBD  | TBD  | INFRA-04       | —          | iPad never sees prompt                                     | manual UAT  | iPad portrait/landscape walkthrough                                             | n/a         | ⬜ pending |
| 34-XX-XX | TBD  | TBD  | CORE-01..05    | —          | renderers fit/don't-scroll at 4 quadrants                  | manual UAT  | Chrome devtools 375×667 + iPad emulator                                         | n/a         | ⬜ pending |
| 34-XX-XX | TBD  | TBD  | NOTATION-01/02 | —          | reading/tap renderers call helper + declare via context    | manual UAT  | open short → no prompt; long → prompt                                           | n/a         | ⬜ pending |
| 34-XX-XX | TBD  | TBD  | WRAPPER-01..03 | —          | wrappers + supporting components render at all 4 quadrants | manual UAT  | per-component walkthrough on iPhone SE + iPad                                   | n/a         | ⬜ pending |
| 34-XX-XX | TBD  | TBD  | TABLET-01      | —          | cards-based renderers fill width on tablet-landscape       | manual UAT  | iPad landscape grid layout check                                                | n/a         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

_Plan/wave/task IDs filled in by planner._

---

## Wave 0 Requirements

- [ ] `src/components/games/rhythm-games/utils/needsLandscape.test.js` — covers NOTATION-03 (REQUIRED)
- [ ] `src/contexts/NeedsLandscapeContext.test.jsx` — provider+hooks lifecycle (RECOMMENDED, prevents Phase 35 regressions on the contract)
- [ ] No framework install needed — vitest is project standard

---

## Manual-Only Verifications

| Behavior                                                                             | Requirement                            | Why Manual                                           | Test Instructions                                                                                                                                                                            |
| ------------------------------------------------------------------------------------ | -------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iPhone SE portrait shows staff + 4 cards as 2×2 with no scroll                       | Success #1 / CORE-02 / TABLET-01       | Pixel-accurate layout cannot be asserted in JSDOM    | Open `/rhythm-mode/dictation` on iPhone SE (or Chrome devtools 375×667). Assert: all 4 cards visible without vertical scroll, each tappable                                                  |
| Short rhythm patterns render inline with no rotate prompt on phone-portrait          | Success #2 / NOTATION-01 / NOTATION-02 | Requires real viewport + content + overlay interplay | Navigate to a 1-measure 4/4 reading exercise on phone-portrait. Assert: no rotate overlay                                                                                                    |
| Long rhythm patterns DO surface rotate prompt on phone-portrait                      | Success #2 / NOTATION-01 / NOTATION-02 | Same as above                                        | Navigate to a 4-measure 4/4 reading exercise on phone-portrait. Assert: rotate overlay visible                                                                                               |
| Tablet (≥768) NEVER shows rotate prompt regardless of orientation/pattern            | Success #3 / INFRA-04                  | Viewport gate behavior                               | iPad (or 1024×768 emulator) — open every rhythm game in portrait + landscape with long patterns. Assert: prompt never appears                                                                |
| Tablet-landscape cards renderers fill width (no centered single-col)                 | Success #4 / TABLET-01 / CORE-04       | Visual layout assertion                              | iPad landscape — open dictation, syllable-matching, visual-recognition. Assert: 2×2 grid spans container width                                                                               |
| Setup screens + 5 supporting overlays render & remain interactive at all 4 quadrants | Success #5 / WRAPPER-01..03            | Cross-component visual audit                         | Per-quadrant walkthrough: RhythmGameSetup, RhythmGameSettings, CountdownOverlay, BossIntroOverlay, FloatingFeedback, MetronomeDisplay, TapArea. Assert: no clipping/overflow/hidden controls |
| RhythmGameSettings glass-converted (D-18)                                            | WRAPPER-03                             | Visual style change                                  | Open settings modal in any rhythm game. Assert: glass background, white text, matches design system                                                                                          |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (NOTATION-03 unit test, INFRA-02 context test)
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter (after planner fills task IDs)

**Approval:** pending
