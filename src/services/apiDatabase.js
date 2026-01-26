import supabase from "./supabase";

// ============================================
// AUTHORIZATION HELPER
// ============================================

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

// ============================================
// STUDENTS TABLE OPERATIONS
// ============================================

export async function createStudent(studentData) {
  const { data, error } = await supabase
    .from("students")
    .insert([studentData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getStudentById(studentId) {
  await verifyStudentDataAccess(studentId);

  const { data, error } = await supabase
    .from("students")
    .select(
      `
      *,
      avatar:avatars(*)
    `
    )
    .eq("id", studentId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateStudent(studentId, updates) {
  const { data, error } = await supabase
    .from("students")
    .update(updates)
    .eq("id", studentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllStudents() {
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      *,
      avatar:avatars(*)
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getStudentsByLevel(level) {
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      *,
      avatar:avatars(*)
    `
    )
    .eq("level", level);

  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// AVATARS TABLE OPERATIONS
// ============================================

export async function createAvatar(avatarData) {
  const { data, error } = await supabase
    .from("avatars")
    .insert([avatarData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllAvatars() {
  const { data, error } = await supabase
    .from("avatars")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

export async function getAvatarById(avatarId) {
  const { data, error } = await supabase
    .from("avatars")
    .select("*")
    .eq("id", avatarId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateAvatar(avatarId, updates) {
  const { data, error } = await supabase
    .from("avatars")
    .update(updates)
    .eq("id", avatarId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// PRACTICE SESSIONS TABLE OPERATIONS
// ============================================

export async function createPracticeSession(sessionData) {
  const { data, error } = await supabase
    .from("practice_sessions")
    .insert([sessionData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getPracticeSessionsByStudentId(studentId) {
  await verifyStudentDataAccess(studentId);

  const { data, error } = await supabase
    .from("practice_sessions")
    .select(
      `
      *,
      student:students(*)
    `
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getPracticeSessionById(sessionId) {
  const { data, error } = await supabase
    .from("practice_sessions")
    .select(
      `
      *,
      student:students(*)
    `
    )
    .eq("id", sessionId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePracticeSession(sessionId, updates) {
  const { data, error } = await supabase
    .from("practice_sessions")
    .update(updates)
    .eq("id", sessionId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deletePracticeSession(sessionId) {
  const { error } = await supabase
    .from("practice_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
}

export async function getPracticeSessionsByStatus(status) {
  const { data, error } = await supabase
    .from("practice_sessions")
    .select(
      `
      *,
      student:students(*)
    `
    )
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getRecentPracticeSessions(limit = 10) {
  const { data, error } = await supabase
    .from("practice_sessions")
    .select(
      `
      *,
      student:students(*)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// GAMES TABLE OPERATIONS
// ============================================

export async function createGame(gameData) {
  const { data, error } = await supabase
    .from("games")
    .insert([gameData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllGames() {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

export async function getGameById(gameId) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getGamesByType(type) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("type", type)
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

export async function updateGame(gameId, updates) {
  const { data, error } = await supabase
    .from("games")
    .update(updates)
    .eq("id", gameId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// GAME CATEGORIES TABLE OPERATIONS
// ============================================

export async function createGameCategory(categoryData) {
  const { data, error } = await supabase
    .from("games_categories")
    .insert([categoryData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllGameCategories() {
  const { data, error } = await supabase
    .from("games_categories")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

export async function getGameCategoriesByType(type) {
  const { data, error } = await supabase
    .from("games_categories")
    .select("*")
    .eq("type", type)
    .order("difficulty", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getGameCategoriesByDifficulty(difficulty) {
  const { data, error } = await supabase
    .from("games_categories")
    .select("*")
    .eq("difficulty", difficulty)
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// STUDENT SCORES TABLE OPERATIONS
// ============================================

export async function createStudentScore(scoreData) {
  const { data, error } = await supabase
    .from("students_score")
    .insert([scoreData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getStudentScores(studentId) {
  await verifyStudentDataAccess(studentId);

  const { data, error } = await supabase
    .from("students_score")
    .select(
      `
      *,
      student:students(*),
      game:games(*)
    `
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getStudentScoreStats(studentId) {
  await verifyStudentDataAccess(studentId);

  const { data, error } = await supabase
    .from("students_score")
    .select("score, created_at, game_type")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPracticeSessionStats(studentId, limit = 200) {
  await verifyStudentDataAccess(studentId);

  const { data, error } = await supabase
    .from("practice_sessions")
    .select(
      "analysis_score, duration, notes_played, unique_notes, submitted_at"
    )
    .eq("student_id", studentId)
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getStudentScoreValues(studentId) {
  const pageSize = 1000;
  let from = 0;
  let to = pageSize - 1;
  const allScores = [];

  while (true) {
    const { data, error } = await supabase
      .from("students_score")
      .select("score")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    if (!data || data.length === 0) {
      break;
    }

    allScores.push(...data);

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
    to += pageSize;
  }

  return allScores;
}

export async function getAchievementPointsTotal(studentId) {
  const { data, error } = await supabase
    .from("student_achievements")
    .select("points")
    .eq("student_id", studentId);

  if (error && error.code !== "PGRST116") throw error;
  if (!data || data.length === 0) return 0;

  return data.reduce((sum, achievement) => sum + (achievement?.points || 0), 0);
}

export async function getStudentScoresByGame(studentId, gameId) {
  const { data, error } = await supabase
    .from("students_score")
    .select(
      `
      *,
      student:students(*),
      game:games(*)
    `
    )
    .eq("student_id", studentId)
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getStudentScoresByGameType(studentId, gameType) {
  const { data, error } = await supabase
    .from("students_score")
    .select(
      `
      *,
      student:students(*),
      game:games(*)
    `
    )
    .eq("student_id", studentId)
    .eq("game_type", gameType)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getHighScores(gameId, limit = 10) {
  const { data, error } = await supabase
    .from("students_score")
    .select(
      `
      *,
      student:students(*),
      game:games(*)
    `
    )
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// STUDENT TOTAL SCORES TABLE OPERATIONS
// ============================================

// ============================================
// STREAK TRACKING OPERATIONS
// ============================================

export async function getCurrentStreak(studentId) {
  const { data, error } = await supabase
    .from("current_streak")
    .select("*")
    .eq("student_id", studentId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCurrentStreak(studentId, streakCount) {
  const { data, error } = await supabase
    .from("current_streak")
    .upsert([
      {
        student_id: studentId,
        streak_count: streakCount,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getHighestStreak(studentId) {
  const { data, error } = await supabase
    .from("highest_streak")
    .select("*")
    .eq("student_id", studentId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateHighestStreak(studentId, streakCount) {
  const { data, error } = await supabase
    .from("highest_streak")
    .upsert([
      {
        student_id: studentId,
        streak_count: streakCount,
        achieved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getLastPracticedDate(studentId) {
  const { data, error } = await supabase
    .from("last_practiced_date")
    .select("*")
    .eq("student_id", studentId)
    .single();

  // Silently handle table not found errors
  if (error) {
    console.warn("last_practiced_date query failed:", error.message);
    return null;
  }
  return data;
}

export async function updateLastPracticedDate(studentId) {
  const { data, error } = await supabase
    .from("last_practiced_date")
    .upsert(
      [
        {
          student_id: studentId,
          practiced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "student_id" }
    )
    .select()
    .single();

  if (error) {
    console.warn("last_practiced_date upsert failed:", error.message);
    return null;
  }
  return data;
}

// ============================================
// ANALYTICS & REPORTING QUERIES
// ============================================

export async function getStudentStats(studentId) {
  await verifyStudentDataAccess(studentId);

  // Get student's practice sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from("practice_sessions")
    .select("duration, analysis_score, notes_played, unique_notes, created_at")
    .eq("student_id", studentId);

  if (sessionsError) throw new Error(sessionsError.message);

  // Get student's scores
  const { data: scores, error: scoresError } = await supabase
    .from("students_score")
    .select("score, game_type, created_at")
    .eq("student_id", studentId);

  if (scoresError) throw new Error(scoresError.message);

  // Get streaks
  const currentStreak = await getCurrentStreak(studentId);
  const highestStreak = await getHighestStreak(studentId);

  // Calculate stats
  const totalSessions = sessions.length;
  const totalPracticeTime = sessions.reduce(
    (sum, session) => sum + (session.duration || 0),
    0
  );
  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + (score.score || 0), 0) /
        scores.length
      : 0;

  const totalNotesPlayed = sessions.reduce(
    (sum, session) => sum + (session.notes_played || 0),
    0
  );
  const averageAnalysisScore =
    sessions.length > 0
      ? sessions.reduce(
          (sum, session) => sum + (session.analysis_score || 0),
          0
        ) / sessions.length
      : 0;

  // Group scores by game type
  const gameTypeStats = scores.reduce((acc, score) => {
    if (!acc[score.game_type]) {
      acc[score.game_type] = { count: 0, totalScore: 0, averageScore: 0 };
    }
    acc[score.game_type].count++;
    acc[score.game_type].totalScore += score.score || 0;
    acc[score.game_type].averageScore =
      acc[score.game_type].totalScore / acc[score.game_type].count;
    return acc;
  }, {});

  return {
    totalSessions,
    totalPracticeTime,
    averageScore,
    totalNotesPlayed,
    averageAnalysisScore,
    currentStreak: currentStreak?.streak_count || 0,
    highestStreak: highestStreak?.streak_count || 0,
    gameTypeStats,
    sessions,
    scores,
  };
}

export async function getOverallStats() {
  // Get total number of students
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id");

  if (studentsError) throw new Error(studentsError.message);

  // Get total practice sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from("practice_sessions")
    .select("duration, notes_played");

  if (sessionsError) throw new Error(sessionsError.message);

  // Get total scores
  const { data: scores, error: scoresError } = await supabase
    .from("students_score")
    .select("score");

  if (scoresError) throw new Error(scoresError.message);

  const totalStudents = students.length;
  const totalSessions = sessions.length;
  const totalPracticeTime = sessions.reduce(
    (sum, session) => sum + (session.duration || 0),
    0
  );
  const totalNotesPlayed = sessions.reduce(
    (sum, session) => sum + (session.notes_played || 0),
    0
  );
  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + (score.score || 0), 0) /
        scores.length
      : 0;

  return {
    totalStudents,
    totalSessions,
    totalPracticeTime,
    totalNotesPlayed,
    averageScore,
  };
}
