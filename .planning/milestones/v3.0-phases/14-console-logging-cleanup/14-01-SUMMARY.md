---
phase: 14-console-logging-cleanup
plan: 01
subsystem: infra
tags: [eslint, console-logging, code-quality, debug-flags, import.meta.env]

# Dependency graph
requires: []
provides:
  - Zero unguarded console.log/debug calls in src/ (grep audit passes)
  - ESLint no-console rule in eslint.config.js preventing regression
  - All debug boolean flags upgraded to import.meta.env.DEV for tree-shaking
affects: [all future plans that add console logging]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DEV-gate pattern: if (import.meta.env.DEV) { console.debug(...); } // eslint-disable-line no-console"
    - "Boolean debug flag pattern: const FLAG = import.meta.env.DEV; (tree-shakeable in production)"

key-files:
  created: []
  modified:
    - eslint.config.js
    - src/components/games/sight-reading-game/hooks/useRhythmPlayback.js
    - src/components/games/sight-reading-game/SightReadingGame.jsx
    - src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx
    - src/components/games/sight-reading-game/utils/patternBuilder.js
    - src/features/games/hooks/useGameTimer.js
    - src/hooks/useAudioEngine.js
    - src/hooks/useVictoryState.js
    - src/services/audioCacheService.js
    - src/services/apiAuth.js
    - src/services/consentService.js
    - src/contexts/SubscriptionContext.jsx
    - src/utils/pwa.js

key-decisions:
  - "eslint-disable-line no-console placed inline (same line as console call) not on preceding line — enables grep audit to work correctly"
  - "no-console severity is warn (not error) so husky pre-commit does not block legitimate DEV-gated logs"
  - "Bucket C calls (VictoryScreen breadcrumbs, pwa.js fallback log) deleted entirely — no ongoing dev value"
  - "Bucket A boolean debug flags upgraded to import.meta.env.DEV for Vite tree-shaking in production"

patterns-established:
  - "DEV guard inline: if (import.meta.env.DEV) { console.debug(...); } // eslint-disable-line no-console"
  - "Boolean flag: const DEBUG = import.meta.env.DEV; (enables tree-shaking, not just runtime gating)"

requirements-completed: [QUAL-06]

# Metrics
duration: 13min
completed: 2026-03-31
---

# Phase 14 Plan 01: Console Logging Cleanup Summary

**24 unguarded console.log/debug calls eliminated from src/ via DEV flag upgrades, inline DEV guards, deletions, and ESLint no-console rule enforcement**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-31T17:16:07Z
- **Completed:** 2026-03-31T17:28:40Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Grep audit returns 0: zero unguarded console.log/debug calls remain in src/
- ESLint no-console rule active in eslint.config.js (severity warn, allows warn/error/info)
- All debug boolean flags upgraded from hardcoded `true`/`false` to `import.meta.env.DEV` for proper Vite tree-shaking
- 4 stale console.log calls deleted entirely (3 VictoryScreen nav breadcrumbs + 1 pwa.js reload log)
- All 608 vitest tests pass with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove or DEV-gate all 24 unguarded console.log/debug calls** - `43946cf` (fix)
2. **Task 2: Add ESLint no-console rule for regression prevention** - `077586f` (chore)

**Plan metadata:** (created in final commit)

## Files Created/Modified

- `eslint.config.js` - Added `"no-console": ["warn", { allow: ["warn", "error", "info"] }]` rule
- `src/components/games/sight-reading-game/hooks/useRhythmPlayback.js` - RHYTHM_DEBUG flag → import.meta.env.DEV; eslint-disable-line added
- `src/components/games/sight-reading-game/SightReadingGame.jsx` - AUDIO_OUTPUT_LATENCY_COMP_DEBUG flag → import.meta.env.DEV; 5 NoteDetection calls DEV-gated; eslint-disable-line on logMetronomeTiming and ScoreSyncStatus calls
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` - 4 console.debug calls wrapped with if (import.meta.env.DEV) + eslint-disable-line
- `src/components/games/sight-reading-game/utils/patternBuilder.js` - eslint-disable-line added to gated call
- `src/features/games/hooks/useGameTimer.js` - DEBUG flag → import.meta.env.DEV; eslint-disable-line on debugLog calls
- `src/hooks/useAudioEngine.js` - METRONOME_TIMING_DEBUG flag → import.meta.env.DEV; eslint-disable-line added
- `src/hooks/useVictoryState.js` - Deleted 3 stale navigation breadcrumb console.log calls
- `src/services/audioCacheService.js` - console.debug wrapped with if (import.meta.env.DEV) + eslint-disable-line
- `src/services/apiAuth.js` - eslint-disable-line added to existing DEV-gated call
- `src/services/consentService.js` - eslint-disable-line added to existing process.env.NODE_ENV-gated call
- `src/contexts/SubscriptionContext.jsx` - eslint-disable-line added to existing process.env.NODE_ENV-gated call
- `src/utils/pwa.js` - Deleted stale "Fallback reload triggered" console.log

## Decisions Made

- Used eslint-disable-line (inline, same line) rather than eslint-disable-next-line — critical for grep audit pattern to work (grep -v "eslint-disable" excludes the console line itself)
- no-console severity set to "warn" so pre-commit hook (husky/lint-staged) does not hard-block commits on runtime-gated DEV logs
- Deleted VictoryScreen nav breadcrumbs and pwa.js reload log entirely (no ongoing dev value, per D-01 decision)
- Added eslint-disable-line to already-correctly-gated calls (apiAuth, consentService, SubscriptionContext, patternBuilder) in same pass as Task 1 to bring grep audit to 0

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Sequencing] Added eslint-disable-line directives in Task 1 (not deferred to Task 2)**

- **Found during:** Task 1 verification (grep audit)
- **Issue:** Plan described adding eslint-disable-line to already-gated calls in Task 2, but Task 1 acceptance criteria required grep audit to return 0. These two requirements are contradictory unless the directives are added in Task 1. The grep filter `grep -v "eslint-disable"` only matches lines containing that text, so all kept console calls needed the directive before Task 1's audit could pass.
- **Fix:** Added eslint-disable-line to all kept console calls (boolean-flag-gated + already-correctly-gated files) during Task 1 execution, rather than waiting for Task 2.
- **Files modified:** useRhythmPlayback.js, SightReadingGame.jsx, useGameTimer.js, useAudioEngine.js, patternBuilder.js, SubscriptionContext.jsx, apiAuth.js, consentService.js
- **Verification:** Grep audit returned 0 after additions
- **Committed in:** 43946cf (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (execution sequencing)
**Impact on plan:** No scope creep. The deviation ensured Task 1's own acceptance criteria were met. Task 2's ESLint rule addition still required its own separate commit.

## Issues Encountered

- `npm run build` fails in this worktree environment due to a pre-existing issue: `scripts/validateTrail.mjs` (prebuild hook) attempts to import `src/data/constants.js` which now contains SVG imports (`treble-clef-tab.svg?react`, `bass-clef-tab.svg?react`) added by a concurrent agent. Node.js's ESM loader cannot process `.svg` files. The Vite build itself (`npx vite build`) succeeds. This is out-of-scope for this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- QUAL-06 requirement satisfied: production builds will emit zero console.log/debug output
- ESLint no-console rule active — any future unguarded console.log/debug call will produce a lint warning visible in terminal and in CI
- Pre-commit hook (husky + lint-staged) will surface warnings on staged files
- Console.warn and console.error calls are completely untouched per D-03

---

_Phase: 14-console-logging-cleanup_
_Completed: 2026-03-31_
