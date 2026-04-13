import { useTranslation } from "react-i18next";
import { HoldRing } from "./HoldRing";

/**
 * Interactive tap area component for rhythm games.
 * Large, prominent button for tapping (quarter notes) and holding (half/whole notes).
 *
 * Hold mode is activated when isHoldNote=true. In hold mode:
 * - Shows "HOLD" label instead of "TAP HERE"
 * - Uses pointer events (onPointerDown/Up/Cancel) instead of onClick
 * - Renders HoldRing SVG overlay for progress feedback
 * - Applies touch-action: none to prevent scroll interference during hold
 *
 * The existing onClick path for quarter notes is completely unchanged when isHoldNote=false.
 */
export function TapArea({
  onTap,
  feedback = null,
  isActive = true,
  title,
  className = "",
  // Hold mode props (all optional — backward-compatible)
  isHoldNote = false,
  onPressStart,
  onPressEnd,
  holdRingRef,
  isHoldComplete = false,
  reducedMotion = false,
  holdFeedbackLabel,
}) {
  const { t } = useTranslation("common");
  const accuracyLabels = {
    PERFECT: t("games.metronomeTrainer.tapArea.accuracy.perfect"),
    GOOD: t("games.metronomeTrainer.tapArea.accuracy.good"),
    FAIR: t("games.metronomeTrainer.tapArea.accuracy.fair"),
    MISS: t("games.metronomeTrainer.tapArea.accuracy.miss"),
  };

  const displayTitle =
    title ??
    (isHoldNote
      ? t("games.metronomeTrainer.tapArea.holdHere")
      : t("games.metronomeTrainer.tapArea.tapHere"));

  // Resolve feedback label: holdFeedbackLabel overrides standard accuracy label
  const feedbackLabel = holdFeedbackLabel
    ? holdFeedbackLabel
    : feedback
      ? `${accuracyLabels[feedback.accuracy] || feedback.accuracy}! +${feedback.points}`
      : null;

  return (
    <button
      onPointerDown={
        isHoldNote && isActive
          ? (e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              onPressStart?.(e);
            }
          : undefined
      }
      onPointerUp={
        isHoldNote && isActive ? (e) => onPressEnd?.(e) : undefined
      }
      onPointerCancel={
        isHoldNote && isActive ? (e) => onPressEnd?.(e) : undefined
      }
      onClick={!isHoldNote && isActive ? onTap : undefined}
      disabled={!isActive}
      style={isHoldNote ? { touchAction: "none" } : undefined}
      className={`relative flex h-full max-h-96 w-full max-w-md flex-col items-center justify-center rounded-3xl bg-white/10 font-bold text-white backdrop-blur-md transition-all duration-200 ${className} ${
        isActive
          ? "cursor-pointer hover:bg-white/20 active:scale-95"
          : "cursor-not-allowed opacity-50"
      } `}
    >
      {/* HoldRing overlay — only rendered in hold mode */}
      {isHoldNote && (
        <HoldRing
          ringRef={holdRingRef}
          isComplete={isHoldComplete}
          reducedMotion={reducedMotion}
        />
      )}

      <div className="relative z-10 mb-4 text-5xl sm:text-6xl">
        {displayTitle}
      </div>
      {feedbackLabel && (
        <div
          className={`relative z-10 animate-pulse text-3xl font-bold sm:text-4xl ${
            feedback?.accuracy === "PERFECT"
              ? "text-green-400"
              : feedback?.accuracy === "GOOD"
                ? "text-yellow-400"
                : feedback?.accuracy === "FAIR"
                  ? "text-orange-400"
                  : "text-red-400"
          } `}
        >
          {feedbackLabel}
        </div>
      )}
    </button>
  );
}

export default TapArea;
