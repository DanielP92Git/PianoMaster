---
phase: 36-game-screen-ui-unification
plan: 10
subsystem: ear-training-games
tags: [hud, engagement, combo, on-fire, no-lives, ear-training]
dependency_graph:
  requires: ["36-07"]
  provides: ["NoteComparisonGame HUD adoption", "IntervalGame HUD adoption"]
  affects:
    [
      "ear-training-games/NoteComparisonGame.jsx",
      "ear-training-games/IntervalGame.jsx",
    ]
tech_stack:
  added: []
  patterns:
    - "Shared HUD adoption (ProgressBar + ScorePill + ComboPill + OnFireBadge) via ../shared/hud/"
    - "D-08 no-lives engagement: combo resets on wrong, no life deduct, always VictoryScreen"
    - "ON_FIRE_THRESHOLD=5 local constant mirroring NotesRecognitionGame"
key_files:
  created: []
  modified:
    - src/components/games/ear-training-games/NoteComparisonGame.jsx
    - src/components/games/ear-training-games/IntervalGame.jsx
decisions:
  - "Combo resets to 0 and isOnFire resets to false on wrong answer (mirrors NotesRecognitionGame reference pattern, consistent UX)"
  - "isOnFire added to handleAnswer deps array to avoid stale closure on combo setCombo functional updater"
  - "ProgressBar placed below header row (full width), HUD pills in header flex-end group"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-14"
  tasks_completed: 2
  files_modified: 2
---

# Phase 36 Plan 10: Ear-Training HUD Adoption (Base Shell + Combo/On-Fire) Summary

Shared ProgressBar + ScorePill + ComboPill + OnFireBadge wired into both NoteComparisonGame and IntervalGame with new combo/isOnFire engagement state; D-08 no-lives model throughout.

## What Was Built

Both ear-training games (`NoteComparisonGame.jsx` and `IntervalGame.jsx`) now consume the four shared HUD components extracted in earlier waves:

- `ProgressBar` — full-width progress bar below the header
- `ScorePill` — score display with combo-tier tinting (0/1/2)
- `ComboPill` — combo counter pill with Zap icon and tier colors
- `OnFireBadge` — animated flame badge at combo threshold

### Engagement State (D-08 No-Lives Model)

Both games gain identical engagement state:

- `combo` — increments on correct answers, resets to 0 on wrong
- `isOnFire` — set true when combo reaches `ON_FIRE_THRESHOLD = 5`; reset false on wrong
- Wrong answers: `setCombo(0)` + `setIsOnFire(false)` with NO life deduction and NO early GameOver
- Sessions always end on VictoryScreen — the always-finish model is preserved

### Import Paths

Both files use the correct single-`..` path (not the typo `../../` noted in 36-PATTERNS.md):

```
from "../shared/hud/ProgressBar"
from "../shared/hud/ScorePill"
from "../shared/hud/ComboPill"
from "../shared/hud/OnFireBadge"
```

### HUD Layout

```jsx
{/* HUD header */}
<div className="flex items-center justify-between gap-2">
  <BackButton ... />
  <div className="flex items-center gap-2">
    <ScorePill value={...} label={t("games.score")} comboTint={combo >= 8 ? 2 : combo >= 3 ? 1 : 0} />
    <OnFireBadge active={isOnFire} />
    <ComboPill combo={combo} />
  </div>
</div>
{/* Progress bar */}
<ProgressBar current={...} total={TOTAL_QUESTIONS} />
```

- `NoteComparisonGame`: `current={currentQuestion}`
- `IntervalGame`: `current={questionScores.length}`

The `games.score` locale key was already present in both `en` ("Score") and `he` ("ניקוד") — no locale additions needed.

## D-08 Compliance Confirmation

- Neither file imports `LivesDisplay`, `SpeedBonusFlash`, or `TierUpPopup`
- No `GameOverScreen` path was added to either file
- The `handleAnswer` wrong branch contains only: `setCombo(0)`, `setIsOnFire(false)`, `playWrongSound()`, feedback text, and `advanceQuestion()` timeout
- Sessions always terminate via `setGamePhase(GAME_PHASES.SESSION_COMPLETE)` → `VictoryScreen`

## Verification Results

| Check                                                      | Result                                        |
| ---------------------------------------------------------- | --------------------------------------------- |
| `npx vitest run src/components/games/shared/hud`           | 13/13 pass                                    |
| `npx vitest run NoteComparisonGame.test.js`                | 8/8 pass                                      |
| `npx vitest run IntervalGame.test.js`                      | 10/10 pass                                    |
| `npm run test:run` (full suite)                            | 1916/1916 pass, 0 failures                    |
| `npm run build`                                            | clean (pre-existing chunk size warnings only) |
| No LivesDisplay/SpeedBonusFlash/TierUpPopup in either file | confirmed                                     |
| No GameOverScreen path added                               | confirmed                                     |

## Deviations from Plan

None — plan executed exactly as written. One design alignment noted:

**[Reference pattern applied] Reset isOnFire on wrong answer**

- Plan showed only `setCombo(0)` in the wrong-answer handler snippet
- Reference game (NotesRecognitionGame) also resets `setIsOnFire(false)` when combo breaks
- Applied both resets to match the reference UX (fire badge disappears when streak breaks)
- Acceptance criteria only checks for `setCombo(0)` — both conditions satisfied

## Self-Check: PASSED

- `.planning/phases/36-game-screen-ui-unification/36-10-SUMMARY.md` — FOUND
- Commit `bdb70634` — FOUND in git log
