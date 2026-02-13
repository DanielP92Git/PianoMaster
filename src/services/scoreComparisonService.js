/**
 * Score Comparison Service
 *
 * Provides percentile comparison for student scores against their historical performance.
 * Used by VictoryScreen celebration system to show performance context.
 *
 * Security: All functions include authorization checks (defense in depth).
 * Error handling: Functions return null on errors (non-critical feature, never throws).
 */

import supabase from './supabase';
import { verifyStudentDataAccess } from './authorizationUtils';

/**
 * Calculate percentile rank of a score against student's historical trail scores.
 *
 * @param {string} studentId - The student's UUID
 * @param {number} currentScore - The score to compare (0-100)
 * @param {string} nodeId - The trail node ID (for context, not used in calculation)
 * @returns {Promise<number|null>} Percentile (0-100) or null if insufficient data or error
 */
export async function calculateScorePercentile(studentId, currentScore, nodeId) {
  try {
    // Client-side authorization check (defense in depth)
    // RLS policy will also enforce this at database level
    await verifyStudentDataAccess(studentId);

    // Call PostgreSQL function to calculate percentile
    const { data, error } = await supabase.rpc('calculate_score_percentile', {
      p_student_id: studentId,
      p_current_score: currentScore,
      p_node_id: nodeId,
    });

    if (error) {
      console.error('Error calculating score percentile:', error);
      return null;
    }

    // Parse JSONB response
    if (!data) {
      return null;
    }

    // If insufficient data (fewer than 3 historical attempts), return null
    if (data.insufficient_data === true) {
      return null;
    }

    // Return percentile as number (0-100)
    return data.percentile;
  } catch (error) {
    // Percentile is non-critical - gracefully return null on any error
    console.error('Failed to calculate percentile:', error);
    return null;
  }
}

/**
 * Get child-friendly message for percentile rank.
 *
 * @param {number|null} percentile - Percentile rank (0-100) or null
 * @param {Function} [t] - i18next translation function. If provided, returns translated strings.
 * @returns {string|null} Child-friendly message or null if no percentile
 */
export function getPercentileMessage(percentile, t) {
  // Return null if no percentile data available
  if (percentile === null || percentile === undefined) {
    return null;
  }

  // Tier 1: 90%+ - Best performance yet
  if (percentile >= 90) {
    if (t) return t('percentile.bestYet', { percentile });
    return `Your best score yet! Better than ${percentile}% of your attempts!`;
  }

  // Tier 2: 70-89% - Great improvement
  if (percentile >= 70) {
    if (t) return t('percentile.greatImprovement', { percentile });
    return `Great improvement! Better than ${percentile}% of your previous scores!`;
  }

  // Tier 3: 50-69% - Getting better
  if (percentile >= 50) {
    if (t) return t('percentile.gettingBetter', { percentile });
    return `You're getting better! Beat ${percentile}% of your past tries!`;
  }

  // Tier 4: 25-49% - Keep practicing
  if (percentile >= 25) {
    if (t) return t('percentile.keepPracticing', { percentile });
    return `Keep practicing! Better than ${percentile}% of before!`;
  }

  // Tier 5: Below 25% - Room to grow (no percentage shown to avoid discouragement)
  if (t) return t('percentile.roomToGrow');
  return 'Room to grow! Keep trying!';
}
