import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase default export
vi.mock('./supabase', () => ({
  default: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

// Mock authorizationUtils
vi.mock('./authorizationUtils', () => ({
  verifyStudentDataAccess: vi.fn().mockResolvedValue(undefined),
}));

import supabase from './supabase';
import { calculateDailyProgress, GOAL_TYPES } from './dailyGoalsService';

/**
 * Helper: mock supabase.from for two-table queries.
 *
 * calculateDailyProgress calls supabase.from twice:
 *   1. 'students_score' -> select -> eq(student_id) -> gte(created_at) -> lte(created_at)
 *   2. 'student_skill_progress' -> select -> eq(student_id) -> gte(last_practiced) -> lte(last_practiced)
 *
 * This helper returns different data depending on table name.
 */
const mockTwoTableQuery = (scoresData, progressData, scoresError = null, progressError = null) => {
  supabase.from.mockImplementation((tableName) => {
    const isScores = tableName === 'students_score';
    const data = isScores ? scoresData : progressData;
    const error = isScores ? scoresError : progressError;
    const lteMock = vi.fn().mockResolvedValue({ data, error });
    const gteMock = vi.fn().mockReturnValue({ lte: lteMock });
    const eqMock = vi.fn().mockReturnValue({ gte: gteMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    return { select: selectMock };
  });
};

const STUDENT_ID = 'test-student-id';

describe('calculateDailyProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use fake timers with a fixed date to avoid timezone boundary issues
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-31T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================
  // exercisesCompleted — counts ALL game types
  // ============================================================
  describe('exercisesCompleted', () => {
    it('counts all game types from students_score plus student_skill_progress rows', async () => {
      const scores = [
        { score: 85, game_type: 'sight_reading', created_at: '2026-03-31T08:00:00Z' },
        { score: 90, game_type: 'rhythm', created_at: '2026-03-31T09:00:00Z' },
        { score: 75, game_type: 'pitch_comparison', created_at: '2026-03-31T09:30:00Z' },
        { score: 80, game_type: 'interval_id', created_at: '2026-03-31T10:00:00Z' },
        { score: 95, game_type: 'arcade_rhythm', created_at: '2026-03-31T10:30:00Z' },
        { score: 70, game_type: 'memory', created_at: '2026-03-31T11:00:00Z' },
        { score: 88, game_type: 'note_recognition', created_at: '2026-03-31T11:30:00Z' },
      ];
      const nodeProgress = [
        { node_id: 'treble_c_d', stars: 2, exercises_completed: 3, created_at: '2026-03-31T08:00:00Z', last_practiced: '2026-03-31T08:00:00Z' },
        { node_id: 'bass_a_b', stars: 1, exercises_completed: 2, created_at: '2026-03-31T09:00:00Z', last_practiced: '2026-03-31T09:00:00Z' },
      ];

      mockTwoTableQuery(scores, nodeProgress);

      const result = await calculateDailyProgress(STUDENT_ID);

      // 7 scores + 2 node progress = 9 total
      expect(result.exercisesCompleted).toBe(9);
    });
  });

  // ============================================================
  // threeStarsEarned
  // ============================================================
  describe('threeStarsEarned', () => {
    it('counts nodes with stars=3 created today', async () => {
      const scores = [];
      const nodeProgress = [
        { node_id: 'treble_c_d', stars: 3, exercises_completed: 5, created_at: '2026-03-31T10:00:00Z', last_practiced: '2026-03-31T10:00:00Z' },
        { node_id: 'treble_c_e', stars: 3, exercises_completed: 4, created_at: '2026-03-31T11:00:00Z', last_practiced: '2026-03-31T11:00:00Z' },
        { node_id: 'bass_a_b', stars: 2, exercises_completed: 3, created_at: '2026-03-31T09:00:00Z', last_practiced: '2026-03-31T09:00:00Z' },
        // stars=3 but created on a different day — should NOT count (created_at won't match dateString)
        { node_id: 'rhythm_basic', stars: 3, exercises_completed: 2, created_at: '2026-03-30T15:00:00Z', last_practiced: '2026-03-31T08:00:00Z' },
      ];

      mockTwoTableQuery(scores, nodeProgress);

      const result = await calculateDailyProgress(STUDENT_ID);

      // Only the first 2 have stars=3 AND created_at matching today
      expect(result.threeStarsEarned).toBe(2);
    });
  });

  // ============================================================
  // newNodesPracticed
  // ============================================================
  describe('newNodesPracticed', () => {
    it('counts nodes created today or first practiced today (exercises_completed=1)', async () => {
      const scores = [];
      const nodeProgress = [
        // Created today — counts
        { node_id: 'treble_c_d', stars: 1, exercises_completed: 3, created_at: '2026-03-31T08:00:00Z', last_practiced: '2026-03-31T08:00:00Z' },
        // Not created today, but exercises_completed=1 and last_practiced today — counts (first practice)
        { node_id: 'bass_a_b', stars: 0, exercises_completed: 1, created_at: '2026-03-28T10:00:00Z', last_practiced: '2026-03-31T09:00:00Z' },
        // Not created today, exercises_completed > 1 — does NOT count
        { node_id: 'rhythm_basic', stars: 2, exercises_completed: 5, created_at: '2026-03-25T10:00:00Z', last_practiced: '2026-03-31T10:00:00Z' },
      ];

      mockTwoTableQuery(scores, nodeProgress);

      const result = await calculateDailyProgress(STUDENT_ID);

      expect(result.newNodesPracticed).toBe(2);
    });
  });

  // ============================================================
  // perfectScores
  // ============================================================
  describe('perfectScores', () => {
    it('counts score=100 rows across different game_types', async () => {
      const scores = [
        { score: 100, game_type: 'sight_reading', created_at: '2026-03-31T08:00:00Z' },
        { score: 100, game_type: 'rhythm', created_at: '2026-03-31T09:00:00Z' },
        { score: 95, game_type: 'note_recognition', created_at: '2026-03-31T10:00:00Z' },
        { score: 100, game_type: 'pitch_comparison', created_at: '2026-03-31T11:00:00Z' },
        { score: 80, game_type: 'interval_id', created_at: '2026-03-31T11:30:00Z' },
      ];
      const nodeProgress = [];

      mockTwoTableQuery(scores, nodeProgress);

      const result = await calculateDailyProgress(STUDENT_ID);

      expect(result.perfectScores).toBe(3);
    });
  });

  // ============================================================
  // streakMaintained
  // ============================================================
  describe('streakMaintained', () => {
    it('returns true when any exercise exists today', async () => {
      const scores = [
        { score: 75, game_type: 'note_recognition', created_at: '2026-03-31T10:00:00Z' },
      ];
      const nodeProgress = [];

      mockTwoTableQuery(scores, nodeProgress);

      const result = await calculateDailyProgress(STUDENT_ID);

      expect(result.streakMaintained).toBe(true);
    });

    it('returns false when both queries return empty arrays', async () => {
      mockTwoTableQuery([], []);

      const result = await calculateDailyProgress(STUDENT_ID);

      expect(result.streakMaintained).toBe(false);
    });
  });

  // ============================================================
  // Regression: no category filtering
  // ============================================================
  describe('regression: no category filtering', () => {
    it('does NOT apply game_type or category filter on supabase queries', async () => {
      const scores = [
        { score: 85, game_type: 'sight_reading', created_at: '2026-03-31T08:00:00Z' },
      ];
      const nodeProgress = [
        { node_id: 'treble_c_d', stars: 2, exercises_completed: 1, created_at: '2026-03-31T08:00:00Z', last_practiced: '2026-03-31T08:00:00Z' },
      ];

      // Track all mock calls to inspect query chains
      const selectMocks = {};
      const eqMocks = {};

      supabase.from.mockImplementation((tableName) => {
        const isScores = tableName === 'students_score';
        const data = isScores ? scores : nodeProgress;

        const lteMock = vi.fn().mockResolvedValue({ data, error: null });
        const gteMock = vi.fn().mockReturnValue({ lte: lteMock });
        const eqMock = vi.fn().mockReturnValue({ gte: gteMock });
        const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

        selectMocks[tableName] = selectMock;
        eqMocks[tableName] = eqMock;

        return { select: selectMock };
      });

      await calculateDailyProgress(STUDENT_ID);

      // Verify students_score query chain:
      // select('score, game_type, created_at') -> eq('student_id', ...) -> gte -> lte
      // There should be exactly ONE .eq() call (for student_id), NOT a second one for game_type
      expect(eqMocks['students_score']).toHaveBeenCalledTimes(1);
      expect(eqMocks['students_score']).toHaveBeenCalledWith('student_id', STUDENT_ID);

      // Verify student_skill_progress query chain:
      // select(...) -> eq('student_id', ...) -> gte -> lte
      // There should be exactly ONE .eq() call (for student_id), NOT a second one for category
      expect(eqMocks['student_skill_progress']).toHaveBeenCalledTimes(1);
      expect(eqMocks['student_skill_progress']).toHaveBeenCalledWith('student_id', STUDENT_ID);
    });
  });

  // ============================================================
  // Error handling
  // ============================================================
  describe('error handling', () => {
    it('returns zero-value defaults when supabase returns errors for both queries', async () => {
      const scoresError = { code: '42P01', message: 'relation does not exist' };
      const progressError = { code: '42P01', message: 'relation does not exist' };

      mockTwoTableQuery(null, null, scoresError, progressError);

      const result = await calculateDailyProgress(STUDENT_ID);

      expect(result.exercisesCompleted).toBe(0);
      expect(result.threeStarsEarned).toBe(0);
      expect(result.newNodesPracticed).toBe(0);
      expect(result.perfectScores).toBe(0);
      expect(result.streakMaintained).toBe(false);
    });
  });

  // ============================================================
  // Ear training edge case (D-03)
  // ============================================================
  describe('ear training in students_score', () => {
    it('counts pitch_comparison and interval_id game_type rows in exercisesCompleted', async () => {
      const scores = [
        { score: 70, game_type: 'pitch_comparison', created_at: '2026-03-31T09:00:00Z' },
        { score: 85, game_type: 'interval_id', created_at: '2026-03-31T10:00:00Z' },
      ];
      const nodeProgress = [];

      mockTwoTableQuery(scores, nodeProgress);

      const result = await calculateDailyProgress(STUDENT_ID);

      // Both ear training scores counted
      expect(result.exercisesCompleted).toBe(2);
    });
  });

  // ============================================================
  // Arcade rhythm in student_skill_progress (D-03)
  // ============================================================
  describe('arcade rhythm in student_skill_progress', () => {
    it('counts arcade rhythm trail node rows in exercisesCompleted', async () => {
      const scores = [
        { score: 92, game_type: 'arcade_rhythm', created_at: '2026-03-31T10:00:00Z' },
      ];
      const nodeProgress = [
        { node_id: 'rhythm_arcade_1', stars: 2, exercises_completed: 3, created_at: '2026-03-31T08:00:00Z', last_practiced: '2026-03-31T08:00:00Z' },
      ];

      mockTwoTableQuery(scores, nodeProgress);

      const result = await calculateDailyProgress(STUDENT_ID);

      // 1 score + 1 node progress = 2
      expect(result.exercisesCompleted).toBe(2);
    });
  });
});

// ============================================================
// GOAL_TYPES export verification
// ============================================================
describe('GOAL_TYPES', () => {
  it('exports all 5 goal types', () => {
    expect(GOAL_TYPES.COMPLETE_EXERCISES).toBe('complete_exercises');
    expect(GOAL_TYPES.EARN_THREE_STARS).toBe('earn_three_stars');
    expect(GOAL_TYPES.PRACTICE_NEW_NODE).toBe('practice_new_node');
    expect(GOAL_TYPES.PERFECT_SCORE).toBe('perfect_score');
    expect(GOAL_TYPES.MAINTAIN_STREAK).toBe('maintain_streak');
  });
});
