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

// Helper: build a two-note pattern so the SECOND note's window exercises the
// non-first-playable early-clamp branch (buildTimingWindows treats index 0 specially via
// TIMING_TOLERANCES.firstNoteEarly, bypassing the duration-fraction clamp entirely).
function twoNotePattern(durationSeconds) {
  return {
    notes: [
      {
        pitch: "c/4",
        type: "note",
        startTime: 0,
        duration: durationSeconds,
      },
      {
        pitch: "d/4",
        type: "note",
        startTime: durationSeconds,
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

describe("useTimingAnalysis - tempo-extreme coverage at 1.25x base (Phase 03 ADAPT-01/02, Pitfall 5)", () => {
  // Top of the D-06 adaptive tempo envelope: BASE_TEMPO_CLAMP_MAX_FRACTION = 1.25, applied to
  // a representative node base tempo of 80 -> 100 BPM. At 100 BPM the fastest common note
  // duration (an eighth note, half a beat = 300ms) is short enough that the duration-fraction
  // clamp binds ahead of the raw tolerance constants in BOTH grading modes (Pitfall 5) —
  // exactly the scenario that must stay usable (non-degenerate) at escalated tempo.
  const baseTempo = 80;
  const fastTempo = baseTempo * 1.25; // 100 BPM
  const beatMs = (60 / fastTempo) * 1000; // 600ms
  const eighthNoteSeconds = beatMs / 1000 / 2; // 0.3s — fastest common note duration at this tempo

  it("TEST mode: late + early windows stay positive and non-degenerate at 100 BPM (eighth notes)", () => {
    const { result } = renderHook(() =>
      useTimingAnalysis({ tempo: fastTempo, mode: GRADING_MODES.TEST })
    );
    const pattern = twoNotePattern(eighthNoteSeconds);
    const windows = result.current.buildTimingWindows(pattern);
    // Second note: not first-playable, so earlyAllowance goes through the duration-fraction
    // clamp (min(effectiveEarly, durationMs * earlyClampFraction)) — the Pitfall 5 path.
    const win = windows[1];

    const lateWindowMs = win.windowEnd - win.endMs;
    const earlyWindowMs = win.startMs - win.windowStart;

    // Test: scaledLate = min(300, 300*0.6=180) = 180; earlyAllowance = min(200, 300*0.5=150) = 150.
    expect(lateWindowMs).toBeCloseTo(180, 5);
    expect(earlyWindowMs).toBeCloseTo(150, 5);
    expect(lateWindowMs).toBeGreaterThan(0);
    expect(earlyWindowMs).toBeGreaterThan(0);
  });

  it("PRACTICE mode: late + early windows stay positive, non-degenerate, and wider than Test at 100 BPM (eighth notes)", () => {
    const { result: testResult } = renderHook(() =>
      useTimingAnalysis({ tempo: fastTempo, mode: GRADING_MODES.TEST })
    );
    const { result: practiceResult } = renderHook(() =>
      useTimingAnalysis({ tempo: fastTempo, mode: GRADING_MODES.PRACTICE })
    );
    const pattern = twoNotePattern(eighthNoteSeconds);
    const testWin = testResult.current.buildTimingWindows(pattern)[1];
    const practiceWin = practiceResult.current.buildTimingWindows(pattern)[1];

    const practiceLateMs = practiceWin.windowEnd - practiceWin.endMs;
    const practiceEarlyMs = practiceWin.startMs - practiceWin.windowStart;

    // Practice: scaledLate = min(600, 300*0.85=255) = 255; earlyAllowance = min(400, 300*0.75=225) = 225.
    expect(practiceLateMs).toBeCloseTo(255, 5);
    expect(practiceEarlyMs).toBeCloseTo(225, 5);
    expect(practiceLateMs).toBeGreaterThan(0);
    expect(practiceEarlyMs).toBeGreaterThan(0);

    // Practice must stay strictly wider than Test at this same escalated tempo — the whole
    // point of the leniency mode remains usable, not clamped down to (or below) Test width.
    expect(practiceWin.windowEnd).toBeGreaterThan(testWin.windowEnd);
    expect(practiceWin.windowStart).toBeLessThan(testWin.windowStart);
  });
});
