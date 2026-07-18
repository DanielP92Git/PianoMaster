import { describe, it, expect } from "vitest";
import { buildPlayedRendition } from "./comparisonPattern";
import { NOTE_FREQUENCIES } from "../constants/staffPositions";

describe("buildPlayedRendition", () => {
  it("returns an empty array for empty performanceResults", () => {
    const patternNotes = [
      { type: "note", pitch: "C4", startTime: 0, endTime: 0.5 },
    ];
    expect(buildPlayedRendition(patternNotes, [])).toEqual([]);
  });

  it("returns an empty array when both inputs are empty/undefined", () => {
    expect(buildPlayedRendition([], [])).toEqual([]);
    expect(buildPlayedRendition(undefined, undefined)).toEqual([]);
  });

  it("includes a correct note offset by its real timeDiff, at the expected pitch's Hz", () => {
    const patternNotes = [
      { type: "note", pitch: "C4", startTime: 0, endTime: 0.5 },
    ];
    const performanceResults = [
      {
        noteIndex: 0,
        expected: "C4",
        detected: "C4",
        isCorrect: true,
        timingStatus: "perfect",
        timeDiff: 50, // ms
      },
    ];

    const result = buildPlayedRendition(patternNotes, performanceResults);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "note",
      noteIndex: 0,
      frequency: NOTE_FREQUENCIES.C4,
    });
    // 0 + 50/1000 = 0.05
    expect(result[0].startTime).toBeCloseTo(0.05);
    expect(result[0].endTime).toBeCloseTo(0.55);
  });

  it("includes a wrong-pitch note at the expected slot, using the DETECTED pitch's Hz", () => {
    const patternNotes = [
      { type: "note", pitch: "C4", startTime: 1, endTime: 1.5 },
    ];
    const performanceResults = [
      {
        noteIndex: 0,
        expected: "C4",
        detected: "F#4",
        isCorrect: false,
        timingStatus: "wrong_pitch",
        timeDiff: 0,
      },
    ];

    const result = buildPlayedRendition(patternNotes, performanceResults);

    expect(result).toHaveLength(1);
    expect(result[0].frequency).toBe(NOTE_FREQUENCIES["F#4"]);
    expect(result[0].startTime).toBeCloseTo(1);
    expect(result[0].noteIndex).toBe(0);
  });

  it("omits a missed note entirely (silence)", () => {
    const patternNotes = [
      { type: "note", pitch: "C4", startTime: 0, endTime: 0.5 },
      { type: "note", pitch: "D4", startTime: 0.5, endTime: 1.0 },
    ];
    const performanceResults = [
      {
        noteIndex: 0,
        expected: "C4",
        detected: null,
        isCorrect: false,
        timingStatus: "missed",
        timeDiff: 0,
      },
      {
        noteIndex: 1,
        expected: "D4",
        detected: "D4",
        isCorrect: true,
        timingStatus: "good",
        timeDiff: 20,
      },
    ];

    const result = buildPlayedRendition(patternNotes, performanceResults);

    expect(result).toHaveLength(1);
    expect(result[0].noteIndex).toBe(1);
  });

  it("skips rests (ev.type !== 'note')", () => {
    const patternNotes = [
      { type: "rest", startTime: 0, endTime: 0.5 },
      { type: "note", pitch: "C4", startTime: 0.5, endTime: 1.0 },
    ];
    const performanceResults = [
      {
        noteIndex: 1,
        expected: "C4",
        detected: "C4",
        isCorrect: true,
        timingStatus: "perfect",
        timeDiff: 0,
      },
    ];

    const result = buildPlayedRendition(patternNotes, performanceResults);

    expect(result).toHaveLength(1);
    expect(result[0].noteIndex).toBe(1);
  });

  it("skips an unknown/unmappable pitch without crashing", () => {
    const patternNotes = [
      { type: "note", pitch: "C4", startTime: 0, endTime: 0.5 },
    ];
    const performanceResults = [
      {
        noteIndex: 0,
        expected: "C4",
        detected: "Z9", // not in NOTE_FREQUENCIES
        isCorrect: false,
        timingStatus: "wrong_pitch",
        timeDiff: 0,
      },
    ];

    expect(() =>
      buildPlayedRendition(patternNotes, performanceResults)
    ).not.toThrow();
    expect(buildPlayedRendition(patternNotes, performanceResults)).toEqual([]);
  });

  it("carries the original pattern noteIndex on every returned object", () => {
    const patternNotes = [
      { type: "note", pitch: "C4", startTime: 0, endTime: 0.5 },
      { type: "note", pitch: "D4", startTime: 0.5, endTime: 1.0 },
      { type: "note", pitch: "E4", startTime: 1.0, endTime: 1.5 },
    ];
    const performanceResults = [
      {
        noteIndex: 0,
        expected: "C4",
        detected: "C4",
        isCorrect: true,
        timingStatus: "perfect",
        timeDiff: 0,
      },
      {
        noteIndex: 2,
        expected: "E4",
        detected: "E4",
        isCorrect: true,
        timingStatus: "good",
        timeDiff: 0,
      },
    ];

    const result = buildPlayedRendition(patternNotes, performanceResults);

    expect(result.map((r) => r.noteIndex)).toEqual([0, 2]);
  });
});
