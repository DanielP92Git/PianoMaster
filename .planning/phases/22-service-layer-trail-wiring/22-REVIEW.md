---
phase: 22-service-layer-trail-wiring
reviewed: 2026-04-08T12:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/contexts/AudioContextProvider.jsx
  - src/components/games/rhythm-games/MetronomeTrainer.jsx
  - src/data/skillTrail.js
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-04-08T12:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed three files changed in phase 22 gap closure plans (22-05 and 22-06):

1. **AudioContextProvider.jsx** -- Added `micEverRequestedRef` guard to prevent false `isInterrupted` overlay when mic was never requested (e.g., pulse exercise). The change is clean and well-scoped. The ref is set in `requestMic()` and consumed in the `visibilitychange` handler, correctly distinguishing between "mic was never requested" (no overlay needed) and "mic was requested but tracks died" (overlay needed).

2. **MetronomeTrainer.jsx** -- Substantial pulse exercise rework: gesture gate always shown for pulse mode, overlay priority fix, continuous looping metronome replaces fixed-count scheduling, first-tap-triggers-bar-completion flow with snap-to-nearest-beat logic and partial-bar scoring. The logic is complex but well-commented. Two warnings found related to unguarded setTimeout callbacks.

3. **skillTrail.js** -- RHYTHM_2/3/4 section headers updated to match redesigned unit content. Pure data change, no logic concerns.

## Warnings

### WR-01: Unguarded setTimeout callbacks in pulse handleTap may fire after unmount

**File:** `src/components/games/rhythm-games/MetronomeTrainer.jsx:1187-1193`
**Issue:** When the user taps in pulse mode, two `setTimeout` calls schedule `stopContinuousMetronome()` and `evaluatePerformance()` at measure end. If the user navigates away (unmount) before these fire, they will execute against stale state, calling `setGamePhase`, `setSessionStats`, etc. on an unmounted component. React 18 suppresses the warning but the callbacks still run unnecessarily. The same pattern exists in the normal mode branch (lines 1264-1278) and is pre-existing, but the new pulse branch duplicates it without cleanup.
**Fix:** Store timeout IDs in a ref and clear them on unmount (or on game reset). For example:

```javascript
// Add ref at component level
const pendingTimeoutsRef = useRef([]);

// In handleTap, track timeouts
const t1 = setTimeout(() => { stopContinuousMetronome(); }, ...);
const t2 = setTimeout(() => { evaluatePerformance(); }, ...);
pendingTimeoutsRef.current.push(t1, t2);

// In cleanup effect or resetGame
pendingTimeoutsRef.current.forEach(clearTimeout);
pendingTimeoutsRef.current = [];
```

### WR-02: Pulse mode mutates patternInfoRef pattern array, affecting subsequent evaluatePerformance scoring

**File:** `src/components/games/rhythm-games/MetronomeTrainer.jsx:1172-1179`
**Issue:** When the user taps mid-bar in pulse mode, the code creates a `reducedPattern` by spreading the original pattern (`[...pattern]`), then zeroing out beats before the first tap. This mutated copy is assigned back to `patternInfoRef.current.pattern`. While the spread prevents mutation of the original array, if `evaluatePerformance` is called multiple times (e.g., due to a race condition with the setTimeout), it will operate on the already-reduced pattern. More importantly, the `beatInMeasure * unitsPerBeat` calculation at line 1173 could produce an index larger than the pattern length if the modulo arithmetic yields an unexpected value (e.g., negative `nearestBeatNumber` on very early taps). The double-modulo guard on line 1142 handles negatives correctly for `beatInMeasure`, but the loop bound `beatInMeasure * unitsPerBeat` should be clamped to `reducedPattern.length`.
**Fix:** Add a bounds check:

```javascript
const reducedPattern = [...pattern];
const zeroEnd = Math.min(beatInMeasure * unitsPerBeat, reducedPattern.length);
for (let i = 0; i < zeroEnd; i++) {
  reducedPattern[i] = 0;
}
```

## Info

### IN-01: Hardcoded dir="rtl" on game container

**File:** `src/components/games/rhythm-games/MetronomeTrainer.jsx:1563`
**Issue:** The main game `<div>` has `dir="rtl"` hardcoded. This is pre-existing (not introduced in this phase) and is the only game component with this pattern. Other games inherit directionality from the app-level i18n setup. If the app is used in English (LTR), this will force RTL layout on the metronome game only.
**Fix:** Use the i18n direction context instead of hardcoding:

```javascript
const { i18n } = useTranslation();
// ...
<div dir={i18n.dir()}>
```

### IN-02: console.error calls in error paths

**File:** `src/components/games/rhythm-games/MetronomeTrainer.jsx:381,687,826,879,1386,1406`
**Issue:** Multiple `console.error` calls are present in error-handling paths. These are pre-existing and appropriate for development debugging, but may be noisy in production. Consider integrating with Sentry for production error reporting instead.
**Fix:** No action needed for this phase -- this is an existing pattern across the codebase. Consider a future pass to replace with Sentry `captureException` calls.

---

_Reviewed: 2026-04-08T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
