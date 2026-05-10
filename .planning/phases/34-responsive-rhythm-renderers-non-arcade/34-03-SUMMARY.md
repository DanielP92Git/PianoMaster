---
phase: 34-responsive-rhythm-renderers-non-arcade
plan: 03
subsystem: app-shell
tags: [rhythm, responsive, infrastructure, routing, context]

# Dependency graph
requires:
  - phase: 34-responsive-rhythm-renderers-non-arcade
    plan: 01
    provides: NeedsLandscapeContext provider + useNeedsLandscape hook
provides:
  - LANDSCAPE_ROUTES literal trimmed to 6 entries (rhythm migrated off route-based gate)
  - NeedsLandscapeProvider mounted at AppLayout — every routed page can consume the context
  - useLandscapeLock context-aware (D-19) — Android PWA orientation lock fires only when content opts in
affects: [34-04, 34-05, 34-06, 35-arcade-rhythm-portrait]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Provider mounted in app shell (AppLayout) — single source of truth for content-driven landscape declaration"
    - "Hook becomes context-aware without changing caller signature (D-19) — existing useLandscapeLock() call sites untouched"
    - "Route-based + content-driven landscape gates coexist (D-14) — rhythm uses new, notes-master/ear-training stay on legacy until NM-01/ET-01"

key-files:
  created: []
  modified:
    - src/App.jsx
    - src/components/layout/AppLayout.jsx
    - src/hooks/useLandscapeLock.js

key-decisions:
  - "D-13 honored: removed exactly 7 rhythm paths; 6 entries remain (4 notes-master + 2 ear-training)"
  - "D-16 honored: NeedsLandscapeProvider wraps Header / Sidebar / main / MobileTabsNav inside AppLayout's outer div — dir/lang/className stay on the outer div so RTL/Hebrew styling continues to work"
  - "D-19 honored: useLandscapeLock reads useNeedsLandscape() internally; gates orientation lock on ctxNeedsLandscape === true; effect dep is [ctxNeedsLandscape] so flip-back releases lock via existing cleanup"
  - "D-20 prerequisite met: with rhythm paths removed from LANDSCAPE_ROUTES, OrientationController falls through to its portrait-primary default for /rhythm-mode/* routes"
  - "Dual-array trap respected (CLAUDE.md § Routing): rhythm routes STAY in gameRoutes (AppLayout.jsx lines 18-32) so sidebar/header still hide during rhythm gameplay. Verified `grep -c '/rhythm-mode/' src/components/layout/AppLayout.jsx` returns 7"

requirements-completed:
  - INFRA-01
  - INFRA-04

# Metrics
duration: ~7min
completed: 2026-05-10
---

# Phase 34 Plan 03: App Shell Wiring Summary

**Wave 2 bridge between Plan 01 primitives and Plan 04 renderer opt-ins: LANDSCAPE_ROUTES drops 7 rhythm paths, NeedsLandscapeProvider mounts in AppLayout, and useLandscapeLock becomes context-aware (D-19) — all without changing any call-site signature.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-05-10T08:36:33Z
- **Completed:** 2026-05-10T08:43:58Z
- **Tasks:** 2 (both type=auto, single GREEN commit each)
- **Files modified:** 3 (App.jsx, AppLayout.jsx, useLandscapeLock.js)
- **Files created:** 0

## Accomplishments

- `src/App.jsx` LANDSCAPE_ROUTES trimmed from 13 to 6 entries — exactly the 7 rhythm paths removed (metronome-trainer, rhythm-reading-game, rhythm-dictation-game, arcade-rhythm-game, visual-recognition-game, syllable-matching-game, mixed-lesson). Inline comment explains D-13 migration reasoning so future readers understand why rhythm is missing.
- `src/components/layout/AppLayout.jsx` imports `NeedsLandscapeProvider` from `../../contexts/NeedsLandscapeContext` and wraps the entire render tree (Header / Sidebar / main + Outlet / MobileTabsNav) inside a single `<NeedsLandscapeProvider>` block. The outer `<div>` keeps dir/lang/className so RTL and font-hebrew styling continue to work.
- `src/hooks/useLandscapeLock.js` reads `useNeedsLandscape()` at the top of the hook; effect body now early-returns when `ctxNeedsLandscape === false`; effect dependency switched from `[]` to `[ctxNeedsLandscape]` so flip-back releases the lock via the existing cleanup function. Caller signature is identical — `useLandscapeLock()` still takes no arguments.
- Build green (`npm run build` exits 0; trail validation prebuild hook passes).
- Test suite green: 1625 passed, 13 todo. The only failures are 4 pre-existing infrastructure suites (`Missing VITE_SUPABASE_URL`) unrelated to Plan 03; documented as a known issue in Plan 01's deferred-items.md.

## Task Commits

1. **Task 1: Remove 7 rhythm routes from LANDSCAPE_ROUTES + mount NeedsLandscapeProvider in AppLayout** — `064dc59` (feat)
2. **Task 2: Gate useLandscapeLock orientation lock on NeedsLandscapeContext (D-19)** — `028bc17` (feat)

## Files Created/Modified

- `src/App.jsx` — LANDSCAPE_ROUTES literal trimmed; inline comment documents D-13 rationale
- `src/components/layout/AppLayout.jsx` — added NeedsLandscapeProvider import + wrapped routed render tree; gameRoutes left untouched per dual-array trap
- `src/hooks/useLandscapeLock.js` — added useNeedsLandscape import; ctxNeedsLandscape read at top of hook; early return when context says no; effect dep `[ctxNeedsLandscape]`; updated docstring to describe new gating behavior

## Decisions Made

- Followed plan exactly. Locked decisions D-13 (rhythm-only migration), D-16 (provider mounts in AppLayout), D-19 (hook reads context internally; signature unchanged), and D-20 prerequisite (portrait-primary default after route removal) honored verbatim.
- Provider placement: chose to wrap inside the outer `<div>` rather than around it. Rationale: outer div carries `dir={direction}` + `lang={language}` + `className={...font-hebrew...}` — these must remain on the root element for RTL i18n. Wrapping the children is functionally identical for context consumers and preserves the existing layout/style contract. The PATTERNS.md template shows the same shape ("`{/* existing Header / Sidebar / main / MobileTabsNav children */}`" inside the provider).
- Effect cleanup correctness for D-19 flip-back: the existing cleanup function already removes the fullscreenchange listener, calls `screen.orientation.unlock()`, and exits fullscreen if entered. React runs effect cleanup before re-running the effect body when a dependency changes — so a `true → false` context flip triggers the cleanup (lock released) before the next effect body runs and early-returns. No additional cleanup logic needed.

## Deviations from Plan

### Worktree base drift (orchestrator infrastructure)

**1. [Rule 3 - Blocking] Worktree base predated Phase 34 plan files**

- **Found during:** initial file discovery before Task 1
- **Issue:** Worktree HEAD was forked off `main` at commit `10fcf6c` — well before Phase 34 plan files (`abc0f50` onward) and Plan 01 deliverables (`7549ea2` etc.) existed. Required `.planning/phases/34-...` directory and the new context file `src/contexts/NeedsLandscapeContext.jsx` were missing locally. Same pattern that hit Plan 01 (documented there).
- **Fix:** Ran `git merge main --no-edit` to fast-forward the worktree to current main, bringing in Phase 34 planning artifacts plus Plan 01's source files (NeedsLandscapeContext.jsx + needsLandscape.js + their tests). The merge auto-completed without conflicts.
- **Files modified:** none in working tree post-merge — git applied all incoming changes from main cleanly.
- **Verification:** Required files (`.planning/phases/34-.../34-03-PLAN.md`, `src/contexts/NeedsLandscapeContext.jsx`) all readable.
- **Committed in:** merge commit (auto)

### Auto-fixed Issues

None — both tasks completed in one pass with no unexpected behavior. Build and tests both green on first attempt.

---

**Total deviations:** 1 (orchestrator-infrastructure base drift, mechanically resolved as in Plan 01)
**Impact on plan:** Zero functional impact. The plan ran as-written end-to-end after the merge.

## Issues Encountered

- 4 unrelated test files in `npm run test:run` continue to fail with `Missing VITE_SUPABASE_URL` (xpSystem.test.js, NoteSpeedCards.test.js, NotesRecognitionGame.autogrow.test.js, SightReadingGame.micRestart.test.jsx). Pre-existing infrastructure failure (test setup doesn't inject the env var). Already logged to `deferred-items.md` by Plan 01. Not caused by Plan 03 — confirmed by running tests both before and after Task 1's changes; failure count and identity unchanged.

## User Setup Required

None — pure code change. After merge to main and deploy:

- Android PWA users on rhythm routes will no longer see forced fullscreen + landscape lock until renderer opt-ins land (Plan 04). With Plan 03 alone, rhythm routes default to `portrait-primary` via OrientationController.
- iOS, desktop, and non-PWA Android users see no behavior change (their useLandscapeLock path was always a no-op via the platform guard).

## Next Phase Readiness

- **Plan 04 (renderer opt-in)** is fully unblocked: every rhythm renderer can `import { useDeclareNeedsLandscape } from "../../../../contexts/NeedsLandscapeContext"` and the provider is mounted at AppLayout, so the declared values reach the context. `useNeedsLandscape()` returns the current declaration anywhere in the tree.
- **Plan 04 wrapper composition** (`legacyGate && useNeedsLandscape()`) works as designed — the hook is available everywhere AppLayout wraps.
- **Phase 35 (ArcadeRhythmGame portrait)** API surface is settled: ArcadeRhythmGame can either declare `false` on phone-portrait (vertical lanes path) or `true` unconditionally (rotate-prompt path) — both routes through the same `useDeclareNeedsLandscape(boolean)` hook with no infrastructure changes needed.
- **No blockers.** D-19 hook flip behavior verified by code inspection (effect cleanup order is React-guaranteed); audit pass in Plan 06 will confirm UAT-level behavior on a real Android PWA device.

## Self-Check: PASSED

- FOUND: src/App.jsx (modified, LANDSCAPE_ROUTES has 6 entries)
- FOUND: src/components/layout/AppLayout.jsx (modified, NeedsLandscapeProvider mounted)
- FOUND: src/hooks/useLandscapeLock.js (modified, context-aware)
- FOUND: 064dc59 (feat Task 1)
- FOUND: 028bc17 (feat Task 2)
- VERIFIED: Plan 03 acceptance grep checks all match (rhythm paths absent from LANDSCAPE_ROUTES, NeedsLandscapeProvider in AppLayout, useNeedsLandscape import + ctxNeedsLandscape read + early return + effect dep all present in useLandscapeLock)
- VERIFIED: `npm run build` exits 0 with trail validation prebuild hook passing
- VERIFIED: `npm run test:run` — 1625/1625 actual tests pass; 4 pre-existing supabase-env failures unchanged
- VERIFIED: rhythm routes still in `gameRoutes` (AppLayout dual-array trap) — `grep -c '/rhythm-mode/' src/components/layout/AppLayout.jsx` returns 7
- VERIFIED: no accidental deletions in either commit (`git diff --diff-filter=D --name-only HEAD~2 HEAD` returns empty)

---

_Phase: 34-responsive-rhythm-renderers-non-arcade_
_Completed: 2026-05-10_
