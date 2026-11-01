const CACHE_NAME = "fretboard-v2-tabs";
const FILES_TO_CACHE = ["/", "/index.html", "/css/style.css", "/js/scales.js?v=1",
  "/js/fretboard.js?v=2", "/js/tab.js?v=2", "/js/app.js?v=2", "/js/export.js?v=1"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("fretboard-") && key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if(event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  // Fetch current deployed files whenever online; retain an offline fallback.
  event.respondWith(fetch(event.request).then(response => {
    if(response.ok){
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
