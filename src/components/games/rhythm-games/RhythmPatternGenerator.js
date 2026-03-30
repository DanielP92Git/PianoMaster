/**
 * Enhanced Rhythm Pattern Generator
 * Combines curated JSON databases with intelligent generative logic
 * Avoids floating-point errors and ensures musical coherence
 */

// Constants for precise durations (in sixteenth note units)
export const DURATION_CONSTANTS = {
  WHOLE: 16, // Whole note = 16 sixteenth notes
  HALF: 8, // Half note = 8 sixteenth notes
  QUARTER: 4, // Quarter note = 4 sixteenth notes
  EIGHTH: 2, // Eighth note = 2 sixteenth notes
  SIXTEENTH: 1, // Sixteenth note = 1 sixteenth note

  // Dotted notes
  DOTTED_HALF: 12, // Dotted half = 12 sixteenth notes
  DOTTED_QUARTER: 6, // Dotted quarter = 6 sixteenth notes
  DOTTED_EIGHTH: 3, // Dotted eighth = 3 sixteenth notes

  // Triplets (in terms of sixteenth note subdivision)
  QUARTER_TRIPLET: 8 / 3, // Quarter note triplet
  EIGHTH_TRIPLET: 4 / 3, // Eighth note triplet
  SIXTEENTH_TRIPLET: 2 / 3, // Sixteenth note triplet
};

// Global subdivision definitions per time signature
export const TIME_SIGNATURES = {
  FOUR_FOUR: {
    name: "4/4",
    beats: 4,
    subdivision: 16, // 16th note subdivision
    strongBeats: [0], // Beat 1 is strongest
    mediumBeats: [2], // Beat 3 is medium strong
    weakBeats: [1, 3], // Beats 2 and 4 are weak
    measureLength: 16, // Total sixteenth notes in measure
  },
  THREE_FOUR: {
    name: "3/4",
    beats: 3,
    subdivision: 12, // 12 sixteenth notes per measure
    strongBeats: [0], // Beat 1 is strongest
    mediumBeats: [], // No medium beats in 3/4
    weakBeats: [1, 2], // Beats 2 and 3 are weak
    measureLength: 12,
  },
  TWO_FOUR: {
    name: "2/4",
    beats: 2,
    subdivision: 8, // 8 sixteenth notes per measure
    strongBeats: [0], // Beat 1 is strongest
    mediumBeats: [], // No medium beats in 2/4
    weakBeats: [1], // Beat 2 is weak
    measureLength: 8,
  },
  SIX_EIGHT: {
    name: "6/8",
    beats: 2,           // FIXED: compound time has 2 dotted-quarter beats
    subdivisions: 6,    // Explicit subdivision count: 6 eighth-note positions
    subdivision: 12,    // Total sixteenth-note slots in measure
    strongBeats: [0, 3], // Positions 0 and 3 in the 6-subdivision grid (1-indexed: 1 and 4)
    mediumBeats: [], // No medium beats in 6/8
    weakBeats: [1, 2, 4, 5], // Other positions are weak
    measureLength: 12,
    isCompound: true, // Compound time signature
  },
};

// Difficulty level definitions
export const DIFFICULTY_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
};

// Rule-based generation parameters
const GENERATION_RULES = {
  [DIFFICULTY_LEVELS.BEGINNER]: {
    maxSyncopation: 0, // No syncopation
    minRestPercentage: 0.2, // At least 20% rests
    maxRestPercentage: 0.6, // At most 60% rests
    allowedSubdivisions: [DURATION_CONSTANTS.QUARTER, DURATION_CONSTANTS.HALF],
    strongBeatProbability: 0.8, // 80% chance of sound on strong beats
    weakBeatProbability: 0.3, // 30% chance of sound on weak beats
  },
  [DIFFICULTY_LEVELS.INTERMEDIATE]: {
    maxSyncopation: 2, // Limited syncopation
    minRestPercentage: 0.1,
    maxRestPercentage: 0.5,
    allowedSubdivisions: [
      DURATION_CONSTANTS.QUARTER,
      DURATION_CONSTANTS.EIGHTH,
      DURATION_CONSTANTS.DOTTED_QUARTER,
    ],
    strongBeatProbability: 0.7,
    weakBeatProbability: 0.5,
  },
  [DIFFICULTY_LEVELS.ADVANCED]: {
    maxSyncopation: 4, // More syncopation allowed
    minRestPercentage: 0.05,
    maxRestPercentage: 0.4,
    allowedSubdivisions: [
      DURATION_CONSTANTS.QUARTER,
      DURATION_CONSTANTS.EIGHTH,
      DURATION_CONSTANTS.SIXTEENTH,
      DURATION_CONSTANTS.DOTTED_QUARTER,
      DURATION_CONSTANTS.DOTTED_EIGHTH,
    ],
    strongBeatProbability: 0.6,
    weakBeatProbability: 0.6,
  },
};

/**
 * Hybrid Pattern Service
 * Manages both curated JSON patterns and generative patterns
 */
class HybridPatternService {
  constructor() {
    this.patternCache = new Map();
    this.loadedPatterns = new Map();
  }

  /**
   * Load patterns from JSON file for a specific time signature
   */
  async loadPatterns(timeSignature) {
    if (this.loadedPatterns.has(timeSignature)) {
      return this.loadedPatterns.get(timeSignature);
    }

    try {
      const fileName = timeSignature.replace("/", "-");
      const response = await fetch(`/data/${fileName}.json`);

      if (!response.ok) {
        throw new Error(`Failed to load patterns for ${timeSignature}`);
      }

      const data = await response.json();

      // Validate the loaded data
      if (!this.validatePatternDatabase(data)) {
        throw new Error(`Invalid pattern database for ${timeSignature}`);
      }

      this.loadedPatterns.set(timeSignature, data);
      return data;
    } catch (error) {
      console.warn(`Could not load patterns for ${timeSignature}:`, error);
      return null;
    }
  }

  /**
   * Validate pattern database structure
   */
  validatePatternDatabase(data) {

    if (!data || typeof data !== "object") {
      
      return false;
    }
    if (!data.timeSignature || !data.patterns || !data.metadata) {
      
      return false;
    }

    // Check each difficulty level
    for (const difficulty of ["beginner", "intermediate", "advanced"]) {
      if (
        !data.patterns[difficulty] ||
        !Array.isArray(data.patterns[difficulty])
      ) {
        
        return false;
      }

      // Validate each pattern in the difficulty
      for (let i = 0; i < data.patterns[difficulty].length; i++) {
        const pattern = data.patterns[difficulty][i];
        if (!this.validatePattern(pattern, data.timeSignature)) {
          
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Validate that a pattern conforms to the schema
   */
  validatePattern(pattern, timeSignature = "4/4") {
    if (!Array.isArray(pattern)) {
      
      return false;
    }

    // Handle different pattern formats
    if (typeof pattern[0] === "number") {
      // JSON format: array of fractional values (e.g., [0.25, 0, 0.25, 0.25])
      
      return this.validatePatternDuration(pattern, timeSignature);
    } else {
      // Schema format: array of objects with duration and note properties

      // Check each note object
      for (let i = 0; i < pattern.length; i++) {
        const note = pattern[i];
        if (!note || typeof note !== "object") {
          
          return false;
        }
        if (typeof note.duration !== "string") {
          
          return false;
        }
        if (typeof note.note !== "boolean") {
          
          return false;
        }
      }

      // Validate that durations sum to a complete measure
      const durationValid = this.validatePatternDuration(
        pattern,
        timeSignature
      );
      if (!durationValid) {
        console.warn("Pattern duration validation failed");
      }
      return durationValid;
    }
  }

  /**
   * Validate that pattern durations sum to measure length
   */
  validatePatternDuration(pattern, timeSignature = "4/4") {
    let totalDuration = 0;

    // Handle different pattern formats
    if (Array.isArray(pattern) && typeof pattern[0] === "number") {
      // JSON format: array of fractional values
      // These patterns represent rhythmic fragments, not full measures
      // For JSON patterns, we validate that they are reasonable rhythmic values
      // rather than requiring them to sum to a full measure

      // Check that all values are valid musical fractions
      const validFractions = [
        0, 0.0625, 0.125, 0.166, 0.25, 0.333, 0.375, 0.5, 0.75, 1.0,
      ];
      const tolerance = 0.001;

      for (const value of pattern) {
        const isValidFraction = validFractions.some(
          (frac) => Math.abs(value - frac) < tolerance
        );
        if (!isValidFraction && value !== 0) {
          
          return false;
        }
      }

      // For JSON patterns, just ensure they're not empty and have reasonable values
      const hasNotes = pattern.some((value) => value > 0);
      if (!hasNotes) {
        
        return false;
      }

      return true;
    } else {
      // Schema format: array of objects with duration properties
      for (const note of pattern) {
        const duration = this.getDurationValue(note.duration);
        if (duration === null) {
          
          return false;
        }
        totalDuration += duration;
      }

      // Get expected measure length based on time signature
      const timeSignatureObj = this.getTimeSignatureDefinition(timeSignature);
      const expectedLength = timeSignatureObj
        ? timeSignatureObj.measureLength
        : 16;

      // Allow small floating point tolerance
      const isValid = Math.abs(totalDuration - expectedLength) < 0.001;
      if (!isValid) {
        console.warn("Pattern total duration does not match expected measure length");
      }
      return isValid;
    }
  }

  /**
   * Get time signature definition by name
   */
  getTimeSignatureDefinition(timeSignatureName) {
    const timeSignatureMap = {
      "4/4": TIME_SIGNATURES.FOUR_FOUR,
      "3/4": TIME_SIGNATURES.THREE_FOUR,
      "2/4": TIME_SIGNATURES.TWO_FOUR,
      "6/8": TIME_SIGNATURES.SIX_EIGHT,
    };

    return timeSignatureMap[timeSignatureName] || null;
  }

  /**
   * Convert duration string to numeric value (in sixteenth notes)
   */
  getDurationValue(durationString) {
    const durationMap = {
      whole: DURATION_CONSTANTS.WHOLE,
      half: DURATION_CONSTANTS.HALF,
      quarter: DURATION_CONSTANTS.QUARTER,
      eighth: DURATION_CONSTANTS.EIGHTH,
      sixteenth: DURATION_CONSTANTS.SIXTEENTH,
      "dotted-half": DURATION_CONSTANTS.DOTTED_HALF,
      "dotted-quarter": DURATION_CONSTANTS.DOTTED_QUARTER,
      "dotted-eighth": DURATION_CONSTANTS.DOTTED_EIGHTH,
      "quarter-triplet": DURATION_CONSTANTS.QUARTER_TRIPLET,
      "eighth-triplet": DURATION_CONSTANTS.EIGHTH_TRIPLET,
      "sixteenth-triplet": DURATION_CONSTANTS.SIXTEENTH_TRIPLET,
    };

    return durationMap[durationString] || null;
  }

  /**
   * Convert pattern from new schema to binary array for playback
   */
  convertSchemaToBinary(schemaPattern, timeSignatureObj) {
    const binaryPattern = new Array(timeSignatureObj.measureLength).fill(0);
    let currentPosition = 0;

    for (const note of schemaPattern) {
      if (note.note) {
        // Mark the start position of this note
        const position = Math.round(currentPosition);
        if (position < binaryPattern.length) {
          binaryPattern[position] = 1;
        }
      }

      // Advance position by note duration
      const duration = this.getDurationValue(note.duration);
      if (duration) {
        currentPosition += duration;
      }
    }

    return binaryPattern;
  }

  /**
   * Get a curated pattern from JSON database
   */
  async getCuratedPattern(timeSignature, difficulty) {
    const patterns = await this.loadPatterns(timeSignature);

    if (!patterns || !patterns.patterns[difficulty]) {
      return null;
    }

    const difficultyPatterns = patterns.patterns[difficulty];
    const randomIndex = Math.floor(Math.random() * difficultyPatterns.length);
    const selectedPattern = difficultyPatterns[randomIndex];

    // Get time signature object for conversion
    const timeSignatureObj =
      TIME_SIGNATURES[
        Object.keys(TIME_SIGNATURES).find(
          (key) => TIME_SIGNATURES[key].name === timeSignature
        )
      ];

    // Convert schema pattern to binary for playback
    const binaryPattern = this.convertSchemaToBinary(
      selectedPattern,
      timeSignatureObj
    );

    return {
      pattern: binaryPattern,
      schemaPattern: selectedPattern, // Keep original for reference
      source: "curated",
      timeSignature: patterns.timeSignature,
      metadata: patterns.metadata,
    };
  }

  /**
   * Generate a new pattern using rule-based logic
   */
  generatePattern(timeSignatureObj, difficulty) {
    // Fallback to beginner if unknown difficulty
    const rules = GENERATION_RULES[difficulty] || GENERATION_RULES[DIFFICULTY_LEVELS.BEGINNER];
    const { measureLength, strongBeats, mediumBeats, weakBeats } =
      timeSignatureObj;

    // Compute position multiplier: how many sixteenth units per subdivision step.
    // For simple time (4/4, 3/4, 2/4): subdivisions is not set, falls back to beats.
    //   4/4: measureLength(16) / beats(4) = 4  → quarter-note beat index * 4 = sixteenth position
    // For compound time (6/8): subdivisions = 6 (eighth-note positions in the measure).
    //   6/8: measureLength(12) / subdivisions(6) = 2 → position * 2 = sixteenth position
    const subdivisionCount = timeSignatureObj.subdivisions ?? timeSignatureObj.beats;
    const positionMultiplier = measureLength / subdivisionCount;

    // Create empty pattern array
    const pattern = new Array(measureLength).fill(0);

    // Apply strong beat logic
    strongBeats.forEach((beatIndex) => {
      const sixteenthIndex = Math.round(beatIndex * positionMultiplier);
      if (sixteenthIndex < pattern.length && Math.random() < rules.strongBeatProbability) {
        pattern[sixteenthIndex] = 1;
      }
    });

    // Apply medium beat logic
    mediumBeats.forEach((beatIndex) => {
      const sixteenthIndex = Math.round(beatIndex * positionMultiplier);
      if (sixteenthIndex < pattern.length && Math.random() < rules.strongBeatProbability * 0.7) {
        pattern[sixteenthIndex] = 1;
      }
    });

    // Apply weak beat logic
    weakBeats.forEach((beatIndex) => {
      const sixteenthIndex = Math.round(beatIndex * positionMultiplier);
      if (sixteenthIndex < pattern.length && Math.random() < rules.weakBeatProbability) {
        pattern[sixteenthIndex] = 1;
      }
    });

    // Add subdivision notes based on difficulty
    this.addSubdivisionNotes(pattern, rules, timeSignatureObj);

    // Apply musical safeguards
    this.applyMusicalSafeguards(pattern, rules, timeSignatureObj);

    return {
      pattern,
      source: "generated",
      timeSignature: timeSignatureObj.name,
      difficulty,
      metadata: {
        beatsPerMeasure: timeSignatureObj.beats,
        measureLength: timeSignatureObj.measureLength,
      },
    };
  }

  /**
   * Add subdivision notes based on allowed subdivisions
   */
  addSubdivisionNotes(pattern, rules, timeSignatureObj) {
    const { measureLength } = timeSignatureObj;

    // Add some subdivision variety
    for (let i = 1; i < measureLength; i += 2) {
      // Off-beat positions
      if (pattern[i] === 0 && Math.random() < 0.3) {
        // Check if this creates too much density
        const localDensity = this.calculateLocalDensity(pattern, i, 4);
        if (localDensity < 0.5) {
          // Don't exceed 50% local density
          pattern[i] = 1;
        }
      }
    }
  }

  /**
   * Apply musical safeguards to ensure pedagogical coherence
   */
  applyMusicalSafeguards(pattern, rules) {
    // Ensure we have at least one sound on beat 1 for beginners
    if (
      rules === GENERATION_RULES[DIFFICULTY_LEVELS.BEGINNER] &&
      pattern[0] === 0
    ) {
      pattern[0] = 1;
    }

    // Prevent excessive rests
    const totalSounds = pattern.filter((beat) => beat === 1).length;
    const restPercentage = (pattern.length - totalSounds) / pattern.length;

    if (restPercentage > rules.maxRestPercentage) {
      this.addMinimumSounds(pattern, rules);
    }

    if (restPercentage < rules.minRestPercentage) {
      this.removeExcessSounds(pattern, rules);
    }
  }

  /**
   * Calculate local density around a position
   */
  calculateLocalDensity(pattern, position, windowSize) {
    const start = Math.max(0, position - Math.floor(windowSize / 2));
    const end = Math.min(pattern.length, position + Math.ceil(windowSize / 2));

    let sounds = 0;
    for (let i = start; i < end; i++) {
      if (pattern[i] === 1) sounds++;
    }

    return sounds / (end - start);
  }

  /**
   * Add minimum sounds to meet rest percentage requirements
   */
  addMinimumSounds(pattern, rules) {
    // Add sounds to strong beat positions (every 4th position for quarter notes)
    const strongBeatPositions = [0, 8]; // Beat 1 and 3 for 4/4 time

    // Prioritize strong beats
    strongBeatPositions.forEach((position) => {
      if (position < pattern.length && pattern[position] === 0) {
        pattern[position] = 1;
      }
    });

    // Add to other quarter note positions if still needed
    const quarterNotePositions = [4, 12]; // Beat 2 and 4
    quarterNotePositions.forEach((position) => {
      if (
        position < pattern.length &&
        pattern[position] === 0 &&
        this.needsMoreSounds(pattern, rules)
      ) {
        pattern[position] = 1;
      }
    });
  }

  /**
   * Remove excess sounds to meet rest percentage requirements
   */
  removeExcessSounds(pattern, rules) {
    // Remove from weak beat positions (off-beats and weak subdivisions)
    const weakBeatPositions = [1, 3, 5, 7, 9, 11, 13, 15]; // Off-beat positions

    // Remove from weak beats first
    weakBeatPositions.forEach((position) => {
      if (
        position < pattern.length &&
        pattern[position] === 1 &&
        this.hasTooManySounds(pattern, rules)
      ) {
        pattern[position] = 0;
      }
    });
  }

  /**
   * Check if pattern needs more sounds
   */
  needsMoreSounds(pattern, rules) {
    const totalSounds = pattern.filter((beat) => beat === 1).length;
    const restPercentage = (pattern.length - totalSounds) / pattern.length;
    return restPercentage > rules.maxRestPercentage;
  }

  /**
   * Check if pattern has too many sounds
   */
  hasTooManySounds(pattern, rules) {
    const totalSounds = pattern.filter((beat) => beat === 1).length;
    const restPercentage = (pattern.length - totalSounds) / pattern.length;
    return restPercentage < rules.minRestPercentage;
  }

  /**
   * Validate that a binary pattern conforms to time signature requirements
   */
  validateBinaryPattern(pattern, timeSignatureObj) {
    if (!Array.isArray(pattern)) return false;
    if (pattern.length !== timeSignatureObj.measureLength) return false;

    // Check that all values are 0 or 1
    return pattern.every((beat) => beat === 0 || beat === 1);
  }

  /**
   * Convert JSON fractional patterns to binary patterns
   * JSON patterns represent note durations at beat positions
   */
  convertFractionalToBinary(fractionalPattern, timeSignatureObj) {
    const binaryPattern = new Array(timeSignatureObj.measureLength).fill(0);

    // For 4/4 time, fractional patterns typically represent 4 beat positions.
    // For 6/8, fractional patterns represent 6 eighth-note positions (use subdivisions, not beats).
    const beatsPerMeasure = timeSignatureObj.subdivisions ?? timeSignatureObj.beats;
    const sixteenthsPerBeat = timeSignatureObj.measureLength / beatsPerMeasure;

    fractionalPattern.forEach((value, beatIndex) => {
      if (value > 0) {
        // Calculate the sixteenth note position for this beat
        const startPosition = beatIndex * sixteenthsPerBeat;

        // For simplicity, place a note at the start of the beat
        // regardless of the fractional value (the value indicates presence/absence)
        const position = Math.floor(startPosition);
        if (position < binaryPattern.length) {
          binaryPattern[position] = 1;
        }

        // If the fractional value is large enough, add additional notes
        // This handles cases like dotted quarters or longer notes
        if (value >= 0.5) {
          // Add a note at the halfway point of the beat
          const halfBeatPosition = Math.floor(
            startPosition + sixteenthsPerBeat / 2
          );
          if (halfBeatPosition < binaryPattern.length) {
            binaryPattern[halfBeatPosition] = 1;
          }
        }
      }
    });

    return binaryPattern;
  }
}

/**
 * Create pattern generator instance
 */
export function createPatternGenerator() {
  return new HybridPatternService();
}

/**
 * Main pattern generation function
 * Alternates between curated and generated patterns
 * @param {string} timeSignature - Time signature name (e.g. "4/4")
 * @param {string} difficulty - Difficulty level
 * @param {string[]|null} allowedPatterns - Optional array of duration name strings to constrain generation (e.g. ['quarter','half']). When provided, curated patterns are skipped and generative logic is constrained to these durations. Pass null for free-play behavior.
 */
export async function getPattern(
  timeSignature,
  difficulty,
  allowedPatterns = null
) {

  const generator = createPatternGenerator();
  const timeSignatureObj =
    TIME_SIGNATURES[
      Object.keys(TIME_SIGNATURES).find(
        (key) => TIME_SIGNATURES[key].name === timeSignature
      )
    ];

  if (!timeSignatureObj) {
    throw new Error(`Unsupported time signature: ${timeSignature}`);
  }

  // When allowedPatterns is specified, skip curated patterns and constrain generation
  const useAllowedPatterns = Array.isArray(allowedPatterns) && allowedPatterns.length > 0;

  let result = null;

  // Try curated pattern first (only when no allowedPatterns constraint)
  if (!useAllowedPatterns) {
    result = await generator.getCuratedPattern(timeSignature, difficulty);
  }

  // Fallback to generated pattern (or forced when constrained)
  if (!result) {
    if (useAllowedPatterns) {
      // Temporarily override generation rules with constrained subdivisions
      const diffKey = difficulty || DIFFICULTY_LEVELS.BEGINNER;
      const originalRules = GENERATION_RULES[diffKey] || GENERATION_RULES[DIFFICULTY_LEVELS.BEGINNER];
      const allowedValues = allowedPatterns
        .map(name => generator.getDurationValue(name))
        .filter(v => v !== null);
      if (allowedValues.length > 0) {
        const intersection = originalRules.allowedSubdivisions.filter(v =>
          allowedValues.some(av => Math.abs(av - v) < 0.001)
        );
        if (intersection.length > 0) {
          // Create a temporary rules copy with constrained subdivisions
          const constrainedRules = { ...originalRules, allowedSubdivisions: intersection };
          // Temporarily replace in GENERATION_RULES for the generatePattern call
          GENERATION_RULES[diffKey] = constrainedRules;
          result = generator.generatePattern(timeSignatureObj, difficulty);
          // Restore original rules immediately
          GENERATION_RULES[diffKey] = originalRules;
        } else {
          result = generator.generatePattern(timeSignatureObj, difficulty);
        }
      } else {
        result = generator.generatePattern(timeSignatureObj, difficulty);
      }
    } else {
      result = generator.generatePattern(timeSignatureObj, difficulty);
    }
  }

  // Convert legacy fractional patterns to binary if needed
  if (result && result.source === "curated" && result.pattern.length > 0) {
    // Check if pattern uses fractional values (legacy format)
    if (result.pattern.some((val) => val > 0 && val < 1)) {
      result.pattern = generator.convertFractionalToBinary(
        result.pattern,
        timeSignatureObj
      );
      result.converted = true;
    }
  }

  // Validate the final pattern
  if (
    result &&
    !generator.validateBinaryPattern(result.pattern, timeSignatureObj)
  ) {
    console.warn("Invalid pattern generated, falling back to simple pattern");

    // Create appropriate fallback pattern for the time signature
    const fallbackPattern = new Array(timeSignatureObj.measureLength).fill(0);
    // Add notes at each subdivision position using the compound-aware multiplier
    const fallbackSubdivisionCount = timeSignatureObj.subdivisions ?? timeSignatureObj.beats;
    const fallbackMultiplier = timeSignatureObj.measureLength / fallbackSubdivisionCount;
    for (let i = 0; i < fallbackSubdivisionCount; i++) {
      const pos = Math.round(i * fallbackMultiplier);
      if (pos < fallbackPattern.length) {
        fallbackPattern[pos] = 1;
      }
    }

    result = {
      pattern: fallbackPattern,
      source: "fallback",
      timeSignature: timeSignatureObj.name,
      difficulty,
    };
    
  }

  return result;
}

/**
 * Get available difficulty levels
 */
export function getAvailableDifficulties() {
  return Object.values(DIFFICULTY_LEVELS);
}

/**
 * Get available time signatures
 */
export function getTimeSignatures() {
  return Object.values(TIME_SIGNATURES);
}

/**
 * Utility function to calculate pattern complexity score
 */
export function calculatePatternComplexity(pattern) {
  if (!pattern || pattern.length === 0) return 0;

  const totalBeats = pattern.filter((beat) => beat === 1).length;
  const density = totalBeats / pattern.length;

  // Calculate syncopation (sounds on weak subdivisions)
  let syncopation = 0;
  for (let i = 1; i < pattern.length; i += 2) {
    if (pattern[i] === 1) syncopation++;
  }

  // Complexity score (0-10)
  const complexityScore = Math.min(
    10,
    density * 4 + // Density contributes 0-4 points
      syncopation * 0.5 + // Syncopation contributes 0-2+ points
      (totalBeats > 8 ? 2 : 0) // Bonus for high note count
  );

  return Math.round(complexityScore * 10) / 10; // Round to 1 decimal
}

/**
 * Generate multiple patterns for practice session
 */
export async function generatePracticeSession(
  timeSignature,
  difficulty,
  patternCount = 5
) {
  const patterns = [];

  for (let i = 0; i < patternCount; i++) {
    const pattern = await getPattern(timeSignature, difficulty);
    patterns.push(pattern);
  }

  return patterns;
}

export default {
  createPatternGenerator,
  getPattern,
  generatePracticeSession,
  getAvailableDifficulties,
  getTimeSignatures,
  calculatePatternComplexity,
  DURATION_CONSTANTS,
  TIME_SIGNATURES,
  DIFFICULTY_LEVELS,
};
