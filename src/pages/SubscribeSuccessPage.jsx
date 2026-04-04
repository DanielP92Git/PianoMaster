import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Sparkles, Loader2, ArrowRight } from "lucide-react";

import { useUser } from "../features/authentication/useUser";
import { useSubscription } from "../contexts/SubscriptionContext";

/**
 * SubscribeSuccessPage — /subscribe/success
 *
 * Post-checkout confirmation page. Polls isPremium via React Query invalidation
 * for up to 10 seconds after the Lemon Squeezy Checkout.Success event.
 *
 * States:
 *   loading  — polling in progress, not yet confirmed (shows spinner)
 *   confirmed — isPremium became true within 10 seconds (shows "Premium Unlocked!")
 *   pending  — 10 seconds elapsed without confirmation (webhook still processing)
 */
export default function SubscribeSuccessPage() {
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const { user } = useUser();
  const { isPremium } = useSubscription();
  const queryClient = useQueryClient();

  // True once we have exceeded the 10-second polling window
  const [timedOut, setTimedOut] = useState(false);

  // Poll subscription status via React Query invalidation for up to 10 seconds
  useEffect(() => {
    // Already confirmed or timed out — nothing to do
    if (isPremium || timedOut) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    const interval = setInterval(() => {
      attempts++;
      queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        setTimedOut(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPremium, timedOut, user?.id, queryClient]);

  const isRTL = i18n.dir() === "rtl";

  // Determine current display state
  const isConfirmed = isPremium;
  const isPending = timedOut && !isPremium;
  const isPolling = !isConfirmed && !isPending;

  return (
    <div
      className="min-h-[60vh] flex items-center justify-center p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-8 max-w-md w-full text-center">

        {/* Confirmed state — payment processed and webhook delivered */}
        {isConfirmed && (
          <>
            <CheckCircle
              size={64}
              className="text-green-400 mx-auto mb-4"
            />
            <Sparkles
              size={24}
              className="text-amber-300 mx-auto mb-3"
            />
            <h1 className="text-2xl font-bold text-white mb-3">
              {t("subscribeSuccess.confirmedTitle")}
            </h1>
            <p className="text-white/70 mb-8">
              {t("subscribeSuccess.confirmedSubtitle")}
            </p>
            <button
              onClick={() => navigate("/trail")}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
            >
              {t("subscribeSuccess.startLearning")}
              <ArrowRight size={18} />
            </button>
          </>
        )}

        {/* Pending state — timed out but still positive tone */}
        {isPending && (
          <>
            <CheckCircle
              size={64}
              className="text-indigo-400 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-white mb-3">
              {t("subscribeSuccess.pendingTitle")}
            </h1>
            <p className="text-white/70 mb-8">
              {t("subscribeSuccess.pendingSubtitle")}
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
            >
              {t("subscribeSuccess.goToDashboard")}
              <ArrowRight size={18} />
            </button>
          </>
        )}

        {/* Loading / polling state */}
        {isPolling && (
          <>
            <Loader2
              size={48}
              className="animate-spin text-indigo-400 mx-auto mb-6"
            />
            <p className="text-white font-semibold mb-2">
              {t("subscribeSuccess.confirming")}
            </p>
            <p className="text-white/50 text-sm">
              {t("subscribeSuccess.pleaseWait")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
