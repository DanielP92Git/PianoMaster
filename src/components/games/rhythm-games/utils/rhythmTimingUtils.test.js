import { describe, it, expect, vi } from "vitest";
import {
  calculateTimingThresholds,
  generateDistractors,
  schedulePatternPlayback,
  leadingRestOffset,
  anchorPatternToFirstTap,
} from "./rhythmTimingUtils";

describe("calculateTimingThresholds", () => {
  it("Test 6: calculateTimingThresholds(60) returns wider windows than calculateTimingThresholds(120)", () => {
    const slow = calculateTimingThresholds(60);
    const fast = calculateTimingThresholds(120);
    expect(slow.PERFECT).toBeGreaterThan(fast.PERFECT);
    expect(slow.GOOD).toBeGreaterThan(fast.GOOD);
    expect(slow.FAIR).toBeGreaterThan(fast.FAIR);
  });

  it("Test 7: calculateTimingThresholds returns PERFECT, GOOD, FAIR keys", () => {
    const thresholds = calculateTimingThresholds(60);
    expect(thresholds).toHaveProperty("PERFECT");
    expect(thresholds).toHaveProperty("GOOD");
    expect(thresholds).toHaveProperty("FAIR");
    // PERFECT should be a positive number
    expect(thresholds.PERFECT).toBeGreaterThan(0);
  });

  it("thresholds scale proportionally with tempo (120 BPM baseline)", () => {
    const baseline = calculateTimingThresholds(120);
    // PERFECT at 120 BPM should be the base value (50ms)
    expect(baseline.PERFECT).toBe(50);
  });
});

describe("generateDistractors", () => {
  const correctBeats = [
    { durationUnits: 4, isRest: false },
    { durationUnits: 4, isRest: false },
    { durationUnits: 4, isRest: false },
    { durationUnits: 4, isRest: false },
  ];

  it("Test 8: generateDistractors(correctBeats, 2) returns 2 distractor patterns", () => {
    const distractors = generateDistractors(correctBeats, 2);
    expect(distractors).toHaveLength(2);
  });

  it("Test 8b: each distractor differs from correct by at least 1 duration element", () => {
    const distractors = generateDistractors(correctBeats, 2);
    distractors.forEach((distractor) => {
      const hasDiff = distractor.some(
        (beat, i) =>
          beat.durationUnits !== correctBeats[i]?.durationUnits ||
          beat.isRest !== correctBeats[i]?.isRest
      );
      expect(hasDiff).toBe(true);
    });
  });

  it("Test 9: generateDistractors preserves total measure duration", () => {
    const totalCorrect = correctBeats.reduce(
      (sum, b) => sum + b.durationUnits,
      0
    );
    const distractors = generateDistractors(correctBeats, 2);
    distractors.forEach((distractor) => {
      const totalDistractor = distractor.reduce(
        (sum, b) => sum + b.durationUnits,
        0
      );
      expect(totalDistractor).toBe(totalCorrect);
    });
  });

  it("handles patterns with mixed durations", () => {
    const mixedBeats = [
      { durationUnits: 8, isRest: false },
      { durationUnits: 4, isRest: false },
      { durationUnits: 4, isRest: false },
    ];
    const distractors = generateDistractors(mixedBeats, 2);
    const totalCorrect = mixedBeats.reduce(
      (sum, b) => sum + b.durationUnits,
      0
    );
    distractors.forEach((distractor) => {
      const total = distractor.reduce((sum, b) => sum + b.durationUnits, 0);
      expect(total).toBe(totalCorrect);
    });
  });
});

describe("schedulePatternPlayback", () => {
  it("Test 10: schedulePatternPlayback returns an object with patternStartTime number", () => {
    const beats = [
      { durationUnits: 4, isRest: false },
      { durationUnits: 4, isRest: false },
    ];
    const mockAudioContext = { currentTime: 1.0 };
    const mockPlayNote = vi.fn();

    const result = schedulePatternPlayback(
      beats,
      120,
      mockAudioContext,
      mockPlayNote
    );
    expect(typeof result.startTime).toBe("number");
  });

  it("calls playNote for non-rest beats", () => {
    const beats = [
      { durationUnits: 4, isRest: false },
      { durationUnits: 4, isRest: true },
      { durationUnits: 4, isRest: false },
    ];
    const mockAudioContext = { currentTime: 0 };
    const mockPlayNote = vi.fn();

    schedulePatternPlayback(beats, 120, mockAudioContext, mockPlayNote);
    // 2 non-rest beats → 2 playNote calls
    expect(mockPlayNote).toHaveBeenCalledTimes(2);
  });

  it("does not call playNote for rest beats", () => {
    const beats = [
      { durationUnits: 4, isRest: true },
      { durationUnits: 4, isRest: true },
    ];
    const mockAudioContext = { currentTime: 0 };
    const mockPlayNote = vi.fn();

    schedulePatternPlayback(beats, 120, mockAudioContext, mockPlayNote);
    expect(mockPlayNote).not.toHaveBeenCalled();
  });
});

describe("leadingRestOffset", () => {
  it("is 0 when the pattern starts on a note", () => {
    const beats = [
      { durationUnits: 4, isRest: false },
      { durationUnits: 4, isRest: false },
    ];
    expect(leadingRestOffset(beats, 120)).toBe(0);
  });

  it("equals the leading rest duration in seconds (120 BPM, quarter rest = 0.5s)", () => {
    const beats = [
      { durationUnits: 4, isRest: true }, // quarter rest = 1 beat = 0.5s @120
      { durationUnits: 4, isRest: false },
    ];
    expect(leadingRestOffset(beats, 120)).toBeCloseTo(0.5, 5);
  });

  it("sums multiple leading rests but stops at the first note", () => {
    const beats = [
      { durationUnits: 4, isRest: true }, // 0.5s
      { durationUnits: 2, isRest: true }, // 0.25s
      { durationUnits: 4, isRest: false },
      { durationUnits: 4, isRest: true }, // trailing rest must NOT count
    ];
    expect(leadingRestOffset(beats, 120)).toBeCloseTo(0.75, 5);
  });
});

describe("anchorPatternToFirstTap", () => {
  it("maps the first tap to the first note when the pattern starts on a note", () => {
    const beats = [
      { durationUnits: 4, isRest: false },
      { durationUnits: 4, isRest: false },
    ];
    const { patternStartTime, times, totalDuration } = anchorPatternToFirstTap(
      beats,
      120,
      10
    );
    expect(patternStartTime).toBeCloseTo(10, 5); // no leading rest → start == tap
    expect(times[0]).toBeCloseTo(10, 5); // first tap IS the first note
    expect(times[1]).toBeCloseTo(10.5, 5); // second note one beat later
    expect(totalDuration).toBeCloseTo(1, 5);
  });

  it("rest-start: first tap still maps to the first SOUNDING note, not the silent downbeat", () => {
    const beats = [
      { durationUnits: 4, isRest: true }, // leading quarter rest
      { durationUnits: 4, isRest: false },
      { durationUnits: 4, isRest: false },
    ];
    const { patternStartTime, times } = anchorPatternToFirstTap(beats, 120, 10);
    // Implied downbeat sits 0.5s before the tap (the rest happened first)...
    expect(patternStartTime).toBeCloseTo(9.5, 5);
    // ...but the kid's first tap lands exactly on the first note.
    expect(times).toHaveLength(2);
    expect(times[0]).toBeCloseTo(10, 5);
    expect(times[1]).toBeCloseTo(10.5, 5);
  });

  it("excludes rest beats from the onset times array", () => {
    const beats = [
      { durationUnits: 4, isRest: false },
      { durationUnits: 4, isRest: true }, // middle rest
      { durationUnits: 4, isRest: false },
    ];
    const { times } = anchorPatternToFirstTap(beats, 120, 0);
    expect(times).toHaveLength(2);
    expect(times[0]).toBeCloseTo(0, 5);
    expect(times[1]).toBeCloseTo(1, 5); // skips the rest slot (2 beats later)
  });
});
