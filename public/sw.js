// Service Worker for PianoMaster PWA
// Based on Web.dev PWA best practices

const CACHE_NAME = "pianomaster-v1";
const ACCESSORY_CACHE_NAME = "pianomaster-accessories-v1";
const CACHE_WHITELIST = [CACHE_NAME, ACCESSORY_CACHE_NAME];
const OFFLINE_URL = "/offline.html";

// Assets to cache on install
const STATIC_CACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icons/favicon_96x96.png",
  "/icons/favicon_192x192.png",
  "/icons/favicon_384x384.png",
  "/icons/favicon_512x512.png",
];

// Runtime cache patterns
const RUNTIME_CACHE_PATTERNS = [
  // Cache Google Fonts
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  // Cache your API endpoints (adjust as needed)
  /^https:\/\/.*\.supabase\.co/,
];

async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const shouldCache =
      networkResponse &&
      (networkResponse.ok || networkResponse.type === "opaque");

    if (shouldCache) {
      // Ensure the cache write completes before returning the response to avoid
      // race conditions on immediate subsequent requests.
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    const fallbackCached = await cache.match(request);
    if (fallbackCached) return fallbackCached;
    return networkResponse;
  } catch (error) {
    const fallbackCached = await cache.match(request);
    if (fallbackCached) return fallbackCached;
    return new Response("", { status: 504, statusText: "Gateway Timeout" });
  }
}

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Cache the offline page first
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));

      // Cache other static assets
      try {
        await cache.addAll(STATIC_CACHE_URLS);
        console.log("Static assets cached successfully");
      } catch (error) {
        console.error("Failed to cache static assets:", error);
      }
    })()
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (!CACHE_WHITELIST.includes(cacheName)) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName).catch(() => {});
          }
          return Promise.resolve();
        })
      );

      // Enable navigation preload if supported
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      // Take control of all clients
      await self.clients.claim();
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  // Skip Vite dev server HMR and module requests
  const url = new URL(event.request.url);
  if (
    url.pathname.includes("@vite") ||
    url.pathname.includes("@react-refresh") ||
    url.pathname.includes("@id") ||
    url.pathname.includes("node_modules") ||
    url.searchParams.has("t") || // Vite timestamp query param
    url.pathname.endsWith(".jsx") ||
    url.pathname.endsWith(".tsx") ||
    url.pathname.endsWith(".ts")
  ) {
    return;
  }

  const isAccessoryAsset =
    url.origin.includes(".supabase.co") &&
    url.pathname.includes("/storage/v1/object/public/accessories");

  if (isAccessoryAsset) {
    event.respondWith(cacheFirst(event.request, ACCESSORY_CACHE_NAME));
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const isAsset = isSameOrigin && url.pathname.startsWith("/assets/");
  const isNavigate = event.request.mode === "navigate";

  // Offline reload support (preview/prod): serve app shell + hashed assets cache-first
  if (isSameOrigin && (isNavigate || isAsset)) {
    event.respondWith(
      (async () => {
        const response = await cacheFirst(event.request, CACHE_NAME);
        if (isNavigate && response && response.status === 504) {
          const offline = await caches.match(OFFLINE_URL);
          return offline || response;
        }
        return response;
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try to get the response from the network first
        const networkResponse = await fetch(event.request);

        // If successful, cache the response for runtime patterns
        if (networkResponse.ok) {
          const shouldCache = RUNTIME_CACHE_PATTERNS.some((pattern) =>
            pattern.test(event.request.url)
          );

          if (shouldCache) {
            const cache = await caches.open(CACHE_NAME);
            // Ensure the cache write completes before returning the response to avoid
            // race conditions on immediate subsequent requests.
            try {
              await cache.put(event.request, networkResponse.clone());
            } catch (cacheError) {
              // Never fail the fetch just because caching failed.
              console.warn("Service Worker: cache.put failed:", cacheError);
            }
          }
        }

        return networkResponse;
      } catch (error) {
        console.log("Network request failed, trying cache...", error);

        // Network failed, try cache
        const cachedResponse = await caches.match(event.request);

        if (cachedResponse) {
          return cachedResponse;
        }

        // If it's a navigation request and we don't have it cached,
        // return the offline page
        if (event.request.mode === "navigate") {
          console.log("Returning offline page");
          return caches.match(OFFLINE_URL);
        }

        // For other requests, return a generic offline response
        return new Response(
          JSON.stringify({
            error: "Offline",
            message: "You are currently offline",
          }),
          {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    })()
  );
});

// Handle background sync (for future use)
self.addEventListener("sync", (event) => {
  console.log("Background sync event:", event.tag);

  if (event.tag === "practice-session-sync") {
    event.waitUntil(syncPracticeSessions());
  }
});

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  let notificationData = {
    title: "PianoMaster",
    body: "You have a new notification",
    icon: "/icons/favicon_192x192.png",
    badge: "/icons/favicon_96x96.png",
    tag: "default",
    data: {},
  };

  // Parse notification data from push event
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || payload.type || notificationData.tag,
        data: payload.data || {},
      };
    } catch (error) {
      console.error("Error parsing push notification data:", error);
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    tag: notificationData.tag,
    requireInteraction: false,
    data: {
      ...notificationData.data,
      dateOfArrival: Date.now(),
      clickAction: notificationData.data.url || "/",
    },
    actions: [
      {
        action: "open",
        title: "Open",
        icon: "/icons/favicon_96x96.png",
      },
      {
        action: "close",
        title: "Dismiss",
        icon: "/icons/favicon_96x96.png",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received:", event);

  const notificationType = event.notification.data?.type;
  const action = event.action;

  // Handle dashboard practice reminder actions
  if (notificationType === "dashboard-practice-reminder") {
    if (action === "snooze") {
      event.notification.close();
      // Send message to client to snooze reminder
      event.waitUntil(
        (async () => {
          const allClients = await self.clients.matchAll({ type: "window" });
          for (const client of allClients) {
            client.postMessage({
              type: "SNOOZE_DASHBOARD_REMINDER",
              minutes: 15,
            });
          }
        })()
      );
      return;
    }

    if (action === "dismiss") {
      event.notification.close();
      // Send message to stop alarm
      event.waitUntil(
        (async () => {
          const allClients = await self.clients.matchAll({ type: "window" });
          for (const client of allClients) {
            client.postMessage({
              type: "STOP_ALARM",
            });
          }
        })()
      );
      return;
    }

    if (!action) {
      event.notification.close();
      // Open dashboard
      event.waitUntil(
        (async () => {
          const urlToOpen = new URL("/", self.location.origin).href;
          const allClients = await self.clients.matchAll({
            type: "window",
            includeUncontrolled: true,
          });

          // Focus existing window or open new one
          for (const client of allClients) {
            if ("focus" in client) {
              return client.focus();
            }
          }

          if (self.clients.openWindow) {
            return self.clients.openWindow(urlToOpen);
          }
        })()
      );
      return;
    }
  }

  // Handle practice reminder actions (from settings)
  if (notificationType === "practice-reminder") {
    if (action === "snooze") {
      event.notification.close();
      // Send message to client to snooze reminder
      event.waitUntil(
        (async () => {
          const allClients = await self.clients.matchAll({ type: "window" });
          for (const client of allClients) {
            client.postMessage({
              type: "SNOOZE_REMINDER",
              minutes: 15,
            });
          }
        })()
      );
      return;
    }

    if (action === "practice" || !action) {
      event.notification.close();
      // Open practice mode
      event.waitUntil(
        (async () => {
          const urlToOpen = new URL("/practice", self.location.origin).href;
          const allClients = await self.clients.matchAll({
            type: "window",
            includeUncontrolled: true,
          });

          // Focus existing window or open new one
          for (const client of allClients) {
            if (client.url.includes("/practice") && "focus" in client) {
              return client.focus();
            }
          }

          if (self.clients.openWindow) {
            return self.clients.openWindow(urlToOpen);
          }
        })()
      );
      return;
    }
  }

  // Default behavior for other notifications
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  // Get the URL to open
  const urlToOpen =
    event.notification.data?.clickAction ||
    event.notification.data?.url ||
    (event.action === "open" ? "/" : "/");

  // Open or focus the app window
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Check if there's already a window open
      for (const client of allClients) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

// Utility function for syncing practice sessions (placeholder)
async function syncPracticeSessions() {
  try {
    // This would sync any offline practice sessions
    // Implementation depends on your offline storage strategy
    console.log("Syncing practice sessions...");
  } catch (error) {
    console.error("Failed to sync practice sessions:", error);
  }
}

// Handle service worker updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
// (no duplicate activate handler)
