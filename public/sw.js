const CACHE_NAME = 'activados-v1';
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

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip ALL API endpoints, images, SSE, and non-GET requests
  // These should go directly to network without SW intervention
  const isApiOrImage = url.pathname.startsWith('/api/') || url.pathname.startsWith('/images/');
  const isNotGet = event.request.method !== 'GET';
  const isSse = url.pathname.includes('stream') || 
    event.request.headers.get('accept')?.includes('text/event-stream');

  if (isApiOrImage || isNotGet || isSse) {
    // Bypass SW completely - go directly to network
    event.respondWith(fetch(event.request).catch(() => {
      // If network fails, return network error
      return new Response('Network error', { status: 500 });
    }));
    return;
  }

  // Only cache GET requests for static assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache non-ok responses
        if (!response.ok) {
          return response;
        }
        // Clone and cache only successful GET responses
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});