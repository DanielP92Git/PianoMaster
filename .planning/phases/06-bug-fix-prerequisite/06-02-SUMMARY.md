---
phase: 06-bug-fix-prerequisite
plan: 02
subsystem: ui-components
tags: [react, i18n, a11y, mic, audio, tailwind, ux]

# Dependency graph
requires:
  - "06-01: mic lifecycle sync wrappers (startListeningSync must exist)"
provides:
  - "MicErrorOverlay component: kid-friendly mic error UI with retry/spinner/success/exhausted states"
  - "EN and HE translations for micError namespace"
  - "Old showMicPermissionPrompt removed: replaced by micError state in SightReadingGame"
affects: [07-audio-context-provider, 08-pitch-detection, 09-mic-calibration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Error type discrimination pattern: classify thrown errors by name/message to route to permission_denied vs mic_stopped states"
    - "Retry-with-spinner pattern: async onRetry prop, internal success state with auto-dismiss (1500ms), parent drives error state on failure"
    - "Volume meter recovery confirmation: show audioLevel bar in top-right for 4s post-recovery via volumeMeterTimeoutRef"

key-files:
  created:
    - src/components/games/sight-reading-game/components/MicErrorOverlay.jsx
  modified:
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json

key-decisions:
  - "MicErrorOverlay renders null when errorType is null (zero DOM overhead when not in error state)"
  - "handleMicBack returns to GAME_PHASES.SETUP (not navigate('/')) so all scores and progress are preserved"
  - "pauseTimer() called on mic error fire (handleCountInComplete catch), resumeTimer() called on retry success or back"
  - "MIC_MAX_RETRIES = 3 gives kids a reasonable chance at transient failures before exhausting retries"
  - "Volume meter auto-fades at 4000ms (not 3-5s range — chose 4s as balanced midpoint)"

# Metrics
duration: 5min
completed: 2026-02-17
---

# Phase 06 Plan 02: Bug Fix Prerequisite — MicErrorOverlay Summary

**Kid-friendly mic error overlay with permission_denied vs mic_stopped differentiation, retry spinner, Mic is ready! success state, volume meter recovery confirmation, and exhausted-retries message replacing the old inline mic permission prompt**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-17T16:04:51Z
- **Completed:** 2026-02-17T16:10:04Z
- **Tasks:** 2
- **Files created:** 1, **Files modified:** 3

## Accomplishments

- Created `MicErrorOverlay.jsx` with all visual states per locked decisions: error (permission_denied vs mic_stopped), retrying (spinner), success (green "Mic is ready!" with check icon), exhausted-retries (orange callout, only "Back to Menu")
- Implemented button differentiation: permission_denied shows "Back to Menu" as primary; mic_stopped shows "Try Again" as primary — each with appropriate Tailwind styling
- Added EN and HE i18n translations via `useTranslation("common")` with `micError.*` keys
- Added `role="alertdialog"` and `aria-modal="true"` for accessibility
- Integrated overlay into `SightReadingGame.jsx`: replaced `showMicPermissionPrompt` state with `micError` state, added `isMicRetrying`, `showVolumeMeter`, and `volumeMeterTimeoutRef`
- `handleMicRetry` calls `startListeningSync()`, shows spinner, clears error and shows volume meter on success
- `handleMicBack` returns to `GAME_PHASES.SETUP` preserving all scores and progress
- Game timer (`pauseTimer`/`resumeTimer`) pauses when error fires and resumes on retry success or back
- Volume meter appears in top-right corner after recovery (audioLevel-driven width), auto-dismisses after 4 seconds
- All 30 tests pass, production build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MicErrorOverlay component and add EN/HE translations** - `3428d26` (feat)
2. **Task 2: Integrate MicErrorOverlay into SightReadingGame, remove inline mic prompt** - `9518459` (feat)

## Files Created/Modified

- `src/components/games/sight-reading-game/components/MicErrorOverlay.jsx` — New kid-friendly overlay component (190 lines)
- `src/components/games/sight-reading-game/SightReadingGame.jsx` — Removed old `showMicPermissionPrompt` inline block, added `MicErrorOverlay` import + render, new state variables, `handleMicRetry`, `handleMicBack`, volumeMeterTimeout cleanup
- `src/locales/en/common.json` — Added `micError` namespace (15 keys)
- `src/locales/he/common.json` — Added `micError` namespace with Hebrew translations (15 keys)

## Decisions Made

- `handleMicBack` returns to `GAME_PHASES.SETUP` (not full navigation away): Per the plan, "Back to Menu" should return to the setup phase rather than navigating out, since this is less disruptive and preserves all session data
- Timer pause on error: `pauseTimer()` is called in the `handleCountInComplete` catch block so the game inactivity timer does not expire while the kid reads the error overlay
- `MIC_MAX_RETRIES = 3`: Gives three chances to resolve transient mic issues before showing the exhausted-retries message and disabling the "Try Again" button

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. The `useTranslation("common")` warning in the test output (`NO_I18NEXT_INSTANCE`) is pre-existing and expected in the test environment (i18next is not initialized in vitest).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 06 is now complete: mic lifecycle bugs fixed (Plan 01), kid-friendly error UI built and integrated (Plan 02)
- Phase 07 (AudioContextProvider) can now proceed with confidence that the mic error UX is production-ready
- The `startListeningSync` / `stopListeningSync` pattern from Phase 06-01 is used consistently throughout the new error handling flow

## Self-Check: PASSED

- FOUND: `src/components/games/sight-reading-game/components/MicErrorOverlay.jsx`
- FOUND: `src/locales/en/common.json` (with micError namespace)
- FOUND: `src/locales/he/common.json` (with micError namespace)
- FOUND: commit `3428d26` (Task 1)
- FOUND: commit `9518459` (Task 2)

---
*Phase: 06-bug-fix-prerequisite*
*Completed: 2026-02-17*
