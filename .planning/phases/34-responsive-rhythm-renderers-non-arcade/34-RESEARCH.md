# Phase 34: Responsive Rhythm Renderers (Non-Arcade) — Research

**Researched:** 2026-05-07
**Domain:** React responsive layout / Tailwind / VexFlow / context-based UI orchestration
**Confidence:** HIGH on locked decisions and codebase architecture; MEDIUM on the exact `needsLandscape` threshold (recommendation made but warrants UAT confirmation)

## Summary

Phase 34 is a layout/UX-only milestone that does two things: (1) introduces a `NeedsLandscapeContext` provider so rhythm renderers can declare "I need landscape" content-by-content (replacing the current route-list approach for rhythm only), and (2) systematically fixes responsive defects across 13 rhythm components so they render correctly across phone-portrait / phone-landscape / tablet-portrait / tablet-landscape.

The codebase already supports this work cleanly: Tailwind 3.4.1 supports the `landscape:max-md:` modifier stacking the locked decisions need; VexFlow `RhythmStaffDisplay` already accepts `measures` and `timeSignature` (the inputs the heuristic needs); every rhythm wrapper already imports `RotatePromptOverlay` and gates it on `useRotatePrompt()`'s viewport+orientation check. There is one important codebase finding that the discuss-phase decisions assume but did not verify: **`RotatePromptOverlay` is currently rendered inline by each game component, NOT centrally from `App.jsx`**. The `LANDSCAPE_ROUTES` array in `App.jsx` is consumed only by `OrientationController` for `screen.orientation.lock()` calls and the iOS tip modal — it does NOT gate the rotate prompt. This changes the implementation shape of D-14, D-16 (see `## Coexistence Strategy Reframing` below).

**Primary recommendation:** Land the context provider + helper + RotatePromptOverlay rewrite first as Wave 0 (small, atomic, unblocks everything), then opt-in renderers one at a time, then remove rhythm routes from `LANDSCAPE_ROUTES`, then run the 13-component audit. Threshold: **9 beats** (not 8) — see `## needsLandscape Threshold Analysis`.

## Architectural Responsibility Map

| Capability                                      | Primary Tier                                          | Secondary Tier | Rationale                                                                                                                         |
| ----------------------------------------------- | ----------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `NeedsLandscapeContext` provider mount          | Frontend Server (AppLayout)                           | —              | D-16 locked; AppLayout wraps every routed page that has the rotate-prompt surface. Single source of truth.                        |
| `useDeclareNeedsLandscape(boolean)` hook        | Browser / Client (renderer-side)                      | —              | Renderer mounts → declares → unmounts → cleans up. Pure React state, no server.                                                   |
| `useNeedsLandscape()` reader hook               | Browser / Client (consumer of overlay)                | —              | Read-only context read. Consumed by per-component rotate-prompt visibility logic.                                                 |
| `needsLandscape(pattern, timeSignature)` helper | Browser / Client (pure helper)                        | —              | Pure function; deterministic; unit-testable; no React deps. Lives at `src/components/games/rhythm-games/utils/needsLandscape.js`. |
| Card grid responsive layout                     | Browser / Client (Tailwind classes)                   | —              | CSS-only via Tailwind responsive modifiers; no JS state.                                                                          |
| Viewport gate (`< 768px AND portrait`)          | Browser / Client (existing `useRotatePrompt`)         | —              | Already implemented via `useOrientation` + `useIsMobile`; we extend it, don't reinvent it.                                        |
| `LANDSCAPE_ROUTES` enforcement                  | Browser / Client (`OrientationController` in App.jsx) | —              | Only affects `screen.orientation.lock()` calls + iOS tip modal — does NOT gate the prompt overlay.                                |

## Standard Stack

### Core

| Library     | Version                         | Purpose                                                                                                                                                             | Why Standard                                                                                                                                                                               |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| react       | 18                              | Hooks + Context for `NeedsLandscapeContext`                                                                                                                         | Already the project's runtime                                                                                                                                                              |
| tailwindcss | ^3.4.1 [VERIFIED: package.json] | Responsive modifiers (`landscape:`, `max-md:`, modifier stacking)                                                                                                   | Tailwind 3.2+ supports built-in `portrait`/`landscape` variants and stacking such as `landscape:max-md:grid-cols-4` natively [CITED: tailwind config comment src/tailwind.config.js:16-18] |
| vexflow     | ^5.0.0 [VERIFIED: package.json] | Renders the staff in `RhythmStaffDisplay` and `DictationChoiceCard`; the heuristic exists because VexFlow becomes illegible below ~50px per beat at iPhone SE width | Already used; v5 is current                                                                                                                                                                |
| vitest      | ^3.2.4 [VERIFIED: package.json] | NOTATION-03 unit test for `needsLandscape` helper                                                                                                                   | Project-standard test framework                                                                                                                                                            |

### Supporting

| Library                          | Version | Purpose                                                                             | When to Use                                                |
| -------------------------------- | ------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `useOrientation` (project hook)  | n/a     | Detects portrait/landscape via `matchMedia`                                         | Already used by `useRotatePrompt`; reuse, do not duplicate |
| `useIsMobile` (project hook)     | n/a     | Detects viewport < 768px                                                            | Already powers the existing rotate-prompt viewport gate    |
| `useRotatePrompt` (project hook) | n/a     | Wraps `useOrientation`+`useIsMobile`+localStorage dismiss + Android-PWA suppression | The gate to extend in INFRA-03; do NOT replace             |

### Alternatives Considered

| Instead of                                       | Could Use                         | Tradeoff                                                                                                                                                                                                    |
| ------------------------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `landscape:max-md:grid-cols-4` Tailwind modifier | `useEffect` + JS-driven className | JS path costs a re-render, requires resize listener, and risks flicker on initial mount; CSS path is zero-cost. Stick with D-06.                                                                            |
| Per-renderer ResizeObserver to drive layout      | Pure Tailwind breakpoints         | Breakpoints work because the design is breakpoint-driven (phone vs tablet, portrait vs landscape) — viewport granularity is enough. ResizeObserver only matters for container-query problems we don't have. |
| Container queries (`@container`)                 | Tailwind viewport breakpoints     | Tailwind 3.4 supports `@container` but the project doesn't use it elsewhere. Adding here introduces a new pattern. Stick with viewport breakpoints.                                                         |

**Installation:** No new dependencies required. All capabilities already exist in the project's stack.

**Version verification:**

```bash
# Tailwind landscape variant: built-in since 3.2 [VERIFIED: tailwind.config.js comment]
# vexflow 5.0 supports SVG backend with .resize() — used throughout project [VERIFIED: RhythmStaffDisplay.jsx]
```

## Architecture Patterns

### System Architecture Diagram

```
                        AppLayout (mounts NeedsLandscapeProvider)
                              |
                              v
                  +-----------+-----------+
                  |                       |
                  v                       v
        Routed page (Outlet)      RotatePromptOverlay-bearing
                  |               components (existing inline)
                  v
        Game wrapper (e.g. MixedLessonGame, RhythmDictationGame...)
        - imports useRotatePrompt() (legacy viewport+orientation gate)
        - imports useNeedsLandscape() (NEW context read)
        - new derived: shouldShowPrompt = legacyGate && (isLegacyRoute || ctxNeedsLandscape)
        - mounts <RotatePromptOverlay> inline if derived true
                  |
                  v
        Renderer (e.g. RhythmReadingQuestion)
        - calls useDeclareNeedsLandscape(needsLandscape(beats, timeSig))
        - on unmount, hook clears flag
                  |
                  v
        needsLandscape helper (pure)
        - reads totalBeats = measures × beatsPerMeasure
        - returns totalBeats > 9
```

The data flow:

1. Renderer mounts → calls helper → calls `useDeclareNeedsLandscape(boolean)` → context value updates.
2. Wrapper reads context via `useNeedsLandscape()`, AND reads `useRotatePrompt()` (existing legacy gate).
3. Wrapper renders `RotatePromptOverlay` when BOTH (a) viewport gate matches `< 768px AND portrait` AND (b) either context says yes OR `LANDSCAPE_ROUTES` includes the route.
4. Renderer unmounts → context cleans up → if no other declaring renderer, flag becomes false → overlay hides.

### Recommended Project Structure

```
src/
├── contexts/
│   └── NeedsLandscapeContext.jsx       # NEW — provider + useDeclareNeedsLandscape + useNeedsLandscape
├── components/
│   ├── layout/
│   │   └── AppLayout.jsx               # MODIFIED — wraps Outlet in <NeedsLandscapeProvider>
│   └── games/rhythm-games/
│       ├── utils/
│       │   ├── needsLandscape.js       # NEW — pure helper
│       │   └── needsLandscape.test.js  # NEW — unit test (NOTATION-03)
│       ├── renderers/
│       │   ├── RhythmReadingQuestion.jsx     # MODIFIED — calls useDeclareNeedsLandscape
│       │   ├── RhythmTapQuestion.jsx         # MODIFIED — calls useDeclareNeedsLandscape
│       │   ├── DiscoveryIntroQuestion.jsx    # MODIFIED — declares false, audit fix
│       │   ├── PulseQuestion.jsx             # MODIFIED — declares false (1 measure always), audit fix
│       │   ├── RhythmDictationQuestion.jsx   # MODIFIED — 2x2 grid, declares false on portrait
│       │   ├── SyllableMatchingQuestion.jsx  # MODIFIED — 2x2/1x4 grid via Tailwind only
│       │   └── VisualRecognitionQuestion.jsx # MODIFIED — 2x2/1x4 grid via Tailwind only
│       └── components/
│           └── DictationChoiceCard.jsx        # MODIFIED — fits 2x2 cell sizing
└── App.jsx                              # MODIFIED — remove 7 rhythm routes from LANDSCAPE_ROUTES
```

### Pattern 1: Context with last-writer-wins boolean (D-15)

**What:** A React Context whose value is a single boolean. Renderers call `useDeclareNeedsLandscape(true|false)` on mount; an effect cleanup sets back to false.
**When to use:** Whenever exactly one declaring component is active at a time and you want simple lifecycle ergonomics.

```jsx
// Source: standard React 18 useEffect pattern; verified safe under StrictMode
// File: src/contexts/NeedsLandscapeContext.jsx (NEW)
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

const NeedsLandscapeContext = createContext({
  needsLandscape: false,
  setNeedsLandscape: () => {},
});

export function NeedsLandscapeProvider({ children }) {
  const [needsLandscape, setNeedsLandscape] = useState(false);
  return (
    <NeedsLandscapeContext.Provider
      value={{ needsLandscape, setNeedsLandscape }}
    >
      {children}
    </NeedsLandscapeContext.Provider>
  );
}

export function useNeedsLandscape() {
  return useContext(NeedsLandscapeContext).needsLandscape;
}

/**
 * Renderer-side declaration hook. Last-writer-wins: each mount sets the flag,
 * each unmount clears it. Because MixedLessonGame swaps renderers (not mounts
 * two simultaneously), the context value tracks the active child correctly.
 *
 * Pass `false` explicitly if a renderer is content-driven and the current
 * content does not need landscape — this clears any prior `true` from a
 * previously mounted renderer when MixedLessonGame swaps in a short pattern
 * after a long pattern.
 */
export function useDeclareNeedsLandscape(value) {
  const { setNeedsLandscape } = useContext(NeedsLandscapeContext);
  useEffect(() => {
    setNeedsLandscape(Boolean(value));
    return () => setNeedsLandscape(false);
  }, [value, setNeedsLandscape]);
}
```

### Pattern 2: Pure helper for content-driven decision (D-03, NOTATION-03)

**What:** A pure function that takes pattern + time signature and returns boolean. No DOM, no React, no side effects.

```js
// Source: derived from RhythmStaffDisplay.jsx splitBeatsIntoMeasures + getSixteenthUnitsPerMeasure
// File: src/components/games/rhythm-games/utils/needsLandscape.js (NEW)

const TOTAL_BEATS_THRESHOLD = 9; // see RESEARCH.md § needsLandscape Threshold Analysis

function parseTimeSignature(timeSig) {
  const parts = (timeSig || "4/4").split("/");
  if (parts.length !== 2) return { num: 4, den: 4 };
  return { num: parseInt(parts[0], 10), den: parseInt(parts[1], 10) };
}

function getBeatsPerMeasure(timeSig) {
  const { num, den } = parseTimeSignature(timeSig);
  // 6/8 etc. — beats are typically grouped, but the heuristic is keyed on the
  // notated beat count (numerator). Tablet visual density is what matters.
  return num;
}

/**
 * @param {Array<{durationUnits: number, isRest: boolean}> | undefined} beats
 * @param {string | undefined} timeSignature  e.g. '4/4', '3/4'
 * @param {number | undefined} measures  optional override — if provided, takes precedence
 * @returns {boolean}
 */
export function needsLandscape(
  beats,
  timeSignature = "4/4",
  measures = undefined
) {
  // measures-only path (RhythmStaffDisplay accepts a `measures` prop)
  if (typeof measures === "number" && measures > 0) {
    const totalBeats = measures * getBeatsPerMeasure(timeSignature);
    return totalBeats > TOTAL_BEATS_THRESHOLD;
  }

  // beats-array path
  if (!Array.isArray(beats) || beats.length === 0) return false;

  // Sum durationUnits in sixteenth-note units, convert to beats.
  // 1 quarter = 4 sixteenth units = 1 beat.
  const sixteenthUnits = beats.reduce(
    (sum, b) => sum + (b?.durationUnits || 0),
    0
  );
  const totalBeats = sixteenthUnits / 4;
  return totalBeats > TOTAL_BEATS_THRESHOLD;
}
```

### Pattern 3: Tailwind quadrant grid (D-05, D-06)

```jsx
// Source: Tailwind 3.4 docs on responsive design + landscape variant
// Replaces the existing JS-driven `gridClass = isLandscape ? "grid-cols-4..." : "grid-cols-2..."`
// in SyllableMatchingQuestion.jsx and VisualRecognitionQuestion.jsx.
<div className="grid w-full max-w-md grid-cols-2 gap-3 md:max-w-2xl md:grid-cols-2 md:gap-4 lg:max-w-4xl lg:grid-cols-2 lg:gap-6 landscape:max-md:grid-cols-4">
  {/* 4 cards */}
</div>
```

| Quadrant                            | Effective columns | Source class                   |
| ----------------------------------- | ----------------- | ------------------------------ |
| Phone-portrait (<768, portrait)     | 2                 | base `grid-cols-2`             |
| Phone-landscape (<768, landscape)   | 4                 | `landscape:max-md:grid-cols-4` |
| Tablet-portrait (≥768, portrait)    | 2                 | `md:grid-cols-2`               |
| Tablet-landscape (≥1024, landscape) | 2                 | `lg:grid-cols-2`               |

Padding/gap recommendation: `gap-3 md:gap-4 lg:gap-6` and `max-w-md md:max-w-2xl lg:max-w-4xl` so tablets actually use the available width per TABLET-01 (currently capped at `max-w-2xl` even on landscape iPad — leaves whitespace gutters).

### Anti-Patterns to Avoid

- **Don't replicate the `LANDSCAPE_ROUTES` array.** Use the context for rhythm; legacy array stays for the other 6 routes.
- **Don't use `matchMedia` inside renderers** to detect orientation when the existing `useOrientation`/`useIsMobile`/`useRotatePrompt` hooks already do this and feed `RotatePromptOverlay` everywhere else. Reuse the existing pipeline.
- **Don't compute responsive layout in JS** when Tailwind responsive variants do it for free at zero cost (no re-render, no mismatch flicker).
- **Don't put the helper in a hook.** D-03 is explicit — pure function, separately unit-tested.

## Don't Hand-Roll

| Problem                                          | Don't Build                                                          | Use Instead                                                   | Why                                                                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------- | --------------------------------------------------- |
| Detecting orientation                            | `window.addEventListener('orientationchange', ...)` in each renderer | Existing `useOrientation` (already used by `useRotatePrompt`) | One source of truth; handles iOS Safari quirks; already debounced                                            |
| Detecting tablet vs phone                        | Per-component window-width state                                     | Tailwind `md:` breakpoint                                     | The locked D-04 ("phone vs tablet cutoff = Tailwind md") explicitly aligns with Tailwind. JS path adds cost. |
| Showing/hiding rotate overlay                    | Per-route conditionals                                               | Combined predicate `legacyGate && (isLegacyRoute              |                                                                                                              | ctxNeedsLandscape)` | Single derived value drives every wrapper's overlay |
| Cleaning up context value when renderer unmounts | Imperative `useEffect` with `useRef`                                 | Built-in `useEffect` cleanup function                         | Last-writer-wins is enforced by the cleanup; React handles ordering correctly under StrictMode               |

**Key insight:** The hardest problem here isn't computing what should happen — it's making sure the new system coexists with the legacy `LANDSCAPE_ROUTES` array and inline-rendered prompts so we don't accidentally break the 6 non-rhythm games we're not migrating.

## Runtime State Inventory

This is a refactor phase — the canonical question applies.

| Category                             | Items Found                                                                                                                                                                                                                                        | Action Required                                                                                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stored data                          | None — `LANDSCAPE_ROUTES` is a literal array in source code, no DB/Redux/localStorage persistence of route lists. `useRotatePrompt` writes `localStorage.pianoapp-rotate-dismissed` but that's a single dismiss flag, unaffected by route changes. | None — verified by grep on `LANDSCAPE_ROUTES` and `pianoapp-rotate-dismissed`                                                                                       |
| Live service config                  | None — pure frontend change. No Supabase/Edge/CDN config encodes route names.                                                                                                                                                                      | None                                                                                                                                                                |
| OS-registered state                  | None — no service-worker route caching by name (sw.js caches by URL pattern, not the literal route list).                                                                                                                                          | None — verified by grep on `LANDSCAPE_ROUTES` in `public/sw.js` (no match expected; rhythm route paths are still served via the existing navigation cache strategy) |
| Secrets/env vars                     | None                                                                                                                                                                                                                                               | None                                                                                                                                                                |
| Build artifacts / installed packages | None — no compiled artifact embeds `LANDSCAPE_ROUTES` content separately from source.                                                                                                                                                              | None                                                                                                                                                                |

**Other runtime concerns:** None. This refactor is in-source, code-only.

## Common Pitfalls

### Pitfall 1: Coexistence with legacy `LANDSCAPE_ROUTES` (D-14)

**What goes wrong:** After Phase 34 ships, a notes-master game (e.g. `/notes-master-mode/notes-recognition-game`) stops showing the rotate prompt because the inline prompt logic was rewritten to read context-only.
**Why it happens:** Today every game inline-renders `<RotatePromptOverlay>` gated on `useRotatePrompt()` alone. `LANDSCAPE_ROUTES` is consumed only by `OrientationController` (for `screen.orientation.lock()` and iOS tip modal). The instinctive "centralize the overlay in AppLayout" change would mean removing the inline overlay from each game — but only rhythm games are in scope.
**How to avoid:**

- Do NOT remove inline `<RotatePromptOverlay>` from non-rhythm games.
- For rhythm games, change the inline gate from `shouldShowPrompt` (legacy) to `shouldShowPrompt && (isLegacyRoute || ctxNeedsLandscape)` — but since rhythm routes are removed from `LANDSCAPE_ROUTES` in INFRA-01, `isLegacyRoute` is always false for rhythm, so the gate reduces to `shouldShowPrompt && ctxNeedsLandscape`.
- For non-rhythm games, leave the inline gate as `shouldShowPrompt` — they'll continue to fire whenever portrait+phone, matching today's behavior, until NM-01/ET-01 migrate them.
  **Warning signs:** Manual UAT on iPhone SE: open `/notes-master-mode/notes-recognition-game` in portrait — prompt should still appear. Open `/rhythm-mode/syllable-matching-game` in portrait — prompt should NOT appear (short content).

### Pitfall 2: `OrientationController` `LANDSCAPE_ROUTES` ≠ overlay gate

**What goes wrong:** Plan author assumes (per D-14) that "RotatePromptOverlay reads from the legacy array" — but the prompt overlay never read from the array. The `OrientationController` does, and `OrientationController` calls `screen.orientation.lock()` (Android) and shows an iOS tip modal.
**Why it happens:** The discuss-phase D-14 wording is correct in spirit but slightly imprecise — `LANDSCAPE_ROUTES` does still need to keep working for the 6 non-rhythm routes, but it works through `OrientationController.lockOrientation`, not through `RotatePromptOverlay`.
**How to avoid:**

- Remove ONLY the 7 rhythm route paths from `LANDSCAPE_ROUTES` (D-13). Notes-master (3 paths), ear-training (2 paths) routes stay so `OrientationController` keeps trying to lock orientation for them.
- Note that `note-speed-cards` is in the array but currently lives at `/notes-master-mode/note-speed-cards`. Keep it.
- The 7 rhythm paths are: `metronome-trainer`, `rhythm-reading-game`, `rhythm-dictation-game`, `arcade-rhythm-game`, `visual-recognition-game`, `syllable-matching-game`, `mixed-lesson` (all under `/rhythm-mode/`).
- After removal, `LANDSCAPE_ROUTES` will have 6 entries. `isLandscapeRoute` will return false for rhythm routes. `OrientationController` will call `lockOrientation('portrait-primary')` for rhythm routes — this is FINE because Phase 34 wants rhythm to NOT force landscape orientation (content-driven instead).

### Pitfall 3: MixedLessonGame renderer swap flicker

**What goes wrong:** Inside MixedLessonGame, going from a long-pattern reading exercise (declares `needsLandscape=true`) to a short visual-recognition exercise (declares `false`) flashes the rotate overlay between renderer mounts.
**Why it happens:** `useDeclareNeedsLandscape(true)`'s cleanup runs on unmount and sets back to `false`, then the next renderer's mount-effect runs and may re-set to `true`. Between those two effect runs, `false` is briefly visible. With React 18 batching, this is generally non-visible — but StrictMode or slow renders could expose it.
**How to avoid:**

- The pattern in the recommended hook is correct: declare on mount, clean on unmount. React batches the two effects so `useNeedsLandscape()` sees only the final value within the same render commit.
- If flicker is observed in UAT, switch to a "ref-counted" model where each declarer holds a unique key in a Map and the boolean derives from `map.size > 0` — but that's only needed if MixedLessonGame ever mounts two declaring renderers simultaneously, which the discuss-phase confirms it does not.
- Verification: in MixedLessonGame, the `key={\`${fadeKey}-${currentIndex}\`}` (line 604) means React sees the swap as unmount+remount, NOT update — so cleanup runs first. Order is deterministic.
  **Warning signs:** UAT step — Boss MIXED_LESSON sequence with mixed long-pattern + short-card questions on iPhone SE; watch the prompt overlay during transitions.

### Pitfall 4: AppLayout doesn't wrap all routes

**What goes wrong:** Some route bypasses `AppLayout` and the provider isn't mounted, so `useDeclareNeedsLandscape` becomes a no-op there.
**Why it happens:** `App.jsx` has a top-level `<Routes>` where ONE route (`/sight-reading-layout-harness`) sits OUTSIDE the AppLayout wrapper [VERIFIED: src/App.jsx:397-399 element="SightReadingLayoutHarness"], plus 6 public routes (`/login`, `/reset-password`, `/consent/verify`, `/privacy`, `/terms`, etc.) at the bottom. None of these are rhythm routes.
**How to avoid:**

- All 13 game routes live inside the AppLayout-wrapped tree (`/rhythm-mode/*`, `/notes-master-mode/*`, `/ear-training-mode/*`). Provider mount in AppLayout covers them all. ✓
- Public routes (login, terms) and the sight-reading harness do NOT need the context. Confirmed safe.
  **Warning signs:** None — verified during research.

### Pitfall 5: Tailwind class-purge removing `landscape:max-md:grid-cols-4`

**What goes wrong:** PostCSS purge strips the new modifier-stacked class because it's not detected in source scanning.
**Why it happens:** Tailwind purge looks at full class strings; if the class is constructed via concatenation, it's stripped.
**How to avoid:**

- Always write the full class string literally: `className="grid grid-cols-2 landscape:max-md:grid-cols-4 md:grid-cols-2 lg:grid-cols-2"`.
- Do NOT do `className={\`grid grid-cols-${n}...\`}`.
- Source scan covers `./index.html` and `./src/**/*.{js,ts,jsx,tsx}` [VERIFIED: tailwind.config.js:4] — sufficient.
  **Warning signs:** Build looks fine, dev mode looks fine, production deploy reports the class missing. Mitigate by adding to safelist if needed (not currently required).

### Pitfall 6: VexFlow staff width minimum on iPhone SE

**What goes wrong:** A long pattern at iPhone SE portrait width (343px usable after 16px page padding × 2) renders illegibly even though `needsLandscape=false`.
**Why it happens:** `RhythmStaffDisplay` uses `staveWidth = containerWidth - 20` and `Formatter.format(voice, staveWidth - 60)`. At 343px that's 263px of formatter space. VexFlow guidelines recommend 300-400px per measure [CITED: docs/vexflow-notation/vexflow-guidelines.md:55] — meaning a 1-bar of 4/4 fits, 2 bars fit tightly, 3 bars don't.
**How to avoid:**

- The threshold in `## needsLandscape Threshold Analysis` below uses 9 beats (= 2.25 measures of 4/4). At 4/4 that means 2 measures fits, 3 measures triggers prompt. Aligns with VexFlow's 300-400px-per-measure guidance.
- For 2/4 patterns: 2 measures = 4 beats = passes; 3 measures = 6 beats = passes; 5 measures = 10 beats = triggers. Gives 2/4 more room before prompting, which is fine because 2/4 measures are visually narrower.
  **Warning signs:** UAT shows a 2-measure 4/4 long pattern is legible — borderline at iPhone SE. If user reports illegibility, drop threshold to 8.

## Code Examples

Verified patterns from existing codebase:

### Existing inline rotate-prompt gate (do not change for non-rhythm routes)

```jsx
// Source: src/components/games/rhythm-games/MixedLessonGame.jsx:573-577
const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();
// ...
{
  shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />;
}
```

### Modified inline gate (for rhythm renderers/wrappers)

```jsx
// New pattern for rhythm wrappers
const { shouldShowPrompt: legacyGate, dismissPrompt } = useRotatePrompt();
const ctxNeedsLandscape = useNeedsLandscape();
const shouldShowPrompt = legacyGate && ctxNeedsLandscape;
// ...
{
  shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />;
}
```

### Renderer declaration in RhythmReadingQuestion

```jsx
// Add near top of component, after `beats` state is loaded
import { useDeclareNeedsLandscape } from "../../../../contexts/NeedsLandscapeContext";
import { needsLandscape as computeNeedsLandscape } from "../utils/needsLandscape";
// ...
const declared = beats
  ? computeNeedsLandscape(
      beats,
      config.timeSignature || "4/4",
      config.measureCount || 1
    )
  : false;
useDeclareNeedsLandscape(declared);
```

### Provider mount in AppLayout

```jsx
// src/components/layout/AppLayout.jsx — wrap the Outlet
import { NeedsLandscapeProvider } from '../../contexts/NeedsLandscapeContext';
// ...
return (
  <div className={...}>
    <NeedsLandscapeProvider>
      {!isGameRoute && !isDashboard && !isTrailPage && <Header ... />}
      {!isGameRoute && <div className="hidden xl:block"><Sidebar ... /></div>}
      <main className={...}>
        <Outlet />
      </main>
      {!isGameRoute && <MobileTabsNav />}
    </NeedsLandscapeProvider>
  </div>
);
```

## needsLandscape Threshold Analysis

The discuss-phase decided "moderate" with the threshold itself flagged as Claude's discretion — pick 8, 9, or 10. Recommendation: **9 beats**.

**iPhone SE portrait usable width:**

- Device width: 375px [VERIFIED: discuss-phase reference + iOS specs]
- AppLayout `p-4` padding: ~16px each side (in fixed-overlay rhythm wrapper) → 343px content
- `RhythmStaffDisplay` glass card border + `p-4`: ~32px → ~311px container
- `staveWidth = containerWidth - 20`: ~291px usable stave
- `Formatter.format(voice, staveWidth - 60)`: **~231px formatter space**

**VexFlow density at 80 BPM (typical rhythm tempo):**

- Quarter note: ~50-60px minimum legible width [CITED: vexflow-guidelines.md "300-400px per measure"]
- A measure of 4/4 = 4 beats minimum 200px → fits ~231px formatter space
- 2 measures of 4/4 = 8 beats → would need ~400px → does NOT fit at iPhone SE
- BUT: `RhythmStaffDisplay` renders multi-measure as a vertical stack of staves (each its own row) when `measures > 1` [VERIFIED: RhythmStaffDisplay.jsx:243-298]

**Re-evaluating with the multi-stave reality:** Each measure gets its own row. The vertical-scroll-trap is the constraint, not horizontal compression. A 1-measure pattern is one row (~120px tall). 3 measures = 3 rows ≈ 360px tall — plus controls + tap area, total > 600px → exceeds iPhone SE 667px portrait viewport even before browser chrome.

**Threshold candidates:**

| Threshold   | 4/4 boundary                           | 3/4 boundary                         | 2/4 boundary             | iPhone SE portrait fits?                                    |
| ----------- | -------------------------------------- | ------------------------------------ | ------------------------ | ----------------------------------------------------------- |
| 8 beats     | >2 measures triggers                   | >2 measures triggers                 | >4 measures triggers     | 2 measures (8 beats) tight; 3 measures triggers             |
| **9 beats** | **>2 measures triggers**               | **>3 measures triggers (=9 in 3/4)** | **>4 measures triggers** | **2 measures fits comfortably; 3 measures triggers**        |
| 10 beats    | >2 measures of 4/4 triggers (10 = 2.5) | >3 measures triggers                 | >5 measures triggers     | 2 measures fits; 3 measures (12 beats) triggers — same as 9 |

**Why 9 over 8:**

- 8 beats = exactly 2 measures of 4/4. A literal `>` comparison means `>8` triggers — so 2-bar patterns DO render in portrait. Same outcome as 9.
- BUT: a 3/4 pattern of 3 measures = 9 beats. At threshold 8, this triggers (`9>8`). At threshold 9, this does NOT trigger (`9>9` is false). 3 measures of 3/4 = 3 stacked staves of 3 narrow beats each → totally fits iPhone SE vertically because each stave is short.
- 9 lets 3-measure 3/4 patterns render in portrait (better UX), still triggers prompt for genuinely long content.

**Why 9 over 10:**

- 10 beats = 2.5 measures of 4/4 → impossible (measures are integer). So 10 and 9 behave identically in 4/4.
- But 5 measures of 2/4 = 10 beats. At threshold 9, this triggers. At threshold 10, this does not (`10>10` false). 5 stacked 2/4 staves on iPhone SE = 5 × ~120px = 600px just for staff — too tall. Threshold 9 is correct.

**Recommendation: `TOTAL_BEATS_THRESHOLD = 9`.** Confidence: MEDIUM. UAT confirmation needed against actual rhythm content (the curriculum's longest non-arcade patterns are typically 1-2 measures at the units we're shipping; would only trigger landscape for boss-length content).

## 13-Component Audit Punch List

Pre-audit findings based on code inspection. UAT will confirm/expand.

### Renderers (7)

| Component                     | Phone-portrait                                                             | Phone-landscape                                 | Tablet-portrait                                                                 | Tablet-landscape                                                  | Source location                               |
| ----------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| **DiscoveryIntroQuestion**    | OK in portrait (col flex w-sm)                                             | OK (existing landscape branch w-2xl row layout) | **`max-w-sm` is too narrow** — single small card in middle of huge tablet width | **`max-w-2xl` doesn't fill landscape iPad**                       | renderers/DiscoveryIntroQuestion.jsx:183-188  |
| **PulseQuestion**             | OK (always 1 measure, max-w-md)                                            | OK                                              | `max-w-md` is mobile-narrow on tablet                                           | Same — wider would help                                           | renderers/PulseQuestion.jsx:728-741           |
| **RhythmDictationQuestion**   | **Cards in `flex-col gap-3` — vertical stack scrolls!** Should be 2x2 grid | **Same** — vertical stack                       | Same — vertical stack                                                           | Same — vertical stack                                             | renderers/RhythmDictationQuestion.jsx:261     |
| **RhythmReadingQuestion**     | **`max-w-md` truncates legibly only short patterns**                       | OK (matches landscape)                          | `max-w-md` too narrow                                                           | `max-w-md` does not use width                                     | renderers/RhythmReadingQuestion.jsx:603       |
| **RhythmTapQuestion**         | OK (uses `max-w-md` for TapArea)                                           | OK                                              | TapArea fixed-size, OK                                                          | Same                                                              | renderers/RhythmTapQuestion.jsx:909           |
| **SyllableMatchingQuestion**  | OK (2x2 grid, `max-w-sm`)                                                  | OK (1x4, `max-w-2xl`)                           | **Stuck at `max-w-sm` portrait sizing** even on tablet-portrait                 | **Stuck at `max-w-2xl` landscape** — doesn't expand to full width | renderers/SyllableMatchingQuestion.jsx:52-54  |
| **VisualRecognitionQuestion** | OK (2x2 grid, `max-w-sm`)                                                  | OK (1x4, `max-w-2xl`)                           | Same as SyllableMatching — too narrow                                           | Same — `max-w-2xl` cap                                            | renderers/VisualRecognitionQuestion.jsx:39-41 |

### Supporting Components (5 in WRAPPER-03 + 2 setup)

| Component              | Phone-portrait                                                                                               | Phone-landscape                                         | Tablet-portrait                               | Tablet-landscape | Notes                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| **CountdownOverlay**   | `text-3xl` — fine                                                                                            | Fine                                                    | **Tiny on tablet** (~30px text on 1024px+)    | Tiny             | Use `text-3xl md:text-5xl lg:text-6xl`                                                                     |
| **BossIntroOverlay**   | `text-5xl Crown h-16` — fine                                                                                 | Fine (but fills 100vh — uses `flex items-center` so OK) | Fine                                          | Fine             | D-11: responsive sanity only — no other change needed                                                      |
| **FloatingFeedback**   | `text-3xl` absolute over TapArea — fine                                                                      | Fine                                                    | Tiny on tablet                                | Tiny             | Bump to `text-3xl md:text-4xl`                                                                             |
| **MetronomeDisplay**   | `h-9 w-9` circles, `sm:h-10 sm:w-10`                                                                         | Fine                                                    | Same — `sm:` not `md:` so tablets still small | Same             | Bump to `md:h-12 md:w-12 md:text-base`                                                                     |
| **TapArea**            | `max-h-96 max-w-md` — OK on phone                                                                            | OK                                                      | **Tiny on tablet portrait** — wasted space    | **Tiny**         | Change to `max-w-md md:max-w-2xl lg:max-w-3xl`                                                             |
| **RhythmGameSetup**    | Delegates to `UnifiedGameSettings` (out of audit scope per D-10)                                             | —                                                       | —                                             | —                | If issues found, log as deferred per D-10                                                                  |
| **RhythmGameSettings** | **Light theme `bg-white text-gray-700`** on glass-purple page — looks like a bug from before glass migration | Same                                                    | Same                                          | Same             | Need to convert to glass card pattern; check usage — used inside Modal so background is overridden? Verify |

### Wrappers (6) — Layout Surface Concerns

All 6 use the same pattern: `fixed inset-0 flex flex-col overflow-y-auto bg-gradient-to-br ... p-4`.

| Wrapper                   | Phone-portrait                                                                                                 | Phone-landscape    | Tablet-portrait                                  | Tablet-landscape      | Issue                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------- |
| **RhythmDictationGame**   | Uses `flex h-screen` 3-column layout — on phone-portrait this is broken: 14px back / cards / 16px right column | **OK**             | OK on tablet                                     | OK                    | Phone-portrait: 3-column layout breaks → recommend `lg:flex-row` to keep 3-col only on tablet-landscape |
| **RhythmReadingGame**     | Existing portrait layout                                                                                       | Existing landscape | Wide content but `max-w-2xl` on Notation area    | Same                  | TABLET-01 hint applies                                                                                  |
| **MetronomeTrainer**      | Existing                                                                                                       | Existing           | OK                                               | OK                    | Largest wrapper (1510 LOC) — biggest surface area for bugs                                              |
| **VisualRecognitionGame** | OK                                                                                                             | OK landscape       | `max-w-sm` on the question (passed via renderer) | `max-w-2xl` landscape | Same as renderer                                                                                        |
| **SyllableMatchingGame**  | OK                                                                                                             | OK landscape       | Same as VR                                       | Same                  | Same                                                                                                    |
| **MixedLessonGame**       | OK                                                                                                             | OK landscape       | Renderer-dependent                               | Renderer-dependent    | Verify swap-flicker (Pitfall 3)                                                                         |

**Total expected fixes:**

- 3 renderers need card-grid Tailwind class swap (RhythmDictationQuestion, SyllableMatchingQuestion, VisualRecognitionQuestion)
- 1 renderer needs landscape variant + tablet-portrait variant (DiscoveryIntroQuestion)
- 5 supporting components need `md:` size bumps
- 1 supporting component (RhythmGameSettings) likely needs glass-pattern fix
- 1 wrapper needs phone-portrait layout fix (RhythmDictationGame 3-column)
- All 6 wrappers + 7 renderers + RotatePromptOverlay need the new context wiring

## DiscoveryIntroQuestion Tablet Sizing Recommendation

D-07 leaves "fixed (`w-64 md:w-96`) vs viewport (`w-[40vw]`)" to research.

**Recommend fixed sizes:** `h-40 w-28 md:h-56 md:w-40 lg:h-64 lg:w-44` for the SVG.

**Reasoning:**

- The current `h-40 w-28` portrait / `h-24 w-16` landscape pair uses fixed sizes — consistency wins.
- Viewport units (`w-[40vw]`) tie SVG size to viewport but inherit window rotation issues (the SVG resizes during rotation animations, can flicker).
- Fixed-size scales predictably: 28→40→44 in width matches the 1.4× / 1.1× scale multiplier from phone→tablet-portrait→tablet-landscape, mirroring how Tailwind's own `text-` and `gap-` scales work in the design system.
- Aligns with the project's design-system pattern of fixed responsive sizes (no other component in the codebase uses arbitrary `vw` units for sizing — search confirms zero `w-\[.*vw\]` patterns).

## Coexistence Strategy Reframing (Important)

D-14 says: "RotatePromptOverlay shows when EITHER (a) the active route is in the legacy LANDSCAPE_ROUTES array OR (b) NeedsLandscapeContext.needsLandscape === true, AND the viewport gate (< 768px, portrait) is satisfied."

**This decision is correct in intent but the codebase shape is different than implied:** `RotatePromptOverlay` is rendered inline by each game wrapper, not centrally. The overlay's actual gate today is just the `useRotatePrompt()` hook (viewport+orientation+localStorage).

**Concrete implementation:**

For rhythm wrappers (6 of them), change the gate from:

```jsx
const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();
{
  shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />;
}
```

to:

```jsx
const { shouldShowPrompt: legacyGate, dismissPrompt } = useRotatePrompt();
const ctxNeedsLandscape = useNeedsLandscape();
const shouldShowPrompt = legacyGate && ctxNeedsLandscape;
{
  shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />;
}
```

For non-rhythm wrappers (7 of them: NotesRecognition, Memory, NoteSpeedCards, IntervalGame, NoteComparisonGame, ArcadeRhythmGame still in the rhythm dir but excluded by D-13 because Phase 35), leave unchanged. They keep firing on `legacyGate` alone, matching today's "always prompt on phone-portrait" behavior.

The "OR" branch in D-14 ("active route is in the legacy LANDSCAPE_ROUTES array") is achieved automatically: non-migrated games still inline-render the prompt with the legacy gate. The literal route-list check isn't needed because each game already self-gates.

**This means:** No changes to `App.jsx` `OrientationController` beyond removing 7 paths from `LANDSCAPE_ROUTES`. No changes to `RotatePromptOverlay.jsx` itself (it's a presentational component, gate lives in callers).

## NOTATION-03 Unit Test Sketch

```js
// src/components/games/rhythm-games/utils/needsLandscape.test.js
import { describe, it, expect } from "vitest";
import { needsLandscape } from "./needsLandscape";

describe("needsLandscape helper", () => {
  describe("measures-only path", () => {
    it("returns false for 1 measure of 4/4 (4 beats)", () => {
      expect(needsLandscape(undefined, "4/4", 1)).toBe(false);
    });
    it("returns false for 2 measures of 4/4 (8 beats)", () => {
      expect(needsLandscape(undefined, "4/4", 2)).toBe(false);
    });
    it("returns true for 3 measures of 4/4 (12 beats)", () => {
      expect(needsLandscape(undefined, "4/4", 3)).toBe(true);
    });
    it("returns false for 3 measures of 3/4 (9 beats — at threshold)", () => {
      expect(needsLandscape(undefined, "3/4", 3)).toBe(false);
    });
    it("returns true for 4 measures of 3/4 (12 beats)", () => {
      expect(needsLandscape(undefined, "3/4", 4)).toBe(true);
    });
    it("returns false for 4 measures of 2/4 (8 beats)", () => {
      expect(needsLandscape(undefined, "2/4", 4)).toBe(false);
    });
    it("returns true for 5 measures of 2/4 (10 beats)", () => {
      expect(needsLandscape(undefined, "2/4", 5)).toBe(true);
    });
  });

  describe("beats-array path", () => {
    it("returns false for 4 quarter notes (4 beats)", () => {
      const beats = Array.from({ length: 4 }, () => ({
        durationUnits: 4,
        isRest: false,
      }));
      expect(needsLandscape(beats, "4/4")).toBe(false);
    });
    it("returns false for 8 quarters (8 beats)", () => {
      const beats = Array.from({ length: 8 }, () => ({
        durationUnits: 4,
        isRest: false,
      }));
      expect(needsLandscape(beats, "4/4")).toBe(false);
    });
    it("returns true for 10 quarters (10 beats)", () => {
      const beats = Array.from({ length: 10 }, () => ({
        durationUnits: 4,
        isRest: false,
      }));
      expect(needsLandscape(beats, "4/4")).toBe(true);
    });
    it("counts mixed durations correctly (2 halves + 4 quarters = 8 beats)", () => {
      const beats = [
        { durationUnits: 8, isRest: false },
        { durationUnits: 8, isRest: false },
        { durationUnits: 4, isRest: false },
        { durationUnits: 4, isRest: false },
        { durationUnits: 4, isRest: false },
        { durationUnits: 4, isRest: false },
      ];
      expect(needsLandscape(beats, "4/4")).toBe(false);
    });
    it("counts rests in totalBeats", () => {
      // 2 quarters + 2 quarter rests = 4 beats — fits portrait
      const beats = [
        { durationUnits: 4, isRest: false },
        { durationUnits: 4, isRest: true },
        { durationUnits: 4, isRest: false },
        { durationUnits: 4, isRest: true },
      ];
      expect(needsLandscape(beats, "4/4")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns false for empty beats and no measures", () => {
      expect(needsLandscape([], "4/4")).toBe(false);
    });
    it("returns false for undefined beats and no measures", () => {
      expect(needsLandscape(undefined, "4/4")).toBe(false);
    });
    it("handles missing timeSignature (defaults to 4/4)", () => {
      expect(needsLandscape(undefined, undefined, 3)).toBe(true); // 12 beats > 9
    });
    it("handles malformed timeSignature gracefully", () => {
      expect(needsLandscape(undefined, "garbage", 3)).toBe(true); // falls back to 4/4
    });
    it("returns false when both beats and measures are missing", () => {
      expect(needsLandscape()).toBe(false);
    });
    it("measures override takes precedence over beats array", () => {
      const beats = Array.from({ length: 100 }, () => ({
        durationUnits: 4,
        isRest: false,
      }));
      // Even with 100 beats in array, if measures=1 in 4/4 = 4 beats, returns false
      expect(needsLandscape(beats, "4/4", 1)).toBe(false);
    });
  });
});
```

## Validation Architecture

### Test Framework

| Property           | Value                                                                           |
| ------------------ | ------------------------------------------------------------------------------- |
| Framework          | Vitest 3.2.4 + JSDOM                                                            |
| Config file        | None (using defaults); shared setup at `src/test/setupTests.js`                 |
| Quick run command  | `npx vitest run src/components/games/rhythm-games/utils/needsLandscape.test.js` |
| Full suite command | `npm run test:run`                                                              |

### Phase Requirements → Test Map

| Req ID                    | Behavior                                                                     | Test Type             | Automated Command                                                               | File Exists?                              |
| ------------------------- | ---------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------- | ----------------------------------------- |
| NOTATION-03               | needsLandscape helper threshold                                              | unit                  | `npx vitest run src/components/games/rhythm-games/utils/needsLandscape.test.js` | ❌ Wave 0                                 |
| INFRA-02                  | Provider mounts; useDeclareNeedsLandscape sets flag; useNeedsLandscape reads | unit                  | `npx vitest run src/contexts/NeedsLandscapeContext.test.jsx`                    | ❌ Wave 0 (optional but cheap; recommend) |
| INFRA-01                  | LANDSCAPE_ROUTES has 6 entries (rhythm removed)                              | grep / static         | manual scan                                                                     | ❌ — verifiable via grep, not vitest      |
| INFRA-03                  | Rotate prompt visibility predicate                                           | manual UAT (per D-12) | iPhone SE physical/Chrome devtools                                              | n/a                                       |
| INFRA-04                  | iPad never sees prompt                                                       | manual UAT            | iPad physical/Chrome devtools                                                   | n/a                                       |
| CORE-01..05               | Renderers fit/don't-scroll at 4 quadrants                                    | manual UAT            | Chrome devtools device frame + iPhone SE / iPad                                 | n/a                                       |
| NOTATION-01/02            | Reading/Tap call helper, declare via context                                 | manual UAT (D-12)     | Open short pattern → no prompt; long pattern → prompt                           | n/a                                       |
| WRAPPER-01..03, TABLET-01 | Visual responsive correctness                                                | manual UAT (D-12)     | All 4 quadrants per component                                                   | n/a                                       |

### Sampling Rate

- **Per task commit:** `npx vitest run` filtered to phase test paths (~5s)
- **Per wave merge:** `npm run test:run` (full suite)
- **Phase gate:** Full suite green + manual UAT sign-off per D-12 (matches v3.3 ship-don't-gold-plate posture)

### Wave 0 Gaps

- [ ] `src/components/games/rhythm-games/utils/needsLandscape.test.js` — covers NOTATION-03 (REQUIRED)
- [ ] `src/contexts/NeedsLandscapeContext.test.jsx` — provider+hooks integration test (RECOMMENDED, cheap, prevents regressions on the lifecycle contract Phase 35 depends on)
- [ ] No framework install needed — vitest is project-standard

## Environment Availability

(Phase is purely code/config changes; minimal external dependencies.)

| Dependency                                       | Required By           | Available           | Version                 | Fallback                                   |
| ------------------------------------------------ | --------------------- | ------------------- | ----------------------- | ------------------------------------------ |
| Tailwind landscape variant                       | D-06 grid pattern     | ✓                   | 3.4.1                   | —                                          |
| Tailwind modifier stacking (`landscape:max-md:`) | D-06 grid pattern     | ✓                   | 3.4.1 (since 3.2)       | —                                          |
| Tailwind purge source paths                      | All new classes       | ✓                   | covers `src/**/*.{jsx}` | —                                          |
| iPhone SE physical or Chrome DevTools            | D-12 UAT              | ✓ (Chrome DevTools) | n/a                     | Chrome DevTools device emulator at 375×667 |
| iPad physical or Chrome DevTools                 | D-12 UAT              | ✓                   | n/a                     | Chrome DevTools device emulator            |
| vitest                                           | NOTATION-03 unit test | ✓                   | 3.2.4                   | —                                          |

**Missing dependencies with no fallback:** none. **Missing dependencies with fallback:** Physical devices for UAT — Chrome DevTools device emulator is acceptable for initial UAT, but D-12 specifies "user plays each game on real devices" so user is expected to have access.

## State of the Art

| Old Approach                           | Current Approach                           | When Changed                                   | Impact                                                                                 |
| -------------------------------------- | ------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `screen.orientation.lock()` everywhere | iOS doesn't support it; web uses prompt UX | Always (iOS Safari limitation)                 | Why Phase 34 exists at all — content-driven prompt is the workaround                   |
| Route-list landscape locking           | Content-driven declarative                 | Phase 34 introduces for rhythm                 | Better UX: short content doesn't force rotate                                          |
| JS-driven orientation classes          | Tailwind responsive variants               | Tailwind 3.2+                                  | Zero re-render cost, no flicker                                                        |
| `portrait`/`landscape` custom screens  | Tailwind built-in variants                 | tailwind.config.js comment notes the migration | Stacking with `max-md:` works only with built-ins [VERIFIED: tailwind.config.js:16-18] |

## Assumptions Log

| #   | Claim                                                                                                                                                                                                            | Section            | Risk if Wrong                                                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | iPhone SE portrait at the "rhythm overlay" wrapper has ~343px usable content width after `p-4`                                                                                                                   | Threshold Analysis | Threshold may be off by 1 beat; UAT will catch                                                                                                                                                                                      |
| A2  | VexFlow "300-400px per measure" guidance is a reasonable proxy for legibility on small screens                                                                                                                   | Threshold Analysis | Recommendation rests on a project doc; could differ from VexFlow upstream's actual heuristic. Mitigation: UAT step explicitly tests boundary patterns                                                                               |
| A3  | MixedLessonGame's `key={\`${fadeKey}-${currentIndex}\`}` triggers unmount-then-remount in deterministic order                                                                                                    | Pitfall 3          | If React batching ever changes order, brief overlay flicker. Mitigation: ref-counted alternative if observed                                                                                                                        |
| A4  | RhythmGameSettings rendering in light-theme (`bg-white text-gray-700`) is a visible bug                                                                                                                          | 13-Component Audit | The component is wrapped in `<Modal>` which may inject a different surface. UAT-confirm before fixing.                                                                                                                              |
| A5  | Removing 7 rhythm paths from `LANDSCAPE_ROUTES` and switching `OrientationController` to `lockOrientation('portrait-primary')` for those paths is desired (rhythm should NOT force-lock landscape going forward) | Pitfall 2          | If user actually wants rhythm to keep `landscape-primary` lock on Android while delegating prompt to context, decision needs to flip. Discuss-phase D-13 reads as "remove from array entirely" → this is the correct interpretation |

## Open Questions

1. **Should `RhythmGameSettings` modal be glass-pattern-converted?**
   - What we know: It uses `bg-white text-gray-700` directly. Code-style matches CSS-class-pre-glass-migration era.
   - What's unclear: Whether the surrounding `<Modal>` overrides the surface, or whether this component is genuinely visually broken.
   - Recommendation: UAT step "open Settings modal during a rhythm game" — if it looks fine, mark out-of-scope; if broken, log into audit punch list.

2. **Should `OrientationController` lock orientation to `'portrait-primary'` on rhythm routes after removal?**
   - What we know: Today, when route is in `LANDSCAPE_ROUTES`, controller calls `lockOrientation('landscape-primary')`. After removal, it calls `lockOrientation('portrait-primary')`.
   - What's unclear: Whether the user wants rhythm to stop force-locking landscape on Android PWA (where the `useLandscapeLock` hook ALSO calls `screen.orientation.lock('landscape')`). Answer is yes per D-15/D-17 — rhythm becomes content-driven.
   - Recommendation: Audit `useLandscapeLock` calls in rhythm wrappers — they currently force landscape on Android PWA. For Phase 34 content-driven model, those calls should also become conditional on context. **Flag for planner attention** — this could be a missed coordination point.

3. **Does `useLandscapeLock` need a context-driven variant?**
   - What we know: All 6 rhythm wrappers + ArcadeRhythmGame call `useLandscapeLock()` unconditionally. On Android PWA this enters fullscreen + locks orientation.
   - What's unclear: If a renderer declares `needsLandscape=false` for a short pattern but the wrapper still calls `useLandscapeLock()`, Android PWA will force landscape regardless of content-driven decision.
   - Recommendation: Either (a) gate `useLandscapeLock` on context (`useLandscapeLock(needsLandscape)`), or (b) accept this asymmetry — Android PWA is rare, content-driven UX is iOS-Safari-focused. Option (b) is faster to ship and matches D-12 ship-don't-gold-plate; option (a) is more "correct." **Defer decision to discuss/plan.** Could become a deferred follow-up.

## Sources

### Primary (HIGH confidence)

- `src/App.jsx` lines 269-285 — `LANDSCAPE_ROUTES` literal and `OrientationController` usage [VERIFIED]
- `src/components/layout/AppLayout.jsx` lines 18-32 — `gameRoutes` array [VERIFIED]
- `src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx` — multi-stave rendering, dimensions, beat math [VERIFIED]
- `src/components/games/rhythm-games/MixedLessonGame.jsx` — renderer swap mechanism (line 604), `useRotatePrompt`+`RotatePromptOverlay` inline pattern (lines 75, 577, 619) [VERIFIED]
- `src/components/games/rhythm-games/{6 wrappers}.jsx` — all use the inline-overlay pattern [VERIFIED via grep]
- `src/hooks/useRotatePrompt.js` — viewport+orientation+localStorage gate, no route awareness [VERIFIED]
- `tailwind.config.js` lines 1-18 — Tailwind 3.4.1 with built-in landscape variant comment [VERIFIED]
- `package.json` lines 47-79 — version pins for tailwindcss, vexflow, vitest [VERIFIED]
- `docs/vexflow-notation/vexflow-guidelines.md` line 55 — 300-400px per measure recommendation [CITED]
- `.planning/phases/34-responsive-rhythm-renderers-non-arcade/34-CONTEXT.md` — all 17 locked decisions [CITED]

### Secondary (MEDIUM confidence)

- iPhone SE 375×667 viewport — well-known device specs [CITED: iOS docs and discuss-phase]
- React 18 useEffect cleanup ordering under StrictMode — official React docs guarantee unmount cleanup runs before next mount effect within the same commit [CITED: React docs]

### Tertiary (LOW confidence)

- Threshold value 9 beats — derived from synthesizing VexFlow density guidance + iPhone SE width + multi-stave layout. Confidence MEDIUM-LOW; marked for UAT confirmation.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries are already in use; versions verified from package.json
- Architecture: HIGH — codebase shape verified by direct file inspection; the one nuance (overlay rendered inline by each wrapper) is documented and incorporated
- Pitfalls: HIGH on Pitfalls 1, 2, 4, 5; MEDIUM on Pitfall 3 (StrictMode flicker — theoretical, not observed); MEDIUM on Pitfall 6 (legibility — UAT-confirmable)
- Threshold value: MEDIUM — recommendation grounded in research but not user-tested

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (30 days; codebase + libs are stable)
