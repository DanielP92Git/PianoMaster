/**
 * Rhythm Analyzer Utility
 * Converts sixteenth-note subdivision patterns into proper musical notation
 * with correct note durations and rest placements
 */

/**
 * VEXFLOW INTEGRATION NOTES:
 * 
 * The generateEasyScoreString function creates partial EasyScore strings
 * containing only duration information (e.g., "q, h, q/r").
 * 
 * Full EasyScore notes with pitches (e.g., "C4/q, D4/h, E4/q/r") are 
 * generated in usePatternGeneration.js after pitches are assigned.
 * 
 * Example transformation:
 * 1. rhythmAnalyzer.js: "q, h, q/r" (durations only)
 * 2. usePatternGeneration.js: "C4/q, D4/h, E4/q/r" (with pitches)
 */

import { DURATION_CONSTANTS } from '../../rhythm-games/RhythmPatternGenerator';

/**
 * Maps sixteenth-note counts to standard musical durations
 */
const DURATION_MAP = {
  16: { name: 'whole', beats: 4, notation: 'whole' },
  12: { name: 'dotted-half', beats: 3, notation: 'dotted-half' },
  8: { name: 'half', beats: 2, notation: 'half' },
  6: { name: 'dotted-quarter', beats: 1.5, notation: 'dotted-quarter' },
  4: { name: 'quarter', beats: 1, notation: 'quarter' },
  3: { name: 'dotted-eighth', beats: 0.75, notation: 'dotted-eighth' },
  2: { name: 'eighth', beats: 0.5, notation: 'eighth' },
  1: { name: 'sixteenth', beats: 0.25, notation: 'sixteenth' }
};

/**
 * Maps notation types to VexFlow EasyScore duration codes
 */
const NOTATION_TO_EASYSCORE = {
  'whole': 'w',
  'dotted-half': 'h.',
  'half': 'h',
  'dotted-quarter': 'q.',
  'quarter': 'q',
  'dotted-eighth': '8.',
  'eighth': '8',
  'sixteenth': '16'
};

/**
 * Difficulty-based quantization rules
 * Defines which note values are allowed for each difficulty level
 */
const QUANTIZATION_RULES = {
  beginner: [16, 12, 8, 4], // whole, dotted-half, half, quarter
  intermediate: [16, 12, 8, 6, 4, 2], // + dotted-quarter, eighth
  advanced: [16, 12, 8, 6, 4, 3, 2, 1] // all durations
};

/**
 * Quantize a duration to the nearest allowed value for the difficulty level
 */
function quantizeDuration(sixteenthUnits, difficulty) {
  const allowedDurations = QUANTIZATION_RULES[difficulty];
  
  // Find the closest allowed duration
  let closest = allowedDurations[0];
  let minDiff = Math.abs(sixteenthUnits - closest);
  
  for (const duration of allowedDurations) {
    const diff = Math.abs(sixteenthUnits - duration);
    if (diff < minDiff) {
      minDiff = diff;
      closest = duration;
    }
  }
  
  return closest;
}

/**
 * Groups consecutive sounds (1s) or rests (0s) in a pattern
 * Returns array of { type, count, startIndex }
 */
function groupPattern(pattern) {
  const groups = [];
  let currentType = null;
  let currentCount = 0;
  let startIndex = 0;
  
  for (let i = 0; i < pattern.length; i++) {
    const value = pattern[i];
    const type = value === 1 ? 'note' : 'rest';
    
    if (type === currentType) {
      currentCount++;
    } else {
      // Save previous group if it exists
      if (currentType !== null) {
        groups.push({
          type: currentType,
          count: currentCount,
          startIndex: startIndex
        });
      }
      
      // Start new group
      currentType = type;
      currentCount = 1;
      startIndex = i;
    }
  }
  
  // Don't forget the last group
  if (currentType !== null) {
    groups.push({
      type: currentType,
      count: currentCount,
      startIndex: startIndex
    });
  }
  
  return groups;
}

/**
 * Split a large duration into smaller standard note values
 * For example, 10 sixteenths might become [8, 2] (half + eighth)
 */
function splitDuration(sixteenthUnits, allowedDurations) {
  const result = [];
  let remaining = sixteenthUnits;
  
  // Sort allowed durations from largest to smallest
  const sorted = [...allowedDurations].sort((a, b) => b - a);
  
  while (remaining > 0) {
    // Find the largest duration that fits
    let found = false;
    for (const duration of sorted) {
      if (duration <= remaining) {
        result.push(duration);
        remaining -= duration;
        found = true;
        break;
      }
    }
    
    // Safety: if no duration fits, use the smallest
    if (!found) {
      result.push(sorted[sorted.length - 1]);
      break;
    }
  }
  
  return result;
}

/**
 * Main function: Analyze rhythm pattern and convert to notation objects
 * 
 * @param {Array<number>} pattern - Array of 1s (sounds) and 0s (rests)
 * @param {string} difficulty - 'beginner', 'intermediate', or 'advanced'
 * @param {Object} timeSignature - Time signature object with beats and subdivision
 * @param {number} measuresPerPattern - Number of measures in the pattern (default: 1)
 * @returns {Array<Object>} Array of notation objects with type, duration, timing info
 */
export function analyzeRhythmPattern(pattern, difficulty, timeSignature, measuresPerPattern = 1) {
  
  const groups = groupPattern(pattern);
  const allowedDurations = QUANTIZATION_RULES[difficulty];
  const notationObjects = [];
  
  let currentPosition = 0; // Position in sixteenth notes
  
  for (const group of groups) {
    const { type, count } = group;
    
    // Don't create notes/rests beyond the measure length
    if (currentPosition >= timeSignature.subdivision) {
      break;
    }
    
    // Calculate how much space is left in the measure
    const remainingSpace = timeSignature.subdivision - currentPosition;
    const actualCount = Math.min(count, remainingSpace);
    
    // Determine if we need to split this duration
    let durations;
    
    if (difficulty === 'beginner' || difficulty === 'intermediate') {
      // Quantize to nearest allowed value
      const quantized = quantizeDuration(actualCount, difficulty);
      
      // Use the quantized value as a single note/rest
      durations = [quantized];
    } else {
      // Advanced: allow complex durations or split if not standard
      if (DURATION_MAP[actualCount]) {
        durations = [actualCount];
      } else {
        // Split into standard durations
        durations = splitDuration(actualCount, allowedDurations);
      }
    }
    
    // Create notation objects for each duration
    for (const duration of durations) {
      // Stop if we've filled the measure
      if (currentPosition >= timeSignature.subdivision) {
        break;
      }
      
      const durationInfo = DURATION_MAP[duration];
      
      if (durationInfo) {
        // Add the notation object (note or rest) as-is
        notationObjects.push({
          type: type,
          notation: durationInfo.notation,
          duration: durationInfo.beats,
          sixteenthUnits: duration,
          startPosition: currentPosition,
          startTime: null, // Will be calculated with tempo
          endPosition: currentPosition + duration
        });
        
        currentPosition += duration;
      }
    }
  }
  
  return notationObjects;
}

/**
 * Calculate start times in seconds for each notation object based on tempo
 * 
 * @param {Array<Object>} notationObjects - Array from analyzeRhythmPattern
 * @param {number} tempo - Beats per minute
 * @param {Object} timeSignature - Time signature info
 * @returns {Array<Object>} Same array with startTime populated
 */
export function calculateTiming(notationObjects, tempo, timeSignature) {
  const secondsPerBeat = 60 / tempo;
  const secondsPerSixteenth = secondsPerBeat / 4; // 4 sixteenths per beat
  
  return notationObjects.map(obj => ({
    ...obj,
    startTime: obj.startPosition * secondsPerSixteenth,
    endTime: obj.endPosition * secondsPerSixteenth
  }));
}

/**
 * Helper to get total duration in beats
 */
export function getTotalDuration(notationObjects) {
  return notationObjects.reduce((sum, obj) => sum + obj.duration, 0);
}

/**
 * Generate VexFlow EasyScore string from notation objects
 * Note: This generates duration strings only (no pitch)
 * Pitches will be added during pattern generation
 * 
 * @param {Array<Object>} notationObjects - Array from analyzeRhythmPattern
 * @returns {string} EasyScore format string (durations only, e.g., "q, q, h")
 */
export function generateEasyScoreString(notationObjects) {
  const easyscoreParts = notationObjects.map(obj => {
    const duration = NOTATION_TO_EASYSCORE[obj.notation];
    
    if (!duration) {
      console.warn(`Unknown notation type: ${obj.notation}`);
      return 'q'; // fallback to quarter
    }
    
    // Add rest suffix for rests
    if (obj.type === 'rest') {
      return `${duration}/r`;
    }
    
    // For notes, return just the duration (pitch added later)
    return duration;
  });
  
  return easyscoreParts.join(', ');
}

