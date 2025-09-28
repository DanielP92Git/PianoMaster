import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Star, Clock, Target, Zap, Award, Lock } from "lucide-react";
import { achievementService } from "../services/achievementService";
import { useUser } from "../features/authentication/useUser";
import BackButton from "../components/ui/BackButton";

const categoryIcons = {
  milestone: Trophy,
  streak: Zap,
  performance: Target,
  points: Star,
  skill: Award,
  time: Clock,
};

const categoryColors = {
  milestone: "from-blue-500 to-cyan-500",
  streak: "from-orange-500 to-red-500",
  performance: "from-purple-500 to-pink-500",
  points: "from-green-500 to-emerald-500",
  skill: "from-yellow-500 to-amber-500",
  time: "from-indigo-500 to-blue-500",
};

export function Achievements() {
  const { user } = useUser();

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

  const isLoading = allLoading || earnedLoading || progressLoading;

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getProgressInfo = (achievementId) => {
    const progress = progressData.find((p) => p.id === achievementId);
    return progress || null;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <BackButton />
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Achievements
            </h1>
            <p className="text-gray-600">Loading your achievements...</p>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6">
                <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="h-16 bg-gray-100 rounded-xl animate-pulse"
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
      <BackButton />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Achievements
          </h1>
          <p className="text-gray-600">
            Track your progress and unlock badges as you practice
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-indigo-600 mb-1">
              {earnedAchievements.length}
            </div>
            <div className="text-sm text-gray-600">Achievements Earned</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {earnedAchievements.reduce(
                (sum, achievement) => sum + (achievement.points || 0),
                0
              )}
            </div>
            <div className="text-sm text-gray-600">Achievement Points</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {Math.round(
                (earnedAchievements.length / allAchievements.length) * 100
              ) || 0}
              %
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
        </div>

        {/* Recent Achievements */}
        {earnedAchievements.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Achievements
            </h2>
            <div className="space-y-3">
              {earnedAchievements.slice(0, 5).map((earned) => {
                const achievement = allAchievements.find(
                  (a) => a.id === earned.achievement_id
                );
                if (!achievement) return null;

                const IconComponent =
                  categoryIcons[achievement.category] || Trophy;
                const colorClass =
                  categoryColors[achievement.category] ||
                  categoryColors.milestone;

                return (
                  <div
                    key={earned.id}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100"
                  >
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {achievement.title}
                        </h3>
                        <span className="text-xl">{achievement.icon}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>+{achievement.points} points</span>
                        <span>Earned {formatDate(earned.earned_at)}</span>
                      </div>
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
              const IconComponent = categoryIcons[category] || Trophy;
              const colorClass =
                categoryColors[category] || categoryColors.milestone;

              return (
                <div key={category} className="card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center`}
                    >
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 capitalize">
                      {category} Achievements
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
                              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                              : "bg-gray-50 border-gray-200 hover:border-gray-300"
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
                                  <Lock className="h-4 w-4 text-white" />
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
                                className={`font-medium mb-1 ${isEarned ? "text-gray-900" : "text-gray-600"}`}
                              >
                                {achievement.title}
                              </h3>
                              <p
                                className={`text-sm mb-2 ${isEarned ? "text-gray-600" : "text-gray-500"}`}
                              >
                                {achievement.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-medium ${isEarned ? "text-green-600" : "text-gray-500"}`}
                                >
                                  +{achievement.points} points
                                </span>
                                {isEarned && earned && (
                                  <span className="text-xs text-gray-500">
                                    {formatDate(earned.earned_at)}
                                  </span>
                                )}
                              </div>
                              {progress &&
                                progress.progress !== undefined &&
                                !isEarned && (
                                  <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all"
                                        style={{
                                          width: `${Math.min(progress.progress * 100, 100)}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {Math.round(progress.progress * 100)}%
                                      complete
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
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Achievements Available
            </h3>
            <p className="text-gray-600">
              Check back later for new achievements to unlock!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
