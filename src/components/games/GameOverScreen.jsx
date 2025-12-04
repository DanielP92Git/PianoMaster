import React from "react";
import { FaClock, FaExclamationTriangle } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const GameOverScreen = ({ score, totalQuestions, timeRanOut, onReset }) => {
  const { t } = useTranslation("common");
  const scorePercentage = Math.round((score / (totalQuestions * 10)) * 100);
  const reason = timeRanOut
    ? t("games.gameOver.timeUp")
    : t("games.gameOver.scoreTooLow");

  return (
    <div className="relative w-full max-w-2xl mx-auto p-6 sm:p-8 my-auto rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-[0_20px_60px_rgb(0,0,0,0.3)] backdrop-blur-sm font-outfit animate-floatUp">
      {/* Sad Beethoven Animation */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <video
            src="/avatars/beethoven_sad.mp4"
            className="w-42 h-42 sm:w-52 sm:h-52 object-cover rounded-3xl drop-shadow-2xl border border-gray-200 bg-black/60 animate-wiggle"
            autoPlay
            muted
            loop
            playsInline
            aria-label="Sad Beethoven animation"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div className="text-center space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center gap-2 text-gray-700">
          <p className="text-xl sm:text-2xl font-semibold">
            {t("games.gameOver.finalScore")}: {score}/{totalQuestions * 10}
          </p>
        </div>

        <div className="py-4 px-6 rounded-2xl bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-2 border-red-200 shadow-lg">
          <div className="flex items-center justify-center gap-3 text-red-700 font-bold text-lg">
            {timeRanOut ? (
              <FaClock className="text-red-600 text-2xl animate-pulse" />
            ) : (
              <FaExclamationTriangle className="text-red-600 text-2xl animate-bounce" />
            )}
            <p>{reason}</p>
          </div>
          {timeRanOut ? (
            <p className="text-gray-700 text-base mt-2">
              {t("games.gameOver.timeUpMessage", { count: totalQuestions })}
            </p>
          ) : (
            <p className="text-gray-700 text-base mt-2">
              {t("games.gameOver.scoreTooLowMessage")}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
          <button
            onClick={onReset}
            className="flex-1 py-2 px-4 text-lg sm:text-lg font-bold text-white rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transform transition-all duration-200 hover:scale-105 hover:shadow-2xl focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none shadow-xl"
          >
            {t("games.gameOver.tryAgain")}
          </button>
          <button
            onClick={() => (window.location.href = "/notes-master-mode")}
            className="flex-1 py-2 px-4 text-lg sm:text-lg font-bold text-gray-800 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transform transition-all duration-200 hover:scale-105 hover:shadow-2xl focus:ring-4 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none shadow-xl"
          >
            {t("games.gameOver.exit")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;
