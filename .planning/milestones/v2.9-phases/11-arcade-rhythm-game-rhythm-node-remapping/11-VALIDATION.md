---
phase: 11
slug: arcade-rhythm-game-rhythm-node-remapping
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vite.config.js` (Vitest inline config) |
| **Quick run command** | `npx vitest run src/components/games/rhythm-games/` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/games/rhythm-games/`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green + `npm run verify:trail` passes
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | ARCR-01 | unit | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame.test.js` | W0 | pending |
| 11-01-02 | 01 | 1 | ARCR-02 | unit | `npx vitest run src/components/games/rhythm-games/utils/rhythmScoringUtils.test.js` | yes | pending |
| 11-01-03 | 01 | 1 | ARCR-03 | unit | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame.test.js` | W0 | pending |
| 11-01-04 | 01 | 1 | ARCR-04 | unit | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame.test.js` | W0 | pending |
| 11-01-05 | 01 | 1 | ARCR-05 | unit | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame.test.js` | W0 | pending |
| 11-02-01 | 02 | 1 | RMAP-01 | unit (validate trail) | `npm run verify:trail` | yes | pending |
| 11-02-02 | 02 | 1 | RMAP-02 | manual + grep | `grep -q "UPDATE public.student_skill_progress" supabase/migrations/20260330000001_reset_rhythm_node_progress.sql && echo "validated"` | N/A | pending |
| 11-03-1a | 03 | 2 | RMAP-03 | grep | `grep -q "ArcadeRhythmGame" src/App.jsx && grep -q "arcade-rhythm-game" src/components/trail/TrailNodeModal.jsx && echo "validated"` | yes | pending |
| 11-03-1b | 03 | 2 | RMAP-03 | grep + test | `grep -rl "case 'arcade_rhythm'" src/components/games/ && npm run test:run` | yes | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/components/games/rhythm-games/ArcadeRhythmGame.test.js` — stubs for ARCR-01, ARCR-03, ARCR-04, ARCR-05
  - Test lives/combo state machine logic in isolation
  - Test GAME_PHASES transitions: COUNTDOWN -> PLAYING -> SESSION_COMPLETE
  - Mock audioContext, rAF, and scoreTap for deterministic testing
- Note: ARCR-02 covered by existing `rhythmScoringUtils.test.js`
- Note: RMAP-01 covered by `npm run verify:trail`
- Note: RMAP-02 verified by grep checks on migration SQL content
- Note: RMAP-03 verified by grep checks on route/switch wiring + full test suite (`npm run test:run`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DB migration clears exercise_progress for rhythm nodes | RMAP-02 | SQL migration runs against live Supabase, not testable locally | Run migration SQL in Supabase dashboard, verify with `SELECT count(*) FROM student_skill_progress WHERE node_id LIKE 'rhythm_%' AND exercise_progress IS NOT NULL` returns 0 |
| Tiles visually sync with metronome beat | ARCR-01 | Visual/audio sync requires human perception | Play a session at 80 BPM, verify tiles arrive at hit zone on the beat |
| On-fire visual effects render correctly | ARCR-04 | Visual effect quality requires human eye | Reach combo 5, verify orange glow on tiles and hit zone line |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
