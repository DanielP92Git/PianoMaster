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
import ParentGateMath from "./ParentGateMath";
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
  if (typeof navigator !== "undefined" && /Firefox/i.test(navigator.userAgent)) return "firefox";
  return "fallback";
}

/**
 * Notification permission card with parent-gate push subscription flow.
 *
 * State machine:
 *   unsupported   → show "not supported" message
 *   denied        → show "blocked, update browser settings" message
 *   enabled       → show "push enabled" + Disable button
 *   consent_skip  → consent previously granted but is_enabled=false → show re-enable button (no gate)
 *   gate          → first enable: show ParentGateMath overlay
 *   default       → no subscription yet → show Enable button (triggers gate)
 *   subscribing   → async work in progress
 */
export function NotificationPermissionCard({
  onPermissionChange,
  studentId,
  isRTL = false,
}) {
  const { t } = useTranslation();
  const [isSupported, setIsSupported] = useState(true);
  const [permission, setPermission] = useState("default");
  const [pushState, setPushState] = useState("loading"); // loading|enabled|consent_skip|default
  const [showGate, setShowGate] = useState(false);
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

  const handleConsentGranted = async () => {
    setShowGate(false);
    await performSubscription();
  };

  const handleEnableClick = () => {
    setShowGate(true);
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
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className={`flex items-center gap-2 text-white/60 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (!isSupported || pushState === "unsupported") {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className={rowClasses}>
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className={textAlign}>
            <h4 className="text-white font-medium text-sm mb-1">
              {t("pages.settings.notifications.notificationsNotSupported")}
            </h4>
            <p className="text-white/70 text-xs">
              {t("pages.settings.notifications.notificationsNotSupportedDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === "denied" || pushState === "denied") {
    const platformKey = getNotificationPlatformKey();
    const steps = t(`pages.settings.notifications.notificationsBlockedSteps.${platformKey}`, { returnObjects: true });

    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className={rowClasses}>
          <BellOff className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className={textAlign}>
            <h4 className="text-white font-medium text-sm mb-1">
              {t("pages.settings.notifications.notificationsBlocked")}
            </h4>
            <p className="text-white/70 text-xs mb-2">
              {t("pages.settings.notifications.notificationsBlockedSubtitle")}
            </p>
            {Array.isArray(steps) && (
              <ol className={`text-white/70 text-xs space-y-1 ${isRTL ? "pr-4" : "pl-4"} list-decimal`}>
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
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <div className={`flex items-start gap-3 ${isRTL ? "direction-rtl text-right" : ""}`}>
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className={`flex-1 ${textAlign}`}>
            <h4 className="text-white font-medium text-sm mb-1">
              {t("pages.settings.notifications.pushNotifications.enabled")}
            </h4>
            <p className="text-white/70 text-xs mb-3">
              {t("pages.settings.notifications.pushNotifications.enabledDescription")}
            </p>
            <button
              onClick={handleDisable}
              disabled={isSubscribing}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubscribing ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t("pages.settings.notifications.pushNotifications.subscribing")}
                </span>
              ) : (
                t("pages.settings.notifications.pushNotifications.disableButton")
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
      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
        <div className={rowClasses}>
          <Bell className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className={`flex-1 ${textAlign}`}>
            <h4 className="text-white font-medium text-sm mb-1">
              {t("pages.settings.notifications.pushNotifications.enableButton")}
            </h4>
            <p className="text-white/70 text-xs mb-3">
              {t("pages.settings.notifications.pushNotifications.enableDescription")}
            </p>
            {iosInstallRequired && (
              <p className="text-amber-300 text-xs mb-3">
                {t("pages.settings.notifications.pushNotifications.iosInstallRequired")}
              </p>
            )}
            <button
              onClick={handleReEnable}
              disabled={isSubscribing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubscribing ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("pages.settings.notifications.pushNotifications.subscribing")}
                </span>
              ) : (
                t("pages.settings.notifications.pushNotifications.reEnableButton")
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default state: first-time enable (requires parent gate)
  return (
    <>
      {showGate && (
        <ParentGateMath
          onConsent={handleConsentGranted}
          onCancel={() => setShowGate(false)}
          isRTL={isRTL}
        />
      )}
      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
        <div className={rowClasses}>
          <Bell className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className={`flex-1 ${textAlign}`}>
            <h4 className="text-white font-medium text-sm mb-1">
              {t("pages.settings.notifications.pushNotifications.enableButton")}
            </h4>
            <p className="text-white/70 text-xs mb-3">
              {t("pages.settings.notifications.pushNotifications.enableDescription")}
            </p>
            {iosInstallRequired && (
              <p className="text-amber-300 text-xs mb-3">
                {t("pages.settings.notifications.pushNotifications.iosInstallRequired")}
              </p>
            )}
            <button
              onClick={handleEnableClick}
              disabled={isSubscribing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubscribing ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("pages.settings.notifications.pushNotifications.subscribing")}
                </span>
              ) : (
                t("pages.settings.notifications.pushNotifications.enableButton")
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotificationPermissionCard;
