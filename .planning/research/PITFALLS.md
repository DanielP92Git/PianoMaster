# Pitfalls Research: Mic Pitch Detection Overhaul

**Domain:** Refactoring browser-based piano pitch detection in an existing PWA
**Researched:** 2026-02-17
**Confidence:** HIGH (current codebase reviewed + official WebKit bugs + Web Audio API spec + algorithm research)

---

## Context

This research covers common mistakes when **replacing or improving** the existing `usePitchDetection` / `useMicNoteInput` hook stack in a React 18 PWA targeting iOS Safari (installed PWA), Android Chrome (installed PWA), and desktop browsers. The app serves 8-year-old learners; user experience failures (missed notes, wrong notes, latency) directly cause children to disengage and blame themselves.

The current implementation uses:
- Naive autocorrelation in `usePitchDetection.js` (`fftSize: 2048`, `smoothingTimeConstant: 0.8`)
- Frame-stability layer in `useMicNoteInput.js` (`onFrames: 4-5`, `offMs: 140ms`)
- `requestAnimationFrame` loop on the main thread
- `AudioContext` created fresh on every `startListening()` call
- There is already one failing test: `SightReadingGame.micRestart.test.jsx` (mic-flag-not-reset regression)

---

## Critical Pitfalls

### Pitfall 1: Autocorrelation Octave Errors on Piano

**What goes wrong:**
The autocorrelation algorithm in `usePitchDetection.js` detects the wrong octave — typically one octave too high (2x the true frequency) or, less commonly, one octave too low. A child plays C4 (261 Hz) and the game reports C5 (523 Hz). This is the single most common cause of "wrong note" errors on piano.

**Why it happens:**
Piano tones have strong harmonic partials. When the 2nd harmonic (overtone at 2x fundamental) dominates the signal — which happens during the attack phase and for higher registers — the autocorrelation function finds the 2nd harmonic's period first and reports double the real frequency. The current implementation uses `GOOD_ENOUGH_CORRELATION = 0.9` with a first-peak-wins strategy, making it highly susceptible to sub-harmonic selection errors. This is a known 4% average error rate even in better algorithms (McLeod MPM, SNAC), and naive autocorrelation is significantly worse.

**Consequences:**
- Child plays C4, game marks it wrong (detected as C5)
- Child gets frustrated; thinks they played incorrectly
- Problem is worse for notes with bright attack (C, G, high register notes)
- The 5% frequency tolerance (`tolerance: 0.05`) was likely widened to compensate, causing cross-note false positives

**Prevention:**
Replace naive autocorrelation with the YIN algorithm or McLeod Pitch Method (MPM). Both add:
1. Difference function instead of similarity correlation (reduces harmonic confusion)
2. Cumulative mean normalization (eliminates the "first peak wins" problem)
3. Parabolic interpolation (sub-sample accuracy without a bigger FFT)

Validated JS implementations: `pitchfinder` npm package (includes YIN, MPM); `pitchy` npm package (MPM only, zero dependencies, ~2KB). Do NOT write YIN from scratch — the normalization step is subtle and commonly implemented incorrectly.

**Warning signs:**
- Child hits "wrong note" on the first beat of a note (attack phase), but not during sustain
- Errors cluster on C, E, G (bright harmonic content)
- Detected frequency is always approximately 2x or 0.5x the expected frequency

**Phase to address:** Phase 1 (Algorithm Replacement)

---

### Pitfall 2: AudioContext Created on Every startListening() Call

**What goes wrong:**
The current `startListening()` creates a new `AudioContext` and a new `MediaStreamSource` on every call. If the game is restarted (Try Again flow), a new AudioContext is created while the previous one may not be fully closed yet. This causes:
- Orphaned AudioContext instances competing for mic resources
- "AudioContext limit exceeded" errors on some browsers (Chrome has a hard limit of 6 concurrent AudioContext instances)
- Memory pressure that causes audio glitches mid-session
- The existing failing test (`micRestart.test.jsx`) directly tests this regression

**Why it happens:**
`audioContext.close()` is asynchronous. The current `stopListening()` calls `close().catch(...)` but then immediately sets `audioContext` state to null. If `startListening()` is called before close completes, two contexts coexist. React state batching makes this worse — state transitions during re-renders can cause double-invocations of the start/stop cycle.

**Consequences:**
- Mic input works on first game start, fails silently on restart
- Chrome DevTools shows "AudioContext was not allowed to start" warnings
- Memory grows across game sessions — important on low-end tablets used by children

**Prevention:**
1. Create one `AudioContext` per component mount (in a ref, not state), reuse across start/stop cycles
2. Use `context.suspend()` / `context.resume()` instead of close/create when pausing between exercises
3. Only `context.close()` on component unmount
4. Use a ref guard: `if (audioContextRef.current && audioContextRef.current.state !== 'closed') { await audioContextRef.current.close(); }`
5. Add a lifecycle state machine: `idle → acquiring → running → suspended → idle` to prevent concurrent starts

**Warning signs:**
- Console shows "AudioContext limit exceeded" or "The AudioContext was not allowed to start"
- `startListening` called twice in rapid succession (React Strict Mode double-invokes effects)
- Memory grows visibly in DevTools Memory tab across game restarts

**Phase to address:** Phase 1 (AudioContext Lifecycle) — this is the current bug

---

### Pitfall 3: iOS Safari AudioContext "interrupted" State Not Handled

**What goes wrong:**
On iOS, the AudioContext enters an `"interrupted"` state (not just `"suspended"`) when:
- The user receives a phone call
- The user switches apps
- The device is locked
- A system alert appears (permission dialog, etc.)

The current code only checks for `"suspended"` and handles it with `resume()`. The `"interrupted"` state requires a different recovery strategy — the MediaStream itself is killed by iOS and must be re-acquired via `getUserMedia` again. Simply calling `resume()` on an interrupted context does not restore mic input.

**Why it happens:**
iOS Safari treats audio interruptions as a separate state from suspension. A WebKit bug (237878) confirms that AudioContext is suspended when backgrounded "even though AudioContext is not used directly for playing audio." The spec addition of the `"interrupted"` state was a late addition and many tutorials predate it. Additionally, iOS Safari PWA installed mode has different behavior from browser tab mode — mic permissions do not persist the same way.

**Consequences:**
- Child switches to Messages app mid-lesson, returns — game appears to run but no mic input is detected
- Audio level meter shows 0 even though `isListening: true` in state
- No error is thrown; the game silently accepts no input and the child thinks they're playing wrong

**Prevention:**
```javascript
// Listen for the specific interrupted state
audioContext.addEventListener('statechange', async () => {
  if (audioContext.state === 'interrupted') {
    // On iOS: the stream is dead. Must stop, re-acquire, and restart.
    await fullMicRestart(); // stop tracks, close context, re-getUserMedia
  } else if (audioContext.state === 'suspended') {
    // On others: just resume
    await audioContext.resume();
  }
});

// Also handle visibilitychange for page background/foreground
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && isListening) {
    verifyMicStreamIsAlive(); // Check track.readyState !== 'ended'
  }
});
```

Always verify `track.readyState === 'live'` after returning from background before trusting `isListening` state.

**Warning signs:**
- Mic appears active (isListening: true) but audioLevel stays at 0 after screen unlock
- Only happens on iOS, not Android or desktop
- Issue begins after iOS interruption events (calls, alerts)

**Phase to address:** Phase 2 (Cross-Browser Hardening)

---

### Pitfall 4: iOS Safari Requires User Gesture to Create/Resume AudioContext — Every Time

**What goes wrong:**
iOS Safari requires that `AudioContext.resume()` (or creation) be called in the synchronous stack frame of a user gesture (tap, click). If the code creates the AudioContext in a `useEffect`, a Promise chain, or any async path that does not trace back to a user gesture event handler, Safari silently keeps the context in `"suspended"` state. The context shows `state: "suspended"` with no error thrown.

**Why it happens:**
This is a longstanding Safari security restriction (WebKit bug #790 from 2015, still enforced). Safari's gesture detector uses a strict call stack check — even a single `await` between the user event and the `resume()` call can break the gesture association. The current `startListening()` is `async` and does `await navigator.mediaDevices.getUserMedia(...)` before creating the context — this works because `getUserMedia` itself is a user gesture trigger on most platforms, but iOS handles it differently in PWA standalone mode.

**Consequences:**
- AudioContext is created, `state: "suspended"`, but no error is thrown
- `detectLoop()` runs but `analyserNode.getFloatTimeDomainData()` returns all zeros
- Detected frequency is always -1; the game accepts no input and looks broken
- Works perfectly on Chrome/Android/desktop; only fails on iOS Safari

**Prevention:**
1. Wire the `startListening()` call directly to an `onClick` handler — never via `useEffect`
2. Call `audioContext.resume()` synchronously at the start of the gesture handler, before any `await`:
   ```javascript
   const handleStartGame = async () => {
     // Synchronous resume FIRST (while still in gesture stack)
     if (audioContextRef.current?.state === 'suspended') {
       audioContextRef.current.resume(); // No await here
     }
     // Then do async work
     await startListening();
   };
   ```
3. Add an explicit "warm-up" touch event on first app load to unlock the AudioContext early
4. Test specifically with iOS Safari in standalone PWA mode (installed to home screen), not just in Safari tab

**Warning signs:**
- Works in Chrome, breaks in iOS Safari
- `audioContext.state` is always `"suspended"` after creation
- `audioLevel` stays at 0 even when mic permission is granted
- No `NotAllowedError` thrown (context is created, just not running)

**Phase to address:** Phase 2 (Cross-Browser Hardening)

---

### Pitfall 5: requestAnimationFrame Loop Ties Pitch Detection to Frame Rate and Main Thread

**What goes wrong:**
The current `detectLoop()` uses `requestAnimationFrame` to run the autocorrelation algorithm. This means:
- Detection rate drops from 60Hz to ~30Hz when the browser throttles rAF (background tab, low-power mode, frame budget exceeded)
- The autocorrelation loop runs on the main thread — it blocks React rendering during the ~1ms computation
- On slow mobile devices, frame budget pressure from VexFlow SVG rendering and pitch detection compete, causing both to glitch

**Why it happens:**
`requestAnimationFrame` is tied to display refresh rate and browser rendering budget. It is intentionally throttled by browsers in background tabs and on battery-saver mode. It was the right choice for visual animations; it is the wrong choice for continuous audio analysis.

**Consequences:**
- On iPhone SE (low-end device), eighth notes at 120 BPM (250ms each) are missed because detection rate drops to 15Hz (66ms per frame) — not enough samples to stably confirm a short note
- When the child changes the music sheet display (React re-render), pitch detection stutters
- Audio glitches from main thread congestion cause false `noteOff` events (silence detected mid-note)

**Prevention:**
Move pitch detection off the main thread. Two options:
1. **AudioWorklet** (preferred): Process audio in the dedicated audio rendering thread at 128-frame quanta. The worklet thread is never throttled and has no GC pressure from main thread work.
2. **Web Worker + SharedArrayBuffer**: Run the algorithm in a Worker, share a ring buffer with the audio graph. More complex but supported on all browsers with COOP/COEP headers.

For this app's complexity level and cross-browser needs, AudioWorklet with a main-thread message fallback is the right call. Keep the existing rAF loop as the fallback for browsers without AudioWorklet support.

**Warning signs:**
- Audio level shows activity but notes are missed during heavy UI interactions
- Frame timing logs show >16ms gaps in the detection loop
- Problem is worse when VexFlow is re-rendering (note changes, beat markers)

**Phase to address:** Phase 3 (Performance Hardening — later phase)

---

### Pitfall 6: AudioWorklet Has a 128-Frame Fixed Buffer — Not 2048

**What goes wrong:**
Developers who migrate from `AnalyserNode` (which supports configurable `fftSize: 2048`) to `AudioWorklet` expect to control buffer size. AudioWorklet processes audio in fixed 128-sample render quanta. At 44100 Hz, that is 2.9ms per processing call. Running YIN or autocorrelation on 128 samples only gives frequency resolution down to ~344 Hz — far too coarse to detect piano notes below E4 (329 Hz). C3 (130 Hz) is completely invisible.

**Why it happens:**
The AudioWorklet spec intentionally fixes the quantum at 128 frames for low latency. Developers assume they can set it like `fftSize` on AnalyserNode. The solution is to accumulate frames into a ring buffer (circular buffer) within the AudioWorklet processor until enough samples are available for the detection window.

**Consequences:**
- Notes below E4 are never detected
- Bass clef exercises (C3-B3) are completely broken
- Developers assume the algorithm is broken; the real problem is buffer accumulation

**Prevention:**
Use a ring buffer pattern in the AudioWorklet processor:
```javascript
// In AudioWorkletProcessor
class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(2048); // accumulate 2048 samples
    this._bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0][0]; // mono channel
    if (!input) return true;

    // Accumulate into ring buffer
    for (let i = 0; i < input.length; i++) {
      this._buffer[this._bufferIndex++] = input[i];
      if (this._bufferIndex >= 2048) {
        this.port.postMessage({ buffer: this._buffer.slice() });
        this._bufferIndex = 0;
      }
    }
    return true;
  }
}
```
This introduces 2048/44100 = 46ms of latency from buffering, which is acceptable for note detection (not real-time synthesis).

**Warning signs:**
- Low notes (below E4) are never detected regardless of tuning
- Problem disappears when falling back to AnalyserNode-based approach
- Only manifests after migrating to AudioWorklet

**Phase to address:** Phase 3 (AudioWorklet Migration)

---

### Pitfall 7: Piano Attack Transient Causes Pitch Detection to Fire on Key Release Noise

**What goes wrong:**
When a piano key is released, the key mechanism produces a percussive "thud" sound at 200-400 Hz — the same frequency range as low piano notes. The `rmsThreshold` that is set to pass the note attack also passes the key-release noise. The detector fires a false `noteOn` event for the key release, causing the next expected note to be pre-consumed.

**Why it happens:**
The key release noise has a very short duration (~30ms) and broadband frequency content, but its fundamental happens to fall in the piano note range. The current `onFrames: 4` stability requirement (at 60fps = 66ms) is supposed to filter this, but during rAF throttling or when the release noise is clean, it can survive the stability window.

**Consequences:**
- Child releases a held note; the game registers a phantom note-on for the next note
- Sequential note exercises get out of sync by one note
- Problem is worse with acoustic pianos (louder key mechanisms) than digital piano keyboards

**Prevention:**
1. Require minimum note duration: reject `noteOn` events for candidates that resolve in under 50ms (key release noise rarely sustains)
2. Track energy decay: if RMS drops from detection peak to below threshold in under 40ms, classify as transient noise, not a note
3. For the `offMs` timing: 140ms is appropriate for the note sustain, but add a "holdout" after `noteOff` of 80ms before allowing the next `noteOn` — this gaps the key-release noise from counting as the next note
4. Increase `onFrames` to 6-8 for note-recognition (less time-critical) games while keeping 4 for sight-reading

**Warning signs:**
- "Double fires" where one keypress produces two game events
- Errors cluster at the end of held notes rather than during the note
- Problem worse with acoustic piano, better with digital keyboard

**Phase to address:** Phase 1 (Detection Logic Hardening)

---

### Pitfall 8: Mic Permission Denied Silently Fails on iOS PWA Re-Launch

**What goes wrong:**
On iOS Safari (PWA standalone mode), if the user denies microphone permission, the app receives `NotAllowedError`. On subsequent launches of the PWA, iOS does not re-prompt — it silently denies. The current `startListening()` catches the error, sets `isListening: false`, and rethrows. There is no persistent UI state to tell the child "microphone access is disabled in Settings." The game appears to start (the "Start Playing" button works) but produces no detections.

**Why it happens:**
iOS Safari does not have a browser-level permission management UI like Chrome. Permission revocation requires the user to navigate to Settings > Safari > Websites > Microphone. Children cannot do this themselves, and parents do not know to look. Additionally, unlike Chrome where `navigator.permissions.query({ name: 'microphone' })` returns the current state, iOS Safari's Permissions API has limited support.

**Consequences:**
- Child taps "Start Playing" — nothing happens — assumes they're playing wrong
- Teacher cannot remotely diagnose the issue
- The COPPA-compliant scenario: parent installs the PWA, denies mic on first launch, comes back days later — permission is permanently denied with no UI indication

**Prevention:**
1. On every `startListening()` call, check permission state BEFORE attempting to open the stream:
   ```javascript
   // Try permission query (Chrome/Android); fall back to attempt-and-catch (iOS)
   const checkMicPermission = async () => {
     try {
       const status = await navigator.permissions.query({ name: 'microphone' });
       return status.state; // 'granted', 'denied', 'prompt'
     } catch {
       return 'unknown'; // iOS does not support this query
     }
   };
   ```
2. If a `NotAllowedError` is caught, show a persistent, parent-readable message with instructions for enabling mic in iOS Settings — not just a toast
3. Store permission state in localStorage; if denied, show the instructions banner before attempting `getUserMedia` again
4. Never silently swallow the error; at minimum log and update a `permissionState` ref

**Warning signs:**
- `startListening` is called, `isListening` stays false, no console error visible to user
- Regression: the error is caught but no user-visible state change occurs
- iOS-only issue; Chrome shows a permission re-request dialog

**Phase to address:** Phase 1 (Permission Error Handling)

---

### Pitfall 9: Smoothing Constant Obscures Rapid Note Changes (Eighth Notes)

**What goes wrong:**
The `AnalyserNode` is configured with `smoothingTimeConstant: 0.8`. This is a moving average filter that blends 80% of the previous frame's data into each new frame. For sustained notes (half notes, quarter notes), this improves stability. For eighth notes at 100 BPM (300ms each), the smoother causes the note's FFT data to "ramp up" over multiple frames, meaning the true peak isn't represented in the buffer until 2-3 frames in. Combined with `onFrames: 4`, this effectively adds ~100ms of latency to note detection — enough to miss an eighth note entirely.

**Why it happens:**
`smoothingTimeConstant: 0.8` is the MDN-recommended default for visualization purposes. It was not designed for note detection. Autocorrelation runs on time-domain data (`getFloatTimeDomainData`), which is less affected by the smoother than frequency-domain data — but the AnalyserNode still applies a small amount of temporal blending that compounds with the stability frame requirement.

**Consequences:**
- Sight-reading game: child plays an eighth note correctly, but the note is detected 100ms late and counted as the next beat
- The perceived latency issue ("wrong timing on eighth notes") reported as the current bug is likely this compound problem
- Reducing `onFrames` to fix latency increases false positives (noise triggers notes)

**Prevention:**
1. Set `smoothingTimeConstant: 0` for time-domain pitch detection. The smoother is for spectral visualization; YIN/autocorrelation needs raw samples.
2. Compensate for the loss of smoothing in the algorithm, not in the analyser — YIN's normalization step handles transient noise better than smoother-based filtering.
3. For the stability layer in `useMicNoteInput`, use time-based accumulation (e.g., require stable detection for 60ms) rather than frame counting — frame count is unstable under rAF throttling.

**Warning signs:**
- Eighth notes at 120+ BPM are consistently missed or detected one slot late
- Problem improves when the stability frame count is reduced (but then false positives appear)
- `smoothingTimeConstant` is set to 0.8 or higher in the AnalyserNode configuration

**Phase to address:** Phase 1 (Algorithm Configuration)

---

### Pitfall 10: Regression: mic-flag-not-reset After Try Again (Current Bug)

**What goes wrong:**
The failing test `SightReadingGame.micRestart.test.jsx` captures an existing regression: after clicking "Try Again" and restarting a performance, `startListening` is called only once instead of twice. The mic is not re-activated on the second attempt.

**Why it happens:**
The likely cause is an internal flag or guard in the component (or hook) that prevents `startListening` from being called when the hook's state still shows `isListening: true` from the previous session. The `stopListening` on "Try Again" sets `isListening: false` in React state, but this state update is asynchronous — by the time the user clicks "Start Playing" again, the previous state hasn't fully settled, or the flag preventing double-starts hasn't been reset.

This is exactly the pattern the `resetInternalState` call in `useMicNoteInput.stopListeningWrapped` is supposed to handle, but the timing between `stopListening` (async state reset) and the next `startListening` (triggered by user) is a classic race condition in React hook state management.

**Consequences:**
- After "Try Again": game starts, no mic input, child appears to play wrong notes
- The test proves the regression exists; fixing the algorithm without fixing this will leave users on the old broken path when they retry exercises

**Prevention:**
1. Fix this regression FIRST before any algorithm changes — it is already tested and broken
2. The fix pattern: use a `ref` (not state) for the "is currently listening" guard, so it can be read synchronously in `startListening` without waiting for a state flush
3. Ensure `stopListening` synchronously resets the guard ref before returning, so the next `startListening` sees the cleared state
4. The test must pass as a prerequisite gate for any further pitch detection work

**Warning signs:**
- The existing test `SightReadingGame.micRestart.test.jsx` is failing
- `startListeningSpy` is called once instead of twice in the restart flow
- Only happens after "Try Again", not on first start

**Phase to address:** Phase 0 (Pre-existing Bug — must fix before any other work)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep naive autocorrelation, tune thresholds | No algorithm change, fast fix | Octave errors persist; tuning is whack-a-mole | Never — the error is algorithmic, not parametric |
| Keep rAF loop, reduce onFrames | Fixes latency on fast devices | Breaks on throttled rAF (low battery, background); increases false positives | Never for production; only for initial prototype |
| Create new AudioContext on every startListening | Simpler state management | Memory leak across restarts; Chrome context limit | Never — already causing the current mic-restart bug |
| Set smoothingTimeConstant: 0.8 for "stability" | Smoother frequency display | 100ms phantom latency for eighth note detection | Acceptable ONLY for visualization-only components |
| Use `isListening` state as the guard for startListening | Simpler code | State batching race condition (current bug) | Never — use a ref for synchronous guards |
| Ship without AudioWorklet, defer to later | Faster first phase | main-thread congestion on slow tablets; rAF throttle problems | Acceptable if rAF loop has explicit throttle guards |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `useMicNoteInput` + `SightReadingGame` | Restart sequence does not call `stopListening` before `startListening` | Enforce explicit stop-then-start sequence; never call `startListening` when `isListeningRef.current === true` |
| `usePitchDetection` + `useAudioEngine` | Two AudioContext instances created (one for pitch, one for metronome) | Share a single AudioContext via a context provider or pass ref down; browser limits to ~6 concurrent contexts |
| `AudioContext.resume()` + iOS gesture | `resume()` called after an `await` in the same handler | Call `resume()` synchronously before any async work in gesture handlers |
| `getUserMedia` + PWA reinstall | Permission state assumed from previous session | Always attempt `getUserMedia` fresh; don't cache permission state across app launches |
| `requestAnimationFrame` + React Strict Mode | `detectLoop` fires twice on mount in dev mode | Use the `hasAutoStartedRef` pattern already in the codebase; guard rAF with a running flag ref |
| New pitch algorithm + existing test suite | Tests mock `useMicNoteInput` — algorithm changes don't break them | Add dedicated algorithm unit tests for YIN/MPM output accuracy before replacing autocorrelation |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Autocorrelation at O(N^2) in rAF loop | Main thread blocked ~1-3ms per frame on slow devices; VexFlow renders stutter | Use YIN (O(N) with optimizations) or move to AudioWorklet; profile with Chrome DevTools Performance tab | Consistently on iPhone SE / low-end Android; intermittently on mid-range |
| Large Float32Array allocation on every frame | GC pauses cause audio glitches every ~30 seconds (GC frequency) | Pre-allocate the analysis buffer in a ref outside the loop; never `new Float32Array` inside `detectLoop` | Immediately on any device after ~1 minute of continuous detection |
| `setDetectedFrequency` / `setDetectedNote` called at 60Hz | 60 React state updates per second cause excessive re-renders | Debounce state updates; only update state when note changes, not every frame | Immediately visible in React DevTools Profiler; causes visible frame drops during notation rendering |
| AudioWorklet with 128-frame quanta + no ring buffer | Low notes never detected | Accumulate to 2048 samples in ring buffer before running detection | Every bass clef note; manifests immediately in testing |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Caching microphone stream across page navigations | Audio continues recording when user navigates away from game (COPPA violation) | Always stop and release all MediaStream tracks in component cleanup; verify with `track.readyState === 'ended'` after cleanup |
| Logging pitch data with user identifiers | Audio patterns could identify individuals (COPPA/GDPR-K) | Do not log raw audio data or frequency time series with student IDs; debug logging gated behind `VITE_DEBUG_MIC_LOGS` (already implemented) |
| `getUserMedia` constraint with no echo cancellation | Mic feedback loop on devices with speakers (game feedback sounds fed back into mic) | Always request `echoCancellation: true, noiseSuppression: true` in getUserMedia constraints |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No mic permission UI on first load | Child taps Start and nothing works; assumes they're playing wrong | Show a "We'll need your microphone" prompt with visual before requesting permission; only request on explicit user action |
| Mic icon shows "active" when AudioContext is suspended (iOS) | Child thinks the game is listening; plays note; nothing detected | Show mic status based on verified stream liveness (`track.readyState === 'live'`), not just `isListening` state |
| No fallback when mic fails | Child stuck at blank game screen | Show keyboard input fallback (Klavier is already implemented) if mic fails to start within 3 seconds |
| Pitch detection confidence not surfaced | Child plays a note that is borderline (between two frequencies); game randomly accepts/rejects | Show a visual "confidence bar" for detected note; only register note when confidence is above threshold |
| Latency gap between note play and green flash | Child thinks they played wrong because feedback is 200ms late | Target <100ms from sound to visual confirmation; measure the pipeline end-to-end before shipping |

---

## "Looks Done But Isn't" Checklist

- [ ] **Octave error fix:** Verify by playing C4 on acoustic piano (not digital) with bright attack — should detect C4, not C5. Do not rely on synthetic test tones which have clean harmonics.
- [ ] **Mic restart regression:** `SightReadingGame.micRestart.test.jsx` must pass before claiming the restart flow is fixed.
- [ ] **iOS Safari interruption:** Test by starting a game session, receiving a phone call (or activating Siri), then returning — mic must resume correctly.
- [ ] **AudioContext limit:** Run 7+ consecutive game sessions in the same app session (without full page reload) — no "AudioContext limit exceeded" errors.
- [ ] **Bass clef detection:** Play C3 and D3 on a piano — these must be detected if the app supports bass clef exercises (the current frequency table only goes down to C3).
- [ ] **Permission denied path:** Deny microphone on first launch, relaunch the PWA — a clear "enable in Settings" message must appear, not a silent failure.
- [ ] **Eighth note timing:** At 120 BPM, play 4 eighth notes in a row — all 4 must register, with no missed notes or timing offset.
- [ ] **rAF throttle:** Open Chrome DevTools, CPU throttle to 4x slowdown, play notes — detection must still function (may be slower but not break).
- [ ] **Klavier keyboard fallback:** With mic blocked, keyboard input must still work for all exercises.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Autocorrelation octave errors shipped | MEDIUM | Replace algorithm in `usePitchDetection.js` with YIN via `pitchfinder` or `pitchy`; adjust `rmsThreshold` and `tolerance` to match new algorithm's output scale; re-run all game flows |
| AudioContext leak shipped | HIGH | Must add context reuse pattern; requires changing hook interface (creates vs. reuses context); downstream consumers need update |
| iOS AudioContext suspension not handled | LOW-MEDIUM | Add `statechange` event listener and `visibilitychange` handler to `usePitchDetection`; no interface change needed |
| Mic restart regression still in production | LOW | Fix the `isListening` state vs. ref guard; the test already exists — just make it pass |
| Main-thread rAF blocking shipped | HIGH | Requires AudioWorklet migration with fallback; significant architectural change; 2-3 week effort |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Mic-restart regression (current bug) | Phase 0 — fix before any new work | `SightReadingGame.micRestart.test.jsx` passes |
| Autocorrelation octave errors | Phase 1 — Algorithm replacement | Play C4 on acoustic piano; detected note matches; octave error rate < 1% in manual testing |
| AudioContext multiple instances | Phase 1 — AudioContext lifecycle | 10 game restarts with no console errors; memory stable in DevTools |
| Permission denied silent failure | Phase 1 — Error handling | Deny mic in iOS Settings; clear message appears on next game start |
| Smoothing constant latency | Phase 1 — Configuration | Set `smoothingTimeConstant: 0`; eighth note test at 120 BPM passes |
| Key release noise false positives | Phase 1 — Detection tuning | Acoustic piano hold-release test; no phantom events after note release |
| iOS AudioContext interruption | Phase 2 — Cross-browser hardening | Phone call during game session; mic resumes on return |
| iOS gesture requirement | Phase 2 — Cross-browser hardening | Test in iOS Safari PWA standalone; no suspended context issues |
| rAF main-thread blocking | Phase 3 — Performance (later) | Chrome 4x CPU throttle; detection still functions |
| AudioWorklet 128-frame buffer size | Phase 3 — AudioWorklet migration | Bass clef notes C3-B3 all detected after migration |

---

## Sources

- [WebKit Bug 237878: AudioContext suspended when iOS page is backgrounded](https://bugs.webkit.org/show_bug.cgi?id=237878)
- [WebKit Bug 237322: Web Audio muted when iOS ringer is muted](https://bugs.webkit.org/show_bug.cgi?id=237322)
- [WebKit Bug 198277: Audio stops when standalone web app is not in foreground](https://bugs.webkit.org/show_bug.cgi?id=198277)
- [Web Audio API GitHub Issue #790: Context stuck in suspended state on iOS](https://github.com/WebAudio/web-audio-api/issues/790)
- [AudioWorklet Design Pattern — Chrome Developers Blog](https://developer.chrome.com/blog/audio-worklet-design-pattern)
- [AudioWorklet is a real world disaster — WebAudio Spec Issue #2632](https://github.com/WebAudio/web-audio-api/issues/2632)
- [Garbage Collection in Web Audio — WebAudio Spec Issue #373](https://github.com/WebAudio/web-audio-api/issues/373)
- [Autocorrelation vs YIN for Pitch Detection](https://pitchdetector.com/autocorrelation-vs-yin-algorithm-for-pitch-detection/)
- [pitchfinder JS library — includes YIN, MPM, AMDF implementations](https://github.com/peterkhayes/pitchfinder)
- [Microphone stops working in PWA on iOS — Apple Developer Forums](https://developer.apple.com/forums/thread/733229)
- [Unlock Web Audio in Safari for iOS — Matt Montag](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos)
- [MDN: Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [MDN: AnalyserNode.fftSize](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize)
- [Exploring System Adaptations for Minimum Latency Real-Time Piano Transcription (arXiv 2509.07586)](https://arxiv.org/html/2509.07586)
- [Current codebase: `src/hooks/usePitchDetection.js` — reviewed 2026-02-17]
- [Current codebase: `src/hooks/useMicNoteInput.js` — reviewed 2026-02-17]
- [Current codebase: `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx` — reviewed 2026-02-17]

---
*Pitfalls research for: Browser-based piano pitch detection overhaul in existing React 18 PWA*
*Researched: 2026-02-17*
