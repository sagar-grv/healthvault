/**
 * HealthVault Service Worker
 *
 * Provides:
 * - Offline access to cached reports and emergency card
 * - Background sync for queued uploads
 * - App shell caching for instant page loads
 * - Offline file queue processing
 */

const CACHE_NAME = 'healthvault-v2';
const STATIC_ASSETS = ['/', '/manifest.json', '/offline.html'];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (uploads, mutations)
  if (request.method !== 'GET') return;

  // API routes: network-only (don't cache dynamic data)
  if (url.pathname.startsWith('/api/')) return;

  // Emergency page: cache for offline access
  if (url.pathname.startsWith('/emergency/')) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Share page: cache for offline access
  if (url.pathname.startsWith('/share')) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Static assets and pages: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Background sync: process queued uploads when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-uploads') {
    event.waitUntil(syncUploads());
  }
});

async function syncUploads() {
  // Notify all clients that sync is starting
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_START' });
  }

  // The actual sync is handled by the client-side queue processor
  // This just triggers it
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_TRIGGER' });
  }
}

async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(CACHE_NAME).then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached || new Response('Offline', { status: 503 }));

  return cached || fetchPromise;
}
