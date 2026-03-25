import { describe, it, expect } from 'vitest';
import {
  generateCardSequence,
  getSpeedForCard,
  calculateScore
} from './NoteSpeedCards.jsx';

describe('generateCardSequence', () => {
  it('returns array of correct total length', () => {
    const seq = generateCardSequence(20, 5, 'C4', ['D4', 'E4', 'F4', 'G4', 'A4']);
    expect(seq).toHaveLength(20);
  });

  it('contains exactly targetCount target cards', () => {
    const seq = generateCardSequence(20, 5, 'C4', ['D4', 'E4', 'F4', 'G4', 'A4']);
    const targets = seq.filter(c => c.isTarget);
    expect(targets).toHaveLength(5);
  });

  it('each card has { id, pitch, isTarget } shape', () => {
    const seq = generateCardSequence(20, 5, 'C4', ['D4', 'E4', 'F4', 'G4', 'A4']);
    for (const card of seq) {
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('pitch');
      expect(card).toHaveProperty('isTarget');
      expect(typeof card.id).toBe('number');
      expect(typeof card.pitch).toBe('string');
      expect(typeof card.isTarget).toBe('boolean');
    }
  });

  it('target cards have the target pitch', () => {
    const seq = generateCardSequence(20, 5, 'C4', ['D4', 'E4', 'F4', 'G4', 'A4']);
    const targets = seq.filter(c => c.isTarget);
    for (const t of targets) {
      expect(t.pitch).toBe('C4');
    }
  });

  it('distractor cards have pitches from the distractor pool', () => {
    const distractors = ['D4', 'E4', 'F4', 'G4', 'A4'];
    const seq = generateCardSequence(20, 5, 'C4', distractors);
    const nonTargets = seq.filter(c => !c.isTarget);
    for (const card of nonTargets) {
      expect(distractors).toContain(card.pitch);
    }
  });
});

describe('getSpeedForCard', () => {
  it('returns 2500 for cards 0-7 (learning tier)', () => {
    for (let i = 0; i < 8; i++) {
      expect(getSpeedForCard(i)).toBe(2500);
    }
  });

  it('returns 2000 for cards 8-15 (warming up tier)', () => {
    for (let i = 8; i < 16; i++) {
      expect(getSpeedForCard(i)).toBe(2000);
    }
  });

  it('returns 1700 for cards 16-23 (challenge tier)', () => {
    for (let i = 16; i < 24; i++) {
      expect(getSpeedForCard(i)).toBe(1700);
    }
  });

  it('returns 1400 for cards 24-29 (fast tier)', () => {
    for (let i = 24; i < 30; i++) {
      expect(getSpeedForCard(i)).toBe(1400);
    }
  });
});

describe('calculateScore', () => {
  it('returns 100 when all targets caught (5/5)', () => {
    expect(calculateScore(5, 5)).toBe(100);
  });

  it('returns 60 when 3 of 5 targets caught', () => {
    expect(calculateScore(3, 5)).toBe(60);
  });

  it('returns 0 when no targets caught', () => {
    expect(calculateScore(0, 5)).toBe(0);
  });
});
