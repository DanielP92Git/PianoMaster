/**
 * Date utility helpers shared across practice tracking services.
 *
 * Extracted from streakService.js to provide a single source of truth
 * for the calendar-date formatting pattern (INFRA-04).
 */

/**
 * Returns "YYYY-MM-DD" in local timezone for a given Date object.
 *
 * Uses local year/month/day (not UTC) to avoid the UTC drift bug where
 * a timestamp like 2026-03-24T23:00:00+03:00 would return "2026-03-24"
 * locally but "2026-03-24" in UTC — this is correct for calendar-day
 * tracking where the student's local date matters, not the server's UTC date.
 *
 * @param {Date} [date=new Date()] - Date to format. Defaults to now.
 * @returns {string} "YYYY-MM-DD" in local timezone
 *
 * @example
 * getCalendarDate(new Date(2026, 2, 24)) // "2026-03-24" (month is 0-indexed)
 * getCalendarDate(new Date(2026, 0, 5))  // "2026-01-05" (zero-padded)
 * getCalendarDate()                       // today's local date
 */
export function getCalendarDate(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
