/**
 * Daily Goals Service
 *
 * Generates and tracks daily goals for student engagement
 */

import supabase from './supabase';
import { verifyStudentDataAccess } from './authorizationUtils';

// Goal type definitions
export const GOAL_TYPES = {
  COMPLETE_EXERCISES: 'complete_exercises',
  EARN_THREE_STARS: 'earn_three_stars',
  PRACTICE_NEW_NODE: 'practice_new_node',
  PERFECT_SCORE: 'perfect_score',
  MAINTAIN_STREAK: 'maintain_streak'
};

// Goal templates with target values
// Note: name and description are i18n keys, not actual text
// These will be translated in the UI layer using t('dailyGoals.goals.{type}.name')
const GOAL_TEMPLATES = [
  {
    id: GOAL_TYPES.COMPLETE_EXERCISES,
    nameKey: 'completeExercises',
    descriptionKey: 'completeExercises',
    icon: '✓',
    target: 5,
    checkProgress: (progress) => progress.exercisesCompleted || 0
  },
  {
    id: GOAL_TYPES.EARN_THREE_STARS,
    nameKey: 'earnThreeStars',
    descriptionKey: 'earnThreeStars',
    icon: '⭐',
    target: 1,
    checkProgress: (progress) => progress.threeStarsEarned || 0
  },
  {
    id: GOAL_TYPES.PRACTICE_NEW_NODE,
    nameKey: 'practiceNewNode',
    descriptionKey: 'practiceNewNode',
    icon: '🆕',
    target: 1,
    checkProgress: (progress) => progress.newNodesPracticed || 0
  },
  {
    id: GOAL_TYPES.PERFECT_SCORE,
    nameKey: 'perfectScore',
    descriptionKey: 'perfectScore',
    icon: '💯',
    target: 1,
    checkProgress: (progress) => progress.perfectScores || 0
  },
  {
    id: GOAL_TYPES.MAINTAIN_STREAK,
    nameKey: 'maintainStreak',
    descriptionKey: 'maintainStreak',
    icon: '🔥',
    target: 1,
    checkProgress: (progress) => progress.streakMaintained ? 1 : 0
  }
];

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get ISO timestamp range for today (local midnight to midnight)
 * Used for querying activity within the current calendar day
 */
const getTodayDateRange = () => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
    dateString: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  };
};

/**
 * Generate 3 random daily goals
 * @returns {Array} Array of 3 goal objects
 */
const generateDailyGoals = () => {
  // Always include maintain streak
  const goals = [GOAL_TEMPLATES.find(g => g.id === GOAL_TYPES.MAINTAIN_STREAK)];

  // Pick 2 random from the remaining goals
  const remaining = GOAL_TEMPLATES.filter(g => g.id !== GOAL_TYPES.MAINTAIN_STREAK);
  const shuffled = remaining.sort(() => Math.random() - 0.5);
  goals.push(...shuffled.slice(0, 2));

  return goals.map(goal => ({
    id: goal.id,
    nameKey: goal.nameKey,
    descriptionKey: goal.descriptionKey,
    icon: goal.icon,
    target: goal.target,
    progress: 0,
    completed: false
  }));
};

/**
 * Get or create today's goals for a student
 * @param {string} studentId - The student's ID
 * @returns {Promise<Object>} Goals object with goals array and progress
 */
export const getTodaysGoals = async (studentId) => {
  await verifyStudentDataAccess(studentId);
  try {
    const today = getTodayDate();

    // Try to get existing goals for today
    const { data: existingGoals, error: fetchError } = await supabase
      .from('student_daily_goals')
      .select('*')
      .eq('student_id', studentId)
      .eq('goal_date', today)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching daily goals:', fetchError);
      throw fetchError;
    }

    // If goals exist for today, return them
    if (existingGoals) {
      return {
        goals: existingGoals.goals,
        progress: existingGoals.completed_goals || []
      };
    }

    // Generate new goals for today
    const newGoals = generateDailyGoals();

    const { data: createdGoals, error: createError } = await supabase
      .from('student_daily_goals')
      .insert({
        student_id: studentId,
        goal_date: today,
        goals: newGoals,
        completed_goals: []
      })
      .select()
      .maybeSingle();

    if (createError) {
      console.error('Error creating daily goals:', createError);
      throw createError;
    }

    return {
      goals: createdGoals.goals,
      progress: []
    };
  } catch (error) {
    console.error('Error in getTodaysGoals:', error);
    throw error;
  }
};

/**
 * Update progress for daily goals
 * @param {string} studentId - The student's ID
 * @param {Object} progressUpdate - Progress data (exercisesCompleted, threeStarsEarned, etc.)
 * @returns {Promise<Object>} Updated goals
 */
export const updateDailyGoalsProgress = async (studentId, progressUpdate) => {
  await verifyStudentDataAccess(studentId);
  try {
    const today = getTodayDate();

    // Get today's goals
    const { data: goalsRecord, error: fetchError } = await supabase
      .from('student_daily_goals')
      .select('*')
      .eq('student_id', studentId)
      .eq('goal_date', today)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!goalsRecord) return null;

    // Update progress for each goal
    const updatedGoals = goalsRecord.goals.map(goal => {
      const template = GOAL_TEMPLATES.find(t => t.id === goal.id);
      if (!template) return goal;

      const currentProgress = template.checkProgress(progressUpdate);
      const isCompleted = currentProgress >= goal.target;

      return {
        ...goal,
        progress: currentProgress,
        completed: isCompleted
      };
    });

    // Update completed goals list
    const completedGoalIds = updatedGoals
      .filter(g => g.completed)
      .map(g => g.id);

    // Save updated goals
    const { data: updated, error: updateError } = await supabase
      .from('student_daily_goals')
      .update({
        goals: updatedGoals,
        completed_goals: completedGoalIds
      })
      .eq('student_id', studentId)
      .eq('goal_date', today)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;

    return {
      goals: updated.goals,
      progress: updated.completed_goals
    };
  } catch (error) {
    console.error('Error updating daily goals progress:', error);
    throw error;
  }
};

/**
 * Calculate current day's progress for goals
 * @param {string} studentId - The student's ID
 * @returns {Promise<Object>} Progress metrics
 */
export const calculateDailyProgress = async (studentId) => {
  await verifyStudentDataAccess(studentId);
  try {
    const { start, end, dateString } = getTodayDateRange();

    // Query scores created today using ISO timestamp range
    const { data: todaysScores, error: scoresError } = await supabase
      .from('students_score')
      .select('score, game_type, created_at')
      .eq('student_id', studentId)
      .gte('created_at', start)
      .lte('created_at', end);

    if (scoresError) {
      console.warn('Could not fetch scores:', scoresError);
    }

    // Query node progress for today
    const { data: todaysNodeProgress, error: progressError } = await supabase
      .from('student_skill_progress')
      .select('node_id, stars, exercises_completed, created_at, last_practiced')
      .eq('student_id', studentId)
      .gte('last_practiced', start)
      .lte('last_practiced', end);

    if (progressError) {
      console.warn('Could not fetch node progress:', progressError);
    }

    // Helper to extract local date string from timestamp
    const getLocalDateString = (timestamp) => {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // Calculate metrics
    const exercisesCompleted = (todaysScores?.length || 0) + (todaysNodeProgress?.length || 0);

    // Count 3-star achievements first created today
    const threeStarsEarned = (todaysNodeProgress || []).filter(p => {
      if (p.stars !== 3) return false;
      return getLocalDateString(p.created_at) === dateString;
    }).length;

    // New nodes practiced (created today OR first practice today)
    const newNodesPracticed = (todaysNodeProgress || []).filter(p => {
      const createdToday = getLocalDateString(p.created_at) === dateString;
      const firstPracticeToday = p.exercises_completed === 1 && getLocalDateString(p.last_practiced) === dateString;
      return createdToday || firstPracticeToday;
    }).length;

    // Perfect scores (100%)
    const perfectScores = (todaysScores || []).filter(s => s.score === 100).length;

    // Streak maintained if practiced today
    const streakMaintained = exercisesCompleted > 0 || (todaysNodeProgress?.length || 0) > 0;

    return {
      exercisesCompleted,
      threeStarsEarned,
      newNodesPracticed,
      perfectScores,
      streakMaintained
    };
  } catch (error) {
    console.error('Error calculating daily progress:', error);
    return {
      exercisesCompleted: 0,
      threeStarsEarned: 0,
      newNodesPracticed: 0,
      perfectScores: 0,
      streakMaintained: false
    };
  }
};

/**
 * Get goals with current progress
 * @param {string} studentId - The student's ID
 * @returns {Promise<Array>} Goals with progress
 */
export const getDailyGoalsWithProgress = async (studentId) => {
  await verifyStudentDataAccess(studentId);
  try {
    // Get today's goals
    const goalsData = await getTodaysGoals(studentId);

    // If no goals, return empty array
    if (!goalsData?.goals || goalsData.goals.length === 0) {
      return [];
    }

    // Calculate current progress (won't throw, returns defaults on error)
    const progress = await calculateDailyProgress(studentId);

    // Update progress in goals
    const goalsWithProgress = goalsData.goals.map(goal => {
      const template = GOAL_TEMPLATES.find(t => t.id === goal.id);
      if (!template) return { ...goal, progress: 0, completed: false };

      const currentProgress = template.checkProgress(progress);
      const isCompleted = currentProgress >= goal.target;

      return {
        ...goal,
        progress: currentProgress,
        completed: isCompleted
      };
    });

    return goalsWithProgress;
  } catch (error) {
    console.error('Error fetching goals with progress:', error);
    // Return empty array instead of throwing to prevent UI crash
    return [];
  }
};

export default {
  getTodaysGoals,
  updateDailyGoalsProgress,
  calculateDailyProgress,
  getDailyGoalsWithProgress
};
