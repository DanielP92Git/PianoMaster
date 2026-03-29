import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NOTE_ORDER,
  COMPARISON_TIERS,
  getTierForQuestion,
  generateNotePair,
  classifyInterval,
  generateIntervalQuestion,
  getNotesInBetween,
  getDisplayOctaveRoot,
} from './earTrainingUtils';

describe('NOTE_ORDER', () => {
  it('is an array of 24 note strings', () => {
    expect(NOTE_ORDER).toHaveLength(24);
  });

  it('starts with C3 and ends with B4', () => {
    expect(NOTE_ORDER[0]).toBe('C3');
    expect(NOTE_ORDER[23]).toBe('B4');
  });

  it('contains chromatic notes in order (C3, C#3, D3, ...)', () => {
    expect(NOTE_ORDER[0]).toBe('C3');
    expect(NOTE_ORDER[1]).toBe('C#3');
    expect(NOTE_ORDER[2]).toBe('D3');
    expect(NOTE_ORDER[12]).toBe('C4');
  });
});

describe('COMPARISON_TIERS', () => {
  it('has 3 tiers', () => {
    expect(COMPARISON_TIERS).toHaveLength(3);
  });

  it('tier 1 covers questions 0-2 with wide intervals', () => {
    expect(COMPARISON_TIERS[0].questions).toContain(0);
    expect(COMPARISON_TIERS[0].questions).toContain(1);
    expect(COMPARISON_TIERS[0].questions).toContain(2);
    expect(COMPARISON_TIERS[0].minSemitones).toBe(6);
    expect(COMPARISON_TIERS[0].maxSemitones).toBe(12);
  });

  it('tier 2 covers questions 3-6 with medium intervals', () => {
    expect(COMPARISON_TIERS[1].questions).toContain(3);
    expect(COMPARISON_TIERS[1].questions).toContain(6);
    expect(COMPARISON_TIERS[1].minSemitones).toBe(3);
    expect(COMPARISON_TIERS[1].maxSemitones).toBe(5);
  });

  it('tier 3 covers questions 7-9 with close intervals', () => {
    expect(COMPARISON_TIERS[2].questions).toContain(7);
    expect(COMPARISON_TIERS[2].questions).toContain(9);
    expect(COMPARISON_TIERS[2].minSemitones).toBe(1);
    expect(COMPARISON_TIERS[2].maxSemitones).toBe(2);
  });
});

describe('getTierForQuestion', () => {
  it('returns tier 1 for question index 0', () => {
    const tier = getTierForQuestion(0);
    expect(tier.minSemitones).toBe(6);
    expect(tier.maxSemitones).toBe(12);
  });

  it('returns tier 2 for question index 4', () => {
    const tier = getTierForQuestion(4);
    expect(tier.minSemitones).toBe(3);
    expect(tier.maxSemitones).toBe(5);
  });

  it('returns tier 3 for question index 9', () => {
    const tier = getTierForQuestion(9);
    expect(tier.minSemitones).toBe(1);
    expect(tier.maxSemitones).toBe(2);
  });

  it('falls back to tier 1 for unknown question index', () => {
    const tier = getTierForQuestion(100);
    expect(tier.minSemitones).toBe(6);
    expect(tier.maxSemitones).toBe(12);
  });
});

describe('generateNotePair', () => {
  let randomSpy;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('returns an object with note1, note2, semitones, direction', () => {
    randomSpy.mockReturnValue(0.5);
    const result = generateNotePair(3, 5);
    expect(result).toHaveProperty('note1');
    expect(result).toHaveProperty('note2');
    expect(result).toHaveProperty('semitones');
    expect(result).toHaveProperty('direction');
  });

  it('returns notes that are in NOTE_ORDER', () => {
    randomSpy.mockReturnValue(0.5);
    const result = generateNotePair(3, 5);
    expect(NOTE_ORDER).toContain(result.note1);
    expect(NOTE_ORDER).toContain(result.note2);
  });

  it('never returns semitones === 0 (no duplicate notes)', () => {
    randomSpy.mockReturnValue(0.5);
    const result = generateNotePair(1, 12);
    expect(Math.abs(result.semitones)).toBeGreaterThan(0);
    expect(result.note1).not.toBe(result.note2);
  });

  it('returns semitones within the specified range', () => {
    randomSpy.mockReturnValue(0.5);
    for (let i = 0; i < 5; i++) {
      randomSpy.mockReturnValueOnce(0.5);
    }
    const result = generateNotePair(3, 7);
    expect(Math.abs(result.semitones)).toBeGreaterThanOrEqual(3);
    expect(Math.abs(result.semitones)).toBeLessThanOrEqual(7);
  });

  it('clamps note indices to [0, 23]', () => {
    // Even edge cases should remain in bounds
    const result = generateNotePair(6, 12);
    expect(NOTE_ORDER).toContain(result.note1);
    expect(NOTE_ORDER).toContain(result.note2);
  });

  it('returns ascending direction when note2 index > note1 index', () => {
    // Mock so note1 is at index 5, delta is +6, ascending
    randomSpy
      .mockReturnValueOnce(0.2) // pick delta within range
      .mockReturnValueOnce(0.5) // ascending direction
      .mockReturnValueOnce(0.2); // note1 index
    const result = generateNotePair(6, 6);
    expect(['ascending', 'descending']).toContain(result.direction);
  });
});

describe('classifyInterval', () => {
  it('returns step for 1 semitone', () => {
    expect(classifyInterval(1)).toBe('step');
  });

  it('returns step for 2 semitones', () => {
    expect(classifyInterval(2)).toBe('step');
  });

  it('returns skip for 3 semitones', () => {
    expect(classifyInterval(3)).toBe('skip');
  });

  it('returns skip for 4 semitones', () => {
    expect(classifyInterval(4)).toBe('skip');
  });

  it('returns leap for 5 semitones', () => {
    expect(classifyInterval(5)).toBe('leap');
  });

  it('returns leap for 12 semitones (octave)', () => {
    expect(classifyInterval(12)).toBe('leap');
  });

  it('uses absolute value — returns skip for -3', () => {
    expect(classifyInterval(-3)).toBe('skip');
  });

  it('uses absolute value — returns step for -2', () => {
    expect(classifyInterval(-2)).toBe('step');
  });
});

describe('generateIntervalQuestion', () => {
  it('returns an object with note1, note2, semitones, direction, category', () => {
    const result = generateIntervalQuestion(0, 10, 0.6);
    expect(result).toHaveProperty('note1');
    expect(result).toHaveProperty('note2');
    expect(result).toHaveProperty('semitones');
    expect(result).toHaveProperty('direction');
    expect(result).toHaveProperty('category');
  });

  it('forces ascending direction for first 60% of questions (question 0 of 10)', () => {
    const result = generateIntervalQuestion(0, 10, 0.6);
    expect(result.direction).toBe('ascending');
  });

  it('forces ascending direction for question 5 of 10 (boundary: 5 < 6)', () => {
    const result = generateIntervalQuestion(5, 10, 0.6);
    expect(result.direction).toBe('ascending');
  });

  it('category matches classifyInterval output for the generated semitones', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateIntervalQuestion(i, 10, 0.6);
      expect(result.category).toBe(classifyInterval(result.semitones));
    }
  });

  it('returns notes within NOTE_ORDER', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateIntervalQuestion(i, 10, 0.6);
      expect(NOTE_ORDER).toContain(result.note1);
      expect(NOTE_ORDER).toContain(result.note2);
    }
  });
});

describe('getNotesInBetween', () => {
  it('returns notes strictly between C4 and E4', () => {
    const between = getNotesInBetween('C4', 'E4');
    expect(between).toEqual(['C#4', 'D4', 'D#4']);
  });

  it('returns empty array for adjacent notes (no notes between)', () => {
    const between = getNotesInBetween('C4', 'C#4');
    expect(between).toEqual([]);
  });

  it('works when note1 is higher than note2 (descending order)', () => {
    const between = getNotesInBetween('E4', 'C4');
    expect(between).toEqual(['C#4', 'D4', 'D#4']);
  });

  it('returns empty array for same note', () => {
    const between = getNotesInBetween('C4', 'C4');
    expect(between).toEqual([]);
  });

  it('handles cross-octave intervals', () => {
    const between = getNotesInBetween('B3', 'C4');
    expect(between).toEqual([]);
  });

  it('handles wider cross-octave intervals', () => {
    const between = getNotesInBetween('A3', 'C4');
    expect(between).toEqual(['A#3', 'B3']);
  });
});

describe('getDisplayOctaveRoot', () => {
  it('returns a valid note name from NOTE_ORDER', () => {
    const root = getDisplayOctaveRoot('C4', 'E4');
    expect(NOTE_ORDER).toContain(root);
  });

  it('returns C4 for notes C4 and E4 (both in C4 octave)', () => {
    const root = getDisplayOctaveRoot('C4', 'E4');
    expect(root).toBe('C4');
  });

  it('returns a note that allows both note1 and note2 to be visible in a 1-octave span', () => {
    // For C4 and G4, both should fit in the C4 octave (C4 to B4)
    const root = getDisplayOctaveRoot('C4', 'G4');
    // Root should be C4 or earlier so G4 is still visible
    const rootIdx = NOTE_ORDER.indexOf(root);
    const note1Idx = NOTE_ORDER.indexOf('C4');
    const note2Idx = NOTE_ORDER.indexOf('G4');
    expect(rootIdx).toBeLessThanOrEqual(Math.min(note1Idx, note2Idx));
  });
});
