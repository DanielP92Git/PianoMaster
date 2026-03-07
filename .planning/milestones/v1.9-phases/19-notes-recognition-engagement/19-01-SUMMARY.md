---
phase: 19-notes-recognition-engagement
plan: "01"
subsystem: game-engagement
tags: [combo, lives, speed-bonus, notes-recognition, hud, i18n]
dependency_graph:
  requires: []
  provides: [combo-mechanic, lives-system, speed-bonus, engagement-hud]
  affects: [NotesRecognitionGame, GameOverScreen, useGameProgress]
tech_stack:
  added: []
  patterns: [ref-plus-state, module-level-constants, scoreOverride-param]
key_files:
  created: []
  modified:
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx
    - src/features/games/hooks/useGameProgress.js
    - src/components/games/GameOverScreen.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
decisions:
  - "COMBO_TIERS, SPEED_BONUS constants defined at module level (not inside component) to avoid useCallback dep churn"
  - "scoreOverride defaults to +10 when undefined — backward compatible with SightReadingGame and other callers"
  - "livesRef.current checked in handleGameOver (not state) to get latest value despite closure"
  - "isGameEndingRef.current=true set immediately when livesRef<=0 inside handleAnswerSelect to block next-note render before 50ms timeout fires"
  - "handleGameOver added to handleAnswerSelect dep array — not circular since handleGameOver never calls handleAnswerSelect"
metrics:
  duration: "~6 minutes"
  completed: "2026-03-05"
  tasks: 2
  files: 5
---

# Phase 19 Plan 01: Combo Counter, Speed Bonus, and Lives System Summary

Integrated three scoring/consequence mechanics into the Notes Recognition game: combo counter with multiplier tiers (2x at 3, 3x at 8), speed bonus (+5 pts for answers within 3 seconds), and a 3-lives system that ends the game early when all hearts are lost.

## What Was Built

**Task 1: Logic integration (NotesRecognitionGame + useGameProgress)**

- Added `COMBO_TIERS`, `SPEED_BONUS_THRESHOLD_MS`, `SPEED_BONUS_POINTS`, `BASE_SCORE`, `INITIAL_LIVES` as module-level constants to avoid re-creation on each render
- Added engagement state: `combo`/`comboRef`, `lives`/`livesRef`, `speedBonusKey`, `showSpeedBonus`, `comboShake`, `questionStartTimeRef`
- Restructured `handleAnswerSelect` to:
  1. Compute `isCorrect` locally (not via `handleAnswer` return value)
  2. On correct: increment comboRef, compute multiplier tier, check 3s speed threshold, compute `earnedScore = BASE_SCORE * multiplier + (isSpeedBonus ? SPEED_BONUS_POINTS : 0)`
  3. On wrong: shake combo if >0, reset combo to 0, decrement livesRef, set `isGameEndingRef.current = true` if livesRef <= 0
  4. Pass `scoreOverride` to `handleAnswer` for multiplied score
  5. Trigger `handleGameOver` after 50ms on lives depletion
- Added `questionStartTimeRef` reset useEffect watching `progress.currentNote`
- Added engagement state reset in `startGame` (combo=0, lives=3)
- Updated `handleGameOver` to compute `livesLost = livesRef.current <= 0` and include it in `isLost` and `updateProgress`
- Modified `useGameProgress.handleAnswer` to accept optional `scoreOverride` parameter; falls back to `+10` when undefined

**Task 2: HUD visuals, GameOverScreen, i18n**

- Added combo pill in HUD: `x{combo}` with amber `{multiplier}x` badge when tier > 1x; pop animation on correct, shake animation on wrong
- Added 3 hearts in HUD: filled red for remaining lives, grey outline for lost; exit animation scales up then shrinks
- Added FAST! speed bonus overlay: positioned absolutely above game area, AnimatePresence fade in/out at 800ms
- Updated `GameOverScreen` to accept `livesLost` and `correctAnswers` props; shows Heart icon + "Great try! You got X right!" when lives depleted
- Added `games.engagement.{combo,fast,lives,newNote}` i18n keys in English and Hebrew
- Added `games.gameOver.{livesLost,livesLostMessage}` i18n keys in English and Hebrew with encouraging tone

## Deviations from Plan

**1. [Rule 1 - Refactor] Moved engagement constants outside component**
- **Found during:** Task 1 implementation
- **Issue:** `COMBO_TIERS` array defined inside component would cause `useCallback` dep to re-create on every render if included in deps array
- **Fix:** Moved all 5 engagement constants (`COMBO_TIERS`, `SPEED_BONUS_THRESHOLD_MS`, `SPEED_BONUS_POINTS`, `BASE_SCORE`, `INITIAL_LIVES`) to module level above the component
- **Files modified:** `NotesRecognitionGame.jsx`
- **Commit:** ae0ef96

**2. [Rule 1 - Bug] handleAnswerSelect restructured to compute isCorrect locally**
- **Found during:** Task 1 implementation
- **Issue:** Plan specified calling `handleAnswer` to get `isCorrect`, then computing engagement. But `handleAnswer` now uses `scoreOverride` which we compute before calling it — the order was inherently circular
- **Fix:** Compute `isCorrect = selectedAnswer === curNote.note` locally first, then compute `earnedScore`, then call `handleAnswer(selectedAnswer, curNote.note, earnedScore)`
- **Files modified:** `NotesRecognitionGame.jsx`
- **Commit:** ae0ef96

## Self-Check

Files exist:
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — modified
- `src/features/games/hooks/useGameProgress.js` — modified
- `src/components/games/GameOverScreen.jsx` — modified
- `src/locales/en/common.json` — modified
- `src/locales/he/common.json` — modified

Commits:
- ae0ef96: feat(19-01): add combo/speed/lives state and integrate into handleAnswerSelect
- e430b80: feat(19-01): add HUD visuals, GameOverScreen lives variant, and i18n keys

Build: `npx vite build --mode production` — passed (no errors, only pre-existing chunk size warning)
