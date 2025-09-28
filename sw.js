// Service Worker for PianoMaster PWA
// Based on Web.dev PWA best practices

const CACHE_NAME = "pianomaster-v1";
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
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );

      // Enable navigation preload if supported
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );

  // Take control of all clients
  self.clients.claim();
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
            cache.put(event.request, networkResponse.clone());
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

// Handle push notifications (for future use)
self.addEventListener("push", (event) => {
  console.log("Push event received");

  const options = {
    body: event.data ? event.data.text() : "Time to practice piano!",
    icon: "/icons/favicon_192x192.png",
    badge: "/icons/favicon_96x96.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Start Practice",
        icon: "/icons/favicon_96x96.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/favicon_96x96.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("PianoMaster", options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received.");

  event.notification.close();

  if (event.action === "explore") {
    // Open the app
    event.waitUntil(self.clients.openWindow("/"));
  }
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
