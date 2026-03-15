---
phase: 01-pre-flight-bug-fixes
plan: 01
subsystem: testing
tags: [vexflow, regex, esm, vitest, react-testing-library, pitch-detection]

# Dependency graph
requires: []
provides:
  - Accidental-aware regex in patternBuilder.js for inferClefForPitch and toVexFlowNote
  - inferClefForPitch exported for direct unit testing
  - ESM .js extensions added to durationConstants.js, rhythmGenerator.js imports
  - SightReadingGame.micRestart.test.jsx passing with AudioContextProvider mock
  - npm run verify:patterns passes without ESM resolution error
  - npm run test:run passes with zero failures
affects: [02-sharps-flats-units, 03-bass-sharps-flats, sight-reading-game]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ESM bare-Node imports require explicit .js extensions — all sight-reading-game imports now use .js"
    - "export function (or export const) on inferClefForPitch enables direct unit testing without test-only coupling"
    - "AudioContextProvider mock for JSX tests: provide all fields destructured by component (requestMic, releaseMic, analyserRef, streamRef, isReady, isInterrupted, micPermission, handleTapToResume, getOrCreateAudioContext)"
    - "react-i18next mock in tests: map known i18n keys to English text for button-role queries"

key-files:
  created:
    - src/components/games/sight-reading-game/utils/patternBuilder.test.js (new test blocks)
  modified:
    - src/components/games/sight-reading-game/utils/patternBuilder.js
    - src/components/games/sight-reading-game/constants/durationConstants.js
    - src/components/games/sight-reading-game/utils/rhythmGenerator.js
    - src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx

key-decisions:
  - "Export inferClefForPitch as named export (not test-only mock) — function is pure and reusable"
  - "Fix all three ESM import chains (durationConstants, rhythmGenerator->durationConstants, rhythmGenerator->rhythmPatterns) to ensure verify:patterns works end-to-end"
  - "Mock react-i18next in micRestart test to translate t('sightReading.startPlaying') -> 'Start Playing' for button role queries"

patterns-established:
  - "Accidental regex pattern: /^([A-G][#b]?)(\\d+)$/ — use in any pitch string parser"
  - "ESM extension rule: bare Node ESM imports must include .js extension; Vite resolves without but Node does not"

requirements-completed: [FIX-02]

# Metrics
duration: 25min
completed: 2026-03-15
---

# Phase 01 Plan 01: Pre-Flight Bug Fixes — Regex and ESM Summary

**Accidental-aware pitch regex ([A-G][#b]?) fixes silent F#4->c/4 fallback in sight reading; ESM .js extensions unblock verify:patterns; micRestart test fixed with full AudioContextProvider mock**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-15T15:04:00Z
- **Completed:** 2026-03-15T15:11:00Z
- **Tasks:** 1 (with TDD RED + GREEN cycle)
- **Files modified:** 4 production + 1 test file

## Accomplishments
- Fixed accidental pitch parsing bug: F#4, Bb3, Eb5 etc. now render as f#/4, bb/3, eb/5 in VexFlow instead of silently falling back to c/4
- Fixed ESM import chain for bare Node execution: durationConstants.js, rhythmGenerator.js (3 imports total)
- Fixed pre-existing SightReadingGame.micRestart.test.jsx failure by adding mocks for AudioContextProvider, react-i18next, and requestMic return value
- All 109 tests pass, npm run verify:patterns completes without error

## Task Commits

TDD task with RED then GREEN commits:

1. **RED — Failing tests for accidental pitch handling** - `f77c998` (test)
2. **GREEN — Fix regex, export, ESM, and micRestart mock** - `ac67c0b` (feat)

## Files Created/Modified
- `src/components/games/sight-reading-game/utils/patternBuilder.js` — Fixed inferClefForPitch and toVexFlowNote regexes from `/^([A-G])(\d+)$/` to `/^([A-G][#b]?)(\d+)$/`; exported inferClefForPitch
- `src/components/games/sight-reading-game/utils/patternBuilder.test.js` — Added 14 new test cases: 7 for inferClefForPitch, 3 for toVexFlowNote via generatePatternData
- `src/components/games/sight-reading-game/constants/durationConstants.js` — Added .js to RhythmPatternGenerator import
- `src/components/games/sight-reading-game/utils/rhythmGenerator.js` — Added .js to durationConstants and rhythmPatterns imports
- `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx` — Added vi.mock for AudioContextProvider (with requestMic returning {analyser, audioContext}), react-i18next (translating key to English), and full context shape

## Decisions Made
- Export `inferClefForPitch` as a named export from patternBuilder.js — it's a pure utility function with no side effects, safe to expose
- Fixed all three ESM import chain links (not just durationConstants.js) to ensure the full verify:patterns chain resolves under bare Node ESM
- Used `react-i18next` mock in micRestart test to translate `sightReading.startPlaying` -> `"Start Playing"` so the test can find buttons by accessible role/name

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed additional ESM imports in rhythmGenerator.js**
- **Found during:** Task 1 (GREEN phase — ESM fix)
- **Issue:** After fixing durationConstants.js, the verify:patterns chain failed at rhythmGenerator.js which also lacked .js extensions on two imports
- **Fix:** Added .js to `../constants/durationConstants` and `./rhythmPatterns` in rhythmGenerator.js
- **Files modified:** `src/components/games/sight-reading-game/utils/rhythmGenerator.js`
- **Verification:** `npm run verify:patterns` completes successfully
- **Committed in:** `ac67c0b` (GREEN commit)

**2. [Rule 3 - Blocking] Extended micRestart mock beyond AudioContextProvider**
- **Found during:** Task 1 (GREEN phase — micRestart fix)
- **Issue:** After adding AudioContextProvider mock, test progressed but failed on: (a) i18n key not translated to "Start Playing", (b) requestMic returning undefined causing startListeningSync to crash
- **Fix:** Added react-i18next mock with key->text mapping; updated requestMic to return `{analyser: null, audioContext: {state:'running', sampleRate:44100}}`
- **Files modified:** `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx`
- **Verification:** micRestart test passes (1/1)
- **Committed in:** `ac67c0b` (GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes were necessary to achieve the stated done criteria. No scope creep — all changes are directly in the affected files.

## Issues Encountered
- rhythmGenerator.js import chain was not mentioned in the plan but was discovered during ESM resolution testing — required the same fix as durationConstants.js
- react-i18next needed mocking to translate button text for testing-library role queries

## Next Phase Readiness
- patternBuilder now correctly handles all accidental note strings (sharps and flats)
- verify:patterns passes — phase gate unblocked
- Full test suite at 109/109 passing
- Ready for Phase 01 Plan 02 (Sharps/Flats trail unit content) or subsequent plans

## Self-Check: PASSED

All files verified present. All commits verified in git history.

---
*Phase: 01-pre-flight-bug-fixes*
*Completed: 2026-03-15*
