import { describe, it, expect } from 'vitest';
import { earTrainingUnit2Nodes } from './earTrainingUnit2.js';
import { NODE_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

describe('Ear Training Unit 2 — Interval Explorer', () => {
  it('exports exactly 7 nodes', () => {
    expect(earTrainingUnit2Nodes).toHaveLength(7);
  });

  it('all node IDs are unique', () => {
    const ids = earTrainingUnit2Nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(7);
  });

  it('node IDs follow naming convention', () => {
    const expectedIds = [
      'ear_2_1',
      'ear_2_2',
      'ear_2_3',
      'ear_2_4',
      'ear_2_5',
      'ear_2_6',
      'boss_ear_2',
    ];
    const actualIds = earTrainingUnit2Nodes.map((n) => n.id);
    expect(actualIds).toEqual(expectedIds);
  });

  it('orders are sequential from 163 to 169', () => {
    const orders = earTrainingUnit2Nodes.map((n) => n.order);
    expect(orders).toEqual([163, 164, 165, 166, 167, 168, 169]);
  });

  it('orderInUnit values are 1 through 7', () => {
    const orderInUnits = earTrainingUnit2Nodes.map((n) => n.orderInUnit);
    expect(orderInUnits).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('first node prerequisites boss_ear_1', () => {
    expect(earTrainingUnit2Nodes[0].prerequisites).toEqual(['boss_ear_1']);
  });

  it('subsequent nodes form a linear prerequisite chain', () => {
    for (let i = 1; i < earTrainingUnit2Nodes.length; i++) {
      expect(earTrainingUnit2Nodes[i].prerequisites).toEqual([
        earTrainingUnit2Nodes[i - 1].id,
      ]);
    }
  });

  it('regular nodes (1-6) use category ear_training', () => {
    const regularNodes = earTrainingUnit2Nodes.slice(0, 6);
    regularNodes.forEach((node) => {
      expect(node.category).toBe('ear_training');
    });
  });

  it('all nodes have unit=2 and unitName=Interval Explorer', () => {
    earTrainingUnit2Nodes.forEach((node) => {
      expect(node.unit).toBe(2);
      expect(node.unitName).toBe('Interval Explorer');
    });
  });

  it('regular nodes use INTERVAL_ID exercise type', () => {
    const regularNodes = earTrainingUnit2Nodes.slice(0, 6);
    regularNodes.forEach((node) => {
      expect(node.exercises).toHaveLength(1);
      expect(node.exercises[0].type).toBe(EXERCISE_TYPES.INTERVAL_ID);
    });
  });

  it('interval categories expand progressively', () => {
    // Node 1: step only
    expect(earTrainingUnit2Nodes[0].exercises[0].config.allowedCategories).toEqual(
      ['step']
    );
    // Node 2: skip only
    expect(earTrainingUnit2Nodes[1].exercises[0].config.allowedCategories).toEqual(
      ['skip']
    );
    // Node 3: leap only
    expect(earTrainingUnit2Nodes[2].exercises[0].config.allowedCategories).toEqual(
      ['leap']
    );
    // Node 4: step + skip mixed
    expect(earTrainingUnit2Nodes[3].exercises[0].config.allowedCategories).toEqual(
      ['step', 'skip']
    );
    // Node 5: all three
    expect(earTrainingUnit2Nodes[4].exercises[0].config.allowedCategories).toEqual(
      ['step', 'skip', 'leap']
    );
    // Node 6: all three (descending focus)
    expect(earTrainingUnit2Nodes[5].exercises[0].config.allowedCategories).toEqual(
      ['step', 'skip', 'leap']
    );
  });

  it('ascending ratio decreases from node 6 (descending focus)', () => {
    // Node 1 (ascending intro): 0.8
    expect(earTrainingUnit2Nodes[0].exercises[0].config.ascendingRatio).toBe(0.8);
    // Node 6 (descending): 0.2
    expect(earTrainingUnit2Nodes[5].exercises[0].config.ascendingRatio).toBe(0.2);
  });

  it('all regular nodes have 10 questions', () => {
    const regularNodes = earTrainingUnit2Nodes.slice(0, 6);
    regularNodes.forEach((node) => {
      expect(node.exercises[0].config.questionCount).toBe(10);
    });
  });

  it('all regular nodes have isBoss: false', () => {
    const regularNodes = earTrainingUnit2Nodes.slice(0, 6);
    regularNodes.forEach((node) => {
      expect(node.isBoss).toBe(false);
    });
  });

  it('regular nodes have xpReward between 40 and 55', () => {
    const regularNodes = earTrainingUnit2Nodes.slice(0, 6);
    regularNodes.forEach((node) => {
      expect(node.xpReward).toBeGreaterThanOrEqual(40);
      expect(node.xpReward).toBeLessThanOrEqual(55);
    });
  });

  it('all nodes have isReview: false and reviewsUnits: []', () => {
    earTrainingUnit2Nodes.forEach((node) => {
      expect(node.isReview).toBe(false);
      expect(node.reviewsUnits).toEqual([]);
    });
  });
});

describe('Ear Training Unit 2 — Boss Node (boss_ear_2)', () => {
  const bossNode = earTrainingUnit2Nodes[earTrainingUnit2Nodes.length - 1];

  it('boss node has correct ID', () => {
    expect(bossNode.id).toBe('boss_ear_2');
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

  it('boss node has 2 exercises: first INTERVAL_ID, second PITCH_COMPARISON', () => {
    expect(bossNode.exercises).toHaveLength(2);
    expect(bossNode.exercises[0].type).toBe(EXERCISE_TYPES.INTERVAL_ID);
    expect(bossNode.exercises[1].type).toBe(EXERCISE_TYPES.PITCH_COMPARISON);
  });

  it('boss node has accessory unlock', () => {
    expect(bossNode.accessoryUnlock).toBe('interval_master_badge');
  });

  it('boss node has unlockHint', () => {
    expect(bossNode.unlockHint).toBeTruthy();
  });
});
