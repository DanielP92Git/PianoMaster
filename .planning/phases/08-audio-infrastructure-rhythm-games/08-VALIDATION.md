---
phase: 8
slug: audio-infrastructure-rhythm-games
status: draft
nyquist_compliant: false
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
| 08-01-01 | 01 | 1 | INFRA-06 | unit | `npx vitest run src/hooks/usePianoSampler.test.js` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | INFRA-06 | unit | same file (iOS resume guard) | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | RTAP-04 | unit | `npx vitest run src/components/games/rhythm-games/RhythmReadingGame.test.js` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 2 | RTAP-01-05 | manual | iOS + Android tap test | N/A | ⬜ pending |
| 08-03-01 | 03 | 2 | RDICT-04 | unit | `npx vitest run src/components/games/rhythm-games/RhythmDictationGame.test.js` | ❌ W0 | ⬜ pending |
| 08-03-02 | 03 | 2 | RDICT-01-06 | manual | Visual card selection test | N/A | ⬜ pending |
| 08-04-01 | 04 | 3 | INFRA-08 | unit | `npx vitest run src/locales/` | ❌ W0 | ⬜ pending |
| 08-04-02 | 04 | 3 | INFRA-07 | grep | `grep pianomaster-v9 public/sw.js` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/usePianoSampler.test.js` — covers INFRA-06 (oscillator scheduling, iOS resume guard, frequency mapping)
- [ ] `src/components/games/rhythm-games/RhythmDictationGame.test.js` — covers RDICT-04 (distractor algorithm)
- [ ] Web Audio API mock setup in test files (oscillator, gain, AudioContext stubs)

*Existing infrastructure covers VictoryScreen integration (RTAP-05, RDICT-06).*

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
