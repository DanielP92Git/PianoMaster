import { generatePatternData, inferClefForPitch } from "./patternBuilder";

describe("patternBuilder (noBeam tagging)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tags the eighth after dotted-quarter (6+2) with noBeam: true", async () => {
    // Force multi-beat pattern insertion
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "4/4",
      tempo: 80,
      selectedNotes: ["C4", "D4", "E4", "F4"],
      clef: "Treble",
      measuresPerPattern: 1,
      rhythmSettings: {
        allowRests: false,
        allowedNoteDurations: ["q", "8", "16"],
        allowedRestDurations: [],
        enabledComplexPatterns: ["dottedQuarterEighth"],
      },
      rhythmComplexity: "complex",
    });

    const notes = Array.isArray(result?.notes) ? result.notes : [];

    // Find at least one dotted-quarter event.
    const dottedQuarterIdx = notes.findIndex((n) => n?.notation === "dotted-quarter");
    expect(dottedQuarterIdx).toBeGreaterThanOrEqual(0);

    // The next event should be an eighth with noBeam true.
    const next = notes[dottedQuarterIdx + 1];
    expect(next?.notation).toBe("eighth");
    expect(next?.noBeam).toBe(true);
  });
});

describe("patternBuilder (multi-bar metadata)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves barIndex on notes when measuresPerPattern=2", async () => {
    // deterministic-ish
    vi.spyOn(Math, "random").mockReturnValue(0.2);

    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "4/4",
      tempo: 80,
      selectedNotes: ["C4", "D4", "E4", "F4"],
      clef: "Treble",
      measuresPerPattern: 2,
      rhythmSettings: {
        allowRests: false,
        allowedNoteDurations: ["q", "8", "16"],
        allowedRestDurations: [],
      },
      rhythmComplexity: "simple",
    });

    expect(result.measuresPerPattern).toBe(2);
    const barIndices = (result.notes || [])
      .filter((n) => n?.type === "note")
      .map((n) => n?.barIndex);

    expect(barIndices.some((b) => b === 0)).toBe(true);
    expect(barIndices.some((b) => b === 1)).toBe(true);
  });

  it.each([4, 8])(
    "preserves barIndex on notes when measuresPerPattern=%s",
    async (bars) => {
      vi.spyOn(Math, "random").mockReturnValue(0.2);

      const result = await generatePatternData({
        difficulty: "beginner",
        timeSignature: "4/4",
        tempo: 80,
        selectedNotes: ["C4", "D4", "E4", "F4"],
        clef: "Treble",
        measuresPerPattern: bars,
        rhythmSettings: {
          allowRests: false,
          allowedNoteDurations: ["q", "8", "16"],
          allowedRestDurations: [],
        },
        rhythmComplexity: "simple",
      });

      expect(result.measuresPerPattern).toBe(bars);

      const barIndices = (result.notes || [])
        .filter((n) => n?.type === "note")
        .map((n) => n?.barIndex)
        .filter((v) => typeof v === "number");

      expect(barIndices.length).toBeGreaterThan(0);
      expect(Math.min(...barIndices)).toBe(0);
      expect(Math.max(...barIndices)).toBe(bars - 1);
    }
  );
});

describe("inferClefForPitch (accidentals)", () => {
  it("returns 'treble' for F#4 (sharp, octave 4)", () => {
    expect(inferClefForPitch("F#4")).toBe("treble");
  });

  it("returns 'bass' for Bb3 (flat, octave 3)", () => {
    expect(inferClefForPitch("Bb3")).toBe("bass");
  });

  it("returns 'treble' for Eb5 (flat, octave 5)", () => {
    expect(inferClefForPitch("Eb5")).toBe("treble");
  });

  it("returns 'bass' for C#3 (sharp, octave 3)", () => {
    expect(inferClefForPitch("C#3")).toBe("bass");
  });

  it("returns 'treble' for C4 (natural, still works)", () => {
    expect(inferClefForPitch("C4")).toBe("treble");
  });

  it("returns 'treble' for null (null safety preserved)", () => {
    expect(inferClefForPitch(null)).toBe("treble");
  });

  it("returns 'treble' for undefined (null safety preserved)", () => {
    expect(inferClefForPitch(undefined)).toBe("treble");
  });
});

describe("toVexFlowNote (accidentals via generatePatternData)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps F#4 to vexflowNotes with keys=['f#/4'] (not c/4 fallback)", async () => {
    // Force a single note so all rhythm events get F#4
    vi.spyOn(Math, "random").mockReturnValue(0);

    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "4/4",
      tempo: 80,
      selectedNotes: ["F#4"],
      clef: "Treble",
      measuresPerPattern: 1,
      rhythmSettings: {
        allowRests: false,
        allowedNoteDurations: ["q"],
        allowedRestDurations: [],
      },
      rhythmComplexity: "simple",
    });

    const noteVexEntries = result.vexflowNotes.filter(
      (v) => !v.duration.endsWith("r")
    );
    expect(noteVexEntries.length).toBeGreaterThan(0);
    noteVexEntries.forEach((entry) => {
      expect(entry.keys[0]).toBe("f#/4");
    });
  });

  it("maps Bb3 to vexflowNotes with keys=['bb/3'] (not c/4 fallback)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "4/4",
      tempo: 80,
      selectedNotes: ["Bb3"],
      clef: "Bass",
      measuresPerPattern: 1,
      rhythmSettings: {
        allowRests: false,
        allowedNoteDurations: ["q"],
        allowedRestDurations: [],
      },
      rhythmComplexity: "simple",
    });

    const noteVexEntries = result.vexflowNotes.filter(
      (v) => !v.duration.endsWith("r")
    );
    expect(noteVexEntries.length).toBeGreaterThan(0);
    noteVexEntries.forEach((entry) => {
      expect(entry.keys[0]).toBe("bb/3");
    });
  });

  it("maps C4 to vexflowNotes with keys=['c/4'] (naturals still work)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "4/4",
      tempo: 80,
      selectedNotes: ["C4"],
      clef: "Treble",
      measuresPerPattern: 1,
      rhythmSettings: {
        allowRests: false,
        allowedNoteDurations: ["q"],
        allowedRestDurations: [],
      },
      rhythmComplexity: "simple",
    });

    const noteVexEntries = result.vexflowNotes.filter(
      (v) => !v.duration.endsWith("r")
    );
    expect(noteVexEntries.length).toBeGreaterThan(0);
    noteVexEntries.forEach((entry) => {
      expect(entry.keys[0]).toBe("c/4");
    });
  });
});
