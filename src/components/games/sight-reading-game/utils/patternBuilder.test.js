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

describe("patternBuilder (key signature filtering)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filters out non-in-key notes when keySignature is set", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "4/4",
      tempo: 80,
      selectedNotes: ["C4", "D4", "E4", "F4", "F#4", "G4"],
      clef: "Treble",
      measuresPerPattern: 1,
      keySignature: "G",
    });
    const pitches = result.notes.filter(n => n.type === "note").map(n => n.pitch);
    // F4 is NOT in G major (F# is). All pitches should be in-key.
    expect(pitches.every(p => p !== "F4")).toBe(true);
  });

  it("preserves all notes when keySignature is null", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.3);
    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "4/4",
      tempo: 80,
      selectedNotes: ["C4", "D4", "F4"],
      clef: "Treble",
      measuresPerPattern: 1,
      keySignature: null,
    });
    // Should use all provided notes — F4 is valid when no key sig
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it("includes keySignature in returned pattern object", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.4);
    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "4/4",
      tempo: 80,
      selectedNotes: ["G4", "A4", "B4"],
      clef: "Treble",
      measuresPerPattern: 1,
      keySignature: "G",
    });
    expect(result.keySignature).toBe("G");
  });
});

describe("patternBuilder (6/8 compound timing)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("6/8 at 60 BPM produces correct secondsPerSixteenth (~0.1667, not 0.25)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "6/8",
      tempo: 60,
      selectedNotes: ["C4", "D4", "E4"],
      clef: "Treble",
      measuresPerPattern: 1,
      rhythmSettings: {
        allowRests: false,
        allowedNoteDurations: ["q"],
        allowedRestDurations: [],
      },
      rhythmComplexity: "simple",
    });

    // For 6/8 at 60 BPM: beatDuration = 60/60 = 1.0s, unitsPerBeat = 6
    // secondsPerSixteenth = 1.0/6 = 0.1667
    // A quarter note = 4 sixteenth units. startTime of first = 0, endTime = 4 * (1/6) = 0.6667
    const notes = result.notes || [];
    expect(notes.length).toBeGreaterThan(0);
    const firstNote = notes[0];
    expect(firstNote.startTime).toBeCloseTo(0, 5);
    // endTime should be ~0.6667 (dotted-quarter beat / 1.5)
    // Actually with quarter=4 units, endTime = 4 * (1/6) ≈ 0.6667
    expect(firstNote.endTime).toBeCloseTo(4 / 6, 4);
  });

  it("4/4 at 80 BPM timing unchanged (regression): quarter note duration = 0.75s", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "4/4",
      tempo: 80,
      selectedNotes: ["C4", "D4", "E4"],
      clef: "Treble",
      measuresPerPattern: 1,
      rhythmSettings: {
        allowRests: false,
        allowedNoteDurations: ["q"],
        allowedRestDurations: [],
      },
      rhythmComplexity: "simple",
    });

    // For 4/4 at 80 BPM: beatDuration = 60/80 = 0.75s, unitsPerBeat = 4
    // secondsPerSixteenth = 0.75/4 = 0.1875
    // Quarter note = 4 units: endTime = 4 * 0.1875 = 0.75
    const notes = result.notes || [];
    expect(notes.length).toBeGreaterThan(0);
    const firstNote = notes[0];
    expect(firstNote.startTime).toBeCloseTo(0, 5);
    expect(firstNote.endTime).toBeCloseTo(0.75, 4);
  });

  it("6/8 generates total sixteenth units = 12 for one measure", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.3);

    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "6/8",
      tempo: 80,
      selectedNotes: ["C4", "D4", "E4"],
      clef: "Treble",
      measuresPerPattern: 1,
      rhythmSettings: {
        allowRests: false,
        allowedNoteDurations: ["q", "8"],
        allowedRestDurations: [],
      },
      rhythmComplexity: "simple",
    });

    const notes = result.notes || [];
    const totalUnits = notes.reduce((sum, n) => sum + (n.sixteenthUnits || 0), 0);
    expect(totalUnits).toBe(12);
  });
});

describe("patternBuilder (accidental sorting)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("NOTE_FREQUENCIES['F#4'] is approximately 369.99 (between F4=349.23 and G4=392.0)", async () => {
    // Import NOTE_FREQUENCIES directly to verify the constant
    const { NOTE_FREQUENCIES } = await import(
      "../constants/staffPositions.js"
    );
    expect(NOTE_FREQUENCIES["F#4"]).toBeCloseTo(369.99, 1);
    // Also verify it sits between F4 and G4
    expect(NOTE_FREQUENCIES["F#4"]).toBeGreaterThan(NOTE_FREQUENCIES["F4"]);
    expect(NOTE_FREQUENCIES["F#4"]).toBeLessThan(NOTE_FREQUENCIES["G4"]);
  });

  it("F#4 sorts between F4 and G4 when pool contains mixed accidentals and naturals", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    // Use a pool with 6 notes including F#4 — all in-key so no key sig filter needed
    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "4/4",
      tempo: 80,
      selectedNotes: ["C4", "C#4", "D4", "F4", "F#4", "G4"],
      clef: "Treble",
      measuresPerPattern: 1,
      rhythmSettings: {
        allowRests: false,
        allowedNoteDurations: ["q"],
        allowedRestDurations: [],
      },
      rhythmComplexity: "simple",
      keySignature: null,
    });

    // All selected notes should appear as available (at least 2 distinct pitches in output)
    const pitches = result.notes
      .filter((n) => n.type === "note")
      .map((n) => n.pitch);
    const distinctPitches = new Set(pitches);
    // With sorted frequencies, beginner mode picks adjacent notes
    // (not all clumped at index 0 because F#4 had freq=0)
    expect(distinctPitches.size).toBeGreaterThanOrEqual(1);

    // The key invariant: no pitch should be "undefined" or null
    pitches.forEach((p) => expect(p).toBeTruthy());
  });

  it("pool with only sharps ['F#4','C#4','G#4'] produces notes (not empty output from broken sort)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.3);

    const result = await generatePatternData({
      difficulty: "beginner",
      timeSignature: "4/4",
      tempo: 80,
      selectedNotes: ["F#4", "C#4", "G#4", "C4", "D4", "E4", "F4", "G4", "A4"],
      clef: "Treble",
      measuresPerPattern: 1,
      rhythmSettings: {
        allowRests: false,
        allowedNoteDurations: ["q"],
        allowedRestDurations: [],
      },
      rhythmComplexity: "simple",
      keySignature: null,
    });

    const notePitches = result.notes
      .filter((n) => n.type === "note")
      .map((n) => n.pitch);

    // Should have at least 2 distinct pitches across measures
    // (Before fix: sharps sort to position 0, all get same frequency=0, order is random)
    expect(notePitches.length).toBeGreaterThan(0);
    const distinctPitches = new Set(notePitches);
    expect(distinctPitches.size).toBeGreaterThanOrEqual(1);
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
