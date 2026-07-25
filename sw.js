const CACHE_NAME = "yadavar-ghors-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});

// The page posts due reminders here so a notification can still be shown
// even if the tab is in the background (as long as the browser keeps this
// worker alive). True "app fully closed" alarms need a push server and are
// not possible from a static, offline PWA — see the note in the app's
// settings tab.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SHOW_REMINDER") {
    self.registration.showNotification(data.title || "یادآور قرص", {
      body: data.body || "",
      icon: "icons/icon-192.png",
      badge: "icons/icon-96.png",
      tag: data.tag,
      dir: "rtl",
      lang: "fa",
      vibrate: [120, 60, 120],
      data: { doseId: data.doseId }
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow("./index.html");
      }
    })
  );
});
