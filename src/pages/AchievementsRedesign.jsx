import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Trophy,
  Lock as LockIcon,
  CheckCircle2,
  Target,
  Flame,
  Star,
  Music,
  Gem,
  AudioLines,
  Clock,
  Gamepad2,
  Crosshair,
} from "lucide-react";
import {
  FaTrophy,
  FaBolt,
  FaStar,
  FaMedal,
  FaClock,
  FaFire,
  FaGamepad,
} from "react-icons/fa";
import { achievementService } from "../services/achievementService";
import { useUser } from "../features/authentication/useUser";
import { useTranslation } from "react-i18next";
import { useAccessibility } from "../contexts/AccessibilityContext";


const categoryGlowColors = {
  milestone: "rgba(59,130,246,0.5)",
  streak: "rgba(249,115,22,0.5)",
  performance: "rgba(168,85,247,0.5)",
  points: "rgba(34,197,94,0.5)",
  xp: "rgba(34,197,94,0.5)",
  skill: "rgba(234,179,8,0.5)",
  time: "rgba(99,102,241,0.5)",
};

// Solid ring colors for neon border effect (recent achievements)
const categoryRingColors = {
  milestone: "#38bdf8",
  streak: "#f97316",
  performance: "#a855f7",
  points: "#22c55e",
  xp: "#22c55e",
  skill: "#eab308",
  time: "#818CF8",
};

// React-icons for category visuals
const categoryReactIcons = {
  milestone: FaGamepad,
  streak: FaBolt,
  performance: FaFire,
  points: FaStar,
  xp: FaStar,
  skill: FaMedal,
  time: FaClock,
};

// Lucide icon mapping for individual achievements
const achievementIcons = {
  target: Target,
  flame: Flame,
  star: Star,
  trophy: Trophy,
  music: Music,
  gem: Gem,
  "audio-lines": AudioLines,
  clock: Clock,
  "gamepad-2": Gamepad2,
  crosshair: Crosshair,
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AchievementsRedesign() {
  const { user } = useUser();
  const { t, i18n } = useTranslation();
  const { reducedMotion } = useAccessibility();
  const isRTL = i18n.dir() === "rtl";

  const MotionOrDiv = reducedMotion ? "div" : motion.div;
  const containerMotionProps = reducedMotion
    ? {}
    : {
        variants: staggerContainer,
        initial: "hidden",
        animate: "visible",
      };
  const childMotionProps = reducedMotion ? {} : { variants: fadeSlideUp };

  // Fetch all available achievements
  const { data: allAchievements = [], isLoading: allLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => achievementService.getAllAchievements(),
    staleTime: 30 * 60 * 1000,
  });

  // Fetch user's earned achievements
  const { data: earnedAchievements = [], isLoading: earnedLoading } = useQuery({
    queryKey: ["earned-achievements", user?.id],
    queryFn: () => achievementService.getEarnedAchievements(user.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch achievement progress
  const { data: progressData = [], isLoading: progressLoading } = useQuery({
    queryKey: ["achievements-with-progress", user?.id],
    queryFn: () => achievementService.getAchievementsWithProgress(user.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = allLoading || earnedLoading || progressLoading;

  // Create a map of earned achievements for quick lookup
  const earnedMap = new Map(
    earnedAchievements.map((earned) => [earned.achievement_id, earned]),
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
    if (diffDays < 7)
      return t("pages.achievements.timeAgo.daysAgo", { count: diffDays });
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

  // Derive earned count and XP from deduplicated progressData
  const earnedCount = progressData.filter((a) => a.earned).length;
  const achievementXP = progressData
    .filter((a) => a.earned)
    .reduce((sum, a) => sum + (a.points || 0), 0);

  // Find the closest-to-completion unearned achievement
  const closestAchievement =
    progressData
      .filter((a) => !a.earned && a.progress > 0)
      .sort((a, b) => b.progress - a.progress)[0] ||
    progressData.find((a) => !a.earned) ||
    null;

  // Trophy ring SVG calculations
  const totalCount = Math.max(allAchievements.length, 1);
  const progressRatio = earnedCount / totalCount;
  const ringRadius = 44;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressRatio);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 h-32 w-32 animate-pulse rounded-full bg-white/10"></div>
            <div className="mb-2 h-8 w-32 animate-pulse rounded bg-white/20"></div>
            <div className="h-4 w-48 animate-pulse rounded bg-white/10"></div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md"
              >
                <div className="mb-4 h-6 animate-pulse rounded bg-white/20"></div>
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <div
                      key={j}
                      className="h-16 animate-pulse rounded-xl bg-white/10"
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
      <MotionOrDiv className="mx-auto max-w-4xl" {...containerMotionProps}>
        {/* 1. Hero Trophy Section */}
        <MotionOrDiv className="mb-8 flex flex-col items-center" {...childMotionProps}>
          {/* Trophy with SVG ring glow */}
          <div className="relative mb-4 h-32 w-32">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <linearGradient
                  id="trophyRingGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#818CF8" />
                </linearGradient>
                <filter id="trophyGlow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Background track */}
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="6"
              />
              {/* Progress arc */}
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                stroke="url(#trophyRingGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 50 50)"
                filter="url(#trophyGlow)"
              />
              {/* Trophy icon via foreignObject */}
              <foreignObject x="22" y="22" width="56" height="56">
                <div className="flex h-full w-full items-center justify-center">
                  <FaTrophy className="h-10 w-10 text-cyan-300" style={{ fontSize: "2.5rem" }} />
                </div>
              </foreignObject>
            </svg>
          </div>

          {/* Stats text */}
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              {t("pages.achievements.earnedOf", {
                earned: earnedCount,
                total: allAchievements.length,
              })}
            </div>
            <div className="mb-3 text-sm text-white/70">
              {t("pages.achievements.earned")}
            </div>
            {/* Cyan progress bar */}
            <div className="mx-auto mb-2 h-2 w-48 rounded-full bg-white/15">
              <div
                className="h-2 rounded-full bg-cyan-400 transition-all"
                style={{
                  width: `${Math.round(progressRatio * 100)}%`,
                }}
              ></div>
            </div>
            <div className="text-sm text-cyan-300">
              {t("pages.achievements.xpFromAchievements", {
                xp: achievementXP.toLocaleString(),
              })}
            </div>
          </div>
        </MotionOrDiv>

        {/* 2. Next Achievement Card — neon amber glow */}
        <MotionOrDiv
          className="relative mb-8 overflow-hidden rounded-2xl border-2 border-amber-400/60 p-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.1) 100%), rgba(15, 10, 40, 0.85)",
            boxShadow: [
              "0 0 8px rgba(251,191,36,0.5)",
              "0 0 20px rgba(251,191,36,0.35)",
              "0 0 40px rgba(251,191,36,0.2)",
              "0 0 80px rgba(251,191,36,0.1)",
              "inset 0 0 20px rgba(251,191,36,0.05)",
            ].join(", "),
          }}
          {...childMotionProps}
        >
          {closestAchievement ? (() => {
            const progressPct = Math.min(
              Math.round((closestAchievement.progress || 0) * 100),
              100,
            );

            return (
              <div
                className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Trophy in dark muted circle */}
                <div className="flex-shrink-0">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10"
                    style={{ background: "rgba(40, 35, 60, 0.9)" }}
                  >
                    <FaTrophy style={{ fontSize: "2rem", color: "#fbbf24" }} />
                  </div>
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 text-sm text-white/60">
                    {t("pages.achievements.nextAchievement")}
                  </div>
                  <h3 className="mb-0.5 truncate text-lg font-bold text-white">
                    {getAchievementTitle(closestAchievement)}
                  </h3>
                  <p className="mb-3 text-sm text-white/50">
                    {getAchievementDescription(closestAchievement)}
                  </p>
                  {/* Progress bar with green glow */}
                  <div className="mb-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progressPct}%`,
                        background:
                          "linear-gradient(90deg, #22c55e, #4ade80)",
                        boxShadow: "0 0 8px rgba(74,222,128,0.5)",
                      }}
                    ></div>
                  </div>
                  <div className="text-sm font-medium text-green-400">
                    {(closestAchievement.progress || 0) >= 0.7
                      ? t("pages.achievements.almostThere")
                      : t("pages.achievements.keepGoing")}
                    {" — "}
                    <span className="text-amber-300">{progressPct}%</span>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="flex flex-col items-center py-4">
              <FaTrophy className="mb-2" style={{ fontSize: "2.5rem", color: "#fbbf24" }} />
              <div className="text-sm font-semibold text-green-300">
                {t("pages.achievements.allUnlocked")}
              </div>
            </div>
          )}
        </MotionOrDiv>

        {/* 3. All Achievements by Category */}
        <div className="space-y-4">
          {Object.entries(groupedAchievements).map(([category, achievements]) => {
            const CategoryReactIcon =
              categoryReactIcons[category] || FaTrophy;
            const ringColor =
              categoryRingColors[category] || categoryRingColors.milestone;
            const glowColor =
              categoryGlowColors[category] || categoryGlowColors.milestone;
            const earnedInCategory = achievements.filter((a) =>
              earnedMap.has(a.id),
            ).length;

            return (
              <MotionOrDiv
                key={category}
                className="overflow-hidden rounded-2xl border border-white/10"
                {...childMotionProps}
              >
                {/* Category header strip */}
                <div
                  className={`flex items-center gap-3 border-b border-white/10 px-5 py-3.5 ${isRTL ? "flex-row-reverse" : ""}`}
                  style={{
                    background: `linear-gradient(135deg, ${glowColor}28, rgba(10,8,30,0.55))`,
                  }}
                >
                  {/* Neon category icon */}
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: "rgba(10,8,30,0.8)",
                      border: `1.5px solid ${ringColor}`,
                      boxShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}55`,
                    }}
                  >
                    <CategoryReactIcon
                      style={{ fontSize: "1rem", color: ringColor }}
                    />
                  </div>
                  <h2 className="flex-1 font-semibold capitalize text-white">
                    {t("pages.achievements.categoryTitle", {
                      category: getCategoryLabel(category),
                    })}
                  </h2>
                  {/* Earned / total pill */}
                  <div className="flex-shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/55">
                    {earnedInCategory}/{achievements.length}
                  </div>
                </div>

                {/* Achievement card grid */}
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
                  {achievements.map((achievement) => {
                    const earned = earnedMap.get(achievement.id);
                    const progress = getProgressInfo(achievement.id);
                    const isEarned = !!earned;
                    const achRingColor =
                      categoryRingColors[achievement.category] ||
                      categoryRingColors.milestone;
                    const achGlowColor =
                      categoryGlowColors[achievement.category] ||
                      categoryGlowColors.milestone;

                    return (
                      <div
                        key={achievement.id}
                        className={`rounded-2xl border p-4 backdrop-blur-md ${isEarned ? "border-white/15" : "border-white/10 opacity-50"}`}
                        style={{
                          background: isEarned
                            ? "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(10,8,30,0.85) 100%)"
                            : "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(10,8,30,0.7) 100%)",
                        }}
                      >
                        {/* Icon with neon ring */}
                        <div className="relative mb-3 flex justify-center">
                          <div
                            className="flex h-16 w-16 items-center justify-center rounded-full"
                            style={
                              isEarned
                                ? {
                                    background: "rgba(10,8,30,0.9)",
                                    border: `2px solid ${achRingColor}`,
                                    boxShadow: [
                                      `0 0 8px ${achRingColor}`,
                                      `0 0 20px ${achGlowColor}`,
                                      `0 0 40px ${achGlowColor}66`,
                                      `inset 0 0 12px ${achGlowColor}33`,
                                    ].join(", "),
                                  }
                                : {
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1.5px solid rgba(255,255,255,0.1)",
                                  }
                            }
                          >
                            {isEarned ? (
                              (() => {
                                const IconComp = achievementIcons[achievement.icon] || Trophy;
                                return <IconComp className="h-7 w-7" style={{ color: achRingColor }} />;
                              })()
                            ) : (
                              <LockIcon className="h-5 w-5 text-white/30" />
                            )}
                          </div>
                          {/* Green checkmark badge */}
                          {isEarned && (
                            <div className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                          )}
                          {/* +XP amber badge */}
                          {isEarned && (
                            <div
                              className={`absolute -top-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${isRTL ? "-left-1" : "-right-6"}`}
                              style={{
                                background:
                                  "linear-gradient(135deg, #f59e0b, #d97706)",
                                boxShadow:
                                  "0 0 6px rgba(245,158,11,0.6)",
                              }}
                            >
                              +{achievement.points} XP
                            </div>
                          )}
                        </div>
                        {/* Title */}
                        <h4
                          className={`mb-1 line-clamp-1 text-center text-sm font-bold ${isEarned ? "text-white" : "text-white/50"}`}
                        >
                          {getAchievementTitle(achievement)}
                        </h4>
                        {/* Description */}
                        <p
                          className={`line-clamp-2 text-center text-xs ${isEarned ? "text-white/55" : "text-white/35"}`}
                        >
                          {getAchievementDescription(achievement)}
                        </p>
                        {/* timeAgo for earned */}
                        {isEarned && earned && (
                          <span className="mt-1 block text-center text-[10px] text-white/35">
                            {timeAgo(earned.earned_at)}
                          </span>
                        )}
                        {/* Muted XP text for unearned */}
                        {!isEarned && (
                          <span className="mt-1 block text-center text-[10px] text-white/30">
                            +{achievement.points} XP
                          </span>
                        )}
                        {/* Progress bar for in-progress unearned */}
                        {!isEarned &&
                          progress &&
                          progress.progress !== undefined &&
                          progress.progress > 0 && (
                            <div className="mt-2">
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(progress.progress * 100, 100)}%`,
                                    background: `linear-gradient(90deg, ${achRingColor}88, ${achRingColor})`,
                                  }}
                                />
                              </div>
                              <span className="mt-0.5 block text-center text-[10px] text-white/40">
                                {Math.round(progress.progress * 100)}%{" "}
                                {t("pages.achievements.complete")}
                              </span>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </MotionOrDiv>
            );
          })}
        </div>

        {/* Empty State */}
        {allAchievements.length === 0 && !isLoading && (
          <div className="py-12 text-center">
            <Trophy className="mx-auto mb-4 h-16 w-16 text-white/30" />
            <h3 className="mb-2 text-lg font-medium text-white">
              {t("pages.achievements.noAchievementsAvailable")}
            </h3>
            <p className="text-white/70">
              {t("pages.achievements.checkBackLater")}
            </p>
          </div>
        )}
      </MotionOrDiv>
    </div>
  );
}
