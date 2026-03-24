import supabase from './supabase';
import { getCalendarDate } from '../utils/dateUtils';

/**
 * Practice streak service for instrument practice tracking.
 *
 * SEPARATE from app-usage streakService.js (D-12, STRK-03).
 * - No grace window — calendar-day strict (unlike app-usage streak's 36-hour grace)
 * - Weekend pass: Fri (day 5) and Sat (day 6) bridged — same algorithm as streakService.js
 * - weekend_pass_enabled read from current_streak table at call site, not stored here
 */

// ============================================================
// Helpers — same algorithm as streakService.js (mirrored)
// ============================================================

/**
 * Checks whether all calendar days strictly between lastPractice and today
 * are exclusively Friday (5) or Saturday (6) in local time.
 *
 * @param {Date} lastPractice
 * @param {Date} today
 * @returns {boolean} true if ALL intermediate days are Fri/Sat
 */
export function allIntermediateDaysAreWeekend(lastPractice, today) {
  const lastMidnight = new Date(
    lastPractice.getFullYear(),
    lastPractice.getMonth(),
    lastPractice.getDate()
  );
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((todayMidnight - lastMidnight) / MS_PER_DAY);

  if (diffDays <= 1) {
    // No intermediate days — not applicable
    return false;
  }

  for (let d = 1; d < diffDays; d++) {
    const intermediateDate = new Date(lastMidnight.getTime() + d * MS_PER_DAY);
    const dayOfWeek = intermediateDate.getDay(); // 0=Sun, 5=Fri, 6=Sat
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      return false; // A non-weekend intermediate day exists
    }
  }

  return true;
}

/**
 * Calendar-day gap with optional weekend-pass skipping.
 *
 * Returns:
 *   0  — same calendar day
 *   1  — consecutive (or weekend-pass-bridged)
 *  >1  — streak breaks
 *
 * @param {Date} lastPractice
 * @param {Date} today
 * @param {boolean} weekendPassEnabled
 * @returns {number}
 */
export function _effectiveDayGap(lastPractice, today, weekendPassEnabled) {
  const lastMidnight = new Date(
    lastPractice.getFullYear(),
    lastPractice.getMonth(),
    lastPractice.getDate()
  );
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const rawDiff = Math.round((todayMidnight - lastMidnight) / MS_PER_DAY);

  if (!weekendPassEnabled || rawDiff <= 1) {
    return rawDiff;
  }

  // Weekend pass: count only non-Fri/Sat days in the gap
  let requiredDays = 0;
  for (let d = 1; d <= rawDiff; d++) {
    const checkDate = new Date(lastMidnight.getTime() + d * MS_PER_DAY);
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      requiredDays += 1;
    }
  }

  // If the only required day is today, the gap is effectively 1 (consecutive)
  if (requiredDays <= 1) {
    return 1;
  }

  return rawDiff;
}

// ============================================================
// Service
// ============================================================

export const practiceStreakService = {
  /**
   * Fetch the current instrument practice streak for the authenticated student.
   *
   * @returns {Promise<{ streakCount: number, lastPracticedOn: string|null }>}
   * @throws {Error} 'Not authenticated' if no session
   */
  async getPracticeStreak() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('instrument_practice_streak')
      .select('streak_count, last_practiced_on')
      .eq('student_id', session.user.id)
      .maybeSingle();

    if (error) throw error;

    return {
      streakCount: data?.streak_count ?? 0,
      lastPracticedOn: data?.last_practiced_on ?? null,
    };
  },

  /**
   * Update practice streak after a new log.
   *
   * Logic:
   *  - No prior row (or no last_practiced_on): set streak to 1
   *  - Same day as last_practiced_on: no-op (return current streak)
   *  - Gap = 1 (consecutive or weekend-bridged): increment streak
   *  - Gap > 1: reset streak to 1
   *
   * @param {string} localDate - "YYYY-MM-DD" from getCalendarDate() — local timezone
   * @param {boolean} [weekendPassEnabled=false] - read from current_streak.weekend_pass_enabled
   * @returns {Promise<{ streakCount: number }>}
   * @throws {Error} 'Not authenticated' if no session
   */
  async updatePracticeStreak(localDate, weekendPassEnabled = false) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const userId = session.user.id;

    // Fetch current streak state
    const { data: current, error: fetchError } = await supabase
      .from('instrument_practice_streak')
      .select('streak_count, last_practiced_on')
      .eq('student_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // Parse today as local midnight Date for gap calculation
    const today = new Date(localDate + 'T00:00:00');
    let newStreakCount;

    if (!current || !current.last_practiced_on) {
      // First ever practice log — start streak at 1
      newStreakCount = 1;
    } else {
      const lastDate = new Date(current.last_practiced_on + 'T00:00:00');
      const gap = _effectiveDayGap(lastDate, today, weekendPassEnabled);

      if (gap === 0) {
        // Same day — no update needed
        return { streakCount: current.streak_count };
      } else if (gap === 1) {
        // Consecutive (or weekend-pass bridged) — increment
        newStreakCount = current.streak_count + 1;
      } else {
        // Gap > 1 — streak broken, restart at 1
        newStreakCount = 1;
      }
    }

    // Upsert streak row (insert on first log, update on subsequent)
    const { error: upsertError } = await supabase
      .from('instrument_practice_streak')
      .upsert(
        {
          student_id: userId,
          streak_count: newStreakCount,
          last_practiced_on: localDate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id' }
      );

    if (upsertError) throw upsertError;

    return { streakCount: newStreakCount };
  },

  // Expose helpers for testing and external use
  _effectiveDayGap,
  allIntermediateDaysAreWeekend,
  getCalendarDate,
};
