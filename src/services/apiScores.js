import supabase from "./supabase";
import { checkRateLimit } from "./rateLimitService";
import { verifyStudentDataAccess } from "./authorizationUtils";

export async function getStudentScores(studentId) {
  await verifyStudentDataAccess(studentId);
  try {
    const { data: scores, error: scoresError } = await supabase
      .from("students_score")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (scoresError) throw scoresError;

    return {
      scores: scores || [],
      totalScore: 0, // Deprecated field, calculate dynamically from scores + achievements
    };
  } catch (error) {
    console.error("Error fetching scores:", error);
    throw new Error("Failed to fetch scores");
  }
}

/**
 * Update (insert) a student score
 * @param {string} studentId - The student's ID
 * @param {number} score - Score value
 * @param {string} gameType - Type of game played
 * @param {string} nodeId - Optional trail node ID (if playing from trail)
 * @param {Object} options - Optional configuration
 * @param {boolean} options.skipRateLimit - If true, skip rate limit check (for teachers)
 * @returns {Promise<Object>} Object with newScore, or { rateLimited: true, resetTime, newScore: null }
 */
export async function updateStudentScore(studentId, score, gameType, nodeId = null, options = {}) {
  try {
    // If nodeId is provided and not skipping rate limit, check rate limit
    // Note: Teacher check is done by the caller before calling this function
    if (nodeId && !options.skipRateLimit) {
      const rateLimitResult = await checkRateLimit(studentId, nodeId);
      if (!rateLimitResult.allowed) {
        return {
          rateLimited: true,
          resetTime: rateLimitResult.resetTime,
          newScore: null
        };
      }
    }

    // Insert new score
    const { data: scoreData, error: scoreError } = await supabase
      .from("students_score")
      .insert([
        {
          student_id: studentId,
          score: score,
          game_type: gameType,
        },
      ])
      .select()
      .single();

    if (scoreError) throw scoreError;

    return {
      rateLimited: false,
      newScore: scoreData,
    };
  } catch (error) {
    console.error("Error updating score:", error);
    throw new Error("Failed to update score");
  }
}
