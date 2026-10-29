const DB_NAME = 'oumusic_db';
const DB_VERSION = 1;

let dbInstance = null;

export async function initStorage() {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[Storage] Storage persistence active: ${isPersisted}`);
    } catch (e) {
      console.warn('[Storage] Persistence request failed:', e);
    }
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('tracks_metadata')) {
        db.createObjectStore('tracks_metadata', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offline_tracks')) {
        db.createObjectStore('offline_tracks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('likes')) {
        db.createObjectStore('likes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('history')) {
        const histStore = db.createObjectStore('history', { keyPath: 'histId', autoIncrement: true });
        histStore.createIndex('playedAt', 'playedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('recap_snapshots')) {
        db.createObjectStore('recap_snapshots', { keyPath: 'year' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      console.log('[Storage] IndexedDB initialized successfully.');
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('[Storage] IndexedDB initialization error:', event.target.error);
      reject(event.target.error);
    };
  });
}

function getStore(storeName, mode = 'readonly') {
  if (!dbInstance) {
    throw new Error('Database is not initialized. Call initStorage() first.');
  }
  const tx = dbInstance.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

/* ==========================================================================
   Tracks Metadata & Offline Audio
   ========================================================================== */
export async function saveTrackMetadata(track) {
  return new Promise((resolve, reject) => {
    const store = getStore('tracks_metadata', 'readwrite');
    const request = store.put(track);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getTrackMetadata(id) {
  return new Promise((resolve, reject) => {
    const store = getStore('tracks_metadata', 'readonly');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllTracksMetadata() {
  return new Promise((resolve, reject) => {
    const store = getStore('tracks_metadata', 'readonly');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineTrack(id, audioBlob, coverBlob = null, lrcText = '') {
  return new Promise((resolve, reject) => {
    const store = getStore('offline_tracks', 'readwrite');
    const record = {
      id,
      audioBlob,
      coverBlob,
      lrcText,
      cachedAt: new Date().toISOString(),
      size: (audioBlob ? audioBlob.size : 0) + (coverBlob ? coverBlob.size : 0)
    };
    const request = store.put(record);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineTrack(id) {
  return new Promise((resolve, reject) => {
    const store = getStore('offline_tracks', 'readonly');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOfflineTrack(id) {
  return new Promise((resolve, reject) => {
    const store = getStore('offline_tracks', 'readwrite');
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function isOffline(id) {
  const record = await getOfflineTrack(id);
  return !!record;
}

/* ==========================================================================
   Likes (Favorites)
   ========================================================================== */
export async function isLiked(id) {
  return new Promise((resolve, reject) => {
    const store = getStore('likes', 'readonly');
    const request = store.get(id);
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function toggleLike(id) {
  const currentlyLiked = await isLiked(id);
  return new Promise((resolve, reject) => {
    const store = getStore('likes', 'readwrite');
    if (currentlyLiked) {
      const request = store.delete(id);
      request.onsuccess = () => resolve(false);
      request.onerror = () => reject(request.error);
    } else {
      const request = store.put({ id, likedAt: new Date().toISOString() });
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    }
  });
}

export async function getAllLikes() {
  return new Promise((resolve, reject) => {
    const store = getStore('likes', 'readonly');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/* ==========================================================================
   Playlists (.oulist)
   ========================================================================== */
export async function createPlaylist(name, description = '', coverBase64 = null, trackIds = []) {
  const id = 'pl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const playlist = {
    id,
    name,
    description,
    coverBase64,
    trackIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const store = getStore('playlists', 'readwrite');
    const request = store.put(playlist);
    request.onsuccess = () => resolve(playlist);
    request.onerror = () => reject(request.error);
  });
}

export async function getPlaylist(id) {
  return new Promise((resolve, reject) => {
    const store = getStore('playlists', 'readonly');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllPlaylists() {
  return new Promise((resolve, reject) => {
    const store = getStore('playlists', 'readonly');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function updatePlaylist(id, data) {
  const playlist = await getPlaylist(id);
  if (!playlist) return null;

  const updated = {
    ...playlist,
    ...data,
    updatedAt: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const store = getStore('playlists', 'readwrite');
    const request = store.put(updated);
    request.onsuccess = () => resolve(updated);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePlaylist(id) {
  return new Promise((resolve, reject) => {
    const store = getStore('playlists', 'readwrite');
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/* ==========================================================================
   History & Listening Stats
   ========================================================================== */
export async function addHistory(trackId, durationPlayedSeconds = 0) {
  return new Promise((resolve, reject) => {
    const store = getStore('history', 'readwrite');
    const record = {
      trackId,
      durationPlayed: Math.round(durationPlayedSeconds),
      playedAt: new Date().toISOString()
    };
    const request = store.add(record);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getHistory(limit = 100) {
  return new Promise((resolve, reject) => {
    const store = getStore('history', 'readonly');
    const request = store.getAll();
    request.onsuccess = () => {
      const records = request.result || [];
      records.sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
      resolve(records.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearHistory() {
  return new Promise((resolve, reject) => {
    const store = getStore('history', 'readwrite');
    const request = store.clear();
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getStats() {
  const history = await getHistory(5000);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let monthSeconds = 0;
  let allTimeSeconds = 0;
  const trackCounts = {};

  history.forEach((item) => {
    const d = new Date(item.playedAt);
    const dur = item.durationPlayed || 0;
    allTimeSeconds += dur;
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      monthSeconds += dur;
    }
    trackCounts[item.trackId] = (trackCounts[item.trackId] || 0) + 1;
  });

  return {
    monthHours: (monthSeconds / 3600).toFixed(1),
    allTimeHours: (allTimeSeconds / 3600).toFixed(1),
    totalPlays: history.length,
    trackCounts
  };
}

/* ==========================================================================
   Settings & Blacklist (Dislikes)
   ========================================================================== */
export async function getSetting(key, defaultVal = null) {
  return new Promise((resolve) => {
    try {
      const store = getStore('settings', 'readonly');
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result ? request.result.val : defaultVal);
      };
      request.onerror = () => resolve(defaultVal);
    } catch (e) {
      resolve(defaultVal);
    }
  });
}

export async function saveSetting(key, val) {
  return new Promise((resolve, reject) => {
    const store = getStore('settings', 'readwrite');
    const request = store.put({ key, val });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getBlacklist() {
  return (await getSetting('blacklist_track_ids', [])) || [];
}

export async function isDisliked(id) {
  const list = await getBlacklist();
  return list.includes(id);
}

export async function toggleDislike(id) {
  const list = await getBlacklist();
  const idx = list.indexOf(id);
  if (idx >= 0) {
    list.splice(idx, 1);
    await saveSetting('blacklist_track_ids', list);
    return false;
  } else {
    list.push(id);
    await saveSetting('blacklist_track_ids', list);
    return true;
  }
}

export async function removeDislike(id) {
  const list = await getBlacklist();
  const filtered = list.filter((item) => item !== id);
  await saveSetting('blacklist_track_ids', filtered);
}

/* ==========================================================================
   Recap Snapshots
   ========================================================================== */
export async function getRecapSnapshot(year) {
  return new Promise((resolve) => {
    const store = getStore('recap_snapshots', 'readonly');
    const request = store.get(year);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

export async function saveRecapSnapshot(year, snapshot) {
  return new Promise((resolve, reject) => {
    const store = getStore('recap_snapshots', 'readwrite');
    const request = store.put({ year, ...snapshot, frozenAt: new Date().toISOString() });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/* ==========================================================================
   Profile Backup & Restore (JSON)
   ========================================================================== */
export async function exportBackupJSON() {
  const likes = await getAllLikes();
  const playlists = await getAllPlaylists();
  const history = await getHistory(500);
  const blacklist = await getBlacklist();
  const profileName = await getSetting('profile_name', 'Пользователь');

  const backup = {
    app: 'ouMusic',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    profile: {
      name: profileName
    },
    likes,
    playlists,
    history,
    blacklist
  };

  return JSON.stringify(backup, null, 2);
}

export async function importBackupJSON(jsonStr) {
  const data = JSON.parse(jsonStr);
  if (data.app !== 'ouMusic') {
    throw new Error('Invalid ouMusic backup format.');
  }

  if (data.profile && data.profile.name) {
    await saveSetting('profile_name', data.profile.name);
  }

  if (Array.isArray(data.likes)) {
    const store = getStore('likes', 'readwrite');
    for (const like of data.likes) {
      store.put(like);
    }
  }

  if (Array.isArray(data.playlists)) {
    const store = getStore('playlists', 'readwrite');
    for (const pl of data.playlists) {
      store.put(pl);
    }
  }

  if (Array.isArray(data.blacklist)) {
    await saveSetting('blacklist_track_ids', data.blacklist);
  }

  return true;
}
