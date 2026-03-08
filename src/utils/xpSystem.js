/**
 * XP and Leveling System
 *
 * Manages student XP progression, level calculations, and XP rewards
 */

import supabase from '../services/supabase';

/**
 * XP Level definitions
 * Each level requires a certain amount of total XP
 * Expanded to 30 levels with infinite prestige tiers beyond level 30
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
  { level: 10, xpRequired: 3200, title: 'Symphony Star', icon: '⭐' },
  { level: 11, xpRequired: 4000, title: 'Harmony Hero', icon: '🎼' },
  { level: 12, xpRequired: 5000, title: 'Virtuoso', icon: '✨' },
  { level: 13, xpRequired: 6200, title: 'Maestro', icon: '🎖️' },
  { level: 14, xpRequired: 7500, title: 'Grand Master', icon: '🏆' },
  { level: 15, xpRequired: 9000, title: 'Legend', icon: '💎' },
  { level: 16, xpRequired: 10500, title: 'Composer', icon: '📝' },
  { level: 17, xpRequired: 12200, title: 'Conductor', icon: '🎙️' },
  { level: 18, xpRequired: 14100, title: 'Concert Master', icon: '🎻' },
  { level: 19, xpRequired: 16200, title: 'Prodigy', icon: '🌟' },
  { level: 20, xpRequired: 18500, title: 'Orchestrator', icon: '🎺' },
  { level: 21, xpRequired: 21000, title: 'Music Sage', icon: '📖' },
  { level: 22, xpRequired: 23700, title: 'Melodist', icon: '🎤' },
  { level: 23, xpRequired: 26500, title: 'Symphonist', icon: '🎷' },
  { level: 24, xpRequired: 29400, title: 'Music Architect', icon: '🏛️' },
  { level: 25, xpRequired: 32500, title: 'Philharmonic', icon: '🌈' },
  { level: 26, xpRequired: 35800, title: 'Opus Creator', icon: '🖋️' },
  { level: 27, xpRequired: 39300, title: 'Concerto Star', icon: '💫' },
  { level: 28, xpRequired: 43000, title: 'Music Luminary', icon: '🔆' },
  { level: 29, xpRequired: 46900, title: 'Grand Virtuoso', icon: '🎭' },
  { level: 30, xpRequired: 51000, title: 'Transcendent', icon: '🏅' }
];

/** Maximum static level before prestige tiers begin */
export const MAX_STATIC_LEVEL = 30;

/** XP required for each prestige tier beyond level 30 */
export const PRESTIGE_XP_PER_TIER = 3000;

/** XP threshold at which prestige tiers begin (level 30 xpRequired) */
export const PRESTIGE_BASE_XP = XP_LEVELS[XP_LEVELS.length - 1].xpRequired; // 51000

/**
 * Calculate current level based on total XP
 * @param {number} totalXp - Student's total XP
 * @returns {Object} Level object with level, title, icon, isPrestige, prestigeTier
 */
export const calculateLevel = (totalXp) => {
  // Check for prestige tiers (beyond level 30)
  if (totalXp >= PRESTIGE_BASE_XP) {
    const xpBeyondMax = totalXp - PRESTIGE_BASE_XP;
    const prestigeTier = Math.floor(xpBeyondMax / PRESTIGE_XP_PER_TIER);

    if (prestigeTier > 0) {
      return {
        level: MAX_STATIC_LEVEL + prestigeTier,
        xpRequired: PRESTIGE_BASE_XP + (prestigeTier * PRESTIGE_XP_PER_TIER),
        title: `Maestro ${prestigeTier}`,
        icon: '👑',
        isPrestige: true,
        prestigeTier
      };
    }

    // At level 30 but not yet into prestige tier 1
    return { ...XP_LEVELS[XP_LEVELS.length - 1], isPrestige: false, prestigeTier: 0 };
  }

  // Find the highest static level the student has reached
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= XP_LEVELS[i].xpRequired) {
      return { ...XP_LEVELS[i], isPrestige: false, prestigeTier: 0 };
    }
  }
  return { ...XP_LEVELS[0], isPrestige: false, prestigeTier: 0 }; // Default to level 1
};

/**
 * Calculate XP required for next level
 * @param {number} currentLevel - Current level number
 * @returns {number} XP required for next level, or PRESTIGE_XP_PER_TIER for prestige levels
 */
export const getNextLevelXP = (currentLevel) => {
  if (currentLevel >= MAX_STATIC_LEVEL) return PRESTIGE_XP_PER_TIER;
  return XP_LEVELS[currentLevel].xpRequired;
};

/**
 * Calculate progress to next level
 * @param {number} totalXp - Student's total XP
 * @returns {Object} Object with current level, next level XP, progress percentage, and isPrestige
 */
export const getLevelProgress = (totalXp) => {
  const currentLevelData = calculateLevel(totalXp);
  const currentLevel = currentLevelData.level;

  // Prestige tier progress (level 31+)
  if (currentLevelData.isPrestige) {
    const tierStartXP = PRESTIGE_BASE_XP + (currentLevelData.prestigeTier * PRESTIGE_XP_PER_TIER);
    const xpInCurrentLevel = totalXp - tierStartXP;
    const xpNeededForNext = PRESTIGE_XP_PER_TIER - xpInCurrentLevel;
    const progressPercentage = Math.floor((xpInCurrentLevel / PRESTIGE_XP_PER_TIER) * 100);

    return {
      currentLevel: currentLevelData,
      nextLevelXP: PRESTIGE_XP_PER_TIER,
      xpInCurrentLevel,
      xpNeededForNext,
      progressPercentage,
      isPrestige: true
    };
  }

  // Level 30 (not yet prestige) — progress toward first prestige tier
  if (currentLevel >= MAX_STATIC_LEVEL) {
    const currentLevelXP = PRESTIGE_BASE_XP;
    const nextTierXP = PRESTIGE_BASE_XP + PRESTIGE_XP_PER_TIER;
    const xpInCurrentLevel = totalXp - currentLevelXP;
    const xpNeededForNext = nextTierXP - totalXp;
    const progressPercentage = Math.floor((xpInCurrentLevel / PRESTIGE_XP_PER_TIER) * 100);

    return {
      currentLevel: currentLevelData,
      nextLevelXP: nextTierXP,
      xpInCurrentLevel,
      xpNeededForNext,
      progressPercentage,
      isPrestige: false
    };
  }

  // Normal levels 1-29
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
    progressPercentage,
    isPrestige: false
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

  // Apply comeback multiplier as final step (default 1 = no change, backward compatible)
  totalXP = totalXP * (bonuses.comebackMultiplier || 1);

  return totalXP;
};

/**
 * Award XP to a student using the database function
 * @param {string} studentId - Student UUID
 * @param {number} xpAmount - Amount of XP to award
 * @returns {Promise<Object>} Result with new total XP, level, and leveledUp flag
 */
export const awardXP = async (studentId, xpAmount) => {
  // SECURITY: Verify user is awarding XP to themselves only
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  if (user.id !== studentId) {
    throw new Error('Unauthorized: You can only award XP to yourself');
  }

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
  // SECURITY: Verify user can access this student's data
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Students can only access their own XP data
  // Teachers would use a separate endpoint with relationship verification
  if (user.id !== studentId) {
    throw new Error("Unauthorized: Cannot access another student's XP data");
  }

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

  let totalXP = baseXP + bonusXP;

  // Apply comeback multiplier as final step (default 1 = no change, backward compatible)
  const comebackMultiplier = session.comebackMultiplier || 1;
  totalXP = totalXP * comebackMultiplier;

  return {
    stars,
    baseXP,
    bonusXP,
    bonuses,
    comebackMultiplier,
    totalXP
  };
};

/**
 * Calculate XP reward for free play (non-trail) game sessions.
 * Ensures free play always gives some XP to keep engagement, but less than trail nodes.
 *
 * Formula: base XP = 10 + Math.floor(scorePercentage * 0.4)
 *   - 100% score → 50 XP
 *   - 50% score  → 30 XP
 *   - 0% score   → 10 XP
 *
 * @param {number} scorePercentage - Score as percentage (0-100)
 * @param {number} comebackMultiplier - Comeback bonus multiplier (default 1)
 * @returns {number} XP to award
 */
export const calculateFreePlayXP = (scorePercentage, comebackMultiplier = 1) => {
  const clampedScore = Math.max(0, Math.min(100, scorePercentage));
  const baseXP = 10 + Math.floor(clampedScore * 0.4);
  return Math.floor(baseXP * comebackMultiplier);
};

/**
 * Get XP leaderboard (top students)
 * Anonymizes usernames for COPPA compliance - only the current user sees their own username
 * @param {number} limit - Number of students to return
 * @returns {Promise<Array>} Array of top students with anonymized data
 */
export const getXPLeaderboard = async (limit = 10) => {
  try {
    // Get current user to know which entry to show full details for
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    const { data, error } = await supabase
      .from('students')
      .select('id, username, avatar_url, total_xp, current_level')
      .order('total_xp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Anonymize other users' data - only show full details for current user
    // This is required for COPPA compliance in a children's app
    return data.map((student, index) => ({
      id: student.id,
      rank: index + 1,
      // Only show real username for the current user
      username: student.id === currentUserId ? student.username : `Player ${index + 1}`,
      // Only show avatar for current user, use null for others
      avatar_url: student.id === currentUserId ? student.avatar_url : null,
      total_xp: student.total_xp,
      current_level: student.current_level,
      levelData: calculateLevel(student.total_xp),
      isCurrentUser: student.id === currentUserId
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

export default {
  XP_LEVELS,
  MAX_STATIC_LEVEL,
  PRESTIGE_XP_PER_TIER,
  PRESTIGE_BASE_XP,
  calculateLevel,
  getNextLevelXP,
  getLevelProgress,
  calculateNodeXP,
  calculateFreePlayXP,
  awardXP,
  getStudentXP,
  calculateSessionXP,
  getXPLeaderboard
};
