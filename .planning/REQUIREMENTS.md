# Requirements: PianoApp — Mic Pitch Detection Overhaul

**Defined:** 2026-02-17
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v1.7 Requirements

Requirements for mic pitch detection overhaul. Each maps to roadmap phases.

### Bug Fix (Prerequisite)

- [ ] **FIX-01**: Mic-restart regression fixed — "Try Again" reactivates mic correctly on second attempt (SightReadingGame.micRestart.test.jsx passes)
- [ ] **FIX-02**: Mic listening guard uses synchronous ref instead of async React state to prevent race conditions

### Audio Configuration

- [ ] **AUDIO-01**: getUserMedia requests mic with `echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false` to prevent browser DSP from corrupting piano signal
- [ ] **AUDIO-02**: AnalyserNode `smoothingTimeConstant` set to `0.0` (was `0.8`) to eliminate ~100ms phantom latency
- [ ] **AUDIO-03**: AnalyserNode `fftSize` increased to `4096` (was `2048`) for better frequency resolution on bass clef notes

### Algorithm

- [ ] **ALGO-01**: Pitch detection uses McLeod Pitch Method (via pitchy library) instead of naive autocorrelation, eliminating octave errors on piano harmonics
- [ ] **ALGO-02**: Pitch confidence threshold gates emissions — only notes with clarity above threshold are reported (prevents weak/ambiguous detections)
- [ ] **ALGO-03**: Pitch detection accurately identifies all notes in the app's trail node pools from C3 to C6

### Detection Pipeline

- [ ] **PIPE-01**: Dynamic `onFrames` (onset speed) scales with BPM and note duration — faster notes get faster detection
- [ ] **PIPE-02**: Dynamic `offMs` (note-off speed) scales with BPM and note duration — short notes release fast, long notes allow natural decay
- [ ] **PIPE-03**: Formal IDLE/ARMED/ACTIVE state machine in `useMicNoteInput` replaces frame-counting candidacy logic
- [ ] **PIPE-04**: Full piano frequency map covers all note pools used in trail nodes (including bass clef low notes B2, A2, etc.)
- [ ] **PIPE-05**: BPM and note duration context propagated into mic detection hooks from game components
- [ ] **PIPE-06**: Per-note debouncing in game scoring layer prevents double-scoring when detection fires twice for one played note

### Architecture

- [ ] **ARCH-01**: Single shared `AudioContextProvider` React Context owns one AudioContext per game session (replaces 3 separate instances)
- [ ] **ARCH-02**: `usePitchDetection` accepts shared analyserNode from AudioContextProvider instead of creating its own AudioContext
- [ ] **ARCH-03**: `useAudioEngine` accepts shared AudioContext from AudioContextProvider instead of creating its own
- [ ] **ARCH-04**: `NotesRecognitionGame` inline detection code (~250 lines) replaced with shared `useMicNoteInput` hook
- [ ] **ARCH-05**: AudioContext uses `suspend()`/`resume()` between exercises instead of creating new contexts

### Cross-Browser (iOS Safari)

- [ ] **IOS-01**: iOS Safari `"interrupted"` AudioContext state handled — full mic stream re-acquired via getUserMedia when interrupted
- [ ] **IOS-02**: AudioContext `resume()` called synchronously within user gesture call stack (before any `await`) to satisfy iOS Safari requirement
- [ ] **IOS-03**: `visibilitychange` listener recovers mic after app switch, phone call, or device lock
- [ ] **IOS-04**: Mic permission denied shows clear, persistent error message with iOS Settings instructions (not silent failure)

### Performance (Conditional — Profiling-Gated)

- [ ] **PERF-01**: CPU profiling conducted on mid-range Android device to measure audio processing frame drop
- [ ] **PERF-02**: If profiling shows >5% frame drop from audio processing, AudioWorklet migration moves pitch detection off main thread
- [ ] **PERF-03**: If AudioWorklet built, uses ring buffer accumulation pattern (128-frame quanta to 2048 samples) for bass clef detection

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Audio Feedback

- **FEED-01**: Cents deviation display showing how sharp/flat a note is (hooks already emit raw frequency)
- **FEED-02**: Device calibration wizard measuring per-device mic latency offset

### Advanced Detection

- **ADV-01**: Multi-algorithm consensus (MPM primary + secondary estimator for cross-validation)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Polyphonic detection | Children play one note at a time; 10-100x compute overhead for zero user benefit |
| CREPE neural network | 7MB model, TensorFlow.js dependency, CDN fetch = COPPA violation, 100-300ms mobile latency |
| ml5.js pitch detection | External CDN model fetch violates COPPA; 2MB+ bundle size |
| essentia.js | 2MB WASM overkill for monophonic detection |
| Raw Hz frequency display | Children don't understand Hz; adds UI clutter with no learning value |
| Always-on mic on non-game screens | COPPA privacy concern; battery drain; mic indicator stays lit |
| Noise suppression via ML | Massive compute overhead; introduces non-linear distortion breaking pitch detection |
| UX/visual changes to mic mode | Scope is detection engine only; UX improvements deferred |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FIX-01 | Phase 06 | Pending |
| FIX-02 | Phase 06 | Pending |
| AUDIO-01 | Phase 07 | Pending |
| AUDIO-02 | Phase 07 | Pending |
| AUDIO-03 | Phase 07 | Pending |
| ALGO-01 | Phase 07 | Pending |
| ALGO-02 | Phase 07 | Pending |
| ALGO-03 | Phase 07 | Pending |
| ARCH-01 | Phase 07 | Pending |
| ARCH-02 | Phase 07 | Pending |
| ARCH-03 | Phase 07 | Pending |
| ARCH-04 | Phase 07 | Pending |
| ARCH-05 | Phase 07 | Pending |
| PIPE-01 | Phase 08 | Pending |
| PIPE-02 | Phase 08 | Pending |
| PIPE-03 | Phase 08 | Pending |
| PIPE-04 | Phase 08 | Pending |
| PIPE-05 | Phase 08 | Pending |
| PIPE-06 | Phase 08 | Pending |
| IOS-01 | Phase 09 | Pending |
| IOS-02 | Phase 09 | Pending |
| IOS-03 | Phase 09 | Pending |
| IOS-04 | Phase 09 | Pending |
| PERF-01 | Phase 10 | Pending |
| PERF-02 | Phase 10 | Pending |
| PERF-03 | Phase 10 | Pending |

**Coverage:**
- v1.7 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 — traceability complete after roadmap creation*
