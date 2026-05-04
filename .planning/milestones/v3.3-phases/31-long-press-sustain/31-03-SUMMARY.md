---
phase: 31-long-press-sustain
plan: "03"
subsystem: rhythm-games
tags: [hold-mechanic, pulse-game, svg-animation, rAF, stretched-beat-indicator, pointer-events]
dependency_graph:
  requires:
    - 31-01 (holdScoringUtils, HoldRing, TapArea extended, i18n keys)
  provides:
    - PulseQuestion with hold-press detection for half/whole note beats
    - Stretched beat indicator (D-08) via CSS grid span
    - rAF-driven HoldRing overlay on pulse button
  affects:
    - src/components/games/rhythm-games/renderers/PulseQuestion.jsx
tech_stack:
  added: []
  patterns:
    - Pointer capture (setPointerCapture) on button for reliable hold tracking across touch/mouse
    - rAF-driven SVG stroke-dashoffset mutation (no React re-render at 60fps)
    - CSS grid with gridColumn span for proportional beat duration visualization
    - Fallback to PULSE_BEATS constant when config.beats is absent (T-31-09 defense)
key_files:
  created: []
  modified:
    - src/components/games/rhythm-games/renderers/PulseQuestion.jsx
decisions:
  - Kept existing raw button (not replaced with TapArea) to preserve beat-synced pulse animation
  - Hold button path: onPointerDown/Up/Cancel with setPointerCapture; tap path: onClick + onTouchStart unchanged
  - Stretched indicator uses CSS grid (not MetronomeDisplay) because MetronomeDisplay renders equal-width circles
  - Stretched indicator only renders when beats contains hold notes; standard MetronomeDisplay for quarter-only exercises
  - holdFeedbackLabel replaces guidance text in instruction paragraph (no separate overlay needed)
  - audioEngine.createPianoSound guarded with existence check (audioEngine mock in tests lacks this method)
metrics:
  duration_seconds: 153
  completed_date: "2026-04-13"
  tasks_completed: 1
  tasks_total: 2
  files_created: 0
  files_modified: 1
---

# Phase 31 Plan 03: PulseQuestion Hold Mechanic Summary

**One-liner:** PulseQuestion wired with pointer-event hold detection, rAF ring animation, sustained piano audio, 3-tier hold scoring, and CSS-grid stretched beat indicator for half/whole note pulse exercises.

## Tasks Completed

| Task | Name                                                                   | Commit  | Files             |
| ---- | ---------------------------------------------------------------------- | ------- | ----------------- |
| 1    | Add hold-press detection and stretched beat indicator to PulseQuestion | 6f07cf2 | PulseQuestion.jsx |

## Task 2: Awaiting Human Verification

**Status:** Awaiting human verification (checkpoint:human-verify)

### What Was Built

Long-press sustain mechanic in the pulse game (PulseQuestion.jsx). The following was implemented:

**Hold mechanic (activates when beat.durationUnits >= 8):**

- `handlePressStart`: records `pressStartTimeRef`, starts rAF ring animation driving `holdRingCircleRef` stroke-dashoffset, calls `audioEngine.createPianoSound` with full note duration, records onset tap time
- `handlePressEnd`: cancels rAF, calls `scoreHold(holdMs, currentHoldDurationMs)`, triggers green flash (`setIsHoldComplete(true)`) for PERFECT, shows "Almost, hold longer!" feedback label for GOOD
- Button uses `onPointerDown` + `setPointerCapture` for reliable cross-device hold tracking; `touchAction: none` prevents scroll
- HoldRing SVG overlay absolutely positioned over the pulse button; driven imperatively via `holdRingCircleRef`

**Stretched beat indicator (D-08):**

- CSS grid with `gridTemplateColumns: repeat(N, 1fr)` where N = total quarter-note columns
- Each beat cell uses `gridColumn: span (durationUnits/4)` — half note spans 2, whole spans 4
- Renders only when `beats.some(b => isHoldNote(b.durationUnits))` — zero change for default quarter exercises
- Standard MetronomeDisplay still renders for quarter-only exercises

**Quarter-note exercises unchanged:**

- `onClick` + `onTouchStart` path untouched when `currentBeatIsHold === false`
- `PULSE_BEATS` constant (all quarters) used as fallback when `config.beats` is absent

**Cleanup:**

- `cancelAnimationFrame(rafIdRef.current)` added to unmount cleanup useEffect (T-31-08 mitigated)
- Hold state reset in `startFlow` when starting new round

### How to Verify

1. Run `npm run dev` and open the app at http://localhost:5174
2. **Verify NO regression on default pulse exercises:**
   - Navigate to the trail map, find a rhythm node that uses the basic pulse exercise (e.g., rhythm_1_1 or any quarter-note-only node)
   - Play the pulse exercise — verify it works identically to before (tap with beat, no HOLD label, no ring, MetronomeDisplay circles showing)
3. **If a node with half-note beats exists in the trail:**
   - Navigate to that node's pulse exercise
   - Verify the beat row shows stretched indicators (half notes span 2 columns, not equal-width dots)
   - Verify the tap area shows "HOLD" label for half-note beats (not "Tap with the beat!")
   - Press and hold — verify ring fills clockwise and sustained piano sound plays
   - Hold for full duration (70%+) — verify PERFECT green flash on ring
   - Release early (40-69%) — verify "Almost, hold longer!" text appears in instruction area
4. **If no half-note pulse node exists yet:**
   - Confirm the code compiles and the default pulse exercise works without regression
   - The hold mechanic infrastructure is in place for when such nodes are added
5. Run `npm run build` — verify build succeeds

**Resume signal:** Type "approved" or describe issues

## What Was Built

### PulseQuestion.jsx changes summary

**New imports:**

```javascript
import { HoldRing, CIRCUMFERENCE } from "../components/HoldRing";
import {
  scoreHold,
  isHoldNote,
  calcHoldDurationMs,
} from "../utils/holdScoringUtils";
```

**New state/refs:**

- `isHoldComplete` (state) — triggers green ring flash
- `holdFeedbackLabel` (state) — "Almost, hold longer!" text
- `pressStartTimeRef` (ref) — press start timestamp (performance.now())
- `rafIdRef` (ref) — rAF loop handle for cancellation
- `holdRingCircleRef` (ref) — SVG circle element for imperative stroke-dashoffset updates

**Derived values (inline, not memoized):**

- `beats = config.beats || PULSE_BEATS` — dynamic beat array
- `currentBeatInfo = beats[(currentBeat-1) % beats.length]` — info for active beat
- `currentBeatIsHold = isHoldNote(currentBeatInfo.durationUnits)` — tap vs hold mode
- `currentHoldDurationMs = calcHoldDurationMs(...)` — required hold in ms
- `hasHoldBeats = beats.some(b => isHoldNote(...))` — stretched indicator gate
- `totalColumns = beats.reduce(sum + durationUnits/4, 0)` — grid column count

**handlePressStart:** pointer-down handler — captures pointer, starts rAF ring, fires piano sound, records onset tap.

**handlePressEnd:** pointer-up/cancel handler — scores hold, green flash, feedback label, ring reset.

**Stretched beat indicator JSX:** CSS grid rendered above glass card when `hasHoldBeats`. Beat cells span proportionally.

**Button modifications:** `onPointerDown`/`onPointerUp`/`onPointerCancel` for hold beats; existing `onClick`/`onTouchStart` for tap beats. Both paths coexist based on `currentBeatIsHold`.

**HoldRing overlay:** `<div className="pointer-events-none absolute inset-0">` wrapping `<HoldRing ringRef={holdRingCircleRef} ...>` renders when `currentBeatIsHold && !reducedMotion`.

## Verification Results

- `npx vitest run src/components/games/rhythm-games/` — 151/151 tests PASS across 16 test files
- Pre-existing 8 unhandled rejections in ArcadeRhythmGame.test.js unchanged (documented in 31-01-SUMMARY.md, pre-dates this plan)
- All 12 acceptance criteria from task met (verified by grep)

## Deviations from Plan

### Auto-fix: audioEngine.createPianoSound guarded with existence check

**Found during:** Task 1 implementation
**Issue:** In tests, `audioEngine` is a mock that may not have `createPianoSound`. Calling it unconditionally would throw in test environments.
**Fix:** Wrapped call in `if (audioEngine.createPianoSound) { ... }` guard.
**Files modified:** PulseQuestion.jsx (handlePressStart)
**Rule:** Rule 1 (auto-fix bug — would crash in test environments)

### Design choice: inline holdFeedbackLabel in guidance text paragraph

**Reason:** The plan described showing a "holdFeedbackLabel" as a separate element but PulseQuestion has a single instruction `<p>` element. Rather than adding a separate overlay, `holdFeedbackLabel` replaces the guidance text in the existing paragraph via `holdFeedbackLabel || getGuidanceText()`. This avoids layout shift and is simpler.

### No other deviations. Plan executed as written.

## Threat Mitigations Applied

| Threat                           | Applied                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-31-08 (rAF loop leak)          | `cancelAnimationFrame(rafIdRef.current)` in unmount cleanup + `pressStartTimeRef.current !== null` check in animate loop |
| T-31-09 (config.beats injection) | `const beats = config.beats                                                                                              |     | PULSE_BEATS`— invalid/missing config falls back to safe default;`isHoldNote()` numeric check prevents non-numeric durationUnits from activating hold mode |

## Known Stubs

None. All hold mechanic code is fully implemented. The mechanic is dormant for quarter-note-only pulse exercises (the current default), which is the correct and expected behavior per Research assumption A3 and decision D-06.

## Self-Check: PASSED

- FOUND: src/components/games/rhythm-games/renderers/PulseQuestion.jsx (modified)
- FOUND commit 6f07cf2: feat(31-03): add hold-press detection and stretched beat indicator to PulseQuestion
- All acceptance criteria verified by grep (all 12 patterns found in file)
- 151/151 tests pass
