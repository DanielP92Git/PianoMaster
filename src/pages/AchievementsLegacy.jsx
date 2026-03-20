import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Star,
  Clock,
  Target,
  Zap,
  Award,
  Lock as LockIcon,  
} from "lucide-react";
import { achievementService } from "../services/achievementService";
import { useUser } from "../features/authentication/useUser";
import { useTranslation } from "react-i18next";

const categoryIcons = {
  milestone: Trophy,
  streak: Zap,
  performance: Target,
  points: Star,
  xp: Star,
  skill: Award,
  time: Clock,
};

const categoryColors = {
  milestone: "from-blue-500 to-cyan-500",
  streak: "from-orange-500 to-red-500",
  performance: "from-purple-500 to-pink-500",
  points: "from-green-500 to-emerald-500",
  xp: "from-green-500 to-emerald-500",
  skill: "from-yellow-500 to-amber-500",
  time: "from-indigo-500 to-blue-500",
};

export default function AchievementsLegacy() {
  const { user } = useUser();
  const { t, i18n: _i18n } = useTranslation();

  // Fetch all available achievements
  const { data: allAchievements = [], isLoading: allLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => achievementService.getAllAchievements(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch user's earned achievements
  const { data: earnedAchievements = [], isLoading: earnedLoading } = useQuery({
    queryKey: ["earned-achievements", user?.id],
    queryFn: () => achievementService.getEarnedAchievements(user.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch achievement progress
  const { data: progressData = [], isLoading: progressLoading } = useQuery({
    queryKey: ["achievements-with-progress", user?.id],
    queryFn: () => achievementService.getAchievementsWithProgress(user.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const isLoading =
    allLoading || earnedLoading || progressLoading;

  // Create a map of earned achievements for quick lookup
  const earnedMap = new Map(
    earnedAchievements.map((earned) => [earned.achievement_id, earned])
  );

  // Group achievements by category
  const groupedAchievements = allAchievements.reduce((groups, achievement) => {
    const category = achievement.category || "milestone";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(achievement);
    return groups;
  }, {});

  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t("pages.achievements.timeAgo.today");
    if (diffDays === 1) return t("pages.achievements.timeAgo.yesterday");
    if (diffDays < 7) return t("pages.achievements.timeAgo.daysAgo", { count: diffDays });
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return t("pages.achievements.timeAgo.weeksAgo", { count: weeks });
    }
    const months = Math.floor(diffDays / 30);
    return t("pages.achievements.timeAgo.monthsAgo", { count: months });
  };

  const getAchievementTitle = (achievement) =>
    t(`pages.achievements.items.${achievement.id}.title`, {
      defaultValue: achievement.title,
    });

  const getAchievementDescription = (achievement) =>
    t(`pages.achievements.items.${achievement.id}.description`, {
      defaultValue: achievement.description,
    });

  const getCategoryLabel = (category) =>
    t(`pages.achievements.categories.${category}`, {
      defaultValue: category,
    });

  const getProgressInfo = (achievementId) => {
    const progress = progressData.find((p) => p.id === achievementId);
    return progress || null;
  };

  // Derive earned count and XP from deduplicated progressData (not raw DB rows)
  const earnedCount = progressData.filter((a) => a.earned).length;
  const achievementXP = progressData
    .filter((a) => a.earned)
    .reduce((sum, a) => sum + (a.points || 0), 0);

  // Find the closest-to-completion unearned achievement
  const closestAchievement = progressData
    .filter((a) => !a.earned && a.progress > 0)
    .sort((a, b) => b.progress - a.progress)[0]
    || progressData.find((a) => !a.earned)
    || null;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <p className="text-white/70">{t("pages.achievements.loading")}</p>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6">
                <div className="h-6 bg-white/20 rounded mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="h-16 bg-white/10 rounded-xl animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-white/70">{t("pages.achievements.description")}</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Card 1: Achievements Earned */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 text-center">
            <div className="text-2xl font-bold text-indigo-300 mb-1">
              {t("pages.achievements.earnedOf", {
                earned: earnedCount,
                total: allAchievements.length,
              })}
            </div>
            <div className="text-sm text-white/70 mb-3">
              {t("pages.achievements.earned")}
            </div>
            <div className="w-full bg-white/15 rounded-full h-2 mb-2">
              <div
                className="bg-indigo-400 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.round(
                    (earnedCount /
                      Math.max(allAchievements.length, 1)) *
                      100
                  )}%`,
                }}
              ></div>
            </div>
            <div className="text-xs text-white/60">
              {t("pages.achievements.xpFromAchievements", {
                xp: achievementXP.toLocaleString(),
              })}
            </div>
          </div>

          {/* Card 2: Next Achievement */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 text-center">
            <div className="text-sm text-white/70 mb-3">
              {t("pages.achievements.nextAchievement")}
            </div>
            {closestAchievement ? (
              <>
                <div className="text-2xl mb-1">{closestAchievement.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">
                  {getAchievementTitle(closestAchievement)}
                </div>
                <div className="text-xs text-white/60 mb-2">
                  {getAchievementDescription(closestAchievement)}
                </div>
                <div className="w-full bg-white/15 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-400 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        Math.round((closestAchievement.progress || 0) * 100),
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-green-300">
                  {(closestAchievement.progress || 0) >= 0.7
                    ? t("pages.achievements.almostThere")
                    : t("pages.achievements.keepGoing")}
                  {" — "}
                  {Math.round((closestAchievement.progress || 0) * 100)}%
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-sm font-semibold text-green-300">
                  {t("pages.achievements.allUnlocked")}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Achievements */}
        {earnedAchievements.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              {t("pages.achievements.recentAchievements")}
            </h2>
            <div className="space-y-3">
              {earnedAchievements.slice(0, 5).map((earned) => {
                const achievement = allAchievements.find(
                  (a) => a.id === earned.achievement_id
                );
                if (!achievement) return null;

                const CategoryIcon =
                  categoryIcons[achievement.category] || Trophy;
                const colorClass =
                  categoryColors[achievement.category] ||
                  categoryColors.milestone;

                return (
                  <div
                    key={earned.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}
                    >
                      <CategoryIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">
                        {getAchievementTitle(achievement)}
                      </h3>
                      <p className="text-xs text-white/60 truncate">
                        {getAchievementDescription(achievement)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-xs font-medium text-green-300">
                        {t("pages.achievements.xpReward", {
                          xp: achievement.points,
                        })}
                      </span>
                      <span className="text-xs text-white/50">
                        {timeAgo(earned.earned_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Achievements by Category */}
        <div className="space-y-8">
          {Object.entries(groupedAchievements).map(
            ([category, achievements]) => {
               
              const CategoryIcon = categoryIcons[category] || Trophy;
              const colorClass =
                categoryColors[category] || categoryColors.milestone;

              return (
                <div key={category} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center`}
                    >
                      <CategoryIcon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-white capitalize">
                      {t("pages.achievements.categoryTitle", {
                        category: getCategoryLabel(category),
                      })}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => {
                      const earned = earnedMap.get(achievement.id);
                      const progress = getProgressInfo(achievement.id);
                      const isEarned = !!earned;

                      return (
                        <div
                          key={achievement.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isEarned
                              ? "bg-white/10 border-white/20 border-l-4 border-l-green-400"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <div
                                className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center ${!isEarned ? "opacity-50" : ""}`}
                              >
                                {isEarned ? (
                                  <span className="text-lg">
                                    {achievement.icon}
                                  </span>
                                ) : (
                                  <LockIcon className="h-4 w-4 text-white" />
                                )}
                              </div>
                              {isEarned && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3
                                className={`font-medium mb-1 ${isEarned ? "text-white" : "text-white/60"}`}
                              >
                                {getAchievementTitle(achievement)}
                              </h3>
                              <p
                                className={`text-sm mb-2 ${isEarned ? "text-white/70" : "text-white/50"}`}
                              >
                                {getAchievementDescription(achievement)}
                              </p>
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-medium ${isEarned ? "text-green-300" : "text-white/50"}`}
                                >
                                  {t("pages.achievements.pointsReward", {
                                    points: achievement.points,
                                  })}
                                </span>
                                {isEarned && earned && (
                                  <span className="text-xs text-white/50">
                                    {timeAgo(earned.earned_at)}
                                  </span>
                                )}
                              </div>
                              {progress &&
                                progress.progress !== undefined &&
                                !isEarned && (
                                  <div className="mt-2">
                                    <div className="w-full bg-white/15 rounded-full h-2">
                                      <div
                                        className="bg-indigo-400 h-2 rounded-full transition-all"
                                        style={{
                                          width: `${Math.min(progress.progress * 100, 100)}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-white/50 mt-1">
                                      {Math.round(progress.progress * 100)}%
                                      {t("pages.achievements.complete")}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Empty State */}
        {allAchievements.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {t("pages.achievements.noAchievementsAvailable")}
            </h3>
            <p className="text-white/70">
              {t("pages.achievements.checkBackLater")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
