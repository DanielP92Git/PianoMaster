---
phase: 13-eslint-cleanup
plan: 01
subsystem: testing
tags: [eslint, vitest, globals, react-refresh, lint]

# Dependency graph
requires: []
provides:
  - ESLint flat config with vitest globals override for test files
  - ESLint flat config with node globals for config files
  - ESLint flat config with process:readonly for src process.env usages
  - ESLint flat config with serviceworker globals for public/sw.js
  - no-unused-vars underscore-prefix ignore patterns
  - 18 react-refresh/only-export-components suppressions with rationale
affects: [13-02-eslint-unused-vars, 13-03-eslint-exhaustive-deps]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ESLint flat config file-scoped overrides for environment-specific globals"
    - "eslint-disable-next-line with -- rationale comment for suppressing HMR-only dev warnings"
    - "Underscore-prefix convention for intentionally unused variables (argsIgnorePattern/varsIgnorePattern/caughtErrorsIgnorePattern)"

key-files:
  created: []
  modified:
    - eslint.config.js
    - src/components/games/notes-master-games/NotesRecognitionGame.jsx
    - src/components/ui/AnimatedAvatar.jsx
    - src/components/ui/Navigation.jsx
    - src/components/ui/Toast.jsx
    - src/contexts/AccessibilityContext.jsx
    - src/contexts/AudioContextProvider.jsx
    - src/contexts/ModalContext.jsx
    - src/contexts/SessionTimeoutContext.jsx
    - src/contexts/SettingsContext.jsx
    - src/contexts/SightReadingSessionContext.jsx
    - src/contexts/SubscriptionContext.jsx
    - src/reducers/rhythmReducer.jsx

key-decisions:
  - "Added node globals to test files in addition to vitest globals — rhythmGenerator.test.js uses require() inside a test case, which is a Node CJS call"
  - "Used eslint-disable-next-line (not block-level) for all react-refresh suppressions to keep lint granular and auditable"

patterns-established:
  - "Co-located context provider + hook is the standard pattern; react-refresh warning on these files is intentionally suppressed"
  - "Co-located reducer + action constants follows Redux convention; same suppression applies"

requirements-completed: [LINT-01, LINT-04]

# Metrics
duration: 18min
completed: 2026-03-20
---

# Phase 13 Plan 01: ESLint Cleanup — Config and Suppressions Summary

**ESLint flat config overrides eliminate 330 no-undef warnings (vitest/node/process globals) and 18 react-refresh warnings (line-level suppressions with rationale), reducing total warnings from 574 to 228**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-20T16:28:39Z
- **Completed:** 2026-03-20T16:46:43Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Added 5 ESLint flat config override blocks: vitest+node globals for test files, node globals for config files, process:readonly for specific src files using process.env.NODE_ENV, serviceworker globals for public/sw.js
- Updated no-unused-vars rule with argsIgnorePattern/varsIgnorePattern/caughtErrorsIgnorePattern for underscore-prefix variables (enables Plan 02)
- Added 18 line-level `eslint-disable-next-line react-refresh/only-export-components` comments with written rationale across 12 files
- Total ESLint warnings reduced from 574 to 228 (183 no-unused-vars + 45 react-hooks/exhaustive-deps)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update ESLint config with test globals, node globals, and unused-vars patterns** - `a3513ce` (chore)
2. **Task 2: Suppress react-refresh/only-export-components warnings with justification** - `5c373d5` (chore)

## Files Created/Modified
- `eslint.config.js` - Added 5 override blocks; updated no-unused-vars rule with pattern config
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` - 1 react-refresh suppression (filterAutoGrowCandidates helper)
- `src/components/ui/AnimatedAvatar.jsx` - 1 react-refresh suppression (ACCESSORY_SLOT_STYLES constant)
- `src/components/ui/Navigation.jsx` - 1 react-refresh suppression (useNavigation hook)
- `src/components/ui/Toast.jsx` - 3 react-refresh suppressions (useToast, showXPGain, showPointsGain)
- `src/contexts/AccessibilityContext.jsx` - 2 react-refresh suppressions (useAccessibility, withAccessibility)
- `src/contexts/AudioContextProvider.jsx` - 1 react-refresh suppression (useAudioContext)
- `src/contexts/ModalContext.jsx` - 1 react-refresh suppression (useModal)
- `src/contexts/SessionTimeoutContext.jsx` - 1 react-refresh suppression (useSessionTimeout)
- `src/contexts/SettingsContext.jsx` - 1 react-refresh suppression (useSettings)
- `src/contexts/SightReadingSessionContext.jsx` - 2 react-refresh suppressions (useSightReadingSession, SIGHT_READING_SESSION_CONSTANTS)
- `src/contexts/SubscriptionContext.jsx` - 1 react-refresh suppression (useSubscription)
- `src/reducers/rhythmReducer.jsx` - 3 react-refresh suppressions (rhythmReducer, useRhythm, useRhythmDispatch)

## Decisions Made
- Added `...globals.node` to the vitest test file override in addition to `...globals.vitest` because `rhythmGenerator.test.js` uses `require()` inside a test case (CJS-style dynamic import) — vitest globals alone don't include `require`
- Used line-level `eslint-disable-next-line` (not block-level `/* eslint-disable */`) per plan to keep suppressions granular and auditable; each includes `--` rationale

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added node globals to test file override**
- **Found during:** Task 1 (ESLint config update)
- **Issue:** After adding vitest globals, 1 remaining `no-undef` warning for `require` in `rhythmGenerator.test.js` line 817 — this test case uses CJS `require()` which is a Node global not included in vitest globals
- **Fix:** Added `...globals.node` alongside `...globals.vitest` in the test files override block
- **Files modified:** `eslint.config.js`
- **Verification:** `npx eslint . 2>&1 | grep -c "no-undef"` returns 0
- **Committed in:** `a3513ce` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing globals)
**Impact on plan:** Necessary addition — vitest globals don't cover Node built-ins used in test cases. No scope creep.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 (no-unused-vars cleanup) can now proceed: underscore-prefix ignore patterns are configured, so Plans 02/03 can use `_varName` convention for intentionally unused parameters
- Plan 03 (exhaustive-deps) can proceed independently
- All test files will lint cleanly without spurious no-undef warnings

## Self-Check: PASSED
- `eslint.config.js` modified: confirmed (git log a3513ce)
- 18 suppression comments: confirmed (`grep -r "eslint-disable-next-line react-refresh" src/ | wc -l` = 18)
- 0 no-undef warnings: confirmed
- 0 react-refresh warnings: confirmed
- Build passes: 3518 modules, built in 1m 2s
- Tests pass: 211/211

---
*Phase: 13-eslint-cleanup*
*Completed: 2026-03-20*
