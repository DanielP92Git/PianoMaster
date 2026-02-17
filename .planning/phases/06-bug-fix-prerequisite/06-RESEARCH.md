# Phase 06: Bug Fix Prerequisite - Research

**Researched:** 2026-02-17
**Domain:** React mic lifecycle, Vitest/RTL test infrastructure, kid-friendly overlay UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Kid-friendly, encouraging tone for error messages (Claude drafts wording)
- Two distinct error messages: "permission denied" vs "mic stopped working"
  - Permission denied: primary action is "Back to Menu" (since retry won't help)
  - Mic stopped: primary action is "Try Again"
- Full overlay pauses the game — semi-transparent so game state is visible behind it
- Two buttons: "Try Again" (primary) and "Back to Menu" (secondary) — primary/secondary flips based on error type
- No sound or haptic feedback when overlay appears — avoid startling kids
- Both English and Hebrew translations for all error messages
- Same overlay shown on repeated failures — consistent, predictable experience for kids
- No cooldown between retry attempts — immediate retry allowed
- Retry count hidden from user — avoid discouraging kids
- After exhausting retry limit: remove "Try Again", show only "Back to Menu" with helpful message
- Spinner/animation shown during reconnection attempt so kid knows something is happening
- Game resumes exactly where it stopped — same note/question on screen
- All scores and progress from before failure are preserved
- Brief "Mic is ready!" confirmation shown after successful retry (1-2 seconds)
  - Appears in the same overlay (transitions from error state to success state, then dismisses)
  - No countdown or mic test — keeps it fast
- Mic level indicator (volume meter bar) appears in top corner after recovery, fades after 3-5 seconds
- Game timer pauses during the error overlay (if applicable to the game mode)

### Claude's Discretion

- Retry limit number (how many attempts before fallback)
- Exact wording of kid-friendly error messages
- Level of detail in permission-denied recovery instructions
- Cooldown between retry and re-enablement of Try Again button (if technically needed)
- Exact spinner/loading animation design
- Volume meter bar styling and exact position within top corner

### Deferred Ideas (OUT OF SCOPE)

- iOS Safari-specific mic recovery and permission messaging — Phase 09
- Mic level indicator as a permanent game UI feature (currently only shown briefly after recovery) — could be its own enhancement
- AudioWorklet for off-main-thread processing — Phase 10 (profiling-gated)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FIX-01 | Mic-restart regression fixed — "Try Again" reactivates mic correctly on second attempt (`SightReadingGame.micRestart.test.jsx` passes) | Root cause identified: test crashes before reaching the logic under test. Two bugs: (1) test missing `useLocation` mock + Router wrapper, (2) `micEarlyWindowStartRequestedRef` not reset on `replayPattern()`. Both are documented below with exact fix strategies. |
| FIX-02 | Mic listening guard uses synchronous ref instead of async React state to prevent race conditions | Root cause identified: `micIsListeningRef` is defined and synced via a `useEffect`, but the `useEffect` that enforces phase-specific mic behavior still reads the async React state `isListening`. Exact guard locations identified (lines 2900, 2923, 2937). Fix: replace `isListening` guard reads with `micIsListeningRef.current` inside those guards. |
</phase_requirements>

---

## Summary

Phase 06 fixes two tightly related mic lifecycle bugs in `SightReadingGame.jsx` and makes the existing failing test pass. The work splits into three sub-problems: (A) fix the test infrastructure so the component can render at all in JSDOM, (B) fix the actual runtime bug where `micEarlyWindowStartRequestedRef` is not reset by `replayPattern()` causing the second "Start Playing" click to skip `startListening()`, and (C) replace async React state reads with synchronous ref reads in mic guard code to eliminate the race condition window.

Additionally, the phase redesigns the existing basic `showMicPermissionPrompt` modal into a proper kid-friendly `MicErrorOverlay` component — with two error types, retry spinner, "Mic is ready!" success state, volume meter, and i18n translations. This overlay is a new standalone component that replaces the inline JSX at line 3449 in `SightReadingGame.jsx`.

The test infrastructure fix is the prerequisite: without a Router wrapper and `useLocation` mock, the test crashes before any mic logic runs. The runtime bug and race condition fixes can land together since they are in the same file and effect.

**Primary recommendation:** Fix the test first (add MemoryRouter wrapper + extend useLocation mock), then fix the runtime ref reset bug in `replayPattern()`, then swap in `micIsListeningRef.current` for async `isListening` reads in the guard effect, then build and integrate the new overlay component.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18 | Component and hook model | Already in use |
| Vitest | current | Test runner | Already in use (vitest.config.js) |
| @testing-library/react | current | `render`, `screen`, `act`, `fireEvent` | Already in use in the test file |
| react-router v7 | 7.7.0 | `MemoryRouter` for test wrapping | Built-in export, zero new deps |
| i18next | current | Translation strings for overlay | Already in use throughout app |
| Tailwind CSS | current | Overlay styling | Already in use, matches design system |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useRef` | React built-in | Synchronous mic guard | Replace async `isListening` reads in callback-level guards |
| `useState` | React built-in | Overlay state (error type, retry count, phase) | Drive overlay rendering |
| CSS animations (Tailwind `animate-spin`) | Tailwind | Spinner during reconnect | Built-in, zero new deps |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `MemoryRouter` wrapper in test | Full mock of `useLocation` | Both work; `MemoryRouter` is cleaner and tests real hook behavior. Mocking `useLocation` only would require spreading `location.state` stubs. `MemoryRouter` is preferred per React Router docs for test environments. |
| New `MicErrorOverlay` component file | Inline JSX in `SightReadingGame` | New file is better: easier to test in isolation, keeps SightReadingGame from growing further, matches existing component structure in `./components/` folder. |

**Installation:** No new packages required. All dependencies already exist in the project.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/games/sight-reading-game/
│   ├── SightReadingGame.jsx          # Bugs FIX-01, FIX-02 live here
│   ├── SightReadingGame.micRestart.test.jsx  # Test to be fixed
│   └── components/
│       └── MicErrorOverlay.jsx       # New component (replaces inline JSX at line 3449)
├── locales/
│   ├── en/common.json                # Add mic error keys here
│   └── he/common.json                # Add Hebrew translations here
```

### Pattern 1: Test Router Wrapping (Fix for test crash)

**What:** The test calls `render(<SightReadingGame />)` without a Router context, but the component calls `useLocation()` at line 152 which requires one. React Router v7 throws synchronously: `"useLocation() may be used only in the context of a <Router> component."`.

**Root cause:** The existing `vi.mock("react-router-dom", ...)` mock uses `vi.importActual` which passes through the real `useNavigate` implementation. This is patched to return `vi.fn()`, but `useLocation` is not patched — the real implementation requires Router context.

**Two valid fix strategies:**

Option A (Recommended) — Wrap with `MemoryRouter` from react-router:
```jsx
// Source: React Router v7 docs, testing patterns
import { MemoryRouter } from "react-router-dom";

render(
  <MemoryRouter initialEntries={[{ pathname: "/", state: null }]}>
    <SightReadingGame />
  </MemoryRouter>
);
```
This is clean, real, and doesn't require extending the vi.mock.

Option B — Extend the vi.mock to also mock `useLocation`:
```javascript
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null, pathname: "/" }),
  };
});
```
This avoids any Router wrapper. Works, but loses the guarantee that the hook behaves like the real one.

**Recommendation:** Option A (`MemoryRouter`) because it tests the component in a more realistic context. The mock already uses `vi.importActual`, so keeping real behavior for routing hooks is consistent.

**When to use:** Any test that renders a component using `useLocation`, `useNavigate`, `useParams`, or other router hooks from react-router v7.

### Pattern 2: Sync Ref Guard (Fix for FIX-02 race condition)

**What:** The phase-enforcement `useEffect` (lines 2895–2945) reads `isListening` — a React state value — to decide whether to call `stopListening()`. React state updates are async (batched), so there is a window where `isListening` is stale:

```
1. startListening() called (async, resolves after ~200–400ms on real devices)
2. setIsListening(true) queued in React state
3. gamePhase changes to DISPLAY (via setGamePhase)
4. Phase-enforcement effect fires
5. isListening is STILL false (update hasn't committed yet)
6. Guard `if (isListening) stopListening()` is skipped
7. stopListening() is never called — mic stays open during DISPLAY
```

The opposite race: mic start called, then immediately cancelled — `isListening` may momentarily be `true` in stale state from a previous run, causing a spurious `stopListening()` call.

**`micIsListeningRef` already exists** (line 843) and is synced via a `useEffect`. However, the sync `useEffect` itself is async relative to render. The correct pattern is to update the ref **inside the same functions that change listening state**.

**Correct fix:** Update `micIsListeningRef.current` synchronously inside `startListening` and `stopListening` calls, not via a secondary effect:

```javascript
// In usePitchDetection.js startListening:
setIsListening(true); // React state (async)
// Plus expose a way to read sync state, OR

// In SightReadingGame.jsx, create a local ref and set it:
const micIsListeningRef = useRef(false);

// Wrap startListening to also set the ref:
const startListeningWithRef = useCallback(async () => {
  micIsListeningRef.current = true; // synchronous, before await
  await startListening();
  // If startListening throws, reset:
  // (handled in catch blocks)
}, [startListening]);

const stopListeningWithRef = useCallback(() => {
  micIsListeningRef.current = false; // synchronous
  stopListening();
}, [stopListening]);
```

Then in the phase-enforcement effect, replace `isListening` reads with `micIsListeningRef.current`:

```javascript
// Line 2900 — currently:
if (isListening) { stopListening(); }
// Fix:
if (micIsListeningRef.current) { stopListeningWithRef(); }

// Line 2923 — currently:
timingStateRef.current !== TIMING_STATE.EARLY_WINDOW && isListening
// Fix:
timingStateRef.current !== TIMING_STATE.EARLY_WINDOW && micIsListeningRef.current

// Line 2937 — currently:
if (isListening) { stopListening(); }
// Fix:
if (micIsListeningRef.current) { stopListeningWithRef(); }
```

The effect dependency array must also be updated: remove `isListening` (since we no longer read it), which also removes the spurious re-run when `isListening` changes.

### Pattern 3: micEarlyWindowStartRequestedRef Reset (Fix for FIX-01 runtime bug)

**What:** `replayPattern()` (called by "Try Again") resets most state but does NOT reset `micEarlyWindowStartRequestedRef`. This flag gates whether the early-window mic warmup calls `startListening()`. On the second performance attempt:

```
1. First performance: EARLY_WINDOW fires → micEarlyWindowStartRequestedRef = true → startListening() called ✓
2. Performance ends → mic stopped → FEEDBACK phase
3. User clicks "Try Again" → replayPattern() → DISPLAY phase
   → micEarlyWindowStartRequestedRef is still true ← BUG
4. Second performance: EARLY_WINDOW fires → guard `if (!micEarlyWindowStartRequestedRef.current) return`
   → block executes → returns early → startListening() is NEVER called ✗
```

**The fix is a single line in `replayPattern()`:**

```javascript
const replayPattern = useCallback(() => {
  if (!currentPattern) return;

  stopCountInVisualization();
  stopMetronomePlayback();
  // ... other resets ...

  // ADD THIS: Reset mic warm-up flag so the next performance can start the mic
  micEarlyWindowStartRequestedRef.current = false;  // ← the fix
  pendingMicLatencyMsRef.current = null;

  setGamePhase(GAME_PHASES.DISPLAY);
}, [...]);
```

Note: `beginPerformanceWithPattern()` (line 2571) already resets the flag, but `replayPattern()` goes to `GAME_PHASES.DISPLAY` (not directly to COUNT_IN), so `beginPerformanceWithPattern()` is not invoked on the Try Again path. The flag must be reset in `replayPattern()` as well.

**Verify the fix covers both entry points to performance:**
- `replayPattern()` → DISPLAY → "Start Playing" → `beginPerformanceWithPattern()` (which resets flag again, redundantly but safely)
- `abortPerformanceForPenalty()` already resets the flag at line 659 — no change needed there

### Pattern 4: MicErrorOverlay Component

**What:** Replace the inline `showMicPermissionPrompt` block (lines 3449–3497) with a new dedicated component.

**Current state of the inline block:**
- Plain white modal, no kid-friendly styling
- Single error type: "Microphone Access Required"
- Two actions: "Try Again" (calls `startListening()`) and "Use Keyboard Instead"
- No retry count tracking, no spinner, no success state, no translations

**New component interface:**
```jsx
// src/components/games/sight-reading-game/components/MicErrorOverlay.jsx
<MicErrorOverlay
  errorType="permission_denied" | "mic_stopped" | null
  isRetrying={boolean}
  canRetry={boolean}         // false when retry limit reached
  onRetry={async () => {}}  // calls startListening, handles spinner, success state
  onBack={() => {}}          // navigate back to menu / switch modes
/>
```

**Overlay visual states:**
1. `errorType !== null && !isRetrying` — error message shown, buttons visible
2. `isRetrying === true` — spinner shown, buttons hidden/disabled
3. `successShown === true` (internal state, ~1.5s) — "Mic is ready!" shown, then auto-dismiss

**State tracking needed in SightReadingGame:**
```javascript
const [micError, setMicError] = useState(null);
// null | { type: 'permission_denied' | 'mic_stopped', retryCount: number }
const MIC_MAX_RETRIES = 3; // Claude's discretion; 3 gives kids reasonable chances
```

**Error type detection** (in catch block of `startListening()`):
```javascript
.catch((error) => {
  const isPermissionDenied =
    error?.name === 'NotAllowedError' ||
    error?.name === 'PermissionDeniedError' ||
    error?.message?.toLowerCase().includes('permission');

  setMicError({
    type: isPermissionDenied ? 'permission_denied' : 'mic_stopped',
    retryCount: (micError?.retryCount ?? 0) + 1,
  });
});
```

### Pattern 5: i18n Translation Keys

**Namespace:** `common` (existing namespace, matches `src/locales/en/common.json`)

**Keys to add:**
```json
{
  "micError": {
    "permissionDenied": {
      "title": "Microphone Needed!",
      "message": "We need to hear you play! Ask a grown-up to help enable the microphone.",
      "tryAgain": "Try Again",
      "backToMenu": "Back to Menu"
    },
    "micStopped": {
      "title": "Oops, the mic stopped!",
      "message": "Something went wrong with the microphone. Let's try again!",
      "tryAgain": "Try Again",
      "backToMenu": "Back to Menu"
    },
    "retrying": "Connecting microphone...",
    "success": "Mic is ready!",
    "noMoreRetries": "The microphone isn't responding. Ask a grown-up to check your browser settings."
  }
}
```

**Hebrew (`he/common.json`) — same structure, RTL-safe phrasing:**
```json
{
  "micError": {
    "permissionDenied": {
      "title": "צריך מיקרופון!",
      "message": "אנחנו צריכים לשמוע אותך מנגן! בקש מגדול לעזור להפעיל את המיקרופון.",
      "tryAgain": "נסה שוב",
      "backToMenu": "חזרה לתפריט"
    },
    "micStopped": {
      "title": "אופס, המיקרופון הפסיק!",
      "message": "משהו השתבש עם המיקרופון. בוא ננסה שוב!",
      "tryAgain": "נסה שוב",
      "backToMenu": "חזרה לתפריט"
    },
    "retrying": "מחבר מיקרופון...",
    "success": "המיקרופון מוכן!",
    "noMoreRetries": "המיקרופון לא מגיב. בקש מגדול לבדוק את הגדרות הדפדפן."
  }
}
```

### Anti-Patterns to Avoid

- **Reading async React state in sync decision paths:** The `isListening` state from `usePitchDetection` is set via `setIsListening(true/false)` inside async `startListening()`. Reading it in a `useEffect` that fires synchronously on phase change creates a window where the state is stale. Always use a ref for decisions that must reflect the current call-time reality, not the last committed render.
- **Resetting flags in only one code path:** `micEarlyWindowStartRequestedRef` was reset in `beginPerformanceWithPattern()` and `abortPerformanceForPenalty()` but not in `replayPattern()`. When adding guard flags, reset them in ALL exit paths from a performance.
- **Rendering without Router context in tests:** Any component that calls `useLocation()`, `useParams()`, or other router hooks must be wrapped in `MemoryRouter` (or have those hooks mocked) in tests. The current `vi.mock("react-router-dom", ...)` pattern using `vi.importActual` passes through real hook implementations.
- **Building inline error UI in large components:** The existing `showMicPermissionPrompt` inline block shows what happens when error UI grows ad hoc inside a 3500-line component. Extract to a dedicated component for testability and maintainability.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spinner during retry | Custom CSS spinner animation | Tailwind `animate-spin` | Already in project, no new dep |
| i18n translations | Hard-coded English strings | `useTranslation` from i18next | App already uses this; Hebrew is required |
| Router context in tests | Custom fake Router | `MemoryRouter` from react-router | Official testing pattern; zero config |
| Overlay backdrop | Custom click-outside logic | Fixed/inset-0 + z-50 Tailwind classes | Already used in existing overlays (e.g., penalty modal at line 3500) |

**Key insight:** Every infrastructure piece needed for this phase already exists in the project. No new dependencies required.

---

## Common Pitfalls

### Pitfall 1: MemoryRouter initialEntries and location.state

**What goes wrong:** `location.state` accessed in SightReadingGame returns null/undefined when wrapped with default `MemoryRouter`. The component reads `location.state?.nodeId`, `location.state?.exerciseIndex`, etc.

**Why it happens:** `MemoryRouter` defaults to `["/"]` with no state. The component reads trail navigation state from location and sets up auto-start logic based on it.

**How to avoid:** Pass `initialEntries` with explicit null state: `<MemoryRouter initialEntries={[{ pathname: "/", state: null }]}>`. This makes the null-coalescing in the component produce the expected defaults (`nodeId = null`, `nodeConfig = null`, etc.) and prevents the trail auto-start effect from triggering.

**Warning signs:** Auto-start `useEffect` fires unexpectedly in tests, `hasAutoConfigured.current` gets set prematurely.

---

### Pitfall 2: `micEarlyWindowStartRequestedRef` and the `beginPerformanceWithPattern` reset being redundant

**What goes wrong:** If you only reset the flag in `replayPattern()` and forget that `beginPerformanceWithPattern()` also resets it, future refactoring that changes the call order could introduce a double-reset in one path.

**Why it happens:** The flag is defensive infrastructure — there's no obvious "source of truth" for when it should be reset.

**How to avoid:** Document in code comments that both `replayPattern()` and `beginPerformanceWithPattern()` reset the flag. The `beginPerformanceWithPattern()` reset is the authoritative one (it runs just before the performance begins). The `replayPattern()` reset is an early reset to prevent edge cases where a stale flag could interfere. Both resets together are correct and safe.

---

### Pitfall 3: Removing `isListening` from the phase-enforcement effect dependency array

**What goes wrong:** When you switch guard reads from async `isListening` to synchronous `micIsListeningRef.current`, you should also remove `isListening` from the effect's dependency array. If you don't, the effect still re-runs on every `isListening` change — potentially calling `stopListening()` at the wrong time.

**Why it happens:** React's linting rules (`exhaustive-deps`) will flag the read of `micIsListeningRef.current` inside an effect and suggest adding it to deps. `useRef` objects don't cause re-renders so `micIsListeningRef` itself doesn't go in deps — only `micIsListeningRef.current` would, but refs are not reactive. Ignore the lint suggestion for the ref read.

**How to avoid:** After the fix, the effect should depend on `[gamePhase, inputMode, stopListeningWithRef]` (or whatever the wrapped stop function is called) — not `isListening`. Comment clearly that the ref read is intentional.

---

### Pitfall 4: Overlay `onRetry` triggering a second performance start

**What goes wrong:** The "Try Again" button in the overlay calls `startListening()` and then sets `gamePhase(GAME_PHASES.PERFORMANCE)`. But if `micEarlyWindowStartRequestedRef` is stale (true), the phase-enforcement effect might interpret the phase transition incorrectly.

**Why it happens:** The overlay retry path bypasses the normal `beginPerformanceWithPattern()` → COUNT_IN → EARLY_WINDOW flow. It goes directly to PERFORMANCE.

**How to avoid:** The overlay retry should reset `micEarlyWindowStartRequestedRef.current = false` before calling `startListening()`, for the same reason `replayPattern()` and `beginPerformanceWithPattern()` do. Also, after successful retry, transition to `GAME_PHASES.PERFORMANCE` (not DISPLAY) to resume where the kid was.

---

### Pitfall 5: Hebrew RTL and overlay layout

**What goes wrong:** The overlay shows with reversed button order in RTL mode — "Back to Menu" appears on the left visually (which is "start" in RTL), making it look like the primary action.

**Why it happens:** CSS `flex-direction: row` with logical buttons doesn't auto-reverse for RTL without `dir="rtl"` or Tailwind's `rtl:` variants.

**How to avoid:** Use Tailwind RTL variants (`rtl:flex-row-reverse`) or structure the HTML so the DOM order matches the logical priority (primary button first in DOM, visually last in LTR, visually first in RTL). Check `i18n.dir()` or the app's existing RTL approach.

---

## Code Examples

Verified patterns from codebase inspection:

### MemoryRouter Wrapper for Tests

```jsx
// react-router-dom re-export from react-router in this project
import { MemoryRouter } from "react-router-dom";

// Wrap the render call:
render(
  <MemoryRouter initialEntries={[{ pathname: "/", state: null }]}>
    <SightReadingGame />
  </MemoryRouter>
);
```

The project imports from `"react-router-dom"` (not `"react-router"` directly). React Router v7 re-exports everything through both package names. Verify: line 3 of SightReadingGame.jsx: `import { useNavigate, useLocation } from "react-router-dom"`.

### replayPattern() Fix (single-line)

```javascript
// In SightReadingGame.jsx, replayPattern() (line ~2218)
const replayPattern = useCallback(() => {
  if (!currentPattern) return;

  stopCountInVisualization();
  stopMetronomePlayback();
  setCurrentNoteIndex(0);
  setPerformanceResults([]);
  performanceResultsRef.current = [];
  setDetectedPitches([]);
  setTimingState(TIMING_STATE.OFF);
  guessPenaltyRef.current = 0;
  setSummaryStats(null);
  setShowPenaltyModal(false);
  penaltyLockRef.current = false;
  setScoreSubmitted(false);
  setScoreSyncStatus("idle");
  setShowKeyboard(inputMode === "keyboard");
  setExerciseRecorded(false);

  // ADDED: Reset mic warm-up flag so the next performance can start the mic.
  // Without this, micEarlyWindowStartRequestedRef stays true from the previous
  // run and the early-window guard skips startListening() on the next attempt.
  micEarlyWindowStartRequestedRef.current = false;
  pendingMicLatencyMsRef.current = null;

  setGamePhase(GAME_PHASES.DISPLAY);
}, [currentPattern, stopCountInVisualization, inputMode, stopMetronomePlayback]);
```

### Synchronous Ref Guard Wrappers

```javascript
// In SightReadingGame.jsx, near useMicNoteInput call (line ~831)
const micIsListeningRef = useRef(false);

// Wrap the returned functions to keep the ref in sync synchronously:
const startListeningSync = useCallback(async () => {
  micIsListeningRef.current = true;
  try {
    await startListening();
  } catch (err) {
    micIsListeningRef.current = false;
    throw err;
  }
}, [startListening]);

const stopListeningSync = useCallback(() => {
  micIsListeningRef.current = false;
  stopListening();
}, [stopListening]);

// Remove the effect that was syncing the ref:
// useEffect(() => { micIsListeningRef.current = Boolean(isListening); }, [isListening]);
// No longer needed — ref is maintained synchronously.

// In phase-enforcement effect (line ~2895), replace isListening reads:
useEffect(() => {
  if (inputMode !== "mic") {
    if (micIsListeningRef.current) { stopListeningSync(); }  // was: isListening
    return;
  }
  switch (gamePhase) {
    case GAME_PHASES.COUNT_IN:
      if (timingStateRef.current !== TIMING_STATE.EARLY_WINDOW
          && micIsListeningRef.current) {  // was: isListening
        stopListeningSync();
      }
      break;
    case GAME_PHASES.DISPLAY:
    case GAME_PHASES.FEEDBACK:
      if (micIsListeningRef.current) { stopListeningSync(); }  // was: isListening
      break;
    default:
      break;
  }
}, [gamePhase, inputMode, stopListeningSync]);
// isListening REMOVED from deps — ref reads are not reactive
```

Note: `startListeningSync` and `stopListeningSync` should be used everywhere in the file that currently calls `startListening()` and `stopListening()` directly — check all call sites.

### MicErrorOverlay Component Skeleton

```jsx
// src/components/games/sight-reading-game/components/MicErrorOverlay.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const SUCCESS_DISPLAY_MS = 1500;

export function MicErrorOverlay({ errorType, isRetrying, canRetry, onRetry, onBack }) {
  const { t } = useTranslation("common");
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle success state auto-dismiss
  const handleRetry = async () => {
    try {
      await onRetry(); // parent handles startListening + sets isRetrying
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // parent dismisses overlay by setting errorType to null
      }, SUCCESS_DISPLAY_MS);
    } catch {
      // parent updates errorType on failure; overlay stays visible
    }
  };

  if (!errorType) return null;

  const isPermission = errorType === "permission_denied";
  const ns = isPermission ? "micError.permissionDenied" : "micError.micStopped";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {showSuccess ? (
          <p className="text-center text-lg font-bold text-green-600">
            {t("micError.success")}
          </p>
        ) : isRetrying ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            <p className="text-center text-sm text-gray-600">
              {t("micError.retrying")}
            </p>
          </div>
        ) : (
          <>
            <h3 className="mb-2 text-center text-xl font-bold text-gray-900">
              {t(`${ns}.title`)}
            </h3>
            <p className="mb-4 text-center text-sm text-gray-600">
              {t(`${ns}.message`)}
            </p>
            {!canRetry && (
              <p className="mb-4 text-center text-xs text-gray-500">
                {t("micError.noMoreRetries")}
              </p>
            )}
            <div className={`flex gap-3 ${isPermission ? "flex-row-reverse" : ""}`}>
              {canRetry && (
                <button
                  onClick={handleRetry}
                  className="flex-1 rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700"
                >
                  {t(`${ns}.tryAgain`)}
                </button>
              )}
              <button
                onClick={onBack}
                className={`flex-1 rounded-xl px-4 py-3 font-semibold ${
                  isPermission || !canRetry
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {t(`${ns}.backToMenu`)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

### Volume Meter After Recovery

```jsx
// Brief volume meter in top corner, auto-fades after 3-5s
// Can use audioLevel from useMicNoteInput which already returns it
const [showVolumeMeter, setShowVolumeMeter] = useState(false);
const volumeMeterTimeoutRef = useRef(null);

// After successful retry, show volume meter
const onMicRecovered = () => {
  setShowVolumeMeter(true);
  volumeMeterTimeoutRef.current = setTimeout(() => {
    setShowVolumeMeter(false);
  }, 4000);
};

// Render (top-right corner, fading):
{showVolumeMeter && (
  <div className="fixed right-3 top-3 z-40 flex items-center gap-1.5 rounded-full bg-white/80 px-2 py-1 shadow-sm backdrop-blur-sm transition-opacity">
    <div
      className="h-2 rounded-full bg-green-500 transition-all duration-75"
      style={{ width: `${Math.min(100, audioLevel * 400)}%`, maxWidth: "64px", minWidth: "4px" }}
    />
    <span className="text-xs text-gray-600">mic</span>
  </div>
)}
```

Note: `audioLevel` is already returned by `useMicNoteInput` and available in the component.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sync ref guard using `useEffect` to sync | Sync ref updated at call time | This phase | Eliminates the render-cycle lag that creates the race window |
| Inline error modal in large component | Extracted `MicErrorOverlay` component | This phase | Testable, maintainable, matches component pattern |
| Single error message for all mic failures | Two messages: permission_denied vs mic_stopped | This phase | Kids get relevant context + correct primary action |

**Deprecated/outdated:**
- `showMicPermissionPrompt` state (boolean): replaced by `micError` state object (`null | { type, retryCount }`)
- Inline JSX block at lines 3449–3497: replaced by `<MicErrorOverlay />` component import

---

## Open Questions

1. **Where does "Back to Menu" navigate to?**
   - What we know: The current overlay switches to keyboard mode (`setInputMode("keyboard")` + `setGamePhase(GAME_PHASES.DISPLAY)`). The CONTEXT.md says "Back to Menu" should be the primary action for permission denied, implying navigation away from the game.
   - What's unclear: Does "Back to Menu" mean navigate to the trail/dashboard, or just go back to the SETUP phase?
   - Recommendation: Interpret "Back to Menu" as `setGamePhase(GAME_PHASES.SETUP)` (returns to the pre-game setup screen where kids can choose a different mode or try again). This is less disruptive than full navigation and avoids losing session context. If a `navigate(-1)` is preferred, use the existing `navigate` ref.

2. **Game timer pausing during overlay**
   - What we know: SightReadingGame uses `pauseTimer()` and `resumeTimer()` from `useSessionTimeout` (wrapped in a try/catch since context is optional). The timer already pauses during COUNT_IN, DISPLAY, and PERFORMANCE phases.
   - What's unclear: The `micError` overlay appears during PERFORMANCE phase (mic fails mid-game). The performance `setGamePhase` is NOT changed when the overlay appears — the phase stays as PERFORMANCE. Timer may not pause.
   - Recommendation: When showing `micError`, either (a) briefly transition gamePhase to a new `MIC_ERROR` pseudo-phase (complex), or (b) call `pauseTimer()` directly when setting `micError` state, and call `resumeTimer()` when clearing it. Option (b) is simpler and lower risk.

3. **Retry limit number**
   - Claude's discretion per CONTEXT.md.
   - Recommendation: 3 retries. First two give kids a fair chance at a transient failure. Third shows "only Back to Menu". This is consistent with standard UX retry patterns for children's apps.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection — `SightReadingGame.jsx` (3500+ lines), `usePitchDetection.js`, `useMicNoteInput.js`, `SightReadingGame.micRestart.test.jsx`, `vitest.config.js`, `vite.config.js`, `setupTests.js`
- Test execution output — `npx vitest run SightReadingGame.micRestart.test.jsx` — confirmed exact error: `"useLocation() may be used only in the context of a <Router> component."` at line 152
- `node -e "require('./node_modules/react-router/package.json').version"` — confirmed v7.7.0
- `node -e "Object.keys(require('./node_modules/react-router'))"` — confirmed `MemoryRouter` is available

### Secondary (MEDIUM confidence)

- React Router v7 testing patterns — `MemoryRouter` is the documented approach for unit testing components that use router hooks; confirmed by API inspection of available exports

### Tertiary (LOW confidence)

- Hebrew i18n wording — drafted by Claude based on context and the translation file structure; should be reviewed by a Hebrew speaker for naturalness and age-appropriateness

---

## Metadata

**Confidence breakdown:**
- FIX-01 test crash root cause: HIGH — confirmed by running the test and reading the exact error
- FIX-01 runtime bug root cause: HIGH — traced through `replayPattern()` → `micEarlyWindowStartRequestedRef` not reset → second performance skips `startListening()`
- FIX-02 race condition: HIGH — `micIsListeningRef` exists but is synced via effect (async), not at call time (sync); guard reads at lines 2900/2923/2937 confirmed
- MicErrorOverlay design: HIGH — based on locked decisions from CONTEXT.md
- i18n translation wording: MEDIUM (English) / LOW (Hebrew — needs native review)
- Retry limit (3): MEDIUM — reasonable heuristic, Claude's discretion

**Research date:** 2026-02-17
**Valid until:** 2026-03-19 (30 days, stable codebase)
