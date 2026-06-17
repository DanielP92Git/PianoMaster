/**
 * Basic tests for usePitchDetection hook
 *
 * Note: These are smoke tests to verify the hook structure.
 * Full integration testing would require mocking Web Audio API and microphone.
 */

import { renderHook, act } from "@testing-library/react";
import { usePitchDetection } from "../usePitchDetection";

/**
 * Build a mock shared AnalyserNode (Mode A) whose time-domain data is a pure
 * sine at `freq`. A pure sine has near-1 clarity regardless of amplitude, so
 * amplitude controls only the RMS level — exactly what we need to exercise the
 * RMS gate independently of the clarity gate. RMS of a sine = amplitude/√2.
 */
function makeSineAnalyser(
  amplitude,
  { freq = 262, sampleRate = 44100, fftSize = 2048 } = {}
) {
  return {
    fftSize,
    context: { sampleRate },
    getFloatTimeDomainData: (buf) => {
      for (let i = 0; i < buf.length; i++) {
        buf[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate);
      }
    },
  };
}

describe("usePitchDetection", () => {
  test("hook initializes with default values", () => {
    const { result } = renderHook(() => usePitchDetection());

    expect(result.current.detectedNote).toBeNull();
    expect(result.current.detectedFrequency).toBe(-1);
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.isListening).toBe(false);
    expect(typeof result.current.startListening).toBe("function");
    expect(typeof result.current.stopListening).toBe("function");
  });

  test("hook accepts custom configuration", () => {
    const mockCallback = vi.fn();
    const customFrequencies = { C4: 261.63 };

    const { result } = renderHook(() =>
      usePitchDetection({
        isActive: false,
        onPitchDetected: mockCallback,
        noteFrequencies: customFrequencies,
        rmsThreshold: 0.02,
        tolerance: 0.03,
      })
    );

    expect(result.current.isListening).toBe(false);
  });

  test("detectPitch function is available", () => {
    const { result } = renderHook(() => usePitchDetection());

    expect(typeof result.current.detectPitch).toBe("function");

    // Test with empty buffer (should return -1)
    const emptyBuffer = new Float32Array(1024).fill(0);
    const frequency = result.current.detectPitch(emptyBuffer, 44100);
    expect(frequency).toBe(-1);
  });

  test("frequencyToNote function is available", () => {
    // Use an explicit mapping so this test is not sensitive to the default
    // Hebrew+English note table ordering.
    const { result } = renderHook(() =>
      usePitchDetection({
        noteFrequencies: { C4: 261.63 },
        tolerance: 0.03,
      })
    );

    expect(typeof result.current.frequencyToNote).toBe("function");

    // Test with no frequency
    expect(result.current.frequencyToNote(-1)).toBeNull();
    expect(result.current.frequencyToNote(0)).toBeNull();

    // Test with valid C4 frequency (261.63 Hz)
    const note = result.current.frequencyToNote(262);
    expect(note).toBe("C4");
  });

  test("hook exposes advanced audio properties", () => {
    const { result } = renderHook(() => usePitchDetection());

    // These should be null when not listening
    expect(result.current.audioContext).toBeNull();
    expect(result.current.analyser).toBeNull();
  });
});

describe("usePitchDetection RMS/volume gate", () => {
  // Run the detect loop exactly once: stub rAF so it does not recurse.
  const origRaf = global.requestAnimationFrame;
  const origCaf = global.cancelAnimationFrame;
  beforeEach(() => {
    global.requestAnimationFrame = vi.fn(() => 1);
    global.cancelAnimationFrame = vi.fn();
  });
  afterEach(() => {
    global.requestAnimationFrame = origRaf;
    global.cancelAnimationFrame = origCaf;
  });

  const baseOpts = {
    noteFrequencies: { C4: 261.63 },
    tolerance: 0.05,
    rmsThreshold: 0.01,
  };

  test("low-volume input (below rmsThreshold) does NOT emit a pitch, but still reports level", async () => {
    const onPitchDetected = vi.fn();
    const onLevelChange = vi.fn();
    const { result } = renderHook(() =>
      usePitchDetection({ ...baseOpts, onPitchDetected, onLevelChange })
    );

    // amplitude 0.005 → RMS ≈ 0.0035 (< 0.01), but pure sine → high clarity.
    // This is the regression case: ambient noise must NOT be scored as a note.
    const analyser = makeSineAnalyser(0.005);
    await act(async () => {
      await result.current.startListening({
        analyserNode: analyser,
        sampleRate: 44100,
      });
    });

    expect(onLevelChange).toHaveBeenCalled();
    expect(onPitchDetected).not.toHaveBeenCalled();
  });

  test("above-threshold input DOES emit a pitch", async () => {
    const onPitchDetected = vi.fn();
    const onLevelChange = vi.fn();
    const { result } = renderHook(() =>
      usePitchDetection({ ...baseOpts, onPitchDetected, onLevelChange })
    );

    // amplitude 0.2 → RMS ≈ 0.14 (> 0.01) → real played note should register.
    const analyser = makeSineAnalyser(0.2);
    await act(async () => {
      await result.current.startListening({
        analyserNode: analyser,
        sampleRate: 44100,
      });
    });

    expect(onPitchDetected).toHaveBeenCalled();
    expect(onPitchDetected.mock.calls[0][0]).toBe("C4");
  });
});
