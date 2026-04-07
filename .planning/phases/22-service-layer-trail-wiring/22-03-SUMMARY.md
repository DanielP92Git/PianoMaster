---
phase: 22-service-layer-trail-wiring
plan: "03"
subsystem: ui
tags: [react, rhythm-games, metronome, trail, accessibility, animation]

requires:
  - phase: 22-service-layer-trail-wiring
    provides: "RHYTHM_PULSE constant in constants.js (plan 01)"

provides:
  - "MetronomeTrainer pulseOnly mode: pulsing circle visual, C4 piano sound, 8-beat session, reduced-motion aware"
  - "rhythm_pulse routing in TrailNodeModal navigateToExercise switch"
  - "rhythm_pulse routing in MetronomeTrainer handleNextExercise switch"

affects:
  - "rhythmUnit1Redesigned.js — exercise type rhythm_pulse now routes correctly"
  - "trail system — pulse exercise type fully wired end-to-end"

tech-stack:
  added: []
  patterns:
    - "pulseOnly config flag on nodeConfig: pattern for suppressing notation and switching audio in MetronomeTrainer"
    - "Ref-based circular-dep break: stopContinuousMetronomeRef/evaluatePerformanceRef pattern for functions that would otherwise form a useCallback cycle"
    - "Synthetic pattern construction: pulse mode builds an all-beat pattern array instead of calling getPattern()"

key-files:
  created: []
  modified:
    - "src/components/games/rhythm-games/MetronomeTrainer.jsx"
    - "src/components/trail/TrailNodeModal.jsx"

key-decisions:
  - "Used setTimeout-based beat scheduling (not Web Audio scheduled events) for pulse piano sounds, since playPianoSound() is instant and we only need relative timing per beat"
  - "Broke startContinuousMetronome circular dependency via stopContinuousMetronomeRef and evaluatePerformanceRef — refs updated via useEffect after each function is defined"
  - "Pulse session is 1 exercise (totalExercises: 1) so VictoryScreen triggers after single 8-beat round"
  - "patternInfoRef set immediately in startGame for pulse mode (bypasses startPatternPlaybackWithPattern) so evaluatePerformance can score taps"
  - "Synthetic pulse pattern uses 4 sixteenth-note slots per beat with a 1 at position 0 — compatible with existing scoring logic"

patterns-established:
  - "pulseOnly flag pattern: read from nodeConfig, branch rendering and audio in the same component"
  - "useRef break for circular useCallback: when A depends on B and B depends on A, store B in a ref and sync via useEffect"

requirements-completed: [CURR-05]

duration: 62min
completed: "2026-04-06"
---

# Phase 22 Plan 03: Pulse Exercise Experience Summary

**MetronomeTrainer gains pulseOnly mode — pulsing circle visual with C4 piano beats, no notation, reduced-motion-aware animation, and rhythm_pulse routed in both TrailNodeModal and handleNextExercise**

## Performance

- **Duration:** ~62 min
- **Started:** 2026-04-06T22:42:00Z
- **Completed:** 2026-04-06T23:44:55Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- MetronomeTrainer supports `pulseOnly: true` config flag — reads from `nodeConfig.pulseOnly`, `nodeConfig.beats`, `nodeConfig.pitch`
- Pulsing circle renders in place of MetronomeDisplay when pulseOnly is active; scales 1.0→1.25 with shadow glow on beat (1.0→1.05 with no glow for reducedMotion users)
- Piano C4 plays on each beat via `audioEngine.playPianoSound(0.6, pulsePitch)` scheduled per-beat inside `startContinuousMetronome`
- Session ends automatically after `pulseBeatCount` (default 8) beats, triggering standard evaluation and VictoryScreen
- Pulse mode skips pattern playback phase — goes count-in → user performance directly
- Scoring uses synthetic all-beat pattern (compatible with existing PERFECT/GOOD/MISS evaluatePerformance logic)
- `rhythm_pulse` case added to both TrailNodeModal and MetronomeTrainer handleNextExercise routing tables

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: MetronomeTrainer pulseOnly mode + TrailNodeModal routing** - `6f575f3` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `/c/Development/PianoApp2/src/components/games/rhythm-games/MetronomeTrainer.jsx` — Added pulseOnly mode, pulsing circle JSX, piano C4 beat sound, synthetic pattern, ref-based circular-dep break, rhythm_pulse case in handleNextExercise
- `/c/Development/PianoApp2/src/components/trail/TrailNodeModal.jsx` — Added rhythm_pulse case in navigateToExercise switch routing to /rhythm-mode/metronome-trainer

## Decisions Made

- **Synthetic pattern for scoring:** Instead of loading a pattern via `getPattern()`, pulse mode builds an array of `pulseBeatCount * 4` sixteenth-note slots with a `1` at the start of each beat. This is 100% compatible with `evaluatePerformance()` without any changes to the scoring logic.
- **Ref-based circular dependency break:** `startContinuousMetronome` needed to call `stopContinuousMetronome` and `evaluatePerformance` after the beat sequence ended, but those functions are defined later and would create circular `useCallback` dependencies. Solution: `stopContinuousMetronomeRef` and `evaluatePerformanceRef` are set via `useEffect` after each function is defined, and the pulse beat scheduling uses those refs.
- **1 exercise session in pulse mode:** `totalExercises` is set to 1 (vs 10 for normal mode) so VictoryScreen fires after the single 8-beat round completes — matching D-04 from CONTEXT.md.
- **Tasks 1 and 2 committed together:** Both changes form a single deployable unit — adding routing without the pulseOnly mode would route to broken behavior. Combined commit is still atomic at the PR/feature level.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Resolved circular useCallback dependency between startContinuousMetronome, stopContinuousMetronome, and evaluatePerformance**

- **Found during:** Task 1 (MetronomeTrainer pulseOnly implementation)
- **Issue:** The plan called for `startContinuousMetronome` to call `stopContinuousMetronome()` and `evaluatePerformance()` after the final pulse beat, but those two functions are defined after `startContinuousMetronome` in the file. Including them in its dependency array would create a circular `useCallback` chain.
- **Fix:** Added `stopContinuousMetronomeRef` and `evaluatePerformanceRef` refs initialized to `null`, with `useEffect` hooks after each function definition to keep them current. The pulse beat scheduling calls `stopContinuousMetronomeRef.current()` and `evaluatePerformanceRef.current()` instead of the direct functions.
- **Files modified:** `src/components/games/rhythm-games/MetronomeTrainer.jsx`
- **Committed in:** `6f575f3`

**2. [Rule 2 - Missing Critical] Set patternInfoRef before count-in in pulse mode**

- **Found during:** Task 1 analysis
- **Issue:** `evaluatePerformance()` reads from `patternInfoRef.current` to score taps. In normal mode this is set inside `startPatternPlaybackWithPattern`, which is skipped in pulse mode. Without setting it, `evaluatePerformance` would treat all taps as misses.
- **Fix:** In `startGame`, when `pulseOnly` is true, set `patternInfoRef.current` immediately with the synthetic pattern data (pattern array, startTime, beatDuration) before starting count-in.
- **Files modified:** `src/components/games/rhythm-games/MetronomeTrainer.jsx`
- **Committed in:** `6f575f3`

---

**Total deviations:** 2 auto-fixed (1 bug/circular-dep, 1 missing critical data flow)
**Impact on plan:** Both fixes are required for correct operation. No scope creep.

## Issues Encountered

None beyond the circular dependency and patternInfoRef issues documented above, both of which were anticipated architectural considerations resolved inline.

## Known Stubs

None — pulse mode is fully wired with real piano audio, real beat scheduling, and real scoring.

## Threat Flags

None — client-side UI changes only, no new network endpoints, auth paths, or data access patterns introduced.

## Self-Check: PASSED

- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — FOUND
- `src/components/trail/TrailNodeModal.jsx` — FOUND
- Commit `6f575f3` — FOUND
- `pulseOnly` occurrences in MetronomeTrainer: 11 (>= 5 required) — PASS
- `rhythm_pulse` in MetronomeTrainer: 1 — PASS
- `reducedMotion` in MetronomeTrainer: 3 — PASS
- `playPianoSound` in MetronomeTrainer: 2 — PASS
- `rhythm_pulse` in TrailNodeModal at line 313 — PASS
- `case 'rhythm':` still present in TrailNodeModal — PASS
- `case 'rhythm_tap':` still present in TrailNodeModal — PASS
- vitest: 58 tests passed, 7 files passed — PASS
- npm run build: succeeds — PASS

## Next Phase Readiness

- rhythm_pulse exercise type is fully routed end-to-end
- rhythmUnit1Redesigned.js can now include exercises with `type: 'rhythm_pulse'` and `config: { pulseOnly: true, beats: 8, tempo: 65, pitch: 'C4' }`
- Normal MetronomeTrainer behavior (non-pulse nodes) is completely unchanged

---

_Phase: 22-service-layer-trail-wiring_
_Completed: 2026-04-06_
