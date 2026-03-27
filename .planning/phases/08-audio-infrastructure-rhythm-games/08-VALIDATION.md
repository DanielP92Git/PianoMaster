---
phase: 8
slug: audio-infrastructure-rhythm-games
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-27
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (jsdom) |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run src/hooks/usePianoSampler.test.js src/components/games/rhythm-games/` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/hooks/usePianoSampler.test.js src/components/games/rhythm-games/`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | INFRA-06 | unit | `npx vitest run src/hooks/usePianoSampler.test.js` | W0 | pending |
| 08-01-02 | 01 | 1 | INFRA-06, RTAP-04, RDICT-04 | unit | `npx vitest run src/components/games/rhythm-games/utils/rhythmTimingUtils.test.js` | W0 | pending |
| 08-02-01 | 02 | 2 | RTAP-01 | unit+lint | `npx vitest run src/components/games/rhythm-games/components/RhythmStaffDisplay.test.js` | Created by 08-02 T1 | pending |
| 08-02-02 | 02 | 2 | RTAP-04 | unit | `npx vitest run src/components/games/rhythm-games/RhythmReadingGame.test.js` | Created by 08-02 T2 | pending |
| 08-03-01 | 03 | 3 | RDICT-03 | lint | ESLint on DictationChoiceCard.jsx | N/A | pending |
| 08-03-02 | 03 | 3 | RDICT-04 | unit | `npx vitest run src/components/games/rhythm-games/RhythmDictationGame.test.js` | Created by 08-03 T2 | pending |
| 08-04-01 | 04 | 4 | INFRA-07 | grep | `grep pianomaster-v9 public/sw.js` | N/A | pending |
| 08-04-02 | 04 | 4 | INFRA-08 | unit | `node -e "require('./src/locales/en/common.json')"` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/usePianoSampler.test.js` -- covers INFRA-06 (oscillator scheduling, iOS resume guard, frequency mapping)
- [ ] `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.test.js` -- covers VexFlow binary-to-note conversion
- [ ] `src/components/games/rhythm-games/utils/rhythmTimingUtils.test.js` -- covers RTAP-04 (timing thresholds), RDICT-04 (distractor generation)
- [ ] Web Audio API mock setup in test files (oscillator, gain, AudioContext stubs)

*All test files above are created by Plan 08-01 (Wave 1). Plans 08-02 and 08-03 create their own test files inline.*

---

## Nyquist Sampling Continuity

Wave 1 (Plan 01): T1 unit test, T2 unit test -- OK
Wave 2 (Plan 02): T1 smoke test (RhythmStaffDisplay.test.js), T2 unit test (RhythmReadingGame.test.js) -- OK
Wave 3 (Plan 03): T1 lint-only, T2 unit test (RhythmDictationGame.test.js) -- OK (max 1 consecutive lint-only)
Wave 4 (Plan 04): T1 grep, T2 JSON parse -- OK

No 3 consecutive tasks without automated unit test.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tap timing PERFECT/GOOD/MISS at 60-120 BPM | RTAP-04 | Requires real-time touch + audio sync | Play rhythm game on device at various tempos, verify judgment accuracy |
| iOS AudioContext resume before playback | INFRA-06 | Requires physical iOS device | Open game in iOS Safari PWA, verify no silent notes after app switch |
| Cursor tracks position in sync with beat | RTAP-02 | Visual synchronization check | Watch cursor movement matches metronome tempo visually |
| Dictation card replays correct pattern | RDICT-02, RDICT-05 | Audio-visual confirmation | Select wrong answer, verify correct pattern replays automatically |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (awaiting execution)
