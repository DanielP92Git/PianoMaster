/**
 * Notification service for managing Web Push notifications
 */

/**
 * Check if browser supports push notifications
 * @returns {boolean} True if supported
 */
export function isPushNotificationSupported() {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Get current notification permission status
 * @returns {string} 'granted', 'denied', or 'default'
 */
export function getNotificationPermission() {
  if (!isPushNotificationSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 * @returns {Promise<string>} Permission status after request
 */
export async function requestNotificationPermission() {
  if (!isPushNotificationSupported()) {
    throw new Error("Push notifications are not supported in this browser");
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    throw error;
  }
}

/**
 * Subscribe to push notifications
 * @param {string} vapidPublicKey - VAPID public key from server
 * @returns {Promise<Object>} Push subscription object
 */
export async function subscribeToPushNotifications(vapidPublicKey) {
  if (!isPushNotificationSupported()) {
    throw new Error("Push notifications are not supported");
  }

  if (Notification.permission !== "granted") {
    throw new Error("Notification permission not granted");
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    const existingSubscription =
      await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return existingSubscription.toJSON();
    }

    // Create new subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    return subscription.toJSON();
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 * @returns {Promise<boolean>} True if successfully unsubscribed
 */
export async function unsubscribeFromPushNotifications() {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const success = await subscription.unsubscribe();
      return success;
    }

    return true;
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    throw error;
  }
}

/**
 * Get current push subscription
 * @returns {Promise<Object|null>} Current subscription or null
 */
export async function getCurrentPushSubscription() {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription ? subscription.toJSON() : null;
  } catch (error) {
    console.error("Error getting current subscription:", error);
    return null;
  }
}

/**
 * Check if current time is within quiet hours
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {boolean} True if currently in quiet hours
 */
export function isQuietHours(startTime, endTime) {
  if (!startTime || !endTime) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle quiet hours that span midnight
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Check if notification type is enabled
 * @param {Object} notificationTypes - Notification types object from preferences
 * @param {string} type - Notification type to check
 * @returns {boolean} True if enabled
 */
export function isNotificationTypeEnabled(notificationTypes, type) {
  if (!notificationTypes || typeof notificationTypes !== "object") {
    return true; // Default to enabled if not configured
  }

  return notificationTypes[type] !== false;
}

/**
 * Show a local notification (for testing or immediate feedback)
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 * @returns {Promise<void>}
 */
export async function showLocalNotification(title, options = {}) {
  if (!isPushNotificationSupported()) {
    console.warn("Notifications not supported");
    return;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: "/icons/favicon_192x192.png",
      badge: "/icons/favicon_96x96.png",
      ...options,
    });
  } catch (error) {
    console.error("Error showing notification:", error);
    throw error;
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 * @param {string} base64String - Base64 encoded VAPID key
 * @returns {Uint8Array} Converted key
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
