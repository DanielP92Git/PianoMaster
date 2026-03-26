---
phase: 01
slug: introductory-single-note-game
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vite.config.js` |
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
| 01-01-T0 | 01-01 | 1 | REQ-01, REQ-02, REQ-05 | scaffold | File existence check | YES (created by task) | pending |
| 01-01-T1 | 01-01 | 1 | REQ-01, REQ-05, REQ-08, REQ-09 | unit + integration | `npm run verify:trail && npx vitest run src/data/constants.test.js --reporter=verbose` | YES | pending |
| 01-01-T2 | 01-01 | 1 | REQ-03, REQ-04 | build | `npx vitest run --reporter=verbose && npm run build` | N/A | pending |
| 01-02-T1 | 01-02 | 2 | REQ-02, REQ-06, REQ-07 | unit + build | `npx vitest run src/components/games/notes-master-games/NoteSpeedCards --reporter=verbose && npm run build` | YES (Wave 0) | pending |
| 01-02-T2 | 01-02 | 2 | REQ-02, REQ-06, REQ-07 | manual | `npm run build` | N/A | pending |

*Status: pending -- green -- red -- flaky*

---

## Wave 0 Requirements

- [x] `src/data/constants.test.js` — covers REQ-01, REQ-05 (NOTE_CATCH constant and node data assertions)
- [x] `src/components/games/notes-master-games/NoteSpeedCards.test.js` — covers REQ-02 (generateCardSequence, getSpeedForCard, calculateScore)
- [x] Trail validation passes: `npm run verify:trail`
- [x] Build succeeds: `npm run build`

*Wave 0 test scaffolds are created by Plan 01-01 Task 0 before any production code is modified.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Conveyor belt animation smooth at all speeds | D-02, D-06 | Visual/timing quality | Play game, verify cards slide smoothly as speed ramps |
| Tap target works on mobile | D-07 | Device-specific touch input | Test on real mobile device or emulator |
| Correct/wrong tap feedback visible | D-08, D-09 | Visual + audio feedback | Tap target and non-target notes, verify flash colors + sounds |
| Reduced motion mode disables animations | D-06 | Accessibility | Enable reduced motion in settings, verify game still playable |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
