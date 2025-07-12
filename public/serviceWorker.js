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
