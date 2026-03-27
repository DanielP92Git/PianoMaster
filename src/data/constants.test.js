import { describe, it, expect } from 'vitest';
import { EXERCISE_TYPES, NODE_CATEGORIES, TRAIL_TAB_CONFIGS } from './constants.js';
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
    expect(config.totalCards).toBe(30);
    expect(config.targetCount).toBe(8);
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

describe('v2.9 EXERCISE_TYPES additions (INFRA-01)', () => {
  it('has RHYTHM_TAP', () => {
    expect(EXERCISE_TYPES.RHYTHM_TAP).toBe('rhythm_tap');
  });
  it('has RHYTHM_DICTATION', () => {
    expect(EXERCISE_TYPES.RHYTHM_DICTATION).toBe('rhythm_dictation');
  });
  it('has ARCADE_RHYTHM', () => {
    expect(EXERCISE_TYPES.ARCADE_RHYTHM).toBe('arcade_rhythm');
  });
  it('has PITCH_COMPARISON', () => {
    expect(EXERCISE_TYPES.PITCH_COMPARISON).toBe('pitch_comparison');
  });
  it('has INTERVAL_ID', () => {
    expect(EXERCISE_TYPES.INTERVAL_ID).toBe('interval_id');
  });
});

describe('NODE_CATEGORIES EAR_TRAINING (INFRA-02)', () => {
  it('has EAR_TRAINING category', () => {
    expect(NODE_CATEGORIES.EAR_TRAINING).toBe('ear_training');
  });
});

describe('TRAIL_TAB_CONFIGS (INFRA-04)', () => {
  it('exports an array of 4 tab configs', () => {
    expect(TRAIL_TAB_CONFIGS).toHaveLength(4);
  });
  it('first tab is treble', () => {
    expect(TRAIL_TAB_CONFIGS[0].id).toBe('treble');
  });
  it('fourth tab is ear_training with correct config', () => {
    const ear = TRAIL_TAB_CONFIGS[3];
    expect(ear.id).toBe('ear_training');
    expect(ear.label).toBe('Ear Training');
    expect(ear.categoryKey).toBe('EAR_TRAINING');
    expect(ear.bossPrefix).toBe('boss_ear');
  });
  it('each config has required keys', () => {
    const requiredKeys = ['id', 'label', 'categoryKey', 'icon', 'colorActive', 'colorBorder', 'colorGlow', 'bossPrefix'];
    for (const tab of TRAIL_TAB_CONFIGS) {
      for (const key of requiredKeys) {
        expect(tab).toHaveProperty(key);
      }
      expect(tab.icon).toBeTruthy();
    }
  });
  it('tab order is treble, bass, rhythm, ear_training (per D-11)', () => {
    expect(TRAIL_TAB_CONFIGS.map(t => t.id)).toEqual(['treble', 'bass', 'rhythm', 'ear_training']);
  });
});
