const CACHE_NAME = 'ganancy-pwa-v1';

// Dynamic resources are cached as they are fetched to support unique build hashes
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first with Cache-fallback strategy for SaaS reliability
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and local/Supabase requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // Bypasses caching for local development to prevent state and component hot-reload conflicts
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, clone it and put in cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails (offline)
        return caches.match(event.request);
      })
  );
});
