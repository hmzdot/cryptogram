const CACHE_NAME = "cryptogram-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/quotes.js",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Cache and network race
self.addEventListener("fetch", (event) => {
  event.respondWith(
    Promise.race([
      // Try network first
      fetch(event.request)
        .then((response) => {
          // Clone the response because it can only be consumed once
          const responseClone = response.clone();

          // Update cache with new response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request);
        }),

      // Try cache first
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        // Cache miss, return network response
        return fetch(event.request);
      }),
    ]).catch(() => {
      // Both cache and network failed
      console.log("Both cache and network failed for:", event.request.url);
    })
  );
});

// Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
