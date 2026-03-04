import React, { useRef, useEffect } from "react";
import { Flame, Loader2, Star, Zap, Trophy, Target } from "lucide-react";
import { streakService } from "../../services/streakService";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

// Get visual indicator and color scheme based on streak length
const getStreakVisuals = (streak) => {
  if (streak === 0) {
    return {
      icon: Target,
      color: "gray",
      bgColor: "bg-gray-500/20",
      textColor: "text-white/60",
      iconColor: "text-white/40",
      glowColor: "from-gray-400/20 to-gray-500/10",
      messageKey: "dashboard.streak.messages.startJourney",
      animation: "",
    };
  } else if (streak < 3) {
    return {
      icon: Flame,
      color: "orange",
      bgColor: "bg-orange-500/20",
      textColor: "text-orange-300",
      iconColor: "text-orange-400",
      glowColor: "from-orange-500/30 to-amber-500/10",
      messageKey: "dashboard.streak.messages.buildingMomentum",
      animation: "animate-pulse",
    };
  } else if (streak < 7) {
    return {
      icon: Flame,
      color: "red",
      bgColor: "bg-red-500/20",
      textColor: "text-red-300",
      iconColor: "text-red-400",
      glowColor: "from-red-500/30 to-orange-500/10",
      messageKey: "dashboard.streak.messages.gettingHot",
      animation: "animate-pulse",
    };
  } else if (streak < 14) {
    return {
      icon: Zap,
      color: "yellow",
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-300",
      iconColor: "text-yellow-400",
      glowColor: "from-yellow-500/30 to-orange-500/10",
      messageKey: "dashboard.streak.messages.onFire",
      animation: "animate-bounce",
    };
  } else if (streak < 30) {
    return {
      icon: Star,
      color: "blue",
      bgColor: "bg-blue-500/20",
      textColor: "text-blue-300",
      iconColor: "text-blue-400",
      glowColor: "from-blue-500/30 to-indigo-500/10",
      messageKey: "dashboard.streak.messages.superstar",
      animation: "animate-spin",
    };
  } else {
    return {
      icon: Trophy,
      color: "purple",
      bgColor: "bg-purple-500/20",
      textColor: "text-purple-300",
      iconColor: "text-purple-400",
      glowColor: "from-purple-500/30 to-indigo-500/10",
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
  const { data: streakState, isLoading } = useQuery({
    queryKey: ["streak-state"],
    queryFn: () => streakService.getStreakState(),
    staleTime: 2 * 60 * 1000, // 2 minutes - streak doesn't change often
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes instead of 30 seconds
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const { t } = useTranslation("common");

  // Show toast once per session when a freeze was consumed in the last 24 hours
  const freezeConsumedToastRef = useRef(false);
  useEffect(() => {
    if (!streakState?.lastFreezeConsumedAt) return;
    if (freezeConsumedToastRef.current) return;

    const consumedAt = new Date(streakState.lastFreezeConsumedAt);
    const hoursSince = (Date.now() - consumedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSince <= 24) {
      freezeConsumedToastRef.current = true;
      toast.success(t('streak.freezeConsumed'));
    }
  }, [streakState?.lastFreezeConsumedAt, t]);

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
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-lg">
        {renderLoaderIcon("w-4 h-4 text-white/60 animate-spin")}
        <span className="text-sm font-medium text-white/60">
          {t("dashboard.streak.loadingState")}
        </span>
      </div>
    );
  }

  const currentStreak = streakState?.streakCount || 0;
  const freezeCount = streakState?.freezeCount || 0;
  const inGraceWindow = streakState?.inGraceWindow || false;
  const lastFreezeConsumedAt = streakState?.lastFreezeConsumedAt || null;

  // Determine if freeze was used within last 24h for annotation
  const freezeUsedRecently = lastFreezeConsumedAt
    ? (Date.now() - new Date(lastFreezeConsumedAt).getTime()) / (1000 * 60 * 60) <= 24
    : false;

  // Use amber visuals when in grace window, otherwise normal
  const visuals = inGraceWindow
    ? {
        ...getStreakVisuals(currentStreak),
        bgColor: "bg-amber-500/20",
        textColor: "text-amber-400",
        iconColor: "text-amber-400",
      }
    : getStreakVisuals(currentStreak);

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
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg">
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

          {/* Freeze count indicator */}
          {freezeCount > 0 && (
            <div className="flex items-center justify-center gap-1 text-xs text-blue-500 mb-0.5">
              <span>🛡️ {t('streak.freezeCount', { count: freezeCount })}</span>
              {freezeUsedRecently && (
                <span className="text-gray-400">({t('streak.freezeUsedYesterday')})</span>
              )}
            </div>
          )}

          <div className={`text-xs font-medium ${visuals.textColor} mb-1`}>
            {inGraceWindow ? t('streak.graceWarning') : t(visuals.messageKey)}
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
    <div className={`relative overflow-hidden flex items-center gap-3 backdrop-blur-md px-4 py-2.5 rounded-xl border shadow-lg ${
      inGraceWindow
        ? 'bg-amber-500/15 border-amber-400/30'
        : 'bg-white/10 border-white/20'
    }`}>
      {/* Subtle glow behind icon */}
      <div className={`absolute inset-0 bg-gradient-to-r ${visuals.glowColor} opacity-50 pointer-events-none`} />

      <div className="relative flex items-center gap-3">
        {renderIcon("w-5 h-5")}
        <span className="text-sm font-bold text-white">
          {currentStreak}
        </span>
        <span className="text-sm font-medium text-white/70">
          {dayLabel}
        </span>
      </div>

      {freezeCount > 0 && (
        <span className="relative text-xs text-blue-300 font-medium">🛡️ {t('streak.freezeCount', { count: freezeCount })}</span>
      )}

      {inGraceWindow && (
        <span className="relative text-xs text-amber-300 font-medium">{t('streak.graceWarning')}</span>
      )}

      {milestoneMessage && (
        <div className="relative text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/80 animate-pulse">
          {milestoneMessage}
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
