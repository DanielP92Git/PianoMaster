/**
 * Score Calculator for Sight Reading Game
 * Implements scoring logic from PRD (lines 371-383, 959-1017)
 */

import { calculateStarsFromPercentage } from "../../../../services/skillProgressService";

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

  // Weight by the same per-status score useTimingAnalysis assigns when scoring each note
  // (perfect=1.0, good=0.8, okay=0.5, early/late=0.3; missed/wrong-pitch carry no timing
  // object and contribute 0). Previously this only counted perfect/good, while
  // getDetailedBreakdown counts okay as correct too — an all-"okay" performance could show
  // "all correct" in the breakdown yet score 0% rhythm accuracy here.
  const totalTimingScore = performanceResults.reduce(
    (sum, result) => sum + (result.timing?.score ?? 0),
    0
  );

  return (totalTimingScore / performanceResults.length) * 100;
}

/**
 * Calculate overall weighted score
 * Test mode formula: (pitchAccuracy × 0.7) + (rhythmAccuracy × 0.3) — unchanged.
 * Practice mode: pitch-only (PRAC-03 / D-04) — wider timing windows in Practice mode
 * cannot be gamed into a higher blended score, since rhythm isn't scored at all.
 * @param {number} pitchAccuracy - Pitch accuracy percentage
 * @param {number} rhythmAccuracy - Rhythm accuracy percentage
 * @param {string} [mode="test"] - Grading mode: "test" (default) or "practice"
 * @returns {number} Overall score (0-100)
 */
export function calculateOverallScore(
  pitchAccuracy,
  rhythmAccuracy,
  mode = "test"
) {
  if (mode === "practice") return pitchAccuracy; // pitch-focused grading (PRAC-03 / D-04)
  return pitchAccuracy * 0.7 + rhythmAccuracy * 0.3; // Test: unchanged
}

/**
 * Get performance rating based on score
 * Delegates thresholds to calculateStarsFromPercentage (skillProgressService.js) so the
 * in-game rating always agrees with what the trail persists — this used to threshold at
 * 90/75/60 while the trail used 95/80/60, so e.g. a 92% run could show 3 stars here but
 * save as 2 stars on the trail.
 * @param {number} score - Overall score (0-100)
 * @returns {Object} { stars: number, label: string }
 */
export function getPerformanceRating(score) {
  const stars = calculateStarsFromPercentage(score);
  if (stars === 3) {
    return {
      stars: 3,
      labelKey: "sightReading.feedback.excellent",
      label: "Excellent!",
    };
  }
  if (stars === 2) {
    return {
      stars: 2,
      labelKey: "sightReading.feedback.goodJob",
      label: "Good Job!",
    };
  }
  if (stars === 1) {
    return {
      stars: 1,
      labelKey: "sightReading.feedback.keepPracticing",
      label: "Keep Practicing!",
    };
  }
  return {
    stars: 0,
    labelKey: "sightReading.feedback.tryAgain",
    label: "Try Again!",
  };
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
    if (result.timingStatus === "rest_correct") {
      // Rest kept correctly counts as a correct position.
      breakdown.correct++;
    } else if (result.timingStatus === "rest_violation") {
      // Note played during a rest counts as a wrong position.
      breakdown.wrongPitch++;
    } else if (result.timingStatus === "missed") {
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
