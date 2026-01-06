import { generatePatternData } from "./patternBuilder";

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

