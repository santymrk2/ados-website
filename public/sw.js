const CACHE_NAME = "activados-v3";
const urlsToCache = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    }),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    self.registration.showNotification(data.title || "Activados", {
      body: data.body || "",
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/icon-192.png",
      data: data.data || {},
    });
  } catch {
    self.registration.showNotification("Activados", {
      body: event.data.text(),
      icon: "/icon-192.png",
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const matchingClient = windowClients.find(
          (client) => client.url === urlToOpen,
        );
        if (matchingClient) {
          return matchingClient.focus();
        }
        return self.clients.openWindow(urlToOpen);
      }),
  );
});
