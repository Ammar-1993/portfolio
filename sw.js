/* /portfolio/sw.js */
const BASE = "./";
const VERSION = "v1.6.1"; // bump version for cache updates
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const PRECACHE_URLS = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}index-en.html`,
  `${BASE}css/style.min.css`,
  `${BASE}js/main.js`,
  `${BASE}js/portfolio-render.js`,
  `${BASE}favicon.ico`,
  `${BASE}assets/icons/favicon-32x32.png`,
  `${BASE}assets/icons/icon-192.png`,
  `${BASE}assets/icons/icon-512.png`,
  `${BASE}assets/icons/apple-touch-icon-180.png`,
  `${BASE}assets/fonts/cairo/Cairo-Regular.woff2`,
  `${BASE}assets/fonts/cairo/Cairo-ExtraBold.woff2`,
  `${BASE}images/hero4.webp`,
  `${BASE}images/about_hero.webp`,
  `${BASE}offline.html`,
  `${BASE}data/portfolio.json`,
];

// 1. Install Phase: Pre-cache essential static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()), // Force the waiting service worker to become the active service worker
  );
});

// 2. Activate Phase: Cache Management (Delete old/outdated caches)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        );
      })
      .then(() => self.clients.claim()), // Claim any clients immediately
  );
});

// 3. Fetch Phase: Stale-While-Revalidate Strategy
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle HTTP/HTTPS GET requests
  if (req.method !== "GET" || !req.url.startsWith("http")) return;

  event.respondWith(
    (async () => {
      // Check if we have a cached response
      const cachedResponse = await caches.match(req);

      // Fetch from the network in the background to keep the cache fresh
      const networkPromise = fetch(req)
        .then(async (networkResponse) => {
          // Only cache valid basic responses (from our origin)
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          // If the network fails and we already have a cached response, return it silently
          if (cachedResponse) {
            return cachedResponse;
          }
          // If we DON'T have a cached response, fallback to offline.html for navigation requests
          if (req.mode === "navigate") {
            const staticCache = await caches.open(STATIC_CACHE);
            const offlinePage = await staticCache.match(`${BASE}offline.html`);
            if (offlinePage) return offlinePage;
          }
          return Response.error();
        });

      // Return the cached response immediately if available, otherwise wait for the network response
      return cachedResponse || networkPromise;
    })(),
  );
});
