const CACHE_NAME = 'lumina-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Domains that should be cached for offline use (CDNs)
const CDN_DOMAINS = [
  'esm.sh',
  'cdn.tailwindcss.com',
  'picsum.photos',
  'lucide.dev'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network First strategy for HTML to ensure freshness, falling back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Stale-While-Revalidate for CDNs and static assets
  // This allows the app to load instantly from cache while updating in background
  if (CDN_DOMAINS.some(domain => url.hostname.includes(domain)) || 
      event.request.url.startsWith(self.location.origin)) {
    
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Check if valid response
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });

        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default fallback
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});