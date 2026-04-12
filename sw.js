const CACHE_NAME = 'elg-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/grammar-games/index.html',
  '/grammar-games/present-tense/verb-match/index.html',
  '/grammar-games/present-tense/fill-gap/index.html',
  '/grammar-games/present-tense/sentence-builder/index.html',
  '/grammar-games/adjectives/comparative-superlative/learn.html',
  '/grammar-games/adjectives/comparative-superlative/index.html',
  '/grammar-games/adverbs/frequency-adverbs/index.html',
  '/grammar-games/numbers/ordinal-numbers/learn.html',
  '/grammar-games/numbers/ordinal-numbers/index.html',
  '/letter-mole/index.html'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Return cache but also update in background
        const fetchPromise = fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
