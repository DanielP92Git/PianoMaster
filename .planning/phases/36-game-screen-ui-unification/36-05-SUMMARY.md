---
phase: 36-game-screen-ui-unification
plan: "05"
subsystem: rhythm-games-hud
tags:
  [
    hud,
    ProgressBar,
    ScorePill,
    rhythm-reading,
    rhythm-dictation,
    base-shell,
    wave-4,
  ]
dependency_graph:
  requires: ["36-02"]
  provides:
    ["shared-hud-in-RhythmReadingGame", "shared-hud-in-RhythmDictationGame"]
  affects: ["36-11-manual-verify"]
tech_stack:
  added: []
  patterns:
    - "ProgressBar current=0-indexed current / total — same contract as SightReadingGame"
    - "ScorePill value=running-metric label=t(games.score) — no comboTint on base-shell games"
key_files:
  modified:
    - src/components/games/rhythm-games/RhythmReadingGame.jsx
    - src/components/games/rhythm-games/RhythmDictationGame.jsx
decisions:
  - "RhythmReadingGame ScorePill shows running mean exercise accuracy (totalScore / exerciseScores.length) — consistent with VictoryScreen which shows totalScore; mean is more meaningful per-exercise indicator"
  - "RhythmDictationGame ScorePill inlines questionScores.filter((s) => s === 1).length per plan acceptance criteria; correctCount variable retained for VictoryScreen usage"
  - "Plan acceptance criterion 'RhythmDictationGame STILL contains useDeclareNeedsLandscape' is a plan inaccuracy — the file never had this hook (only useNeedsLandscape). The landscape-context hook useNeedsLandscape is preserved; behavior unchanged. Documented as deviation."
metrics:
  duration: "15 minutes"
  completed: "2026-06-14"
  tasks_completed: 2
  files_modified: 2
---

# Phase 36 Plan 05: RhythmReadingGame + RhythmDictationGame Base-Shell Adoption Summary

Wave 4 base-shell rollout: RhythmReadingGame and RhythmDictationGame adopt the shared `ProgressBar` and `ScorePill` from `../shared/hud/`, replacing their inline progress text and score spans.

## What Was Built

### Task 1: RhythmReadingGame shared HUD adoption

**File:** `src/components/games/rhythm-games/RhythmReadingGame.jsx`

- Added `import { ProgressBar } from "../shared/hud/ProgressBar"` and `import { ScorePill } from "../shared/hud/ScorePill"`
- Replaced the header's inline `{currentExercise + 1} / {totalExercises}` text (inside a `<div className="text-sm font-medium">`) with the shared `<ProgressBar current={currentExercise} total={totalExercises} />`
- Added `<ScorePill value={...} label={t("games.score")} />` showing running mean exercise accuracy: `exerciseScores.length > 0 ? Math.round(totalScore / exerciseScores.length) : 0`
- Header refactored from `justify-between` to `gap-2` with `flex-1 px-2` wrapper for ProgressBar — matches SightReadingGame header pattern
- `useDeclareNeedsLandscape(...)` call preserved at line 92
- Staff scroll `progressFraction` rendering left entirely untouched (different concept from session progress)

### Task 2: RhythmDictationGame shared HUD adoption

**File:** `src/components/games/rhythm-games/RhythmDictationGame.jsx`

- Added `import { ProgressBar } from "../shared/hud/ProgressBar"` and `import { ScorePill } from "../shared/hud/ScorePill"`
- Replaced right-column `<span dir="ltr">{currentQuestion + 1}/{TOTAL_QUESTIONS}</span>` with `<ProgressBar current={currentQuestion} total={TOTAL_QUESTIONS} />`
- Replaced right-column `<span className="font-rounded text-xs text-indigo-300">{correctCount} ✓</span>` with `<ScorePill value={questionScores.filter((s) => s === 1).length} label={t("games.score")} />`
- `useNeedsLandscape` import and call preserved; VexFlow choice-card mechanics untouched
- `correctCount` variable retained (still needed for VictoryScreen `score={correctCount}`)
- No engagement layer (lives/combo/on-fire) added — D-02 respected

### Locale

No locale changes needed — `games.score` (`"Score"` / `"ניקוד"`) already exists in both `src/locales/en/common.json` and `src/locales/he/common.json`.

## Verification Results

| Check                                                                    | Result                                              |
| ------------------------------------------------------------------------ | --------------------------------------------------- |
| `npx vitest run src/components/games/shared/hud`                         | 7 tests, all PASS                                   |
| `npx vitest run src/components/games/rhythm-games`                       | 241 tests across 22 files, all PASS                 |
| `npm run test:run` (full suite)                                          | 1910 tests, 81 files PASS, 2 skipped (pre-existing) |
| `npm run lint`                                                           | 0 errors, 124 warnings (all pre-existing)           |
| `useDeclareNeedsLandscape` present in RhythmReadingGame                  | Confirmed (line 92)                                 |
| `useNeedsLandscape` preserved in RhythmDictationGame                     | Confirmed (line 69)                                 |
| Old inline progress text `{currentQuestion+1}/{TOTAL_QUESTIONS}` removed | Confirmed                                           |
| No lives/combo/on-fire added to either game                              | Confirmed                                           |

## Deviations from Plan

### Plan Inaccuracy: RhythmDictationGame useDeclareNeedsLandscape acceptance criterion

The plan acceptance criteria states: "RhythmDictationGame.jsx STILL contains `useDeclareNeedsLandscape(`".

However, `RhythmDictationGame.jsx` never contained `useDeclareNeedsLandscape` — it only uses `useNeedsLandscape` (which reads the declared landscape need from context, but does not declare one itself). This is architecturally correct: RhythmDictationGame is portrait-compatible and doesn't declare a landscape requirement. The landscape orientation behavior is preserved via `useNeedsLandscape` + `shouldShowPrompt` gate, which remains untouched.

**Impact:** None — the actual landscape lock behavior is correct and unchanged. This was a plan documentation error, not a regression.

## Known Stubs

None. Both games wire real session state to the shared HUD components.

## Threat Flags

None. Presentational HUD adoption with no new attack surface, no new user input, and no changes to game mechanics or data flow.

## Self-Check

- [x] `src/components/games/rhythm-games/RhythmReadingGame.jsx` — modified and committed
- [x] `src/components/games/rhythm-games/RhythmDictationGame.jsx` — modified and committed
- [x] Commit `4f0fbd2` exists

## Self-Check: PASSED
