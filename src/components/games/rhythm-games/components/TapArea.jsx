/**
 * Interactive tap area component for rhythm games
 * Large, prominent button for tapping - Simplified design
 */
export function TapArea({
  onTap,
  feedback = null,
  isActive = true,
  title = "TAP HERE",
  className = "",
}) {
  return (
    <button
      onClick={isActive ? onTap : undefined}
      disabled={!isActive}
      className={`
        w-full h-full max-w-md max-h-96
        bg-white/10 backdrop-blur-md
        flex flex-col items-center justify-center
        text-white font-bold
        transition-all duration-200 rounded-3xl
        ${className}
        ${
          isActive
            ? "hover:bg-white/20 active:scale-95 cursor-pointer"
            : "opacity-50 cursor-not-allowed"
        }
      `}
    >
      <div className="text-5xl sm:text-6xl mb-4">{title}</div>
      {feedback && (
        <div
          className={`
            text-3xl sm:text-4xl font-bold animate-pulse
            ${
              feedback.accuracy === "PERFECT"
                ? "text-green-400"
                : feedback.accuracy === "GOOD"
                  ? "text-yellow-400"
                  : feedback.accuracy === "FAIR"
                    ? "text-orange-400"
                    : "text-red-400"
            }
          `}
        >
          {feedback.accuracy}! +{feedback.points}
        </div>
      )}
    </button>
  );
}

export default TapArea;
