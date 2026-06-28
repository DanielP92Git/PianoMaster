---
phase: 34
slug: responsive-rhythm-renderers-non-arcade
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-07
updated: 2026-05-07
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

| Task ID    | Plan  | Wave | Requirement                                                                      | Threat Ref | Secure Behavior                                                                              | Test Type           | Automated Command                                                                                        | File Exists | Status     |
| ---------- | ----- | ---- | -------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 34-01-T1   | 34-01 | 1    | NOTATION-03                                                                      | —          | helper threshold validated (`>9` triggers; load-bearing 3/4×3 = 9 → false)                   | unit                | `npx vitest run src/components/games/rhythm-games/utils/needsLandscape.test.js`                          | ❌ W0       | ⬜ pending |
| 34-01-T2   | 34-01 | 1    | INFRA-02                                                                         | —          | provider lifecycle: mount→true, unmount→false, last-writer-wins                              | unit                | `npx vitest run src/contexts/NeedsLandscapeContext.test.jsx`                                             | ❌ W0       | ⬜ pending |
| 34-02-T1   | 34-02 | 1    | WRAPPER-01, WRAPPER-02, WRAPPER-03 (audit)                                       | —          | per-component punch list produced before fix plans run                                       | static              | `node -e ".../34-AUDIT.md presence + 13 components"` (in plan 02 verify)                                 | n/a         | ⬜ pending |
| 34-03-T1   | 34-03 | 2    | INFRA-01, INFRA-04 (provider mount + LANDSCAPE_ROUTES removal)                   | —          | 7 rhythm paths removed; provider wraps render tree                                           | static grep         | `node -e "<see plan 03 task 1>"` validating LANDSCAPE_ROUTES contents + AppLayout NeedsLandscapeProvider | n/a         | ⬜ pending |
| 34-03-T2   | 34-03 | 2    | (D-19 useLandscapeLock context-aware)                                            | —          | useLandscapeLock no-ops on Android PWA when context false                                    | static grep         | `node -e "<see plan 03 task 2>"` validating useNeedsLandscape import + early return + dep array          | n/a         | ⬜ pending |
| 34-04-T1   | 34-04 | 3    | CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, NOTATION-01, NOTATION-02, TABLET-01 | —          | 7 renderers declare needsLandscape; cards 2x2/1x4 quadrants                                  | static + manual UAT | `node -e "<see plan 04 task 1>"` (renderer declarations + literal Tailwind classes) + UAT (Plan 06)      | n/a         | ⬜ pending |
| 34-04-T2   | 34-04 | 3    | INFRA-03, WRAPPER-01                                                             | —          | 6 wrappers compose `legacyGate && ctxNeedsLandscape`                                         | static grep         | `node -e "<see plan 04 task 2>"` (6 wrappers contain composed gate)                                      | n/a         | ⬜ pending |
| 34-05-T1   | 34-05 | 3    | WRAPPER-03                                                                       | —          | CountdownOverlay/FloatingFeedback/MetronomeDisplay tablet sizing                             | static grep         | `node -e "<see plan 05 task 1>"` (md: classes present)                                                   | n/a         | ⬜ pending |
| 34-05-T2   | 34-05 | 3    | WRAPPER-02, WRAPPER-03 (RhythmGameSettings glass D-18)                           | —          | RhythmGameSettings has no bare bg-white/text-gray-700/border-gray-300; glass classes present | static grep         | `node -e "<see plan 05 task 2>"` (no light-theme remnants in RhythmGameSettings)                         | n/a         | ⬜ pending |
| 34-06-T1   | 34-06 | 4    | (pre-UAT automated gate)                                                         | —          | full suite + build + lint green                                                              | unit + build        | `npm run test:run && npm run build && npm run lint`                                                      | n/a         | ⬜ pending |
| 34-06-T2/3 | 34-06 | 4    | INFRA-04, CORE-01..05, NOTATION-01/02, WRAPPER-01..03, TABLET-01                 | —          | all 5 ROADMAP SCs + 13 components × 4 quadrants + non-rhythm regression                      | manual UAT          | iPhone SE (375×667) + iPad (1024×768) walkthrough recorded in `34-UAT.md`                                | n/a         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `src/components/games/rhythm-games/utils/needsLandscape.test.js` — covers NOTATION-03 (REQUIRED) — owned by `34-01-T1`
- [ ] `src/contexts/NeedsLandscapeContext.test.jsx` — provider+hooks lifecycle (REQUIRED for INFRA-02) — owned by `34-01-T2`
- [ ] No framework install needed — vitest is project standard

---

## Manual-Only Verifications

Owner of each row: `34-06-T3` (Manual UAT walkthrough). Failures trigger `/gsd-plan-phase 34 --gaps`.

| Behavior                                                                             | Requirement                            | Why Manual                                           | Test Instructions                                                                                                                                                                            |
| ------------------------------------------------------------------------------------ | -------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iPhone SE portrait shows staff + 4 cards as 2×2 with no scroll                       | Success #1 / CORE-02 / TABLET-01       | Pixel-accurate layout cannot be asserted in JSDOM    | Open `/rhythm-mode/rhythm-dictation-game` on iPhone SE (or Chrome devtools 375×667). Assert: all 4 cards visible without vertical scroll, each tappable                                      |
| Short rhythm patterns render inline with no rotate prompt on phone-portrait          | Success #2 / NOTATION-01 / NOTATION-02 | Requires real viewport + content + overlay interplay | Navigate to a 1-measure 4/4 reading exercise on phone-portrait. Assert: no rotate overlay                                                                                                    |
| Long rhythm patterns DO surface rotate prompt on phone-portrait                      | Success #2 / NOTATION-01 / NOTATION-02 | Same as above                                        | Navigate to a 4-measure 4/4 reading exercise on phone-portrait. Assert: rotate overlay visible                                                                                               |
| Tablet (≥768) NEVER shows rotate prompt regardless of orientation/pattern            | Success #3 / INFRA-04                  | Viewport gate behavior                               | iPad (or 1024×768 emulator) — open every rhythm game in portrait + landscape with long patterns. Assert: prompt never appears                                                                |
| Tablet-landscape cards renderers fill width (no centered single-col)                 | Success #4 / TABLET-01 / CORE-04       | Visual layout assertion                              | iPad landscape — open dictation, syllable-matching, visual-recognition. Assert: 2×2 grid spans container width                                                                               |
| Setup screens + 5 supporting overlays render & remain interactive at all 4 quadrants | Success #5 / WRAPPER-01..03            | Cross-component visual audit                         | Per-quadrant walkthrough: RhythmGameSetup, RhythmGameSettings, CountdownOverlay, BossIntroOverlay, FloatingFeedback, MetronomeDisplay, TapArea. Assert: no clipping/overflow/hidden controls |
| RhythmGameSettings glass-converted (D-18)                                            | WRAPPER-03                             | Visual style change                                  | Open settings modal in any rhythm game. Assert: glass background, white text, matches design system                                                                                          |
| MixedLessonGame renderer-swap: prompt appears/disappears correctly across renderers  | NOTATION-01/02 + Pitfall 3             | Cross-renderer lifecycle                             | Open mixed-lesson with mixed long/short patterns; rotate to phone-portrait; verify overlay flips correctly between renderers without flicker                                                 |
| Notes-master + ear-training games STILL show rotate prompt on phone-portrait         | (regression / Pitfall 1)               | Coexistence safety check                             | Open every non-rhythm game route on phone-portrait. Assert: rotate prompt still appears (legacy behavior preserved)                                                                          |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are explicitly manual-UAT (Plan 06) per D-12
- [x] Sampling continuity: every plan has at least one automated check before depending plans run
- [x] Wave 0 covers all MISSING references (NOTATION-03 unit test, INFRA-02 context test) — owned by Plan 01
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready for execution
