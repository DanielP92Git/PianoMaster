import { describe, it, expect } from 'vitest';
import { earTrainingUnit1Nodes } from './units/earTrainingUnit1.js';
import { earTrainingUnit2Nodes } from './units/earTrainingUnit2.js';
import { EXERCISE_TYPES } from './constants.js';

describe('Ear Training Unit 1: Sound Direction', () => {
  it('exports exactly 7 nodes', () => {
    expect(earTrainingUnit1Nodes).toHaveLength(7);
  });

  it('has correct node IDs in order', () => {
    const ids = earTrainingUnit1Nodes.map((n) => n.id);
    expect(ids).toEqual([
      'ear_1_1',
      'ear_1_2',
      'ear_1_3',
      'ear_1_4',
      'ear_1_5',
      'ear_1_6',
      'boss_ear_1',
    ]);
  });

  it('regular nodes have category ear_training', () => {
    const regularNodes = earTrainingUnit1Nodes.filter((n) => !n.isBoss);
    regularNodes.forEach((node) => {
      expect(node.category).toBe('ear_training');
    });
  });

  it('boss node has category boss', () => {
    const boss = earTrainingUnit1Nodes.find((n) => n.id === 'boss_ear_1');
    expect(boss.category).toBe('boss');
    expect(boss.isBoss).toBe(true);
    expect(boss.xpReward).toBe(100);
  });

  it('all exercises use PITCH_COMPARISON type', () => {
    earTrainingUnit1Nodes.forEach((node) => {
      node.exercises.forEach((ex) => {
        expect(ex.type).toBe(EXERCISE_TYPES.PITCH_COMPARISON);
      });
    });
  });

  it('boss_ear_1 has exactly 2 exercises', () => {
    const boss = earTrainingUnit1Nodes.find((n) => n.id === 'boss_ear_1');
    expect(boss.exercises).toHaveLength(2);
  });

  it('orders start at 156 and are sequential', () => {
    const orders = earTrainingUnit1Nodes.map((n) => n.order);
    expect(orders).toEqual([156, 157, 158, 159, 160, 161, 162]);
  });

  it('prerequisites form a linear chain', () => {
    expect(earTrainingUnit1Nodes[0].prerequisites).toEqual([]);
    expect(earTrainingUnit1Nodes[1].prerequisites).toEqual(['ear_1_1']);
    expect(earTrainingUnit1Nodes[2].prerequisites).toEqual(['ear_1_2']);
    expect(earTrainingUnit1Nodes[3].prerequisites).toEqual(['ear_1_3']);
    expect(earTrainingUnit1Nodes[4].prerequisites).toEqual(['ear_1_4']);
    expect(earTrainingUnit1Nodes[5].prerequisites).toEqual(['ear_1_5']);
    expect(earTrainingUnit1Nodes[6].prerequisites).toEqual(['ear_1_6']);
  });

  it('regular nodes have xpReward between 40 and 50', () => {
    const regularNodes = earTrainingUnit1Nodes.filter((n) => !n.isBoss);
    regularNodes.forEach((node) => {
      expect(node.xpReward).toBeGreaterThanOrEqual(40);
      expect(node.xpReward).toBeLessThanOrEqual(50);
    });
  });

  it('all nodes have unit 1 and unitName Sound Direction', () => {
    earTrainingUnit1Nodes.forEach((node) => {
      expect(node.unit).toBe(1);
      expect(node.unitName).toBe('Sound Direction');
    });
  });
});

describe('Ear Training Unit 2: Interval Explorer', () => {
  it('exports exactly 7 nodes', () => {
    expect(earTrainingUnit2Nodes).toHaveLength(7);
  });

  it('has correct node IDs in order', () => {
    const ids = earTrainingUnit2Nodes.map((n) => n.id);
    expect(ids).toEqual([
      'ear_2_1',
      'ear_2_2',
      'ear_2_3',
      'ear_2_4',
      'ear_2_5',
      'ear_2_6',
      'boss_ear_2',
    ]);
  });

  it('regular nodes have category ear_training', () => {
    const regularNodes = earTrainingUnit2Nodes.filter((n) => !n.isBoss);
    regularNodes.forEach((node) => {
      expect(node.category).toBe('ear_training');
    });
  });

  it('boss node has category boss', () => {
    const boss = earTrainingUnit2Nodes.find((n) => n.id === 'boss_ear_2');
    expect(boss.category).toBe('boss');
    expect(boss.isBoss).toBe(true);
    expect(boss.xpReward).toBe(100);
  });

  it('regular node exercises use INTERVAL_ID type', () => {
    const regularNodes = earTrainingUnit2Nodes.filter((n) => !n.isBoss);
    regularNodes.forEach((node) => {
      node.exercises.forEach((ex) => {
        expect(ex.type).toBe(EXERCISE_TYPES.INTERVAL_ID);
      });
    });
  });

  it('boss_ear_2 has INTERVAL_ID + PITCH_COMPARISON exercises', () => {
    const boss = earTrainingUnit2Nodes.find((n) => n.id === 'boss_ear_2');
    expect(boss.exercises).toHaveLength(2);
    expect(boss.exercises[0].type).toBe(EXERCISE_TYPES.INTERVAL_ID);
    expect(boss.exercises[1].type).toBe(EXERCISE_TYPES.PITCH_COMPARISON);
  });

  it('orders start at 163 and are sequential', () => {
    const orders = earTrainingUnit2Nodes.map((n) => n.order);
    expect(orders).toEqual([163, 164, 165, 166, 167, 168, 169]);
  });

  it('prerequisites form a linear chain starting from boss_ear_1', () => {
    expect(earTrainingUnit2Nodes[0].prerequisites).toEqual(['boss_ear_1']);
    expect(earTrainingUnit2Nodes[1].prerequisites).toEqual(['ear_2_1']);
    expect(earTrainingUnit2Nodes[2].prerequisites).toEqual(['ear_2_2']);
    expect(earTrainingUnit2Nodes[3].prerequisites).toEqual(['ear_2_3']);
    expect(earTrainingUnit2Nodes[4].prerequisites).toEqual(['ear_2_4']);
    expect(earTrainingUnit2Nodes[5].prerequisites).toEqual(['ear_2_5']);
    expect(earTrainingUnit2Nodes[6].prerequisites).toEqual(['ear_2_6']);
  });

  it('first interval node has ascendingRatio 0.8 (ascending first per INTV-03)', () => {
    const firstNode = earTrainingUnit2Nodes[0];
    expect(firstNode.exercises[0].config.ascendingRatio).toBe(0.8);
  });

  it('Going Down node has ascendingRatio 0.2 (mostly descending)', () => {
    const goingDown = earTrainingUnit2Nodes.find((n) => n.id === 'ear_2_6');
    expect(goingDown.exercises[0].config.ascendingRatio).toBe(0.2);
  });
});
