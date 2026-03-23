import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase default export
vi.mock('./supabase', () => ({
  default: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import supabase from './supabase';
import {
  practiceStreakService,
} from './practiceStreakService';

describe('practiceStreakService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAuthSession = (userId = 'test-user-id') => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: userId } } },
    });
  };

  // ============================================================
  // Pure helper function tests (no mocks needed)
  // ============================================================

  describe('_effectiveDayGap()', () => {
    const { _effectiveDayGap } = practiceStreakService;

    it('returns 0 for same day', () => {
      const d = new Date(2026, 2, 24); // March 24
      expect(_effectiveDayGap(d, d, false)).toBe(0);
    });

    it('returns 1 for consecutive days (no weekend pass)', () => {
      const last = new Date(2026, 2, 23); // March 23
      const today = new Date(2026, 2, 24); // March 24
      expect(_effectiveDayGap(last, today, false)).toBe(1);
    });

    it('returns 2 for two-day gap (no weekend pass)', () => {
      const last = new Date(2026, 2, 22); // March 22
      const today = new Date(2026, 2, 24); // March 24
      expect(_effectiveDayGap(last, today, false)).toBe(2);
    });

    it('returns 1 for Thu->Sun gap when weekendPass=true (Fri+Sat bridged)', () => {
      // Thu March 19 -> Sun March 22: intermediate days are Fri(20) + Sat(21)
      // All intermediate days are weekend days → gap = 1
      const last = new Date(2026, 2, 19); // Thu
      const today = new Date(2026, 2, 22); // Sun
      expect(_effectiveDayGap(last, today, true)).toBe(1);
    });

    it('returns raw diff for Thu->Mon gap when weekendPass=true (Sunday is NOT a weekend-pass day)', () => {
      // Thu March 19 -> Mon March 23: intermediate days include Fri(20) + Sat(21) + Sun(22)
      // Sun is dayOfWeek=0, NOT 5 or 6, so gap > 1 → streak resets
      const last = new Date(2026, 2, 19); // Thu
      const today = new Date(2026, 2, 23); // Mon
      const gap = _effectiveDayGap(last, today, true);
      expect(gap).toBeGreaterThan(1);
    });

    it('returns raw diff when weekendPassEnabled=false even for Fri/Sat gap', () => {
      const last = new Date(2026, 2, 19); // Thu
      const today = new Date(2026, 2, 22); // Sun
      // No weekend pass — 3 raw days difference
      expect(_effectiveDayGap(last, today, false)).toBe(3);
    });
  });

  describe('allIntermediateDaysAreWeekend()', () => {
    const { allIntermediateDaysAreWeekend } = practiceStreakService;

    it('returns false for consecutive days (no intermediate days)', () => {
      const last = new Date(2026, 2, 23); // Mon
      const today = new Date(2026, 2, 24); // Tue
      expect(allIntermediateDaysAreWeekend(last, today)).toBe(false);
    });

    it('returns true when all intermediate days are Fri+Sat (Thu->Sun)', () => {
      // Thu March 19 -> Sun March 22: intermediate = Fri(20), Sat(21)
      const last = new Date(2026, 2, 19); // Thu
      const today = new Date(2026, 2, 22); // Sun
      expect(allIntermediateDaysAreWeekend(last, today)).toBe(true);
    });

    it('returns false when intermediate days include Sunday (Thu->Mon)', () => {
      // Thu March 19 -> Mon March 23: intermediate = Fri(20), Sat(21), Sun(22)
      const last = new Date(2026, 2, 19); // Thu
      const today = new Date(2026, 2, 23); // Mon
      expect(allIntermediateDaysAreWeekend(last, today)).toBe(false);
    });
  });

  // ============================================================
  // getPracticeStreak() tests
  // ============================================================

  describe('getPracticeStreak()', () => {
    // Helper: mock .select().eq().maybeSingle()
    const mockGetChain = (resolvedValue) => {
      const maybeSingleMock = vi.fn().mockResolvedValue(resolvedValue);
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      supabase.from.mockReturnValue({ select: selectMock });
    };

    it('returns { streakCount: 0, lastPracticedOn: null } when no row exists', async () => {
      mockAuthSession();
      mockGetChain({ data: null, error: null });

      const result = await practiceStreakService.getPracticeStreak();

      expect(result).toEqual({ streakCount: 0, lastPracticedOn: null });
    });

    it('returns streak data from existing row', async () => {
      mockAuthSession();
      mockGetChain({
        data: { streak_count: 5, last_practiced_on: '2026-03-23' },
        error: null,
      });

      const result = await practiceStreakService.getPracticeStreak();

      expect(result).toEqual({ streakCount: 5, lastPracticedOn: '2026-03-23' });
    });
  });

  // ============================================================
  // updatePracticeStreak() tests
  // ============================================================

  describe('updatePracticeStreak()', () => {
    // Helper: mock .select().eq().maybeSingle() for FETCH, then .upsert() for WRITE
    const mockUpdateFlow = (currentStreakData, upsertResult = { error: null }) => {
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: fetch current streak
          const maybeSingleMock = vi.fn().mockResolvedValue(currentStreakData);
          const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
          const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
          return { select: selectMock };
        } else {
          // Second call: upsert
          const upsertMock = vi.fn().mockResolvedValue(upsertResult);
          return { upsert: upsertMock };
        }
      });
    };

    it('increments streak from 5 to 6 on consecutive day', async () => {
      mockAuthSession();
      mockUpdateFlow(
        { data: { streak_count: 5, last_practiced_on: '2026-03-23' }, error: null },
      );

      const result = await practiceStreakService.updatePracticeStreak('2026-03-24', false);

      expect(result.streakCount).toBe(6);
    });

    it('resets streak to 1 when gap > 1 day (no weekend pass)', async () => {
      mockAuthSession();
      // Last practice was March 20, today is March 24 — 4-day gap
      mockUpdateFlow(
        { data: { streak_count: 5, last_practiced_on: '2026-03-20' }, error: null },
      );

      const result = await practiceStreakService.updatePracticeStreak('2026-03-24', false);

      expect(result.streakCount).toBe(1);
    });

    it('returns unchanged streakCount when same day (no-op)', async () => {
      mockAuthSession();
      mockUpdateFlow(
        { data: { streak_count: 5, last_practiced_on: '2026-03-24' }, error: null },
      );

      const result = await practiceStreakService.updatePracticeStreak('2026-03-24', false);

      // Same day — no upsert should be made, streak count unchanged
      expect(result.streakCount).toBe(5);
    });

    it('increments streak when Thu->Sun gap with weekendPass=true (Fri+Sat bridged)', async () => {
      mockAuthSession();
      // Last practice: Thu March 19, Today: Sun March 22
      // Intermediate days: Fri(20) + Sat(21) — all weekend, so gap = 1 under weekendPass
      mockUpdateFlow(
        { data: { streak_count: 3, last_practiced_on: '2026-03-19' }, error: null },
      );

      const result = await practiceStreakService.updatePracticeStreak('2026-03-22', true);

      expect(result.streakCount).toBe(4);
    });

    it('resets streak when Thu->Mon gap with weekendPass=true (Sunday is not bridged)', async () => {
      mockAuthSession();
      // Last practice: Thu March 19, Today: Mon March 23
      // Intermediate days include Sunday (dayOfWeek=0) — NOT bridged
      mockUpdateFlow(
        { data: { streak_count: 3, last_practiced_on: '2026-03-19' }, error: null },
      );

      const result = await practiceStreakService.updatePracticeStreak('2026-03-23', true);

      expect(result.streakCount).toBe(1);
    });

    it('sets streak to 1 when no prior streak record exists', async () => {
      mockAuthSession();
      mockUpdateFlow({ data: null, error: null });

      const result = await practiceStreakService.updatePracticeStreak('2026-03-24', false);

      expect(result.streakCount).toBe(1);
    });
  });
});
