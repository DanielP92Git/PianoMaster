---
phase: 06-bug-fix-prerequisite
plan: 01
subsystem: testing
tags: [react, vitest, testing-library, mic, audio, react-router]

# Dependency graph
requires: []
provides:
  - "SightReadingGame.micRestart.test.jsx passing: Router context fixed, mic restart regression covered"
  - "Synchronous micIsListeningRef maintenance via startListeningSync/stopListeningSync wrappers"
  - "replayPattern() resets micEarlyWindowStartRequestedRef so second Try Again triggers startListening"
affects: [07-audio-context-provider, 08-pitch-detection, 09-mic-calibration, 10-performance-profiling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sync ref wrapper pattern: wrap async functions with immediate ref update to eliminate async state race windows"
    - "MemoryRouter + useLocation mock in vitest for React Router v7 component tests"

key-files:
  created: []
  modified:
    - src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx
    - src/components/games/sight-reading-game/SightReadingGame.jsx

key-decisions:
  - "Use sync wrappers (startListeningSync/stopListeningSync) rather than useEffect to keep micIsListeningRef current — eliminates render-cycle delay in phase-enforcement guard"
  - "Mock useLocation in addition to MemoryRouter wrapper to prevent trail auto-start logic from firing in tests"
  - "Reset micEarlyWindowStartRequestedRef in replayPattern() as an early reset (beginPerformanceWithPattern authoritative reset still present) to prevent stale flag on Try Again"

patterns-established:
  - "Sync wrapper pattern: const startListeningSync = useCallback(async () => { ref.current = true; try { await fn(); } catch (e) { ref.current = false; throw e; } }, [fn])"
  - "Test Router wrapping: import MemoryRouter and mock useLocation to prevent Router context crash and trail auto-start"

requirements-completed:
  - FIX-01
  - FIX-02

# Metrics
duration: 6min
completed: 2026-02-17
---

# Phase 06 Plan 01: Bug Fix Prerequisite — Mic Lifecycle Summary

**Mic restart regression fixed with sync ref wrappers eliminating the isListening race window, and MemoryRouter wrapper unblocking the previously-crashing test**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-17T15:56:20Z
- **Completed:** 2026-02-17T16:02:27Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed SightReadingGame.micRestart.test.jsx crash caused by missing Router context (MemoryRouter wrapper + useLocation mock)
- Fixed runtime mic-restart bug: replayPattern() now resets micEarlyWindowStartRequestedRef.current so the second "Try Again" correctly triggers startListening()
- Replaced async isListening state reads with synchronous micIsListeningRef.current reads in the phase-enforcement effect, closing the render-cycle race window
- Added startListeningSync/stopListeningSync wrappers that update micIsListeningRef at call time — used at all 5 call sites (handleCountInComplete, early-window RAF, mic permission retry button, PreGameSetup micStatus, unmount cleanup)
- All 30 tests pass across 4 test files with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix test infrastructure and runtime mic-restart bug** - `f31869f` (fix)
2. **Task 2: Replace async isListening reads with synchronous ref reads in phase-enforcement effect** - `852ae37` (fix)

## Files Created/Modified
- `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx` - Added MemoryRouter import, useLocation mock, and MemoryRouter wrapper around render call
- `src/components/games/sight-reading-game/SightReadingGame.jsx` - Added startListeningSync/stopListeningSync wrappers, updated phase-enforcement effect to use micIsListeningRef.current, added micEarlyWindowStartRequestedRef reset in replayPattern(), updated all call sites

## Decisions Made
- Sync wrappers chosen over continued useEffect sync: the useEffect approach delayed ref updates by one render cycle, creating a window where the phase-enforcement guard would read stale state. The wrapper approach eliminates this delay at no architectural cost.
- useLocation mock required in addition to MemoryRouter: without mocking useLocation, the component reads location.state?.nodeId which would try to trigger trail auto-start logic, creating interference. The mock returns `{ state: null, pathname: "/" }` to prevent this.
- stopListeningRef updated to hold stopListeningSync (not raw stopListening): ensures abortPerformanceForPenalty (which reads stopListeningRef.current) also updates micIsListeningRef when it stops the mic.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - both bugs were straightforward fixes with clear root causes documented in the research phase.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Test suite is green and provides a regression baseline for all subsequent v1.7 phases
- mic lifecycle is race-condition-free: phase-enforcement reads synchronous state, all call sites use sync wrappers
- Phase 06-02 can now proceed with confidence that the mic test infrastructure is reliable

---
*Phase: 06-bug-fix-prerequisite*
*Completed: 2026-02-17*
