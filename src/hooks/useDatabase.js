import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  // Student operations
  createStudent,
  getStudentById,
  updateStudent,
  getAllStudents,
  getStudentsByLevel,

  // Avatar operations
  createAvatar,
  getAllAvatars,
  getAvatarById,
  updateAvatar,

  // Practice session operations
  createPracticeSession,
  getPracticeSessionsByStudentId,
  getPracticeSessionById,
  updatePracticeSession,
  deletePracticeSession,
  getPracticeSessionsByStatus,
  getRecentPracticeSessions,

  // Game operations
  createGame,
  getAllGames,
  getGameById,
  getGamesByType,
  updateGame,

  // Game category operations
  createGameCategory,
  getAllGameCategories,
  getGameCategoriesByType,
  getGameCategoriesByDifficulty,

  // Student score operations
  createStudentScore,
  getStudentScores,
  getStudentScoresByGame,
  getStudentScoresByGameType,
  getHighScores,

  // Streak operations
  getCurrentStreak,
  updateCurrentStreak,
  getHighestStreak,
  updateHighestStreak,
  getLastPracticedDate,
  updateLastPracticedDate,

  // Analytics
  getStudentStats,
  getOverallStats,
} from "../services/apiDatabase";

// ============================================
// STUDENT HOOKS
// ============================================

export function useStudent(studentId) {
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: () => getStudentById(studentId),
    enabled: !!studentId,
  });
}

export function useAllStudents() {
  return useQuery({
    queryKey: ["students", "all"],
    queryFn: getAllStudents,
  });
}

export function useStudentsByLevel(level) {
  return useQuery({
    queryKey: ["students", "level", level],
    queryFn: () => getStudentsByLevel(level),
    enabled: !!level,
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, updates }) => updateStudent(studentId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(["student", data.id], data);
      queryClient.invalidateQueries(["students"]);
    },
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: (data) => {
      queryClient.setQueryData(["student", data.id], data);
      queryClient.invalidateQueries(["students"]);
    },
  });
}

// ============================================
// AVATAR HOOKS
// ============================================

export function useAllAvatars() {
  return useQuery({
    queryKey: ["avatars", "all"],
    queryFn: getAllAvatars,
  });
}

export function useAvatar(avatarId) {
  return useQuery({
    queryKey: ["avatar", avatarId],
    queryFn: () => getAvatarById(avatarId),
    enabled: !!avatarId,
  });
}

export function useCreateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(["avatar", data.id], data);
      queryClient.invalidateQueries(["avatars"]);
    },
  });
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ avatarId, updates }) => updateAvatar(avatarId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(["avatar", data.id], data);
      queryClient.invalidateQueries(["avatars"]);
    },
  });
}

// ============================================
// PRACTICE SESSION HOOKS
// ============================================

export function useStudentPracticeSessions(studentId) {
  return useQuery({
    queryKey: ["practice-sessions", "student", studentId],
    queryFn: () => getPracticeSessionsByStudentId(studentId),
    enabled: !!studentId,
  });
}

export function usePracticeSession(sessionId) {
  return useQuery({
    queryKey: ["practice-session", sessionId],
    queryFn: () => getPracticeSessionById(sessionId),
    enabled: !!sessionId,
  });
}

export function usePracticeSessionsByStatus(status) {
  return useQuery({
    queryKey: ["practice-sessions", "status", status],
    queryFn: () => getPracticeSessionsByStatus(status),
    enabled: !!status,
  });
}

export function useRecentPracticeSessions(limit = 10) {
  return useQuery({
    queryKey: ["practice-sessions", "recent", limit],
    queryFn: () => getRecentPracticeSessions(limit),
  });
}

export function useCreatePracticeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPracticeSession,
    onSuccess: (data) => {
      queryClient.setQueryData(["practice-session", data.id], data);
      queryClient.invalidateQueries([
        "practice-sessions",
        "student",
        data.student_id,
      ]);
      queryClient.invalidateQueries(["stats", "student", data.student_id]);
      queryClient.invalidateQueries(["practice-sessions", "recent"]);
    },
  });
}

export function useUpdatePracticeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, updates }) =>
      updatePracticeSession(sessionId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(["practice-session", data.id], data);
      queryClient.invalidateQueries([
        "practice-sessions",
        "student",
        data.student_id,
      ]);
      queryClient.invalidateQueries(["practice-sessions", "status"]);
    },
  });
}

export function useDeletePracticeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePracticeSession,
    onSuccess: (_, sessionId) => {
      queryClient.removeQueries(["practice-session", sessionId]);
      queryClient.invalidateQueries(["practice-sessions"]);
    },
  });
}

// ============================================
// GAME HOOKS
// ============================================

export function useAllGames() {
  return useQuery({
    queryKey: ["games", "all"],
    queryFn: getAllGames,
  });
}

export function useGame(gameId) {
  return useQuery({
    queryKey: ["game", gameId],
    queryFn: () => getGameById(gameId),
    enabled: !!gameId,
  });
}

export function useGamesByType(type) {
  return useQuery({
    queryKey: ["games", "type", type],
    queryFn: () => getGamesByType(type),
    enabled: !!type,
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGame,
    onSuccess: (data) => {
      queryClient.setQueryData(["game", data.id], data);
      queryClient.invalidateQueries(["games"]);
    },
  });
}

export function useUpdateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, updates }) => updateGame(gameId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(["game", data.id], data);
      queryClient.invalidateQueries(["games"]);
    },
  });
}

// ============================================
// GAME CATEGORY HOOKS
// ============================================

export function useAllGameCategories() {
  return useQuery({
    queryKey: ["game-categories", "all"],
    queryFn: getAllGameCategories,
  });
}

export function useGameCategoriesByType(type) {
  return useQuery({
    queryKey: ["game-categories", "type", type],
    queryFn: () => getGameCategoriesByType(type),
    enabled: !!type,
  });
}

export function useGameCategoriesByDifficulty(difficulty) {
  return useQuery({
    queryKey: ["game-categories", "difficulty", difficulty],
    queryFn: () => getGameCategoriesByDifficulty(difficulty),
    enabled: !!difficulty,
  });
}

export function useCreateGameCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGameCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(["game-categories"]);
    },
  });
}

// ============================================
// STUDENT SCORE HOOKS
// ============================================

export function useStudentScores(studentId) {
  return useQuery({
    queryKey: ["student-scores", studentId],
    queryFn: () => getStudentScores(studentId),
    enabled: !!studentId,
  });
}

export function useStudentScoresByGame(studentId, gameId) {
  return useQuery({
    queryKey: ["student-scores", studentId, "game", gameId],
    queryFn: () => getStudentScoresByGame(studentId, gameId),
    enabled: !!studentId && !!gameId,
  });
}

export function useStudentScoresByGameType(studentId, gameType) {
  return useQuery({
    queryKey: ["student-scores", studentId, "game-type", gameType],
    queryFn: () => getStudentScoresByGameType(studentId, gameType),
    enabled: !!studentId && !!gameType,
  });
}

export function useHighScores(gameId, limit = 10) {
  return useQuery({
    queryKey: ["high-scores", gameId, limit],
    queryFn: () => getHighScores(gameId, limit),
    enabled: !!gameId,
  });
}

export function useCreateStudentScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudentScore,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["student-scores", data.student_id]);
      queryClient.invalidateQueries(["high-scores", data.game_id]);
      queryClient.invalidateQueries(["top-students"]);
      queryClient.invalidateQueries(["stats", "student", data.student_id]);
      // Invalidate points-related queries to keep avatars shop in sync
      queryClient.invalidateQueries(["point-balance", data.student_id]);
      queryClient.invalidateQueries(["total-points", data.student_id]);
      queryClient.invalidateQueries(["gamesPlayed"]); // For unlock requirements
    },
  });
}

// ============================================
// STUDENT TOTAL SCORE HOOKS
// ============================================

// ============================================
// STREAK HOOKS
// ============================================

export function useCurrentStreak(studentId) {
  return useQuery({
    queryKey: ["current-streak", studentId],
    queryFn: () => getCurrentStreak(studentId),
    enabled: !!studentId,
  });
}

export function useHighestStreak(studentId) {
  return useQuery({
    queryKey: ["highest-streak", studentId],
    queryFn: () => getHighestStreak(studentId),
    enabled: !!studentId,
  });
}

export function useLastPracticedDate(studentId) {
  return useQuery({
    queryKey: ["last-practiced", studentId],
    queryFn: () => getLastPracticedDate(studentId),
    enabled: !!studentId,
    retry: 1, // Only retry once to prevent spamming failed requests
    retryDelay: 5000, // Wait 5 seconds before retry
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateCurrentStreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, streakCount }) =>
      updateCurrentStreak(studentId, streakCount),
    onSuccess: (data) => {
      queryClient.setQueryData(["current-streak", data.student_id], data);
      queryClient.invalidateQueries(["stats", "student", data.student_id]);
    },
  });
}

export function useUpdateHighestStreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, streakCount }) =>
      updateHighestStreak(studentId, streakCount),
    onSuccess: (data) => {
      queryClient.setQueryData(["highest-streak", data.student_id], data);
      queryClient.invalidateQueries(["stats", "student", data.student_id]);
    },
  });
}

export function useUpdateLastPracticedDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLastPracticedDate,
    onSuccess: (data) => {
      queryClient.setQueryData(["last-practiced", data.student_id], data);
      queryClient.invalidateQueries(["stats", "student", data.student_id]);
    },
  });
}

// ============================================
// ANALYTICS HOOKS
// ============================================

export function useStudentStats(studentId) {
  return useQuery({
    queryKey: ["stats", "student", studentId],
    queryFn: () => getStudentStats(studentId),
    enabled: !!studentId,
  });
}

export function useOverallStats() {
  return useQuery({
    queryKey: ["stats", "overall"],
    queryFn: getOverallStats,
  });
}
