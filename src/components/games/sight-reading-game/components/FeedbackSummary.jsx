import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { GameActionButton } from "../../shared/hud/GameActionButton";
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
  const { t } = useTranslation("common");

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
      <div className="relative w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-md sm:px-5 sm:py-3.5">
        <div className="flex flex-col items-center gap-2 text-center sm:gap-2.5">
          {/* Rating Title */}
          <h2
            className="text-xl font-extrabold italic text-white sm:text-2xl"
            style={{
              textShadow:
                "0 0 20px rgba(236, 72, 153, 0.6), 0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            {rating.labelKey
              ? t(rating.labelKey, { defaultValue: rating.label })
              : rating.label}
          </h2>

          {/* Star Rating */}
          <div className="flex items-center gap-1.5">
            {[...Array(3)].map((_, index) => (
              <Star
                key={index}
                className={`h-7 w-7 sm:h-8 sm:w-8 ${
                  index < rating.stars
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-white/10 text-white/30"
                }`}
                style={
                  index < rating.stars
                    ? { filter: "drop-shadow(0 0 6px rgba(250, 204, 21, 0.5))" }
                    : undefined
                }
                strokeWidth={1.5}
              />
            ))}
          </div>

          {/* Action Buttons — shared GameActionButton (single source of truth) */}
          <div className="flex w-full max-w-xs gap-2.5">
            <GameActionButton
              tone="retry"
              onClick={onTryAgain}
              className="flex-1"
            >
              {t("sightReading.tryAgain")}
            </GameActionButton>
            {showNextButton && onNextPattern && (
              <GameActionButton
                tone="advance"
                onClick={onNextPattern}
                disabled={nextButtonDisabled}
                className="flex-1"
              >
                {nextButtonLabel}
              </GameActionButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
