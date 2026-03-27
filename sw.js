// PVSS Service Worker v1
const CACHE_NAME = 'pvss-v1';
const OFFLINE_URL = 'pvss_member_portal_v2.html';

// Files to cache for offline use
const CACHE_FILES = [
  'pvss_member_portal_v2.html',
  'manifest.json'
];

// Install — cache core files
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_FILES);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', function(e) {
  // Don't cache Apps Script API calls
  if (e.request.url.includes('script.google.com')) {
    return; // pass through, no caching
  }
  e.respondWith(
    fetch(e.request).then(function(response) {
      // Cache successful GET responses
      if (e.request.method === 'GET' && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Network failed — serve from cache
      return caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        // For navigation, return the app shell
        if (e.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
