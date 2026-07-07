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
 * @param {string} options.existingScoreId - If provided, update this row's score in place (keyed by
 *   id, scoped to the student) instead of inserting a new one — e.g. a same-exercise "Try Again"
 *   retry improving on a prior attempt. Keeps one students_score row per exercise instance (rather
 *   than a duplicate that would inflate games-played / daily-goal counts). Requires the
 *   students_score UPDATE RLS policy (migration 20260707120000). If the row is gone at write time
 *   (0 rows matched), falls back to inserting a fresh row so the latest score isn't lost.
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

    // Retry path: a "Try Again" on the same pattern instance already has a saved row. Update it in
    // place so the improved score replaces the first attempt's, keeping one row per instance. Use a
    // plain array .select() (NOT .single()/.maybeSingle()): on a PATCH those send the pgrst.object
    // Accept header, so a 0-row match returns a raw HTTP 406 that the browser logs even though
    // postgrest-js swallows it. An array .select() returns HTTP 200 with [] instead — no 406 noise —
    // and lets us fall back to an insert if the row is genuinely gone (e.g. a trail/dev reset cleared
    // it) so the latest score isn't lost. The in-place update itself only works because of the
    // students_score UPDATE RLS policy (migration 20260707120000); without it the update matches 0
    // rows and every retry silently falls through to a duplicate insert. A plain update (unlike an
    // upsert) touches only the ownership-scoped UPDATE policy, so it works for all users — an
    // upsert's ON CONFLICT DO UPDATE would also re-check the subscription-gated INSERT policy.
    if (options.existingScoreId) {
      const { data: updated, error: updateError } = await supabase
        .from("students_score")
        .update({ score })
        .eq("id", options.existingScoreId)
        .eq("student_id", studentId)
        .select();

      if (updateError) throw updateError;
      if (updated && updated.length > 0) {
        return {
          rateLimited: false,
          newScore: updated[0],
        };
      }
      // else: no row matched (row gone) — fall through to the insert below.
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
