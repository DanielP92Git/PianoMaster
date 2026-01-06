import {
  getDurationDefinition,
  resolveTimeSignature,
} from "../constants/durationConstants";
import {
  COMPLEX_EXAMPLE_PATTERNS,
  getSingleBeatComplexPatterns,
  getMultiBeatComplexPatterns,
} from "./rhythmPatterns";

/**
 * Rhythm generator (v2 - Beat-wise)
 * ---------------------------------
 * Generates a sequence of note/rest events that exactly fill the requested
 * number of measures, using only straight values (w/h/q/8/16).
 *
 * Key design principles:
 * - Each pattern is contained within a well-defined beat range (1 or more full beats)
 * - Patterns never split across beat boundaries (except multi-beat patterns that span full beats)
 * - Multi-beat patterns (beatsSpan > 1) only start at beat boundaries and must fit entirely
 *
 * Output events include:
 * - type: "note" or "rest"
 * - notation: sight-reading notation ID (e.g. "quarter")
 * - sixteenthUnits: duration in sixteenth units
 * - patternId: groups related events together
 * - beatIndex: the beat where this event/pattern starts
 * - beatSpan: number of beats this pattern covers
 */

const VEXFLOW_TO_NOTATION_ID = Object.freeze({
  w: "whole",
  h: "half",
  q: "quarter",
  8: "eighth",
  16: "sixteenth",
});

function toNotationId(vexflowCode) {
  const key = String(vexflowCode || "");
  return VEXFLOW_TO_NOTATION_ID[key] || "quarter";
}

function toSixteenthUnits(vexflowCode) {
  const notation = toNotationId(vexflowCode);
  return getDurationDefinition(notation).sixteenthUnits;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * @param {Object} opts
 * @param {Object|string} opts.timeSignature
 * @param {number} opts.measuresPerPattern
 * @param {string[]} opts.allowedNoteDurations - VexFlow duration codes: ["w","h","q","8","16"]
 * @param {boolean} opts.allowRests
 * @param {string[]} opts.allowedRestDurations - VexFlow duration codes
 * @param {string} opts.rhythmComplexity - "simple" or "complex"
 * @param {string[]|null} opts.enabledComplexPatterns - IDs of enabled complex patterns (null = all)
 * @returns {Array<{type:"note"|"rest", notation:string, sixteenthUnits:number, patternId:number, beatIndex:number, beatSpan:number}>}
 */
export function generateRhythmEvents({
  timeSignature,
  measuresPerPattern = 1,
  allowedNoteDurations = ["q", "8"],
  allowRests = false,
  allowedRestDurations = ["q", "8"],
  rhythmComplexity = "simple",
  enabledComplexPatterns = null,
}) {
  const sig = resolveTimeSignature(timeSignature);
  const unitsPerBeat = sig.unitsPerBeat || 4;
  const beatsPerMeasure = sig.beats || 4;
  const totalBeats = beatsPerMeasure * Math.max(1, measuresPerPattern || 1);

  const notePool = (
    Array.isArray(allowedNoteDurations) && allowedNoteDurations.length > 0
      ? allowedNoteDurations
      : ["q", "8"]
  )
    .map((d) => String(d))
    .filter((d) => VEXFLOW_TO_NOTATION_ID[d]);

  const restPool =
    allowRests &&
    Array.isArray(allowedRestDurations) &&
    allowedRestDurations.length > 0
      ? allowedRestDurations
          .map((d) => String(d))
          .filter((d) => VEXFLOW_TO_NOTATION_ID[d])
      : [];

  // Precompute pools with unit sizes
  const noteChoices = notePool.map((d) => ({
    vex: d,
    notation: toNotationId(d),
    units: toSixteenthUnits(d),
  }));
  const restChoices = restPool.map((d) => ({
    vex: d,
    notation: toNotationId(d),
    units: toSixteenthUnits(d),
  }));

  // Safety fallback
  if (noteChoices.length === 0) {
    noteChoices.push({ vex: "q", notation: "quarter", units: 4 });
  }

  const noteHasEighth = noteChoices.some((c) => c.vex === "8");
  const restHasEighth = restChoices.some((c) => c.vex === "8");
  const noteHasSixteenth = noteChoices.some((c) => c.vex === "16");
  const noteHasQuarter = noteChoices.some((c) => c.vex === "q");

  const events = [];
  let patternCounter = 0;
  let isFirst = true;

  const complexity = rhythmComplexity === "complex" ? "complex" : "simple";

  // Build complex pattern pools filtered by enabled patterns
  const filterByEnabled = (patterns) => {
    if (!Array.isArray(enabledComplexPatterns) || enabledComplexPatterns.length === 0) {
      return patterns;
    }
    return patterns.filter((p) => enabledComplexPatterns.includes(p.id));
  };

  const singleBeatComplexPatterns =
    complexity === "complex" ? filterByEnabled(getSingleBeatComplexPatterns()) : [];
  const multiBeatComplexPatterns =
    complexity === "complex" ? filterByEnabled(getMultiBeatComplexPatterns()) : [];

  /**
   * Push events for a complex pattern
   */
  const pushComplexPattern = (pattern, beatIndex) => {
    const patternId = patternCounter++;
    const computedEvents = pattern.events.map((evt) => {
      const notation = toNotationId(evt.duration);
      const dottedNotation = evt.dotted ? `dotted-${notation}` : notation;
      const actualNotation = getDurationDefinition(dottedNotation)
        ? dottedNotation
        : notation;
      const units = getDurationDefinition(actualNotation).sixteenthUnits;
      return {
        type: evt.type,
        notation: actualNotation,
        sixteenthUnits: units,
        isDotted: !!evt.dotted,
      };
    });

    for (const computed of computedEvents) {
      events.push({
        ...computed,
        patternId,
        beatIndex,
        beatSpan: pattern.beatsSpan,
      });
    }
    isFirst = false;
    return pattern.beatsSpan;
  };

  /**
   * Push a single event (note or rest)
   */
  const pushSingleEvent = (type, vexCode, beatIndex, beatSpan = 1) => {
    const notation = toNotationId(vexCode);
    const units = toSixteenthUnits(vexCode);
    events.push({
      type,
      notation,
      sixteenthUnits: units,
      patternId: patternCounter++,
      beatIndex,
      beatSpan,
    });
    isFirst = false;
    return units;
  };

  /**
   * Fill a single beat with simple durations (no syncopation across beats)
   * Returns the number of units actually filled
   */
  const fillBeatSimple = (beatIndex, remainingInBeat) => {
    let filled = 0;

    while (filled < remainingInBeat) {
      const leftInBeat = remainingInBeat - filled;
      const noteFits = noteChoices.filter((c) => c.units <= leftInBeat);
      const restFits = restChoices.filter((c) => c.units <= leftInBeat);

      if (noteFits.length === 0 && restFits.length === 0) {
        // Nothing fits - use sixteenth if available
        if (noteHasSixteenth && leftInBeat >= 1) {
          filled += pushSingleEvent("note", "16", beatIndex, 1);
          continue;
        }
        break;
      }

      // Decide note vs rest
      const canRest = !isFirst && restFits.length > 0;
      const forcedRest = noteFits.length === 0 && restFits.length > 0;
      const shouldRest = forcedRest || (canRest && Math.random() < 0.25);
      const nextType = shouldRest ? "rest" : "note";
      const fits = nextType === "rest" ? restFits : noteFits;

      // In simple mode, eighths must come in pairs within the beat
      const nonEighthFits = fits.filter((c) => c.vex !== "8");
      const hasEighth = fits.some((c) => c.vex === "8");
      const eighthUnits = 2;

      // Can we fit a pair of eighths?
      const canPairEighths =
        hasEighth &&
        leftInBeat >= eighthUnits * 2 &&
        filled === 0; // Only at start of beat

      // Prefer paired eighths with some probability
      if (canPairEighths && Math.random() < 0.35) {
        // Push two eighths as a pair with same patternId
        const pairPatternId = patternCounter++;
        const pairBeatSpan = 1;

        // Decide mix: note-note, note-rest, rest-note, rest-rest
        const combinations = [];
        if (nextType === "note" && noteHasEighth) {
          combinations.push(["note", "note"]);
          if (restHasEighth) combinations.push(["note", "rest"]);
        } else if (nextType === "rest" && restHasEighth) {
          combinations.push(["rest", "rest"]);
          if (noteHasEighth) combinations.push(["rest", "note"]);
        }

        if (combinations.length > 0) {
          const [first, second] = pickRandom(combinations);
          events.push({
            type: first,
            notation: "eighth",
            sixteenthUnits: eighthUnits,
            patternId: pairPatternId,
            beatIndex,
            beatSpan: pairBeatSpan,
          });
          events.push({
            type: second,
            notation: "eighth",
            sixteenthUnits: eighthUnits,
            patternId: pairPatternId,
            beatIndex,
            beatSpan: pairBeatSpan,
          });
          isFirst = false;
          filled += eighthUnits * 2;
          continue;
        }
      }

      // Pick a non-eighth duration or fallback
      if (nonEighthFits.length > 0) {
        const picked = pickRandom(nonEighthFits);
        filled += pushSingleEvent(nextType, picked.vex, beatIndex, 1);
        continue;
      }

      // If only eighths available and we can pair them
      if (canPairEighths && hasEighth) {
        const pairPatternId = patternCounter++;
        events.push({
          type: nextType,
          notation: "eighth",
          sixteenthUnits: eighthUnits,
          patternId: pairPatternId,
          beatIndex,
          beatSpan: 1,
        });
        events.push({
          type: nextType,
          notation: "eighth",
          sixteenthUnits: eighthUnits,
          patternId: pairPatternId,
          beatIndex,
          beatSpan: 1,
        });
        isFirst = false;
        filled += eighthUnits * 2;
        continue;
      }

      // Fallback to sixteenths if available
      if (noteHasSixteenth && leftInBeat >= 1) {
        filled += pushSingleEvent("note", "16", beatIndex, 1);
        continue;
      }

      // Last resort: pick smallest available
      const allFits = [...noteFits, ...restFits].filter((c) => c.vex !== "8");
      if (allFits.length > 0) {
        const smallest = allFits.reduce((a, b) => (a.units < b.units ? a : b));
        filled += pushSingleEvent("note", smallest.vex, beatIndex, 1);
        continue;
      }

      break;
    }

    return filled;
  };

  /**
   * Fill a single beat in complex mode (may use single-beat complex patterns)
   */
  const fillBeatComplex = (beatIndex, remainingInBeat) => {
    let filled = 0;

    // At the start of a beat, try inserting a single-beat complex pattern
    if (
      filled === 0 &&
      singleBeatComplexPatterns.length > 0 &&
      remainingInBeat >= unitsPerBeat &&
      Math.random() < 0.4
    ) {
      const fittingPatterns = singleBeatComplexPatterns.filter(
        (p) => p.totalUnits <= remainingInBeat
      );
      if (fittingPatterns.length > 0) {
        const picked = pickRandom(fittingPatterns);
        const beatsUsed = pushComplexPattern(picked, beatIndex);
        filled += picked.totalUnits;
        return filled;
      }
    }

    // Otherwise, fill with simple durations
    filled += fillBeatSimple(beatIndex, remainingInBeat - filled);
    return filled;
  };

  // Main beat-wise loop
  let beat = 0;
  while (beat < totalBeats) {
    const beatsRemaining = totalBeats - beat;

    // In complex mode, try multi-beat patterns at beat boundaries
    if (
      complexity === "complex" &&
      multiBeatComplexPatterns.length > 0 &&
      beatsRemaining >= 2 &&
      Math.random() < 0.25
    ) {
      // Filter to patterns that fit within remaining beats
      const fittingMultiBeat = multiBeatComplexPatterns.filter(
        (p) => p.beatsSpan <= beatsRemaining
      );
      if (fittingMultiBeat.length > 0) {
        const picked = pickRandom(fittingMultiBeat);
        const beatsUsed = pushComplexPattern(picked, beat);
        beat += beatsUsed;
        continue;
      }
    }

    // Fill this single beat
    if (complexity === "complex") {
      fillBeatComplex(beat, unitsPerBeat);
    } else {
      fillBeatSimple(beat, unitsPerBeat);
    }
    beat += 1;
  }

  // Final validation
  const actualTotal = events.reduce((sum, e) => sum + e.sixteenthUnits, 0);
  const expectedTotal = totalBeats * unitsPerBeat;
  if (actualTotal !== expectedTotal) {
    console.warn(
      `[RhythmGenerator] Total units mismatch: got ${actualTotal}, expected ${expectedTotal}. Events:`,
      events
    );

    // Pad with quarter rests for any missing whole beats
    if (actualTotal < expectedTotal) {
      const deficit = expectedTotal - actualTotal;
      const fillUnits = unitsPerBeat; // One beat at a time
      let pad = deficit;
      let padBeat = Math.floor(actualTotal / unitsPerBeat);
      while (pad >= fillUnits && noteHasQuarter) {
        events.push({
          type: "rest",
          notation: "quarter",
          sixteenthUnits: fillUnits,
          patternId: patternCounter++,
          beatIndex: padBeat,
          beatSpan: 1,
        });
        pad -= fillUnits;
        padBeat += 1;
      }
      // Fill remaining with sixteenths if needed
      while (pad >= 1 && noteHasSixteenth) {
        events.push({
          type: "note",
          notation: "sixteenth",
          sixteenthUnits: 1,
          patternId: patternCounter++,
          beatIndex: padBeat,
          beatSpan: 1,
        });
        pad -= 1;
      }
    }
  }

  return events;
}
