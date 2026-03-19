import { describe, it, expect } from 'vitest';
import { rhythmUnit7Nodes } from './rhythmUnit7Redesigned.js';
import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

describe('Rhythm Unit 7 — 6/8 Compound Meter', () => {
  it('exports exactly 7 nodes', () => {
    expect(rhythmUnit7Nodes).toHaveLength(7);
  });

  it('all node IDs are unique', () => {
    const ids = rhythmUnit7Nodes.map(n => n.id);
    expect(new Set(ids).size).toBe(7);
  });

  it('node IDs follow naming convention', () => {
    const ids = rhythmUnit7Nodes.map(n => n.id);
    expect(ids).toEqual([
      'rhythm_7_1',
      'rhythm_7_2',
      'rhythm_7_3',
      'rhythm_7_4',
      'rhythm_7_5',
      'rhythm_7_6',
      'boss_rhythm_7'
    ]);
  });

  it('orders are sequential from 142 to 148', () => {
    const orders = rhythmUnit7Nodes.map(n => n.order);
    expect(orders).toEqual([142, 143, 144, 145, 146, 147, 148]);
  });

  it('prerequisite chain is valid', () => {
    // First node requires boss_rhythm_6
    expect(rhythmUnit7Nodes[0].prerequisites).toEqual(['boss_rhythm_6']);
    // Each subsequent node requires the previous node's ID
    for (let i = 1; i < rhythmUnit7Nodes.length; i++) {
      expect(rhythmUnit7Nodes[i].prerequisites).toEqual([rhythmUnit7Nodes[i - 1].id]);
    }
  });

  it('all nodes use 6/8 time signature', () => {
    rhythmUnit7Nodes.forEach(node => {
      expect(node.rhythmConfig.timeSignature).toBe('6/8');
      expect(node.exercises[0].config.timeSignature).toBe('6/8');
    });
  });

  it('all nodes use pitch C4', () => {
    rhythmUnit7Nodes.forEach(node => {
      expect(node.rhythmConfig.pitch).toBe('C4');
    });
  });

  it('first node is a discovery with slow tempo and dotted-quarter only', () => {
    const first = rhythmUnit7Nodes[0];
    expect(first.nodeType).toBe(NODE_TYPES.DISCOVERY);
    expect(first.rhythmConfig.tempo.default).toBeLessThanOrEqual(60);
    expect(first.rhythmConfig.durations).toEqual(['qd']);
  });

  it('first node has correct newContentDescription', () => {
    expect(rhythmUnit7Nodes[0].newContentDescription).toBe('6/8 Time: Two big beats per bar');
  });

  it('last node is mini-boss with correct properties', () => {
    const last = rhythmUnit7Nodes[rhythmUnit7Nodes.length - 1];
    expect(last.id).toBe('boss_rhythm_7');
    expect(last.nodeType).toBe(NODE_TYPES.MINI_BOSS);
    expect(last.category).toBe('boss');
    expect(last.isBoss).toBe(false);
  });

  it('regular nodes use rhythm category', () => {
    for (let i = 0; i < 6; i++) {
      expect(rhythmUnit7Nodes[i].category).toBe('rhythm');
    }
  });

  it('all exercises use RHYTHM type', () => {
    rhythmUnit7Nodes.forEach(node => {
      expect(node.exercises[0].type).toBe(EXERCISE_TYPES.RHYTHM);
    });
  });

  it('tempo increases across the unit', () => {
    const firstTempo = rhythmUnit7Nodes[0].rhythmConfig.tempo.default;
    const lastTempo = rhythmUnit7Nodes[6].rhythmConfig.tempo.default;
    expect(firstTempo).toBeLessThan(lastTempo);
  });

  it('duration vocabulary expands across the unit', () => {
    const firstDurations = rhythmUnit7Nodes[0].rhythmConfig.durations;
    const lastDurations = rhythmUnit7Nodes[6].rhythmConfig.durations;
    // First node has only 'qd', last node has 'qd', 'q', '8'
    expect(firstDurations.length).toBeLessThanOrEqual(lastDurations.length);
    expect(firstDurations.length).toBe(1);
    expect(lastDurations.length).toBeGreaterThan(1);
  });

  it('xpReward values are in valid range', () => {
    // Regular nodes: 75-90, mini-boss: 150
    for (let i = 0; i < 6; i++) {
      const xp = rhythmUnit7Nodes[i].xpReward;
      expect(xp).toBeGreaterThanOrEqual(75);
      expect(xp).toBeLessThanOrEqual(90);
    }
    expect(rhythmUnit7Nodes[6].xpReward).toBe(150);
  });
});
