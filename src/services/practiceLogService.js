import supabase from './supabase';
import { awardXP } from '../utils/xpSystem';
import { getCalendarDate } from '../utils/dateUtils';

const PRACTICE_XP_REWARD = 25;

/**
 * Service for daily instrument practice logging.
 *
 * Handles:
 *  - logPractice(): insert today's log row with idempotent 23505 handling,
 *    awards 25 XP only when first log of the day (LOG-03, D-14)
 *  - getTodayStatus(): check if student has already logged today
 *
 * COPPA: no PII stored beyond student_id (UUID) and practiced_on (DATE).
 * Security: all operations require authenticated session; student_id always set to auth.uid().
 */
export const practiceLogService = {
  PRACTICE_XP_REWARD,

  /**
   * Log today's instrument practice. Idempotent — safe to call multiple times per day.
   * On first call: inserts a row and awards 25 XP.
   * On duplicate (same student, same date): returns { inserted: false }, no XP awarded.
   *
   * @param {string} localDate - "YYYY-MM-DD" from getCalendarDate() — local timezone, not UTC
   * @returns {Promise<{ inserted: boolean, xpResult?: Object }>}
   * @throws {Error} 'Not authenticated' if no session
   * @throws {Error} Supabase error if non-23505 DB error occurs
   */
  async logPractice(localDate) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const userId = session.user.id;

    const { data, error } = await supabase
      .from('instrument_practice_logs')
      .insert({
        student_id: userId,
        practiced_on: localDate,
      })
      .select()
      .single();

    if (error) {
      // PostgreSQL error code 23505 = unique_violation
      // This happens when the student already logged practice today (UNIQUE constraint).
      // Treat as idempotent success — do NOT throw, do NOT award XP again.
      if (error.code === '23505') {
        return { inserted: false };
      }
      throw error;
    }

    // First log of the day — award XP (LOG-03, D-14)
    let xpResult = null;
    try {
      xpResult = await awardXP(userId, PRACTICE_XP_REWARD);
    } catch (xpError) {
      // XP award failure should NOT block or reverse the practice log.
      // Log the error for debugging but return success with no xpResult.
      console.error('[practiceLogService] XP award failed (log still recorded):', xpError);
    }

    return { inserted: true, xpResult };
  },

  /**
   * Check whether the student has already logged practice for a given date.
   *
   * @param {string} localDate - "YYYY-MM-DD"
   * @returns {Promise<{ logged: boolean }>}
   * @throws {Error} 'Not authenticated' if no session
   * @throws {Error} Supabase error if query fails
   */
  async getTodayStatus(localDate) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('instrument_practice_logs')
      .select('id')
      .eq('student_id', session.user.id)
      .eq('practiced_on', localDate)
      .maybeSingle();

    if (error) throw error;
    return { logged: !!data };
  },

  /** Re-export getCalendarDate for component convenience */
  getCalendarDate,

  /**
   * Fetch 52 weeks of instrument practice logs for the authenticated student.
   *
   * Uses session.user.id (not passed studentId) to enforce RLS — students
   * can only query their own logs. The studentId param on the UI component
   * is used for the TanStack Query key only.
   *
   * @param {string} startDate - "YYYY-MM-DD" (363 days before endDate)
   * @param {string} endDate - "YYYY-MM-DD" (today in local timezone)
   * @returns {Promise<Array<{ practiced_on: string }>>}
   * @throws {Error} 'Not authenticated' if no session
   * @throws {Error} Supabase error if query fails
   */
  async getHistoricalLogs(startDate, endDate) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('instrument_practice_logs')
      .select('practiced_on')
      .eq('student_id', session.user.id)
      .gte('practiced_on', startDate)
      .lte('practiced_on', endDate)
      .order('practiced_on', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },
};

/**
 * Compute the longest consecutive-day practice chain from a list of practiced dates.
 *
 * Handles: duplicates (via Set dedup in sort), month boundaries, unsorted input.
 *
 * @param {Array<{ practiced_on: string } | string>} practicedDates
 *   Array of DB rows or plain date strings.
 * @returns {number} Length of the longest consecutive-day streak, or 0 if empty.
 */
export function computeLongestStreak(practicedDates) {
  if (!practicedDates || practicedDates.length === 0) return 0;

  const sorted = [...practicedDates]
    .map((r) => (typeof r === 'string' ? r : r.practiced_on))
    .sort();

  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
    // diffDays === 0 means duplicate date — skip, don't reset
  }
  return longest;
}
