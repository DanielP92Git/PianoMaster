---
phase: 35-arcaderhythmgame-portrait
plan: 02
subsystem: ui
tags: [rhythm, arcade, responsive, dev-toggle, spike-instrument, vite, url-flag]

# Dependency graph
requires:
  - phase: 34-responsive-rhythm-renderers-non-arcade
    provides: "useDeclareNeedsLandscape context API, useLandscapeLock context gating (D-19), ?measures URL-helper pattern (Plan 34-08)"
provides:
  - "?spike-portrait dev-only URL flag instrument in ArcadeRhythmGame.jsx"
  - "Single-read-on-mount URLSearchParams pattern with import.meta.env.DEV gate (tree-shaken in prod)"
  - "Unblocks Plan 35-03 (manual portrait feel-test) by enabling useDeclareNeedsLandscape(false) on demand"
affects:
  - 35-03-PLAN.md (manual feel-test execution — depends on this instrument)
  - 35-04-PLAN.md (ship — removes this instrument entirely once verdict ships)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dev-only URL flag: useMemo(() => DEV-gated URLSearchParams.has(flag), []) — mirrors Plan 34-08 ?measures helper"

key-files:
  created: []
  modified:
    - src/components/games/rhythm-games/ArcadeRhythmGame.jsx

key-decisions:
  - "Inlined the spike logic directly in ArcadeRhythmGame.jsx (no helper, no hook, no test) per CONTEXT D-14 — abstraction is removed in Plan 04 so creating it would be premature"
  - "Deferred tablet viewport detection (window.matchMedia('(min-width: 768px)')) to Plan 04 per plan instruction — spike only exercises one device at a time per D-03, so the per-render phone/tablet distinction is not needed for the feel-test"
  - "Used URLSearchParams.has() (boolean presence) rather than parsing a value — simpler, mirrors typical feature-flag URL conventions"

patterns-established:
  - "Dev-spike URL flag: gate on import.meta.env.DEV FIRST so Vite tree-shakes the entire block in production. Single read on mount via useMemo(..., []) — no re-read on resize/navigation."

requirements-completed: [ARCADE-01]

# Metrics
duration: ~10min
completed: 2026-05-11
---

# Phase 35 Plan 02: ArcadeRhythmGame ?spike-portrait Instrument Summary

**Dev-only URL flag (`?spike-portrait`) that flips `useDeclareNeedsLandscape(true)` to `false` in ArcadeRhythmGame, unlocking the Plan 35-03 portrait feel-test; tree-shaken from production via `import.meta.env.DEV` gate so zero behavior change for shipped users.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-11T09:20:00Z (approx)
- **Completed:** 2026-05-11T09:26:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added the `?spike-portrait` dev URL flag detection block to `ArcadeRhythmGame.jsx` (between the existing TODO comment and the `useDeclareNeedsLandscape` call)
- Replaced `useDeclareNeedsLandscape(true)` with `useDeclareNeedsLandscape(needsLandscapeValue)` where `needsLandscapeValue = spikePortraitEnabled ? false : true`
- Verified production tree-shaking: `grep -c "spike-portrait" dist/assets/ArcadeRhythmGame-*.js` returns `0`
- All 12 existing `ArcadeRhythmGame.test.js` tests still pass (no behavior change with flag off)
- Original TODO comment block preserved as historical context

## Task Commits

1. **Task 1: Add ?spike-portrait flag detection + gated viewport-aware declaration in ArcadeRhythmGame.jsx** — `944d2ca` (feat)

_Note: SUMMARY.md commit will be created by the post-plan metadata commit step._

## Files Created/Modified

- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — Added ~18 lines: spike-portrait flag detection via `useMemo(() => DEV-gated URLSearchParams.has("spike-portrait"), [])` plus a `needsLandscapeValue` computed boolean that flips the existing `useDeclareNeedsLandscape` argument when the flag is present. Existing TODO comment preserved verbatim.
- `.planning/phases/35-arcaderhythmgame-portrait/deferred-items.md` — Created to log out-of-scope pre-existing issues (parse error in `ParentZoneEntryCard.test.jsx`, missing `VITE_SUPABASE_URL` env causing unrelated test failures in worktree)

## Decisions Made

- Followed plan exactly as written. The plan's `<action>` block specified verbatim code, including the deferral of tablet viewport detection (`window.matchMedia('(min-width: 768px)')`) to Plan 04 — no deviation from that direction.
- Kept `const needsLandscapeValue = spikePortraitEnabled ? false : true;` verbose rather than the lint-friendlier `!spikePortraitEnabled` — per plan rationale, the verbose form makes Plan 04's final-form diff trivial.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

### Out-of-scope verification noise (not blocking)

Three verification gates surfaced pre-existing repository issues that are unrelated to Plan 35-02:

1. **`npm run lint`** reports 1 error in `src/components/settings/ParentZoneEntryCard.test.jsx:32:42` (`Cannot use keyword 'await' outside an async function`). Pre-existing — last touched in commit `40df51d test(phase-06): add Nyquist validation tests for parent portal`. The `ArcadeRhythmGame.jsx` file itself produces zero new lint warnings or errors. Logged to `deferred-items.md`.

2. **`npm run test:run`** has 4 unrelated test files failing with `Missing VITE_SUPABASE_URL environment variable` because the worktree does not have a `.env` file. Verified pre-existing by running `git stash` to remove Plan 35-02 changes and re-running the failing test — identical failure. The in-scope test (`ArcadeRhythmGame.test.js`, all 12 tests) passes cleanly. Logged to `deferred-items.md`.

3. **`npm run build`** succeeded — production bundle confirmed to be free of `spike-portrait` (tree-shaking working as designed).

Per the SCOPE BOUNDARY rule, these were not auto-fixed (they pre-date the plan and live in unrelated files).

## User Setup Required

None — no external service configuration required. The `?spike-portrait` flag is a client-side URL parameter only.

## Next Phase Readiness

- Plan 35-03 (manual portrait feel-test) is unblocked. Owner can now run `npm run dev` and visit `/rhythm-mode/arcade-rhythm-game?spike-portrait` on phone-portrait viewports to feel-test without the rotate prompt firing.
- Plan 35-04 (ship) has a clearly delimited remove-target: the comment block beginning `// Phase 35 spike instrument (D-02, Plan 35-02)` through the `const needsLandscapeValue = ...` line.

## Self-Check: PASSED

Verified after writing this SUMMARY:

- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — FOUND (modified, contains `spike-portrait` flag, `spikePortraitEnabled` identifier, `import.meta.env.DEV` gate, `useDeclareNeedsLandscape(needsLandscapeValue)`, no remaining `useDeclareNeedsLandscape(true)` call, `useLandscapeLock()` preserved, original TODO comment preserved, SSR `typeof window === "undefined"` guard present)
- Commit `944d2ca` — FOUND in `git log --oneline`
- Production bundle (`dist/assets/ArcadeRhythmGame-*.js`) contains `0` occurrences of `spike-portrait` — tree-shake verified
- `ArcadeRhythmGame.test.js` — 12 tests, all passing

---

_Phase: 35-arcaderhythmgame-portrait_
_Plan: 02_
_Completed: 2026-05-11_
