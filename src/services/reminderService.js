/**
 * Daily Practice Reminder Service
 * Handles scheduling and sending practice reminders via browser notifications
 */

const REMINDER_STORAGE_KEY = "dailyPracticeReminder";
const REMINDER_CHECK_INTERVAL = 60000; // Check every minute

class ReminderService {
  constructor() {
    this.checkInterval = null;
    this.scheduledTimeout = null;
  }

  /**
   * Check if notifications are supported
   */
  isSupported() {
    return "Notification" in window;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus() {
    if (!this.isSupported()) return "denied";
    return Notification.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error("Notifications are not supported in this browser");
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Parse time string (HH:MM) into hours and minutes
   */
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return { hours, minutes };
  }

  /**
   * Calculate milliseconds until next reminder time
   */
  getMillisecondsUntilTime(targetHours, targetMinutes) {
    const now = new Date();
    const target = new Date();
    target.setHours(targetHours, targetMinutes, 0, 0);

    // If target time has passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return target.getTime() - now.getTime();
  }

  /**
   * Send notification
   */
  async sendNotification(title, options = {}) {
    if (!this.isSupported()) {
      console.warn("Notifications not supported");
      return null;
    }

    if (Notification.permission !== "granted") {
      console.warn("Notification permission not granted");
      return null;
    }

    const defaultOptions = {
      icon: "/icons/favicon_192x192.png",
      badge: "/icons/favicon_96x96.png",
      vibrate: [200, 100, 200],
      requireInteraction: true,
      ...options,
    };

    // Use Service Worker notification if available
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, defaultOptions);
        return null;
      } catch (error) {
        console.error("Service Worker notification failed:", error);
      }
    }

    // Fallback to regular notification (without actions, which aren't supported)
    const { actions, ...regularNotificationOptions } = defaultOptions;
    return new Notification(title, regularNotificationOptions);
  }

  /**
   * Send practice reminder notification
   */
  async sendPracticeReminder() {

    const notification = await this.sendNotification("Time to Practice! 🎹", {
      body: "Your daily practice session is ready. Let's make music!",
      tag: "daily-practice-reminder",
      data: {
        type: "practice-reminder",
        url: "/practice",
      },
      actions: [
        { action: "practice", title: "Practice Now" },
        { action: "snooze", title: "Snooze 15 min" },
      ],
    });

    // Handle clicks on regular notifications (not service worker)
    if (notification) {
      notification.onclick = () => {
        window.focus();
        window.location.href = "/practice";
        notification.close();
      };
    }

    return notification;
  }

  /**
   * Schedule daily reminder
   */
  scheduleReminder(timeString, enabled = true) {

    // Clear existing schedules
    this.cancelReminder();

    if (!enabled) {
      this.clearStorage();
      return;
    }

    const { hours, minutes } = this.parseTime(timeString);
    const msUntilTime = this.getMillisecondsUntilTime(hours, minutes);

    // Store reminder settings
    this.saveToStorage({
      enabled,
      time: timeString,
      nextReminder: Date.now() + msUntilTime,
    });

    // Schedule the timeout
    this.scheduledTimeout = setTimeout(() => {
      this.sendPracticeReminder();
      // Reschedule for next day
      this.scheduleReminder(timeString, enabled);
    }, msUntilTime);

    // Also start periodic check (in case app was closed and reopened)
    this.startPeriodicCheck();
  }

  /**
   * Start periodic check for missed reminders
   */
  startPeriodicCheck() {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      const stored = this.getFromStorage();
      if (!stored || !stored.enabled) return;

      const now = Date.now();
      const nextReminder = stored.nextReminder;

      // If we missed the reminder (app was closed), send it now
      if (nextReminder && now >= nextReminder) {
        
        this.sendPracticeReminder();
        // Reschedule for next day
        this.scheduleReminder(stored.time, true);
      }
    }, REMINDER_CHECK_INTERVAL);
  }

  /**
   * Cancel scheduled reminder
   */
  cancelReminder() {
    if (this.scheduledTimeout) {
      clearTimeout(this.scheduledTimeout);
      this.scheduledTimeout = null;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

  }

  /**
   * Save reminder settings to localStorage
   */
  saveToStorage(data) {
    try {
      localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save reminder to storage:", error);
    }
  }

  /**
   * Get reminder settings from localStorage
   */
  getFromStorage() {
    try {
      const data = localStorage.getItem(REMINDER_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to get reminder from storage:", error);
      return null;
    }
  }

  /**
   * Clear reminder settings from localStorage
   */
  clearStorage() {
    try {
      localStorage.removeItem(REMINDER_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear reminder from storage:", error);
    }
  }

  /**
   * Initialize reminder on app load
   */
  initialize() {
    const stored = this.getFromStorage();
    if (stored && stored.enabled && stored.time) {
      
      this.scheduleReminder(stored.time, true);
    }
  }

  /**
   * Snooze reminder for specified minutes
   */
  snooze(minutes = 15) {

    const msUntilSnooze = minutes * 60 * 1000;

    this.scheduledTimeout = setTimeout(() => {
      this.sendPracticeReminder();
      // After snooze, restore original schedule
      const stored = this.getFromStorage();
      if (stored && stored.time) {
        this.scheduleReminder(stored.time, stored.enabled);
      }
    }, msUntilSnooze);
  }
}

// Export singleton instance
export const reminderService = new ReminderService();

export default reminderService;
