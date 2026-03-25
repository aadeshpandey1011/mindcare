/**
 * MindCare Service Worker
 * Provides offline support for the app shell and caches static assets.
 * Uses a Cache-First strategy for static assets and Network-First for API calls.
 */

const CACHE_NAME    = "mindcare-v1";
const OFFLINE_URL   = "/offline.html";

// Assets to pre-cache on install (app shell)
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
];

// ── Install: pre-cache app shell ─────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: route requests ────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API requests — Network First, fall back to cached
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache successful GET responses from wellness endpoint (mood, onboarding)
          if (res.ok && url.pathname.includes("/wellness/")) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Navigation requests — serve index.html from cache (SPA routing)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(() =>
          caches.match("/index.html").then((cached) => cached || fetch("/index.html"))
        )
    );
    return;
  }

  // Static assets — Cache First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      });
    })
  );
});

// ── Message: skip waiting (for update prompt) ─────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
