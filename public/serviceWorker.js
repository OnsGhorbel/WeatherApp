const CACHE_NAME = "weather-app-v6";
const urlsToCache = [
  `index.html`,
  `offline.html`,
];

// install sw

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache opened!");
      return cache.addAll(urlsToCache);
    })
  );
});

// listen for requests

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => caches.match("offline.html"));
    })
  );
});

// activate sw

self.addEventListener("activate", (event) => {
  const cacheWhiteList = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhiteList.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
