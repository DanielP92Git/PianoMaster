# Phase 33 — Deferred Items

Items discovered during plan execution but out-of-scope for the discovering plan.

## Pre-existing test failure (logged by 33-03 executor, 2026-05-03)

**Test:** `src/data/units/rhythmUnit8Redesigned.test.js > Combined-values node variety (DATA-04) > rhythm_2_4 (quarter-half + quarter-half-whole, durations q+h+w) produces q, h, and w over 20 samples`

**Status:** Failing on `main` BEFORE plan 33-03's changes (verified via `git stash` and re-run).

**Likely owner:** Plan 33-04 (commit `aa220c9 fix(33-04): D-12 remove rest-bearing patterns from quarter-half tag pool`). The DATA-04 variety test for `rhythm_2_4` may need a complementary update after the rest-pool cleanup reduced the pattern surface — `quarter-half-whole` patterns may no longer reliably hit `w` over 20 samples without an additional tag/pattern injection. Plan 33-04 should investigate.

**Out of scope for 33-03** (touched files: useEnsureAudioReady.js, useAudioEngine.js, RhythmDictationQuestion.jsx — no overlap with rhythm unit data files).
