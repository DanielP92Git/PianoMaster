/**
 * Skill Progress Service
 *
 * Handles CRUD operations for student skill trail progress
 */

import supabase from './supabase';
import { verifyStudentDataAccess } from './authorizationUtils';
import { getNodeById, isNodeUnlocked, getUnlockedNodes, EXERCISE_TYPES } from '../data/skillTrail';
import { checkRateLimit } from './rateLimitService';

/**
 * Calculate stars based on score percentage
 * @param {number} percentage - Score percentage (0-100)
 * @returns {number} Stars earned (0-3)
 */
const calculateStarsFromPercentage = (percentage) => {
  if (percentage >= 95) return 3;
  if (percentage >= 80) return 2;
  if (percentage >= 60) return 1;
  return 0;
};

/**
 * Get all skill progress for a student
 * @param {string} studentId - The student's ID
 * @returns {Promise<Array>} Array of progress records
 */
export const getStudentProgress = async (studentId) => {
  await verifyStudentDataAccess(studentId);
  try {
    const { data, error } = await supabase
      .from('student_skill_progress')
      .select('*')
      .eq('student_id', studentId)
      .order('last_practiced', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching student progress:', error);
    throw error;
  }
};

/**
 * Get progress for a specific node
 * @param {string} studentId - The student's ID
 * @param {string} nodeId - The node ID
 * @returns {Promise<Object|null>} Progress record or null
 */
export const getNodeProgress = async (studentId, nodeId) => {
  await verifyStudentDataAccess(studentId);
  try {
    const { data, error } = await supabase
      .from('student_skill_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('node_id', nodeId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return data || null;
  } catch (error) {
    console.error('Error fetching node progress:', error);
    throw error;
  }
};

/**
 * Update or create node progress
 * @param {string} studentId - The student's ID
 * @param {string} nodeId - The node ID
 * @param {number} stars - Number of stars earned (0-3)
 * @param {number} score - Score percentage achieved (0-100)
 * @param {Object} options - Optional configuration
 * @param {boolean} options.skipRateLimit - If true, skip rate limit check (for teachers)
 * @returns {Promise<Object>} Updated progress record, or { rateLimited: true, resetTime } if rate limited
 */
export const updateNodeProgress = async (studentId, nodeId, stars, score, options = {}) => {
  await verifyStudentDataAccess(studentId);
  try {
    // Check rate limit before saving (teachers bypass via options.skipRateLimit)
    // Note: Teacher check is done by the caller (VictoryScreen) before calling this function
    if (!options.skipRateLimit) {
      const rateLimitResult = await checkRateLimit(studentId, nodeId);
      if (!rateLimitResult.allowed) {
        return {
          rateLimited: true,
          resetTime: rateLimitResult.resetTime
        };
      }
    }

    // Get existing progress
    const existingProgress = await getNodeProgress(studentId, nodeId);

    const progressData = {
      student_id: studentId,
      node_id: nodeId,
      stars: stars,
      best_score: Math.round(score),
      exercises_completed: existingProgress
        ? existingProgress.exercises_completed + 1
        : 1,
      last_practiced: new Date().toISOString()
    };

    // If there's existing progress, only update if new score is better
    if (existingProgress) {
      const shouldUpdate =
        score > existingProgress.best_score ||
        stars > existingProgress.stars;

      if (shouldUpdate) {
        progressData.stars = Math.max(stars, existingProgress.stars);
        progressData.best_score = Math.round(Math.max(score, existingProgress.best_score));
      } else {
        progressData.stars = existingProgress.stars;
        progressData.best_score = existingProgress.best_score;
      }
    }

    // Upsert (update or insert)
    const { data, error } = await supabase
      .from('student_skill_progress')
      .upsert(progressData, {
        onConflict: 'student_id,node_id'
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating node progress:', error);
    throw error;
  }
};

/**
 * Get all completed node IDs for a student
 * @param {string} studentId - The student's ID
 * @returns {Promise<Array<string>>} Array of completed node IDs
 */
export const getCompletedNodeIds = async (studentId) => {
  await verifyStudentDataAccess(studentId);
  try {
    const progress = await getStudentProgress(studentId);
    // Consider a node completed if it has at least 1 star
    return progress
      .filter(p => p.stars > 0)
      .map(p => p.node_id);
  } catch (error) {
    console.error('Error fetching completed nodes:', error);
    throw error;
  }
};

/**
 * Get all available (unlocked) nodes for a student
 * @param {string} studentId - The student's ID
 * @returns {Promise<Array>} Array of available node objects
 */
export const getAvailableNodes = async (studentId) => {
  await verifyStudentDataAccess(studentId);
  try {
    const completedNodeIds = await getCompletedNodeIds(studentId);
    const unlockedNodes = getUnlockedNodes(completedNodeIds);

    // Get progress for each unlocked node
    const progress = await getStudentProgress(studentId);
    const progressMap = new Map(progress.map(p => [p.node_id, p]));

    return unlockedNodes.map(node => ({
      ...node,
      progress: progressMap.get(node.id) || null
    }));
  } catch (error) {
    console.error('Error fetching available nodes:', error);
    throw error;
  }
};

/**
 * Get the next recommended node for a student
 * Smart recommendation based on:
 * 1. In-progress nodes (started but not 3-starred)
 * 2. Newly unlocked nodes
 * 3. Starting nodes if nothing completed
 *
 * @param {string} studentId - The student's ID
 * @returns {Promise<Object|null>} Next recommended node or null
 */
export const getNextRecommendedNode = async (studentId) => {
  await verifyStudentDataAccess(studentId);
  try {
    const availableNodes = await getAvailableNodes(studentId);

    if (availableNodes.length === 0) {
      return null;
    }

    // Priority 1: Nodes in progress (started but < 3 stars)
    const inProgressNodes = availableNodes.filter(
      node => node.progress && node.progress.stars > 0 && node.progress.stars < 3
    );
    if (inProgressNodes.length > 0) {
      // Return most recently practiced
      return inProgressNodes.sort((a, b) =>
        new Date(b.progress.last_practiced) - new Date(a.progress.last_practiced)
      )[0];
    }

    // Priority 2: Available nodes not yet started
    const unstartedNodes = availableNodes.filter(node => !node.progress);
    if (unstartedNodes.length > 0) {
      // Return first by order in each category
      return unstartedNodes.sort((a, b) => a.order - b.order)[0];
    }

    // Priority 3: Completed nodes that could be improved (< 3 stars)
    const improvableNodes = availableNodes.filter(
      node => node.progress && node.progress.stars < 3
    );
    if (improvableNodes.length > 0) {
      return improvableNodes.sort((a, b) => a.order - b.order)[0];
    }

    // Fallback: Return first available node
    return availableNodes.sort((a, b) => a.order - b.order)[0];
  } catch (error) {
    console.error('Error getting next recommended node:', error);
    throw error;
  }
};

/**
 * Get student's trail statistics
 * @param {string} studentId - The student's ID
 * @returns {Promise<Object>} Statistics object
 */
export const getTrailStats = async (studentId) => {
  await verifyStudentDataAccess(studentId);
  try {
    const progress = await getStudentProgress(studentId);

    return {
      totalNodes: progress.length,
      nodesWithOneStars: progress.filter(p => p.stars === 1).length,
      nodesWithTwoStars: progress.filter(p => p.stars === 2).length,
      nodesWithThreeStars: progress.filter(p => p.stars === 3).length,
      totalStars: progress.reduce((sum, p) => sum + p.stars, 0),
      totalExercisesCompleted: progress.reduce((sum, p) => sum + p.exercises_completed, 0),
      lastPracticed: progress.length > 0
        ? progress.sort((a, b) =>
            new Date(b.last_practiced) - new Date(a.last_practiced)
          )[0].last_practiced
        : null
    };
  } catch (error) {
    console.error('Error fetching trail stats:', error);
    throw error;
  }
};

/**
 * Check if a specific node is unlocked for a student
 * @param {string} studentId - The student's ID
 * @param {string} nodeId - The node ID to check
 * @returns {Promise<boolean>} True if unlocked
 */
export const checkNodeUnlocked = async (studentId, nodeId) => {
  await verifyStudentDataAccess(studentId);
  try {
    const completedNodeIds = await getCompletedNodeIds(studentId);
    return isNodeUnlocked(nodeId, completedNodeIds);
  } catch (error) {
    console.error('Error checking node unlock status:', error);
    throw error;
  }
};

/**
 * Delete all progress for a student (for testing/reset purposes)
 * @param {string} studentId - The student's ID
 * @returns {Promise<void>}
 */
export const resetStudentProgress = async (studentId) => {
  await verifyStudentDataAccess(studentId);
  try {
    const { error } = await supabase
      .from('student_skill_progress')
      .delete()
      .eq('student_id', studentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error resetting student progress:', error);
    throw error;
  }
};

// ============================================
// EXERCISE-LEVEL PROGRESS FUNCTIONS
// ============================================

/**
 * Get exercise progress for a specific node
 * @param {string} studentId - The student's ID
 * @param {string} nodeId - The node ID
 * @returns {Promise<Array>} Array of exercise progress objects
 */
export const getExerciseProgress = async (studentId, nodeId) => {
  await verifyStudentDataAccess(studentId);
  try {
    const nodeProgress = await getNodeProgress(studentId, nodeId);
    if (!nodeProgress || !nodeProgress.exercise_progress) {
      return [];
    }
    return nodeProgress.exercise_progress;
  } catch (error) {
    console.error('Error fetching exercise progress:', error);
    throw error;
  }
};

/**
 * Get the index of the next uncompleted exercise in a node
 * @param {string} studentId - The student's ID
 * @param {string} nodeId - The node ID
 * @param {number} totalExercises - Total number of exercises in the node
 * @returns {Promise<number|null>} Index of next exercise (0-based), or null if all complete
 */
export const getNextExerciseIndex = async (studentId, nodeId, totalExercises) => {
  await verifyStudentDataAccess(studentId);
  try {
    const exerciseProgress = await getExerciseProgress(studentId, nodeId);

    // Build a set of completed exercise indices
    const completedIndices = new Set(
      exerciseProgress
        .filter(ep => ep.stars > 0)
        .map(ep => ep.index)
    );

    // Find the first uncompleted exercise
    for (let i = 0; i < totalExercises; i++) {
      if (!completedIndices.has(i)) {
        return i;
      }
    }

    // All exercises complete
    return null;
  } catch (error) {
    console.error('Error getting next exercise index:', error);
    throw error;
  }
};

/**
 * Update progress for a specific exercise within a node
 * @param {string} studentId - The student's ID
 * @param {string} nodeId - The node ID
 * @param {number} exerciseIndex - Index of the exercise (0-based)
 * @param {string} exerciseType - Type of exercise (e.g., 'note_recognition')
 * @param {number} stars - Stars earned for this exercise (0-3)
 * @param {number} score - Score percentage achieved (0-100)
 * @param {number} totalExercises - Total number of exercises in the node
 * @param {Object} options - Optional configuration
 * @param {boolean} options.skipRateLimit - If true, skip rate limit check (for teachers)
 * @returns {Promise<Object>} Updated progress record with node completion status, or { rateLimited: true, resetTime } if rate limited
 */
export const updateExerciseProgress = async (
  studentId,
  nodeId,
  exerciseIndex,
  exerciseType,
  stars,
  score,
  totalExercises,
  options = {}
) => {
  await verifyStudentDataAccess(studentId);
  try {
    // Check rate limit before saving (teachers bypass via options.skipRateLimit)
    // Note: Teacher check is done by the caller (VictoryScreen) before calling this function
    if (!options.skipRateLimit) {
      const rateLimitResult = await checkRateLimit(studentId, nodeId);
      if (!rateLimitResult.allowed) {
        return {
          rateLimited: true,
          resetTime: rateLimitResult.resetTime
        };
      }
    }

    // Get existing node progress
    let nodeProgress = await getNodeProgress(studentId, nodeId);
    let exerciseProgressArray = nodeProgress?.exercise_progress || [];

    // Find existing exercise entry
    const existingExerciseIdx = exerciseProgressArray.findIndex(
      ep => ep.index === exerciseIndex
    );

    const newExerciseEntry = {
      index: exerciseIndex,
      type: exerciseType,
      stars: stars,
      bestScore: Math.round(score),
      completedAt: new Date().toISOString()
    };

    if (existingExerciseIdx >= 0) {
      // Update existing - only if better
      const existing = exerciseProgressArray[existingExerciseIdx];
      if (score > existing.bestScore || stars > existing.stars) {
        newExerciseEntry.stars = Math.max(stars, existing.stars);
        newExerciseEntry.bestScore = Math.round(Math.max(score, existing.bestScore));
      } else {
        newExerciseEntry.stars = existing.stars;
        newExerciseEntry.bestScore = existing.bestScore;
      }
      exerciseProgressArray[existingExerciseIdx] = newExerciseEntry;
    } else {
      // Add new exercise entry
      exerciseProgressArray.push(newExerciseEntry);
    }

    // Sort by index for consistency
    exerciseProgressArray.sort((a, b) => a.index - b.index);

    // Calculate node-level stats
    const completedExercises = exerciseProgressArray.filter(ep => ep.stars > 0);
    const allExercisesComplete = completedExercises.length >= totalExercises;

    // Node stars = minimum of all completed exercise stars (only if ALL complete)
    let nodeStars = 0;
    let nodeBestScore = 0;

    if (allExercisesComplete) {
      nodeStars = Math.min(...completedExercises.map(ep => ep.stars));
      nodeBestScore = Math.round(Math.min(...completedExercises.map(ep => ep.bestScore)));
    } else if (completedExercises.length > 0) {
      // If not all complete, node is "in progress" (0 stars until all done)
      // But track the best score as the average so far
      nodeBestScore = Math.round(
        completedExercises.reduce((sum, ep) => sum + ep.bestScore, 0) / completedExercises.length
      );
    }

    const progressData = {
      student_id: studentId,
      node_id: nodeId,
      stars: nodeStars,
      best_score: nodeBestScore,
      exercises_completed: completedExercises.length,
      exercise_progress: exerciseProgressArray,
      last_practiced: new Date().toISOString()
    };

    // Upsert (update or insert)
    const { data, error } = await supabase
      .from('student_skill_progress')
      .upsert(progressData, {
        onConflict: 'student_id,node_id'
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    return {
      ...data,
      nodeComplete: allExercisesComplete,
      exercisesRemaining: totalExercises - completedExercises.length
    };
  } catch (error) {
    console.error('Error updating exercise progress:', error);
    throw error;
  }
};

/**
 * Check if a specific exercise is completed (has at least 1 star)
 * @param {string} studentId - The student's ID
 * @param {string} nodeId - The node ID
 * @param {number} exerciseIndex - Index of the exercise (0-based)
 * @returns {Promise<boolean>} True if exercise is completed
 */
export const isExerciseCompleted = async (studentId, nodeId, exerciseIndex) => {
  await verifyStudentDataAccess(studentId);
  try {
    const exerciseProgress = await getExerciseProgress(studentId, nodeId);
    const exercise = exerciseProgress.find(ep => ep.index === exerciseIndex);
    return exercise ? exercise.stars > 0 : false;
  } catch (error) {
    console.error('Error checking exercise completion:', error);
    throw error;
  }
};

/**
 * Get progress for an entire unit
 * @param {string} studentId - The student's ID
 * @param {number} unitNumber - The unit number
 * @param {string} category - The unit category (e.g., 'treble_clef')
 * @returns {Promise<Object>} Unit progress summary
 */
export const getUnitProgress = async (studentId, unitNumber, category) => {
  await verifyStudentDataAccess(studentId);
  try {
    const { getNodesInUnit } = await import('../data/skillTrail.js');
    const unitNodes = getNodesInUnit(unitNumber, category);

    // Get progress for all nodes in unit
    const progress = await getStudentProgress(studentId);
    const progressMap = new Map(progress.map(p => [p.node_id, p]));

    const unitProgress = unitNodes.map(node => ({
      nodeId: node.id,
      nodeName: node.name,
      stars: progressMap.get(node.id)?.stars || 0,
      bestScore: progressMap.get(node.id)?.best_score || 0,
      completed: (progressMap.get(node.id)?.stars || 0) > 0
    }));

    const totalStars = unitProgress.reduce((sum, n) => sum + n.stars, 0);
    const maxStars = unitNodes.length * 3;
    const completedNodes = unitProgress.filter(n => n.completed).length;

    return {
      unitNumber,
      category,
      nodes: unitProgress,
      totalStars,
      maxStars,
      completedNodes,
      totalNodes: unitNodes.length,
      isComplete: completedNodes === unitNodes.length
    };
  } catch (error) {
    console.error('Error fetching unit progress:', error);
    throw error;
  }
};

/**
 * Get the current unit for a student in a specific category
 * Based on their progress, returns the unit they're currently working on
 * @param {string} studentId - The student's ID
 * @param {string} category - The category (e.g., 'treble_clef')
 * @returns {Promise<number>} Current unit number
 */
export const getCurrentUnitForCategory = async (studentId, category) => {
  await verifyStudentDataAccess(studentId);
  try {
    const { getCurrentUnit } = await import('../data/skillTrail.js');
    const completedNodeIds = await getCompletedNodeIds(studentId);
    return getCurrentUnit(completedNodeIds, category);
  } catch (error) {
    console.error('Error getting current unit:', error);
    return 1; // Default to unit 1
  }
};

/**
 * Get next node in the learning path (for auto-progression)
 * Priority:
 * 1. Next node in current unit (sequential)
 * 2. Any newly unlocked node (e.g., after boss)
 * 3. Improvable nodes (< 3 stars)
 * @param {string} studentId - The student's ID
 * @param {string} currentNodeId - The node just completed
 * @returns {Promise<Object|null>} Next recommended node or null
 */
export const getNextNodeInPath = async (studentId, currentNodeId) => {
  await verifyStudentDataAccess(studentId);
  try {
    const { getNodeById, SKILL_NODES, isNodeUnlocked } = await import('../data/skillTrail.js');
    const currentNode = getNodeById(currentNodeId);
    if (!currentNode) return null;

    const completedNodeIds = await getCompletedNodeIds(studentId);
    const allProgress = await getStudentProgress(studentId);
    const progressMap = new Map(allProgress.map(p => [p.node_id, p]));

    // Priority 1: Next node in same unit (sequential orderInUnit)
    if (currentNode.unit) {
      const sameUnitNodes = SKILL_NODES.filter(n =>
        n.unit === currentNode.unit &&
        n.category === currentNode.category &&
        n.orderInUnit === currentNode.orderInUnit + 1
      );

      if (sameUnitNodes.length > 0) {
        const nextNode = sameUnitNodes[0];
        if (isNodeUnlocked(nextNode.id, completedNodeIds)) {
          return nextNode;
        }
      }
    }

    // Priority 2: Any newly unlocked node (likely boss or next unit start)
    const unlockedNodes = SKILL_NODES.filter(node =>
      !completedNodeIds.includes(node.id) &&
      isNodeUnlocked(node.id, completedNodeIds)
    );

    if (unlockedNodes.length > 0) {
      // Prefer nodes in same category, then lowest order
      const sameCategoryNodes = unlockedNodes.filter(n => n.category === currentNode.category);
      if (sameCategoryNodes.length > 0) {
        return sameCategoryNodes.sort((a, b) => a.order - b.order)[0];
      }
      return unlockedNodes.sort((a, b) => a.order - b.order)[0];
    }

    // Priority 3: Improvable nodes (< 3 stars)
    const improvableNodes = SKILL_NODES.filter(node => {
      const progress = progressMap.get(node.id);
      return progress && progress.stars < 3 && progress.stars > 0;
    });

    if (improvableNodes.length > 0) {
      // Prefer nodes in same category
      const sameCategoryNodes = improvableNodes.filter(n => n.category === currentNode.category);
      if (sameCategoryNodes.length > 0) {
        return sameCategoryNodes.sort((a, b) => a.order - b.order)[0];
      }
      return improvableNodes.sort((a, b) => a.order - b.order)[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting next node in path:', error);
    return null;
  }
};

/**
 * Get all units in a category with progress summary
 * @param {string} studentId - The student's ID
 * @param {string} category - The category
 * @returns {Promise<Array>} Array of unit summaries
 */
export const getUnitsInCategory = async (studentId, category) => {
  await verifyStudentDataAccess(studentId);
  try {
    const { getUnitsByCategory } = await import('../data/skillTrail.js');
    const units = getUnitsByCategory(category);

    const unitProgresses = await Promise.all(
      units.map(async (unit) => {
        const progress = await getUnitProgress(studentId, unit.order, category);
        return {
          ...unit,
          progress
        };
      })
    );

    return unitProgresses;
  } catch (error) {
    console.error('Error getting units in category:', error);
    throw error;
  }
};

export default {
  getStudentProgress,
  getNodeProgress,
  updateNodeProgress,
  getCompletedNodeIds,
  getAvailableNodes,
  getNextRecommendedNode,
  getTrailStats,
  checkNodeUnlocked,
  resetStudentProgress,
  // Exercise-level functions
  getExerciseProgress,
  getNextExerciseIndex,
  updateExerciseProgress,
  isExerciseCompleted,
  // Unit-level functions
  getUnitProgress,
  getCurrentUnitForCategory,
  getNextNodeInPath,
  getUnitsInCategory
};
