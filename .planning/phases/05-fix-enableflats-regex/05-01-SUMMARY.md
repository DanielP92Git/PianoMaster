---
phase: 05-fix-enableflats-regex
plan: 01
subsystem: ui
tags: [react, regex, notes-recognition, trail, accidentals, testing]

# Dependency graph
requires:
  - phase: 04-integration-gate-and-i18n
    provides: TrailNodeModal enableFlats derivation, filterAutoGrowCandidates, trail flag propagation
provides:
  - Anchored flat-detection regex /^[A-G]b\d/ in TrailNodeModal
  - Anchored flat-detection regex /[#]|[A-G]b/ in NotesRecognitionGame filterAutoGrowCandidates
  - Anchored flat-detection regex in currentPoolHasAccidentals fallback
  - B3/B4 regression test suite documenting natural note B is not a flat
affects:
  - any future code that adds flat/accidental detection logic

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Anchored flat regex: /^[A-G]b\\d/ — requires note letter prefix before lowercase b, preventing B3/B4 false positive"
    - "Combined accidental regex: /[#]|[A-G]b/ — explicitly separates sharp and flat detection for clarity"

key-files:
  created:
    - src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js (extended with B3/B4 regression and enableFlats derivation tests)
  modified:
    - src/components/trail/TrailNodeModal.jsx
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx

key-decisions:
  - "Anchored regex /^[A-G]b\\d/ used in TrailNodeModal — encodes musical intent: note letter + flat symbol + octave digit"
  - "filterAutoGrowCandidates uses /[#]|[A-G]b/ to separate sharp and flat detection rather than combined /[#b]/"
  - "No shared utility extracted — two files, three lines, each self-contained as specified by plan"

patterns-established:
  - "Flat detection: always use /^[A-G]b\\d/ or /[A-G]b/ — never includes('b') or /[#b]/"

requirements-completed:
  - FIX-01

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 05 Plan 01: Fix enableFlats Regex Summary

**Replaced ambiguous flat-detection regexes with anchored /^[A-G]b\d/ and /[A-G]b/ patterns across TrailNodeModal and NotesRecognitionGame, closing INTG-FLATS-FALSE-POSITIVE and FLOW-FLATS-DISTRACTOR audit items**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T09:39:21Z
- **Completed:** 2026-03-17T09:43:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added 6 new regression tests: B3/B4 natural note cases (2) and enableFlats derivation cases (4)
- Fixed TrailNodeModal enableFlats derivation: `n.includes('b')` → `/^[A-G]b\d/.test(n)`
- Fixed NotesRecognitionGame filterAutoGrowCandidates: `/[#b]/` → `/[#]|[A-G]b/`
- Fixed NotesRecognitionGame currentPoolHasAccidentals fallback: same anchored pattern
- Full 127-test suite green; production build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Add B3/B4 regression tests and enableFlats derivation tests** - `d6310ce` (test)
2. **Task 2: Fix flat-detection regexes in TrailNodeModal and NotesRecognitionGame** - `0ab0e3f` (fix)

**Plan metadata:** (docs commit — created below)

_Note: Task 1 used TDD pattern — tests written first, all passing before production code changed._

## Files Created/Modified
- `src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` - Extended with B3/B4 regression tests and enableFlats derivation describe block
- `src/components/trail/TrailNodeModal.jsx` - enableFlats now uses `/^[A-G]b\d/` anchored regex
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` - filterAutoGrowCandidates and currentPoolHasAccidentals both use `/[#]|[A-G]b/`

## Decisions Made
- No shared utility extracted — two files, three lines, each self-contained (per plan specification)
- Anchored regex `/^[A-G]b\d/` chosen for TrailNodeModal (full anchor form) vs `/[A-G]b/` for filter (mid-string match; pitch is full string so both are equivalent in practice)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three flat-detection sites now use anchored patterns
- B3/B4 regression tests document the intended behavior as a permanent guard
- Closes the v2.2 audit gap closure items INTG-FLATS-FALSE-POSITIVE and FLOW-FLATS-DISTRACTOR
- No further action required for Phase 05

---
*Phase: 05-fix-enableflats-regex*
*Completed: 2026-03-17*
