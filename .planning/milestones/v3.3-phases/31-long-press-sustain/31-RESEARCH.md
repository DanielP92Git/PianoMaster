# Phase 31: Long-Press Sustain — Research

**Researched:** 2026-04-14
**Domain:** Touch/pointer event handling, progressive ring animation, scoring extension, React game state machines
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Filling ring around tap area fills clockwise while child holds. Green flash on successful completion (100% of required duration). Respects reduced-motion preference.
- **D-02:** Sustained piano sound plays for the full hold duration — `createPianoSound` already supports a `duration` parameter. Sound starts on press-down and sustains while held.
- **D-03:** 70% minimum hold duration for PERFECT score. Half note at 120 BPM = 1.0s requires 0.7s hold.
- **D-04:** Partial credit via 3-tier scoring: 70%+ = PERFECT, 40–69% = GOOD ("Almost!"), below 40% = MISS. Matches existing timing threshold tiers.
- **D-05:** Hold duration requirement scales with note value — whole note requires roughly twice the hold of a half note (both use same percentage thresholds).
- **D-06:** Quarter notes remain simple taps (click/touchstart only). Only half notes and whole notes require sustained hold.
- **D-07:** Tap area shows "HOLD" label and ring outline for hold notes, "TAP" label for tap notes (before pressing).
- **D-08:** In pulse game, the metronome visual stretches across multiple beat positions to signal hold notes — a half note spans 2 beat positions visually.

### Claude's Discretion

- Exact ring animation implementation (CSS animation, SVG arc, canvas)
- Pointer event strategy (pointer events vs touch+mouse events)
- How to determine "next expected note" in listen&tap flow to show correct tap area state
- Whether to add hold tolerance scaling by node type (easier threshold for Discovery nodes)
- Exact i18n keys for "TAP" / "HOLD" labels
- Whether dotted notes (dotted half, dotted quarter) also require hold — if they exist in current patterns

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                    | Research Support                                                                                                                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PLAY-01 | Half/whole notes in listen&tap and pulse require sustained long press matching note duration (piano-like feel) | Hold detection via pointer events + `pressStartTimeRef`; hold duration from `durationUnits` in `DURATION_INFO`; ring animation via SVG arc or `conic-gradient`; scoring via 3-tier thresholds applied to hold percentage |

</phase_requirements>

---

## Summary

Phase 31 adds a sustained-hold mechanic to two rhythm game renderers: `RhythmTapQuestion` (listen&tap) and `PulseQuestion` (pulse). Currently both renderers use a click-or-touchstart model — the interaction is complete on press-down. This phase splits the interaction into press-start and press-end events so that half notes and whole notes score based on how long the child held, not just when they pressed.

The codebase provides most of what is needed. `createPianoSound(time, volume, duration)` already accepts a duration and creates a properly enveloped sustained note. `DURATION_INFO` provides the sixteenth-note unit count for every duration code, which converts directly to milliseconds at any tempo. `TapArea.jsx` is a simple button component that accepts `onTap` and can be extended cleanly with new `onPressStart`/`onPressEnd` props and ring-progress state.

The key implementation challenge is the ring visual feedback. The best approach is an SVG circle with `stroke-dashoffset` animation driven by a `requestAnimationFrame` loop — this gives sub-frame smoothness without the paint cost of CSS `conic-gradient` and avoids the complexity of a canvas. The reduced-motion fallback is opacity fill (matches the existing `beatPulse` pattern in `PulseQuestion`).

**Primary recommendation:** Use pointer events (`onPointerDown`/`onPointerUp`/`onPointerCancel`) with `element.setPointerCapture()` for reliable cross-device hold detection. Drive the ring with `requestAnimationFrame` + SVG `stroke-dashoffset`. Score hold percentage via `(releaseTime - pressTime) / requiredHoldMs`.

---

## Project Constraints (from CLAUDE.md)

- **SVG imports:** Use `import Icon from './icon.svg?react'` (`?react` suffix required)
- **Tailwind CSS 3** with glassmorphism design system — glass card pattern: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`
- **i18next** — i18n keys must be added to `src/locales/en/common.json` AND `src/locales/he/common.json`
- **Accessibility:** Reduced-motion preference must be respected — ring animation must degrade gracefully
- **Testing:** Vitest + `@testing-library/react`. Test files live as siblings or in `__tests__/` next to source
- **Pre-commit:** Husky + lint-staged runs ESLint + Prettier on staged files

---

## Standard Stack

### Core (already in project — no new installs required)

| Library                           | Version      | Purpose                                             | Why Standard                                                                             |
| --------------------------------- | ------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| React 18                          | 18.x         | Component state + lifecycle                         | Project-wide [VERIFIED: CLAUDE.md]                                                       |
| Web Audio API                     | native       | Sustained piano sound via `createPianoSound`        | Already used in both renderers [VERIFIED: codebase grep]                                 |
| SVG (inline)                      | native       | Ring progress animation                             | Zero-dependency, sub-frame update via `stroke-dashoffset` [VERIFIED: MDN pattern]        |
| Pointer Events API                | native       | Hold detection — captures across touch/mouse/stylus | Better than touchstart+mousedown; supports `setPointerCapture` [CITED: MDN PointerEvent] |
| framer-motion / `useMotionTokens` | project util | Reduced-motion detection                            | Already used in PulseQuestion [VERIFIED: codebase read]                                  |

### No New Dependencies

All required capabilities are native browser APIs or already-imported project utilities. [VERIFIED: codebase analysis]

---

## Architecture Patterns

### How Hold Duration is Calculated

`DURATION_INFO` gives `durationUnits` in sixteenth-note units for every duration code:

- `q` = 4 units (quarter note)
- `h` = 8 units (half note)
- `w` = 16 units (whole note)
- `hd` = 12 units (dotted half)

Convert to milliseconds at any tempo:

```javascript
// Source: durationInfo.js + CONTEXT.md code_context
const holdDurationMs = (beat.durationUnits / 4) * (60000 / tempo);
// h at 80 BPM: (8/4) * (60000/80) = 2 * 750 = 1500ms required
// h at 120 BPM: (8/4) * (60000/120) = 2 * 500 = 1000ms required
// w at 80 BPM: (16/4) * (60000/80) = 4 * 750 = 3000ms required
```

[VERIFIED: durationInfo.js read + CONTEXT.md code_context]

### How to Identify Hold Notes vs Tap Notes

A note is a "hold note" if its `durationUnits >= 8` (half note or longer):

```javascript
function isHoldNote(durationUnits) {
  return durationUnits >= 8; // half note (8) and whole note (16)
}
```

For `RhythmTapQuestion`, the current pattern is a binary array — each `1` is a beat onset at a given index. The renderer must convert the binary pattern to vexDurations to know each onset's duration. `resolveByTags` already returns `vexDurations` alongside `binary`. The pattern playback in `startFlow` schedules notes from the binary array; the renderer needs the `vexDurations` array to know which onset index has a hold note.

For `PulseQuestion`, beats are the static `PULSE_BEATS` array where every beat is `{ durationUnits: 4, isRest: false }` — all quarter notes. Hold notes in the pulse game only appear if node config provides a different beat structure (e.g., a node with half-note pulse). Since `PULSE_BEATS` is hard-coded to quarters, the pulse game hold mechanic only fires when the node explicitly passes a beat structure with halves/wholes. [VERIFIED: PulseQuestion.jsx line 38-43]

### Recommended Project Structure — Changes Only

```
src/components/games/rhythm-games/
├── components/
│   ├── TapArea.jsx              # Extend: onPressStart, onPressEnd, isHoldNote, holdProgress, holdDurationMs
│   └── HoldRing.jsx             # NEW: SVG ring progress component
├── renderers/
│   ├── RhythmTapQuestion.jsx    # Add handlePressStart/handlePressEnd, vexDurations tracking
│   └── PulseQuestion.jsx        # Add handlePressStart/handlePressEnd, stretched beat indicator
└── utils/
    └── holdScoringUtils.js      # NEW: scoreHold(holdMs, requiredMs) → PERFECT|GOOD|MISS
```

### Pattern 1: Pointer Event Hold Detection

Use `onPointerDown` + `onPointerUp` + `onPointerCancel` with `element.setPointerCapture(e.pointerId)`. This ensures the press-end fires even if the finger slides off the element.

```javascript
// Source: MDN PointerEvent documentation + project pattern analysis
const handlePressStart = useCallback(
  (e) => {
    if (phase !== PHASES.USER_PERFORMANCE) return;
    e.currentTarget.setPointerCapture(e.pointerId); // keep capture on slide-off
    pressStartTimeRef.current = audioEngine.getCurrentTime();

    if (isHoldNote(currentBeat.durationUnits)) {
      // Start ring animation via rAF
      startRingAnimation(holdDurationMs);
      // Start sustained piano sound
      audioEngine.createPianoSound(
        pressStartTimeRef.current,
        0.8,
        holdDurationMs / 1000
      );
    } else {
      // Quarter note: immediate tap scoring (existing path)
      handleTap();
    }
  },
  [phase, audioEngine, currentBeat, holdDurationMs]
);

const handlePressEnd = useCallback(
  (e) => {
    if (pressStartTimeRef.current === null) return;
    const releaseTime = audioEngine.getCurrentTime();
    const holdMs = (releaseTime - pressStartTimeRef.current) * 1000;
    pressStartTimeRef.current = null;
    stopRingAnimation();

    if (isHoldNote(currentBeat.durationUnits)) {
      const quality = scoreHold(holdMs, holdDurationMs);
      // emit feedback, accumulate result
    }
  },
  [audioEngine, currentBeat, holdDurationMs]
);
```

[ASSUMED — exact integration points need verification during implementation]

### Pattern 2: SVG Ring Progress Animation

Clockwise-filling ring using SVG circle `stroke-dashoffset`. This approach:

- Runs at display refresh rate via `requestAnimationFrame`
- Has no layout reflow cost (SVG attribute mutation only)
- Degrades cleanly: show solid ring at 100% for reduced-motion
- Does not depend on CSS `@keyframes` timing which would conflict with real-time press duration

```javascript
// Source: SVG stroke-dasharray/dashoffset pattern [CITED: developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset]
const RING_CIRCUMFERENCE = 2 * Math.PI * 44; // radius=44 → circumference≈276px

function HoldRing({ progress, isComplete, reducedMotion }) {
  // progress: 0.0 to 1.0
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  return (
    <svg width="100" height="100" className="absolute inset-0 -rotate-90">
      {/* Track ring */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="4"
        strokeDasharray={RING_CIRCUMFERENCE}
      />
      {/* Fill ring */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke={isComplete ? "#4ade80" : "#818cf8"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={reducedMotion ? 0 : offset}
      />
    </svg>
  );
}
```

The `progress` value is updated via a `requestAnimationFrame` loop stored in a ref. The rAF loop reads `Date.now()` (or `performance.now()`) to compute elapsed time and sets React state via a batched update.

**Reduced-motion alternative:** When `reducedMotion` is true, skip the ring entirely and show a solid highlight at 100% opacity when press starts, then a green flash on completion. This matches the existing `beatPulse` reduced-motion pattern in `PulseQuestion.jsx` (line 598). [VERIFIED: PulseQuestion.jsx read]

### Pattern 3: Hold Scoring — 3-Tier

```javascript
// Source: CONTEXT.md D-03, D-04
export function scoreHold(actualHoldMs, requiredHoldMs) {
  if (requiredHoldMs <= 0) return "MISS";
  const ratio = actualHoldMs / requiredHoldMs;
  if (ratio >= 0.7) return "PERFECT";
  if (ratio >= 0.4) return "GOOD";
  return "MISS";
}
```

[VERIFIED: CONTEXT.md D-03 and D-04 — thresholds are locked decisions]

### Pattern 4: Pulse Game Stretched Beat Indicator (D-08)

The existing `PULSE_BEATS` is `[{durationUnits:4}, {durationUnits:4}, {durationUnits:4}, {durationUnits:4}]` — all quarters. If a node config passes half-note beats, the `MetronomeDisplay` dot row needs to show spanning indicators. A half note at beat position 0 spans positions 0-1 visually.

The cleanest implementation is a CSS `grid-column: span 2` approach: render each beat in a CSS grid where the column width is one quarter-note unit, and half notes get `span 2`, whole notes get `span 4`.

```jsx
// Stretched beat indicator (new component or modified MetronomeDisplay)
beats.map((beat, i) => {
  const span = beat.durationUnits / 4; // quarter=1, half=2, whole=4
  return (
    <div
      key={i}
      style={{ gridColumn: `span ${span}` }}
      className={`h-3 rounded-full ${isCurrent ? "bg-blue-400" : "bg-white/20"}`}
    />
  );
});
```

[ASSUMED — exact MetronomeDisplay API needs verification during implementation]

### Anti-Patterns to Avoid

- **`onClick` for hold notes:** `onClick` fires on `mouseup` with no duration information. Must use `onPointerDown`/`onPointerUp` to measure elapsed time.
- **CSS animation for ring progress:** `@keyframes` runs on a fixed timeline, not real-time hold progress. Use rAF + `stroke-dashoffset` mutation instead.
- **`addEventListener` inside React component:** Prefer React synthetic event props (`onPointerDown`, etc.) on the button element. Only use `addEventListener` on `window`/`document` for pointer cancel fallback.
- **Blocking the tap path:** Quarter notes must not go through the hold path. Check `isHoldNote()` immediately on press-start and branch early.
- **Not stopping rAF on component unmount:** The rAF loop must be cancelled in the cleanup `useEffect` or it will keep updating a stale ref.

---

## Don't Hand-Roll

| Problem                     | Don't Build                          | Use Instead                                       | Why                                                                                                   |
| --------------------------- | ------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Multi-device hold detection | Custom touchstart/mousedown combiner | `PointerEvents` + `setPointerCapture`             | Handles touch, mouse, stylus uniformly; capture prevents missed `pointerup` on slide-off [CITED: MDN] |
| Smooth ring animation       | CSS transition on React `style` prop | `requestAnimationFrame` + SVG `stroke-dashoffset` | CSS transitions have fixed durations; rAF reflects real hold time [VERIFIED: SVG animation pattern]   |
| Duration-to-ms conversion   | Lookup table                         | `(durationUnits / 4) * (60000 / tempo)` formula   | `DURATION_INFO` already has `durationUnits`; formula handles any tempo [VERIFIED: durationInfo.js]    |
| Hold scoring                | Inline thresholds                    | `scoreHold()` utility in `holdScoringUtils.js`    | Testable in isolation, mirrors `scoreTap()` pattern [VERIFIED: rhythmScoringUtils.js pattern]         |

---

## Common Pitfalls

### Pitfall 1: Missed Pointer Release When Finger Slides Off Button

**What goes wrong:** Child presses, then slides finger outside the button boundary while holding. `onPointerUp` fires outside the button, not inside — so the press-end is never detected. The hold stays "open" indefinitely.

**Why it happens:** Without pointer capture, events only fire on the element under the pointer.

**How to avoid:** Call `e.currentTarget.setPointerCapture(e.pointerId)` inside `onPointerDown`. This routes all subsequent pointer events for that pointer ID to the element, regardless of position.

**Warning signs:** Hold ring never completes, or hold sound never stops.

### Pitfall 2: rAF Loop Stale Ref After Component Unmount

**What goes wrong:** `requestAnimationFrame` callback fires after the component unmounts and tries to update state, causing a React warning and possible crash.

**Why it happens:** rAF callbacks are not automatically cancelled on unmount.

**How to avoid:** Store the rAF ID in a `ref` (`rafIdRef`). In the component's cleanup `useEffect` (the one already used for `stopContinuousMetronome`), add `cancelAnimationFrame(rafIdRef.current)`.

**Warning signs:** Console warning "Can't perform a React state update on an unmounted component."

### Pitfall 3: vexDurations Not Available When Scheduling Hold Notes in RhythmTapQuestion

**What goes wrong:** `RhythmTapQuestion` receives binary pattern arrays from `resolveByTags`. The binary array has no per-beat duration info — it's just 0s and 1s. The renderer needs per-onset duration to know which onset is a hold note.

**Why it happens:** `resolveByTags` returns both `binary` AND `vexDurations` (the human-readable codes), but currently `patternInfoRef.current` only stores `{ pattern, startTime, beatDuration }` — the `vexDurations` array is discarded after the pattern selection.

**How to avoid:** Store `vexDurations` alongside `pattern` in `patternInfoRef.current`. During `USER_PERFORMANCE`, maintain a pointer to the "current expected onset index" so the tap area can show TAP vs HOLD state.

**Warning signs:** Tap area always shows "TAP" even on half-note patterns, or hold scoring never triggers.

### Pitfall 4: Ring Progress State Causes Excessive Re-renders

**What goes wrong:** Updating `holdProgress` state 60 times/second via rAF + `setState` causes the entire `TapArea` subtree to re-render at 60fps, which may cause jank on low-end devices (the target audience is children on tablets).

**Why it happens:** React batches state updates but each rAF tick is still a render cycle.

**How to avoid:** Update SVG `strokeDashoffset` via a direct DOM ref (`ringCircleRef.current.setAttribute(...)`) instead of React state. The ring visuals are cosmetic — they don't need to go through React's render path. Store only the `isComplete` boolean as React state for the final green flash.

**Warning signs:** Chrome DevTools shows 60+ renders/second during hold in React DevTools Profiler.

### Pitfall 5: Hold Sound Overruns the Note's Natural Duration

**What goes wrong:** If the child holds longer than the note's full duration, the piano sound plays indefinitely past the note end.

**Why it happens:** `createPianoSound` accepts a `duration` and stops the buffer source at `time + duration`. If we call it with `duration = holdDurationMs / 1000`, the sound correctly stops at the end of the note's natural length — even if the child continues holding.

**How to avoid:** Pass the full note duration (not the actual hold time) as the `duration` parameter to `createPianoSound`. This is correct: the sound always plays for the full note length starting at press-down; scoring is separate from audio duration.

**Warning signs:** Sustained piano note that never stops.

### Pitfall 6: Dotted Notes — Ambiguous Hold Requirement

**What goes wrong:** `durationInfo.js` includes `hd` (dotted half, 12 units) and `qd` (dotted quarter, 6 units). With the current `isHoldNote(durationUnits >= 8)` rule, `hd` at 12 units is a hold note but `qd` at 6 units is not. This is correct for the current curriculum, but `hd` patterns may appear in later units.

**Why it happens:** The phase only explicitly covers half and whole notes, but `hd` (dotted half) is longer than a half note and is in `DURATION_INFO`.

**How to avoid:** The `isHoldNote(durationUnits >= 8)` rule correctly includes `hd` (12) and `w` (16), and excludes `qd` (6) and `q` (4). Document this explicitly so future phases know the rule. No special casing needed. [VERIFIED: durationInfo.js read]

---

## Code Examples

### Hold Duration Calculation

```javascript
// Source: CONTEXT.md code_context, durationInfo.js
import { DURATION_INFO } from "../utils/durationInfo";

function getHoldDurationMs(durationCode, tempo) {
  const info = DURATION_INFO[durationCode];
  if (!info) return 0;
  return (info.durationUnits / 4) * (60000 / tempo);
}

// Examples at 80 BPM:
// getHoldDurationMs('q', 80)  → (4/4) * 750 =  750ms
// getHoldDurationMs('h', 80)  → (8/4) * 750 = 1500ms
// getHoldDurationMs('w', 80)  → (16/4) * 750 = 3000ms
// getHoldDurationMs('hd', 80) → (12/4) * 750 = 2250ms
```

### Hold Scoring Utility

```javascript
// Source: CONTEXT.md D-03, D-04 (locked decisions)
// File: src/components/games/rhythm-games/utils/holdScoringUtils.js

export const HOLD_THRESHOLDS = {
  PERFECT: 0.7, // 70%+ of required hold duration
  GOOD: 0.4, // 40-69% → GOOD ("Almost!")
  // below 40% → MISS
};

export function scoreHold(actualHoldMs, requiredHoldMs) {
  if (requiredHoldMs <= 0) return "MISS";
  const ratio = actualHoldMs / requiredHoldMs;
  if (ratio >= HOLD_THRESHOLDS.PERFECT) return "PERFECT";
  if (ratio >= HOLD_THRESHOLDS.GOOD) return "GOOD";
  return "MISS";
}

// Mirror of scoreTap()'s return shape for consistency:
// returns 'PERFECT' | 'GOOD' | 'MISS'
```

### SVG Ring Component (HoldRing.jsx)

```jsx
// Source: SVG stroke-dashoffset animation pattern
// [CITED: developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset]
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~276.46

export function HoldRing({
  progress = 0,
  isComplete = false,
  reducedMotion = false,
}) {
  const ringRef = useRef(null);

  // Update dashoffset via DOM ref to avoid re-render on every rAF tick
  useEffect(() => {
    if (ringRef.current && !reducedMotion) {
      const offset = CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)));
      ringRef.current.setAttribute("stroke-dashoffset", offset);
    }
  }, [progress, reducedMotion]);

  return (
    <svg
      width="108"
      height="108"
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 -rotate-90"
      aria-hidden="true"
    >
      {/* Track ring */}
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="5"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset="0"
      />
      {/* Progress ring — updated via ref, not React state */}
      <circle
        ref={ringRef}
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        stroke={isComplete ? "#4ade80" : "#818cf8"}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={reducedMotion ? 0 : CIRCUMFERENCE}
        style={{ transition: isComplete ? "stroke 0.15s ease" : "none" }}
      />
    </svg>
  );
}
```

### TapArea Extension (new props)

```jsx
// Extended TapArea.jsx signature (additions only):
export function TapArea({
  onTap,           // existing — for quarter notes
  onPressStart,    // NEW — for hold notes (and fallback for quarter)
  onPressEnd,      // NEW — release handler
  isHoldNote,      // NEW — boolean, shows ring + HOLD label
  holdProgress,    // NEW — 0.0 to 1.0, drives HoldRing (via DOM ref)
  holdRingRef,     // NEW — ref to SVG ring circle for rAF direct mutation
  feedback,
  isActive,
  title,
  className,
})
```

### Pointer Event Handler Pattern

```javascript
// Pattern for both RhythmTapQuestion and PulseQuestion
const pressStartTimeRef = useRef(null);
const rafIdRef = useRef(null);
const holdRingCircleRef = useRef(null); // passed to HoldRing

const handlePressStart = useCallback(
  (e) => {
    if (!isHoldNoteExpected) {
      // Quarter note — call existing handleTap() directly
      handleTap();
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    pressStartTimeRef.current = performance.now();
    const requiredMs = holdDurationMs; // calculated from current beat's durationUnits

    // Start sustained audio
    audioEngine.createPianoSound(
      audioEngine.getCurrentTime(),
      0.8,
      requiredMs / 1000
    );

    // Start rAF ring animation
    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / requiredMs);
      if (holdRingCircleRef.current) {
        const offset = CIRCUMFERENCE * (1 - progress);
        holdRingCircleRef.current.setAttribute(
          "stroke-dashoffset",
          String(offset)
        );
      }
      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(animate);
      }
    };
    rafIdRef.current = requestAnimationFrame(animate);
  },
  [isHoldNoteExpected, holdDurationMs, audioEngine, handleTap]
);

const handlePressEnd = useCallback(() => {
  cancelAnimationFrame(rafIdRef.current);
  if (pressStartTimeRef.current === null) return;
  const holdMs = performance.now() - pressStartTimeRef.current;
  pressStartTimeRef.current = null;
  const quality = scoreHold(holdMs, holdDurationMs);
  // score and show feedback...
}, [holdDurationMs]);
```

[ASSUMED — exact closure variables depend on final component structure]

---

## Integration Points — Detailed

### RhythmTapQuestion Changes

1. **Store `vexDurations` in `patternInfoRef`:** `resolveByTags` returns `vexDurations` but the current `patternInfoRef.current` only stores `{ pattern, startTime, beatDuration }`. Add `vexDurations` to the stored object.

2. **Track current onset index during USER_PERFORMANCE:** Maintain a `currentOnsetIndexRef` that advances as the child taps/holds. This lets the tap area know whether the "next expected note" is a quarter, half, or whole.

3. **Split `handleTap` → `handlePressStart` + `handlePressEnd`:** The `handleTap` function currently fires on `onClick`. The new path fires on `onPointerDown` for quarter notes (immediate score) and `onPointerDown` + `onPointerUp` for hold notes (duration-based score).

4. **`TapArea` receives `isHoldNote` prop:** Derived from `vexDurations[currentOnsetIndex]` when `phase === PHASES.USER_PERFORMANCE`.

### PulseQuestion Changes

1. **`PULSE_BEATS` is static quarters:** No hold notes in pulse game unless the node config provides beats with `durationUnits >= 8`. The current standard pulse exercise uses all quarters so hold mechanic only activates on nodes with half-note beats.

2. **Beat indicator spanning (D-08):** The pulsing circle in `PulseQuestion` is a single round button. For half-note beats, D-08 calls for a "stretched indicator." This affects the `MetronomeDisplay` or a custom beat-row indicator above the circle, not the tap circle itself.

3. **`handleTap` → split:** Same pattern as RhythmTapQuestion — detect the duration of the current expected beat and branch.

### `rhythmScoringUtils.js` vs New `holdScoringUtils.js`

`scoreTap()` scores onset timing only. Hold scoring is a different problem (duration ratio, not time offset). Create a new `holdScoringUtils.js` file to mirror the single-responsibility pattern of `scoreTap`. Do not modify `scoreTap`. [VERIFIED: rhythmScoringUtils.js read — function signature has no duration parameter]

---

## State of the Art

| Old Approach                             | Current Approach                     | When Changed                  | Impact                                                                           |
| ---------------------------------------- | ------------------------------------ | ----------------------------- | -------------------------------------------------------------------------------- |
| `touchstart` + `mousedown` dual handlers | `PointerEvents` unified API          | Modern browsers since 2017    | Single handler for touch, mouse, stylus [CITED: MDN PointerEvent browser compat] |
| CSS `transition` for ring                | rAF + SVG attribute mutation         | N/A — project-specific choice | Avoids React re-render on every animation frame [ASSUMED]                        |
| `onClick` single-event model             | `onPointerDown` + `onPointerUp` pair | Phase 31                      | Enables duration measurement [VERIFIED: phase requirements]                      |

---

## Assumptions Log

| #   | Claim                                                                                                                                                              | Section                                           | Risk if Wrong                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A1  | Updating SVG `strokeDashoffset` via DOM ref is faster than React state updates for 60fps ring animation                                                            | Architecture Patterns — Ring Animation, Pitfall 4 | Minor: could cause jank on low-end devices; fix by using DOM ref approach as described |
| A2  | `setPointerCapture` is available and reliable on all target devices (iOS Safari 13+, Android Chrome)                                                               | Pattern 1 — Pointer Events                        | If unavailable: fallback to `window.addEventListener('pointerup')` on press-start      |
| A3  | `PULSE_BEATS` quarter-only static array means hold mechanic in pulse game is only needed when node config provides half-note beats (currently no such nodes exist) | Integration Points — PulseQuestion                | If wrong: all 4 pulse beats would need hold logic immediately; adds scope              |
| A4  | The "current expected onset index" in `RhythmTapQuestion` can be tracked via a ref that increments per tap/hold-complete                                           | Integration Points — RhythmTapQuestion            | If wrong: need alternative approach to map current beat to vexDurations slot           |
| A5  | `MetronomeDisplay` can be extended with a stretched-beat variant without needing a full replacement                                                                | Architecture Patterns — Pattern 4                 | If wrong: create a new component rather than extend MetronomeDisplay                   |

**A2 verification:** [CITED: caniuse.com/pointer — PointerEvents supported in iOS Safari 13+ (2019), Android Chrome 55+ (2016)] — effectively all modern target devices.

---

## Validation Architecture

### Test Framework

| Property           | Value                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Framework          | Vitest + @testing-library/react                                                   |
| Config file        | `vite.config.js` (vitest section)                                                 |
| Quick run command  | `npx vitest run src/components/games/rhythm-games/utils/holdScoringUtils.test.js` |
| Full suite command | `npm run test:run`                                                                |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                      | Test Type | Automated Command                                                                        | File Exists? |
| ------- | ------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------- | ------------ |
| PLAY-01 | `scoreHold(700, 1000)` returns `PERFECT` (70% threshold)      | unit      | `npx vitest run src/components/games/rhythm-games/utils/holdScoringUtils.test.js`        | Wave 0       |
| PLAY-01 | `scoreHold(500, 1000)` returns `GOOD` (50% in 40-69% range)   | unit      | same                                                                                     | Wave 0       |
| PLAY-01 | `scoreHold(300, 1000)` returns `MISS` (30% < 40%)             | unit      | same                                                                                     | Wave 0       |
| PLAY-01 | `getHoldDurationMs('h', 120)` returns `1000`                  | unit      | same                                                                                     | Wave 0       |
| PLAY-01 | `getHoldDurationMs('w', 120)` returns `2000` — twice the half | unit      | same                                                                                     | Wave 0       |
| PLAY-01 | TapArea renders "HOLD" label when `isHoldNote=true`           | component | `npx vitest run src/components/games/rhythm-games/components/__tests__/TapArea.test.jsx` | Wave 0       |
| PLAY-01 | TapArea renders "TAP" label when `isHoldNote=false`           | component | same                                                                                     | Wave 0       |

### Sampling Rate

- **Per task commit:** `npx vitest run src/components/games/rhythm-games/utils/holdScoringUtils.test.js`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/components/games/rhythm-games/utils/holdScoringUtils.test.js` — covers PLAY-01 scoring thresholds
- [ ] `src/components/games/rhythm-games/components/__tests__/TapArea.test.jsx` — covers HOLD/TAP label rendering (TapArea has no test file yet)

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code changes within the existing React/Vite project. No new external tools, services, databases, or CLI utilities required. All APIs (Pointer Events, SVG, rAF, Web Audio API) are native browser APIs already used by the project.

---

## Open Questions

1. **Does any existing rhythm unit already use half/whole notes in listen&tap patterns?**
   - What we know: `rhythmUnit4-8Redesigned.js` files are modified per git status, and unit data uses VexFlow duration codes
   - What's unclear: whether existing nodes with `patternTags: ['quarter-half']` are already active in the trail
   - Recommendation: Check `src/data/units/rhythmUnit*.js` for nodes using `durations: ['h', 'w']` or `patternTags` that include halves — this determines whether the feature is immediately exercisable

2. **Should the "current onset index" tracker in RhythmTapQuestion reset per-measure or per-session?**
   - What we know: The listen&tap flow is a single measure played once, so the session and the measure are the same
   - What's unclear: edge cases where user misses the first beat and starts from the second
   - Recommendation: Reset `currentOnsetIndex` to 0 when `userPerformanceStartTimeRef` is set (same point where `hasUserStartedTapping` transitions to true)

3. **Does `MetronomeDisplay` accept custom beat-width data, or is it hardcoded to equal-width dots?**
   - What we know: `MetronomeDisplay` is used in both renderers with `currentBeat` and `timeSignature` props
   - What's unclear: the internal rendering of beat dots — not read in this session
   - Recommendation: Read `src/components/games/rhythm-games/components/MetronomeDisplay.jsx` during planning to determine whether D-08 stretched indicator is an extension or a new component

---

## Sources

### Primary (HIGH confidence)

- `src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx` — full read; verified handleTap, patternInfoRef, vexDurations gap
- `src/components/games/rhythm-games/renderers/PulseQuestion.jsx` — full read; verified PULSE_BEATS, handleTap, beatPulse reduced-motion pattern
- `src/components/games/rhythm-games/components/TapArea.jsx` — full read; verified current API (onClick-only)
- `src/components/games/rhythm-games/utils/durationInfo.js` — full read; verified durationUnits mapping
- `src/components/games/rhythm-games/utils/rhythmTimingUtils.js` — full read; verified calculateTimingThresholds, EASY_NODE_TYPES
- `src/components/games/rhythm-games/utils/rhythmScoringUtils.js` — full read; verified scoreTap signature (no duration param)
- `src/hooks/useAudioEngine.js` — partial read (lines 385-447); verified createPianoSound(time, volume, duration, pitchShift)
- `src/contexts/AccessibilityContext.jsx` — full read; verified reducedMotion state shape
- `.planning/phases/31-long-press-sustain/31-CONTEXT.md` — full read; all locked decisions

### Secondary (MEDIUM confidence)

- MDN PointerEvent documentation — setPointerCapture, unified pointer model [CITED: developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture]
- MDN SVG stroke-dashoffset — clockwise fill animation pattern [CITED: developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset]
- caniuse.com/pointer-events — PointerEvents browser support matrix [CITED: caniuse.com/pointer]

### Tertiary (LOW confidence)

- rAF vs CSS transition performance comparison for high-frequency DOM updates — general community knowledge [ASSUMED — not benchmarked for this codebase]

---

## Metadata

**Confidence breakdown:**

- Hold duration formula: HIGH — derived directly from `durationInfo.js` `durationUnits` field
- Pointer events strategy: HIGH — MDN-cited, widely supported
- Ring animation approach (rAF + SVG): MEDIUM — proven pattern, but direct DOM mutation in React is a deliberate deviation from React norms; must verify no interference with React reconciliation
- vexDurations gap in RhythmTapQuestion: HIGH — verified by code read (patternInfoRef does not store vexDurations)
- Scoring thresholds: HIGH — locked decisions from CONTEXT.md D-03/D-04
- PulseQuestion hold scope (only non-quarter nodes): HIGH — verified PULSE_BEATS is static quarters array

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable domain — no external dependencies)
