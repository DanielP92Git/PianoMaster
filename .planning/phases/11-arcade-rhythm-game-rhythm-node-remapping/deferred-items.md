# Deferred Items — Phase 11

## Pre-existing Test Failures (out of scope for 11-03)

**Files:**
- `src/data/units/rhythmUnit7Redesigned.test.js` — test "all exercises use RHYTHM type" fails
- `src/data/units/rhythmUnit8Redesigned.test.js` — test "all exercises use RHYTHM type" fails

**Root cause:** Plan 02 remapped all rhythm unit nodes from all-RHYTHM to mixed exercise types (RHYTHM/RHYTHM_TAP/RHYTHM_DICTATION/ARCADE_RHYTHM). The test files for rhythmUnit7 and rhythmUnit8 still assert `exercise.type === EXERCISE_TYPES.RHYTHM` for ALL exercises — these need to be updated to reflect the new mixed type distribution.

**Impact:** Build still passes (prebuild runs `verify:trail`, not the test suite). These tests need to be updated to match the new data structure from Plan 02.

**Resolution:** Update the test expectations in both files to check for the D-12 distribution pattern (3x RHYTHM + 2x RHYTHM_TAP + 1x RHYTHM_DICTATION + 1x ARCADE_RHYTHM per unit) instead of asserting all RHYTHM.

## Trail Config → Game Difficulty Mapping (discovered during 11-03 UAT)

**Issue:** Trail node configs use `difficulty: 'easy'` but the RhythmPatternGenerator only knows `'beginner'`, `'intermediate'`, `'advanced'`. When `'easy'` is passed, curated patterns return null (no `easy` key) and generated patterns fall back to `beginner` rules.

Additionally, the `rhythmPatterns` field (e.g., `['quarter']`, `['quarter', 'half']`) in node exercise configs is never read by any game component — MetronomeTrainer, RhythmReadingGame, and RhythmDictationGame all pass only `difficulty` and `timeSignature` to `getPattern()`.

**Impact:** Rhythm trail nodes may show patterns that are too complex for their intended difficulty level. For example, rhythm_1_1 (intended: quarter notes only) may show half notes because `beginner` allows both quarters and halves.

**Scope:** Affects all rhythm trail nodes across all 8 units. Not specific to the remapping — predates Plan 11-02.

**Resolution:** Map trail difficulty vocabulary to generator levels AND/OR use `rhythmPatterns` field to constrain `getPattern()` output. Should be addressed in a future phase.
