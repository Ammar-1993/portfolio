/* /portfolio/sw.js */
const BASE = './';
const VERSION = 'v1.3.8'; // bump version for cache updates
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const PRECACHE_URLS = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}index-en.html`,
  `${BASE}css/style.min.css`,
  `${BASE}js/main.js`,
  `${BASE}js/portfolio-render.js`,
  `${BASE}assets/icons/icon-192.png`,
  `${BASE}assets/icons/icon-512.png`,
  `${BASE}assets/icons/apple-touch-icon-180.png`,
  `${BASE}assets/fonts/cairo/Cairo-Regular.woff2`,
  `${BASE}assets/fonts/cairo/Cairo-ExtraBold.woff2`,
  `${BASE}images/hero4.webp`,
  `${BASE}images/about_hero.webp`,
  `${BASE}offline.html`
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// HTML: الشبكة أولاً ثم الكاش مع صفحة offline
// الأصول: stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (!url.pathname.startsWith(BASE)) return;

  // Navigation requests: network first, fallback to offline page
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(STATIC_CACHE);
        return (await cache.match(`./offline.html`)) || Response.error();
      }
    })());
    return;
  }

  // Assets: stale-while-revalidate
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});
