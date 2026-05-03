const CACHE_NAME = 'elg-cache-v3';
// Relative URLs resolve against the SW's scope, so this works on any
// hosting path (e.g. GitHub Pages subpath /english-learning-games/).
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './icon-192x192.png',
  './icon-512x512.png',
  './manifest.json',
  './grammar-games/index.html',
  './grammar-games/present-tense/verb-match/index.html',
  './grammar-games/present-tense/fill-gap/index.html',
  './grammar-games/present-tense/sentence-builder/index.html',
  './grammar-games/adjectives/comparative-superlative/learn.html',
  './grammar-games/adjectives/comparative-superlative/index.html',
  './grammar-games/adverbs/frequency-adverbs/index.html',
  './grammar-games/numbers/ordinal-numbers/learn.html',
  './grammar-games/numbers/ordinal-numbers/index.html',
  './letter-mole/index.html',
  './letter-mole/styles.css',
  './letter-mole/game.js',
  './roblox-runner/index.html',
  './word-garden-defense/index.html',
  './word-garden-defense/styles.css',
  './word-garden-defense/game.js',
  './shared/question-bank.js'
];

// Install: cache assets individually so a single 404 doesn't abort the whole install.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(ASSETS_TO_CACHE.map(url => cache.add(url)))
    )
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

// Fetch strategy:
//  - HTML/CSS/JS/JSON + navigations: network-first so fixes land immediately;
//    fall back to cache only when offline.
//  - Everything else (images, fonts, audio): cache-first for fast loads.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isCodeOrPage =
    event.request.mode === 'navigate' ||
    /\.(html?|css|js|mjs|json)$/.test(url.pathname) ||
    url.pathname.endsWith('/');

  if (isCodeOrPage) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
