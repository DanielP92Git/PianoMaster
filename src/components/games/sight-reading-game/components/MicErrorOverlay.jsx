import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { isIOSSafari } from "../../../../utils/isIOSSafari.js";

/**
 * MicErrorOverlay - Kid-friendly microphone error overlay for the Sight Reading game.
 *
 * Props:
 *   errorType  - "permission_denied" | "mic_stopped" | null (null = hidden)
 *   isRetrying - boolean, true while reconnection attempt is in progress
 *   canRetry   - boolean, false when retry limit is exhausted
 *   onRetry    - async function, parent handles startListeningSync + error recovery
 *   onBack     - function, navigate back to setup/menu
 */
export function MicErrorOverlay({ errorType, isRetrying, canRetry, onRetry, onBack }) {
  const { t } = useTranslation("common");
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset success state whenever error type changes
  useEffect(() => {
    setShowSuccess(false);
  }, [errorType]);

  // Hidden when no error
  if (!errorType) return null;

  const handleRetry = async () => {
    try {
      await onRetry();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } catch {
      // Parent updates error state on failure; overlay stays visible
    }
  };

  const isPermissionDenied = errorType === "permission_denied";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">

        {/* Success state */}
        {showSuccess && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-bold text-green-700">
              {t("micError.success")}
            </p>
          </div>
        )}

        {/* Retrying / spinner state */}
        {!showSuccess && isRetrying && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            <p className="text-base font-medium text-gray-700">
              {t("micError.retrying")}
            </p>
          </div>
        )}

        {/* Error state (default) */}
        {!showSuccess && !isRetrying && (
          <>
            <div className="mb-4 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                  <svg
                    className="h-8 w-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                {isPermissionDenied
                  ? t("micError.permissionDenied.title")
                  : t("micError.micStopped.title")}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600">
                {isPermissionDenied
                  ? t("micError.permissionDenied.message")
                  : t("micError.micStopped.message")}
              </p>

              {/* iOS Safari: numbered step-by-step instructions for re-enabling mic in Settings */}
              {isPermissionDenied && isIOSSafari && (
                <div className="mt-3 text-left">
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    {t("micError.permissionDenied.ios.title")}
                  </p>
                  <ol className="space-y-1 rounded-lg bg-gray-50 p-3 text-left text-sm text-gray-600">
                    <li>1. {t("micError.permissionDenied.ios.step1")}</li>
                    <li>2. {t("micError.permissionDenied.ios.step2")}</li>
                    <li>3. {t("micError.permissionDenied.ios.step3")}</li>
                    <li>4. {t("micError.permissionDenied.ios.step4")}</li>
                    <li>5. {t("micError.permissionDenied.ios.step5")}</li>
                  </ol>
                </div>
              )}

              {/* Non-iOS browsers: generic hint about browser settings */}
              {isPermissionDenied && !isIOSSafari && (
                <p className="mt-3 text-sm text-gray-500">
                  {t("micError.permissionDenied.genericHint")}
                </p>
              )}

              {/* Exhausted retries message */}
              {!canRetry && (
                <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-sm leading-relaxed text-orange-700">
                  {t("micError.noMoreRetries")}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {isPermissionDenied ? (
                <>
                  {/* permission_denied: primary = Back to Menu, secondary = Try Again */}
                  <button
                    onClick={onBack}
                    className="flex-1 rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    {t("micError.permissionDenied.backToMenu")}
                  </button>
                  {canRetry && (
                    <button
                      onClick={handleRetry}
                      className="flex-1 rounded-xl bg-gray-200 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    >
                      {t("micError.permissionDenied.tryAgain")}
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* mic_stopped: primary = Try Again, secondary = Back to Menu */}
                  {canRetry && (
                    <button
                      onClick={handleRetry}
                      className="flex-1 rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                      {t("micError.micStopped.tryAgain")}
                    </button>
                  )}
                  <button
                    onClick={onBack}
                    className={`flex-1 rounded-xl px-4 py-3 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      canRetry
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400"
                        : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"
                    }`}
                  >
                    {t("micError.micStopped.backToMenu")}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
