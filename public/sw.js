// Service worker minimale per Joshly: mette in cache la shell dell'app
// così l'icona sulla home screen si apre subito anche con connessione debole.
// Non c'è caching aggressivo dei dati: libri e scaffali vengono sempre letti da Supabase.

const CACHE_NAME = "joshly-shell-v1";
const SHELL_URLS = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Solo asset statici propri: mai la navigazione o le chiamate a Supabase/Open Library.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!SHELL_URLS.includes(url.pathname)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
