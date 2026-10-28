// VIP CAR Conductor - Service Worker Oficial (PWA)
// Diseñado para operaciones mineras y socavón subterráneo con conectividad intermitente
const CACHE_NAME = 'vipcar-conductor-v1.0';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/logo-vipcar.png',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/conductor',
  '/conductor/checkin',
  '/conductor/checkout',
  '/conductor/averia',
];

// 1. Instalación y Precaché de rutas críticas de campo
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[PWA Service Worker] Precaching parcial de conductor:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activación y Limpieza de Caches Antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[PWA Service Worker] Depurando caché anterior:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Estrategia de Fetch Inteligente para Rutas y Assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignorar esquemas no soportados (chrome-extension:, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // A. Peticiones de Navegación HTML (SPA React / Rutas del Conductor):
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedRoute = await caches.match(req);
          if (cachedRoute) return cachedRoute;
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          return caches.match('/');
        })
    );
    return;
  }

  // B. Recursos Estáticos de Vite (JS, CSS, imágenes, logos): Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(req, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // C. Peticiones estándar
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
