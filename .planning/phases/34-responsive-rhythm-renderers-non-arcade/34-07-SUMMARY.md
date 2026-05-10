---
phase: 34-responsive-rhythm-renderers-non-arcade
plan: 07
subsystem: rhythm-games
tags:
  - rhythm
  - responsive
  - gap-closure
  - dictation-wrapper
requires:
  - 34-04 (RhythmDictationQuestion 2x2 grid + col-span-2 renderer pattern)
provides:
  - Free-play entry to /rhythm-mode/rhythm-dictation-game uses the same 2x2 grid layout as the MixedLessonGame trail-entry renderer (UAT SC #1 closes at the free-play route)
affects:
  - RhythmDictationGame standalone wrapper (free-play AND direct trail entry to rhythm_dictation exercise type) — phone-portrait card layout no longer scrolls; tablet uses 2-column grid filling available width
tech-stack:
  added: []
  patterns:
    - "2x2 grid with col-span-2 fallback on last odd card (mirrors Plan 04's RhythmDictationQuestion renderer)"
    - "Wrapping <div> carries col-span class because DictationChoiceCard does not accept className prop (Plan 04 deviation #1, reused)"
key-files:
  created: []
  modified:
    - path: src/components/games/rhythm-games/RhythmDictationGame.jsx
      reason: replace flex-col card stack at lines 703-720 with mx-auto grid w-full max-w-md grid-cols-2 gap-3 md:max-w-2xl md:gap-4 lg:max-w-4xl lg:gap-6, wrap each DictationChoiceCard in a div carrying conditional col-span-2 on last odd card
decisions:
  - "Reuse Plan 04 wrapping-<div> approach (DictationChoiceCard owned by Plan 05; does not accept className passthrough)"
  - "Add mx-auto on grid container so 2x2 grid centers within the parent flex column at line 683"
  - "Move React key from DictationChoiceCard to wrapping div (outer element of map iteration)"
metrics:
  duration_seconds: 600
  duration_human: "~10m"
  tasks_completed: 1
  files_modified: 1
  commits: 1
  completed_at: 2026-05-10T17:05:00Z
---

# Phase 34 Plan 07: RhythmDictationGame Wrapper Grid Gap-Closure Summary

**One-liner:** Closed UAT GAP 1 by porting Plan 04's `RhythmDictationQuestion` 2x2 grid + col-span-2 fallback pattern into the standalone `RhythmDictationGame` wrapper — the free-play `/rhythm-mode/rhythm-dictation-game` route (and any trail entry that bypasses MixedLessonGame) now matches the layout the renderer already shipped, restoring SC #1 at the free-play entry point.

## Objective Recap

Plan 04 fixed the dictation 3-card grid only inside the `RhythmDictationQuestion` renderer (which `MixedLessonGame` consumes for trail entries). The standalone wrapper `RhythmDictationGame.jsx` — used by the free-play route AND any direct entry to the `rhythm_dictation` exercise type — has its own inline card render that retained the `flex flex-col gap-3` vertical stack and therefore still scrolled on iPhone SE portrait. Plan 07 closes that gap by applying the exact same Plan-04 grid pattern to the wrapper's inline render block (lines 703–720), with the same wrapping-`<div>` trick to carry `col-span-2` on the last odd card (because `DictationChoiceCard` is owned by Plan 05 and does not accept a `className` prop).

## Tasks Completed

| Task | Name                                                                                               | Commit    | Outcome                                                                                                                                                                                  |
| ---- | -------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Replace flex-col card stack with 2x2 grid + col-span-2 wrapping div in RhythmDictationGame wrapper | `7193153` | Wrapper inline card render matches Plan 04 renderer (`mx-auto grid w-full max-w-md grid-cols-2 gap-3 md:max-w-2xl md:gap-4 lg:max-w-4xl lg:gap-6`); CORE-02, CORE-04, CORE-05, TABLET-01 |

## Key Decisions Made

1. **Reused Plan 04's wrapping-`<div>` approach for col-span carrier** — `DictationChoiceCard.jsx` (owned by Plan 05) does not destructure or apply a `className` prop. Wrapping each card in a `<div>` carries the conditional col-span class without depending on Plan 05 changes. This mirrors Plan 04 deviation #1 verbatim.
2. **Added `mx-auto` on the grid container** — the parent at line 683 is `flex flex-1 flex-col justify-center gap-3 py-3`. Without `mx-auto`, the constrained `max-w-md / max-w-2xl / max-w-4xl` grid would left-align inside the flex column. Adding `mx-auto` centers the grid horizontally so it visually sits as a proper 2x2 layout.
3. **Moved React key from `DictationChoiceCard` to wrapping `<div>`** — React requires the `key` prop on the outermost element of a map iteration. Since the wrapping div is now the iterated outer element, the key moves there.
4. **No changes to `DictationChoiceCard.jsx`** — Plan 05 ownership respected. No changes to imports, state, handlers, FSM, audio, or any other logic in `RhythmDictationGame.jsx`. Pure JSX-className change scoped to the cards container.

## Verification Results

**Automated grep gates (planner-specified):**

- `grid-cols-2` present in `src/components/games/rhythm-games/RhythmDictationGame.jsx`: yes (1 hit, in the new grid container class string)
- `col-span-2` present: yes (1 hit, in the conditional wrapper className)
- `md:max-w-2xl` tablet bump present: yes (in the grid class string)
- `lg:max-w-4xl` tablet-landscape bump present: yes (in the grid class string)
- Old flex-col card stack literal removed: yes (regex `showCards && choices.length === 3 && (\s*<div className="flex flex-col gap-3">` no longer matches)
- `DictationChoiceCard` import + render call still present: yes (2+ occurrences confirmed)

**Test suite:**

- `npm run test:run` — 1625 tests pass; 13 todo; 4 pre-existing test-file failures from missing `VITE_SUPABASE_URL` env var (NoteSpeedCards.test.js, NotesRecognitionGame.autogrow.test.js, SightReadingGame.micRestart.test.jsx, xpSystem.test.js) — same as documented in `.planning/phases/34-responsive-rhythm-renderers-non-arcade/deferred-items.md` per Plan 04. Not introduced by this plan.

**Lint:**

- `npm run lint` — 0 new errors, 0 new warnings introduced by this plan.
- 1 pre-existing parsing error in `src/components/settings/ParentZoneEntryCard.test.jsx:32` (`Parsing error: Cannot use keyword 'await' outside an async function`). Same as Plan 04 logged this in deferred-items.md — out of scope, last touched in `40df51d test(phase-06): ...`.
- File-scoped `npx eslint src/components/games/rhythm-games/RhythmDictationGame.jsx` — 0 errors, 3 pre-existing warnings (`playNote` unused, `timeSigStringToObject` unused, `useCallback` missing-dep on `advanceQuestion`). All pre-existing — none introduced by this plan.

**Build:**

- `npm run build` — exits 0. Trail validation passes. Tailwind purge keeps all literal class strings (verified `grid-cols-2`, `col-span-2`, `md:max-w-2xl`, `md:gap-4`, `lg:max-w-4xl`, `lg:gap-6`, `mx-auto`, `max-w-md` are all literal, non-concatenated strings in the source).

**Manual smoke (planner-recommended; non-automated):**

- `/rhythm-mode/rhythm-dictation-game` (free-play) at iPhone SE 375x667 in DevTools should now render as 2x2 with the third card spanning both columns and no vertical scroll. Visual confirmation deferred to UAT pass.

## Deviations from Plan

None. The task action followed the plan instruction verbatim — replaced the exact lines specified (703–720) with the exact replacement block specified in `<action>`. No auto-fixes (Rules 1–3) triggered. No architectural decisions (Rule 4) needed. No authentication gates encountered.

## Authentication Gates

None — fully autonomous execution.

## TDD Gate Compliance

Plan is `type: execute` (not `type: tdd`) — RED/GREEN/REFACTOR sequence not required. The plan touches only the renderered class names of the cards container; existing rhythm tests do not assert on the wrapper's flex-col vs. grid class string, so no test updates were needed.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. Pure UI/responsive className swap.

## Known Stubs

None.

## Self-Check: PASSED

- File modified (spot-checked):
  - FOUND: src/components/games/rhythm-games/RhythmDictationGame.jsx
- Commit in `git log --oneline -3`:
  - FOUND: 7193153 (Task 1 — fix(34-07): close UAT GAP 1 — RhythmDictationGame wrapper uses 2x2 grid + col-span-2 to match Plan 04 renderer pattern)
- Verification grep checks all pass (see Verification Results).
- Test suite: 1625 tests pass; 4 pre-existing failures unrelated to this plan.
- Build: succeeds.
- No file deletions in commit (`git diff --diff-filter=D --name-only HEAD~1 HEAD` empty).
- No untracked files left behind (`git status --short` empty after commit).
