---
phase: 34-responsive-rhythm-renderers-non-arcade
plan: 04
subsystem: rhythm-games
tags:
  - rhythm
  - responsive
  - renderers
  - wrappers
  - tailwind
  - landscape-context
requires:
  - 34-01 (NeedsLandscapeContext + needsLandscape helper)
  - 34-02 (13-component AUDIT punch list)
  - 34-03 (NeedsLandscapeProvider mount + useLandscapeLock context-aware)
provides:
  - All 7 rhythm renderers declare needsLandscape on mount
  - All 6 rhythm wrappers gate rotate prompt via legacyGate && ctxNeedsLandscape
  - ArcadeRhythmGame interim useDeclareNeedsLandscape(true) bridge for Phase 35
affects:
  - Rhythm games — phone-portrait short-pattern UX (no more spurious rotate prompt)
  - Tablet quadrants — 2x2 card grids fill viewport instead of leaving gutters
  - Android PWA arcade-rhythm-game — lock preserved between Phases 34 and 35
tech-stack:
  added: []
  patterns:
    - "Tailwind landscape:max-md: variant for orientation-driven grid swap (D-06)"
    - "Last-writer-wins context declaration via useDeclareNeedsLandscape on mount/unmount (D-15)"
    - "Composed gate `legacyGate && ctxNeedsLandscape` in wrappers to coexist with non-rhythm games (Pitfall 1)"
key-files:
  created: []
  modified:
    - path: src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx
      reason: declare false; SVG bumps for tablet; card max-w bumps
    - path: src/components/games/rhythm-games/renderers/PulseQuestion.jsx
      reason: declare false; TapArea wrapper md/lg bumps
    - path: src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx
      reason: compute from correctBeats; 3-card 2x2 grid with col-span-2 for last odd card
    - path: src/components/games/rhythm-games/renderers/RhythmReadingQuestion.jsx
      reason: compute from beats+measureCount; TapArea wrapper md/lg bump
    - path: src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx
      reason: compute via measures-only path (async pattern load); TapArea wrapper md/lg bump
    - path: src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx
      reason: declare false; replace JS gridClass with literal Tailwind landscape:max-md:grid-cols-4
    - path: src/components/games/rhythm-games/renderers/VisualRecognitionQuestion.jsx
      reason: declare false; replace JS gridClass with literal Tailwind landscape:max-md:grid-cols-4
    - path: src/components/games/rhythm-games/RhythmDictationGame.jsx
      reason: compose ctxNeedsLandscape gate
    - path: src/components/games/rhythm-games/RhythmReadingGame.jsx
      reason: compose ctxNeedsLandscape gate
    - path: src/components/games/rhythm-games/MetronomeTrainer.jsx
      reason: compose ctxNeedsLandscape gate
    - path: src/components/games/rhythm-games/VisualRecognitionGame.jsx
      reason: compose ctxNeedsLandscape gate
    - path: src/components/games/rhythm-games/SyllableMatchingGame.jsx
      reason: compose ctxNeedsLandscape gate
    - path: src/components/games/rhythm-games/MixedLessonGame.jsx
      reason: compose ctxNeedsLandscape gate (single declaration flows to both overlay sites)
    - path: src/components/games/rhythm-games/ArcadeRhythmGame.jsx
      reason: useDeclareNeedsLandscape(true) interim stub (W2)
    - path: src/components/games/rhythm-games/renderers/__tests__/SyllableMatchingQuestion.test.jsx
      reason: update grid-class assertions for Tailwind-driven behavior
    - path: src/components/games/rhythm-games/renderers/__tests__/VisualRecognitionQuestion.test.jsx
      reason: update grid-class assertions for Tailwind-driven behavior
decisions:
  - "RhythmDictationQuestion uses 2-col grid with col-span-2 on the last (3rd) card per AUDIT nuance (3 cards not 4)"
  - "Wrapper className passthrough for col-span on DictationChoiceCard implemented as a wrapping <div> (DictationChoiceCard component is owned by Plan 05)"
  - "RhythmTapQuestion uses computeNeedsLandscape with measures-only path (null beats) because pattern is async-loaded into a ref (not a state value); semantically equivalent — measures × beatsPerMeasure threshold"
  - "Renderer test mocks for NeedsLandscapeContext NOT added — default context value (no-op setter) is sufficient because tests do not assert on rotate-prompt visibility"
metrics:
  duration_seconds: 874
  duration_human: "~14m 34s"
  tasks_completed: 3
  files_modified: 16
  commits: 3
  completed_at: 2026-05-10T09:06:17Z
---

# Phase 34 Plan 04: Wire Rhythm Renderers + Wrappers Summary

**One-liner:** Wired content-driven landscape declaration into all 7 rhythm renderers and composed the `legacyGate && ctxNeedsLandscape` rotate-prompt gate into all 6 rhythm wrappers, fixing card grids per D-05/D-06 and bumping TapArea widths for tablet — short-pattern phone-portrait sessions no longer fire the rotate prompt and tablet-landscape quadrants finally fill available width.

## Objective Recap

Make every rhythm renderer declare its `needsLandscape` value via `useDeclareNeedsLandscape` (helper-derived for Reading/Tap/Dictation; literal `false` for the others), make every rhythm wrapper consume that declaration via `useNeedsLandscape` and gate the rotate prompt on `legacyGate && ctxNeedsLandscape`, fix card grids per D-05/D-06 (2x2 phone-portrait, 1x4 phone-landscape, 2x2 tablet, full-width 2x2 tablet-landscape), and bump caller-side TapArea widths so tablets use available space. Plus an interim ArcadeRhythmGame stub (W2) that calls `useDeclareNeedsLandscape(true)` so the now-context-gated `useLandscapeLock` keeps firing the Android PWA lock between Phases 34 and 35.

## Tasks Completed

| Task | Name                                                            | Commit    | Outcome                                                                                                                                                                                                                     |
| ---- | --------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Wire useDeclareNeedsLandscape into 7 renderers + fix card grids | `48df5ee` | All 7 renderers declare; SyllableMatching/VisualRecognition use literal `landscape:max-md:grid-cols-4`; Dictation 3-card grid with col-span-2 fallback; tablet width bumps applied (CORE-01..05, NOTATION-01/02, TABLET-01) |
| 2    | Compose `legacyGate && ctxNeedsLandscape` in 6 wrappers         | `630a280` | All 6 rhythm wrappers wired; non-rhythm wrappers untouched (Pitfall 1); MixedLessonGame crossfade key preserved (INFRA-03, WRAPPER-01)                                                                                      |
| 3    | ArcadeRhythmGame interim landscape declaration (W2)             | `68c4b8d` | `useDeclareNeedsLandscape(true)` + TODO(Phase 35) marker preserves Android PWA lock between phases                                                                                                                          |

## Key Decisions Made

1. **RhythmDictationQuestion uses 2-col grid with col-span-2 on the last odd card** — AUDIT confirmed dictation has 3 cards (not 4 as RESEARCH originally assumed). Per the plan instruction (and ROADMAP SC #1) the layout is a 2-col grid where the third card spans both columns.
2. **DictationChoiceCard receives col-span via a wrapping `<div>`** — `DictationChoiceCard.jsx` lives under `components/` and is owned by Plan 05 (sibling executor); it doesn't currently accept a passthrough `className`. Wrapping each card in a `<div>` carries the col-span class without depending on Plan 05's changes.
3. **RhythmTapQuestion declares via the measures-only path of the helper** — pattern data is async-loaded into `patternInfoRef.current` (not a React state), so `beats` isn't synchronously available. Calling `computeNeedsLandscape(null, timeSig, measureCount)` triggers the helper's `measures × beatsPerMeasure` threshold path, which is semantically equivalent for typical 1-measure tap exercises.
4. **No NeedsLandscapeContext mocks added to renderer/wrapper tests** — the context provides a default value (`needsLandscape: false`, `setNeedsLandscape: () => {}`) so tests render successfully without a Provider. None of the existing assertions touch rotate-prompt visibility, so the default is sufficient. Verified by running the full rhythm test suite (186 tests pass).

## Verification Results

- **Renderer grep verification (Task 1):** 7/7 renderers contain `useDeclareNeedsLandscape`; 7/7 import `NeedsLandscapeContext`; SyllableMatching + VisualRecognition contain literal `landscape:max-md:grid-cols-4`; both no longer have `gridClass` variable.
- **Wrapper grep verification (Task 2):** 6/6 wrappers import `useNeedsLandscape`; 6/6 contain `ctxNeedsLandscape = useNeedsLandscape()`; 6/6 contain composed `legacyGate && ctxNeedsLandscape`; non-rhythm games (`notes-master-games/*.jsx`, `ear-training-games/*.jsx`) NOT touched.
- **MixedLessonGame crossfade key preserved:** `key={\`${fadeKey}-${currentIndex}\`}` still present at lines 609 and 651 (Phase 25 fix).
- **ArcadeRhythmGame (Task 3):** `useDeclareNeedsLandscape(true)` + `TODO(Phase 35)` + `useLandscapeLock()` all present.
- **Rhythm test suite:** 18 files, 186 tests — all pass (`npx vitest run src/components/games/rhythm-games/`).
- **Full test suite:** 1625 tests pass; 4 pre-existing test-file failures from missing `VITE_SUPABASE_URL` env var (logged in `deferred-items.md`).
- **Lint:** No new lint errors. 1 pre-existing parsing error in `src/components/settings/ParentZoneEntryCard.test.jsx` (unrelated, logged in `deferred-items.md`).
- **Build:** `npm run build` exits 0 (Tailwind keeps all literal class strings; trail validation passes).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] DictationChoiceCard does not accept a `className` prop**

- **Found during:** Task 1, RhythmDictationQuestion grid implementation
- **Issue:** Plan specified passing `className={... col-span-2 ...}` directly to `<DictationChoiceCard>`, but the component (owned by Plan 05) does not destructure or apply a `className` prop.
- **Fix:** Wrapped each card in a `<div>` that carries the conditional col-span class. No changes to `DictationChoiceCard.jsx` (Plan 05 ownership respected).
- **Files modified:** `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx`
- **Commit:** `48df5ee`

**2. [Rule 3 - Blocking] RhythmTapQuestion has no synchronous `beats` value**

- **Found during:** Task 1, RhythmTapQuestion declaration
- **Issue:** Plan template (`const declared = beats ? computeNeedsLandscape(beats, ...) : false`) presumes a state-held `beats` array; RhythmTapQuestion stores patterns in `patternInfoRef.current.pattern` (binary array, async-loaded).
- **Fix:** Use the helper's measures-only path: `computeNeedsLandscape(null, timeSig, measureCount || 1)`. Semantically equivalent for typical 1-measure tap exercises and avoids forcing a state hoist that the existing rAF / scheduling logic would have to be restructured around.
- **Files modified:** `src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx`
- **Commit:** `48df5ee`

**3. [Rule 1 - Bug] Existing renderer tests asserted JS-driven `grid-cols-4` class that no longer exists**

- **Found during:** Task 1 verification (`npm run test:run`)
- **Issue:** `SyllableMatchingQuestion.test.jsx` and `VisualRecognitionQuestion.test.jsx` had two tests each that asserted `container.querySelector(".grid-cols-4")` is truthy when `isLandscape={true}` and `.grid-cols-2` truthy when `isLandscape={false}`. After replacing the JS-driven `gridClass` with the literal Tailwind class string `landscape:max-md:grid-cols-4`, the unconditional class now contains both `grid-cols-2` (base) and the `landscape:max-md:grid-cols-4` variant — but querySelector matches dot-prefixed class tokens, so `.grid-cols-4` doesn't match the variant prefix.
- **Fix:** Updated tests to (a) verify both base + variant literals coexist and (b) assert the rendered class is identical regardless of the `isLandscape` prop (since the prop is now ignored). Tests pass.
- **Files modified:** `src/components/games/rhythm-games/renderers/__tests__/SyllableMatchingQuestion.test.jsx`, `src/components/games/rhythm-games/renderers/__tests__/VisualRecognitionQuestion.test.jsx`
- **Commit:** `48df5ee`

### Out of scope — logged to deferred-items.md

- **Pre-existing lint parsing error** in `src/components/settings/ParentZoneEntryCard.test.jsx:32` (`Parsing error: Cannot use keyword 'await' outside an async function`). Last touched in `40df51d test(phase-06): ...` — unrelated to rhythm work.

## Authentication Gates

None — fully autonomous execution.

## TDD Gate Compliance

Plan is `type: execute` (not `type: tdd`) — RED/GREEN/REFACTOR sequence not required.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. Pure UI/responsive refactor.

## Known Stubs

**ArcadeRhythmGame `useDeclareNeedsLandscape(true)` interim stub (Task 3):** This is the deliberate W2 mitigation. The renderer declares true unconditionally to preserve the Android PWA lock between Phases 34 and 35. A `TODO(Phase 35)` marker is in place at the call site. Plan/phase 35 will replace this with content-driven declaration once the vertical-lanes vs rotate-prompt strategy is decided. This stub is intentional and documented.

## Self-Check: PASSED

- Files modified (spot-checked):
  - FOUND: src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx
  - FOUND: src/components/games/rhythm-games/renderers/VisualRecognitionQuestion.jsx
  - FOUND: src/components/games/rhythm-games/MixedLessonGame.jsx
  - FOUND: src/components/games/rhythm-games/ArcadeRhythmGame.jsx
- Commits in `git log --oneline -3`:
  - FOUND: 48df5ee (Task 1)
  - FOUND: 630a280 (Task 2)
  - FOUND: 68c4b8d (Task 3)
- Verification grep checks pass for all 7 renderers and 6 wrappers (see Verification Results).
- Test suite: 186 rhythm tests pass; 1625 total tests pass.
- Build: succeeds.
