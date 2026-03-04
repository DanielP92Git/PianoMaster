# PERF-01 Profiling Results

**Status: PASS — AudioWorklet migration NOT required**
**Date: 2026-03-04**

---

## Device Information

| Field | Value |
|-------|-------|
| Device | Google Pixel 6 |
| Chip | Google Tensor |
| OS | Android |
| Browser | Chrome 145.0.7632.120 |

---

## Profiling Method

USB debugging with Chrome DevTools remote inspection via `chrome://inspect#devices`.
Screencast disabled during recording to avoid artificial FPS depression.

---

## Test Scenario

| Field | Value |
|-------|-------|
| Game | Sight Reading (primary target — VexFlow + mic + scoring) |
| Clef | Bass clef |
| Note Range | A2–E4 |
| Session Length | Full 10-question exercise session |

---

## Results

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| FPS range (active mic detection) | ~85–95 fps | >= 57 fps | PASS |
| Frame time range | 10.5–11.7 ms | — | PASS |
| Red bars in FPS chart during detection | None | None | PASS |
| Scripting (% of 208 ms sample) | ~4.3% (9 ms / 208 ms) | < 5% | PASS |
| 1st party main thread time | 4.1 ms | — | — |
| Rendering | 8 ms | — | — |
| Painting | 6 ms | — | — |
| System | 9 ms | — | — |
| findPitch visibility in Timings track | Not individually visible at this zoom | < 3 ms each | Below noise floor — PASS |

**Frame spikes observed:**
- One 33.2 ms frame spike
- One 476.5 ms frame spike

Both spikes occurred **during VexFlow re-renders between exercises**, NOT during active mic detection. These are unrelated to the pitch detection path.

**WebAudio Render Capacity:** Not captured (not needed given overall pass).

---

## Decision

**PASS — No AudioWorklet migration needed.**

The pitch detection loop (findPitch + getAudioData) runs comfortably within the available frame budget on a mid-range Android device:
- FPS is 85–95 fps during active mic detection (significantly above the 57 fps minimum)
- Scripting is 4.3% of frame budget (below the 5% threshold)
- No frame drops attributable to the audio path were observed
- The `findPitch` segments did not appear individually in the Timings track, confirming sub-noise-floor execution time

---

## Secondary Observations

**VexFlow render hotspot:** Frame spikes (33.2 ms and 476.5 ms) correlate with VexFlow re-renders between exercises. These are not blocking and not related to the audio pipeline. Noted for future optimization consideration.

**No immediate action recommended.** These spikes occur at exercise boundaries (not during active play) and do not affect the user-facing experience during active note recognition.

---

## PERF-01 Closure

- **PERF-01:** COMPLETE — data-driven decision recorded, no frame drop found
- **PERF-02 (AudioWorklet off-main-thread):** NOT APPLICABLE — no frame drop observed
- **PERF-03 (AudioWorklet integration tests):** NOT APPLICABLE — no frame drop observed
- **Plan 10-02 (AudioWorklet migration):** SKIPPED — profiling gate passed
- **Phase 10 closes with only Plan 01 delivered**
