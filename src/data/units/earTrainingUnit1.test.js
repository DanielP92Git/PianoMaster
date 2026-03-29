import { describe, it, expect } from 'vitest';
import { earTrainingUnit1Nodes } from './earTrainingUnit1.js';
import { NODE_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

describe('Ear Training Unit 1 — Sound Direction', () => {
  it('exports exactly 7 nodes', () => {
    expect(earTrainingUnit1Nodes).toHaveLength(7);
  });

  it('all node IDs are unique', () => {
    const ids = earTrainingUnit1Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(7);
  });

  it('node IDs follow naming convention', () => {
    const expectedIds = [
      'ear_1_1',
      'ear_1_2',
      'ear_1_3',
      'ear_1_4',
      'ear_1_5',
      'ear_1_6',
      'boss_ear_1',
    ];
    const actualIds = earTrainingUnit1Nodes.map((n) => n.id);
    expect(actualIds).toEqual(expectedIds);
  });

  it('orders are sequential from 156 to 162', () => {
    const orders = earTrainingUnit1Nodes.map((n) => n.order);
    expect(orders).toEqual([156, 157, 158, 159, 160, 161, 162]);
  });

  it('orderInUnit values are 1 through 7', () => {
    const orderInUnits = earTrainingUnit1Nodes.map((n) => n.orderInUnit);
    expect(orderInUnits).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('prerequisite chain is valid — starts empty, then linear', () => {
    // First node has no prerequisites
    expect(earTrainingUnit1Nodes[0].prerequisites).toEqual([]);

    // Each subsequent node prereqs the previous node ID
    for (let i = 1; i < earTrainingUnit1Nodes.length; i++) {
      expect(earTrainingUnit1Nodes[i].prerequisites).toEqual([
        earTrainingUnit1Nodes[i - 1].id,
      ]);
    }
  });

  it('regular nodes (1-6) use category ear_training', () => {
    const regularNodes = earTrainingUnit1Nodes.slice(0, 6);
    regularNodes.forEach((node) => {
      expect(node.category).toBe('ear_training');
    });
  });

  it('all nodes have unit=1 and unitName=Sound Direction', () => {
    earTrainingUnit1Nodes.forEach((node) => {
      expect(node.unit).toBe(1);
      expect(node.unitName).toBe('Sound Direction');
    });
  });

  it('all regular nodes use PITCH_COMPARISON exercise type exclusively', () => {
    const regularNodes = earTrainingUnit1Nodes.slice(0, 6);
    regularNodes.forEach((node) => {
      expect(node.exercises).toHaveLength(1);
      expect(node.exercises[0].type).toBe(EXERCISE_TYPES.PITCH_COMPARISON);
    });
  });

  it('intervals shrink across nodes — wide to narrow', () => {
    // Node 1: min:6, max:12 (wide)
    expect(earTrainingUnit1Nodes[0].exercises[0].config.intervalRange).toEqual({
      min: 6,
      max: 12,
    });
    // Node 4: min:2, max:3 (narrower)
    expect(earTrainingUnit1Nodes[3].exercises[0].config.intervalRange).toEqual({
      min: 2,
      max: 3,
    });
    // Node 5: min:1, max:2 (narrowest)
    expect(earTrainingUnit1Nodes[4].exercises[0].config.intervalRange).toEqual({
      min: 1,
      max: 2,
    });
  });

  it('all regular nodes have 10 questions', () => {
    const regularNodes = earTrainingUnit1Nodes.slice(0, 6);
    regularNodes.forEach((node) => {
      expect(node.exercises[0].config.questionCount).toBe(10);
    });
  });

  it('all regular nodes have isBoss: false', () => {
    const regularNodes = earTrainingUnit1Nodes.slice(0, 6);
    regularNodes.forEach((node) => {
      expect(node.isBoss).toBe(false);
    });
  });

  it('regular nodes have xpReward between 40 and 55', () => {
    const regularNodes = earTrainingUnit1Nodes.slice(0, 6);
    regularNodes.forEach((node) => {
      expect(node.xpReward).toBeGreaterThanOrEqual(40);
      expect(node.xpReward).toBeLessThanOrEqual(55);
    });
  });

  it('all nodes have isReview: false and reviewsUnits: []', () => {
    earTrainingUnit1Nodes.forEach((node) => {
      expect(node.isReview).toBe(false);
      expect(node.reviewsUnits).toEqual([]);
    });
  });
});

describe('Ear Training Unit 1 — Boss Node (boss_ear_1)', () => {
  const bossNode = earTrainingUnit1Nodes[earTrainingUnit1Nodes.length - 1];

  it('boss node has correct ID', () => {
    expect(bossNode.id).toBe('boss_ear_1');
  });

  it('boss node has category boss (not ear_training)', () => {
    expect(bossNode.category).toBe('boss');
  });

  it('boss node has isBoss: true', () => {
    expect(bossNode.isBoss).toBe(true);
  });

  it('boss node has nodeType MINI_BOSS', () => {
    expect(bossNode.nodeType).toBe(NODE_TYPES.MINI_BOSS);
  });

  it('boss node has xpReward of 100', () => {
    expect(bossNode.xpReward).toBe(100);
  });

  it('boss node has 2 PITCH_COMPARISON exercises', () => {
    expect(bossNode.exercises).toHaveLength(2);
    bossNode.exercises.forEach((exercise) => {
      expect(exercise.type).toBe(EXERCISE_TYPES.PITCH_COMPARISON);
    });
  });

  it('boss node has accessory unlock', () => {
    expect(bossNode.accessoryUnlock).toBe('ear_sprout_badge');
  });

  it('boss node has unlockHint', () => {
    expect(bossNode.unlockHint).toBeTruthy();
  });
});
