---
phase: 9
slug: ear-training-games
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 1.x + @testing-library/react |
| **Config file** | `vitest.config.js` (root) |
| **Quick run command** | `npx vitest run src/components/games/ear-training-games/` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/games/ear-training-games/`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | PITCH-01 | unit | `npx vitest run src/components/games/ear-training-games/NoteComparisonGame.test.js` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | PITCH-02 | unit | same | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 1 | PITCH-03 | unit | `npx vitest run src/components/games/ear-training-games/earTrainingUtils.test.js` | ❌ W0 | ⬜ pending |
| 09-01-04 | 01 | 1 | PITCH-04 | unit | same NoteComparisonGame.test.js | ❌ W0 | ⬜ pending |
| 09-01-05 | 01 | 1 | PITCH-05 | unit | same NoteComparisonGame.test.js | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | INTV-01 | unit | `npx vitest run src/components/games/ear-training-games/IntervalGame.test.js` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 1 | INTV-02 | unit | `npx vitest run src/components/games/ear-training-games/earTrainingUtils.test.js` | ❌ W0 | ⬜ pending |
| 09-02-03 | 02 | 1 | INTV-03 | unit | same earTrainingUtils.test.js | ❌ W0 | ⬜ pending |
| 09-02-04 | 02 | 1 | INTV-04 | unit | `npx vitest run src/components/games/ear-training-games/PianoKeyboardReveal.test.js` | ❌ W0 | ⬜ pending |
| 09-02-05 | 02 | 1 | INTV-05 | unit | same IntervalGame.test.js | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/games/ear-training-games/earTrainingUtils.test.js` — stubs for tier logic (PITCH-03), interval classification (INTV-02), ascending-first ordering (INTV-03), note pair generation bounds checking
- [ ] `src/components/games/ear-training-games/NoteComparisonGame.test.js` — stubs for sequential playback mock (PITCH-01), answer evaluation (PITCH-02), FSM state transitions (PITCH-04), VictoryScreen render (PITCH-05)
- [ ] `src/components/games/ear-training-games/IntervalGame.test.js` — stubs for sequential playback mock (INTV-01), answer evaluation (INTV-02), VictoryScreen render (INTV-05)
- [ ] `src/components/games/ear-training-games/PianoKeyboardReveal.test.js` — stubs for key state derivation (INTV-04), dir=ltr enforcement, aria-hidden

*Existing infrastructure (`vitest.config.js`, `src/test/setupTests.js`, `@testing-library/react`) covers all requirements. No framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Audio playback sounds correct through speakers | PITCH-01, INTV-01 | Web Audio synthesis quality is perceptual | Play both games, verify two distinct piano notes are heard with correct timing |
| Animated direction reveal looks smooth | PITCH-04 | CSS animation visual quality | Complete a NoteComparison question, observe keyboard slide-in and arrow animation |
| Piano keyboard SVG visually correct | INTV-04 | SVG rendering is visual | Open IntervalGame, answer a question, verify keys highlight with correct blue/orange colors |
| Touch targets adequate on mobile | PITCH-02, INTV-02 | Physical device interaction | Test on phone: all answer buttons easily tappable with child-sized fingers |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
