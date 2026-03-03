import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * AudioInterruptedOverlay
 *
 * Tap-to-resume overlay shown when the AudioContext enters an 'interrupted'
 * state on iOS Safari (phone call, lock screen, Siri, app switch).
 *
 * Design decisions (Phase 09):
 * - Lighter visual treatment than MicErrorOverlay: bg-black/30 vs bg-black/50
 * - Calmer purple play-circle icon (not the warning/mic error icons)
 * - Retry-once fallback: on first failure, retries once more, then shows
 *   "Restart Exercise" fallback per locked design decision
 * - resume() in onTapToResume is called synchronously (IOS-02) — this
 *   component calls onTapToResume from a click handler, which satisfies
 *   the iOS user-gesture requirement
 *
 * Props:
 * @param {boolean} isVisible - Controls whether the overlay renders
 * @param {Function} onTapToResume - Async handler from AudioContextProvider
 *   (handleTapToResume). Calls resume() synchronously then re-acquires mic.
 * @param {Function} onRestartExercise - Fallback when resume fails twice.
 *   Typically navigates back to the exercise start or resets game state.
 */
export function AudioInterruptedOverlay({
  isVisible,
  onTapToResume,
  onRestartExercise,
}) {
  const { t } = useTranslation("common");
  const [resumeFailed, setResumeFailed] = useState(false);

  const handleTap = useCallback(async () => {
    try {
      await onTapToResume();
      // Success — overlay will hide via isVisible becoming false (isInterrupted resets)
    } catch {
      // Retry once per locked decision before showing fallback
      try {
        await onTapToResume();
      } catch {
        setResumeFailed(true);
      }
    }
  }, [onTapToResume]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-label={t("micInterrupted.ariaLabel")}
    >
      <div className="mx-4 w-full max-w-xs rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-xl text-center">
        {!resumeFailed ? (
          <>
            {/* Play circle icon — calmer visual than the mic error warning icon */}
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                <svg
                  className="h-8 w-8 text-purple-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              {t("micInterrupted.title")}
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              {t("micInterrupted.message")}
            </p>
            <button
              onClick={handleTap}
              className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {t("micInterrupted.tapToContinue")}
            </button>
          </>
        ) : (
          <>
            {/* Warning icon — shown when resume fails after retry */}
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                <svg
                  className="h-8 w-8 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              {t("micInterrupted.resumeFailed")}
            </p>
            <button
              onClick={onRestartExercise}
              className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {t("micInterrupted.restartExercise")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
