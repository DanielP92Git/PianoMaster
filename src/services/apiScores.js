import supabase from "./supabase";

export async function getStudentScores(studentId) {
  try {
    const { data: scores, error: scoresError } = await supabase
      .from("students_score")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    const { data: totalScore, error: totalScoreError } = await supabase
      .from("students_total_score")
      .select("total_score")
      .eq("student_id", studentId)
      .single();

    if (scoresError) throw scoresError;
    if (totalScoreError) throw totalScoreError;
    if (scoresError) console.error("Error fetching asdad scores:", scoresError);
    if (totalScoreError)
      console.error("Error fetching total score:", totalScoreError);

    return {
      scores,
      totalScore: totalScore?.total_score ?? 0,
    };
  } catch (error) {
    // console.error("Error fetching scores:", error);
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

    // Get updated total score
    const { data: totalScoreData, error: totalScoreError } = await supabase
      .from("students_total_score")
      .select("total_score")
      .eq("student_id", studentId)
      .single();

    if (totalScoreError) throw totalScoreError;

    const currentTotalScore = totalScoreData?.total_score || 0;
    const updatedTotalScore = currentTotalScore + score;

    const { error: updateTotalScoreError } = await supabase
      .from("students_total_score")
      .update({ total_score: updatedTotalScore })
      .eq("student_id", studentId);

    if (updateTotalScoreError) {
      console.error("Error updating total score:", updateTotalScoreError);
      throw updateTotalScoreError;
    }

    return {
      newScore: scoreData,
      totalScore: updatedTotalScore,
    };
  } catch (error) {
    console.error("Error updating score:", error);
    throw new Error("Failed to update score");
  }
}
