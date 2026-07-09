import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { GameActionButton } from "../../shared/hud/GameActionButton";
import {
  calculatePitchAccuracy,
  calculateRhythmAccuracy,
  calculateOverallScore,
  getPerformanceRating,
  getDetailedBreakdown,
} from "../utils/scoreCalculator";
import { FEEDBACK_COLORS } from "../constants/feedbackPalette";

/**
 * A single labeled accuracy bar (Pitch / Rhythm).
 */
function AccuracyBar({ label, value, color }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full">
      <div className="mb-0.5 flex items-center justify-between text-xs font-semibold text-white/80">
        <span>{label}</span>
        <span className="tabular-nums text-white">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/**
 * FeedbackSummary Component
 * Post-exercise feedback, deliberately minimal for an 8-year-old audience: rating +
 * stars, Notes/Rhythm accuracy bars, and a per-status note breakdown (only statuses
 * that occurred). Surfaces the accuracy the game already computes (summaryStats).
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

  // Calculate scores (fall back to raw results if summaryStats not supplied)
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

  const breakdown = useMemo(
    () => getDetailedBreakdown(performanceResults),
    [performanceResults]
  );

  // Only render breakdown chips for statuses that actually occurred, to stay compact.
  const breakdownChips = useMemo(
    () =>
      [
        {
          key: "correct",
          value: breakdown.correct,
          color: FEEDBACK_COLORS.correct,
        },
        {
          key: "tooEarly",
          value: breakdown.tooEarly,
          color: FEEDBACK_COLORS.early,
        },
        {
          key: "tooLate",
          value: breakdown.tooLate,
          color: FEEDBACK_COLORS.late,
        },
        {
          key: "missed",
          value: breakdown.missed,
          color: FEEDBACK_COLORS.missed,
        },
        {
          key: "wrongNotes",
          value: breakdown.wrongPitch,
          color: FEEDBACK_COLORS.wrongPitch,
        },
      ].filter((chip) => chip.value > 0),
    [breakdown]
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

          {/* Pitch / Rhythm accuracy bars */}
          <div className="flex w-full max-w-xs flex-col gap-2">
            <AccuracyBar
              label={t("sightReading.summary.pitch")}
              value={pitchAccuracy}
              color={FEEDBACK_COLORS.correct}
            />
            <AccuracyBar
              label={t("sightReading.summary.rhythm")}
              value={rhythmAccuracy}
              color="#818cf8"
            />
          </div>

          {/* Per-status note breakdown */}
          {breakdownChips.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {breakdownChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: chip.color }}
                    aria-hidden="true"
                  />
                  <span className="tabular-nums text-white">{chip.value}</span>
                  {t(`sightReading.summary.${chip.key}`)}
                </span>
              ))}
            </div>
          )}

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
