---
phase: 36-game-screen-ui-unification
plan: "02"
subsystem: game-hud
tags: [component-extraction, refactor, shared-hud, notes-recognition]
dependency_graph:
  requires: ["36-01"]
  provides:
    [
      "shared/hud/ProgressBar",
      "shared/hud/ScorePill",
      "shared/hud/TimerDisplay",
    ]
  affects:
    ["NotesRecognitionGame", "Wave 2 adoption targets in 36-03 through 36-07"]
tech_stack:
  added: []
  patterns:
    [
      "named-export component",
      "React.forwardRef",
      "framer-motion spring",
      "TINT array tier mapping",
    ]
key_files:
  created:
    - src/components/games/shared/hud/ProgressBar.jsx
    - src/components/games/shared/hud/ScorePill.jsx
    - src/components/games/shared/hud/TimerDisplay.jsx
  modified:
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx
decisions:
  - "ScorePill uses React.forwardRef so scorePillRef passes through for TierUpPopup fly-to (Pitfall 1 in RESEARCH.md)"
  - "StageCard left inline in NotesRecognitionGame — local layout wrapper, not in D-12 shared list"
  - "Engagement layer (lives, combo pill, on-fire, speed-bonus, tier-up) stays inline; extracted in Wave 3 (Plan 36-08)"
  - "comboTier computed inline in parent IIFE and passed as comboTint prop to ScorePill"
  - "Clock3 import removed from NotesRecognitionGame after inline TimerDisplay deletion"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-11"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 36 Plan 02: Base-Shell HUD Extraction Summary

Verbatim lift of ProgressBar, ScorePill, and TimerDisplay from NotesRecognitionGame into `shared/hud/`, turning Plan 36-01's RED contract tests GREEN and proving zero visual regression on the reference game.

## Tasks Completed

| Task | Name                                                           | Commit  | Files                              |
| ---- | -------------------------------------------------------------- | ------- | ---------------------------------- |
| 1    | Create ProgressBar.jsx, ScorePill.jsx, TimerDisplay.jsx        | ca263cd | 3 new files created in shared/hud/ |
| 2    | Refactor NotesRecognitionGame to consume base-shell components | 8433cd4 | NotesRecognitionGame.jsx           |

## Verification

- `npx vitest run src/components/games/shared/hud` — 7 tests GREEN (ProgressBar: 3, ScorePill: 4)
- `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` — 11 tests GREEN
- All 18 tests pass across 3 test files

## Component Contracts

**ProgressBar** (`export function ProgressBar({ current, total })`)

- Gradient fill `from-indigo-400 via-violet-400 to-fuchsia-400` with spring animation via `useMotionTokens().soft`
- 5 checkpoint dots at 0/25/50/75/100%
- Counter text via `noteRecognition.questionProgress` i18n key

**ScorePill** (`export const ScorePill = React.forwardRef(...)`)

- `comboTint={0|1|2}` maps to white/amber/yellow glass border+bg
- Floating `+{floatingScore}` animation with `AnimatePresence` keyed by `floatingScoreKey`
- `ref` forwarded to outer `<div>` for TierUpPopup fly-to targeting

**TimerDisplay** (`export function TimerDisplay({ formattedTime })`)

- Clock3 pill with `games.time` i18n label + `formattedTime || "00:00"`

## Refactor Changes in NotesRecognitionGame

- Added imports for `ProgressBar`, `ScorePill`, `TimerDisplay` from `../shared/hud/`
- Deleted inline `const TimerDisplay` declaration (~15 lines)
- Deleted inline `const ProgressBar` declaration (~51 lines)
- Kept `const StageCard` inline (local layout wrapper)
- Replaced inline score-pill IIFE (~56 lines) with `<ScorePill ref={scorePillRef} value={progress.score} label="XP" comboTint={comboTier} floatingScore={floatingScore} floatingScoreKey={floatingScoreKey} />`
- Removed now-unused `Clock3` from lucide-react import
- Net: 109 lines removed from the file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused Clock3 import**

- **Found during:** Task 2, after deleting inline TimerDisplay declaration
- **Issue:** `Clock3` was imported from lucide-react but only used by the now-deleted inline `TimerDisplay` component. Would cause lint warning.
- **Fix:** Removed `Clock3` from the destructured lucide-react import on line 3.
- **Files modified:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx`
- **Commit:** 8433cd4

## Known Stubs

None. All three extracted components are fully wired with real data from their parent.

## Threat Flags

None. Presentational component extraction with no new trust boundaries, network calls, or user input.

## Self-Check: PASSED

- [x] `src/components/games/shared/hud/ProgressBar.jsx` exists
- [x] `src/components/games/shared/hud/ScorePill.jsx` exists
- [x] `src/components/games/shared/hud/TimerDisplay.jsx` exists
- [x] `src/components/games/notes-master-games/NotesRecognitionGame.jsx` modified
- [x] Commit ca263cd exists (Task 1)
- [x] Commit 8433cd4 exists (Task 2)
- [x] All tests pass (18/18)
