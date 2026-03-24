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

// Mock awardXP named export from xpSystem
vi.mock('../utils/xpSystem', () => ({
  awardXP: vi.fn(),
}));

import supabase from './supabase';
import { awardXP } from '../utils/xpSystem';
import { practiceLogService, computeLongestStreak } from './practiceLogService';

describe('practiceLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper: set up authenticated session mock
  const mockAuthSession = (userId = 'test-user-id') => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: userId } } },
    });
  };

  // Helper: set up unauthenticated session mock
  const mockNoSession = () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
  };

  // Helper: create a chainable mock for supabase.from().insert().select().single()
  const mockInsertChain = (resolvedValue) => {
    const singleMock = vi.fn().mockResolvedValue(resolvedValue);
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const insertMock = vi.fn().mockReturnValue({ select: selectMock });
    supabase.from.mockReturnValue({ insert: insertMock });
    return { insertMock, selectMock, singleMock };
  };

  // Helper: create a chainable mock for supabase.from().select().eq().eq().maybeSingle()
  const mockSelectChain = (resolvedValue) => {
    const maybeSingleMock = vi.fn().mockResolvedValue(resolvedValue);
    const eq2Mock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eq1Mock = vi.fn().mockReturnValue({ eq: eq2Mock });
    const selectMock = vi.fn().mockReturnValue({ eq: eq1Mock });
    supabase.from.mockReturnValue({ select: selectMock });
    return { selectMock, maybeSingleMock };
  };

  // ============================================================
  // logPractice() tests
  // ============================================================

  describe('logPractice()', () => {
    it('calls insert on instrument_practice_logs with student_id and practiced_on', async () => {
      mockAuthSession('user-123');
      const { insertMock } = mockInsertChain({
        data: { id: 'log-uuid', student_id: 'user-123', practiced_on: '2026-03-24' },
        error: null,
      });
      awardXP.mockResolvedValue({ newTotalXP: 125, newLevel: 3, leveledUp: false });

      await practiceLogService.logPractice('2026-03-24');

      expect(supabase.from).toHaveBeenCalledWith('instrument_practice_logs');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ student_id: 'user-123', practiced_on: '2026-03-24' })
      );
    });

    it('returns { inserted: true } when INSERT succeeds', async () => {
      mockAuthSession('user-123');
      mockInsertChain({
        data: { id: 'log-uuid' },
        error: null,
      });
      awardXP.mockResolvedValue({ newTotalXP: 125, newLevel: 3, leveledUp: false });

      const result = await practiceLogService.logPractice('2026-03-24');

      expect(result.inserted).toBe(true);
    });

    it('returns { inserted: false } when error.code is 23505 (unique violation)', async () => {
      mockAuthSession('user-123');
      mockInsertChain({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      });

      const result = await practiceLogService.logPractice('2026-03-24');

      expect(result.inserted).toBe(false);
    });

    it('does NOT throw when error.code is 23505', async () => {
      mockAuthSession('user-123');
      mockInsertChain({
        data: null,
        error: { code: '23505', message: 'duplicate' },
      });

      await expect(practiceLogService.logPractice('2026-03-24')).resolves.not.toThrow();
    });

    it('calls awardXP with userId and 25 when inserted === true', async () => {
      mockAuthSession('user-abc');
      mockInsertChain({ data: { id: 'log-uuid' }, error: null });
      awardXP.mockResolvedValue({ newTotalXP: 200, newLevel: 4, leveledUp: false });

      await practiceLogService.logPractice('2026-03-24');

      expect(awardXP).toHaveBeenCalledWith('user-abc', 25);
    });

    it('does NOT call awardXP when inserted === false (duplicate)', async () => {
      mockAuthSession('user-abc');
      mockInsertChain({
        data: null,
        error: { code: '23505', message: 'duplicate' },
      });

      await practiceLogService.logPractice('2026-03-24');

      expect(awardXP).not.toHaveBeenCalled();
    });

    it('throws when error.code is not 23505 (genuine DB error)', async () => {
      mockAuthSession('user-123');
      mockInsertChain({
        data: null,
        error: { code: '42P01', message: 'relation does not exist' },
      });

      await expect(practiceLogService.logPractice('2026-03-24')).rejects.toThrow();
    });

    it('throws "Not authenticated" when session is null', async () => {
      mockNoSession();

      await expect(practiceLogService.logPractice('2026-03-24')).rejects.toThrow('Not authenticated');
    });
  });

  // ============================================================
  // getTodayStatus() tests
  // ============================================================

  describe('getTodayStatus()', () => {
    it('returns { logged: true } when a row exists for the given date', async () => {
      mockAuthSession('user-123');
      mockSelectChain({ data: { id: 'log-uuid' }, error: null });

      const result = await practiceLogService.getTodayStatus('2026-03-24');

      expect(result).toEqual({ logged: true });
    });

    it('returns { logged: false } when no row exists for the given date', async () => {
      mockAuthSession('user-123');
      mockSelectChain({ data: null, error: null });

      const result = await practiceLogService.getTodayStatus('2026-03-24');

      expect(result).toEqual({ logged: false });
    });

    it('throws when session is null', async () => {
      mockNoSession();

      await expect(practiceLogService.getTodayStatus('2026-03-24')).rejects.toThrow('Not authenticated');
    });
  });

  // ============================================================
  // PRACTICE_XP_REWARD constant test
  // ============================================================

  it('PRACTICE_XP_REWARD is 25', () => {
    expect(practiceLogService.PRACTICE_XP_REWARD).toBe(25);
  });

  // ============================================================
  // getHistoricalLogs() tests
  // ============================================================

  describe('getHistoricalLogs()', () => {
    // Helper: chain supabase.from().select().eq().gte().lte().order()
    const mockHistoricalQuery = (resolvedValue) => {
      const orderMock = vi.fn().mockResolvedValue(resolvedValue);
      const lteMock = vi.fn().mockReturnValue({ order: orderMock });
      const gteMock = vi.fn().mockReturnValue({ lte: lteMock });
      const eqMock = vi.fn().mockReturnValue({ gte: gteMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      supabase.from.mockReturnValue({ select: selectMock });
      return { selectMock, eqMock, gteMock, lteMock, orderMock };
    };

    it('calls supabase with correct table, select, eq, gte, lte, order', async () => {
      mockAuthSession('user-123');
      const { selectMock, eqMock, gteMock, lteMock, orderMock } = mockHistoricalQuery({
        data: [{ practiced_on: '2026-01-15' }],
        error: null,
      });

      await practiceLogService.getHistoricalLogs('2025-03-24', '2026-03-24');

      expect(supabase.from).toHaveBeenCalledWith('instrument_practice_logs');
      expect(selectMock).toHaveBeenCalledWith('practiced_on');
      expect(eqMock).toHaveBeenCalledWith('student_id', 'user-123');
      expect(gteMock).toHaveBeenCalledWith('practiced_on', '2025-03-24');
      expect(lteMock).toHaveBeenCalledWith('practiced_on', '2026-03-24');
      expect(orderMock).toHaveBeenCalledWith('practiced_on', { ascending: true });
    });

    it('returns data array on success', async () => {
      mockAuthSession('user-123');
      mockHistoricalQuery({
        data: [{ practiced_on: '2026-01-15' }, { practiced_on: '2026-01-16' }],
        error: null,
      });

      const result = await practiceLogService.getHistoricalLogs('2025-03-24', '2026-03-24');

      expect(result).toEqual([{ practiced_on: '2026-01-15' }, { practiced_on: '2026-01-16' }]);
    });

    it('returns empty array when data is null (coalesces to [])', async () => {
      mockAuthSession('user-123');
      mockHistoricalQuery({ data: null, error: null });

      const result = await practiceLogService.getHistoricalLogs('2025-03-24', '2026-03-24');

      expect(result).toEqual([]);
    });

    it('throws "Not authenticated" when session is null', async () => {
      mockNoSession();

      await expect(
        practiceLogService.getHistoricalLogs('2025-03-24', '2026-03-24')
      ).rejects.toThrow('Not authenticated');
    });

    it('throws on non-null Supabase error', async () => {
      mockAuthSession('user-123');
      mockHistoricalQuery({
        data: null,
        error: { code: '42P01', message: 'relation does not exist' },
      });

      await expect(
        practiceLogService.getHistoricalLogs('2025-03-24', '2026-03-24')
      ).rejects.toMatchObject({ code: '42P01' });
    });
  });

  // ============================================================
  // computeLongestStreak() tests
  // ============================================================

  describe('computeLongestStreak()', () => {
    it('returns 0 for empty array', () => {
      expect(computeLongestStreak([])).toBe(0);
    });

    it('returns 1 for single date', () => {
      expect(computeLongestStreak([{ practiced_on: '2026-03-24' }])).toBe(1);
    });

    it('returns correct streak for consecutive dates', () => {
      const dates = [
        { practiced_on: '2026-03-22' },
        { practiced_on: '2026-03-23' },
        { practiced_on: '2026-03-24' },
      ];
      expect(computeLongestStreak(dates)).toBe(3);
    });

    it('returns longest streak when there are gaps', () => {
      const dates = [
        { practiced_on: '2026-01-01' },
        { practiced_on: '2026-01-02' },
        { practiced_on: '2026-01-03' },
        { practiced_on: '2026-01-10' },
        { practiced_on: '2026-01-11' },
      ];
      expect(computeLongestStreak(dates)).toBe(3);
    });

    it('returns 1 when no consecutive days exist', () => {
      const dates = [
        { practiced_on: '2026-03-01' },
        { practiced_on: '2026-03-05' },
        { practiced_on: '2026-03-10' },
      ];
      expect(computeLongestStreak(dates)).toBe(1);
    });

    it('handles dates across month boundaries', () => {
      const dates = [
        { practiced_on: '2026-01-30' },
        { practiced_on: '2026-01-31' },
        { practiced_on: '2026-02-01' },
      ];
      expect(computeLongestStreak(dates)).toBe(3);
    });
  });
});
