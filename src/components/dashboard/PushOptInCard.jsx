import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  isPushNotificationSupported,
  getPushSubscriptionStatus,
} from "../../services/notificationService";

const DISMISSED_KEY = "push_optin_dismissed";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * One-time dismissible dashboard card that appears after the student's first week,
 * suggesting push notification opt-in.
 *
 * Props:
 *   studentId  - The authenticated student's UUID
 *   createdAt  - Student account creation date (ISO string)
 *   isRTL      - RTL layout support
 *
 * The card self-hides when any of these conditions are true:
 *   - Push notifications are not supported
 *   - Account is less than 7 days old
 *   - Card has been dismissed (localStorage flag)
 *   - Student already has an active push subscription
 */
function PushOptInCard({ studentId, createdAt, isRTL = false }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const checkVisibility = async () => {
      // 1. Push must be supported
      if (!isPushNotificationSupported()) return;

      // 2. Account must be at least 7 days old
      if (!createdAt) return;
      const accountAge = Date.now() - new Date(createdAt).getTime();
      if (accountAge < SEVEN_DAYS_MS) return;

      // 3. Card must not have been dismissed
      if (localStorage.getItem(DISMISSED_KEY) === "true") return;

      // 4. Student must not already have an active subscription
      if (studentId) {
        try {
          const status = await getPushSubscriptionStatus(studentId);
          if (!mountedRef.current) return;
          if (status?.is_enabled === true) return;
        } catch {
          // If we can't check, err on the side of showing the card
        }
      }

      if (mountedRef.current) {
        setVisible(true);
      }
    };

    checkVisibility();

    return () => {
      mountedRef.current = false;
    };
  }, [studentId, createdAt]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={`flex items-start gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-4 ${
        isRTL ? "flex-row-reverse" : ""
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Bell icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-400/30">
        <Bell className="h-5 w-5 text-indigo-300" />
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
        <p className="text-white font-semibold text-sm leading-tight">
          {t("pages.settings.notifications.pushOptIn.title")}
        </p>
        <p className="text-white/70 text-xs mt-1 leading-snug">
          {t("pages.settings.notifications.pushOptIn.subtitle")}
        </p>
        <div className={`mt-3 flex items-center gap-3 ${isRTL ? "flex-row-reverse justify-end" : ""}`}>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            {t("pages.settings.notifications.pushOptIn.goToSettings")}
          </Link>
          <button
            onClick={handleDismiss}
            className="text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            {t("pages.settings.notifications.pushOptIn.dismiss")}
          </button>
        </div>
      </div>

      {/* Dismiss X */}
      <button
        onClick={handleDismiss}
        aria-label={t("pages.settings.notifications.pushOptIn.dismiss")}
        className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0 mt-0.5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default PushOptInCard;
