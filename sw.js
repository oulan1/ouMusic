const CACHE_NAME = 'oumusic-shell-v2.7.16';

const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './artists.txt',
  './tracks/catalog.json',
  './tracks/catalog.js',
  './playlists/playlists.js',
  './playlists/playlists.json',
  './assets/fonts/YSMusic-HeadlineBold.ttf',
  './assets/icons.svg',
  './assets/oumusic.png',
  './css/tokens.css',
  './css/main.css',
  './css/components.css',
  './css/player.css',
  './js/vendor/jszip.min.js',
  './js/vendor/liquidglass.js',
  './js/i18n.js',
  './js/app.js',
  './js/app.standalone.js',
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
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        APP_SHELL_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW] Pre-cache item warning:', url, err))
        )
      );
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

  // 1. Navigation requests (PWA offline boot & reload)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(async () => {
        return (await caches.match(request, { ignoreSearch: true })) ||
               (await caches.match('./index.html')) ||
               (await caches.match('index.html')) ||
               (await caches.match('./'));
      })
    );
    return;
  }

  // 2. Audio track files (.oump3 / .wav / .mp3) - Cache First with offline fallback
  if (url.pathname.endsWith('.oump3') || url.pathname.endsWith('.wav') || url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return resp;
        }).catch(() => null);
      })
    );
    return;
  }

  // 3. Metadata files (catalog.json, artists.txt) - Network First with Cache Fallback
  if (url.pathname.endsWith('catalog.json') || url.pathname.endsWith('artists.txt')) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' }).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => caches.match(request, { ignoreSearch: true }))
    );
    return;
  }

  // 4. App Shell assets (CSS, JS, Icons) - Cache First with Background Revalidation
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
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
