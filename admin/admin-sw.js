// PVSS Admin Panel — Service Worker
// Network-first strategy: always try the network first so admins see live
// data and the newest deployed version; fall back to cache only when
// offline. This avoids the "stuck on an old cached version" problem PWAs
// are prone to.

const CACHE_NAME = 'pvss-admin-cache-v2';
const PRECACHE_URLS = [
  './',
  'index.html',
  'admin-manifest.json',
  'admin-icon-192.png',
  'admin-icon-512.png'
];


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle same-origin GET requests; let everything else (API calls to
  // the Apps Script backend, CDN scripts) pass through untouched.
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
