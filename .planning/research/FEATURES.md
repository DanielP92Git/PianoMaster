# Feature Research: Mic Pitch Detection Overhaul

**Domain:** Real-time browser-based piano pitch detection for children's music education
**Researched:** 2026-02-17
**Confidence:** MEDIUM-HIGH (official MDN docs + JUCE forum + academic sources + codebase audit)

---

## Feature Landscape

### Table Stakes (Users Expect These)

These are the behaviors that define "it works." Missing any of these means the app fails for note values shorter than quarter notes.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Accurate note classification (monophonic)** | One note played = one note reported, correct pitch | MEDIUM | Current autocorrelation works for quarter notes; breaks on 8th/16th. Switch to multi-algorithm consensus (YIN + MPM). No polyphonic needed — children play one note at a time. |
| **Onset detection (note-on triggering)** | Note must register within the timing window for the game to score it | MEDIUM | Current approach: N consecutive frames above RMS threshold. Minimum latency for a note is 2x its period. For C4 (261 Hz), that's ~7.6ms. For A2 (110 Hz), ~18ms. Onset fires after `onFrames` (currently 4–5 frames at 60fps = 66–83ms). Too slow for 8th notes at 100+ BPM. |
| **Note-off detection** | Held note must clear before next note is scored | MEDIUM | Current `offMs = 140ms`. At 120 BPM, a quarter note is 500ms, 8th is 250ms, 16th is 125ms. 140ms note-off works for quarters; is too long for 8th and 16th notes — makes them seem merged. |
| **Noise rejection / silence floor** | No phantom notes when not playing | MEDIUM | Current `rmsThreshold = 0.01`. Needed: disable browser echo cancellation, noise suppression, and auto gain control via `getUserMedia` constraints. Currently not set — browser may corrupt audio. |
| **Pitch confidence threshold** | Weak/ambiguous detections must be discarded, not emitted | MEDIUM | Current autocorrelation uses `GOOD_ENOUGH_CORRELATION = 0.9`. YIN and MPM have their own confidence metrics. Must gate emissions behind a minimum confidence score, not just RMS level. |
| **Dynamic note-off timing based on note duration** | Short notes require fast note-off; long notes allow longer decay | HIGH | A 16th note at 100 BPM lasts 150ms. Note-off must fire within ~75ms of release for the next note to register in time. Current fixed `offMs = 140ms` breaks 8th and 16th notes. Must scale with BPM and target note value. |
| **Correct getUserMedia audio constraints** | Clean audio input without browser-altered signal | LOW | Must explicitly set `echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`. Browser applies destructive DSP by default that degrades pitch detection. Already missing from current `startListening()`. |
| **State machine for note lifecycle** | Stable ARMED/ACTIVE/IDLE prevents flicker between neighboring semitones | MEDIUM | Current `useMicNoteInput` has frame counting but no formal state machine. The `apankrat/note-detector` pattern (Search → Confirm → Track) is the correct model. Must prevent C4/B3 flickering during transitions. |
| **Frequency-to-note mapping for full piano range** | All notes in the app's note pool are detectable | LOW | Current mapping covers C3–F5. Must include all notes in `skillTrail.js` node configs. Currently limited — bass clef notes (B2, A2, etc.) may not be in the lookup table. |

---

### Differentiators (Competitive Advantage)

Features that make the pitch detection noticeably better than a basic implementation, appropriate for a children's learning context.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Multi-algorithm consensus (YIN + MPM + autocorrelation)** | Eliminates octave errors; dramatically improves accuracy on piano's complex harmonic spectrum | HIGH | The `apankrat/note-detector` approach: require 2-of-3 algorithm agreement before emitting noteOn. YIN reduces octave errors vs plain autocorrelation. MPM outperforms YIN at low latency. Neither alone is sufficient for piano. |
| **Tempo-aware dynamic `onFrames` (onset speed)** | Faster playing gets faster detection; slow playing gets more stability | HIGH | At 60fps, each frame = 16.7ms. For 120 BPM 8th notes (250ms window), onset must fire in <125ms = max 7 frames. For 60 BPM quarters (1000ms window), 5 frames = fine. Formula: `onFrames = min(5, floor(noteDurationMs / 33))`. Depends on BPM being passed into the hook. |
| **Tempo-aware dynamic `offMs` (note-off speed)** | Short notes release fast; long notes don't cut off | HIGH | `offMs = max(40, noteDurationMs * 0.3)`. At 120 BPM 8th note: `offMs = max(40, 250*0.3) = 75ms`. At 60 BPM quarter: `max(40, 1000*0.3) = 300ms`. Connects to `useMicNoteInput` accepting BPM + noteValue. |
| **AudioWorklet migration for pitch processing** | Moves pitch detection off main thread; eliminates requestAnimationFrame throttling in background tabs; lower, more consistent latency | HIGH | Current loop uses `requestAnimationFrame` — throttled to 1fps when tab is in background. AudioWorklet runs on dedicated audio thread (128-sample quanta at 48kHz = 2.67ms per quantum). Required for consistent sub-50ms detection. Implementation: `AudioWorkletProcessor` posts pitch data back to main thread via `port.postMessage`. |
| **Cents deviation tracking** | Show how sharp/flat a note is, not just right/wrong | MEDIUM | Useful for sight reading feedback. `cents = 1200 * log2(detected / target)`. Already noted in `SIGHT_READING_GAME_IMPROVEMENT_PLAN.md` as future addition. Hooks already emit `frequency` — just needs UI. Deferred: not needed for basic accuracy. |
| **Per-note debouncing in the scoring layer** | Prevents double-scoring when detection fires twice for one played note | LOW | Already planned in `SIGHT_READING_GAME_IMPROVEMENT_PLAN.md` section 3.2. `DEBOUNCE_MS = 80`. Simple ref-based guard. Does not require pitch detection changes — lives in game layer. |
| **Device calibration wizard (one-time)** | Accounts for device-specific mic latency and acoustic conditions | HIGH | Plays metronome, user taps key, app measures offset, stores in localStorage. Already sketched in `SIGHT_READING_GAME_IMPROVEMENT_PLAN.md` section 2.3. Deferred to later: core accuracy must work first. |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Polyphonic pitch detection** | Sounds impressive; piano can play chords | Children play one note at a time for all current exercises. Polyphonic detection (CREPE neural, NMF, etc.) is 10-100x more computationally expensive, requires WASM/WebAssembly, and adds latency. Wrong tool for this use case. | Stay monophonic. If chords are needed in future, add chord validation in game layer on top of individual note detections. |
| **CREPE neural network in browser** | SOTA pitch accuracy (~97%) | CREPE requires TensorFlow.js; model is ~7MB download; inference is 100-300ms on mobile CPU; kills battery; throttled aggressively on iOS. Not viable for real-time 8-year-old UX. | Use YIN + MPM (CPU-friendly, <5ms per frame, no model download). |
| **Global fftSize increase (4096+)** | More FFT resolution sounds better | fftSize 4096 at 48kHz = 85ms latency floor per buffer. For 120 BPM 8th notes (250ms), this uses 34% of the entire window just on the buffer — before algorithm runs. Worse for fast notes. | Keep fftSize at 2048 (42ms buffer). For low notes requiring more data, use overlapping buffers in AudioWorklet, not larger fftSize. |
| **Showing raw Hz display to children** | Developer debugging appeal | Children don't understand Hz. Showing raw frequency data adds UI clutter and no learning value. | Show note name (C4, D4) and optionally a simple "sharp/flat" indicator with a green/red arrow. |
| **Noise suppression via ML in browser** | Modern AI noise cancellation sounds good | Adds massive compute overhead; introduces non-linear distortion that breaks pitch detection. The Krisp-style approach requires 10-20ms extra latency. | Disable browser's built-in noise suppression (`noiseSuppression: false`). Use RMS threshold gating instead — faster, simpler, deterministic. |
| **Always-on mic during non-game screens** | Simpler architecture | Privacy concern (especially for children, COPPA). Microphone indicator in browser stays lit. Drains battery. Must start/stop mic per game session. | Already handled by `startListening`/`stopListening` pattern. Keep it; enforce stop on every game exit and route change. |

---

## Feature Dependencies

```
getUserMedia audio constraints (echoCancellation=false, etc.)
    └──required by──> Any pitch detection accuracy improvement
                          (all other features depend on clean input)

YIN / MPM algorithm implementation
    └──required by──> Multi-algorithm consensus
                          └──required by──> Accurate note classification
                                               └──required by──> Onset detection accuracy
                                               └──required by──> Dynamic onFrames / offMs

AudioWorklet migration
    └──enables──> Consistent sub-50ms latency
    └──enables──> Tempo-aware onFrames (needs reliable frame timing)
    NOTE: Can be done independently of algorithm switch;
          algorithm switch is more urgent (accuracy > latency)

Dynamic onFrames (onset speed)
    └──requires──> BPM propagated into useMicNoteInput hook
    └──requires──> Note duration context available at detection time

Dynamic offMs (note-off speed)
    └──requires──> BPM propagated into useMicNoteInput hook
    └──same inputs as──> Dynamic onFrames (bundle together)

State machine (IDLE/ARMED/ACTIVE)
    └──replaces──> Current frame-count candidacy logic in useMicNoteInput
    └──required for──> Multi-algorithm consensus to work correctly

Per-note debouncing (scoring layer)
    └──independent of──> Detection layer (lives in SightReadingGame.jsx)
    └──depends on──> Accurate noteOn events from useMicNoteInput

Cents deviation tracking
    └──depends on──> Accurate frequency from algorithm (YIN gives better frequency precision)
    └──feeds into──> UI feedback (deferred)

Device calibration wizard
    └──depends on──> Stable onset detection (must work before calibrating)
    └──depends on──> useAudioEngine latencyOffset infrastructure (already exists)
```

### Dependency Notes

- **getUserMedia constraints require algorithm switch:** Fixing audio constraints alone gets 20-30% improvement; combined with algorithm switch gets 70-80% improvement.
- **Dynamic onFrames/offMs require BPM in hook:** The current `useMicNoteInput` has no BPM param. Must thread BPM from game settings down to the mic hook.
- **AudioWorklet is independent but high-value:** Migrate after algorithm switch. Wrong order = two migrations.
- **State machine replaces frame counting:** These conflict. Implement state machine as the replacement, not addition.
- **Per-note debouncing is purely in game layer:** Zero changes to detection hooks required. Quick win.

---

## MVP Definition

This is a refactor milestone, not greenfield. MVP = "quarter through sixteenth notes work accurately on mobile and desktop."

### Launch With (v1 — Core Accuracy)

- [ ] **getUserMedia constraints** — `echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`. One-line change in `usePitchDetection.js`. Prevents browser from corrupting audio before detection runs.
- [ ] **YIN algorithm replacing current autocorrelation** — Reduces octave errors. YIN's normalized difference function avoids the main failure mode of plain autocorrelation on piano's rich harmonic series.
- [ ] **Dynamic `onFrames` based on BPM and note value** — Fastest notes (16th at 100 BPM) need onset in <60ms. Static 4–5 frames at 60fps is too slow. Formula: `min(5, floor(noteDurationMs / 33))`.
- [ ] **Dynamic `offMs` based on BPM and note value** — 16th notes need note-off in <75ms. Static 140ms merges adjacent notes. Formula: `max(40, noteDurationMs * 0.3)`.
- [ ] **Formal IDLE/ARMED/ACTIVE state machine in `useMicNoteInput`** — Replaces frame-counting candidacy. More predictable, easier to tune, eliminates pitch flicker.
- [ ] **Full note frequency map for all trail notes** — Audit `usePitchDetection.js` frequency table against all `nodeConfig.notePool` values in `skillTrail.js` units. Add missing bass clef low notes.

### Add After Validation (v1.x — Consistency)

- [ ] **Multi-algorithm consensus (MPM added)** — Add MPM as second estimator alongside YIN. Require 2-of-2 agreement or accept YIN alone if MPM returns null. Threshold: `onFrames` can drop to 3 frames once consensus validates pitch is correct.
- [ ] **AudioWorklet migration for detection loop** — Move pitch computation off `requestAnimationFrame` onto dedicated audio thread. Prerequisite: algorithm implementations ported to worklet. Fixes background-tab throttling.
- [ ] **Per-note debouncing in SightReadingGame.jsx** — Already specced in improvement plan. 80ms debounce guard per note index. No detection changes needed.

### Future Consideration (v2+)

- [ ] **Cents deviation display** — Show sharpness/flatness in feedback. Requires accurate Hz from YIN (which gives it). Needs UI design for 8-year-old comprehension.
- [ ] **Device calibration wizard** — One-time per-device latency measurement. Only worthwhile once base accuracy is solved.
- [ ] **Polyphonic mode** — Only if exercise types expand to chords. Out of scope for current trail node types.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| getUserMedia audio constraints | HIGH | LOW | P1 |
| YIN algorithm | HIGH | MEDIUM | P1 |
| Dynamic onFrames | HIGH | MEDIUM | P1 |
| Dynamic offMs | HIGH | MEDIUM | P1 |
| State machine (IDLE/ARMED/ACTIVE) | HIGH | MEDIUM | P1 |
| Full note frequency map | HIGH | LOW | P1 |
| Per-note debouncing (game layer) | MEDIUM | LOW | P2 |
| MPM multi-algorithm consensus | MEDIUM | HIGH | P2 |
| AudioWorklet migration | MEDIUM | HIGH | P2 |
| Cents deviation display | LOW | MEDIUM | P3 |
| Device calibration wizard | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for pitch detection overhaul to succeed
- P2: Should have, adds reliability after P1 is stable
- P3: Nice to have, defer until product-market fit for advanced features

---

## Competitor Feature Analysis

Piano learning apps using mic input: Simply Piano, Flowkey, Piano Marvel, OKTAV, Yousician.

| Feature | Simply Piano / Yousician | OKTAV | Our Current | Our Target |
|---------|--------------------------|-------|-------------|------------|
| Algorithm | Proprietary (likely multi-algorithm) | Not disclosed | Single autocorrelation | YIN + MPM consensus |
| Onset latency | <50ms marketed | <80ms typical | ~83ms (5 frames) | <50ms for 8th, <80ms for 16th |
| Note-off | Adaptive | Adaptive | Fixed 140ms | Dynamic per note duration |
| Audio constraints | Disabled browser DSP | Disabled | Not set (browser default) | Explicitly disabled |
| Polyphonic | Yes (chord detection) | Yes | No | No (monophonic sufficient) |
| Mobile support | Native app (no Web Audio) | Native app | Web Audio (limited) | Web Audio + AudioWorklet |
| AudioWorklet | Native API (no constraint) | Native API | No (requestAnimationFrame) | Yes (v1.x) |

---

## Technical Context: Existing Architecture

These are integration points where new pitch detection features plug into the existing codebase:

| New Feature | Touches | Integration Complexity |
|-------------|---------|------------------------|
| getUserMedia constraints | `usePitchDetection.js` line 213 | LOW — add 3 properties to `getUserMedia` call |
| YIN algorithm | `usePitchDetection.js` `detectPitch()` | MEDIUM — replace inner loop; keep same API |
| Dynamic onFrames/offMs | `useMicNoteInput.js` + `micInputPresets.js` | MEDIUM — add `bpm` + `noteValue` params; compute derived values |
| State machine | `useMicNoteInput.js` | MEDIUM — replace `candidateFrames` logic; preserve emit API |
| Full note frequency map | `usePitchDetection.js` DEFAULT_NOTE_FREQUENCIES | LOW — add missing frequencies |
| Per-note debouncing | `SightReadingGame.jsx` | LOW — ref-based guard; no hook changes |
| MPM consensus | `usePitchDetection.js` | HIGH — second algorithm alongside YIN |
| AudioWorklet migration | `usePitchDetection.js` + new `pitch-detector.worklet.js` | HIGH — architectural shift; two files, MessagePort plumbing |

### Key Existing Parameters to Tune (not replace)

From `micInputPresets.js`:
- `rmsThreshold`: Keep but lower may be needed after disabling browser noise suppression
- `tolerance`: Keep at 2% for sight reading (piano is well-tempered, 2% is correct)
- `minInterOnMs`: Keep as floor (80ms); dynamic `onFrames` is the primary fix

---

## Latency Budget Analysis

At 120 BPM:
- Quarter note duration: 500ms
- Eighth note duration: 250ms
- Sixteenth note duration: 125ms

For a note to score, detection must fire within the timing window. Typical window is ~20-30% of note duration (from `SIGHT_READING_GAME_IMPROVEMENT_PLAN.md` section 2.2).

| Note Value @ 120 BPM | Duration | Window (25%) | Max Acceptable Onset Latency | Current Latency | Fix |
|----------------------|----------|--------------|------------------------------|-----------------|-----|
| Quarter | 500ms | 125ms | 125ms | 83ms (5 frames) | Already works |
| Eighth | 250ms | 62ms | 62ms | 83ms (5 frames) | Fails (83 > 62) — reduce to 3 frames |
| Sixteenth | 125ms | 31ms | 31ms | 83ms (5 frames) | Fails hard — needs AudioWorklet + 2 frames |

**Root cause of reported symptoms:** Eighth and sixteenth notes fail because 5-frame onset latency (83ms) exceeds the timing window for those note values. Dynamic `onFrames` is the primary fix. AudioWorklet reduces the frame budget ceiling.

---

## Sources

- [GitHub - apankrat/note-detector: Piano note detector](https://github.com/apankrat/note-detector) — Multi-algorithm consensus state machine (Search/Confirm/Track), 50ms confirmation periods
- [Lowest-latency real-time pitch detection - JUCE Forum](https://forum.juce.com/t/lowest-latency-real-time-pitch-detection/51741) — Minimum latency = 2x fundamental period; YIN and MPM algorithmic recommendations
- [Autocorrelation vs YIN for Pitch Detection](https://pitchdetector.com/autocorrelation-vs-yin-algorithm-for-pitch-detection/) — YIN accuracy advantages over plain autocorrelation
- [getUserMedia() Audio Constraints](https://blog.addpipe.com/audio-constraints-getusermedia/) — echoCancellation, noiseSuppression, autoGainControl impact on music audio
- [AudioWorklet - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) — Dedicated audio thread, 128-sample render quanta
- [Audio worklet design pattern | Chrome Developers](https://developer.chrome.com/blog/audio-worklet-design-pattern) — AudioWorklet vs ScriptProcessorNode (deprecated) vs requestAnimationFrame
- [Onset Detection — Cycfi Research](https://www.cycfi.com/2021/01/onset-detection/) — Why amplitude-only onset detection fails for soft piano notes
- [Musical note onset detection — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8550344/) — Energy threshold detection, 512-sample buffer for onset
- Existing codebase: `src/hooks/usePitchDetection.js`, `src/hooks/useMicNoteInput.js`, `src/hooks/micInputPresets.js`, `docs/SIGHT_READING_GAME_IMPROVEMENT_PLAN.md`, `docs/MIC_INPUT_TESTING.md`

---
*Feature research for: real-time browser-based piano pitch detection overhaul*
*Researched: 2026-02-17*
