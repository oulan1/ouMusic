import { parseOump3HeaderFast } from '../core/oump3.js';
import { saveTrackMetadata, getTrackMetadata, getAllTracksMetadata } from '../core/storage.js';

const DEFAULT_OWNER = 'oulan1';
const DEFAULT_REPO = 'ouMusic';

let catalogCache = [];
let intersectionObserver = null;

export function getRepoInfo() {
  const host = window.location.hostname;
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  if (host.endsWith('github.io') && pathParts.length > 0) {
    const owner = host.split('.')[0];
    const repo = pathParts[0];
    return { owner, repo };
  }

  return { owner: DEFAULT_OWNER, repo: DEFAULT_REPO };
}

/* ==========================================================================
   Dual Catalog Fetching (Local static JSON first + ETag API fallback)
   ========================================================================== */
export async function loadCatalog() {
  let tracks = [];

  // 1. Быстрое чтение локального catalog.json (0 лимитов)
  try {
    const res = await fetch('./tracks/catalog.json', { cache: 'no-cache' });
    if (res.ok) {
      tracks = await res.json();
      console.log(`[GitHub] Loaded ${tracks.length} track(s) from local catalog.json`);
    }
  } catch (err) {
    console.warn('[GitHub] Could not load local catalog.json, trying API:', err);
  }

  // 2. Фоновая проверка репозитория GitHub через ETag кэширование
  try {
    const { owner, repo } = getRepoInfo();
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/tracks`;
    const etagKey = `etag_${apiUrl}`;
    const cachedEtag = localStorage.getItem(etagKey);

    const headers = {};
    if (cachedEtag) {
      headers['If-None-Match'] = cachedEtag;
    }

    const apiRes = await fetch(apiUrl, { headers }).catch(() => null);

    if (apiRes && apiRes.status === 200) {
      const etag = apiRes.headers.get('ETag');
      if (etag) localStorage.setItem(etagKey, etag);

      const items = await apiRes.json();
      if (Array.isArray(items)) {
        const oump3Files = items.filter((f) => f.name.toLowerCase().endsWith('.oump3'));

        oump3Files.forEach((file) => {
          const rawName = file.name.slice(0, -6);
          let artist = 'Неизвестный исполнитель';
          let title = rawName;

          if (rawName.includes(' - ')) {
            const parts = rawName.split(' - ');
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          }

          const existing = tracks.find((t) => t.filename === file.name);
          if (!existing) {
            tracks.push({
              id: btoa(unescape(encodeURIComponent(file.name))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16),
              filename: file.name,
              title,
              artist,
              genres: [],
              duration: 0,
              hasLyrics: true,
              thumbBase64: null,
              size: file.size,
              downloadUrl: file.download_url
            });
          }
        });
      }
    }
  } catch (e) {
    console.warn('[GitHub] API check skipped or rate limited:', e);
  }

  // Сливаем с локальными метаданными из IndexedDB
  const localMetas = await getAllTracksMetadata();
  const metaMap = new Map();
  localMetas.forEach((m) => metaMap.set(m.id || m.filename, m));

  tracks = tracks.map((t) => {
    const cached = metaMap.get(t.id) || metaMap.get(t.filename);
    if (cached) {
      return { ...t, ...cached };
    }
    return t;
  });

  catalogCache = tracks;
  return tracks;
}

export function getCachedCatalog() {
  return catalogCache;
}

/* ==========================================================================
   Lazy Range-Fetching for Covers (First 64 KB, HTTP Range)
   ========================================================================== */
export function initLazyCoversObserver(onMetadataLoadedCallback) {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(async (entry) => {
        if (!entry.isIntersecting) return;

        const rowEl = entry.target;
        intersectionObserver.unobserve(rowEl);

        const trackId = rowEl.getAttribute('data-track-id');
        const filename = rowEl.getAttribute('data-filename');
        if (!filename) return;

        // Проверяем, есть ли уже мини-обложка
        const cachedMeta = await getTrackMetadata(trackId);
        if (cachedMeta && cachedMeta.thumbBase64) {
          if (onMetadataLoadedCallback) onMetadataLoadedCallback(cachedMeta);
          return;
        }

        // Запрашиваем первые 64 КБ (Range: bytes=0-65535)
        try {
          const fileUrl = `./tracks/${encodeURIComponent(filename)}`;
          const res = await fetch(fileUrl, {
            headers: { Range: 'bytes=0-65535' }
          });

          if (res.status === 206 || res.status === 200) {
            const buffer = await res.arrayBuffer();
            const headerData = parseOump3HeaderFast(buffer);

            if (headerData) {
              const fullMeta = {
                id: trackId,
                filename,
                title: headerData.title,
                artist: headerData.artist,
                genres: headerData.genres,
                duration: headerData.duration,
                hasLyrics: headerData.hasLyrics,
                thumbBase64: headerData.thumbBase64,
                isLocal: false
              };

              await saveTrackMetadata(fullMeta);

              // Обновляем в runtime кэше
              const idx = catalogCache.findIndex((t) => t.id === trackId || t.filename === filename);
              if (idx !== -1) {
                catalogCache[idx] = { ...catalogCache[idx], ...fullMeta };
              }

              if (onMetadataLoadedCallback) {
                onMetadataLoadedCallback(fullMeta);
              }
            }
          }
        } catch (err) {
          console.warn(`[GitHub] Lazy range header fetch failed for ${filename}:`, err);
        }
      });
    },
    { rootMargin: '100px 0px', threshold: 0.01 }
  );
}

export function observeTrackRow(element) {
  if (intersectionObserver && element) {
    intersectionObserver.observe(element);
  }
}
