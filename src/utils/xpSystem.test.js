import { describe, it, expect } from 'vitest';
import {
  XP_LEVELS,
  calculateLevel,
  getLevelProgress,
  getNextLevelXP,
  MAX_STATIC_LEVEL,
  PRESTIGE_XP_PER_TIER,
  PRESTIGE_BASE_XP
} from './xpSystem';

describe('XP_LEVELS array', () => {
  it('has exactly 30 entries', () => {
    expect(XP_LEVELS).toHaveLength(30);
  });

  it('has strictly increasing XP thresholds', () => {
    for (let i = 1; i < XP_LEVELS.length; i++) {
      expect(XP_LEVELS[i].xpRequired).toBeGreaterThan(XP_LEVELS[i - 1].xpRequired);
    }
  });

  it('every level 1-30 has a non-empty string title and non-empty string icon', () => {
    XP_LEVELS.forEach((level) => {
      expect(typeof level.title).toBe('string');
      expect(level.title.length).toBeGreaterThan(0);
      expect(typeof level.icon).toBe('string');
      expect(level.icon.length).toBeGreaterThan(0);
    });
  });

  it('all 30 titles are unique', () => {
    const titles = XP_LEVELS.map((l) => l.title);
    expect(new Set(titles).size).toBe(30);
  });

  it('preserves original levels 1-15 unchanged', () => {
    expect(XP_LEVELS[0]).toMatchObject({ level: 1, xpRequired: 0, title: 'Beginner' });
    expect(XP_LEVELS[14]).toMatchObject({ level: 15, xpRequired: 9000, title: 'Legend' });
  });

  it('level 16 is Composer at 10500 XP', () => {
    expect(XP_LEVELS[15]).toMatchObject({ level: 16, xpRequired: 10500, title: 'Composer' });
  });

  it('level 30 is Transcendent at 51000 XP', () => {
    expect(XP_LEVELS[29]).toMatchObject({ level: 30, xpRequired: 51000, title: 'Transcendent' });
  });
});

describe('prestige constants', () => {
  it('MAX_STATIC_LEVEL equals 30', () => {
    expect(MAX_STATIC_LEVEL).toBe(30);
  });

  it('PRESTIGE_XP_PER_TIER equals 3000', () => {
    expect(PRESTIGE_XP_PER_TIER).toBe(3000);
  });

  it('PRESTIGE_BASE_XP equals 51000', () => {
    expect(PRESTIGE_BASE_XP).toBe(51000);
  });
});

describe('calculateLevel', () => {
  it('returns level 1 with isPrestige: false for XP 0', () => {
    const result = calculateLevel(0);
    expect(result.level).toBe(1);
    expect(result.isPrestige).toBe(false);
  });

  it('returns level 15 (Legend) with isPrestige: false for XP 9000', () => {
    const result = calculateLevel(9000);
    expect(result.level).toBe(15);
    expect(result.title).toBe('Legend');
    expect(result.isPrestige).toBe(false);
  });

  it('returns level 16 (Composer) with isPrestige: false for XP 10500', () => {
    const result = calculateLevel(10500);
    expect(result.level).toBe(16);
    expect(result.title).toBe('Composer');
    expect(result.isPrestige).toBe(false);
  });

  it('returns level 30 (Transcendent) with isPrestige: false, prestigeTier: 0 for XP 51000', () => {
    const result = calculateLevel(51000);
    expect(result.level).toBe(30);
    expect(result.title).toBe('Transcendent');
    expect(result.isPrestige).toBe(false);
    expect(result.prestigeTier).toBe(0);
  });

  it('returns level 30 (not prestige tier 1) for XP 51001', () => {
    const result = calculateLevel(51001);
    expect(result.level).toBe(30);
    expect(result.isPrestige).toBe(false);
    expect(result.prestigeTier).toBe(0);
  });

  it('returns level 31 with isPrestige: true, prestigeTier: 1, title: "Maestro 1" for XP 54000', () => {
    const result = calculateLevel(54000);
    expect(result.level).toBe(31);
    expect(result.isPrestige).toBe(true);
    expect(result.prestigeTier).toBe(1);
    expect(result.title).toBe('Maestro 1');
  });

  it('returns level 32 with isPrestige: true, prestigeTier: 2, title: "Maestro 2" for XP 57000', () => {
    const result = calculateLevel(57000);
    expect(result.level).toBe(32);
    expect(result.isPrestige).toBe(true);
    expect(result.prestigeTier).toBe(2);
    expect(result.title).toBe('Maestro 2');
  });
});

describe('getLevelProgress', () => {
  it('returns progressPercentage between 0-100 and isPrestige: false for XP 500', () => {
    const result = getLevelProgress(500);
    expect(result.progressPercentage).toBeGreaterThanOrEqual(0);
    expect(result.progressPercentage).toBeLessThanOrEqual(100);
    expect(result.isPrestige).toBe(false);
  });

  it('returns progress for level 15 toward level 16 (NOT 100%/max) for XP 9000', () => {
    const result = getLevelProgress(9000);
    expect(result.currentLevel.level).toBe(15);
    expect(result.progressPercentage).toBe(0);
    expect(result.nextLevelXP).toBe(10500);
    expect(result.isPrestige).toBe(false);
  });

  it('returns isPrestige: false with progress toward first prestige tier for XP 51000', () => {
    const result = getLevelProgress(51000);
    expect(result.isPrestige).toBe(false);
    expect(result.currentLevel.level).toBe(30);
    expect(result.progressPercentage).toBe(0);
  });

  it('returns isPrestige: true with correct tier progress for XP 54000', () => {
    const result = getLevelProgress(54000);
    expect(result.isPrestige).toBe(true);
    expect(result.currentLevel.level).toBe(31);
  });

  it('returns isPrestige: true with mid-tier progress for XP 55500', () => {
    const result = getLevelProgress(55500);
    expect(result.isPrestige).toBe(true);
    expect(result.currentLevel.level).toBe(31);
    expect(result.progressPercentage).toBe(50);
  });
});

describe('getNextLevelXP', () => {
  it('returns 100 (level 2 threshold) for level 1', () => {
    expect(getNextLevelXP(1)).toBe(100);
  });

  it('returns 10500 (level 16 threshold, NOT 0) for level 15', () => {
    expect(getNextLevelXP(15)).toBe(10500);
  });

  it('returns 51000 (level 30 threshold) for level 29', () => {
    expect(getNextLevelXP(29)).toBe(51000);
  });

  it('returns PRESTIGE_XP_PER_TIER (3000) for level 30', () => {
    expect(getNextLevelXP(30)).toBe(3000);
  });

  it('returns 3000 (same fixed prestige cost) for level 31', () => {
    expect(getNextLevelXP(31)).toBe(3000);
  });
});
