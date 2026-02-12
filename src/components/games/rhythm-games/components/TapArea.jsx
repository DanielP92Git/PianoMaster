import { useTranslation } from "react-i18next";

/**
 * Interactive tap area component for rhythm games
 * Large, prominent button for tapping - Simplified design
 */
export function TapArea({
  onTap,
  feedback = null,
  isActive = true,
  title,
  className = "",
}) {
  const { t } = useTranslation("common");
  const accuracyLabels = {
    PERFECT: t("games.metronomeTrainer.tapArea.accuracy.perfect"),
    GOOD: t("games.metronomeTrainer.tapArea.accuracy.good"),
    FAIR: t("games.metronomeTrainer.tapArea.accuracy.fair"),
    MISS: t("games.metronomeTrainer.tapArea.accuracy.miss"),
  };
  const displayTitle = title ?? t("games.metronomeTrainer.tapArea.tapHere");

  return (
    <button
      onClick={isActive ? onTap : undefined}
      disabled={!isActive}
      className={`flex h-full max-h-96 w-full max-w-md flex-col items-center justify-center rounded-3xl bg-white/10 font-bold text-white backdrop-blur-md transition-all duration-200 ${className} ${
        isActive
          ? "cursor-pointer hover:bg-white/20 active:scale-95"
          : "cursor-not-allowed opacity-50"
      } `}
    >
      <div className="mb-4 text-5xl sm:text-6xl">{displayTitle}</div>
      {feedback && (
        <div
          className={`animate-pulse text-3xl font-bold sm:text-4xl ${
            feedback.accuracy === "PERFECT"
              ? "text-green-400"
              : feedback.accuracy === "GOOD"
                ? "text-yellow-400"
                : feedback.accuracy === "FAIR"
                  ? "text-orange-400"
                  : "text-red-400"
          } `}
        >
          {accuracyLabels[feedback.accuracy] || feedback.accuracy}! +
          {feedback.points}
        </div>
      )}
    </button>
  );
}

export default TapArea;
