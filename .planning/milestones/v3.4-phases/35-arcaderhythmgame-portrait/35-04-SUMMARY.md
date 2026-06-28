---
phase: 35-arcaderhythmgame-portrait
plan: 04
subsystem: ui
tags: [rhythm, arcade, responsive, shipping, rotate-prompt, viewport]

# Dependency graph
requires:
  - phase: 34-responsive-rhythm-renderers-non-arcade
    provides: "NeedsLandscapeContext (useDeclareNeedsLandscape/useNeedsLandscape), useLandscapeLock context-gating (D-19), RotatePromptOverlay viewport gate"
  - phase: 35-arcaderhythmgame-portrait
    provides: "Plan 02 ?spike-portrait dev-only URL instrument (removed in this plan); Plan 03 35-SPIKE.md verdict (ROTATE-PROMPT)"
provides:
  - "Final shipping declaration in ArcadeRhythmGame.jsx: useDeclareNeedsLandscape(isPhoneViewport) via inline matchMedia('(min-width: 768px)') read on mount"
  - "Phase 35 closure — all 3 ROADMAP success criteria satisfied across Plans 01–04"
  - "Permanent code citation linking ArcadeRhythmGame.jsx to .planning/phases/35-arcaderhythmgame-portrait/35-SPIKE.md"
affects:
  - "Future portrait redesign work (e.g., backlog multi-column Guitar-Hero-style lanes) — would start from this final shipping state"
  - "Mid-game rotation regression (laneHeightRef.current cache) — documented in 35-SPIKE.md Next Step as out-of-scope follow-up"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Viewport-aware needsLandscape declaration via inline window.matchMedia('(min-width: 768px)').matches inside useMemo(..., []) — phone (<768) declares true, tablet (≥768) declares false (CONTEXT D-10 + D-14: no extracted helper for a binary check)"

key-files:
  created:
    - .planning/phases/35-arcaderhythmgame-portrait/35-04-SUMMARY.md
  modified:
    - src/components/games/rhythm-games/ArcadeRhythmGame.jsx

key-decisions:
  - "Applied ROTATE-PROMPT branch per 35-SPIKE.md verdict header (D-07 tie-break: owner uncertainty + mid-game rotation regression made the safer rotate-prompt path the right call)"
  - "Inline matchMedia + useMemo(..., []) instead of extracting a useViewportIsTablet hook — single consumer, binary check, no abstraction value (CONTEXT D-14)"
  - "Single read on mount (no resize listener) — orientation changes mid-session are handled by RotatePromptOverlay's own viewport+orientation gate, not by re-flipping the context declaration"
  - "Removed the original Phase 35 TODO comment AND the 'W2 Android PWA regression guard' framing in one go — D-19's context-gated useLandscapeLock subsumes the W2 concern (phone declares true → lock fires; tablet declares false → lock skipped)"

patterns-established:
  - "Permanent comment citation pattern: when a code path is the resolution of a recorded planning spike, the comment cites the spike file (e.g., '.planning/phases/35-arcaderhythmgame-portrait/35-SPIKE.md') rather than re-explaining the decision inline. Future maintainers follow the citation for full context."

requirements-completed: [ARCADE-02]

# Metrics
duration: ~18min
completed: 2026-05-11
---

# Phase 35 Plan 04: Ship ArcadeRhythmGame Portrait Rotate-Prompt Summary

**Replaces the Plan 02 `?spike-portrait` dev instrument with the final shipping declaration: `useDeclareNeedsLandscape(viewportWidth < 768)`. Phone-portrait now surfaces the rotate prompt via Phase 34's NeedsLandscapeContext; tablets play in any orientation per D-09.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-05-11T21:29:00Z (approx)
- **Completed:** 2026-05-11T21:47:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Read the 35-SPIKE.md `## Verdict: ROTATE-PROMPT` header and confirmed Branch B applies (not Branch A / SHIP-VERTICAL)
- Removed the entire Plan 02 spike instrument block from `ArcadeRhythmGame.jsx` (lines 121–146 pre-edit): the original Phase 35 TODO comment, the spike instrument explainer, the `spikePortraitEnabled` useMemo, the `needsLandscapeValue` const, and the `import.meta.env.DEV` gate
- Replaced with the final ROTATE-PROMPT shipping declaration: `const isPhoneViewport = useMemo(...)` reading `!window.matchMedia('(min-width: 768px)').matches`, then `useDeclareNeedsLandscape(isPhoneViewport)` followed by the preserved `useLandscapeLock()` call
- Added permanent comment citing `.planning/phases/35-arcaderhythmgame-portrait/35-SPIKE.md` and the D-12 rotate-prompt rationale
- Verified all 12 existing `ArcadeRhythmGame.test.js` tests still pass with the new declaration
- Verified `npm run build` succeeds (built in 25.48s) and the production bundle contains zero `spike-portrait` references (instrument fully removed from source)

## Task Commits

1. **Task 1: Apply ROTATE-PROMPT branch — replace Plan 02 spike instrument with final shipping declaration** — `ed3f6cd` (feat)

_Note: SUMMARY.md commit will be created by the post-plan metadata commit step._

## Files Created/Modified

- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — Net −4 lines (20 inserted, 24 deleted). Removed the spike instrument block (TODO + spike explainer comment + `useMemo`-gated `spikePortraitEnabled` + `needsLandscapeValue` const + `import.meta.env.DEV` check). Replaced with a viewport-aware declaration: `useMemo`-cached `isPhoneViewport` via `!window.matchMedia('(min-width: 768px)').matches`, then `useDeclareNeedsLandscape(isPhoneViewport)` and the preserved `useLandscapeLock()` call. New comment cites 35-SPIKE.md and the D-12 ROTATE-PROMPT rationale.

## Decisions Made

- Followed Branch B (ROTATE-PROMPT) of the plan's `<action>` block verbatim, including the exact replacement code suggested at lines 188–211 of 35-04-PLAN.md
- No polish punch list bundled — per the plan, ROTATE-PROMPT branch explicitly has no polish punch list (the verdict was "owner uncertain about portrait playability + mid-game rotation regression," not "feels good but needs N tweaks")
- The mid-game `laneHeightRef.current` rotation regression noted in 35-SPIKE.md Observations was deliberately NOT fixed in this plan — the SPIKE doc itself classifies it as out-of-scope follow-up (under the rotate-prompt path, phone users never enter portrait so the regression is unlikely to trigger; a future polish phase should still patch it for tablet rotation)

## Deviations from Plan

None — plan executed exactly as written. Branch B (ROTATE-PROMPT) was applied verbatim per the 35-SPIKE.md verdict header.

## Issues Encountered

### Out-of-scope verification noise (not blocking, pre-existing)

Two `npm run lint` / `npm run test:run` items surfaced that pre-date this plan:

1. **`npm run lint`** reports 1 parse error in `src/components/settings/ParentZoneEntryCard.test.jsx:32:42` (`Cannot use keyword 'await' outside an async function`). Pre-existing and already documented in Plan 02's SUMMARY and `deferred-items.md`. Per SCOPE BOUNDARY, not auto-fixed. Verification: running `npx eslint src/components/games/rhythm-games/ArcadeRhythmGame.jsx` directly on the modified file produced **0 errors** and only 3 pre-existing react-hooks/exhaustive-deps warnings unrelated to this edit.

2. **`npm run test:run`** has 4 test files (`NoteSpeedCards.test.js`, `NotesRecognitionGame.autogrow.test.js`, `SightReadingGame.micRestart.test.jsx`, and one other) failing with `Missing VITE_SUPABASE_URL environment variable` because the worktree does not have a `.env` file. Pre-existing and already documented in Plan 02's `deferred-items.md`. The 12 `ArcadeRhythmGame.test.js` tests in scope pass cleanly via `npx vitest run`. Total: **1634 passed / 4 worktree-env-only failures / 13 todo** across 1647 tests.

3. **`npm run build`** succeeded in 25.48s. Production bundle contains zero `spike-portrait` references (`grep -l 'spike-portrait' dist/assets/*.js` returned no matches).

These are recorded for traceability; no auto-fix was attempted per the SCOPE BOUNDARY rule.

## User Setup Required

None — no external service configuration required. The change is client-side only and ships with the next deploy.

## Next Phase Readiness

Phase 35 is now fully shipped. All three ROADMAP Phase 35 Success Criteria are satisfied across Plans 01–04:

- **SC #1** (Plan 03): Spike outcome documented as a recorded decision in `35-SPIKE.md` (verdict + rationale + observations + next step).
- **SC #2** (this plan): On phone-portrait, ArcadeRhythmGame shows the rotate prompt via Phase 34's NeedsLandscapeContext + RotatePromptOverlay (never the broken horizontal-spill layout).
- **SC #3** (Plan 01 wording fix + this plan): On tablet (≥768px), ArcadeRhythmGame plays inline in any orientation with the existing single vertical-lane layout — `isPhoneViewport === false` on tablet → `useDeclareNeedsLandscape(false)` → no rotate prompt, Android lock skipped per D-19.

### Out-of-scope follow-up (not a ship-blocker)

The mid-game rotation regression at `ArcadeRhythmGame.jsx:603-604` (`laneHeightRef.current` cached at pattern start, not refreshed on resize) is documented in `35-SPIKE.md` as a future polish item. Under the ROTATE-PROMPT path that just shipped, phone users never enter the game from portrait so the regression is far less likely to fire — but tablet rotation can still trigger it. A future polish phase should add a `resize`/`orientationchange` listener that re-reads `tileLaneRef.current.offsetHeight` into `laneHeightRef.current`.

## Self-Check: PASSED

Verified after writing this SUMMARY:

- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — FOUND (modified). Verified: zero `spike-portrait` / `spikePortraitEnabled` / `needsLandscapeValue` / `import.meta.env.DEV` / `TODO(Phase 35)` references; `35-SPIKE.md` citation present in the new comment; `isPhoneViewport` and `useDeclareNeedsLandscape(isPhoneViewport)` and `useLandscapeLock()` and `min-width: 768px` and `D-12` and `rotate-prompt` all present.
- Commit `ed3f6cd` — FOUND in `git log --oneline` for the worktree branch (`feat(35-04): ship rotate-prompt portrait fallback per 35-SPIKE.md verdict (ARCADE-02, D-12)`).
- Production bundle (`dist/assets/*.js`) — zero matches for `spike-portrait`, confirming the instrument is fully gone from source (no tree-shake required; the code path simply does not exist anymore).
- `npm run build` — exit 0, built in 25.48s.
- 12/12 `ArcadeRhythmGame.test.js` tests pass.

---

_Phase: 35-arcaderhythmgame-portrait_
_Plan: 04_
_Completed: 2026-05-11_
