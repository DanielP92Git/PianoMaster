---
phase: 23-ux-polish
fixed_at: 2026-04-08T11:30:58Z
review_path: .planning/phases/23-ux-polish/23-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 4
skipped: 2
status: partial
---

# Phase 23: Code Review Fix Report

**Fixed at:** 2026-04-08T11:30:58Z
**Source review:** .planning/phases/23-ux-polish/23-REVIEW.md
**Iteration:** 1

**Summary:**

- Findings in scope: 6
- Fixed: 4
- Skipped: 2

## Fixed Issues

### CR-01: Missing `rhythm_tap` case in handleNextExercise across three game components

**Files modified:** `src/components/games/rhythm-games/RhythmDictationGame.jsx`, `src/components/games/rhythm-games/RhythmReadingGame.jsx`, `src/components/games/rhythm-games/MetronomeTrainer.jsx`
**Commit:** c3c0cf9
**Applied fix:** Added `rhythm_tap` case (navigates to `/rhythm-mode/rhythm-reading-game`) and `rhythm_pulse` case (navigates to `/rhythm-mode/metronome-trainer` with reload) to the `handleNextExercise` switch statements in all three components. MetronomeTrainer already had `rhythm_pulse` so only `rhythm_tap` was added there. RhythmReadingGame's `rhythm_tap` case uses `replace: true` + `window.location.reload()` since it navigates to the same route.

### WR-01: Stale closure in handleCardSelect calling advanceQuestion

**Files modified:** `src/components/games/rhythm-games/RhythmDictationGame.jsx`
**Commit:** 7b32dc2
**Applied fix:** Moved the `advanceQuestion` useCallback definition before `handleCardSelect` (was previously defined after, causing a temporal dead zone reference issue if added as a dependency). Then added `advanceQuestion` to `handleCardSelect`'s dependency array to eliminate the stale closure.

### WR-02: useDocumentTitle missing routes for new rhythm games

**Files modified:** `src/hooks/useDocumentTitle.js`
**Commit:** 8d2ca62
**Applied fix:** Added document title mappings for five missing game routes: `/rhythm-reading-game`, `/rhythm-dictation-game`, `/arcade-rhythm-game`, `/note-comparison-game`, and `/interval-game`. Each uses the appropriate parent page name and game-specific i18n key with defaultValue fallbacks.

### WR-05: `getBeatCount` for 6/8 in DictationChoiceCard uses fixed beat_value=4

**Files modified:** `src/components/games/rhythm-games/components/DictationChoiceCard.jsx`
**Commit:** 1397d92
**Applied fix:** Replaced `getBeatCount()` (which collapsed 6/8 to 3 quarter-note beats) with `getVoiceParams()` that returns raw `{ num_beats, beat_value }` from the time signature string. Updated the Voice constructor call to use `getVoiceParams(timeSignature)` directly, so 6/8 correctly uses `{ num_beats: 6, beat_value: 8 }` for proper VexFlow measure validation.

## Skipped Issues

### WR-03: Conditional hook calls for useSessionTimeout and useAccessibility

**File:** `src/components/games/rhythm-games/RhythmDictationGame.jsx:109-117`, `src/components/games/rhythm-games/RhythmReadingGame.jsx:81-87`, `src/components/games/rhythm-games/MetronomeTrainer.jsx:90-98`
**Reason:** The reviewer's fix suggestion is a design-level refactoring recommendation ("create a useOptionalSessionTimeout wrapper hook") rather than a targeted code fix. The reviewer explicitly acknowledged this is an existing pattern used across the codebase and flagged it as warning rather than critical. Implementing a centralized optional-context hook is a cross-cutting change that should be done as a dedicated refactoring task, not a point fix.
**Original issue:** try/catch around useSessionTimeout() and useAccessibility() hooks is fragile and creates new callback references on each render via `let` re-declarations.

### WR-04: `window.location.reload()` after navigate for same-route transitions

**File:** `src/components/games/rhythm-games/RhythmDictationGame.jsx:526-527`, `src/components/games/rhythm-games/RhythmReadingGame.jsx:849-850`, `src/components/games/rhythm-games/MetronomeTrainer.jsx:214-218`
**Reason:** The suggested fix (adding `exerciseIndex` to existing reset useEffect dependencies) is a behavioral change that risks incomplete state resets. The `window.location.reload()` pattern fully resets audio context, refs, timers, and all in-memory state when navigating to the same route -- simply adding a dependency to the existing nodeId-change effect may not cover all of these. This requires deeper behavioral testing and verification that the full state machine resets correctly without reload, which is beyond the scope of a point fix.
**Original issue:** `window.location.reload()` after `navigate()` causes jarring full-page flash and loses in-memory state (audio context, cached resources).

---

_Fixed: 2026-04-08T11:30:58Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
