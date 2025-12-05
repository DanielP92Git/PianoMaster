import React from "react";
import { FaClock, FaExclamationTriangle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { MoveDownLeftIcon, TrendingDownIcon } from "lucide-react";

const GameOverScreen = ({ score, totalQuestions, timeRanOut, onReset }) => {
  const { t } = useTranslation("common");
  const reason = timeRanOut
    ? t("games.gameOver.timeUp")
    : t("games.gameOver.scoreTooLow");

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden p-3 sm:p-4">
      <div className="flex w-full max-w-md flex-col items-center">
        {/* Sad Beethoven Animation */}
        <div className="relative z-10 -mb-3 flex-shrink-0 sm:-mb-4">
          <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-xl sm:h-28 sm:w-28">
            <video
              src="/avatars/beethoven_sad.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              aria-label="Sad Beethoven animation"
            />
          </div>
        </div>

        {/* Content card */}
        <div className="w-full space-y-3 rounded-2xl  px-4 pb-4 pt-6 text-center  sm:space-y-4 sm:px-6 sm:pb-5 sm:pt-8">
          {/* Score */}
          <p className="text-lg font-semibold text-white sm:text-xl">
            {t("games.gameOver.finalScore")}: {score}/{totalQuestions * 10}
          </p>

          {/* Reason message */}
          <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-base font-bold text-red-700 sm:text-lg">
              {timeRanOut ? (
                <FaClock className="flex-shrink-0 text-lg text-red-700 sm:text-xl" />
              ) : (
                <TrendingDownIcon className="flex-shrink-0 text-lg text-red-700 sm:text-xl" />
              )}
              <span>{reason}</span>
            </div>
            <p className="mt-1.5 text-sm text-gray-600 sm:text-base">
              {timeRanOut
                ? t("games.gameOver.timeUpMessage", { count: totalQuestions })
                : t("games.gameOver.scoreTooLowMessage")}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:gap-3 sm:pt-2">
            <button
              onClick={onReset}
              className="w-full transform rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:flex-1 sm:py-2.5 sm:text-base"
            >
              {t("games.gameOver.tryAgain")}
            </button>
            <button
              onClick={() => (window.location.href = "/notes-master-mode")}
              className="w-full transform rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:scale-[1.02] hover:from-gray-200 hover:to-gray-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 sm:flex-1 sm:py-2.5 sm:text-base"
            >
              {t("games.gameOver.exit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;
