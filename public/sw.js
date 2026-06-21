const CACHE_NAME = 'campus-ai-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// Periodic Sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'sync-weather') {
    console.log('Periodic sync for weather triggered.');
  }
});

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages') {
    console.log('Background sync for messages triggered.');
  }
});

// Web Push Notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'Campus AI', body: 'Yeni bildirim.' };
  
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
