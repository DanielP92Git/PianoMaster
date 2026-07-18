---
phase: 03-adaptive-pedagogy
reviewed: 2026-07-12T00:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - src/components/games/sight-reading-game/__tests__/SightReadingGame.adaptive.test.jsx
  - src/components/games/sight-reading-game/__tests__/SightReadingGame.mastery.test.jsx
  - src/components/games/sight-reading-game/components/LevelUpCue.jsx
  - src/components/games/sight-reading-game/components/LevelUpCue.test.jsx
  - src/components/games/sight-reading-game/constants/adaptiveTiers.js
  - src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js
  - src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx
  - src/components/games/sight-reading-game/SightReadingGame.jsx
  - src/components/games/sight-reading-game/SightReadingGame.replay.test.jsx
  - src/components/games/sight-reading-game/utils/adaptiveEngine.js
  - src/components/games/sight-reading-game/utils/adaptiveEngine.test.js
  - src/components/games/VictoryScreen.jsx
  - src/contexts/SightReadingSessionContext.jsx
  - src/hooks/useVictoryState.js
  - src/locales/en/common.json
  - src/locales/he/common.json
  - src/services/skillProgressService.js
  - src/services/skillProgressService.test.js
  - supabase/migrations/20260712120000_add_note_mastery.sql
findings:
  critical: 2
  warning: 5
  info: 2
  total: 9
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-07-12
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

The pure-function core (`adaptiveEngine.js` — `computeNextTier`, `applyTierToSettings`,
`buildWeightedNotePool`) is well-designed, side-effect-free, and thoroughly unit-tested,
including sensible edge cases (clamping, dedup, cold-start). `skillProgressService.js`'s
new `note_mastery` merge logic has solid input validation (integer/non-negative/`correct
<= total` checks) and good test coverage. The migration is minimal and appropriately
scoped (no RLS changes needed since RLS is row-level).

However, two BLOCKER-level defects undermine the two headline goals of this phase:

1. **Weak-note targeting silently does nothing in production.** `buildWeightedNotePool`
   duplicates weak pitches in the `selectedNotes` array so a uniform-random pick favors
   them, but the actual pattern generator (`patternBuilder.js`, invoked by every
   `generatePattern()` call) deduplicates `selectedNotes` before doing its own uniform
   random pick. The duplication is discarded before it can have any effect. The Phase 03
   tests never catch this because they mock out `usePatternGeneration` entirely, so they
   only assert on the _argument_ passed to `generatePattern`, never on the actual
   generated pattern's pitch distribution.
2. **Session mastery accumulation leaks across "Play Again"/"Try Again".** The
   session-scoped `sessionMasteryRef` (and `baseAdaptiveSettingsRef`) are only reset
   inside `startGame`'s `!currentPattern` guard, but `handleStartNewSession` — wired to
   both VictoryScreen's "Play Again" and the sub-70% "Try Again" screen — calls
   `loadExercisePattern()` directly, never `startGame()`, and never nulls
   `currentPattern`. A student who plays a node twice in a row (a very common flow) will
   have exercise 1's already-persisted mastery counts silently re-merged into exercise
   2's mastery delta, double-counting `total`/`correct` in the DB.

Several WARNING-level design/consistency gaps compound the above (mastery data from
non-victory sessions is never persisted at all; a mid-session tempo change via the
gear-icon settings overlay is silently discarded by the next adaptive-tier computation).

## Critical Issues

### CR-01: Weak-note weighting is discarded by the pattern generator — the whole ADAPT-03/D-09/D-11 feature is a no-op

**File:** `src/components/games/sight-reading-game/utils/adaptiveEngine.js:86-108` (`buildWeightedNotePool`), consumed by `src/components/games/sight-reading-game/SightReadingGame.jsx:454-478` (`seedMasteryBiasedSettings`)

**Issue:** `buildWeightedNotePool` biases future note selection by _duplicating_ weak
pitches in the `selectedNotes` array (e.g. `["C4","C4","C4","D4"]`), on the assumption
that whatever downstream code picks a note from this array does so uniformly and thus
picks the duplicated pitch more often. That assumption is false: the actual pattern
generator, `src/components/games/sight-reading-game/utils/patternBuilder.js`, explicitly
deduplicates `selectedNotes` early on:

```js
// patternBuilder.js:264-270
.filter((pitch, index, self) => {
  const isDuplicate = self.indexOf(pitch) !== index;
  if (isDuplicate) {
    debugLog(`✗ Removed duplicate pitch: ${pitch}`);
  }
  return !isDuplicate;
});
```

and then picks notes uniformly from that already-deduplicated `availableNotes`/`notePool`
array (`patternBuilder.js:410-417`, `notePool[Math.floor(Math.random() * notePool.length)]`).
By the time a note is actually chosen, every trace of the weighting is gone — a pitch
duplicated 3x via `WEAK_NOTE_WEIGHT` has exactly the same selection probability as any
other pitch in the pool.

This silently defeats the entire cross-session weak-note-targeting feature this phase
was built to deliver (ADAPT-03, requirements D-09/D-11). The unit tests for
`buildWeightedNotePool` (`adaptiveEngine.test.js`) correctly verify the pure function in
isolation, and `SightReadingGame.mastery.test.jsx`'s "over-represented in exercise 1's
generated pool" test only asserts on the _array passed into_ the mocked
`generatePattern` spy — it never exercises the real `patternBuilder.js`, so the
dedup-defeats-weighting bug is invisible to the test suite.

**Fix:** Duplication-based weighting is fundamentally incompatible with a generator that
dedupes its input. Either:

- Change `buildWeightedNotePool` (or a new mechanism) to return per-pitch _weights_
  (`{ pitch, weight }`) and update `patternBuilder.js`'s note-selection step to do a
  weighted random pick instead of `Math.floor(Math.random() * notePool.length)`, or
- Have `seedMasteryBiasedSettings` bias selection via a separate channel that
  `patternBuilder.js` actually respects (and add an integration test that renders a real
  pattern via the true `generatePatternData` and asserts the weak pitch appears more
  often across many generated patterns).

Either way, add a regression test that does NOT mock `usePatternGeneration`/
`patternBuilder.js`, so this class of bug can't recur silently.

### CR-02: `sessionMasteryRef`/`baseAdaptiveSettingsRef` are never reset on "Play Again" / "Try Again", causing double-counted mastery persistence

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx:2732-2745` (`handleStartNewSession`), contract documented at `SightReadingGame.jsx:301-311`

**Issue:** The reset contract for the two Phase 03 session-scoped refs is explicit in the
code comments:

```js
// SightReadingGame.jsx:301-311
const baseAdaptiveSettingsRef = useRef(null);
// ...reset to {} at true session start (startGame's `!currentPattern` guard...)
const sessionMasteryRef = useRef({});
```

and is implemented only inside `startGame`:

```js
// SightReadingGame.jsx:3728-3738
if (!currentPattern) {
  baseAdaptiveSettingsRef.current = { ...currentSettings };
  sessionMasteryRef.current = {};
}
```

But `handleStartNewSession` — the handler wired to **both** VictoryScreen's "Play Again"
button (`onReset={handleStartNewSession}` at `SightReadingGame.jsx:3964`) and the
sub-70% "Try Again" button on the encouragement screen (`SightReadingGame.jsx:4023`) —
bypasses `startGame` entirely:

```js
// SightReadingGame.jsx:2732-2745
const handleStartNewSession = useCallback(() => {
  unlockMode();
  stopMetronomePlayback();
  resetSession();
  startSession();
  loadExercisePattern();   // <-- NOT startGame(); currentPattern is never nulled
}, [...]);
```

`resetSession()`/`startSession()` correctly reset `successStreakRef`/
`adaptiveTierIndexRef` (in `SightReadingSessionContext.jsx`), but nothing resets
`sessionMasteryRef.current` or `baseAdaptiveSettingsRef.current`. Since `currentPattern`
is non-null at this point (a pattern from the just-finished session is still loaded),
`startGame`'s reset gate is never re-armed.

Concretely: a student finishes a node (session 1, victory), the accumulated
`sessionMasteryRef` for session 1 is persisted via VictoryScreen ->
`updateExerciseProgress`/`updateNodeProgress`. The student clicks "Play Again" to
retry the same node. `sessionMasteryRef.current` **still contains session 1's totals**.
Every exercise result in session 2 is merged additively on top of that stale
accumulator (`handleNextExercise`, `SightReadingGame.jsx:2660-2671`). When session 2
also completes, its `sessionMastery` payload includes session 1's numbers _again_, and
the server-side merge (`skillProgressService.js` — pure per-pitch addition) adds them a
second time on top of the already-persisted values. `note_mastery.total`/`.correct`
become permanently inflated for every pitch practiced in session 1, corrupting the
exact statistic (per-pitch accuracy) the weak-note-targeting feature depends on. There
is no test coverage for this path (`handleStartNewSession`/"Play Again" is not exercised
in `SightReadingGame.mastery.test.jsx`).

**Fix:** Null `currentPattern` (and/or explicitly reset both refs) inside
`handleStartNewSession` before calling `loadExercisePattern()`, mirroring what
`returnToSetup` already does correctly:

```js
const handleStartNewSession = useCallback(() => {
  unlockMode();
  stopMetronomePlayback();
  resetSession();
  startSession();
  baseAdaptiveSettingsRef.current = null;
  sessionMasteryRef.current = {};
  loadExercisePattern();
}, [...]);
```

Add a test that completes a session, asserts the mastery persistence call, then clicks
"Play Again" and completes a second session, asserting the second call's
`sessionMastery` does NOT include session 1's counts.

## Warnings

### WR-01: Mastery data from non-victory ("encouragement") sessions is silently discarded

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx:964-965, 3958-4048`

**Issue:** `showVictoryScreen = isSessionComplete && isVictory` (>=70%). When a session
completes below 70%, `showEncouragementScreen` renders instead — a plain "keep going"
panel with no `VictoryScreen`, hence no call into `updateNodeProgress`/
`updateExerciseProgress`, hence `sessionMasteryRef.current` (all 10 exercises' per-note
correct/total counts) is thrown away entirely when the "Try Again" or "Back to Menu"
button is clicked. This is the pre-existing design for XP/trail persistence, but it now
also silently drops the mastery telemetry — and a struggling session (the case where
weak-note data is _most_ valuable) is exactly the case most likely to fall under 70%.

**Fix:** Consider persisting `note_mastery` independently of the XP/stars victory gate
(e.g., a lightweight fire-and-forget merge call on the encouragement screen mount), since
it's additive telemetry rather than a graded outcome and doesn't need the same
rate-limit/anti-farming protections as stars/XP.

### WR-02: Mid-session tempo changes via the settings gear are silently reverted by the next adaptive-tier computation

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx:3022-3027` (`handleApplySettings`), `2701-2710` (tier application), `3728-3738` (baseline capture)

**Issue:** `handleApplySettings` calls `startGame(newSettings)` with the user's manually
chosen tempo/rhythm from the in-game settings overlay. Because `currentPattern` is
already set, `startGame`'s `!currentPattern` guard is false, so
`baseAdaptiveSettingsRef.current` is **not** updated to the user's new settings — it
stays pinned to the original session-start baseline. On the very next "Next Exercise"
click, `applyTierToSettings` recomputes tempo from `baseAdaptiveSettingsRef.current`
(the stale baseline) + the current tier delta, silently discarding the tempo the user
just chose. A student/parent who deliberately slows the tempo down mid-session via the
gear icon will see it snap back one exercise later.

**Fix:** Either update `baseAdaptiveSettingsRef.current` when a mid-session settings
change is user-initiated (distinct from the "don't compound tier deltas" concern the
current comment addresses), or explicitly document/confirm this is accepted behavior and
surface it in the UI (e.g. a toast that gear-icon changes apply "for this exercise
only").

### WR-03: `handleStartNewSession`/`sessionMasteryRef` cross-cutting concern also affects `baseAdaptiveSettingsRef` semantics

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx:2732-2745`

**Issue:** Same root cause as CR-02: because `baseAdaptiveSettingsRef.current` also
isn't reset on "Play Again", a retried session's adaptive tempo baseline is whatever
tier the _previous_ session's `applyTierToSettings` last computed as `base` (actually
`baseAdaptiveSettingsRef.current` itself is never reassigned mid-session by
`handleNextExercise`, so it stays at session 1's original baseline — but this means
"Play Again" silently continues to use session 1's baseline tempo instead of
re-deriving from the node's authored default or the user's current `gameSettings`). This
is lower severity than CR-02 (no data corruption, just an inherited baseline), but is
part of the same fix — noted separately so the fix for CR-02 explicitly covers both refs.

### WR-04: Fragile positional fallback for the baseline tier instead of using the exported constant

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx:2701-2703`

**Issue:**

```js
const tier =
  ADAPTIVE_TIERS.find((tierDef) => tierDef.index === tierIndex) ??
  ADAPTIVE_TIERS[2];
```

`ADAPTIVE_TIERS[2]` happens to be the `index: 0` (baseline) tier today only because of
the array's current literal ordering in `constants/adaptiveTiers.js`. The module already
exports `BASELINE_TIER_INDEX = 0` for exactly this purpose, but it's unused anywhere in
the codebase (dead export). If `ADAPTIVE_TIERS` is ever reordered or extended, this
fallback silently resolves to the wrong tier with no type/lint error.

**Fix:**

```js
const tier =
  ADAPTIVE_TIERS.find((tierDef) => tierDef.index === tierIndex) ??
  ADAPTIVE_TIERS.find((tierDef) => tierDef.index === BASELINE_TIER_INDEX);
```

(import `BASELINE_TIER_INDEX` alongside the other adaptiveTiers constants already
imported at `SightReadingGame.jsx:77-82`).

### WR-05: `triggerLevelUpCue`'s `setTimeout` is untracked and never cleared on unmount

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx:314-317`

**Issue:**

```js
const triggerLevelUpCue = useCallback(() => {
  setShowLevelUpCue(true);
  setTimeout(() => setShowLevelUpCue(false), 1500);
}, []);
```

Every other timer/RAF in this file (count-in visualization, performance timeouts,
metronome, timing-feedback banner, etc.) is stored in a ref and explicitly cleared on
phase change/unmount. This one isn't. If the user navigates away (e.g. clicks "Back to
Trail" from a fast-completing node, or the trail-exercise `window.location.reload()`
path) within 1500ms of a tier escalation, the pending `setTimeout` fires
`setShowLevelUpCue` on an unmounted component.

**Fix:** Track the timeout in a ref (mirroring `timingFeedbackTimeoutRef`) and clear it
in the file's existing unmount cleanup effect.

## Info

### IN-01: No DB-level shape constraint on `note_mastery`

**File:** `supabase/migrations/20260712120000_add_note_mastery.sql:8-11`

**Issue:** `note_mastery` is added as an unconstrained `JSONB DEFAULT '{}'::jsonb`. All
shape validation (integers, `correct <= total`, non-negative) lives client-side in
`skillProgressService.js`. RLS restricts _who_ can write the row (the owning student),
but not _what_ they write — a compromised/modified client (or a direct API call bypassing
the app) could write arbitrary JSON into this column. This mirrors the existing
`stars`/`best_score` columns (also unconstrained), so it's consistent with the codebase's
existing risk posture rather than a regression, but is worth a CHECK constraint or
Postgres function-based validation trigger if `note_mastery` is ever used for anything
beyond client-facing UI biasing (e.g. teacher-facing reporting).

### IN-02: `applyTierToSettings`'s `widenNotes` branch dedupes any weight-encoded duplicates in `selectedNotes`

**File:** `src/components/games/sight-reading-game/utils/adaptiveEngine.js:59-61`

**Issue:**

```js
const selectedNotes = tier?.widenNotes
  ? [...new Set([...baseSelectedNotes, ...superset])]
  : baseSelectedNotes;
```

At non-widening tiers, `baseSelectedNotes` (which may contain weighted duplicates
from `buildWeightedNotePool`, per CR-01) is passed through unchanged; at widening tiers
(+1/+2), the `Set` dedupes it away. Even independent of CR-01 (where the duplication
never mattered downstream anyway), this is an internal inconsistency worth noting: the
weighting strategy behaves differently depending on which tier is active, which would be
surprising if CR-01 is fixed by making duplication-based weighting actually work.
Consider making `applyTierToSettings` weighting-strategy-agnostic once CR-01 is
addressed.

---

_Reviewed: 2026-07-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
