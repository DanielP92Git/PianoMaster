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
