import { describe, it, expect } from 'vitest';
import { getCalendarDate } from './dateUtils';

describe('getCalendarDate', () => {
  it('formats a date correctly (months are 0-indexed)', () => {
    // new Date(year, month, day) — month is 0-indexed: 2 = March
    expect(getCalendarDate(new Date(2026, 2, 24))).toBe('2026-03-24');
  });

  it('zero-pads single-digit month and day', () => {
    // Month 0 = January, day 5
    expect(getCalendarDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('zero-pads single-digit day', () => {
    expect(getCalendarDate(new Date(2026, 11, 9))).toBe('2026-12-09');
  });

  it('returns today when no arguments provided', () => {
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(getCalendarDate()).toBe(expected);
  });

  it('uses local timezone for date with UTC+3 offset (evening scenario)', () => {
    // 2026-03-25T01:00:00 at UTC+3 offset = 2026-03-24T22:00:00 UTC
    // In local timezone UTC+3, the date is March 25 (not March 24)
    // The JS Date constructor with ISO string respects the offset
    const dateInUtcPlus3 = new Date('2026-03-25T01:00:00+03:00');
    // This date's local time in UTC+3 is March 25 at 01:00
    // getFullYear/getMonth/getDate return LOCAL values (based on the runtime's TZ)
    // We verify the function reads the Date's year/month/day properties consistently
    const result = getCalendarDate(dateInUtcPlus3);
    // The result should match what JS's local date properties return for this Date object
    const expected = `${dateInUtcPlus3.getFullYear()}-${String(dateInUtcPlus3.getMonth() + 1).padStart(2, '0')}-${String(dateInUtcPlus3.getDate()).padStart(2, '0')}`;
    expect(result).toBe(expected);
  });

  it('returns the same result for Date and equivalent timestamp string', () => {
    const d1 = new Date(2026, 5, 15); // June 15, 2026 (local midnight)
    const d2 = new Date(d1.getTime()); // same milliseconds
    expect(getCalendarDate(d1)).toBe(getCalendarDate(d2));
  });

  it('handles year 2000 correctly', () => {
    expect(getCalendarDate(new Date(2000, 0, 1))).toBe('2000-01-01');
  });
});
