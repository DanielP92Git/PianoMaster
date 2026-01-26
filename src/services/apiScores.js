import supabase from "./supabase";

/**
 * Verify the current user has access to the specified student's data.
 * - Students can only access their own data
 * - Teachers can access data of connected students
 * @param {string} studentId - The student ID to verify access for
 * @throws {Error} If not authenticated or unauthorized
 */
async function verifyStudentDataAccess(studentId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Students can access their own data
  if (user.id === studentId) {
    return true;
  }

  // Check if user is a teacher connected to this student
  const { data: connection, error } = await supabase
    .from("teacher_student_connections")
    .select("id")
    .eq("teacher_id", user.id)
    .eq("student_id", studentId)
    .eq("status", "accepted")
    .single();

  if (error || !connection) {
    throw new Error("Unauthorized: No access to this student's data");
  }

  return true;
}

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

export async function updateStudentScore(studentId, score, gameType) {
  try {
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
      newScore: scoreData,
    };
  } catch (error) {
    console.error("Error updating score:", error);
    throw new Error("Failed to update score");
  }
}
