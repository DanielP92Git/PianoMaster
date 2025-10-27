import React from "react";
import { FaClock, FaExclamationTriangle } from "react-icons/fa";

const GameOverScreen = ({ score, totalQuestions, timeRanOut, onReset }) => {
  const scorePercentage = Math.round((score / (totalQuestions * 10)) * 100);
  const reason = timeRanOut ? "Time's up!" : "Score too low";

  return (
    <div className="relative w-full max-w-md mx-auto p-8 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm font-outfit animate-floatUp">
      <div className="text-center mt-2 space-y-4">
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 animate-shimmer bg-[length:200%_auto]">
          Game Over
        </h2>

        <div className="flex items-center justify-center gap-2 text-gray-600">
          <p className="text-lg">
            Final Score: {score}/{totalQuestions * 10}
          </p>
        </div>

        <div className="py-3 px-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
          <div className="flex items-center justify-center gap-2 text-red-700 font-semibold">
            {timeRanOut ? (
              <FaClock className="text-red-600" />
            ) : (
              <FaExclamationTriangle className="text-red-600" />
            )}
            <p>{reason}</p>
          </div>
          {timeRanOut ? (
            <p className="text-gray-600 text-sm mt-1">
              You answered {totalQuestions} out of 10 questions
            </p>
          ) : (
            <p className="text-gray-600 text-sm mt-1">
              You need at least 50% correct answers to win
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onReset}
            className="flex-1 py-3 px-6 text-lg font-semibold text-white rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/notes-master-mode")}
            className="flex-1 py-3 px-6 text-lg font-semibold text-gray-700 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;
