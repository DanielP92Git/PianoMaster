---
phase: 22
status: findings
depth: standard
files_reviewed: 19
findings: 9
critical: 0
high: 2
medium: 4
low: 3
reviewed_at: 2026-04-12T12:00:00Z
---

# Phase 22: Code Review Report

**Reviewed:** 2026-04-12T12:00:00Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Phase 22 wired a curated pattern library into 56 rhythm trail nodes via a new `RhythmPatternGenerator` module, replaced duration allowlists with pattern tags, added a `PULSE` exercise type, migrated all eight rhythm unit files, and extended the build validator with seven new validation passes.

The overall architecture is sound. The `RhythmPatternGenerator` is well-tested and Node-safe. The validator extension is thorough. The unit files are consistent and follow established conventions.

Two high-severity issues were found: a stale-closure bug in `MixedLessonGame` that can cause `pulse`/`rhythm_tap` questions to advance to the wrong next index, and an over-counting scoring bug in `ArcadeRhythmGame` where rest-tile entries are counted as hits when tallying pattern score. Four medium issues cover missing `gameState` guard for `rhythm_tap`/`pulse` flow control, validator blind spot for `boss` category nodes with `MINI_BOSS` nodeType, a timing precision issue in `PulseQuestion`, and a missing `pulse` routing case in `TrailNodeModal`. Three low-severity quality items round out the findings.

---

## High Issues

### HR-01: Stale `currentIndex` closure in `handleRhythmTapComplete` causes wrong question advancement

**File:** `src/components/games/rhythm-games/MixedLessonGame.jsx:289-305`

**Issue:** `handleRhythmTapComplete` is called by `RhythmTapQuestion` and `PulseQuestion` as their `onComplete` prop. Inside its `setTimeout` callback it reads `currentIndex` from its closure. Because `currentIndex` is a dependency of the `useCallback`, React will recreate the callback when `currentIndex` changes — but the callback ref passed to `RhythmTapQuestion`/`PulseQuestion` may already be stale if those child components cache the prop across renders. More critically, if a second tap completion fires (e.g. a double-callback edge case in `PulseQuestion`), the `currentIndex` captured in the timeout closure is the index at the time the timeout was created, not the time it fires. Comparing `questions[currentIndex].type` vs `questions[nextIndex].type` on line 297 will read the old index and could compute `typeChanged` incorrectly, causing a missed crossfade animation.

Additionally, because `handleRhythmTapComplete` does **not** call `setGameState(GAME_STATES.FEEDBACK)` before scheduling the timeout (unlike `handleSelect` on line 240), multiple calls can be queued if `PulseQuestion` fires `onComplete` more than once (not guarded by a phase check at the entry point of this callback).

**Fix:**

```jsx
const handleRhythmTapComplete = useCallback(
  (onTimeTaps, totalExpectedTaps) => {
    // Guard: only accept if still in progress
    if (gameState !== GAME_STATES.IN_PROGRESS) return;

    const isCorrect = onTimeTaps >= Math.ceil(totalExpectedTaps / 2);
    setResults((prev) => [...prev, isCorrect]);
    setGameState(GAME_STATES.FEEDBACK); // <-- add this

    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    feedbackTimerRef.current = setTimeout(() => {
      // Use functional updater pattern to read latest index
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= questions.length) {
          playVictorySound();
          setGameState(GAME_STATES.COMPLETE);
          resumeTimer();
          return prevIndex; // no change
        }
        const typeChanged =
          questions[nextIndex].type !== questions[prevIndex].type;
        if (typeChanged) setFadeKey((k) => k + 1);
        setCardStates(["default", "default", "default", "default"]);
        setFeedbackMessage("");
        setGameState(GAME_STATES.IN_PROGRESS);
        return nextIndex;
      });
    }, 500);
  },
  [
    gameState, // add gameState
    questions,
    playCorrectSound,
    playWrongSound,
    playVictorySound,
    resumeTimer,
  ]
);
```

---

### HR-02: `scoredRef.current.size` over-counts rests when tallying pattern score in `ArcadeRhythmGame`

**File:** `src/components/games/rhythm-games/ArcadeRhythmGame.jsx:617-624`

**Issue:** `scoredRef` is a `Set` of tile _array indices_, and both rest tiles and note tiles are added to it — rests are added in the RAF loop on line 453 (`scoredRef.current.add(idx)`) whenever a tile (including rest tiles) passes the hit zone, and the RAF loop only skips calling `handleMissFromRaf` for rests but still marks them as scored. At pattern end (line 617), `hitCount = scoredRef.current.size` includes these rest-tile entries. `nonRestCount = beatTimes.length` counts only note beats. This means `hitCount` can exceed `nonRestCount`, and `Math.round((hitCount / nonRestCount) * 100)` can exceed 100, giving inflated scores (e.g. a pattern with 3 notes and 5 rests where all pass would yield `8 / 3 * 100 = 267`). `Math.max(0, ...)` does not cap at 100.

**Fix:**

```jsx
// Count only scored non-rest tiles (not rests)
const hitCount = tilesRef.current.filter(
  (t) => !t.isRest && scoredRef.current.has(t.id ?? tilesRef.current.indexOf(t))
).length;
// Or more precisely: count scored tiles with beatIndex >= 0
const scoredNoteCount = [...scoredRef.current].filter(
  (idx) => tilesRef.current[idx] && !tilesRef.current[idx].isRest
).length;
const score = Math.min(
  100,
  Math.round((scoredNoteCount / Math.max(nonRestCount, 1)) * 100)
);
finishPattern(score);
```

Alternatively, cap the result: `Math.min(100, Math.max(0, Math.round(...)))`.

---

## Medium Issues

### MD-01: `validateGameTypePolicy` silently skips `boss_rhythm_*` mini-boss nodes (category: 'boss')

**File:** `scripts/validateTrail.mjs:562`

**Issue:** The game-type policy validator filters with `if (node.category !== 'rhythm') continue;`. All seven mini-boss nodes in rhythm units 1–7 (`boss_rhythm_1` through `boss_rhythm_7`) have `category: 'boss'` and `nodeType: NODE_TYPES.MINI_BOSS`. Because `MINI_BOSS` is in `MIXED_LESSON_TYPES`, policy requires these nodes to use `mixed_lesson` — and they do — but the validator never checks them. If a future edit accidentally changes one of these mini-boss nodes to use `arcade_rhythm`, the build validator will not catch it because the category filter skips them before the nodeType policy check is reached.

**Fix:**

```js
// Change the filter condition to include rhythm-family categories
if (node.category !== 'rhythm' && node.category !== 'boss') continue;
// Or more precisely: include any node that has a nodeType checked by the policy
if (!node.nodeType) continue;
const nodeType = node.nodeType;
if (!MIXED_LESSON_TYPES.has(nodeType) && !ARCADE_TYPES.has(nodeType)) continue;
```

---

### MD-02: `PulseQuestion` scheduling drift — `countInDurationMs` can be negative on slow devices

**File:** `src/components/games/rhythm-games/renderers/PulseQuestion.jsx:298-309`

**Issue:** The count-in duration is computed as:

```js
const countInDurationMs =
  (playingStartTime - audioEngine.getCurrentTime()) * 1000;
```

This value is computed at the time `startFlow` runs. If the device is slow or garbage-collects between `countInStartTime = audioEngine.getCurrentTime() + 0.1` and the `countInDurationMs` calculation, `countInDurationMs` could be less than the intended `countInBeats * beatDur * 1000`. The guard `Math.max(0, countInDurationMs)` at line 309 prevents a negative timeout, but in that case `playingStartTimeRef.current` is set to a time that has already passed — all user taps will be evaluated against beat positions that occurred in the past, resulting in near-zero `onTimeTaps` regardless of actual accuracy.

**Fix:** Lock in the durations at the top of `startFlow` before any async work:

```js
const beatDur = beatDuration.current;
const countInBeats = beatsPerMeasure;
const countInDurationMs = countInBeats * beatDur * 1000; // fixed, not relative to current time
const countInStartTime = audioEngine.getCurrentTime() + 0.1;
const playingStartTime = countInStartTime + countInBeats * beatDur;
// No recalculation of countInDurationMs after this point
setTimeout(
  () => {
    playingStartTimeRef.current = playingStartTime;
    setPhase(PHASES.PLAYING);
    // ...
  },
  Math.max(0, countInDurationMs)
);
```

---

### MD-03: `TrailNodeModal` has no routing case for `pulse` exercise type — navigates to wrong game

**File:** `src/components/trail/TrailNodeModal.jsx:306-357`

**Issue:** `navigateToExercise` has a `switch` on `exercise.type` that handles all types including `mixed_lesson` (line 352–354), but there is no case for `"pulse"`. `EXERCISE_TYPES.PULSE` was added in this phase and pulse questions are designed to be rendered _inside_ `MixedLessonGame` as a sub-type, not as a top-level exercise. However, `constants.js` includes `PULSE: "pulse"` in `EXERCISE_TYPES`, and the validator's `validateExerciseTypes` would accept a node with `exercise.type = "pulse"` as a top-level exercise type. If any node ever accidentally has `pulse` as its top-level exercise type and a user clicks it, the `default` case fires `console.error("Unknown exercise type:", exercise.type)` and navigation silently does nothing — the modal stays open with no feedback to the user.

The `getExerciseTypeName` helper on line 58–60 already handles `"pulse"` with a display name, which implies it was considered as a possible top-level exercise type. This inconsistency should be resolved: either route it to `mixed-lesson` or remove it from `getExerciseTypeName`.

**Fix:**

```js
case "pulse":
  // pulse is a MixedLesson sub-renderer; route to mixed-lesson if encountered top-level
  navigate("/rhythm-mode/mixed-lesson", { state: navState });
  break;
```

Or, document that `pulse` cannot appear as a top-level exercise type and add it to the validator's explicit exclusion list.

---

### MD-04: `binaryToVexDurations` does not validate that the pattern fills the expected measure length — silent truncation risk

**File:** `src/data/patterns/RhythmPatternGenerator.js:57-117`

**Issue:** The `binaryToVexDurations` function processes onsets greedily but has no assertion that the resulting `result` durations sum to `binary.length` in sixteenth-note slots. The `fillRests` helper has a `break` guard on line 140 to avoid an infinite loop when no rest fits, but this silently truncates the output — the returned `vexDurations` array may not sum to the measure length. For example, if `restCandidates` is empty (which can happen if `durations` contains only codes with no defined `REST_EQUIVALENT` mapping, such as `'qd'`), gaps between onsets cannot be filled and the output will be shorter than expected. VexFlow will then attempt to render an incomplete measure.

`'qd'` (dotted quarter) maps to `REST_EQUIVALENT.hd = 'hr'` (a half-rest, not a dotted-quarter-rest), which is a lossy approximation that may cause the slot sum to drift for patterns where the gap is exactly 6 slots.

**Fix:** Add a slot-sum assertion in debug/dev builds, and add `'qdr'` (dotted-quarter-rest) to both `DURATION_SLOTS` and `REST_EQUIVALENT`:

```js
const DURATION_SLOTS = {
  // ...existing...
  qdr: 6, // dotted-quarter-rest
};
const REST_EQUIVALENT = {
  // ...existing...
  qd: "qdr", // accurate rest equivalent (was: 'hr' which is 8 slots, not 6)
};
```

---

## Low Issues

### LW-01: `VEX_TO_OLD_NAME` mapping duplicated in two files without a shared constant

**Files:** `src/components/games/rhythm-games/ArcadeRhythmGame.jsx:46-57`, `src/components/games/rhythm-games/MixedLessonGame.jsx:32-43`

**Issue:** The `VEX_TO_OLD_NAME` mapping (VexFlow duration code → legacy pattern name) is defined identically in both `ArcadeRhythmGame.jsx` and `MixedLessonGame.jsx`. This is pure code duplication: if any new duration is added (e.g. `'8r'` → `'eighth-rest'`), both files must be updated in sync. Failure to keep them in sync could cause one game to produce `undefined` for a duration and then pass `"undefined"` as a pattern name to downstream functions.

**Fix:** Extract to a shared constant file (e.g. `src/components/games/rhythm-games/utils/durationMappings.js`) and import it in both game components.

---

### LW-02: Unused import in `ArcadeRhythmGame.jsx`

**File:** `src/components/games/rhythm-games/ArcadeRhythmGame.jsx:17`

**Issue:** `getPattern` and `TIME_SIGNATURES` are imported from `./RhythmPatternGenerator` (the local rhythm-games directory, not the data/patterns one). The comment on line 18 says "scoreTap not used — arcade game uses wider inline timing windows", which confirms that the local `RhythmPatternGenerator.getPattern` is still the call path (line 356: `await getPattern(timeSignatureStr, difficulty, rhythmPatterns)`). This is the old pre-phase-22 `RhythmPatternGenerator`, not the new `src/data/patterns/RhythmPatternGenerator.js`. `TIME_SIGNATURES` is used at line 85–91, so it is needed — but it is only being used for the local mapping in `getTimeSignatureObject`. If the old local `RhythmPatternGenerator` is still in place post-migration, its existence alongside the new one could create confusion and maintenance risk.

**Fix:** Verify whether `src/components/games/rhythm-games/RhythmPatternGenerator.js` (the old file) can be removed or consolidated. If `ArcadeRhythmGame` is intentionally using the old generator (e.g. because arcade mode has different pattern-selection needs), document the intentional dual-generator architecture in a comment.

---

### LW-03: `cleanupDoneRef` guard in `PulseQuestion` is not reset on remount — will skip cleanup on second mount

**File:** `src/components/games/rhythm-games/renderers/PulseQuestion.jsx:327-333`

**Issue:** `cleanupDoneRef` starts `false` and is set to `true` on the first unmount. In React StrictMode (development), components are mounted, unmounted, and remounted to detect side effects. On the second mount, `cleanupDoneRef.current` is already `true` (refs persist through remount cycles in StrictMode). When this second instance eventually unmounts, `cleanupDoneRef.current` is already `true` so `stopContinuousMetronome()` is never called, leaving oscillator intervals running.

This is a development-only issue in StrictMode but could mask real memory leaks during development testing.

**Fix:** Move the `cleanupDoneRef.current = false` reset to the beginning of the cleanup effect, or remove the guard entirely since `stopContinuousMetronome()` is idempotent (it only calls `clearInterval`/`clearTimeout`, which are safe to call on null/undefined IDs):

```js
useEffect(() => {
  return () => {
    stopContinuousMetronome(); // idempotent — safe to call unconditionally
  };
}, [stopContinuousMetronome]);
```

---

_Reviewed: 2026-04-12T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
