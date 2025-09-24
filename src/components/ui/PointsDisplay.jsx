import React, { useState, useEffect, useRef } from "react";
import {
  Star,
  TrendingUp,
  Trophy,
  Target,
  Zap,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getStudentScores } from "../../services/apiDatabase";
import { useUser } from "../../features/authentication/useUser";

// Animation for point changes
const usePointsAnimation = (currentPoints, previousPoints) => {
  const [displayPoints, setDisplayPoints] = useState(currentPoints);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (currentPoints !== previousPoints && previousPoints !== undefined) {
      setIsAnimating(true);

      // Animate the number counting up/down
      const difference = currentPoints - previousPoints;
      const duration = Math.min(2000, Math.abs(difference) * 10); // Max 2 seconds
      const steps = Math.min(60, Math.abs(difference)); // Max 60 steps
      const increment = difference / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const newValue = previousPoints + increment * currentStep;

        if (currentStep >= steps) {
          setDisplayPoints(currentPoints);
          setIsAnimating(false);
          clearInterval(interval);
        } else {
          setDisplayPoints(Math.round(newValue));
        }
      }, stepDuration);

      return () => clearInterval(interval);
    } else {
      setDisplayPoints(currentPoints);
    }
  }, [currentPoints, previousPoints]);

  return { displayPoints, isAnimating };
};

// Get visual styling based on points level
const getPointsVisuals = (points) => {
  if (points === 0) {
    return {
      icon: Target,
      color: "gray",
      bgGradient: "from-white to-white",
      textColor: "text-gray-900",
      iconColor: "text-gray-400",
      level: "Beginner",
      nextMilestone: 100,
      glowEffect: "",
    };
  } else if (points < 100) {
    return {
      icon: Star,
      color: "blue",
      bgGradient: "from-blue-500/20 to-indigo-500/20",
      textColor: "text-blue-400",
      iconColor: "text-blue-400",
      level: "Student",
      nextMilestone: 100,
      glowEffect: "",
    };
  } else if (points < 500) {
    return {
      icon: Award,
      color: "green",
      bgGradient: "from-green-500/20 to-emerald-500/20",
      textColor: "text-green-400",
      iconColor: "text-green-400",
      level: "Practitioner",
      nextMilestone: 500,
      glowEffect: "shadow-green-500/20",
    };
  } else if (points < 1000) {
    return {
      icon: Zap,
      color: "yellow",
      bgGradient: "from-yellow-500/20 to-orange-500/20",
      textColor: "text-yellow-400",
      iconColor: "text-yellow-400",
      level: "Expert",
      nextMilestone: 1000,
      glowEffect: "shadow-yellow-500/30",
    };
  } else if (points < 2500) {
    return {
      icon: Trophy,
      color: "purple",
      bgGradient: "from-purple-500/20 to-violet-500/20",
      textColor: "text-purple-400",
      iconColor: "text-purple-400",
      level: "Master",
      nextMilestone: 2500,
      glowEffect: "shadow-purple-500/40",
    };
  } else {
    return {
      icon: Trophy,
      color: "gold",
      bgGradient: "from-yellow-400/30 to-orange-500/30",
      textColor: "text-yellow-300",
      iconColor: "text-yellow-300",
      level: "Legend",
      nextMilestone: null,
      glowEffect: "shadow-yellow-500/50 shadow-2xl",
    };
  }
};

// Calculate points breakdown by game type
const calculatePointsBreakdown = (scores) => {
  if (!scores || !Array.isArray(scores)) return [];

  const breakdown = {};
  let totalEarned = 0;

  scores.forEach((score) => {
    const gameType = score.game_type || "other";
    const points = score.score || 0;

    if (!breakdown[gameType]) {
      breakdown[gameType] = {
        name:
          gameType === "note-recognition"
            ? "Note Recognition"
            : gameType === "rhythm-master"
              ? "Rhythm Master"
              : gameType === "sight-reading"
                ? "Sight Reading"
                : "Other Games",
        points: 0,
        sessions: 0,
        icon:
          gameType === "note-recognition"
            ? "🎵"
            : gameType === "rhythm-master"
              ? "🥁"
              : gameType === "sight-reading"
                ? "📖"
                : "🎮",
      };
    }

    breakdown[gameType].points += points;
    breakdown[gameType].sessions += 1;
    totalEarned += points;
  });

  // Convert to array and calculate percentages
  return Object.values(breakdown)
    .map((item) => ({
      ...item,
      percentage: totalEarned > 0 ? (item.points / totalEarned) * 100 : 0,
    }))
    .sort((a, b) => b.points - a.points);
};

// Recent points trend (last 7 sessions)
const calculateRecentTrend = (scores) => {
  if (!scores || !Array.isArray(scores) || scores.length === 0) return 0;

  const recent = scores.slice(0, 7); // Last 7 sessions
  const older = scores.slice(7, 14); // Previous 7 sessions

  const recentAvg =
    recent.reduce((sum, score) => sum + (score.score || 0), 0) / recent.length;
  const olderAvg =
    older.length > 0
      ? older.reduce((sum, score) => sum + (score.score || 0), 0) / older.length
      : recentAvg;

  if (olderAvg === 0) return 0;
  return ((recentAvg - olderAvg) / olderAvg) * 100;
};

const PointsDisplay = ({ variant = "default", className = "" }) => {
  const { user } = useUser();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const previousPoints = useRef();

  // Fetch user scores and total (only for students)
  const { data: scoresData } = useQuery({
    queryKey: ["student-scores", user?.id],
    queryFn: () => getStudentScores(user.id),
    enabled: !!user?.id && user?.isStudent, // Only fetch for students, not teachers
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes instead of 30 seconds
  });

  const totalPoints =
    scoresData?.reduce((sum, score) => sum + (score.score || 0), 0) || 0;
  const { displayPoints, isAnimating } = usePointsAnimation(
    totalPoints,
    previousPoints.current
  );

  // Update previous points reference
  useEffect(() => {
    if (previousPoints.current !== totalPoints) {
      previousPoints.current = totalPoints;
    }
  }, [totalPoints]);

  const visuals = getPointsVisuals(totalPoints);
  const breakdown = calculatePointsBreakdown(scoresData);
  const trend = calculateRecentTrend(scoresData);
  const IconComponent = visuals.icon;

  // Progress to next milestone
  const progressToNext = visuals.nextMilestone
    ? ((totalPoints %
        (visuals.nextMilestone === 100
          ? 100
          : visuals.nextMilestone === 500
            ? 500
            : visuals.nextMilestone === 1000
              ? 1000
              : 2500)) /
        (visuals.nextMilestone === 100
          ? 100
          : visuals.nextMilestone === 500
            ? 500
            : visuals.nextMilestone === 1000
              ? 1000
              : 2500)) *
      100
    : 100;

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm ${className}`}
      >
        <IconComponent className={`w-4 h-4 ${visuals.iconColor}`} />
        <span className={`font-semibold ${visuals.textColor}`}>
          {displayPoints.toLocaleString()}
        </span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`card-compact p-3 ${visuals.glowEffect} ${className}`}>
        <div className="flex flex-col items-center text-center">
          {/* Header with icon and level */}
          <div className="flex items-center gap-1 mb-1">
            <IconComponent
              className={`w-3 h-3 ${visuals.iconColor} ${isAnimating ? "animate-pulse" : ""}`}
            />
            <h3 className="text-xs font-medium text-gray-600">Total Points</h3>
          </div>

          {/* Main points display */}
          <div className="relative">
            <p
              className={`text-lg font-bold text-gray-900 ${isAnimating ? "animate-pulse" : ""}`}
            >
              {displayPoints.toLocaleString()}
            </p>
          </div>

          {/* Trend indicator */}
          {trend !== 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div
                className={`flex items-center gap-1 text-xs ${trend > 0 ? "text-green-400" : "text-red-400"}`}
              >
                <TrendingUp
                  className={`w-3 h-3 ${trend < 0 ? "rotate-180" : ""}`}
                />
                {Math.abs(trend).toFixed(1)}%
              </div>
            </div>
          )}

          {/* Progress to next milestone */}
          {visuals.nextMilestone && (
            <div className="w-full mt-1">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>
                  Progress to{" "}
                  {visuals.level === "Beginner"
                    ? "Student"
                    : visuals.level === "Student"
                      ? "Practitioner"
                      : visuals.level === "Practitioner"
                        ? "Expert"
                        : visuals.level === "Expert"
                          ? "Master"
                          : "Legend"}
                </span>
                <span>{visuals.nextMilestone - totalPoints} to go</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full bg-gradient-to-r ${visuals.bgGradient} transition-all duration-1000`}
                  style={{ width: `${Math.min(progressToNext, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Expandable breakdown */}
          {breakdown.length > 0 && (
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1 mt-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              View Breakdown
              {showBreakdown ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}

          {/* Points breakdown */}
          {showBreakdown && breakdown.length > 0 && (
            <div className="w-full mt-1 pt-1 border-t border-gray-200">
              <div className="space-y-1">
                {breakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-medium">
                        {item.points}
                      </span>
                      <span className="text-gray-500">
                        ({item.sessions} sessions)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`p-2 rounded-lg bg-gradient-to-r ${visuals.bgGradient}`}>
        <IconComponent
          className={`w-6 h-6 ${visuals.iconColor} ${isAnimating ? "animate-pulse" : ""}`}
        />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={`text-xl font-bold ${visuals.textColor}`}>
            {displayPoints.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{visuals.level}</span>
          {trend !== 0 && (
            <span
              className={`flex items-center gap-1 ${trend > 0 ? "text-green-400" : "text-red-400"}`}
            >
              <TrendingUp
                className={`w-3 h-3 ${trend < 0 ? "rotate-180" : ""}`}
              />
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PointsDisplay;
