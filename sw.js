const CACHE_NAME = 'pvss-v42';
const FILES = [
  './',
  './index.html',
  './avatar.html',
  './manifest.json',
  './logo-192.png',
  './cards.html',
  './ribbon.html',
  './sw.js'
];

// Install: cache files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(FILES))
  );
  self.skipWaiting(); // activate immediately
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // take control immediately
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Update cache with fresh copy
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
