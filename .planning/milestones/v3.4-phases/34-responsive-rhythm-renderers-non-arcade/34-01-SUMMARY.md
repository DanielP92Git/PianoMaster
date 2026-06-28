---
phase: 34-responsive-rhythm-renderers-non-arcade
plan: 01
subsystem: infra
tags: [rhythm, responsive, context, react, vitest, tailwind]

# Dependency graph
requires:
  - phase: 33-rhythm-issues-cleanup
    provides: rhythm renderer architecture (MixedLessonGame, 7 renderers, 6 wrappers)
provides:
  - needsLandscape pure helper (threshold 9 beats, 4/4-aware) for content-driven landscape declaration
  - NeedsLandscapeContext provider + useDeclareNeedsLandscape + useNeedsLandscape hooks (last-writer-wins, default-value variant)
  - 25 passing assertions covering measures-only, beats-array, edge cases, and lifecycle
affects: [34-02, 34-03, 34-04, 34-05, 34-06, 35-arcade-rhythm-portrait]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Default-value React Context (no throw outside provider) — variant of SightReadingSessionContext idiom"
    - "Content-driven landscape declaration: pure helper + context hook + caller composition"
    - "TDD: RED test commit -> GREEN implementation commit per file"

key-files:
  created:
    - src/components/games/rhythm-games/utils/needsLandscape.js
    - src/components/games/rhythm-games/utils/needsLandscape.test.js
    - src/contexts/NeedsLandscapeContext.jsx
    - src/contexts/NeedsLandscapeContext.test.jsx
  modified: []

key-decisions:
  - "Threshold = 9 (locked per RESEARCH § Threshold Analysis): >9 totalBeats triggers landscape; lets 3-measure 3/4 (=9) render in portrait"
  - "Helper guards malformed time signatures (Number.isFinite + >0) so parseInt('garbage') falls back to 4/4 instead of propagating NaN"
  - "Default-value Context (returns false outside provider) — chosen over throw-on-missing variant per PATTERNS.md note; safe for non-rhythm subtrees"
  - "INFRA-04 lock test exercises useRotatePrompt directly with vi.mock(useIsMobile -> false) — confirms tablet/desktop never sees prompt regardless of context value"

patterns-established:
  - "Pure helper for content-driven decision: viewport-agnostic, time-signature-aware, measures-override-precedence"
  - "Last-writer-wins context lifecycle: useDeclareNeedsLandscape sets on mount, clears on unmount via useEffect cleanup"
  - "Test mocking of useIsMobile + useOrientation + pwaDetection to deterministically gate useRotatePrompt"

requirements-completed:
  - NOTATION-03
  - INFRA-02
  - INFRA-04

# Metrics
duration: ~25min
completed: 2026-05-10
---

# Phase 34 Plan 01: Foundation — needsLandscape helper + NeedsLandscapeContext Summary

**Wave 0 infrastructure shipped: pure `needsLandscape(beats, timeSignature, measures)` helper with threshold 9 plus `NeedsLandscapeContext` provider with two hooks (`useDeclareNeedsLandscape`, `useNeedsLandscape`), unblocking Plans 03–06 and Phase 35.**

## Performance

- **Duration:** ~25 min (including initial worktree-base merge from main)
- **Started:** 2026-05-10T11:13:00Z
- **Completed:** 2026-05-10T11:18:00Z
- **Tasks:** 2 (both TDD: RED + GREEN per task = 4 commits)
- **Files created:** 4 (2 source, 2 test)

## Accomplishments

- `needsLandscape` pure helper with threshold 9 beats, robust to malformed time signatures, supporting both measures-only (preferred) and beats-array (fallback) input paths
- `NeedsLandscapeContext` default-value provider with `useDeclareNeedsLandscape(value)` (mount-time declaration, automatic cleanup on unmount) and `useNeedsLandscape()` (read-only consumer)
- 18 helper assertions covering measures-only path (7), beats-array path (5), and edge cases (6) — including the load-bearing `needsLandscape(undefined, "3/4", 3) === false` case
- 7 lifecycle assertions covering default-outside-provider, fresh-provider initial state, mount-sets-true, unmount-clears, last-writer-wins false-clears-prior-true, prop-flip true→false, and INFRA-04 non-mobile lock via `useRotatePrompt` direct exercise with `useIsMobile` mocked false
- All 25 new assertions green; ESLint clean on all 4 new files

## Task Commits

1. **Task 1 RED: needsLandscape helper failing tests** — `8d60f0e` (test)
2. **Task 1 GREEN: needsLandscape helper implementation** — `0fb4473` (feat)
3. **Task 2 RED: NeedsLandscapeContext failing lifecycle tests** — `626d0e9` (test)
4. **Task 2 GREEN: NeedsLandscapeContext implementation** — `7549ea2` (feat)

_Note: TDD tasks produced one RED + one GREEN commit each per Plan 01 spec._

## Files Created/Modified

- `src/components/games/rhythm-games/utils/needsLandscape.js` — pure helper exporting `needsLandscape(beats, timeSignature, measures)`; module-private `parseTimeSignature` and `getBeatsPerMeasure` with NaN-safe fallback to 4/4
- `src/components/games/rhythm-games/utils/needsLandscape.test.js` — 18 vitest assertions across 3 nested describe blocks (measures-only, beats-array, edge cases)
- `src/contexts/NeedsLandscapeContext.jsx` — default-value `createContext`, `NeedsLandscapeProvider`, `useNeedsLandscape` reader hook, `useDeclareNeedsLandscape` declarer hook with effect cleanup
- `src/contexts/NeedsLandscapeContext.test.jsx` — 7 vitest+RTL assertions including INFRA-04 lock via vi.mock'd useIsMobile

## Decisions Made

- Followed plan exactly. Locked decisions D-01 through D-04 (formula, threshold, pure helper, viewport-agnostic) and D-15 through D-17 (single hook, last-writer-wins, AppLayout provider mount, no Phase 35 API extensions) honored verbatim.
- INFRA-04 lock test implementation: rather than waiting for Plan 03's `useRotatePrompt` modifications, the test verifies the load-bearing invariant in the _current_ `useRotatePrompt` (pure mobile gate). When `useIsMobile()` returns false, `shouldShowPrompt` is false, regardless of any context value. Plan 03 will compose `legacyGate && ctxNeedsLandscape` in wrappers; the test's invariant remains true through that composition.

## Deviations from Plan

### Worktree base drift (orchestrator infrastructure)

**1. [Rule 3 - Blocking] Worktree base predated Phase 34 plan files**

- **Found during:** initial file discovery before Task 1
- **Issue:** Worktree HEAD (`worktree-agent-aca2666ea6be16c20`) was forked off `main` at commit `10fcf6c` — well before Phase 34 plan files (`abc0f50` onward) existed. Required `.planning/phases/34-...` directory was missing locally. This matches the v3.3 Phase 33 worktree-base-staleness pattern flagged in STATE.md.
- **Fix:** Ran `git merge main --no-edit` to fast-forward the worktree to current main, bringing in all Phase 34 planning artifacts plus other unrelated v3.3-cleanup commits. The merge auto-completed without conflicts (we owned no overlapping files yet).
- **Files modified:** none in working tree post-merge — git applied all incoming changes from main cleanly
- **Verification:** Files `.planning/phases/34-responsive-rhythm-renderers-non-arcade/34-01-PLAN.md` etc. now readable
- **Committed in:** merge commit (auto)

### Auto-fixed Issues

None during the TDD work itself — both tasks went RED → GREEN on first attempt with no debug iteration required.

---

**Total deviations:** 1 (orchestrator-infrastructure base drift, mechanically resolved)
**Impact on plan:** Zero functional impact. The plan ran as-written end-to-end after the merge.

## Issues Encountered

- 4 unrelated test files in `npm run test:run` fail with `Missing VITE_SUPABASE_URL` (NoteSpeedCards.test.js, NotesRecognitionGame.autogrow.test.js, SightReadingGame.micRestart.test.jsx, plus one transitive). Pre-existing infrastructure failures in test setup — not caused by Plan 01. Logged to `deferred-items.md` for future quick-task triage. Plan 01's own tests (25/25) pass cleanly.

## User Setup Required

None — pure code addition.

## Next Phase Readiness

- **Plan 03 (renderer opt-in)** is unblocked: can now `import { useDeclareNeedsLandscape } from "../../../../contexts/NeedsLandscapeContext"` and `import { needsLandscape } from "../utils/needsLandscape"`.
- **Plan 04 (wrapper gate composition)** is unblocked: can now `import { useNeedsLandscape }` and compose `const shouldShowPrompt = legacyGate && useNeedsLandscape();`.
- **Plan 02 (AppLayout provider mount)** can now safely `import { NeedsLandscapeProvider }` from the new context module.
- **Phase 35** has the API surface it needs (`useDeclareNeedsLandscape(true|false)` is sufficient for both vertical-lanes and rotate-prompt outcomes per D-17).
- No blockers. Threshold is one-line tunable per D-02 if UAT shows boundary content needs it.

## Self-Check: PASSED

- FOUND: src/components/games/rhythm-games/utils/needsLandscape.js
- FOUND: src/components/games/rhythm-games/utils/needsLandscape.test.js
- FOUND: src/contexts/NeedsLandscapeContext.jsx
- FOUND: src/contexts/NeedsLandscapeContext.test.jsx
- FOUND: 8d60f0e (test RED helper)
- FOUND: 0fb4473 (feat GREEN helper)
- FOUND: 626d0e9 (test RED context)
- FOUND: 7549ea2 (feat GREEN context)
- VERIFIED: `npx vitest run` on both new test files: 25/25 passing
- VERIFIED: ESLint clean on all 4 new files
- VERIFIED: Plan acceptance grep checks all match (TOTAL_BEATS_THRESHOLD=9, 3 export functions, createContext, cleanup return, no throw new Error)

## TDD Gate Compliance

- RED gate (test commit) present for both tasks: `8d60f0e`, `626d0e9`
- GREEN gate (feat commit) present for both tasks: `0fb4473`, `7549ea2`
- REFACTOR gate not needed (implementations went RED→GREEN cleanly with no cleanup pass required)

---

_Phase: 34-responsive-rhythm-renderers-non-arcade_
_Completed: 2026-05-10_
