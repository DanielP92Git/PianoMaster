/**
 * Score Calculator for Sight Reading Game
 * Implements scoring logic from PRD (lines 371-383, 959-1017)
 */

/**
 * Calculate pitch accuracy percentage
 * @param {Array} performanceResults - Array of note performance results
 * @returns {number} Pitch accuracy percentage (0-100)
 */
export function calculatePitchAccuracy(performanceResults) {
  if (!performanceResults || performanceResults.length === 0) {
    return 0;
  }

  const correctPitches = performanceResults.filter(
    (result) => result.isCorrect === true
  ).length;

  return (correctPitches / performanceResults.length) * 100;
}

/**
 * Calculate rhythm accuracy percentage
 * @param {Array} performanceResults - Array of note performance results
 * @returns {number} Rhythm accuracy percentage (0-100)
 */
export function calculateRhythmAccuracy(performanceResults) {
  if (!performanceResults || performanceResults.length === 0) {
    return 0;
  }

  // Count notes with good timing (perfect or good status)
  const onTimeNotes = performanceResults.filter((result) => {
    const status = result.timingStatus;
    return status === "perfect" || status === "good";
  }).length;

  return (onTimeNotes / performanceResults.length) * 100;
}

/**
 * Calculate overall weighted score
 * Formula: (pitchAccuracy × 0.7) + (rhythmAccuracy × 0.3)
 * @param {number} pitchAccuracy - Pitch accuracy percentage
 * @param {number} rhythmAccuracy - Rhythm accuracy percentage
 * @returns {number} Overall score (0-100)
 */
export function calculateOverallScore(pitchAccuracy, rhythmAccuracy) {
  return pitchAccuracy * 0.7 + rhythmAccuracy * 0.3;
}

/**
 * Get performance rating based on score
 * @param {number} score - Overall score (0-100)
 * @returns {Object} { stars: number, label: string }
 */
export function getPerformanceRating(score) {
  if (score >= 90) {
    return { stars: 3, label: "Excellent!" };
  }
  if (score >= 75) {
    return { stars: 2, label: "Good Job!" };
  }
  if (score >= 60) {
    return { stars: 1, label: "Keep Practicing!" };
  }
  return { stars: 0, label: "Try Again!" };
}

/**
 * Get detailed breakdown of note performance
 * @param {Array} performanceResults - Array of note performance results
 * @returns {Object} Breakdown counts
 */
export function getDetailedBreakdown(performanceResults) {
  if (!performanceResults || performanceResults.length === 0) {
    return {
      correct: 0,
      wrongPitch: 0,
      tooEarly: 0,
      tooLate: 0,
      missed: 0,
      total: 0,
    };
  }

  const breakdown = {
    correct: 0,
    wrongPitch: 0,
    tooEarly: 0,
    tooLate: 0,
    missed: 0,
    total: performanceResults.length,
  };

  performanceResults.forEach((result) => {
    if (result.timingStatus === "missed") {
      breakdown.missed++;
    } else if (result.timingStatus === "wrong_pitch") {
      breakdown.wrongPitch++;
    } else if (result.isCorrect) {
      // Correct pitch, check timing
      if (
        result.timingStatus === "perfect" ||
        result.timingStatus === "good" ||
        result.timingStatus === "okay"
      ) {
        breakdown.correct++;
      } else if (result.timingStatus === "early") {
        breakdown.tooEarly++;
      } else if (result.timingStatus === "late") {
        breakdown.tooLate++;
      }
    } else {
      // Wrong pitch (shouldn't happen if timingStatus is set correctly)
      breakdown.wrongPitch++;
    }
  });

  return breakdown;
}

/**
 * Get encouraging message based on performance
 * @param {number} score - Overall score (0-100)
 * @returns {string} Encouraging message
 */
export function getEncouragingMessage(score) {
  const messages = {
    excellent: [
      "Perfect! You're a natural!",
      "Outstanding performance!",
      "Incredible sight reading skills!",
    ],
    good: [
      "Great job! Keep it up!",
      "Nice work! You're improving!",
      "Well done! Practice makes perfect!",
    ],
    needsWork: [
      "Good effort! Try again!",
      "You're learning! Keep practicing!",
      "Almost there! Don't give up!",
    ],
  };

  let category;
  if (score >= 90) {
    category = "excellent";
  } else if (score >= 60) {
    category = "good";
  } else {
    category = "needsWork";
  }

  const messagesForCategory = messages[category];
  return messagesForCategory[
    Math.floor(Math.random() * messagesForCategory.length)
  ];
}

