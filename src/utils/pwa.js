// PWA utilities for PianoMaster
// Based on Web.dev PWA best practices

/**
 * Register the service worker
 */
export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Handle service worker updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker is available
              showUpdateAvailableNotification();
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error("ServiceWorker registration failed:", error);
      return null;
    }
  } else {
    
    return null;
  }
}

/**
 * Show update available notification
 */
function showUpdateAvailableNotification() {
  // You can integrate this with your toast system
  if (window.showUpdateNotification) {
    window.showUpdateNotification();
  } else {
    
  }
}

/**
 * Skip waiting and activate new service worker
 */
export function skipWaitingAndReload() {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }
}

/**
 * Check if app can be installed (PWA install prompt)
 */
export class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.canInstall = false;

    this.init();
  }

  init() {
    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {

      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Stash the event so it can be triggered later
      this.deferredPrompt = e;
      this.canInstall = true;

      // Notify that install is available
      this.onInstallAvailable();
    });

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      
      this.isInstalled = true;
      this.canInstall = false;
      this.deferredPrompt = null;

      // Notify that app was installed
      this.onInstalled();
    });

    // Check if already installed
    this.checkIfInstalled();
  }

  async checkIfInstalled() {
    // Check if running in standalone mode (installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      this.isInstalled = true;
      
    }

    // Check for related applications (more accurate but limited browser support)
    if ("getInstalledRelatedApps" in navigator) {
      try {
        const relatedApps = await navigator.getInstalledRelatedApps();
        this.isInstalled = relatedApps.length > 0;
      } catch (error) {
        
      }
    }
  }

  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      
      return false;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;

      // Clear the deferredPrompt
      this.deferredPrompt = null;
      this.canInstall = false;

      return outcome === "accepted";
    } catch (error) {
      console.error("Error showing install prompt:", error);
      return false;
    }
  }

  // Override these methods in your implementation
  onInstallAvailable() {
    
    // Show install button/banner
  }

  onInstalled() {
    
    // Hide install button, show success message
  }
}

/**
 * Network status utilities
 */
export class NetworkStatus {
  constructor() {
    this.isOnline = navigator.onLine;
    this.callbacks = {
      online: [],
      offline: [],
    };

    this.init();
  }

  init() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.callbacks.online.forEach((callback) => callback());
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.callbacks.offline.forEach((callback) => callback());
    });
  }

  onOnline(callback) {
    this.callbacks.online.push(callback);
  }

  onOffline(callback) {
    this.callbacks.offline.push(callback);
  }

  removeListener(type, callback) {
    const index = this.callbacks[type].indexOf(callback);
    if (index > -1) {
      this.callbacks[type].splice(index, 1);
    }
  }
}

/**
 * Background sync utilities (for future use)
 */
export async function requestBackgroundSync(tag) {
  if (
    "serviceWorker" in navigator &&
    "sync" in window.ServiceWorkerRegistration.prototype
  ) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      
      return true;
    } catch (error) {
      console.error("Background sync registration failed:", error);
      return false;
    }
  }

  return false;
}

/**
 * Push notification utilities (for future use)
 */
export async function subscribeToPushNotifications() {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.VITE_VAPID_PUBLIC_KEY || ""
          ),
        });
      }

      return subscription;
    } catch (error) {
      console.error("Push notification subscription failed:", error);
      return null;
    }
  }

  return null;
}

// Helper function for VAPID key conversion
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
