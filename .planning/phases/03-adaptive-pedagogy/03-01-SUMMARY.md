---
phase: 03-adaptive-pedagogy
plan: 01
subsystem: games
tags: [pure-functions, vitest, tdd, sight-reading, adaptive-difficulty]

# Dependency graph
requires: []
provides:
  - ADAPTIVE_TIERS 5-tier symmetric ladder + tuning constants (adaptiveTiers.js)
  - computeNextTier, applyTierToSettings, buildWeightedNotePool pure functions (adaptiveEngine.js)
affects: [03-02, 03-05, 03-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Config-in/config-out pure-function engine module (mirrors patternBuilder.js discipline)"
    - "Module-level flat-array-of-objects tier ladder (mirrors NotesRecognitionGame COMBO_TIERS)"

key-files:
  created:
    - src/components/games/sight-reading-game/constants/adaptiveTiers.js
    - src/components/games/sight-reading-game/utils/adaptiveEngine.js
    - src/components/games/sight-reading-game/utils/adaptiveEngine.test.js
  modified: []

key-decisions:
  - "Rests toggle targets rhythmSettings.allowRests (confirmed boolean field in patternBuilder.js/generatePatternData), not a probability field"
  - "computeNextTier easing check runs before escalation check so a tie (both conditions true) always eases, per D-03/plan spec"

patterns-established:
  - "Adaptive engine functions live under sight-reading-game/utils/ and import only sight-reading-game/constants/ (no React, no npm deps) — future ADAPT wiring plans (03-05/03-06) mutate gameSettings using these functions rather than embedding tuning logic in SightReadingGame.jsx"

requirements-completed: [ADAPT-01, ADAPT-02]

# Metrics
duration: 20min
completed: 2026-07-12
---

# Phase 03 Plan 01: Adaptive Engine Core Summary

**Pure-logic adaptive difficulty engine — 5-tier symmetric ladder constants plus three side-effect-free functions (computeNextTier, applyTierToSettings, buildWeightedNotePool), unit-tested with 22 passing tests covering clamp extremes, easing/escalation precedence, and cold-start weak-note targeting.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-12T07:48:00Z
- **Tasks:** 2 completed (Task 2 is a TDD task with test + feat commits)
- **Files modified:** 3 (all new)

## Accomplishments

- `ADAPTIVE_TIERS` 5-tier symmetric ladder (index -2..2, baseline at 0) plus all tuning constants (tempo clamp fractions, escalate/ease thresholds, weak-note targeting thresholds) authored per the CONTEXT.md envelopes (D-03, D-05, D-06, D-11)
- `computeNextTier` implements easing-takes-precedence-over-escalation per exercise-boundary semantics (D-04), clamped to the tier ladder bounds, with `didEscalate` correctly false at the ceiling (no phantom escalation cue)
- `applyTierToSettings` clamps tempo to 0.75x-1.25x of the node's base tempo, widens `selectedNotes` into a supplied superset only when the tier calls for it (deduped, order-stable), toggles `rhythmSettings.allowRests` per tier (or leaves it untouched when the tier says "no opinion"), and never mutates its input
- `buildWeightedNotePool` duplicates historically-weak pitches (enough attempts + below-threshold accuracy) by a fixed weight and degrades cleanly to the unweighted base pool on cold start (no prior data, or too few attempts)
- Full TDD RED→GREEN cycle: 22 tests written first and confirmed failing (module didn't exist), then implementation written to pass all 22

## Task Commits

Each task was committed atomically:

1. **Task 1: Define the adaptive tier ladder + tuning constants** - `1d37675e` (feat)
2. **Task 2: Implement + unit-test the three pure engine functions**
   - RED: `ea9892a2` (test) - 22 failing tests (module not yet implemented)
   - GREEN: `805d7ae7` (feat) - implementation, all 22 tests passing

_Note: Task 2 is a TDD task; no REFACTOR commit was needed — GREEN implementation required no cleanup pass._

## Files Created/Modified

- `src/components/games/sight-reading-game/constants/adaptiveTiers.js` - 5-tier ladder + all tuning constants (tempo clamp fractions, escalate/ease thresholds, weak-note targeting thresholds), zero imports
- `src/components/games/sight-reading-game/utils/adaptiveEngine.js` - `computeNextTier`, `applyTierToSettings`, `buildWeightedNotePool`; imports only `../constants/adaptiveTiers`
- `src/components/games/sight-reading-game/utils/adaptiveEngine.test.js` - 22 unit tests covering all `<behavior>` bullets from the plan, incl. clamp extremes, easing/escalation tie-break, mutation safety, and cold-start fallback

## Decisions Made

- Confirmed `rhythmSettings.allowRests` (a plain boolean, read directly by `patternBuilder.js`'s `generatePatternData`) as the rest-toggle target — no probability field exists on this object, so the plan's "match whatever rhythmSettings already carries" instruction resolved cleanly with no no-op fallback needed.
- `computeNextTier`'s easing branch is checked first (`missRunInLastExercise >= EASE_MISS_RUN`) and returns immediately, guaranteeing the plan's required tie-break behavior (easing wins) without needing a separate tie-detection branch.

## Deviations from Plan

None - plan executed exactly as written. The plan's own note that Task 1 verifies via grep (since `adaptiveEngine.test.js` doesn't exist yet when Task 1 runs) was followed as specified.

## Issues Encountered

The worktree branch (`worktree-agent-a02ab41ef4b493aa6`) was found based on a stale commit (`4e6a5466`, far behind the plan's expected base `9f73e75c`) at the start of execution, with one unrelated dirty file (`.claude/settings.local.json`, local IDE settings unrelated to this plan). Per the mandatory pre-execution HEAD safety check, the dirty file was stashed, the branch was reset to the correct base commit, and the stash was popped back — restoring the local-settings diff without discarding any tracked work (there was none to lose; no plan-related commits existed on the stale base). This was a worktree provisioning issue, not a plan-execution issue, and is unrelated to the two tasks above.

## User Setup Required

None - no external service configuration required. This plan is pure client-side logic with no I/O.

## Next Phase Readiness

- `adaptiveEngine.js`'s three pure functions are ready for wiring into `SightReadingGame.jsx` / `SightReadingSessionContext.jsx` in later plans (03-02 session-state wiring, 03-05/03-06 gameSettings mutation at exercise boundaries) per D-01/D-04/D-07's "wiring plans never embed tuning logic" architecture.
- No blockers. `buildWeightedNotePool`'s `masteryMap` consumer (D-08/D-10 persisted per-node mastery) is not yet wired to a real data source — that is explicitly out of scope for this plan and belongs to the DB-touching plans later in this phase.

---

_Phase: 03-adaptive-pedagogy_
_Completed: 2026-07-12_

## Self-Check: PASSED

- FOUND: src/components/games/sight-reading-game/constants/adaptiveTiers.js
- FOUND: src/components/games/sight-reading-game/utils/adaptiveEngine.js
- FOUND: src/components/games/sight-reading-game/utils/adaptiveEngine.test.js
- FOUND commit: 1d37675e (feat: adaptive tier ladder + tuning constants)
- FOUND commit: ea9892a2 (test: RED - failing adaptive engine tests)
- FOUND commit: 805d7ae7 (feat: GREEN - adaptive engine implementation)
