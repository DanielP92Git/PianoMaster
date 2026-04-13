# Phase 31: Long-Press Sustain - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement piano-like sustained press for half and whole notes in listen&tap and pulse exercises. Quarter notes remain simple taps. The child must hold their finger down for the note's full duration to score a correct answer, with a filling ring visual and sustained piano sound providing feedback.

</domain>

<decisions>
## Implementation Decisions

### Hold Feedback UX

- **D-01:** Filling ring around the tap area fills clockwise while the child holds. Green flash on successful completion (100% of required duration). Respects reduced-motion preference.
- **D-02:** Sustained piano sound plays for the full hold duration — `createPianoSound` already supports a `duration` parameter. Sound starts on press-down and sustains while held.

### Release Tolerance

- **D-03:** 70% minimum hold duration for PERFECT score. A half note at 120 BPM = 1.0s requires 0.7s hold.
- **D-04:** Partial credit via 3-tier scoring: 70%+ = PERFECT, 40-69% = GOOD ("Almost!"), below 40% = MISS. Matches existing timing threshold tiers.
- **D-05:** Hold duration requirement scales with note value — whole note requires roughly twice the hold of a half note (both use same percentage thresholds).

### Quarter Note Behavior

- **D-06:** Quarter notes remain simple taps (click/touchstart only). Only half notes and whole notes require sustained hold. This creates a clear pedagogical contrast between short and long notes.

### Tap Area Visual Cues

- **D-07:** Tap area shows different visual state for hold notes vs tap notes. Hold notes display a "HOLD" label and ring outline before pressing. Tap notes show "TAP" label. The child knows what's expected before pressing.
- **D-08:** In pulse game, the metronome visual stretches across multiple beat positions to signal hold notes — e.g., a half note spans 2 beat positions visually. This replaces the single-dot beat indicator with a stretched indicator.

### Claude's Discretion

- Exact ring animation implementation (CSS animation, SVG arc, canvas)
- Pointer event strategy (pointer events vs touch+mouse events)
- How to determine "next expected note" in listen&tap flow to show correct tap area state
- Whether to add hold tolerance scaling by node type (easier threshold for Discovery nodes)
- Exact i18n keys for "TAP" / "HOLD" labels
- Whether dotted notes (dotted half, dotted quarter) also require hold — if they exist in current patterns

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` — PLAY-01 definition and acceptance criteria

### Roadmap

- `.planning/ROADMAP.md` — Phase 31 definition and success criteria (4 criteria)

### Core Game Components

- `src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx` — Listen&tap game: `handleTap()` (line ~282), `evaluatePerformance()` (line ~221), click-only event handling
- `src/components/games/rhythm-games/renderers/PulseQuestion.jsx` — Pulse game: `handleTap()` (line ~346), click/touchstart handling (line ~575)
- `src/components/games/rhythm-games/components/TapArea.jsx` — Shared tap button, currently onClick-only

### Scoring & Timing

- `src/components/games/rhythm-games/utils/rhythmTimingUtils.js` — `calculateTimingThresholds()`, `schedulePatternPlayback()`
- `src/components/games/rhythm-games/utils/rhythmScoringUtils.js` — `scoreTap()` function (onset timing only, no duration)
- `src/components/games/rhythm-games/utils/durationInfo.js` — `DURATION_INFO` object: durationUnits mapping (q=4, h=8, w=16 in sixteenth-note units)

### Audio Infrastructure

- `src/hooks/useAudioEngine.js` — `createPianoSound(time, volume, duration, pitchShift)` supports duration parameter for sustained sound
- `src/contexts/AudioContextProvider.jsx` — Shared AudioContext lifecycle

### Design System

- `docs/DESIGN_SYSTEM.md` — Glassmorphism patterns for tap area styling
- `src/contexts/AccessibilityContext.jsx` — Reduced-motion preference (ring animation must respect this)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `createPianoSound(time, volume, duration, pitchShift)` — already supports a `duration` parameter, can produce sustained notes without new audio code
- `TapArea.jsx` — shared tap button component, needs extension for hold state and ring visual
- `calculateTimingThresholds(tempo, nodeType)` — already supports easy/hard node type scaling, can be extended for hold thresholds
- `durationInfo.js` — `DURATION_INFO[code].durationUnits` gives sixteenth-note count for any duration code; convert to seconds: `(durationUnits / 4) * (60 / tempo)`
- Existing `PERFECT | GOOD | MISS` scoring categories in both games — hold scoring maps directly to these

### Established Patterns

- Both games use `audioEngine.getCurrentTime()` for tap timestamp capture
- Both games use `userTapsRef` to accumulate tap events during playback
- Per-tap immediate feedback pattern: evaluate timing → show flash → accumulate result
- Latency compensation: `outputLatency` or 80ms fallback
- Beat data structure: `{ durationUnits: number, isRest: boolean }` — durationUnits is the key field for hold duration calculation

### Integration Points

- `handleTap()` in both games needs to become `handlePressStart()` + `handlePressEnd()` for hold notes
- `scoreTap()` in `rhythmScoringUtils.js` needs a hold duration parameter for half/whole notes
- `TapArea.jsx` needs new props: `isHoldNote`, `holdProgress`, `holdDuration`
- Beat-to-duration conversion: `holdDurationMs = (beat.durationUnits / 4) * (60000 / tempo)`
- Pulse game beat visualization needs stretched indicator for hold beats

</code_context>

<specifics>
## Specific Ideas

- The filling ring should feel like a "progress toward success" — not a timer. Green fill, not red countdown.
- The pulse game's stretched beat indicator creates a visual analogy: the child sees the note taking up more space AND holds longer — reinforcing duration concept through multiple senses (visual + tactile + audio).
- The sustained piano sound ties all three feedback channels together: see the ring fill, feel the finger hold, hear the note sustain.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 31-long-press-sustain_
_Context gathered: 2026-04-14_
