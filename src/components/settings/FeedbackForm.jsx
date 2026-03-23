import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  MessageSquare,
  CheckCircle,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import { ParentGateMath } from "./ParentGateMath";
import supabase from "../../services/supabase";

const COOLDOWN_SECONDS = 5 * 60; // 300 seconds per D-16

/**
 * FeedbackForm — four-state feedback form for Settings page.
 *
 * States: idle → gated → form → success
 * - idle:    centered "Send Feedback" trigger button
 * - gated:   ParentGateMath overlay (COPPA gate, fires fresh every time per D-01)
 * - form:    glass card with type dropdown, textarea, submit
 * - success: checkmark + thank you + 5-minute cooldown countdown
 *
 * Errors are orthogonal to state — an inline red banner within `form` state.
 * Honeypot field silently fakes success if filled (SPAM-03).
 *
 * Props:
 *   isRTL — boolean, controls dir attribute and flex-row-reverse (per I18N-01)
 */
export function FeedbackForm({ isRTL = false }) {
  const { t } = useTranslation("common");

  // State machine
  const [status, setStatus] = useState("idle");
  const [feedbackType, setFeedbackType] = useState("bug");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null); // null | { type: 'rate_limit' | 'server' | 'network' }
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);

  const honeypotRef = useRef(null);

  // Cooldown timer — decrements every second, resets to idle when expired (per D-12)
  useEffect(() => {
    if (cooldownSecondsLeft <= 0) {
      if (status === "success") setStatus("idle");
      return;
    }
    const timer = setTimeout(() => {
      setCooldownSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearTimeout(timer); // cleanup on unmount or re-run (Pitfall 3)
  }, [cooldownSecondsLeft, status]);

  // --- Handlers ---

  const handleSendFeedbackClick = () => {
    setStatus("gated");
  };

  const handleGateConsent = () => {
    setStatus("form"); // per D-02: no persistence, per-session only
  };

  const handleGateCancel = () => {
    setStatus("idle");
  };

  const startCooldown = () => {
    setCooldownSecondsLeft(COOLDOWN_SECONDS);
  };

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // SPAM-03: honeypot filled → silently fake success without Edge Function call
    if (honeypotRef.current?.value) {
      setStatus("success");
      startCooldown();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const appVersion =
        // eslint-disable-next-line no-undef
        typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "unknown";
      const { data, error: invokeError } = await supabase.functions.invoke(
        "send-feedback",
        {
          body: {
            type: feedbackType,
            message: message.trim(),
            version: appVersion,
          },
        }
      );

      if (invokeError) throw invokeError;

      if (data?.success) {
        // Success path: transition to success state and start cooldown
        setStatus("success");
        setMessage("");
        setFeedbackType("bug");
        startCooldown();
      } else {
        // Edge Function returned { success: false, error: '...' }
        if (data?.error === "rate_limit") {
          setError({ type: "rate_limit" });
        } else {
          setError({ type: "server" });
        }
      }
    } catch (err) {
      // FunctionsHttpError or network failure
      const httpStatus = err?.context?.status;
      if (httpStatus === 429) {
        setError({ type: "rate_limit" });
      } else if (httpStatus >= 500) {
        setError({ type: "server" });
      } else {
        setError({ type: "network" }); // includes retry button per D-14
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const trimmedLen = message.trim().length;

  // --- Render ---

  return (
    <div>
      {/* Idle state: centered trigger button (per D-04, D-05, D-06) */}
      {status === "idle" && (
        <div className="pt-6 pb-8 flex justify-center">
          <button
            onClick={handleSendFeedbackClick}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200 text-sm font-normal min-h-[44px] ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {t("pages.settings.feedback.sendFeedback")}
          </button>
        </div>
      )}

      {/* Gated state: ParentGateMath overlay (per D-01, D-02, D-03) */}
      {status === "gated" && (
        <ParentGateMath
          onConsent={handleGateConsent}
          onCancel={handleGateCancel}
          isRTL={isRTL}
        />
      )}

      {/* Form state: glass card with fields */}
      {status === "form" && (
        <div
          className="animate-fadeIn motion-reduce:animate-none bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 space-y-4"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-300 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">
                {t("pages.settings.feedback.sectionTitle")}
              </h3>
              <p className="text-sm text-white/70">
                {t("pages.settings.feedback.sectionSubtitle")}
              </p>
            </div>
            <button
              onClick={() => {
                setStatus("idle");
                setError(null);
                setMessage("");
                setFeedbackType("bug");
              }}
              aria-label={t("pages.settings.feedback.cancel")}
              className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Inline error banner (per D-13, D-14, D-15) */}
          {error && (
            <div
              className={`rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-3 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-red-200">
                {error.type === "rate_limit"
                  ? t("pages.settings.feedback.errorRateLimit")
                  : error.type === "network"
                    ? t("pages.settings.feedback.errorNetwork")
                    : t("pages.settings.feedback.errorServer")}
                {/* Retry button for network errors only (per D-14) */}
                {error.type === "network" && (
                  <button
                    onClick={handleSubmit}
                    className="ml-2 underline hover:no-underline text-red-300"
                  >
                    {t("pages.settings.feedback.retry")}
                  </button>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                aria-label={t("pages.settings.feedback.dismiss")}
                className="text-red-400 hover:text-red-200 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Honeypot field — visually hidden, attracts bots (SPAM-03, Pitfall 2) */}
          <input
            ref={honeypotRef}
            type="text"
            name="website"
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              opacity: 0,
              pointerEvents: "none",
            }}
          />

          {/* Feedback type dropdown (per D-07) */}
          <div>
            <label className="block text-sm font-normal text-white/80 mb-1.5">
              {t("pages.settings.feedback.typeLabel")}
            </label>
            <select
              dir={isRTL ? "rtl" : "ltr"}
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400/50 transition-colors"
            >
              <option value="bug" className="bg-gray-800 text-white">{t("pages.settings.feedback.typeBug")}</option>
              <option value="suggestion" className="bg-gray-800 text-white">
                {t("pages.settings.feedback.typeSuggestion")}
              </option>
              <option value="other" className="bg-gray-800 text-white">
                {t("pages.settings.feedback.typeOther")}
              </option>
            </select>
          </div>

          {/* Message textarea (per D-08) */}
          <div>
            <label className="block text-sm font-normal text-white/80 mb-1.5">
              {t("pages.settings.feedback.messageLabel")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("pages.settings.feedback.messagePlaceholder")}
              maxLength={1000}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400/50 transition-colors resize-none placeholder-white/40"
              style={{ minHeight: "120px" }}
            />
            {/* Character counter — shows trimmed length to match server validation (Pitfall 4) */}
            <p
              className={`text-xs mt-1 ${
                trimmedLen >= 980
                  ? "text-red-300"
                  : trimmedLen >= 900
                    ? "text-amber-300"
                    : "text-white/40"
              } ${isRTL ? "text-left" : "text-right"}`}
            >
              {t("pages.settings.feedback.charCount", { count: trimmedLen })}
            </p>
          </div>

          {/* Submit button (per UI-SPEC) */}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || trimmedLen < 10}
            className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("pages.settings.feedback.submitting")}
              </>
            ) : (
              t("pages.settings.feedback.submit")
            )}
          </button>
        </div>
      )}

      {/* Success state (per D-10, D-11, D-12) */}
      {status === "success" && (
        <div className="text-center space-y-3 py-6">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
          <p className="text-white font-semibold">
            {t("pages.settings.feedback.successTitle")}
          </p>
          <p className="text-white/60 text-sm">
            {t("pages.settings.feedback.successSubtitle")}
          </p>
          {cooldownSecondsLeft > 0 && (
            <p className="text-white/40 text-xs">
              {t("pages.settings.feedback.cooldownMessage", {
                time: formatCountdown(cooldownSecondsLeft),
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default FeedbackForm;
