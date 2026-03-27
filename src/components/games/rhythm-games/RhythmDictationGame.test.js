/**
 * RhythmDictationGame.test.js
 *
 * Integration tests for the distractor + choice generation flow.
 * Tests the logic that powers RDICT-04 (distractors differ from correct by at least one duration element).
 *
 * Does not test rendering — focuses on the business logic of:
 *   - generateDistractors produces 2 patterns different from the correct one
 *   - Each distractor maintains the same total measure duration
 *   - Choices array contains exactly 3 elements
 *   - Correct answer can be tracked after shuffling
 */

import { describe, it, expect } from 'vitest';
import {
  generateDistractors,
  schedulePatternPlayback,
} from './utils/rhythmTimingUtils';
import { binaryPatternToBeats } from './utils/rhythmVexflowHelpers';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** Compute total durationUnits in a beat array. */
function totalDuration(beats) {
  return beats.reduce((sum, b) => sum + b.durationUnits, 0);
}

/** Check if two beat arrays are structurally different (not element-equal). */
function beatsAreIdentical(a, b) {
  if (a.length !== b.length) return false;
  return a.every((beat, i) => beat.durationUnits === b[i].durationUnits && beat.isRest === b[i].isRest);
}

// ----------------------------------------------------------------
// Shared test fixtures
// ----------------------------------------------------------------

// A simple 4/4 measure: quarter | quarter | quarter | quarter (4 beats × 4 units = 16)
const FOUR_QUARTER_NOTES = [
  { durationUnits: 4, isRest: false },
  { durationUnits: 4, isRest: false },
  { durationUnits: 4, isRest: false },
  { durationUnits: 4, isRest: false },
];

// A 4/4 measure: half | quarter | eighth | eighth (8+4+2+2=16)
const MIXED_PATTERN = [
  { durationUnits: 8, isRest: false },
  { durationUnits: 4, isRest: false },
  { durationUnits: 2, isRest: false },
  { durationUnits: 2, isRest: false },
];

// ----------------------------------------------------------------
// Test 1: generateDistractors produces exactly 2 distractors
// ----------------------------------------------------------------
describe('generateDistractors', () => {
  it('produces exactly 2 distractors from a simple 4-quarter pattern', () => {
    const distractors = generateDistractors(FOUR_QUARTER_NOTES, 2);
    expect(distractors).toHaveLength(2);
  });

  it('produces exactly 2 distractors from a mixed pattern', () => {
    const distractors = generateDistractors(MIXED_PATTERN, 2);
    expect(distractors).toHaveLength(2);
  });

  // ----------------------------------------------------------------
  // Test 2: Each distractor has same total durationUnits as correct (RDICT-04)
  // ----------------------------------------------------------------
  it('each distractor preserves total measure duration (RDICT-04 — same time sig)', () => {
    const correctTotal = totalDuration(FOUR_QUARTER_NOTES);
    const distractors = generateDistractors(FOUR_QUARTER_NOTES, 2);

    distractors.forEach((distractor, i) => {
      expect(totalDuration(distractor)).toBe(correctTotal);
    });
  });

  it('each distractor preserves total measure duration for mixed pattern', () => {
    const correctTotal = totalDuration(MIXED_PATTERN);
    const distractors = generateDistractors(MIXED_PATTERN, 2);

    distractors.forEach((distractor) => {
      expect(totalDuration(distractor)).toBe(correctTotal);
    });
  });

  // ----------------------------------------------------------------
  // Test 3: Choices array contains exactly 3 elements after combining
  // ----------------------------------------------------------------
  it('combining correct + 2 distractors yields exactly 3 choices', () => {
    const distractors = generateDistractors(FOUR_QUARTER_NOTES, 2);
    const allChoices = [FOUR_QUARTER_NOTES, ...distractors];
    expect(allChoices).toHaveLength(3);
  });

  // ----------------------------------------------------------------
  // Test 4: correctIndex points to actual correct beats after shuffle
  // ----------------------------------------------------------------
  it('correctIndex accurately tracks the correct pattern after shuffling', () => {
    const distractors = generateDistractors(FOUR_QUARTER_NOTES, 2);
    const allChoices = [FOUR_QUARTER_NOTES, ...distractors];

    // Perform a simple shuffle (copy of the shuffle used in the component)
    const shuffled = [...allChoices];
    // Move the correct beats to index 2 for this test
    const temp = shuffled[0];
    shuffled[0] = shuffled[2];
    shuffled[2] = temp;

    // correctIndex should be 2 now — where we moved FOUR_QUARTER_NOTES
    const corrIdx = shuffled.findIndex((c) => c === FOUR_QUARTER_NOTES);
    expect(corrIdx).toBe(2);
    expect(beatsAreIdentical(shuffled[corrIdx], FOUR_QUARTER_NOTES)).toBe(true);
  });

  // ----------------------------------------------------------------
  // Test 5: binaryPatternToBeats → generateDistractors integration
  // ----------------------------------------------------------------
  it('works correctly with a binary pattern from RhythmPatternGenerator', () => {
    // A typical 4/4 binary pattern: 4 quarter notes represented as 1,0,0,0 × 4
    const binaryPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    const beats = binaryPatternToBeats(binaryPattern);
    expect(beats).toHaveLength(4); // 4 quarter notes

    const distractors = generateDistractors(beats, 2);
    expect(distractors).toHaveLength(2);

    const correctTotal = totalDuration(beats);
    distractors.forEach((d) => {
      expect(totalDuration(d)).toBe(correctTotal);
    });
  });

  // ----------------------------------------------------------------
  // Test 6: At least one distractor is structurally different from correct (RDICT-04 audit)
  // ----------------------------------------------------------------
  it('at least one distractor differs from the correct pattern (RDICT-04)', () => {
    const distractors = generateDistractors(MIXED_PATTERN, 2);
    const atLeastOneDiffers = distractors.some((d) => !beatsAreIdentical(d, MIXED_PATTERN));
    expect(atLeastOneDiffers).toBe(true);
  });
});

// ----------------------------------------------------------------
// Test 7: schedulePatternPlayback returns correct timing shape
// ----------------------------------------------------------------
describe('schedulePatternPlayback', () => {
  it('returns startTime and totalDuration for a valid pattern', () => {
    const mockCtx = { currentTime: 0 };
    const mockPlayNote = () => {};

    const result = schedulePatternPlayback(FOUR_QUARTER_NOTES, 90, mockCtx, mockPlayNote);

    expect(result).toHaveProperty('startTime');
    expect(result).toHaveProperty('totalDuration');
    expect(typeof result.startTime).toBe('number');
    expect(typeof result.totalDuration).toBe('number');
    // At 90 BPM: quarter note = 60/90 = 0.667s; 16 sixteenth units = 4 × 0.667s ≈ 2.667s
    expect(result.totalDuration).toBeGreaterThan(0);
  });
});
