import React, { useMemo } from "react";
import { Trophy, Star } from "lucide-react";
import {
  calculatePitchAccuracy,
  calculateRhythmAccuracy,
  calculateOverallScore,
  getPerformanceRating,
  getEncouragingMessage,
} from "../utils/scoreCalculator";

/**
 * FeedbackSummary Component
 * Displays comprehensive performance feedback after completing a sight reading pattern
 * Based on PRD lines 354-438
 */
export function FeedbackSummary({
  performanceResults,
  summaryStats,
  onTryAgain,
  onNextPattern,
  nextButtonLabel = "Next Pattern",
  nextButtonDisabled = false,
  showNextButton = true,
}) {
  // Calculate scores
  const fallbackPitchAccuracy = useMemo(
    () => calculatePitchAccuracy(performanceResults),
    [performanceResults]
  );

  const fallbackRhythmAccuracy = useMemo(
    () => calculateRhythmAccuracy(performanceResults),
    [performanceResults]
  );

  const pitchAccuracy =
    summaryStats?.pitchAccuracy ?? fallbackPitchAccuracy ?? 0;
  const rhythmAccuracy =
    summaryStats?.rhythmAccuracy ?? fallbackRhythmAccuracy ?? 0;
  const overallScore =
    summaryStats?.overallScore ??
    calculateOverallScore(pitchAccuracy, rhythmAccuracy);

  const rating = useMemo(
    () => getPerformanceRating(overallScore),
    [overallScore]
  );

  const encouragingMessage = useMemo(
    () => getEncouragingMessage(overallScore),
    [overallScore]
  );

  return (
    <div className="w-full ">
      <div className="relative rounded-2xl bg-white/95 w-full p-5 sm:p-1">
        {/* Centered content: Trophy, Stars, Rating, Message, Actions */}
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Trophy Icon */}

          {/* Rating Title */}
          <h2 className="text-xl sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500">
            {rating.label}
          </h2>

          {/* Star Rating */}
          <div className="flex items-center gap-1.5">
            {[...Array(3)].map((_, index) => (
              <Star
                key={index}
                className={`w-5 h-5 sm:w-4 sm:h-4 ${
                  index < rating.stars
                    ? "fill-yellow-400 text-yellow-500"
                    : "text-gray-300"
                }`}
                strokeWidth={1.3}
              />
            ))}
          </div>

          {/* Encouraging Message */}
          <p className="text-sm sm:text-base text-gray-600 max-w-md px-2">
            {encouragingMessage}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row w-full max-w-md gap-2.5 mt-2">
            <button
              onClick={onTryAgain}
              className="flex-1 py-2.5 px-5 text-sm font-semibold text-white rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
            >
              Try Again
            </button>
            {showNextButton && onNextPattern && (
              <button
                onClick={onNextPattern}
                disabled={nextButtonDisabled}
                className={`flex-1 py-2.5 px-5 text-sm font-semibold text-white rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${
                  nextButtonDisabled ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {nextButtonLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
