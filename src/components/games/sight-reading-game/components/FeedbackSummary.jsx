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
  exerciseLabel = null,
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
    <div className="w-full">
      <div className="relative w-full rounded-2xl bg-white/95 p-4 sm:p-2">
        {/* Centered content: Trophy, Stars, Rating, Message, Actions */}
        <div className="flex flex-col items-center space-y-2.5 text-center sm:space-y-1">
          {/* Trophy Icon */}

          {/* Rating Title */}
          <h2 className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
            {rating.label}
          </h2>

          {/* Star Rating */}
          <div className="flex items-center gap-1.5">
            {[...Array(3)].map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  index < rating.stars
                    ? "fill-yellow-400 text-yellow-500"
                    : "text-gray-300"
                }`}
                strokeWidth={1.3}
              />
            ))}
          </div>

          {/* Encouraging Message */}
          <p className="max-w-md px-2 text-xs text-gray-600 sm:text-sm">
            {encouragingMessage}
          </p>

          {exerciseLabel ? (
            <p className="text-[11px] font-semibold text-gray-700 sm:text-xs">
              {exerciseLabel}
            </p>
          ) : null}

          {/* Action Buttons */}
          <div className="mt-1 flex w-full max-w-md flex-col gap-2 sm:mt-2 sm:flex-row sm:gap-2.5">
            <button
              onClick={onTryAgain}
              className="flex-1 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Try Again
            </button>
            {showNextButton && onNextPattern && (
              <button
                onClick={onNextPattern}
                disabled={nextButtonDisabled}
                className={`flex-1 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-5 sm:py-2.5 sm:text-sm ${
                  nextButtonDisabled ? "cursor-not-allowed opacity-60" : ""
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
