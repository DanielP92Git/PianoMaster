import React, { useState, useEffect } from "react";
import { Bell, BellOff, AlertCircle, CheckCircle } from "lucide-react";
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from "../../services/notificationService";
import { useTranslation } from "react-i18next";

/**
 * Notification permission request card
 */
export function NotificationPermissionCard({
  onPermissionChange,
  isRTL = false,
}) {
  const { t } = useTranslation();
  const [permission, setPermission] = useState("default");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const rowClasses = `flex items-start gap-3 ${isRTL ? "flex-row-reverse text-right" : ""}`;
  const textAlign = isRTL ? "text-right" : "";

  useEffect(() => {
    setIsSupported(isPushNotificationSupported());
    if (isPushNotificationSupported()) {
      setPermission(getNotificationPermission());
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (onPermissionChange) {
        onPermissionChange(result);
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className={rowClasses}>
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className={textAlign}>
            <h4 className="text-white font-medium text-sm mb-1">
              {t("pages.settings.notifications.notificationsNotSupported")}
            </h4>
            <p className="text-white/70 text-xs">
              {t(
                "pages.settings.notifications.notificationsNotSupportedDescription"
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === "granted") {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <div className={`flex items-start gap-3 ${isRTL ? "direction-rtl text-right" : ""}`}>
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className={textAlign}>
            <h4 className="text-white font-medium text-sm mb-1">
              {t("pages.settings.notifications.notificationsEnabled")}
            </h4>
            <p className="text-white/70 text-xs">
              {t(
                "pages.settings.notifications.notificationsEnabledDescription"
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className={rowClasses}>
          <BellOff className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className={textAlign}>
            <h4 className="text-white font-medium text-sm mb-1">
              {t("pages.settings.notifications.notificationsBlocked")}
            </h4>
            <p className="text-white/70 text-xs mb-2">
              {t(
                "pages.settings.notifications.notificationsBlockedDescription"
              )}
            </p>
            <p className="text-white/60 text-xs">
              {t(
                "pages.settings.notifications.notificationsBlockedDescription2"
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
      <div className={rowClasses}>
        <Bell className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className={`flex-1 ${textAlign}`}>
          <h4 className="text-white font-medium text-sm mb-1">
            {t("pages.settings.notifications.enablePushNotifications")}
          </h4>
          <p className="text-white/70 text-xs mb-3">
            {t(
              "pages.settings.notifications.enablePushNotificationsDescription"
            )}
          </p>
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting
              ? t("pages.settings.notifications.requesting")
              : t("pages.settings.notifications.enableNotifications")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationPermissionCard;
