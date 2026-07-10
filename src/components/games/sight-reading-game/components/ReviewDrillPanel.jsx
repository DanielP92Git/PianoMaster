import React from "react";
import { useTranslation } from "react-i18next";
import { GameActionButton } from "../../shared/hud/GameActionButton";
import { FEEDBACK_COLORS } from "../constants/feedbackPalette";

/**
 * ReviewDrillPanel
 *
 * Presentational review-mistakes UI (PRAC-04). The state machine lives in `useReviewDrill`
 * (Task 2) — this component only receives props and calls callbacks. Mirrors FeedbackSummary's
 * glass card shell and GameActionButton conventions (interfaces block, 02-03-PLAN.md).
 *
 * Props:
 * - current, total: 1-based progress (e.g. "2 of 5")
 * - targetNote: the current mistake's target pitch label (already formatted for display)
 * - instruction: static instruction copy override (optional — falls back to i18n default)
 * - onPlayTarget, onSkip, onExit: callbacks wired to useReviewDrill's playCurrentTarget/skip
 *   and the parent's "leave the drill" handler
 * - isComplete: when true, renders the done state + primary exit CTA
 */
export function ReviewDrillPanel({
  current,
  total,
  targetNote,
  instruction,
  onPlayTarget,
  onSkip,
  onExit,
  isComplete = false,
}) {
  const { t } = useTranslation("common");

  return (
    <div className="w-full">
      <div className="relative w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-md sm:px-5 sm:py-3.5">
        <div className="flex flex-col items-center gap-2 text-center sm:gap-2.5">
          <h2
            className="text-xl font-extrabold italic text-white sm:text-2xl"
            style={{
              textShadow:
                "0 0 20px rgba(236, 72, 153, 0.6), 0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            {t("sightReading.review.title")}
          </h2>

          {!isComplete && (
            <>
              <span className="text-sm font-semibold tabular-nums text-white/80">
                {t("sightReading.review.progress", {
                  current,
                  total,
                  defaultValue: "{{current}} of {{total}}",
                })}
              </span>

              <p className="text-sm text-white/70">
                {instruction ?? t("sightReading.review.instruction")}
              </p>

              {targetNote && (
                <span
                  className="rounded-full px-3 py-1 text-lg font-bold text-white"
                  style={{
                    backgroundColor: `${FEEDBACK_COLORS.wrongPitch}33`,
                    border: `1px solid ${FEEDBACK_COLORS.wrongPitch}`,
                  }}
                >
                  {targetNote}
                </span>
              )}

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={onPlayTarget}
                  className="text-xs font-medium text-white/80 underline-offset-2 hover:text-white hover:underline"
                >
                  {t("sightReading.review.playIt")}
                </button>
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-xs font-medium text-white/80 underline-offset-2 hover:text-white hover:underline"
                >
                  {t("sightReading.review.skip")}
                </button>
              </div>
            </>
          )}

          {isComplete && (
            <>
              <p className="text-sm font-semibold text-white/90">
                {t("sightReading.review.done")}
              </p>
              <div className="flex w-full max-w-xs gap-2.5">
                <GameActionButton
                  tone="advance"
                  onClick={onExit}
                  className="flex-1"
                >
                  {t("sightReading.review.exit")}
                </GameActionButton>
              </div>
            </>
          )}

          {!isComplete && (
            <button
              type="button"
              onClick={onExit}
              className="text-xs font-medium text-white/60 underline-offset-2 hover:text-white/90 hover:underline"
            >
              {t("sightReading.review.exit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewDrillPanel;
