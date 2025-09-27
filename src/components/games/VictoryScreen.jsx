import React from "react";
import { Trophy, Star, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useStreakWithAchievements } from "../../hooks/useStreakWithAchievements";

const VictoryScreen = ({
  score,
  totalPossibleScore,
  onReset,
  timedMode,
  timeRemaining,
  initialTime,
}) => {
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
    <div className="flex items-center justify-center h-screen fixed inset-0 p-4">
      <div className="relative w-full max-w-md mx-auto p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm font-outfit animate-floatUp">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 blur-xl opacity-20 animate-celebration" />
            <Trophy
              className="w-12 h-12 text-yellow-500 animate-celebration"
              strokeWidth={1.5}
            />
          </div>
        </div>

        <div className="text-center mt-8 space-y-4">
          {/* Animated victory title with sparkle effects */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 blur-lg opacity-30 animate-pulse"></div>
            <h2 className="relative text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-red-600">
              Victory!
            </h2>
            {/* Floating sparkles */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute -top-4 left-1/4 w-2 h-2 bg-pink-400 rounded-full animate-ping delay-150"></div>
            <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-purple-400 rounded-full animate-ping delay-300"></div>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <p className="text-lg">
              Final Score: {score}/{totalPossibleScore}
            </p>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>

          {timedMode && timeUsed !== null && (
            <div className="text-gray-600">
              <p>
                Time used: {Math.floor(timeUsed / 60)}:
                {(timeUsed % 60).toString().padStart(2, "0")}
              </p>
            </div>
          )}

          {scorePercentage >= 80 && (
            <div className="relative py-4 px-6 rounded-xl overflow-hidden">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient bg-[length:200%_200%] opacity-90"></div>
              {/* Sparkle overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              <div className="relative flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-yellow-300 animate-spin" />
                <p className="text-white font-bold text-lg drop-shadow-lg">
                  Master Achievement Unlocked!
                </p>
                <Star className="w-6 h-6 text-yellow-300 animate-spin" />
              </div>
              {/* Floating particles */}
              <div className="absolute top-1 left-4 w-1 h-1 bg-yellow-300 rounded-full animate-ping delay-100"></div>
              <div className="absolute bottom-1 right-6 w-1 h-1 bg-pink-300 rounded-full animate-ping delay-200"></div>
              <div className="absolute top-2 right-12 w-1 h-1 bg-blue-300 rounded-full animate-ping delay-75"></div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onReset}
              className="flex-1 py-3 px-6 text-lg font-semibold text-white rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Play Again
            </button>
            <button
              onClick={() => (window.location.href = "/note-recognition-mode")}
              className="flex-1 py-3 px-6 text-lg font-semibold text-gray-700 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
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
