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
};
