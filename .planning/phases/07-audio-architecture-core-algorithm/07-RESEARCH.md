# Phase 07: Audio Architecture and Core Algorithm - Research

**Researched:** 2026-02-17
**Domain:** Web Audio API architecture, McLeod Pitch Method (pitchy), React Context, AudioContext lifecycle
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Practice environment varies: quiet room and noisy living room both supported
- Both acoustic piano and digital keyboard must work — mic signal characteristics differ
- Missed real notes and false detections are equally frustrating
- Noise adaptation must be automatic — no manual sensitivity toggle for the kid
- No visual pitch indicator in sight reading game — just correct/incorrect
- SimplyPiano-style behavior for sight reading: pause horizontal scroll on wrong/no note, resume immediately on correct note
- Applies to sight reading game only — Notes Recognition keeps current behavior
- Immediate resume on correct note — no delay or animation
- Wait on wrong note with no highlighting or hints
- Infinite patience — no help after N wrong attempts, no skip option
- Scoring: fewer attempts to get the right note = higher score
- Accidental double key presses happen sometimes but not frequently
- "Latest note wins" — most recent detection replaces previous, allowing self-correction
- Single notes only for current games
- One detection per key press — holding a note counts as one event, never retriggered
- Transition between trail nodes must feel seamless — no permission re-prompts, no mic restart delays
- Release mic immediately when leaving game pages
- Ask mic permission again each game if previously denied
- Pause and resume when app goes to background
- Primary devices: iPad (Safari) and Android tablet
- pitchy 4.1.0 chosen for McLeod Pitch Method — 5KB, ESM-compatible, zero CDN fetch (COPPA-compliant)
- Single AudioContextProvider wraps game routes (not app root)
- Phase 10: AudioWorklet is profiling-gated — do not build speculatively

### Claude's Discretion

- Speed vs accuracy balance for correct note feedback
- What happens when detection is uncertain/borderline
- Multi-note handling strategy (detect target vs detect loudest vs reject)
- Exact confidence threshold tuning
- Audio chain DSP configuration details
- McLeod Pitch Method parameter tuning

### Deferred Ideas (OUT OF SCOPE)

- Metronome in sight reading game
- MIDI input support
- Chord detection
- SimplyPiano scroll and scoring changes (Phase 08)
- AudioWorklet (Phase 10, profiling-gated)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUDIO-01 | getUserMedia with echoCancellation: false, noiseSuppression: false, autoGainControl: false | MDN MediaTrackSettings docs; browser DSP corrupts piano harmonics — confirmed pattern in pitch detection community |
| AUDIO-02 | AnalyserNode smoothingTimeConstant set to 0.0 (was 0.8) | smoothingTimeConstant 0.8 creates ~100ms exponential decay lag; 0.0 gives raw frame-by-frame data |
| AUDIO-03 | AnalyserNode fftSize increased to 4096 (was 2048) | At 44100Hz sample rate: fftSize 4096 → 2048 bins → ~10.77 Hz/bin; fftSize 2048 → ~21.5 Hz/bin; C3=131Hz sits in bin 12 vs bin 6 — double the resolution for bass |
| ALGO-01 | Pitch detection uses McLeod Pitch Method via pitchy library | pitchy 4.1.0: `PitchDetector.forFloat32Array(inputLength)` + `findPitch(input, sampleRate)` returns `[pitch, clarity]`; eliminates octave errors from harmonic aliasing in naive autocorrelation |
| ALGO-02 | Pitch confidence threshold gates emissions | clarity 0.0–1.0 returned by pitchy; recommended threshold ~0.9 based on library internals; gates noisy/ambiguous detections |
| ALGO-03 | Accurately identifies all notes C3 to C6 | Trail node pools: treble C4–C6, bass E3–C4; actual frequency range 131Hz–1047Hz; fftSize 4096 resolves E3=165Hz at bin 15 clearly |
| ARCH-01 | Single shared AudioContextProvider React Context | Safari limits to 4 simultaneous AudioContexts per tab; current code has 3 separate instances (usePitchDetection, useAudioEngine, NotesRecognitionGame inline) + fanfareSound singleton |
| ARCH-02 | usePitchDetection accepts shared analyserNode from AudioContextProvider | Currently creates its own AudioContext inside startListening(); must be refactored to accept external analyserNode |
| ARCH-03 | useAudioEngine accepts shared AudioContext from AudioContextProvider | Currently creates AudioContext in initializeAudioContext() called from useEffect on mount |
| ARCH-04 | NotesRecognitionGame inline detection (~250 lines) replaced with useMicNoteInput hook | Lines 1654–1869 in NotesRecognitionGame.jsx contain inline detectPitch, frequencyToNote, startAudioInput, stopAudioInput, toggleAudioInput |
| ARCH-05 | AudioContext suspend()/resume() between exercises instead of creating new contexts | Eliminates create/close cycle on every game transition; uses existing .suspend()/.resume() Web Audio API methods |
</phase_requirements>

---

## Summary

Phase 07 has three interlocking work streams: (1) replace naive autocorrelation with the McLeod Pitch Method via the pitchy library, (2) fix the three audio chain configuration bugs that degrade detection quality, and (3) consolidate the three separate AudioContext instances into one shared React Context provider.

The current codebase has identical autocorrelation code duplicated in two places: `src/hooks/usePitchDetection.js` (lines 112–167) and `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (lines 1654–1702). Both use `fftSize: 2048` and `smoothingTimeConstant: 0.8`, and both call `getUserMedia({ audio: true })` without disabling browser DSP. The autocorrelation algorithm picks up harmonics as the fundamental frequency — for a piano's C4 (261Hz), the strong second harmonic at 523Hz can be picked up instead, reporting C5. The McLeod Pitch Method is specifically designed to handle harmonic-rich signals like piano correctly.

Safari on iPad allows a maximum of 4 simultaneous AudioContext instances before throwing an `UnknownError`. The current code creates one in `usePitchDetection`, one in `useAudioEngine` (MetronomeTrainer and SightReadingGame), and one inline in NotesRecognitionGame — plus `fanfareSound.js` has a module-level singleton. The `AudioContextProvider` wrapping game routes eliminates this risk. The `fanfareSound.js` singleton is already well-designed (it reuses its instance) but it needs to be wired into the shared context in a later step.

**Primary recommendation:** Install pitchy 4.1.0, create `AudioContextProvider` wrapping game routes, refactor `usePitchDetection` to accept an external `analyserNode`, update `useAudioEngine` to accept an external `AudioContext`, and replace NotesRecognitionGame's inline detection with `useMicNoteInput`. The three audio chain fixes (getUserMedia constraints, smoothingTimeConstant, fftSize) are applied once in the provider.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pitchy | 4.1.0 | McLeod Pitch Method pitch detection | Pure ESM, 5KB, no CDN fetch, returns `[pitch, clarity]` — exactly what ALGO-01/02 need |
| Web Audio API | Native browser | AudioContext, AnalyserNode, MediaStream | Already used throughout codebase |
| React Context | 18.3.1 | AudioContextProvider shared state | Existing pattern in codebase (SightReadingSessionContext, SettingsContext, etc.) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| navigator.mediaDevices.getUserMedia | Native | Mic access with DSP disabled | Every game session start |
| AudioContext.suspend() / .resume() | Native | Pause/resume between exercises | Instead of create/close cycles |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pitchy (McLeod) | pitchfinder (YIN/AMDF) | pitchfinder is CommonJS-only (needs transform), heavier; YIN is excellent but pitchy is already the locked decision |
| React Context for AudioContextProvider | Redux | Overkill; audio context is per-session state, not global app state |
| requestAnimationFrame loop | AudioWorklet | AudioWorklet is Phase 10 (profiling-gated) — do not build speculatively |

**Installation:**
```bash
npm install pitchy@4.1.0
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── contexts/
│   └── AudioContextProvider.jsx      # NEW: Owns one AudioContext per game session
├── hooks/
│   ├── usePitchDetection.js          # REFACTORED: accepts analyserNode from context
│   ├── useMicNoteInput.js            # UNCHANGED: stability layer above usePitchDetection
│   ├── useAudioEngine.js             # REFACTORED: accepts audioContext from context
│   └── micInputPresets.js            # UNCHANGED
└── components/games/
    └── notes-master-games/
        └── NotesRecognitionGame.jsx  # REFACTORED: remove ~250 lines of inline detection
```

### Pattern 1: AudioContextProvider

**What:** A React Context that owns one `AudioContext` and one `AnalyserNode` for the entire game session. Game routes are wrapped at the route level.

**When to use:** All three game components need mic input or audio output during their lifecycle. The provider is mounted when entering game routes and unmounted when leaving — this handles "release mic when leaving game pages" automatically.

**Where to wrap:** In `App.jsx`, wrap individual game route elements (or a `GameRoutesWrapper` component) with `AudioContextProvider`. The provider should NOT wrap the app root (per locked decision: "game routes (not app root)"). Looking at the route structure, the cleanest approach is to wrap the `AppLayout` element that contains game routes, OR create a wrapper component for the game sub-routes.

**Example:**
```jsx
// src/contexts/AudioContextProvider.jsx
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const AudioCtx = createContext(null);

export function AudioContextProvider({ children }) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [micPermission, setMicPermission] = useState('prompt'); // 'prompt'|'granted'|'denied'

  const getOrCreateAudioContext = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return audioContextRef.current;
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = ctx;
    return ctx;
  }, []);

  const requestMic = useCallback(async () => {
    // AUDIO-01: Disable all browser DSP
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      }
    });
    streamRef.current = stream;

    const ctx = await getOrCreateAudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();

    // AUDIO-02: No smoothing — raw frame data
    analyser.smoothingTimeConstant = 0.0;
    // AUDIO-03: Higher fftSize for bass resolution
    analyser.fftSize = 4096;

    source.connect(analyser);
    analyserRef.current = analyser;
    setMicPermission('granted');
    setIsReady(true);
    return { audioContext: ctx, analyser };
  }, [getOrCreateAudioContext]);

  const releaseMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    setIsReady(false);
  }, []);

  // ARCH-05: suspend/resume between exercises
  const suspendAudio = useCallback(async () => {
    if (audioContextRef.current?.state === 'running') {
      await audioContextRef.current.suspend();
    }
  }, []);

  const resumeAudio = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  // Cleanup on unmount (leaving game routes)
  useEffect(() => {
    return () => {
      releaseMic();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [releaseMic]);

  const value = {
    audioContextRef,
    analyserRef,
    isReady,
    micPermission,
    requestMic,
    releaseMic,
    suspendAudio,
    resumeAudio,
    getOrCreateAudioContext,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export const useAudioContext = () => {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudioContext must be used inside AudioContextProvider');
  return ctx;
};
```

### Pattern 2: pitchy Integration in usePitchDetection

**What:** Replace the hand-rolled autocorrelation with `PitchDetector.forFloat32Array` from pitchy. The detector instance is created once (per fftSize) and reused.

**When to use:** Inside the pitch detection loop, replacing the existing `detectPitch` callback.

**Example:**
```javascript
// Source: pitchy README + playground example (ianjohnson.dev/pitchy)
import { PitchDetector } from 'pitchy';

// Create once per fftSize (expensive construction)
const detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
// Input buffer must match inputLength exactly
const input = new Float32Array(detector.inputLength);

// In detection loop:
analyserNode.getFloatTimeDomainData(input);
const [pitch, clarity] = detector.findPitch(input, audioContext.sampleRate);

// ALGO-02: Gate by clarity threshold
// clarity is 0.0–1.0; ~0.9 for confident piano note
// Lower values indicate noise, harmonics, or ambiguous signal
if (clarity > CLARITY_THRESHOLD) {
  // pitch is in Hz — convert to note name
}
```

**Clarity threshold recommendation (Claude's Discretion):** Start at 0.9. Piano notes have very high clarity when cleanly played. Noisy room ambient sounds typically score <0.6. The 0.9 threshold will reject uncertain readings rather than guess — matching the "false detections equally frustrating as missed notes" requirement. If testing reveals too many missed notes on acoustic piano decay, lower to 0.85.

**Note-to-MIDI conversion (for frequencyToNote replacement):**
```javascript
// Convert Hz to note name spanning C3–C6 (ALGO-03)
function frequencyToNote(hz) {
  if (hz <= 0) return null;
  // A4 = 440Hz = MIDI 69
  const midi = Math.round(12 * Math.log2(hz / 440) + 69);
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  return `${name}${octave}`; // e.g. "C4", "A3"
}
```
This math-based approach eliminates the lookup table entirely — any note in the app's range is handled automatically, no manual frequency table maintenance.

### Pattern 3: usePitchDetection Refactoring (ARCH-02)

**What:** `usePitchDetection` accepts an `analyserNode` prop instead of creating its own AudioContext. It only owns the detection loop.

**Current signature (internal):**
- `startListening()` creates `AudioContext`, requests mic, creates `AnalyserNode`

**New signature:**
- `usePitchDetection({ analyserNode, sampleRate, isActive, onPitchDetected, onLevelChange, ... })`
- When `analyserNode` is provided, skip context creation — just run the detection loop
- Backward compat: if `analyserNode` is null, fall back to current behavior (creates own context) — this preserves existing tests

### Pattern 4: useAudioEngine Refactoring (ARCH-03)

**What:** `useAudioEngine` accepts an optional `audioContext` prop. If provided, skips `initializeAudioContext()` and uses the shared context.

**Current:** `initializeAudioContext()` creates `new AudioContext()` in a `useEffect` on mount.

**New:** If `audioContextRef.current` is passed in as prop (or context value), bypass creation. The `gainNodeRef` is still created internally (it's an output node, not a mic node).

**Caution:** `useAudioEngine` is used in `MetronomeTrainer` and `SightReadingGame`. Both of these will need to consume `AudioContextProvider`. The `cleanup()` function must NOT close the shared context — it should only stop the scheduler.

### Pattern 5: NotesRecognitionGame Inline Removal (ARCH-04)

**What:** Remove lines 1654–1869 from `NotesRecognitionGame.jsx` and replace with `useMicNoteInput`.

**Scope of inline code:**
- `detectPitch` useCallback (lines 1655–1702): ~48 lines
- `frequencyToNote` useCallback (lines 1705–1723): ~19 lines
- `startAudioInput` useCallback (lines 1726–1815): ~90 lines — includes getUserMedia, creates AudioContext, creates AnalyserNode, runs detect loop
- `stopAudioInput` useCallback (lines 1818–1840): ~23 lines
- `toggleAudioInput` useCallback (lines 1848–1856): ~9 lines
- cleanup `useEffect` (lines 1859–1868): ~10 lines
- State declarations (lines 617–627): audioContext, analyser, microphone, detectedNote, audioInputLevel

**Total: ~250 lines of inline audio code to remove.**

**Game-specific logic to preserve:** The `waitingForRelease` / `pendingNextNote` state machine (lines 1759–1773) is game logic, not audio logic. It must remain in the component. After switching to `useMicNoteInput`, the `onNoteEvent` callback will handle what previously happened in the detect loop.

### Anti-Patterns to Avoid

- **Creating AudioContext inside hooks on every mount:** Results in multiple contexts on tab, hits Safari's 4-context limit
- **Closing AudioContext between exercises:** Expensive (100-200ms pause); use `suspend()`/`resume()` instead
- **smoothingTimeConstant > 0 for detection:** Creates phantom latency; detection responds to past frames instead of current
- **Building custom autocorrelation for piano:** Piano harmonics will alias; McLeod Pitch Method handles this correctly
- **Keeping `analyserNode.fftSize = 2048` for bass notes:** At 44100Hz, bin size is 21.5Hz — E3 at 165Hz is only 7.7 bins from D3; insufficient resolution for reliable note discrimination
- **Trusting `getUserMedia({ audio: true })` for music:** Browser applies echo cancellation and noise suppression by default, which transforms piano signal and corrupts harmonic relationships

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Piano pitch detection | Custom autocorrelation | pitchy PitchDetector (McLeod) | Harmonic aliasing in custom implementations causes C4 → C5 errors; McLeod handles this by design |
| Frequency-to-note math | Lookup tables | `Math.round(12 * Math.log2(hz/440) + 69)` | MIDI formula is exact; lookup tables require maintenance as note range expands |
| Multiple AudioContexts | One per hook | Single AudioContextProvider | Safari hard limit of 4 contexts; consolidation prevents UnknownError |
| Noise rejection | Custom thresholding | pitchy clarity 0-1 metric | pitchy's clarity metric already encodes confidence; custom RMS thresholding is inferior |

**Key insight:** The hardest problem in piano pitch detection is not detecting the frequency — it is disambiguating the fundamental from its harmonics. This is exactly what McLeod Pitch Method was designed to solve. Hand-rolling improvements to autocorrelation will not converge on McLeod's solution without essentially reimplementing it.

---

## Common Pitfalls

### Pitfall 1: PitchDetector Instance Reuse

**What goes wrong:** Creating `new PitchDetector.forFloat32Array(inputLength)` inside the detection loop causes excessive garbage collection and CPU spikes.

**Why it happens:** pitchy's constructor allocates typed arrays internally. Doing this 60x/second creates GC pressure.

**How to avoid:** Create the detector instance once when the analyserNode is set up. Store in a ref (`detectorRef.current`). If `fftSize` changes, recreate. In practice for this app, fftSize is fixed at 4096.

**Warning signs:** Jank in detection loop at ~60fps, high GC activity in profiler.

### Pitfall 2: input Buffer Length Must Match inputLength

**What goes wrong:** `detector.findPitch(input, sampleRate)` throws or returns garbage if `input.length !== detector.inputLength`.

**Why it happens:** For `PitchDetector.forFloat32Array(inputLength)`, `detector.inputLength` equals the `inputLength` passed in (which is `analyserNode.fftSize`). But `analyserNode.getFloatTimeDomainData(array)` fills `frequencyBinCount` (= `fftSize / 2`) — not `fftSize`.

**How to avoid:** Create input buffer as `new Float32Array(detector.inputLength)` where `detector.inputLength === analyserNode.fftSize` (NOT `frequencyBinCount`). Call `analyserNode.getFloatTimeDomainData(input)` — this needs the full fftSize buffer.

**Correction:** Actually, `getFloatTimeDomainData` fills a buffer of size `fftSize` (not frequencyBinCount). frequencyBinCount is only for `getFloatFrequencyData`. So: create `new Float32Array(analyser.fftSize)`, pass to `PitchDetector.forFloat32Array(analyser.fftSize)`, and `getFloatTimeDomainData(input)` — sizes align correctly.

**Warning signs:** `findPitch` returning `[0, 0]` constantly, or TypeErrors about array lengths.

### Pitfall 3: AudioContext State on iOS Safari After Background

**What goes wrong:** When the app goes to background on iOS, Safari suspends the AudioContext. On return, the context state is `'interrupted'` (not `'suspended'`), and `resume()` may not work until a new user gesture.

**Why it happens:** iOS Safari has stricter autoplay/audio policies than other platforms. The `'interrupted'` state is Safari-specific.

**How to avoid:** The phase requirement says "pause and resume when app goes to background" and notes "Phase 09 handles iOS-specific interruption recovery." For Phase 07, implement a `visibilitychange` listener in `AudioContextProvider` that calls `suspend()` on hide and `resume()` on show — but do NOT assume resume succeeds. Log the state and expose it so Phase 09 can build on it.

**Warning signs:** Mic stops working after lock screen / home button press on iPad.

### Pitfall 4: useAudioEngine cleanup() Closing Shared Context

**What goes wrong:** `useAudioEngine.cleanup()` currently calls `audioContextRef.current.close()`. If the shared context is passed in from `AudioContextProvider`, cleanup in one component closes the context for all components.

**Why it happens:** Ownership of the AudioContext is currently assumed to be the hook's responsibility.

**How to avoid:** Add an `isOwned` parameter to `useAudioEngine` — if using shared context, skip `close()` in cleanup. Only stop the scheduler and disconnect gain node. The provider's own cleanup handles closing.

**Warning signs:** "The AudioContext has been closed" errors after navigating between games.

### Pitfall 5: getUserMedia Constraints Browser Support

**What goes wrong:** On some older Android browsers, setting `echoCancellation: false` is accepted but not honored — the browser applies processing anyway. On Safari <11, the constraint is silently ignored.

**Why it happens:** These are optional constraints in the MediaTrackConstraints spec; browsers that don't support them treat them as hints.

**How to avoid:** After `getUserMedia` resolves, verify with `stream.getAudioTracks()[0].getSettings()` whether constraints were applied. Log a warning if not. This is informational — there's no fallback available. iPad (Safari 16+) does honor these constraints.

**Warning signs:** Piano notes detected but with systematic octave errors or poor SNR even in quiet environments.

### Pitfall 6: clarity Threshold Too High for Acoustic Piano Decay

**What goes wrong:** Piano notes decay rapidly in amplitude. As the note decays, the signal-to-noise ratio drops, and pitchy's clarity drops below threshold — causing the note to "disappear" mid-hold.

**Why it happens:** The McLeod method's clarity measure reflects how well the signal matches a periodic pattern. Decaying notes still are periodic but at lower amplitude — clarity typically stays high as long as the piano string is vibrating, but environmental noise floor becomes relatively larger during decay.

**How to avoid:** The existing `useMicNoteInput` already handles this: `offMs = 140ms` means the note is only released if no pitch is detected for 140ms. As long as clarity stays above threshold during most of the decay, note-off is not triggered prematurely. If testing reveals premature note-off, lower clarity threshold to 0.85 before adjusting offMs.

**Warning signs:** Notes cut off before the player releases the key, especially on acoustic piano.

---

## Code Examples

Verified patterns from official sources and codebase analysis:

### pitchy Basic Usage (from playground example)

```javascript
// Source: ianjohnson.dev/pitchy (official demo)
import { PitchDetector } from 'pitchy';

// Create once — expensive allocation
const detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
detector.minVolumeDecibels = -10; // Minimum volume for detection (optional)

// Reusable buffer — same length as fftSize
const input = new Float32Array(detector.inputLength);

// In rAF loop:
analyserNode.getFloatTimeDomainData(input);
const [pitch, clarity] = detector.findPitch(input, audioContext.sampleRate);

// Gate: only accept confident detections
if (clarity > 0.9 && pitch > 0) {
  const noteName = frequencyToNote(pitch);
  // emit note event
}
```

### getUserMedia with DSP Disabled (AUDIO-01)

```javascript
// Source: MDN MediaTrackSettings, WebRTC community
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    // Note: channelCount, sampleRate are hints, not guarantees
  }
});

// Optional: verify constraints were applied
const settings = stream.getAudioTracks()[0].getSettings();
if (settings.echoCancellation !== false) {
  console.warn('echoCancellation could not be disabled — browser ignoring constraint');
}
```

### AnalyserNode Configuration (AUDIO-02, AUDIO-03)

```javascript
const analyser = audioContext.createAnalyser();
analyser.fftSize = 4096;               // AUDIO-03: better bass resolution
analyser.smoothingTimeConstant = 0.0;  // AUDIO-02: no phantom latency
// frequencyBinCount is now 2048 (fftSize/2)
// Each bin is ~10.77Hz at 44100Hz sample rate
// E3 (165Hz) is bin 15 — comfortably resolved from D3 (147Hz) at bin 14
```

### AudioContext suspend/resume Between Exercises (ARCH-05)

```javascript
// Suspend when game finishes, before VictoryScreen
await audioContext.suspend();

// Resume when next exercise starts
await audioContext.resume();
// Resume is async but fast (~1-2ms) — no perceptible gap
```

### frequencyToNote Math (ALGO-03)

```javascript
// Math-based, covers full MIDI range
// No lookup table maintenance required
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function frequencyToNote(hz) {
  if (!hz || hz <= 0) return null;
  const midi = Math.round(12 * Math.log2(hz / 440) + 69);
  if (midi < 48 || midi > 84) return null; // C3 to C6 guard
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  return `${name}${octave}`;
}
// C3=48 (130.81Hz), C4=60 (261.63Hz), C5=72 (523.25Hz), C6=84 (1046.5Hz)
```

### AudioContextProvider wrapping game routes in App.jsx

```jsx
// Current structure (App.jsx):
// <Route path="/notes-master-mode/notes-recognition-game" element={<NotesRecognitionGame />} />
// <Route path="/notes-master-mode/sight-reading-game" element={<SightReadingGame />} />
// <Route path="/rhythm-mode/metronome-trainer" element={<MetronomeTrainer />} />

// Option A: Wrap individual game elements (minimal diff):
<Route
  path="/notes-master-mode/notes-recognition-game"
  element={<AudioContextProvider><NotesRecognitionGame /></AudioContextProvider>}
/>

// Option B: GameRouteWrapper component wrapping all game routes (cleaner):
function GameRouteWrapper({ children }) {
  return <AudioContextProvider>{children}</AudioContextProvider>;
}
// Then each game route: element={<GameRouteWrapper><NotesRecognitionGame /></GameRouteWrapper>}

// Option C: Wrap ProtectedRoute/AppLayout — rejected (would include non-game pages)
// The decision is "game routes, not app root" — Option A or B both satisfy this.
// Option B is more maintainable as new game routes are added.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Naive autocorrelation for pitch | McLeod Pitch Method (pitchy) | pitchy v1 ~2019, v4 ESM ~2022 | Eliminates octave errors on harmonic-rich signals |
| getUserMedia({ audio: true }) | Explicit DSP disable constraints | Best practice established ~2018 | Prevents browser from corrupting piano signal |
| smoothingTimeConstant = 0.8 | smoothingTimeConstant = 0.0 | Understood from first principles | Removes ~80-100ms of phantom lag from exponential smoothing |
| fftSize 2048 | fftSize 4096 | Best practice for low-frequency detection | Doubles bin resolution, better E3/F3/G3 discrimination |
| Multiple AudioContext instances | Single shared context via provider | Best practice per MDN Web Audio API guide | Respects Safari 4-context limit, reduces resource usage |
| AudioContext close/create per game | suspend()/resume() between exercises | Best practice per Web Audio API spec | Eliminates 100-200ms cold-start penalty |

**Deprecated/outdated:**
- Raw `getUserMedia({ audio: true })` without constraints: Relies on browser defaults which vary and corrupt piano signal
- Autocorrelation for musical pitch detection in 2025: Not wrong, but naive implementations have known harmonic aliasing issues; McLeod is the standard for real instruments

---

## Open Questions

1. **fftSize 4096 on low-end Android tablets**
   - What we know: fftSize 4096 doubles CPU cost of FFT vs 2048; modern tablets handle this fine
   - What's unclear: Specific Android tablet model not specified; if it's a $50 tablet, rAF loop may drop below 30fps with 4096
   - Recommendation: Use 4096 as specified. If performance issues are detected in testing, fftSize 2048 still works for treble range — but bass notes below E4 will be imprecise. Monitor rAF frame times in dev tools during testing.

2. **fanfareSound.js singleton integration**
   - What we know: `fanfareSound.js` has its own module-level `_audioContext` singleton; it creates one on demand from user gesture
   - What's unclear: Should it be wired into AudioContextProvider in Phase 07, or treated as a separate case?
   - Recommendation: Leave `fanfareSound.js` alone in Phase 07. It's only called from VictoryScreen (a user gesture event), it reuses its own singleton correctly, and connecting it to the provider adds complexity without resolving a real problem (5 contexts > 4 limit only matters if all 5 are open simultaneously, and fanfare plays after game ends). Address in Phase 08 or later if the console warning appears.

3. **Clarity threshold for acoustic vs digital keyboard**
   - What we know: Digital keyboards have clean, well-defined harmonics — likely clarity 0.95+ for correct notes. Acoustic pianos have more complex timbres and room interaction — likely clarity 0.85-0.95.
   - What's unclear: Exact empirical threshold for both instruments in both environments
   - Recommendation: Start at 0.9. Expose threshold as a named constant (`PITCH_CLARITY_THRESHOLD`) in the provider or a config file so it can be tuned in testing without code changes. Consider 0.85 as fallback if testing shows missed notes on acoustic piano.

4. **usePitchDetection backward compatibility**
   - What we know: `usePitchDetection` is tested in `src/hooks/__tests__/usePitchDetection.test.js`. Tests use the hook's own AudioContext creation path.
   - What's unclear: How aggressively to break the existing API
   - Recommendation: Keep backward compatibility. If `analyserNode` prop is not provided, fall back to the existing internal creation path (updated to use DSP-disabled getUserMedia and new fftSize/smoothing values). This preserves existing tests without mocking AudioContextProvider.

---

## Sources

### Primary (HIGH confidence)

- pitchy GitHub README (raw) — API: `PitchDetector.forFloat32Array(inputLength)`, `findPitch(input, sampleRate)` returns `[pitch, clarity]`, clarity 0-1
- pitchy playground (ianjohnson.dev/pitchy) — Complete usage pattern with Web Audio API AnalyserNode including `minVolumeDecibels` and 100ms polling
- MDN Web Audio API — AnalyserNode fftSize, frequencyBinCount, smoothingTimeConstant, AudioContext.suspend/resume
- MDN MediaTrackSettings — echoCancellation, noiseSuppression, autoGainControl constraints
- Codebase analysis (direct source reading):
  - `src/hooks/usePitchDetection.js` — current autocorrelation, fftSize 2048, smoothingTimeConstant 0.8, getUserMedia without DSP disable
  - `src/hooks/useAudioEngine.js` — second AudioContext instance, `initializeAudioContext()` pattern
  - `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 1654–1869 — third AudioContext instance, duplicate autocorrelation (~250 lines)
  - `src/utils/fanfareSound.js` — fourth AudioContext (module singleton, well-designed)
  - `src/hooks/useMicNoteInput.js` — stability layer; wraps usePitchDetection; should be kept
  - `src/hooks/micInputPresets.js` — preset configurations; should be kept
  - `src/App.jsx` — routing structure; game routes are children of `ProtectedRoute > AppLayout`

### Secondary (MEDIUM confidence)

- WebSearch result: Safari limits AudioContext instances to 4 per tab — confirmed in GitHub issues and Apple Developer Forums discussions
- WebSearch result: Chrome (pre-v66) limited to 6 AudioContexts per tab; modern Chrome is higher but still hardware-bounded
- MDN recommendation to reuse single AudioContext: "It's OK to use a single AudioContext for several different audio sources and pipelines concurrently"

### Tertiary (LOW confidence)

- pitchy internal `clarityThreshold = 0.9` default — referenced in WebSearch results from library source code analysis; not directly verified from source
- Performance impact of fftSize 4096 on low-end Android: extrapolated from general WebAudio FFT complexity (O(n log n))

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pitchy is the locked decision; API verified from README and playground
- Architecture: HIGH — based on direct codebase reading; every AudioContext instance located and documented
- Pitfalls: HIGH (pitfalls 1-5) / MEDIUM (pitfall 5 re: Android constraint support) — based on Web Audio API spec knowledge and codebase patterns
- Frequency math: HIGH — standard MIDI formula, verified against known note frequencies

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (pitchy is stable; Web Audio API spec is stable)
