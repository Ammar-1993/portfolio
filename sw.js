
/**
 * Service Worker for Portfolio PWA
 * Version: 1.0.0
 * Implements advanced caching strategies for optimal performance
 */

const CACHE_NAME = 'portfolio-v1.0.0';
const STATIC_CACHE = 'portfolio-static-v1.0.0';
const DYNAMIC_CACHE = 'portfolio-dynamic-v1.0.0';
const API_CACHE = 'portfolio-api-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  './',
  './index.html',
  './index-en/index.html',
  './css/style.css',
  './js/main.mjs',
  './js/modules/navigation.js',
  './js/modules/portfolio.js',
  './js/modules/pwa.js',
  './js/modules/skills.js',
  './js/modules/theme.js',
  './js/modules/utils.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-192.png',
  './assets/icons/maskable-512.png',
  './assets/icons/apple-touch-icon-180.png',
  './assets/fonts/cairo/Cairo-Regular.woff2',
  './assets/fonts/cairo/Cairo-ExtraBold.woff2',
  './offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
  // Add any API endpoints if needed in the future
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Handle different resource types with appropriate caching strategies
  if (isStaticAsset(request.url)) {
    // Static assets: Cache-first strategy
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isApiRequest(request.url)) {
    // API requests: Network-first with cache fallback
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (isImageRequest(request.url)) {
    // Images: Cache-first with network fallback
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
  } else {
    // HTML pages and other resources: Network-first with offline fallback
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Cache-first strategy for static assets
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first failed:', error);
    // For static assets, if both cache and network fail, return offline page
    if (request.destination === 'document') {
      return caches.match('./offline.html');
    }
    return new Response('', { status: 404 });
  }
}

// Network-first strategy for dynamic content
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network-first failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's an HTML request and we have no cache, return offline page
    if (request.destination === 'document') {
      return caches.match('./offline.html');
    }

    return new Response('', { status: 404 });
  }
}

// Helper functions to identify request types
function isStaticAsset(url) {
  const staticExtensions = ['.css', '.js', '.woff2', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.ico'];
  return staticExtensions.some(ext => url.includes(ext)) ||
         STATIC_ASSETS.some(asset => url.includes(asset));
}

function isApiRequest(url) {
  return API_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

function isImageRequest(url) {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.gif'];
  return imageExtensions.some(ext => url.includes(ext));
}

// Background sync for offline actions (if needed in future)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  // Handle background sync events here if needed
});

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event.data?.text());
  // Handle push notifications here if needed
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});

// Periodic cache cleanup
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    console.log('[SW] Periodic cache cleanup');
    cleanupOldCaches();
  }
});

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];

  for (const cacheName of cacheNames) {
    if (!validCaches.includes(cacheName)) {
      await caches.delete(cacheName);
    }
  }
}
