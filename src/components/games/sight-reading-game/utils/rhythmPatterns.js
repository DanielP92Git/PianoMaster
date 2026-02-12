/**
 * Rhythm Pattern Archetypes
 * -------------------------
 * Definitions for rhythm patterns used in the UI to visually show
 * what each duration option looks like as actual notation.
 *
 * Each archetype has:
 * - id: unique identifier
 * - label: short text label for accessibility
 * - mode: "simple" or "complex" (which rhythm mode this applies to)
 * - durationId: the duration code this maps to in settings (q, 8, 16, etc.)
 * - events: array of { type: 'note'|'rest', duration: VexFlow code, dotted?: boolean }
 * - totalUnits: total sixteenth-note units (for one beat = 4 units typically)
 */

// ============================================================
// SIMPLE MODE PATTERNS (selectable, map to allowedNoteDurations)
// ============================================================

export const SIMPLE_NOTE_PATTERNS = [
  {
    id: "whole",
    label: "Whole note",
    durationId: "w",
    events: [{ type: "note", duration: "w" }],
    totalUnits: 16,
  },
  {
    id: "half",
    label: "Half note",
    durationId: "h",
    events: [{ type: "note", duration: "h" }],
    totalUnits: 8,
  },
  {
    id: "quarter",
    label: "Quarter note",
    durationId: "q",
    events: [{ type: "note", duration: "q" }],
    totalUnits: 4,
  },
  {
    id: "pairedEighths",
    label: "Two eighth notes",
    durationId: "8",
    events: [
      { type: "note", duration: "8" },
      { type: "note", duration: "8" },
    ],
    totalUnits: 4,
  },
  {
    id: "fourSixteenths",
    label: "Four sixteenth notes",
    durationId: "16",
    events: [
      { type: "note", duration: "16" },
      { type: "note", duration: "16" },
      { type: "note", duration: "16" },
      { type: "note", duration: "16" },
    ],
    totalUnits: 4,
  },
];

// Rest patterns (for the rest values selection)
export const SIMPLE_REST_PATTERNS = [
  {
    id: "wholeRest",
    label: "Whole rest",
    durationId: "w",
    events: [{ type: "rest", duration: "w" }],
    totalUnits: 16,
  },
  {
    id: "halfRest",
    label: "Half rest",
    durationId: "h",
    events: [{ type: "rest", duration: "h" }],
    totalUnits: 8,
  },
  {
    id: "quarterRest",
    label: "Quarter rest",
    durationId: "q",
    events: [{ type: "rest", duration: "q" }],
    totalUnits: 4,
  },
  {
    id: "pairedEighthRests",
    label: "Two eighth rests",
    durationId: "8",
    events: [
      { type: "rest", duration: "8" },
      { type: "rest", duration: "8" },
    ],
    totalUnits: 4,
  },
  {
    id: "fourSixteenthRests",
    label: "Four sixteenth rests",
    durationId: "16",
    events: [
      { type: "rest", duration: "16" },
      { type: "rest", duration: "16" },
      { type: "rest", duration: "16" },
      { type: "rest", duration: "16" },
    ],
    totalUnits: 4,
  },
];

// ============================================================
// COMPLEX MODE PATTERNS (display-only examples, not selectable)
// ============================================================

export const COMPLEX_EXAMPLE_PATTERNS = [
  {
    id: "twoSixteenthsThenEighth",
    label: "Two sixteenths then eighth",
    events: [
      { type: "note", duration: "16" },
      { type: "note", duration: "16" },
      { type: "note", duration: "8" },
    ],
    totalUnits: 4,
    beatsSpan: 1, // Fits exactly in one beat (4 sixteenth units)
  },
  {
    id: "eighthThenTwoSixteenths",
    label: "Eighth then two sixteenths",
    events: [
      { type: "note", duration: "8" },
      { type: "note", duration: "16" },
      { type: "note", duration: "16" },
    ],
    totalUnits: 4,
    beatsSpan: 1, // Fits exactly in one beat (4 sixteenth units)
  },
  {
    id: "eighthQuarterEighth",
    label: "Syncopated eighth-quarter-eighth",
    events: [
      { type: "note", duration: "8" },
      { type: "note", duration: "q" },
      { type: "note", duration: "8" },
    ],
    totalUnits: 8,
    beatsSpan: 2, // Spans 2 beats (8 sixteenth units)
  },
  {
    id: "dottedQuarterEighth",
    label: "Dotted quarter then eighth",
    events: [
      { type: "note", duration: "q", dotted: true },
      { type: "note", duration: "8" },
    ],
    totalUnits: 8,
    beatsSpan: 2, // Spans 2 beats (6 + 2 = 8 sixteenth units)
  },
  {
    id: "dottedEighthSixteenth",
    label: "Dotted eighth then sixteenth",
    events: [
      { type: "note", duration: "8", dotted: true },
      { type: "note", duration: "16" },
    ],
    totalUnits: 4,
    beatsSpan: 1, // Fits exactly in one beat (3 + 1 = 4 sixteenth units)
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get the simple note pattern for a given duration ID
 */
export function getNotePatternByDurationId(durationId) {
  return SIMPLE_NOTE_PATTERNS.find((p) => p.durationId === durationId);
}

/**
 * Get the simple rest pattern for a given duration ID
 */
export function getRestPatternByDurationId(durationId) {
  return SIMPLE_REST_PATTERNS.find((p) => p.durationId === durationId);
}

/**
 * Get a complex example pattern by its ID
 */
export function getComplexPatternById(id) {
  return COMPLEX_EXAMPLE_PATTERNS.find((p) => p.id === id);
}

/**
 * Get all complex pattern IDs (useful for defaults)
 */
export function getAllComplexPatternIds() {
  return COMPLEX_EXAMPLE_PATTERNS.map((p) => p.id);
}

/**
 * Get complex patterns that fit within a given number of beats
 * @param {number} maxBeats - Maximum beatsSpan allowed
 * @param {number} unitsPerBeat - Sixteenth units per beat (default 4 for simple time)
 * @returns {Array} - Filtered patterns
 */
export function getComplexPatternsByBeatsSpan(maxBeats, unitsPerBeat = 4) {
  return COMPLEX_EXAMPLE_PATTERNS.filter((p) => p.beatsSpan <= maxBeats);
}

/**
 * Get single-beat complex patterns (beatsSpan === 1)
 */
export function getSingleBeatComplexPatterns() {
  return COMPLEX_EXAMPLE_PATTERNS.filter((p) => p.beatsSpan === 1);
}

/**
 * Get multi-beat complex patterns (beatsSpan > 1)
 */
export function getMultiBeatComplexPatterns() {
  return COMPLEX_EXAMPLE_PATTERNS.filter((p) => p.beatsSpan > 1);
}

/**
 * Validate that all complex patterns have consistent beatsSpan metadata.
 * This is a development-time assertion.
 * @param {number} unitsPerBeat - Expected sixteenth units per beat (default 4)
 */
export function validateComplexPatternBeatsSpan(unitsPerBeat = 4) {
  const errors = [];
  for (const pattern of COMPLEX_EXAMPLE_PATTERNS) {
    const expectedUnits = pattern.beatsSpan * unitsPerBeat;
    if (pattern.totalUnits !== expectedUnits) {
      errors.push(
        `Pattern "${pattern.id}": totalUnits (${pattern.totalUnits}) !== beatsSpan (${pattern.beatsSpan}) * unitsPerBeat (${unitsPerBeat}) = ${expectedUnits}`
      );
    }
  }
  if (errors.length > 0) {
    console.error("[rhythmPatterns] beatsSpan validation errors:", errors);
  }
  return errors.length === 0;
}

/**
 * Convert events to VexFlow-compatible format
 * @param {Array} events - Array of { type, duration, dotted? }
 * @returns {Array} - Array of { keys, duration, clef } objects
 */
export function eventsToVexFlowNotes(events, clef = "treble") {
  const defaultKey = clef === "bass" ? "d/3" : "b/4";

  return events.map((event) => {
    const baseDuration = event.duration;
    const isRest = event.type === "rest";
    const duration = isRest
      ? `${baseDuration}r`
      : event.dotted
        ? `${baseDuration}d`
        : baseDuration;

    return {
      keys: [defaultKey],
      duration,
      clef,
      dotted: event.dotted || false,
      isRest,
    };
  });
}
