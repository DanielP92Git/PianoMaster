import { describe, it, expect } from 'vitest';
import {
  FREE_EAR_TRAINING_NODE_IDS,
  FREE_TREBLE_NODE_IDS,
  FREE_BASS_NODE_IDS,
  FREE_RHYTHM_NODE_IDS,
  PAYWALL_BOSS_NODE_IDS,
  FREE_NODE_IDS,
  FREE_TIER_SUMMARY,
  isFreeNode,
} from './subscriptionConfig.js';

describe('subscriptionConfig — ear training free tier', () => {
  it('FREE_EAR_TRAINING_NODE_IDS has exactly 6 entries', () => {
    expect(FREE_EAR_TRAINING_NODE_IDS).toHaveLength(6);
  });

  it('FREE_EAR_TRAINING_NODE_IDS contains ear_1_1 through ear_1_6', () => {
    const expected = [
      'ear_1_1',
      'ear_1_2',
      'ear_1_3',
      'ear_1_4',
      'ear_1_5',
      'ear_1_6',
    ];
    expected.forEach((id) => {
      expect(FREE_EAR_TRAINING_NODE_IDS).toContain(id);
    });
  });

  it('PAYWALL_BOSS_NODE_IDS contains both ear training bosses', () => {
    expect(PAYWALL_BOSS_NODE_IDS).toContain('boss_ear_1');
    expect(PAYWALL_BOSS_NODE_IDS).toContain('boss_ear_2');
  });

  it('PAYWALL_BOSS_NODE_IDS has exactly 5 entries', () => {
    expect(PAYWALL_BOSS_NODE_IDS).toHaveLength(5);
  });

  it('isFreeNode returns true for all 6 ear training free nodes', () => {
    ['ear_1_1', 'ear_1_2', 'ear_1_3', 'ear_1_4', 'ear_1_5', 'ear_1_6'].forEach((id) => {
      expect(isFreeNode(id)).toBe(true);
    });
  });

  it('isFreeNode returns false for boss_ear_1 and boss_ear_2', () => {
    expect(isFreeNode('boss_ear_1')).toBe(false);
    expect(isFreeNode('boss_ear_2')).toBe(false);
  });

  it('isFreeNode returns false for all Unit 2 nodes (premium)', () => {
    ['ear_2_1', 'ear_2_2', 'ear_2_3', 'ear_2_4', 'ear_2_5', 'ear_2_6'].forEach((id) => {
      expect(isFreeNode(id)).toBe(false);
    });
  });

  it('FREE_NODE_IDS Set has 25 total entries (7+6+6+6)', () => {
    const expected =
      FREE_TREBLE_NODE_IDS.length +
      FREE_BASS_NODE_IDS.length +
      FREE_RHYTHM_NODE_IDS.length +
      FREE_EAR_TRAINING_NODE_IDS.length;
    expect(FREE_NODE_IDS.size).toBe(expected);
    expect(FREE_NODE_IDS.size).toBe(25);
  });

  it('FREE_TIER_SUMMARY reflects ear training addition', () => {
    expect(FREE_TIER_SUMMARY.ear_training).toEqual({ count: 6 });
    expect(FREE_TIER_SUMMARY.total).toBe(25);
    expect(FREE_TIER_SUMMARY.bossNodeCount).toBe(5);
  });
});
