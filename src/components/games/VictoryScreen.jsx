import React from "react";
import { Trophy, Star, Sparkles } from "lucide-react";
import { streakService } from "../../services/streakService";
import { useEffect } from "react";

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

  useEffect(() => {
    // Update streak if score is 80% or higher
    if (scorePercentage >= 80) {
      streakService.updateStreak();
    }
  }, [scorePercentage]);

  return (
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
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 animate-shimmer bg-[length:200%_auto]">
          Victory!
        </h2>

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
          <div className="py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
            <div className="flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-indigo-600" />
              <p className="text-indigo-700 font-semibold">
                Master Achievement Unlocked!
              </p>
              <Star className="w-5 h-5 text-indigo-600" />
            </div>
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
  );
};

export default VictoryScreen;
