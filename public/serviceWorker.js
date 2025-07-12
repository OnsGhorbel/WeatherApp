const CACHE_NAME = "weather-app-v7";
const urlsToCache = [
  "/",
  "/index.html",
  "/offline.html",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/logo.png"
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
  // Handle API requests differently
  if (event.request.url.includes('api.weatherapi.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If network request fails, we'll let the OfflineService handle it
        return new Response(
          JSON.stringify({ error: 'Network unavailable, request queued' }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
  } else {
    // Handle other requests with cache-first strategy
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(() => {
          // If it's a navigation request, return offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Network error', { status: 503 });
        });
      })
    );
  }
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

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Handle different actions
  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action (clicking on notification body)
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Handle push events (for future FCM integration)
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Weather Alert',
    body: 'Check your daily weather forecast',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'weather-push',
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});
