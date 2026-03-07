---
phase: 1
slug: redesign-victoryscreen-for-simplicity-and-mobile-landscape-fit
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + JSDOM |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | VS-01 | unit | `npx vitest run src/hooks/useVictoryState.test.js -x` | No - W0 | pending |
| 01-02-01 | 02 | 2 | VS-02 | manual-only | Visual inspection on mobile viewport | N/A | pending |
| 01-02-02 | 02 | 2 | VS-03 | smoke | Manual: play each game type to completion | N/A | pending |
| 01-02-03 | 02 | 2 | VS-04 | unit | `npx vitest run src/hooks/useVictoryState.test.js -x` | No - W0 | pending |
| 01-02-04 | 02 | 2 | VS-06 | manual | Play multi-exercise node to verify | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useVictoryState.test.js` — Unit tests for extracted hook (covers VS-01, VS-04)

*Existing test infrastructure covers framework setup. Only the hook test file is needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Landscape two-panel layout renders correctly | VS-02 | Visual/layout verification requires real viewport | Open game on mobile device in landscape, complete exercise, verify two-panel layout with avatar left, buttons right |
| All 4 game components render VictoryScreen | VS-03 | Integration smoke test across game types | Play NotesRecognition, SightReading, MetronomeTrainer, MemoryGame to completion, verify VictoryScreen appears |
| Next exercise navigation works | VS-06 | Multi-exercise flow requires real trail state | Start multi-exercise trail node, complete first exercise, verify "Next Exercise" button navigates correctly |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
