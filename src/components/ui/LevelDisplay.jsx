import React from "react";
import { Target, Star, Award, Zap, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getStudentScores } from "../../services/apiDatabase";
import { useUser } from "../../features/authentication/useUser";
import { useTranslation } from "react-i18next";

// Get level styling based on points
const getLevelVisuals = (points) => {
  if (points === 0) {
    return {
      icon: Target,
      levelKey: "beginner",
      color: "text-gray-600",
      iconColor: "text-gray-400",
      bgColor: "bg-white",
      borderColor: "border-gray-200",
    };
  } else if (points < 100) {
    return {
      icon: Star,
      levelKey: "student",
      color: "text-blue-600",
      iconColor: "text-blue-400",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    };
  } else if (points < 500) {
    return {
      icon: Award,
      levelKey: "practitioner",
      color: "text-green-600",
      iconColor: "text-green-400",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    };
  } else if (points < 1000) {
    return {
      icon: Zap,
      levelKey: "expert",
      color: "text-yellow-600",
      iconColor: "text-yellow-400",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    };
  } else if (points < 2500) {
    return {
      icon: Trophy,
      levelKey: "master",
      color: "text-purple-600",
      iconColor: "text-purple-400",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    };
  } else {
    return {
      icon: Trophy,
      levelKey: "legend",
      color: "text-yellow-600",
      iconColor: "text-yellow-400",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    };
  }
};

const LevelDisplay = ({ variant = "default", className = "" }) => {
  const { user } = useUser();
  const { t } = useTranslation("common");

  // Fetch user scores and total (only for students)
  const { data: scoresData } = useQuery({
    queryKey: ["student-scores", user?.id],
    queryFn: () => getStudentScores(user.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  // Calculate total points
  const totalPoints =
    scoresData?.reduce((sum, score) => sum + (score.score || 0), 0) || 0;

  const visuals = getLevelVisuals(totalPoints);
  const IconComponent = visuals.icon;
  const levelName = t(`dashboard.levels.${visuals.levelKey}.name`);
  const levelDescription = t(
    `dashboard.levels.${visuals.levelKey}.description`
  );

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm ${className}`}
      >
        <IconComponent className={`w-4 h-4 ${visuals.iconColor}`} />
        <span className={`font-semibold ${visuals.color}`}>
          {visuals.level}
        </span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`card-compact p-3 ${className}`}>
        <div className="flex flex-col items-center text-center">
          {/* Header with icon */}
          <div className="flex items-center gap-1 mb-1">
            <IconComponent className={`w-3 h-3 ${visuals.iconColor}`} />
            <h3 className="text-xs font-medium text-gray-600">
              {t("dashboard.stats.level")}
            </h3>
          </div>

          {/* Main level display */}
          <div className="relative">
            <p className={`text-lg font-bold ${visuals.color}`}>
              {levelName}
            </p>
          </div>

          {/* Level description */}
          <div className="mt-1">
            <span className="text-xs text-gray-500">{levelDescription}</span>
          </div>

          {/* Level badge */}
          <div className="mt-1">
            <span
              className={`text-xs px-2 py-1 rounded-full ${visuals.bgColor} ${visuals.borderColor} border ${visuals.color} font-medium`}
            >
              {levelName}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`p-2 rounded-lg ${visuals.bgColor} ${visuals.borderColor} border`}
      >
        <IconComponent className={`w-6 h-6 ${visuals.iconColor}`} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={`text-xl font-bold ${visuals.color}`}>
            {levelName}
          </span>
        </div>
        <div className="text-sm text-gray-500">{levelDescription}</div>
      </div>
    </div>
  );
};

export default LevelDisplay;
