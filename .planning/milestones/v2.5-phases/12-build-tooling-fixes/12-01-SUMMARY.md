---
phase: 12-build-tooling-fixes
plan: 01
subsystem: infra
tags: [esm, vite, node, build-tooling, imports]

# Dependency graph
requires: []
provides:
  - "verify:patterns script exits 0 (was ERR_MODULE_NOT_FOUND)"
  - "keySignatureConfig imports use .js extension across all three consumer files"
affects: [ci, build, pattern-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ESM relative imports require explicit .js extension when run under raw Node (not Vite/Vitest)"

key-files:
  created: []
  modified:
    - src/components/games/sight-reading-game/utils/keySignatureUtils.js
    - src/components/games/sight-reading-game/utils/keySignatureUtils.test.js
    - src/components/games/sight-reading-game/components/KeySignatureSelection.jsx

key-decisions:
  - "Fixed .js extension on all three keySignatureConfig consumers, not just the critical one — ensures any future raw-Node script traversing these imports will also work"

patterns-established:
  - "ESM imports in files touched by scripts/patternVerifier.mjs must use explicit .js extensions"

requirements-completed: [BUILD-01]

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 12 Plan 01: Build Tooling Fixes Summary

**Fixed ERR_MODULE_NOT_FOUND in verify:patterns by adding .js extension to keySignatureConfig imports in three files — script now exits 0, 211 tests pass, build succeeds.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-20T14:00:00Z
- **Completed:** 2026-03-20T14:05:00Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- `npm run verify:patterns` exits 0 (was crashing with `ERR_MODULE_NOT_FOUND`)
- All 211 existing tests pass with no regressions
- Production build succeeds
- Three `keySignatureConfig` consumers now use `.js` extension for full ESM compliance

## Task Commits

Each task was committed atomically:

1. **Task 1: Add .js extension to all keySignatureConfig imports** - `8224848` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/games/sight-reading-game/utils/keySignatureUtils.js` - Critical fix: `from "../constants/keySignatureConfig.js"` — was breaking verify:patterns under raw Node ESM
- `src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` - Consistency fix: same import path updated
- `src/components/games/sight-reading-game/components/KeySignatureSelection.jsx` - Consistency fix: same import path updated

## Decisions Made
Fixed all three consumers even though only `keySignatureUtils.js` was breaking the verifier. The other two (`keySignatureUtils.test.js`, `KeySignatureSelection.jsx`) run under Vite/Vitest which tolerates extensionless imports — but any future raw-Node script traversing these imports would break. Codebase consistency also prevents developer confusion.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `verify:patterns` is now fully green — Phase 12 Plan 02 can proceed
- CI pipeline unblocked: all three checks (verify:patterns, test:run, build) pass

---
*Phase: 12-build-tooling-fixes*
*Completed: 2026-03-20*
