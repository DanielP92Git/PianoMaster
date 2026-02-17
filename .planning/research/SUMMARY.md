# Project Research Summary

**Project:** PianoApp2 — Mic-Based Piano Pitch Detection Overhaul
**Domain:** Real-time browser-based audio signal processing for children's music education
**Researched:** 2026-02-17
**Confidence:** HIGH (codebase audit + official MDN/WebKit sources + algorithm research)

## Executive Summary

This milestone is a targeted refactor of an existing feature, not a greenfield build. The current pitch detection stack (`usePitchDetection.js` + `useMicNoteInput.js`) fails for any note shorter than a quarter note at tempos above 90 BPM. The root causes are well-understood and directly observable in the codebase: a naive autocorrelation algorithm that produces octave errors on piano's rich harmonic spectrum, a `smoothingTimeConstant = 0.8` that adds approximately 100ms of phantom latency, browser audio processing filters (`echoCancellation`, `noiseSuppression`, `autoGainControl`) actively destroying the piano signal before detection runs, and a fixed `onFrames = 4-5` stability window that is too slow to catch eighth notes at typical practice tempos. Each failure mode has a documented, implementable fix. There is also a currently-failing test (`SightReadingGame.micRestart.test.jsx`) proving an existing mic-restart regression that must be resolved before any other work is layered on top.

The recommended approach is a four-phase build: Phase 0 fixes the currently-failing mic-restart regression as a hard prerequisite; Phase 1 replaces the algorithm (pitchy v4.1.0 using the McLeod Pitch Method) and corrects the Web Audio configuration to achieve accurate detection for quarter through sixteenth notes; Phase 2 hardens cross-browser behavior, specifically iOS Safari's `"interrupted"` AudioContext state, synchronous user-gesture requirements, and mic permission silent failures on PWA re-launch; Phase 3 is optional performance work (AudioWorklet migration) that is only justified if CPU profiling on physical devices reveals main-thread audio pressure. The single new npm dependency is `pitchy` 4.1.0 — 5KB, ESM-only (compatible with Vite 6), zero external network calls (COPPA-compliant). The algorithm change is also accompanied by a needed architectural consolidation: the three separate AudioContext instances currently created across `usePitchDetection`, `useAudioEngine`, and an inline copy in `NotesRecognitionGame` must be unified into a single `AudioContextProvider` React context.

The consolidated architecture eliminates silent iOS Safari failures caused by concurrent AudioContext limits, fixes the mic-restart race condition at its root, and removes approximately 250 lines of duplicated detection code from `NotesRecognitionGame.jsx`. The build is designed to be incremental — each phase leaves the app in a working state, all existing tests remain valid, and the algorithm swap is scoped as a drop-in function replacement with the same input/output API. No routes, no game logic, no VexFlow rendering code, and no trail system changes are required.

---

## Key Findings

### Recommended Stack

The current Web Audio API setup is topologically correct (AnalyserNode pipeline, requestAnimationFrame loop, two-layer hook separation) but misconfigured at the algorithm and parameter level. Only one new npm package is required: `pitchy` v4.1.0, providing the McLeod Pitch Method (MPM). MPM uses a normalized square difference function that produces sharp peaks at the true fundamental frequency rather than at harmonic overtones — the exact failure mode of the current autocorrelation implementation on piano audio. The rest of the stack changes are parameter updates to existing Web Audio API configuration and one new React Context file.

**Core technologies:**
- **pitchy 4.1.0**: Primary pitch algorithm — McLeod Pitch Method eliminates the "first-harmonic wins" failure mode of naive autocorrelation. ~5KB, ESM-only (compatible with Vite 6 out of the box), zero external network calls, COPPA-compliant. API: `const [pitch, clarity] = detector.findPitch(float32Buffer, sampleRate)`.
- **Web Audio API (AnalyserNode)**: Keep existing pipeline — change `fftSize: 2048 → 4096`, `smoothingTimeConstant: 0.8 → 0.0`. These two parameter changes eliminate approximately 100ms of phantom latency introduced by the smoothing filter.
- **getUserMedia constraints**: Add `echoCancellation: false, noiseSuppression: false, autoGainControl: false` to the `getUserMedia` call. Browser defaults actively destroy piano transients (autoGainControl compresses attacks; noiseSuppression removes harmonics it misidentifies as noise). One-line change with high impact.
- **AudioContextProvider (new React Context)**: A new `src/contexts/AudioContextProvider.jsx` owning one shared AudioContext per game session. Eliminates concurrent context creation bugs, the mic-restart regression, and the 250-line inline detection copy in `NotesRecognitionGame`.

Explicitly avoid: ml5.js/CREPE (2MB+ TensorFlow model, CDN fetch, COPPA violation), essentia.js (2MB WASM overkill for monophonic detection), aubio.js (npm package abandoned since 2019), AudioWorklet in Phase 1 (iOS Safari has active bugs in 2024, Vite requires extra configuration, MessagePort overhead partially negates off-thread benefit).

### Expected Features

**Must have (table stakes — required for the refactor to succeed):**
- Accurate monophonic note classification — one note played equals one note reported at the correct pitch, without octave errors. Broken today on quarter-note attacks due to autocorrelation's first-harmonic failure.
- Onset detection within timing windows — eighth notes at 120 BPM need onset in under 62ms; current fixed 83ms (5 frames at 60fps) exceeds this and causes systematic misses.
- Note-off detection that separates adjacent notes — current fixed 140ms merges eighth notes at typical practice tempos.
- Correct getUserMedia audio constraints — browser DSP currently corrupts the input signal before detection runs.
- Full piano frequency map covering all trail node note pools — the current table may be missing bass clef low notes (B2, A2) required by some trail node configs.
- Formal IDLE/ARMED/ACTIVE state machine in `useMicNoteInput` — replaces frame-counting candidacy logic, eliminates C4/B3 pitch flicker at note transitions.
- Dynamic `onFrames` and `offMs` scaled to BPM and note value — formula-driven (`onFrames = min(5, floor(noteDurationMs / 33))`; `offMs = max(40, noteDurationMs * 0.3)`), not static presets.

**Should have (add after core accuracy is validated):**
- Per-note debouncing in `SightReadingGame.jsx` — a game-layer ref guard (no hook changes), specced in `SIGHT_READING_GAME_IMPROVEMENT_PLAN.md`.
- Multi-algorithm consensus (MPM primary + secondary check) — once pitchy is stable, add a second estimator; allows `onFrames` to drop to 3 when consensus validates.
- AudioWorklet migration for off-thread detection — eliminates rAF throttling in background tabs; defer until Phase 1 is validated on physical devices.

**Defer to v2+:**
- Cents deviation display — hooks already emit raw frequency; needs UI design appropriate for 8-year-olds.
- Device calibration wizard — per-device latency measurement; only worthwhile after base accuracy is solved.
- Polyphonic detection — children play one note at a time; CREPE is 10-100x more compute-intensive and entirely wrong for this use case.

### Architecture Approach

The recommended architecture introduces one new React Context (`AudioContextProvider`) that wraps all game routes in `AppLayout.jsx`, owns a single `AudioContext` and `AnalyserNode`, and exposes them via `useAudioContext()`. All audio hooks consume the shared context rather than creating their own. The existing two-layer hook design (`usePitchDetection` producing raw frequency → `useMicNoteInput` producing stable noteOn/noteOff events) is architecturally correct and is preserved. The key rule: audio infrastructure (AudioContext, AnalyserNode, MediaStream, animation frame handles) lives in `useRef`, never in `useState`. Only user-visible derived values (`isListening`, `audioLevel` throttled to every fifth frame, `isReady`) go in state.

**Major components:**
1. `AudioContextProvider` (new, `src/contexts/`) — owns single AudioContext, mic stream, analyserNode; initializes lazily on user gesture (never from `useEffect`); cleans up on game route exit.
2. `usePitchDetection` (modified) — accepts `analyserNode` and `sampleRate` from context instead of creating its own AudioContext; replaces autocorrelation with pitchy MPM; `fftSize` 4096, `smoothingTimeConstant` 0.0.
3. `useMicNoteInput` (minor modify) — stability layer unchanged except mic stream acquisition delegates to `AudioContextProvider.initializeMic()`.
4. `useAudioEngine` (modified) — accepts shared `audioContextRef` instead of creating its own AudioContext on mount.
5. `NotesRecognitionGame` (modified) — replaces approximately 250 lines of inline detection (`startAudioInput`, `detectPitch`, `frequencyToNote`, `detectLoop`) with `useMicNoteInput` + `MIC_INPUT_PRESETS.notesRecognition`.

`AudioContextProvider` mounts at the game route boundary (using the existing `isGameRoute` logic in `AppLayout.jsx`), not at app root. This ensures mic permission is never requested on non-game pages (dashboard, trail, settings).

### Critical Pitfalls

1. **Mic-restart regression (currently failing test)** — `SightReadingGame.micRestart.test.jsx` is already failing. The cause is using React `useState` as the guard for "is currently listening," which is asynchronous. After "Try Again," `stopListening` sets `isListening: false` in state, but by the time `startListening` is called again the state hasn't flushed. Fix: use a synchronous `useRef` as the listening guard, not async state. This is the highest-priority item because it blocks all other work from having reliable test feedback.

2. **AudioContext created on every `startListening()` call** — The current pattern orphans the previous AudioContext on each game restart. Chrome hard-limits concurrent contexts to approximately 6; iOS Safari silently fails earlier. Fix: `AudioContextProvider` creates one context on mount, uses `suspend()`/`resume()` between exercises, and `close()`s only on unmount.

3. **iOS Safari AudioContext `"interrupted"` state not handled** — iOS puts the AudioContext in `"interrupted"` (distinct from `"suspended"`) when the user receives a call, switches apps, or locks the device. `resume()` does not restore mic input in this state — the MediaStream itself is killed by iOS and must be re-acquired via `getUserMedia`. Add `statechange` and `visibilitychange` listeners with full mic restart logic.

4. **iOS Safari requires user gesture synchronously before any `await`** — `AudioContext.resume()` must be called in the synchronous call stack of a user gesture event handler. A single `await` before the call (even for `getUserMedia`) breaks the gesture association on iOS Safari, leaving the context permanently `"suspended"` with no error thrown. Call `resume()` synchronously at the start of the click handler, before any async work.

5. **Smoothing constant adds 100ms phantom latency** — `smoothingTimeConstant: 0.8` blends 80% of the previous frame's FFT data into each new frame. Combined with `onFrames: 4`, this effectively adds up to 100ms of mandatory detection lag. Set to `0.0` in Phase 1 — this is one of the two single highest-impact parameter changes in the entire refactor.

---

## Implications for Roadmap

The dependency graph is strict. Phase 0 must precede Phase 1 (failing test gates other work — building on it means test feedback is unreliable). Phase 1 must precede Phase 2 (iOS hardening is meaningless if the base algorithm is producing octave errors; validate core accuracy on Chrome/desktop first). Phase 3 is data-driven and only begins if profiling reveals a problem.

### Phase 0: Pre-existing Bug Fix
**Rationale:** The mic-restart regression is a currently-failing test that proves an existing defect in the "Try Again" flow. Any algorithm or architecture work built on top produces unreliable test feedback. The fix is small (ref guard instead of state guard in `useMicNoteInput`) but it must ship first as a hard gate for all subsequent work.
**Delivers:** A passing test suite as a stable baseline. `SightReadingGame.micRestart.test.jsx` passes. The "Try Again" flow reactivates the mic correctly on second attempt.
**Addresses:** Pitfall 10 (the only pitfall rated "must fix before any other work").
**Avoids:** Building further on a broken foundation where test failures mask regressions.
**Research flag:** No research needed. Fix pattern is documented in PITFALLS.md — synchronous ref guard, not async state. Standard patterns apply.

### Phase 1: Algorithm Replacement and Core Configuration
**Rationale:** All root causes of incorrect pitch detection (octave errors, onset latency, note-off merging, browser audio signal corruption, multiple AudioContext instances) are addressable in this phase. These are high-impact changes that stay within the existing hook API surface. The `AudioContextProvider` consolidation is included here because it fixes the restart regression root cause and is a prerequisite for the algorithm migration (the detector needs a stable, shared analyserNode). `NotesRecognitionGame` duplication removal is included because the algorithm fix would otherwise need to be applied twice.
**Delivers:** Accurate detection of quarter through sixteenth notes at 60-120 BPM on desktop and Android Chrome. Single shared AudioContext with no concurrent-context bugs. `NotesRecognitionGame` using the shared detection stack (removes 250-line duplication and ensures algorithm improvements reach all games).
**Addresses (from FEATURES.md):** All P1 features — `getUserMedia` constraints, pitchy MPM algorithm, dynamic `onFrames`/`offMs`, IDLE/ARMED/ACTIVE state machine, full note frequency map.
**Uses (from STACK.md):** `pitchy` 4.1.0 (single npm install), Web Audio API reconfiguration, `AudioContextProvider` (new React Context file).
**Avoids:** Pitfall 1 (autocorrelation octave errors via MPM), Pitfall 2 (AudioContext-per-startListening via shared provider), Pitfall 7 (key-release false positives via minimum note duration requirement), Pitfall 8 (permission denied silent failure via explicit error handling and persistent UI), Pitfall 9 (smoothing constant latency via `smoothingTimeConstant: 0.0`).
**Research flag:** No additional research needed. pitchy API is fully documented on GitHub. Web Audio API parameter changes are MDN-documented. AudioContext lifecycle patterns are established. getUserMedia constraint behavior is well-sourced. Start implementation directly.

### Phase 2: Cross-Browser Hardening (iOS Safari)
**Rationale:** Phase 1 delivers correct behavior on Chrome, Android, and desktop. iOS Safari introduces three separate, well-documented failure modes that require explicit handling. These cannot be verified on desktop dev environments — physical iOS device testing is mandatory. Phase 2 is its own phase because it requires a testing environment change (physical device) and involves different code paths than Phase 1.
**Delivers:** Correct behavior on iOS Safari in standalone PWA mode. Mic resumes correctly after phone calls, Siri activation, and app switches. AudioContext created correctly from gesture handlers without suspension. Clear, parent-readable message when mic permission is denied (with iOS Settings instructions), not a silent failure.
**Avoids:** Pitfall 3 (iOS `"interrupted"` state via `statechange` listener and full mic restart), Pitfall 4 (iOS gesture requirement via synchronous `resume()` before `await`), Pitfall 8 (permission denied silent failure via persistent error UI and `localStorage` state).
**Research flag:** iOS Safari behavior is fully documented via the cited WebKit bug reports (237878, 237322, 198277). Implementation patterns are established (statechange listener, visibilitychange handler, gesture-first resume). No additional research needed, but physical iOS device testing is a mandatory verification step — the iOS Simulator does not accurately reproduce AudioContext suspension behavior.

### Phase 3: Performance Hardening (Optional, Profiling-Gated)
**Rationale:** The `requestAnimationFrame` loop on the main thread is adequate for target devices once Phase 1 is in place (smoothing removed; pitchy MPM is O(N) vs the current O(N^2) autocorrelation). AudioWorklet migration is only justified if CPU profiling on mid-range Android (2019-era device class) or low-end iOS shows greater than 5% frame drop attributable to audio processing. Do not build this phase speculatively.
**Prerequisite gate:** Chrome DevTools CPU profiling on a real mid-range device shows measurable frame drop caused by audio processing competing with VexFlow rendering. If this is not observed after Phase 1, skip Phase 3 entirely.
**Delivers (if built):** Off-thread pitch detection via AudioWorklet, eliminating rAF throttling in background tabs and main-thread competition with React rendering on low-end devices.
**Avoids (if built):** Pitfall 5 (rAF main-thread blocking) and Pitfall 6 (AudioWorklet 128-frame buffer — must use ring buffer accumulation to 2048 samples before running detection, or bass clef notes below E4 will never be detected).
**Research flag:** Needs a dedicated research spike before planning this phase. Items to research: Vite configuration for AudioWorklet module serving (the worklet file must be served from the same origin; Vite needs specific handling); iOS Safari AudioWorklet bug status as of current iOS version (Apple Developer Forums thread confirmed active bugs in iOS 18); SharedArrayBuffer COOP/COEP header requirements; ring buffer accumulation pattern for 128-frame quanta. Do not begin Phase 3 planning without this spike.

### Phase Ordering Rationale

- Phase 0 before Phase 1: The failing test is a prerequisite gate. Building new features on a broken baseline means test failures can mask new regressions introduced during algorithm migration.
- Phase 1 before Phase 2: iOS Safari hardening addresses browser-specific edge cases. Validating the core algorithm and architecture on Chrome/desktop first isolates iOS-specific issues from algorithmic issues during debugging.
- Algorithm change before AudioWorklet: Migrating the wrong autocorrelation algorithm to an AudioWorklet would require two migrations. Fix the algorithm first, then reconsider the threading architecture only if performance data justifies it.
- Phase 3 is data-driven, not speculative: AudioWorklet adds iOS Safari risk (active bugs), Vite bundler complexity, and MessagePort serialization overhead. The rAF loop with pitchy MPM is adequate if Phase 1 smoothing removal is in place. Profile before planning, plan before building.

### Research Flags

Phases needing deeper research during planning:
- **Phase 3 (AudioWorklet):** If CPU profiling triggers this phase, run a research spike before planning. Specific unknowns: Vite AudioWorklet module serving configuration, current iOS 18 AudioWorklet bug status, ring buffer pattern for 128-frame quanta accumulation to 2048 samples, COOP/COEP header requirements for SharedArrayBuffer.

Phases with standard patterns (skip research-phase):
- **Phase 0:** Fix pattern is documented in PITFALLS.md. Ref guard replacing state guard is a well-understood React pattern.
- **Phase 1:** pitchy API is fully documented. Web Audio configuration changes are MDN-sourced. AudioContextProvider follows the single-context pattern recommended by the Web Audio API specification.
- **Phase 2:** iOS Safari behavior is documented via cited WebKit bug reports. Implementation patterns (statechange listener, visibilitychange handler, synchronous gesture-first resume) are established in developer literature.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | pitchy v4.1.0 ESM compatibility verified via GitHub release page (January 2024). Web Audio API parameter changes are MDN-documented. MPM algorithm superiority backed by McLeod's 2005 paper and pitchy README. getUserMedia constraint behavior verified via MDN and developer guides (Safari partial-ignore caveat noted). |
| Features | MEDIUM-HIGH | P1 features have clear implementation paths derived from direct codebase audit. Dynamic onFrames/offMs formulas are latency-budget-derived and internally consistent. Empirical validation against real piano audio is still required — starting parameter values will need a tuning pass. |
| Architecture | HIGH | Based on direct codebase analysis (all hook files reviewed line-by-line). AudioContextProvider pattern follows MDN Web Audio best practices ("reuse a single AudioContext"). iOS Safari concurrent context failure mode verified via Apple Developer Forums and WebKit bug tracker. Build order (5 sequential steps) leaves app working at each step. |
| Pitfalls | HIGH | Pitfalls 1, 2, 9, 10 are directly observable in the current codebase source code. Pitfalls 3, 4 are verified via WebKit bug reports 237878, 237322, and Apple Developer Forums. Pitfall 6 (AudioWorklet buffer size) is specified by the Web Audio API specification. All pitfalls have documented prevention strategies. |

**Overall confidence:** HIGH

### Gaps to Address

- **Dynamic parameter formula validation**: The formulas (`onFrames = min(5, floor(noteDurationMs / 33))`; `offMs = max(40, noteDurationMs * 0.3)`) are derived from the latency budget analysis but are starting values. Plan for a tuning pass in Phase 1 verification against real piano audio on physical devices (acoustic piano and digital keyboard input both should be tested).
- **rmsThreshold after disabling autoGainControl**: Disabling autoGainControl means the mic signal has more dynamic range. The recommended increase from 0.01 to 0.015 is based on reasoning, not empirical data. Verify this does not over-suppress soft notes on children's smaller/cheaper keyboards.
- **Safari getUserMedia constraint behavior on iOS**: Disabling `echoCancellation`, `noiseSuppression`, `autoGainControl` works reliably on Chrome and Firefox. iOS Safari may partially ignore these constraints (MDN notes this is "best effort"). Verify on physical iOS device during Phase 2.
- **Bass clef frequency table coverage audit**: FEATURES.md flags that the current `DEFAULT_NOTE_FREQUENCIES` map in `usePitchDetection.js` may be missing notes required by trail unit files. Explicitly audit `skillTrail.js` and all unit files in `src/data/units/` against the frequency table before shipping Phase 1.
- **pitchy clarity threshold calibration**: The recommended `clarity >= 0.9` threshold follows pitchy's documentation. This may need adjustment based on testing with actual piano audio — pianos with sustain pedal pressed may have lower clarity scores due to overlapping decay.

---

## Sources

### Primary (HIGH confidence)
- [pitchy GitHub — ianprime0509/pitchy](https://github.com/ianprime0509/pitchy) — MPM algorithm, v4.1.0 ESM-only status, API reference (`findPitch`, `PitchDetector.forFloat32Array`)
- [McLeod, Philip & Wyvill, Geoff: "A Smarter Way to Find Pitch" (2005)](https://www.cs.otago.ac.nz/research/publications/oucs-2008-03.pdf) — MPM algorithm foundation and normalized square difference function
- [MDN: Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — single AudioContext reuse recommendation
- [MDN: AnalyserNode.smoothingTimeConstant](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) — temporal smoothing behavior
- [MDN: AnalyserNode.fftSize](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize) — valid sizes and default behavior
- [MDN: getUserMedia audio constraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings/echoCancellation) — echoCancellation, noiseSuppression, autoGainControl
- WebKit Bug 237878 — AudioContext suspended when iOS page is backgrounded (confirmed active failure mode)
- WebKit Bug 237322 — Web Audio muted when iOS ringer is muted
- WebKit Bug 198277 — Audio stops when standalone web app is not in foreground
- Codebase direct audit (2026-02-17): `src/hooks/usePitchDetection.js`, `src/hooks/useMicNoteInput.js`, `src/hooks/useAudioEngine.js`, `src/hooks/micInputPresets.js`, `src/components/games/notes-master-games/NotesRecognitionGame.jsx`, `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx`

### Secondary (MEDIUM confidence)
- [GitHub: apankrat/note-detector](https://github.com/apankrat/note-detector) — multi-algorithm consensus (Search/Confirm/Track) state machine pattern
- [JUCE Forum: Lowest-latency real-time pitch detection](https://forum.juce.com/t/lowest-latency-real-time-pitch-detection/51741) — minimum latency = 2x fundamental period; YIN and MPM practical recommendations
- [Autocorrelation vs YIN for Pitch Detection](https://pitchdetector.com/autocorrelation-vs-yin-algorithm-for-pitch-detection/) — approximately 3x fewer octave errors with YIN vs plain autocorrelation
- [Apple Developer Forums: AudioWorklet not playing on iOS 18](https://developer.apple.com/forums/thread/768347) — confirms active iOS AudioWorklet bugs as of 2024
- [Chrome Developer Blog: Audio Worklet design pattern](https://developer.chrome.com/blog/audio-worklet-design-pattern) — AudioWorklet vs rAF architecture, MessagePort communication pattern
- [pitchfinder library (GitHub)](https://github.com/peterkhayes/pitchfinder) — JavaScript YIN implementation reference (alternative to pitchy if MPM-only is insufficient)
- [getUserMedia Audio Constraints — addpipe.com](https://blog.addpipe.com/audio-constraints-getusermedia/) — echoCancellation, noiseSuppression, autoGainControl impact on music audio
- [Onset Detection — Cycfi Research](https://www.cycfi.com/2021/01/onset-detection/) — why amplitude-only onset detection fails for soft piano notes

### Tertiary (LOW confidence — needs validation during implementation)
- Dynamic `onFrames`/`offMs` parameter formulas are internally derived from latency budget analysis, not externally sourced. Treat as starting values requiring empirical calibration.
- `sampleRate: { ideal: 44100 }` getUserMedia hint is best-effort; browser selects actual rate. Algorithm must read `context.sampleRate` dynamically (already done in current code).

---
*Research completed: 2026-02-17*
*Ready for roadmap: yes*
