# Phase 34 — Deferred Items

Items observed during execution that are out of scope for the current plan.

## Pre-existing test infrastructure failures (observed during 34-01 verification)

The following test files fail in `npm run test:run` with `Missing VITE_SUPABASE_URL environment variable`. They are unrelated to Phase 34 work — they were failing on the worktree base before any Plan 01 changes:

- `src/components/games/notes-master-games/NoteSpeedCards.test.js`
- `src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js`
- `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx`
- (one additional file, total 4 failed test files)

Root cause: `src/services/supabase.js` throws at import time when `VITE_SUPABASE_URL` is unset. Vitest's `setupTests.js` apparently doesn't stub these env vars for tests that pull in `streakService` / `xpSystem` / similar transitive imports. The other 1625 tests pass — these 4 test files load real Supabase.

Recommendation: future quick task to either (a) mock supabase in `src/test/setupTests.js`, or (b) provide stub `VITE_SUPABASE_*` values in vitest env config.

Phase 34 Plan 01 verified locally that ALL 25 of its own new assertions pass and lint is clean on the 4 new files.

## Pre-existing lint parsing error (observed during 34-04)

`src/components/settings/ParentZoneEntryCard.test.jsx:32` — `Parsing error: Cannot use keyword 'await' outside an async function`. Pre-existing (last touched 40df51d). Out of Plan 04 scope (renderer/wrapper rhythm work). Future quick task: wrap the offending test fn in `async`.

## Flaky probabilistic test (observed during 34-08)

`src/data/units/rhythmUnit8Redesigned.test.js > rhythm_2_4 (...) produces q, h, and w over 20 samples` intermittently fails when run as part of the full suite (`npm run test:run`) because it asserts a probabilistic outcome over a finite number of random samples. Passes consistently when run in isolation. Pre-existing — unrelated to Plan 34-08 (helper + RhythmReadingGame override only). Future quick task: increase sample count or seed the RNG.

## UAT GAP 3 Investigation Findings (2026-05-10)

Discovered during gap-closure Plan 34-09 investigation of GAP 3 (RhythmGameSetup + RhythmGameSettings UAT row 113-114 fails across 4 quadrants).

### UnifiedGameSettings cross-cutting responsive concerns

`UnifiedGameSettings` (`src/components/games/shared/UnifiedGameSettings.jsx`, ~2288 lines) is the shared step-card-driven setup screen for sight-reading, note-recognition, memory game, AND rhythm games. RhythmGameSetup just delegates to it.

Per D-10 (Phase 34 CONTEXT.md), modifying UnifiedGameSettings is OUT OF SCOPE because it would risk regressing notes-master/ear-training games during a Phase-34-rhythm-only milestone. The right time to fix this is a future "shared setup screen responsive milestone" that explicitly covers all consumers.

Plan 34-09 Task 1 4-quadrant DevTools sweep on `/rhythm-mode/metronome-trainer` (375x667, 667x375, 768x1024, 1024x768) found NO functional issues — setup screen rendered correctly at all 4 viewports. UAT row 113 (RhythmGameSetup fails across 4 quadrants) is reclassified as a false positive: the original UAT marker did not survive direct visual verification. No specific UnifiedGameSettings issues observed during this investigation.

Tracked for: future v3.5+ "Shared Setup Screens Responsive" milestone (only if real issues surface in subsequent UAT cycles — current investigation found none).

### RhythmGameSettings dead code

`src/components/games/rhythm-games/components/RhythmGameSettings.jsx` is a fully-built modal component (glass-converted in Plan 05 per D-18) with ZERO consumer call sites. It is re-exported through `components/index.js` but no rhythm game wrapper opens it as a settings cog. UAT row 114 marks it as failing across all 4 quadrants because the verifier could not reach it from any rhythm game UI.

Marked `@deprecated` in Plan 09 Task 3 (commit `3bdad26`) with traceability to this entry. Removable in a future cleanup pass.

Tracked for: tech-debt cleanup pass (potential v3.5+ "Component Cleanup" or as part of the next rhythm milestone touching settings UI).

### MetronomeTrainer setup-phase wrapper

Plan 09 Task 1 classified as: **Class C — visually awkward only / no actual blocker**.

Verifier walked all 4 DevTools quadrants on `/rhythm-mode/metronome-trainer` and reported "all 4 look good" — no clipping, no overflow, no functional breakage. Confirms the structural prediction from pre-checkpoint code review: MetronomeTrainer.jsx line 1308 returns `<RhythmGameSetup>` bare (no wrapper container), so a Class A wrapper-level fix is not even possible. UAT row 113 reclassifies as **pass-with-note** in the Plan 10 UAT delta walkthrough.

No file edit applied to MetronomeTrainer.jsx (Class C → no-op per plan).
