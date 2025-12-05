import { useEffect, useMemo, useState } from "react";
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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden p-2 sm:p-4">
      {/* Main content container - fits within viewport */}
      <div className="flex w-full max-w-md flex-col items-center">
        {/* Video avatar */}
        <div className="relative z-10 -mb-2 sm:-mb-3">
          <div
            className="overflow-hidden rounded-2xl bg-white shadow-xl"
            style={{
              width: "clamp(130px, 15vh, 160px)",
              height: "clamp(130px, 15vh, 160px)",
            }}
          >
            <video
              src="/avatars/mozart_happy.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              aria-label="Mozart celebration animation"
            />
          </div>
        </div>

        {/* Content area */}
        <div className="w-full space-y-1.5 px-2 pt-4 text-center sm:space-y-2 sm:px-4 sm:pt-2">
          {/* Victory title */}
          <h2 className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
            Victory!
          </h2>

          {/* Score display */}
          <p className="text-sm text-white/90 sm:text-base">
            Final Score: {score}/{totalPossibleScore}
          </p>

          {/* Timed mode info */}
          {timedMode && timeUsed !== null && (
            <p className="text-xs text-white/70">
              Time used: {Math.floor(timeUsed / 60)}:
              {(timeUsed % 60).toString().padStart(2, "0")}
            </p>
          )}

          {/* Points celebration */}
          {!totalPointsLoading && (
            <PointsCelebration
              basePoints={basePoints}
              targetPoints={targetPoints}
              immediateGain={pointsEarned}
            />
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1 sm:gap-3 sm:pt-2">
            <button
              onClick={() => {
                if (onExit) {
                  onExit();
                } else {
                  navigate("/practice-modes");
                }
              }}
              className="flex-1 transform rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:scale-[1.02] hover:from-gray-200 hover:to-gray-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 sm:py-2.5 sm:text-base"
            >
              Exit
            </button>
            <button
              onClick={onReset}
              className="flex-1 transform rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:py-2.5 sm:text-base"
            >
              Play Again
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
    <div className="relative mt-1 sm:mt-2">
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/40 via-pink-200/30 to-indigo-200/40 opacity-70 blur-lg" />
      <div className="relative flex items-center justify-between gap-2 rounded-xl border-white/60 bg-white/90 px-3 py-2 shadow-lg sm:px-4 sm:py-2.5">
        <div className="text-left">
          <p className="text-[10px] text-gray-500 sm:text-xs">Points earned</p>
          <p className="text-sm font-bold text-emerald-500 sm:text-base">
            +{gain.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-gray-500 sm:text-xs">
            Total Points
          </p>
          <p className="text-lg font-black tracking-tight text-gray-900 sm:text-xl">
            {animatedValue.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
