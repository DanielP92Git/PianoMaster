import React, { useState, useEffect } from "react";
import { Bell, BellOff, AlertCircle, CheckCircle } from "lucide-react";
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from "../../services/notificationService";

/**
 * Notification permission request card
 */
export function NotificationPermissionCard({ onPermissionChange }) {
  const [permission, setPermission] = useState("default");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

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
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-white font-medium text-sm mb-1">
              Notifications Not Supported
            </h4>
            <p className="text-white/70 text-xs">
              Your browser doesn't support push notifications. You can still use
              in-app reminders.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === "granted") {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-white font-medium text-sm mb-1">
              Notifications Enabled
            </h4>
            <p className="text-white/70 text-xs">
              You'll receive push notifications when practice reminders and
              achievements are triggered.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-white font-medium text-sm mb-1">
              Notifications Blocked
            </h4>
            <p className="text-white/70 text-xs mb-2">
              You've blocked notifications for this site. To enable them, please
              update your browser settings.
            </p>
            <p className="text-white/60 text-xs">
              Look for the lock icon in your browser's address bar and allow
              notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-white font-medium text-sm mb-1">
            Enable Push Notifications
          </h4>
          <p className="text-white/70 text-xs mb-3">
            Get timely reminders for your practice sessions and instant updates
            on achievements.
          </p>
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? "Requesting..." : "Enable Notifications"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationPermissionCard;
