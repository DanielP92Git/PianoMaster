import {
  DURATION_CONSTANTS as RHYTHM_DURATION_CONSTANTS,
  TIME_SIGNATURES as RHYTHM_TIME_SIGNATURES,
} from "../../rhythm-games/RhythmPatternGenerator";

/**
 * Canonical duration definitions used across sight-reading + rhythm games.
 * Keeps beats, sixteenth units, and VexFlow codes in sync.
 */
const BASE_DURATION_DEFINITIONS = {
  whole: {
    id: "whole",
    beats: 4,
    sixteenthUnits: RHYTHM_DURATION_CONSTANTS.WHOLE,
    vexflowCode: "w",
  },
  "dotted-half": {
    id: "dotted-half",
    beats: 3,
    sixteenthUnits: RHYTHM_DURATION_CONSTANTS.DOTTED_HALF,
    vexflowCode: "h.",
  },
  half: {
    id: "half",
    beats: 2,
    sixteenthUnits: RHYTHM_DURATION_CONSTANTS.HALF,
    vexflowCode: "h",
  },
  "dotted-quarter": {
    id: "dotted-quarter",
    beats: 1.5,
    sixteenthUnits: RHYTHM_DURATION_CONSTANTS.DOTTED_QUARTER,
    vexflowCode: "q.",
  },
  quarter: {
    id: "quarter",
    beats: 1,
    sixteenthUnits: RHYTHM_DURATION_CONSTANTS.QUARTER,
    vexflowCode: "q",
  },
  "dotted-eighth": {
    id: "dotted-eighth",
    beats: 0.75,
    sixteenthUnits: RHYTHM_DURATION_CONSTANTS.DOTTED_EIGHTH,
    vexflowCode: "8.",
  },
  eighth: {
    id: "eighth",
    beats: 0.5,
    sixteenthUnits: RHYTHM_DURATION_CONSTANTS.EIGHTH,
    vexflowCode: "8",
  },
  sixteenth: {
    id: "sixteenth",
    beats: 0.25,
    sixteenthUnits: RHYTHM_DURATION_CONSTANTS.SIXTEENTH,
    vexflowCode: "16",
  },
};

export const NOTE_DURATION_DEFINITIONS = Object.freeze(
  BASE_DURATION_DEFINITIONS
);

const DEFAULT_DURATION = NOTE_DURATION_DEFINITIONS.quarter;

export const NOTATION_TO_VEXFLOW = Object.freeze(
  Object.entries(NOTE_DURATION_DEFINITIONS).reduce((acc, [key, value]) => {
    acc[key] = value.vexflowCode;
    return acc;
  }, {})
);

export const getDurationDefinition = (notation = "quarter") =>
  NOTE_DURATION_DEFINITIONS[notation] || DEFAULT_DURATION;

/**
 * Normalize the time signature definition so we always know:
 * - beats per measure
 * - total sixteenth units per measure
 * - sixteenth units per beat (grid resolution)
 */
const buildTimeSignatureGrid = () => {
  const grid = {};

  Object.values(RHYTHM_TIME_SIGNATURES).forEach((signature) => {
    const unitsPerBeat =
      signature.measureLength && signature.beats
        ? signature.measureLength / signature.beats
        : 4;

    grid[signature.name] = {
      name: signature.name,
      beats: signature.beats,
      measureUnits: signature.measureLength,
      subdivision: signature.subdivision ?? signature.measureLength,
      unitsPerBeat,
      strongBeats: signature.strongBeats ?? [],
      mediumBeats: signature.mediumBeats ?? [],
      weakBeats: signature.weakBeats ?? [],
      isCompound: !!signature.isCompound,
    };
  });

  return grid;
};

export const TIME_SIGNATURE_GRID = Object.freeze(buildTimeSignatureGrid());

const FALLBACK_SIGNATURE = Object.freeze(
  TIME_SIGNATURE_GRID["4/4"] || {
    name: "4/4",
    beats: 4,
    measureUnits: 16,
    subdivision: 16,
    unitsPerBeat: 4,
    strongBeats: [0],
    mediumBeats: [2],
    weakBeats: [1, 3],
    isCompound: false,
  }
);

const deriveFromLooseSignature = (signature) => {
  if (!signature || typeof signature !== "object") {
    return FALLBACK_SIGNATURE;
  }

  const beats = signature.beats ?? FALLBACK_SIGNATURE.beats;
  const subdivision =
    signature.subdivision ?? beats * FALLBACK_SIGNATURE.unitsPerBeat;

  return {
    name: signature.name ?? `${beats}/4`,
    beats,
    subdivision,
    measureUnits: subdivision,
    unitsPerBeat: Math.max(1, subdivision / Math.max(beats, 1)),
    strongBeats: signature.strongBeats ?? FALLBACK_SIGNATURE.strongBeats,
    mediumBeats: signature.mediumBeats ?? FALLBACK_SIGNATURE.mediumBeats,
    weakBeats: signature.weakBeats ?? FALLBACK_SIGNATURE.weakBeats,
    isCompound: !!signature.isCompound,
  };
};

export const resolveTimeSignature = (signatureInput) => {
  if (!signatureInput) {
    return FALLBACK_SIGNATURE;
  }

  if (typeof signatureInput === "string") {
    return TIME_SIGNATURE_GRID[signatureInput] || FALLBACK_SIGNATURE;
  }

  if (signatureInput.name) {
    const base = TIME_SIGNATURE_GRID[signatureInput.name];
    if (base) {
      const beats = signatureInput.beats ?? base.beats;
      const subdivision = signatureInput.subdivision ?? base.subdivision;

      return {
        ...base,
        beats,
        subdivision,
        measureUnits: subdivision,
        unitsPerBeat: Math.max(1, subdivision / Math.max(beats, 1)),
      };
    }
  }

  return deriveFromLooseSignature(signatureInput);
};
