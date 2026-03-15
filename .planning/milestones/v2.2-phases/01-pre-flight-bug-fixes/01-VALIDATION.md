---
phase: 01
slug: pre-flight-bug-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green + `npm run verify:patterns` passes
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FIX-02 | unit | `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js` | Partially — accidentals test cases needed | ⬜ pending |
| 01-01-02 | 01 | 1 | FIX-02 | unit | same file | Wave 0 gap — inferClefForPitch accidental test | ⬜ pending |
| 01-02-01 | 02 | 1 | FIX-01 | integration (manual) | manual — launch trail node, observe answer buttons | N/A | ⬜ pending |
| 01-02-02 | 02 | 1 | FIX-01 | unit | `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` | Wave 0 gap — file doesn't exist | ⬜ pending |
| 01-xx-01 | all | all | Both | regression | `npm run test:run` | Exists — pre-existing failure must be fixed | ⬜ pending |
| 01-xx-02 | all | all | Both | smoke | `npm run verify:patterns` | Exists — ESM import fix needed | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New test cases in `src/components/games/sight-reading-game/utils/patternBuilder.test.js` — covers FIX-02 regex fix (accidental pitches in `toVexFlowNote` and `inferClefForPitch`)
- [ ] `src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` — unit tests for `getNextPedagogicalNote` boundary guard (FIX-01 auto-grow aspect)
- [ ] Fix pre-existing test failure in `SightReadingGame.micRestart.test.jsx` (missing `useAudioContext` mock)
- [ ] Fix `durationConstants.js` ESM import extension for `npm run verify:patterns`

*Wave 0 tasks should be included in Plan 01 or as a standalone Wave 0 plan.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Trail session with `notePool: ['F#4', 'C#4']` shows accidental answer buttons | FIX-01 | Requires full app navigation from TrailNodeModal through to game UI | 1. Open trail, find accidentals node 2. Tap to start 3. Verify F#4/C#4 appear as answer options |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
