---
phase: 13-eslint-cleanup
plan: 03
subsystem: tooling
tags: [eslint, react-hooks, exhaustive-deps, game-components, audio]

# Dependency graph
requires:
  - phase: 13-01
    provides: ESLint flat config baseline
  - phase: 13-02
    provides: 0 no-unused-vars warnings
provides:
  - 43 react-hooks/exhaustive-deps warnings resolved across 17 files
  - 2 pre-existing stale eslint-disable directives removed
  - 1 pre-existing bug fixed (Award import in AssignmentManagement.jsx)
  - Project-wide ESLint exhaustive-deps count: 43 -> 0
  - npm run lint: 0 problems (0 errors, 0 warnings)
affects: [14-coppa-hard-delete, 15-qa-final-checklist]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "eslint-disable-next-line before closing deps array (not before useCallback opening) for exhaustive-deps suppressions"
    - "Move module-level utilities (debugLog) outside hook body to make them stable refs"
    - "Wrap data-loading functions in useCallback([deps]) and add to useEffect deps (AccountDeletionModal, DataExportModal pattern)"
    - "Move computed arrays inside useMemo to prevent unstable reference (tabIds in MobileTabsNav)"
    - "audioEngine from useAudioEngine returns new object each render -- suppress exhaustive-deps with written rationale"

key-files:
  created: []
  modified:
    - src/features/games/hooks/useGameTimer.js
    - src/features/games/hooks/useGameProgress.js
    - src/components/pwa/PWAInstallPrompt.jsx
    - src/components/games/rhythm-games/components/RhythmNotationRenderer.jsx
    - src/components/layout/MobileTabsNav.jsx
    - src/components/teacher/AccountDeletionModal.jsx
    - src/components/teacher/DataExportModal.jsx
    - src/components/trail/ZigzagTrailLayout.jsx
    - src/components/games/notes-master-games/MemoryGame.jsx
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx
    - src/components/games/rhythm-games/MetronomeTrainer.jsx
    - src/components/games/shared/UnifiedGameSettings.jsx
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx
    - src/components/teacher/AssignmentManagement.jsx
    - src/components/ui/AudioRecorder.jsx
    - src/components/ui/PracticeSessionPlayer.jsx
    - src/hooks/useAudioEngine.js
    - src/hooks/usePitchDetection.js

key-decisions:
  - "debugLog in useGameTimer: moved to module scope (stable reference) rather than suppressing — genuine fix, cleaner than lint suppression"
  - "audioEngine (from useAudioEngine hook) returns a new object reference each render; adding to deps would cause constant callback invalidation; 8 suppressions for this reason across SightReadingGame and MetronomeTrainer"
  - "createCards in MemoryGame: component-body function redefined every render; wrapping in useCallback would require listing all game state deps risking infinite loops; suppressed with rationale"
  - "startGame in NotesRecognitionGame: plain function that cannot be wrapped in useCallback without listing many state deps; ESLint warning suppressed at definition site"
  - "queryClient in useGameProgress: removed as unnecessary dep (ESLint's recommendation) — also removed unused import"
  - "AssignmentManagement.jsx Award import: Rule 1 bug fix — Plan 02 incorrectly removed this import while it was still used in JSX"

requirements-completed: [LINT-03]

# Metrics
duration: ~60min
completed: 2026-03-20
---

# Phase 13 Plan 03: ESLint Cleanup — react-hooks/exhaustive-deps Summary

**43 react-hooks/exhaustive-deps warnings resolved across 17 files (mix of genuine fixes and 25 justified suppressions); npm run lint reports 0 problems, all 211 tests pass, production build succeeds**

## Performance

- **Duration:** ~60 min
- **Started:** 2026-03-20T16:55:00Z
- **Completed:** 2026-03-20T17:45:30Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments

- Eliminated all 43 `react-hooks/exhaustive-deps` warnings from the codebase
- 18 genuine fixes (proper deps added, unnecessary deps removed, code restructured)
- 25 intentional suppressions, each with a written rationale using `-- <reason>` format
- Removed 2 pre-existing stale `eslint-disable-next-line` directives
- Fixed a Rule 1 regression from Plan 02 (missing `Award` import in AssignmentManagement.jsx)
- `npm run lint` now reports exactly: 0 problems (0 errors, 0 warnings)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix exhaustive-deps in simple hooks and non-game components (8 files)** - `626c843` (fix)
2. **Task 2: Fix exhaustive-deps in game components and audio hooks + final verification** - `51f2cff` (fix)

## Files Created/Modified

**Task 1 (8 files — utility hooks and simple components):**
- `src/features/games/hooks/useGameTimer.js` — moved `debugLog`/`DEBUG` to module scope (genuine fix: stable reference, no suppression needed)
- `src/features/games/hooks/useGameProgress.js` — removed unnecessary `queryClient` dep and import
- `src/components/pwa/PWAInstallPrompt.jsx` — 2 suppressions: one-time mount effects reading localStorage
- `src/components/games/rhythm-games/components/RhythmNotationRenderer.jsx` — 1 suppression: `drawNotation` receives all args explicitly, no state closure
- `src/components/layout/MobileTabsNav.jsx` — moved `tabIds` computation inside `useMemo` to prevent unstable reference
- `src/components/teacher/AccountDeletionModal.jsx` — wrapped `loadDeletionStatus` in `useCallback([student])`, added to effect deps
- `src/components/teacher/DataExportModal.jsx` — wrapped `loadDataSummary` in `useCallback([student])`, added to effect deps
- `src/components/trail/ZigzagTrailLayout.jsx` — added `isRTL` to positions `useMemo` deps (correct fix: RTL should trigger recalculation)

**Task 2 (11 files — game components and audio hooks):**
- `src/components/games/notes-master-games/MemoryGame.jsx` — 5 suppressions: `createCards` (component-body function), `applySettingsAndRestart` auto-start
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — 3 suppressions: 2 auto-start effects (guarded by `hasAutoStartedRef`), `startGame` plain function
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — 1 suppression (auto-start); 1 removal (`audioEngine` was genuinely unnecessary in `evaluatePattern`)
- `src/components/games/shared/UnifiedGameSettings.jsx` — wrapped `getNoteId` in `useCallback([noteIdField])` for stable reference
- `src/components/games/sight-reading-game/SightReadingGame.jsx` — added `queryClient`, `pauseTimer`, `inputMode`, `setTimingStateSync`, `trailKeySignature` where safe; 4 suppressions for `audioEngine` (non-stable ref from hook); removed stale disable directive
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` — removed `currentNoteIndex` (genuinely unused in `getNoteColor`)
- `src/components/teacher/AssignmentManagement.jsx` — [Rule 1] restored `Award` import removed incorrectly in Plan 02
- `src/components/ui/AudioRecorder.jsx` — added `cleanup`, `stopRecording`, `stopRecording` to respective callbacks; removed `recordingDuration` (unnecessary); 1 suppression: `drawVisualization` defined after callback (circular dep)
- `src/components/ui/PracticeSessionPlayer.jsx` — 1 suppression: one-time mount effect (adding `audioUrl` would cause infinite loop)
- `src/hooks/useAudioEngine.js` — 1 suppression: `loadPianoSoundAsync`/`loadTapSoundAsync` defined after callback
- `src/hooks/usePitchDetection.js` — removed stale `eslint-disable-next-line` directive (problem it was suppressing no longer exists after Plan 02)

## Suppression Count

`grep -r "eslint-disable-next-line react-hooks/exhaustive-deps" src/ | wc -l` = **25 suppressions**

Each suppression uses the `-- <written rationale>` format. No block-level `/* eslint-disable */` used anywhere.

## Decisions Made

- `debugLog` in `useGameTimer`: moved to module scope rather than suppressing — if a function only reads compile-time constants, module scope is the cleanest solution
- `audioEngine` object from `useAudioEngine()`: returns a new object reference each render; adding as dep would cause constant callback invalidation with no benefit; all internal operations use stable `AudioContext` refs; suppressed across 4 callbacks in SightReadingGame and 1 in MetronomeTrainer
- `createCards` in `MemoryGame`: wrapping in `useCallback` would require listing all game-state deps that change on every game action — circular invalidation risk; suppressed in 5 locations with identical rationale
- `startGame` in `NotesRecognitionGame`: plain function at component scope (not `useCallback`) that's called from many places; wrapping safely would be a large refactor outside plan scope; suppressed at definition site

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored Award import to AssignmentManagement.jsx**
- **Found during:** Task 2 final verification (`npm run lint` revealed 2 errors)
- **Issue:** Plan 02 (`feat(13-02)` commit `7f04d9c`) removed the `Award` lucide-react import from AssignmentManagement.jsx as "unused", but the component uses `<Award />` in JSX at lines 391 and 711
- **Fix:** Re-added `Award` to the lucide-react import block
- **Files modified:** `src/components/teacher/AssignmentManagement.jsx`
- **Commit:** `51f2cff` (included in Task 2 commit)

**2. [Rule 1 - Bug] Removed stale eslint-disable directive in usePitchDetection.js**
- **Found during:** Task 2 final verification (`npm run lint`)
- **Issue:** A `// eslint-disable-next-line react-hooks/exhaustive-deps` comment at line 351 of `usePitchDetection.js` was stale — the warning it suppressed no longer fires (deps array is already correct after Plan 02 changes)
- **Fix:** Removed the unused disable directive
- **Files modified:** `src/hooks/usePitchDetection.js`
- **Commit:** `51f2cff`

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs from pre-existing code)

## Final Verification

| Check | Result |
|---|---|
| `npm run lint` | 0 problems (0 errors, 0 warnings) |
| `npm run test:run` | 211/211 tests pass |
| `npm run build` | Success (built in 35.08s) |
| `npx eslint . | grep "exhaustive-deps"` | 0 matches |
| `grep -r "eslint-disable-next-line react-hooks/exhaustive-deps" src/ | wc -l` | 25 (all with rationale) |
| Block-level `/* eslint-disable */` | None |

## Phase 13 Complete

All three plans executed:
- **Plan 01:** Config + react-refresh suppressions (574 → 228 warnings)
- **Plan 02:** no-unused-vars (228 → 45 warnings)
- **Plan 03:** react-hooks/exhaustive-deps (45 → 0 warnings)

The ESLint cleanup phase is complete. The codebase now has **0 ESLint warnings and 0 ESLint errors**.

## Self-Check: PASSED
- 19 files modified: confirmed (git log 626c843, 51f2cff)
- 25 suppressions with rationale: confirmed (`grep -r "eslint-disable-next-line react-hooks/exhaustive-deps" src/ | wc -l` = 25)
- 0 exhaustive-deps warnings: confirmed (`npm run lint` exits 0)
- 211 tests pass: confirmed
- Build succeeds: confirmed (35.08s)

---
*Phase: 13-eslint-cleanup*
*Completed: 2026-03-20*
