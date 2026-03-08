# Phase 10: Performance (Profiling-Gated) - Research

**Researched:** 2026-03-04
**Domain:** Web Audio API performance profiling + conditional AudioWorklet migration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Test Device:** 2019-era mid-range Android (Snapdragon 665 class, 3-4GB RAM)
- **Profiling method:** USB debugging with Chrome DevTools (chrome://inspect) for most accurate CPU profiling
- **Primary profiling target:** Sight Reading game (VexFlow + mic + scoring simultaneously); secondary: Notes Recognition
- **Duration:** Full exercise session (10 questions) to capture steady-state and transitions
- **Must include bass clef notes (A2-E4)** — lower frequencies stress the 4096-sample FFT more (worst case)
- **Decision gate:** If <5% frame drop, close phase — PERF-01 delivered, no AudioWorklet built
- **AudioWorklet scope (conditional):** Move pitchy McLeod Pitch Method off main thread only; FSM stays on main thread via postMessage
- **Ring buffer:** Hardcoded 2048 samples (128-frame quanta accumulation) per PERF-03 spec
- **No automated performance regression tests** — manual profiling sufficient for conditional feature
- **No new game features, UI changes, algorithm changes, or iOS-specific work**

### Claude's Discretion
- Exact profiling methodology (Performance tab vs Timeline vs custom marks)
- Whether to capture flame charts, summary stats, or both
- Any quick optimizations found during profiling (e.g., reducing rAF rate, Float32Array pooling)
- Browser fallback strategy if AudioWorklet is built
- Whether to add dev-only FPS counter for future debugging

### Deferred Ideas (OUT OF SCOPE)
- Cents deviation display (FEED-01)
- Device calibration wizard (FEED-02)
- Multi-algorithm consensus (ADV-01)
- Dev-only performance monitoring overlay (may add if profiling reveals need)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-01 | CPU profiling conducted on mid-range Android device to measure audio processing frame drop | Chrome DevTools remote debugging protocol, Performance panel methodology, WebAudio panel render capacity metric |
| PERF-02 | If profiling shows >5% frame drop from audio processing, AudioWorklet migration moves pitch detection off main thread | AudioWorklet API, ring buffer accumulation, postMessage FSM communication pattern |
| PERF-03 | If AudioWorklet built, uses ring buffer accumulation pattern (128-frame quanta to 2048 samples) for bass clef detection | Ring buffer implementation, 128-frame/2048-sample math, pitchy bundling for AudioWorklet scope |
</phase_requirements>

---

## Summary

This phase is explicitly profiling-gated: PERF-02 and PERF-03 only execute if PERF-01 reveals measurable frame drop (>5%) attributable to audio processing. The existing `usePitchDetection.js` runs a `requestAnimationFrame` detect loop on the main thread, calling `analyser.getFloatTimeDomainData()` and `pitchy.findPitch()` every frame (~16.7ms). On a mid-range Android device, this may or may not cause frame drops depending on the device's single-core JavaScript throughput.

The profiling setup is USB debugging with Chrome DevTools (chrome://inspect) — this gives a real CPU profile of the actual Android hardware, not a throttled desktop simulation. The WebAudio panel's Render Capacity metric is a secondary diagnostic tool. The primary evidence is the Performance panel's Main thread flame chart and FPS chart: if audio callbacks appear as sustained red long-tasks coinciding with FPS drops, AudioWorklet migration is warranted.

If migration is needed, the approach is well-established: place pitchy detection in an `AudioWorkletProcessor`, accumulate 128-frame quanta in a simple ring buffer until 2048 samples are available, run `findPitch()`, and `postMessage` the result back to the main thread FSM. The pitchy library (pure ESM, 5KB) can be bundled directly into the worklet file using the `public/` folder pattern already established in this project.

**Primary recommendation:** Complete the profiling session first. If the device shows <5% frame drop, close PERF-01 and ship. Only build the AudioWorklet if the profiling data demands it.

---

## Standard Stack

### Core (profiling path — PERF-01)

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Chrome DevTools Performance panel | Built-in Chrome | Record CPU profile, FPS chart, Main thread flame chart | Only tool that gives real device CPU profiles via USB remote debugging |
| chrome://inspect#devices | Built-in Chrome | USB remote debugging entry point on host machine | Official Android remote debugging protocol |
| Chrome DevTools WebAudio panel | Built-in Chrome | Render Capacity % monitor for audio thread health | Shows audio render budget usage in real-time |

### Core (AudioWorklet path — PERF-02/PERF-03, conditional)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| AudioWorklet API | Browser built-in | Off-main-thread audio processing | W3C standard, 95%+ browser support, replaces deprecated ScriptProcessorNode |
| pitchy | ^4.1.0 (already installed) | McLeod Pitch Method inside worklet | Already used on main thread; pure JS, can be bundled into worklet file |
| MessagePort (AudioWorkletNode.port) | Browser built-in | Send pitch result from worklet to main thread | Standard bidirectional channel between worklet and main |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `about://tracing` (Chrome) | Built-in | Deep audio render timing traces | If Performance panel isn't enough detail on audio thread |
| `performance.mark()` / `performance.measure()` | Browser built-in | Custom timing markers in detect loop | If you need to measure exact duration of `findPitch()` call in rAF |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pitchy in worklet file (bundled) | WASM pitch detector | WASM is harder to set up, COPPA risk if CDN-hosted; pitchy is already installed |
| Simple ring buffer (JS array) | SharedArrayBuffer ring buffer | SharedArrayBuffer requires COOP/COEP headers (cross-origin isolation) — adds deployment complexity; simple JS buffer sufficient for this use case since we only need one-way data flow (worklet → main) |
| postMessage for results | SharedArrayBuffer for results | postMessage is simpler, sufficient frequency (once per ~45ms), avoids COOP/COEP requirement |

**Installation:** No new packages needed. pitchy is already installed at ^4.1.0.

---

## Architecture Patterns

### Recommended Project Structure (AudioWorklet path, if triggered)

```
public/
└── worklets/
    └── pitch-detector.worklet.js   # Standalone file: bundled pitchy + processor

src/
├── contexts/
│   └── AudioContextProvider.jsx    # Add: createPitchWorkletNode() method
└── hooks/
    └── usePitchDetection.js        # Add: worklet message listener path
```

The worklet file lives in `public/worklets/` so Vite serves it as a static asset. The `addModule()` call uses a root-relative path: `'/worklets/pitch-detector.worklet.js'`.

### Pattern 1: Chrome DevTools USB Remote Debugging

**What:** Connect an Android phone via USB to the dev machine, open chrome://inspect#devices, click "Inspect" next to the app tab, then use the full Performance panel on the actual device's Chrome instance.

**When to use:** PERF-01 profiling session.

**Setup steps:**
1. Android device: Settings → Developer options → Enable USB debugging
2. Connect USB cable
3. On dev machine: open Chrome, navigate to `chrome://inspect#devices`
4. Check "Discover USB devices" — device appears with model name
5. Open app tab in device browser → click "Inspect" in chrome://inspect
6. In the DevTools window: open Performance tab
7. IMPORTANT: Disable screencast (skews FPS measurements)
8. Click record → exercise through full 10-question session → stop
9. Examine FPS chart for red bars, Main thread for audio-related long tasks

**Key metrics to capture:**
- FPS chart: any red bars during active mic detection
- Main thread flame chart: `detectLoop` / `getFloatTimeDomainData` / `findPitch` durations
- Summary tab: % of time in Scripting vs Rendering vs Idle
- WebAudio panel: Render Capacity % (open via DevTools → more tabs → WebAudio)

**Pass/fail threshold:**
- PASS (no AudioWorklet needed): FPS stays ≥57 fps during active detection, Scripting column <5% of total frame time
- FAIL (build AudioWorklet): Red bars in FPS chart correlating with audio callback timing, or Scripting >5% of frame budget

### Pattern 2: AudioWorklet Processor (conditional — only if PERF-01 fails)

**What:** Move `findPitch()` call from `requestAnimationFrame` loop into an `AudioWorkletProcessor` that runs on the audio render thread.

**When to use:** Only if PERF-01 profiling shows >5% frame drop.

**The processor file (`public/worklets/pitch-detector.worklet.js`):**

```javascript
// Source: MDN AudioWorkletProcessor docs + pitchy library pattern
// IMPORTANT: pitchy must be inlined here — importScripts() is unavailable in worklets.
// Bundle pitchy's source directly into this file (copy from node_modules/pitchy/dist/).

// --- Inline pitchy source here (or use a build step to inject it) ---
// [pitchy source: PitchDetector class definition]

const ACCUMULATION_SIZE = 2048;  // PERF-03: minimum samples for bass clef accuracy
const QUANTUM_SIZE = 128;        // AudioWorklet always delivers 128 frames

class PitchDetectorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(ACCUMULATION_SIZE);
    this._writePos = 0;
    this._detector = null;  // Initialized lazily after first process() call
    this._inputBuffer = null;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;  // No input, keep alive

    const channelData = input[0];  // Mono channel (128 samples)

    // Copy quantum into ring buffer
    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._writePos % ACCUMULATION_SIZE] = channelData[i];
      this._writePos++;
    }

    // Only run detection once we have accumulated enough samples
    if (this._writePos < ACCUMULATION_SIZE) return true;
    // Run every time a full buffer worth of new data arrives (~45ms at 44.1kHz)
    if (this._writePos % ACCUMULATION_SIZE !== 0) return true;

    // Lazy init PitchDetector (requires ACCUMULATION_SIZE)
    if (!this._detector) {
      this._detector = PitchDetector.forFloat32Array(ACCUMULATION_SIZE);
      this._inputBuffer = new Float32Array(this._detector.inputLength);
    }

    // Snapshot ring buffer into contiguous input (handle wrap-around)
    const startPos = this._writePos % ACCUMULATION_SIZE;
    for (let i = 0; i < ACCUMULATION_SIZE; i++) {
      this._inputBuffer[i] = this._buffer[(startPos + i) % ACCUMULATION_SIZE];
    }

    // Run McLeod Pitch Method (off main thread)
    const [pitch, clarity] = this._detector.findPitch(
      this._inputBuffer,
      sampleRate  // AudioWorkletGlobalScope provides sampleRate
    );

    // Send result to main thread via MessagePort
    this.port.postMessage({ pitch, clarity });

    return true;  // Keep processor alive
  }
}

registerProcessor('pitch-detector', PitchDetectorProcessor);
```

### Pattern 3: AudioContextProvider Integration (conditional)

**What:** Create the AudioWorkletNode in `AudioContextProvider.requestMic()` and expose it to consumers.

**When to use:** Only if AudioWorklet path is triggered.

```javascript
// In AudioContextProvider.jsx — inside requestMic():

// Load worklet module (idempotent — addModule is safe to call multiple times)
await ctx.audioWorklet.addModule('/worklets/pitch-detector.worklet.js');

// Create the worklet node
const workletNode = new AudioWorkletNode(ctx, 'pitch-detector');

// Connect the audio chain: source → analyser → workletNode
source.connect(analyser);
source.connect(workletNode);  // workletNode receives same raw audio as analyser

// Expose workletNode via context value
workletNodeRef.current = workletNode;
```

### Pattern 4: Hook Integration — Worklet Listener (conditional)

**What:** In `usePitchDetection.js`, add a worklet message handler path that replaces the `requestAnimationFrame` loop.

```javascript
// In startListening(), after workletNode is available:
workletNode.port.onmessage = (event) => {
  const { pitch, clarity } = event.data;
  if (clarity >= clarityThreshold && pitch > 0) {
    const note = frequencyToNote(pitch);
    setDetectedFrequency(pitch);
    setDetectedNote(note);
    if (onPitchDetected && note) onPitchDetected(note, pitch);
  } else {
    setDetectedFrequency(-1);
    setDetectedNote(null);
  }
};
// No requestAnimationFrame loop needed — worklet drives the callbacks
```

### Anti-Patterns to Avoid

- **Using SharedArrayBuffer for the ring buffer:** Requires COOP/COEP cross-origin isolation headers (`Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`). These headers break Supabase JS SDK (cross-origin fetch). Use a simple JS ring buffer inside the worklet instead — postMessage frequency is low enough (~22 messages/second) that serialization cost is negligible.
- **Calling `importScripts()` in the worklet:** Not available in AudioWorkletGlobalScope. Either inline pitchy's source or use a build step.
- **Dynamic `import()` in the worklet:** While static imports work in Chrome (AudioWorkletGlobalScope is a module scope when loaded via `addModule()`), Firefox support is newer (Nightly 113+). Bundle pitchy directly to be safe across all supported browsers.
- **Building AudioWorklet speculatively:** The phase gate is explicit — if profiling shows no frame drop, do not build it.
- **Running detection on every 128-frame quantum:** At 44.1kHz, 128 frames = ~2.9ms. For bass clef notes (A2 = 110Hz), the fundamental period is ~9ms — you need at least 2048 samples (~46ms) to capture multiple cycles. Firing detection on every quantum gives garbage results for bass notes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ring buffer data structure | Custom linked list or array shift | Simple modulo-indexed Float32Array | Built-in array + modulo is cache-friendly, allocation-free, and sufficient for this use case |
| Pitch detection algorithm | Custom autocorrelation in worklet | pitchy (already installed) inlined into worklet file | McLeod Pitch Method is already validated against this app's note range; reinventing it introduces regressions |
| Cross-thread data transfer | SharedArrayBuffer ring buffer | Simple postMessage of `{pitch, clarity}` object | SharedArrayBuffer requires COOP/COEP headers that break Supabase; postMessage at 22 Hz is negligible cost |
| Mobile CPU simulation | Desktop CPU throttle (4x, 6x) | Real device via USB debugging | Throttling doesn't simulate Android's actual architecture (single-core burst performance, memory bandwidth) |

**Key insight:** The ring buffer for this use case is just a fixed-size Float32Array with a write pointer — 10 lines of code, no library needed.

---

## Common Pitfalls

### Pitfall 1: Screencast Skews FPS Measurements
**What goes wrong:** Leaving "screencast" enabled in chrome://inspect DevTools during profiling artificially drops FPS, making results look worse than reality.
**Why it happens:** Screencast continuously captures and transmits frames over USB.
**How to avoid:** Immediately click the screencast toggle (monitor icon, top-left of DevTools) to disable it before starting performance recording.
**Warning signs:** FPS consistently shows 30-45fps even in idle UI — that's screencast overhead, not real performance.

### Pitfall 2: Bass Note Minimum Sample Requirement
**What goes wrong:** Running `findPitch()` on only 128 samples produces incorrect results for low-frequency notes.
**Why it happens:** A2 = 110 Hz. At 44.1kHz sample rate, one period = 401 samples. 128 samples doesn't even span half a period — MPM has nothing to correlate against.
**How to avoid:** Accumulate at least 2048 samples (PERF-03 spec) before calling `findPitch()`. This gives ~18ms of audio — sufficient for notes down to ~21.5 Hz (below any piano fundamental).
**Warning signs:** Bass notes detected as an octave up or not detected at all.

### Pitfall 3: pitchy inputLength vs fftSize
**What goes wrong:** `PitchDetector.forFloat32Array(N)` where N is the buffer size you provide; `inputLength` is the required input array length. These are equal (pitchy uses the whole buffer).
**Why it happens:** Confusion with the AnalyserNode's `fftSize` vs `frequencyBinCount` distinction.
**How to avoid:** In the worklet, create `PitchDetector.forFloat32Array(2048)` and the ring buffer is also 2048. Pass a 2048-length Float32Array to `findPitch()`. Simple.

### Pitfall 4: AudioWorklet Module Path in Vite Dev vs Production
**What goes wrong:** `addModule('/worklets/pitch-detector.worklet.js')` works in dev (Vite serves `public/` at root) but may fail if the production build has a base path.
**Why it happens:** Vite's `base` config option affects all asset paths.
**How to avoid:** The project currently uses the default `base: '/'` (no custom base in vite.config). Placing the file in `public/worklets/` and using root-relative path `/worklets/pitch-detector.worklet.js` is safe.
**Warning signs:** `addModule()` throws a network error or 404 in production but works in dev.

### Pitfall 5: addModule Called Twice
**What goes wrong:** Calling `requestMic()` (which calls `addModule()`) a second time after releaseMic() throws an error because the processor name is already registered.
**Why it happens:** `registerProcessor('pitch-detector', ...)` can only be called once per AudioContext.
**How to avoid:** Guard `addModule()` with a ref flag (`workletLoadedRef.current`) — only call it once per AudioContext lifetime. Since `AudioContextProvider` creates one context per game route mount, this is only a risk if `requestMic()` is called multiple times within one route. Add: `if (!workletLoadedRef.current) { await addModule(...); workletLoadedRef.current = true; }`.

### Pitfall 6: postMessage Object Allocation on Audio Thread
**What goes wrong:** Creating a new `{ pitch, clarity }` object on every `postMessage` call generates GC pressure on the audio thread.
**Why it happens:** The audio thread has its own V8 isolate but still has garbage collection.
**How to avoid:** For this use case (~22 messages/second), GC pressure from small objects is acceptable. If the Chrome DevTools WebAudio panel shows render capacity spikes, switch to posting a `Float32Array(2)` via `Transferable` — but this is premature optimization.

---

## Code Examples

Verified patterns from official sources:

### Loading an AudioWorklet Module (AudioContextProvider)
```javascript
// Source: MDN Web Audio API / Using AudioWorklet
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet

const loadWorklet = async (ctx) => {
  // addModule() is idempotent on the same URL — safe to call again if ctx is reused
  await ctx.audioWorklet.addModule('/worklets/pitch-detector.worklet.js');
};
```

### AudioWorkletProcessor skeleton
```javascript
// Source: MDN AudioWorkletProcessor
// https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor

class PitchDetectorProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const channelData = inputs[0]?.[0];  // First input, first channel
    if (!channelData) return true;
    // ... accumulate into ring buffer, detect when ready, postMessage result
    return true;  // Always return true — keeps the processor alive
  }
}
registerProcessor('pitch-detector', PitchDetectorProcessor);
```

### Ring buffer write (modulo pattern, no allocation)
```javascript
// Pattern: accumulate 128-frame quanta until 2048 samples ready
// Source: Chrome Web Audio Samples design pattern
// https://developer.chrome.com/blog/audio-worklet-design-pattern

const RING_SIZE = 2048;
const ring = new Float32Array(RING_SIZE);
let writePos = 0;

// In process():
for (let i = 0; i < channelData.length; i++) {
  ring[writePos % RING_SIZE] = channelData[i];
  writePos++;
}

// Fire detection only when a full buffer of new data has arrived
const shouldDetect = writePos >= RING_SIZE && (writePos % RING_SIZE === 0);
```

### Receiving worklet messages in usePitchDetection
```javascript
// Pattern: replace rAF loop with port listener (main thread)
workletNode.port.onmessage = ({ data: { pitch, clarity } }) => {
  if (clarity >= clarityThreshold && pitch > 0) {
    const note = frequencyToNote(pitch);
    setDetectedNote(note);
    setDetectedFrequency(pitch);
    if (onPitchDetected && note) onPitchDetected(note, pitch);
  } else {
    setDetectedNote(null);
    setDetectedFrequency(-1);
  }
};
```

### Chrome DevTools profiling — custom Performance marks (optional)
```javascript
// Add to detectLoop() in usePitchDetection.js for precise timing in flame chart
performance.mark('findPitch-start');
const [pitch, clarity] = detectorRef.current.findPitch(inputBufferRef.current, sampleRate);
performance.mark('findPitch-end');
performance.measure('findPitch', 'findPitch-start', 'findPitch-end');
// These appear as named segments in the Performance panel's "Timings" track
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ScriptProcessorNode (deprecated) | AudioWorkletProcessor | Chrome 64 (2018), now universal | ScriptProcessorNode ran on main thread and was synchronous; Worklet is off main thread |
| SharedArrayBuffer for cross-thread buffers | postMessage for simple results | Still valid tradeoff in 2025 | SharedArrayBuffer requires COOP/COEP; postMessage is sufficient for low-frequency results |
| requestAnimationFrame pitch loop | AudioWorkletProcessor (if needed) | Available since 2018, appropriate when frame drop confirmed | rAF loop ties audio processing to rendering pipeline; worklet runs on audio thread |

**Deprecated/outdated:**
- `ScriptProcessorNode`: Fully deprecated in Web Audio API spec. Do not use. AudioWorklet is the replacement.
- `importScripts()` in AudioWorklet: Not available. Use static `import` (Chrome, modern Firefox) or inline/bundle code.

---

## Open Questions

1. **Does pitchy's ESM format work as a static `import` in the AudioWorklet module scope?**
   - What we know: Static imports work in Chrome's AudioWorkletGlobalScope (it is a module scope). Firefox added support in Nightly 113+. Pitchy is pure ESM (no CJS).
   - What's unclear: Whether `import { PitchDetector } from 'pitchy'` works in a Vite-served worklet file, or if the npm module resolution fails in the worklet context.
   - Recommendation: **Safer approach** — inline pitchy's source directly in the worklet file (copy `node_modules/pitchy/dist/pitchy.js` content into the worklet file). This is ~5KB and guarantees cross-browser compatibility without module resolution issues. Only worth doing if PERF-02 is triggered.

2. **What if the phone isn't a Snapdragon 665 device?**
   - What we know: The decision specifies "2019-era mid-range Android (Snapdragon 665 class, 3-4GB RAM)" as the target.
   - What's unclear: The exact test device available to the developer.
   - Recommendation: Any 2019-era Android phone with Chrome is adequate. Document the actual device model and Chrome version in the profiling results file. If the phone is significantly faster (e.g., flagship 2021+), apply 4x CPU throttle in DevTools as a compensating factor.

3. **Will the PERF-01 profiling session reveal any non-audio bottlenecks?**
   - What we know: The Sight Reading game runs VexFlow SVG rendering + mic detection + scoring simultaneously.
   - What's unclear: Whether VexFlow layout recalculation on exercise transitions is a separate hotspot.
   - Recommendation: Note any non-audio hotspots in the profiling results document but do not act on them in this phase (Claude's discretion: "capture any obvious low-hanging optimizations").

---

## Validation Architecture

> `workflow.nyquist_validation` is not set in `.planning/config.json` — this section is omitted per config.

---

## Sources

### Primary (HIGH confidence)
- [MDN: Background audio processing using AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet) — AudioWorklet module loading, process() method, MessagePort
- [MDN: AudioWorkletProcessor](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor) — process() signature, return value, constraints
- [Chrome Developers: Audio worklet design pattern](https://developer.chrome.com/blog/audio-worklet-design-pattern) — ring buffer patterns, SharedArrayBuffer vs postMessage tradeoffs
- [Chrome Developers: Remote debug Android devices](https://developer.chrome.com/docs/devtools/remote-debugging) — USB debugging setup procedure
- [Chrome Developers: Analyze runtime performance](https://developer.chrome.com/docs/devtools/performance) — Performance panel methodology, CPU throttling, FPS measurement
- [web.dev: Profiling Web Audio apps in Chrome](https://web.dev/articles/profiling-web-audio-apps-in-chrome) — WebAudio panel, Render Capacity metric
- [Can I Use: AudioWorklet](https://caniuse.com/mdn-api_audioworklet) — 95.63% global browser support, Safari 14.1+, Firefox 76+, Chrome 66+

### Secondary (MEDIUM confidence)
- [WebAudio API GitHub Issue #2194: importScripts in AudioWorklet](https://github.com/WebAudio/web-audio-api/issues/2194) — Static imports work, `importScripts()` not available, bundle recommendation from Paul Adenot (Web Audio API maintainer)
- [pitchy npm / GitHub](https://github.com/ianprime0509/pitchy) — v4.1.0, pure ESM, Zero Clause BSD, `findPitch(input, sampleRate)` API

### Tertiary (LOW confidence)
- [Chrome DevTools Performance reference](https://developer.chrome.com/docs/devtools/performance/reference) — Long tasks >50ms flagged red, Frames section green/yellow/red indicators

---

## Metadata

**Confidence breakdown:**
- Profiling methodology (PERF-01): HIGH — Chrome DevTools USB debugging is well-documented official process
- AudioWorklet API (PERF-02): HIGH — verified via MDN and Chrome official docs, broad browser support confirmed
- Ring buffer pattern (PERF-03): HIGH — pattern documented in Chrome Web Audio Samples, math is straightforward
- pitchy in worklet scope: MEDIUM — static imports should work in Chrome; inline bundling is safer for cross-browser

**Research date:** 2026-03-04
**Valid until:** 2026-09-04 (AudioWorklet API is stable; profiling tooling unlikely to change substantially)
