# Technology Stack: Pro-Level Pitch Detection

**Project:** PianoApp2 - Piano Learning PWA
**Feature:** Mic-based piano pitch detection overhaul
**Researched:** 2026-02-17
**Confidence:** HIGH

---

## Context: What the Current Implementation Does and Why It Fails

The current `usePitchDetection.js` implements a hand-rolled autocorrelation algorithm:
- `fftSize = 2048` on `AnalyserNode`
- Simple autocorrelation loop: `correlation += Math.abs(buffer[i] - buffer[i + offset])`
- `getFloatTimeDomainData()` polled via `requestAnimationFrame`
- Threshold: `GOOD_ENOUGH_CORRELATION = 0.9`
- `smoothingTimeConstant = 0.8` (heavy temporal smoothing — kills transients)

**Why it fails for piano:**

1. **Octave errors:** Simple autocorrelation cannot reliably find the fundamental frequency when overtones are louder than the fundamental — common in piano notes, especially in the midrange.
2. **smoothingTimeConstant = 0.8 kills transients:** Heavy smoothing erases note onsets. For eighth notes at 120+ BPM, the attack is ~125ms — the smoother destroys the signal before the algorithm sees it.
3. **fftSize = 2048 is a mismatch:** At 44.1kHz, 2048 samples = ~46ms window. Piano low notes (C2 = 65Hz) need at least one full cycle, which is 15ms, so 2048 is OK for pitch, but the algorithm never exploits frequency-domain data — it uses time-domain only. The buffer length passed to `detectPitch` is `frequencyBinCount = fftSize/2 = 1024`, not 2048, meaning even the time-domain window is half the declared fftSize.
4. **requestAnimationFrame + smoothing = inconsistent timing:** `rAF` fires at ~60fps (16ms intervals) but can be delayed when the tab is backgrounded or the main thread is busy. Pitch detection then misses note attacks entirely.
5. **No onset detection:** The `useMicNoteInput` stability layer requires `onFrames = 4-5` consecutive detections before emitting `noteOn`. At 60fps this is 65-80ms of mandatory latency after note onset — long enough to miss eighth notes at tempos above 90 BPM.

---

## Recommended Stack for Pitch Detection Overhaul

### Core Algorithm Change: pitchy v4.1.0 (McLeod Pitch Method)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **pitchy** | 4.1.0 | Primary pitch detection algorithm | McLeod Pitch Method (MPM) dramatically reduces octave errors vs. naive autocorrelation by using a specially normalized correlation function (NSDF). This is the de-facto choice for browser-based instrument tuners. Pure JS/ESM, zero dependencies, ~5KB, works in AudioWorklet. |

**Why pitchy over alternatives:**

- **vs. hand-rolled autocorrelation (current):** Pitchy's MPM uses normalized square difference function rather than mean absolute difference. This produces sharper peaks at the true fundamental, not at overtones — the exact failure mode of the current code.
- **vs. ml5.js CREPE:** CREPE is a CNN model that must load a multi-MB TensorFlow model file on startup (10-50ms cold load, up to 2MB), introducing latency and bundle size inappropriate for a children's app. CREPE is also COPPA-adjacent: ml5.js by default fetches models from external CDN (`https://cdn.jsdelivr.net`), violating the no-external-data-collection requirement. Model accuracy is excellent for professional tools but the infra overhead is unjustifiable here.
- **vs. essentia.js:** ~2MB WASM bundle, academic-grade signal processing. Massive overkill for single-note piano detection. Real-time analysis tutorial exists but setup complexity is high. Not justified when pitchy achieves acceptable accuracy at 5KB.
- **vs. pitchfinder:** Less maintained, based on older algorithm implementations, no MPM.
- **vs. aubio.js:** WASM port of C library, ~800KB, deprecated npm package. Last meaningful update 2019.

**pitchy API (HIGH confidence — verified from GitHub README + npm page):**

```javascript
import { PitchDetector } from 'pitchy';

// Create once, reuse per frame
const detector = PitchDetector.forFloat32Array(bufferSize);

// Per-frame detection
const [pitch, clarity] = detector.findPitch(float32Buffer, sampleRate);
// pitch: Hz or -1 if not detected
// clarity: 0-1; values > 0.9 indicate confident detection
```

**Confidence threshold:** Use `clarity >= 0.9` as the gate. The current code uses correlation > 0.9 as equivalent — but pitchy's clarity score is more meaningful because it's normalized against the fundamental, not a raw correlation value.

---

### Web Audio API Configuration Changes

These are the specific parameter changes needed — no new packages, just different values in existing `usePitchDetection.js`:

#### 1. fftSize: 2048 → 4096

| Parameter | Current | Recommended | Why |
|-----------|---------|-------------|-----|
| `fftSize` | 2048 | **4096** | At 44.1kHz: 4096 samples = ~93ms window. Gives pitchy 2048 samples of time-domain data (frequencyBinCount = fftSize/2). Better frequency resolution for low notes. Still well under 120ms latency budget for eighth notes at 60 BPM. |
| `smoothingTimeConstant` | 0.8 | **0.0** | Set to zero. Smoothing averages consecutive FFT frames — it destroys note onsets. Pitchy's McLeod method is already robust to noise; pre-smoothing only hurts transient detection. |

**Note on fftSize vs. pitchy inputLength:** pitchy's `inputLength` must equal the buffer length passed to `findPitch`. When using `getFloatTimeDomainData`, the array length is `analyserNode.frequencyBinCount` which is `fftSize / 2`. So `PitchDetector.forFloat32Array(analyserNode.frequencyBinCount)` is the correct initialization.

#### 2. getUserMedia Constraints (Critical for Piano)

The current code uses `{ audio: true }` — default constraints. Browser default enables echoCancellation, noiseSuppression, and autoGainControl. **These destroy piano audio:**
- AutoGainControl compresses the attack transient
- NoiseSuppression removes harmonic content it misidentifies as noise
- EchoCancellation introduces phase shifts

**Required:**
```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    // Optional: prefer higher sample rate for better high-note resolution
    sampleRate: { ideal: 44100 },
    channelCount: 1,  // Mono sufficient, reduces processing
  }
});
```

**MEDIUM confidence** — disabling these constraints works on Chrome and Firefox. Safari on iOS may partially ignore them. The `sampleRate` ideal hint is best-effort; browser picks the actual rate.

#### 3. AudioContext Sample Rate

The existing code already reads `context.sampleRate` correctly and passes it to the pitch algorithm. Keep this pattern — do not hardcode a sample rate.

---

### Architecture Change: AnalyserNode Poll Strategy

**Current:** `requestAnimationFrame` poll loop inside `detectLoop()`

**Problem:** `rAF` is throttled to 1fps when the tab is hidden (child switches to another app). More importantly, `rAF` fires at display frame rate (60fps), which is about right, but can be delayed when the main React render is heavy.

**Recommendation:** Keep `requestAnimationFrame` for now, but consider a future migration path to `AudioWorkletProcessor` for zero-latency processing on the audio thread. The `rAF` approach is acceptable if:
- `smoothingTimeConstant` is set to 0.0 (done above)
- The stability layer parameters in `useMicNoteInput` are tuned (see below)

**Why not AudioWorklet now:** AudioWorklet requires serving a separate `.js` file from the same origin (Vite requires extra config), cross-origin isolation headers for SharedArrayBuffer, and Safari's AudioWorklet implementation has had correctness bugs. The complexity cost is not justified for the current failure modes — which are all fixable at the algorithm and parameter level.

---

### useMicNoteInput Parameter Tuning

The stability layer in `useMicNoteInput.js` adds mandatory latency. With pitchy producing cleaner, more accurate detections per frame, these parameters can be tightened:

| Parameter | Current (sightReading preset) | Recommended | Why |
|-----------|------------------------------|-------------|-----|
| `onFrames` | 4 | **3** | Pitchy gives cleaner signals — fewer false positives — so 3 frames (50ms at 60fps) is sufficient stability without excessive latency |
| `changeFrames` | 5 | **4** | Same reasoning; note changes are cleaner with MPM |
| `offMs` | 140 | **100** | With `smoothingTimeConstant = 0`, signal silence is detected faster; 100ms is enough to distinguish end of note from momentary spectral dip |
| `minInterOnMs` | 80 | **60** | Tighter inter-note minimum since algorithm is cleaner; still prevents double-fires |
| `rmsThreshold` | 0.01 | **0.015** | Slightly raise after disabling autoGainControl — the mic signal will have more dynamic range, so higher threshold avoids noise triggering |
| `tolerance` | 0.02 | **0.02** | Keep — this is frequency tolerance for note matching, not algorithm tuning |

**MEDIUM confidence** — these are starting values that will need empirical tuning against real piano audio.

---

### Supporting Libraries (No New Additions Needed)

The following are explicitly NOT needed:

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **ml5.js** | 2MB+ TensorFlow bundle, fetches from CDN (COPPA violation), 50ms cold start per detection call | pitchy |
| **essentia.js** | 2MB WASM bundle, complex setup with AudioWorklet required, overkill for monophonic note detection | pitchy |
| **aubio.js** | npm package abandoned (~2019), no ESM build, WASM port unmaintained | pitchy |
| **web-audio-analyser** | Thin wrapper that adds abstraction without solving the algorithm problem | native AnalyserNode |
| **Meyda.js** | Feature extraction library (MFCCs, spectral flux), not pitch detection — wrong tool for note identification | pitchy |
| **tone.js** | Synthesis and scheduling, not pitch detection | not applicable |

---

## Installation

```bash
# Single new package
npm install pitchy
```

**pitchy is ESM-only (v4+).** This project already uses `"type": "module"` in package.json and Vite 6, so ESM is fully supported. No additional bundler configuration needed.

---

## Integration Points in Existing Code

### 1. usePitchDetection.js — Replace `detectPitch` function

The `detectPitch` function currently contains the hand-rolled autocorrelation. Replace it with pitchy:

```javascript
import { PitchDetector } from 'pitchy';

// Create detector once when analyser is initialized
// bufferLength = analyserNode.frequencyBinCount
const detector = PitchDetector.forFloat32Array(bufferLength);

// In detectLoop (replaces current detectPitch call)
analyserNode.getFloatTimeDomainData(dataArray);
const [pitch, clarity] = detector.findPitch(dataArray, sampleRate);
const frequency = clarity > 0.9 ? pitch : -1;
```

**Important:** The `detector` instance must be created after the `analyserNode` is configured and must persist across frames (do not recreate per frame — expensive). Store in a `useRef`.

### 2. usePitchDetection.js — AnalyserNode configuration

```javascript
analyserNode.fftSize = 4096;           // Was 2048
analyserNode.smoothingTimeConstant = 0.0;  // Was 0.8 — critical change
```

### 3. usePitchDetection.js — getUserMedia constraints

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
  }
});
```

### 4. micInputPresets.js — Update preset values

```javascript
export const MIC_INPUT_PRESETS = {
  sightReading: {
    rmsThreshold: 0.015,  // Was 0.01
    tolerance: 0.02,
    onFrames: 3,          // Was 4
    changeFrames: 4,      // Was 5
    offMs: 100,           // Was 140
    minInterOnMs: 60,     // Was 80
  },
  notesRecognition: {
    rmsThreshold: 0.015,  // Was 0.012
    tolerance: 0.03,
    onFrames: 3,          // Was 4
    changeFrames: 4,      // Was 5
    offMs: 120,           // Was 160
    minInterOnMs: 70,     // Was 90
  },
};
```

### 5. usePitchDetection.js — Detector lifecycle

The `PitchDetector` instance depends on `bufferLength`, which is fixed once the AnalyserNode is created. Store it in a ref alongside the analyser:

```javascript
const detectorRef = useRef(null);

// When setting up analyserNode:
analyserNode.fftSize = 4096;
const bufferLength = analyserNode.frequencyBinCount; // 2048
const dataArray = new Float32Array(bufferLength);
detectorRef.current = PitchDetector.forFloat32Array(bufferLength);
```

---

## What NOT to Change

| Thing | Keep As-Is | Why |
|-------|------------|-----|
| `useMicNoteInput.js` state machine | Keep — only tune parameters | The noteOn/noteOff stability logic is well-designed; pitchy improvements flow through it |
| `requestAnimationFrame` poll | Keep for now | AudioWorklet migration is future work; rAF is adequate once smoothing is removed |
| `frequencyToNote` lookup | Keep | Frequency-to-note mapping is independent of detection algorithm |
| `getFloatTimeDomainData` | Keep | pitchy operates on time-domain data (not frequency domain) |
| React Context integration | Keep | Audio context/analyser exposed via hook return values works fine |
| `AudioContext` / `AnalyserNode` setup | Keep pattern, change parameters | The Web Audio graph topology is correct |

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| pitchy | 4.1.0 | Vite 6, React 18, ESM | ESM-only, works without config changes in this project |
| pitchy | 4.1.0 | Vitest 3.x | Vitest handles ESM natively with `"type": "module"` |
| Web Audio API | Native | Chrome 66+, Firefox 76+, Safari 14.1+, iOS 14.5+ | All current browser targets |

---

## Frequency Resolution Reality Check

At 44.1kHz sample rate with fftSize = 4096:
- Window duration: 4096 / 44100 ≈ 93ms
- Frequency resolution (FFT bins): 44100 / 4096 ≈ 10.7 Hz per bin

Piano note spacing near middle C: C4 = 261.63Hz, D4 = 293.66Hz, gap = 32Hz. At 10.7Hz/bin, C4 and D4 are 3 bins apart — distinguishable. Lower notes are trickier: C2 = 65.4Hz, D2 = 73.4Hz, gap = 8Hz, less than one bin. However, pitchy operates in the time domain (autocorrelation), not frequency domain bins, so frequency resolution is not limited by bin size — it interpolates based on the period of the waveform. This is why time-domain algorithms like MPM outperform FFT peak-picking for pitch detection.

**Bottom line:** 4096-sample buffer gives pitchy enough signal for accurate detection down to C2 (65Hz) with a single pitch period visible in the window. For the piano range the app targets (approximately C3-C6 for a children's learning app), 2048 samples would also work, but 4096 provides headroom.

---

## COPPA Compliance

All pitch detection with pitchy runs **entirely client-side in the browser**. pitchy:
- Has zero external network calls
- Requires no CDN model files
- Introduces no analytics or telemetry
- Processes audio in memory only — audio data never leaves the device

The `getUserMedia` audio stream is never sent to any server. This is fully COPPA-compliant.

---

## Confidence Assessment

| Area | Confidence | Source |
|------|------------|--------|
| pitchy algorithm superiority (MPM vs autocorrelation) | HIGH | McLeod's original paper + pitchy GitHub README |
| pitchy v4.1.0 is ESM, compatible with Vite 6 | HIGH | GitHub release page (January 2024) |
| `smoothingTimeConstant = 0` being the right fix | HIGH | Web Audio API MDN docs, direct cause-effect analysis |
| `getUserMedia` constraint behavior for piano | MEDIUM | MDN docs; Safari may partially ignore on iOS |
| Tuned `useMicNoteInput` parameters | MEDIUM | Based on algorithm reasoning; requires empirical validation with real piano audio |
| AudioWorklet unnecessary for current failures | MEDIUM | Based on root cause analysis; worth revisiting if latency issues persist after pitchy migration |

---

## Sources

- [pitchy GitHub — ianprime0509/pitchy](https://github.com/ianprime0509/pitchy) — Algorithm, API, v4.1.0 release, ESM-only status
- [McLeod, Philip & Wyvill, Geoff: "A Smarter Way to Find Pitch" (2005)](https://www.cs.otago.ac.nz/research/publications/oucs-2008-03.pdf) — MPM algorithm foundation
- [MDN AnalyserNode.fftSize](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize) — Valid sizes, default behavior
- [MDN AnalyserNode.smoothingTimeConstant](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) — Temporal smoothing behavior
- [MDN getUserMedia audio constraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings/echoCancellation) — echoCancellation, noiseSuppression, autoGainControl
- [apankrat/note-detector](https://github.com/apankrat/note-detector) — Consensus detection approach (YIN + MPM + autocorrelation) for context
- [Chrome Developer Blog: Audio Worklet design pattern](https://developer.chrome.com/blog/audio-worklet-design-pattern) — AudioWorklet + SharedArrayBuffer pattern
- [Pitch detection algorithm — Wikipedia](https://en.wikipedia.org/wiki/Pitch_detection_algorithm) — Algorithm comparison overview

---

*Stack research for: Pro-level piano pitch detection in browser PWA*
*Researched: 2026-02-17*
