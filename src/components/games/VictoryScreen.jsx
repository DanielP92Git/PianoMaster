import React, { useEffect, useMemo, useState } from "react";
import { Trophy, Star, Sparkles, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStreakWithAchievements } from "../../hooks/useStreakWithAchievements";
import { useTotalPoints } from "../../hooks/useTotalPoints";

const VictoryScreen = ({
  score,
  totalPossibleScore,
  onReset,
  timedMode,
  timeRemaining,
  initialTime,
  onExit,
}) => {
  const navigate = useNavigate();
  const scorePercentage = (score / totalPossibleScore) * 100;
  const timeUsed = timedMode ? initialTime - timeRemaining : null;
  const updateStreakWithAchievements = useStreakWithAchievements();
  const { data: totalPointsData, isLoading: totalPointsLoading } =
    useTotalPoints();
  const [achievementBonus, setAchievementBonus] = useState(0);
  const pointsEarned = Math.max(score, 0) + achievementBonus;
  const basePoints = totalPointsData?.totalPoints || 0;
  const targetPoints = useMemo(
    () => basePoints + pointsEarned,
    [basePoints, pointsEarned]
  );

  useEffect(() => {
    if (scorePercentage >= 80) {
      updateStreakWithAchievements.mutate(undefined, {
        onSuccess: ({ newAchievements }) => {
          const bonus = newAchievements?.reduce(
            (sum, achievement) => sum + (achievement?.points || 0),
            0
          );
          if (bonus) {
            setAchievementBonus(bonus);
          }
        },
      });
    }
  }, [scorePercentage, updateStreakWithAchievements]);

  return (
    <div className="flex items-center justify-center min-h-screen w-screen fixed inset-0 p-2 sm:p-4 md:p-8 overflow-y-auto">
      <div className="relative w-full max-w-md mx-auto max-h-full my-auto p-3 sm:p-6 md:p-10 pt-8 sm:pt-12 md:pt-12 pb-3 sm:pb-6 md:pb-10 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm font-outfit animate-floatUp overflow-hidden">
        <div className="absolute top-1 sm:top-2 md:top-3 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 blur-xl opacity-20 animate-celebration" />
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white/80 shadow-xl bg-black/20">
              <video
                src="/avatars/mozart_happy.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
                aria-label="Mozart celebration animation"
              />
            </div>
          </div>
        </div>

        <div className="text-center mt-16 sm:mt-20 md:mt-24 space-y-1 sm:space-y-2.5 md:space-y-4">
          {/* Animated victory title with sparkle effects */}
          <div className="relative py-0.5 sm:py-1">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 blur-lg opacity-30 animate-pulse"></div>
            <h2 className="relative text-xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-red-600">
              Victory!
            </h2>
            {/* Floating sparkles */}
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute -top-2 sm:-top-4 left-1/4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-400 rounded-full animate-ping delay-150"></div>
            <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-ping delay-300"></div>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2 text-gray-600">
            <Sparkles className="w-3 h-3 sm:w-5 sm:h-5 text-yellow-500" />
            <p className="text-xs sm:text-base md:text-lg">
              Final Score: {score}/{totalPossibleScore}
            </p>
            <Sparkles className="w-3 h-3 sm:w-5 sm:h-5 text-yellow-500" />
          </div>

          {timedMode && timeUsed !== null && (
            <div className="text-gray-600 text-xs sm:text-base">
              <p>
                Time used: {Math.floor(timeUsed / 60)}:
                {(timeUsed % 60).toString().padStart(2, "0")}
              </p>
            </div>
          )}

          {/* {scorePercentage >= 80 && (
            <div className="relative py-1 sm:py-2 md:py-4 px-1.5 sm:px-3 md:px-6 rounded-lg sm:rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient bg-[length:200%_200%] opacity-90"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              <div className="relative flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2">
                <Star className="w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-300 animate-spin" />
                <p className="text-white font-bold text-xs sm:text-base md:text-lg drop-shadow-lg">
                  Master Achievement Unlocked!
                </p>
                <Star className="w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-300 animate-spin" />
              </div>
              <div className="absolute top-1 left-4 w-1 h-1 bg-yellow-300 rounded-full animate-ping delay-100"></div>
              <div className="absolute bottom-1 right-6 w-1 h-1 bg-pink-300 rounded-full animate-ping delay-200"></div>
              <div className="absolute top-2 right-12 w-1 h-1 bg-blue-300 rounded-full animate-ping delay-75"></div>
            </div>
          )} */}

          {!totalPointsLoading && (
            <PointsCelebration
              basePoints={basePoints}
              targetPoints={targetPoints}
              immediateGain={pointsEarned}
            />
          )}

          <div className="flex gap-1.5 sm:gap-2.5 md:gap-3 mt-1.5 sm:mt-3 md:mt-6">
            <button
              onClick={onReset}
              className="flex-1 py-1.5 sm:py-2 md:py-3 px-1.5 sm:px-3 md:px-6 text-xs sm:text-sm md:text-lg font-semibold text-white rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Play Again
            </button>
            <button
              onClick={() => {
                if (onExit) {
                  onExit();
                } else {
                  // Fallback to navigate to practice modes
                  navigate("/practice-modes");
                }
              }}
              className="flex-1 py-1.5 sm:py-2 md:py-3 px-1.5 sm:px-3 md:px-6 text-xs sm:text-sm md:text-lg font-semibold text-gray-700 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VictoryScreen;

const useCountUp = (start, end, duration = 1400) => {
  const [value, setValue] = useState(start);

  useEffect(() => {
    if (start === undefined || end === undefined) return;
    let frame;
    const startTime = performance.now();
    const change = end - start;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + change * easedProgress));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [start, end, duration]);

  return value;
};

function PointsCelebration({
  basePoints = 0,
  targetPoints = 0,
  immediateGain,
}) {
  const animatedValue = useCountUp(basePoints, targetPoints);
  const gain = immediateGain || targetPoints - basePoints;

  if (gain <= 0) return null;

  return (
    <div className="relative mt-3 sm:mt-5 md:mt-6">
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/40 via-pink-200/30 to-indigo-200/40 blur-lg opacity-70" />
      <div className="relative p-3 sm:p-4 md:p-5 rounded-2xl bg-white/90 border border-white/60 shadow-lg flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-inner">
          <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">
            Total Points
          </p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {animatedValue.toLocaleString()}
          </p>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-xs text-gray-500">Points earned</p>
          <p className="text-lg sm:text-xl font-bold text-emerald-500">
            +{gain.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
