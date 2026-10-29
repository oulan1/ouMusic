const CACHE_NAME = 'oumusic-shell-v1.0.0';

const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './artists.txt',
  './tracks/catalog.json',
  './assets/icons.svg',
  './assets/default-cover.svg',
  './css/tokens.css',
  './css/main.css',
  './css/components.css',
  './css/player.css',
  './js/i18n.js',
  './js/app.js',
  './js/core/engine.js',
  './js/core/oump3.js',
  './js/core/storage.js',
  './js/modules/github.js',
  './js/modules/wave.js',
  './js/modules/player-ui.js',
  './js/modules/lyrics.js',
  './js/modules/studio.js',
  './js/modules/artists.js',
  './js/modules/importer.js',
  './js/modules/recap.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Non-critical assets pre-cache issue:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key.startsWith('oumusic-')) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Range requests (аудиостриминг первых байт или потоковое аудио) пропускаем напрямую в сеть
  if (request.headers.get('range')) {
    return;
  }

  // Для запросов каталога используем Network First с откатом на кэш
  if (url.pathname.endsWith('catalog.json') || url.pathname.endsWith('artists.txt')) {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Для статических ассетов App Shell используем Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise || fetch(request);
    })
  );
});
