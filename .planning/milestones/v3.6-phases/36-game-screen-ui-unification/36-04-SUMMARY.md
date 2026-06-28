---
phase: 36-game-screen-ui-unification
plan: "04"
subsystem: games/hud
tags: [refactor, hud, base-shell, sight-reading, memory-game, wave-2]
dependency_graph:
  requires: ["36-02", "36-03"]
  provides: ["SightReadingGame base-shell", "MemoryGame base-shell"]
  affects: ["36-05", "36-06"]
tech_stack:
  added: []
  patterns:
    ["shared/hud import pattern", "base-shell adoption (no engagement layer)"]
key_files:
  modified:
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/components/games/notes-master-games/MemoryGame.jsx
decisions:
  - "Pass currentExerciseNumber - 1 to ProgressBar (1-indexed source; ProgressBar expects 0-indexed count)"
  - "ScorePill added to SightReadingGame right-controls area (no pre-existing score pill; plan intent was to add it)"
  - "ProgressBar placed below MemoryGame header inside gameStarted && !gameFinished guard"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-14"
  tasks_completed: 2
  files_modified: 2
---

# Phase 36 Plan 04: SightReadingGame + MemoryGame Base-Shell Adoption Summary

SightReadingGame and MemoryGame now consume the shared `ProgressBar` and `ScorePill` HUD
components extracted in Plan 36-02, removing their custom inline equivalents. No engagement
layer (lives/combo/on-fire) was added — base shell only per D-01/D-02.

## Tasks Completed

### Task 1: SightReadingGame adopts shared ProgressBar + ScorePill

**Commit:** `0e69f8c`

**Changes:**

- Added imports: `ProgressBar` and `ScorePill` from `../shared/hud/ProgressBar` and `../shared/hud/ScorePill`
- Replaced the custom `h-1 bg-indigo-300` CSS-transition progress bar (with its exercise counter text, victory/complete status span) with `<ProgressBar current={currentExerciseNumber - 1} total={sessionTotalExercises} />`
- Added `<ScorePill value={Math.round(sessionTotalScore)} label={t("games.score")} />` in the right-controls area (before the BPM pill)
- Removed now-unused `progressFraction` from the `useSightReadingSession` destructure
- Removed now-unused `progressPercentage` derived constant

**Indexing rationale:** `currentExerciseNumber` is 1-indexed (`completedExercises + 1` during play, `totalExercises` when complete). Passing `currentExerciseNumber - 1` to ProgressBar aligns with the component's 0-indexed-count expectation (matches the `progress.totalQuestions` pattern used in NotesRecognitionGame).

**Locale check:** `t("games.score")` — key exists in both `src/locales/en/common.json` ("Score") and `src/locales/he/common.json` ("ניקוד"). No new keys added.

### Task 2: MemoryGame adopts shared ProgressBar + ScorePill

**Commit:** `0e69f8c` (same commit — both games in one atomic change)

**Changes:**

- Added imports: `ProgressBar` and `ScorePill` from `../shared/hud/ProgressBar` and `../shared/hud/ScorePill`
- Replaced the `rounded-lg border border-white/20 bg-white/10` inline score div (with "XP:" label span + `{score}` span) with `<ScorePill value={score} label="XP" />`
- Added `<ProgressBar current={matchedIndexes.length / 2} total={cards.length / 2} />` in a new `px-3 pb-1` container placed below the header and above the fireworks/game content, guarded by `{gameStarted && !gameFinished && ...}`
- Corner-radius change from `rounded-lg` to `rounded-full` is intentional (REQ-04, Pitfall 6 in RESEARCH.md)

## Acceptance Criteria Verification

| Criterion                                                             | Result |
| --------------------------------------------------------------------- | ------ |
| SightReadingGame imports from `../shared/hud/ProgressBar`             | PASS   |
| SightReadingGame imports from `../shared/hud/ScorePill`               | PASS   |
| SightReadingGame renders `<ProgressBar current={`                     | PASS   |
| SightReadingGame renders `<ScorePill value={`                         | PASS   |
| Old `h-1` inline progress bar block removed                           | PASS   |
| MemoryGame imports from `../shared/hud/ProgressBar`                   | PASS   |
| MemoryGame imports from `../shared/hud/ScorePill`                     | PASS   |
| MemoryGame renders `<ProgressBar current={matchedIndexes.length / 2}` | PASS   |
| MemoryGame renders `<ScorePill value={score}`                         | PASS   |
| Former `rounded-lg` score pill block removed                          | PASS   |
| No engagement layer added (lives/combo/on-fire)                       | PASS   |
| Locale parity (no new keys needed — `games.score` already existed)    | PASS   |

## Test Results

- `npx vitest run src/components/games/shared/hud` — 7 tests, **all green**
- `npx vitest run src/components/games/sight-reading-game src/components/games/notes-master-games` — 124 tests, **all green**
- `npm run lint` — 0 errors (pre-existing warnings only, none in modified files)
- `npm run build` — **clean build** (chunk size warnings pre-existing, not new)

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written.

### Observations

**SightReadingGame had no pre-existing score pill in the HUD.** The research document noted "Has an inline score label," which appears to have referred to the exercise counter text within the progress bar block. The ScorePill was added as a net-new HUD element (right-controls area) consistent with the plan's intent to bring SightReadingGame to the NotesRecognition base-shell standard. This is the correct interpretation per the plan's must-haves ("SightReadingGame renders the shared ScorePill in place of its custom inline score label").

## Known Stubs

None — all wired to live game state.

## Threat Flags

None — presentational HUD swap only; no new attack surface.

## Self-Check

Checking files exist and commit is recorded.
