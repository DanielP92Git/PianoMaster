import { useEffect, useCallback } from "react";
import { reminderService } from "../services/reminderService";
import { useSettings } from "../contexts/SettingsContext";
import { toast } from "react-hot-toast";

/**
 * Hook for managing daily practice reminders
 */
export function useDailyReminder() {
  const { preferences, updatePreference } = useSettings();

  // Initialize reminder service on mount
  useEffect(() => {
    reminderService.initialize();

    // Cleanup on unmount
    return () => {
      reminderService.cancelReminder();
    };
  }, []);

  // Sync reminder schedule with preferences
  useEffect(() => {
    const { daily_reminder_enabled, daily_reminder_time } = preferences;

    if (daily_reminder_enabled && daily_reminder_time) {
      reminderService.scheduleReminder(daily_reminder_time, true);
    } else {
      reminderService.cancelReminder();
    }
  }, [preferences.daily_reminder_enabled, preferences.daily_reminder_time]);

  /**
   * Enable/disable daily reminder
   */
  const toggleReminder = useCallback(
    async (enabled) => {
      // Request permission if enabling
      if (enabled) {
        if (!reminderService.isSupported()) {
          toast.error("Notifications are not supported in this browser");
          return false;
        }

        try {
          const permission = await reminderService.requestPermission();
          if (permission !== "granted") {
            toast.error("Please allow notifications to enable reminders");
            return false;
          }
        } catch (error) {
          console.error("Permission request failed:", error);
          toast.error("Failed to request notification permission");
          return false;
        }
      }

      // Update preference (this will trigger useEffect to schedule/cancel)
      updatePreference("daily_reminder_enabled", enabled);

      if (enabled) {
        toast.success("Daily reminder enabled!");
      } else {
        toast.success("Daily reminder disabled");
      }

      return true;
    },
    [updatePreference]
  );

  /**
   * Set reminder time
   */
  const setReminderTime = useCallback(
    (time) => {
      updatePreference("daily_reminder_time", time);
      if (preferences.daily_reminder_enabled) {
        toast.success(`Reminder time updated to ${time}`);
      }
    },
    [updatePreference, preferences.daily_reminder_enabled]
  );

  /**
   * Test reminder (send immediately)
   */
  const testReminder = useCallback(async () => {
    if (!reminderService.isSupported()) {
      toast.error("Notifications are not supported");
      return;
    }

    const permission = reminderService.getPermissionStatus();
    if (permission !== "granted") {
      toast.error("Please enable notifications first");
      return;
    }

    try {
      await reminderService.sendPracticeReminder();
      toast.success("Test notification sent!");
    } catch (error) {
      console.error("Failed to send test notification:", error);
      toast.error("Failed to send test notification");
    }
  }, []);

  /**
   * Snooze current reminder
   */
  const snoozeReminder = useCallback((minutes = 15) => {
    reminderService.snooze(minutes);
    toast.success(`Reminder snoozed for ${minutes} minutes`);
  }, []);

  return {
    isEnabled: preferences.daily_reminder_enabled,
    reminderTime: preferences.daily_reminder_time,
    isSupported: reminderService.isSupported(),
    permissionStatus: reminderService.getPermissionStatus(),
    toggleReminder,
    setReminderTime,
    testReminder,
    snoozeReminder,
  };
}

export default useDailyReminder;

