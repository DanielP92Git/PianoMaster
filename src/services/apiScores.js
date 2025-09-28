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
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no records

    if (scoresError) throw scoresError;

    // Handle case where student doesn't have a total score record yet
    if (totalScoreError && totalScoreError.code !== "PGRST116") {
      throw totalScoreError;
    }

    return {
      scores: scores || [],
      totalScore: totalScore?.total_score ?? 0,
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

    // Handle total score update with retry logic to prevent 409 conflicts
    let retryCount = 0;
    const maxRetries = 3;
    let updatedTotalScore;

    while (retryCount < maxRetries) {
      try {
        // Get current total score
        const { data: currentData, error: fetchError } = await supabase
          .from("students_total_score")
          .select("total_score")
          .eq("student_id", studentId)
          .maybeSingle();

        if (fetchError && fetchError.code !== "PGRST116") {
          throw fetchError;
        }

        const currentTotal = currentData?.total_score || 0;
        const newTotal = currentTotal + score;

        // Use UPSERT to handle race conditions
        const { data: upsertData, error: upsertError } = await supabase
          .from("students_total_score")
          .upsert({
            student_id: studentId,
            total_score: newTotal,
          })
          .select("total_score")
          .single();

        if (upsertError) {
          // If it's a conflict error, retry
          if (
            upsertError.code === "23505" ||
            upsertError.message?.includes("409")
          ) {
            retryCount++;
            if (retryCount < maxRetries) {
              // Wait a bit before retrying to reduce contention
              await new Promise((resolve) =>
                setTimeout(resolve, 100 * retryCount)
              );
              continue;
            }
          }
          throw upsertError;
        }

        updatedTotalScore = upsertData.total_score;
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error("Failed to update total score after retries:", error);
          throw error;
        }
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 100 * retryCount));
      }
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
