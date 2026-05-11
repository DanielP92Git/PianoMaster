# Phase 35 — Deferred Items

Issues discovered during execution that are out of scope for this phase. Track here, do NOT fix.

## Lint

### `src/components/settings/ParentZoneEntryCard.test.jsx:32:42` — Pre-existing parse error

**Discovered during:** Plan 35-02 verification (`npm run lint`)

**Error:** `Parsing error: Cannot use keyword 'await' outside an async function`

**Why out of scope:** File is unrelated to Phase 35 (ArcadeRhythmGame portrait spike). The error is pre-existing in the codebase (last touched by commit `40df51d test(phase-06): add Nyquist validation tests for parent portal`). It exists independently of any changes in Plan 35-02 — the modified file `ArcadeRhythmGame.jsx` produces zero new lint warnings or errors.

**Recommendation:** Fix as part of a dedicated test-hygiene plan or whenever Phase 06 parent-portal tests are next touched.

## Tests

### 4 test files fail with `Missing VITE_SUPABASE_URL environment variable`

**Discovered during:** Plan 35-02 verification (`npm run test:run`)

**Failing files:**

- `src/components/games/notes-master-games/NoteSpeedCards.test.js`
- `src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js`
- `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx`
- (+ 1 other env-related)

**Why out of scope:** Verified pre-existing by re-running with `git stash` (Plan 35-02 changes removed) — same failure occurs. The worktree does not have a `.env` file (untracked, not copied by worktree creation), so `src/services/supabase.js` throws at import time for any test file that transitively imports it. The plan-scope file (`ArcadeRhythmGame.jsx`) does NOT import `supabase.js`; all 12 `ArcadeRhythmGame.test.js` tests pass.

**Recommendation:** Either (a) make `supabase.js` tolerant to missing env vars during tests, (b) ensure worktree creation copies `.env`, or (c) add Vitest-level env defaults in `src/test/setupTests.js`.
