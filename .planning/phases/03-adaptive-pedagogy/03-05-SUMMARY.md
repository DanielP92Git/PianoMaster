---
phase: 03-adaptive-pedagogy
plan: 05
subsystem: games
tags: [react, sight-reading, adaptive-difficulty, vitest, framer-motion]

# Dependency graph
requires:
  - phase: 03-adaptive-pedagogy (Plan 01)
    provides: ADAPTIVE_TIERS ladder + computeNextTier/applyTierToSettings pure engine functions
  - phase: 03-adaptive-pedagogy (Plan 03)
    provides: LevelUpCue.jsx presentation component (show-prop driven, escalation-only)
  - phase: 03-adaptive-pedagogy (Plan 04)
    provides: successStreak/adaptiveTierIndex ref-mirrored session state, loadExercisePattern(overrideSettings) seam, nodeSupersetNotesRef
provides:
  - "Boundary-level adaptive difficulty: handleNextExercise classifies each finished exercise, drives the success streak, computes the next tier, and generates the NEXT pattern from tier-adapted settings"
  - "baseAdaptiveSettingsRef pristine-baseline pattern: tier tempo/notes always computed as an absolute offset from the settings captured once at true session start (startGame's `!currentPattern` guard), never compounding"
  - "LevelUpCue wired to a real trigger (triggerLevelUpCue on didEscalate only); easing renders nothing"
  - "Stale-closure (N+1 not N+2) regression test + escalate/ease behavior coverage"
  - "Timing-window coverage at the 1.25x adaptive tempo extreme in both TEST and PRACTICE grading modes"
affects: [03-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pristine-baseline ref captured once at true session start (guarded by `!currentPattern` inside startGame) so mid-session gear-icon settings changes cannot reset the adaptive tier's reference point — tier offsets never compound"
    - "Explicit override-settings arg to loadExercisePattern at the exercise boundary defeats the stale-closure trap that would otherwise delay a computed tier by one extra exercise"

key-files:
  created:
    - src/components/games/sight-reading-game/__tests__/SightReadingGame.adaptive.test.jsx
  modified:
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx
    - src/components/games/sight-reading-game/SightReadingGame.replay.test.jsx
    - src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js

key-decisions:
  - "baseAdaptiveSettingsRef is captured inside startGame, guarded by `!currentPattern` (true only at real session start — trail auto-start, iOS gesture-gated trail auto-start, and the free-play SETUP screen all reach startGame with no pattern yet generated). Mid-session gear-icon settings changes (openSettingsModal -> handleApplySettings/handleCancelSettings) also call startGame, but by then currentPattern is already set, so they correctly do NOT reset the adaptive baseline."
  - "Task 1's plumbing (tier computation/application) and Task 2's LevelUpCue trigger wiring were implemented together in one edit pass in SightReadingGame.jsx, since didEscalate's branch needed triggerLevelUpCue already defined — committed as part of Task 1's commit. Task 2's own commit adds the dedicated stale-closure/escalate/ease regression test file, per the plan's task split."
  - "exerciseAccuracy binds to summaryStats.pitchAccuracy (falls back to overallScore), matching the plan's interface note and the same value the feedback panel already displays."

patterns-established:
  - "Ref-mirrored mock context objects that other SightReadingGame.*.test.jsx files build for SightReadingSessionContext must include the successStreakRef/adaptiveTierIndexRef/setSuccessStreak/setAdaptiveTierIndex fields now that handleNextExercise reads them synchronously — any future full-mock test of this context needs the same shape."

requirements-completed: [ADAPT-01, ADAPT-02]

# Metrics
duration: 25min
completed: 2026-07-12
---

# Phase 03 Plan 05: Adaptive Boundary Wiring Summary

**handleNextExercise now classifies each finished exercise, drives the adaptive streak, computes the next difficulty tier from the Plan 01 engine, and generates the next pattern from tier-adapted settings passed explicitly (defeating the stale closure) — escalation shows LevelUpCue, easing is silent, and the tier lands at exercise N+1 not N+2 (regression-tested).**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-12T11:10:42+03:00
- **Tasks:** 3 completed
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- `handleNextExercise` in `SightReadingGame.jsx` now: derives `missedCount` from the finished exercise's `performanceResults`, derives `exerciseAccuracy` from `summaryStats.pitchAccuracy`, classifies success (`>= SUCCESS_ACCURACY` and `<= SUCCESS_MAX_MISSES`), updates the ref-mirrored `successStreak`, calls `computeNextTier`, applies the result via `applyTierToSettings` against a **pristine baseline** (`baseAdaptiveSettingsRef`), and calls `loadExercisePattern(adaptedSettings)` with the adapted settings passed explicitly — so the NEXT exercise's pattern is generated from the just-computed tier, not a stale closure of `gameSettings`.
- `baseAdaptiveSettingsRef` is captured exactly once, inside `startGame`, guarded by `!currentPattern` (true only at genuine session start — trail auto-start, the iOS gesture-gated trail auto-start path, and the free-play SETUP screen). Mid-session settings changes via the in-game gear icon do not reset it, so tier tempo/note offsets are always computed from the same reference point (never compounding), matching D-06/Pitfall 5.
- `LevelUpCue` is rendered at HUD root with a `triggerLevelUpCue()` transient-show pattern (mirrors the on-fire splash convention: `setShowLevelUpCue(true)` + 1500ms auto-hide), fired only from the `didEscalate` branch — easing has no render path (D-12).
- New `SightReadingGame.adaptive.test.jsx` regression suite: (1) the headline STALE-CLOSURE GUARD test proves two consecutive successes escalate the tier and the escalated tempo (92 = base 80 + tier-1's +12 BPM) lands on the pattern-generation call for exercise 3 (index 2), not exercise 4 (index 3, the pre-fix bug shape); (2) an ESCALATE test asserts `LevelUpCue`'s localized copy renders on the escalating transition; (3) an EASE test drives a genuine 3-note run-of-misses exercise via the real timeline miss-recording loop (no mocked miss injection) and asserts the tier eases down (68 = base 80 + tier(-1)'s -12 BPM) with no cue shown.
- Extended `useTimingAnalysis.test.js` with two new tests at the top of the D-06 adaptive tempo envelope (base 80 -> 100 BPM, `BASE_TEMPO_CLAMP_MAX_FRACTION` = 1.25) using eighth-note (300ms) durations short enough that the duration-fraction clamp binds ahead of the raw tolerance constants in both grading modes (Pitfall 5) — both TEST and PRACTICE stay positive/non-degenerate, and PRACTICE stays strictly wider than TEST at this escalated tempo.

## Task Commits

Each task was committed atomically:

1. **Task 1: Compute + apply the adaptive tier at the exercise boundary** (+ Task 2's LevelUpCue trigger wiring, bundled — see Decisions) - `82b42232` (feat)
2. **Task 2: Adaptive regression test (stale-closure + escalate/ease)** - `89ef3200` (test)
3. **Task 3: Timing-window coverage at the tempo extremes (Pitfall 5)** - `0896cd5c` (test)

_Plan metadata commit intentionally omitted — worktree mode excludes STATE.md/ROADMAP.md from this agent's commits; orchestrator handles the metadata commit centrally after wave merge._

## Files Created/Modified

- `src/components/games/sight-reading-game/SightReadingGame.jsx` - Imports `computeNextTier`/`applyTierToSettings`/`ADAPTIVE_TIERS`/`SUCCESS_ACCURACY`/`SUCCESS_MAX_MISSES`/`LevelUpCue`; adds `baseAdaptiveSettingsRef`, `showLevelUpCue`/`triggerLevelUpCue`; rewires `handleNextExercise` to classify/stream/tier/apply/generate; captures the pristine baseline in `startGame`; renders `<LevelUpCue show={showLevelUpCue} />` at HUD root.
- `src/components/games/sight-reading-game/__tests__/SightReadingGame.adaptive.test.jsx` - New: stale-closure guard, escalate, and ease regression tests against real component behavior (mocked context/audio/mic infra, real timeline miss-recording logic).
- `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx` - Added `successStreakRef`/`adaptiveTierIndexRef`/`setSuccessStreak`/`setAdaptiveTierIndex` to the mocked `SightReadingSessionContext` (Rule 1 fix — see Deviations).
- `src/components/games/sight-reading-game/SightReadingGame.replay.test.jsx` - Same mock fix as above (Rule 1 fix).
- `src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js` - Added a `twoNotePattern` helper and two tests covering TEST/PRACTICE timing windows at the 1.25x tempo extreme.

## Decisions Made

- `baseAdaptiveSettingsRef` capture point: inside `startGame`, guarded by `!currentPattern`, rather than duplicating the capture at each of the three call sites that reach `startGame` with fresh settings (trail auto-configure effect, iOS gesture-gated auto-start, free-play SETUP screen). This uniformly captures the baseline exactly once per session and correctly excludes mid-session gear-icon settings changes (which call `startGame` with `currentPattern` already set).
- Task 1 and Task 2's `SightReadingGame.jsx` wiring were done together in one edit pass since `didEscalate`'s branch in Task 1 needed `triggerLevelUpCue` already defined (the plan itself notes this coupling: "define the trigger in Task 2"). Committed as part of Task 1's commit; Task 2's own commit adds the dedicated regression test file.
- `exerciseAccuracy` binds to `summaryStats.pitchAccuracy` (falling back to `overallScore`), matching the plan's interface note and reusing the same value already shown on the feedback panel — no new accuracy computation introduced.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated two existing full-mock tests' `SightReadingSessionContext` shape**

- **Found during:** Task 1 (post-edit regression run of the full sight-reading suite)
- **Issue:** `SightReadingGame.combo.test.jsx` and `SightReadingGame.replay.test.jsx` both fully mock `useSightReadingSession` (real React state for `combo`/`gradingMode`, etc.) but didn't include the `successStreakRef`/`adaptiveTierIndexRef`/`setSuccessStreak`/`setAdaptiveTierIndex` fields Plan 04 added to the real context. `handleNextExercise` now reads `successStreakRef.current` synchronously, which crashed with `Cannot read properties of undefined (reading 'current')` in both files' click-through-to-next-exercise flows.
- **Fix:** Added the same ref-mirror pattern (`useRef(0)` + a `useCallback` setter that writes the ref) used by the real context, in both mock factories.
- **Files modified:** `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx`, `src/components/games/sight-reading-game/SightReadingGame.replay.test.jsx`
- **Verification:** Full `src/components/games/sight-reading-game` suite green (18 files, 197 tests) after the fix.
- **Committed in:** `82b42232` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug fix, 2 files touched)
**Impact on plan:** Necessary to keep pre-existing tests passing after Task 1's required consumption of the Plan 04 context fields. No scope creep — no behavior changed in the mocks beyond adding the missing fields.

## Issues Encountered

None beyond the mock-shape fix documented above.

## User Setup Required

None - no external service configuration required. This plan is pure client-side logic with no I/O (per the plan's own threat model: "no new user-input parsing, persistence, or network path").

## Next Phase Readiness

- Boundary-level adaptive difficulty (tier computation, tempo/note/rest adaptation, escalation cue) is fully wired and regression-tested. Plan 03-06 (adaptive tempo, if scoped as its own increment) or any downstream per-note-mastery persistence plan can build on `handleNextExercise`'s classification logic and `nodeSupersetNotesRef`/`baseAdaptiveSettingsRef` without re-deriving them.
- `buildWeightedNotePool`'s `masteryMap` consumer (Plan 01, D-08/D-10 persisted per-node mastery) remains unwired to a real data source — still out of scope for this plan, belongs to a DB-touching plan later in this phase (per Plan 01's own note).
- Full `src/components/games/sight-reading-game` suite (18 files, 197 tests) and `src/contexts/SightReadingSessionContext.test.jsx` (6 tests) green — no regression from this plan's changes.
- No blockers.

---

_Phase: 03-adaptive-pedagogy_
_Completed: 2026-07-12_

## Self-Check: PASSED

- FOUND: src/components/games/sight-reading-game/**tests**/SightReadingGame.adaptive.test.jsx
- FOUND: .planning/phases/03-adaptive-pedagogy/03-05-SUMMARY.md
- FOUND commit: 82b42232 (feat: wire adaptive tier computation at exercise boundary)
- FOUND commit: 89ef3200 (test: regression-guard stale-closure escalation + ease behavior)
- FOUND commit: 0896cd5c (test: cover timing windows at the 1.25x tempo extreme)
