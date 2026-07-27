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

// پیام واقعی Push که از سرور (Cloudflare Worker) می‌رسد — حتی وقتی برنامه کاملاً بسته باشد
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {
    data = { title: "یادآور قرص", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "یادآور قرص", {
      body: data.body || "",
      icon: "icons/icon-192.png",
      badge: "icons/icon-96.png",
      tag: data.tag,
      renotify: !!data.tag,
      dir: "rtl",
      lang: "fa",
      vibrate: [120, 60, 120],
      data: { doseId: data.doseId }
    })
  );
});

// The page can also post a reminder directly (e.g. the in-app "تست یادآوری"
// fallback) so a notification shows even if the tab is just in the background.
// Real "app fully closed" alarms come through the push event above, sent by
// the Cloudflare Worker backend.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SHOW_REMINDER") {
    self.registration.showNotification(data.title || "یادآور قرص", {
      body: data.body || "",
      icon: "icons/icon-192.png",
      badge: "icons/icon-96.png",
      tag: data.tag,
      renotify: !!data.tag,
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
