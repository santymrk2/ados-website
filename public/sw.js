const CACHE_NAME = 'activados-v2';
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Bypass SSE and API requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass API and SSE (Live) requests so the browser handles them natively
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Always bypass - go directly to network
  event.respondWith(fetch(event.request));
});