import { describe, it, expect } from 'vitest';
import { EXERCISE_TYPES } from './constants.js';
import { trebleUnit1Nodes } from './units/trebleUnit1Redesigned.js';
import { bassUnit1Nodes } from './units/bassUnit1Redesigned.js';

describe('EXERCISE_TYPES', () => {
  it('includes NOTE_CATCH exercise type (REQ-01)', () => {
    expect(EXERCISE_TYPES).toHaveProperty('NOTE_CATCH');
    expect(EXERCISE_TYPES.NOTE_CATCH).toBe('note_catch');
  });
});

describe('First trail nodes use note_catch exercise type (REQ-05)', () => {
  it('treble_1_1 first exercise is note_catch', () => {
    const treble11 = trebleUnit1Nodes.find(n => n.id === 'treble_1_1');
    expect(treble11).toBeDefined();
    expect(treble11.exercises[0].type).toBe(EXERCISE_TYPES.NOTE_CATCH);
  });

  it('treble_1_1 config has targetNote and distractorNotes', () => {
    const treble11 = trebleUnit1Nodes.find(n => n.id === 'treble_1_1');
    const config = treble11.exercises[0].config;
    expect(config.targetNote).toBe('C4');
    expect(config.distractorNotes).toEqual(expect.arrayContaining(['D4', 'E4']));
    expect(config.totalCards).toBe(20);
    expect(config.targetCount).toBe(5);
  });

  it('bass_1_1 first exercise is note_catch', () => {
    const bass11 = bassUnit1Nodes.find(n => n.id === 'bass_1_1');
    expect(bass11).toBeDefined();
    expect(bass11.exercises[0].type).toBe(EXERCISE_TYPES.NOTE_CATCH);
  });

  it('bass_1_1 config has bass-appropriate distractors', () => {
    const bass11 = bassUnit1Nodes.find(n => n.id === 'bass_1_1');
    const config = bass11.exercises[0].config;
    expect(config.targetNote).toBe('C4');
    expect(config.distractorNotes).toEqual(expect.arrayContaining(['B3', 'A3']));
    expect(config.clef).toBe('bass');
  });
});
