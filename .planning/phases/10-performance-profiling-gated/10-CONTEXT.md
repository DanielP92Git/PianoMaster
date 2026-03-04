# Phase 10: Performance (Profiling-Gated) - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate that audio processing does not cause measurable frame drop on mid-range Android devices. Profile first — only build AudioWorklet if profiling shows >5% frame drop from audio processing. This is the final phase of v1.7 Mic Pitch Detection Overhaul.

Does NOT include: new game features, UI changes, algorithm changes, or iOS-specific work (already hardened in Phase 09).

</domain>

<decisions>
## Implementation Decisions

### Test Device & Setup
- Target: 2019-era mid-range Android (Snapdragon 665 class, 3-4GB RAM)
- Profiling via USB debugging with Chrome DevTools (chrome://inspect) for most accurate CPU profiling
- Document profiling results in the phase directory (summary of key metrics: % frame drop, device specs, screenshots)
- iOS Safari: quick sanity check while profiling Android, but not the primary target

### Profiling Scenario
- Primary target: Sight Reading game (most complex — VexFlow rendering + mic detection + scoring simultaneously)
- Secondary: Notes Recognition (isolates audio processing cost without VexFlow overhead)
- Duration: Full exercise session (10 questions) to capture steady-state and transitions
- Include bass clef notes (A2-E4) — lower frequencies stress the 4096-sample FFT more (worst case)
- Metrics: Frame rate is primary (per PERF-01); battery impact is secondary observation

### No-Issue Outcome
- If <5% frame drop: close phase with PERF-01 delivered, no AudioWorklet built
- Capture any obvious low-hanging optimizations found during profiling (Claude's discretion on scope)
- v1.7 milestone closure: address outstanding open items (Phase 07 human verification, Phase 08 count-in stall) before marking v1.7 as shipped
- No ongoing performance monitoring added — one-time gate check; re-profile if users report issues

### AudioWorklet Scope (Conditional — only if >5% frame drop)
- Move pitchy McLeod Pitch Method off main thread; FSM stays on main thread via postMessage (simpler, fewer cross-thread state issues)
- Ring buffer: hardcoded 2048 samples per PERF-03 spec (128-frame quanta accumulation)
- Browser fallback: Claude's discretion based on AudioWorklet browser support data
- No automated performance regression tests — manual profiling sufficient for conditional feature

### Claude's Discretion
- Exact profiling methodology (Performance tab vs Timeline vs custom marks)
- Whether to capture flame charts, summary stats, or both
- Any quick optimizations found during profiling (e.g., reducing rAF rate, Float32Array pooling)
- Browser fallback strategy if AudioWorklet is built
- Whether to add dev-only FPS counter for future debugging

</decisions>

<specifics>
## Specific Ideas

- Phase is explicitly profiling-gated: the decision to build AudioWorklet must be data-driven, not speculative
- PERF-02 and PERF-03 are conditional on PERF-01 profiling result — if no frame drop, phase closes quickly
- v1.7 has open items beyond Phase 10 (Phase 07 human verification, Phase 08 UAT blocker) that affect milestone closure

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `usePitchDetection.js`: Main thread pitch detection loop using `requestAnimationFrame` — the code that would move to AudioWorklet if needed
- `useMicNoteInput.js`: FSM (IDLE/ARMED/ACTIVE) that consumes pitch events — stays on main thread regardless
- `AudioContextProvider.jsx`: Shared AudioContext management — would need to create AudioWorklet node if migration happens
- `micInputPresets.js`: BPM-adaptive timing parameters — unaffected by worklet migration

### Established Patterns
- `requestAnimationFrame` detect loop in `usePitchDetection.js` (lines 284-323): reads Float32Array(4096), computes RMS, runs pitchy `findPitch()`
- Shared analyser mode (Mode A) vs self-created mode (Mode B) — AudioWorklet would only affect Mode A path
- pitchy `PitchDetector.forFloat32Array(fftSize)` creates detector once, reused every frame

### Integration Points
- `AudioContextProvider.requestMic()` creates the AnalyserNode and audio chain — AudioWorklet node would be created here
- `usePitchDetection.startListening()` sets up the detect loop — would switch from rAF to worklet message listener
- All three game components (SightReadingGame, NotesRecognitionGame, MetronomeTrainer) consume `useMicNoteInput` — transparent to worklet migration

</code_context>

<deferred>
## Deferred Ideas

- Cents deviation display (FEED-01) — future requirement, hooks already emit raw frequency
- Device calibration wizard (FEED-02) — future requirement
- Multi-algorithm consensus (ADV-01) — future requirement
- Dev-only performance monitoring overlay — may add if profiling reveals need

</deferred>

---

*Phase: 10-performance-profiling-gated*
*Context gathered: 2026-03-04*
