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
 * Update (insert or update) a student score
 * @param {string} studentId - The student's ID
 * @param {number} score - Score value
 * @param {string} gameType - Type of game played
 * @param {string} nodeId - Optional trail node ID (if playing from trail)
 * @param {Object} options - Optional configuration
 * @param {boolean} options.skipRateLimit - If true, skip rate limit check (for teachers)
 * @param {string} options.existingScoreId - If provided, upsert the score onto this row (keyed by
 *   its id) instead of inserting a new one — e.g. a same-exercise "Try Again" retry improving on a
 *   prior attempt. Keeps exactly one students_score row per exercise instance; if that row is gone
 *   at write time, the score is re-inserted at the same id rather than as a duplicate.
 * @returns {Promise<Object>} Object with newScore, or { rateLimited: true, resetTime, newScore: null }
 */
export async function updateStudentScore(
  studentId,
  score,
  gameType,
  nodeId = null,
  options = {}
) {
  try {
    // If nodeId is provided and not skipping rate limit, check rate limit
    // Note: Teacher check is done by the caller before calling this function
    if (nodeId && !options.skipRateLimit) {
      const rateLimitResult = await checkRateLimit(studentId, nodeId);
      if (!rateLimitResult.allowed) {
        return {
          rateLimited: true,
          resetTime: rateLimitResult.resetTime,
          newScore: null,
        };
      }
    }

    // Retry path: a "Try Again" on the same pattern instance already has a saved row. Upsert keyed
    // on that row's id so the improved score REPLACES the first attempt's in place — keeping exactly
    // one students_score row per instance (games-played and daily-goals both count rows, so a
    // duplicate would inflate them). If the row is gone at write time (e.g. a trail/dev reset cleared
    // it), the upsert re-inserts it at the SAME id rather than as a new row, so retries can't
    // proliferate duplicates. Upsert returns an array (Accept: application/json), so the write is
    // always HTTP 200 — unlike .update()...maybeSingle(), which on a PATCH still sends the
    // pgrst.object Accept header and surfaces a raw 406 in the browser (postgrest-js only rewrites
    // the JS-facing status, not the already-logged network response). RLS ("student_id =
    // auth.uid()") is the ground-truth scoping for both the update and insert branches of the upsert.
    if (options.existingScoreId) {
      const { data: upserted, error: upsertError } = await supabase
        .from("students_score")
        .upsert([
          {
            id: options.existingScoreId,
            student_id: studentId,
            score: score,
            game_type: gameType,
          },
        ])
        .select();

      if (upsertError) throw upsertError;

      return {
        rateLimited: false,
        newScore: upserted?.[0] ?? null,
      };
    }

    const { data: inserted, error: insertError } = await supabase
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

    if (insertError) throw insertError;

    return {
      rateLimited: false,
      newScore: inserted,
    };
  } catch (error) {
    console.error("Error updating score:", error);
    throw new Error("Failed to update score");
  }
}
