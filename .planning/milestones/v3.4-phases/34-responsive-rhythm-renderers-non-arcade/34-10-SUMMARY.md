# Plan 34-10 — UAT Delta Walkthrough + Inline Gap Closures

## Status

**Complete** — Phase 34 ship gate met. All delta rows pass or are explicitly deferred with rationale.

## Outcome

Plan 10 was originally scoped as a thin delta walkthrough: run pre-delta gates, scaffold delta tables in `34-UAT.md`, and verify the gap closures from Plans 07-09. During the walkthrough, GAP 2 retest surfaced two additional wiring bugs in Plan 08 plus an architectural gap in SC #3 enforcement. Per user direction, all three were patched inline rather than spawning another gap-closure cycle.

### Verified delta results

| Gap / SC                                                    | Before                                                         | After                                 | Notes                                                                                                                                                                                                 |
| ----------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP 1 (Plan 07) — free-play dictation 2×2 grid at iPhone SE | row 30-34 marked fail in original UAT                          | ✓ pass                                | Visual walkthrough at 375×667 confirmed 2-card row + 1-card col-span-2 row, no scroll, all tappable. Card-internal staff cropping observed (deferred — renderer-level, out of Plan 07 wrapper scope). |
| GAP 2 (Plan 08) — `?measures=4` long-pattern at iPhone SE   | UAT-helper produced only 1 measure of beats; gate stayed false | ✓ pass                                | Required 3 inline fixes (see below). After fixes, phone-portrait shows rotate prompt for `?measures=4` and stays clean without the param.                                                             |
| GAP 2 — tablet 768×1024 with `?measures=4` (SC #3)          | prompt incorrectly fired due to `pointer: coarse` clause       | ✓ pass                                | Inline fix `89ebee9` added `(min-width: 768px)` viewport gate to `useRotatePrompt`. iPad portrait now correctly suppresses prompt for long patterns.                                                  |
| GAP 3 (Plan 09) — RhythmGameSetup + RhythmGameSettings      | row 113-114 marked fail across 4 quadrants                     | Class C — reclassified pass-with-note | Verified during Plan 09 Task 1 walkthrough; no MetronomeTrainer edit applied (no wrapper container exists to edit); RhythmGameSettings @deprecated as dead code.                                      |

### Inline fixes applied during walkthrough

1. **`af97088` — wire `?measures` override to pattern generation.** Plan 08 wired `trailMeasureCount` to `<RhythmStaffDisplay measures={...}/>` (display layout) but `fetchNewPattern` still called `getPattern()` once → 1-measure beats array. Loop `getPattern()` `trailMeasureCount` times in the free-play fallback branch and concatenate `beats` + `binaryPattern`. Trail-mode `resolveByTags` branch unchanged.

2. **`84697d7` — declare needsLandscape from standalone wrapper.** Free-play `/rhythm-mode/rhythm-reading-game` never raised the prompt because only the renderer pipeline (`MixedLessonGame → RhythmReadingQuestion`) called `useDeclareNeedsLandscape`. The standalone wrapper now declares it using the measures-only path of `computeNeedsLandscape(trailMeasureCount, timeSig)`.

3. **`89ebee9` — tablet viewport gate.** `useIsMobile()` matches tablets via `pointer: coarse`, so the legacy gate (`isMobile && isPortrait`) fired on tablets contradicting SC #3. Added `useIsTabletOrLarger` helper using `matchMedia('(min-width: 768px)')` and a `!isTabletOrLarger` clause in `shouldShowPrompt`. Keeps `needsLandscape` purely content-driven.

## Tasks executed

1. **Task 1 (auto)** — Pre-delta automated gate: `test:run` 1685/1685, `build` 28.37s, lint Phase 34 scope 0 errors. Committed in `8470617`.
2. **Task 2 (auto)** — Appended `## UAT Delta (Gap Closure) — Walkthrough` scaffold with Delta SC #1/2/3/5 + regression check + Sign-Off section. Committed in `8470617`.
3. **Task 3 (checkpoint:human-verify)** — Human walkthrough at iPhone SE 375×667 and iPad 768×1024 via Chrome DevTools touch emulation. Three inline fixes applied (commits above). Final results recorded in delta tables; sign-off marked.

## Files modified

| File                                                                   | Change                                                                                            | Commits              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------- |
| `.planning/phases/34-responsive-rhythm-renderers-non-arcade/34-UAT.md` | Pre-Delta Gate section + Walkthrough scaffold + final delta results + sign-off                    | `8470617`, `d464757` |
| `src/components/games/rhythm-games/RhythmReadingGame.jsx`              | Loop `getPattern()` N times in free-play fallback; declare needsLandscape from standalone wrapper | `af97088`, `84697d7` |
| `src/hooks/useRotatePrompt.js`                                         | Add `useIsTabletOrLarger` helper + `!isTabletOrLarger` gate clause                                | `89ebee9`            |

## Verification

| Gate                                                                 | Result                   |
| -------------------------------------------------------------------- | ------------------------ |
| Pre-delta `npm run test:run`                                         | ✓ 1685/1685 pass, 48.81s |
| Pre-delta `npm run build`                                            | ✓ built in 28.37s        |
| Pre-delta `npm run lint` Phase 34 scope                              | ✓ 0 errors               |
| Post-fixes `npm run test:run`                                        | ✓ 1685/1685 pass, 50.31s |
| Post-fixes `npm run build`                                           | ✓ built in 28.75s        |
| 34-UAT.md contains all 7 required delta headings                     | ✓                        |
| `?measures=4` occurrences ≥ 2                                        | ✓ 7                      |
| Class A/B/C marker present                                           | ✓ 4                      |
| Original 34-UAT.md content preserved (file got longer, not replaced) | ✓                        |
| Walkthrough sign-off recorded with verifier identity + date          | ✓                        |

## Deferred items (logged, not blocking ship)

- Card-internal staff cropping in RhythmDictationGame card content (renderer-level, separate from Plan 07's wrapper grid scope) — observed at iPhone SE portrait during GAP 1 retest.
- Mixed-lesson swap row verification (long→short, short→long) — deferred from delta walkthrough; unit tests cover the `useDeclareNeedsLandscape` cleanup-on-unmount logic that drives swap behavior.

## Phase ship gate

All five ROADMAP Phase 34 Success Criteria are met:

- SC #1 — iPhone SE portrait: dictation 2×2 grid + col-span-2 — ✓ pass
- SC #2 — phone-portrait: short → no prompt, long → prompt — ✓ pass
- SC #3 — tablet ≥768: prompt NEVER appears — ✓ pass (after `89ebee9` viewport gate)
- SC #4 — tablet-landscape: card renderers fill width as 2-col — ✓ pass (verified in original UAT)
- SC #5 — setup screens + 5 supporting overlays render & remain interactive at all 4 quadrants — ✓ pass (RhythmGameSetup Class C reclassified, RhythmGameSettings @deprecated N/A)

Phase 34 ready for `/gsd-progress` to close.
