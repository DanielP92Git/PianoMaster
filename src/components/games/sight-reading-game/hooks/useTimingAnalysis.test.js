import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTimingAnalysis } from "./useTimingAnalysis";
import { GRADING_MODES } from "../constants/gradingModes";

// Helper: build a single-note pattern with an explicit duration (seconds).
function singleNotePattern(durationSeconds, { startTime = 0 } = {}) {
  return {
    notes: [
      {
        pitch: "c/4",
        type: "note",
        startTime,
        duration: durationSeconds,
      },
    ],
  };
}

describe("useTimingAnalysis - mode awareness", () => {
  it("Test mode (default, no mode passed) output is unchanged for a given tempo", () => {
    const { result } = renderHook(() => useTimingAnalysis({ tempo: 80 }));
    const pattern = singleNotePattern(0.75); // 750ms note (quarter at 80bpm-ish)
    const windows = result.current.buildTimingWindows(pattern);
    const win = windows[0];
    // durationMs = 750; scaledLate = min(300, 750*0.6=450) = 300
    // earlyAllowance (first playable) = TIMING_TOLERANCES.firstNoteEarly = 500
    expect(win.windowEnd).toBeCloseTo(win.endMs + 300, 5);
    expect(win.windowStart).toBeCloseTo(win.startMs - 500, 5);

    // status thresholds unchanged: 150ms diff is "good" (>100, <=200) in Test
    const evalResult = result.current.evaluateTiming(150);
    expect(evalResult.status).toBe("good");
  });

  it("explicit Test mode matches default (byte-for-byte)", () => {
    const { result: defaultResult } = renderHook(() =>
      useTimingAnalysis({ tempo: 80 })
    );
    const { result: explicitTestResult } = renderHook(() =>
      useTimingAnalysis({ tempo: 80, mode: GRADING_MODES.TEST })
    );
    const pattern = singleNotePattern(0.75);
    const winA = defaultResult.current.buildTimingWindows(pattern)[0];
    const winB = explicitTestResult.current.buildTimingWindows(pattern)[0];
    expect(winB.windowEnd).toBe(winA.windowEnd);
    expect(winB.windowStart).toBe(winA.windowStart);
  });

  it("Practice mode widens the late window at a SLOW tempo where the constant (not the clamp) binds", () => {
    // At tempo=60, quarter=1000ms -> durationMs large enough that constant binds, not clamp.
    const { result } = renderHook(() =>
      useTimingAnalysis({ tempo: 60, mode: GRADING_MODES.PRACTICE })
    );
    const pattern = singleNotePattern(1.0); // 1000ms note
    const win = result.current.buildTimingWindows(pattern)[0];
    // Practice: effectiveLate = 300*2 = 600; lateClampFraction = 0.85 -> durationMs*0.85 = 850
    // scaledLate = min(600, 850) = 600 (constant binds, not the clamp)
    expect(win.windowEnd).toBeCloseTo(win.endMs + 600, 5);
  });

  it("Practice mode widens the clamp-bound case at a FAST tempo (Pitfall 5): practice window > test window", () => {
    // Fast tempo, short eighth-note duration (~250ms) so the duration-fraction clamp binds
    // before the base constant in BOTH modes.
    const durationSeconds = 0.25; // 250ms eighth note at ~120bpm
    const pattern = singleNotePattern(durationSeconds);

    const { result: testResult } = renderHook(() =>
      useTimingAnalysis({ tempo: 120, mode: GRADING_MODES.TEST })
    );
    const { result: practiceResult } = renderHook(() =>
      useTimingAnalysis({ tempo: 120, mode: GRADING_MODES.PRACTICE })
    );

    const testWin = testResult.current.buildTimingWindows(pattern)[0];
    const practiceWin = practiceResult.current.buildTimingWindows(pattern)[0];

    // Test: scaledLate = min(300, 250*0.6=150) = 150 (clamp binds)
    // Practice: scaledLate = min(600, 250*0.85=212.5) = 212.5 (clamp binds, but wider clamp)
    expect(practiceWin.windowEnd).toBeGreaterThan(testWin.windowEnd);
    expect(practiceWin.windowEnd - practiceWin.endMs).toBeCloseTo(212.5, 5);
    expect(testWin.windowEnd - testWin.endMs).toBeCloseTo(150, 5);
  });

  it("Practice mode scales status thresholds - 150ms is 'good' in Test but 'perfect' in Practice", () => {
    const { result: testResult } = renderHook(() =>
      useTimingAnalysis({ tempo: 80, mode: GRADING_MODES.TEST })
    );
    const { result: practiceResult } = renderHook(() =>
      useTimingAnalysis({ tempo: 80, mode: GRADING_MODES.PRACTICE })
    );

    expect(testResult.current.evaluateTiming(150).status).toBe("good");
    expect(practiceResult.current.evaluateTiming(150).status).toBe("perfect");
  });
});
