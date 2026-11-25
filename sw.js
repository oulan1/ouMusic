const CACHE_NAME = 'oumusic-shell-v2.7.39';

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
  './assets/pause.png',
  './assets/covers/sqwore_barry_dylan.jpg',
  './assets/covers/semmmyq,_shinra_untitled.jpg',
  './css/tokens.css',
  './css/main.css',
  './css/components.css',
  './css/player.css',
  './js/vendor/jszip.min.js',
  './js/vendor/liquidglass.js',
  './js/vendor/qrcode.min.js',
  './js/vendor/jsqr.min.js',
  './js/i18n.js',
  './js/app.js',
  './js/app.standalone.js',
  './js/core/engine.js',
  './js/core/oump3.js',
  './js/core/storage.js',
  './js/core/sync.js',
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
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn('[SW] Pre-cache item warning:', url, err);
          })
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
          // Only clean up old shell caches; preserve oumusic-audio-v1 cached tracks
          if (key !== CACHE_NAME && key.startsWith('oumusic-shell-')) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Navigation requests (PWA offline boot & reload)
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedPage =
        (await cache.match(request, { ignoreSearch: true })) ||
        (await cache.match('./index.html', { ignoreSearch: true })) ||
        (await cache.match('index.html', { ignoreSearch: true })) ||
        (await cache.match('./', { ignoreSearch: true }));

      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = (controller && cachedPage) ? setTimeout(() => controller.abort(), 2500) : null;
        const networkResponse = await fetch(request, controller ? { signal: controller.signal } : undefined);
        if (timeoutId) clearTimeout(timeoutId);
        if (networkResponse && networkResponse.ok) {
          cache.put('./index.html', networkResponse.clone()).catch(() => {});
          cache.put(request, networkResponse.clone()).catch(() => {});
          return networkResponse;
        }
        if (cachedPage) return cachedPage;
        return networkResponse;
      } catch (_) {
        if (cachedPage) return cachedPage;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // 2. Audio track files (.oump3 / .wav / .mp3) - Cache First with offline fallback
  if (url.pathname.endsWith('.oump3') || url.pathname.endsWith('.wav') || url.pathname.endsWith('.mp3')) {
    event.respondWith((async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const resp = await fetch(request);
        if (resp && resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
        }
        return resp;
      } catch (_) {
        return Response.error();
      }
    })());
    return;
  }

  // 3. Metadata files (catalog.json, playlists.json, artists.txt) - Network First with Cache Fallback
  if (
    url.origin === self.location.origin &&
    (url.pathname.endsWith('catalog.json') || url.pathname.endsWith('playlists.json') || url.pathname.endsWith('artists.txt'))
  ) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 2500) : null;
        const networkResponse = await fetch(request, {
          cache: 'no-cache',
          signal: controller ? controller.signal : undefined
        });
        if (timeoutId) clearTimeout(timeoutId);
        if (networkResponse && networkResponse.ok) {
          cache.put(request, networkResponse.clone()).catch(() => {});
          return networkResponse;
        }
      } catch (_) {}

      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;

      const isJson = url.pathname.endsWith('.json');
      return new Response(isJson ? '[]' : '', {
        status: 200,
        headers: { 'Content-Type': isJson ? 'application/json' : 'text/plain; charset=utf-8' }
      });
    })());
    return;
  }

  // 4. App Shell assets (CSS, JS, Icons) - Cache First with Background Revalidation
  event.respondWith((async () => {
    const cachedResponse = await caches.match(request, { ignoreSearch: true });
    if (cachedResponse) {
      if (url.origin === self.location.origin) {
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse.clone())).catch(() => {});
          }
        }).catch(() => {});
      }
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
      }
      return networkResponse;
    } catch (_) {
      return Response.error();
    }
  })());
});
