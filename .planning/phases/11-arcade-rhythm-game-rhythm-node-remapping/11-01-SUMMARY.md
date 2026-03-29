---
phase: 11-arcade-rhythm-game-rhythm-node-remapping
plan: 01
subsystem: ui
tags: [react, vitest, rhythm-game, animation, raf, web-audio-api, tailwind]

requires:
  - phase: 11-arcade-rhythm-game-rhythm-node-remapping
    provides: UI-SPEC and CONTEXT design contract for arcade rhythm game

provides:
  - ArcadeRhythmGame.jsx — full falling-tile arcade rhythm game component (1031 lines)
  - ArcadeRhythmGame.test.js — 9 unit tests covering game logic (lives, combo, on-fire, phase transitions)

affects:
  - 11-02 (rhythm node remapping — route registration for arcade_rhythm game type)
  - 11-03 (DB migration — arcade_rhythm exercise type must be registered in constants)

tech-stack:
  added: []
  patterns:
    - "rAF animation loop: ref.style.transform (not framer-motion) for GPU compositor tile descent"
    - "audioContext.currentTime (not Date.now()) for tap capture timing — carries through from RhythmReadingGame"
    - "scoredRef Set pattern: prevents double-scoring same tile in rAF loop"
    - "tile.isRest guard: ghost tiles pass through hit zone silently without triggering MISS"
    - "hasAutoStartedRef guard: one-time auto-start from trail state on mount"
    - "Ref mirrors for state (livesRef, gamePhaseRef): allow RAF callback and setTimeout closures to read current values"

key-files:
  created:
    - src/components/games/rhythm-games/ArcadeRhythmGame.jsx
    - src/components/games/rhythm-games/ArcadeRhythmGame.test.js
  modified: []

key-decisions:
  - "Test file kept as .js (not .jsx) per plan spec; JSX replaced with React.createElement calls in mocks and renders"
  - "vi.useFakeTimers() added to render tests to prevent post-teardown state update warnings from auto-start useEffect"
  - "calcPatternScore helper removed (unused) — simplified finishPattern uses inline approximation"
  - "startRafLoop signature simplified to drop unused playbackStartTime parameter"

patterns-established:
  - "ArcadeRhythmGame exports GAME_PHASES, INITIAL_LIVES, ON_FIRE_THRESHOLD, SCREEN_TRAVEL_TIME as named exports for testability"
  - "Tile positioning via ref.style.transform = translateY(${yPercent}vh) in rAF — zero React re-renders per frame"
  - "handleNextExercise switch covers all 10 exercise types including arcade_rhythm for same-route reload pattern"

requirements-completed: [ARCR-01, ARCR-02, ARCR-03, ARCR-04, ARCR-05]

duration: 27min
completed: 2026-03-30
---

# Phase 11 Plan 01: ArcadeRhythmGame Summary

**Falling-tile arcade rhythm game with rAF animation, audioContext.currentTime tap scoring, 3-lives system, combo/on-fire mode, and full trail integration**

## Performance

- **Duration:** ~27 min
- **Started:** 2026-03-29T22:59:15Z
- **Completed:** 2026-03-30T02:06:00Z
- **Tasks:** 2 (TDD: RED test file + GREEN component)
- **Files modified:** 2

## Accomplishments
- Created `ArcadeRhythmGame.jsx` (1031 lines) — full falling-tile arcade game with FSM phases, rAF animation loop, and tap scoring
- Duration-coded tile colors (blue=quarter, emerald=half, orange=eighth, violet=whole) descend via `ref.style.transform` in 3-second travel time
- Hit zone tap captures `audioContext.currentTime` (not `Date.now()`), calls `scoreTap()` from shared rhythmScoringUtils
- Ghost tiles (`isRest=true`) silently pass through hit zone without triggering life loss
- Screen shake on MISS (CSS keyframe, skipped when `reducedMotion` enabled)
- On-fire mode at combo 5: orange glow on hit zone line + Flame icon in combo badge
- Complete trail integration: `handleNextExercise` routes all 10 exercise types including `arcade_rhythm` self-reload
- Reuses `CountdownOverlay`, `FloatingFeedback`, `AudioInterruptedOverlay`, `RotatePromptOverlay` unchanged
- 9 unit tests — all pass GREEN after component implementation

## Task Commits

1. **Task 1: Create ArcadeRhythmGame test file (RED)** - `6ad0b9d` (test)
2. **Task 2: Build ArcadeRhythmGame component (GREEN)** - `cce0bd5` (feat)
3. **Fix: Fake timers for test teardown** - `9509fab` (fix)

## Files Created/Modified
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — Full falling-tile arcade rhythm game (1031 lines)
- `src/components/games/rhythm-games/ArcadeRhythmGame.test.js` — 9 unit tests for constants, lives, combo, on-fire, GameOverScreen, VictoryScreen, ghost tiles

## Decisions Made
- Test file kept as `.js` (not `.jsx`) per plan spec — JSX replaced with `React.createElement` in mock factories and render calls
- Added `vi.useFakeTimers()` / `vi.useRealTimers()` in test `beforeEach`/`afterEach` to prevent post-teardown state update errors from the auto-start `useEffect` (fires `setTimeout(() => startGame(), 100)` when `nodeConfig` is present)
- Removed unused `calcPatternScore` helper — `finishPattern` uses inline scoring instead
- `startRafLoop` drops unused `playbackStartTime` parameter (simplification, no behavioral change)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JSX syntax in .js test file caused parse failure**
- **Found during:** Task 1 (test file creation)
- **Issue:** Mock factory functions used JSX syntax (`<div>`, `<button>`) in a `.js` file; Rollup's parser cannot handle JSX without the `.jsx` extension
- **Fix:** Replaced all JSX in mock factories with `React.createElement()` calls; replaced `render(<ArcadeRhythmGame />)` with `render(React.createElement(ArcadeRhythmGame))` throughout
- **Files modified:** `ArcadeRhythmGame.test.js`
- **Verification:** Tests ran and failed RED as expected (component didn't exist yet)
- **Committed in:** `6ad0b9d` (Task 1 RED commit)

**2. [Rule 1 - Bug] Post-teardown state update errors from auto-start timer**
- **Found during:** Task 2 (component builds + tests go GREEN)
- **Issue:** The auto-start `useEffect` schedules `setTimeout(() => startGame(), 100)` when `nodeConfig` is present. The 100ms timer fires after test teardown, causing `window is not defined` errors
- **Fix:** Added `vi.useFakeTimers()` in `beforeEach` and `vi.runOnlyPendingTimers()` + `vi.useRealTimers()` in `afterEach` to drain timers before teardown
- **Files modified:** `ArcadeRhythmGame.test.js`
- **Verification:** 9 tests pass with no unhandled errors
- **Committed in:** `9509fab`

---

**Total deviations:** 2 auto-fixed (2 × Rule 1 bugs)
**Impact on plan:** Both fixes necessary for test execution. No scope creep.

## Issues Encountered
- None beyond the two auto-fixed test file issues above.

## Known Stubs
None — ArcadeRhythmGame is fully wired. The game renders its own tile lane from `RhythmPatternGenerator.getPattern()` live data (not mock data in production). VictoryScreen and GameOverScreen receive real score values.

## Next Phase Readiness
- ArcadeRhythmGame component is complete and testable
- Plan 11-02 needs to register `/rhythm-mode/arcade-rhythm-game` route in `App.jsx` and add `arcade_rhythm` to LANDSCAPE_ROUTES
- Plan 11-03 needs to remap rhythm trail nodes to use `arcade_rhythm` exercise type where appropriate

---
*Phase: 11-arcade-rhythm-game-rhythm-node-remapping*
*Completed: 2026-03-30*
