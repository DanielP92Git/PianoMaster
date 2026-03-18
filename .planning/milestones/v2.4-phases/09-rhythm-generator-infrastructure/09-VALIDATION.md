---
phase: 09
slug: rhythm-generator-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vite.config.js (test section) |
| **Quick run command** | `npx vitest run src/components/games/sight-reading-game/utils/rhythmGenerator.test.js src/components/games/sight-reading-game/utils/patternBuilder.test.js` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/games/sight-reading-game/utils/rhythmGenerator.test.js src/components/games/sight-reading-game/utils/patternBuilder.test.js`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | RFIX-01 | unit | `npx vitest run src/components/games/sight-reading-game/utils/rhythmGenerator.test.js` | ✅ (add 6/8 tests) | ⬜ pending |
| 09-01-02 | 01 | 1 | RFIX-01 | unit | `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js` | ✅ (add 6/8 tests) | ⬜ pending |
| 09-01-03 | 01 | 1 | RFIX-02 | unit | `npx vitest run src/components/games/sight-reading-game/utils/beamGroupUtils.test.js` | ❌ W0 | ⬜ pending |
| 09-01-04 | 01 | 1 | RFIX-01 | unit | `npx vitest run src/components/games/sight-reading-game/utils/rhythmGenerator.test.js src/components/games/sight-reading-game/utils/patternBuilder.test.js` | ✅ existing (37 tests) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/games/sight-reading-game/utils/beamGroupUtils.test.js` — stubs for RFIX-02 (beamGroupsForTimeSignature unit tests)

*Existing test infrastructure covers RFIX-01 regression (37 tests in rhythmGenerator.test.js + patternBuilder.test.js).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 6/8 beam visual renders 3+3 groups in browser | RFIX-02 | SVG rendering requires visual inspection | Load a 6/8 exercise in MetronomeTrainer, verify eighth notes beam in 3+3 groups |
| Metronome subdivision indicator shows 6 circles with beats 1 and 4 accented | RFIX-01 | Visual styling verification | Start a 6/8 rhythm exercise, verify beat indicator shows 6 circles with 2 accented |
| Count-in plays 4 compound beats (2 measures) for 6/8 | RFIX-01 | Audio timing verification | Start a 6/8 exercise, count the count-in clicks |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
