---
phase: 30
slug: audio-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 30 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                         |
| ---------------------- | ------------------------------------------------------------- |
| **Framework**          | Vitest 2.x with jsdom                                         |
| **Config file**        | `vitest.config.js`                                            |
| **Quick run command**  | `npx vitest run src/components/games/rhythm-games/renderers/` |
| **Full suite command** | `npm run test:run`                                            |
| **Estimated runtime**  | ~15 seconds                                                   |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/games/rhythm-games/renderers/`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command                                                                                       | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | ------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 30-01-01 | 01   | 0    | AUDIO-02    | —          | N/A             | unit      | `npx vitest run src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx` | ❌ W0       | ⬜ pending |
| 30-01-02 | 01   | 0    | AUDIO-03    | —          | N/A             | unit      | `npx vitest run src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx`  | ❌ W0       | ⬜ pending |
| 30-02-01 | 02   | 1    | AUDIO-02    | —          | N/A             | unit      | `npx vitest run src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx` | ❌ W0       | ⬜ pending |
| 30-02-02 | 02   | 1    | AUDIO-01    | —          | N/A             | unit      | `npx vitest run src/components/games/rhythm-games/utils/rhythmTimingUtils.test.js`                      | ✅          | ⬜ pending |
| 30-03-01 | 03   | 1    | AUDIO-03    | —          | N/A             | unit      | `npx vitest run src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx`  | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx` — stubs for AUDIO-02 (mock `useAudioEngine`, assert `initializeAudioContext` called on first listen click)
- [ ] `src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx` — stubs for AUDIO-03 (mock `schedulePatternPlayback`, assert 8 beats scheduled for `8_pair`, assert alternating `pitchShift`)

_Mock pattern established in `PulseQuestion.test.jsx`._

---

## Manual-Only Verifications

| Behavior                                                    | Requirement | Why Manual                                                                                          | Test Instructions                                                                                  |
| ----------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| First play has no audible clipping on iOS Safari            | AUDIO-01    | Web Audio timing is platform-dependent; jsdom cannot emulate iOS Safari AudioContext resume latency | Open app on iOS Safari, navigate to any rhythm game, tap play — first note should be heard in full |
| Dictation listen button plays on first click on real device | AUDIO-02    | User gesture + AudioContext resume interaction is browser-specific                                  | Open dictation game, tap Listen — pattern should play immediately without needing Replay           |
| Pitch alternation is audibly distinct                       | AUDIO-03    | Subjective audio quality assessment                                                                 | Play eighths discovery demo — high-low pattern should be clearly audible                           |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
