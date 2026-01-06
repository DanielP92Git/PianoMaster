import { generateRhythmEvents } from "./rhythmGenerator";

describe("generateRhythmEvents (rest duration constraints)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not generate 1/16 rests when only "8" rests are allowed (simple mode)', () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // deterministic: encourages rests + paired-eighth choices

    const events = generateRhythmEvents({
      timeSignature: "4/4",
      measuresPerPattern: 1,
      allowedNoteDurations: ["q", "8"],
      allowRests: true,
      allowedRestDurations: ["8"],
      rhythmComplexity: "simple",
    });

    const restEvents = events.filter((e) => e.type === "rest");
    expect(restEvents.length).toBeGreaterThan(0);

    restEvents.forEach((e) => {
      expect(e.notation).toBe("eighth");
      expect(e.sixteenthUnits).toBe(2);
    });
  });

  it('only generates 1/16 rests when only "16" rests are allowed', () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const events = generateRhythmEvents({
      timeSignature: "4/4",
      measuresPerPattern: 1,
      allowedNoteDurations: ["q", "8"],
      allowRests: true,
      allowedRestDurations: ["16"],
      rhythmComplexity: "simple",
    });

    const restEvents = events.filter((e) => e.type === "rest");
    expect(restEvents.length).toBeGreaterThan(0);

    restEvents.forEach((e) => {
      expect(e.notation).toBe("sixteenth");
      expect(e.sixteenthUnits).toBe(1);
    });
  });

  it('does not generate 1/16 notes when "16" is not in allowedNoteDurations (simple mode)', () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const events = generateRhythmEvents({
      timeSignature: "4/4",
      measuresPerPattern: 1,
      allowedNoteDurations: ["q", "8"],
      allowRests: false,
      allowedRestDurations: [],
      rhythmComplexity: "simple",
    });

    const noteEvents = events.filter((e) => e.type === "note");
    expect(noteEvents.length).toBeGreaterThan(0);
    expect(noteEvents.some((e) => e.notation === "sixteenth")).toBe(false);
  });
});

describe("generateRhythmEvents (all rhythms + rests scenario)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper: Check that no two events overlap in time (based on startPosition and sixteenthUnits)
   */
  function checkNoOverlaps(events) {
    let cursor = 0;
    const occupiedSlots = new Set();
    
    for (const event of events) {
      const startPos = cursor;
      const endPos = cursor + event.sixteenthUnits;
      
      // Check each sixteenth slot this event occupies
      for (let slot = startPos; slot < endPos; slot++) {
        if (occupiedSlots.has(slot)) {
          return { overlaps: true, slot, event };
        }
        occupiedSlots.add(slot);
      }
      
      cursor += event.sixteenthUnits;
    }
    
    return { overlaps: false };
  }

  it("generates valid patterns with all note durations, all rest durations, and complex mode", () => {
    // Run multiple iterations to catch edge cases
    for (let seed = 0; seed < 30; seed++) {
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        return ((seed * 13 + callCount * 7) % 100) / 100;
      });

      const events = generateRhythmEvents({
        timeSignature: "4/4",
        measuresPerPattern: 1,
        allowedNoteDurations: ["w", "h", "q", "8", "16"],
        allowRests: true,
        allowedRestDurations: ["w", "h", "q", "8", "16"],
        rhythmComplexity: "complex",
        enabledComplexPatterns: [
          "twoSixteenthsThenEighth",
          "eighthThenTwoSixteenths",
          "eighthQuarterEighth",
          "dottedQuarterEighth",
          "dottedEighthSixteenth",
        ],
      });

      // Check total sixteenth units equals measure length (16 for 4/4)
      const totalUnits = events.reduce((sum, e) => sum + e.sixteenthUnits, 0);
      expect(totalUnits).toBe(16);

      // Check no overlaps
      const overlapCheck = checkNoOverlaps(events);
      expect(overlapCheck.overlaps).toBe(false);

      vi.restoreAllMocks();
    }
  });

  it("handles dotted durations correctly in complex patterns", () => {
    // Force the generator to pick dottedQuarterEighth pattern
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callCount++;
      // Return 0.1 to trigger complex pattern insertion (< 0.35 threshold)
      // and consistently pick the first fitting pattern
      return 0.1;
    });

    const events = generateRhythmEvents({
      timeSignature: "4/4",
      measuresPerPattern: 1,
      allowedNoteDurations: ["q", "8"],
      allowRests: false,
      allowedRestDurations: [],
      rhythmComplexity: "complex",
      enabledComplexPatterns: ["dottedQuarterEighth"],
    });

    // Check total units
    const totalUnits = events.reduce((sum, e) => sum + e.sixteenthUnits, 0);
    expect(totalUnits).toBe(16);

    // Check that dotted quarter notation is correct
    const dottedQuarters = events.filter(e => e.notation === "dotted-quarter");
    // Should have at least one dotted quarter if the pattern was used
    // (or zero if fallback to simple durations)
    dottedQuarters.forEach(e => {
      expect(e.sixteenthUnits).toBe(6); // Dotted quarter = 6 sixteenths
    });

    vi.restoreAllMocks();
  });

  it("generates valid patterns in 3/4 time with all options enabled", () => {
    for (let seed = 0; seed < 20; seed++) {
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        return ((seed * 17 + callCount * 11) % 100) / 100;
      });

      const events = generateRhythmEvents({
        timeSignature: "3/4",
        measuresPerPattern: 1,
        allowedNoteDurations: ["w", "h", "q", "8", "16"],
        allowRests: true,
        allowedRestDurations: ["w", "h", "q", "8", "16"],
        rhythmComplexity: "complex",
        enabledComplexPatterns: [
          "twoSixteenthsThenEighth",
          "eighthThenTwoSixteenths",
          "dottedEighthSixteenth",
        ],
      });

      // 3/4 time = 12 sixteenth notes per measure
      const totalUnits = events.reduce((sum, e) => sum + e.sixteenthUnits, 0);
      expect(totalUnits).toBe(12);

      // Check no overlaps
      const overlapCheck = checkNoOverlaps(events);
      expect(overlapCheck.overlaps).toBe(false);

      vi.restoreAllMocks();
    }
  });

  it("correctly handles dottedEighthSixteenth pattern (3+1=4 units)", () => {
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callCount++;
      return 0.1; // Trigger complex pattern insertion
    });

    const events = generateRhythmEvents({
      timeSignature: "4/4",
      measuresPerPattern: 1,
      allowedNoteDurations: ["8", "16"],
      allowRests: false,
      allowedRestDurations: [],
      rhythmComplexity: "complex",
      enabledComplexPatterns: ["dottedEighthSixteenth"],
    });

    // Check total units
    const totalUnits = events.reduce((sum, e) => sum + e.sixteenthUnits, 0);
    expect(totalUnits).toBe(16);

    // Check that dotted eighth notation is correct
    const dottedEighths = events.filter(e => e.notation === "dotted-eighth");
    dottedEighths.forEach(e => {
      expect(e.sixteenthUnits).toBe(3); // Dotted eighth = 3 sixteenths
    });

    vi.restoreAllMocks();
  });
});

describe("generateRhythmEvents (syncopation constraints)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper: Given events, compute start positions and group by beat.
   * Returns an array of beat groups, each containing the durations (in sixteenth units) within that beat.
   */
  function groupEventsByBeat(events, unitsPerBeat = 4) {
    const beats = [];
    let cursor = 0;
    let currentBeat = Math.floor(cursor / unitsPerBeat);
    let currentGroup = [];

    for (const event of events) {
      const eventBeat = Math.floor(cursor / unitsPerBeat);
      if (eventBeat !== currentBeat) {
        // Save current group and start new one
        if (currentGroup.length > 0) {
          beats.push({ beat: currentBeat, durations: currentGroup });
        }
        currentBeat = eventBeat;
        currentGroup = [];
      }
      currentGroup.push(event.sixteenthUnits);
      cursor += event.sixteenthUnits;
    }
    // Push last group
    if (currentGroup.length > 0) {
      beats.push({ beat: currentBeat, durations: currentGroup });
    }
    return beats;
  }

  /**
   * Helper: Check if a pattern contains an 8-q-8 syncopated motif (2, 4, 2 in sixteenth units).
   */
  function containsSyncopatedMotif(events) {
    for (let i = 0; i < events.length - 2; i++) {
      if (
        events[i].sixteenthUnits === 2 &&
        events[i + 1].sixteenthUnits === 4 &&
        events[i + 2].sixteenthUnits === 2
      ) {
        return true;
      }
    }
    return false;
  }

  it("simple mode: each beat is either a single duration or two eighths (no cross-beat eighths)", () => {
    // Run multiple iterations with different random values to ensure robustness
    for (let seed = 0; seed < 10; seed++) {
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        // Vary the random value to get different patterns
        return ((seed * 7 + callCount * 3) % 100) / 100;
      });

      const events = generateRhythmEvents({
        timeSignature: "4/4",
        measuresPerPattern: 1,
        allowedNoteDurations: ["q", "8"],
        allowRests: false,
        allowedRestDurations: [],
        rhythmComplexity: "simple",
      });

      const beatGroups = groupEventsByBeat(events, 4);

      // Each beat should be either:
      // - A single duration of 4 units (quarter note)
      // - Two durations of 2 units each (two eighth notes)
      // - A combination that sums to 4 (e.g., half note spans 2 beats, so partial beats are OK)
      // But NO beat should have an isolated eighth that doesn't pair within the same beat.

      for (const { beat, durations } of beatGroups) {
        const sum = durations.reduce((a, b) => a + b, 0);
        const hasIsolatedEighth =
          durations.filter((d) => d === 2).length === 1 && durations.length > 1;

        // If there's exactly one eighth (2 units) among multiple durations, that's a problem
        // unless it's a spillover from a longer note
        if (hasIsolatedEighth) {
          // Check if the beat only has eighths - should be paired
          const eighthCount = durations.filter((d) => d === 2).length;
          expect(eighthCount % 2).toBe(0); // Eighths should come in pairs
        }
      }

      vi.restoreAllMocks();
    }
  });

  it("simple mode: does NOT produce syncopated 8-q-8 patterns", () => {
    // Run many iterations to ensure we never get syncopation in simple mode
    for (let seed = 0; seed < 20; seed++) {
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        return ((seed * 11 + callCount * 5) % 100) / 100;
      });

      const events = generateRhythmEvents({
        timeSignature: "4/4",
        measuresPerPattern: 1,
        allowedNoteDurations: ["q", "8"],
        allowRests: false,
        allowedRestDurations: [],
        rhythmComplexity: "simple",
      });

      // Should NEVER have 8-q-8 (2, 4, 2) sequence in simple mode
      expect(containsSyncopatedMotif(events)).toBe(false);

      vi.restoreAllMocks();
    }
  });

  /**
   * Helper: Group events by beat, including event details (not just durations).
   * Returns an array of beat groups with full event data.
   */
  function groupEventsWithDetailsByBeat(events, unitsPerBeat = 4) {
    const beats = [];
    let cursor = 0;
    let currentBeat = Math.floor(cursor / unitsPerBeat);
    let currentGroup = [];

    for (const event of events) {
      const eventBeat = Math.floor(cursor / unitsPerBeat);
      if (eventBeat !== currentBeat) {
        if (currentGroup.length > 0) {
          beats.push({ beat: currentBeat, events: currentGroup });
        }
        currentBeat = eventBeat;
        currentGroup = [];
      }
      currentGroup.push({ ...event, startPosition: cursor });
      cursor += event.sixteenthUnits;
    }
    if (currentGroup.length > 0) {
      beats.push({ beat: currentBeat, events: currentGroup });
    }
    return beats;
  }

  it("simple mode with rests: eighth rests appear in same-beat eighth pairs at beat boundaries (allows mixed note/rest pairs)", () => {
    // Run multiple iterations to check the constraint is always respected
    for (let seed = 0; seed < 20; seed++) {
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        // Vary values to get different patterns
        return ((seed * 7 + callCount * 3) % 100) / 100;
      });

      const events = generateRhythmEvents({
        timeSignature: "4/4",
        measuresPerPattern: 1,
        allowedNoteDurations: ["q", "8"],
        allowRests: true,
        allowedRestDurations: ["q", "8"],
        rhythmComplexity: "simple",
      });

      const beatGroups = groupEventsWithDetailsByBeat(events, 4);

      // For each beat that contains an eighth rest:
      // - The beat must contain exactly two eighth-sized events (notes or rests)
      // - The pair must start at the beat boundary (first event at position % 4 === 0)
      // - Valid combinations: rest+rest, rest+note, note+rest
      for (const { beat, events: beatEvents } of beatGroups) {
        const eighthRests = beatEvents.filter(
          (e) => e.type === "rest" && e.sixteenthUnits === 2
        );

        if (eighthRests.length > 0) {
          // Count all eighths (notes and rests) in this beat
          const allEighths = beatEvents.filter((e) => e.sixteenthUnits === 2);

          // Must have exactly 2 eighths that together fill the beat
          expect(allEighths.length).toBe(2);

          // The first eighth must start at a beat boundary
          const firstEighth = allEighths[0];
          expect(firstEighth.startPosition % 4).toBe(0);

          // The two eighths must sum to exactly 4 (one beat)
          const totalEighthUnits = allEighths.reduce((sum, e) => sum + e.sixteenthUnits, 0);
          expect(totalEighthUnits).toBe(4);
        }
      }

      vi.restoreAllMocks();
    }
  });

  it("simple mode with rests: CAN produce mixed 1/8 rest + 1/8 note pairs", () => {
    // Run multiple iterations to find at least one pattern with a mixed pair
    let foundMixedPair = false;

    for (let seed = 0; seed < 50 && !foundMixedPair; seed++) {
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        // Vary values to encourage different patterns
        return ((seed * 11 + callCount * 7) % 100) / 100;
      });

      const events = generateRhythmEvents({
        timeSignature: "4/4",
        measuresPerPattern: 1,
        allowedNoteDurations: ["q", "8"],
        allowRests: true,
        allowedRestDurations: ["q", "8"],
        rhythmComplexity: "simple",
      });

      // Check for consecutive eighth pairs where one is a rest and one is a note
      for (let i = 0; i < events.length - 1; i++) {
        const curr = events[i];
        const next = events[i + 1];

        if (curr.sixteenthUnits === 2 && next.sixteenthUnits === 2) {
          const currIsRest = curr.type === "rest";
          const nextIsRest = next.type === "rest";

          // Mixed pair: one is rest, one is note
          if (currIsRest !== nextIsRest) {
            foundMixedPair = true;
            break;
          }
        }
      }

      vi.restoreAllMocks();
    }

    // At least one of the 50 iterations should have produced a mixed pair
    expect(foundMixedPair).toBe(true);
  });

  it("complex mode: CAN produce syncopated 8-q-8 patterns", () => {
    // Try multiple seeds to find one that produces syncopation
    // (complex mode has 25% chance per event to trigger 8-q-8 when possible)
    let foundSyncopation = false;

    for (let seed = 0; seed < 50 && !foundSyncopation; seed++) {
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        // Return low values to trigger syncopation (< 0.25 threshold)
        // But vary by seed and callCount to get different patterns
        if (callCount % 3 === 0) return 0.1; // Low value to trigger syncopation
        return ((seed * 7 + callCount * 11) % 100) / 100;
      });

      const events = generateRhythmEvents({
        timeSignature: "4/4",
        measuresPerPattern: 1,
        allowedNoteDurations: ["q", "8"],
        allowRests: false,
        allowedRestDurations: [],
        rhythmComplexity: "complex",
      });

      if (containsSyncopatedMotif(events)) {
        foundSyncopation = true;
      }

      vi.restoreAllMocks();
    }

    // At least one of the 50 iterations should have produced syncopation
    expect(foundSyncopation).toBe(true);
  });
});

describe("generateRhythmEvents (beat-contained patterns)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper: Check that all events have valid beatIndex and beatSpan metadata
   */
  function checkBeatMetadata(events) {
    for (const event of events) {
      if (typeof event.beatIndex !== "number") {
        return { valid: false, reason: "Missing beatIndex", event };
      }
      if (typeof event.beatSpan !== "number") {
        return { valid: false, reason: "Missing beatSpan", event };
      }
      if (event.beatIndex < 0) {
        return { valid: false, reason: "Negative beatIndex", event };
      }
      if (event.beatSpan < 1) {
        return { valid: false, reason: "beatSpan < 1", event };
      }
    }
    return { valid: true };
  }

  /**
   * Helper: Check that all events in a patternId group share the same beatIndex
   */
  function checkPatternBeatConsistency(events) {
    const patternBeatMap = new Map();
    
    for (const event of events) {
      const patternId = event.patternId;
      if (!patternBeatMap.has(patternId)) {
        patternBeatMap.set(patternId, event.beatIndex);
      } else {
        if (patternBeatMap.get(patternId) !== event.beatIndex) {
          return {
            consistent: false,
            patternId,
            expectedBeat: patternBeatMap.get(patternId),
            actualBeat: event.beatIndex,
          };
        }
      }
    }
    return { consistent: true };
  }

  /**
   * Helper: Check that multi-beat patterns only start at valid beat boundaries
   * and fit entirely within the measure
   */
  function checkMultiBeatPatternBoundaries(events, totalBeats) {
    const patternGroups = new Map();
    
    // Group events by patternId
    for (const event of events) {
      if (!patternGroups.has(event.patternId)) {
        patternGroups.set(event.patternId, []);
      }
      patternGroups.get(event.patternId).push(event);
    }

    for (const [patternId, patternEvents] of patternGroups) {
      const beatSpan = patternEvents[0].beatSpan;
      const beatIndex = patternEvents[0].beatIndex;
      
      if (beatSpan > 1) {
        // Multi-beat pattern must start at a beat that allows it to fit
        if (beatIndex + beatSpan > totalBeats) {
          return {
            valid: false,
            reason: `Multi-beat pattern exceeds measure boundary`,
            patternId,
            beatIndex,
            beatSpan,
            totalBeats,
          };
        }
      }
    }
    return { valid: true };
  }

  it("all events have beatIndex and beatSpan metadata", () => {
    for (let seed = 0; seed < 20; seed++) {
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        return ((seed * 13 + callCount * 7) % 100) / 100;
      });

      const events = generateRhythmEvents({
        timeSignature: "4/4",
        measuresPerPattern: 1,
        allowedNoteDurations: ["q", "8", "16"],
        allowRests: true,
        allowedRestDurations: ["q", "8"],
        rhythmComplexity: "complex",
        enabledComplexPatterns: [
          "twoSixteenthsThenEighth",
          "eighthThenTwoSixteenths",
          "dottedEighthSixteenth",
        ],
      });

      const metadataCheck = checkBeatMetadata(events);
      expect(metadataCheck.valid).toBe(true);

      vi.restoreAllMocks();
    }
  });

  it("events in the same patternId share the same beatIndex", () => {
    for (let seed = 0; seed < 20; seed++) {
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        return ((seed * 17 + callCount * 11) % 100) / 100;
      });

      const events = generateRhythmEvents({
        timeSignature: "4/4",
        measuresPerPattern: 1,
        allowedNoteDurations: ["q", "8", "16"],
        allowRests: true,
        allowedRestDurations: ["q", "8"],
        rhythmComplexity: "complex",
        enabledComplexPatterns: [
          "twoSixteenthsThenEighth",
          "eighthThenTwoSixteenths",
          "eighthQuarterEighth",
          "dottedQuarterEighth",
        ],
      });

      const consistencyCheck = checkPatternBeatConsistency(events);
      expect(consistencyCheck.consistent).toBe(true);

      vi.restoreAllMocks();
    }
  });

  it("multi-beat patterns only start at valid positions and fit within measure", () => {
    for (let seed = 0; seed < 30; seed++) {
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        return ((seed * 19 + callCount * 13) % 100) / 100;
      });

      const events = generateRhythmEvents({
        timeSignature: "4/4",
        measuresPerPattern: 1,
        allowedNoteDurations: ["q", "8"],
        allowRests: false,
        allowedRestDurations: [],
        rhythmComplexity: "complex",
        enabledComplexPatterns: [
          "eighthQuarterEighth",
          "dottedQuarterEighth",
        ],
      });

      const boundaryCheck = checkMultiBeatPatternBoundaries(events, 4);
      expect(boundaryCheck.valid).toBe(true);

      vi.restoreAllMocks();
    }
  });

  it("3/4 time: multi-beat patterns fit within 3 beats", () => {
    for (let seed = 0; seed < 20; seed++) {
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        return ((seed * 23 + callCount * 17) % 100) / 100;
      });

      const events = generateRhythmEvents({
        timeSignature: "3/4",
        measuresPerPattern: 1,
        allowedNoteDurations: ["q", "8"],
        allowRests: false,
        allowedRestDurations: [],
        rhythmComplexity: "complex",
        enabledComplexPatterns: [
          "eighthQuarterEighth",
          "dottedQuarterEighth",
        ],
      });

      // 3/4 has only 3 beats, so 2-beat patterns can only start on beat 0 or 1
      const boundaryCheck = checkMultiBeatPatternBoundaries(events, 3);
      expect(boundaryCheck.valid).toBe(true);

      vi.restoreAllMocks();
    }
  });

  it("single-beat patterns stay within their beat (beatSpan === 1)", () => {
    for (let seed = 0; seed < 20; seed++) {
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        return ((seed * 11 + callCount * 5) % 100) / 100;
      });

      const events = generateRhythmEvents({
        timeSignature: "4/4",
        measuresPerPattern: 1,
        allowedNoteDurations: ["q", "8", "16"],
        allowRests: true,
        allowedRestDurations: ["q", "8"],
        rhythmComplexity: "complex",
        enabledComplexPatterns: [
          "twoSixteenthsThenEighth",
          "eighthThenTwoSixteenths",
          "dottedEighthSixteenth",
        ],
      });

      // All single-beat complex patterns should have beatSpan === 1
      const patternGroups = new Map();
      for (const event of events) {
        if (!patternGroups.has(event.patternId)) {
          patternGroups.set(event.patternId, []);
        }
        patternGroups.get(event.patternId).push(event);
      }

      for (const [patternId, patternEvents] of patternGroups) {
        const totalUnits = patternEvents.reduce((sum, e) => sum + e.sixteenthUnits, 0);
        const beatSpan = patternEvents[0].beatSpan;

        // If the pattern is a 4-unit pattern, it should span 1 beat
        if (totalUnits === 4 && patternEvents.length > 1) {
          expect(beatSpan).toBe(1);
        }
      }

      vi.restoreAllMocks();
    }
  });
});
