import React from "react";
import { Trophy, Star, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStreakWithAchievements } from "../../hooks/useStreakWithAchievements";

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

  useEffect(() => {
    // Update streak and check achievements if score is 80% or higher
    if (scorePercentage >= 80) {
      updateStreakWithAchievements.mutate();
    }
  }, [scorePercentage, updateStreakWithAchievements]);

  return (
    <div className="flex items-center justify-center min-h-screen w-screen fixed inset-0 p-2 sm:p-4 md:p-8 overflow-y-auto">
      <div className="relative w-full max-w-md mx-auto max-h-full my-auto p-3 sm:p-6 md:p-10 pt-8 sm:pt-12 md:pt-12 pb-3 sm:pb-6 md:pb-10 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm font-outfit animate-floatUp overflow-hidden">
        <div className="absolute top-1 sm:top-2 md:top-3 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 blur-xl opacity-20 animate-celebration" />
            <Trophy
              className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 text-yellow-500 animate-celebration"
              strokeWidth={1.5}
            />
          </div>
        </div>

        <div className="text-center mt-0.5 sm:mt-2 md:mt-4 space-y-1 sm:space-y-2.5 md:space-y-4">
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

          <div className="flex gap-1.5 sm:gap-2.5 md:gap-3 mt-1.5 sm:mt-2.5 md:mt-6">
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
