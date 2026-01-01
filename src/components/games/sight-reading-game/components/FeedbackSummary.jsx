import React, { useMemo } from "react";
import { Star } from "lucide-react";
import {
  calculatePitchAccuracy,
  calculateRhythmAccuracy,
  calculateOverallScore,
  getPerformanceRating,
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

  return (
    <div className="w-full">
      <div className="relative w-full rounded-2xl bg-white/95 p-2.5 sm:p-3">
        {/* Centered content: Trophy, Stars, Rating, Message, Actions */}
        <div className="flex flex-col items-center space-y-1.5 text-center sm:space-y-1">
          {/* Trophy Icon */}

          {/* Rating Title */}
          <h2 className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 bg-clip-text text-base font-bold text-transparent sm:text-lg">
            {rating.label}
          </h2>

          {/* Star Rating */}
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, index) => (
              <Star
                key={index}
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                  index < rating.stars
                    ? "fill-yellow-400 text-yellow-500"
                    : "text-gray-300"
                }`}
                strokeWidth={1.3}
              />
            ))}
          </div>



          {/* Action Buttons */}
          <div className="mt-0.5 flex w-full max-w-md flex-col gap-1.5 sm:mt-1 sm:flex-row sm:gap-2">
            <button
              onClick={onTryAgain}
              className="flex-1 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-all duration-200 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 sm:px-4 sm:py-2 sm:text-xs"
            >
              Try Again
            </button>
            {showNextButton && onNextPattern && (
              <button
                onClick={onNextPattern}
                disabled={nextButtonDisabled}
                className={`flex-1 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-all duration-200 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 sm:px-4 sm:py-2 sm:text-xs ${
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
