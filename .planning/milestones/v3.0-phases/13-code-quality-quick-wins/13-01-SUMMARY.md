---
phase: 13-code-quality-quick-wins
plan: 01
subsystem: api
tags: [refactoring, utilities, testing, deduplication, midi, vitest]

# Dependency graph
requires: []
provides:
  - "Canonical noteNameToMidi in src/utils/noteUtils.js (sharp, flat, case-insensitive)"
  - "calculateStarsFromPercentage exported from skillProgressService.js"
  - "verifyStudentDataAccess sourced from single canonical authorizationUtils.js"
affects:
  [sight-reading-game, notes-master-games, trail-progress, victory-screen]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Utility consolidation: duplicate functions moved to canonical locations with consumers importing from canonical"
    - "TDD: failing test → implementation → all tests green pattern"

key-files:
  created:
    - src/utils/noteUtils.js
    - src/utils/noteUtils.test.js
    - src/services/skillProgressService.test.js
  modified:
    - src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx
    - src/components/games/sight-reading-game/components/KlavierKeyboard.jsx
    - src/services/skillProgressService.js
    - src/hooks/useVictoryState.js
    - src/services/apiDatabase.js

key-decisions:
  - "noteUtils.js uses VexFlowStaffDisplay implementation (not KlavierKeyboard) — only that version handles flat notes"
  - "Cb4 octave fix: Cb4 maps to B3 (MIDI 59), not B4 (MIDI 71) — the plan's flatMap was correct but octave adjustment for CB was missing"
  - "calculateStarsFromPercentage exported without underscore prefix — private underscore pattern dropped, function now public API"
  - "apiDatabase.js callers all use await-only pattern so canonical return value {userId,isOwner,isTeacher} is backward-compatible"

patterns-established:
  - "Utility functions with multiple consumers belong in src/utils/ or the canonical service; consumers import from one place"
  - "Flat note handling requires octave adjustment for Cb (maps to B of prior octave)"

requirements-completed: [QUAL-01, QUAL-02, QUAL-03]

# Metrics
duration: 8min
completed: 2026-03-30
---

# Phase 13 Plan 01: Utility Consolidation Summary

**Three duplicated utility functions (noteNameToMidi, calculateStarsFromPercentage, verifyStudentDataAccess) consolidated to single canonical implementations with 19 unit tests covering all threshold boundaries and edge cases**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-30T22:53:32Z
- **Completed:** 2026-03-30T23:01:00Z
- **Tasks:** 3
- **Files modified:** 8 (3 created, 5 modified)

## Accomplishments

- Created `src/utils/noteUtils.js` with canonical `noteNameToMidi` (sharp + flat + case-insensitive support) and 11 unit tests
- Exported `calculateStarsFromPercentage` from `skillProgressService.js` with 8 threshold boundary unit tests
- Removed 35-line local `verifyStudentDataAccess` duplicate from `apiDatabase.js`, wired to canonical `authorizationUtils.js`
- VexFlowStaffDisplay.jsx and KlavierKeyboard.jsx now import `noteNameToMidi` from the canonical location
- useVictoryState.js now imports `calculateStarsFromPercentage` from skillProgressService

## Task Commits

Each task was committed atomically:

1. **Task 1: Consolidate noteNameToMidi to canonical noteUtils.js (QUAL-01)** - `f17ec30` (feat)
2. **Task 2: Export calculateStarsFromPercentage from skillProgressService (QUAL-02)** - `1bad06b` (feat)
3. **Task 3: Remove verifyStudentDataAccess duplicate from apiDatabase.js (QUAL-03)** - `880923c` (refactor)

_Note: Tasks 1 and 2 used TDD (failing test commit then implementation commit merged into single task commit)_

## Files Created/Modified

- `src/utils/noteUtils.js` - Canonical noteNameToMidi with sharp/flat/case-insensitive support and Cb octave fix
- `src/utils/noteUtils.test.js` - 11 unit tests covering all edge cases
- `src/services/skillProgressService.test.js` - 8 threshold boundary tests for calculateStarsFromPercentage
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` - Removed local NOTE_TO_SEMITONE + noteNameToMidi; added import from noteUtils
- `src/components/games/sight-reading-game/components/KlavierKeyboard.jsx` - Removed local noteNameToMidi; added import from noteUtils; kept NOTE_NAMES for midiToNoteName
- `src/services/skillProgressService.js` - Changed `_calculateStarsFromPercentage` to `export const calculateStarsFromPercentage`
- `src/hooks/useVictoryState.js` - Added import; removed local `calculateStars` function; renamed 2 call sites
- `src/services/apiDatabase.js` - Removed 35-line local function; added import from authorizationUtils

## Decisions Made

- Used VexFlowStaffDisplay's `noteNameToMidi` as canonical (not KlavierKeyboard's) — only it handled flat notes correctly
- Dropped the `_` private prefix from `calculateStarsFromPercentage` to make it a proper public API
- apiDatabase.js callers verified to all use `await`-only pattern (no return value captured), so canonical's `{userId, isOwner, isTeacher}` return is backward-compatible

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Cb octave handling in noteNameToMidi**

- **Found during:** Task 1 (noteNameToMidi implementation)
- **Issue:** Plan's provided implementation mapped Cb4 → B (semitone 11, octave 4) = MIDI 71, but Cb4 is enharmonic to B3 = MIDI 59. The flatMap correctly mapped CB → "B" but didn't decrement the octave.
- **Fix:** Added `if (flatKey === "CB") { octave -= 1; }` after resolving flat to natural note
- **Files modified:** src/utils/noteUtils.js
- **Verification:** `noteNameToMidi("Cb4")` returns 59 (test passes)
- **Committed in:** f17ec30 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in provided implementation)
**Impact on plan:** Bug fix required for correctness. No scope creep. All acceptance criteria met.

## Issues Encountered

- skillProgressService.test.js required mocking supabase and all its transitive dependencies (authorizationUtils, rateLimitService, skillTrail, subscriptionConfig, sentryService) because supabase.js throws on missing env vars at import time. Added vi.mock() stubs to isolate the pure `calculateStarsFromPercentage` function.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three duplicate utility functions eliminated; single source of truth established
- Unit tests provide regression coverage for noteNameToMidi (11 tests) and calculateStarsFromPercentage (8 tests)
- Ready for Plan 02 (dead code removal / lazy loading)

---

_Phase: 13-code-quality-quick-wins_
_Completed: 2026-03-30_
