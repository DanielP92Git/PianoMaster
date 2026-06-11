---
phase: 36-game-screen-ui-unification
plan: "01"
subsystem: games/shared/hud
tags: [tdd, contract-tests, hud, red-phase, wave-0]
dependency_graph:
  requires: []
  provides:
    - ProgressBar contract test (guards Wave 1 extraction)
    - ScorePill contract test (guards Wave 1 extraction)
  affects:
    - src/components/games/shared/hud/ProgressBar.jsx (created in Plan 36-02)
    - src/components/games/shared/hud/ScorePill.jsx (created in Plan 36-02)
tech_stack:
  added: []
  patterns:
    - Vitest contract tests with framer-motion / react-i18next / useMotionTokens mocks
    - RED phase TDD: tests import non-existent modules to pin API contract before extraction
key_files:
  created:
    - src/components/games/shared/hud/ProgressBar.test.jsx
    - src/components/games/shared/hud/ScorePill.test.jsx
  modified: []
decisions:
  - Wave 0 gate: contract tests written before components exist; RED is the intended terminal state for this plan
  - Dot-active assertions query all 5 checkpoint span elements and verify classes individually by index
  - ScorePill floating-score assertion uses rerender to avoid duplicate-text false-positive
metrics:
  duration: "~2 minutes"
  completed: "2026-06-11T15:52:00Z"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 36 Plan 01: HUD Contract Tests (Wave 0 RED Gate) Summary

## One-liner

Wave 0 RED contract tests for ProgressBar and ScorePill pin the shared HUD component API before extraction; both tests fail only on missing module resolution.

## Tasks Completed

| Task | Name                                            | Commit  | Files                                                |
| ---- | ----------------------------------------------- | ------- | ---------------------------------------------------- |
| 1    | Create ProgressBar.test.jsx (RED contract test) | 6e6b85c | src/components/games/shared/hud/ProgressBar.test.jsx |
| 2    | Create ScorePill.test.jsx (RED contract test)   | c006362 | src/components/games/shared/hud/ScorePill.test.jsx   |

## What Was Built

Two RED contract test files under `src/components/games/shared/hud/`:

**ProgressBar.test.jsx** (3 tests):

- `animates fill to the correct fraction of current/total` — asserts the `from-indigo-400` gradient fill element renders and counter text is correct
- `marks checkpoint dots active up to current progress` — at 50% progress, dots 0/25/50 carry `bg-white/80` (active) and dots 75/100 carry `bg-white/10` (inactive)
- `shows the question counter text` — asserts `Math.min(total, Math.max(1, current+1))` counter renders as "3 of 10" for `current=2, total=10`

**ScorePill.test.jsx** (4 tests):

- `renders value and default XP label` — asserts value "120" and label "XP" render
- `renders a custom label` — asserts custom label prop renders
- `applies tint classes per comboTint tier` — asserts all three tiers: `border-white/20`+`bg-white/10` (tier 0), `border-amber-400/30`+`bg-amber-500/15` (tier 1), `border-yellow-400/40`+`bg-yellow-500/20` (tier 2)
- `shows the floating +score only when floatingScore is set` — asserts no `+N` node when `floatingScore=null`; asserts "+3" renders when `floatingScore=3`

Both files share the same mock scaffold: framer-motion (motion.div/span forward className/style/children), react-i18next (t returns `"${opts.current} of ${opts.total}"`), and useMotionTokens (returns `{ soft: { duration: 0 }, reduce: false }`).

## RED State Confirmation

Both tests fail with `Failed to resolve import "./ProgressBar"` / `./ScorePill` — import-resolution failures, not syntax errors. This is the intended terminal state for Plan 36-01.

Plan 36-02 creates the components to satisfy this contract (GREEN gate).

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None — test-only files, no new network/auth/storage surface introduced.

## Known Stubs

None — test files only; no component implementations or data wiring.

## Self-Check: PASSED

- [x] `src/components/games/shared/hud/ProgressBar.test.jsx` exists
- [x] `src/components/games/shared/hud/ScorePill.test.jsx` exists
- [x] Commit `6e6b85c` exists (ProgressBar test)
- [x] Commit `c006362` exists (ScorePill test)
- [x] Both tests RED on `./ProgressBar` / `./ScorePill` module resolution (not syntax errors)
