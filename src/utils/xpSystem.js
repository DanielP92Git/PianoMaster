/**
 * XP and Leveling System
 *
 * Manages student XP progression, level calculations, and XP rewards
 */

import supabase from '../services/supabase';

/**
 * XP Level definitions
 * Each level requires a certain amount of total XP
 */
export const XP_LEVELS = [
  { level: 1, xpRequired: 0, title: 'Beginner', icon: '🌱' },
  { level: 2, xpRequired: 100, title: 'Music Sprout', icon: '🌿' },
  { level: 3, xpRequired: 250, title: 'Note Finder', icon: '🎵' },
  { level: 4, xpRequired: 450, title: 'Melody Maker', icon: '🎶' },
  { level: 5, xpRequired: 700, title: 'Rhythm Keeper', icon: '🥁' },
  { level: 6, xpRequired: 1000, title: 'Music Explorer', icon: '🗺️' },
  { level: 7, xpRequired: 1400, title: 'Sound Wizard', icon: '🪄' },
  { level: 8, xpRequired: 1900, title: 'Piano Pro', icon: '🎹' },
  { level: 9, xpRequired: 2500, title: 'Music Master', icon: '👑' },
  { level: 10, xpRequired: 3200, title: 'Legend', icon: '⭐' }
];

/**
 * Calculate current level based on total XP
 * @param {number} totalXp - Student's total XP
 * @returns {Object} Level object with level, title, and icon
 */
export const calculateLevel = (totalXp) => {
  // Find the highest level the student has reached
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= XP_LEVELS[i].xpRequired) {
      return XP_LEVELS[i];
    }
  }
  return XP_LEVELS[0]; // Default to level 1
};

/**
 * Calculate XP required for next level
 * @param {number} currentLevel - Current level number
 * @returns {number} XP required for next level (or 0 if max level)
 */
export const getNextLevelXP = (currentLevel) => {
  if (currentLevel >= 10) return 0; // Max level
  return XP_LEVELS[currentLevel].xpRequired;
};

/**
 * Calculate progress to next level
 * @param {number} totalXp - Student's total XP
 * @returns {Object} Object with current level, next level XP, and progress percentage
 */
export const getLevelProgress = (totalXp) => {
  const currentLevelData = calculateLevel(totalXp);
  const currentLevel = currentLevelData.level;

  if (currentLevel >= 10) {
    return {
      currentLevel: currentLevelData,
      nextLevelXP: 0,
      xpInCurrentLevel: 0,
      xpNeededForNext: 0,
      progressPercentage: 100
    };
  }

  const currentLevelXP = XP_LEVELS[currentLevel - 1].xpRequired;
  const nextLevelXP = XP_LEVELS[currentLevel].xpRequired;
  const xpInCurrentLevel = totalXp - currentLevelXP;
  const xpNeededForNext = nextLevelXP - totalXp;
  const progressPercentage = Math.floor(
    (xpInCurrentLevel / (nextLevelXP - currentLevelXP)) * 100
  );

  return {
    currentLevel: currentLevelData,
    nextLevelXP,
    xpInCurrentLevel,
    xpNeededForNext,
    progressPercentage
  };
};

/**
 * XP Reward calculations
 */
export const XP_REWARDS = {
  // Node completion rewards (base * stars)
  nodeBaseXP: 50,

  // Bonus XP sources
  bonuses: {
    firstTimeComplete: 25,
    perfectScore: 50,
    dailyStreak: 25,
    weeklyStreak: 100,
    achievementEarned: (achievementPoints) => Math.floor(achievementPoints / 2),
    bossBattleWin: 150,
    threeStarNode: 50
  }
};

/**
 * Calculate XP reward for completing a node
 * @param {number} stars - Stars earned (1-3)
 * @param {number} baseXP - Base XP for the node (default 50)
 * @param {Object} bonuses - Optional bonuses { firstTime, perfect, etc. }
 * @returns {number} Total XP to award
 */
export const calculateNodeXP = (stars, baseXP = XP_REWARDS.nodeBaseXP, bonuses = {}) => {
  let totalXP = baseXP * stars;

  // Add bonuses
  if (bonuses.firstTime) {
    totalXP += XP_REWARDS.bonuses.firstTimeComplete;
  }
  if (bonuses.perfect) {
    totalXP += XP_REWARDS.bonuses.perfectScore;
  }
  if (bonuses.threeStars && stars === 3) {
    totalXP += XP_REWARDS.bonuses.threeStarNode;
  }

  return totalXP;
};

/**
 * Award XP to a student using the database function
 * @param {string} studentId - Student UUID
 * @param {number} xpAmount - Amount of XP to award
 * @returns {Promise<Object>} Result with new total XP, level, and leveledUp flag
 */
export const awardXP = async (studentId, xpAmount) => {
  try {
    const { data, error } = await supabase.rpc('award_xp', {
      p_student_id: studentId,
      p_xp_amount: xpAmount
    });

    if (error) throw error;

    // The function returns an array with one row
    const result = data[0];

    return {
      newTotalXP: result.new_total_xp,
      newLevel: result.new_level,
      leveledUp: result.leveled_up,
      xpAwarded: xpAmount
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    throw error;
  }
};

/**
 * Get student's current XP and level
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} Student's XP and level data
 */
export const getStudentXP = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('total_xp, current_level')
      .eq('id', studentId)
      .single();

    if (error) throw error;

    const levelData = calculateLevel(data.total_xp);
    const progress = getLevelProgress(data.total_xp);

    return {
      totalXP: data.total_xp,
      currentLevel: data.current_level,
      levelData,
      progress
    };
  } catch (error) {
    console.error('Error fetching student XP:', error);
    throw error;
  }
};

/**
 * Calculate XP for a game session result
 * @param {Object} session - Session result object
 * @param {number} session.score - Final score
 * @param {number} session.maxScore - Maximum possible score
 * @param {string} session.nodeId - Optional node ID if from trail
 * @param {boolean} session.isFirstComplete - Is this the first completion
 * @returns {Object} XP breakdown
 */
export const calculateSessionXP = (session) => {
  const percentage = (session.score / session.maxScore) * 100;

  // Calculate stars
  let stars = 0;
  if (percentage >= 95) stars = 3;
  else if (percentage >= 80) stars = 2;
  else if (percentage >= 60) stars = 1;

  // Base XP from stars
  let baseXP = XP_REWARDS.nodeBaseXP * stars;

  // Bonuses
  const bonuses = {};
  let bonusXP = 0;

  if (session.isFirstComplete) {
    bonuses.firstTime = true;
    bonusXP += XP_REWARDS.bonuses.firstTimeComplete;
  }

  if (percentage === 100) {
    bonuses.perfect = true;
    bonusXP += XP_REWARDS.bonuses.perfectScore;
  }

  if (stars === 3) {
    bonuses.threeStars = true;
    bonusXP += XP_REWARDS.bonuses.threeStarNode;
  }

  const totalXP = baseXP + bonusXP;

  return {
    stars,
    baseXP,
    bonusXP,
    bonuses,
    totalXP
  };
};

/**
 * Get XP leaderboard (top students)
 * @param {number} limit - Number of students to return
 * @returns {Promise<Array>} Array of top students
 */
export const getXPLeaderboard = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, username, avatar_url, total_xp, current_level')
      .order('total_xp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((student, index) => ({
      ...student,
      rank: index + 1,
      levelData: calculateLevel(student.total_xp)
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

export default {
  XP_LEVELS,
  calculateLevel,
  getNextLevelXP,
  getLevelProgress,
  calculateNodeXP,
  awardXP,
  getStudentXP,
  calculateSessionXP,
  getXPLeaderboard
};
