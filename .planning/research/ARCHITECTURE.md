# Architecture Research

**Domain:** Pitch Detection Pipeline Refactor — React PWA (piano learning)
**Researched:** 2026-02-17
**Confidence:** HIGH (direct codebase analysis + verified browser API support data)

---

## Diagnosis: What Exists Today

Before recommending architecture, the current state must be understood precisely from the source code.

### Current Hook Hierarchy

```
usePitchDetection.js          Layer 1: Raw signal -> frequency -> note string
    ^-- wraps
useMicNoteInput.js            Layer 2: Frequency events -> stable note-on/note-off
    ^-- consumed by
SightReadingGame.jsx          Uses useMicNoteInput + useAudioEngine (two separate contexts)

NotesRecognitionGame.jsx      Has its own INLINE COPY of usePitchDetection logic
                              (250+ lines: getUserMedia, detectLoop, frequencyToNote, detectPitch)
                              This is the primary duplication problem.

MetronomeTrainer.jsx          Uses tap gestures only, no mic pitch detection.
                              Uses useAudioEngine for playback scheduling.
```

### Critical Problem: Multiple AudioContexts

Every hook that touches Web Audio creates its own `AudioContext`:
- `usePitchDetection.startListening()` creates a new AudioContext on each call
- `useAudioEngine` creates its own AudioContext on mount
- `NotesRecognitionGame.startAudioInput()` creates yet another AudioContext inline

When `SightReadingGame` runs, it has **two simultaneous AudioContexts**: one from `useAudioEngine` (for metronome/playback) and one from `usePitchDetection` (for mic input). Problems:
- iOS Safari has undocumented limits on concurrent AudioContext instances — silent failures observed
- Each context consumes audio hardware independently
- Cleanup bugs multiply — each context must be closed separately
- Mic stream timing is disconnected from playback timing, making beat-correlation harder

### Current Detection Algorithm

`usePitchDetection` uses simplified time-domain autocorrelation:
- FFT size: 2048 samples at ~60fps via `requestAnimationFrame`
- `GOOD_ENOUGH_CORRELATION = 0.9` hardcoded
- No parabolic interpolation between bins
- Octave errors are common: detects F3 when F4 is played

### What Each Game Actually Needs from Mic Input

| Game | Needs Pitch | Needs Timing | Current State |
|------|------------|--------------|---------------|
| SightReadingGame | Yes | Yes — note-on vs. expected beat | Uses `useMicNoteInput` (correct) |
| NotesRecognitionGame | Yes | No — just "did they play X" | Has inline detection copy (wrong) |
| MetronomeTrainer | No | Yes — tap timestamps vs. beat | No mic, uses tap events only |

---

## Recommended Architecture

### Guiding Principle

**One AudioContext, shared.** Everything else is a layer on top of it.

The Web Audio API specification explicitly states that multiple audio sources and pipelines can share a single AudioContext. A shared context means:
- One permission prompt for the entire game session
- Mic stream connects to the same context as playback (enables future timing correlation)
- Single cleanup path on game exit
- Predictable behavior on iOS Safari

### System Overview

```
+-----------------------------------------------------------------------+
|                      GAME COMPONENTS (consumers)                      |
|  +------------------+  +-------------------+  +-------------------+  |
|  | SightReadingGame |  | NotesRecognitionGm|  | MetronomeTrainer  |  |
|  | needs: pitch     |  | needs: pitch      |  | needs: playback   |  |
|  |         timing   |  |                   |  |         tap timing|  |
|  +--------+---------+  +----------+--------+  +---------+---------+  |
|           |                       |                     |            |
+-----------|------------------------|---------------------|------------+
|                    FEATURE HOOKS (composable units)                   |
|  +--------------------+     +--------------------------------------+  |
|  |  useMicNoteInput   |     |         useAudioEngine               |  |
|  | (stability layer)  |     | (scheduling, metronome, playback)    |  |
|  +----------+---------+     +-----------------+--------------------+  |
|             |                                 |                       |
|  +----------+---------------------------------+--------------------+  |
|  |               usePitchDetection (detection algorithm)           |  |
|  +-------------------------------+---------------------------------+  |
|                                  |                                    |
+----------------------------------|------------------------------------+
|                   AudioContext PROVIDER (new)                         |
|  +---------------------------------------------------------------+   |
|  |  AudioContextProvider (React Context)                         |   |
|  |  - one AudioContext, created on first user interaction        |   |
|  |  - owns: audioContextRef, micStreamRef, analyserNodeRef       |   |
|  |  - provides: initialize(), isReady state                      |   |
|  +---------------------------------------------------------------+   |
+-----------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | File Location |
|-----------|---------------|---------------|
| `AudioContextProvider` | Owns the single AudioContext and mic stream. Creates lazily on user interaction. Cleans up on unmount. | `src/contexts/AudioContextProvider.jsx` (new) |
| `usePitchDetection` | Connects to context's analyserNode. Runs detection algorithm. Returns raw `{ frequency, note }`. No AudioContext management. | `src/hooks/usePitchDetection.js` (modify) |
| `useMicNoteInput` | Stability debouncing: frame counting, note-on/note-off semantics, preset configs. | `src/hooks/useMicNoteInput.js` (minor modify) |
| `useAudioEngine` | Playback: metronome scheduling, piano sounds, timing math. Receives audioContextRef from provider. | `src/hooks/useAudioEngine.js` (modify) |
| `MIC_INPUT_PRESETS` | Per-game stability parameters. | `src/hooks/micInputPresets.js` (keep as-is) |

---

## Recommended Project Structure (Delta Only)

Only new or changed files from the current state:

```
src/
+-- contexts/
|   +-- AudioContextProvider.jsx    NEW: single AudioContext + mic stream ownership
+-- hooks/
|   +-- usePitchDetection.js        MODIFY: accept analyserNode from context param
|   +-- useMicNoteInput.js          MINOR: remove AudioContext creation, delegate to provider
|   +-- useAudioEngine.js           MODIFY: accept shared audioContextRef prop
|   +-- micInputPresets.js          KEEP: no changes needed
+-- components/games/
    +-- notes-master-games/
        +-- NotesRecognitionGame.jsx MODIFY: replace ~250 lines inline detection with useMicNoteInput
```

App tree wiring (add `AudioContextProvider` at game route boundary in `AppLayout.jsx`):

```
AppLayout.jsx
+-- [dashboard, trail, settings routes] → no AudioContextProvider
+-- [game routes] → wrapped in AudioContextProvider
    +-- SightReadingGame
    +-- NotesRecognitionGame
    +-- MetronomeTrainer
```

---

## Architectural Patterns

### Pattern 1: Shared AudioContext via React Context

**What:** `AudioContextProvider` wraps all game routes. It creates one `AudioContext` lazily (on first user interaction, required by browser autoplay policy) and exposes it via React Context. All hooks that need Web Audio receive the shared context.

**When to use:** Always — for every game in this app.

**Trade-offs:** One more indirection step. Games cannot fully self-contain their audio teardown. Worth it: iOS Safari's limit on concurrent AudioContexts is a real constraint causing silent failures in the current architecture.

**Example:**

```javascript
// src/contexts/AudioContextProvider.jsx

const AudioContextContext = createContext(null);

export function AudioContextProvider({ children }) {
  const contextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const micStreamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Called from a click handler — never from useEffect
  const initialize = useCallback(async () => {
    if (contextRef.current) return contextRef.current;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();

    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    contextRef.current = ctx;
    gainNodeRef.current = gain;
    analyserNodeRef.current = analyser;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    setIsReady(true);
    return ctx;
  }, []);

  // Called when starting mic input
  const initializeMic = useCallback(async () => {
    if (micStreamRef.current) return; // already open

    const ctx = contextRef.current || await initialize();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyserNodeRef.current);
    micStreamRef.current = stream;
  }, [initialize]);

  const stopMic = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        if (track.readyState !== 'ended') track.stop();
      });
      micStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMic();
      if (contextRef.current && contextRef.current.state !== 'closed') {
        contextRef.current.close();
      }
    };
  }, [stopMic]);

  const value = useMemo(() => ({
    audioContextRef: contextRef,
    gainNodeRef,
    analyserNodeRef,
    isReady,
    initialize,
    initializeMic,
    stopMic,
  }), [isReady, initialize, initializeMic, stopMic]);

  return (
    <AudioContextContext.Provider value={value}>
      {children}
    </AudioContextContext.Provider>
  );
}

export const useAudioContext = () => useContext(AudioContextContext);
```

### Pattern 2: Layered Hook Composition (Preserve Existing Separation)

**What:** The current two-layer design (`usePitchDetection` -> `useMicNoteInput`) is architecturally correct and must be kept. The layers have clear responsibilities:
- Layer 1 (`usePitchDetection`): Signal processing — raw frequency detection
- Layer 2 (`useMicNoteInput`): Event semantics — stability, debouncing, note-on/off

**When to use:** Always. Do not merge the layers.

**Trade-offs:** Two hops of indirection. Worth it because stability parameters differ per game (tuned in `MIC_INPUT_PRESETS`) while the algorithm is shared.

**After refactor, `usePitchDetection` becomes:**

```javascript
// Modified: accepts analyserNode from context instead of creating AudioContext
export function usePitchDetection({
  analyserNode,        // From AudioContextProvider
  sampleRate,          // From AudioContextProvider.audioContextRef.current.sampleRate
  isActive = false,
  onPitchDetected = null,
  onLevelChange = null,
  noteFrequencies = DEFAULT_NOTE_FREQUENCIES,
  rmsThreshold = 0.01,
  tolerance = 0.05,
} = {}) {
  // No getUserMedia() or AudioContext creation here
  // Detection loop runs against provided analyserNode
  // All existing detectPitch() and frequencyToNote() logic stays unchanged
}
```

`useMicNoteInput` stays nearly identical — it calls `usePitchDetection` and manages stability state. The only change: mic stream acquisition moves to `AudioContextProvider.initializeMic()`.

### Pattern 3: Per-Game Configuration via Presets (Keep As-Is)

**What:** Game-specific detection parameters live in `micInputPresets.js`. Each game passes its preset to `useMicNoteInput`. This is already implemented and correct.

**Example (existing, no changes needed):**

```javascript
// SightReadingGame.jsx — already correct
const { audioLevel, isListening, startListening, stopListening } =
  useMicNoteInput({
    isActive: false,
    noteFrequencies,
    ...MIC_INPUT_PRESETS.sightReading,
    onNoteEvent: handleNoteEvent,
  });

// NotesRecognitionGame.jsx — after migration from inline code
const { audioLevel, isListening, startListening, stopListening } =
  useMicNoteInput({
    isActive: false,
    noteFrequencies: hebrewNoteFrequencies,
    ...MIC_INPUT_PRESETS.notesRecognition,
    onNoteEvent: handleNoteEvent,
  });
```

### Pattern 4: AudioWorklet Deferral — Do Not Use Yet

**What:** AudioWorklet runs detection on the audio rendering thread, off the main thread.

**Why not now:**
- The current autocorrelation loop at ~60fps takes approximately 2-5% CPU per the implementation docs. This is not a measurable performance problem.
- AudioWorklet requires a separate processor `.js` file served from same origin, loaded via `audioContext.audioWorklet.addModule(url)` — Vite needs special configuration for this.
- iOS Safari introduced AudioWorklet in 14.5 but has documented bugs on iPhone (not iPad/Mac) — Apple Developer Forums show active AudioWorklet issues as of iOS 18 (2024).
- MessagePort serialization overhead for sending audio data back to the main thread partially negates the off-thread benefit when note matching still happens on the main thread anyway.

**Decision:** Keep `requestAnimationFrame` + `AnalyserNode.getFloatTimeDomainData()`. It is sufficient. Flag AudioWorklet as a revisit item only if CPU profiling ever shows main-thread audio pressure.

---

## Data Flow

### Mic Pitch Detection Flow (After Refactor)

```
User clicks "Start Game" button
    |
    v
AudioContextProvider.initialize()
    --> new AudioContext()
    --> getUserMedia({ audio: true })
    --> context.createMediaStreamSource(stream)
    --> source.connect(analyserNode)
    |
    v
usePitchDetection receives analyserNode
    --> requestAnimationFrame loop
    --> analyserNode.getFloatTimeDomainData(buffer)
    --> detectPitch(buffer, sampleRate) --> frequency
    --> frequencyToNote(frequency) --> note string
    --> onPitchDetected(note, frequency) callback
    |
    v
useMicNoteInput receives onPitchDetected events
    --> frame counting: candidateFrames >= onFrames
    --> emit({ type: 'noteOn', pitch, time, frequency })
    |
    v
Game component (onNoteEvent handler)
    --> check against expected note / timing window
    --> update score and feedback state
```

### Playback and Detection Coordination Flow

```
AudioContextProvider.audioContextRef (single context)
    |
    +-- useAudioEngine reads it:
    |       --> schedules metronome clicks via audioContext.currentTime
    |       --> createOscillator(), scheduleEvent()
    |
    +-- usePitchDetection reads it:
            --> analyserNode.getFloatTimeDomainData() for pitch
            --> performance.now() for event timestamps

SightReadingGame correlates:
    --> audioEngine.getCurrentTime() (audioContext.currentTime, seconds)
    --> useMicNoteInput noteOn event.time (performance.now(), ms)
    --> timing window check: is the note-on within +/- N ms of expected beat?
```

Note: `audioContext.currentTime` and `performance.now()` are different clocks. The correlation already works in the existing code via the `useTimingAnalysis` hook. The refactor does not change this. Sharing the AudioContext opens the future option of reading `audioContext.currentTime` directly from mic events for tighter timing accuracy.

### State Management for Audio

Audio state must NOT go into React `useState` for the hot path. The current `useRef` pattern for audio nodes, streams, and animation frames is correct and must be preserved.

`useState` is appropriate only for:
- `isListening` — drives the mic indicator UI
- `audioLevel` — drives the level meter (throttle updates to every 5th frame)
- `isReady` — drives "mic not ready" user warnings

Everything else — AudioContext, AnalyserNode, MediaStream, animationFrameRef — stays in refs. This is the existing pattern in `usePitchDetection.js` and `useAudioEngine.js`. Preserve it.

---

## Integration Points

### New vs. Modified Files (Explicit)

| File | Action | What Changes |
|------|--------|-------------|
| `src/contexts/AudioContextProvider.jsx` | CREATE | New context owns AudioContext, mic stream, analyserNode |
| `src/hooks/usePitchDetection.js` | MODIFY | Remove `getUserMedia` and `AudioContext` creation; add `analyserNode` and `sampleRate` params; keep all detection logic |
| `src/hooks/useMicNoteInput.js` | MINOR MODIFY | `startListening` calls `AudioContextProvider.initializeMic()` instead of managing its own stream |
| `src/hooks/useAudioEngine.js` | MODIFY | Accept shared `audioContextRef` and `gainNodeRef` from `useAudioContext()` instead of `new AudioContext()` on mount |
| `src/components/games/notes-master-games/NotesRecognitionGame.jsx` | MODIFY | Replace ~250 lines of inline detection (`startAudioInput`, `detectPitch`, `frequencyToNote`, `detectLoop`) with `useMicNoteInput` + `MIC_INPUT_PRESETS.notesRecognition` |
| `src/hooks/micInputPresets.js` | KEEP | No changes needed |
| `src/components/layout/AppLayout.jsx` | MODIFY | Wrap game routes with `AudioContextProvider` |

### Where AudioContextProvider Mounts in the Component Tree

Mount at the game route boundary — not at app root. Mic permission must not be requested until a user enters a game. The existing `AppLayout.jsx` already distinguishes game routes (they hide sidebar/header). Use the same boundary:

```jsx
// AppLayout.jsx — existing isGameRoute logic already gates sidebar/header
const isGameRoute =
  location.pathname.startsWith('/notes-master-mode') ||
  location.pathname.startsWith('/rhythm-mode') ||
  location.pathname.startsWith('/practice');

// Add AudioContextProvider at the same boundary
{isGameRoute ? (
  <AudioContextProvider>
    <Outlet />
  </AudioContextProvider>
) : (
  <Outlet />
)}
```

This ensures:
- One AudioContext per game session, destroyed on route exit
- Dashboard, trail, and settings pages never trigger mic permission
- Context cleanup happens at the natural navigation boundary

### Browser Compatibility for This Architecture

The `requestAnimationFrame` + `AnalyserNode` approach has full target browser support. No compatibility gates needed.

| API | Chrome | Firefox | Safari Desktop | iOS Safari |
|-----|--------|---------|---------------|------------|
| AudioContext (webkit prefix) | 35+ | 25+ | 14.1+ (prefix 6+) | 14.5+ (prefix 6+) |
| getUserMedia | 53+ | 36+ | 11+ | 11+ |
| AnalyserNode.getFloatTimeDomainData | All | All | All | All |
| requestAnimationFrame | All | All | All | All |

The `webkitAudioContext` fallback already in `useAudioEngine.js` and `usePitchDetection.js` covers older iOS. Keep it.

---

## Suggested Build Order

Build in this order: each step leaves the app in a working state.

**Step 1: Create `AudioContextProvider`**
Standalone new file. Does not break any existing hooks. Add to game route wrapper in `AppLayout.jsx`. Test: game routes load without error; no AudioContext created until user interaction.

**Step 2: Modify `useAudioEngine`**
Accept `audioContextRef` and `gainNodeRef` from `useAudioContext()`. Keep internal fallback (creates own context) for tests. Test: MetronomeTrainer and SightReadingGame playback still works.

**Step 3: Modify `usePitchDetection`**
Accept `analyserNode` and `sampleRate` params. Keep existing internal path (creates own AudioContext) as fallback when params are not provided — this preserves test compatibility and README examples. Test: existing `usePitchDetection.test.js` still passes.

**Step 4: Minor update `useMicNoteInput`**
Delegate AudioContext init and mic stream to provider. `startListeningWrapped` calls `AudioContextProvider.initializeMic()`. Test: SightReadingGame mic input still works end-to-end.

**Step 5: Migrate `NotesRecognitionGame`**
Replace 250-line inline detection block with `useMicNoteInput` + `MIC_INPUT_PRESETS.notesRecognition`. Keep the `waitingForRelease` / `pendingNextNote` state — those are game logic, not detection logic, and should survive the migration. Test: Hebrew note recognition still works.

**Step 6: Regression test all three games**
Chrome desktop, Chrome Android, Safari iOS (physical device). Verify: single AudioContext in DevTools, no "AudioContext was not allowed to start" warnings, mic permission prompt appears once per session.

---

## Algorithm Improvement: YIN Over Autocorrelation

**Confidence: MEDIUM** — based on algorithm benchmarks; would require A/B testing to confirm magnitude in this specific use case.

The current autocorrelation in `usePitchDetection.detectPitch()` is the primary source of octave errors (C3 detected when C4 is played). YIN algorithm reduces octave error rates approximately 3x compared to autocorrelation per published benchmarks.

YIN adds three refinements over autocorrelation:
1. Difference function (reduces false peaks)
2. Cumulative mean normalization (reduces false positives at low frequencies)
3. Parabolic interpolation (finer frequency resolution between bins)

**Scope this as a drop-in replacement** for `detectPitch()` — same input (`Float32Array buffer`, `sampleRate`) and same output (`frequency in Hz or -1`).

The `pitchfinder` npm library includes a YIN implementation that works in browsers:

```javascript
import { YIN } from 'pitchfinder';

// Created once, not per-frame
const detectPitchYIN = YIN({ sampleRate: context.sampleRate });

// In detection loop (replaces existing detectPitch call):
const frequency = detectPitchYIN(buffer); // returns null or Hz
```

If avoiding a dependency, YIN is ~60 lines of JavaScript — the original 2002 paper is public domain.

**Recommendation:** Replace `detectPitch()` with YIN as part of this refactor, scoped as a single function swap. All games benefit simultaneously.

---

## Anti-Patterns

### Anti-Pattern 1: AudioContext Per Hook Instance

**What people do:** Every hook that needs Web Audio calls `new AudioContext()` internally. This is the current state of `usePitchDetection` and `useAudioEngine`.

**Why it's wrong:** Two contexts = two audio processing graphs. On iOS Safari, exceeding ~2-3 concurrent AudioContexts produces silent failures — the context is created but mic access or playback silently drops. Cleanup bugs multiply. Missing `context.close()` in any path leaks audio resources.

**Do this instead:** `AudioContextProvider` owns one context. Hooks receive it via `useAudioContext()`.

### Anti-Pattern 2: Inline Detection Logic in Game Components

**What people do:** `NotesRecognitionGame.jsx` has 250+ lines of `getUserMedia`, `detectPitch`, `frequencyToNote` copied from `usePitchDetection`. This duplication already exists and must be removed in this milestone.

**Why it's wrong:** Bug fixes and algorithm improvements in `usePitchDetection` never reach `NotesRecognitionGame`. The two implementations have already diverged (different `rmsThreshold` values, different debounce logic). YIN algorithm improvements would need to be applied in two places.

**Do this instead:** All games use `useMicNoteInput` with their preset config. Zero inline detection code in game components.

### Anti-Pattern 3: React State for Audio Buffer Data

**What people do:** Storing `AudioContext`, `AnalyserNode`, `MediaStream`, or audio buffer arrays in `useState`.

**Why it's wrong:** React's reconciler is not designed for 60fps state updates. Even with automatic batching, 60fps state changes cause visible jank on mid-range Android devices. Audio glitches can result from the rendering pipeline competing with audio processing.

**Do this instead:** Audio infrastructure lives in `useRef`. Only user-visible derived values (isListening, audioLevel throttled to every 5th frame) go in `useState`. The existing hooks already do this correctly — preserve it.

### Anti-Pattern 4: AudioWorklet for This Use Case

**What people do:** Reach for AudioWorklet because it is more modern or described as better in documentation.

**Why it's wrong for now:** The autocorrelation loop at 60fps is computationally cheap. AudioWorklet adds a separate processor file to serve, Vite bundler configuration complexity, a MessagePort serialization boundary for data transfer, and real iOS Safari bugs that have no fix timeline.

**Do this instead:** Keep `requestAnimationFrame`. Revisit AudioWorklet only if CPU profiling shows audio processing is a bottleneck on target devices (which it is not currently).

### Anti-Pattern 5: Requesting Mic Permission at App Root

**What people do:** Mount `AudioContextProvider` at the top of the React tree so audio is always available.

**Why it's wrong:** Browser mic permission prompt appears on app load, even for non-game pages (dashboard, trail, settings). Users who visit the trail or settings will see an unexpected mic permission request. On iOS, this is especially jarring.

**Do this instead:** Mount `AudioContextProvider` only at the game route boundary, as described in the integration points section.

---

## Scaling Considerations

This is a client-side PWA. Scaling means device performance, not server load.

| Device Class | Risk | Mitigation |
|-------------|------|------------|
| High-end desktop/mobile | None | Current approach is fine |
| Mid-range Android (2019-2021) | requestAnimationFrame at 60fps + React renders cause frame drops | Throttle `audioLevel` state update to every 5th frame; keep note events in refs not state |
| Low-end Android / older iOS | getUserMedia startup latency is higher; mic stream may take 1-2s | Show loading state during mic initialization; do not start game countdown until analyserNode is receiving signal (RMS > threshold for 3+ frames) |
| iOS Safari (any version) | AudioContext requires user gesture; context silently suspends | `initialize()` must be called from a click handler, never from `useEffect` |

---

## Sources

- [MDN: Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — single AudioContext reuse recommendation
- [MDN: AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) — widely available since April 2021
- [Can I Use: AudioWorklet](https://caniuse.com/mdn-api_audioworklet) — 95.63% global support; Safari 14.1+, iOS Safari 14.5+
- [Apple Developer Forums: AudioWorklet not playing on iOS 18](https://developer.apple.com/forums/thread/768347) — confirms active iOS AudioWorklet bugs as of 2024
- [pitchfinder library (GitHub)](https://github.com/peterkhayes/pitchfinder) — JavaScript YIN and other algorithm implementations
- [Autocorrelation vs YIN](https://pitchdetector.com/autocorrelation-vs-yin-algorithm-for-pitch-detection/) — accuracy comparison showing ~3x fewer octave errors with YIN
- Codebase direct analysis (February 2026): `src/hooks/usePitchDetection.js`, `useMicNoteInput.js`, `useAudioEngine.js`, `micInputPresets.js`, `NotesRecognitionGame.jsx`, `SightReadingGame.jsx`, `MetronomeTrainer.jsx`

---
*Architecture research for: Pitch Detection Pipeline Refactor — Piano Learning PWA*
*Researched: 2026-02-17*
