import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Check, Crown, Shield, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useUser } from "../features/authentication/useUser";
import { useSubscription } from "../contexts/SubscriptionContext";
import { fetchSubscriptionPlans } from "../services/subscriptionService";
import supabase from "../services/supabase";

/**
 * SubscribePage — /subscribe
 *
 * Displays monthly and yearly plan cards with locale-detected currency (ILS for
 * Hebrew, USD for all others). Loads the Lemon.js overlay script, creates a
 * server-side checkout URL via the `create-checkout` Edge Function, and opens
 * the Lemon Squeezy overlay checkout in-app. On Checkout.Success navigates to
 * /subscribe/success.
 */
export default function SubscribePage() {
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const { user } = useUser();
  const { isPremium, isLoading: isSubscriptionLoading } = useSubscription();

  // Locale-based currency detection — use app i18n language, not browser language
  const currency = i18n.language?.startsWith("he") ? "ILS" : "USD";

  // Track which plan is in the loading state for its CTA button
  const [loadingPlanId, setLoadingPlanId] = useState(null);

  // Prevent double-setup in StrictMode
  const lemonSetupRef = useRef(false);

  // Fetch subscription plans from DB
  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ["subscription-plans", currency],
    queryFn: () => fetchSubscriptionPlans(currency),
    staleTime: 5 * 60 * 1000,
  });

  // Derive monthly and yearly plan objects
  const monthlyPlan = plans.find((p) => p.billing_period === "monthly");
  const yearlyPlan = plans.find((p) => p.billing_period === "yearly");

  // Calculate savings percentage for yearly plan
  let savingsPct = 0;
  if (monthlyPlan && yearlyPlan) {
    const monthlyEquivalent = yearlyPlan.amount_cents / 100 / 12;
    const monthlyPrice = monthlyPlan.amount_cents / 100;
    savingsPct = Math.round((1 - monthlyEquivalent / monthlyPrice) * 100);
  }

  // Format price using Intl
  function formatPrice(amountCents, cur) {
    return new Intl.NumberFormat(cur === "ILS" ? "he-IL" : "en-US", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 2,
    }).format(amountCents / 100);
  }

  // Load and configure Lemon.js
  useEffect(() => {
    function setupLemon() {
      if (lemonSetupRef.current) return;
      lemonSetupRef.current = true;
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Setup({
          eventHandler: (event) => {
            if (event.event === "Checkout.Success") {
              navigate("/subscribe/success");
            }
          },
        });
      }
    }

    // If Lemon.js script already exists (e.g. hot reload), just setup
    if (document.querySelector('script[src*="lemon.js"]')) {
      setupLemon();
      return;
    }

    // Create and append the Lemon.js script
    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    let added = true;

    script.onload = () => {
      if (window.createLemonSqueezy) {
        window.createLemonSqueezy();
      }
      setupLemon();
    };

    document.body.appendChild(script);

    return () => {
      // Only remove if we added it
      if (added) {
        script.remove();
      }
    };
  }, [navigate]);

  // Handle plan card click — create checkout and open LS overlay
  async function handlePlanClick(plan) {
    if (!user) return;
    setLoadingPlanId(plan.id);
    try {
      // Always use the USD plan for checkout — LS only supports one store currency.
      // ILS plans are display-only; map billing_period to the USD plan ID.
      const checkoutPlanId = `${plan.billing_period}-usd`;

      const { data, error } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: { planId: checkoutPlanId, studentId: user.id },
        }
      );

      if (error || !data?.checkoutUrl) {
        throw new Error(error?.message || "No checkout URL returned");
      }

      if (window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(data.checkoutUrl);
      } else {
        // Fallback: open in new tab if overlay not ready
        window.open(data.checkoutUrl, "_blank", "noopener");
      }
    } catch (err) {
      console.error("[SubscribePage] Checkout error:", err);
      toast.error(t("subscribe.checkoutError"));
    } finally {
      setLoadingPlanId(null);
    }
  }

  const isRTL = i18n.dir() === "rtl";

  // Skeleton loader while plans are fetching
  if (isPlansLoading) {
    return (
      <div
        className="min-h-screen p-4 sm:p-6"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="max-w-2xl mx-auto">
          <div className="h-8 bg-white/10 rounded-lg w-64 mb-4 animate-pulse" />
          <div className="h-5 bg-white/5 rounded-lg w-80 mb-8 animate-pulse" />
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl h-64 flex-1 animate-pulse" />
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl h-64 flex-1 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Already subscribed — show confirmation, no auto-redirect
  if (!isSubscriptionLoading && isPremium) {
    return (
      <div
        className="min-h-screen p-4 sm:p-6 flex items-start justify-center"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-8 max-w-md w-full text-center mt-12">
          <Crown size={48} className="text-amber-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-3">
            {t("subscribe.alreadySubscribed")}
          </h1>
          <button
            onClick={() => navigate("/")}
            className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200"
          >
            {t("subscribe.goToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-amber-300" size={24} />
          <h1 className="text-2xl font-bold text-white">
            {t("subscribe.title")}
          </h1>
        </div>
        <p className="text-white/70">{t("subscribe.subtitle")}</p>
      </div>

      {/* Plan Cards */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch max-w-2xl mx-auto">
        {/* Monthly Plan */}
        {monthlyPlan && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 flex-1 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-1">
              {t("subscribe.monthly")}
            </h2>
            <div className="mb-4">
              <span className="text-3xl font-bold text-white">
                {formatPrice(monthlyPlan.amount_cents, currency)}
              </span>
              <span className="text-white/60 text-sm ml-1">
                {t("subscribe.perMonth")}
              </span>
            </div>
            <div className="flex-1" />
            <button
              onClick={() => handlePlanClick(monthlyPlan)}
              disabled={loadingPlanId !== null}
              className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingPlanId === monthlyPlan.id ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{t("subscribe.loading")}</span>
                </>
              ) : (
                t("subscribe.subscribeCta")
              )}
            </button>
          </div>
        )}

        {/* Yearly Plan — highlighted as "Best Value" */}
        {yearlyPlan && (
          <div className="bg-white/10 backdrop-blur-md border border-amber-400/40 ring-2 ring-amber-400/30 rounded-xl shadow-lg p-6 flex-1 flex flex-col relative">
            {/* Best Value badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              {t("subscribe.bestValue")}
            </div>

            <h2 className="text-lg font-semibold text-white mb-1">
              {t("subscribe.yearly")}
            </h2>
            <div className="mb-1">
              <span className="text-3xl font-bold text-white">
                {formatPrice(yearlyPlan.amount_cents, currency)}
              </span>
              <span className="text-white/60 text-sm ml-1">
                {t("subscribe.perYear")}
              </span>
            </div>

            {/* Equivalent monthly price */}
            {monthlyPlan && (
              <p className="text-white/50 text-xs mb-1">
                {t("subscribe.equivalentMonthly", {
                  price: formatPrice(
                    Math.round(yearlyPlan.amount_cents / 12),
                    currency
                  ),
                })}
              </p>
            )}

            {/* Savings badge */}
            {savingsPct > 0 && (
              <p className="text-amber-300 text-sm font-semibold mb-3">
                {t("subscribe.savePercent", { percent: savingsPct })}
              </p>
            )}

            <div className="flex-1" />
            <button
              onClick={() => handlePlanClick(yearlyPlan)}
              disabled={loadingPlanId !== null}
              className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingPlanId === yearlyPlan.id ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{t("subscribe.loading")}</span>
                </>
              ) : (
                t("subscribe.subscribeCta")
              )}
            </button>
          </div>
        )}
      </div>

      {/* Feature checklist */}
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">
            {t("subscribe.featuresTitle")}
          </h3>
          <ul className="space-y-1">
            {[
              t("subscribe.feature1"),
              t("subscribe.feature2"),
              t("subscribe.feature3"),
              t("subscribe.feature4"),
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-white/80 py-1.5">
                <Check size={18} className="text-green-400 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Security disclaimer */}
      <div className="max-w-2xl mx-auto mt-6">
        <p className="text-white/40 text-xs text-center flex items-center justify-center gap-1.5">
          <Shield size={13} className="shrink-0" />
          {t("subscribe.securePayment")}
        </p>
      </div>
    </div>
  );
}
