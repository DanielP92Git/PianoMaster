/**
 * Dashboard Practice Reminder Service
 * Handles one-time practice reminders set from the Dashboard
 * Supports in-app alarm and browser notifications
 */

const STORAGE_KEY = "practiceTimer";
const CHECK_INTERVAL = 1000; // Check every second

class DashboardReminderService {
  constructor() {
    this.checkInterval = null;
    this.alarmAudio = null;
    this.isAlarmPlaying = false;
    this.alarmCallbacks = new Set();
    this.missedAlarmWhileHidden = false;
  }

  /**
   * Initialize the service - load from storage and start monitoring
   */
  initialize() {
    // Set up alarm audio
    this.alarmAudio = new Audio("/audio/alarm.mp3");
    this.alarmAudio.loop = true;

    // Set up visibility change listener
    this.setupVisibilityListener();

    // Load existing reminder from storage
    const stored = this.getFromStorage();
    if (stored && stored.dateTime && stored.isActive) {
      const now = Date.now();
      if (stored.dateTime > now) {
        this.startIntervalCheck();
      } else {
        // Reminder time has passed, trigger it

        this.triggerAlarm();
      }
    }
  }

  /**
   * Set up Page Visibility API listener to play alarm when user returns to tab
   */
  setupVisibilityListener() {
    if (typeof document === "undefined") {
      console.warn(
        "DashboardReminderService: Document not available, skipping visibility listener setup"
      );
      return;
    }

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.missedAlarmWhileHidden) {
        // User returned to tab, play alarm now
        this.playAlarmSound();
        this.notifyAlarmCallbacks(true);
        this.missedAlarmWhileHidden = false;

        // Vibrate if supported
        if ("vibrate" in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
      }
    });
  }

  /**
   * Schedule a new reminder
   */
  scheduleReminder(dateTimeMs) {
    // Save to storage
    this.saveToStorage({
      dateTime: dateTimeMs,
      isActive: true,
    });

    // Stop any existing check
    this.stopIntervalCheck();

    // Start monitoring
    this.startIntervalCheck();
  }

  /**
   * Start interval check for reminder time
   */
  startIntervalCheck() {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      const stored = this.getFromStorage();
      if (!stored || !stored.isActive) {
        this.stopIntervalCheck();
        return;
      }

      const now = Date.now();
      if (now >= stored.dateTime) {
        this.triggerAlarm();
      }
    }, CHECK_INTERVAL);
  }

  /**
   * Stop interval check
   */
  stopIntervalCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Trigger the alarm based on app visibility
   */
  async triggerAlarm() {
    // Stop interval check
    this.stopIntervalCheck();

    const isAppVisible = document.visibilityState === "visible";
    const isStandalonePWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    // Always attempt to play alarm sound (essential for PWA background alarms)
    this.playAlarmSound();
    this.notifyAlarmCallbacks(true);

    // Vibrate if supported (works in PWA even when backgrounded)
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Send notification if app is hidden (additional alert mechanism)
    // Important: Notifications work even when PWA is minimized
    if (!isAppVisible) {
      this.missedAlarmWhileHidden = true;
      await this.sendNotification();
    }
  }

  /**
   * Play alarm sound (looping)
   */
  playAlarmSound() {
    if (this.alarmAudio && !this.isAlarmPlaying) {
      this.alarmAudio.currentTime = 0;
      this.alarmAudio
        .play()
        .then(() => {
          this.isAlarmPlaying = true;
          console.log("DashboardReminderService: Alarm playing successfully");
        })
        .catch((error) => {
          console.warn(
            "DashboardReminderService: Audio play blocked (likely by browser policy):",
            error
          );
          // Mark as missed so it plays when user returns to tab/app
          this.missedAlarmWhileHidden = true;
          // For PWAs, the notification will still alert the user
        });
    }
  }

  /**
   * Stop alarm sound
   */
  stopAlarmSound() {
    if (this.alarmAudio && this.isAlarmPlaying) {
      this.alarmAudio.pause();
      this.alarmAudio.currentTime = 0;
      this.isAlarmPlaying = false;
    }
  }

  /**
   * Send browser notification
   */
  async sendNotification() {
    if (!("Notification" in window)) {
      console.warn("DashboardReminderService: Notifications not supported");
      return;
    }

    if (Notification.permission !== "granted") {
      console.warn(
        "DashboardReminderService: Notification permission not granted"
      );
      return;
    }

    try {
      // Try service worker notification first
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("Time to Practice! 🎹", {
          body: "Your practice reminder is here. Return to the app to hear the alarm!",
          icon: "/icons/favicon_192x192.png",
          badge: "/icons/favicon_96x96.png",
          tag: "dashboard-practice-reminder",
          requireInteraction: true,
          silent: false,
          vibrate: [200, 100, 200, 100, 200],
          data: {
            type: "dashboard-practice-reminder",
            url: "/",
          },
          actions: [
            { action: "dismiss", title: "Dismiss" },
            { action: "snooze", title: "Snooze 15 min" },
          ],
        });
      } else {
        // Fallback to regular notification
        const notification = new Notification("Time to Practice! 🎹", {
          body: "Your practice reminder is here. Return to the app to hear the alarm!",
          icon: "/icons/favicon_192x192.png",
          badge: "/icons/favicon_96x96.png",
          tag: "dashboard-practice-reminder",
          requireInteraction: true,
          silent: false,
          vibrate: [200, 100, 200, 100, 200],
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    } catch (error) {
      console.error(
        "DashboardReminderService: Failed to send notification:",
        error
      );
    }
  }

  /**
   * Stop alarm completely and clear reminder
   */
  stopAlarm() {
    this.stopAlarmSound();
    this.stopIntervalCheck();
    this.clearStorage();
    this.missedAlarmWhileHidden = false;
    this.notifyAlarmCallbacks(false);
  }

  /**
   * Snooze the alarm for specified minutes
   */
  snooze(minutes = 15) {
    this.stopAlarmSound();
    this.notifyAlarmCallbacks(false);

    const snoozeTime = Date.now() + minutes * 60 * 1000;
    this.scheduleReminder(snoozeTime);
  }

  /**
   * Cancel active reminder
   */
  cancelReminder() {
    this.stopAlarm();
  }

  /**
   * Get active reminder info
   */
  getActiveReminder() {
    const stored = this.getFromStorage();
    if (!stored || !stored.isActive) {
      return null;
    }

    const now = Date.now();
    const timeLeft = stored.dateTime - now;

    if (timeLeft <= 0) {
      return null;
    }

    return {
      dateTime: stored.dateTime,
      timeLeft: timeLeft,
    };
  }

  /**
   * Check if alarm is currently playing
   */
  isAlarmActive() {
    return this.isAlarmPlaying;
  }

  /**
   * Register callback for alarm state changes
   */
  onAlarmStateChange(callback) {
    this.alarmCallbacks.add(callback);
    return () => this.alarmCallbacks.delete(callback);
  }

  /**
   * Notify all callbacks about alarm state change
   */
  notifyAlarmCallbacks(isPlaying) {
    this.alarmCallbacks.forEach((callback) => {
      try {
        callback(isPlaying);
      } catch (error) {
        console.error("DashboardReminderService: Callback error:", error);
      }
    });
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!("Notification" in window)) {
      throw new Error("Notifications are not supported");
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Get notification permission status
   */
  getPermissionStatus() {
    if (!("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  }

  /**
   * Save reminder to localStorage
   */
  saveToStorage(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error(
        "DashboardReminderService: Failed to save to storage:",
        error
      );
    }
  }

  /**
   * Get reminder from localStorage
   */
  getFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(
        "DashboardReminderService: Failed to get from storage:",
        error
      );
      return null;
    }
  }

  /**
   * Clear reminder from localStorage
   */
  clearStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error(
        "DashboardReminderService: Failed to clear storage:",
        error
      );
    }
  }
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

// Export singleton instance
export const dashboardReminderService = new DashboardReminderService();

export default dashboardReminderService;
