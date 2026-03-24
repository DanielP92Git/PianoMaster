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
import { practiceLogService } from './practiceLogService';

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
});
