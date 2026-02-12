import React from "react";
import { Flame, Loader2, Star, Zap, Trophy, Target } from "lucide-react";
import { streakService } from "../../services/streakService";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

// Get visual indicator and color scheme based on streak length
const getStreakVisuals = (streak) => {
  if (streak === 0) {
    return {
      icon: Target,
      color: "gray",
      bgColor: "bg-gray-500/20",
      textColor: "text-gray-400",
      iconColor: "text-gray-400",
      messageKey: "dashboard.streak.messages.startJourney",
      animation: "",
    };
  } else if (streak < 3) {
    return {
      icon: Flame,
      color: "orange",
      bgColor: "bg-orange-500/20",
      textColor: "text-orange-500",
      iconColor: "text-orange-500",
      messageKey: "dashboard.streak.messages.buildingMomentum",
      animation: "animate-pulse",
    };
  } else if (streak < 7) {
    return {
      icon: Flame,
      color: "red",
      bgColor: "bg-red-500/20",
      textColor: "text-red-500",
      iconColor: "text-red-500",
      messageKey: "dashboard.streak.messages.gettingHot",
      animation: "animate-pulse",
    };
  } else if (streak < 14) {
    return {
      icon: Zap,
      color: "yellow",
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-500",
      iconColor: "text-yellow-500",
      messageKey: "dashboard.streak.messages.onFire",
      animation: "animate-bounce",
    };
  } else if (streak < 30) {
    return {
      icon: Star,
      color: "blue",
      bgColor: "bg-blue-500/20",
      textColor: "text-blue-500",
      iconColor: "text-blue-500",
      messageKey: "dashboard.streak.messages.superstar",
      animation: "animate-spin",
    };
  } else {
    return {
      icon: Trophy,
      color: "purple",
      bgColor: "bg-purple-500/20",
      textColor: "text-purple-500",
      iconColor: "text-purple-500",
      messageKey: "dashboard.streak.messages.legend",
      animation: "animate-bounce",
    };
  }
};

// Get milestone translation key for special streak numbers
const milestoneMap = {
  1: "dashboard.streak.milestones.1",
  3: "dashboard.streak.milestones.3",
  7: "dashboard.streak.milestones.7",
  14: "dashboard.streak.milestones.14",
  30: "dashboard.streak.milestones.30",
  50: "dashboard.streak.milestones.50",
  100: "dashboard.streak.milestones.100",
};

const getMilestoneKey = (streak) => milestoneMap[streak] || null;

const getNextMilestoneData = (streak) => {
  const milestones = [1, 3, 7, 14, 30, 50, 100];
  const nextMilestone = milestones.find((m) => m > streak);

  if (!nextMilestone) return null;

  return {
    remaining: nextMilestone - streak,
    milestone: nextMilestone,
  };
};

const renderLoaderIcon = (className) =>
  React.createElement(Loader2, { className });

const renderLucideIcon = (IconComponent, className) =>
  IconComponent ? React.createElement(IconComponent, { className }) : null;

export default function StreakDisplay({ variant = "default", className = "" }) {
  const { data: streak, isLoading } = useQuery({
    queryKey: ["streak"],
    queryFn: () => streakService.getStreak(),
    staleTime: 2 * 60 * 1000, // 2 minutes - streak doesn't change often
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes instead of 30 seconds
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const { t } = useTranslation("common");

  if (isLoading) {
    // Match the card variant styling for consistent appearance
    if (variant === "card") {
      return (
        <div className={`card-compact p-3 relative overflow-hidden ${className}`}>
          <div className="relative flex flex-col items-center text-center">
            <div className="flex items-center gap-1 mb-1">
              {renderLoaderIcon("w-3 h-3 text-gray-600 animate-spin")}
              <h3 className="text-xs font-medium text-gray-600">
                {t("dashboard.stats.dailyStreak")}
              </h3>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-1">
              <span className="text-xs ml-1">
                {t("dashboard.streak.loadingState")}
              </span>
            </p>
            <div className="text-xs font-medium text-gray-400 mb-1">
              {t("dashboard.streak.loadingHint")}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
        {renderLoaderIcon("w-4 h-4 text-gray-600 animate-spin")}
        <span className="text-sm font-medium text-gray-900">
          {t("dashboard.streak.loadingState")}
        </span>
      </div>
    );
  }

  const currentStreak = streak || 0;
  const visuals = getStreakVisuals(currentStreak);
  const milestoneKey = getMilestoneKey(currentStreak);
  const milestoneMessage = milestoneKey ? t(milestoneKey) : null;
  const nextMilestoneData = getNextMilestoneData(currentStreak);
  const dayLabel = t("dashboard.streak.dayLabel", { count: currentStreak });
  const renderIcon = (sizeClasses) =>
    renderLucideIcon(
      visuals.icon,
      `${sizeClasses} ${visuals.iconColor} ${visuals.animation}`
    );

  // Compact variant for smaller displays
  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm`}
      >
        {renderIcon("w-4 h-4")}
        <span className={`text-sm font-medium ${visuals.textColor}`}>
          {currentStreak} {dayLabel}
        </span>
      </div>
    );
  }

  // Enhanced card variant for dashboard
  if (variant === "card") {
    return (
      <div className={`card-compact p-3 relative overflow-hidden ${className}`}>
        {/* Background glow effect for high streaks */}
        {currentStreak >= 7 && (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${visuals.bgColor} opacity-30 blur-xl`}
          />
        )}

        <div className="relative flex flex-col items-center text-center">
          <div className="flex items-center gap-1 mb-1">
            {renderIcon("w-3 h-3")}
            <h3 className="text-xs font-medium text-gray-600">
              {t("dashboard.stats.dailyStreak")}
            </h3>
          </div>

          <p className="text-lg font-bold text-gray-900 mb-1">
            {currentStreak}
            <span className="text-xs ml-1">
              {dayLabel}
            </span>
          </p>

          <div className={`text-xs font-medium ${visuals.textColor} mb-1`}>
            {t(visuals.messageKey)}
          </div>

          {/* Progress bar for next milestone */}
          {currentStreak > 0 && currentStreak < 100 && (
            <div className="w-full max-w-20">
              <div className="w-full bg-gray-200 rounded-full h-0.5 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r from-${visuals.color}-400 to-${visuals.color}-600 transition-all duration-500`}
                  style={{
                    width: `${getProgressToNextMilestone(currentStreak)}%`,
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {nextMilestoneData
                  ? t("dashboard.streak.nextMilestone", nextMilestoneData)
                  : t("dashboard.streak.maxReached")}
              </div>
            </div>
          )}

          {/* Milestone celebration message */}
          {milestoneMessage && (
            <div className="mt-1 p-0.5 bg-gray-100 rounded border border-gray-200 animate-pulse">
              <div className="text-xs text-gray-900 font-medium">
                {milestoneMessage}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm`}
    >
      {renderIcon("w-4 h-4")}
      <span className={`text-sm font-medium ${visuals.textColor}`}>
        {t("dashboard.streak.streakSummary", { count: currentStreak })}
      </span>
      {milestoneMessage && (
        <div className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-900 animate-pulse">
          {t("dashboard.streak.milestoneBadge")}
        </div>
      )}
    </div>
  );
}

// Helper function to calculate progress to next milestone
function getProgressToNextMilestone(streak) {
  const milestones = [1, 3, 7, 14, 30, 50, 100];
  const nextMilestone = milestones.find((m) => m > streak);

  if (!nextMilestone) return 100;

  const prevMilestone = milestones[milestones.indexOf(nextMilestone) - 1] || 0;
  const progress =
    ((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

  return Math.min(100, Math.max(0, progress));
}

// Helper function to get next milestone text
