---
phase: 36-game-screen-ui-unification
plan: "06"
subsystem: games/hud
tags: [refactor, hud, progress-bar, score-pill, mixed-lesson, metronome, REQ-04]
dependency_graph:
  requires: ["36-02"]
  provides: ["36-07", "36-11"]
  affects:
    - src/components/games/rhythm-games/MixedLessonGame.jsx
    - src/components/games/rhythm-games/MetronomeTrainer.jsx
tech_stack:
  added: []
  patterns:
    - "Conditional trail-mode HUD: nodeId ternary to show shared vs. existing counter"
    - "Shared ProgressBar + ScorePill imported from ../shared/hud"
key_files:
  created: []
  modified:
    - src/components/games/rhythm-games/MixedLessonGame.jsx
    - src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx
    - src/components/games/rhythm-games/MetronomeTrainer.jsx
decisions:
  - "Used sessionStats.totalScore for MetronomeTrainer ScorePill (exerciseProgress.totalScore field does not exist in codebase; PATTERNS.md had incorrect field name — Rule 1 auto-fix)"
  - "MetronomeTrainer: ProgressBar shown as a separate row below header (trail mode only) to avoid breaking the 3-column justify-between header with centered game title"
  - "MixedLessonGame: wrapped ProgressBar in min-w-0 flex-1 div to maintain flex layout; ScorePill appended to top bar in both landscape and portrait layouts"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-14"
  tasks: 2
  files: 3
---

# Phase 36 Plan 06: MixedLessonGame + MetronomeTrainer Base-Shell Adoption Summary

One-liner: Unified MixedLessonGame's divergent green progress bar onto shared indigo/violet/fuchsia ProgressBar (REQ-04) and adopted shared base shell (ProgressBar + ScorePill) in MetronomeTrainer trail mode.

## Tasks Completed

### Task 1: MixedLessonGame — Delete renderProgressBar(), adopt shared ProgressBar + ScorePill

**Commit:** `e0a371e`

Changes to `src/components/games/rhythm-games/MixedLessonGame.jsx`:

- Added imports: `ProgressBar` from `../shared/hud/ProgressBar`, `ScorePill` from `../shared/hud/ScorePill`
- Deleted `renderProgressBar()` function (the `h-2 bg-green-400` CSS-transition bar with
  aria attributes and `{currentIndex}/{questions.length}` span) — REQ-04 satisfied
- Both landscape and portrait top bars now render:
  `<ProgressBar current={currentIndex} total={questions.length} />` inside a `min-w-0 flex-1` wrapper
  and `<ScorePill value={results.filter(Boolean).length} label={t("games.score")} />`
- Crossfade key (`${fadeKey}-${currentIndex}`) and `useLandscapeLock()` call untouched
- No lives/combo/on-fire added (D-02 compliant)

Changes to `src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx`:

- Added mocks for `../../shared/hud/ProgressBar` and `../../shared/hud/ScorePill` to isolate
  MixedLessonGame tests from shared component internals
- Also added missing mock fields `resolveByAnyTag` and `durationsIncludeRests` to the
  `RhythmPatternGenerator` mock (were undefined, benign before but now made explicit)
- Updated 3 progress-bar assertions:
  - `getByRole("progressbar")` → `getByTestId("progress-bar")` (new shared component has no ARIA role wrapper)
  - `"0/4"`, `"1/4"`, `"1/3"` text checks now use `getByTestId("progress-bar").textContent`

### Task 2: MetronomeTrainer — Trail-mode ProgressBar + ScorePill

**Commit:** `d75427d`

Changes to `src/components/games/rhythm-games/MetronomeTrainer.jsx`:

- Added imports: `ProgressBar` from `../shared/hud/ProgressBar`, `ScorePill` from `../shared/hud/ScorePill`
- Compact header right-side element: conditionally renders `<ScorePill value={sessionStats.totalScore} label={t("games.score")} />` in trail mode (`nodeId !== null`) or the existing text counter in free-practice mode
- Added a separate `px-4 pb-2` row below the header, only rendered when `nodeId` is truthy:
  `<ProgressBar current={exerciseProgress.currentExercise} total={exerciseProgress.totalExercises} />`
- `useLandscapeLock()`, metronome mechanics, audio engine, scoring, and free-practice layout all untouched
- No lives/combo/on-fire added (D-02 compliant)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MetronomeTrainer ScorePill uses sessionStats.totalScore instead of exerciseProgress.totalScore**

- **Found during:** Task 2
- **Issue:** PATTERNS.md table listed `exerciseProgress.totalScore` as the ScorePill value source for MetronomeTrainer. That field does not exist — `exerciseProgress` state only has `currentExercise`, `totalExercises`, `exerciseScores`, and `isGameComplete`. The running score lives in `sessionStats.totalScore`.
- **Fix:** Used `sessionStats.totalScore` (the accumulating pattern-tap score already shown in the bottom stats row at line 1470).
- **Files modified:** `MetronomeTrainer.jsx`

**2. [Plan doc error - noted] Acceptance criteria references useDeclareNeedsLandscape**

- Both MixedLessonGame and MetronomeTrainer acceptance criteria read "STILL contains `useDeclareNeedsLandscape(`". Neither file has ever used that hook — they use `useLandscapeLock()` (Android orientation lock) and `useNeedsLandscape()` (read context). Both landscape-lock mechanisms are preserved. The criteria was checking for the wrong symbol; actual behavior is correct.

## Verification

```
npx vitest run src/components/games/shared/hud     → 7 tests PASS
npx vitest run src/components/games/rhythm-games   → 241 tests PASS (22 files)
npm run test:run                                   → 1910 tests PASS (81 files)
npm run lint                                       → 0 errors, 124 pre-existing warnings
npm run build                                      → clean build (pre-existing chunk size warnings only)
```

Key link checks:

- `MixedLessonGame.jsx` contains `from "../shared/hud/ProgressBar"` — PASS
- `MixedLessonGame.jsx` contains `from "../shared/hud/ScorePill"` — PASS
- `MixedLessonGame.jsx` renderProgressBar count = 0 — PASS
- `MixedLessonGame.jsx` contains `useLandscapeLock(` — PASS
- `MetronomeTrainer.jsx` contains `from "../shared/hud/ProgressBar"` — PASS
- `MetronomeTrainer.jsx` contains `from "../shared/hud/ScorePill"` — PASS
- `MetronomeTrainer.jsx` contains `useLandscapeLock(` — PASS

## Known Stubs

None. Both components wire real session state to the shared components.

## Threat Flags

None. Pure presentational HUD swap; no new network, auth, or PII surface.

## Self-Check: PASSED

- Commits exist: `e0a371e` (MixedLessonGame), `d75427d` (MetronomeTrainer)
- All acceptance criteria confirmed via grep checks
- 1910 tests pass, build clean
