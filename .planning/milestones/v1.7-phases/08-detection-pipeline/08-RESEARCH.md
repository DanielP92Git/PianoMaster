# Phase 08: Detection Pipeline - Research

**Researched:** 2026-02-22
**Domain:** Real-time pitch detection state machine, BPM-adaptive timing, anti-double-scoring, frequency coverage
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PIPE-01 | Dynamic `onFrames` (onset speed) scales with BPM and note duration | BPM-to-ms math + frame budget calculations below; `micInputPresets.js` currently hardcodes `onFrames: 4` regardless of tempo |
| PIPE-02 | Dynamic `offMs` (note-off speed) scales with BPM and note duration | Duration-aware offMs table; current `offMs: 140` is correct for quarter at 120 BPM but too aggressive for whole notes and too slow for sixteenths |
| PIPE-03 | Formal IDLE/ARMED/ACTIVE state machine in `useMicNoteInput` | Current candidacy logic is an implicit state machine via frame counting; needs explicit states to prevent flicker at note boundaries |
| PIPE-04 | Full piano frequency map covers all trail node pools | MIDI range C3-C6 (48-84) already in `usePitchDetection.js` `frequencyToNote`; trail nodes go down to C3 not B2/A2 -- verified in unit files |
| PIPE-05 | BPM and note duration context propagated into mic detection hooks | `useMicNoteInput` needs new `bpm` + `noteDuration` params; `SightReadingGame` has `gameSettings.tempo` available; `NotesRecognitionGame` has no BPM (untimed) |
| PIPE-06 | Per-note debouncing in game scoring layer prevents double-scoring | `SightReadingGame` already has per-note `DEBOUNCE_MS = 80` at line 1593; `NotesRecognitionGame` has `waitingForRelease` guard; both need review for edge cases |
</phase_requirements>

---

## Summary

Phase 08 transforms the fixed-parameter pitch detection pipeline into a BPM-aware, duration-adaptive system. The current implementation (after Phase 07) has correct pitch detection via pitchy/McLeod and a shared AudioContext architecture, but all timing parameters (`onFrames`, `offMs`, `minInterOnMs`, `DEBOUNCE_MS`) are hardcoded constants that work well at ~80 BPM with quarter notes but break at extremes: eighth notes at 120 BPM (250ms per note) get swallowed by 80ms onset delays + 140ms note-off windows, while quarter notes at 60 BPM (1000ms) trigger false note-off events during natural piano sustain.

The work decomposes into four independent concerns: (1) a formal state machine replacing the implicit frame-counting logic in `useMicNoteInput`, (2) BPM/duration-adaptive timing calculations that feed `onFrames`, `offMs`, and `minInterOnMs` dynamically, (3) propagating BPM context from game components through to the detection hooks, and (4) hardening the scoring layers in both game components against double-scoring edge cases. The frequency range coverage (PIPE-04) is already satisfied -- verified that trail bass nodes go down to C3 only (not B2/A2 as initially feared), and `frequencyToNote` covers MIDI 48-84 (C3-C6).

**Primary recommendation:** Introduce an explicit IDLE/ONSET/SUSTAIN state machine in `useMicNoteInput`, add a `computeTimingParams(bpm, noteBeats)` pure function that calculates `onFrames`/`offMs`/`minInterOnMs` from tempo and duration context, thread `bpm` through as a hook parameter from game settings, and tighten the scoring-layer debounce in `SightReadingGame` to use the same dynamic timing rather than a fixed 80ms constant.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pitchy | 4.1.0 | McLeod Pitch Method (already installed from Phase 07) | Provides `[pitch, clarity]` per frame at ~60fps |
| Web Audio API | Native | AnalyserNode + requestAnimationFrame detection loop | Already configured: fftSize=4096, smoothing=0.0 |
| React 18 | 18.x | useRef + useCallback for state machine in hooks | No additional deps needed |

### Supporting

No new libraries needed. All changes are pure JavaScript logic within existing hooks.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| rAF-based detection loop | setInterval(16ms) | rAF syncs with display refresh; setInterval can drift and fire during background tabs |
| Pure function timing calculator | Lookup table per BPM | Calculator is more maintainable and handles any BPM; lookup requires entries for every tempo |
| Explicit state enum in ref | Redux slice | Overkill; state machine is local to one hook instance, not shared across components |

---

## Architecture Patterns

### Pattern 1: IDLE/ONSET/SUSTAIN State Machine (PIPE-03)

**What:** Replace the implicit `candidateNote`/`candidateFrames` counting logic in `useMicNoteInput` with an explicit finite state machine stored in a ref.

**Current implicit states (frame counting):**
- `currentNote === null && candidateFrames < onFrames` = waiting for onset (IDLE/ONSET)
- `currentNote === null && candidateFrames >= onFrames` = triggers noteOn (transition to SUSTAIN)
- `currentNote !== null && same pitch detected` = holding (SUSTAIN)
- `currentNote !== null && no pitch for offMs` = triggers noteOff (transition to IDLE)
- `currentNote !== null && different pitch for changeFrames` = legato transition

**New explicit states:**
```
IDLE      -- No note active, no candidate. Waiting for first pitch.
ONSET     -- Candidate pitch detected, accumulating stability frames.
             Entry: first frame of a new pitch when in IDLE.
             Exit → SUSTAIN: candidateFrames >= onFrames.
             Exit → IDLE: candidate changes or silence exceeds offMs.
SUSTAIN   -- Note confirmed and emitted (noteOn sent).
             Entry: onset stability threshold met.
             Exit → IDLE: silence exceeds offMs (noteOff emitted).
             Exit → ONSET: different pitch appears (noteOff + start new onset).
COOLDOWN  -- Brief lockout after noteOff to prevent immediate re-trigger.
             Duration = minInterOnMs.
             Exit → IDLE: cooldown timer expires.
```

**Why this matters:** The current code has pitch flicker at note boundaries because transitioning from one note to another can produce 1-2 frames of the old pitch, 1 frame ambiguous, then the new pitch. Without an explicit COOLDOWN state, the old pitch can re-trigger during the transition. The COOLDOWN state absorbs this boundary noise.

**Example:**
```javascript
const STATE = { IDLE: 'idle', ONSET: 'onset', SUSTAIN: 'sustain', COOLDOWN: 'cooldown' };

// In stateRef.current:
{
  machineState: STATE.IDLE,
  currentNote: null,
  candidateNote: null,
  candidateFrames: 0,
  candidateStartedAt: -Infinity,
  lastPitchAt: -Infinity,
  lastEmitAt: -Infinity,
  cooldownUntil: -Infinity,
}
```

### Pattern 2: BPM-Adaptive Timing Calculator (PIPE-01, PIPE-02)

**What:** A pure function that computes `onFrames`, `offMs`, and `minInterOnMs` given `bpm` and `noteBeats` (quarter=1, eighth=0.5, sixteenth=0.25).

**The math:**
```
noteDurationMs = (noteBeats / bpm) * 60000

For a note to be detected individually:
  - onsetMs (onFrames * ~16.7ms) must be < noteDurationMs * 0.3
    (onset should consume at most 30% of the note duration)
  - offMs must be < noteDurationMs * 0.5
    (note-off should trigger before the next note starts)
  - minInterOnMs must be < noteDurationMs * 0.4
    (debounce must not swallow the next note)
```

**Concrete timing table:**

| BPM | Note | Duration (ms) | onFrames | onsetMs | offMs | minInterOnMs |
|-----|------|--------------|----------|---------|-------|-------------|
| 60 | quarter (1) | 1000 | 4 | 67 | 400 | 200 |
| 60 | eighth (0.5) | 500 | 3 | 50 | 200 | 100 |
| 80 | quarter (1) | 750 | 4 | 67 | 300 | 150 |
| 80 | eighth (0.5) | 375 | 2 | 33 | 150 | 80 |
| 120 | quarter (1) | 500 | 3 | 50 | 200 | 100 |
| 120 | eighth (0.5) | 250 | 2 | 33 | 100 | 60 |
| 120 | sixteenth (0.25) | 125 | 1 | 17 | 50 | 30 |

**Implementation:**
```javascript
/**
 * Compute detection timing parameters from tempo and note duration.
 * @param {number} bpm - Beats per minute (60-120)
 * @param {number} noteBeats - Duration in beats (0.25 = 16th, 0.5 = 8th, 1 = quarter, 2 = half)
 * @returns {{ onFrames: number, offMs: number, minInterOnMs: number, changeFrames: number }}
 */
export function computeTimingParams(bpm = 80, noteBeats = 1) {
  const FRAME_MS = 16.7; // ~60fps
  const noteDurationMs = (noteBeats / bpm) * 60000;

  // Onset: 20-30% of note duration, minimum 1 frame, maximum 5 frames
  const onFrames = Math.max(1, Math.min(5, Math.round((noteDurationMs * 0.25) / FRAME_MS)));

  // Note-off: 40% of note duration, minimum 40ms, maximum 500ms
  const offMs = Math.max(40, Math.min(500, Math.round(noteDurationMs * 0.4)));

  // Inter-onset: 30% of note duration, minimum 25ms, maximum 250ms
  const minInterOnMs = Math.max(25, Math.min(250, Math.round(noteDurationMs * 0.3)));

  // Change frames: onset + 1 (slightly more stability needed for legato)
  const changeFrames = onFrames + 1;

  return { onFrames, offMs, minInterOnMs, changeFrames };
}
```

### Pattern 3: BPM Context Propagation (PIPE-05)

**What:** Thread `bpm` from game settings into `useMicNoteInput` so timing params update dynamically.

**SightReadingGame path:**
```
gameSettings.tempo → useMicNoteInput({ bpm: gameSettings.tempo })
                  → computeTimingParams(bpm, noteBeats)
                  → { onFrames, offMs, minInterOnMs, changeFrames }
```

The `noteBeats` (smallest note duration in the current exercise) is available from the pattern's `notes` array. Each note event has a `duration` field in seconds. Convert: `noteBeats = shortestDuration / secondsPerBeat`.

**NotesRecognitionGame path:**
This game is untimed (no BPM). Use default conservative preset values. No change needed -- `computeTimingParams(80, 1)` returns values close to current `notesRecognition` preset.

**Key design decision:** `useMicNoteInput` should accept `bpm` and `shortestNoteDuration` (in beats) as optional props. When provided, it internally calls `computeTimingParams()` to override the preset values. When not provided, it falls back to the static preset values. This is backward compatible.

### Pattern 4: Anti-Double-Scoring (PIPE-06)

**What:** Ensure each physical key press produces exactly one scoring event.

**Two layers of protection:**

**Layer 1: useMicNoteInput state machine (SUSTAIN state)**
While in SUSTAIN state for note X, repeated detections of X are ignored. Only IDLE/ONSET transitions can produce new noteOn events. The COOLDOWN state after noteOff prevents immediate re-trigger.

**Layer 2: Game scoring debounce**
- `SightReadingGame`: Already has per-note `lastDetectionTimesRef` with 80ms debounce (line 1593). This should use `minInterOnMs` from the timing calculator instead of hardcoded 80ms.
- `NotesRecognitionGame`: Already has `waitingForRelease` guard that blocks new events until the player lifts the key (audio level drops below threshold). This is effective and does not need changes.

**Edge case: pitch flicker at note boundaries**
When transitioning from C4 to D4, the microphone may pick up: `C4, C4, [ambiguous], D4, C4, D4, D4`. Without protection, this produces: noteOff(C4), noteOn(D4), noteOff(D4), noteOn(C4), noteOff(C4), noteOn(D4). The COOLDOWN state absorbs the backward flicker: after noteOff(C4), the COOLDOWN period (= minInterOnMs) prevents C4 from immediately re-triggering while D4 begins its onset accumulation.

### Anti-Patterns to Avoid

- **Hardcoding timing for one BPM:** Any fixed `onFrames`/`offMs` will break at a different tempo. Always derive from BPM.
- **Debouncing in two layers with the same fixed delay:** The current 80ms in both `useMicNoteInput.minInterOnMs` AND `SightReadingGame.DEBOUNCE_MS` is a double penalty. One layer should be dynamic, the other should be removed or made note-index-specific.
- **Using `setTimeout` for COOLDOWN:** The detection loop runs on rAF; use `performance.now()` comparison in the loop, not setTimeout which can drift.
- **Scaling `offMs` linearly with BPM:** At 60 BPM, quarter note = 1000ms; 40% = 400ms offMs is fine. But at 120 BPM, half note = 1000ms; 40% = 400ms is also fine. The scaling should be by note duration, not BPM alone.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| BPM-to-timing conversion | Per-game-component hardcoded values | Single `computeTimingParams()` pure function | Avoids inconsistency between SightReadingGame and NotesRecognitionGame |
| Pitch flicker suppression | Complex frame-counting heuristics | Explicit COOLDOWN state in state machine | Heuristics have edge cases; FSM is deterministic and testable |
| Note boundary detection | Watching for pitch changes in the scoring layer | State machine noteOff/noteOn transition in useMicNoteInput | Scoring layer should not know about pitch detection internals |
| Frequency range extension | Adding entries to a lookup table | Math-based `frequencyToNote()` (already implemented in Phase 07) | Formula handles any frequency without table maintenance |

**Key insight:** The detection pipeline has exactly one place where timing decisions should be made: the `useMicNoteInput` state machine. Game components should only see clean `noteOn`/`noteOff` events. Pushing timing logic into both the hook AND the scoring layer creates coupled, hard-to-debug duplicate filtering.

---

## Common Pitfalls

### Pitfall 1: onFrames=1 Produces False Positives

**What goes wrong:** At 120 BPM with sixteenth notes, `computeTimingParams` calculates `onFrames=1`. A single frame of noise or harmonic overtone triggers a false noteOn.

**Why it happens:** One frame is ~17ms. Environmental noise can briefly match a note frequency for one frame. pitchy's clarity threshold helps but is not perfect.

**How to avoid:** Set minimum `onFrames=2` for all tempos. At 120 BPM sixteenths (125ms per note), 2 frames = 33ms = 26% of note duration. This is tight but still leaves 92ms for the note to sound and the off period to detect silence. Adjust the floor in `computeTimingParams`: `Math.max(2, ...)`.

**Warning signs:** Random phantom notes appearing in fast passages that the player did not play.

### Pitfall 2: offMs Too Short Causes Note Splitting

**What goes wrong:** Piano sustain has natural amplitude fluctuations. If `offMs` is too short (e.g., 50ms for sixteenth notes), the pitch detector may lose clarity for 2-3 frames during a sustain dip, triggering a false noteOff followed by immediate noteOn of the same pitch.

**Why it happens:** Piano strings have beating patterns (two slightly detuned strings per note). The beating causes periodic amplitude dips of 3-6dB every 50-100ms.

**How to avoid:** Set minimum `offMs=60ms` even for the fastest notes. For the typical use case (8-year-old learners playing at 60-120 BPM), the shortest practical note is an eighth note at 120 BPM = 250ms, where `offMs=100ms` is comfortable.

**Warning signs:** A held note shows up as two rapid noteOn events in debug logging.

### Pitfall 3: Stale Timing Params After Settings Change

**What goes wrong:** Player changes BPM in settings UI between exercises, but `useMicNoteInput` still uses the old timing params because they were captured in a closure.

**Why it happens:** If timing params are computed in a `useMemo` and the `bpm` prop changes, the memo updates but `handlePitchDetected` callback may have captured the old values.

**How to avoid:** Store computed timing params in a ref (`timingParamsRef.current`) and always read from the ref inside `handlePitchDetected`. Update the ref when `bpm` or `noteDuration` props change.

**Warning signs:** First exercise works correctly, subsequent exercises with different BPM have wrong timing behavior.

### Pitfall 4: COOLDOWN State Blocking Fast Legato

**What goes wrong:** Player performs C4-D4-E4 rapidly (legato). COOLDOWN after D4's noteOff blocks E4's onset from registering.

**Why it happens:** COOLDOWN duration equals `minInterOnMs`, which at 120 BPM eighth notes is ~60ms. If the player transitions within 60ms, the new note onset is missed.

**How to avoid:** COOLDOWN should only block the SAME note from re-triggering, not different notes. Implementation: store `cooldownNote` alongside `cooldownUntil`. Only enter COOLDOWN for re-detection of the same pitch; immediately allow onset of a new pitch.

**Warning signs:** Ascending scales miss notes, especially at faster tempos.

### Pitfall 5: SightReadingGame DEBOUNCE_MS Fights Dynamic Timing

**What goes wrong:** `SightReadingGame` has `DEBOUNCE_MS = 80` hardcoded at line 1593. At 120 BPM with eighth notes, `minInterOnMs` from the calculator is 60ms but the game debounce adds another 80ms, effectively requiring 140ms between notes (too slow for 250ms notes).

**Why it happens:** The game-layer debounce was added to compensate for the hook's overly-sensitive triggers. With a proper state machine in the hook, the game-layer debounce is redundant.

**How to avoid:** Remove the fixed 80ms debounce from `SightReadingGame.handleNoteDetected`. The state machine's COOLDOWN + `minInterOnMs` handles this. If a second safety net is desired, use `minInterOnMs * 0.5` instead of 80ms fixed.

**Warning signs:** Eighth notes at 100+ BPM are consistently missed or scored late.

---

## Code Examples

### computeTimingParams Pure Function

```javascript
// src/hooks/detectionTimingParams.js
const FRAME_MS = 16.7; // ~60fps rAF

/**
 * Compute mic detection timing params from BPM and note duration.
 *
 * @param {number} bpm - 40-200 range, clamped internally
 * @param {number} noteBeats - smallest note in current context (0.25=16th, 0.5=8th, 1=quarter)
 * @returns {{ onFrames, offMs, minInterOnMs, changeFrames }}
 */
export function computeTimingParams(bpm = 80, noteBeats = 1) {
  const safeBpm = Math.max(40, Math.min(200, bpm));
  const safeBeats = Math.max(0.25, noteBeats);
  const noteDurationMs = (safeBeats / safeBpm) * 60000;

  const onFrames = Math.max(2, Math.min(5, Math.round((noteDurationMs * 0.25) / FRAME_MS)));
  const offMs = Math.max(60, Math.min(500, Math.round(noteDurationMs * 0.4)));
  const minInterOnMs = Math.max(30, Math.min(250, Math.round(noteDurationMs * 0.3)));
  const changeFrames = Math.max(2, onFrames + 1);

  return { onFrames, offMs, minInterOnMs, changeFrames };
}
```

### State Machine Integration in useMicNoteInput

```javascript
// Inside handlePitchDetected:
const s = stateRef.current;
const now = performance.now();
const params = timingParamsRef.current; // { onFrames, offMs, minInterOnMs, changeFrames }

switch (s.machineState) {
  case STATE.IDLE:
    // New pitch detected -> enter onset
    s.machineState = STATE.ONSET;
    s.candidateNote = note;
    s.candidateFrames = 1;
    s.candidateStartedAt = now;
    break;

  case STATE.ONSET:
    if (note === s.candidateNote) {
      s.candidateFrames += 1;
      if (s.candidateFrames >= params.onFrames) {
        // Confirmed -> emit noteOn, enter sustain
        s.machineState = STATE.SUSTAIN;
        s.currentNote = note;
        s.lastEmitAt = now;
        emit({ pitch: note, source: 'mic', type: 'noteOn', time: now, frequency });
      }
    } else {
      // Different pitch -> restart onset
      s.candidateNote = note;
      s.candidateFrames = 1;
      s.candidateStartedAt = now;
    }
    break;

  case STATE.SUSTAIN:
    if (note === s.currentNote) {
      // Same note -> refresh last-pitch timestamp
      s.lastPitchAt = now;
    } else {
      // Different note -> noteOff current, start onset for new
      emit({ pitch: s.currentNote, source: 'mic', type: 'noteOff', time: now });
      s.machineState = STATE.ONSET;
      s.candidateNote = note;
      s.candidateFrames = 1;
      s.candidateStartedAt = now;
      s.currentNote = null;
    }
    break;

  case STATE.COOLDOWN:
    // Only allow a DIFFERENT note to start onset
    if (note !== s.cooldownNote && now >= s.cooldownUntil) {
      s.machineState = STATE.ONSET;
      s.candidateNote = note;
      s.candidateFrames = 1;
      s.candidateStartedAt = now;
    }
    break;
}
```

### BPM Propagation from SightReadingGame

```javascript
// In SightReadingGame.jsx, compute shortest note in current pattern:
const shortestNoteBeats = useMemo(() => {
  if (!currentPattern?.notes) return 1;
  const secondsPerBeat = 60 / gameSettings.tempo;
  return Math.min(
    ...currentPattern.notes
      .filter(n => n.type !== 'rest' && typeof n.duration === 'number')
      .map(n => n.duration / secondsPerBeat)
  ) || 1;
}, [currentPattern, gameSettings.tempo]);

// Pass to useMicNoteInput:
useMicNoteInput({
  isActive: false,
  noteFrequencies,
  bpm: gameSettings.tempo,
  shortestNoteDuration: shortestNoteBeats,
  onNoteEvent: handleNoteEvent,
  // Remove static preset spread: ...MIC_INPUT_PRESETS.sightReading
  // Instead, let computeTimingParams derive values dynamically.
  // Keep non-timing presets:
  rmsThreshold: MIC_INPUT_PRESETS.sightReading.rmsThreshold,
  tolerance: MIC_INPUT_PRESETS.sightReading.tolerance,
});
```

### Frequency Coverage Verification (PIPE-04)

The current `frequencyToNote()` in `usePitchDetection.js` covers MIDI 48-84 (C3-C6).

Trail bass nodes verified range:
- `bassUnit1Redesigned.js`: C4, B3, A3 (highest bass unit)
- `bassUnit2Redesigned.js`: down to F3
- `bassUnit3Redesigned.js`: down to C3

All within MIDI 48-84 range. **No changes needed for PIPE-04.** The requirement mentions B2/A2 but actual trail data does not contain these notes. If they are added later, lowering `MIN_MIDI` to 45 (A2) would suffice -- pitchy + fftSize 4096 resolves A2 (110Hz) at bin 10 clearly.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed timing params for all tempos | BPM-adaptive timing | Standard in commercial music apps | Enables 60-120 BPM range with all note durations |
| Implicit state via variable counting | Explicit FSM in detection hooks | Standard software pattern | Eliminates edge-case bugs at state transitions |
| Double debouncing (hook + game layer) | Single debounce in state machine COOLDOWN | Identified during Phase 08 research | Removes accumulated latency that swallows fast notes |
| Fixed 300ms mic latency compensation | Per-detection latencyMs from hook events | Phase 06-07 prepared this path | More accurate timing evaluation per note |

---

## Existing Code State (Post-Phase 07)

### What already works correctly
- `usePitchDetection.js`: pitchy McLeod integration, clarity threshold 0.9, frequencyToNote MIDI math, shared analyser mode
- `AudioContextProvider.jsx`: Shared AudioContext, fftSize=4096, smoothing=0.0, DSP-disabled getUserMedia
- `useMicNoteInput.js`: noteOn/noteOff event model, startListening overrides, resetInternalState
- `SightReadingGame.jsx`: Per-note timing windows via `useTimingAnalysis`, latency compensation, timing evaluation

### What needs modification
1. **`useMicNoteInput.js`**: Replace implicit candidacy logic with FSM; add `bpm`/`shortestNoteDuration` params; use `computeTimingParams()`
2. **`micInputPresets.js`**: Keep as fallback defaults; add comment that dynamic params override these when BPM is provided
3. **`SightReadingGame.jsx`**: Pass `bpm` and `shortestNoteDuration` to `useMicNoteInput`; remove or reduce fixed `DEBOUNCE_MS = 80` in `handleNoteDetected`
4. **`NotesRecognitionGame.jsx`**: No changes needed -- untimed game, current presets work
5. **New file `src/hooks/detectionTimingParams.js`**: Pure function `computeTimingParams()`

### What does NOT need modification
- `usePitchDetection.js`: No changes needed. Pitch detection layer is correct.
- `AudioContextProvider.jsx`: No changes needed. Audio chain is correct.
- `useTimingAnalysis.js`: No changes needed. Scoring windows are separate from detection timing.
- Frequency map / MIDI range: Already covers C3-C6 (all trail notes). PIPE-04 is satisfied.

---

## Open Questions

1. **Clarity threshold lowering (0.9 vs 0.80)**
   - What we know: The phase description mentions lowering from 0.9 to 0.75-0.80. Phase 07 research recommended starting at 0.9 and lowering if needed.
   - What's unclear: Whether 0.9 causes missed notes in practice. This is empirical and depends on testing.
   - Recommendation: Keep 0.9 for Phase 08 planning. If testing after Phase 08 shows missed notes, lower to 0.80 as a Phase 09 or Phase 10 tuning task. Do not change two variables (timing params + clarity threshold) at once -- it makes debugging harder.

2. **Dynamic latency compensation (300ms MIC_LATENCY_COMP_MS)**
   - What we know: The phase description flags the fixed 300ms as problematic. Phase 07 added `latencyMs` to noteOn events from the hook.
   - What's unclear: Whether to use per-note latencyMs dynamically in Phase 08 or defer to a calibration wizard (FEED-02, deferred).
   - Recommendation: Phase 08 should NOT change latency compensation. The new state machine will change detection latency characteristics; measure first, then tune compensation. Flag for Phase 09 or post-v1.7.

3. **RMS threshold tuning**
   - What we know: `rmsThreshold: 0.01` in sightReading preset, `0.012` in notesRecognition. The phase description says 0.01 may be too high for soft playing.
   - Recommendation: Keep current values. RMS threshold is below the clarity threshold in the pipeline (pitchy clarity gates before RMS becomes relevant). Monitor in testing.

---

## Sources

### Primary (HIGH confidence)

- **Codebase analysis (direct reading):**
  - `src/hooks/useMicNoteInput.js` - Full file, 271 lines: candidacy logic, timing parameters, event emission
  - `src/hooks/usePitchDetection.js` - Full file, 433 lines: pitchy integration, frequencyToNote, MIDI range 48-84
  - `src/hooks/micInputPresets.js` - Full file, 27 lines: hardcoded timing presets
  - `src/contexts/AudioContextProvider.jsx` - Full file, 247 lines: shared AudioContext, analyser config
  - `src/components/games/sight-reading-game/SightReadingGame.jsx` - Lines 80-140 (constants), 835-900 (useMicNoteInput setup), 1380-1630 (handleNoteDetected + debouncing)
  - `src/components/games/sight-reading-game/hooks/useTimingAnalysis.js` - Full file: buildTimingWindows, evaluateTiming
  - `src/components/games/sight-reading-game/constants/timingConstants.js` - FIRST_NOTE_EARLY_MS=500, NOTE_EARLY_MS=200, NOTE_LATE_MS=300
  - `src/components/games/sight-reading-game/constants/durationConstants.js` - Note duration definitions (quarter=1 beat through sixteenth=0.25 beats)
  - `src/components/games/notes-master-games/NotesRecognitionGame.jsx` - Lines 1650-1700: handleMicNoteEvent, waitingForRelease guard
  - `src/data/units/bassUnit*Redesigned.js` - All bass node note pools verified: C3 is lowest note (not B2/A2)

- **Phase 07 research** (`.planning/phases/07-audio-architecture-core-algorithm/07-RESEARCH.md`): pitchy API, AudioContext architecture, clarity thresholds

### Secondary (MEDIUM confidence)

- **Finite state machine pattern for audio detection:** Standard approach in commercial pitch detection apps (Guitar Tuner apps, Simply Piano internals); verified through codebase patterns and audio processing best practices
- **Piano string beating patterns (50-100ms amplitude dips):** Well-documented acoustic phenomenon; affects offMs minimum thresholds

### Tertiary (LOW confidence)

- **Exact optimal percentages for onFrames/offMs/minInterOnMs:** The 25%/40%/30% ratios in `computeTimingParams` are engineering estimates based on analysis of note duration budgets. These will need empirical tuning during testing. The min/max clamps provide safety rails.

---

## Metadata

**Confidence breakdown:**
- State machine design (PIPE-03): HIGH -- standard FSM pattern, current code clearly maps to states
- Timing calculator (PIPE-01, PIPE-02): HIGH for structure, MEDIUM for exact parameter values -- needs empirical tuning
- BPM propagation (PIPE-05): HIGH -- straightforward prop threading, game already has tempo available
- Frequency coverage (PIPE-04): HIGH -- verified via grep of all trail unit files, MIDI range already correct
- Anti-double-scoring (PIPE-06): HIGH -- existing guards are solid, changes are incremental

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (all internal codebase; no external API dependencies)
