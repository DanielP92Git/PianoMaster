/**
 * Rate Limit Service
 *
 * Client interface for database-level rate limiting.
 * Prevents XP farming by limiting score submissions to 10 per 5 minutes per student per node.
 */

import supabase from './supabase';

/**
 * Rate limit window in milliseconds (5 minutes)
 */
const WINDOW_MS = 5 * 60 * 1000;

/**
 * Check if a student can submit a score for a node
 *
 * @param {string} studentId - Student UUID
 * @param {string} nodeId - Trail node ID
 * @returns {Promise<{allowed: boolean, resetTime: Date|null}>}
 *   - allowed: true if submission permitted, false if rate limited
 *   - resetTime: Date when rate limit resets (only set if rate limited)
 * @throws {Error} If database operation fails
 */
export async function checkRateLimit(studentId, nodeId) {
  // Call database function to check and consume rate limit token
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_student_id: studentId,
    p_node_id: nodeId,
    p_max_requests: 10,
    p_window_seconds: 300 // 5 minutes
  });

  if (error) {
    // PGRST202 = function not found in schema cache (migration not applied)
    // In this case, allow the request to proceed and log a warning
    if (error.code === 'PGRST202') {
      console.warn('Rate limit function not found in database. Allowing request. Run migration 20260201000002_add_rate_limiting.sql to enable rate limiting.');
      return { allowed: true, resetTime: null };
    }
    console.error('Rate limit check failed:', error);
    throw error;
  }

  const allowed = data === true;

  // If rate limited, calculate reset time
  let resetTime = null;
  if (!allowed) {
    const { data: limitData, error: limitError } = await supabase
      .from('rate_limits')
      .select('last_refill')
      .eq('student_id', studentId)
      .eq('node_id', nodeId)
      .single();

    if (limitError) {
      console.error('Failed to fetch rate limit data:', limitError);
      // Don't throw - still return rate limited status
      resetTime = new Date(Date.now() + WINDOW_MS);
    } else if (limitData) {
      resetTime = new Date(new Date(limitData.last_refill).getTime() + WINDOW_MS);
    }
  }

  return { allowed, resetTime };
}

/**
 * Get the current rate limit status for a student on a node
 * (without consuming a token)
 *
 * @param {string} studentId - Student UUID
 * @param {string} nodeId - Trail node ID
 * @returns {Promise<{tokens: number, resetTime: Date}>}
 *   - tokens: Remaining submissions in current window (0-10)
 *   - resetTime: Date when window resets
 * @throws {Error} If database operation fails
 */
export async function getRateLimitStatus(studentId, nodeId) {
  const { data, error } = await supabase
    .from('rate_limits')
    .select('tokens, last_refill')
    .eq('student_id', studentId)
    .eq('node_id', nodeId)
    .single();

  if (error) {
    // PGRST116 = no rows found - this is expected if no submissions yet
    if (error.code === 'PGRST116') {
      return {
        tokens: 10,
        resetTime: new Date()
      };
    }
    console.error('Failed to fetch rate limit status:', error);
    throw error;
  }

  if (!data) {
    // No record = full tokens available
    return {
      tokens: 10,
      resetTime: new Date()
    };
  }

  const resetTime = new Date(new Date(data.last_refill).getTime() + WINDOW_MS);

  // Check if window has expired (tokens should be refilled)
  if (resetTime <= new Date()) {
    return {
      tokens: 10,
      resetTime: new Date()
    };
  }

  return {
    tokens: data.tokens,
    resetTime
  };
}

export default {
  checkRateLimit,
  getRateLimitStatus
};
