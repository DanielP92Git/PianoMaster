/**
 * Daily Challenge Service
 *
 * Generates and tracks daily challenges for student engagement.
 * Each student gets one challenge per day, deterministically selected
 * based on the date.
 */

import supabase from './supabase';

// Challenge type definitions
export const CHALLENGE_TYPES = {
  SPEED_ROUND: 'speed_round',
  REVIEW_CHALLENGE: 'review_challenge'
};

const CHALLENGE_CONFIGS = {
  [CHALLENGE_TYPES.SPEED_ROUND]: {
    questionCount: 20,
    timeLimit: 60,
    notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']
  }
};

const CHALLENGE_XP_REWARDS = {
  [CHALLENGE_TYPES.SPEED_ROUND]: 75,
  [CHALLENGE_TYPES.REVIEW_CHALLENGE]: 50
};

const CHALLENGE_TYPE_LIST = [
  CHALLENGE_TYPES.SPEED_ROUND,
  CHALLENGE_TYPES.REVIEW_CHALLENGE
];

/**
 * Get today's challenge for a student. If none exists, generate one and insert it.
 * @param {string} studentId - The student's ID
 * @returns {Promise<Object|null>} The challenge object, or null on error
 */
export const getTodaysChallenge = async (studentId) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Try to get existing challenge for today
    const { data: existingChallenge, error: fetchError } = await supabase
      .from('student_daily_challenges')
      .select('*')
      .eq('student_id', studentId)
      .eq('challenge_date', today)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching daily challenge:', fetchError);
      return null;
    }

    if (existingChallenge) {
      return existingChallenge;
    }

    // Generate and insert a new challenge for today
    const newChallenge = await generateChallenge(today, studentId);
    return newChallenge;
  } catch (error) {
    console.error('Error in getTodaysChallenge:', error);
    return null;
  }
};

/**
 * Mark a daily challenge as completed
 * @param {string} studentId - The student's ID
 * @param {string} challengeId - The challenge row ID
 * @returns {Promise<Object|null>} The updated challenge, or null on error
 */
export const completeDailyChallenge = async (studentId, challengeId) => {
  try {
    const { data, error } = await supabase
      .from('student_daily_challenges')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', challengeId)
      .eq('student_id', studentId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error completing daily challenge:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in completeDailyChallenge:', error);
    return null;
  }
};

/**
 * Generate a new daily challenge and insert it into the database
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {string} studentId - The student's ID
 * @returns {Promise<Object|null>} The created challenge, or null on error
 */
export const generateChallenge = async (date, studentId) => {
  try {
    // Date-based seed for deterministic challenge type selection
    const seed = date.split('-').reduce((acc, n) => acc + parseInt(n, 10), 0);
    const challengeType = CHALLENGE_TYPE_LIST[seed % CHALLENGE_TYPE_LIST.length];

    let config;

    if (challengeType === CHALLENGE_TYPES.SPEED_ROUND) {
      config = { ...CHALLENGE_CONFIGS[CHALLENGE_TYPES.SPEED_ROUND] };
    } else {
      // review_challenge: pick a completed node to replay
      const { data: completedNodes, error: nodesError } = await supabase
        .from('student_skill_progress')
        .select('node_id')
        .eq('student_id', studentId)
        .gt('stars', 0)
        .order('last_practiced', { ascending: true })
        .limit(5);

      if (nodesError) {
        console.error('Error fetching completed nodes:', nodesError);
      }

      if (completedNodes && completedNodes.length > 0) {
        const nodeIndex = seed % completedNodes.length;
        config = { nodeId: completedNodes[nodeIndex].node_id };
      } else {
        // Fallback to speed_round if no completed nodes exist
        config = { ...CHALLENGE_CONFIGS[CHALLENGE_TYPES.SPEED_ROUND] };
      }
    }

    const xpReward = CHALLENGE_XP_REWARDS[challengeType] || 50;

    const { data: createdChallenge, error: insertError } = await supabase
      .from('student_daily_challenges')
      .insert({
        student_id: studentId,
        challenge_date: date,
        challenge_type: challengeType,
        challenge_config: config,
        xp_reward: xpReward
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('Error inserting daily challenge:', insertError);
      return null;
    }

    return createdChallenge;
  } catch (error) {
    console.error('Error in generateChallenge:', error);
    return null;
  }
};

export default {
  getTodaysChallenge,
  completeDailyChallenge,
  generateChallenge,
};
