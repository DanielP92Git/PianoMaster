---
phase: 01-engagement-hud-parity
plan: 01
subsystem: ui
tags: [react, context, vitest, sight-reading, combo, hud]

# Dependency graph
requires: []
provides:
  - "SightReadingSessionContext exposes combo/isOnFire/incrementCombo/resetCombo (session-wide combo state)"
  - "First-ever unit test suite for SightReadingSessionContext (6 combo-lifecycle cases)"
  - "HUD-02 formally documented as deferred in REQUIREMENTS.md"
affects: [01-02, sight-reading-game]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ref+state double-write (comboRef/setCombo, isOnFireRef/setIsOnFire) reused verbatim from NotesRecognitionGame for stale-closure-safe combo mutation"
    - "Session-boundary vs exercise-boundary reset ownership: startSession/resetSession own combo reset; goToNextExercise never touches it (D-05)"

key-files:
  created:
    - src/contexts/SightReadingSessionContext.test.jsx
  modified:
    - src/contexts/SightReadingSessionContext.jsx

key-decisions:
  - "Combo/isOnFire kept as sibling useState/useRef pairs outside the existing state blob, matching NotesRecognitionGame's precedent rather than nesting inside createInitialState()"
  - "ON_FIRE_THRESHOLD=5 defined locally in the context (D-06 — reused verbatim from NotesRecognitionGame's module-level constant)"

patterns-established:
  - "Context-level test harness (Probe component + render/fireEvent) as the template for testing bare context providers with no existing test file precedent"

requirements-completed: [HUD-01]

# Metrics
duration: 6min
completed: 2026-07-09
---

# Phase 01 Plan 01: Session-Wide Combo State Summary

**Session-wide combo/on-fire state added to `SightReadingSessionContext` via the exact ref+state double-write pattern from `NotesRecognitionGame`, with a 6-case RED→GREEN unit test suite (the context's first-ever test file) and formal HUD-02 deferral confirmed in REQUIREMENTS.md.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-09T22:39:25+03:00
- **Completed:** 2026-07-09T22:45:38+03:00
- **Tasks:** 3 completed
- **Files modified:** 2 (1 created, 1 modified) + 0 (REQUIREMENTS.md already correct, no edit needed)

## Accomplishments

- `SightReadingSessionContext` now owns `combo`/`isOnFire` state and `incrementCombo`/`resetCombo` callbacks, all exposed via the memoized context value
- On-fire flips to `true` exactly at `combo === ON_FIRE_THRESHOLD (5)` and clears on `resetCombo()`
- Combo is session-wide: `startSession()`/`resetSession()` reset it to 0; `goToNextExercise()` leaves it untouched (D-05), verified by a dedicated test case
- First-ever unit test file for this context (`SightReadingSessionContext.test.jsx`), following full TDD RED→GREEN gates
- HUD-02 deferral confirmed already fully formalized in `.planning/REQUIREMENTS.md` (struck-through bullet, DEFERRED marker with D-01 rationale, traceability row, coverage count) — no changes needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the combo lifecycle unit test (RED)** - `f2c5c1bc` (test)
2. **Task 2: Implement session-wide combo state in the context (GREEN)** - `e74abe62` (feat)
3. **Task 3: Formalize HUD-02 deferral in REQUIREMENTS.md** - no commit (already satisfied by prior commit `77207a9e`, verified only)

**Plan metadata:** (pending — see final commit below)

_TDD gate sequence confirmed: RED (`f2c5c1bc`, all 6 tests failing on unimplemented combo/isOnFire) → GREEN (`e74abe62`, all 6 tests passing). No REFACTOR commit needed — implementation matched the RED spec on first pass._

## Files Created/Modified

- `src/contexts/SightReadingSessionContext.test.jsx` - New Probe-harness test file; 6 cases covering initial state, increment, on-fire threshold, resetCombo, session-boundary reset, and goToNextExercise persistence
- `src/contexts/SightReadingSessionContext.jsx` - Added `ON_FIRE_THRESHOLD` constant, `combo`/`isOnFire` state+refs, `incrementCombo`/`resetCombo` callbacks, combo reset wired into `startSession`/`resetSession`, and all four new values/callbacks added to the memoized context value + its dependency array

## Decisions Made

- Combo/isOnFire modeled as sibling `useState`/`useRef` pairs (not nested inside the existing `state` blob) — matches `NotesRecognitionGame`'s precedent and keeps the ref+state double-write pattern isolated from the exercise-results reducer logic.
- `ON_FIRE_THRESHOLD = 5` defined as a local module-level constant in the context file (D-06 — value reused verbatim, not imported, since `NotesRecognitionGame` doesn't export it).

## Deviations from Plan

None - plan executed exactly as written. Task 3 required no file changes because the HUD-02 deferral was already fully formalized during the Phase 01 context-gathering step (commit `77207a9e`); all four acceptance-criteria greps were verified against the current file with no edits needed, per the plan's own "if already present, make no functional change" instruction.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `SightReadingSessionContext` is ready for Plan 02 to wire `combo`/`isOnFire`/`incrementCombo`/`resetCombo` into `SightReadingGame.jsx`'s render sites and event handlers (per `01-PATTERNS.md`'s `SightReadingGame.jsx` section: `handleNoteDetected` correct-branch calls `incrementCombo()`, the RAF miss-detection branch in `schedulePerformanceTimeline` calls `resetCombo()`, and the header renders `OnFireBadge`/`ComboPill`).
- No blockers. Full existing test suite (1971 tests, 88/90 files, 2 intentionally skipped) remains green after this change — additive context shape, no consumer breakage.

---

_Phase: 01-engagement-hud-parity_
_Completed: 2026-07-09_

## Self-Check: PASSED

All created files and commits verified present:

- FOUND: src/contexts/SightReadingSessionContext.test.jsx
- FOUND: src/contexts/SightReadingSessionContext.jsx
- FOUND: .planning/phases/01-engagement-hud-parity/01-01-SUMMARY.md
- FOUND: f2c5c1bc (test commit)
- FOUND: e74abe62 (feat commit)
