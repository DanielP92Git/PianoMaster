import supabase from "./supabase";
import { getStudentScores } from "./apiDatabase";
import { streakService } from "./streakService";

// Define all available achievements
const ACHIEVEMENTS = {
  FIRST_SESSION: {
    id: "first_session",
    title: "First Steps",
    description: "Complete your first practice session",
    icon: "🎯",
    category: "milestone",
    points: 50,
    condition: "sessions >= 1",
  },
  STREAK_3: {
    id: "streak_3",
    title: "Building Habits",
    description: "Maintain a 3-day practice streak",
    icon: "🔥",
    category: "streak",
    points: 100,
    condition: "streak >= 3",
  },
  STREAK_7: {
    id: "streak_7",
    title: "Weekly Warrior",
    description: "Practice for 7 days in a row",
    icon: "⭐",
    category: "streak",
    points: 200,
    condition: "streak >= 7",
  },
  STREAK_30: {
    id: "streak_30",
    title: "Monthly Master",
    description: "Achieve a 30-day practice streak",
    icon: "🏆",
    category: "streak",
    points: 500,
    condition: "streak >= 30",
  },
  PERFECT_SCORE: {
    id: "perfect_score",
    title: "Perfect Pitch",
    description: "Score 100% in a note recognition game",
    icon: "🎵",
    category: "performance",
    points: 150,
    condition: "perfect_game",
  },
  HIGH_SCORER: {
    id: "high_scorer",
    title: "High Scorer",
    description: "Earn 1000 total points",
    icon: "💎",
    category: "points",
    points: 250,
    condition: "total_points >= 1000",
  },
  NOTE_MASTER: {
    id: "note_master",
    title: "Note Recognition Master",
    description: "Answer 100 note recognition questions correctly",
    icon: "🎼",
    category: "skill",
    points: 300,
    condition: "correct_notes >= 100",
  },
  PRACTICE_TIME_10: {
    id: "practice_time_10",
    title: "Dedicated Learner",
    description: "Practice for 10 hours total",
    icon: "⏰",
    category: "time",
    points: 200,
    condition: "practice_hours >= 10",
  },
  CONSISTENT_PLAYER: {
    id: "consistent_player",
    title: "Consistent Player",
    description: "Complete 20 practice sessions",
    icon: "🎮",
    category: "milestone",
    points: 250,
    condition: "sessions >= 20",
  },
  ACCURACY_MASTER: {
    id: "accuracy_master",
    title: "Accuracy Master",
    description: "Maintain 90% average accuracy over 10 sessions",
    icon: "🎯",
    category: "performance",
    points: 400,
    condition: "avg_accuracy_10 >= 0.9",
  },
};

// Achievement service class
class AchievementService {
  constructor() {
    this.achievements = ACHIEVEMENTS;
  }

  // Get all available achievements
  getAllAchievements() {
    return Object.values(this.achievements);
  }

  // Get achievements by category
  getAchievementsByCategory(category) {
    return Object.values(this.achievements).filter(
      (achievement) => achievement.category === category
    );
  }

  // Get user's earned achievements from database
  async getEarnedAchievements(studentId) {
    try {
      const { data, error } = await supabase
        .from("student_achievements")
        .select("*")
        .eq("student_id", studentId)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching earned achievements:", error);
      return [];
    }
  }

  // Get recent achievements (last 5)
  async getRecentAchievements(studentId, limit = 5) {
    try {
      const earnedAchievements = await this.getEarnedAchievements(studentId);
      return earnedAchievements.slice(0, limit);
    } catch (error) {
      console.error("Error fetching recent achievements:", error);
      return [];
    }
  }

  // Check if user has earned a specific achievement
  async hasEarnedAchievement(studentId, achievementId) {
    try {
      const { data, error } = await supabase
        .from("student_achievements")
        .select("id")
        .eq("student_id", studentId)
        .eq("achievement_id", achievementId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    } catch (error) {
      console.error("Error checking achievement:", error);
      return false;
    }
  }

  // Award achievement to user
  async awardAchievement(studentId, achievementId) {
    try {
      // Check if already earned
      const hasEarned = await this.hasEarnedAchievement(
        studentId,
        achievementId
      );
      if (hasEarned) return null;

      const achievement = this.achievements[achievementId.toUpperCase()];
      if (!achievement) throw new Error("Achievement not found");

      const { data, error } = await supabase
        .from("student_achievements")
        .insert([
          {
            student_id: studentId,
            achievement_id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            points: achievement.points,
            category: achievement.category,
            earned_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update user's total points
      await this.updateUserPoints(studentId, achievement.points);

      return data;
    } catch (error) {
      console.error("Error awarding achievement:", error);
      return null;
    }
  }

  // Update user's total points
  async updateUserPoints(studentId, pointsToAdd) {
    try {
      // Get current points
      const { data: currentData, error: fetchError } = await supabase
        .from("student_profiles")
        .select("achievement_points")
        .eq("student_id", studentId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      const currentPoints = currentData?.achievement_points || 0;
      const newPoints = currentPoints + pointsToAdd;

      // Update points
      const { error: updateError } = await supabase
        .from("student_profiles")
        .upsert([
          {
            student_id: studentId,
            achievement_points: newPoints,
            updated_at: new Date().toISOString(),
          },
        ]);

      if (updateError) throw updateError;
      return newPoints;
    } catch (error) {
      console.error("Error updating user points:", error);
      return null;
    }
  }

  // Check for new achievements based on user progress
  async checkForNewAchievements(studentId) {
    try {
      const newAchievements = [];

      // Get user data
      const [scores, streak, earnedAchievements] = await Promise.all([
        getStudentScores(studentId),
        streakService.getStreak(),
        this.getEarnedAchievements(studentId),
      ]);

      const earnedIds = earnedAchievements.map((a) => a.achievement_id);

      // Calculate user stats
      const stats = this.calculateUserStats(scores);
      stats.streak = streak;

      // Check each achievement
      for (const achievement of Object.values(this.achievements)) {
        if (earnedIds.includes(achievement.id)) continue;

        const earned = this.checkAchievementCondition(achievement, stats);
        if (earned) {
          const awardedAchievement = await this.awardAchievement(
            studentId,
            achievement.id
          );
          if (awardedAchievement) {
            newAchievements.push(awardedAchievement);
          }
        }
      }

      return newAchievements;
    } catch (error) {
      console.error("Error checking for new achievements:", error);
      return [];
    }
  }

  // Calculate user statistics from scores
  calculateUserStats(scores) {
    if (!scores || !Array.isArray(scores)) {
      return {
        sessions: 0,
        total_points: 0,
        correct_notes: 0,
        perfect_games: 0,
        practice_hours: 0,
        avg_accuracy_10: 0,
      };
    }

    const stats = {
      sessions: scores.length,
      total_points: scores.reduce((sum, score) => sum + (score.score || 0), 0),
      correct_notes: scores.reduce(
        (sum, score) => sum + (score.notes_played || 0),
        0
      ),
      perfect_games: scores.filter(
        (score) => (score.analysis_score || 0) >= 100
      ).length,
      practice_hours:
        scores.reduce((sum, score) => sum + (score.duration || 0), 0) / 3600,
      avg_accuracy_10: 0,
    };

    // Calculate average accuracy for last 10 sessions
    const recent10 = scores.slice(0, 10);
    if (recent10.length > 0) {
      const totalAccuracy = recent10.reduce(
        (sum, score) => sum + (score.analysis_score || 0),
        0
      );
      stats.avg_accuracy_10 = totalAccuracy / (recent10.length * 100);
    }

    return stats;
  }

  // Check if achievement condition is met
  checkAchievementCondition(achievement, stats) {
    const condition = achievement.condition;

    // Parse condition string and evaluate
    if (condition.includes("sessions >= ")) {
      const required = parseInt(condition.split("sessions >= ")[1]);
      return stats.sessions >= required;
    }

    if (condition.includes("streak >= ")) {
      const required = parseInt(condition.split("streak >= ")[1]);
      return stats.streak >= required;
    }

    if (condition.includes("total_points >= ")) {
      const required = parseInt(condition.split("total_points >= ")[1]);
      return stats.total_points >= required;
    }

    if (condition.includes("correct_notes >= ")) {
      const required = parseInt(condition.split("correct_notes >= ")[1]);
      return stats.correct_notes >= required;
    }

    if (condition.includes("practice_hours >= ")) {
      const required = parseInt(condition.split("practice_hours >= ")[1]);
      return stats.practice_hours >= required;
    }

    if (condition.includes("avg_accuracy_10 >= ")) {
      const required = parseFloat(condition.split("avg_accuracy_10 >= ")[1]);
      return stats.avg_accuracy_10 >= required;
    }

    if (condition === "perfect_game") {
      return stats.perfect_games > 0;
    }

    return false;
  }

  // Get achievement progress for a specific achievement
  getAchievementProgress(achievement, stats) {
    const condition = achievement.condition;

    if (condition.includes("sessions >= ")) {
      const required = parseInt(condition.split("sessions >= ")[1]);
      return Math.min(stats.sessions / required, 1);
    }

    if (condition.includes("streak >= ")) {
      const required = parseInt(condition.split("streak >= ")[1]);
      return Math.min(stats.streak / required, 1);
    }

    if (condition.includes("total_points >= ")) {
      const required = parseInt(condition.split("total_points >= ")[1]);
      return Math.min(stats.total_points / required, 1);
    }

    if (condition.includes("correct_notes >= ")) {
      const required = parseInt(condition.split("correct_notes >= ")[1]);
      return Math.min(stats.correct_notes / required, 1);
    }

    if (condition.includes("practice_hours >= ")) {
      const required = parseInt(condition.split("practice_hours >= ")[1]);
      return Math.min(stats.practice_hours / required, 1);
    }

    if (condition.includes("avg_accuracy_10 >= ")) {
      const required = parseFloat(condition.split("avg_accuracy_10 >= ")[1]);
      return Math.min(stats.avg_accuracy_10 / required, 1);
    }

    if (condition === "perfect_game") {
      return stats.perfect_games > 0 ? 1 : 0;
    }

    return 0;
  }

  // Get achievement with progress info
  async getAchievementsWithProgress(studentId) {
    try {
      const [scores, streak, earnedAchievements] = await Promise.all([
        getStudentScores(studentId),
        streakService.getStreak(),
        this.getEarnedAchievements(studentId),
      ]);

      const earnedIds = earnedAchievements.map((a) => a.achievement_id);
      const stats = this.calculateUserStats(scores);
      stats.streak = streak;

      return Object.values(this.achievements).map((achievement) => ({
        ...achievement,
        earned: earnedIds.includes(achievement.id),
        progress: this.getAchievementProgress(achievement, stats),
        earnedAt: earnedAchievements.find(
          (e) => e.achievement_id === achievement.id
        )?.earned_at,
      }));
    } catch (error) {
      console.error("Error getting achievements with progress:", error);
      return [];
    }
  }
}

// Export singleton instance
export const achievementService = new AchievementService();
export default achievementService;
