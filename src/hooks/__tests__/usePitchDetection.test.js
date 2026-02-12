/**
 * Basic tests for usePitchDetection hook
 *
 * Note: These are smoke tests to verify the hook structure.
 * Full integration testing would require mocking Web Audio API and microphone.
 */

import { renderHook } from "@testing-library/react";
import { usePitchDetection } from "../usePitchDetection";

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
