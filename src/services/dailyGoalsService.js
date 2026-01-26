/**
 * Daily Goals Service
 *
 * Generates and tracks daily goals for student engagement
 */

import supabase from './supabase';

// Goal type definitions
export const GOAL_TYPES = {
  COMPLETE_EXERCISES: 'complete_exercises',
  EARN_THREE_STARS: 'earn_three_stars',
  PRACTICE_NEW_NODE: 'practice_new_node',
  PERFECT_SCORE: 'perfect_score',
  MAINTAIN_STREAK: 'maintain_streak'
};

// Goal templates with target values
const GOAL_TEMPLATES = [
  {
    id: GOAL_TYPES.COMPLETE_EXERCISES,
    name: 'Complete Exercises',
    description: 'Complete {{target}} exercises today',
    icon: '✓',
    target: 5,
    checkProgress: (progress) => progress.exercisesCompleted || 0
  },
  {
    id: GOAL_TYPES.EARN_THREE_STARS,
    name: 'Perfect Performance',
    description: 'Earn 3 stars on any node',
    icon: '⭐',
    target: 1,
    checkProgress: (progress) => progress.threeStarsEarned || 0
  },
  {
    id: GOAL_TYPES.PRACTICE_NEW_NODE,
    name: 'Try Something New',
    description: 'Practice a new trail node',
    icon: '🆕',
    target: 1,
    checkProgress: (progress) => progress.newNodesPracticed || 0
  },
  {
    id: GOAL_TYPES.PERFECT_SCORE,
    name: 'Flawless Victory',
    description: 'Get a perfect score (100%)',
    icon: '💯',
    target: 1,
    checkProgress: (progress) => progress.perfectScores || 0
  },
  {
    id: GOAL_TYPES.MAINTAIN_STREAK,
    name: 'Keep the Streak',
    description: 'Maintain your daily practice streak',
    icon: '🔥',
    target: 1,
    checkProgress: (progress) => progress.streakMaintained ? 1 : 0
  }
];

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
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
    name: goal.name,
    description: goal.description.replace('{{target}}', goal.target),
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
    console.log('Generated new daily goals:', newGoals);

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

    console.log('Created daily goals in database:', createdGoals);

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
  try {
    const today = getTodayDate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    // Get today's scores to count exercises completed (using correct table name)
    let todaysScores = [];
    try {
      const { data, error } = await supabase
        .from('students_score')
        .select('score, game_type, created_at')
        .eq('student_id', studentId)
        .gte('created_at', today)
        .lt('created_at', tomorrowDate);

      if (!error) {
        todaysScores = data || [];
      }
    } catch (e) {
      console.warn('Could not fetch scores:', e);
    }

    // Get nodes that were practiced today (for 3-star and new node checks)
    let todaysNodeProgress = [];
    try {
      const { data, error } = await supabase
        .from('student_skill_progress')
        .select('node_id, stars, exercises_completed, created_at, last_practiced')
        .eq('student_id', studentId)
        .gte('last_practiced', today)
        .lt('last_practiced', tomorrowDate);

      if (!error) {
        todaysNodeProgress = data || [];
      }
    } catch (e) {
      console.warn('Could not fetch node progress:', e);
    }

    // Calculate metrics
    const exercisesCompleted = todaysScores.length + todaysNodeProgress.length;

    // Count 3-star achievements TODAY (nodes that were FIRST created today with 3 stars)
    // This ensures we only count NEW 3-star achievements, not re-practicing already-mastered nodes
    const threeStarsEarned = todaysNodeProgress.filter(p =>
      p.stars === 3 &&
      p.created_at?.split('T')[0] === today
    ).length;

    // New nodes practiced (created today OR first practice today)
    const newNodesPracticed = todaysNodeProgress.filter(p =>
      p.created_at?.split('T')[0] === today ||
      (p.exercises_completed === 1 && p.last_practiced?.split('T')[0] === today)
    ).length;

    // Perfect scores - count actual 100% scores from today's game sessions
    const perfectScores = todaysScores.filter(s => s.score === 100).length;

    // Streak maintained if they practiced today
    const streakMaintained = exercisesCompleted > 0 || todaysNodeProgress.length > 0;

    return {
      exercisesCompleted,
      threeStarsEarned,
      newNodesPracticed,
      perfectScores,
      streakMaintained
    };
  } catch (error) {
    console.error('Error calculating daily progress:', error);
    // Return default values instead of throwing
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
  try {
    console.log('getDailyGoalsWithProgress called for student:', studentId);

    // Get today's goals
    const goalsData = await getTodaysGoals(studentId);
    console.log('Goals data received:', goalsData);

    // If no goals, return empty array
    if (!goalsData?.goals || goalsData.goals.length === 0) {
      console.log('No goals found, returning empty array');
      return [];
    }

    // Calculate current progress (won't throw, returns defaults on error)
    const progress = await calculateDailyProgress(studentId);
    console.log('Daily progress calculated:', progress);

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

    console.log('Returning goals with progress:', goalsWithProgress);
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
