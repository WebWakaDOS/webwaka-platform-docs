/**
 * WebWaka OS v4 Docs — Service Worker (PWA Offline Support)
 * QA Cert: Offline Resilience Testing
 */

const CACHE_NAME = 'webwaka-docs-v4-1';
const STATIC_ASSETS = [
  '/',
  '/css/main.css',
  '/js/main.js',
  '/openapi.json',
  '/api/status',
];

// Navigation routes that should fall back to the main shell
const NAV_ROUTES = [
  '/doc/',
  '/api-explorer',
  '/status',
  '/changelog',
  '/postman',
  '/translations/',
  '/versions/',
];

// ===== INSTALL: pre-cache static assets =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE: clean up old caches =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ===== FETCH: cache-first for static assets, network-first for API =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Network-first for API endpoints (except /api/status which we cache)
  if (url.pathname.startsWith('/api/') && url.pathname !== '/api/status') {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline', cached: false }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Stale-while-revalidate for /openapi.json (critical for offline API Explorer)
  if (url.pathname === '/openapi.json') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        }).catch(() => null);

        return cached || fetchPromise || new Response('{}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Cache-first for CSS, JS, fonts, images
  if (
    url.pathname.startsWith('/css/') ||
    url.pathname.startsWith('/js/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(woff2?|ttf|otf|eot|svg|png|jpg|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
      )
    );
    return;
  }

  // Network-first with offline fallback for doc pages
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.method === 'GET') {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Offline fallback: return the cached homepage shell
        const fallback = await caches.match('/');
        if (fallback) return fallback;

        return new Response(
          `<!DOCTYPE html><html><head><title>Offline — WebWaka Docs</title></head>
          <body style="font-family:sans-serif;text-align:center;padding:4rem">
            <h1>You are offline</h1>
            <p>WebWaka OS v4 documentation is not available offline for this page.</p>
            <p>Pages you have visited before are still accessible.</p>
            <a href="/">Return to home</a>
          </body></html>`,
          { status: 503, headers: { 'Content-Type': 'text/html' } }
        );
      })
  );
});

// ===== BACKGROUND SYNC: queue failed feedback submissions =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-feedback') {
    event.waitUntil(syncPendingFeedback());
  }
});

async function syncPendingFeedback() {
  try {
    const cache = await caches.open(CACHE_NAME + '-pending');
    const keys = await cache.keys();
    await Promise.all(
      keys.map(async (req) => {
        const res = await cache.match(req);
        if (!res) return;
        const body = await res.json();
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (response.ok) await cache.delete(req);
      })
    );
  } catch (err) {
    console.error('[SW] Background sync failed:', err);
  }
}
