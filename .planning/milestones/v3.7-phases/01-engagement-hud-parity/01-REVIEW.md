---
phase: 01-engagement-hud-parity
reviewed: 2026-07-09T20:28:58Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/contexts/SightReadingSessionContext.test.jsx
  - src/contexts/SightReadingSessionContext.jsx
  - src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx
  - src/components/games/sight-reading-game/SightReadingGame.jsx
  - src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-07-09T20:28:58Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This phase wires combo/on-fire engagement state into `SightReadingGame.jsx`, sourced from a
new `combo`/`isOnFire`/`incrementCombo`/`resetCombo` slice added to
`SightReadingSessionContext.jsx`. The actual diff is small and focused: context state +
reset wiring, two call sites (`incrementCombo()` on a correct note match,
`resetCombo()` on a recorded miss), a one-shot "on-fire splash" effect, and HUD render
additions (`ComboPill`, `OnFireBadge`, `OnFireSplash`). Core combo/on-fire lifecycle logic
(threshold-gated single transition, ref+state dual-tracking to avoid stale closures,
reset on `startSession`/`resetSession`) is sound and well covered by the new tests.

No critical/blocker-level issues were found — no security, data-loss, or crash-causing
defects in the reviewed diff. However, the review surfaced a real state-consistency gap
(combo/on-fire is not reset when the anti-cheat "guess penalty" flow aborts a performance),
an accessibility inconsistency in the new HUD markup, and a couple of test-quality gaps
worth tightening before this is considered fully done.

## Warnings

### WR-01: Combo/on-fire not reset when anti-cheat penalty aborts a performance

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx:726-770`
**Issue:** `abortPerformanceForPenalty()` (triggered by `registerGuessPenalty()` from
`trackFailedAttemptForAntiCheat()` / `registerKeyboardSpamAttempt()` when a player racks up
`ANTI_CHEAT_THRESHOLD` rapid failed inputs) stops the metronome, mic, and RAF timeline and
forces the game back to `GAME_PHASES.DISPLAY` — but never calls `resetCombo()`. If the
player had built a combo (or reached on-fire, combo ≥ 5) via legitimate correct notes
earlier in the exercise before triggering the guess-penalty, the `ComboPill`/`OnFireBadge`
in the header keeps showing the inflated combo and "ON FIRE!" state right through the
penalty modal and into the next attempt — even though the system just flagged the
player's input pattern as suspicious/cheating. This is inconsistent with the scoring side
of the penalty (which does deduct `guessPenaltyRef.current` from `overallScore`) and can
mislead players/parents about the legitimacy of the streak shown in the HUD.
**Fix:**

```javascript
const abortPerformanceForPenalty = useCallback(() => {
  if (penaltyLockRef.current) return;
  penaltyLockRef.current = true;
  stopMetronomePlayback();
  performanceTimeoutsRef.current.forEach((id) => clearTimeout(id));
  performanceTimeoutsRef.current = [];
  if (performanceTimelineRafRef.current) {
    cancelAnimationFrame(performanceTimelineRafRef.current);
    performanceTimelineRafRef.current = null;
  }
  rhythmPlayback.stop();
  audioEngine.stopScheduler();
  if (inputMode === "mic") {
    stopListeningRef.current();
  }
  micEarlyWindowStartRequestedRef.current = false;
  pendingMicLatencyMsRef.current = null;
  setTimingState(TIMING_STATE.OFF);
  resetCombo(); // keep HUD consistent with the penalty just applied to the score
  setGamePhase(GAME_PHASES.DISPLAY);
}, [audioEngine, inputMode, rhythmPlayback, stopMetronomePlayback, resetCombo]);
```

### WR-02: OnFireBadge wrapper missing an ARIA role (inconsistent with adjacent ComboPill wrapper)

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx:3639-3646`
**Issue:** The new HUD markup wraps `ComboPill` in `<div role="status" aria-label={t("games.engagement.combo")}>`, which correctly exposes an accessible name via a live-region role. The adjacent `OnFireBadge` wrapper, however, only sets `aria-label` with no `role`:

```jsx
{
  isOnFire && (
    <div aria-label={t("games.engagement.onFire")}>
      <OnFireBadge active={isOnFire} />
    </div>
  );
}
```

A plain `<div>` has the implicit ARIA role `generic`, and `aria-label` on a `generic`-role element is not guaranteed to be exposed in the accessible-name computation by real assistive technology (unlike `role="status"`/`role="img"` etc.). `getByLabelText` in the test suite still matches it because Testing Library queries the DOM attribute directly, not simulated AT output, so this gap won't be caught by the existing tests. This directly affects the HUD-03 requirement (on-fire state should be announced), and is inconsistent with the pattern used one line below for the combo pill.
**Fix:**

```jsx
{
  isOnFire && (
    <div role="status" aria-label={t("games.engagement.onFire")}>
      <OnFireBadge active={isOnFire} />
    </div>
  );
}
```

### WR-03: Missing assertion — combo.test.jsx test claims to verify OnFireSplash but never checks it

**File:** `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx:318-333`
**Issue:** The test titled `"renders ComboPill + OnFireBadge + OnFireSplash at combo >= 5 and on-fire"` only asserts on the `ComboPill` text content and the `OnFireBadge`'s `aria-label` ("ON FIRE!"). It never queries for the `OnFireSplash` overlay (which the test name explicitly claims to cover). Since `OnFireSplash` renders an `<img alt="">` with no accessible name and no `data-testid`, there is currently no way for this test to actually verify it — meaning the fire-splash trigger path (`showFireSplash` state + the `useEffect` watching `isOnFire`'s false→true transition in `SightReadingGame.jsx`) is untested despite the test's name implying otherwise.
**Fix:** Either add a `data-testid="fire-splash"` (or similar) to `OnFireSplash`'s root `motion.div` so tests can assert on its presence, or rename the test to accurately reflect what it verifies, and add a follow-up test that explicitly asserts the splash appears (e.g., via `container.querySelector` or a testid) and disappears after the 1.5s timeout.

## Info

### IN-01: ON_FIRE_THRESHOLD not exported — tests hardcode the magic number

**File:** `src/contexts/SightReadingSessionContext.jsx:12,192-195`
**Issue:** `ON_FIRE_THRESHOLD = 5` is defined locally in `SightReadingSessionContext.jsx` (with a comment noting it deliberately mirrors `NotesRecognitionGame`'s constant) but is not added to the exported `SIGHT_READING_SESSION_CONSTANTS` object. Both `SightReadingSessionContext.test.jsx` (`clickIncrement(4)` / `clickIncrement(1)`) and `SightReadingGame.combo.test.jsx` (mock hook: `if (next >= 5) setIsOnFire(true)`) hardcode the literal `5` instead of importing the real threshold. If the threshold is ever changed in one place, these tests will silently keep asserting the old value instead of failing loudly or updating automatically.
**Fix:**

```javascript
export const SIGHT_READING_SESSION_CONSTANTS = {
  TOTAL_EXERCISES_PER_SESSION,
  DEFAULT_MAX_SCORE_PER_EXERCISE,
  ON_FIRE_THRESHOLD,
};
```

Then import and reuse `ON_FIRE_THRESHOLD` in both test files instead of the literal `5`.

---

_Reviewed: 2026-07-09T20:28:58Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
