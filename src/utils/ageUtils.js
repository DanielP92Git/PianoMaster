/**
 * Age calculation utilities for COPPA-compliant age verification.
 * These functions support neutral DOB collection during registration.
 */

/**
 * Calculate age in years from a birth date.
 * Accounts for whether birthday has occurred this year.
 * @param {Date} birthDate - The date of birth
 * @returns {number} Age in years
 */
export function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust if birthday hasn't occurred yet this year
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Check if a person is under 13 years old.
 * COPPA defines "child" as under 13.
 * @param {Date} birthDate - The date of birth
 * @returns {boolean} True if under 13
 */
export function isUnder13(birthDate) {
  return calculateAge(birthDate) < 13;
}

/**
 * Format DOB parts (month, day, year) into a Date object.
 * @param {{month: number, day: number, year: number}} dob - DOB parts (month is 1-12)
 * @returns {Date} Date object
 */
export function dobPartsToDate({ month, day, year }) {
  // Month is 1-12 in input, but Date uses 0-11
  return new Date(year, month - 1, day);
}

/**
 * Validate that DOB parts form a reasonable date.
 * Checks: all parts present, valid date, in the past, reasonable age.
 * @param {{month: number, day: number, year: number}} dob - DOB parts
 * @returns {boolean} True if valid
 */
export function isValidDOB({ month, day, year }) {
  if (!month || !day || !year) return false;

  const date = dobPartsToDate({ month, day, year });
  const today = new Date();

  // Check date is valid (not NaN) and in the past
  // Also check reasonable age limit (not over 120 years old)
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    date < today &&
    date.getFullYear() > today.getFullYear() - 120
  );
}
