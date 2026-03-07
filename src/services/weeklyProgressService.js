/**
 * Weekly Progress Service
 *
 * Queries 7-day rolling progress data for the weekly summary card.
 */

import supabase from './supabase';
import { verifyStudentDataAccess } from './authorizationUtils';

/**
 * Get weekly progress summary for a student (rolling 7 days).
 * @param {string} studentId - The student's UUID
 * @returns {Promise<{daysPracticed: number, nodesCompleted: number, exercisesCompleted: number, allSevenDays: boolean}>}
 */
export const getWeeklyProgress = async (studentId) => {
  await verifyStudentDataAccess(studentId);

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Query scores from the last 7 days (for daysPracticed + exercisesCompleted)
    const { data: scores, error: scoresError } = await supabase
      .from('students_score')
      .select('created_at')
      .eq('student_id', studentId)
      .gte('created_at', sevenDaysAgoISO);

    if (scoresError) throw scoresError;

    // Count distinct local dates for daysPracticed
    const uniqueDates = new Set(
      (scores || []).map((s) => new Date(s.created_at).toLocaleDateString())
    );
    const daysPracticed = uniqueDates.size;

    // Count exercises completed this week
    const exercisesCompleted = (scores || []).length;

    // Query skill progress for nodes completed this week
    const { data: skillProgress, error: skillError } = await supabase
      .from('student_skill_progress')
      .select('node_id, stars, last_practiced')
      .eq('student_id', studentId)
      .gte('last_practiced', sevenDaysAgoISO)
      .gt('stars', 0);

    if (skillError) throw skillError;

    // Count unique completed nodes
    const uniqueNodes = new Set((skillProgress || []).map((p) => p.node_id));
    const nodesCompleted = uniqueNodes.size;

    return {
      daysPracticed,
      nodesCompleted,
      exercisesCompleted,
      allSevenDays: daysPracticed >= 7,
    };
  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    throw error;
  }
};
