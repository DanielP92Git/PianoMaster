import { act, renderHook } from "@testing-library/react";
import { useReviewDrill } from "./useReviewDrill";

const patternNotes = [
  { type: "note", pitch: "C4" },
  { type: "note", pitch: "D4" },
  { type: "note", pitch: "C#4" }, // mic reports sharp-form even for a written Db4 target
  { type: "note", pitch: "E4" },
];

const performanceResultsAllWrong = [
  { noteIndex: 0, timingStatus: "wrong_pitch", expected: "C4" },
  { noteIndex: 1, timingStatus: "missed", expected: "D4" },
  { noteIndex: 2, timingStatus: "missed", expected: "C#4" },
];

const performanceResultsMixed = [
  { noteIndex: 0, timingStatus: "perfect", expected: "C4" },
  { noteIndex: 1, timingStatus: "early", expected: "D4" },
  { noteIndex: 2, timingStatus: "wrong_pitch", expected: "C#4" },
  { noteIndex: 3, timingStatus: "late", expected: "E4" },
];

describe("useReviewDrill", () => {
  test("mistake list filters to only missed + wrong_pitch (excludes early/late/perfect)", () => {
    const { result } = renderHook(() =>
      useReviewDrill({
        performanceResults: performanceResultsMixed,
        patternNotes,
      })
    );

    expect(result.current.total).toBe(1);
    expect(result.current.mistakes).toHaveLength(1);
    expect(result.current.mistakes[0].noteIndex).toBe(2);
    expect(result.current.currentTarget?.pitch).toBe("C#4");
  });

  test("zero mistakes -> mistake list empty, isComplete/idle immediately", () => {
    const performanceResultsAllPerfect = [
      { noteIndex: 0, timingStatus: "perfect", expected: "C4" },
      { noteIndex: 1, timingStatus: "good", expected: "D4" },
    ];

    const { result } = renderHook(() =>
      useReviewDrill({
        performanceResults: performanceResultsAllPerfect,
        patternNotes,
      })
    );

    expect(result.current.mistakes).toHaveLength(0);
    expect(result.current.isIdleEmpty).toBe(true);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.currentTarget).toBeNull();
  });

  test("handlePitch advances on an enharmonic-correct match (target C#4 advanced by Db4)", () => {
    const { result } = renderHook(() =>
      useReviewDrill({
        performanceResults: performanceResultsAllWrong,
        patternNotes,
      })
    );

    expect(result.current.currentTarget?.pitch).toBe("C4");

    act(() => {
      result.current.handlePitch("C4");
    });
    expect(result.current.currentTarget?.pitch).toBe("D4");

    act(() => {
      result.current.handlePitch("D4");
    });
    expect(result.current.currentTarget?.pitch).toBe("C#4");

    // Db4 is enharmonically equivalent to C#4 (both MIDI 61) — must advance.
    act(() => {
      result.current.handlePitch("Db4");
    });
    expect(result.current.isComplete).toBe(true);
    expect(result.current.currentTarget).toBeNull();
  });

  test("handlePitch with a non-matching pitch does NOT advance", () => {
    const { result } = renderHook(() =>
      useReviewDrill({
        performanceResults: performanceResultsAllWrong,
        patternNotes,
      })
    );

    expect(result.current.currentTarget?.pitch).toBe("C4");

    act(() => {
      result.current.handlePitch("G4");
    });

    expect(result.current.currentTarget?.pitch).toBe("C4");
    expect(result.current.isComplete).toBe(false);
  });

  test("after the last mistake is matched, the drill reports done", () => {
    const singleMistake = [
      { noteIndex: 0, timingStatus: "missed", expected: "C4" },
    ];

    const { result } = renderHook(() =>
      useReviewDrill({
        performanceResults: singleMistake,
        patternNotes,
      })
    );

    act(() => {
      result.current.handlePitch("C4");
    });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.currentTarget).toBeNull();
  });

  test("skip() advances past the current target without a match", () => {
    const { result } = renderHook(() =>
      useReviewDrill({
        performanceResults: performanceResultsAllWrong,
        patternNotes,
      })
    );

    expect(result.current.currentTarget?.pitch).toBe("C4");

    act(() => {
      result.current.skip();
    });
    expect(result.current.currentTarget?.pitch).toBe("D4");

    act(() => {
      result.current.skip();
    });
    expect(result.current.currentTarget?.pitch).toBe("C#4");

    act(() => {
      result.current.skip();
    });
    expect(result.current.isComplete).toBe(true);
  });

  test("playCurrentTarget calls the injected playTargetPitch callback with the current pitch", () => {
    const playTargetPitch = vi.fn();
    const { result } = renderHook(() =>
      useReviewDrill({
        performanceResults: performanceResultsAllWrong,
        patternNotes,
        playTargetPitch,
      })
    );

    act(() => {
      result.current.playCurrentTarget();
    });

    expect(playTargetPitch).toHaveBeenCalledWith("C4");
  });

  test("hook never touches combo/on-fire — no combo-related keys on the returned API", () => {
    const { result } = renderHook(() =>
      useReviewDrill({
        performanceResults: performanceResultsAllWrong,
        patternNotes,
      })
    );

    expect(result.current).not.toHaveProperty("incrementCombo");
    expect(result.current).not.toHaveProperty("resetCombo");
    expect(result.current).not.toHaveProperty("combo");
    expect(result.current).not.toHaveProperty("isOnFire");
  });

  test("start()/reset() reinitialize index to 0 and isComplete false", () => {
    const { result } = renderHook(() =>
      useReviewDrill({
        performanceResults: performanceResultsAllWrong,
        patternNotes,
      })
    );

    act(() => {
      result.current.skip();
      result.current.skip();
      result.current.skip();
    });
    expect(result.current.isComplete).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.isComplete).toBe(false);
    expect(result.current.currentMistakeIndex).toBe(0);
    expect(result.current.currentTarget?.pitch).toBe("C4");
  });
});
