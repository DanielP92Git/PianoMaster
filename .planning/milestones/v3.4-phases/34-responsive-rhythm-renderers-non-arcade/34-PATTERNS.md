# Phase 34: Responsive Rhythm Renderers (Non-Arcade) — Pattern Map

**Mapped:** 2026-05-07
**Files analyzed:** 25 (4 NEW + 21 MODIFIED)
**Analogs found:** 25 / 25

## File Classification

### NEW files (4)

| New file                                                         | Role                     | Data flow                                 | Closest analog                                                                                                                                                                            | Match quality            |
| ---------------------------------------------------------------- | ------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `src/components/games/rhythm-games/utils/needsLandscape.js`      | utility (pure helper)    | transform                                 | `src/components/games/rhythm-games/utils/durationInfo.js` (pure data + helpers in same dir)                                                                                               | role + co-located analog |
| `src/components/games/rhythm-games/utils/needsLandscape.test.js` | test (vitest unit)       | request-response                          | `src/components/games/rhythm-games/utils/durationInfo.test.js` (same dir, vitest, pure helper)                                                                                            | exact                    |
| `src/contexts/NeedsLandscapeContext.jsx`                         | context provider + hooks | event-driven (mount/unmount declarations) | `src/contexts/SightReadingSessionContext.jsx` (provider + hook + thrown error if no provider)                                                                                             | exact                    |
| `src/contexts/NeedsLandscapeContext.test.jsx`                    | test (vitest + RTL)      | request-response                          | No `src/contexts/*.test.*` exists yet — fall back to `src/components/games/rhythm-games/__tests__/VisualRecognitionGame.test.jsx` for `vi.mock`, RTL `act()`, and provider-wrapped render | role-match               |

### MODIFIED files (21)

| File                                                                        | Role                     | Data flow                         | Current pattern (read first)                                                         | Change                                                                                               |
| --------------------------------------------------------------------------- | ------------------------ | --------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `src/App.jsx`                                                               | layout/router            | request-response                  | `LANDSCAPE_ROUTES` literal at lines 269-285                                          | Remove 7 rhythm paths                                                                                |
| `src/components/layout/AppLayout.jsx`                                       | layout                   | request-response                  | `gameRoutes` array (lines 18-32) + `<Outlet/>` mount                                 | Wrap children in `<NeedsLandscapeProvider>`                                                          |
| `src/hooks/useLandscapeLock.js`                                             | hook                     | event-driven (mount/unmount)      | Unconditional Android-PWA lock (line 36)                                             | Read `useNeedsLandscape()` and gate `screen.orientation.lock('landscape')` on it (D-19)              |
| `src/components/orientation/RotatePromptOverlay.jsx`                        | presentational component | request-response                  | Pure presentational (no gating)                                                      | No code change required by D-20; predicate stays in callers (see Pitfall 2 in RESEARCH)              |
| `src/hooks/useRotatePrompt.js`                                              | hook                     | event-driven                      | viewport+orientation+localStorage gate, no route awareness                           | No change to the hook itself; callers compose `legacyGate && ctxNeedsLandscape`                      |
| `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx`    | renderer                 | request-response                  | landscape-aware classes via `isLandscape` prop, fixed sizes                          | Add `useDeclareNeedsLandscape(false)`; bump tablet sizing                                            |
| `src/components/games/rhythm-games/renderers/PulseQuestion.jsx`             | renderer                 | event-driven (FSM)                | always 1 measure, `max-w-md`                                                         | Add `useDeclareNeedsLandscape(false)` (always 1 measure)                                             |
| `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx`   | renderer                 | event-driven (FSM)                | `flex w-full max-w-md flex-col gap-3` (line 261) — vertical stack                    | Replace with 2x2 grid + `useDeclareNeedsLandscape(needsLandscape(...))`                              |
| `src/components/games/rhythm-games/renderers/RhythmReadingQuestion.jsx`     | renderer                 | event-driven (FSM)                | `max-w-md` on staff (line 603), uses `RhythmStaffDisplay` with `measures` prop       | Add `useDeclareNeedsLandscape(needsLandscape(beats, ts, measures))`                                  |
| `src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx`         | renderer                 | event-driven (FSM)                | `max-w-md` TapArea (line 909)                                                        | Add `useDeclareNeedsLandscape(needsLandscape(...))`                                                  |
| `src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx`  | renderer                 | request-response                  | JS-driven `gridClass` (lines 52-54)                                                  | Replace with Tailwind `landscape:max-md:grid-cols-4` per D-06; add `useDeclareNeedsLandscape(false)` |
| `src/components/games/rhythm-games/renderers/VisualRecognitionQuestion.jsx` | renderer                 | request-response                  | JS-driven `gridClass` (lines 39-41)                                                  | Same as SyllableMatching                                                                             |
| `src/components/games/rhythm-games/RhythmDictationGame.jsx`                 | wrapper                  | event-driven (FSM)                | `useRotatePrompt()` + inline overlay (lines 63, 600, 632)                            | Compose context: `legacyGate && ctxNeedsLandscape`                                                   |
| `src/components/games/rhythm-games/RhythmReadingGame.jsx`                   | wrapper                  | event-driven (FSM)                | same inline pattern (lines 56, 1016)                                                 | Same                                                                                                 |
| `src/components/games/rhythm-games/MetronomeTrainer.jsx`                    | wrapper                  | event-driven (FSM)                | same inline pattern (lines 54, 1375)                                                 | Same                                                                                                 |
| `src/components/games/rhythm-games/VisualRecognitionGame.jsx`               | wrapper                  | event-driven (FSM)                | same inline pattern                                                                  | Same                                                                                                 |
| `src/components/games/rhythm-games/SyllableMatchingGame.jsx`                | wrapper                  | event-driven (FSM)                | same inline pattern (lines 46, 290, 322)                                             | Same                                                                                                 |
| `src/components/games/rhythm-games/MixedLessonGame.jsx`                     | wrapper (renderer-swap)  | event-driven (renderer crossfade) | same inline pattern + `key={\`${fadeKey}-${currentIndex}\`}` swap (line 604)         | Same; verify Pitfall 3 (RESEARCH)                                                                    |
| `src/components/games/rhythm-games/components/CountdownOverlay.jsx`         | supporting (overlay)     | request-response                  | `text-3xl` fixed (line 35)                                                           | Bump to `text-3xl md:text-5xl lg:text-6xl`                                                           |
| `src/components/games/rhythm-games/components/BossIntroOverlay.jsx`         | supporting (overlay)     | request-response                  | full-screen amber/gold motion overlay; auto-dismiss 2s                               | Responsive sanity only per D-11                                                                      |
| `src/components/games/rhythm-games/components/FloatingFeedback.jsx`         | supporting (feedback)    | event-driven                      | absolute, `text-3xl` (line ~85)                                                      | Bump to `text-3xl md:text-4xl`                                                                       |
| `src/components/games/rhythm-games/components/MetronomeDisplay.jsx`         | supporting               | request-response                  | `h-9 w-9 ... sm:h-10 sm:w-10` (lines 39-49)                                          | Bump to `md:h-12 md:w-12 md:text-base`                                                               |
| `src/components/games/rhythm-games/components/TapArea.jsx`                  | supporting               | event-driven                      | wrapped in `<div className="relative w-full max-w-md">` by callers                   | Change wrapper at call sites to `max-w-md md:max-w-2xl lg:max-w-3xl`                                 |
| `src/components/games/rhythm-games/components/RhythmGameSetup.jsx`          | supporting (setup)       | request-response                  | delegates to `UnifiedGameSettings`                                                   | Audit only; out-of-scope per D-10 unless audit finds rhythm-specific issue                           |
| `src/components/games/rhythm-games/components/RhythmGameSettings.jsx`       | supporting (modal)       | request-response                  | `bg-white text-gray-700 border-gray-300` light theme (lines 74, 85-90, 104, 114-117) | Glass conversion per D-18                                                                            |
| `src/components/games/rhythm-games/components/DictationChoiceCard.jsx`      | supporting (card)        | request-response                  | `min-h-[96px] w-full` flex card; VexFlow inside                                      | Verify card fits 2x2 cell sizing under new grid                                                      |

## Pattern Assignments

### `src/contexts/NeedsLandscapeContext.jsx` (NEW — context provider + hooks)

**Analog:** `src/contexts/SightReadingSessionContext.jsx`

**Why this is the closest match:** Both export a provider, define a context, and provide a hook that throws if used outside the provider. Both are co-located in `src/contexts/`. The Sight Reading context shows the project's idiomatic pattern: `createContext`, named provider, named hook, default-export the context, and the `eslint-disable react-refresh/only-export-components` comment for hook+provider co-location.

**Imports + provider skeleton** (SightReadingSessionContext.jsx lines 1-22):

```jsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

// ...

const SightReadingSessionContext = createContext(null);

export function SightReadingSessionProvider({ children }) {
  const [state, setState] = useState(() => createInitialState());
```

**Hook with null-check throw** (SightReadingSessionContext.jsx lines 139-148):

```jsx
// eslint-disable-next-line react-refresh/only-export-components -- context provider and hook are co-located by design; splitting would break encapsulation with no HMR benefit
export function useSightReadingSession() {
  const context = useContext(SightReadingSessionContext);
  if (!context) {
    throw new Error(
      "useSightReadingSession must be used within a SightReadingSessionProvider"
    );
  }
  return context;
}
```

**Project quirk:** SightReadingSession throws on missing provider; NeedsLandscape per RESEARCH spec uses a default-value object so `useNeedsLandscape()` is safe outside the provider (returns `false`). This is intentional — non-rhythm routes that don't have the provider mounted (none in the migrated tree, but safety-belt) should not crash. Match RESEARCH spec exactly:

```jsx
// from RESEARCH § Pattern 1
const NeedsLandscapeContext = createContext({
  needsLandscape: false,
  setNeedsLandscape: () => {},
});
```

---

### `src/contexts/NeedsLandscapeContext.test.jsx` (NEW — provider+hook integration test)

**Analog:** `src/components/games/rhythm-games/__tests__/VisualRecognitionGame.test.jsx` (no `src/contexts/*.test.*` exists yet)

**Reason:** This is the closest project pattern for testing a React context using vitest + @testing-library/react. Use `act()` from `@testing-library/react` to drive lifecycle.

**Test sketch (from RESEARCH § Pattern 1 + Wave 0 Gaps):**

```jsx
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  NeedsLandscapeProvider,
  useDeclareNeedsLandscape,
  useNeedsLandscape,
} from "./NeedsLandscapeContext";

const wrapper = ({ children }) => (
  <NeedsLandscapeProvider>{children}</NeedsLandscapeProvider>
);

it("declarer sets flag on mount, clears on unmount", () => {
  const reader = renderHook(() => useNeedsLandscape(), { wrapper });
  expect(reader.result.current).toBe(false);
  const declarer = renderHook(() => useDeclareNeedsLandscape(true), {
    wrapper,
  });
  // ... verify reader sees true; unmount declarer; verify reader sees false
});
```

---

### `src/components/games/rhythm-games/utils/needsLandscape.js` (NEW — pure helper)

**Analog:** `src/components/games/rhythm-games/utils/durationInfo.js` (same dir, similar pure-data + helpers shape)

**Why:** Both are pure utility modules in the rhythm-games utils directory, exporting named helpers. Look at how `durationInfo.js` defines a constant lookup + helper exports — same module shape recommended.

**Exact code template** (from RESEARCH § Pattern 2):

```js
const TOTAL_BEATS_THRESHOLD = 9; // see RESEARCH § needsLandscape Threshold Analysis

function parseTimeSignature(timeSig) {
  /* ... */
}
function getBeatsPerMeasure(timeSig) {
  /* ... */
}

export function needsLandscape(
  beats,
  timeSignature = "4/4",
  measures = undefined
) {
  if (typeof measures === "number" && measures > 0) {
    const totalBeats = measures * getBeatsPerMeasure(timeSignature);
    return totalBeats > TOTAL_BEATS_THRESHOLD;
  }
  if (!Array.isArray(beats) || beats.length === 0) return false;
  const sixteenthUnits = beats.reduce(
    (sum, b) => sum + (b?.durationUnits || 0),
    0
  );
  const totalBeats = sixteenthUnits / 4;
  return totalBeats > TOTAL_BEATS_THRESHOLD;
}
```

**Project quirk:** beats use `durationUnits` in sixteenth-note units (4 = quarter, 8 = half, 2 = eighth). This convention comes from `RhythmStaffDisplay` and `binaryPatternToBeats`. Don't redefine it here.

---

### `src/components/games/rhythm-games/utils/needsLandscape.test.js` (NEW — vitest unit test)

**Analog:** `src/components/games/rhythm-games/utils/durationInfo.test.js`

**Imports + describe/it pattern** (durationInfo.test.js lines 1-18):

```js
/**
 * needsLandscape.test.js
 *
 * Tests for needsLandscape helper covering measures-only, beats-array,
 * and edge-case paths per NOTATION-03 / RESEARCH § Pattern 2.
 */

import { describe, it, expect } from "vitest";
import { needsLandscape } from "./needsLandscape.js";

describe("needsLandscape helper", () => {
  describe("measures-only path", () => {
    it("returns false for 1 measure of 4/4 (4 beats)", () => {
      expect(needsLandscape(undefined, "4/4", 1)).toBe(false);
    });
    // ... see RESEARCH § NOTATION-03 Unit Test Sketch for full case list
  });
});
```

**Project quirk:** The full test sketch (in RESEARCH lines 561-660) is canonical — copy it verbatim. Threshold is **9 beats**. The test for `needsLandscape(undefined, "3/4", 3)` MUST be `false` (9 > 9 is false) — that case is the load-bearing reason for picking 9 over 8.

---

### `src/App.jsx` (MODIFIED — remove 7 rhythm paths)

**Current state** (lines 269-285):

```jsx
const LANDSCAPE_ROUTES = [
  "/notes-master-mode/notes-recognition-game",
  "/notes-master-mode/memory-game",
  "/notes-master-mode/sight-reading-game",
  "/rhythm-mode/metronome-trainer", // REMOVE
  "/notes-master-mode/note-speed-cards",
  "/rhythm-mode/rhythm-reading-game", // REMOVE
  "/rhythm-mode/rhythm-dictation-game", // REMOVE
  "/rhythm-mode/arcade-rhythm-game", // REMOVE (arcade — Phase 35 picks up later)
  "/ear-training-mode/note-comparison-game",
  "/ear-training-mode/interval-game",
  "/rhythm-mode/visual-recognition-game", // REMOVE
  "/rhythm-mode/syllable-matching-game", // REMOVE
  "/rhythm-mode/mixed-lesson", // REMOVE
];
```

**After:** 6 entries remain (notes-master 4 + ear-training 2). Per RESEARCH Pitfall 2, this means `OrientationController` will call `lockOrientation('portrait-primary')` for rhythm routes — the desired behavior per D-20.

**Project quirk (CLAUDE.md):** Per the dual-array trap, rhythm routes STAY in `gameRoutes` in `AppLayout.jsx`. Only `LANDSCAPE_ROUTES` loses them.

---

### `src/components/layout/AppLayout.jsx` (MODIFIED — wrap with provider)

**Current state** (lines 67-112):

```jsx
return (
  <div
    className={`min-h-screen ${backgroundClass} flex flex-col ${
      isHebrew ? "font-hebrew" : ""
    }`}
    dir={direction}
    lang={language}
  >
    {!isGameRoute && !isDashboard && !isTrailPage && (
      <Header ... />
    )}
    {!isGameRoute && (
      <div className="hidden xl:block"><Sidebar ... /></div>
    )}
    <main className={...}>
      <Outlet />
    </main>
    {!isGameRoute && <MobileTabsNav />}
  </div>
);
```

**Pattern from RESEARCH § Code Examples:**

```jsx
import { NeedsLandscapeProvider } from "../../contexts/NeedsLandscapeContext";
// ...
return (
  <div className={...}>
    <NeedsLandscapeProvider>
      {/* existing Header / Sidebar / main / MobileTabsNav children */}
    </NeedsLandscapeProvider>
  </div>
);
```

**Project quirk:** AppLayout wraps every routed page that has the rotate-prompt surface. Public routes (login, terms) and `/sight-reading-layout-harness` sit outside AppLayout (RESEARCH Pitfall 4) — those don't need the provider. Confirmed safe.

---

### `src/hooks/useLandscapeLock.js` (MODIFIED — D-19 conditional lock)

**Current state** (lines 13-72):

```js
export function useLandscapeLock() {
  useEffect(() => {
    if (!isAndroidDevice() || !isInStandaloneMode()) return;
    if (
      !document.documentElement.requestFullscreen ||
      !screen.orientation?.lock
    ) {
      console.warn(
        "Landscape lock not supported: missing fullscreen or orientation API"
      );
      return;
    }
    let didEnterFullscreen = false;
    const lockOrientation = async () => {
      try {
        await document.documentElement.requestFullscreen({
          navigationUI: "hide",
        });
        didEnterFullscreen = true;
        await screen.orientation.lock("landscape");
      } catch (error) {
        console.error("Orientation lock failed:", error);
      }
    };
    // ... fullscreenchange listener + cleanup
  }, []); // Run once on mount
}
```

**Change pattern (D-19):** Read `useNeedsLandscape()` and gate the actual `screen.orientation.lock('landscape')` call. The fullscreen entry can stay (it's harmless and matches expected gameplay), but the orientation lock should only fire when content needs landscape.

```js
import { useNeedsLandscape } from "../contexts/NeedsLandscapeContext";

export function useLandscapeLock() {
  const ctxNeedsLandscape = useNeedsLandscape();
  useEffect(() => {
    if (!isAndroidDevice() || !isInStandaloneMode()) return;
    if (!ctxNeedsLandscape) return; // D-19: only lock when content declares
    // ... existing fullscreen + lock logic
  }, [ctxNeedsLandscape]);
}
```

**Project quirk:** All 6 rhythm wrappers + ArcadeRhythmGame call `useLandscapeLock()` unconditionally today (RESEARCH Open Question 3). The hook itself becoming context-aware means callers don't change. Caveat: declaring effect re-runs when context flips means an Android PWA user mid-game who swaps from short to long content would get a fullscreen prompt mid-stride — verify in audit.

---

### `src/components/orientation/RotatePromptOverlay.jsx` (MODIFIED per CONTEXT, but per RESEARCH no code change)

**Current state:** Pure presentational component. Takes `onDismiss` callback, renders animated phone icon + dismiss button. **Does NOT gate visibility itself.**

**Per RESEARCH § Coexistence Strategy Reframing:** The overlay's visibility is gated entirely by callers. This file does NOT need code changes. Predicate change happens in 6 rhythm wrappers (see below).

**If planner sees CONTEXT D-14 saying "RotatePromptOverlay reads from context":** This is incorrect per RESEARCH. The overlay is presentational; the wrappers do the gating. Verify against `useRotatePrompt|RotatePromptOverlay` grep results which show the inline pattern.

---

### `src/hooks/useRotatePrompt.js` (NO MODIFICATION needed)

Per RESEARCH § Coexistence Strategy Reframing: hook stays unchanged. Composition lives in callers. Listed in CONTEXT for completeness but the planner should NOT touch this file.

---

### Rhythm renderers (7) — Common Pattern

#### `RhythmReadingQuestion.jsx`, `RhythmTapQuestion.jsx`, `PulseQuestion.jsx`, `RhythmDictationQuestion.jsx`

**Common pattern from RESEARCH § Code Examples (Renderer declaration):**

```jsx
import { useDeclareNeedsLandscape } from "../../../../contexts/NeedsLandscapeContext";
import { needsLandscape as computeNeedsLandscape } from "../utils/needsLandscape";

// Inside the component, after `beats` / pattern is loaded:
const declared = beats
  ? computeNeedsLandscape(
      beats,
      config.timeSignature || "4/4",
      config.measureCount || 1
    )
  : false;
useDeclareNeedsLandscape(declared);
```

**File-by-file specifics:**

- **`PulseQuestion.jsx`** — always 1 measure (`PULSE_BEATS` constant, `measures={1}` at line 738). Declare `false` unconditionally:
  ```jsx
  useDeclareNeedsLandscape(false);
  ```
- **`RhythmReadingQuestion.jsx`** (line 603) — uses `RhythmStaffDisplay` with `measures={config.measureCount || 1}`. Pass beats + ts + measures.
- **`RhythmTapQuestion.jsx`** (line 909) — same call shape as Reading.
- **`RhythmDictationQuestion.jsx`** — uses `correctBeats` and `config.timeSignature`. Cards themselves are short patterns; only the prompt-listening pattern matters.

**For `RhythmDictationQuestion.jsx` specifically — replace card grid (lines 260-275):**

```jsx
// BEFORE:
<div className="flex w-full max-w-md flex-col gap-3">
  {choices.map(...)}
</div>
```

Per D-06 (research recommends — but Dictation has 3 cards, not 4; planner should confirm whether 2x2 layout for 3 cards is viable, or keep `flex-col` for 3 cards). Note: D-07 only lists 4-card grids (Dictation has 3). Planner discretion.

#### `DiscoveryIntroQuestion.jsx`

**Current pattern (lines 183-204):** Has portrait/landscape branching via `isLandscape` prop with class-set variables (`wrapperClass`, `cardClass`, `svgClass`, etc.). Single card so D-07 grid pattern doesn't apply.

**RESEARCH recommendation (§ DiscoveryIntroQuestion Tablet Sizing):** Use fixed sizes for SVG: `h-40 w-28 md:h-56 md:w-40 lg:h-64 lg:w-44`.

**Declaration:** `useDeclareNeedsLandscape(false)` (always 1 card).

#### `SyllableMatchingQuestion.jsx` and `VisualRecognitionQuestion.jsx`

**Current pattern (SyllableMatching lines 52-54, identical in VisualRecognition lines 39-41):**

```jsx
const gridClass = isLandscape
  ? "grid grid-cols-4 gap-3 w-full max-w-2xl"
  : "grid grid-cols-2 gap-4 w-full max-w-sm";
```

**Replace with Tailwind (RESEARCH § Pattern 3, D-06):**

```jsx
<div className="grid w-full max-w-md grid-cols-2 gap-3 md:max-w-2xl md:grid-cols-2 md:gap-4 lg:max-w-4xl lg:grid-cols-2 lg:gap-6 landscape:max-md:grid-cols-4">
  {/* 4 cards */}
</div>
```

**Project quirk (RESEARCH Pitfall 5):** Tailwind purge. Class string MUST be a literal — no concatenation. Don't write `grid-cols-${n}`.

**Project quirk (SyllableMatching):** uses `getDurationSyllable` import for the 8_pair override (lines 19-22, 45-48). Don't break this when refactoring grid.

**Declaration:** `useDeclareNeedsLandscape(false)` for both. The cards themselves never need landscape; the existing 1x4 landscape branch is purely a presentation choice that the new Tailwind classes preserve.

---

### Rhythm wrappers (6) — Common Pattern

#### Files: `RhythmDictationGame.jsx`, `RhythmReadingGame.jsx`, `MetronomeTrainer.jsx`, `VisualRecognitionGame.jsx`, `SyllableMatchingGame.jsx`, `MixedLessonGame.jsx`

**Current pattern (verified via grep — present at every wrapper, line numbers per file):**

| File                        | Hook line | Inline overlay line |
| --------------------------- | --------- | ------------------- |
| `MixedLessonGame.jsx`       | 75        | 577, 619            |
| `RhythmReadingGame.jsx`     | 56        | 1016                |
| `MetronomeTrainer.jsx`      | 54        | 1375                |
| `RhythmDictationGame.jsx`   | 63        | 600, 632            |
| `SyllableMatchingGame.jsx`  | 46        | 290, 322            |
| `VisualRecognitionGame.jsx` | (similar) | (similar)           |

```jsx
// BEFORE
import { useRotatePrompt } from "../../../hooks/useRotatePrompt";
import { RotatePromptOverlay } from "../../orientation/RotatePromptOverlay";
// ...
const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();
// ...
{
  shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />;
}
```

**Modified gate (RESEARCH § Coexistence Strategy Reframing):**

```jsx
import { useNeedsLandscape } from "../../../contexts/NeedsLandscapeContext";
// ...
const { shouldShowPrompt: legacyGate, dismissPrompt } = useRotatePrompt();
const ctxNeedsLandscape = useNeedsLandscape();
const shouldShowPrompt = legacyGate && ctxNeedsLandscape;
// ...
{
  shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />;
}
```

**Per-wrapper specifics:**

- **`MixedLessonGame.jsx`** has TWO overlay instances (lines 577 + 619 — landscape branch + portrait branch). Both need the same treatment. Note the renderer-swap mechanism uses `key={\`${fadeKey}-${currentIndex}\`}` (line 604) — RESEARCH Pitfall 3 confirms this triggers unmount+remount in deterministic order, so context-flip flicker is non-issue.
- **`RhythmDictationGame.jsx`** also has two overlay instances (lines 600 + 632).
- **`SyllableMatchingGame.jsx`** also has two (lines 290 + 322).
- **MetronomeTrainer + RhythmReadingGame + VisualRecognitionGame** appear to have one each.

**Test mocks (existing pattern from `__tests__/SyllableMatchingGame.test.jsx` line 77 + `VisualRecognitionGame.test.jsx` line 79):**

```jsx
vi.mock("../../../../hooks/useRotatePrompt", () => ({
  useRotatePrompt: vi.fn(() => ({
    shouldShowPrompt: false,
    dismissPrompt: vi.fn(),
  })),
}));
```

Add a mock for the new context import in any test that exercises wrapper render.

---

### Supporting components (5) — Responsive sizing bumps

#### `CountdownOverlay.jsx`

**Current state (line 35):**

```jsx
<div className={`text-3xl font-bold ${colorClass} ${pulseClass} select-none`}>
```

**Change to:** `text-3xl md:text-5xl lg:text-6xl` per RESEARCH audit row.

#### `BossIntroOverlay.jsx`

**Current state:** Full-screen amber/gold motion overlay (lines 1-50 read). Auto-dismiss 2s. Reduced-motion + i18n + RTL already wired.

**Change scope (D-11):** Responsive sanity only. Verify text/icon don't clip at iPhone SE × portrait or iPad × landscape. NO visual treatment change. NO motion changes.

#### `FloatingFeedback.jsx`

**Current state (lines 75-85, derived from style object):**

```jsx
const baseStyle = {
  position: "absolute",
  left: "50%",
  // ...
};
// + className uses text-3xl
```

**Change:** Bump `text-3xl` → `text-3xl md:text-4xl`. The `position: absolute` over `TapArea` stays.

#### `MetronomeDisplay.jsx`

**Current state (lines 39-49):**

```jsx
className={`flex items-center justify-center rounded-full border-2 font-bold transition-all duration-150
  h-9 w-9 text-xs sm:h-10 sm:w-10 sm:text-sm
${isCurrentBeat ? ... : ...}`}
```

**Change:** Add `md:h-12 md:w-12 md:text-base` per RESEARCH audit row. Note current uses `sm:` not `md:` — RESEARCH explicitly flags this as the bug ("`sm:` not `md:` so tablets still small").

#### `TapArea.jsx`

**Current state:** TapArea itself has no `max-w-md`. Callers wrap it in `<div className="relative w-full max-w-md">`. See `RhythmTapQuestion.jsx` line 909, `RhythmReadingQuestion.jsx` line 623, `PulseQuestion.jsx` line 749.

**Change:** Three callers' wrapper divs need `max-w-md md:max-w-2xl lg:max-w-3xl`. TapArea internals stay.

---

### `RhythmGameSettings.jsx` (D-18 glass conversion)

**Current state (lines 70-160):** Uses `Modal` wrapper. Inside: `bg-white text-gray-700 border-gray-300` light theme on buttons (lines 74, 85-90, 104, 114-117, 128, 144).

**Glass pattern source (CLAUDE.md § Design System + DictationChoiceCard.jsx STATE_CLASSES lines 22-31):**

```jsx
// Container card
"bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

// Selected button (replaces bg-blue-500 text-white)
"bg-indigo-500/30 border-indigo-400 text-white";

// Unselected button (replaces bg-white text-gray-700 border-gray-300)
"bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/40";

// Label text (replaces text-gray-700)
"text-white/70";

// Range input track (replaces bg-gray-200)
"bg-white/15";
```

**Project quirk (RESEARCH Open Q1 + Assumption A4):** RhythmGameSettings is rendered inside `<Modal>` which may inject its own surface. Worth verifying in UAT before refactor. If the Modal already uses a dark surface, the legacy `bg-white` is the bug — convert. If Modal uses light surface, convert anyway because D-18 is locked.

---

### `RhythmGameSetup.jsx`

**Current state:** Delegates to `<UnifiedGameSettings>` (line 3 import, used in render). Phase 34 audit-only per D-10 unless rhythm-specific issue surfaces. Out of scope for fix; log issues for deferred follow-up.

---

### `DictationChoiceCard.jsx`

**Current state (lines 144-165):** Uses `flex min-h-[96px] w-full items-center justify-center p-3`. VexFlow renders inside a fixed `minHeight: "80px"` div.

**Change:** Verify the card fits 2x2 cell sizing under the new grid (when applied). If `RhythmDictationQuestion` keeps 3-card vertical stack (since D-06 grid only fits 4), no change needed here. If switching to 2x2, may need to drop `min-h-[96px]` or use `aspect-` modifier.

---

## Shared Patterns

### Pattern: Glass card container (CLAUDE.md § Design System)

**Source:** `src/components/games/rhythm-games/components/DictationChoiceCard.jsx` lines 22-31 (STATE_CLASSES.default)

**Apply to:** RhythmGameSettings (D-18 glass conversion); reference for any other audit-found light-theme components.

```jsx
"bg-white/10 backdrop-blur-md border border-white/20 rounded-xl";
// hover:
"hover:bg-white/20 hover:border-white/40 cursor-pointer transition-colors duration-150";
```

### Pattern: Tailwind quadrant grid (D-05/D-06)

**Source:** RESEARCH § Pattern 3

**Apply to:** SyllableMatchingQuestion, VisualRecognitionQuestion. Maybe DictationChoiceCard's parent grid (planner discretion — 3 vs 4 cards).

```jsx
"grid w-full max-w-md grid-cols-2 gap-3 md:max-w-2xl md:grid-cols-2 md:gap-4 lg:max-w-4xl lg:grid-cols-2 lg:gap-6 landscape:max-md:grid-cols-4";
```

### Pattern: Inline rotate-prompt gate composition (RESEARCH § Coexistence Strategy)

**Source:** existing inline pattern (verified across 6 wrappers via grep)

**Apply to:** All 6 rhythm wrappers exactly. Do NOT centralize into AppLayout (would break non-rhythm games).

```jsx
const { shouldShowPrompt: legacyGate, dismissPrompt } = useRotatePrompt();
const ctxNeedsLandscape = useNeedsLandscape();
const shouldShowPrompt = legacyGate && ctxNeedsLandscape;
{
  shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />;
}
```

### Pattern: Renderer mount-time declaration (D-15)

**Source:** RESEARCH § Pattern 1 + § Code Examples

**Apply to:** All 7 rhythm renderers. Each declares its own value (true/false based on `needsLandscape()` result for content-driven renderers; `false` literal for always-fits renderers).

### Pattern: vitest unit test for pure helper

**Source:** `src/components/games/rhythm-games/utils/durationInfo.test.js` lines 1-18

**Apply to:** `needsLandscape.test.js`. Use `import { describe, it, expect } from "vitest"` and a single top-level describe with nested describes per code path.

### Pattern: Provider + thrown-error hook (alternative: default-value hook)

**Source:** `src/contexts/SightReadingSessionContext.jsx` lines 139-148

**Apply to:** NeedsLandscapeContext — but use the **default-value variant** (not throw) per RESEARCH § Pattern 1, since non-rhythm parts of the tree may eventually consume `useNeedsLandscape()` safely.

## No Analog Found

None. All 25 files have a clear analog or are themselves the canonical reference for their pattern.

## Project-Specific Quirks (load-bearing)

1. **Dual-array trap (CLAUDE.md § Routing):** rhythm routes leave `LANDSCAPE_ROUTES` (App.jsx lines 269-285) but STAY in `gameRoutes` (AppLayout.jsx lines 18-32). Don't touch the latter. This is the explicit anti-pattern Phase 34 partially eliminates.
2. **Sixteenth-note duration units:** beats use `durationUnits` where 4 = quarter, 8 = half, 2 = eighth, 1 = sixteenth. The `needsLandscape` helper converts `sixteenthUnits / 4 = totalBeats`. Don't reinvent this convention.
3. **Threshold = 9 (not 8):** load-bearing for 3-measure 3/4 patterns rendering in portrait. RESEARCH § needsLandscape Threshold Analysis explains the math.
4. **MixedLessonGame `key={\`${fadeKey}-${currentIndex}\`}`** (line 604): triggers unmount+remount, ordered correctly so context cleanup runs before next renderer's mount-effect. Don't change this swap mechanism.
5. **Tailwind class strings MUST be literal** (RESEARCH Pitfall 5): write `landscape:max-md:grid-cols-4` directly, not via concatenation, or the purge strips it.
6. **TapArea wrapping:** TapArea itself has no `max-w-md`; the constraint lives in 3 caller wrappers (`RhythmReadingQuestion` line 623, `RhythmTapQuestion` line 909, `PulseQuestion` line 749). Bump width at call sites, not in TapArea.
7. **Six wrappers, but MixedLessonGame + RhythmDictationGame + SyllableMatchingGame each have TWO overlay instances** (landscape branch + portrait branch). Apply the gate change at both sites in each.
8. **Test mocks already exist** for `useRotatePrompt` and `RotatePromptOverlay` in `__tests__/{Visual,Syllable}*.test.jsx`. Adding a new context dependency means adding a mock for `NeedsLandscapeContext` in those tests too — pattern at lines 79-87 in those test files.
9. **`useLandscapeLock` D-19 makes the hook context-aware** but callers (all 6 rhythm wrappers + ArcadeRhythmGame) call it the same way; no caller signature change.
10. **Pure presentational `RotatePromptOverlay`:** no code change despite CONTEXT D-14 wording — RESEARCH § Coexistence Strategy Reframing reconciles. The gate lives in 6 wrappers.

## Metadata

**Analog search scope:** `src/contexts/`, `src/components/games/rhythm-games/`, `src/hooks/`, `src/components/orientation/`, `src/components/layout/`
**Files scanned:** ~30 read directly + grep-verified inline overlay pattern across 7 wrappers
**Pattern extraction date:** 2026-05-07
