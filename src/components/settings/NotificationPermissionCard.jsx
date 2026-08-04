import React, { useState, useEffect } from "react";
import { Bell, BellOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  savePushSubscription,
  removePushSubscription,
  getPushSubscriptionStatus,
} from "../../services/notificationService";
import { useParentGate } from "../../contexts/ParentGateContext";
import { useTranslation } from "react-i18next";
import {
  isAndroidDevice,
  isIOSDevice,
  isChromeBrowser,
  isSafariBrowser,
  isInStandaloneMode,
} from "../../utils/pwaDetection";

/**
 * Detect platform to show the correct "unblock notifications" steps.
 * Returns a key matching i18n notificationsBlockedSteps.
 */
function getNotificationPlatformKey() {
  if (isAndroidDevice() && isInStandaloneMode()) return "androidPwa";
  if (isIOSDevice() && isInStandaloneMode()) return "iosPwa";
  if (isChromeBrowser() && !isAndroidDevice()) return "chrome";
  if (isSafariBrowser() && !isIOSDevice()) return "safari";
  if (typeof navigator !== "undefined" && /Firefox/i.test(navigator.userAgent))
    return "firefox";
  return "fallback";
}

/**
 * Notification permission card. Enable/re-enable actions rely on the shared
 * ParentGateContext (D-06) — this card no longer holds its own gate state or
 * renders its own math-gate overlay. It is designed to render inside a
 * host-gated surface (e.g. ParentPortalPage's Notification Preferences
 * section), so by the time `handleEnableClick` fires, `passed` is normally
 * already true (no re-prompt). The `!passed` branch is a defensive fallback
 * only (e.g. the shared window expiring mid-session) — it defers to the
 * shared gate instead of ever subscribing ungated.
 *
 * State machine:
 *   unsupported   → show "not supported" message
 *   denied        → show "blocked, update browser settings" message
 *   enabled       → show "push enabled" + Disable button
 *   consent_skip  → consent previously granted but is_enabled=false → show re-enable button (no gate)
 *   default       → no subscription yet → show Enable button
 *   subscribing   → async work in progress
 */
export function NotificationPermissionCard({
  onPermissionChange,
  studentId,
  isRTL = false,
}) {
  const { t } = useTranslation();
  const { passed, pass } = useParentGate();
  const [isSupported, setIsSupported] = useState(true);
  const [permission, setPermission] = useState("default");
  const [pushState, setPushState] = useState("loading"); // loading|enabled|consent_skip|default
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [iosInstallRequired, setIosInstallRequired] = useState(false);

  const rowClasses = `flex items-start gap-3 ${isRTL ? "flex-row-reverse text-right" : ""}`;
  const textAlign = isRTL ? "text-right" : "";

  useEffect(() => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (!supported) {
      setPushState("unsupported");
      return;
    }

    const browserPermission = getNotificationPermission();
    setPermission(browserPermission);

    if (browserPermission === "denied") {
      setPushState("denied");
      return;
    }

    // Check DB subscription state
    if (studentId) {
      getPushSubscriptionStatus(studentId)
        .then((status) => {
          if (status?.is_enabled === true) {
            setPushState("enabled");
          } else if (status?.parent_consent_granted === true) {
            // Consent was previously granted but is_enabled is false
            setPushState("consent_skip");
          } else {
            setPushState("default");
          }
        })
        .catch(() => {
          setPushState("default");
        });
    } else {
      setPushState("default");
    }
  }, [studentId]);

  /**
   * Detect iOS PWA install requirement.
   * iOS only supports Web Push from home-screen PWA (not Safari browser tab).
   */
  const checkIosInstallRequired = () => {
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;
    return isIos && !isStandalone;
  };

  const performSubscription = async () => {
    setIsSubscribing(true);
    setIosInstallRequired(false);
    try {
      // Check iOS PWA requirement
      if (checkIosInstallRequired()) {
        setIosInstallRequired(true);
        setIsSubscribing(false);
        return;
      }

      // Request browser permission
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result !== "granted") {
        if (onPermissionChange) onPermissionChange(result);
        setPushState(result === "denied" ? "denied" : "default");
        setIsSubscribing(false);
        return;
      }

      // Subscribe via browser PushManager
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const subscriptionJSON = await subscribeToPushNotifications(vapidKey);

      // Persist to DB
      if (studentId) {
        await savePushSubscription(studentId, subscriptionJSON);
      }

      if (onPermissionChange) onPermissionChange("granted");
      setPushState("enabled");
    } catch (error) {
      console.error("Push subscription error:", error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleEnableClick = async () => {
    // The card only mounts inside a host-gated surface, so `passed` is
    // normally already true here (no re-prompt, D-06). The `!passed` branch
    // is a defensive guard — defer to the shared gate rather than ever
    // subscribing ungated.
    if (!passed) {
      pass?.();
      return;
    }
    await performSubscription();
  };

  const handleReEnable = async () => {
    await performSubscription();
  };

  const handleDisable = async () => {
    if (!studentId) return;
    setIsSubscribing(true);
    try {
      await removePushSubscription(studentId);
      if (onPermissionChange) onPermissionChange("disabled");
      setPushState("consent_skip");
    } catch (error) {
      console.error("Push unsubscription error:", error);
    } finally {
      setIsSubscribing(false);
    }
  };

  // --- Render states ---

  if (pushState === "loading") {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div
          className={`flex items-center gap-2 text-white/60 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (!isSupported || pushState === "unsupported") {
    return (
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
        <div className={rowClasses}>
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
          <div className={textAlign}>
            <h4 className="mb-1 text-sm font-medium text-white">
              {t("pages.settings.notifications.notificationsNotSupported")}
            </h4>
            <p className="text-xs text-white/70">
              {t(
                "pages.settings.notifications.notificationsNotSupportedDescription"
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === "denied" || pushState === "denied") {
    const platformKey = getNotificationPlatformKey();
    const steps = t(
      `pages.settings.notifications.notificationsBlockedSteps.${platformKey}`,
      { returnObjects: true }
    );

    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
        <div className={rowClasses}>
          <BellOff className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
          <div className={textAlign}>
            <h4 className="mb-1 text-sm font-medium text-white">
              {t("pages.settings.notifications.notificationsBlocked")}
            </h4>
            <p className="mb-2 text-xs text-white/70">
              {t("pages.settings.notifications.notificationsBlockedSubtitle")}
            </p>
            {Array.isArray(steps) && (
              <ol
                className={`space-y-1 text-xs text-white/70 ${isRTL ? "pr-4" : "pl-4"} list-decimal`}
              >
                {steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (pushState === "enabled") {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
        <div
          className={`flex items-start gap-3 ${isRTL ? "direction-rtl text-right" : ""}`}
        >
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
          <div className={`flex-1 ${textAlign}`}>
            <h4 className="mb-1 text-sm font-medium text-white">
              {t("pages.settings.notifications.pushNotifications.enabled")}
            </h4>
            <p className="mb-3 text-xs text-white/70">
              {t(
                "pages.settings.notifications.pushNotifications.enabledDescription"
              )}
            </p>
            <button
              onClick={handleDisable}
              disabled={isSubscribing}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubscribing ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t(
                    "pages.settings.notifications.pushNotifications.subscribing"
                  )}
                </span>
              ) : (
                t(
                  "pages.settings.notifications.pushNotifications.disableButton"
                )
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pushState === "consent_skip") {
    // Consent was previously granted, but currently disabled — allow re-enable without gate
    return (
      <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4">
        <div className={rowClasses}>
          <Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-400" />
          <div className={`flex-1 ${textAlign}`}>
            <h4 className="mb-1 text-sm font-medium text-white">
              {t("pages.settings.notifications.pushNotifications.enableButton")}
            </h4>
            <p className="mb-3 text-xs text-white/70">
              {t(
                "pages.settings.notifications.pushNotifications.enableDescription"
              )}
            </p>
            {iosInstallRequired && (
              <p className="mb-3 text-xs text-amber-300">
                {t(
                  "pages.settings.notifications.pushNotifications.iosInstallRequired"
                )}
              </p>
            )}
            <button
              onClick={handleReEnable}
              disabled={isSubscribing}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubscribing ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t(
                    "pages.settings.notifications.pushNotifications.subscribing"
                  )}
                </span>
              ) : (
                t(
                  "pages.settings.notifications.pushNotifications.reEnableButton"
                )
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default state: first-time enable (relies on the host's shared parental gate)
  return (
    <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4">
      <div className={rowClasses}>
        <Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-400" />
        <div className={`flex-1 ${textAlign}`}>
          <h4 className="mb-1 text-sm font-medium text-white">
            {t("pages.settings.notifications.pushNotifications.enableButton")}
          </h4>
          <p className="mb-3 text-xs text-white/70">
            {t(
              "pages.settings.notifications.pushNotifications.enableDescription"
            )}
          </p>
          {iosInstallRequired && (
            <p className="mb-3 text-xs text-amber-300">
              {t(
                "pages.settings.notifications.pushNotifications.iosInstallRequired"
              )}
            </p>
          )}
          <button
            onClick={handleEnableClick}
            disabled={isSubscribing}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubscribing ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t(
                  "pages.settings.notifications.pushNotifications.subscribing"
                )}
              </span>
            ) : (
              t("pages.settings.notifications.pushNotifications.enableButton")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationPermissionCard;
